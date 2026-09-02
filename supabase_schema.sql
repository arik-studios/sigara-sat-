-- ============================================================================
-- TOPTANCI SATIŞ VE YÖNETİM SİSTEMİ - SUPABASE VERİTABANI TABLOLARI & RLS (TAM SÜRÜM)
-- ============================================================================

-- 1. SİSTEM TAM YEDEKLERİ TABLOSU
CREATE TABLE IF NOT EXISTS public.system_backups (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    app_name TEXT,
    schema_version TEXT,
    export_date TEXT,
    export_timestamp BIGINT,
    formatted_date TEXT,
    backup_note TEXT,
    total_dealers INT DEFAULT 0,
    total_stock_cartons INT DEFAULT 0,
    active_business_date TEXT,
    payload_json JSONB NOT NULL
);

-- 2. BAYİLER & SATIŞ NOKTALARI TABLOSU (Satış ve Ara Ödeme Makbuz Geçmişiyle Birlikte)
CREATE TABLE IF NOT EXISTS public.dealers (
    dealer_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    region TEXT,
    owner TEXT,
    total_debt NUMERIC DEFAULT 0,
    balance NUMERIC DEFAULT 0,
    custom_prices JSONB DEFAULT '{}'::jsonb,
    sales_history JSONB DEFAULT '[]'::jsonb,
    payment_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MÜŞTERİ ALACAKLARI & SENETLER TABLOSU
CREATE TABLE IF NOT EXISTS public.customer_receivables (
    rec_id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone TEXT,
    total_debt NUMERIC DEFAULT 0,
    remaining_debt NUMERIC DEFAULT 0,
    due_date TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DEPO STOKLARI TABLOSU
CREATE TABLE IF NOT EXISTS public.inventory_stock (
    cigarette_id TEXT PRIMARY KEY,
    stock_cartons INT DEFAULT 0,
    stock_packets INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SİGARA KATALOĞU VE FİYAT LİSTESİ TABLOSU
CREATE TABLE IF NOT EXISTS public.cigarettes_catalog (
    cig_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    brand_group TEXT,
    buy_price NUMERIC,
    carton_price NUMERIC,
    packet_price NUMERIC,
    margin_carton NUMERIC,
    margin_packet NUMERIC,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. GÜN SONU & VARDİYA ARŞİVİ TABLOSU
CREATE TABLE IF NOT EXISTS public.daily_history (
    date_key TEXT PRIMARY KEY,
    date_str TEXT,
    total_sales NUMERIC DEFAULT 0,
    total_profit NUMERIC DEFAULT 0,
    order_count INT DEFAULT 0,
    debt_given NUMERIC DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FABRİKA ALIM İRSALİYELERİ TABLOSU
CREATE TABLE IF NOT EXISTS public.warehouse_purchases (
    purchase_id TEXT PRIMARY KEY,
    date TEXT,
    factory_name TEXT,
    cig_id TEXT,
    cig_name TEXT,
    carton_qty INT DEFAULT 0,
    unit_buy_price NUMERIC,
    total_cost NUMERIC,
    invoice_no TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TEDARİKÇİ VE FABRİKA BORÇLARI TABLOSU
CREATE TABLE IF NOT EXISTS public.payables (
    payable_id TEXT PRIMARY KEY,
    supplier_name TEXT NOT NULL,
    total_amount NUMERIC DEFAULT 0,
    remaining_amount NUMERIC DEFAULT 0,
    due_date TEXT,
    note TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- GÜVENLİK (ROW LEVEL SECURITY - RLS) & OKUMA/YAZMA İZİNLERİ
-- ============================================================================
ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cigarettes_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all for system_backups" ON public.system_backups;
CREATE POLICY "Allow public all for system_backups" ON public.system_backups FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all for dealers" ON public.dealers;
CREATE POLICY "Allow public all for dealers" ON public.dealers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all for customer_receivables" ON public.customer_receivables;
CREATE POLICY "Allow public all for customer_receivables" ON public.customer_receivables FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all for inventory_stock" ON public.inventory_stock;
CREATE POLICY "Allow public all for inventory_stock" ON public.inventory_stock FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all for cigarettes_catalog" ON public.cigarettes_catalog;
CREATE POLICY "Allow public all for cigarettes_catalog" ON public.cigarettes_catalog FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all for daily_history" ON public.daily_history;
CREATE POLICY "Allow public all for daily_history" ON public.daily_history FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all for warehouse_purchases" ON public.warehouse_purchases;
CREATE POLICY "Allow public all for warehouse_purchases" ON public.warehouse_purchases FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all for payables" ON public.payables;
CREATE POLICY "Allow public all for payables" ON public.payables FOR ALL USING (true) WITH CHECK (true);

-- 9. CANLI DESTEK & FOTOĞRAFLI MESAJLAŞMA TABLOSU
CREATE TABLE IF NOT EXISTS public.support_messages (
    id BIGSERIAL PRIMARY KEY,
    sender_role TEXT NOT NULL, -- 'admin' veya 'toptanci'
    sender_name TEXT,
    message_text TEXT,
    image_url TEXT, -- Base64 sıkıştırılmış görsel veya URL
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all for support_messages" ON public.support_messages;
CREATE POLICY "Allow public all for support_messages" ON public.support_messages FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS ticket_id TEXT DEFAULT 'TKT-GENEL';
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS ticket_subject TEXT DEFAULT 'Genel Destek';
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;

-- 10. TOPTANCILAR & CİHAZ KİLİTLİ LİSANSLAR TABLOSU (MULTI-TENANT & KAÇAK KORUMA)
CREATE TABLE IF NOT EXISTS public.tenants (
    tenant_id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    city TEXT,
    license_key TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active', -- 'active' (aktif), 'suspended' (kilitli/kaçak), 'expired'
    bound_device_id TEXT, -- Cihaz Donanım Kimliği (UUID/Android ID kilidi)
    bound_device_info TEXT, -- Cihaz Modeli / Tarayıcı
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all for tenants" ON public.tenants;
CREATE POLICY "Allow public all for tenants" ON public.tenants FOR ALL USING (true) WITH CHECK (true);

-- Tablolara toptancı ayrımı (tenant_id) ekleme
ALTER TABLE public.dealers ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default_tenant';
ALTER TABLE public.inventory_stock ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default_tenant';
ALTER TABLE public.warehouse_purchases ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default_tenant';
ALTER TABLE public.payables ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default_tenant';
ALTER TABLE public.customer_receivables ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default_tenant';
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default_tenant';
ALTER TABLE public.system_backups ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default_tenant';
ALTER TABLE public.daily_history ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default_tenant';



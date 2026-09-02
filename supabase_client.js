/**
 * ============================================================================
 * SUPABASE BULUT VERİTABANI ENTEGRASYONU & MODÜLER SINIF SERVİSLERİ (TAM SÜRÜM)
 * ============================================================================
 * Proje URL: https://hwcldjmdnfybaozgxszh.supabase.co
 * API Key: sb_publishable_lDBwN3BfaQ0FEJOPQp-VuA_4FqDRsL9
 */

const SUPABASE_CONFIG = {
  url: 'https://hwcldjmdnfybaozgxszh.supabase.co',
  key: 'sb_publishable_lDBwN3BfaQ0FEJOPQp-VuA_4FqDRsL9'
};

class SupabaseRestClient {
  constructor(config) {
    this.baseUrl = config.url.replace(/\/+$/, '') + '/rest/v1';
    this.key = config.key;
  }

  getHeaders(customHeaders = {}) {
    return {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...customHeaders
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`;
    const headers = this.getHeaders(options.headers || {});
    const config = {
      ...options,
      headers
    };

    try {
      const res = await fetch(url, config);
      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        data = text;
      }

      if (!res.ok) {
        const errMsg = (data && (data.message || data.error || data.msg)) || `HTTP ${res.status}`;
        throw new Error(errMsg);
      }
      return data;
    } catch (err) {
      console.warn(`[Supabase REST] ${endpoint} isteği başarısız:`, err.message);
      throw err;
    }
  }

  async get(table, queryParams = '') {
    const ep = queryParams ? `${table}?${queryParams}` : table;
    return this.request(ep, { method: 'GET' });
  }

  async post(table, body, upsert = false) {
    const headers = upsert ? { 'Prefer': 'resolution=merge-duplicates,return=representation' } : {};
    return this.request(table, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
  }

  async delete(table, queryParams) {
    return this.request(`${table}?${queryParams}`, { method: 'DELETE' });
  }
}

const supabaseClient = new SupabaseRestClient(SUPABASE_CONFIG);

function getActiveTenantId() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('wholesaler_active_tenant_id');
    if (saved) return saved;
  }
  if (typeof window !== 'undefined' && window.CURRENT_TENANT_ID) {
    return window.CURRENT_TENANT_ID;
  }
  return 'default_tenant';
}

/* ============================================================================
   1. TAM SİSTEM YEDEK SERVİSİ (SystemBackupService)
   ============================================================================ */
class SystemBackupService {
  static async uploadBackup(payload) {
    const tenantId = getActiveTenantId();
    const record = {
      tenant_id: tenantId,
      app_name: payload.app || "Toptan Satis Yonetim Paneli",
      schema_version: payload.schemaVersion || "6.0",
      export_date: payload.exportDate || new Date().toISOString(),
      export_timestamp: payload.exportTimestamp || Date.now(),
      formatted_date: payload.formattedDate || new Date().toLocaleString('tr-TR'),
      backup_note: payload.backupNote || "Bulut Sistem Yedeği",
      total_dealers: payload.metadata ? payload.metadata.totalDealers : (payload.data && payload.data.dealersData ? payload.data.dealersData.length : 0),
      total_stock_cartons: payload.metadata ? payload.metadata.totalStockCartons : 0,
      active_business_date: payload.metadata ? payload.metadata.activeBusinessDate : '',
      payload_json: payload
    };

    return await supabaseClient.post('system_backups', record);
  }

  static async fetchLatestBackup() {
    const tenantId = getActiveTenantId();
    const result = await supabaseClient.get('system_backups', `tenant_id=eq.${encodeURIComponent(tenantId)}&order=export_timestamp.desc&limit=1`);
    if (Array.isArray(result) && result.length > 0) {
      return result[0].payload_json;
    }
    return null;
  }

  static async fetchAllBackups() {
    const tenantId = getActiveTenantId();
    return await supabaseClient.get('system_backups', `tenant_id=eq.${encodeURIComponent(tenantId)}&select=id,created_at,formatted_date,backup_note,total_dealers,total_stock_cartons,export_timestamp&order=export_timestamp.desc&limit=50`);
  }
}

/* ============================================================================
   2. BAYİLER & SATIŞ NOKTALARI SERVİSİ (DealersService)
   ============================================================================ */
class DealersService {
  static async syncAllDealers(dealersList) {
    if (!Array.isArray(dealersList) || dealersList.length === 0) return [];
    
    const tenantId = getActiveTenantId();
    const records = dealersList.map(d => ({
      tenant_id: tenantId,
      dealer_id: d.id,
      name: d.name || '',
      phone: d.phone || '',
      region: d.region || '',
      owner: d.owner || '',
      total_debt: typeof d.totalDebt === 'number' ? d.totalDebt : 0,
      balance: typeof d.balance === 'number' ? d.balance : 0,
      custom_prices: d.customPrices || {},
      sales_history: d.sales || [],
      payment_history: d.payments || d.paymentHistory || [],
      updated_at: new Date().toISOString()
    }));

    return await supabaseClient.post('dealers', records, true);
  }

  static async fetchAllDealers() {
    const tenantId = getActiveTenantId();
    const rows = await supabaseClient.get('dealers', `tenant_id=eq.${encodeURIComponent(tenantId)}&select=*&order=name.asc`);
    if (!Array.isArray(rows)) return [];
    return rows.map(r => ({
      id: r.dealer_id,
      name: r.name,
      phone: r.phone,
      region: r.region,
      owner: r.owner,
      totalDebt: r.total_debt,
      balance: r.balance,
      customPrices: r.custom_prices || {},
      sales: r.sales_history || [],
      payments: r.payment_history || []
    }));
  }
}

/* ============================================================================
   3. MÜŞTERİ ALACAKLARI & SENETLER SERVİSİ (CustomerReceivablesService)
   ============================================================================ */
class CustomerReceivablesService {
  static async syncReceivables(receivablesList) {
    if (!Array.isArray(receivablesList) || receivablesList.length === 0) return [];

    const tenantId = getActiveTenantId();
    const records = receivablesList.map(r => ({
      tenant_id: tenantId,
      rec_id: r.id || `REC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      customer_name: r.customerName || r.name || '',
      phone: r.phone || '',
      total_debt: r.totalDebt || r.total || 0,
      remaining_debt: typeof r.remainingDebt === 'number' ? r.remainingDebt : (r.remaining || r.totalDebt || 0),
      due_date: r.dueDate || '',
      notes: r.notes || r.note || '',
      updated_at: new Date().toISOString()
    }));

    return await supabaseClient.post('customer_receivables', records, true);
  }

  static async fetchReceivables() {
    const tenantId = getActiveTenantId();
    const rows = await supabaseClient.get('customer_receivables', `tenant_id=eq.${encodeURIComponent(tenantId)}&select=*&order=due_date.asc`);
    if (!Array.isArray(rows)) return [];
    return rows.map(r => ({
      id: r.rec_id,
      customerName: r.customer_name,
      phone: r.phone,
      totalDebt: r.total_debt,
      remainingDebt: r.remaining_debt,
      dueDate: r.due_date,
      notes: r.notes
    }));
  }
}

/* ============================================================================
   4. TEDARİKÇİ & FABRİKA BORÇLARI SERVİSİ (PayablesService)
   ============================================================================ */
class PayablesService {
  static async syncPayables(payablesList) {
    if (!Array.isArray(payablesList) || payablesList.length === 0) return [];
    const tenantId = getActiveTenantId();
    const records = payablesList.map(p => ({
      tenant_id: tenantId,
      payable_id: p.id || `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      supplier_name: p.supplierName || p.name || '',
      total_amount: p.totalAmount || p.amount || 0,
      remaining_amount: typeof p.remainingAmount === 'number' ? p.remainingAmount : (p.remaining || p.totalAmount || 0),
      due_date: p.dueDate || '',
      note: p.note || '',
      updated_at: new Date().toISOString()
    }));
    return await supabaseClient.post('payables', records, true);
  }

  static async fetchPayables() {
    const tenantId = getActiveTenantId();
    const rows = await supabaseClient.get('payables', `tenant_id=eq.${encodeURIComponent(tenantId)}&select=*&order=due_date.asc`);
    if (!Array.isArray(rows)) return [];
    return rows.map(r => ({
      id: r.payable_id,
      supplierName: r.supplier_name,
      totalAmount: r.total_amount,
      remainingAmount: r.remaining_amount,
      dueDate: r.due_date,
      note: r.note
    }));
  }
}

/* ============================================================================
   5. FABRİKA ALIM İRSALİYELERİ SERVİSİ (WarehousePurchasesService)
   ============================================================================ */
class WarehousePurchasesService {
  static async syncPurchases(purchasesList) {
    if (!Array.isArray(purchasesList) || purchasesList.length === 0) return [];
    const tenantId = getActiveTenantId();
    const records = purchasesList.map(p => ({
      tenant_id: tenantId,
      purchase_id: p.id || `PUR-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: p.date || new Date().toISOString(),
      factory_name: p.factoryName || p.supplier || 'Ana Fabrika',
      cig_id: p.cigId || '',
      cig_name: p.cigName || '',
      carton_qty: p.cartonQty || 0,
      unit_buy_price: p.unitBuyPrice || 0,
      total_cost: p.totalCost || 0,
      invoice_no: p.invoiceNo || '',
      created_at: new Date().toISOString()
    }));
    return await supabaseClient.post('warehouse_purchases', records, true);
  }

  static async fetchPurchases() {
    const tenantId = getActiveTenantId();
    const rows = await supabaseClient.get('warehouse_purchases', `tenant_id=eq.${encodeURIComponent(tenantId)}&select=*&order=date.desc`);
    if (!Array.isArray(rows)) return [];
    return rows.map(r => ({
      id: r.purchase_id,
      date: r.date,
      factoryName: r.factory_name,
      cigId: r.cig_id,
      cigName: r.cig_name,
      cartonQty: r.carton_qty,
      unitBuyPrice: r.unit_buy_price,
      totalCost: r.total_cost,
      invoiceNo: r.invoice_no
    }));
  }
}

/* ============================================================================
   6. DEPO STOK SERVİSİ (InventoryStockService)
   ============================================================================ */
class InventoryStockService {
  static async syncStock(stockMap) {
    const tenantId = getActiveTenantId();
    const records = Object.entries(stockMap || {}).map(([cigId, val]) => {
      let cartons = 0;
      let packets = 0;
      if (typeof val === 'number') {
        cartons = val;
      } else if (val && typeof val === 'object') {
        cartons = val.stockCartons || 0;
        packets = val.stockPackets || 0;
      }
      return {
        tenant_id: tenantId,
        cigarette_id: cigId,
        stock_cartons: cartons,
        stock_packets: packets,
        updated_at: new Date().toISOString()
      };
    });

    if (records.length === 0) return [];
    return await supabaseClient.post('inventory_stock', records, true);
  }

  static async fetchStock() {
    const tenantId = getActiveTenantId();
    const rows = await supabaseClient.get('inventory_stock', `tenant_id=eq.${encodeURIComponent(tenantId)}&select=*`);
    if (!Array.isArray(rows)) return {};
    const map = {};
    rows.forEach(r => {
      map[r.cigarette_id] = {
        stockCartons: r.stock_cartons || 0,
        stockPackets: r.stock_packets || 0
      };
    });
    return map;
  }
}

/* ============================================================================
   7. SİGARA KATALOĞU VE FİYAT SERVİSİ (CigarettesCatalogService)
   ============================================================================ */
class CigarettesCatalogService {
  static async syncCatalog(cigsList) {
    if (!Array.isArray(cigsList) || cigsList.length === 0) return [];
    const records = cigsList.map(c => ({
      cig_id: c.id,
      name: c.name,
      brand: c.brand,
      brand_group: c.group,
      buy_price: c.buyPrice,
      carton_price: c.cartonPrice,
      packet_price: c.packetPrice,
      margin_carton: c.marginCarton,
      margin_packet: c.marginPacket,
      updated_at: new Date().toISOString()
    }));
    return await supabaseClient.post('cigarettes_catalog', records, true);
  }

  static async fetchCatalog() {
    const rows = await supabaseClient.get('cigarettes_catalog', 'select=*&order=brand.asc');
    if (!Array.isArray(rows) || rows.length === 0) return [];
    return rows.map(r => ({
      id: r.cig_id,
      name: r.name,
      brand: r.brand,
      group: r.brand_group,
      buyPrice: r.buy_price,
      cartonPrice: r.carton_price,
      packetPrice: r.packet_price,
      marginCarton: r.margin_carton,
      marginPacket: r.margin_packet
    }));
  }
}

/* ============================================================================
   8. GÜN SONU & VARDİYA ARŞİVİ SERVİSİ (DailyHistoryService)
   ============================================================================ */
class DailyHistoryService {
  static async syncDailyHistory(historyMap) {
    const tenantId = getActiveTenantId();
    const records = Object.entries(historyMap || {}).map(([dateKey, val]) => ({
      tenant_id: tenantId,
      date_key: dateKey,
      date_str: val.dateStr || dateKey,
      total_sales: val.sales || 0,
      total_profit: val.profit || 0,
      order_count: val.count || 0,
      debt_given: val.debtGiven || 0,
      updated_at: new Date().toISOString()
    }));

    if (records.length === 0) return [];
    return await supabaseClient.post('daily_history', records, true);
  }

  static async fetchDailyHistory() {
    const tenantId = getActiveTenantId();
    const rows = await supabaseClient.get('daily_history', `tenant_id=eq.${encodeURIComponent(tenantId)}&select=*&order=date_key.desc`);
    if (!Array.isArray(rows)) return {};
    const map = {};
    rows.forEach(r => {
      map[r.date_key] = {
        dateStr: r.date_str,
        sales: r.total_sales,
        profit: r.total_profit,
        count: r.order_count,
        debtGiven: r.debt_given
      };
    });
    return map;
  }
}

// Global Context Bağlantıları
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.supabaseClient = supabaseClient;
window.SystemBackupService = SystemBackupService;
window.DealersService = DealersService;
window.CustomerReceivablesService = CustomerReceivablesService;
window.PayablesService = PayablesService;
window.WarehousePurchasesService = WarehousePurchasesService;
window.InventoryStockService = InventoryStockService;
window.CigarettesCatalogService = CigarettesCatalogService;
window.DailyHistoryService = DailyHistoryService;

/* ============================================================================
   OTOMATİK ÇIKIŞ SENKRONİZASYONU (Uygulamadan Çıkıldığında Buluta Yedekleme)
   ============================================================================ */
let isAutoSyncing = false;
let lastAutoSyncTime = 0;

window.triggerAutoCloudSyncOnExit = async function() {
  const now = Date.now();
  // Minimum 10 saniye aralıkla çalışarak gereksiz yoğunluğu engelle
  if (isAutoSyncing || (now - lastAutoSyncTime < 10000)) return;
  
  try {
    isAutoSyncing = true;
    lastAutoSyncTime = now;

    if (typeof createSystemBackupPayload !== 'function') return;
    const payload = createSystemBackupPayload("Çıkış Anında Otomatik Bulut Yedeği");

    // 1. Tam Sistem Yedeği Gönder
    await SystemBackupService.uploadBackup(payload);

    // 2. Temel Tabloları Güncelle
    if (typeof dealersData !== 'undefined' && Array.isArray(dealersData) && dealersData.length > 0) {
      await DealersService.syncAllDealers(dealersData);
    }
    if (typeof inventoryStock !== 'undefined' && Object.keys(inventoryStock).length > 0) {
      await InventoryStockService.syncStock(inventoryStock);
    }
    if (typeof dailyHistoryStore !== 'undefined' && Object.keys(dailyHistoryStore).length > 0) {
      await DailyHistoryService.syncDailyHistory(dailyHistoryStore);
    }

    console.log("[Supabase Auto-Sync] Çıkış anında tüm veriler buluta başarıyla kaydedildi.");
  } catch (err) {
    console.warn("[Supabase Auto-Sync] Arka plan çıkış yedekleme uyarısı:", err.message);
  } finally {
    isAutoSyncing = false;
  }
};

// Tarayıcı / WebView Kapanma ve Arka Plana Geçme Olayları
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    window.triggerAutoCloudSyncOnExit();
  }
});

window.addEventListener('pagehide', () => {
  window.triggerAutoCloudSyncOnExit();
});

window.addEventListener('beforeunload', () => {
  window.triggerAutoCloudSyncOnExit();
});


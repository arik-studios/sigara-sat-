/**
 * ============================================================================
 * TOPTANCI YÖNETİCİ & ADMİN PANELİ - MOTOR KODU (admin.js)
 * Supabase REST API ile Gerçek Zamanlı Çift Yönlü İletişim & Canlı Yönetim
 * ============================================================================
 */

const SUPABASE_CONFIG = {
  url: 'https://hwcldjmdnfybaozgxszh.supabase.co',
  key: 'sb_publishable_lDBwN3BfaQ0FEJOPQp-VuA_4FqDRsL9'
};

class SupabaseService {
  constructor(cfg) {
    this.baseUrl = cfg.url.replace(/\/+$/, '') + '/rest/v1';
    this.key = cfg.key;
  }

  getHeaders(custom = {}) {
    return {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...custom
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`;
    const headers = this.getHeaders(options.headers || {});
    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text;
    }
    if (!res.ok) {
      const msg = (data && (data.message || data.error || data.msg)) || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  async get(table, query = '') {
    return this.request(query ? `${table}?${query}` : table, { method: 'GET' });
  }

  async post(table, body, upsert = false) {
    const headers = upsert ? { 'Prefer': 'resolution=merge-duplicates,return=representation' } : {};
    return this.request(table, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
  }

  async patch(table, query, body) {
    return this.request(`${table}?${query}`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  async delete(table, query) {
    return this.request(`${table}?${query}`, { method: 'DELETE' });
  }
}

const db = new SupabaseService(SUPABASE_CONFIG);

// GLOBAL UYGULAMA DURUMU (STATE)
let AppState = {
  dealers: [],
  purchases: [],
  stocks: {},
  catalog: [],
  customerReceivables: [],
  payables: [],
  dailyHistory: {},
  backups: [],
  messages: [],
  tenants: [],
  selectedTenantId: 'ALL',
  pendingImageBase64: null,
  isLoading: false,
  activeView: 'view-overview'
};

// ============================================================================
// BAŞLATMA (INIT) & ETKİNLİK DİNLEYİCİLERİ
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupModalDismissHandlers();
  setupSearchAndFilters();
  setupModalForms();
  setupSupportChat();
  setupTenantLicenseEvents();
  setupGlobalTenantSelector();

  const refreshBtn = document.getElementById('btn-refresh-all');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => loadAllDataFromSupabase(true));
  }

  // İlk veri çekme
  loadAllDataFromSupabase();

  // Her 10 saniyede bir yeni mesajları arka planda kontrol et
  setInterval(() => {
    loadSupportMessages(false);
  }, 10000);
});

// ============================================================================
// VERİ ÇEKME MOTORU (TÜM TABLOLARI SUPABASE'DEN ÇEK)
// ============================================================================
async function loadAllDataFromSupabase(isManualRefresh = false) {
  const refreshBtn = document.getElementById('btn-refresh-all');
  if (refreshBtn) refreshBtn.classList.add('spinning');
  AppState.isLoading = true;

  try {
    const [
      dealersRes,
      purchasesRes,
      stocksRes,
      catalogRes,
      receivablesRes,
      payablesRes,
      backupsRes,
      messagesRes,
      tenantsRes
    ] = await Promise.all([
      db.get('dealers', 'order=name.asc').catch(() => []),
      db.get('warehouse_purchases', 'order=date.desc').catch(() => []),
      db.get('inventory_stock', '').catch(() => []),
      db.get('cigarettes_catalog', 'order=brand.asc').catch(() => []),
      db.get('customer_receivables', 'order=due_date.asc').catch(() => []),
      db.get('payables', 'order=due_date.asc').catch(() => []),
      db.get('system_backups', 'order=export_timestamp.desc&limit=25').catch(() => []),
      db.get('support_messages', 'order=created_at.asc&limit=100').catch(() => []),
      db.get('tenants', 'order=company_name.asc').catch(() => [])
    ]);

    AppState.dealers = Array.isArray(dealersRes) ? dealersRes : [];
    AppState.purchases = Array.isArray(purchasesRes) ? purchasesRes : [];
    AppState.catalog = Array.isArray(catalogRes) ? catalogRes : [];
    AppState.customerReceivables = Array.isArray(receivablesRes) ? receivablesRes : [];
    AppState.payables = Array.isArray(payablesRes) ? payablesRes : [];
    AppState.backups = Array.isArray(backupsRes) ? backupsRes : [];
    AppState.messages = Array.isArray(messagesRes) ? messagesRes : [];
    AppState.tenants = Array.isArray(tenantsRes) ? tenantsRes : [];

    // Toptancı Seçiciyi Güncelle
    updateGlobalTenantSelectorOptions();

    // Stok Haritası Oluştur
    AppState.stocks = {};
    if (Array.isArray(stocksRes)) {
      stocksRes.forEach(s => {
        AppState.stocks[s.cigarette_id] = {
          cartons: s.stock_cartons || 0,
          packets: s.stock_packets || 0
        };
      });
    }

    // Arayüzü Güncelle
    renderAllViews();
    updateBadges();

    if (isManualRefresh) {
      showToast("Tüm veriler Supabase bulutundan başarıyla tazelendi!");
    }
  } catch (err) {
    console.error("Supabase veri çekme hatası:", err);
    showToast(`Veri yükleme hatası: ${err.message}`, true);
  } finally {
    AppState.isLoading = false;
    if (refreshBtn) refreshBtn.classList.remove('spinning');
  }
}

// ============================================================================
// RENDER MOTORU (TÜM SAYFALARI ÇİZ)
// ============================================================================
function renderAllViews() {
  renderOverviewKPIs();
  renderOverviewRecentTables();
  renderTenantsPage();
  renderDealersPage();
  renderSalesPage();
  renderPurchasesPage();
  renderInventoryPage();
  renderFinancePage();
  renderCatalogPage();
  renderBackupsPage();
  renderSupportMessages();
}

function updateBadges() {
  const tCount = document.getElementById('badge-tenants-count');
  const dCount = document.getElementById('badge-dealers-count');
  const sCount = document.getElementById('badge-sales-count');
  const pCount = document.getElementById('badge-purchases-count');
  const stockCount = document.getElementById('badge-stock-count');
  const fCount = document.getElementById('badge-finance-count');
  const cCount = document.getElementById('badge-catalog-count');
  const bCount = document.getElementById('badge-backups-count');
  const supCount = document.getElementById('badge-support-count');

  if (tCount) tCount.textContent = AppState.tenants.length;
  if (dCount) dCount.textContent = getTenantFilteredList(AppState.dealers).length;
  
  // Toplam satış sayısı (Seçili toptancıya göre)
  let totalSalesCount = 0;
  getTenantFilteredList(AppState.dealers).forEach(d => {
    if (Array.isArray(d.sales_history)) totalSalesCount += d.sales_history.length;
  });
  if (sCount) sCount.textContent = totalSalesCount;

  if (pCount) pCount.textContent = getTenantFilteredList(AppState.purchases).length;
  if (stockCount) stockCount.textContent = Object.keys(AppState.stocks).length;
  if (fCount) fCount.textContent = getTenantFilteredList(AppState.customerReceivables).length + getTenantFilteredList(AppState.payables).length;
  if (cCount) cCount.textContent = AppState.catalog.length;
  if (bCount) bCount.textContent = AppState.backups.length;

  // Toptancıdan gelen okunmamış mesaj sayısı
  const filteredMsgs = getTenantFilteredList(AppState.messages);
  const unreadCount = filteredMsgs.filter(m => m.sender_role === 'toptanci' && !m.is_read).length;
  if (supCount) {
    supCount.textContent = unreadCount > 0 ? `${unreadCount} Yeni` : filteredMsgs.length;
    supCount.style.background = unreadCount > 0 ? '#f43f5e' : 'rgba(255,255,255,0.06)';
    supCount.style.color = '#fff';
  }
}

// Global Toptancı Filtresi Yardımcısı
function getTenantFilteredList(list) {
  if (!Array.isArray(list)) return [];
  if (!AppState.selectedTenantId || AppState.selectedTenantId === 'ALL') {
    return list;
  }
  return list.filter(item => {
    return item.tenant_id === AppState.selectedTenantId || !item.tenant_id || item.tenant_id === 'default_tenant';
  });
}

function setupGlobalTenantSelector() {
  const sel = document.getElementById('global-tenant-selector');
  if (!sel) return;

  sel.onchange = () => {
    AppState.selectedTenantId = sel.value;
    renderAllViews();
    updateBadges();

    if (AppState.selectedTenantId === 'ALL') {
      showToast("Tüm toptancıların konsolide verileri görüntüleniyor.");
    } else {
      const t = AppState.tenants.find(x => x.tenant_id === AppState.selectedTenantId);
      showToast(`Filtre uygulandı: ${t ? t.company_name : AppState.selectedTenantId}`);
    }
  };
}

function updateGlobalTenantSelectorOptions() {
  const sel = document.getElementById('global-tenant-selector');
  if (!sel) return;

  const currentVal = AppState.selectedTenantId || 'ALL';
  let html = `<option value="ALL">🌐 Tüm Toptancılar (Konsolide)</option>`;

  AppState.tenants.forEach(t => {
    const isSuspended = t.status === 'suspended';
    const statusMark = isSuspended ? ' [🔒 KİLİTLİ]' : '';
    html += `<option value="${t.tenant_id}" ${t.tenant_id === currentVal ? 'selected' : ''}>🏢 ${t.company_name} (${t.city || 'Şehir Yok'})${statusMark}</option>`;
  });

  sel.innerHTML = html;
  sel.value = currentVal;
}

// ============================================================================
// 1. GENEL BAKIŞ (OVERVIEW & KPIS)
// ============================================================================
function renderOverviewKPIs() {
  const kpiDealers = document.getElementById('kpi-dealers-count');
  const kpiRecVal = document.getElementById('kpi-receivables-val');
  const kpiStockVal = document.getElementById('kpi-stock-val');
  const kpiStockSub = document.getElementById('kpi-stock-sub');
  const kpiPayVal = document.getElementById('kpi-payables-val');
  const kpiSalesTotal = document.getElementById('kpi-sales-total');
  const kpiProfitSub = document.getElementById('kpi-profit-sub');

  const filteredDealers = getTenantFilteredList(AppState.dealers);
  const filteredCustomerRec = getTenantFilteredList(AppState.customerReceivables);
  const filteredPayables = getTenantFilteredList(AppState.payables);

  if (kpiDealers) kpiDealers.textContent = filteredDealers.length;

  // Alacaklar
  let totalReceivables = 0;
  filteredDealers.forEach(d => totalReceivables += (Number(d.total_debt) || 0));
  filteredCustomerRec.forEach(c => totalReceivables += (Number(c.remaining_debt) || Number(c.total_debt) || 0));
  if (kpiRecVal) kpiRecVal.textContent = `₺ ${Math.round(totalReceivables).toLocaleString('tr-TR')}`;

  // Stoklar
  let totalCartons = 0;
  let negativeCartons = 0;
  Object.values(AppState.stocks).forEach(s => {
    const c = s.cartons || 0;
    totalCartons += c;
    if (c < 0) negativeCartons += Math.abs(c);
  });
  if (kpiStockVal) kpiStockVal.textContent = `${totalCartons.toLocaleString('tr-TR')} Karton`;
  if (kpiStockSub) {
    kpiStockSub.innerHTML = negativeCartons > 0 
      ? `<span style="color:#fb7185; font-weight:800;">Eksi Stok Açığı: -${negativeCartons} Karton</span>`
      : `Eksi Stok Açığı Yok`;
  }

  // Borçlar
  let totalPayables = 0;
  filteredPayables.forEach(p => totalPayables += (Number(p.remaining_amount) || Number(p.total_amount) || 0));
  if (kpiPayVal) kpiPayVal.textContent = `₺ ${Math.round(totalPayables).toLocaleString('tr-TR')}`;

  // Satışlar & Kâr
  let grandSales = 0;
  let grandProfit = 0;
  filteredDealers.forEach(d => {
    if (Array.isArray(d.sales_history)) {
      d.sales_history.forEach(s => {
        grandSales += (Number(s.total) || Number(s.totalAmount) || 0);
        grandProfit += (Number(s.netProfit) || 0);
      });
    }
  });
  if (kpiSalesTotal) kpiSalesTotal.textContent = `₺ ${Math.round(grandSales).toLocaleString('tr-TR')}`;
  if (kpiProfitSub) kpiProfitSub.textContent = `Toplam Kâr: ₺ ${Math.round(grandProfit).toLocaleString('tr-TR')}`;
}

function renderOverviewRecentTables() {
  const salesTbody = document.getElementById('overview-recent-sales-tbody');
  const purTbody = document.getElementById('overview-recent-purchases-tbody');

  // En son 6 satışı topla (Filtreli)
  const allSales = [];
  const filteredDealers = getTenantFilteredList(AppState.dealers);
  filteredDealers.forEach(d => {
    if (Array.isArray(d.sales_history)) {
      d.sales_history.forEach(s => {
        allSales.push({ ...s, dealerName: d.name, dealerId: d.dealer_id });
      });
    }
  });
  allSales.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  if (salesTbody) {
    if (allSales.length === 0) {
      salesTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:20px;">Henüz satış kaydı bulunamadı.</td></tr>`;
    } else {
      salesTbody.innerHTML = allSales.slice(0, 6).map(s => `
        <tr>
          <td><strong style="color:#fff;">${s.receipt || 'Fiş'}</strong><br><span style="font-size:0.7rem; color:#94a3b8;">${s.date || ''}</span></td>
          <td>${s.dealerName}</td>
          <td style="text-align:right;" class="mono-val">₺ ${(Number(s.total) || 0).toLocaleString('tr-TR')}</td>
          <td style="text-align:right;" class="mono-val" style="color:${(s.debt || 0) > 0 ? '#fb7185' : '#34d399'};">
            ${(s.debt || 0) > 0 ? `₺ ${(Number(s.debt) || 0).toLocaleString('tr-TR')}` : '<span class="badge badge-emerald">Ödendi</span>'}
          </td>
          <td style="text-align:center;">
            <button class="btn-tbl btn-tbl-primary" onclick="viewSaleDetailsModal('${encodeURIComponent(JSON.stringify(s))}')">İncele</button>
          </td>
        </tr>
      `).join('');
    }
  }

  // En son 5 alım
  const filteredPurchases = getTenantFilteredList(AppState.purchases);
  if (purTbody) {
    if (filteredPurchases.length === 0) {
      purTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:20px;">Henüz alım kaydı bulunamadı.</td></tr>`;
    } else {
      purTbody.innerHTML = filteredPurchases.slice(0, 5).map(p => `
        <tr>
          <td>${p.date || 'Tarih Yok'}</td>
          <td><strong>${p.factory_name || 'Ana Dağıtım'}</strong></td>
          <td style="text-align:center;" class="mono-val">${p.carton_qty || 0} Karton</td>
          <td style="text-align:right;" class="mono-val" style="color:#34d399;">₺ ${(Number(p.total_cost) || 0).toLocaleString('tr-TR')}</td>
          <td style="text-align:center;">
            <span class="badge badge-subtle">${p.invoice_no || 'IRS'}</span>
          </td>
        </tr>
      `).join('');
    }
  }
}

// ============================================================================
// 1.5. TOPTANCILAR & LİSANS YÖNETİMİ SAYFASI (MULTI-TENANT)
// ============================================================================
function renderTenantsPage() {
  const tbody = document.getElementById('tenants-page-tbody');
  const searchInp = document.getElementById('input-search-tenants');
  const filterSelect = document.getElementById('select-filter-tenant-status');

  // KPI Kartları
  const kpiCount = document.getElementById('kpi-tenants-count');
  const kpiActive = document.getElementById('kpi-tenants-active');
  const kpiSuspended = document.getElementById('kpi-tenants-suspended');
  const kpiBound = document.getElementById('kpi-tenants-bound');

  if (kpiCount) kpiCount.textContent = AppState.tenants.length;
  if (kpiActive) kpiActive.textContent = AppState.tenants.filter(t => t.status === 'active').length;
  if (kpiSuspended) kpiSuspended.textContent = AppState.tenants.filter(t => t.status === 'suspended').length;
  if (kpiBound) kpiBound.textContent = AppState.tenants.filter(t => !!t.bound_device_id).length;

  if (!tbody) return;

  const query = (searchInp ? searchInp.value : '').toLowerCase().trim();
  const filter = filterSelect ? filterSelect.value : 'all';

  let list = [...AppState.tenants];
  if (query) {
    list = list.filter(t => 
      (t.company_name || '').toLowerCase().includes(query) ||
      (t.contact_person || '').toLowerCase().includes(query) ||
      (t.phone || '').toLowerCase().includes(query) ||
      (t.city || '').toLowerCase().includes(query) ||
      (t.license_key || '').toLowerCase().includes(query)
    );
  }

  if (filter === 'active') {
    list = list.filter(t => t.status === 'active');
  } else if (filter === 'suspended') {
    list = list.filter(t => t.status === 'suspended');
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b;">Kayıtlı toptancı lisansı bulunamadı. "+ Yeni Toptancı Lisansı Tanımla" butonundan ekleyebilirsiniz.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(t => {
    const isSuspended = t.status === 'suspended';
    const isBound = !!t.bound_device_id;
    
    // Bu toptancıya ait bayi sayısı
    const dealerCount = AppState.dealers.filter(d => d.tenant_id === t.tenant_id).length;

    let statusBadge = '';
    if (t.status === 'active') {
      statusBadge = `<span class="badge badge-emerald">● Aktif (Sahada)</span>`;
    } else if (t.status === 'suspended') {
      statusBadge = `<span class="badge badge-rose">● Kilitli / Askıda</span>`;
    } else {
      statusBadge = `<span class="badge badge-subtle">● Süresi Doldu</span>`;
    }

    const deviceBadge = isBound
      ? `<span class="badge badge-indigo" title="${t.bound_device_id}">📱 Kilitli (${t.bound_device_info || 'Cihaz'})</span>`
      : `<span class="badge badge-subtle">Serbest (İlk Giriş Bekliyor)</span>`;

    return `
      <tr style="${isSuspended ? 'background:rgba(244,63,94,0.04);' : ''}">
        <td>
          <strong style="color:#fff; font-size:0.92rem;">${t.company_name}</strong><br>
          <span style="font-size:0.72rem; color:#94a3b8;">${t.city || 'Bölge Belirtilmedi'}</span>
        </td>
        <td>
          <span style="color:#e2e8f0;">${t.contact_person || '-'}</span><br>
          <a href="tel:${t.phone}" style="color:#818cf8; text-decoration:none; font-size:0.75rem;">${t.phone || '-'}</a>
        </td>
        <td>
          <span class="mono-val badge badge-indigo" style="font-size:0.8rem; letter-spacing:0.5px;">${t.license_key}</span>
        </td>
        <td>${deviceBadge}</td>
        <td style="text-align:center;">${statusBadge}</td>
        <td style="text-align:center;">
          <span style="font-size:0.75rem; color:#cbd5e1; font-weight:700;">${dealerCount} Bayi</span>
        </td>
        <td style="text-align:right; white-space:nowrap;">
          <button class="btn-tbl btn-tbl-primary" onclick="selectAndInspectTenant('${t.tenant_id}')" title="Bu toptancının verilerine geç">🔍 İncele</button>
          ${!isSuspended 
            ? `<button class="btn-tbl btn-tbl-rose" onclick="toggleTenantStatus('${t.tenant_id}', 'suspended')" title="Toptancının uygulamasını kilitle">🔒 Kilitle</button>` 
            : `<button class="btn-tbl btn-tbl-emerald" onclick="toggleTenantStatus('${t.tenant_id}', 'active')" title="Kilidi aç">🔓 Aç</button>`}
          ${isBound ? `<button class="btn-tbl btn-tbl-primary" onclick="resetTenantDevice('${t.tenant_id}')" title="Cihaz kilidini sıfırla">🔑 Cihazı Sıfırla</button>` : ''}
          <button class="btn-tbl btn-tbl-primary" onclick="openTenantEditModal('${t.tenant_id}')" title="Düzenle">✏️</button>
          <button class="btn-tbl btn-tbl-rose" onclick="deleteTenantRecord('${t.tenant_id}')" title="Sil">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================================================
// 2. SATIŞ NOKTALARI & BAYİLER SAYFASI
// ============================================================================
function renderDealersPage() {
  const tbody = document.getElementById('dealers-page-tbody');
  const searchInp = document.getElementById('input-search-dealers');
  const filterSelect = document.getElementById('select-filter-dealer-debt');
  if (!tbody) return;

  const query = (searchInp ? searchInp.value : '').toLowerCase().trim();
  const filter = filterSelect ? filterSelect.value : 'all';

  let list = getTenantFilteredList(AppState.dealers);

  if (query) {
    list = list.filter(d => (d.name || '').toLowerCase().includes(query) || (d.owner || '').toLowerCase().includes(query) || (d.region || '').toLowerCase().includes(query));
  }

  if (filter === 'debt') {
    list = list.filter(d => (Number(d.total_debt) || 0) > 0);
  } else if (filter === 'zero') {
    list = list.filter(d => (Number(d.total_debt) || 0) <= 0);
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b;">Kriterlere uygun bayi bulunamadı.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(d => {
    const debt = Number(d.total_debt) || 0;
    const badgeHtml = debt > 0
      ? `<span class="badge badge-rose">Vadeli Borçlu</span>`
      : `<span class="badge badge-emerald">Borçsuz</span>`;

    return `
      <tr>
        <td><strong style="color:#fff; font-size:0.9rem;">${d.name}</strong></td>
        <td>${d.owner || '-'}</td>
        <td><a href="tel:${d.phone}" style="color:#818cf8; text-decoration:none;">${d.phone || 'Belirtilmedi'}</a></td>
        <td>${d.region || '-'}</td>
        <td style="text-align:right;" class="mono-val" style="color:${debt > 0 ? '#fb7185' : '#34d399'};">
          ₺ ${debt.toLocaleString('tr-TR')}
        </td>
        <td>${badgeHtml}</td>
        <td style="text-align:right;">
          <button class="btn-tbl btn-tbl-primary" onclick="openDealerEditModal('${d.dealer_id}')">Düzenle / İncele</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================================================
// 3. SATIŞLAR & SİPARİŞLER SAYFASI
// ============================================================================
function renderSalesPage() {
  const tbody = document.getElementById('sales-page-tbody');
  const searchInp = document.getElementById('input-search-sales');
  const filterSelect = document.getElementById('select-filter-sales-status');
  if (!tbody) return;

  const query = (searchInp ? searchInp.value : '').toLowerCase().trim();
  const filter = filterSelect ? filterSelect.value : 'all';

  const allSales = [];
  const filteredDealers = getTenantFilteredList(AppState.dealers);
  filteredDealers.forEach(d => {
    if (Array.isArray(d.sales_history)) {
      d.sales_history.forEach(s => {
        allSales.push({ ...s, dealerName: d.name, dealerId: d.dealer_id });
      });
    }
  });

  allSales.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  let list = allSales;
  if (query) {
    list = list.filter(s => (s.receipt || '').toLowerCase().includes(query) || (s.dealerName || '').toLowerCase().includes(query));
  }
  if (filter === 'debt') {
    list = list.filter(s => (Number(s.debt) || 0) > 0);
  } else if (filter === 'paid') {
    list = list.filter(s => (Number(s.debt) || 0) <= 0);
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#64748b;">Satış kaydı bulunamadı.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(s => `
    <tr>
      <td><span class="badge badge-indigo">${s.receipt || 'Fiş'}</span></td>
      <td>${s.date || ''}</td>
      <td><strong>${s.dealerName}</strong></td>
      <td style="max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${s.items || ''}">${s.items || 'Sigara Kalemleri'}</td>
      <td style="text-align:right;" class="mono-val">₺ ${(Number(s.total) || 0).toLocaleString('tr-TR')}</td>
      <td style="text-align:right;" class="mono-val" style="color:#34d399;">₺ ${(Number(s.paid) || Number(s.paidAmount) || 0).toLocaleString('tr-TR')}</td>
      <td style="text-align:right;" class="mono-val" style="color:${(s.debt || 0) > 0 ? '#fb7185' : '#34d399'};">
        ${(s.debt || 0) > 0 ? `₺ ${(Number(s.debt) || 0).toLocaleString('tr-TR')}` : '<span class="badge badge-emerald">Ödendi</span>'}
      </td>
      <td style="text-align:center;">
        <button class="btn-tbl btn-tbl-primary" onclick="viewSaleDetailsModal('${encodeURIComponent(JSON.stringify(s))}')">Detay</button>
      </td>
    </tr>
  `).join('');
}

// ============================================================================
// 4. FABRİKA & DEPO ALIMLARI SAYFASI
// ============================================================================
function renderPurchasesPage() {
  const tbody = document.getElementById('purchases-page-tbody');
  const searchInp = document.getElementById('input-search-purchases');
  if (!tbody) return;

  const query = (searchInp ? searchInp.value : '').toLowerCase().trim();
  let list = getTenantFilteredList(AppState.purchases);

  if (query) {
    list = list.filter(p => (p.invoice_no || '').toLowerCase().includes(query) || (p.factory_name || '').toLowerCase().includes(query) || (p.cig_name || '').toLowerCase().includes(query));
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b;">Alım irsaliyesi bulunamadı.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => `
    <tr>
      <td>${p.date || 'Tarih Yok'}</td>
      <td><span class="badge badge-subtle">${p.invoice_no || 'IRS'}</span></td>
      <td><strong>${p.factory_name || 'Ana Dağıtım'}</strong></td>
      <td>${p.cig_name || 'Çeşitli Sigaralar'}</td>
      <td style="text-align:center;" class="mono-val">${p.carton_qty || 0} Karton</td>
      <td style="text-align:right;" class="mono-val" style="color:#34d399;">₺ ${(Number(p.total_cost) || 0).toLocaleString('tr-TR')}</td>
      <td style="text-align:center;">
        <button class="btn-tbl btn-tbl-rose" onclick="deletePurchaseRecord('${p.purchase_id}')">Sil</button>
      </td>
    </tr>
  `).join('');
}

// ============================================================================
// 5. DEPO STOK YÖNETİMİ SAYFASI
// ============================================================================
function renderInventoryPage() {
  const tbody = document.getElementById('inventory-page-tbody');
  const searchInp = document.getElementById('input-search-stock');
  const filterSelect = document.getElementById('select-filter-stock-status');
  if (!tbody) return;

  const query = (searchInp ? searchInp.value : '').toLowerCase().trim();
  const filter = filterSelect ? filterSelect.value : 'all';

  let list = AppState.catalog.map(c => {
    const stock = AppState.stocks[c.cig_id] || { cartons: 0, packets: 0 };
    const totalVal = (stock.cartons || 0) * (Number(c.buy_price) || 0);
    return {
      ...c,
      stockCartons: stock.cartons,
      stockPackets: stock.packets,
      totalVal
    };
  });

  if (query) {
    list = list.filter(i => (i.name || '').toLowerCase().includes(query) || (i.brand || '').toLowerCase().includes(query));
  }

  if (filter === 'negative') {
    list = list.filter(i => i.stockCartons < 0);
  } else if (filter === 'zero') {
    list = list.filter(i => i.stockCartons === 0);
  } else if (filter === 'positive') {
    list = list.filter(i => i.stockCartons > 0);
  }

  list.sort((a, b) => a.stockCartons - b.stockCartons);

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b;">Stok kaydı bulunamadı.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(item => {
    let badgeHtml = '';
    if (item.stockCartons < 0) {
      badgeHtml = `<span class="badge badge-rose">Eksi Stok (${item.stockCartons})</span>`;
    } else if (item.stockCartons === 0) {
      badgeHtml = `<span class="badge badge-subtle">Tükendi</span>`;
    } else {
      badgeHtml = `<span class="badge badge-emerald">Mevcut</span>`;
    }

    return `
      <tr>
        <td><strong style="color:#fff;">${item.name}</strong><br><span style="font-size:0.7rem; color:#94a3b8;">${item.brand || ''}</span></td>
        <td>${(item.brand_group || '').toUpperCase()}</td>
        <td style="text-align:right;" class="mono-val" style="color:${item.stockCartons < 0 ? '#fb7185' : '#fff'}; font-weight:900;">
          ${item.stockCartons} Karton
        </td>
        <td style="text-align:right;" class="mono-val">${item.stockPackets} Paket</td>
        <td style="text-align:center;">${badgeHtml}</td>
        <td style="text-align:right;" class="mono-val">₺ ${Math.round(item.totalVal).toLocaleString('tr-TR')}</td>
        <td style="text-align:center;">
          <button class="btn-tbl btn-tbl-primary" onclick="openStockEditModal('${item.cig_id}', '${encodeURIComponent(item.name)}', ${item.stockCartons}, ${item.stockPackets})">Stok Düzenle</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================================================
// 6. KASA: ALACAKLAR & BORÇLAR SAYFASI
// ============================================================================
function renderFinancePage() {
  const recTbody = document.getElementById('finance-receivables-tbody');
  const payTbody = document.getElementById('finance-payables-tbody');

  // Alacaklar (Bayiler + Müşteri Alacakları) - Filtreli
  if (recTbody) {
    const combinedRec = [];
    const filteredDealers = getTenantFilteredList(AppState.dealers);
    filteredDealers.forEach(d => {
      const debt = Number(d.total_debt) || 0;
      if (debt > 0) {
        combinedRec.push({
          type: 'dealer',
          id: d.dealer_id,
          name: d.name,
          subtitle: `${d.region || 'İstanbul'} (Bayi Borcu)`,
          amount: debt
        });
      }
    });

    const filteredCustomerRec = getTenantFilteredList(AppState.customerReceivables);
    filteredCustomerRec.forEach(c => {
      combinedRec.push({
        type: 'customer',
        id: c.rec_id,
        name: c.customer_name,
        subtitle: `Vade: ${c.due_date || 'Belirtilmedi'} (Serbest Alacak)`,
        amount: Number(c.remaining_debt) || Number(c.total_debt) || 0
      });
    });

    if (combinedRec.length === 0) {
      recTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b; padding:20px;">Kayıtlı aktif alacak bulunmuyor.</td></tr>`;
    } else {
      recTbody.innerHTML = combinedRec.map(r => `
        <tr>
          <td><strong style="color:#fff;">${r.name}</strong></td>
          <td><span style="font-size:0.75rem; color:#94a3b8;">${r.subtitle}</span></td>
          <td style="text-align:right;" class="mono-val" style="color:#fb7185;">₺ ${r.amount.toLocaleString('tr-TR')}</td>
          <td style="text-align:center;">
            ${r.type === 'dealer'
              ? `<button class="btn-tbl btn-tbl-primary" onclick="openDealerEditModal('${r.id}')">İncele</button>`
              : `<button class="btn-tbl btn-tbl-rose" onclick="deleteCustomerRecRecord('${r.id}')">Sil</button>`}
          </td>
        </tr>
      `).join('');
    }
  }

  // Borçlar (Payables) - Filtreli
  const filteredPayables = getTenantFilteredList(AppState.payables);
  if (payTbody) {
    if (filteredPayables.length === 0) {
      payTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b; padding:20px;">Tedarikçi borcu bulunmuyor.</td></tr>`;
    } else {
      payTbody.innerHTML = filteredPayables.map(p => `
        <tr>
          <td><strong style="color:#fff;">${p.supplier_name}</strong><br><span style="font-size:0.7rem; color:#94a3b8;">${p.note || ''}</span></td>
          <td>${p.due_date || 'Vade Yok'}</td>
          <td style="text-align:right;" class="mono-val" style="color:#fde68a;">₺ ${(Number(p.remaining_amount) || Number(p.total_amount) || 0).toLocaleString('tr-TR')}</td>
          <td style="text-align:center;">
            <button class="btn-tbl btn-tbl-rose" onclick="deletePayableRecord('${p.payable_id}')">Sil</button>
          </td>
        </tr>
      `).join('');
    }
  }
}

// ============================================================================
// 7. SİGARA KATALOĞU VE FİYATLAR SAYFASI
// ============================================================================
function renderCatalogPage() {
  const tbody = document.getElementById('catalog-page-tbody');
  const searchInp = document.getElementById('input-search-catalog');
  if (!tbody) return;

  const query = (searchInp ? searchInp.value : '').toLowerCase().trim();
  let list = [...AppState.catalog];

  if (query) {
    list = list.filter(c => (c.name || '').toLowerCase().includes(query) || (c.brand || '').toLowerCase().includes(query));
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b;">Katalogda sigara bulunamadı.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(c => {
    const buy = Number(c.buy_price) || 0;
    const carton = Number(c.carton_price) || 0;
    const packet = Number(c.packet_price) || (carton / 10);
    const margin = carton - buy;

    return `
      <tr>
        <td><strong style="color:#fff;">${c.name}</strong><br><span style="font-size:0.7rem; color:#94a3b8;">${c.brand || ''}</span></td>
        <td><span class="badge badge-subtle">${(c.brand_group || '').toUpperCase()}</span></td>
        <td style="text-align:right;" class="mono-val">₺ ${buy.toLocaleString('tr-TR')}</td>
        <td style="text-align:right;" class="mono-val" style="color:#38bdf8;">₺ ${carton.toLocaleString('tr-TR')}</td>
        <td style="text-align:right;" class="mono-val">₺ ${packet.toLocaleString('tr-TR')}</td>
        <td style="text-align:right;" class="mono-val" style="color:#34d399;">+₺ ${margin.toLocaleString('tr-TR')}</td>
        <td style="text-align:center;">
          <button class="btn-tbl btn-tbl-primary" onclick="openCatalogEditModal('${c.cig_id}')">Fiyat Düzenle</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================================================
// 8. SİSTEM BULUT YEDEKLERİ SAYFASI
// ============================================================================
function renderBackupsPage() {
  const tbody = document.getElementById('backups-page-tbody');
  if (!tbody) return;

  if (AppState.backups.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#64748b;">Supabase bulutunda henüz yedek kaydı bulunmuyor.</td></tr>`;
    return;
  }

  tbody.innerHTML = AppState.backups.map(b => `
    <tr>
      <td><strong>${b.formatted_date || b.created_at || 'Tarih Yok'}</strong></td>
      <td>${b.backup_note || 'Bulut Sistem Yedeği'}</td>
      <td style="text-align:center;" class="mono-val">${b.total_dealers || 0} Bayi</td>
      <td style="text-align:center;" class="mono-val">${b.total_stock_cartons || 0} Karton</td>
      <td style="text-align:center;">
        <button class="btn-tbl btn-tbl-emerald" onclick="downloadBackupJson('${b.id}')">💾 İndir (.json)</button>
      </td>
    </tr>
  `).join('');
}

// ============================================================================
// 9. CANLI DESTEK, BİLET/TALEP YÖNETİMİ & OTOMATİK BULUT TEMİZLEME MOTORU
// ============================================================================
const ADMIN_LOCAL_CHAT_KEY = 'admin_local_support_chat_history';
let adminActiveTicketId = null;

function getAdminChatArchive() {
  try {
    const raw = localStorage.getItem(ADMIN_LOCAL_CHAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveAdminChatArchive(msgs) {
  try {
    localStorage.setItem(ADMIN_LOCAL_CHAT_KEY, JSON.stringify(msgs));
  } catch (e) {}
}

async function loadSupportMessages(shouldScroll = true) {
  try {
    const remoteRes = await db.get('support_messages', 'order=created_at.asc&limit=300');
    let localArchive = getAdminChatArchive();

    if (Array.isArray(remoteRes) && remoteRes.length > 0) {
      const map = new Map();
      localArchive.forEach(m => { if (m.id) map.set(m.id, m); });

      let newWholesalerMsgCount = 0;
      const idsToPrune = [];

      remoteRes.forEach(m => {
        if (!map.has(m.id) && m.sender_role === 'toptanci') {
          newWholesalerMsgCount++;
        }
        map.set(m.id, m);
        idsToPrune.push(m.id);
      });

      localArchive = Array.from(map.values());
      localArchive.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
      saveAdminChatArchive(localArchive);
      AppState.messages = localArchive;

      if (newWholesalerMsgCount > 0) {
        showToast(`🔔 Toptancı'dan ${newWholesalerMsgCount} yeni mesaj/talep alındı!`);
      }

      // OTOMATİK BULUT TEMİZLİĞİ: İndirilen kayıtları Supabase'den sil
      if (idsToPrune.length > 0) {
        try {
          await db.delete('support_messages', `id=in.(${idsToPrune.join(',')})`);
          console.log(`[Bulut Temizliği] ${idsToPrune.length} mesaj bilgisayarınıza arşivlendi ve Supabase'den temizlendi.`);
        } catch (delErr) {
          console.warn("Supabase temizleme uyarısı:", delErr);
        }
      }
    } else {
      AppState.messages = localArchive;
    }

    renderAdminTicketsList();
    renderSupportMessages(shouldScroll);
    updateBadges();
  } catch (err) {
    console.warn("Mesajlar yüklenemedi:", err.message);
    AppState.messages = getAdminChatArchive();
    renderAdminTicketsList();
    renderSupportMessages(shouldScroll);
  }
}

function getDerivedAdminTickets() {
  const messages = getTenantFilteredList(AppState.messages);
  const ticketMap = new Map();

  messages.forEach(m => {
    const tId = m.ticket_id || 'DST-1000';
    const subj = m.ticket_subject || 'Genel Destek & Saha İletişim';
    const tTenant = m.tenant_id || 'default_tenant';

    if (!ticketMap.has(tId)) {
      ticketMap.set(tId, {
        ticket_id: tId,
        subject: subj,
        tenant_id: tTenant,
        created_at: m.created_at || new Date().toISOString(),
        last_message: m.message_text || 'Ek dosya gönderildi',
        last_time: m.created_at || new Date().toISOString(),
        has_unread: m.sender_role === 'toptanci' && !m.is_read
      });
    } else {
      const existing = ticketMap.get(tId);
      existing.last_message = m.message_text || 'Ek dosya gönderildi';
      existing.last_time = m.created_at || existing.last_time;
      if (m.sender_role === 'toptanci' && !m.is_read) existing.has_unread = true;
    }
  });

  const list = Array.from(ticketMap.values());
  list.sort((a, b) => new Date(b.last_time || 0) - new Date(a.last_time || 0));
  return list;
}

function renderAdminTicketsList() {
  const box = document.getElementById('admin-tickets-list-box');
  const countBadge = document.getElementById('admin-tickets-count-badge');
  if (!box) return;

  const tickets = getDerivedAdminTickets();
  if (countBadge) countBadge.textContent = `${tickets.length} Talep`;

  if (tickets.length === 0) {
    box.innerHTML = `
      <div style="text-align:center; color:#64748b; font-size:0.8rem; padding:20px 10px;">
        Henüz açılmış bir destek talebi bulunmuyor.
      </div>
    `;
    return;
  }

  // İlk yüklemede aktif bilet seçili değilse ilkini seç
  if (!adminActiveTicketId && tickets.length > 0) {
    adminActiveTicketId = tickets[0].ticket_id;
  }

  box.innerHTML = tickets.map(t => {
    const isSelected = t.ticket_id === adminActiveTicketId;
    const borderStyle = isSelected ? 'border:1.5px solid #6366f1; background:#0f172a;' : 'border:1px solid rgba(255,255,255,0.06); background:#090e1a;';
    const tenantObj = AppState.tenants.find(x => x.tenant_id === t.tenant_id);
    const tenantName = tenantObj ? tenantObj.company_name : (t.tenant_id || 'Toptancı');
    const dateStr = t.last_time ? new Date(t.last_time).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

    return `
      <div style="${borderStyle} border-radius:10px; padding:10px 12px; cursor:pointer; transition:all 0.2s;" onclick="selectAdminTicket('${t.ticket_id}')">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="font-size:0.68rem; font-family:monospace; background:rgba(99,102,241,0.2); color:#a5b4fc; padding:2px 5px; border-radius:4px; font-weight:800;">#${t.ticket_id}</span>
          <span style="font-size:0.65rem; color:#64748b;">${dateStr}</span>
        </div>
        <div style="font-size:0.82rem; font-weight:800; color:#ffffff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          ${escapeHtml(t.subject)}
        </div>
        <div style="font-size:0.72rem; color:#38bdf8; margin-top:2px;">
          🏢 ${escapeHtml(tenantName)}
        </div>
        <div style="font-size:0.72rem; color:#94a3b8; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          ${escapeHtml(t.last_message || '')}
        </div>
        <div style="margin-top:6px; display:flex; justify-content:flex-end;">
          <button type="button" class="btn-tbl btn-tbl-primary" style="padding:3px 10px; font-size:0.7rem;" onclick="selectAdminTicket('${t.ticket_id}'); event.stopPropagation();">
            💬 Mesajları Gör
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.selectAdminTicket = function(ticketId) {
  adminActiveTicketId = ticketId;
  renderAdminTicketsList();
  renderSupportMessages(true);
};

function renderSupportMessages(shouldScroll = true) {
  const box = document.getElementById('admin-chat-box');
  const subjEl = document.getElementById('admin-chat-active-subject');
  const codeEl = document.getElementById('admin-chat-active-ticket-code');
  const tenantEl = document.getElementById('admin-chat-active-tenant-name');
  if (!box) return;

  const tickets = getDerivedAdminTickets();
  const currentTicket = tickets.find(x => x.ticket_id === adminActiveTicketId) || (tickets.length > 0 ? tickets[0] : null);

  if (currentTicket) {
    if (subjEl) subjEl.textContent = currentTicket.subject;
    if (codeEl) codeEl.textContent = `#${currentTicket.ticket_id}`;
    if (tenantEl) {
      const tObj = AppState.tenants.find(x => x.tenant_id === currentTicket.tenant_id);
      tenantEl.textContent = tObj ? tObj.company_name : (currentTicket.tenant_id || 'Toptancı');
    }
  }

  const allFiltered = getTenantFilteredList(AppState.messages);
  const ticketMessages = allFiltered.filter(m => !adminActiveTicketId || m.ticket_id === adminActiveTicketId);

  if (ticketMessages.length === 0) {
    box.innerHTML = `
      <div style="text-align:center; color:#64748b; font-size:0.85rem; margin:auto; padding:20px;">
        <div style="font-size:2rem; margin-bottom:8px;">💬</div>
        Bu talep için henüz bir mesaj akışı bulunmuyor.<br>
        Aşağıdaki kutudan toptancınıza yanıt yazabilir, görsel veya PDF / Word / TXT ekleyebilirsiniz.
      </div>
    `;
    return;
  }

  box.innerHTML = ticketMessages.map(m => {
    const isAdmin = m.sender_role === 'admin';
    const alignStyle = isAdmin ? 'margin-left:auto; text-align:right;' : 'margin-right:auto; text-align:left;';
    const bubbleBg = isAdmin
      ? 'background:linear-gradient(135deg, #4338ca 0%, #4f46e5 100%); color:#fff; border-bottom-right-radius:3px;'
      : 'background:#1e293b; color:#e2e8f0; border-bottom-left-radius:3px; border:1px solid rgba(255,255,255,0.06);';
    const roleBadge = isAdmin
      ? '<span style="font-size:0.68rem; background:rgba(255,255,255,0.2); padding:1px 6px; border-radius:4px; font-weight:800;">Patron</span>'
      : '<span style="font-size:0.68rem; background:rgba(16,185,129,0.25); color:#34d399; padding:1px 6px; border-radius:4px; font-weight:800;">Toptancı (Saha)</span>';

    const timeStr = m.created_at ? new Date(m.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '';

    let attachmentHtml = '';
    if (m.image_url) {
      if (m.image_url.startsWith('data:image/') || m.image_url.match(/\.(jpeg|jpg|png|webp|gif)/i)) {
        attachmentHtml = `
          <div style="margin-top:6px; margin-bottom:4px;">
            <img src="${m.image_url}" alt="Fotoğraf" style="max-width:240px; max-height:220px; border-radius:8px; object-fit:cover; border:1px solid rgba(255,255,255,0.2); cursor:pointer;" onclick="window.open('${m.image_url}', '_blank')" title="Büyütmek için tıklayın" />
          </div>
        `;
      } else {
        const fileName = m.attachment_name || 'belge_indir';
        attachmentHtml = `
          <div style="margin-top:8px; margin-bottom:4px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); border-radius:8px; padding:8px 12px; display:flex; align-items:center; gap:10px; text-align:left;">
            <span style="font-size:1.6rem;">📄</span>
            <div style="flex:1; overflow:hidden;">
              <div style="font-size:0.75rem; font-weight:800; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${fileName}</div>
              <div style="font-size:0.65rem; color:#94a3b8;">Belge / Doküman</div>
            </div>
            <a href="${m.image_url}" download="${fileName}" style="background:#10b981; color:#fff; text-decoration:none; font-size:0.72rem; font-weight:800; padding:5px 10px; border-radius:6px; flex-shrink:0;">İndir 📥</a>
          </div>
        `;
      }
    }

    return `
      <div style="max-width:75%; ${alignStyle}">
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:3px; justify-content:${isAdmin ? 'flex-end' : 'flex-start'};">
          ${!isAdmin ? roleBadge : ''}
          <span style="font-size:0.7rem; color:#94a3b8;">${m.sender_name || (isAdmin ? 'Patron' : 'Toptancı')}</span>
          <span style="font-size:0.65rem; color:#64748b;">${timeStr}</span>
          ${isAdmin ? roleBadge : ''}
        </div>
        <div style="display:inline-block; padding:10px 14px; border-radius:12px; font-size:0.85rem; line-height:1.4; word-break:break-word; text-align:left; box-shadow:0 2px 8px rgba(0,0,0,0.2); ${bubbleBg}">
          ${attachmentHtml}
          ${m.message_text ? `<div>${escapeHtml(m.message_text)}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  if (shouldScroll) {
    box.scrollTop = box.scrollHeight;
  }
}

function setupSupportChat() {
  const fileInp = document.getElementById('admin-chat-file-input');
  const attachBtn = document.getElementById('btn-admin-attach-photo');
  const previewStrip = document.getElementById('admin-chat-preview-strip');
  const previewImg = document.getElementById('admin-chat-preview-img');
  const previewDoc = document.getElementById('admin-chat-preview-doc');
  const previewDocName = document.getElementById('admin-chat-preview-doc-name');
  const removePreviewBtn = document.getElementById('btn-remove-admin-preview');
  const sendBtn = document.getElementById('btn-admin-send-message');
  const textInp = document.getElementById('admin-chat-input-text');
  const refreshMsgBtn = document.getElementById('btn-refresh-messages');

  let pendingAttachment = null;

  if (attachBtn && fileInp) {
    attachBtn.onclick = () => fileInp.click();
    fileInp.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      if (file.type.startsWith('image/')) {
        reader.onload = (loadEvt) => {
          compressImage(loadEvt.target.result, 1000, 0.75, (compressedBase64) => {
            pendingAttachment = { type: 'image', data: compressedBase64, name: file.name };
            if (previewImg) { previewImg.src = compressedBase64; previewImg.style.display = 'block'; }
            if (previewDoc) previewDoc.style.display = 'none';
            if (previewStrip) previewStrip.style.display = 'flex';
          });
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (loadEvt) => {
          pendingAttachment = { type: 'document', data: loadEvt.target.result, name: file.name };
          if (previewImg) previewImg.style.display = 'none';
          if (previewDoc) previewDoc.style.display = 'flex';
          if (previewDocName) previewDocName.textContent = file.name;
          if (previewStrip) previewStrip.style.display = 'flex';
        };
        reader.readAsDataURL(file);
      }
    };
  }

  if (removePreviewBtn) {
    removePreviewBtn.onclick = () => {
      pendingAttachment = null;
      if (fileInp) fileInp.value = '';
      if (previewStrip) previewStrip.style.display = 'none';
    };
  }

  const handleSendMessage = async () => {
    const text = textInp ? textInp.value.trim() : '';
    const att = pendingAttachment;

    if (!text && !att) {
      alert("Lütfen bir mesaj yazın veya dosya/fotoğraf ekleyin!");
      return;
    }

    try {
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = "Gönderiliyor...";
      }

      const tickets = getDerivedAdminTickets();
      const currentTicket = tickets.find(x => x.ticket_id === adminActiveTicketId);
      const ticketId = adminActiveTicketId || (currentTicket ? currentTicket.ticket_id : 'DST-1000');
      const ticketSubject = currentTicket ? currentTicket.subject : 'Genel Destek';
      const tenantId = currentTicket ? currentTicket.tenant_id : (AppState.selectedTenantId !== 'ALL' ? AppState.selectedTenantId : 'default_tenant');

      const msgRecord = {
        ticket_id: ticketId,
        ticket_subject: ticketSubject,
        tenant_id: tenantId,
        sender_role: 'admin',
        sender_name: 'Patron',
        message_text: text || (att ? (att.type === 'document' ? `📎 ${att.name}` : '📷 Fotoğraf') : ''),
        image_url: att ? att.data : null,
        attachment_name: att ? att.name : null,
        is_read: false,
        created_at: new Date().toISOString()
      };

      const localArchive = getAdminChatArchive();
      const localMsg = { ...msgRecord, id: Date.now() };
      localArchive.push(localMsg);
      saveAdminChatArchive(localArchive);
      AppState.messages = localArchive;
      renderAdminTicketsList();
      renderSupportMessages(true);

      await db.post('support_messages', msgRecord);

      if (textInp) textInp.value = '';
      pendingAttachment = null;
      if (fileInp) fileInp.value = '';
      if (previewStrip) previewStrip.style.display = 'none';

      showToast("Yanıt toptancıya iletildi!");
    } catch (err) {
      alert(`Mesaj gönderme hatası: ${err.message}`);
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Gönder`;
      }
    }
  };

  if (sendBtn) sendBtn.onclick = handleSendMessage;
  if (textInp) {
    textInp.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };
  }

  if (refreshMsgBtn) {
    refreshMsgBtn.onclick = () => loadSupportMessages(true);
  }
}

// Görsel Boyutunu & Kalitesini Düşüren Sıkıştırma Yardımcısı
function compressImage(base64Str, maxDimension = 1000, quality = 0.75, callback) {
  const img = new Image();
  img.src = base64Str;
  img.onload = () => {
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > maxDimension) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      }
    } else {
      if (height > maxDimension) {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    callback(canvas.toDataURL('image/jpeg', quality));
  };
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// MODALLAR VE DÜZENLEME İŞLEMLERİ (SUPABASE WRITE)
// ============================================================================

// 0. Toptancı Lisansı Oluştur / Düzenle Modalı
function openTenantEditModal(tenantId = null) {
  const modal = document.getElementById('modal-tenant-edit');
  const title = document.getElementById('m-tenant-title');
  const idInp = document.getElementById('m-tenant-id');
  const compInp = document.getElementById('m-tenant-company');
  const contactInp = document.getElementById('m-tenant-contact');
  const phoneInp = document.getElementById('m-tenant-phone');
  const cityInp = document.getElementById('m-tenant-city');
  const statusSel = document.getElementById('m-tenant-status');
  const licKeyInp = document.getElementById('m-tenant-license-key');
  const boundDevInp = document.getElementById('m-tenant-bound-device');
  const resetDevCheck = document.getElementById('m-tenant-reset-device');

  if (resetDevCheck) resetDevCheck.checked = false;

  if (tenantId) {
    const t = AppState.tenants.find(x => x.tenant_id === tenantId);
    if (!t) return;
    title.textContent = `Toptancı Düzenle: ${t.company_name}`;
    idInp.value = t.tenant_id;
    compInp.value = t.company_name || '';
    contactInp.value = t.contact_person || '';
    phoneInp.value = t.phone || '';
    cityInp.value = t.city || '';
    statusSel.value = t.status || 'active';
    licKeyInp.value = t.license_key || '';
    boundDevInp.value = t.bound_device_id ? `📱 Kilitli Cihaz: ${t.bound_device_info || t.bound_device_id}` : 'Henüz cihaz bağlanmadı';
  } else {
    title.textContent = "Yeni Toptancı Lisansı Tanımla";
    idInp.value = `tenant-${Date.now()}`;
    compInp.value = "";
    contactInp.value = "";
    phoneInp.value = "";
    cityInp.value = "İstanbul";
    statusSel.value = "active";
    licKeyInp.value = generateLicenseKey();
    boundDevInp.value = "Henüz cihaz bağlanmadı (İlk girişte mühürlenir)";
  }

  modal.classList.add('open');
}

function generateLicenseKey() {
  const rand1 = Math.floor(1000 + Math.random() * 9000);
  const rand2 = Math.floor(1000 + Math.random() * 9000);
  return `LIC-${rand1}-${rand2}`;
}

async function toggleTenantStatus(tenantId, newStatus) {
  const t = AppState.tenants.find(x => x.tenant_id === tenantId);
  const actionText = newStatus === 'suspended' ? 'KİLİTLENECEK ve sahada uygulaması anında engellenecektir' : 'AÇILACAKTIR';
  if (!confirm(`"${t ? t.company_name : tenantId}" toptancısının erişimi ${actionText}. Onaylıyor musunuz?`)) return;

  try {
    await db.patch('tenants', `tenant_id=eq.${tenantId}`, { status: newStatus });
    showToast(newStatus === 'suspended' ? "Toptancı erişimi kilitlendi!" : "Toptancı erişimi açıldı!");
    await loadAllDataFromSupabase();
  } catch (err) {
    alert(`İşlem hatası: ${err.message}`);
  }
}

async function resetTenantDevice(tenantId) {
  if (!confirm("Bu toptancının cihaz donanım kilidi sıfırlanacaktır. Toptancı yeni telefonunda lisans anahtarını girerek giriş yapabilir. Onaylıyor musunuz?")) return;
  try {
    await db.patch('tenants', `tenant_id=eq.${tenantId}`, {
      bound_device_id: null,
      bound_device_info: null
    });
    showToast("Cihaz kilidi sıfırlandı! Toptancı yeni cihazından giriş yapabilir.");
    await loadAllDataFromSupabase();
  } catch (err) {
    alert(`Cihaz sıfırlama hatası: ${err.message}`);
  }
}

function selectAndInspectTenant(tenantId) {
  const sel = document.getElementById('global-tenant-selector');
  if (sel) sel.value = tenantId;
  AppState.selectedTenantId = tenantId;
  switchView('view-overview');
  renderAllViews();
  updateBadges();
  const t = AppState.tenants.find(x => x.tenant_id === tenantId);
  showToast(`"${t ? t.company_name : tenantId}" toptancısının verileri inceleniyor.`);
}

async function deleteTenantRecord(tenantId) {
  if (!confirm("Bu toptancı kaydı silinecektir. Emin misiniz?")) return;
  try {
    await db.delete('tenants', `tenant_id=eq.${tenantId}`);
    showToast("Toptancı kaydı silindi!");
    await loadAllDataFromSupabase();
  } catch (err) {
    alert(`Silme hatası: ${err.message}`);
  }
}

// 1. Bayi Düzenle / Yeni Bayi Modalı
function openDealerEditModal(dealerId = null) {
  const modal = document.getElementById('modal-dealer-edit');
  const title = document.getElementById('m-dealer-title');
  const idInput = document.getElementById('m-dealer-id');
  const nameInput = document.getElementById('m-dealer-name');
  const ownerInput = document.getElementById('m-dealer-owner');
  const phoneInput = document.getElementById('m-dealer-phone');
  const regionInput = document.getElementById('m-dealer-region');
  const debtInput = document.getElementById('m-dealer-debt');
  const salesContainer = document.getElementById('m-dealer-sales-list');

  if (dealerId) {
    const d = AppState.dealers.find(x => x.dealer_id === dealerId);
    if (!d) return;
    title.textContent = `Bayi Düzenle: ${d.name}`;
    idInput.value = d.dealer_id;
    nameInput.value = d.name || '';
    ownerInput.value = d.owner || '';
    phoneInput.value = d.phone || '';
    regionInput.value = d.region || '';
    debtInput.value = d.total_debt || 0;

    // Satışları listele
    if (salesContainer) {
      if (Array.isArray(d.sales_history) && d.sales_history.length > 0) {
        salesContainer.innerHTML = d.sales_history.slice(0, 5).map(s => `
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>${s.date || ''} (${s.receipt || 'Fiş'})</span>
            <strong style="color:#38bdf8;">₺ ${(s.total || 0).toLocaleString('tr-TR')} (Borç: ₺${(s.debt || 0).toLocaleString('tr-TR')})</strong>
          </div>
        `).join('');
      } else {
        salesContainer.innerHTML = `<span style="color:#64748b;">Bu bayiye ait henüz sipariş kaydı yok.</span>`;
      }
    }
  } else {
    title.textContent = "Yeni Satış Noktası (Bayi) Ekle";
    idInput.value = "";
    nameInput.value = "";
    ownerInput.value = "";
    phoneInput.value = "";
    regionInput.value = "İstanbul";
    debtInput.value = "0";
    if (salesContainer) salesContainer.innerHTML = "";
  }

  modal.classList.add('open');
}

// 2. Stok Düzenle Modalı
function openStockEditModal(cigId, cigNameEncoded, currentCartons, currentPackets) {
  const modal = document.getElementById('modal-stock-edit');
  const cigNameEl = document.getElementById('m-stock-cig-name');
  const idInp = document.getElementById('m-stock-cig-id');
  const cartonsInp = document.getElementById('m-stock-cartons');
  const packetsInp = document.getElementById('m-stock-packets');

  idInp.value = cigId;
  cigNameEl.textContent = decodeURIComponent(cigNameEncoded);
  cartonsInp.value = currentCartons || 0;
  packetsInp.value = currentPackets || 0;

  modal.classList.add('open');
}

// 3. Fiyat & Katalog Düzenle Modalı
function openCatalogEditModal(cigId = null) {
  const modal = document.getElementById('modal-catalog-edit');
  const title = document.getElementById('m-cat-title');
  const idInp = document.getElementById('m-cat-id');
  const nameInp = document.getElementById('m-cat-name');
  const brandInp = document.getElementById('m-cat-brand');
  const groupSelect = document.getElementById('m-cat-group');
  const buyInp = document.getElementById('m-cat-buy');
  const cartonInp = document.getElementById('m-cat-carton');

  if (cigId) {
    const c = AppState.catalog.find(x => x.cig_id === cigId);
    if (!c) return;
    title.textContent = `Fiyat & Bilgi Düzenle: ${c.name}`;
    idInp.value = c.cig_id;
    nameInp.value = c.name || '';
    brandInp.value = c.brand || '';
    groupSelect.value = c.brand_group || 'pm';
    buyInp.value = c.buy_price || 0;
    cartonInp.value = c.carton_price || 0;
  } else {
    title.textContent = "Yeni Sigara Ekle";
    idInp.value = "";
    nameInp.value = "";
    brandInp.value = "";
    groupSelect.value = "pm";
    buyInp.value = "1000";
    cartonInp.value = "1100";
  }

  modal.classList.add('open');
}

// 4. Sipariş Detaylarını İnceleme Modalı
function viewSaleDetailsModal(saleEncoded) {
  try {
    const sale = JSON.parse(decodeURIComponent(saleEncoded));
    alert(`Sipariş Fişi Detayı:\n\nFiş No: ${sale.receipt || '-'}\nBayi: ${sale.dealerName || '-'}\nTarih: ${sale.date || '-'}\nToplam Tutar: ₺${(sale.total || 0).toLocaleString('tr-TR')}\nÖdenen: ₺${(sale.paid || 0).toLocaleString('tr-TR')}\nKalan Borç: ₺${(sale.debt || 0).toLocaleString('tr-TR')}\n\nÜrünler:\n${sale.items || 'Belirtilmedi'}`);
  } catch (e) {
    console.error(e);
  }
}

// ============================================================================
// FORM SUBMIT VE KAYIT MOTORU
// ============================================================================
function setupModalForms() {
  // Bayi Kaydet
  const saveDealerBtn = document.getElementById('btn-save-dealer-db');
  if (saveDealerBtn) {
    saveDealerBtn.onclick = async () => {
      const id = document.getElementById('m-dealer-id').value.trim() || `d-${Date.now()}`;
      const name = document.getElementById('m-dealer-name').value.trim();
      const owner = document.getElementById('m-dealer-owner').value.trim();
      const phone = document.getElementById('m-dealer-phone').value.trim();
      const region = document.getElementById('m-dealer-region').value.trim();
      const debt = parseFloat(document.getElementById('m-dealer-debt').value) || 0;

      if (!name) {
        alert("Lütfen bayi adını giriniz!");
        return;
      }

      try {
        saveDealerBtn.disabled = true;
        saveDealerBtn.textContent = "Kaydediliyor...";

        const record = {
          dealer_id: id,
          name: name,
          owner: owner,
          phone: phone,
          region: region,
          total_debt: debt,
          updated_at: new Date().toISOString()
        };

        await db.post('dealers', record, true);
        showToast(`"${name}" başarıyla Supabase'e kaydedildi!`);
        document.getElementById('modal-dealer-edit').classList.remove('open');
        await loadAllDataFromSupabase();
      } catch (err) {
        alert(`Kayıt hatası: ${err.message}`);
      } finally {
        saveDealerBtn.disabled = false;
        saveDealerBtn.textContent = "Supabase'e Kaydet";
      }
    };
  }

  // Stok Kaydet
  const saveStockBtn = document.getElementById('btn-save-stock-db');
  if (saveStockBtn) {
    saveStockBtn.onclick = async () => {
      const cigId = document.getElementById('m-stock-cig-id').value;
      const cartons = parseInt(document.getElementById('m-stock-cartons').value) || 0;
      const packets = parseInt(document.getElementById('m-stock-packets').value) || 0;

      try {
        saveStockBtn.disabled = true;
        saveStockBtn.textContent = "Kaydediliyor...";

        const record = {
          cigarette_id: cigId,
          stock_cartons: cartons,
          stock_packets: packets,
          updated_at: new Date().toISOString()
        };

        await db.post('inventory_stock', record, true);
        showToast("Stok miktarı Supabase üzerinde güncellendi!");
        document.getElementById('modal-stock-edit').classList.remove('open');
        await loadAllDataFromSupabase();
      } catch (err) {
        alert(`Stok güncelleme hatası: ${err.message}`);
      } finally {
        saveStockBtn.disabled = false;
        saveStockBtn.textContent = "Stoku Güncelle";
      }
    };
  }

  // Katalog Kaydet
  const saveCatBtn = document.getElementById('btn-save-cat-db');
  if (saveCatBtn) {
    saveCatBtn.onclick = async () => {
      const id = document.getElementById('m-cat-id').value.trim() || `cig-${Date.now()}`;
      const name = document.getElementById('m-cat-name').value.trim();
      const brand = document.getElementById('m-cat-brand').value.trim();
      const group = document.getElementById('m-cat-group').value;
      const buy = parseFloat(document.getElementById('m-cat-buy').value) || 0;
      const carton = parseFloat(document.getElementById('m-cat-carton').value) || 0;

      if (!name) {
        alert("Lütfen sigara adını giriniz!");
        return;
      }

      try {
        saveCatBtn.disabled = true;
        saveCatBtn.textContent = "Kaydediliyor...";

        const record = {
          cig_id: id,
          name: name,
          brand: brand,
          brand_group: group,
          buy_price: buy,
          carton_price: carton,
          packet_price: carton / 10,
          margin_carton: carton - buy,
          margin_packet: (carton - buy) / 10,
          updated_at: new Date().toISOString()
        };

        await db.post('cigarettes_catalog', record, true);
        showToast(`"${name}" katalogda güncellendi!`);
        document.getElementById('modal-catalog-edit').classList.remove('open');
        await loadAllDataFromSupabase();
      } catch (err) {
        alert(`Katalog kayıt hatası: ${err.message}`);
      } finally {
        saveCatBtn.disabled = false;
        saveCatBtn.textContent = "Kataloğu Kaydet";
      }
    };
  }

  // Yeni İrsaliye Kaydet
  const savePurBtn = document.getElementById('btn-save-purchase-db');
  if (savePurBtn) {
    savePurBtn.onclick = async () => {
      const invoice = document.getElementById('m-new-pur-invoice').value.trim() || `IRS-${Date.now()}`;
      const factory = document.getElementById('m-new-pur-factory').value.trim() || 'Ana Dağıtım';
      const cigSelect = document.getElementById('m-new-pur-cig-select');
      const cigId = cigSelect.value;
      const cigName = cigSelect.options[cigSelect.selectedIndex]?.text || '';
      const qty = parseInt(document.getElementById('m-new-pur-qty').value) || 0;
      const unitPrice = parseFloat(document.getElementById('m-new-pur-unit-price').value) || 0;
      const totalCost = qty * unitPrice;

      if (qty <= 0) {
        alert("Lütfen geçerli bir miktar giriniz!");
        return;
      }

      try {
        savePurBtn.disabled = true;
        savePurBtn.textContent = "Kaydediliyor...";

        const record = {
          purchase_id: `pur-${Date.now()}`,
          date: new Date().toLocaleDateString('tr-TR'),
          factory_name: factory,
          cig_id: cigId,
          cig_name: cigName,
          carton_qty: qty,
          unit_buy_price: unitPrice,
          total_cost: totalCost,
          invoice_no: invoice,
          created_at: new Date().toISOString()
        };

        // 1. Alım İrsaliyesi Ekle
        await db.post('warehouse_purchases', record);

        // 2. Depo Stok Artır (Varsa eksi stoğu telafi eder)
        const curStock = (AppState.stocks[cigId] ? AppState.stocks[cigId].cartons : 0);
        await db.post('inventory_stock', {
          cigarette_id: cigId,
          stock_cartons: curStock + qty,
          stock_packets: 0,
          updated_at: new Date().toISOString()
        }, true);

        showToast(`${qty} karton ${cigName} depoya eklendi!`);
        document.getElementById('modal-purchase-new').classList.remove('open');
        await loadAllDataFromSupabase();
      } catch (err) {
        alert(`İrsaliye kayıt hatası: ${err.message}`);
      } finally {
        savePurBtn.disabled = false;
        savePurBtn.textContent = "İrsaliyeyi Kaydet & Depoya Ekle";
      }
    };
  }

  // Yeni Alım Butonu Tıklanması
  const addPurBtn = document.getElementById('btn-add-new-purchase');
  if (addPurBtn) {
    addPurBtn.onclick = () => {
      const modal = document.getElementById('modal-purchase-new');
      const select = document.getElementById('m-new-pur-cig-select');
      const unitPriceInp = document.getElementById('m-new-pur-unit-price');
      const qtyInp = document.getElementById('m-new-pur-qty');
      const totalCalc = document.getElementById('m-new-pur-total-calc');

      select.innerHTML = AppState.catalog.map(c => `
        <option value="${c.cig_id}" data-buy="${c.buy_price || 1000}">${c.name} (${c.brand})</option>
      `).join('');

      const updateCalc = () => {
        const q = parseInt(qtyInp.value) || 0;
        const u = parseFloat(unitPriceInp.value) || 0;
        totalCalc.textContent = `₺ ${(q * u).toLocaleString('tr-TR')}`;
      };

      select.onchange = () => {
        const opt = select.options[select.selectedIndex];
        unitPriceInp.value = opt ? opt.getAttribute('data-buy') : 1000;
        updateCalc();
      };

      if (select.options.length > 0) select.onchange();
      qtyInp.oninput = updateCalc;
      unitPriceInp.oninput = updateCalc;

      modal.classList.add('open');
    };
  }

  // Yeni Bayi Butonu Tıklanması
  const addDealerBtn = document.getElementById('btn-add-new-dealer');
  if (addDealerBtn) {
    addDealerBtn.onclick = () => openDealerEditModal(null);
  }

  // Yeni Sigara Butonu Tıklanması
  const addCatBtn = document.getElementById('btn-add-new-cigarette');
  if (addCatBtn) {
    addCatBtn.onclick = () => openCatalogEditModal(null);
  }

  // Manuel Finans Ekleme Butonları
  const addRecBtn = document.getElementById('btn-add-customer-rec');
  const addPayBtn = document.getElementById('btn-add-payable');
  const saveFinBtn = document.getElementById('btn-save-finance-db');

  if (addRecBtn) {
    addRecBtn.onclick = () => {
      document.getElementById('m-fin-type').value = 'receivable';
      document.getElementById('m-fin-title').textContent = "Yeni Manuel Alacak Ekle";
      document.getElementById('m-fin-name-label').textContent = "Borçlu Müşteri Adı";
      document.getElementById('m-fin-name').value = "";
      document.getElementById('m-fin-amount').value = "";
      document.getElementById('modal-finance-item').classList.add('open');
    };
  }

  if (addPayBtn) {
    addPayBtn.onclick = () => {
      document.getElementById('m-fin-type').value = 'payable';
      document.getElementById('m-fin-title').textContent = "Yeni Tedarikçi Borcu Ekle";
      document.getElementById('m-fin-name-label').textContent = "Tedarikçi / Fabrika Adı";
      document.getElementById('m-fin-name').value = "";
      document.getElementById('m-fin-amount').value = "";
      document.getElementById('modal-finance-item').classList.add('open');
    };
  }

  if (saveFinBtn) {
    saveFinBtn.onclick = async () => {
      const type = document.getElementById('m-fin-type').value;
      const name = document.getElementById('m-fin-name').value.trim();
      const amount = parseFloat(document.getElementById('m-fin-amount').value) || 0;
      const date = document.getElementById('m-fin-date').value;
      const note = document.getElementById('m-fin-note').value.trim();

      if (!name || amount <= 0) {
        alert("Lütfen geçerli bir isim ve tutar giriniz!");
        return;
      }

      try {
        saveFinBtn.disabled = true;
        saveFinBtn.textContent = "Kaydediliyor...";

        if (type === 'receivable') {
          await db.post('customer_receivables', {
            rec_id: `rec-${Date.now()}`,
            customer_name: name,
            total_debt: amount,
            remaining_debt: amount,
            due_date: date,
            notes: note,
            created_at: new Date().toISOString()
          });
          showToast("Müşteri alacağı Supabase'e kaydedildi!");
        } else {
          await db.post('payables', {
            payable_id: `pay-${Date.now()}`,
            supplier_name: name,
            total_amount: amount,
            remaining_amount: amount,
            due_date: date,
            note: note,
            updated_at: new Date().toISOString()
          });
          showToast("Tedarikçi borcu Supabase'e kaydedildi!");
        }

        document.getElementById('modal-finance-item').classList.remove('open');
        await loadAllDataFromSupabase();
      } catch (err) {
        alert(`Kayıt hatası: ${err.message}`);
      } finally {
        saveFinBtn.disabled = false;
        saveFinBtn.textContent = "Kaydet";
      }
    };
  }
}

// ============================================================================
// 10. TOPTANCILAR & LİSANS YÖNETİM SAYFASI MOTORU
// ============================================================================
function parseAdminTenantMeta(tenant) {
  let meta = {};
  try {
    if (tenant.notes && tenant.notes.startsWith('{')) {
      meta = JSON.parse(tenant.notes);
    }
  } catch (e) {}

  return {
    licenseType: tenant.license_type || meta.license_type || '30_days',
    activatedAt: tenant.activated_at || meta.activated_at || null,
    expiresAt: tenant.expires_at || meta.expires_at || null,
    gracePeriodUntil: tenant.grace_period_until || meta.grace_period_until || null,
    overdueDaysDeducted: tenant.overdue_days_deducted || meta.overdue_days_deducted || 0
  };
}

function renderTenantsPage() {
  const tbody = document.getElementById('tenants-page-tbody');
  if (!tbody) return;

  const kpiTotal = document.getElementById('kpi-tenants-total');
  const kpiActive = document.getElementById('kpi-tenants-active');
  const kpiPending = document.getElementById('kpi-tenants-pending');
  const kpiGrace = document.getElementById('kpi-tenants-grace');

  const tenants = AppState.tenants || [];
  const now = new Date();

  let activeCount = 0;
  let pendingCount = 0;
  let graceCount = 0;

  tbody.innerHTML = tenants.map(t => {
    const meta = parseAdminTenantMeta(t);
    const isSuspended = t.status === 'suspended';

    let statusBadge = '';
    let durationInfo = '';

    if (isSuspended) {
      statusBadge = '<span class="badge badge-rose" style="font-size:0.75rem;">🔒 Askıya Alındı (Kilitli)</span>';
      durationInfo = '<span style="color:#fb7185; font-size:0.75rem;">Patron tarafından kapatıldı</span>';
    } else if (!t.license_key || t.status === 'pending_license' || t.license_key.startsWith('BEKLIYOR')) {
      pendingCount++;
      statusBadge = '<span class="badge badge-amber" style="font-size:0.75rem;">⏳ Anahtar Bekliyor</span>';
      durationInfo = '<span style="color:#facc15; font-size:0.75rem;">Yeni kayıt oldu, anahtar atanmalı</span>';
    } else if (meta.licenseType === 'unlimited') {
      activeCount++;
      statusBadge = '<span class="badge badge-indigo" style="font-size:0.75rem;">♾️ Sınırsız (Ömür Boyu)</span>';
      durationInfo = '<span style="color:#a5b4fc; font-size:0.75rem;">Süre sınırı yok</span>';
    } else {
      // 30 Günlük Lisans
      if (!meta.activatedAt) {
        pendingCount++;
        statusBadge = '<span class="badge badge-amber" style="font-size:0.75rem;">⏳ Başlatılmadı</span>';
        durationInfo = '<span style="color:#facc15; font-size:0.75rem;">Uygulamaya girilince 30 gün başlar</span>';
      } else {
        const expTime = new Date(meta.expiresAt);
        const graceTime = meta.gracePeriodUntil ? new Date(meta.gracePeriodUntil) : new Date(expTime.getTime() + 7 * 86400000);

        if (now <= expTime) {
          activeCount++;
          const daysLeft = Math.max(1, Math.ceil((expTime.getTime() - now.getTime()) / 86400000));
          statusBadge = `<span class="badge badge-emerald" style="font-size:0.75rem;">🟢 Aktif (30 Günlük)</span>`;
          durationInfo = `<strong style="color:#34d399; font-size:0.8rem;">${daysLeft} gün kaldı</strong><br><span style="font-size:0.68rem; color:#64748b;">Bitiş: ${expTime.toLocaleDateString('tr-TR')}</span>`;
        } else if (now > expTime && now <= graceTime) {
          graceCount++;
          const graceDaysLeft = Math.max(1, Math.ceil((graceTime.getTime() - now.getTime()) / 86400000));
          const overdueDays = Math.max(1, Math.ceil((now.getTime() - expTime.getTime()) / 86400000));
          statusBadge = `<span class="badge badge-amber" style="font-size:0.75rem; background:rgba(245,158,11,0.25); color:#fbbf24; border:1px solid #f59e0b;">⚠️ 7 Günlük Ek Sürede</span>`;
          durationInfo = `<strong style="color:#fbbf24; font-size:0.8rem;">${graceDaysLeft} gün sonra kilitlenir!</strong><br><span style="font-size:0.68rem; color:#f87171;">Gecikme: ${overdueDays} gün (kesilecek)</span>`;
        } else {
          statusBadge = `<span class="badge badge-rose" style="font-size:0.75rem;">⛔ Ek Süre Doldu (Kilitli)</span>`;
          durationInfo = `<span style="color:#fb7185; font-size:0.75rem;">7 günlük süre aşıldı, ödeme bekliyor</span>`;
        }
      }
    }

    const regDate = t.created_at ? new Date(t.created_at).toLocaleDateString('tr-TR') : '-';
    const isPendingKey = !t.license_key || t.license_key.startsWith('BEKLIYOR');
    const keyDisplay = !isPendingKey ? `<span style="font-family:monospace; font-weight:800; color:#38bdf8; font-size:0.8rem; background:rgba(56,189,248,0.1); padding:2px 6px; border-radius:4px;">${t.license_key}</span>` : '<span style="color:#f59e0b; font-size:0.75rem; font-weight:700;">Atanmadı (Bekliyor)</span>';
    const deviceDisplay = t.bound_device_id ? `<span style="font-family:monospace; font-size:0.72rem; color:#94a3b8;">${t.bound_device_id}</span>` : '<span style="color:#64748b; font-size:0.72rem;">Henüz Giriş Yapılmadı</span>';

    return `
      <tr>
        <td>
          <strong style="color:#ffffff; font-size:0.9rem; display:block;">${escapeHtml(t.company_name)}</strong>
          <span style="font-size:0.72rem; color:#64748b;">Kayıt: ${regDate}</span>
        </td>
        <td>
          <div style="font-weight:700; color:#cbd5e1; font-size:0.85rem;">${escapeHtml(t.contact_person || '-')}</div>
          <div style="font-size:0.75rem; color:#38bdf8;">📞 ${escapeHtml(t.phone || '-')}</div>
        </td>
        <td>${deviceDisplay}</td>
        <td>
          <div style="margin-bottom:2px;">${statusBadge}</div>
          <div>${keyDisplay}</div>
        </td>
        <td>${durationInfo}</td>
        <td style="text-align:center;">
          <div style="display:inline-flex; gap:6px; flex-wrap:wrap; justify-content:center;">
            <button type="button" class="btn-tbl btn-tbl-primary" onclick="openAssignLicenseModal('${t.tenant_id}')" title="Lisans Ata veya Süre Yenile">
              🔑 Lisans Ata
            </button>
            <button type="button" class="btn-tbl ${isSuspended ? 'btn-tbl-success' : 'btn-tbl-danger'}" onclick="toggleTenantStatus('${t.tenant_id}')" title="${isSuspended ? 'Kilidi Aç' : 'Erişimi Askıya Al'}">
              ${isSuspended ? '🔓 Kilidi Aç' : '🔒 Kilitle'}
            </button>
            <button type="button" class="btn-tbl btn-tbl-secondary" onclick="resetTenantDevice('${t.tenant_id}')" title="Cihaz Parmak İzini Sıfırla (Yeni telefona izin ver)">
              🔄 Cihaz Sıfırla
            </button>
            <button type="button" class="btn-tbl btn-tbl-danger" onclick="deleteTenantRecord('${t.tenant_id}')" title="Toptancıyı Sistemden Sil">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (tenants.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:30px; color:#64748b;">
          Henüz kayıtlı toptancı bulunmuyor. Toptancı saha uygulamasını açtığında kayıt formu doldurarak buraya düşecektir.
        </td>
      </tr>
    `;
  }

  if (kpiTotal) kpiTotal.textContent = tenants.length;
  if (kpiActive) kpiActive.textContent = activeCount;
  if (kpiPending) kpiPending.textContent = pendingCount;
  if (kpiGrace) kpiGrace.textContent = graceCount;
}

function openAssignLicenseModal(tenantId) {
  const modal = document.getElementById('modal-assign-license');
  const tIdInp = document.getElementById('m-lic-tenant-id');
  const titleEl = document.getElementById('m-lic-company-title');
  const typeSel = document.getElementById('m-lic-type');
  const penaltyBox = document.getElementById('m-lic-penalty-notice');
  const penaltyDaysEl = document.getElementById('m-lic-penalty-days');

  const tenant = AppState.tenants.find(x => x.tenant_id === tenantId);
  if (!tenant || !modal) return;

  if (tIdInp) tIdInp.value = tenantId;
  if (titleEl) titleEl.textContent = `Lisans: ${tenant.company_name}`;

  const meta = parseAdminTenantMeta(tenant);
  if (typeSel) typeSel.value = meta.licenseType || '30_days';

  generateNewLicenseKey(typeSel ? typeSel.value : '30_days');

  const now = new Date();
  if (meta.expiresAt && now > new Date(meta.expiresAt)) {
    const overdue = Math.min(7, Math.ceil((now.getTime() - new Date(meta.expiresAt).getTime()) / 86400000));
    if (penaltyBox && penaltyDaysEl && overdue > 0) {
      penaltyDaysEl.textContent = `${overdue} gün`;
      penaltyBox.style.display = 'block';
    }
  } else if (penaltyBox) {
    penaltyBox.style.display = 'none';
  }

  modal.classList.add('open');
}

function generateNewLicenseKey(type) {
  const keyInp = document.getElementById('m-lic-key');
  if (!keyInp) return;
  const rand1 = Math.floor(1000 + Math.random() * 9000);
  const rand2 = Math.floor(1000 + Math.random() * 9000);
  if (type === 'unlimited') {
    keyInp.value = `LIC-INF-${rand1}-${rand2}`;
  } else {
    keyInp.value = `LIC-30D-${rand1}-${rand2}`;
  }
}

async function saveLicenseAssignment() {
  const modal = document.getElementById('modal-assign-license');
  const tIdInp = document.getElementById('m-lic-tenant-id');
  const typeSel = document.getElementById('m-lic-type');
  const keyInp = document.getElementById('m-lic-key');
  const saveBtn = document.getElementById('btn-save-license-assignment');

  const tenantId = tIdInp ? tIdInp.value : '';
  const licenseType = typeSel ? typeSel.value : '30_days';
  const newKey = keyInp ? keyInp.value.trim().toUpperCase() : '';

  if (!tenantId || !newKey) {
    alert("Geçerli bir lisans anahtarı oluşturulamadı!");
    return;
  }

  try {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Kaydediliyor...";
    }

    const tenant = AppState.tenants.find(x => x.tenant_id === tenantId);
    const meta = tenant ? parseAdminTenantMeta(tenant) : {};

    let overduePenalty = 0;
    const now = new Date();
    if (meta.expiresAt && now > new Date(meta.expiresAt)) {
      overduePenalty = Math.min(7, Math.ceil((now.getTime() - new Date(meta.expiresAt).getTime()) / 86400000));
    }

    const payload = {
      license_key: newKey,
      status: 'active',
      // Süre sayacı Admin oluşturduğunda değil, toptancı uygulamada girdiğinde başlar!
      activated_at: null,
      expires_at: null,
      grace_period_until: null,
      bound_device_id: null,
      notes: JSON.stringify({
        license_type: licenseType,
        assigned_at: new Date().toISOString(),
        activated_at: null,
        overdue_days_deducted: overduePenalty
      })
    };

    await db.patch('tenants', `tenant_id=eq.${encodeURIComponent(tenantId)}`, payload);

    showToast(`✅ Lisans atandı! Anahtar: ${newKey}`);
    if (modal) modal.classList.remove('open');
    await loadAllDataFromSupabase();
  } catch (err) {
    alert(`Lisans atama hatası: ${err.message}`);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Lisansı Ata & Aktif Et";
    }
  }
}

async function toggleTenantStatus(tenantId) {
  const tenant = AppState.tenants.find(x => x.tenant_id === tenantId);
  if (!tenant) return;

  const newStatus = tenant.status === 'suspended' ? 'active' : 'suspended';
  const actionText = newStatus === 'suspended' ? 'askıya almak (kilitlemek)' : 'kilidini açmak';

  if (!confirm(`"${tenant.company_name}" sistem erişimini ${actionText} istediğinize emin misiniz?`)) {
    return;
  }

  try {
    await db.patch('tenants', `tenant_id=eq.${encodeURIComponent(tenantId)}`, { status: newStatus });
    showToast(`Durum güncellendi: ${newStatus === 'suspended' ? '🔒 Kilitlendi' : '🔓 Açıldı'}`);
    await loadAllDataFromSupabase();
  } catch (err) {
    alert(`Hata: ${err.message}`);
  }
}

async function resetTenantDevice(tenantId) {
  const tenant = AppState.tenants.find(x => x.tenant_id === tenantId);
  if (!tenant) return;

  if (!confirm(`"${tenant.company_name}" için kayıtlı cihaz kilidini sıfırlamak istiyor musunuz? (Toptancı yeni bir telefondan giriş yapabilecek)`)) {
    return;
  }

  try {
    await db.patch('tenants', `tenant_id=eq.${encodeURIComponent(tenantId)}`, {
      bound_device_id: null,
      bound_device_info: null
    });
    showToast(`Cihaz kilidi sıfırlandı! Toptancı yeni telefonundan lisansını girebilir.`);
    await loadAllDataFromSupabase();
  } catch (err) {
    alert(`Hata: ${err.message}`);
  }
}

async function deleteTenantRecord(tenantId) {
  const tenant = AppState.tenants.find(x => x.tenant_id === tenantId);
  if (!tenant) return;

  if (!confirm(`"${tenant.company_name}" toptancısını ve tüm lisans bilgilerini sistemden tamamen silmek istediğinize emin misiniz?`)) {
    return;
  }

  try {
    await db.delete('tenants', `tenant_id=eq.${encodeURIComponent(tenantId)}`);
    showToast(`Toptancı sistemden silindi.`);
    await loadAllDataFromSupabase();
  } catch (err) {
    alert(`Hata: ${err.message}`);
  }
}

function setupTenantLicenseEvents() {
  const refreshTenantsBtn = document.getElementById('btn-refresh-tenants');
  const genKeyBtn = document.getElementById('btn-generate-new-key');
  const saveLicBtn = document.getElementById('btn-save-license-assignment');
  const typeSel = document.getElementById('m-lic-type');

  if (refreshTenantsBtn) {
    refreshTenantsBtn.onclick = () => loadAllDataFromSupabase(true);
  }

  if (genKeyBtn && typeSel) {
    genKeyBtn.onclick = () => generateNewLicenseKey(typeSel.value);
  }

  if (typeSel) {
    typeSel.onchange = () => generateNewLicenseKey(typeSel.value);
  }

  if (saveLicBtn) {
    saveLicBtn.onclick = saveLicenseAssignment;
  }
}

// ============================================================================
// SİLME İŞLEMLERİ (DELETE RECORD)
// ============================================================================
async function deletePurchaseRecord(id) {
  if (!confirm("Bu alım irsaliyesi silinecektir. Emin misiniz?")) return;
  try {
    await db.delete('warehouse_purchases', `purchase_id=eq.${id}`);
    showToast("Alım irsaliyesi silindi!");
    await loadAllDataFromSupabase();
  } catch (err) {
    alert(`Silme hatası: ${err.message}`);
  }
}

async function deleteCustomerRecRecord(id) {
  if (!confirm("Bu müşteri alacağı silinecektir. Emin misiniz?")) return;
  try {
    await db.delete('customer_receivables', `rec_id=eq.${id}`);
    showToast("Müşteri alacağı silindi!");
    await loadAllDataFromSupabase();
  } catch (err) {
    alert(`Silme hatası: ${err.message}`);
  }
}

async function deletePayableRecord(id) {
  if (!confirm("Bu tedarikçi borcu silinecektir. Emin misiniz?")) return;
  try {
    await db.delete('payables', `payable_id=eq.${id}`);
    showToast("Tedarikçi borcu silindi!");
    await loadAllDataFromSupabase();
  } catch (err) {
    alert(`Silme hatası: ${err.message}`);
  }
}

// ============================================================================
// YEDEK İNDİRME (.json)
// ============================================================================
async function downloadBackupJson(backupId) {
  try {
    const res = await db.get('system_backups', `id=eq.${backupId}`);
    if (Array.isArray(res) && res.length > 0 && res[0].payload_json) {
      const jsonStr = JSON.stringify(res[0].payload_json, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SUPABASE_YEDEK_${res[0].export_timestamp || Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Yedek dosyası (.json) başarıyla indirildi!");
    } else {
      alert("Yedek JSON içeriği bulunamadı!");
    }
  } catch (err) {
    alert(`Yedek indirme hatası: ${err.message}`);
  }
}

// ============================================================================
// NAVİGASYON & ARAMA MOTORLARI
// ============================================================================
function setupNavigation() {
  const links = document.querySelectorAll('.nav-link');
  const drawer = document.getElementById('admin-drawer');
  const toggleBtn = document.getElementById('btn-toggle-drawer');

  if (toggleBtn && drawer) {
    toggleBtn.addEventListener('click', () => {
      drawer.classList.toggle('open');
    });
  }

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-target');
      if (!target) return;
      switchView(target);
      if (window.innerWidth <= 992 && drawer) {
        drawer.classList.remove('open');
      }
    });
  });
}

function switchView(viewId) {
  const views = document.querySelectorAll('.admin-page-view');
  const links = document.querySelectorAll('.nav-link');
  const titleEl = document.getElementById('current-view-title');
  const descEl = document.getElementById('current-view-desc');

  views.forEach(v => v.classList.remove('active'));
  links.forEach(l => l.classList.remove('active'));

  const activeView = document.getElementById(viewId);
  const activeLink = document.querySelector(`.nav-link[data-target="${viewId}"]`);

  if (activeView) activeView.classList.add('active');
  if (activeLink) activeLink.classList.add('active');

  AppState.activeView = viewId;

  // Başlık güncellemeleri
  const titles = {
    'view-overview': { title: "Genel Bakış", desc: "Tüm toptancı operasyonunun anlık finans ve stok durumu" },
    'view-tenants': { title: "Toptancılar & Lisans Yönetimi", desc: "Toptancıların lisans durumları, cihaz kilitleri ve kaçak kullanım engelleme" },
    'view-dealers': { title: "Satış Noktaları & Bayiler", desc: "Toptancının çalıştığı tüm marketler, borçlar ve telefonlar" },
    'view-sales': { title: "Satışlar & Siparişler", desc: "Sahada toptancı elemanının yaptığı tüm teslimatlar ve fişler" },
    'view-purchases': { title: "Fabrika & Depo Alımları", desc: "Depoya fabrikalardan ne alındı, ne kadar maliyet ödendi" },
    'view-inventory': { title: "Depo Stok Yönetimi", desc: "Anlık sigara sayımları, açıklar ve eksi stok durumları" },
    'view-finance': { title: "Kasa: Alacaklar & Borçlar", desc: "Piyasadan toplanacak para ve fabrikaya ödenecek vadeli borçlar" },
    'view-catalog': { title: "Sigara Kataloğu & Fiyatlar", desc: "Fabrika alış, tavsiye satış ve kâr marjları listesi" },
    'view-support': { title: "Toptancı Canlı Destek", desc: "Saha satış elemanı ile anlık mesajlaşma ve fotoğraf paylaşımı" },
    'view-backups': { title: "Bulut Sistem Yedekleri", desc: "Supabase üzerinde depolanan anlık tam sistem snapshot'ları" }
  };

  if (titles[viewId] && titleEl && descEl) {
    titleEl.textContent = titles[viewId].title;
    descEl.textContent = titles[viewId].desc;
  }

  if (viewId === 'view-support') {
    renderSupportMessages(true);
  }
}

function setupModalDismissHandlers() {
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.remove('open');
    });
  });

  document.querySelectorAll('.admin-modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  });
}

function setupSearchAndFilters() {
  const searchTenants = document.getElementById('input-search-tenants');
  const filterTenants = document.getElementById('select-filter-tenant-status');
  if (searchTenants) searchTenants.oninput = () => renderTenantsPage();
  if (filterTenants) filterTenants.onchange = () => renderTenantsPage();

  const searchDealers = document.getElementById('input-search-dealers');
  const filterDealers = document.getElementById('select-filter-dealer-debt');
  if (searchDealers) searchDealers.oninput = () => renderDealersPage();
  if (filterDealers) filterDealers.onchange = () => renderDealersPage();

  const searchSales = document.getElementById('input-search-sales');
  const filterSales = document.getElementById('select-filter-sales-status');
  if (searchSales) searchSales.oninput = () => renderSalesPage();
  if (filterSales) filterSales.onchange = () => renderSalesPage();

  const searchPurchases = document.getElementById('input-search-purchases');
  if (searchPurchases) searchPurchases.oninput = () => renderPurchasesPage();

  const searchStock = document.getElementById('input-search-stock');
  const filterStock = document.getElementById('select-filter-stock-status');
  if (searchStock) searchStock.oninput = () => renderInventoryPage();
  if (filterStock) filterStock.onchange = () => renderInventoryPage();

  const searchCatalog = document.getElementById('input-search-catalog');
  if (searchCatalog) searchCatalog.oninput = () => renderCatalogPage();
}

// TOAST NOTIFICATION
function showToast(msg, isError = false) {
  let toast = document.getElementById('admin-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      border: 1px solid rgba(99,102,241,0.4);
      color: #fff;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 700;
      z-index: 99999;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      transition: opacity 0.3s, transform 0.3s;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = isError
    ? `<span style="color:#fb7185; font-size:1.1rem;">⚠</span> <span>${msg}</span>`
    : `<span style="color:#34d399; font-size:1.1rem;">✓</span> <span>${msg}</span>`;

  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 4000);
}

// Global Fonksiyonlar
window.openTenantEditModal = openTenantEditModal;
window.toggleTenantStatus = toggleTenantStatus;
window.resetTenantDevice = resetTenantDevice;
window.selectAndInspectTenant = selectAndInspectTenant;
window.deleteTenantRecord = deleteTenantRecord;
window.openDealerEditModal = openDealerEditModal;
window.openStockEditModal = openStockEditModal;
window.openCatalogEditModal = openCatalogEditModal;
window.viewSaleDetailsModal = viewSaleDetailsModal;
window.deletePurchaseRecord = deletePurchaseRecord;
window.deleteCustomerRecRecord = deleteCustomerRecRecord;
window.deletePayableRecord = deletePayableRecord;
window.downloadBackupJson = downloadBackupJson;
window.switchView = switchView;
window.openCatalogEditModal = openCatalogEditModal;
window.viewSaleDetailsModal = viewSaleDetailsModal;
window.deletePurchaseRecord = deletePurchaseRecord;
window.deleteCustomerRecRecord = deleteCustomerRecRecord;
window.deletePayableRecord = deletePayableRecord;
window.downloadBackupJson = downloadBackupJson;
window.switchView = switchView;

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

  const refreshBtn = document.getElementById('btn-refresh-all');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => loadAllDataFromSupabase(true));
  }

  // İlk veri çekme
  loadAllDataFromSupabase();
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
      backupsRes
    ] = await Promise.all([
      db.get('dealers', 'order=name.asc').catch(() => []),
      db.get('warehouse_purchases', 'order=date.desc').catch(() => []),
      db.get('inventory_stock', '').catch(() => []),
      db.get('cigarettes_catalog', 'order=brand.asc').catch(() => []),
      db.get('customer_receivables', 'order=due_date.asc').catch(() => []),
      db.get('payables', 'order=due_date.asc').catch(() => []),
      db.get('system_backups', 'order=export_timestamp.desc&limit=25').catch(() => [])
    ]);

    AppState.dealers = Array.isArray(dealersRes) ? dealersRes : [];
    AppState.purchases = Array.isArray(purchasesRes) ? purchasesRes : [];
    AppState.catalog = Array.isArray(catalogRes) ? catalogRes : [];
    AppState.customerReceivables = Array.isArray(receivablesRes) ? receivablesRes : [];
    AppState.payables = Array.isArray(payablesRes) ? payablesRes : [];
    AppState.backups = Array.isArray(backupsRes) ? backupsRes : [];

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
  renderDealersPage();
  renderSalesPage();
  renderPurchasesPage();
  renderInventoryPage();
  renderFinancePage();
  renderCatalogPage();
  renderBackupsPage();
}

function updateBadges() {
  const dCount = document.getElementById('badge-dealers-count');
  const sCount = document.getElementById('badge-sales-count');
  const pCount = document.getElementById('badge-purchases-count');
  const stockCount = document.getElementById('badge-stock-count');
  const fCount = document.getElementById('badge-finance-count');
  const cCount = document.getElementById('badge-catalog-count');
  const bCount = document.getElementById('badge-backups-count');

  if (dCount) dCount.textContent = AppState.dealers.length;
  
  // Toplam satış sayısı
  let totalSalesCount = 0;
  AppState.dealers.forEach(d => {
    if (Array.isArray(d.sales_history)) totalSalesCount += d.sales_history.length;
  });
  if (sCount) sCount.textContent = totalSalesCount;

  if (pCount) pCount.textContent = AppState.purchases.length;
  if (stockCount) stockCount.textContent = Object.keys(AppState.stocks).length;
  if (fCount) fCount.textContent = AppState.customerReceivables.length + AppState.payables.length;
  if (cCount) cCount.textContent = AppState.catalog.length;
  if (bCount) bCount.textContent = AppState.backups.length;
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

  if (kpiDealers) kpiDealers.textContent = AppState.dealers.length;

  // Alacaklar
  let totalReceivables = 0;
  AppState.dealers.forEach(d => totalReceivables += (Number(d.total_debt) || 0));
  AppState.customerReceivables.forEach(c => totalReceivables += (Number(c.remaining_debt) || Number(c.total_debt) || 0));
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
  AppState.payables.forEach(p => totalPayables += (Number(p.remaining_amount) || Number(p.total_amount) || 0));
  if (kpiPayVal) kpiPayVal.textContent = `₺ ${Math.round(totalPayables).toLocaleString('tr-TR')}`;

  // Satışlar & Kâr
  let grandSales = 0;
  let grandProfit = 0;
  AppState.dealers.forEach(d => {
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

  // En son 6 satışı topla
  const allSales = [];
  AppState.dealers.forEach(d => {
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
  if (purTbody) {
    if (AppState.purchases.length === 0) {
      purTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:20px;">Henüz alım kaydı bulunamadı.</td></tr>`;
    } else {
      purTbody.innerHTML = AppState.purchases.slice(0, 5).map(p => `
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
// 2. SATIŞ NOKTALARI & BAYİLER SAYFASI
// ============================================================================
function renderDealersPage() {
  const tbody = document.getElementById('dealers-page-tbody');
  const searchInp = document.getElementById('input-search-dealers');
  const filterSelect = document.getElementById('select-filter-dealer-debt');
  if (!tbody) return;

  const query = (searchInp ? searchInp.value : '').toLowerCase().trim();
  const filter = filterSelect ? filterSelect.value : 'all';

  let list = [...AppState.dealers];

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
  AppState.dealers.forEach(d => {
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
  let list = [...AppState.purchases];

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

  // Alacaklar (Bayiler + Müşteri Alacakları)
  if (recTbody) {
    const combinedRec = [];
    AppState.dealers.forEach(d => {
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

    AppState.customerReceivables.forEach(c => {
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

  // Borçlar (Payables)
  if (payTbody) {
    if (AppState.payables.length === 0) {
      payTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b; padding:20px;">Tedarikçi borcu bulunmuyor.</td></tr>`;
    } else {
      payTbody.innerHTML = AppState.payables.map(p => `
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
// MODALLAR VE DÜZENLEME İŞLEMLERİ (SUPABASE WRITE)
// ============================================================================

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
    'view-dealers': { title: "Satış Noktaları & Bayiler", desc: "Toptancının çalıştığı tüm marketler, borçlar ve telefonlar" },
    'view-sales': { title: "Satışlar & Siparişler", desc: "Sahada toptancı elemanının yaptığı tüm teslimatlar ve fişler" },
    'view-purchases': { title: "Fabrika & Depo Alımları", desc: "Depoya fabrikalardan ne alındı, ne kadar maliyet ödendi" },
    'view-inventory': { title: "Depo Stok Yönetimi", desc: "Anlık sigara sayımları, açıklar ve eksi stok durumları" },
    'view-finance': { title: "Kasa: Alacaklar & Borçlar", desc: "Piyasadan toplanacak para ve fabrikaya ödenecek vadeli borçlar" },
    'view-catalog': { title: "Sigara Kataloğu & Fiyatlar", desc: "Fabrika alış, tavsiye satış ve kâr marjları listesi" },
    'view-backups': { title: "Bulut Sistem Yedekleri", desc: "Supabase üzerinde depolanan anlık tam sistem snapshot'ları" }
  };

  if (titles[viewId] && titleEl && descEl) {
    titleEl.textContent = titles[viewId].title;
    descEl.textContent = titles[viewId].desc;
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
window.openDealerEditModal = openDealerEditModal;
window.openStockEditModal = openStockEditModal;
window.openCatalogEditModal = openCatalogEditModal;
window.viewSaleDetailsModal = viewSaleDetailsModal;
window.deletePurchaseRecord = deletePurchaseRecord;
window.deleteCustomerRecRecord = deleteCustomerRecRecord;
window.deletePayableRecord = deletePayableRecord;
window.downloadBackupJson = downloadBackupJson;
window.switchView = switchView;

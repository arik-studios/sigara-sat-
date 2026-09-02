/**
 * TOPTANCI SATIŞ SİSTEMİ - GELİŞMİŞ SİGARA SATIŞ, ÖZEL FİYATLANDIRMA, GRAFİK ANALİZİ, PDF & WHATSAPP
 * Geliştirici: Antigravity AI | Kullanıcı: Ramazan Türk
 */

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initDrawer();
  initNavigation();
  initDeviceControls();
  initDatabaseAndStorage();
  initCharts();
  initDealersAndSalesSystem();
  setupDebtPaymentModals();
  setupInvoiceAndWhatsAppModule();
  setupWarehouseDataModule();
  setupAnalyticsModals();
  setupCustomPriceModule();
  setupPriceIncreaseModule();
  setupDealerPurchaseModule();
  setupDealerBuyPricesModule();
  setupViewAndEditSaleModule();
  setupPurchaseDetailModal();
  setupEditPurchaseModule();
  setupAddNewCigaretteModal();
  setupEditCigaretteDataModule();
  setupCustomerReceivablesHandlers();
  setupMissingPhoneSaveHandler();
  setupEditDealerInfoModule();
  setupEditPendingDebtModule();
  setupDatePickerAndHistoryModule();
  setupTimelineNavigationModule();
  setupFullReportModule();
  initPayablesModule();
  setupSaleDeletionHandlers();
  setupBackupRestoreModule();
  renderHomeStockTable();
  renderStockPieChart();
  renderPurchaseHistoryTable();
  renderOrdersGrid();
  renderDebtLists();
  updateDailySalesReports();
});

/* ==========================================================================
   1. SAAT VE TARİH YÖNETİMİ
   ========================================================================== */
let currentSelectedDateStr = null;

function getActiveBusinessDate() {
  const saved = localStorage.getItem('toptan_active_business_date');
  if (saved) {
    const parts = saved.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
  }
  const dateInput = document.getElementById('topbar-date-input');
  if (dateInput && dateInput.value) {
    const parts = dateInput.value.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
  }
  return new Date();
}

function getActiveBusinessDateStr() {
  const d = getActiveBusinessDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function initClock() {
  const timeEl = document.getElementById('current-time');
  const dateEl = document.getElementById('live-date-label');
  const dateInput = document.getElementById('topbar-date-input');

  const activeDate = getActiveBusinessDate();
  const activeKey = getActiveBusinessDateStr();
  if (dateInput && !dateInput.value) {
    dateInput.value = activeKey;
  }
  if (dateEl) {
    dateEl.textContent = activeDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function update() {
    const currentNow = new Date();
    if (timeEl) {
      timeEl.textContent = currentNow.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    if (!currentSelectedDateStr && dateEl) {
      const curActive = getActiveBusinessDate();
      dateEl.textContent = curActive.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }
  update();
  setInterval(update, 1000);

  if (dateInput) {
    dateInput.addEventListener('change', (e) => {
      const val = e.target.value;
      if (!val) return;
      currentSelectedDateStr = val;
      const parts = val.split('-');
      const selDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const formatted = selDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

      if (dateEl) dateEl.textContent = formatted;
      onDateFilterChanged(selDate, formatted);
    });
  }
}

function onDateFilterChanged(selectedDate, formattedDateStr) {
  renderOrdersGrid(formattedDateStr);
}

/* ==========================================================================
   2. DRAWER (YAN MENÜ) KONTROLÜ
   ========================================================================== */
function initDrawer() {
  const drawerBtn = document.getElementById('drawer-toggle-btn');
  const closeBtn = document.getElementById('drawer-close-btn');
  const backdrop = document.getElementById('drawer-backdrop');
  const panel = document.getElementById('drawer-panel');

  function openDrawer() {
    panel.classList.add('open');
    backdrop.classList.add('open');
  }

  function closeDrawer() {
    panel.classList.remove('open');
    backdrop.classList.remove('open');
  }

  if (drawerBtn) drawerBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });
}

/* ==========================================================================
   3. SAYFA GEÇİŞLERİ & MENÜ NAVİGASYONU
   ========================================================================== */
function switchToPage(pageId) {
  if (!pageId) return;

  const pages = document.querySelectorAll('.page-content');
  const drawerItems = document.querySelectorAll('.drawer-item');

  pages.forEach(p => p.classList.remove('active-page'));
  drawerItems.forEach(d => d.classList.remove('active'));

  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) {
    targetPage.classList.add('active-page');
  }

  const targetItem = document.querySelector(`.drawer-item[data-page="${pageId === 'dealer-detail' ? 'points' : pageId}"]`);
  if (targetItem) {
    targetItem.classList.add('active');
  }

  const panel = document.getElementById('drawer-panel');
  const backdrop = document.getElementById('drawer-backdrop');
  if (panel) panel.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');

  if (pageId === 'home') {
    updateDynamicCharts();
    renderHomeStockTable();
  } else if (pageId === 'dealers') {
    renderStockPieChart();
    renderPurchaseHistoryTable();
  } else if (pageId === 'points') {
    renderDealersTable();
  } else if (pageId === 'charts') {
    updateDailySalesReports();
  } else if (pageId === 'payables') {
    renderPayablesList();
    checkPayablesDueAlert();
  } else if (pageId === 'receivables') {
    renderDebtLists();
  } else if (pageId === 'backup') {
    renderBackupPageData();
  }
}

function initNavigation() {
  const drawerItems = document.querySelectorAll('.drawer-item');
  const homeGesturePill = document.getElementById('home-gesture-pill');

  drawerItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const pageId = item.getAttribute('data-page');
      if (!pageId) return; // Do not switch page for modal triggers
      e.preventDefault();
      switchToPage(pageId);
    });
  });

  if (homeGesturePill) {
    homeGesturePill.addEventListener('click', () => {
      switchToPage('home');
    });
  }

  const backToDealersBtn = document.getElementById('btn-back-to-dealers-page');
  if (backToDealersBtn) {
    backToDealersBtn.addEventListener('click', () => {
      switchToPage('points');
      renderDealersTable();
    });
  }
}

/* ==========================================================================
   4. TABLET KONTROLLERİ
   ========================================================================== */
function initDeviceControls() {
  const rotateBtn = document.getElementById('btn-rotate');
  const fullscreenBtn = document.getElementById('btn-fullscreen');
  const addSaleBtn = document.getElementById('btn-add-sale');
  const tabletFrame = document.getElementById('tablet-frame');

  if (rotateBtn && tabletFrame) {
    rotateBtn.addEventListener('click', () => {
      tabletFrame.classList.toggle('portrait');
      window.dispatchEvent(new Event('resize'));
    });
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => { });
      } else {
        document.exitFullscreen().catch(() => { });
      }
    });
  }

  if (addSaleBtn) {
    addSaleBtn.addEventListener('click', () => {
      if (dealersData.length === 0) {
        alert("Lütfen önce 'Satış Noktaları' sekmesinden en az bir bayi veya market ekleyiniz!");
        switchToPage('points');
        const addModal = document.getElementById('modal-add-dealer');
        if (addModal) addModal.classList.remove('hidden');
      } else {
        openDedicatedDealerScreen(dealersData[0].id);
        openCigaretteCatalogModal(dealersData[0]);
      }
    });
  }

  const closeDiffBtn = document.getElementById('close-diff-btn');
  const diffBanner = document.getElementById('day-diff-banner');
  if (closeDiffBtn && diffBanner) {
    closeDiffBtn.addEventListener('click', () => {
      diffBanner.classList.add('hidden');
    });
  }
}

/* ==========================================================================
   5. VERİTABANI & LOCALSTORAGE
   ========================================================================== */
const STORAGE_KEY_DEALERS = 'toptan_dealers_data_v1';
const STORAGE_KEY_DAILY_SALES = 'toptan_daily_sales_v1';
const STORAGE_KEY_CIGS = 'toptan_cigarettes_db_v5';
const STORAGE_KEY_INVENTORY = 'toptan_inventory_stock_v4';
const STORAGE_KEY_PURCHASE_HISTORY = 'toptan_purchase_history_v4';
const STORAGE_KEY_DAILY_HISTORY = 'toptan_daily_history_v5';
const STORAGE_KEY_LAST_CUTOFF = 'toptan_last_cutoff_v5';

let dealersData = [];
let dailySalesData = [];
let inventoryStock = {};
let purchaseHistory = [];
let dailyHistoryStore = {};
let timelineWindowOffset = 0; // 0 = en güncel 7 gün


function initDatabaseAndStorage() {
  const savedCigs = localStorage.getItem(STORAGE_KEY_CIGS);
  if (savedCigs) {
    try {
      const parsed = JSON.parse(savedCigs);
      if (Array.isArray(parsed) && parsed.length > 0) {
        CIGARETTES_DB = parsed;
      }
    } catch (e) { }
  } else {
    localStorage.setItem(STORAGE_KEY_CIGS, JSON.stringify(CIGARETTES_DB));
  }

  const savedDealers = localStorage.getItem(STORAGE_KEY_DEALERS);
  if (savedDealers) {
    try {
      dealersData = JSON.parse(savedDealers);
    } catch (e) {
      dealersData = [];
    }
  } else {
    dealersData = [];
  }

  const savedSales = localStorage.getItem(STORAGE_KEY_DAILY_SALES);
  if (savedSales) {
    try {
      dailySalesData = JSON.parse(savedSales);
    } catch (e) {
      dailySalesData = generateCleanMonthTimeline();
    }
  } else {
    dailySalesData = generateCleanMonthTimeline();
  }

  // Depo Stok Veritabanı (Demo veriler tamamen silindi, temiz başlangıç)
  const savedStock = localStorage.getItem(STORAGE_KEY_INVENTORY);
  if (savedStock) {
    try {
      inventoryStock = JSON.parse(savedStock);
    } catch (e) {
      inventoryStock = {};
    }
  } else {
    inventoryStock = {};
    saveInventoryToStorage();
  }

  // Bayi Toptan Alım Geçmişi (Demo veriler tamamen silindi, temiz başlangıç)
  const savedPurchases = localStorage.getItem(STORAGE_KEY_PURCHASE_HISTORY);
  if (savedPurchases) {
    try {
      purchaseHistory = JSON.parse(savedPurchases);
    } catch (e) {
      purchaseHistory = [];
    }
  } else {
    purchaseHistory = [];
    savePurchaseHistoryToStorage();
  }

  const demoHistory = {
    '2026-08-21': { sales: 124500, profit: 28400, count: 5, dateStr: '21 Ağustos 2026' },
    '2026-08-22': { sales: 148000, profit: 34200, count: 7, dateStr: '22 Ağustos 2026' },
    '2026-08-23': { sales: 98000,  profit: 21500, count: 4, dateStr: '23 Ağustos 2026' },
    '2026-08-24': { sales: 165000, profit: 38000, count: 8, dateStr: '24 Ağustos 2026' },
    '2026-08-25': { sales: 182000, profit: 41500, count: 9, dateStr: '25 Ağustos 2026' },
    '2026-08-26': { sales: 139000, profit: 31000, count: 6, dateStr: '26 Ağustos 2026' },
    '2026-08-27': { sales: 195000, profit: 46200, count: 10, dateStr: '27 Ağustos 2026' },
    '2026-08-28': { sales: 154000, profit: 35800, count: 7, dateStr: '28 Ağustos 2026' },
    '2026-08-29': { sales: 173000, profit: 39400, count: 8, dateStr: '29 Ağustos 2026' },
    '2026-08-30': { sales: 210000, profit: 49000, count: 11, dateStr: '30 Ağustos 2026' },
    '2026-08-31': { sales: 188000, profit: 43200, count: 9, dateStr: '31 Ağustos 2026' },
    '2026-09-01': { sales: 162000, profit: 37500, count: 8, dateStr: '01 Eylül 2026' }
  };

  const savedHistory = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY);
  if (savedHistory) {
    try {
      const parsed = JSON.parse(savedHistory);
      dailyHistoryStore = { ...demoHistory, ...parsed };
    } catch (e) {
      dailyHistoryStore = demoHistory;
    }
  } else {
    dailyHistoryStore = demoHistory;
  }
  localStorage.setItem(STORAGE_KEY_DAILY_HISTORY, JSON.stringify(dailyHistoryStore));

  checkDailyCutoff();
}

function saveDealersToStorage() {
  calculateDailyMetrics();
  localStorage.setItem(STORAGE_KEY_DEALERS, JSON.stringify(dealersData));
  localStorage.setItem(STORAGE_KEY_DAILY_SALES, JSON.stringify(dailySalesData));
  updateDashboardMetrics();
  updateDynamicCharts();
  updateDailySalesReports();
}

function saveInventoryToStorage() {
  localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inventoryStock));
}

function savePurchaseHistoryToStorage() {
  localStorage.setItem(STORAGE_KEY_PURCHASE_HISTORY, JSON.stringify(purchaseHistory));
}

function generateCleanMonthTimeline() {
  return [
    { day: 21, label: "21 Ağu", dateStr: "2026-08-21", sales: 124500, profit: 28400, orderCount: 5, dayName: "Cuma" },
    { day: 22, label: "22 Ağu", dateStr: "2026-08-22", sales: 148000, profit: 34200, orderCount: 7, dayName: "Cumartesi" },
    { day: 23, label: "23 Ağu", dateStr: "2026-08-23", sales: 98000,  profit: 21500, orderCount: 4, dayName: "Pazar" },
    { day: 24, label: "24 Ağu", dateStr: "2026-08-24", sales: 165000, profit: 38000, orderCount: 8, dayName: "Pazartesi" },
    { day: 25, label: "25 Ağu", dateStr: "2026-08-25", sales: 182000, profit: 41500, orderCount: 9, dayName: "Salı" },
    { day: 26, label: "26 Ağu", dateStr: "2026-08-26", sales: 139000, profit: 31000, orderCount: 6, dayName: "Çarşamba" },
    { day: 27, label: "27 Ağu", dateStr: "2026-08-27", sales: 195000, profit: 46200, orderCount: 10, dayName: "Perşembe" },
    { day: 28, label: "28 Ağu", dateStr: "2026-08-28", sales: 154000, profit: 35800, orderCount: 7, dayName: "Cuma" },
    { day: 29, label: "29 Ağu", dateStr: "2026-08-29", sales: 173000, profit: 39400, orderCount: 8, dayName: "Cumartesi" },
    { day: 30, label: "30 Ağu", dateStr: "2026-08-30", sales: 210000, profit: 49000, orderCount: 11, dayName: "Pazar" },
    { day: 31, label: "31 Ağu", dateStr: "2026-08-31", sales: 188000, profit: 43200, orderCount: 9, dayName: "Pazartesi" },
    { day: 1,  label: "1 Eyl",  dateStr: "2026-09-01", sales: 162000, profit: 37500, orderCount: 8, dayName: "Salı" }
  ];
}

const TR_MONTHS_MAP = {
  'ocak': 0, 'şubat': 1, 'subat': 1, 'mart': 2, 'nisan': 3, 'mayıs': 4, 'mayis': 4,
  'haziran': 5, 'temmuz': 6, 'ağustos': 7, 'agustos': 7, 'eylül': 8, 'eylul': 8,
  'ekim': 9, 'kasım': 10, 'kasim': 10, 'aralık': 11, 'aralik': 11
};

function parseAnyDateToDateObj(input) {
  if (!input) return new Date();
  if (input instanceof Date && !isNaN(input.getTime())) return input;
  if (typeof input === 'number') return new Date(input);
  if (typeof input === 'string') {
    const isoParsed = Date.parse(input);
    if (!isNaN(isoParsed)) return new Date(isoParsed);

    const trMatch = input.match(/(\d{1,2})\s+([a-zA-ZğüşıöçĞÜŞİÖÇ]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?/i);
    if (trMatch) {
      const day = parseInt(trMatch[1], 10);
      const monthName = trMatch[2].toLowerCase();
      const year = parseInt(trMatch[3], 10);
      const hour = trMatch[4] ? parseInt(trMatch[4], 10) : 12;
      const min = trMatch[5] ? parseInt(trMatch[5], 10) : 0;
      const monthIdx = TR_MONTHS_MAP[monthName] !== undefined ? TR_MONTHS_MAP[monthName] : 7;
      return new Date(year, monthIdx, day, hour, min);
    }
  }
  return new Date();
}

/**
 * Gece 02:00 Vardiya Döngüsü
 * Gece 00:00 - 02:00 arası yapılan satışlar önceki günün vardiyasına sayılır.
 * Saat 02:00 geçildiğinde yeni günün raporuna dahil edilir.
 */
function getSaleBusinessDate(timestampOrDateStr) {
  const d = parseAnyDateToDateObj(timestampOrDateStr);
  const shiftDate = new Date(d);
  if (shiftDate.getHours() < 2) {
    shiftDate.setDate(shiftDate.getDate() - 1);
  }

  return {
    day: shiftDate.getDate(),
    month: shiftDate.getMonth(),
    year: shiftDate.getFullYear(),
    dateObj: shiftDate
  };
}

/**
 * Gerçek Satış Verilerinden Günlük Raporları ve Vardiya Döngüsünü Hesapla
 */
function calculateDailyMetrics() {
  const daysMap = {};
  const baseTimeline = generateCleanMonthTimeline();
  baseTimeline.forEach((d, idx) => {
    daysMap[idx] = { ...d };
  });

  dealersData.forEach(dealer => {
    (dealer.sales || []).forEach(sale => {
      const bInfo = getSaleBusinessDate(sale.timestamp || sale.date);
      const targetDay = bInfo.day;
      const foundKey = Object.keys(daysMap).find(k => daysMap[k].day === targetDay);
      let targetObj = foundKey !== undefined ? daysMap[foundKey] : null;

      if (!targetObj) {
        const newKey = Object.keys(daysMap).length;
        daysMap[newKey] = {
          day: targetDay,
          label: `${targetDay} Ağu`,
          dayName: "Gün",
          sales: 0,
          profit: 0,
          orderCount: 0
        };
        targetObj = daysMap[newKey];
      }

      const saleTotal = sale.total || 0;
      let saleProfit = 0;
      if (sale.itemsList && Array.isArray(sale.itemsList) && sale.itemsList.length > 0) {
        sale.itemsList.forEach(itm => {
          const cig = CIGARETTES_DB.find(c => c.id === itm.cigId);
          if (cig) {
            const buyPerUnit = itm.type === 'carton' ? cig.buyPrice : (cig.buyPrice / 10);
            const margin = itm.unitPrice - buyPerUnit;
            saleProfit += margin * itm.qty;
          } else {
            saleProfit += itm.total * 0.04;
          }
        });
      } else {
        saleProfit = saleTotal * 0.04;
      }

      targetObj.sales += saleTotal;
      targetObj.profit += Math.round(saleProfit);
      targetObj.orderCount += 1;
    });
  });

  dailySalesData = Object.keys(daysMap).map(k => daysMap[k]);
}

function updateDashboardMetrics() {
  calculateDailyMetrics();

  let totalSalesSum = 0;
  let totalProfitSum = 0;

  dailySalesData.forEach(d => {
    totalSalesSum += d.sales;
    totalProfitSum += d.profit;
  });

  totalProfitSum = Math.round(totalProfitSum);

  const totalReceivables = dealersData.reduce((acc, d) => acc + (d.totalDebt || 0), 0);
  const debtorCount = dealersData.filter(d => (d.totalDebt || 0) > 0).length;

  const totalSalesEl = document.getElementById('stat-total-sales');
  const totalProfitEl = document.getElementById('stat-total-profit');
  const totalDebtEl = document.getElementById('stat-total-receivable-debt');
  const debtCountEl = document.getElementById('stat-debt-dealers-count');

  if (totalSalesEl) totalSalesEl.textContent = totalSalesSum.toLocaleString('tr-TR');
  if (totalProfitEl) totalProfitEl.textContent = totalProfitSum.toLocaleString('tr-TR');
  if (totalDebtEl) totalDebtEl.textContent = totalReceivables.toLocaleString('tr-TR');
  if (debtCountEl) debtCountEl.textContent = `${debtorCount} Borçlu Satış Noktası`;

  // Son 1 Hafta (7 Gün) İçerisindeki En Çok Kâr Edilen Gün Seçimi
  const last7Days = dailySalesData.slice(-7);
  let bestDay = null;
  let maxProfit = -1;

  last7Days.forEach(d => {
    if (d.profit > maxProfit && d.sales > 0) {
      maxProfit = d.profit;
      bestDay = d;
    }
  });

  const recordEl = document.getElementById('weekly-record-text');
  if (recordEl) {
    if (bestDay && maxProfit > 0) {
      recordEl.innerHTML = `
        Bu hafta en çok <span class="highlight-date">${bestDay.day} Ağustos ${bestDay.dayName}</span> günü 
        <span class="highlight-amount">₺ ${bestDay.sales.toLocaleString('tr-TR')}</span> satış yaptın ve 
        <span class="highlight-profit">₺ ${bestDay.profit.toLocaleString('tr-TR')}</span> net kâr elde ettin!
      `;
    } else {
      recordEl.innerHTML = `
        Bu hafta henüz tamamlanmış satış bulunmuyor. Satış noktalarına sevkiyat yaparak haftalık kâr rekorunuzu oluşturun!
      `;
    }
  }
}

/* ==========================================================================
   6. GRAFİKLER & ANALİTİK MOTORU (İstenen Yeni Dinamik Grafikler)
   ========================================================================== */
let timelineChartInstance = null;
let categoryChartInstance = null;
let marginChartInstance = null;

function initCharts() {
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

  createDailyTimelineChart();
  createMonthlyDeepChart();
  updateDynamicCharts();
  updateDashboardMetrics();
}

/**
 * Pasta Grafikleri Canlı Verilerle Güncelle
 */
function updateDynamicCharts() {
  // 1. Sol Pasta: Satılan Sigara Markaları / Türleri Dağılımı
  const brandSalesMap = {
    "Philip Morris": 0,
    "JTI Grubu": 0,
    "BAT Grubu": 0,
    "Imperial": 0
  };

  let totalItemsSold = 0;
  dealersData.forEach(dealer => {
    (dealer.sales || []).forEach(sale => {
      if (sale.itemsList && Array.isArray(sale.itemsList)) {
        sale.itemsList.forEach(item => {
          const cig = CIGARETTES_DB.find(c => c.id === item.cigId);
          const brandKey = cig ? cig.brand : "Philip Morris";
          brandSalesMap[brandKey] = (brandSalesMap[brandKey] || 0) + item.total;
          totalItemsSold += item.qty;
        });
      } else {
        // Fallback oransal dağılım
        brandSalesMap["Philip Morris"] += sale.total * 0.45;
        brandSalesMap["JTI Grubu"] += sale.total * 0.30;
        brandSalesMap["BAT Grubu"] += sale.total * 0.15;
        brandSalesMap["Imperial"] += sale.total * 0.10;
      }
    });
  });

  const categoryLabels = ['Philip Morris', 'JTI Grubu', 'BAT Grubu', 'Imperial'];
  let categoryData = categoryLabels.map(l => Math.round(brandSalesMap[l] || 0));
  const catSum = categoryData.reduce((a, b) => a + b, 0);

  if (catSum === 0) {
    categoryData = [40, 30, 20, 10]; // Boş durum için şık başlangıç
  }

  const categoryColors = ['#00f2fe', '#3b82f6', '#8b5cf6', '#10b981'];

  const ctx1 = document.getElementById('categoryPieChart');
  if (ctx1) {
    if (categoryChartInstance) {
      categoryChartInstance.data.datasets[0].data = categoryData;
      categoryChartInstance.update();
    } else {
      categoryChartInstance = new Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: categoryLabels,
          datasets: [{
            data: categoryData,
            backgroundColor: categoryColors,
            borderWidth: 2,
            borderColor: '#141a27',
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          animation: { animateScale: true, duration: 1000 },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0d111a',
              titleColor: '#00f2fe',
              bodyColor: '#ffffff',
              callbacks: {
                label: (item) => ` ${item.label}: ₺${item.raw.toLocaleString('tr-TR')}`
              }
            }
          }
        }
      });
    }

    const legend1 = document.getElementById('categoryLegend');
    if (legend1) {
      const totalSum = categoryData.reduce((a, b) => a + b, 0) || 1;
      legend1.innerHTML = categoryLabels.map((lbl, idx) => {
        const pct = Math.round((categoryData[idx] / totalSum) * 100);
        return `
          <div class="legend-item">
            <div class="legend-left">
              <div class="legend-color" style="background:${categoryColors[idx]}"></div>
              <span class="legend-label">${lbl}</span>
            </div>
            <span class="legend-value">%${pct}</span>
          </div>
        `;
      }).join('');
    }
  }

  // 2. Sağ Pasta: Peşin Satılan Sigara vs Borca Satılan Sigara
  let totalCashPaid = 0;
  let totalCreditDebt = 0;

  dealersData.forEach(dealer => {
    (dealer.sales || []).forEach(sale => {
      totalCashPaid += (sale.paid || 0);
      totalCreditDebt += (sale.debt || 0);
    });
  });

  const paymentLabels = ['Peşin Satılan Sigara', 'Borca Satılan Sigara'];
  let paymentData = [totalCashPaid, totalCreditDebt];
  const paySum = paymentData.reduce((a, b) => a + b, 0);

  if (paySum === 0) {
    paymentData = [70, 30]; // Boş durum için gösterge
  }

  const paymentColors = ['#10b981', '#f43f5e'];

  const ctx2 = document.getElementById('profitMarginPieChart');
  if (ctx2) {
    if (marginChartInstance) {
      marginChartInstance.data.datasets[0].data = paymentData;
      marginChartInstance.update();
    } else {
      marginChartInstance = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: paymentLabels,
          datasets: [{
            data: paymentData,
            backgroundColor: paymentColors,
            borderWidth: 2,
            borderColor: '#141a27',
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          animation: { animateScale: true, duration: 1000 },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0d111a',
              titleColor: '#10b981',
              bodyColor: '#ffffff',
              callbacks: {
                label: (item) => ` ${item.label}: ₺${item.raw.toLocaleString('tr-TR')}`
              }
            }
          }
        }
      });
    }

    const legend2 = document.getElementById('marginLegend');
    if (legend2) {
      const totalP = paymentData.reduce((a, b) => a + b, 0) || 1;
      legend2.innerHTML = paymentLabels.map((lbl, idx) => {
        const pct = Math.round((paymentData[idx] / totalP) * 100);
        return `
          <div class="legend-item">
            <div class="legend-left">
              <div class="legend-color" style="background:${paymentColors[idx]}"></div>
              <span class="legend-label">${lbl}</span>
            </div>
            <span class="legend-value">%${pct}</span>
          </div>
        `;
      }).join('');
    }
  }
}

function createDailyTimelineChart() {
  const ctx = document.getElementById('dailyTimelineChart');
  if (!ctx) return;

  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 180);
  gradient.addColorStop(0, 'rgba(0, 242, 254, 0.35)');
  gradient.addColorStop(1, 'rgba(0, 242, 254, 0.0)');

  timelineChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dailySalesData.map(d => d.label),
      datasets: [{
        label: 'Günlük Ciro (₺)',
        data: dailySalesData.map(d => d.sales),
        borderColor: '#00f2fe',
        borderWidth: 3,
        pointBackgroundColor: '#00f2fe',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#10b981',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3,
        fill: true,
        backgroundColor: gradient,
        tension: 0.35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { font: { size: 10, weight: '600' }, color: '#64748b', maxTicksLimit: 14 }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            font: { size: 11, family: "'JetBrains Mono', monospace" },
            color: '#64748b',
            callback: (val) => '₺' + (val >= 1000 ? (val / 1000) + 'k' : val)
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d111a',
          titleColor: '#00f2fe',
          bodyColor: '#ffffff',
          borderColor: 'rgba(0, 242, 254, 0.4)',
          borderWidth: 1.5,
          callbacks: {
            title: (items) => {
              const item = dailySalesData[items[0].dataIndex];
              return `${item.day} Ağustos (${item.dayName})`;
            },
            label: (item) => [
              `Ciro: ₺ ${dailySalesData[item.dataIndex].sales.toLocaleString('tr-TR')}`,
              `Kâr:  ₺ ${dailySalesData[item.dataIndex].profit.toLocaleString('tr-TR')}`
            ]
          }
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          handleDayClickComparison(elements[0].index);
        }
      }
    }
  });
}

function handleDayClickComparison(index) {
  const current = dailySalesData[index];
  const diffBanner = document.getElementById('day-diff-banner');
  const dateTitle = document.getElementById('diff-date-title');
  const detailText = document.getElementById('diff-detail-text');
  const iconBox = document.getElementById('diff-icon-box');
  const stripNote = document.getElementById('timeline-interactive-note');

  if (!current) return;

  if (index === 0) {
    dateTitle.textContent = `${current.day} Ağustos ${current.dayName} (Ayın İlk Günü)`;
    detailText.innerHTML = `Bugün toplam <strong>₺ ${current.sales.toLocaleString('tr-TR')}</strong> satış yapıldı.`;
    iconBox.innerHTML = '<svg class="icon-inline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>';
    if (stripNote) stripNote.innerHTML = `<strong>${current.day} Ağustos:</strong> Satış ₺${current.sales.toLocaleString('tr-TR')}.`;
  } else {
    const prev = dailySalesData[index - 1];
    const diff = current.sales - prev.sales;
    const diffAbs = Math.abs(diff).toLocaleString('tr-TR');
    const percentDiff = prev.sales > 0 ? ((diff / prev.sales) * 100).toFixed(1) : '100';
    const isIncrease = diff >= 0;
    const word = isIncrease ? 'DAHA FAZLA' : 'DAHA AZ';
    const colorClass = isIncrease ? '#10b981' : '#f43f5e';
    const arrowIcon = isIncrease ? '▲' : '▼';

    dateTitle.textContent = `${current.day} Ağustos ${current.dayName} - Günlük Kıyaslama`;
    detailText.innerHTML = `
      Bugünkü Ciro: <strong>₺ ${current.sales.toLocaleString('tr-TR')}</strong>. 
      Bir önceki günden (<span style="color:#94a3b8">${prev.day} Ağu: ₺${prev.sales.toLocaleString('tr-TR')}</span>) 
      <strong style="color:${colorClass}">₺ ${diffAbs} (%${Math.abs(percentDiff)}) ${word}</strong> satış yapıldı!
    `;
    iconBox.textContent = arrowIcon;

    if (stripNote) {
      stripNote.innerHTML = `<strong>${current.day} Ağustos:</strong> Bir önceki güne göre <span style="color:${colorClass}; font-weight:800;">₺${diffAbs} (%${Math.abs(percentDiff)}) ${word}</span> satış yapıldı.`;
    }
  }

  if (diffBanner) {
    diffBanner.classList.remove('hidden');
    diffBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

let monthlyTrendChartInstance = null;

function createMonthlyDeepChart() {
  const ctx = document.getElementById('monthlyTrendChart');
  if (!ctx) return;

  if (monthlyTrendChartInstance) {
    monthlyTrendChartInstance.destroy();
  }

  const labels = dailySalesData.map(d => d.label);
  const salesData = dailySalesData.map(d => d.sales);
  const profitData = dailySalesData.map(d => d.profit);

  monthlyTrendChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Günlük Ciro (₺)',
          data: salesData,
          backgroundColor: 'rgba(0, 242, 254, 0.75)',
          hoverBackgroundColor: '#00f2fe',
          borderColor: '#00f2fe',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.75,
          categoryPercentage: 0.8
        },
        {
          label: 'Günlük Net Kâr (₺)',
          data: profitData,
          backgroundColor: 'rgba(16, 185, 129, 0.85)',
          hoverBackgroundColor: '#34d399',
          borderColor: '#10b981',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.75,
          categoryPercentage: 0.8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { font: { size: 10, weight: '600' }, color: '#94a3b8', maxTicksLimit: 14 }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            font: { size: 11, family: "'JetBrains Mono', monospace" },
            color: '#94a3b8',
            callback: (val) => '₺' + (val >= 1000 ? (val / 1000) + 'k' : val)
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { color: '#cbd5e1', font: { weight: '700', size: 11 }, boxWidth: 12, padding: 12 }
        },
        tooltip: {
          backgroundColor: '#0d111a',
          titleColor: '#00f2fe',
          bodyColor: '#ffffff',
          borderColor: 'rgba(0, 242, 254, 0.4)',
          borderWidth: 1.5,
          callbacks: {
            title: (items) => {
              const item = dailySalesData[items[0].dataIndex];
              return `${item.day} Ağustos (${item.dayName})`;
            },
            label: (item) => {
              const d = dailySalesData[item.dataIndex];
              const margin = d.sales > 0 ? ((d.profit / d.sales) * 100).toFixed(1) : '0';
              if (item.datasetIndex === 0) {
                return `Ciro: ₺ ${d.sales.toLocaleString('tr-TR')}`;
              } else {
                return `Net Kâr: ₺ ${d.profit.toLocaleString('tr-TR')} (Marj: %${margin})`;
              }
            }
          }
        }
      }
    }
  });

  updateDailySalesReports();
}

/**
 * Satış Grafikleri Sayfası - Günlük Kâr & Ciro Raporu (02:00 Vardiya Kuralına Göre)
 */
function updateDailySalesReports() {
  calculateDailyMetrics();

  let monthSales = 0;
  let monthProfit = 0;
  dailySalesData.forEach(d => {
    monthSales += d.sales;
    monthProfit += d.profit;
  });

  // Bugünün (veya son günün) verisi
  const todayItem = dailySalesData[dailySalesData.length - 1] || { sales: 0, profit: 0 };
  const todaySales = todayItem.sales;
  const todayProfit = todayItem.profit;
  const todayMargin = todaySales > 0 ? ((todayProfit / todaySales) * 100).toFixed(1) : '0';
  const monthMargin = monthSales > 0 ? ((monthProfit / monthSales) * 100).toFixed(1) : '0';

  const todaySalesEl = document.getElementById('chart-today-sales');
  const todayProfitEl = document.getElementById('chart-today-profit');
  const todayMarginEl = document.getElementById('chart-today-margin');
  const monthSalesEl = document.getElementById('chart-month-sales');
  const monthProfitEl = document.getElementById('chart-month-profit');
  const monthMarginEl = document.getElementById('chart-month-margin');
  const daysBadge = document.getElementById('chart-daily-days-badge');

  if (todaySalesEl) todaySalesEl.textContent = `₺ ${todaySales.toLocaleString('tr-TR')}`;
  if (todayProfitEl) todayProfitEl.textContent = `₺ ${todayProfit.toLocaleString('tr-TR')}`;
  if (todayMarginEl) todayMarginEl.textContent = `%${todayMargin} Net Kâr Marjı`;
  if (monthSalesEl) monthSalesEl.textContent = `₺ ${monthSales.toLocaleString('tr-TR')}`;
  if (monthProfitEl) monthProfitEl.textContent = `₺ ${monthProfit.toLocaleString('tr-TR')}`;
  if (monthMarginEl) monthMarginEl.textContent = `%${monthMargin} Ortalama Marj`;
  if (daysBadge) daysBadge.textContent = `${dailySalesData.length} Günlük Rapor (Ağustos 2026)`;

  // Tabloyu Doldur (En son günden geriye doğru)
  const tbody = document.getElementById('daily-sales-report-tbody');
  if (tbody) {
    const reversed = [...dailySalesData].reverse();
    tbody.innerHTML = reversed.map(d => {
      const margin = d.sales > 0 ? ((d.profit / d.sales) * 100).toFixed(1) : '0';
      const statusBadge = d.sales > 0
        ? `<span style="background:rgba(16,185,129,0.12); color:#34d399; font-weight:800; padding:3px 8px; border-radius:6px; font-size:0.72rem;">Aktif Satış</span>`
        : `<span style="color:#64748b; font-size:0.72rem;">İşlem Yok</span>`;

      return `
        <tr>
          <td><strong>${d.day} Ağustos 2026</strong> <span style="color:#94a3b8; font-size:0.72rem;">(${d.dayName})</span></td>
          <td style="text-align:center; font-family:var(--font-mono); font-weight:700;">${d.orderCount || 0}</td>
          <td style="text-align:right; font-family:var(--font-mono); font-weight:800; color:#00f2fe;">₺ ${d.sales.toLocaleString('tr-TR')}</td>
          <td style="text-align:right; font-family:var(--font-mono); font-weight:800; color:#10b981;">₺ ${d.profit.toLocaleString('tr-TR')}</td>
          <td style="text-align:center; font-family:var(--font-mono); font-weight:700; color:#fbbf24;">%${margin}</td>
          <td style="text-align:center;">${statusBadge}</td>
        </tr>
      `;
    }).join('');
  }

  // Grafik Güncellemesi
  if (monthlyTrendChartInstance) {
    monthlyTrendChartInstance.data.labels = dailySalesData.map(d => d.label);
    monthlyTrendChartInstance.data.datasets[0].data = dailySalesData.map(d => d.sales);
    monthlyTrendChartInstance.data.datasets[1].data = dailySalesData.map(d => d.profit);
    monthlyTrendChartInstance.update();
  }

  // 7 Günlük Kaydırmalı Dilim Güncellemesi
  const totalDays = dailySalesData.length;
  const endIndex = totalDays - timelineWindowOffset;
  const startIndex = Math.max(0, endIndex - 7);
  const slicedData = dailySalesData.slice(startIndex, Math.max(startIndex + 7, endIndex));

  const badgeEl = document.getElementById('timeline-7day-badge');
  if (badgeEl && slicedData.length > 0) {
    const firstLbl = slicedData[0].label || '';
    const lastLbl = slicedData[slicedData.length - 1].label || '';
    badgeEl.textContent = `${firstLbl} - ${lastLbl} (7 Günlük)`;
  }

  if (timelineChartInstance) {
    timelineChartInstance.data.labels = slicedData.map(d => d.label);
    timelineChartInstance.data.datasets[0].data = slicedData.map(d => d.sales);
    timelineChartInstance.update();
  }
}

/* ==========================================================================
   7. TÜRKİYE GÜNCEL SİGARA KATALOĞU (TOPTANCI ALIŞ & SATIŞ FİYATLARIYLA HAZIR)
   ========================================================================== */
let CIGARETTES_DB = [
  // 1. BAT & TEKEL GRUBU (Yeni Not Listesi - En Başta)
  { id: "bat-t1", group: "bat", brand: "BAT Grubu", name: "Tekel 2000 Mavi Kısa", buyPrice: 1098.25, cartonPrice: 1130, packetPrice: 113 },
  { id: "bat-t2", group: "bat", brand: "BAT Grubu", name: "Tekel 2000 Mavi Uzun", buyPrice: 1098.25, cartonPrice: 1130, packetPrice: 113 },
  { id: "bat-t3", group: "bat", brand: "BAT Grubu", name: "Tekel 2000 Kırmızı Uzun", buyPrice: 1098.25, cartonPrice: 1130, packetPrice: 113 },
  { id: "bat-k1", group: "bat", brand: "BAT Grubu", name: "Kent Slims Black", buyPrice: 1241.50, cartonPrice: 1280, packetPrice: 128 },
  { id: "bat-k2", group: "bat", brand: "BAT Grubu", name: "Kent Slims Gray", buyPrice: 1241.50, cartonPrice: 1280, packetPrice: 128 },
  { id: "bat-k3", group: "bat", brand: "BAT Grubu", name: "Kent D-Range Blue", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "bat-k4", group: "bat", brand: "BAT Grubu", name: "Kent D-Range Gray", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "bat-k5", group: "bat", brand: "BAT Grubu", name: "Kent D-Range Blue Long", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "bat-k6", group: "bat", brand: "BAT Grubu", name: "Kent D-Range Gray Long", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "bat-k7", group: "bat", brand: "BAT Grubu", name: "Kent Switch", buyPrice: 1098.25, cartonPrice: 1130, packetPrice: 113 },
  { id: "bat-k8", group: "bat", brand: "BAT Grubu", name: "Kent White", buyPrice: 1241.50, cartonPrice: 1280, packetPrice: 128 },
  { id: "bat-r1", group: "bat", brand: "BAT Grubu", name: "Rothmans D-Range Blue", buyPrice: 1098.25, cartonPrice: 1130, packetPrice: 113 },
  { id: "bat-r2", group: "bat", brand: "BAT Grubu", name: "Rothmans D-Range Blue Long", buyPrice: 1098.25, cartonPrice: 1130, packetPrice: 113 },
  { id: "bat-r3", group: "bat", brand: "BAT Grubu", name: "Rothmans Blue", buyPrice: 1098.25, cartonPrice: 1130, packetPrice: 113 },

  // 2. PHILIP MORRIS - PARLIAMENT & MARLBORO & DİĞERLERİ (Yeni Not Listesi)
  { id: "pm-p1", group: "pm", brand: "Philip Morris", name: "Parliament Midnight Blue", buyPrice: 1193.75, cartonPrice: 1230, packetPrice: 123 },
  { id: "pm-p2", group: "pm", brand: "Philip Morris", name: "Parliament Midnight", buyPrice: 1337, cartonPrice: 1380, packetPrice: 138 },
  { id: "pm-p3", group: "pm", brand: "Philip Morris", name: "Parliament Aqua Blue Slims", buyPrice: 1241.50, cartonPrice: 1280, packetPrice: 128 },
  { id: "pm-p4", group: "pm", brand: "Philip Morris", name: "Parliament Night Blue Pack", buyPrice: 1241.50, cartonPrice: 1280, packetPrice: 128 },
  { id: "pm-p5", group: "pm", brand: "Philip Morris", name: "Parliament Night Blue", buyPrice: 1241.50, cartonPrice: 1280, packetPrice: 128 },
  { id: "pm-p6", group: "pm", brand: "Philip Morris", name: "Parliament Reserve", buyPrice: 1241.50, cartonPrice: 1280, packetPrice: 128 },
  { id: "pm-m1", group: "pm", brand: "Philip Morris", name: "Marlboro Red Long", buyPrice: 1193.75, cartonPrice: 1230, packetPrice: 123 },
  { id: "pm-m2", group: "pm", brand: "Philip Morris", name: "Marlboro Red", buyPrice: 1193.75, cartonPrice: 1230, packetPrice: 123 },
  { id: "pm-m3", group: "pm", brand: "Philip Morris", name: "Marlboro Touch", buyPrice: 1193.75, cartonPrice: 1230, packetPrice: 123 },
  { id: "pm-m4", group: "pm", brand: "Philip Morris", name: "Marlboro Touch Blue", buyPrice: 1193.75, cartonPrice: 1230, packetPrice: 123 },
  { id: "pm-m5", group: "pm", brand: "Philip Morris", name: "Marlboro Touch Gray", buyPrice: 1193.75, cartonPrice: 1230, packetPrice: 123 },
  { id: "pm-m6", group: "pm", brand: "Philip Morris", name: "Marlboro Touch White", buyPrice: 1193.75, cartonPrice: 1230, packetPrice: 123 },
  { id: "pm-m7", group: "pm", brand: "Philip Morris", name: "Marlboro Touch Slims", buyPrice: 1193.75, cartonPrice: 1230, packetPrice: 123 },
  { id: "pm-m8", group: "pm", brand: "Philip Morris", name: "Marlboro Edge", buyPrice: 1174.65, cartonPrice: 1210, packetPrice: 121 },
  { id: "pm-m9", group: "pm", brand: "Philip Morris", name: "Marlboro Edge Blue", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "pm-c1", group: "pm", brand: "Philip Morris", name: "Chesterfield Navy Blue", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "pm-c2", group: "pm", brand: "Philip Morris", name: "Chesterfield Mode", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "pm-mu1", group: "pm", brand: "Philip Morris", name: "Muratti", buyPrice: 1165.10, cartonPrice: 1200, packetPrice: 120 },
  { id: "pm-mu2", group: "pm", brand: "Philip Morris", name: "Muratti Blu Line", buyPrice: 1165.10, cartonPrice: 1200, packetPrice: 120 },
  { id: "pm-l1", group: "pm", brand: "Philip Morris", name: "Lark Blue", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "pm-l2", group: "pm", brand: "Philip Morris", name: "Lark Blue Long", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "pm-lm1", group: "pm", brand: "Philip Morris", name: "LM", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },

  // 3. JTI GRUBU - WINSTON, CAMEL, LD, MONTE CARLO
  { id: "jti-w1", group: "jti", brand: "JTI Grubu", name: "Winston Dark Blue", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "jti-w2", group: "jti", brand: "JTI Grubu", name: "Winston Dark Blue Long", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "jti-w3", group: "jti", brand: "JTI Grubu", name: "Winston Slender Blue", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "jti-w4", group: "jti", brand: "JTI Grubu", name: "Winston Slender Blue Long", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "jti-w5", group: "jti", brand: "JTI Grubu", name: "Winston Slender Gray", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "jti-w6", group: "jti", brand: "JTI Grubu", name: "Winston Slender Q Line", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "jti-w7", group: "jti", brand: "JTI Grubu", name: "Winston Red", buyPrice: 1193.75, cartonPrice: 1230, packetPrice: 123 },
  { id: "jti-w8", group: "jti", brand: "JTI Grubu", name: "Winston Blue", buyPrice: 1193.75, cartonPrice: 1230, packetPrice: 123 },
  { id: "jti-w9", group: "jti", brand: "JTI Grubu", name: "Winston Slims Blue", buyPrice: 1241.50, cartonPrice: 1280, packetPrice: 128 },
  { id: "jti-w10", group: "jti", brand: "JTI Grubu", name: "Winston Slims Gray", buyPrice: 1241.50, cartonPrice: 1280, packetPrice: 128 },
  { id: "jti-w11", group: "jti", brand: "JTI Grubu", name: "Winston Xsence Black", buyPrice: 1241.50, cartonPrice: 1280, packetPrice: 128 },
  { id: "jti-w12", group: "jti", brand: "JTI Grubu", name: "Winston Xsence Gray", buyPrice: 1241.50, cartonPrice: 1280, packetPrice: 128 },
  { id: "jti-w13", group: "jti", brand: "JTI Grubu", name: "Winston Slims Q Line", buyPrice: 1241.50, cartonPrice: 1280, packetPrice: 128 },
  { id: "jti-c1", group: "jti", brand: "JTI Grubu", name: "Camel Slender Blue", buyPrice: 1098.25, cartonPrice: 1130, packetPrice: 113 },
  { id: "jti-c2", group: "jti", brand: "JTI Grubu", name: "Camel Yellow", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "jti-c3", group: "jti", brand: "JTI Grubu", name: "Camel Yellow Long", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "jti-c4", group: "jti", brand: "JTI Grubu", name: "Camel Yellow SP", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "jti-c5", group: "jti", brand: "JTI Grubu", name: "Camel Black", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "jti-c6", group: "jti", brand: "JTI Grubu", name: "Camel White", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "jti-c7", group: "jti", brand: "JTI Grubu", name: "Camel Brown", buyPrice: 1146, cartonPrice: 1180, packetPrice: 118 },
  { id: "jti-c8", group: "jti", brand: "JTI Grubu", name: "Camel Slims Q Line", buyPrice: 1098.25, cartonPrice: 1130, packetPrice: 113 },
  { id: "jti-c9", group: "jti", brand: "JTI Grubu", name: "Camel Deep Blue", buyPrice: 1098.25, cartonPrice: 1130, packetPrice: 113 },
  { id: "jti-ld1", group: "jti", brand: "JTI Grubu", name: "LD Blue", buyPrice: 1098.25, cartonPrice: 1130, packetPrice: 113 },
  { id: "jti-ld2", group: "jti", brand: "JTI Grubu", name: "LD Blue Long", buyPrice: 1098.25, cartonPrice: 1130, packetPrice: 113 },
  { id: "jti-ld3", group: "jti", brand: "JTI Grubu", name: "LD Slims", buyPrice: 1098.25, cartonPrice: 1130, packetPrice: 113 },
  { id: "jti-mc1", group: "jti", brand: "JTI Grubu", name: "Monte Carlo Slender Dark Blue", buyPrice: 1098.25, cartonPrice: 1130, packetPrice: 113 },
  { id: "jti-mc2", group: "jti", brand: "JTI Grubu", name: "Monte Carlo Dark Blue", buyPrice: 1098.25, cartonPrice: 1130, packetPrice: 113 },

  // 4. IMPERIAL GRUBU
  { id: "imp-1", group: "imperial", brand: "Imperial", name: "Davidoff Classic / Gold", buyPrice: 1300, packetPrice: 135, cartonPrice: 1350 },
  { id: "imp-2", group: "imperial", brand: "Imperial", name: "West Red / Silver", buyPrice: 1115, packetPrice: 115, cartonPrice: 1150 },
  { id: "imp-3", group: "imperial", brand: "Imperial", name: "Polo Blue / Gray", buyPrice: 1065, packetPrice: 110, cartonPrice: 1100 }
];

/* ==========================================================================
   8. SATIŞ NOKTALARI YÖNETİMİ
   ========================================================================== */
let currentActiveDealer = null;
let currentCart = {};
let activeGroupFilter = "all";
let activeSearchQuery = "";
let targetSingleDebt = null;
let currentInvoiceData = null;

function initDealersAndSalesSystem() {
  renderDealersTable();
  setupAddDealerModal();
  setupCigaretteCatalogModal();
  setupOrderPreviewModal();
  setupPaymentModal();
}

function renderDealersTable() {
  const tbody = document.getElementById('dealers-tbody');
  if (!tbody) return;

  const searchInput = document.getElementById('input-search-dealers');
  if (searchInput && !searchInput.dataset.hasListener) {
    searchInput.dataset.hasListener = 'true';
    searchInput.oninput = () => renderDealersTable();
  }

  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const filteredDealers = query ? dealersData.filter(d =>
    (d.name && d.name.toLowerCase().includes(query)) ||
    (d.phone && d.phone.toLowerCase().includes(query)) ||
    (d.region && d.region.toLowerCase().includes(query)) ||
    (d.owner && d.owner.toLowerCase().includes(query))
  ) : dealersData;

  if (dealersData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:40px; color:#94a3b8;">
          <div style="font-size:2rem; margin-bottom:8px; color:#818cf8;"><svg class="icon-inline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
          <strong style="color:#ffffff; font-size:1rem;">Henüz kayıtlı satış noktası bulunmuyor.</strong><br>
          <span style="font-size:0.8rem; color:#64748b;">Sağ üstteki "+ Yeni Satış Noktası Ekle" butonuna tıklayarak ilk bayinizi veya marketinizi ekleyin.</span>
        </td>
      </tr>
    `;
  } else if (filteredDealers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:30px; color:#94a3b8;">
          <strong style="color:#ffffff;">Aradığınız kriterlere uygun satış noktası bulunamadı.</strong>
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = filteredDealers.map(dealer => {
      const debt = dealer.totalDebt || 0;
      const isZero = debt <= 0;
      const badgeClass = isZero ? "dealer-debt-badge-lg debt-zero" : "dealer-debt-badge-lg text-rose";
      const debtLabel = isZero ? "₺ 0 Borç" : `₺ ${debt.toLocaleString('tr-TR')} Borç`;

      return `
        <tr class="dealer-row-clickable" data-dealer-id="${dealer.id}">
          <td>
            <strong style="color:#ffffff; font-size:0.86rem;">${dealer.name}</strong>
          </td>
          <td>
            <button type="button" class="btn-table-call" data-phone="${dealer.phone || ''}" style="background:transparent; border:none; color:#38bdf8; font-size:0.75rem; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px;" title="Numarayı kopyala ve ara">
              <svg class="icon-inline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> ${dealer.phone || '-'}
            </button>
          </td>
          <td><span style="color:#94a3b8; font-size:0.75rem;">${dealer.region || '-'}</span></td>
          <td><span class="badge-tag" style="font-size:0.68rem; padding:2px 6px;">${dealer.lastOrder || 'Yeni'}</span></td>
          <td>
            <span class="${badgeClass}">${debtLabel}</span>
          </td>
          <td>
            <button class="pill-btn active btn-inspect-dealer" style="padding:4px 9px; font-size:0.72rem; font-weight:800;" data-dealer-id="${dealer.id}">Detay →</button>
          </td>
        </tr>
      `;
    }).join('');

    document.querySelectorAll('.btn-table-call').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const ph = btn.getAttribute('data-phone');
        handleDealerPhoneClick(ph);
      };
    });

    document.querySelectorAll('.dealer-row-clickable, .btn-inspect-dealer').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.btn-table-call')) return;
        const dealerId = el.getAttribute('data-dealer-id');
        openDedicatedDealerScreen(dealerId);
      });
    });
  }

  const drawerCounter = document.getElementById('drawer-dealer-counter');
  const drawerSub = document.getElementById('drawer-dealer-count-sub');
  if (drawerCounter) drawerCounter.textContent = dealersData.length;
  if (drawerSub) drawerSub.textContent = `${dealersData.length} Aktif Bayi & Market`;

  updateReceivablesBadge();
}

function updateReceivablesBadge() {
  const totalReceivables = dealersData.reduce((acc, d) => acc + (d.totalDebt || 0), 0);
  const badge = document.getElementById('drawer-receivables-badge');
  const topRec = document.getElementById('receivables-total-top-badge');

  const formatted = `₺ ${totalReceivables.toLocaleString('tr-TR')}`;
  if (badge) badge.textContent = formatted;
  if (topRec) topRec.textContent = `TOPLAM: ${formatted}`;

  updateDashboardMetrics();
  renderDebtLists();
}

function openDedicatedDealerScreen(dealerId) {
  const dealer = dealersData.find(d => d.id === dealerId);
  if (!dealer) return;

  currentActiveDealer = dealer;

  switchToPage('dealer-detail');

  // Avatar Baş Harfleri
  const avatarEl = document.getElementById('detail-dealer-avatar');
  if (avatarEl) {
    const initials = (dealer.name || 'SN')
      .trim()
      .split(/\s+/)
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    avatarEl.textContent = initials || 'SN';
  }

  document.getElementById('detail-dealer-name').textContent = dealer.name;

  const debtBadge = document.getElementById('detail-dealer-debt-badge');
  const totalDebt = dealer.totalDebt || 0;
  if (debtBadge) {
    debtBadge.textContent = `₺ ${totalDebt.toLocaleString('tr-TR')} Borç`;
    if (totalDebt <= 0) {
      debtBadge.className = "dealer-debt-badge-lg debt-zero";
      debtBadge.textContent = "₺ 0 Borçsuz";
    } else {
      debtBadge.className = "dealer-debt-badge-lg text-rose";
    }
  }

  document.getElementById('detail-dealer-region-text').textContent = `${dealer.region || 'Bölge Belirtilmedi'}`;

  const phoneTextEl = document.getElementById('detail-dealer-phone-text');
  const phoneBtn = document.getElementById('btn-call-dealer-phone');
  const rawPhone = dealer.phone && dealer.phone.trim() !== '' ? dealer.phone : 'Telefon Belirtilmedi';

  if (phoneTextEl) phoneTextEl.textContent = rawPhone;

  if (phoneBtn) {
    phoneBtn.onclick = () => {
      handleDealerPhoneClick(dealer.phone);
    };
  }

  document.getElementById('detail-dealer-last-order-text').textContent = `Son Sipariş: ${dealer.lastOrder || 'Yeni Kayıt'}`;

  renderDealerDebtsList(dealer);
  renderDealerSalesList(dealer);

  const createSaleBtn = document.getElementById('btn-open-create-sale');
  if (createSaleBtn) {
    createSaleBtn.onclick = () => openCigaretteCatalogModal(dealer);
  }

  const bulkPayBtn = document.getElementById('btn-open-bulk-debt-pay');
  if (bulkPayBtn) {
    bulkPayBtn.onclick = () => openBulkDebtPayModal(dealer);
  }

  const customPriceBtn = document.getElementById('btn-open-custom-price-modal');
  if (customPriceBtn) {
    customPriceBtn.onclick = () => openCustomPriceModal(dealer);
  }
}

/**
 * Telefon Numarası Kopyalama ve Telefon Uygulaması Başlatma Yardımcısı
 */
function handleDealerPhoneClick(phone) {
  if (!phone || phone.trim() === '' || phone === 'Telefon Belirtilmedi') {
    showToast("Bu satış noktasına ait kayıtlı telefon numarası bulunmuyor.", "warning");
    return;
  }

  const cleanDigits = phone.replace(/[^0-9+]/g, '');

  // 1. Panoya Kopyala
  copyToClipboard(phone);

  // 2. Telefon Arama Ekranını Açmaya Çalış
  try {
    window.location.href = `tel:${cleanDigits}`;
    showToast(`${phone} kopyalandı ve arama ekranına yönlendirildi.`, "success");
  } catch (err) {
    showToast(`${phone} panoya kopyalandı. Bu cihaz üzerinden arama gerçekleştirilemez.`, "warning");
  }
}

/**
 * Android WebView'de tel: uygulaması bulunamadığında tetiklenen callback
 */
window.onPhoneDialerUnavailable = function (phone) {
  showToast(`${phone || ''} panoya kopyalandı. Bu cihaz üzerinden arama gerçekleştirilemez.`, "warning");
};

/**
 * Panoya Kopyalama Fonksiyonu
 */
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {
      fallbackCopyText(text);
    });
  } else {
    fallbackCopyText(text);
  }
}

function fallbackCopyText(text) {
  const tempInp = document.createElement('input');
  tempInp.value = text;
  document.body.appendChild(tempInp);
  tempInp.select();
  try {
    document.execCommand('copy');
  } catch (e) { }
  document.body.removeChild(tempInp);
}

/**
 * Yüzen Şık Toast Bildirim Gösterici
 */
function showToast(message, type = 'success') {
  let container = document.getElementById('app-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'app-toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-message toast-${type}`;
  toast.innerHTML = `
    <span style="font-size:1.05rem;">${type === 'success' ? '✓' : type === 'warning' ? '!' : 'i'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px) scale(0.9)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 4000);
}

function renderDealerDebtsList(dealer) {
  const tbody = document.getElementById('dealer-debts-tbody');
  const countBadge = document.getElementById('detail-debt-count-badge');
  if (!tbody) return;

  const activeDebts = (dealer.debts || []).filter(d => d.remaining > 0);
  if (countBadge) countBadge.textContent = `${activeDebts.length} Aktif Borç`;

  if (!dealer.debts || dealer.debts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#64748b; padding:24px;">Bu satış noktasına ait henüz herhangi bir borç kaydı bulunmuyor.</td></tr>`;
    return;
  }

  tbody.innerHTML = dealer.debts.map(debt => {
    const isPaid = debt.remaining <= 0;
    const badgeStyle = isPaid
      ? "background:rgba(16,185,129,0.15); color:#34d399;"
      : "background:rgba(244,63,94,0.15); color:#fb7185;";
    const statusText = isPaid ? "Ödendi (Kapatıldı)" : debt.status;

    return `
      <tr>
        <td><strong>${debt.date}</strong></td>
        <td>${debt.desc}</td>
        <td><span style="color:#94a3b8;">${debt.dueDate || '-'}</span></td>
        <td style="font-family:var(--font-mono); font-weight:700; color:#cbd5e1;">₺ ${debt.amount.toLocaleString('tr-TR')}</td>
        <td style="font-family:var(--font-mono); font-weight:800; color:${isPaid ? '#10b981' : '#f43f5e'};">
          ₺ ${debt.remaining.toLocaleString('tr-TR')}
        </td>
        <td><span class="badge-tag" style="${badgeStyle}">${statusText}</span></td>
        <td style="text-align:right;">
          <div style="display:flex; gap:6px; justify-content:flex-end; align-items:center;">
            ${!isPaid ? `
              <button class="btn-pay-single-debt" data-debt-id="${debt.id}">
                Borç Öde
              </button>
            ` : `
              <span style="color:#10b981; font-weight:700; font-size:0.75rem; margin-right:4px;">Kapandı</span>
            `}
            <button class="btn-amber btn-edit-single-debt" data-debt-id="${debt.id}" style="padding:5px 10px; font-size:0.72rem; font-weight:800; cursor:pointer;">
              <svg class="icon-inline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Düzenle
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  document.querySelectorAll('.btn-edit-single-debt').forEach(btn => {
    btn.onclick = () => {
      const debtId = btn.getAttribute('data-debt-id');
      openEditPendingDebtModal(debtId);
    };
  });

  document.querySelectorAll('.btn-pay-single-debt').forEach(btn => {
    btn.onclick = () => {
      const debtId = btn.getAttribute('data-debt-id');
      const debt = dealer.debts.find(d => d.id === debtId);
      if (debt) {
        openSingleDebtPayModal(debt);
      }
    };
  });
}

function renderDealerSalesList(dealer) {
  const tbody = document.getElementById('dealer-sales-tbody');
  const countBadge = document.getElementById('detail-sales-count-badge');
  if (!tbody) return;

  if (countBadge) countBadge.textContent = `${(dealer.sales || []).length} Satış`;

  if (!dealer.sales || dealer.sales.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#64748b; padding:24px;">Henüz bu satış noktasına ait sipariş kaydı bulunmuyor.</td></tr>`;
    return;
  }

  tbody.innerHTML = dealer.sales.map(sale => `
    <tr>
      <td><strong>${sale.date}</strong></td>
      <td style="text-align:center;">
        <button type="button" class="btn-view-sale-trigger" data-sale-id="${sale.id}" style="padding:6px 14px; font-size:0.75rem; font-weight:800; background:rgba(0,242,254,0.1); border:1px solid rgba(0,242,254,0.3); color:#00f2fe; border-radius:6px; cursor:pointer; display:inline-flex; align-items:center; gap:5px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Satışı Görüntüle
        </button>
      </td>
      <td style="font-family:var(--font-mono); font-weight:800; color:#00f2fe;">₺ ${sale.total.toLocaleString('tr-TR')}</td>
      <td style="font-family:var(--font-mono); font-weight:700; color:#10b981;">₺ ${sale.paid.toLocaleString('tr-TR')}</td>
      <td style="font-family:var(--font-mono); font-weight:700; color:${sale.debt > 0 ? '#f43f5e' : '#64748b'};">
        ₺ ${sale.debt.toLocaleString('tr-TR')}
      </td>
      <td><span class="badge-tag" style="font-family:var(--font-mono);">${sale.receipt}</span></td>
      <td style="text-align:center;">
        <button type="button" class="btn-delete-sale" data-sale-id="${sale.id}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Sil
        </button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.btn-view-sale-trigger').forEach(btn => {
    btn.onclick = () => {
      const saleId = btn.getAttribute('data-sale-id');
      const sale = (dealer.sales || []).find(s => s.id === saleId);
      if (sale) {
        openViewSaleDetailModal(sale, dealer);
      }
    };
  });

  document.querySelectorAll('.btn-delete-sale').forEach(btn => {
    btn.onclick = () => {
      const saleId = btn.getAttribute('data-sale-id');
      initiateSaleDeletionProcess(dealer, saleId);
    };
  });
}

/* ==========================================================================
   9. BORÇ ÖDEME (TEKİL VE TOPTAN) & TAHSİLAT MAKBUZU
   ========================================================================== */
function setupDebtPaymentModals() {
  const singleModal = document.getElementById('modal-single-debt-pay');
  const closeSingleBtn = document.getElementById('btn-close-single-debt-pay');
  const cancelSingleBtn = document.getElementById('btn-cancel-single-debt-pay');
  const singleInput = document.getElementById('input-single-debt-pay-amount');
  const singleFullPayPill = document.getElementById('btn-single-debt-full-pay');
  const singleFullCheck = document.getElementById('single-debt-full-check');
  const confirmSingleBtn = document.getElementById('btn-confirm-single-debt-pay');

  if (closeSingleBtn) closeSingleBtn.onclick = () => singleModal.classList.add('hidden');
  if (cancelSingleBtn) cancelSingleBtn.onclick = () => singleModal.classList.add('hidden');

  if (singleInput) {
    singleInput.oninput = () => {
      if (!targetSingleDebt) return;
      const val = parseFloat(singleInput.value) || 0;
      updateSingleDebtPreview(val);
      if (val >= targetSingleDebt.remaining && singleFullCheck) {
        singleFullCheck.classList.add('checked');
      } else if (singleFullCheck) {
        singleFullCheck.classList.remove('checked');
      }
    };
  }

  if (singleFullPayPill) {
    singleFullPayPill.onclick = () => {
      if (!targetSingleDebt) return;
      singleInput.value = targetSingleDebt.remaining;
      updateSingleDebtPreview(targetSingleDebt.remaining);
      if (singleFullCheck) singleFullCheck.classList.add('checked');
    };
  }

  if (confirmSingleBtn) {
    confirmSingleBtn.onclick = () => {
      if (!targetSingleDebt || !currentActiveDealer) return;
      const payAmount = Math.min(targetSingleDebt.remaining, Math.max(0, parseFloat(singleInput.value) || 0));
      if (payAmount <= 0) {
        alert("Lütfen geçerli bir ödeme tutarı giriniz!");
        return;
      }

      const prevTotalDebt = currentActiveDealer.totalDebt || 0;
      targetSingleDebt.remaining -= payAmount;
      currentActiveDealer.totalDebt = Math.max(0, prevTotalDebt - payAmount);

      if (targetSingleDebt.remaining <= 0) {
        targetSingleDebt.status = "Ödendi (Kapatıldı)";
      } else {
        targetSingleDebt.status = "Kısmi Ödendi";
      }

      saveDealersToStorage();
      singleModal.classList.add('hidden');
      openDedicatedDealerScreen(currentActiveDealer.id);
      renderDealersTable();

      // Borç Ödeme Faturası / Tahsilat Makbuzu Aç
      openPaymentReceiptModal({
        isBulk: false,
        dealerName: currentActiveDealer.name,
        dealerPhone: currentActiveDealer.phone || '',
        dealerRegion: currentActiveDealer.region || '',
        prevTotalDebt: prevTotalDebt,
        paidDebtAmount: payAmount,
        remainingTotalDebt: currentActiveDealer.totalDebt,
        desc: targetSingleDebt.desc,
        receiptNo: "MAK-" + Math.floor(1000 + Math.random() * 9000),
        dateStr: "27 Ağustos 2026 " + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      });
    };
  }

  const bulkModal = document.getElementById('modal-bulk-debt-pay');
  const closeBulkBtn = document.getElementById('btn-close-bulk-debt-pay');
  const cancelBulkBtn = document.getElementById('btn-cancel-bulk-debt-pay');
  const bulkInput = document.getElementById('input-bulk-debt-amount');
  const bulkFullPayPill = document.getElementById('btn-bulk-debt-full-pay');
  const bulkFullCheck = document.getElementById('bulk-debt-full-check');
  const confirmBulkBtn = document.getElementById('btn-confirm-bulk-debt-pay');

  if (closeBulkBtn) closeBulkBtn.onclick = () => bulkModal.classList.add('hidden');
  if (cancelBulkBtn) cancelBulkBtn.onclick = () => bulkModal.classList.add('hidden');

  if (bulkInput) {
    bulkInput.oninput = () => {
      if (!currentActiveDealer) return;
      const val = parseFloat(bulkInput.value) || 0;
      updateBulkDebtPreview(val);
      if (val >= (currentActiveDealer.totalDebt || 0) && bulkFullCheck) {
        bulkFullCheck.classList.add('checked');
      } else if (bulkFullCheck) {
        bulkFullCheck.classList.remove('checked');
      }
    };
  }

  if (bulkFullPayPill) {
    bulkFullPayPill.onclick = () => {
      if (!currentActiveDealer) return;
      bulkInput.value = currentActiveDealer.totalDebt || 0;
      updateBulkDebtPreview(currentActiveDealer.totalDebt || 0);
      if (bulkFullCheck) bulkFullCheck.classList.add('checked');
    };
  }

  if (confirmBulkBtn) {
    confirmBulkBtn.onclick = () => {
      if (!currentActiveDealer) return;
      const totalPay = Math.min(currentActiveDealer.totalDebt || 0, Math.max(0, parseFloat(bulkInput.value) || 0));
      if (totalPay <= 0) {
        alert("Lütfen geçerli bir tahsilat tutarı giriniz!");
        return;
      }

      const prevTotalDebt = currentActiveDealer.totalDebt || 0;
      let payPool = totalPay;
      currentActiveDealer.totalDebt = Math.max(0, prevTotalDebt - totalPay);

      (currentActiveDealer.debts || []).forEach(debt => {
        if (debt.remaining > 0 && payPool > 0) {
          if (payPool >= debt.remaining) {
            payPool -= debt.remaining;
            debt.remaining = 0;
            debt.status = "Ödendi (Kapatıldı)";
          } else {
            debt.remaining -= payPool;
            debt.status = "Kısmi Ödendi";
            payPool = 0;
          }
        }
      });

      saveDealersToStorage();
      bulkModal.classList.add('hidden');
      openDedicatedDealerScreen(currentActiveDealer.id);
      renderDealersTable();

      openPaymentReceiptModal({
        isBulk: true,
        dealerName: currentActiveDealer.name,
        dealerPhone: currentActiveDealer.phone || '',
        dealerRegion: currentActiveDealer.region || '',
        prevTotalDebt: prevTotalDebt,
        paidDebtAmount: totalPay,
        remainingTotalDebt: currentActiveDealer.totalDebt,
        desc: "Toptan Borç Tahsilatı (FIFO)",
        receiptNo: "MAK-" + Math.floor(1000 + Math.random() * 9000),
        dateStr: "27 Ağustos 2026 " + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      });
    };
  }
}

function openSingleDebtPayModal(debt) {
  targetSingleDebt = debt;
  const modal = document.getElementById('modal-single-debt-pay');
  const subEl = document.getElementById('single-debt-modal-sub');
  const remEl = document.getElementById('single-debt-current-remaining');
  const inputEl = document.getElementById('input-single-debt-pay-amount');
  const fullCheck = document.getElementById('single-debt-full-check');

  if (subEl) subEl.textContent = `${debt.desc} (${debt.date})`;
  if (remEl) remEl.textContent = `₺ ${debt.remaining.toLocaleString('tr-TR')}`;
  if (inputEl) inputEl.value = debt.remaining;
  if (fullCheck) fullCheck.classList.add('checked');

  updateSingleDebtPreview(debt.remaining);

  if (modal) modal.classList.remove('hidden');
}

function updateSingleDebtPreview(payAmount) {
  if (!targetSingleDebt) return;
  const afterRemaining = Math.max(0, targetSingleDebt.remaining - payAmount);
  const afterValEl = document.getElementById('single-debt-after-val');
  const descEl = document.getElementById('single-debt-after-desc');

  if (afterValEl) {
    afterValEl.textContent = `₺ ${afterRemaining.toLocaleString('tr-TR')} Kalan`;
    afterValEl.style.color = afterRemaining === 0 ? '#10b981' : '#f43f5e';
  }
  if (descEl) {
    descEl.textContent = afterRemaining === 0
      ? "Bu borç kaydı tamamen kapatılacaktır."
      : `Bu kayıtta ₺${afterRemaining.toLocaleString('tr-TR')} borç bakiyesi kalacaktır.`;
  }
}

function openBulkDebtPayModal(dealer) {
  const modal = document.getElementById('modal-bulk-debt-pay');
  const nameEl = document.getElementById('bulk-debt-dealer-name');
  const totalEl = document.getElementById('bulk-debt-total-amount');
  const inputEl = document.getElementById('input-bulk-debt-amount');
  const fullCheck = document.getElementById('bulk-debt-full-check');

  if (!dealer.totalDebt || dealer.totalDebt <= 0) {
    alert("Bu satış noktasının ödenmemiş herhangi bir borcu bulunmuyor!");
    return;
  }

  if (nameEl) nameEl.textContent = `Satış Noktası: ${dealer.name}`;
  if (totalEl) totalEl.textContent = `₺ ${(dealer.totalDebt || 0).toLocaleString('tr-TR')}`;
  if (inputEl) inputEl.value = dealer.totalDebt || 0;
  if (fullCheck) fullCheck.classList.add('checked');

  updateBulkDebtPreview(dealer.totalDebt || 0);

  if (modal) modal.classList.remove('hidden');
}

function updateBulkDebtPreview(payAmount) {
  if (!currentActiveDealer) return;
  const afterRemaining = Math.max(0, (currentActiveDealer.totalDebt || 0) - payAmount);
  const afterValEl = document.getElementById('bulk-debt-after-val');
  const descEl = document.getElementById('bulk-debt-alert-desc');

  if (afterValEl) {
    afterValEl.textContent = `₺ ${afterRemaining.toLocaleString('tr-TR')} Kalan`;
    afterValEl.style.color = afterRemaining === 0 ? '#10b981' : '#f43f5e';
  }
  if (descEl) {
    descEl.textContent = afterRemaining === 0
      ? "Tüm geçmiş borçlar sırasıyla tamamen kapatılacaktır."
      : `Ödenen ₺${payAmount.toLocaleString('tr-TR')}, en eski borçtan başlanarak düşülecektir. Kalan borç: ₺${afterRemaining.toLocaleString('tr-TR')}.`;
  }
}

/* 10. Yeni Satış Noktası Ekleme Modalı */
function setupAddDealerModal() {
  const openBtn = document.getElementById('btn-open-add-dealer-modal');
  const modal = document.getElementById('modal-add-dealer');
  const closeBtn = document.getElementById('btn-close-add-dealer');
  const cancelBtn = document.getElementById('btn-cancel-add-dealer');
  const form = document.getElementById('form-add-dealer');

  function open() { modal.classList.remove('hidden'); }
  function close() { modal.classList.add('hidden'); form.reset(); }

  if (openBtn) openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (cancelBtn) cancelBtn.addEventListener('click', close);

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('input-dealer-name').value.trim();
      const phone = document.getElementById('input-dealer-phone').value.trim();
      const region = document.getElementById('input-dealer-region').value.trim() || 'İstanbul';
      const debtVal = parseFloat(document.getElementById('input-dealer-debt').value) || 0;

      if (!name) return;

      const newDealer = {
        id: "dealer-" + Date.now(),
        name: name,
        phone: phone,
        region: region,
        lastOrder: "Yeni Eklendi",
        totalDebt: debtVal,
        customPrices: {},
        debts: debtVal > 0 ? [
          {
            id: "d-init-" + Date.now(),
            date: "27 Ağustos 2026",
            desc: "Açılış Bakiye / Devreden Borç",
            dueDate: "15 Eylül 2026",
            amount: debtVal,
            remaining: debtVal,
            status: "Devir Borcu"
          }
        ] : [],
        sales: []
      };

      dealersData.unshift(newDealer);
      saveDealersToStorage();
      close();
      renderDealersTable();
      openDedicatedDealerScreen(newDealer.id);
    });
  }
}

/* ==========================================================================
   11. SİGARA KATALOĞU & SİPARİŞ OLUŞTURMA SİSTEMİ (Özel Fiyat Entegrasyonlu)
   ========================================================================== */
function getEffectiveCigarettePrice(cig, dealer) {
  const custom = dealer?.customPrices?.[cig.id];
  if (custom && custom.cartonPrice !== undefined && custom.cartonPrice !== null) {
    const cartonPrice = parseFloat(custom.cartonPrice) || 0;
    const packetPrice = custom.packetPrice !== undefined ? parseFloat(custom.packetPrice) : Math.round((cartonPrice / 10) * 10) / 10;
    return { packetPrice, cartonPrice, isCustom: true };
  }
  return { packetPrice: cig.packetPrice, cartonPrice: cig.cartonPrice, isCustom: false };
}

function setupCigaretteCatalogModal() {
  const modal = document.getElementById('modal-create-sale');
  const closeBtn = document.getElementById('btn-close-create-sale');
  const cancelBtn = document.getElementById('btn-cancel-create-sale');
  const searchInput = document.getElementById('input-search-cigarette');
  const filterChips = document.querySelectorAll('#group-filter-chips .filter-chip');
  const proceedBtn = document.getElementById('btn-proceed-to-preview');

  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      activeSearchQuery = e.target.value.toLowerCase();
      renderCigaretteList();
    });
  }

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeGroupFilter = chip.getAttribute('data-group');
      renderCigaretteList();
    });
  });

  if (proceedBtn) {
    proceedBtn.addEventListener('click', () => {
      const selectedItems = getSelectedCartItems();
      if (selectedItems.length === 0) {
        alert("Lütfen en az bir adet veya karton ürün seçiniz!");
        return;
      }
      modal.classList.add('hidden');
      openOrderPreviewModal();
    });
  }
}

function openCigaretteCatalogModal(dealer) {
  currentCart = {};
  activeSearchQuery = "";
  activeGroupFilter = "all";

  const searchInput = document.getElementById('input-search-cigarette');
  if (searchInput) searchInput.value = "";

  const titleEl = document.getElementById('catalog-target-dealer-name');
  if (titleEl) titleEl.textContent = `Satış Oluştur: ${dealer.name}`;

  renderCigaretteList();
  updateLiveCatalogTotal();

  const modal = document.getElementById('modal-create-sale');
  if (modal) modal.classList.remove('hidden');
}

/**
 * Türkçe ve Yazım Hatalarını Tolere Eden Gelişmiş Arama Normalizasyonu
 */
function normalizeCigSearch(str) {
  if (!str) return '';
  let s = str.toLowerCase().trim();
  s = s.replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

  // Türkçe fonetik / yaygın harf hatası dönüşümleri
  s = s.replace(/malboro/g, 'marlboro')
    .replace(/marboro/g, 'marlboro')
    .replace(/marlbro/g, 'marlboro')
    .replace(/vinston/g, 'winston')
    .replace(/winstn/g, 'winston')
    .replace(/kamel/g, 'camel')
    .replace(/parlyament/g, 'parliament')
    .replace(/parliamunt/g, 'parliament')
    .replace(/rotmans/g, 'rothmans')
    .replace(/murati/g, 'muratti');

  return s;
}

function renderCigaretteList() {
  const container = document.getElementById('cigarette-list-container');
  if (!container) return;

  const queryNorm = normalizeCigSearch(activeSearchQuery);

  const filtered = CIGARETTES_DB.filter(item => {
    const matchGroup = (activeGroupFilter === 'all') || (item.group === activeGroupFilter);
    if (!matchGroup) return false;
    if (!queryNorm) return true;

    const nameNorm = normalizeCigSearch(item.name);
    const brandNorm = normalizeCigSearch(item.brand);

    return nameNorm.includes(queryNorm) || brandNorm.includes(queryNorm);
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:#64748b; padding:40px;">Aradığınız kriterlere uygun sigara bulunamadı.</div>`;
    return;
  }

  container.innerHTML = filtered.map(cig => {
    const prices = getEffectiveCigarettePrice(cig, currentActiveDealer);
    const cartItem = currentCart[cig.id] || { packetQty: 0, cartonQty: 0 };
    const subtotal = (cartItem.packetQty * prices.packetPrice) + (cartItem.cartonQty * prices.cartonPrice);
    const availableStock = inventoryStock[cig.id] || 0;
    const stockInfo = formatStockQuantity(availableStock);

    return `
      <div class="cigarette-row-card draggable-card" draggable="true" data-cig-id="${cig.id}">
        <div style="display:flex; align-items:center;">
          <div class="drag-handle" title="Sıralamayı değiştirmek için basılı tutup sürükleyin">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
          </div>
          <div class="cig-info">
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="cig-brand-tag">${cig.brand}</span>
              ${prices.isCustom ? '<span class="badge-tag" style="background:rgba(99,102,241,0.2); color:#a5b4fc; font-size:0.65rem;">Özel Fiyat</span>' : ''}
            </div>
            <span class="cig-name">${cig.name}</span>
            <div class="cig-prices" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:3px;">
              <span class="price-item-packet">Paket: ₺${prices.packetPrice}</span>
              <span>•</span>
              <span class="price-item-carton">Karton: ₺${prices.cartonPrice}</span>
              <span>•</span>
              <span class="stock-fraction-tag ${stockInfo.packets > 0 ? 'has-loose' : ''}" style="font-size:0.7rem; padding:2px 8px; ${availableStock <= 0 ? 'background:rgba(244,63,94,0.1); color:#f87171;' : ''}">
                Stok: ${stockInfo.text}
              </span>
            </div>
          </div>
        </div>

        <div class="cig-controls-group">
          <!-- Adet (Paket) Kontrolü -->
          <div class="qty-control-box">
            <span class="qty-label packet">Adet (Paket)</span>
            <div class="stepper-wrap">
              <button class="step-btn btn-packet-minus" data-id="${cig.id}">-</button>
              <input type="number" class="qty-input input-packet-qty" data-id="${cig.id}" value="${cartItem.packetQty}" min="0" />
              <button class="step-btn btn-packet-plus" data-id="${cig.id}">+</button>
            </div>
          </div>

          <!-- Karton Kontrolü -->
          <div class="qty-control-box">
            <span class="qty-label carton">Karton</span>
            <div class="stepper-wrap">
              <button class="step-btn btn-carton-minus" data-id="${cig.id}">-</button>
              <input type="number" class="qty-input input-carton-qty" data-id="${cig.id}" value="${cartItem.cartonQty}" min="0" />
              <button class="step-btn btn-carton-plus" data-id="${cig.id}">+</button>
            </div>
          </div>

          <!-- Kalem Ara Toplamı -->
          <div class="cig-subtotal" id="subtotal-${cig.id}">
            ₺ ${subtotal.toLocaleString('tr-TR')}
          </div>
        </div>
      </div>
    `;
  }).join('');

  bindCigaretteSteppers();
  setupListReordering('cigarette-list-container');
}

function showOutOfStockAlertModal(cigName, currentStockCartons = 0) {
  const modal = document.getElementById('modal-out-of-stock-alert');
  const descEl = document.getElementById('out-of-stock-modal-desc');
  const closeBtn = document.getElementById('btn-close-out-of-stock-modal');

  if (descEl) {
    if (currentStockCartons <= 0) {
      descEl.innerHTML = `<strong>${cigName || 'Bu sigara'}</strong> için deponuzda mevcut stok bulunmamaktadır (<strong>0 Karton</strong>). Satış yapabilmek için lütfen önce bayiden veya fabrikadan toptan alım gerçekleştiriniz.`;
    } else {
      const formatted = formatStockQuantity(currentStockCartons);
      descEl.innerHTML = `Deponuzda <strong>${cigName || 'bu sigara'}</strong> için yalnızca <strong>${formatted.text}</strong> stok kalmıştır. Daha fazla miktar ekleyemezsiniz.`;
    }
  }

  if (modal) {
    modal.classList.remove('hidden');
    if (closeBtn) {
      closeBtn.onclick = () => modal.classList.add('hidden');
    }
    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    };
  }

  try {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([100, 50, 100]);
    }
  } catch(e) {}
}

function bindCigaretteSteppers() {
  document.querySelectorAll('.btn-packet-plus').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      const stockCartons = inventoryStock[id] !== undefined ? inventoryStock[id] : 0;
      const stockPackets = Math.round(stockCartons * 10);
      const currentCartPackets = ((currentCart[id]?.cartonQty || 0) * 10) + (currentCart[id]?.packetQty || 0);

      if (stockCartons <= 0 || (currentCartPackets + 1) > stockPackets) {
        const cig = CIGARETTES_DB.find(c => c.id === id);
        showOutOfStockAlertModal(cig ? cig.name : '', stockCartons);
        return;
      }

      if (!currentCart[id]) currentCart[id] = { packetQty: 0, cartonQty: 0 };
      currentCart[id].packetQty++;
      updateRowQty(id);
    };
  });

  document.querySelectorAll('.btn-packet-minus').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      if (currentCart[id] && currentCart[id].packetQty > 0) {
        currentCart[id].packetQty--;
        updateRowQty(id);
      }
    };
  });

  document.querySelectorAll('.btn-carton-plus').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      const stockCartons = inventoryStock[id] !== undefined ? inventoryStock[id] : 0;
      const stockPackets = Math.round(stockCartons * 10);
      const currentCartPackets = ((currentCart[id]?.cartonQty || 0) * 10) + (currentCart[id]?.packetQty || 0);

      if (stockCartons <= 0 || (currentCartPackets + 10) > stockPackets) {
        const cig = CIGARETTES_DB.find(c => c.id === id);
        showOutOfStockAlertModal(cig ? cig.name : '', stockCartons);
        return;
      }

      if (!currentCart[id]) currentCart[id] = { packetQty: 0, cartonQty: 0 };
      currentCart[id].cartonQty++;
      updateRowQty(id);
    };
  });

  document.querySelectorAll('.btn-carton-minus').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      if (currentCart[id] && currentCart[id].cartonQty > 0) {
        currentCart[id].cartonQty--;
        updateRowQty(id);
      }
    };
  });

  document.querySelectorAll('.input-packet-qty').forEach(inp => {
    inp.onchange = () => {
      const id = inp.getAttribute('data-id');
      const stockCartons = inventoryStock[id] !== undefined ? inventoryStock[id] : 0;
      const stockPackets = Math.round(stockCartons * 10);
      const val = Math.max(0, parseInt(inp.value) || 0);
      const otherPackets = (currentCart[id]?.cartonQty || 0) * 10;

      if (stockCartons <= 0 || (otherPackets + val) > stockPackets) {
        const cig = CIGARETTES_DB.find(c => c.id === id);
        showOutOfStockAlertModal(cig ? cig.name : '', stockCartons);
        inp.value = currentCart[id]?.packetQty || 0;
        return;
      }

      if (!currentCart[id]) currentCart[id] = { packetQty: 0, cartonQty: 0 };
      currentCart[id].packetQty = val;
      updateRowQty(id);
    };
  });

  document.querySelectorAll('.input-carton-qty').forEach(inp => {
    inp.onchange = () => {
      const id = inp.getAttribute('data-id');
      const stockCartons = inventoryStock[id] !== undefined ? inventoryStock[id] : 0;
      const stockPackets = Math.round(stockCartons * 10);
      const val = Math.max(0, parseInt(inp.value) || 0);
      const otherPackets = (currentCart[id]?.packetQty || 0);

      if (stockCartons <= 0 || ((val * 10) + otherPackets) > stockPackets) {
        const cig = CIGARETTES_DB.find(c => c.id === id);
        showOutOfStockAlertModal(cig ? cig.name : '', stockCartons);
        inp.value = currentCart[id]?.cartonQty || 0;
        return;
      }

      if (!currentCart[id]) currentCart[id] = { packetQty: 0, cartonQty: 0 };
      currentCart[id].cartonQty = val;
      updateRowQty(id);
    };
  });
}

function updateRowQty(cigId) {
  const cig = CIGARETTES_DB.find(c => c.id === cigId);
  const prices = getEffectiveCigarettePrice(cig, currentActiveDealer);
  const cartItem = currentCart[cigId] || { packetQty: 0, cartonQty: 0 };

  const pInput = document.querySelector(`.input-packet-qty[data-id="${cigId}"]`);
  const cInput = document.querySelector(`.input-carton-qty[data-id="${cigId}"]`);
  const subtotalEl = document.getElementById(`subtotal-${cigId}`);

  if (pInput) pInput.value = cartItem.packetQty;
  if (cInput) cInput.value = cartItem.cartonQty;

  if (subtotalEl && cig) {
    const sub = (cartItem.packetQty * prices.packetPrice) + (cartItem.cartonQty * prices.cartonPrice);
    subtotalEl.textContent = `₺ ${sub.toLocaleString('tr-TR')}`;
  }

  updateLiveCatalogTotal();
}

function updateLiveCatalogTotal() {
  let grandTotal = 0;
  let itemCount = 0;

  Object.keys(currentCart).forEach(cigId => {
    const cig = CIGARETTES_DB.find(c => c.id === cigId);
    const cart = currentCart[cigId];
    if (cig && cart) {
      const prices = getEffectiveCigarettePrice(cig, currentActiveDealer);
      if (cart.packetQty > 0 || cart.cartonQty > 0) {
        grandTotal += (cart.packetQty * prices.packetPrice) + (cart.cartonQty * prices.cartonPrice);
        itemCount++;
      }
    }
  });

  const totalEl = document.getElementById('catalog-live-total');
  const countText = document.getElementById('catalog-item-count-text');

  if (totalEl) totalEl.textContent = `₺ ${grandTotal.toLocaleString('tr-TR')}`;
  if (countText) countText.textContent = `${itemCount} kalem ürün seçildi`;
}

function getSelectedCartItems() {
  const result = [];
  Object.keys(currentCart).forEach(cigId => {
    const cig = CIGARETTES_DB.find(c => c.id === cigId);
    const cart = currentCart[cigId];
    if (cig && cart) {
      const prices = getEffectiveCigarettePrice(cig, currentActiveDealer);
      if (cart.cartonQty > 0) {
        result.push({
          cigId: cig.id,
          name: cig.name,
          brand: cig.brand,
          type: "carton",
          typeName: "Karton",
          unitPrice: prices.cartonPrice,
          qty: cart.cartonQty,
          total: cart.cartonQty * prices.cartonPrice
        });
      }
      if (cart.packetQty > 0) {
        result.push({
          cigId: cig.id,
          name: cig.name,
          brand: cig.brand,
          type: "packet",
          typeName: "Adet (Paket)",
          unitPrice: prices.packetPrice,
          qty: cart.packetQty,
          total: cart.packetQty * prices.packetPrice
        });
      }
    }
  });
  return result;
}

/* ==========================================================================
   12. SİPARİŞ ÖNİZLEME MODALI
   ========================================================================== */
function setupOrderPreviewModal() {
  const modal = document.getElementById('modal-order-preview');
  const closeBtn = document.getElementById('btn-close-preview');
  const backBtn = document.getElementById('btn-back-to-catalog');
  const confirmBtn = document.getElementById('btn-confirm-sale-to-payment');

  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      const catalogModal = document.getElementById('modal-create-sale');
      if (catalogModal) catalogModal.classList.remove('hidden');
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      openPaymentModal();
    });
  }
}

function openOrderPreviewModal() {
  const modal = document.getElementById('modal-order-preview');
  const container = document.getElementById('preview-items-list');
  const totalEl = document.getElementById('preview-final-total');

  const items = getSelectedCartItems();
  let total = 0;

  if (container) {
    container.innerHTML = items.map((item, idx) => {
      total += item.total;
      const isCarton = item.type === "carton";
      const badgeClass = isCarton ? "carton-blue" : "packet-green";

      return `
        <div class="preview-row">
          <div>
            <span class="preview-type-badge ${badgeClass}">${item.typeName}</span>
            <strong style="color:#fff;">${item.name}</strong>
            <div style="font-size:0.75rem; color:#94a3b8; margin-top:2px;">
              Birim: ₺${item.unitPrice.toLocaleString('tr-TR')}
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:16px;">
            <div class="stepper-wrap">
              <button class="step-btn preview-minus" data-idx="${idx}">-</button>
              <span style="font-family:var(--font-mono); font-weight:800; width:36px; text-align:center; color:#fff;">${item.qty}</span>
              <button class="step-btn preview-plus" data-idx="${idx}">+</button>
            </div>
            <strong style="font-family:var(--font-mono); font-size:1.05rem; color:#fff; min-width:90px; text-align:right;">
              ₺ ${item.total.toLocaleString('tr-TR')}
            </strong>
          </div>
        </div>
      `;
    }).join('');
  }

  if (totalEl) totalEl.textContent = `₺ ${total.toLocaleString('tr-TR')}`;
  if (modal) modal.classList.remove('hidden');

  document.querySelectorAll('.preview-plus').forEach(b => {
    b.onclick = () => {
      const idx = parseInt(b.getAttribute('data-idx'));
      const itm = items[idx];
      const stockCartons = inventoryStock[itm.cigId] !== undefined ? inventoryStock[itm.cigId] : 0;
      const stockPackets = Math.round(stockCartons * 10);
      const currentCartPackets = ((currentCart[itm.cigId]?.cartonQty || 0) * 10) + (currentCart[itm.cigId]?.packetQty || 0);
      const neededPackets = itm.type === 'carton' ? 10 : 1;

      if (stockCartons <= 0 || (currentCartPackets + neededPackets) > stockPackets) {
        showOutOfStockAlertModal(itm.name, stockCartons);
        return;
      }

      if (itm.type === 'carton') currentCart[itm.cigId].cartonQty++;
      else currentCart[itm.cigId].packetQty++;
      openOrderPreviewModal();
      updateLiveCatalogTotal();
    };
  });

  document.querySelectorAll('.preview-minus').forEach(b => {
    b.onclick = () => {
      const idx = parseInt(b.getAttribute('data-idx'));
      const itm = items[idx];
      if (itm.type === 'carton' && currentCart[itm.cigId].cartonQty > 0) {
        currentCart[itm.cigId].cartonQty--;
      } else if (itm.type === 'packet' && currentCart[itm.cigId].packetQty > 0) {
        currentCart[itm.cigId].packetQty--;
      }
      openOrderPreviewModal();
      updateLiveCatalogTotal();
    };
  });
}

/* ==========================================================================
   13. SİPARİŞ SONU ÖDEME EKRANI & BORÇ YANSITMA
   ========================================================================== */
let orderFinalTotal = 0;

function setupPaymentModal() {
  const modal = document.getElementById('modal-payment');
  const closeBtn = document.getElementById('btn-close-payment');
  const cancelBtn = document.getElementById('btn-cancel-payment');
  const paidInput = document.getElementById('input-paid-amount');
  const fullPayPill = document.getElementById('btn-full-pay');
  const fullPayCheck = document.getElementById('full-pay-check');
  const finalizeBtn = document.getElementById('btn-finalize-payment');

  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

  if (paidInput) {
    paidInput.addEventListener('input', () => {
      const paid = parseFloat(paidInput.value) || 0;
      updatePaymentRemainingDebt(paid);
      if (paid === orderFinalTotal && fullPayCheck) {
        fullPayCheck.classList.add('checked');
      } else if (fullPayCheck) {
        fullPayCheck.classList.remove('checked');
      }
    });
  }

  if (fullPayPill) {
    fullPayPill.addEventListener('click', () => {
      if (paidInput) {
        paidInput.value = orderFinalTotal;
        updatePaymentRemainingDebt(orderFinalTotal);
        if (fullPayCheck) fullPayCheck.classList.add('checked');
      }
    });
  }

  if (finalizeBtn) {
    finalizeBtn.addEventListener('click', () => {
      const paid = Math.max(0, parseFloat(paidInput.value) || 0);
      finalizeSaleTransaction(paid);
      modal.classList.add('hidden');
    });
  }
}

function openPaymentModal() {
  const modal = document.getElementById('modal-payment');
  const totalAmountEl = document.getElementById('payment-total-amount');
  const paidInput = document.getElementById('input-paid-amount');
  const subText = document.getElementById('payment-dealer-sub');
  const fullPayCheck = document.getElementById('full-pay-check');

  const items = getSelectedCartItems();
  orderFinalTotal = items.reduce((acc, itm) => acc + itm.total, 0);

  if (totalAmountEl) totalAmountEl.textContent = `₺ ${orderFinalTotal.toLocaleString('tr-TR')}`;
  if (subText && currentActiveDealer) subText.textContent = `Satış Noktası: ${currentActiveDealer.name}`;
  if (paidInput) paidInput.value = orderFinalTotal;
  if (fullPayCheck) fullPayCheck.classList.add('checked');

  updatePaymentRemainingDebt(orderFinalTotal);

  if (modal) modal.classList.remove('hidden');
}

function updatePaymentRemainingDebt(paid) {
  const remaining = Math.max(0, orderFinalTotal - paid);
  const remainingEl = document.getElementById('payment-remaining-debt-val');
  const alertBox = document.getElementById('remaining-debt-alert');
  const descEl = document.getElementById('alert-debt-desc');

  if (remainingEl) remainingEl.textContent = `₺ ${remaining.toLocaleString('tr-TR')} Borç`;

  if (remaining > 0) {
    if (alertBox) alertBox.style.display = 'flex';
    if (descEl) descEl.textContent = `Eksik kalan ₺${remaining.toLocaleString('tr-TR')} tutar ${currentActiveDealer?.name || 'satış noktası'} borç listesine eklenecektir.`;
  } else {
    if (alertBox) alertBox.style.display = 'none';
  }
}

function finalizeSaleTransaction(paidAmount) {
  if (!currentActiveDealer) return;

  const items = getSelectedCartItems();
  const remainingDebt = Math.max(0, orderFinalTotal - paidAmount);
  const receiptNo = "TR-" + Math.floor(1000 + Math.random() * 9000);
  const pastDebtBeforeThisSale = currentActiveDealer.totalDebt || 0;
  const grandTotalDebtAfterSale = pastDebtBeforeThisSale + remainingDebt;

  let saleProfit = 0;
  items.forEach(itm => {
    const cig = CIGARETTES_DB.find(c => c.id === itm.cigId);
    if (cig) {
      const buyPerUnit = itm.type === 'carton' ? (cig.buyPrice || 0) : ((cig.buyPrice || 0) / 10);
      const margin = (itm.unitPrice || 0) - buyPerUnit;
      saleProfit += margin * (itm.qty || 0);
    } else {
      saleProfit += (itm.total || 0) * 0.04;
    }
  });

  const itemsSummary = items.map(i => `${i.qty} ${i.type === 'carton' ? 'Karton' : 'Adet'} ${i.name}`).join(', ');

  if (!currentActiveDealer.sales) currentActiveDealer.sales = [];
  if (!currentActiveDealer.debts) currentActiveDealer.debts = [];

  const activeDate = getActiveBusinessDate();
  const now = new Date();
  const dateFormattedTR = activeDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const dateStr = `${dateFormattedTR} ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
  const saleTimestamp = new Date(activeDate.getFullYear(), activeDate.getMonth(), activeDate.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()).getTime();
  const businessDateKey = getActiveBusinessDateStr();

  currentActiveDealer.sales.unshift({
    id: "s-" + Date.now(),
    date: dateStr,
    timestamp: saleTimestamp,
    businessDateKey: businessDateKey,
    isArchivedCutoff: false,
    items: itemsSummary,
    itemsList: items,
    total: orderFinalTotal,
    totalAmount: orderFinalTotal,
    netProfit: Math.round(saleProfit),
    paid: paidAmount,
    paidAmount: paidAmount,
    debt: remainingDebt,
    remainingDebt: remainingDebt,
    receipt: receiptNo
  });

  currentActiveDealer.lastOrder = "Bugün " + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  if (remainingDebt > 0) {
    currentActiveDealer.totalDebt = (currentActiveDealer.totalDebt || 0) + remainingDebt;

    currentActiveDealer.debts.unshift({
      id: "d-" + Date.now(),
      date: dateFormattedTR,
      businessDateKey: businessDateKey,
      isArchivedCutoff: false,
      desc: `Vadeli Sigara Siparişi (${receiptNo})`,
      dueDate: "15 Eylül 2026",
      amount: remainingDebt,
      remaining: remainingDebt,
      status: "Ödeme Bekleniyor"
    });
  }

  // Satılan Sigaraları Mevcut Depo Stoğundan Otomatik Düş
  items.forEach(itm => {
    const cigId = itm.cigId;
    let cartonsToDeduct = 0;
    if (itm.type === 'carton') {
      cartonsToDeduct = itm.qty;
    } else if (itm.type === 'packet') {
      cartonsToDeduct = itm.qty / 10;
    }
    const currentStock = inventoryStock[cigId] || 0;
    inventoryStock[cigId] = Math.max(0, Math.round((currentStock - cartonsToDeduct) * 100) / 100);
  });
  saveInventoryToStorage();
  renderHomeStockTable();
  renderStockPieChart();

  saveDealersToStorage();
  openDedicatedDealerScreen(currentActiveDealer.id);
  renderDealersTable();

  // Satış Fatura Modalını Aç
  openSalesInvoiceModal({
    isPaymentReceipt: false,
    receiptNo: receiptNo,
    dealerName: currentActiveDealer.name,
    dealerPhone: currentActiveDealer.phone || '',
    dealerRegion: currentActiveDealer.region || '',
    items: items,
    orderSubtotal: orderFinalTotal,
    paidAmount: paidAmount,
    remainingDebt: remainingDebt,
    pastDebt: pastDebtBeforeThisSale,
    grandTotalDebt: grandTotalDebtAfterSale,
    dateStr: "27 Ağustos 2026 " + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  });
}

/* ==========================================================================
   14. SATIŞ NOKTASINA ÖZEL FİYAT TANIMLAMA (SADECE KARTON FİYATI SORULUR, PAKET = KARTON/10)
   ========================================================================== */
function setupCustomPriceModule() {
  const modal = document.getElementById('modal-custom-prices');
  const closeBtn = document.getElementById('btn-close-custom-price-modal');
  const cancelBtn = document.getElementById('btn-cancel-custom-prices');
  const saveBtn = document.getElementById('btn-save-custom-prices');
  const resetBtn = document.getElementById('btn-reset-custom-prices');
  const applyBulkDiscountBtn = document.getElementById('btn-apply-bulk-discount');
  const bulkDiscountInput = document.getElementById('input-bulk-discount-amount');

  if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
  if (cancelBtn) cancelBtn.onclick = () => modal.classList.add('hidden');

  // Ortak Toplu Karton İndirimi Uygula (Örn: 100 TL)
  if (applyBulkDiscountBtn) {
    applyBulkDiscountBtn.onclick = () => {
      const discount = parseFloat(bulkDiscountInput.value) || 0;
      if (discount <= 0) {
        alert("Lütfen geçerli bir indirim tutarı giriniz (Örn: 100 TL)!");
        return;
      }

      CIGARETTES_DB.forEach(cig => {
        const cInput = document.querySelector(`.custom-carton-inp[data-id="${cig.id}"]`);
        const pSpan = document.getElementById(`calc-packet-${cig.id}`);

        if (cInput) {
          const newCarton = Math.max(0, cig.cartonPrice - discount);
          cInput.value = newCarton;
          if (pSpan) {
            const calculatedPacket = Math.round((newCarton / 10) * 10) / 10;
            pSpan.textContent = `₺ ${calculatedPacket}`;
          }
        }
      });

      alert(`Tüm sigara karton fiyatlarından ₺${discount} düşüldü, paket fiyatları otomatik 10'da biri olarak hesaplandı! "Kaydet" butonuna basarak onaylayabilirsiniz.`);
    };
  }

  // Özel Fiyatları Kaydet
  if (saveBtn) {
    saveBtn.onclick = () => {
      if (!currentActiveDealer) return;

      if (!currentActiveDealer.customPrices) {
        currentActiveDealer.customPrices = {};
      }

      CIGARETTES_DB.forEach(cig => {
        const cInput = document.querySelector(`.custom-carton-inp[data-id="${cig.id}"]`);
        const cVal = cInput ? parseFloat(cInput.value) : cig.cartonPrice;

        if (cVal !== cig.cartonPrice && !isNaN(cVal)) {
          const pVal = Math.round((cVal / 10) * 10) / 10;
          currentActiveDealer.customPrices[cig.id] = {
            cartonPrice: cVal,
            packetPrice: pVal
          };
        } else {
          delete currentActiveDealer.customPrices[cig.id];
        }
      });

      saveDealersToStorage();
      modal.classList.add('hidden');
      alert(`${currentActiveDealer.name} için özel karton ve paket fiyatları başarıyla kaydedildi!`);
    };
  }

  // Standart Fiyatlara Sıfırla
  if (resetBtn) {
    resetBtn.onclick = () => {
      if (!currentActiveDealer) return;
      if (confirm(`${currentActiveDealer.name} için tanımlanan özel fiyatları sıfırlayıp standart fiyatlara dönmek istiyor musunuz?`)) {
        currentActiveDealer.customPrices = {};
        saveDealersToStorage();
        openCustomPriceModal(currentActiveDealer);
        alert("Fiyatlar standart piyasa fiyatlarına sıfırlandı.");
      }
    };
  }
}

function openCustomPriceModal(dealer) {
  currentActiveDealer = dealer;
  const modal = document.getElementById('modal-custom-prices');
  const title = document.getElementById('custom-price-dealer-title');
  const tbody = document.getElementById('custom-prices-tbody');
  const bulkInput = document.getElementById('input-bulk-discount-amount');

  if (title) title.textContent = `Özel Fiyat Tanımla: ${dealer.name}`;
  if (bulkInput) bulkInput.value = "";

  if (tbody) {
    tbody.innerHTML = CIGARETTES_DB.map(cig => {
      const custom = dealer.customPrices?.[cig.id];
      const cartonVal = (custom && custom.cartonPrice !== undefined) ? custom.cartonPrice : cig.cartonPrice;
      const packetVal = (cartonVal / 10);

      return `
        <tr>
          <td style="font-size:0.75rem; color:#94a3b8; font-weight:700;">${cig.brand}</td>
          <td><strong style="color:#ffffff;">${cig.name}</strong></td>
          <td style="text-align:center; font-family:var(--font-mono); color:#94a3b8;">₺${cig.cartonPrice}</td>
          <td style="text-align:center;">
            <input type="number" class="input-custom-price custom-carton-inp" data-id="${cig.id}" value="${cartonVal}" min="0" />
          </td>
          <td style="text-align:center;">
            <span class="calculated-packet-price" id="calc-packet-${cig.id}">₺ ${packetVal}</span>
          </td>
        </tr>
      `;
    }).join('');

    // Canlı Karton -> Paket Hesabı Dinleyicisi
    document.querySelectorAll('.custom-carton-inp').forEach(inp => {
      inp.oninput = () => {
        const id = inp.getAttribute('data-id');
        const cVal = parseFloat(inp.value) || 0;
        const pSpan = document.getElementById(`calc-packet-${id}`);
        if (pSpan) {
          const computed = Math.round((cVal / 10) * 10) / 10;
          pSpan.textContent = `₺ ${computed}`;
        }
      };
    });
  }

  if (modal) modal.classList.remove('hidden');
}

/* ==========================================================================
   15. EN ÇOK SATILAN SİGARALAR & BORÇLU LİSTESİ MODALLARI (İstenen Özellik)
   ========================================================================== */
let topSellingFilterState = {
  period: 'today',
  customDateStr: null
};

function setupAnalyticsModals() {
  // 1. En Çok Satılan Sigaralar Modalı
  const topCigsBtn = document.getElementById('btn-open-top-selling-modal');
  const topCigsModal = document.getElementById('modal-top-selling-cigs');
  const closeTopCigsBtn = document.getElementById('btn-close-top-selling-modal');
  const closeTopCigsAction = document.getElementById('btn-close-top-selling-action');

  const filterBtns = document.querySelectorAll('#top-selling-filter-group .pill-btn');
  const calendarInput = document.getElementById('top-selling-calendar-input');

  filterBtns.forEach(btn => {
    btn.onclick = () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const period = btn.getAttribute('data-period') || 'today';
      topSellingFilterState.period = period;
      topSellingFilterState.customDateStr = null;
      if (calendarInput) calendarInput.value = '';
      renderTopSellingCigarettesList();
    };
  });

  if (calendarInput) {
    calendarInput.onchange = (e) => {
      const val = e.target.value;
      if (!val) return;
      filterBtns.forEach(b => b.classList.remove('active'));
      topSellingFilterState.period = 'custom';
      topSellingFilterState.customDateStr = val;
      renderTopSellingCigarettesList();
    };
  }

  if (topCigsBtn) {
    topCigsBtn.onclick = () => {
      topSellingFilterState.period = 'today';
      topSellingFilterState.customDateStr = null;
      if (calendarInput) calendarInput.value = '';
      filterBtns.forEach(b => {
        if (b.getAttribute('data-period') === 'today') b.classList.add('active');
        else b.classList.remove('active');
      });
      renderTopSellingCigarettesList();
      topCigsModal.classList.remove('hidden');
    };
  }
  if (closeTopCigsBtn) closeTopCigsBtn.onclick = () => topCigsModal.classList.add('hidden');
  if (closeTopCigsAction) closeTopCigsAction.onclick = () => topCigsModal.classList.add('hidden');

  // 2. Borca Sigara Alan Yerler Modalı
  const debtorsBtn = document.getElementById('btn-open-debtors-list-modal');
  const debtorsModal = document.getElementById('modal-debtor-dealers-list');
  const closeDebtorsBtn = document.getElementById('btn-close-debtors-modal');
  const closeDebtorsAction = document.getElementById('btn-close-debtors-action');

  if (debtorsBtn) {
    debtorsBtn.onclick = () => {
      renderDebtorDealersRankedList();
      debtorsModal.classList.remove('hidden');
      check3DaysUnpaidAlert();
    };
  }
  if (closeDebtorsBtn) closeDebtorsBtn.onclick = () => debtorsModal.classList.add('hidden');
  if (closeDebtorsAction) closeDebtorsAction.onclick = () => debtorsModal.classList.add('hidden');
}

function renderTopSellingCigarettesList() {
  const tbody = document.getElementById('top-selling-tbody');
  const selectedLabel = document.getElementById('top-selling-selected-label');
  const summaryStats = document.getElementById('top-selling-summary-stats');
  if (!tbody) return;

  const cigStatsMap = {};
  CIGARETTES_DB.forEach(c => {
    cigStatsMap[c.id] = {
      id: c.id,
      name: c.name,
      brand: c.brand,
      cartons: 0,
      packets: 0,
      totalRevenue: 0
    };
  });

  const activeDate = getActiveBusinessDate();
  const activeKey = getActiveBusinessDateStr();
  const activeDay = activeDate.getDate();
  const activeMonth = activeDate.getMonth();
  const activeYear = activeDate.getFullYear();
  const nowTime = activeDate.getTime();

  const period = topSellingFilterState.period;
  const customDateStr = topSellingFilterState.customDateStr;

  let filterNameDisplay = "Bugün";
  let customDayNum = null, customMonthNum = null, customYearNum = null;

  if (period === 'today') {
    filterNameDisplay = `Bugün (${activeDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })})`;
  } else if (period === 'week') {
    filterNameDisplay = "Son 7 Gün (Haftalık Satışlar)";
  } else if (period === 'month') {
    filterNameDisplay = "Bu Ay (Son 30 Günlük Satışlar)";
  } else if (period === 'all') {
    filterNameDisplay = "Tüm Zamanlar (Tüm Kayıtlı Satışlar)";
  } else if (period === 'custom' && customDateStr) {
    const parts = customDateStr.split('-');
    if (parts.length === 3) {
      customYearNum = parseInt(parts[0], 10);
      customMonthNum = parseInt(parts[1], 10) - 1;
      customDayNum = parseInt(parts[2], 10);
      const cDate = new Date(customYearNum, customMonthNum, customDayNum);
      filterNameDisplay = `Seçili Gün: ${cDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }
  }

  if (selectedLabel) {
    selectedLabel.innerHTML = `Filtre: <strong style="color:#00f2fe;">${filterNameDisplay}</strong>`;
  }

  let totalPeriodCartons = 0;
  let totalPeriodPackets = 0;
  let totalPeriodRevenue = 0;
  let hasAnySales = false;

  (dealersData || []).forEach(dealer => {
    (dealer.sales || []).forEach(sale => {
      const sDate = getSaleBusinessDate(sale.timestamp || sale.date);
      let matchesFilter = false;

      if (period === 'today') {
        matchesFilter = !sale.isArchivedCutoff && (
          sale.businessDateKey === activeKey ||
          (sDate.day === activeDay && sDate.month === activeMonth && sDate.year === activeYear) ||
          !sale.businessDateKey
        );
      } else if (period === 'week') {
        const diffMs = nowTime - sDate.dateObj.getTime();
        matchesFilter = diffMs >= -86400000 && diffMs <= (7 * 86400000 + 86400000);
      } else if (period === 'month') {
        const diffMs = nowTime - sDate.dateObj.getTime();
        matchesFilter = diffMs >= -86400000 && diffMs <= (30 * 86400000 + 86400000);
      } else if (period === 'all') {
        matchesFilter = true;
      } else if (period === 'custom') {
        matchesFilter = (sDate.day === customDayNum && sDate.month === customMonthNum && sDate.year === customYearNum) ||
          (sale.businessDateKey === customDateStr);
      }

      if (matchesFilter && sale.itemsList && Array.isArray(sale.itemsList)) {
        sale.itemsList.forEach(item => {
          if (cigStatsMap[item.cigId]) {
            hasAnySales = true;
            if (item.type === 'carton') {
              cigStatsMap[item.cigId].cartons += item.qty;
              totalPeriodCartons += item.qty;
            } else {
              cigStatsMap[item.cigId].packets += item.qty;
              totalPeriodPackets += item.qty;
            }
            cigStatsMap[item.cigId].totalRevenue += item.total;
            totalPeriodRevenue += item.total;
          }
        });
      }
    });
  });

  if (summaryStats) {
    summaryStats.textContent = `Toplam: ${totalPeriodCartons} Karton, ${totalPeriodPackets} Paket (₺${totalPeriodRevenue.toLocaleString('tr-TR')})`;
  }

  const sortedList = Object.values(cigStatsMap).filter(i => (i.cartons > 0 || i.packets > 0 || i.totalRevenue > 0)).sort((a, b) => {
    const aTotalUnits = a.cartons * 10 + a.packets;
    const bTotalUnits = b.cartons * 10 + b.packets;
    if (bTotalUnits !== aTotalUnits) return bTotalUnits - aTotalUnits;
    return b.totalRevenue - a.totalRevenue;
  });

  if (!hasAnySales || sortedList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding:28px;">Seçilen dönemde (${filterNameDisplay}) tamamlanmış bir sigara satışı bulunamadı.</td></tr>`;
    return;
  }

  tbody.innerHTML = sortedList.map((item, idx) => {
    const rankClass = idx === 0 ? "rank-1" : idx === 1 ? "rank-2" : idx === 2 ? "rank-3" : "rank-other";
    return `
      <tr>
        <td><span class="rank-badge ${rankClass}">#${idx + 1}</span></td>
        <td><strong style="color:#ffffff;">${item.name}</strong></td>
        <td><span style="color:#94a3b8; font-size:0.75rem;">${item.brand}</span></td>
        <td style="text-align:center; font-family:var(--font-mono); font-weight:800; color:#60a5fa;">${item.cartons} Karton</td>
        <td style="text-align:center; font-family:var(--font-mono); font-weight:800; color:#34d399;">${item.packets} Paket</td>
        <td style="text-align:right; font-family:var(--font-mono); font-weight:900; color:#00f2fe;">
          ₺ ${item.totalRevenue.toLocaleString('tr-TR')}
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Bayi Son Ödeme Tarihi ve Pazar Günleri Muafiyetli Ödenmeyen Gün Hesabı
 */
function getDealerPaymentStats(dealer) {
  const sales = dealer.sales || [];

  let lastPaymentTs = dealer.lastPaymentTimestamp || null;

  sales.forEach(s => {
    if ((s.paid || 0) > 0 && s.timestamp) {
      if (!lastPaymentTs || s.timestamp > lastPaymentTs) {
        lastPaymentTs = s.timestamp;
      }
    }
  });

  const now = new Date();
  let isPaidToday = false;
  let lastPaymentDateStr = null;

  if (lastPaymentTs) {
    const pDate = new Date(lastPaymentTs);
    if (pDate.getFullYear() === now.getFullYear() && pDate.getMonth() === now.getMonth() && pDate.getDate() === now.getDate()) {
      isPaidToday = true;
    }
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    lastPaymentDateStr = `${pDate.getDate()} ${months[pDate.getMonth()]} ${pDate.getFullYear()}`;
  }

  let unpaidWorkingDays = 0;
  if (!isPaidToday) {
    let startDate;
    if (lastPaymentTs) {
      startDate = new Date(lastPaymentTs);
    } else if (sales.length > 0 && sales[sales.length - 1].timestamp) {
      startDate = new Date(sales[sales.length - 1].timestamp);
    } else {
      startDate = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    }

    const cur = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    while (cur <= todayEnd) {
      // Pazar günü (0) ödenmedi olarak algılanmaz!
      if (cur.getDay() !== 0) {
        unpaidWorkingDays++;
      }
      cur.setDate(cur.getDate() + 1);
    }
  }

  const hasDebt = (dealer.totalDebt || 0) > 0;
  const isUnpaid3Days = hasDebt && unpaidWorkingDays >= 3;

  return {
    lastPaymentTs,
    lastPaymentDateStr,
    isPaidToday,
    unpaidWorkingDays,
    isUnpaid3Days,
    hasDebt
  };
}

function check3DaysUnpaidAlert() {
  const unpaidDealers = dealersData.filter(d => {
    const st = getDealerPaymentStats(d);
    return st.isUnpaid3Days;
  });

  if (unpaidDealers.length > 0) {
    const tbody = document.getElementById('unpaid-3days-tbody');
    if (tbody) {
      tbody.innerHTML = unpaidDealers.map(d => {
        const st = getDealerPaymentStats(d);
        return `
          <tr>
            <td><strong style="color:#ffffff;">${d.name}</strong></td>
            <td><span style="color:#94a3b8; font-size:0.75rem;">${d.region || '-'} • ${d.phone || '-'}</span></td>
            <td style="text-align:center; color:#f43f5e; font-weight:800;">${st.unpaidWorkingDays} Gündür Ödemiyor (Pazar Hariç)</td>
            <td style="text-align:right; font-family:var(--font-mono); font-weight:900; color:#f43f5e;">
              ₺ ${(d.totalDebt || 0).toLocaleString('tr-TR')}
            </td>
          </tr>
        `;
      }).join('');
    }
    const modal = document.getElementById('modal-3days-unpaid-alert');
    if (modal) modal.classList.remove('hidden');
  }
}

function renderDebtorDealersRankedList() {
  const tbody = document.getElementById('debtors-list-tbody');
  if (!tbody) return;

  const searchInput = document.getElementById('input-search-debtors');
  const filterSelect = document.getElementById('select-debtors-filter');

  if (searchInput && !searchInput.dataset.hasListener) {
    searchInput.dataset.hasListener = 'true';
    searchInput.oninput = () => renderDebtorDealersRankedList();
  }
  if (filterSelect && !filterSelect.dataset.hasListener) {
    filterSelect.dataset.hasListener = 'true';
    filterSelect.onchange = () => renderDebtorDealersRankedList();
  }

  if (dealersData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:24px;">Henüz kayıtlı satış noktası bulunmuyor.</td></tr>`;
    return;
  }

  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const filterMode = filterSelect ? filterSelect.value : 'highest_debt';

  const computedList = dealersData.map(dealer => {
    const stats = getDealerPaymentStats(dealer);
    return {
      dealer,
      totalDebt: dealer.totalDebt || 0,
      stats
    };
  });

  let filtered = computedList;
  if (query) {
    filtered = filtered.filter(item => {
      const d = item.dealer;
      return (d.name && d.name.toLowerCase().includes(query)) ||
        (d.region && d.region.toLowerCase().includes(query)) ||
        (d.phone && d.phone.toLowerCase().includes(query));
    });
  }

  if (filterMode === 'unpaid_3days') {
    filtered = filtered.filter(item => item.stats.isUnpaid3Days);
  } else if (filterMode === 'highest_debt') {
    filtered.sort((a, b) => b.totalDebt - a.totalDebt);
  } else {
    filtered.sort((a, b) => a.dealer.name.localeCompare(b.dealer.name, 'tr'));
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:24px;">Aramanıza uygun satış noktası bulunamadı.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(item => {
    const d = item.dealer;
    const st = item.stats;

    let lastPaymentDisplay = '';
    if (st.isPaidToday) {
      lastPaymentDisplay = `<span class="badge-tag" style="background:rgba(16,185,129,0.2); color:#34d399; font-weight:800;">Bugün Ödeme Yapıldı</span>`;
    } else if (st.lastPaymentDateStr) {
      lastPaymentDisplay = `<span style="color:#cbd5e1; font-weight:600;">${st.lastPaymentDateStr} (${st.unpaidWorkingDays} İş Günü)</span>`;
    } else {
      lastPaymentDisplay = `<span style="color:#64748b;">Ödeme Kaydı Yok</span>`;
    }

    let statusTag = '';
    if (st.isUnpaid3Days) {
      statusTag = `<span class="badge-tag" style="background:rgba(244,63,94,0.2); color:#f43f5e; font-weight:800;">3+ Gündür Ödenmedi</span>`;
    } else if (item.totalDebt === 0) {
      statusTag = `<span class="badge-tag" style="background:rgba(16,185,129,0.15); color:#34d399;">Borçsuz</span>`;
    } else {
      statusTag = `<span class="badge-tag" style="background:rgba(245,158,11,0.15); color:#fde68a;">Düzenli Takip</span>`;
    }

    return `
      <tr>
        <td>
          <strong style="color:#ffffff; cursor:pointer;" onclick="openDedicatedDealerScreen('${d.id}')">${d.name}</strong>
        </td>
        <td><span style="color:#94a3b8; font-size:0.75rem;">${d.region || '-'} • ${d.phone || '-'}</span></td>
        <td style="text-align:center; font-family:var(--font-mono); font-size:0.78rem;">
          ${lastPaymentDisplay}
        </td>
        <td style="text-align:center;">${statusTag}</td>
        <td style="text-align:right; font-family:var(--font-mono); font-weight:900; color:${item.totalDebt > 0 ? '#f43f5e' : '#10b981'};">
          ₺ ${item.totalDebt.toLocaleString('tr-TR')}
        </td>
      </tr>
    `;
  }).join('');
}

/* ==========================================================================
   16. PDF FATURA, TAHSİLAT MAKBUZU VE WHATSAPP GÖNDERİMİ
   ========================================================================== */
function setupInvoiceAndWhatsAppModule() {
  const modal = document.getElementById('modal-invoice-success');
  const closeBtn = document.getElementById('btn-close-invoice-modal');
  const closeActionBtn = document.getElementById('btn-close-inv-modal-action');
  const downloadPdfBtn = document.getElementById('btn-download-pdf-action');
  const sendWhatsAppBtn = document.getElementById('btn-send-whatsapp-action');

  if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
  if (closeActionBtn) closeActionBtn.onclick = () => modal.classList.add('hidden');

  if (downloadPdfBtn) {
    downloadPdfBtn.onclick = () => {
      generateAndDownloadInvoicePDF();
    };
  }

  if (sendWhatsAppBtn) {
    sendWhatsAppBtn.onclick = () => {
      sendInvoiceViaWhatsApp();
    };
  }
}

function openSalesInvoiceModal(data) {
  currentInvoiceData = { ...data, type: 'sale' };

  const modal = document.getElementById('modal-invoice-success');
  document.getElementById('invoice-modal-subtitle').textContent = `Fiş No: ${data.receiptNo} • Faturayı PDF olarak oluşturup WhatsApp'tan tek tıkla iletebilirsiniz`;

  document.querySelector('.inv-tag').textContent = "SATIŞ FATURASI / SEVK İRSALİYESİ";
  document.getElementById('inv-receipt-no').textContent = data.receiptNo;
  document.getElementById('inv-date-time').textContent = data.dateStr;
  document.getElementById('inv-customer-name').textContent = data.dealerName;
  document.getElementById('inv-customer-region').textContent = `Bölge: ${data.dealerRegion}`;
  document.getElementById('inv-customer-phone').textContent = `Tel: ${data.dealerPhone || 'Belirtilmedi'}`;

  document.getElementById('inv-sales-table-section').style.display = 'block';
  document.getElementById('inv-payment-receipt-section').style.display = 'none';

  const payBadge = document.getElementById('inv-payment-badge');
  if (payBadge) {
    if (data.remainingDebt === 0) {
      payBadge.textContent = "Tamamı Ödendi";
      payBadge.style.background = "#e6fffa";
      payBadge.style.color = "#234e52";
      payBadge.style.borderColor = "#38b2ac";
    } else {
      payBadge.textContent = `Eksik Ödeme (₺${data.remainingDebt.toLocaleString('tr-TR')} Borç)`;
      payBadge.style.background = "#fff1f2";
      payBadge.style.color = "#9f1239";
      payBadge.style.borderColor = "#fda4af";
    }
  }

  const tbody = document.getElementById('invoice-items-tbody');
  if (tbody) {
    tbody.innerHTML = data.items.map((item, idx) => `
      <tr>
        <td style="color:#64748b; font-weight:700;">${idx + 1}</td>
        <td>
          <strong style="color:#0f172a;">${item.name}</strong> 
          <span style="font-size:0.75rem; color:#475569;">(${item.typeName})</span>
        </td>
        <td style="font-family:'JetBrains Mono', monospace;">₺ ${item.unitPrice.toLocaleString('tr-TR')}</td>
        <td style="text-align:center; font-weight:800; font-family:'JetBrains Mono', monospace;">${item.qty}</td>
        <td style="text-align:right; font-weight:800; font-family:'JetBrains Mono', monospace; color:#0f172a;">
          ₺ ${item.total.toLocaleString('tr-TR')}
        </td>
      </tr>
    `).join('');
  }

  document.getElementById('inv-order-subtotal').textContent = `₺ ${data.orderSubtotal.toLocaleString('tr-TR')}`;
  document.getElementById('inv-order-paid').textContent = `₺ ${data.paidAmount.toLocaleString('tr-TR')}`;
  document.getElementById('inv-order-remaining-debt').textContent = `₺ ${data.remainingDebt.toLocaleString('tr-TR')}`;
  document.getElementById('inv-past-debt-val').textContent = `₺ ${data.pastDebt.toLocaleString('tr-TR')}`;

  document.getElementById('inv-grand-total-label').textContent = "GÜNCEL TOPLAM BORÇ (GENEL BAKİYE):";
  document.getElementById('inv-grand-total-debt').textContent = `₺ ${data.grandTotalDebt.toLocaleString('tr-TR')}`;

  if (modal) modal.classList.remove('hidden');
}

function openPaymentReceiptModal(data) {
  currentInvoiceData = { ...data, type: 'payment' };

  const modal = document.getElementById('modal-invoice-success');
  document.getElementById('invoice-modal-subtitle').textContent = `Makbuz No: ${data.receiptNo} • Tahsilat makbuzunu PDF indirebilir veya WhatsApp'tan gönderebilirsiniz`;

  document.querySelector('.inv-tag').textContent = data.isBulk ? "TOPTAN BORÇ TAHSİLAT MAKBUZU" : "BORÇ TAHSİLAT MAKBUZU";
  document.getElementById('inv-receipt-no').textContent = data.receiptNo;
  document.getElementById('inv-date-time').textContent = data.dateStr;
  document.getElementById('inv-customer-name').textContent = data.dealerName;
  document.getElementById('inv-customer-region').textContent = `Bölge: ${data.dealerRegion}`;
  document.getElementById('inv-customer-phone').textContent = `Tel: ${data.dealerPhone || 'Belirtilmedi'}`;

  document.getElementById('inv-sales-table-section').style.display = 'none';
  document.getElementById('inv-payment-receipt-section').style.display = 'block';

  const payBadge = document.getElementById('inv-payment-badge');
  if (payBadge) {
    payBadge.textContent = "Tahsilat Gerçekleşti";
    payBadge.style.background = "#ecfdf5";
    payBadge.style.color = "#065f46";
    payBadge.style.borderColor = "#10b981";
  }

  document.getElementById('inv-receipt-prev-debt').textContent = `₺ ${data.prevTotalDebt.toLocaleString('tr-TR')}`;
  document.getElementById('inv-receipt-paid-debt').textContent = `₺ ${data.paidDebtAmount.toLocaleString('tr-TR')}`;

  document.getElementById('inv-grand-total-label').textContent = "KALAN GÜNCEL TOPLAM BORÇ:";
  document.getElementById('inv-grand-total-debt').textContent = `₺ ${data.remainingTotalDebt.toLocaleString('tr-TR')}`;

  if (modal) modal.classList.remove('hidden');
}

function generateAndDownloadInvoicePDF() {
  const element = document.getElementById('invoice-printable-area');
  if (!element || !currentInvoiceData) return;

  const prefix = currentInvoiceData.type === 'payment' ? 'Tahsilat_Makbuzu' : 'Fatura';
  const opt = {
    margin: [10, 10, 10, 10],
    filename: `${prefix}_${currentInvoiceData.receiptNo}_${(currentInvoiceData.dealerName || 'Musteri').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    if (window.html2pdf) {
      window.html2pdf().set(opt).from(element).save();
    } else {
      window.print();
    }
  } catch (err) {
    console.warn("PDF generation:", err);
  }
}

async function sendInvoiceViaWhatsApp() {
  if (!currentInvoiceData) return;

  let rawPhone = (currentInvoiceData.dealerPhone || '').replace(/\D/g, '');

  // Telefon Numarası Kontrolü: Eksikse Uyarı Modalı Aç
  if (!rawPhone || rawPhone.length < 10) {
    const warningModal = document.getElementById('modal-missing-phone-warning');
    const nameEl = document.getElementById('missing-phone-dealer-name');
    if (nameEl) nameEl.textContent = `Satış Noktası Numarası Bulunmamaktadır (${currentInvoiceData.dealerName || 'Bilinmiyor'})`;
    if (warningModal) warningModal.classList.remove('hidden');

    const closeWarnBtn = document.getElementById('btn-close-missing-phone-modal');
    const closeWarnAction = document.getElementById('btn-close-missing-phone-action');
    if (closeWarnBtn) closeWarnBtn.onclick = () => warningModal.classList.add('hidden');
    if (closeWarnAction) closeWarnAction.onclick = () => warningModal.classList.add('hidden');
    return;
  }

  if (rawPhone.startsWith('0')) {
    rawPhone = '90' + rawPhone.substring(1);
  } else if (rawPhone.length === 10) {
    rawPhone = '90' + rawPhone;
  }

  // 1. Animasyonlu Yükleme Ekranını Göster
  const loadingModal = document.getElementById('modal-pdf-whatsapp-loading');
  const titleEl = document.getElementById('wa-loading-title');
  const subEl = document.getElementById('wa-loading-sub');
  const progressBar = document.getElementById('wa-loading-progress');
  const stepText = document.getElementById('wa-loading-step-text');

  if (loadingModal) {
    if (progressBar) progressBar.style.width = '15%';
    if (titleEl) titleEl.textContent = "Fatura PDF Oluşturuluyor...";
    if (subEl) subEl.textContent = "Fatura belgesi derleniyor ve müşteri numarasına WhatsApp ile aktarılıyor.";
    if (stepText) stepText.textContent = "PDF Belgesi Derleniyor...";
    loadingModal.classList.remove('hidden');
  }

  const updateLoadingStep = (percent, text, title) => {
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (stepText) stepText.textContent = text;
    if (title && titleEl) titleEl.textContent = title;
  };

  try {
    await new Promise(r => setTimeout(r, 450));
    updateLoadingStep(50, "Fatura Derleniyor ve Dijitalleşiyor...", "PDF Hazırlanıyor");

    const element = document.getElementById('invoice-printable-area');
    const prefix = currentInvoiceData.type === 'payment' ? 'TAHSILAT_MAKMUZU' : 'FATURA';
    const cleanCustomerName = (currentInvoiceData.dealerName || 'Musteri').replace(/[^a-zA-Z0-9]/g, '_');
    // EN YENİ DOSYA OLMASI İÇİN "01_EN_YENI_" ÖNEKİ EKLENİR (Ekle -> Belge deyince ilk sırada çıkar)
    const fileName = `01_EN_YENI_${prefix}_${currentInvoiceData.receiptNo}_${cleanCustomerName}.pdf`;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    let pdfBlob = null;
    if (window.html2pdf && element) {
      pdfBlob = await window.html2pdf().set(opt).from(element).output('blob');
    }

    await new Promise(r => setTimeout(r, 450));
    updateLoadingStep(85, "WhatsApp İletişim Kanalına Aktarılıyor...", "WhatsApp'a İletiliyor");
    await new Promise(r => setTimeout(r, 500));

    updateLoadingStep(100, "PDF Başarıyla Hazırlandı!", "İşlem Tamamlandı");
    await new Promise(r => setTimeout(r, 300));

    if (loadingModal) loadingModal.classList.add('hidden');

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    let fileSharedSuccessfully = false;

    // 2.A. Native Android APK Kontrolü (AndroidBridge) - PDF'i Doğrudan WhatsApp Sohbetine Eklenti Olarak Gönderir!
    if (window.AndroidBridge && typeof window.AndroidBridge.sharePdfViaWhatsApp === 'function' && pdfBlob) {
      try {
        const reader = new FileReader();
        reader.onloadend = function() {
          const base64data = reader.result.split(',')[1];
          const captionText = `${currentInvoiceData.dealerName} Sayın Yetkili, ${currentInvoiceData.receiptNo} numaralı ${currentInvoiceData.type === 'payment' ? 'Tahsilat Makbuzu' : 'Fatura'} belgeniz ektedir.`;
          const success = window.AndroidBridge.sharePdfViaWhatsApp(base64data, fileName, rawPhone, captionText);
          if (success) {
            if (typeof showToast === 'function') {
              showToast("WhatsApp açıldı ve fatura PDF dosyası doğrudan sohbetinize eklendi!");
            }
          }
        };
        reader.readAsDataURL(pdfBlob);
        fileSharedSuccessfully = true;
      } catch (bridgeErr) {
        console.warn("AndroidBridge hatası:", bridgeErr);
      }
    }

    // 2.B. Mobil Tarayıcı ise Web Share API ile PDF Dosyasını Doğrudan Paylaş
    if (!fileSharedSuccessfully && isMobile && pdfBlob && navigator.canShare) {
      try {
        const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [pdfFile] })) {
          await navigator.share({
            files: [pdfFile],
            title: `${prefix} - Fiş No: ${currentInvoiceData.receiptNo}`,
            text: `${currentInvoiceData.dealerName} için oluşturulan ${prefix} PDF belgesi.`
          });
          fileSharedSuccessfully = true;
        }
      } catch (shareErr) {
        console.warn("Dosya paylaşım iptal edildi veya desteklenmiyor:", shareErr);
      }
    }

    // 2.C. Masaüstü / PC WhatsApp Web Gönderimi
    if (!fileSharedSuccessfully) {
      // PDF Dosyasını Bilgisayara İndir (01_EN_YENI_ adıyla en üstte gözükür)
      if (window.html2pdf && element) {
        window.html2pdf().set(opt).from(element).save();
      }

      // Mesaj Panoya Kopyala
      const waCaptionText = `${currentInvoiceData.dealerName} Sayın Yetkili, ${currentInvoiceData.receiptNo} numaralı ${currentInvoiceData.type === 'payment' ? 'Tahsilat Makbuzu' : 'Fatura'} ektedir.`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(waCaptionText).catch(() => {});
      }

      // Bilgisayarda WhatsApp Web Sohbetini Aç
      const waUrl = isMobile
        ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(waCaptionText)}`
        : `https://web.whatsapp.com/send?phone=${rawPhone}&text=${encodeURIComponent(waCaptionText)}`;
      
      window.open(waUrl, '_blank');

      // Kullanıcıya WhatsApp Web Otomatik Ekleme Rehberini Göster
      showWhatsAppGuideModal(fileName, waUrl, opt, element);
    }
  } catch (err) {
    console.error("WhatsApp PDF Gönderim Hatası:", err);
    if (loadingModal) loadingModal.classList.add('hidden');
    const waUrl = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      ? `https://wa.me/${rawPhone}`
      : `https://web.whatsapp.com/send?phone=${rawPhone}`;
    window.open(waUrl, '_blank');
  }
}

function showWhatsAppGuideModal(fileName, waUrl, opt, element) {
  const guideModal = document.getElementById('modal-whatsapp-guide');
  const fnEl = document.getElementById('wa-guide-filename');
  const fnStepEl = document.getElementById('wa-guide-step-filename');

  if (fnEl) fnEl.textContent = fileName;
  if (fnStepEl) fnStepEl.textContent = fileName;

  const closeBtn = document.getElementById('btn-close-wa-guide');
  const closeActionBtn = document.getElementById('btn-close-wa-guide-action');
  const reDownloadBtn = document.getElementById('btn-re-download-wa-pdf');
  const reOpenWaBtn = document.getElementById('btn-re-open-wa-link');

  if (closeBtn) closeBtn.onclick = () => guideModal.classList.add('hidden');
  if (closeActionBtn) closeActionBtn.onclick = () => guideModal.classList.add('hidden');

  if (reDownloadBtn) {
    reDownloadBtn.onclick = () => {
      if (window.html2pdf && element) {
        window.html2pdf().set(opt).from(element).save();
        if (typeof showToast === 'function') showToast("PDF dosyası tekrar indirildi!");
      }
    };
  }

  if (reOpenWaBtn) {
    reOpenWaBtn.onclick = () => {
      window.open(waUrl, '_blank');
    };
  }

  if (guideModal) guideModal.classList.remove('hidden');
}

/* ==========================================================================
   16.1. DEPO VERİLERİ VE STOK ANALİZİ MODÜLÜ (Tüm Sigaraların Alış/Satış Değerleri)
   ========================================================================== */
function setupWarehouseDataModule() {
  const openBtn = document.getElementById('btn-open-warehouse-data-modal');
  const closeBtn = document.getElementById('btn-close-warehouse-data-modal');
  const closeActionBtn = document.getElementById('btn-close-warehouse-data-action');
  const searchInput = document.getElementById('input-search-warehouse-data');
  const filterSelect = document.getElementById('select-warehouse-filter');

  if (openBtn) {
    openBtn.onclick = () => {
      openWarehouseDataModal();
    };
  }

  if (closeBtn) closeBtn.onclick = () => closeWarehouseDataModal();
  if (closeActionBtn) closeActionBtn.onclick = () => closeWarehouseDataModal();

  if (searchInput) {
    searchInput.oninput = () => renderWarehouseDataTable();
  }

  if (filterSelect) {
    filterSelect.onchange = () => renderWarehouseDataTable();
  }
}

function closeWarehouseDataModal() {
  const modal = document.getElementById('modal-warehouse-data');
  if (modal) modal.classList.add('hidden');
}

function openWarehouseDataModal() {
  const modal = document.getElementById('modal-warehouse-data');
  if (!modal) return;

  const searchInput = document.getElementById('input-search-warehouse-data');
  if (searchInput) searchInput.value = '';

  const filterSelect = document.getElementById('select-warehouse-filter');
  if (filterSelect) filterSelect.value = 'in_stock';

  renderWarehouseDataTable();
  modal.classList.remove('hidden');
}

function renderWarehouseDataTable() {
  const tbody = document.getElementById('warehouse-data-tbody');
  const costValEl = document.getElementById('wh-total-cost-val');
  const revenueValEl = document.getElementById('wh-total-revenue-val');
  const profitValEl = document.getElementById('wh-total-profit-val');
  const profitMarginSub = document.getElementById('wh-profit-margin-sub');
  const summaryText = document.getElementById('wh-footer-summary-text');
  if (!tbody) return;

  const searchInput = document.getElementById('input-search-warehouse-data');
  const filterSelect = document.getElementById('select-warehouse-filter');

  const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const filterMode = filterSelect ? filterSelect.value : 'in_stock';

  // 1. Genel Depo Hesaplamaları (Tüm Stoğu Olan Sigaralar İçin)
  let grandTotalCost = 0;
  let grandTotalRevenue = 0;

  CIGARETTES_DB.forEach(cig => {
    const cartons = inventoryStock[cig.id] !== undefined ? inventoryStock[cig.id] : 0;
    if (cartons > 0) {
      grandTotalCost += cartons * (cig.buyPrice || 0);
      grandTotalRevenue += cartons * (cig.cartonPrice || 0);
    }
  });

  const grandTotalProfit = grandTotalRevenue - grandTotalCost;
  const grandMargin = grandTotalCost > 0 ? ((grandTotalProfit / grandTotalCost) * 100).toFixed(1) : '0.0';

  if (costValEl) costValEl.textContent = `₺ ${Math.round(grandTotalCost).toLocaleString('tr-TR')}`;
  if (revenueValEl) revenueValEl.textContent = `₺ ${Math.round(grandTotalRevenue).toLocaleString('tr-TR')}`;
  if (profitValEl) profitValEl.textContent = `₺ ${Math.round(grandTotalProfit).toLocaleString('tr-TR')}`;
  if (profitMarginSub) profitMarginSub.textContent = `Brüt Kâr Marjı: %${grandMargin}`;

  // 2. Filtrelenmiş ve Sıralanmış Liste Hazırlama
  let items = CIGARETTES_DB.map(cig => {
    const cartons = inventoryStock[cig.id] !== undefined ? inventoryStock[cig.id] : 0;
    const totalCost = Math.round(cartons * (cig.buyPrice || 0));
    const totalRevenue = Math.round(cartons * (cig.cartonPrice || 0));
    const expectedProfit = totalRevenue - totalCost;

    return {
      cig,
      cartons,
      totalCost,
      totalRevenue,
      expectedProfit
    };
  });

  // Filtre moduna göre eleme
  if (filterMode === 'in_stock') {
    items = items.filter(itm => itm.cartons > 0);
  } else if (filterMode === 'out_of_stock') {
    items = items.filter(itm => itm.cartons <= 0);
  }

  // Arama sorgusuna göre eleme
  if (query) {
    items = items.filter(itm =>
      itm.cig.name.toLowerCase().includes(query) ||
      (itm.cig.brand || '').toLowerCase().includes(query)
    );
  }

  // Stok miktarına göre büyükten küçüğe sırala
  items.sort((a, b) => b.cartons - a.cartons);

  if (summaryText) {
    summaryText.textContent = `${items.length} çeşit sigara gösteriliyor (Toplam Depo Stoğu)`;
  }

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:#94a3b8;">Filtreye uygun depoda sigara bulunamadı.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map((itm, idx) => {
    const c = itm.cig;
    const isZero = itm.cartons <= 0;
    const stockInfo = formatStockQuantity(itm.cartons);
    const hasLoose = stockInfo.packets > 0;
    const badgeClass = isZero ? "stock-fraction-tag" : (hasLoose ? "stock-fraction-tag has-loose" : "stock-fraction-tag");
    const badgeStyle = isZero
      ? "background:rgba(244,63,94,0.1); color:#f87171; border:1px solid rgba(244,63,94,0.25);"
      : (!hasLoose ? "background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.25);" : "");

    return `
      <tr>
        <td style="color:#64748b; font-family:var(--font-mono); font-weight:700;">#${idx + 1}</td>
        <td><strong style="color:#ffffff; font-size:0.85rem;">${c.name}</strong></td>
        <td><span style="font-size:0.75rem; color:#94a3b8; font-weight:700;">${c.brand}</span></td>
        <td style="text-align:center;">
          <span class="${badgeClass}" style="${badgeStyle}">
            ${stockInfo.text}
          </span>
        </td>
        <td style="text-align:center; font-family:var(--font-mono); color:#94a3b8;">₺ ${c.buyPrice}</td>
        <td style="text-align:center; font-family:var(--font-mono); font-weight:700; color:#38bdf8;">₺ ${c.cartonPrice}</td>
        <td style="text-align:right; font-family:var(--font-mono); font-weight:800; color:#38bdf8;">
          ₺ ${itm.totalCost.toLocaleString('tr-TR')}
        </td>
        <td style="text-align:right; font-family:var(--font-mono); font-weight:800; color:#34d399;">
          ₺ ${itm.totalRevenue.toLocaleString('tr-TR')}
        </td>
        <td style="text-align:right; font-family:var(--font-mono); font-weight:800; color:#fbbf24;">
          ₺ ${itm.expectedProfit.toLocaleString('tr-TR')}
        </td>
      </tr>
    `;
  }).join('');
}

/* ==========================================================================
   17. DİĞER MODÜLLER
   ========================================================================== */
function renderOrdersGrid(filterDateStr) {
  const container = document.getElementById('orders-grid');
  if (!container) return;

  const orders = [];
  dealersData.forEach(d => {
    (d.sales || []).forEach(s => {
      if (!filterDateStr || (s.date && s.date.includes(filterDateStr))) {
        orders.push({
          dealer: d.name + (d.region ? ` (${d.region})` : ''),
          items: s.items,
          amount: `₺ ${s.total.toLocaleString('tr-TR')}`,
          time: s.date,
          status: s.debt > 0 ? "Vadeli Satış" : "Tamamı Ödendi"
        });
      }
    });
  });

  if (orders.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:#94a3b8; padding:30px;">
      ${filterDateStr ? `<strong>${filterDateStr}</strong> tarihine ait sipariş kaydı bulunmuyor.` : 'Henüz bekleyen veya tamamlanan sipariş kaydı bulunmuyor.'}
    </div>`;
    return;
  }

  container.innerHTML = orders.slice(0, 12).map(o => `
    <div class="order-card">
      <div class="order-top">
        <span class="order-dealer">${o.dealer}</span>
        <span class="badge-tag">${o.time}</span>
      </div>
      <div class="order-items-list">${o.items}</div>
      <div class="order-bottom">
        <span class="order-amount">${o.amount}</span>
        <button class="glass-btn">${o.status}</button>
      </div>
    </div>
  `).join('');
}

let STORAGE_KEY_CUSTOMER_REC = 'sat_panel_customer_receivables';
let customerReceivablesData = JSON.parse(localStorage.getItem('sat_panel_customer_receivables') || '[]');

let targetRecToDelete = null;
let pendingRecDeleteAmount = 0;

function saveCustomerReceivablesStorage() {
  localStorage.setItem(STORAGE_KEY_CUSTOMER_REC, JSON.stringify(customerReceivablesData));
}

function renderDebtLists() {
  const recList = document.getElementById('receivables-list');
  const topRec = document.getElementById('receivables-total-top-badge');

  const searchInp = document.getElementById('input-search-receivables');
  const sortSelect = document.getElementById('select-sort-receivables');

  const queryNorm = normalizeCigSearch(searchInp ? searchInp.value : '');
  const sortMode = sortSelect ? sortSelect.value : 'max-debt';

  let itemsList = [];

  // 1. Tüm Bayiler
  dealersData.forEach(d => {
    const debt = d.totalDebt || 0;
    itemsList.push({
      type: 'dealer',
      id: d.id,
      name: d.name,
      debt: debt,
      region: d.region || 'İstanbul',
      phone: d.phone || 'Telefon Belirtilmedi',
      isPaid: debt === 0,
      dueDate: null
    });
  });

  // 2. Manuel Müşteri Alacakları
  customerReceivablesData.forEach(c => {
    const debt = c.amount || 0;
    itemsList.push({
      type: 'customer',
      id: c.id,
      name: c.name,
      debt: debt,
      region: 'Müşteri Alacağı',
      phone: '',
      isPaid: debt === 0,
      dueDate: c.dueDate
    });
  });

  // Arama Filtrelemesi
  if (queryNorm) {
    itemsList = itemsList.filter(item => {
      const nameNorm = normalizeCigSearch(item.name);
      const regionNorm = normalizeCigSearch(item.region);
      return nameNorm.includes(queryNorm) || regionNorm.includes(queryNorm);
    });
  }

  // Sıralama Mantığı: En Çok Borcu Olan, En Az Borcu Olan, Alfabetik
  if (sortMode === 'max-debt') {
    itemsList.sort((a, b) => b.debt - a.debt);
  } else if (sortMode === 'min-debt') {
    itemsList.sort((a, b) => a.debt - b.debt);
  } else if (sortMode === 'alpha') {
    itemsList.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }

  let totalReceivablesAmount = 0;
  dealersData.forEach(d => totalReceivablesAmount += (d.totalDebt || 0));
  customerReceivablesData.forEach(c => totalReceivablesAmount += (c.amount || 0));

  if (topRec) {
    topRec.textContent = `TOPLAM: ₺ ${totalReceivablesAmount.toLocaleString('tr-TR')}`;
  }

  const drawerBadge = document.getElementById('drawer-receivables-badge');
  if (drawerBadge) {
    drawerBadge.textContent = `₺ ${totalReceivablesAmount.toLocaleString('tr-TR')}`;
  }

  if (!recList) return;

  if (itemsList.length === 0) {
    recList.innerHTML = `<div style="text-align:center; color:#64748b; padding:24px;">Aradığınız kriterlere uygun alacak kaydı bulunmuyor.</div>`;
    return;
  }

  recList.innerHTML = itemsList.map(item => {
    if (item.type === 'dealer') {
      const badgeHtml = item.isPaid
        ? `<span class="badge-tag" style="background:rgba(16,185,129,0.15); color:#34d399; font-weight:800;">Borçsuz</span>`
        : `<span class="badge-tag" style="background:rgba(244,63,94,0.15); color:#f43f5e; font-weight:800;">Vadeli Borçlu</span>`;

      const debtValHtml = item.isPaid
        ? `<div class="debt-val" style="color:#64748b; font-weight:700;">₺ 0</div>`
        : `<div class="debt-val text-rose" style="font-weight:900;">₺ ${item.debt.toLocaleString('tr-TR')}</div>`;

      const actionsHtml = item.isPaid
        ? `<div style="font-size:0.75rem; color:#64748b; font-style:italic;">Aktif borç kaydı bulunmuyor</div>`
        : `<div style="display:flex; gap:8px; align-items:center;">
            <button type="button" class="btn-emerald" onclick="openPayReceivableModal('dealer', '${item.id}')" style="padding:6px 12px; font-size:0.75rem; font-weight:800; cursor:pointer;">
              <svg class="icon-inline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="18"/><path d="M8 9h8a2 2 0 0 1 0 4H8a2 2 0 0 0 0 4h8"/></svg> Tahsil Et (Makbuz Kes)
            </button>
            <button type="button" class="btn-delete-action" onclick="initiateReceivableDelete('dealer', '${item.id}')" style="padding:6px 12px; font-size:0.75rem; cursor:pointer;">
              <svg class="icon-inline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Borcu Sil
            </button>
          </div>`;

      return `
        <div class="debt-card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding:14px 18px; background:#0f172a; border:1px solid #1e293b; border-radius:12px; margin-bottom:10px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <div class="debt-name" style="font-size:0.98rem; font-weight:800; color:#ffffff;">${item.name}</div>
              ${badgeHtml}
            </div>
            <div class="debt-terms" style="font-size:0.75rem; color:#94a3b8; margin-top:2px;">
              ${item.region} • ${item.phone}
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:16px;">
            ${debtValHtml}
            ${actionsHtml}
          </div>
        </div>
      `;
    } else {
      const dueDateText = item.dueDate ? new Date(item.dueDate).toLocaleDateString('tr-TR') : 'Vade Belirtilmedi';

      return `
        <div class="debt-card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding:14px 18px; background:#0f172a; border:1px solid rgba(16,185,129,0.3); border-radius:12px; margin-bottom:10px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <div class="debt-name" style="font-size:0.98rem; font-weight:800; color:#ffffff;">${item.name}</div>
              <span class="badge-tag" style="background:rgba(59,130,246,0.15); color:#60a5fa; font-weight:800;">Manuel Borç</span>
            </div>
            <div class="debt-terms" style="font-size:0.75rem; color:#94a3b8; margin-top:2px;">
              Vade Tarihi: <strong style="color:#fde68a;">${dueDateText}</strong>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:16px;">
            <div class="debt-val text-rose" style="font-weight:900;">₺ ${item.debt.toLocaleString('tr-TR')}</div>
            <div style="display:flex; gap:8px; align-items:center;">
              <button type="button" class="btn-emerald" onclick="openPayReceivableModal('customer', '${item.id}')" style="padding:6px 12px; font-size:0.75rem; font-weight:800; cursor:pointer;">
                <svg class="icon-inline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="18"/><path d="M8 9h8a2 2 0 0 1 0 4H8a2 2 0 0 0 0 4h8"/></svg> Tahsil Et (Makbuz Kes)
              </button>
              <button type="button" class="btn-delete-action" onclick="initiateReceivableDelete('customer', '${item.id}')" style="padding:6px 12px; font-size:0.75rem; cursor:pointer;">
                <svg class="icon-inline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Borcu Sil
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }).join('');
}

/* ==========================================================================
   16. PİYASA ZAM GEÇİŞİ & GENEL FİYAT GÜNCELLEME SİSTEMİ (İstenen Yeni Özellik)
   ========================================================================== */
function setupPriceIncreaseModule() {
  const drawerBtn = document.getElementById('drawer-btn-price-increase');
  const modal = document.getElementById('modal-price-increase');
  const closeBtn = document.getElementById('btn-close-price-increase-modal');
  const cancelBtn = document.getElementById('btn-cancel-price-increase');
  const saveBtn = document.getElementById('btn-save-price-increase');
  const resetBtn = document.getElementById('btn-reset-price-increase');
  const bulkInput = document.getElementById('input-bulk-price-increase');
  const applyBulkBtn = document.getElementById('btn-apply-bulk-increase');

  if (drawerBtn) {
    drawerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const panel = document.getElementById('drawer-panel');
      const backdrop = document.getElementById('drawer-backdrop');
      if (panel) panel.classList.remove('open');
      if (backdrop) backdrop.classList.remove('open');
      openPriceIncreaseModal();
    });
  }

  if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
  if (cancelBtn) cancelBtn.onclick = () => modal.classList.add('hidden');

  // En Üstteki Toplu Zam Uygula Butonu
  if (applyBulkBtn) {
    applyBulkBtn.onclick = () => {
      const increase = parseFloat(bulkInput.value) || 0;
      if (increase <= 0) {
        alert("Lütfen geçerli bir zam tutarı giriniz (Örn: 50 TL)!");
        return;
      }

      CIGARETTES_DB.forEach(cig => {
        const cInput = document.querySelector(`.increase-carton-inp[data-id="${cig.id}"]`);
        const pSpan = document.getElementById(`calc-increase-packet-${cig.id}`);
        const diffBadge = document.getElementById(`increase-diff-badge-${cig.id}`);

        if (cInput) {
          const newCarton = cig.cartonPrice + increase;
          cInput.value = newCarton;
          if (pSpan) {
            pSpan.textContent = `₺ ${Math.round((newCarton / 10) * 10) / 10}`;
          }
          if (diffBadge) {
            diffBadge.textContent = `+${increase} ₺ Zam`;
            diffBadge.style.background = 'rgba(249, 115, 22, 0.2)';
            diffBadge.style.color = '#f97316';
          }
        }
      });

      alert(`Tüm sigara karton fiyatlarına ₺${increase} zam eklendi! "Zam Geçişini Onayla" butonuna basarak piyasa ve bayi özel fiyatlarına yansıtabilirsiniz.`);
    };
  }

  // Zam Geçişini Kaydet & Bayi Özel Fiyatlarına Otomatik Yansıt
  if (saveBtn) {
    saveBtn.onclick = () => {
      let totalChangedCount = 0;

      CIGARETTES_DB.forEach(cig => {
        const cInput = document.querySelector(`.increase-carton-inp[data-id="${cig.id}"]`);
        const newCarton = cInput ? parseFloat(cInput.value) : cig.cartonPrice;

        if (!isNaN(newCarton) && newCarton !== cig.cartonPrice) {
          const diff = newCarton - cig.cartonPrice;
          cig.cartonPrice = newCarton;
          cig.packetPrice = Math.round((newCarton / 10) * 10) / 10;
          totalChangedCount++;

          // Her bir bayinin özel fiyatına bu farkı ekle
          dealersData.forEach(dealer => {
            if (dealer.customPrices && dealer.customPrices[cig.id]) {
              const currentCustomCarton = dealer.customPrices[cig.id].cartonPrice !== undefined
                ? dealer.customPrices[cig.id].cartonPrice
                : (cig.cartonPrice - diff);
              const updatedCustomCarton = Math.max(0, currentCustomCarton + diff);
              dealer.customPrices[cig.id].cartonPrice = updatedCustomCarton;
              dealer.customPrices[cig.id].packetPrice = Math.round((updatedCustomCarton / 10) * 10) / 10;
            }
          });
        }
      });

      localStorage.setItem(STORAGE_KEY_CIGS, JSON.stringify(CIGARETTES_DB));
      saveDealersToStorage();
      modal.classList.add('hidden');
      alert(`Zam geçişi başarıyla uygulandı!\nGenel piyasa standart fiyatları ve tüm satış noktalarının özel fiyatları güncellendi.`);
    };
  }

  // Varsayılan Liste Fiyatlarına Dön
  if (resetBtn) {
    resetBtn.onclick = () => {
      if (confirm("Piyasa fiyatlarını sistemin ilk orijinal fiyatlarına sıfırlamak istiyor musunuz?")) {
        localStorage.removeItem(STORAGE_KEY_CIGS);
        location.reload();
      }
    };
  }
}

function openPriceIncreaseModal() {
  const modal = document.getElementById('modal-price-increase');
  const tbody = document.getElementById('price-increase-tbody');
  const bulkInput = document.getElementById('input-bulk-price-increase');

  if (bulkInput) bulkInput.value = "";

  if (tbody) {
    tbody.innerHTML = CIGARETTES_DB.map(cig => {
      return `
        <tr>
          <td style="font-size:0.75rem; color:#94a3b8; font-weight:700;">${cig.brand}</td>
          <td><strong style="color:#ffffff;">${cig.name}</strong></td>
          <td style="text-align:center; font-family:var(--font-mono); color:#94a3b8;">₺${cig.cartonPrice}</td>
          <td style="text-align:center;">
            <input type="number" class="input-custom-price increase-carton-inp" data-id="${cig.id}" data-orig="${cig.cartonPrice}" value="${cig.cartonPrice}" min="0" />
          </td>
          <td style="text-align:center;">
            <span class="calculated-packet-price" id="calc-increase-packet-${cig.id}">₺ ${cig.packetPrice}</span>
          </td>
          <td style="text-align:center;">
            <span class="badge-tag" id="increase-diff-badge-${cig.id}" style="background:rgba(255,255,255,0.06); color:#94a3b8; font-size:0.75rem;">+0 ₺ Fark</span>
          </td>
        </tr>
      `;
    }).join('');

    // Canlı Değişim Dinleyicisi
    document.querySelectorAll('.increase-carton-inp').forEach(inp => {
      inp.oninput = () => {
        const id = inp.getAttribute('data-id');
        const orig = parseFloat(inp.getAttribute('data-orig')) || 0;
        const currentVal = parseFloat(inp.value) || 0;
        const diff = currentVal - orig;

        const pSpan = document.getElementById(`calc-increase-packet-${id}`);
        const diffBadge = document.getElementById(`increase-diff-badge-${id}`);

        if (pSpan) {
          pSpan.textContent = `₺ ${Math.round((currentVal / 10) * 10) / 10}`;
        }
        if (diffBadge) {
          if (diff > 0) {
            diffBadge.textContent = `+${diff} ₺ Zam`;
            diffBadge.style.background = 'rgba(249, 115, 22, 0.2)';
            diffBadge.style.color = '#f97316';
          } else if (diff < 0) {
            diffBadge.textContent = `${diff} ₺ İndirim`;
            diffBadge.style.background = 'rgba(16, 185, 129, 0.2)';
            diffBadge.style.color = '#34d399';
          } else {
            diffBadge.textContent = `+0 ₺ Fark`;
            diffBadge.style.background = 'rgba(255,255,255,0.06)';
            diffBadge.style.color = '#94a3b8';
          }
        }
      };
    });
  }

  if (modal) modal.classList.remove('hidden');
}

/* ==========================================================================
   15.5. STOK MİKTARI FORMATLAMA YARDIMCISI (KARTON + AÇIK PAKET / ADET)
   ========================================================================== */
function formatStockQuantity(totalCartonsFloat) {
  if (totalCartonsFloat === undefined || totalCartonsFloat === null || totalCartonsFloat <= 0) {
    return {
      cartons: 0,
      packets: 0,
      totalPackets: 0,
      text: "0 Karton",
      fullText: "0 Karton (0 Paket)",
      isZero: true
    };
  }

  // 1 Karton = 10 Paket (Adet)
  const totalPackets = Math.round(totalCartonsFloat * 10);
  const fullCartons = Math.floor(totalPackets / 10);
  const remainingPackets = totalPackets % 10;

  let text = "";
  if (fullCartons > 0 && remainingPackets > 0) {
    text = `${fullCartons} Karton + ${remainingPackets} Adet`;
  } else if (fullCartons > 0) {
    text = `${fullCartons} Karton`;
  } else {
    text = `${remainingPackets} Adet`;
  }

  let fullText = `${text} (${totalPackets} Paket)`;

  return {
    cartons: fullCartons,
    packets: remainingPackets,
    totalPackets: totalPackets,
    text: text,
    fullText: fullText,
    isZero: false
  };
}

/* ==========================================================================
   16. MEVCUT SİGARALAR (ANA EKRAN STOK TABLOSU - EN ÇOKTAN EN AZA SIRALI)
   ========================================================================== */
function renderHomeStockTable() {
  const tbody = document.getElementById('home-stock-tbody');
  const totalBadge = document.getElementById('home-total-stock-badge');
  if (!tbody) return;

  // Tüm sigaraları stok miktarına göre büyükten küçüğe sırala
  const stockList = CIGARETTES_DB.map(cig => {
    const cartons = inventoryStock[cig.id] !== undefined ? inventoryStock[cig.id] : 0;
    const totalVal = Math.round(cartons * cig.buyPrice);
    const stockInfo = formatStockQuantity(cartons);
    return {
      cig,
      cartons,
      stockInfo,
      totalVal
    };
  }).sort((a, b) => b.cartons - a.cartons);

  const totalCartonsSum = stockList.reduce((acc, itm) => acc + itm.cartons, 0);
  if (totalBadge) {
    totalBadge.textContent = `Toplam: ${formatStockQuantity(totalCartonsSum).fullText}`;
  }

  if (stockList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#94a3b8;">Henüz depoda kayıtlı sigara bulunmuyor.</td></tr>`;
    return;
  }

  const rowsHtml = stockList.map((item, idx) => {
    const cig = item.cig;
    const isZero = item.cartons <= 0;
    const hasLoose = item.stockInfo.packets > 0;
    const badgeClass = isZero ? "stock-fraction-tag" : (hasLoose ? "stock-fraction-tag has-loose" : "stock-fraction-tag");
    const badgeStyle = isZero
      ? "background:rgba(244,63,94,0.1); color:#f87171; border:1px solid rgba(244,63,94,0.25);"
      : (!hasLoose ? "background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.25);" : "");

    return `
      <tr>
        <td style="color:#64748b; font-family:var(--font-mono); font-weight:700;">#${idx + 1}</td>
        <td><strong style="color:#ffffff; font-size:0.85rem;">${cig.name}</strong></td>
        <td><span style="font-size:0.75rem; color:#94a3b8; font-weight:700;">${cig.brand}</span></td>
        <td style="text-align:center; font-family:var(--font-mono); color:#94a3b8;">₺${cig.buyPrice}</td>
        <td style="text-align:center; font-family:var(--font-mono); font-weight:700; color:#38bdf8;">₺${cig.cartonPrice}</td>
        <td style="text-align:center;">
          <span class="${badgeClass}" style="${badgeStyle}">
            ${item.stockInfo.text}
          </span>
        </td>
        <td style="text-align:right; font-family:var(--font-mono); font-weight:800; color:#ffffff;">
          ₺ ${item.totalVal.toLocaleString('tr-TR')}
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = rowsHtml;

  const dealerStockTbody = document.getElementById('dealer-page-stock-tbody');
  const dealerStockBadge = document.getElementById('dealer-page-stock-count-badge');
  if (dealerStockTbody) {
    dealerStockTbody.innerHTML = rowsHtml;
  }
  if (dealerStockBadge) {
    dealerStockBadge.textContent = `${stockList.length} Çeşit Sigara Depoda`;
  }
}

/* ==========================================================================
   17. BAYİ ALIM VE DEPO STOK YÖNETİMİ (PASTA GRAFİĞİ & DAHA ÖNCE ALINANLAR)
   ========================================================================== */
let stockPieChartInstance = null;

function renderStockPieChart() {
  const ctx = document.getElementById('stockPieChart');
  const legendEl = document.getElementById('stockPieLegend');
  const totalBadge = document.getElementById('stock-pie-total-badge');
  if (!ctx) return;

  // Stoğu 0'dan büyük olan sigaraları al
  const activeStockCigs = CIGARETTES_DB.map(c => ({
    name: c.name,
    brand: c.brand,
    cartons: inventoryStock[c.id] || 0
  })).filter(c => c.cartons > 0).sort((a, b) => b.cartons - a.cartons);

  let labels = [];
  let data = [];
  let totalStock = activeStockCigs.reduce((acc, c) => acc + c.cartons, 0);

  if (totalBadge) {
    totalBadge.textContent = `${Math.round(totalStock).toLocaleString('tr-TR')} Karton Toplam Stok`;
  }

  const vibrantColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
    '#06b6d4', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
    '#a855f7', '#d946ef', '#0ea5e9', '#22c55e', '#eab308'
  ];

  if (activeStockCigs.length === 0) {
    labels = ["Henüz Stok Yok"];
    data = [1];
  } else {
    // İlk 8 sigarayı ayrı, kalanını "Diğer Sigaralar" olarak grupla
    if (activeStockCigs.length <= 8) {
      labels = activeStockCigs.map(c => c.name);
      data = activeStockCigs.map(c => c.cartons);
    } else {
      const top7 = activeStockCigs.slice(0, 7);
      const rest = activeStockCigs.slice(7);
      const restSum = rest.reduce((acc, c) => acc + c.cartons, 0);

      labels = top7.map(c => c.name).concat(["Diğer Çeşitler"]);
      data = top7.map(c => c.cartons).concat([restSum]);
    }
  }

  const colors = data.map((_, i) => vibrantColors[i % vibrantColors.length]);

  if (stockPieChartInstance) {
    stockPieChartInstance.data.labels = labels;
    stockPieChartInstance.data.datasets[0].data = data;
    stockPieChartInstance.data.datasets[0].backgroundColor = colors;
    stockPieChartInstance.update();
  } else {
    stockPieChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#141c2e',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        animation: { animateScale: true, duration: 800 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0d111a',
            titleColor: '#38bdf8',
            bodyColor: '#ffffff',
            callbacks: {
              label: (item) => ` ${item.label}: ${item.raw} Karton`
            }
          }
        }
      }
    });
  }

  // Lejantı Doldur
  if (legendEl) {
    const sum = data.reduce((a, b) => a + b, 0) || 1;
    legendEl.innerHTML = labels.map((lbl, idx) => {
      const val = data[idx];
      const pct = Math.round((val / sum) * 100);
      return `
        <div class="legend-item">
          <div class="legend-left">
            <div class="legend-dot" style="background:${colors[idx]}"></div>
            <span class="legend-label" style="font-size:0.72rem; max-width:140px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${lbl}</span>
          </div>
          <span class="legend-value" style="font-size:0.72rem;">${val} Krt (%${pct})</span>
        </div>
      `;
    }).join('');
  }
}

function renderPurchaseHistoryTable() {
  const tbody = document.getElementById('purchase-history-tbody');
  const countBadge = document.getElementById('purchase-history-count-badge');
  if (!tbody) return;

  if (countBadge) {
    countBadge.textContent = `${purchaseHistory.length} Alım Kaydı`;
  }

  if (purchaseHistory.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:32px; color:#94a3b8;">Henüz bayiden toptan alım yapılmadı. Sağ üstteki "+ Bayiden Alım Yap" butonunu kullanarak stoğa sigara ekleyebilirsiniz.</td></tr>`;
    return;
  }

  tbody.innerHTML = purchaseHistory.map(p => {
    return `
      <tr>
        <td><strong style="color:#ffffff; font-size:0.85rem;">${p.date}</strong></td>
        <td style="text-align:center;">
          <button class="pill-btn active btn-show-purchase-detail" data-id="${p.id}" style="padding:4px 12px; font-size:0.75rem; font-weight:800; background:rgba(59,130,246,0.15); border-color:rgba(59,130,246,0.35); color:#60a5fa; cursor:pointer;">
            <svg class="icon-inline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> Alımları Gör
          </button>
        </td>
        <td style="text-align:center; font-family:var(--font-mono); font-weight:800; color:#60a5fa;">${p.totalKolies || 0} Koli</td>
        <td style="text-align:center; font-family:var(--font-mono); font-weight:800; color:#34d399;">${p.totalCartons || 0} Karton</td>
        <td style="text-align:right; font-family:var(--font-mono); font-weight:900; color:#ffffff;">
          ₺ ${(p.totalCost || 0).toLocaleString('tr-TR')}
        </td>
      </tr>
    `;
  }).join('');

  document.querySelectorAll('.btn-show-purchase-detail').forEach(btn => {
    btn.onclick = () => {
      const pid = btn.getAttribute('data-id');
      const purchase = purchaseHistory.find(p => p.id === pid);
      if (purchase) {
        openPurchaseDetailModal(purchase);
      }
    };
  });
}

/* ==========================================================================
   18. ALIM DETAYI MODALI (ALIMLARI GÖR & DÜZENLE)
   ========================================================================== */
let currentViewingPurchase = null;
let editingPurchaseItems = [];

function setupPurchaseDetailModal() {
  const modal = document.getElementById('modal-purchase-detail');
  const closeBtn = document.getElementById('btn-close-purchase-detail');
  const closeActionBtn = document.getElementById('btn-close-purchase-detail-action');
  const openEditBtn = document.getElementById('btn-open-edit-purchase-action');

  if (closeBtn && modal) {
    closeBtn.onclick = () => modal.classList.add('hidden');
  }
  if (closeActionBtn && modal) {
    closeActionBtn.onclick = () => modal.classList.add('hidden');
  }

  if (openEditBtn) {
    openEditBtn.onclick = () => {
      if (modal) modal.classList.add('hidden');
      if (currentViewingPurchase) {
        openEditPurchaseModal(currentViewingPurchase);
      }
    };
  }
}

function openPurchaseDetailModal(purchase) {
  currentViewingPurchase = purchase;

  const modal = document.getElementById('modal-purchase-detail');
  const titleEl = document.getElementById('purchase-detail-modal-title');
  const subEl = document.getElementById('purchase-detail-modal-sub');
  const tbody = document.getElementById('purchase-detail-items-tbody');
  const summaryEl = document.getElementById('purchase-detail-footer-summary');

  const statCostEl = document.getElementById('purchase-detail-stat-cost');
  const statCartonsEl = document.getElementById('purchase-detail-stat-cartons');
  const statRevenueEl = document.getElementById('purchase-detail-stat-revenue');
  const statProfitEl = document.getElementById('purchase-detail-stat-profit');
  const statMarginEl = document.getElementById('purchase-detail-stat-margin');

  if (titleEl) titleEl.textContent = `Toptan Alım Detayı & Kâr Analizi (${purchase.date})`;
  if (subEl) subEl.textContent = `Toplam ${purchase.totalCartons || 0} Karton (${purchase.totalKolies || 0} Koli) sigara alımı ve satıştan beklenen net kâr`;

  let grandCost = 0;
  let grandRevenue = 0;
  let grandProfit = 0;

  if (tbody) {
    if (purchase.items && Array.isArray(purchase.items) && purchase.items.length > 0) {
      tbody.innerHTML = purchase.items.map((item, idx) => {
        const dbCig = CIGARETTES_DB.find(c => c.name === item.name || c.id === item.cigId) || {};
        const buyPrice = item.buyPrice || dbCig.buyPrice || 0;
        const cartonPrice = item.cartonPrice || dbCig.cartonPrice || (buyPrice * 1.05);
        const totalCartons = item.totalCartons || 0;
        const itemCost = item.cost || (totalCartons * buyPrice);
        const itemRevenue = totalCartons * cartonPrice;
        const itemProfit = itemRevenue - itemCost;

        grandCost += itemCost;
        grandRevenue += itemRevenue;
        grandProfit += itemProfit;

        return `
          <tr>
            <td style="color:#64748b; font-family:var(--font-mono); font-weight:700;">#${idx + 1}</td>
            <td><strong style="color:#ffffff; font-size:0.85rem;">${item.name}</strong></td>
            <td><span class="brand-chip group-${item.group || (item.brand ? (item.brand.toLowerCase().includes('morris') ? 'pm' : (item.brand.toLowerCase().includes('jti') ? 'jti' : 'bat')) : 'bat')}" style="font-size:0.7rem;">${item.brand || 'Sigara'}</span></td>
            <td style="text-align:center; font-family:var(--font-mono); font-weight:800; color:#60a5fa;">${item.koliQty || 0}</td>
            <td style="text-align:center; font-family:var(--font-mono); font-weight:800; color:#34d399;">${totalCartons}</td>
            <td style="text-align:center; font-family:var(--font-mono); color:#94a3b8;">₺ ${(buyPrice).toLocaleString('tr-TR')}</td>
            <td style="text-align:center; font-family:var(--font-mono); font-weight:700; color:#38bdf8;">₺ ${(cartonPrice).toLocaleString('tr-TR')}</td>
            <td style="text-align:right; font-family:var(--font-mono); font-weight:800; color:#ffffff;">
              ₺ ${(Math.round(itemCost)).toLocaleString('tr-TR')}
            </td>
            <td style="text-align:right; font-family:var(--font-mono); font-weight:900; color:#34d399;">
              +₺ ${(Math.round(itemProfit)).toLocaleString('tr-TR')}
            </td>
          </tr>
        `;
      }).join('');
    } else {
      tbody.innerHTML = `<tr><td colspan="9" style="color:#cbd5e1; padding:16px;">${purchase.itemsDesc || 'Detay bulunamadı.'}</td></tr>`;
      grandCost = purchase.totalCost || 0;
      grandRevenue = grandCost * 1.05;
      grandProfit = grandRevenue - grandCost;
    }
  }

  const margin = grandCost > 0 ? ((grandProfit / grandCost) * 100).toFixed(1) : '0.0';

  if (statCostEl) statCostEl.textContent = `₺ ${Math.round(grandCost).toLocaleString('tr-TR')}`;
  if (statCartonsEl) statCartonsEl.textContent = `${purchase.totalCartons || 0} Karton (${purchase.totalKolies || 0} Koli)`;
  if (statRevenueEl) statRevenueEl.textContent = `₺ ${Math.round(grandRevenue).toLocaleString('tr-TR')}`;
  if (statProfitEl) statProfitEl.textContent = `+₺ ${Math.round(grandProfit).toLocaleString('tr-TR')}`;
  if (statMarginEl) statMarginEl.textContent = `%${margin} Net Kâr Marjı`;

  if (summaryEl) {
    summaryEl.textContent = `Toplam: ${purchase.totalCartons || 0} Karton (${purchase.totalKolies || 0} Koli) • Net Kâr: ₺ ${Math.round(grandProfit).toLocaleString('tr-TR')}`;
  }

  if (modal) modal.classList.remove('hidden');
}

function setupEditPurchaseModule() {
  const editModal = document.getElementById('modal-edit-purchase');
  const closeEditBtn = document.getElementById('btn-close-edit-purchase');
  const cancelEditBtn = document.getElementById('btn-cancel-edit-purchase');
  const openAddItemBtn = document.getElementById('btn-open-edit-purchase-add-item');
  const confirmFinalBtn = document.getElementById('btn-confirm-final-update-purchase');

  if (closeEditBtn && editModal) closeEditBtn.onclick = () => editModal.classList.add('hidden');
  if (cancelEditBtn && editModal) cancelEditBtn.onclick = () => editModal.classList.add('hidden');

  if (openAddItemBtn) {
    openAddItemBtn.onclick = () => openEditPurchaseAddItemModal();
  }

  // Alıma Sigara Ekle Modalı
  const addItemModal = document.getElementById('modal-edit-purchase-add-item');
  const closeAddItemBtn = document.getElementById('btn-close-edit-purchase-add-item');
  const doneAddItemBtn = document.getElementById('btn-done-edit-purchase-add-item');
  const searchAddCig = document.getElementById('input-search-edit-purchase-add-cig');

  if (closeAddItemBtn && addItemModal) closeAddItemBtn.onclick = () => addItemModal.classList.add('hidden');
  if (doneAddItemBtn && addItemModal) doneAddItemBtn.onclick = () => addItemModal.classList.add('hidden');

  if (searchAddCig) {
    searchAddCig.oninput = (e) => {
      renderEditPurchaseAddCatalog('all', e.target.value.toLowerCase().trim());
    };
  }

  const groupChips = document.querySelectorAll('#edit-purchase-add-group-chips .filter-chip');
  groupChips.forEach(chip => {
    chip.onclick = () => {
      groupChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const group = chip.getAttribute('data-group');
      const query = searchAddCig ? searchAddCig.value.toLowerCase().trim() : '';
      renderEditPurchaseAddCatalog(group, query);
    };
  });

  // Alımı Güncelle Butonu
  if (confirmFinalBtn) {
    confirmFinalBtn.onclick = () => {
      if (!currentViewingPurchase) return;

      if (editingPurchaseItems.length === 0) {
        alert("Alımda en az bir çeşit sigara bulunmalıdır!");
        return;
      }

      let grandTotalCost = 0;
      let grandTotalCartons = 0;
      let grandTotalKolies = 0;

      editingPurchaseItems.forEach(itm => {
        grandTotalCost += (itm.cost || 0);
        grandTotalCartons += (itm.totalCartons || 0);
        grandTotalKolies += (itm.koliQty || 0);
      });

      // 1. Depo Stok Dengelenmesi (Eski alımdaki miktarları depodan çıkar, yeni alımdaki miktarları depoya ekle)
      if (currentViewingPurchase.items && Array.isArray(currentViewingPurchase.items)) {
        currentViewingPurchase.items.forEach(oldItm => {
          const oldCartons = oldItm.totalCartons || ((oldItm.cartonQty || 0) + (oldItm.koliQty || 0) * 50);
          inventoryStock[oldItm.cigId] = Math.max(0, Math.round(((inventoryStock[oldItm.cigId] || 0) - oldCartons) * 100) / 100);
        });
      }

      editingPurchaseItems.forEach(newItm => {
        const newCartons = newItm.totalCartons;
        inventoryStock[newItm.cigId] = Math.round(((inventoryStock[newItm.cigId] || 0) + newCartons) * 100) / 100;
      });
      saveInventoryToStorage();

      // 2. Alım Kaydını Güncelle
      currentViewingPurchase.items = JSON.parse(JSON.stringify(editingPurchaseItems));
      currentViewingPurchase.totalCartons = grandTotalCartons;
      currentViewingPurchase.totalKolies = grandTotalKolies;
      currentViewingPurchase.totalCost = grandTotalCost;

      savePurchaseHistoryToStorage();
      renderPurchaseHistoryTable();
      renderHomeStockTable();
      renderStockPieChart();

      if (editModal) editModal.classList.add('hidden');
      alert(`Toptan alım kaydı başarıyla güncellendi! Yeni alım miktarları doğrudan depoya ve stoklara yansıtıldı.`);

      // Güncellenmiş detay modalını tekrar aç
      openPurchaseDetailModal(currentViewingPurchase);
    };
  }
}

function openEditPurchaseModal(purchase) {
  currentViewingPurchase = purchase;
  editingPurchaseItems = JSON.parse(JSON.stringify(purchase.items || []));

  const modal = document.getElementById('modal-edit-purchase');
  const titleEl = document.getElementById('edit-purchase-modal-title');
  const subEl = document.getElementById('edit-purchase-modal-sub');

  if (titleEl) titleEl.textContent = `Toptan Alımı Düzenle (${purchase.date})`;
  if (subEl) subEl.textContent = `1 Koli = 50 Karton. Miktarları +/- butonlarıyla değiştirin, yeni sigara ekleyin veya çıkarın.`;

  renderEditPurchaseItemsList();
  if (modal) modal.classList.remove('hidden');
}

function renderEditPurchaseItemsList() {
  const container = document.getElementById('edit-purchase-items-container');
  const liveTotalEl = document.getElementById('edit-purchase-live-total');
  const liveCartonsEl = document.getElementById('edit-purchase-live-cartons');
  const countBadge = document.getElementById('edit-purchase-items-count-badge');
  if (!container) return;

  let grandTotalCost = 0;
  let grandTotalCartons = 0;
  let grandTotalKolies = 0;

  editingPurchaseItems.forEach(itm => {
    grandTotalCost += (itm.cost || 0);
    grandTotalCartons += (itm.totalCartons || 0);
    grandTotalKolies += (itm.koliQty || 0);
  });

  if (liveTotalEl) liveTotalEl.textContent = `₺ ${grandTotalCost.toLocaleString('tr-TR')}`;
  if (liveCartonsEl) liveCartonsEl.textContent = `${grandTotalCartons} Karton (${grandTotalKolies} Koli)`;
  if (countBadge) countBadge.textContent = `${editingPurchaseItems.length} Çeşit Sigara`;

  if (editingPurchaseItems.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:36px 20px; color:#94a3b8; background:#090d18; border:1px dashed #334155; border-radius:10px;">
        <div style="font-size:1.8rem; margin-bottom:8px; color:#60a5fa;"><svg class="icon-inline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>
        <div style="font-weight:700; color:#cbd5e1;">Alımda şu an ürün bulunmuyor.</div>
        <div style="font-size:0.75rem; margin-top:4px;">Yukarıdaki "+ Sigara Ekle" butonunu kullanarak alıma yeni sigara ekleyebilirsiniz.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = editingPurchaseItems.map((itm, idx) => {
    const isBuying = itm.totalCartons > 0;
    const rowClass = isBuying ? 'edit-sale-row edit-purchase-row-active' : 'edit-sale-row edit-purchase-row-empty';
    const statusBadge = isBuying
      ? `<span style="background:rgba(16,185,129,0.18); border:1px solid #10b981; color:#34d399; font-weight:800; font-size:0.72rem; padding:2px 8px; border-radius:4px;">ALINIYOR (${itm.totalCartons} Karton)</span>`
      : `<span style="background:#1e293b; border:1px solid #475569; color:#94a3b8; font-weight:700; font-size:0.72rem; padding:2px 8px; border-radius:4px;">ALINMIYOR (0 Karton)</span>`;

    return `
      <div class="${rowClass}" id="edit-purchase-row-${idx}" style="border-radius:10px; padding:12px 16px; margin-bottom:8px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; transition:all 0.2s ease;">
        <div style="flex:1; min-width:190px;">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <strong style="color:#ffffff; font-size:0.9rem;">${itm.name}</strong>
            ${statusBadge}
          </div>
          <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
            <span style="font-size:0.72rem; color:#94a3b8;">${itm.brand || 'Sigara'}</span>
            <span style="font-size:0.72rem; color:#34d399; font-family:var(--font-mono); font-weight:700;">Birim Alış: ₺${(itm.buyPrice || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} / Karton</span>
          </div>
        </div>

        <!-- Koli ve Karton Sayısal Klavye Girişleri ve +/- Stepper'lar -->
        <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
          
          <!-- Koli Stepper (1 Koli = 50 Karton) -->
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:0.72rem; color:#60a5fa; font-weight:700; background:rgba(59,130,246,0.12); padding:3px 6px; border-radius:4px;">Koli (x50)</span>
            <div class="edit-sale-stepper-box">
              <button type="button" class="edit-sale-step-btn minus btn-edit-purchase-koli-minus" data-idx="${idx}">-</button>
              <input type="number" min="0" step="1" inputmode="numeric" pattern="[0-9]*" class="stepper-num-input inp-edit-purchase-koli" data-idx="${idx}" value="${itm.koliQty || 0}" title="Koli sayısını doğrudan girmek için tıklayın" />
              <button type="button" class="edit-sale-step-btn plus btn-edit-purchase-koli-plus" data-idx="${idx}">+</button>
            </div>
          </div>

          <!-- Karton Stepper -->
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:0.72rem; color:#34d399; font-weight:700; background:rgba(16,185,129,0.12); padding:3px 6px; border-radius:4px;">Karton</span>
            <div class="edit-sale-stepper-box">
              <button type="button" class="edit-sale-step-btn minus btn-edit-purchase-carton-minus" data-idx="${idx}">-</button>
              <input type="number" min="0" step="1" inputmode="numeric" pattern="[0-9]*" class="stepper-num-input inp-edit-purchase-carton" data-idx="${idx}" value="${itm.cartonQty || 0}" title="Karton sayısını doğrudan girmek için tıklayın" />
              <button type="button" class="edit-sale-step-btn plus btn-edit-purchase-carton-plus" data-idx="${idx}">+</button>
            </div>
          </div>

        </div>

        <!-- Toplam Karton ve Kalem Maliyeti -->
        <div style="display:flex; align-items:center; gap:14px;">
          <div style="text-align:right; min-width:95px;">
            <div style="font-size:0.72rem; color:#94a3b8; font-family:var(--font-mono);">${itm.totalCartons || 0} Karton</div>
            <div style="font-family:var(--font-mono); font-weight:900; color:#34d399; font-size:0.95rem;">
              ₺ ${(itm.cost || 0).toLocaleString('tr-TR')}
            </div>
          </div>

          <button type="button" class="btn-remove-edit-purchase-item" data-idx="${idx}" style="background:transparent; border:none; cursor:pointer; font-size:1.1rem; padding:4px;" title="Bu ürünü alımdan çıkar">
            <svg class="icon-inline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Sayısal Klavye ve Input Olayları (Doğrudan Yazma Desteği)
  container.querySelectorAll('.inp-edit-purchase-koli').forEach(inp => {
    inp.addEventListener('focus', () => inp.select());
    inp.addEventListener('input', (e) => {
      const idx = parseInt(inp.getAttribute('data-idx'));
      if (editingPurchaseItems[idx]) {
        const val = Math.max(0, parseInt(e.target.value) || 0);
        editingPurchaseItems[idx].koliQty = val;
        editingPurchaseItems[idx].totalCartons = (editingPurchaseItems[idx].cartonQty || 0) + (val * 50);
        editingPurchaseItems[idx].cost = editingPurchaseItems[idx].totalCartons * editingPurchaseItems[idx].buyPrice;
        renderEditPurchaseItemsList();
      }
    });
  });

  container.querySelectorAll('.inp-edit-purchase-carton').forEach(inp => {
    inp.addEventListener('focus', () => inp.select());
    inp.addEventListener('input', (e) => {
      const idx = parseInt(inp.getAttribute('data-idx'));
      if (editingPurchaseItems[idx]) {
        const val = Math.max(0, parseInt(e.target.value) || 0);
        editingPurchaseItems[idx].cartonQty = val;
        editingPurchaseItems[idx].totalCartons = val + ((editingPurchaseItems[idx].koliQty || 0) * 50);
        editingPurchaseItems[idx].cost = editingPurchaseItems[idx].totalCartons * editingPurchaseItems[idx].buyPrice;
        renderEditPurchaseItemsList();
      }
    });
  });

  // +/- Buton Olayları
  container.querySelectorAll('.btn-edit-purchase-koli-plus').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      if (editingPurchaseItems[idx]) {
        editingPurchaseItems[idx].koliQty = (editingPurchaseItems[idx].koliQty || 0) + 1;
        editingPurchaseItems[idx].totalCartons = (editingPurchaseItems[idx].cartonQty || 0) + (editingPurchaseItems[idx].koliQty * 50);
        editingPurchaseItems[idx].cost = editingPurchaseItems[idx].totalCartons * editingPurchaseItems[idx].buyPrice;
        renderEditPurchaseItemsList();
      }
    };
  });

  container.querySelectorAll('.btn-edit-purchase-koli-minus').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      if (editingPurchaseItems[idx]) {
        editingPurchaseItems[idx].koliQty = Math.max(0, (editingPurchaseItems[idx].koliQty || 0) - 1);
        editingPurchaseItems[idx].totalCartons = (editingPurchaseItems[idx].cartonQty || 0) + (editingPurchaseItems[idx].koliQty * 50);
        editingPurchaseItems[idx].cost = editingPurchaseItems[idx].totalCartons * editingPurchaseItems[idx].buyPrice;
        renderEditPurchaseItemsList();
      }
    };
  });

  container.querySelectorAll('.btn-edit-purchase-carton-plus').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      if (editingPurchaseItems[idx]) {
        editingPurchaseItems[idx].cartonQty = (editingPurchaseItems[idx].cartonQty || 0) + 1;
        editingPurchaseItems[idx].totalCartons = (editingPurchaseItems[idx].cartonQty || 0) + ((editingPurchaseItems[idx].koliQty || 0) * 50);
        editingPurchaseItems[idx].cost = editingPurchaseItems[idx].totalCartons * editingPurchaseItems[idx].buyPrice;
        renderEditPurchaseItemsList();
      }
    };
  });

  container.querySelectorAll('.btn-edit-purchase-carton-minus').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      if (editingPurchaseItems[idx]) {
        editingPurchaseItems[idx].cartonQty = Math.max(0, (editingPurchaseItems[idx].cartonQty || 0) - 1);
        editingPurchaseItems[idx].totalCartons = (editingPurchaseItems[idx].cartonQty || 0) + ((editingPurchaseItems[idx].koliQty || 0) * 50);
        editingPurchaseItems[idx].cost = editingPurchaseItems[idx].totalCartons * editingPurchaseItems[idx].buyPrice;
        renderEditPurchaseItemsList();
      }
    };
  });

  container.querySelectorAll('.btn-remove-edit-purchase-item').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      editingPurchaseItems.splice(idx, 1);
      renderEditPurchaseItemsList();
    };
  });
}

function openEditPurchaseAddItemModal() {
  const modal = document.getElementById('modal-edit-purchase-add-item');
  const searchInput = document.getElementById('input-search-edit-purchase-add-cig');
  if (searchInput) searchInput.value = '';
  renderEditPurchaseAddCatalog('all', '');
  if (modal) modal.classList.remove('hidden');
}

function renderEditPurchaseAddCatalog(group, query) {
  const container = document.getElementById('edit-purchase-catalog-list-container');
  if (!container) return;

  const filtered = CIGARETTES_DB.filter(c => {
    const matchGroup = group === 'all' || c.group === group;
    const matchQuery = !query || c.name.toLowerCase().includes(query) || c.brand.toLowerCase().includes(query);
    return matchGroup && matchQuery;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:24px; color:#94a3b8;">Aradığınız kriterde sigara bulunamadı.</div>`;
    return;
  }

  container.innerHTML = filtered.map(cig => {
    return `
      <div class="cigarette-card" style="margin-bottom:8px; padding:12px 14px; background:#0b1120; border:1px solid #1e293b; border-radius:10px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
        <div style="flex:1; min-width:180px;">
          <div style="font-weight:800; color:#ffffff; font-size:0.85rem;">${cig.name}</div>
          <div style="font-size:0.72rem; color:#34d399; font-weight:700; margin-top:2px;">Birim Alış: ₺${cig.buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} / Karton</div>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          <button type="button" class="btn-secondary btn-add-cig-to-purchase-edit" data-cig-id="${cig.id}" data-type="koli" style="padding:6px 12px; font-size:0.75rem; font-weight:800; background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; border-radius:6px; cursor:pointer;">
            + 1 Koli (50 Karton)
          </button>
          <button type="button" class="btn-secondary btn-add-cig-to-purchase-edit" data-cig-id="${cig.id}" data-type="carton" style="padding:6px 12px; font-size:0.75rem; font-weight:800; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.3); color:#34d399; border-radius:6px; cursor:pointer;">
            + 1 Karton
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-add-cig-to-purchase-edit').forEach(btn => {
    btn.onclick = () => {
      const cigId = btn.getAttribute('data-cig-id');
      const type = btn.getAttribute('data-type');
      const cig = CIGARETTES_DB.find(c => c.id === cigId);
      if (!cig) return;

      const existing = editingPurchaseItems.find(i => i.cigId === cig.id);
      if (existing) {
        if (type === 'koli') {
          existing.koliQty = (existing.koliQty || 0) + 1;
        } else {
          existing.cartonQty = (existing.cartonQty || 0) + 1;
        }
        existing.totalCartons = (existing.cartonQty || 0) + ((existing.koliQty || 0) * 50);
        existing.cost = existing.totalCartons * existing.buyPrice;
      } else {
        const koliQty = type === 'koli' ? 1 : 0;
        const cartonQty = type === 'carton' ? 1 : 0;
        const totalCartons = cartonQty + (koliQty * 50);
        editingPurchaseItems.push({
          cigId: cig.id,
          name: cig.name,
          brand: cig.brand,
          group: cig.group,
          koliQty: koliQty,
          cartonQty: cartonQty,
          totalCartons: totalCartons,
          buyPrice: cig.buyPrice,
          cost: totalCartons * cig.buyPrice
        });
      }

      renderEditPurchaseItemsList();
      btn.style.transform = 'scale(0.95)';
      setTimeout(() => { btn.style.transform = 'none'; }, 150);
    };
  });
}

/* ==========================================================================
   19. BAYİDEN ALIM YAP MODAL KONTROLÜ (KOLİ = 50 KARTON & KARTON STEPPER)
   ========================================================================== */
let purchaseCart = {}; // { cigId: { cartonQty: 0, koliQty: 0 } }
let purchaseActiveGroup = "all";
let purchaseSearchQuery = "";

function setupDealerPurchaseModule() {
  const openBtn = document.getElementById('btn-open-dealer-purchase-modal');
  const modal = document.getElementById('modal-dealer-purchase');
  const closeBtn = document.getElementById('btn-close-dealer-purchase');
  const cancelBtn = document.getElementById('btn-cancel-dealer-purchase');
  const confirmBtn = document.getElementById('btn-confirm-dealer-purchase');
  const searchInput = document.getElementById('input-search-purchase-cig');
  const groupChips = document.querySelectorAll('#purchase-group-chips .filter-chip');

  if (openBtn) openBtn.onclick = () => openDealerPurchaseModal();
  if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
  if (cancelBtn) cancelBtn.onclick = () => modal.classList.add('hidden');

  if (searchInput) {
    searchInput.oninput = (e) => {
      purchaseSearchQuery = e.target.value.toLowerCase().trim();
      renderPurchaseCigaretteList();
    };
  }

  groupChips.forEach(chip => {
    chip.onclick = () => {
      groupChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      purchaseActiveGroup = chip.getAttribute('data-group');
      renderPurchaseCigaretteList();
    };
  });

  if (confirmBtn) {
    confirmBtn.onclick = () => {
      const selectedItems = [];
      let grandTotalCost = 0;
      let grandTotalCartons = 0;
      let grandTotalKolies = 0;

      Object.keys(purchaseCart).forEach(cigId => {
        const item = purchaseCart[cigId];
        const cig = CIGARETTES_DB.find(c => c.id === cigId);
        if (cig && item && (item.cartonQty > 0 || item.koliQty > 0)) {
          const totalCartons = (item.cartonQty || 0) + ((item.koliQty || 0) * 50);
          const cost = totalCartons * cig.buyPrice;

          selectedItems.push({
            cigId: cig.id,
            name: cig.name,
            brand: cig.brand,
            cartonQty: item.cartonQty || 0,
            koliQty: item.koliQty || 0,
            totalCartons: totalCartons,
            buyPrice: cig.buyPrice,
            cost: cost
          });

          grandTotalCost += cost;
          grandTotalCartons += totalCartons;
          grandTotalKolies += (item.koliQty || 0);

          // Stoğa Ekle
          inventoryStock[cig.id] = (inventoryStock[cig.id] || 0) + totalCartons;
        }
      });

      if (selectedItems.length === 0) {
        alert("Lütfen alım yapmak için en az bir sigaradan miktar giriniz!");
        return;
      }

      // Alım Geçmişine Kayıt Oluştur (Detay Listesi Yapısal Olarak Saklanır)
      const descList = selectedItems.map(i => {
        let parts = [];
        if (i.koliQty > 0) parts.push(`${i.koliQty} Koli`);
        if (i.cartonQty > 0) parts.push(`${i.cartonQty} Karton`);
        return `${i.name} (${parts.join(' + ')} = ${i.totalCartons} Karton)`;
      }).join(', ');

      const now = new Date();
      purchaseHistory.unshift({
        id: "pch-" + Date.now(),
        date: "27 Ağustos 2026 " + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        itemsDesc: descList,
        items: selectedItems,
        totalKolies: grandTotalKolies,
        totalCartons: grandTotalCartons,
        totalCost: grandTotalCost
      });

      saveInventoryToStorage();
      savePurchaseHistoryToStorage();

      renderHomeStockTable();
      renderStockPieChart();
      renderPurchaseHistoryTable();

      modal.classList.add('hidden');
      alert(`Bayi/Fabrika Alımı Başarıyla Tamamlandı!\nToplam ${grandTotalCartons} karton (${grandTotalKolies} koli) sigara depoya eklendi.\nToplam Tutar: ₺${grandTotalCost.toLocaleString('tr-TR')}`);
    };
  }
}

function openDealerPurchaseModal() {
  const modal = document.getElementById('modal-dealer-purchase');
  const searchInput = document.getElementById('input-search-purchase-cig');
  purchaseCart = {};
  purchaseSearchQuery = "";
  purchaseActiveGroup = "all";

  if (searchInput) searchInput.value = "";

  document.querySelectorAll('#purchase-group-chips .filter-chip').forEach(c => {
    if (c.getAttribute('data-group') === 'all') c.classList.add('active');
    else c.classList.remove('active');
  });

  renderPurchaseCigaretteList();
  updatePurchaseLiveTotal();

  if (modal) modal.classList.remove('hidden');
}

function renderPurchaseCigaretteList() {
  const container = document.getElementById('purchase-cigarette-list-container');
  if (!container) return;

  const filtered = CIGARETTES_DB.filter(item => {
    const matchGroup = (purchaseActiveGroup === 'all') || (item.group === purchaseActiveGroup);
    const matchSearch = item.name.toLowerCase().includes(purchaseSearchQuery) || item.brand.toLowerCase().includes(purchaseSearchQuery);
    return matchGroup && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:#64748b; padding:40px;">Aradığınız kriterlere uygun sigara bulunamadı.</div>`;
    return;
  }

  container.innerHTML = filtered.map(cig => {
    const cartItem = purchaseCart[cig.id] || { cartonQty: 0, koliQty: 0 };
    const totalCartons = (cartItem.cartonQty || 0) + ((cartItem.koliQty || 0) * 50);
    const subtotal = totalCartons * cig.buyPrice;
    const currentDepotStock = inventoryStock[cig.id] || 0;

    return `
      <div class="cigarette-row-card draggable-card" draggable="true" data-cig-id="${cig.id}">
        <div class="cig-card-main-col">
          <div class="drag-handle" title="Sıralamayı değiştirmek için basılı tutup sürükleyin">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
          </div>
          <div class="cig-info">
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <span class="cig-brand-tag">${cig.brand}</span>
              <span class="badge-tag" style="background:rgba(255,255,255,0.06); color:#94a3b8; font-size:0.68rem; font-weight:700;">Mevcut Stok: ${currentDepotStock} Krt</span>
            </div>
            <span class="cig-name">${cig.name}</span>
            <div class="cig-prices">
              <span style="color:#34d399; font-weight:800;">Alış Fiyatı: ₺${cig.buyPrice} / Karton</span>
              <span style="color:#64748b;">•</span>
              <span style="color:#94a3b8;">Satış: ₺${cig.cartonPrice}</span>
            </div>
          </div>
        </div>

        <div class="cig-controls-group">
          <!-- Karton Kontrolü -->
          <div class="qty-control-box">
            <span class="qty-label carton" style="color:#60a5fa;">Karton</span>
            <div class="stepper-wrap">
              <button class="step-btn btn-pch-carton-minus" data-id="${cig.id}">-</button>
              <input type="number" class="qty-input input-pch-carton-qty" data-id="${cig.id}" value="${cartItem.cartonQty}" min="0" />
              <button class="step-btn btn-pch-carton-plus" data-id="${cig.id}">+</button>
            </div>
          </div>

          <!-- Koli Kontrolü (50 Karton) -->
          <div class="qty-control-box">
            <span class="qty-label packet" style="color:#34d399;">Koli (50'li)</span>
            <div class="stepper-wrap" style="border-color:rgba(16,185,129,0.3);">
              <button class="step-btn btn-pch-koli-minus" data-id="${cig.id}">-</button>
              <input type="number" class="qty-input input-pch-koli-qty" data-id="${cig.id}" value="${cartItem.koliQty}" min="0" />
              <button class="step-btn btn-pch-koli-plus" data-id="${cig.id}">+</button>
            </div>
          </div>

          <!-- Kalem Alış Ara Toplamı -->
          <div class="cig-subtotal" id="pch-subtotal-${cig.id}" style="color:#34d399; min-width:95px;">
            ₺ ${subtotal.toLocaleString('tr-TR')}
          </div>
        </div>
      </div>
    `;
  }).join('');

  bindPurchaseSteppers();
  setupListReordering('purchase-cigarette-list-container');
}

function bindPurchaseSteppers() {
  document.querySelectorAll('.btn-pch-carton-plus').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      if (!purchaseCart[id]) purchaseCart[id] = { cartonQty: 0, koliQty: 0 };
      purchaseCart[id].cartonQty++;
      updatePurchaseRowQty(id);
    };
  });

  document.querySelectorAll('.btn-pch-carton-minus').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      if (purchaseCart[id] && purchaseCart[id].cartonQty > 0) {
        purchaseCart[id].cartonQty--;
        updatePurchaseRowQty(id);
      }
    };
  });

  document.querySelectorAll('.btn-pch-koli-plus').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      if (!purchaseCart[id]) purchaseCart[id] = { cartonQty: 0, koliQty: 0 };
      purchaseCart[id].koliQty++;
      updatePurchaseRowQty(id);
    };
  });

  document.querySelectorAll('.btn-pch-koli-minus').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      if (purchaseCart[id] && purchaseCart[id].koliQty > 0) {
        purchaseCart[id].koliQty--;
        updatePurchaseRowQty(id);
      }
    };
  });

  document.querySelectorAll('.input-pch-carton-qty').forEach(inp => {
    inp.onchange = () => {
      const id = inp.getAttribute('data-id');
      const val = Math.max(0, parseInt(inp.value) || 0);
      if (!purchaseCart[id]) purchaseCart[id] = { cartonQty: 0, koliQty: 0 };
      purchaseCart[id].cartonQty = val;
      updatePurchaseRowQty(id);
    };
  });

  document.querySelectorAll('.input-pch-koli-qty').forEach(inp => {
    inp.onchange = () => {
      const id = inp.getAttribute('data-id');
      const val = Math.max(0, parseInt(inp.value) || 0);
      if (!purchaseCart[id]) purchaseCart[id] = { cartonQty: 0, koliQty: 0 };
      purchaseCart[id].koliQty = val;
      updatePurchaseRowQty(id);
    };
  });
}

function updatePurchaseRowQty(cigId) {
  const cig = CIGARETTES_DB.find(c => c.id === cigId);
  const cartItem = purchaseCart[cigId] || { cartonQty: 0, koliQty: 0 };

  const cInput = document.querySelector(`.input-pch-carton-qty[data-id="${cigId}"]`);
  const kInput = document.querySelector(`.input-pch-koli-qty[data-id="${cigId}"]`);
  const subtotalEl = document.getElementById(`pch-subtotal-${cigId}`);

  if (cInput) cInput.value = cartItem.cartonQty;
  if (kInput) kInput.value = cartItem.koliQty;

  if (subtotalEl && cig) {
    const totalCartons = (cartItem.cartonQty || 0) + ((cartItem.koliQty || 0) * 50);
    const sub = totalCartons * cig.buyPrice;
    subtotalEl.textContent = `₺ ${sub.toLocaleString('tr-TR')}`;
  }

  updatePurchaseLiveTotal();
}

function updatePurchaseLiveTotal() {
  let grandTotal = 0;
  let totalCartons = 0;
  let totalKolies = 0;
  let selectedCount = 0;

  Object.keys(purchaseCart).forEach(cigId => {
    const cig = CIGARETTES_DB.find(c => c.id === cigId);
    const cart = purchaseCart[cigId];
    if (cig && cart && (cart.cartonQty > 0 || cart.koliQty > 0)) {
      const cartons = (cart.cartonQty || 0) + ((cart.koliQty || 0) * 50);
      grandTotal += cartons * cig.buyPrice;
      totalCartons += cartons;
      totalKolies += (cart.koliQty || 0);
      selectedCount++;
    }
  });

  const totalEl = document.getElementById('purchase-live-total');
  const cartonsEl = document.getElementById('purchase-live-cartons');
  const summaryText = document.getElementById('purchase-summary-text');

  if (totalEl) totalEl.textContent = `₺ ${grandTotal.toLocaleString('tr-TR')}`;
  if (cartonsEl) cartonsEl.textContent = `${totalCartons} Karton (${totalKolies} Koli)`;
  if (summaryText) summaryText.textContent = `${selectedCount} çeşit sigara seçildi`;
}

/* ==========================================================================
   20. YENİ SİGARA ÇEŞİDİ EKLE MODAL KONTROLÜ (BAYİ ALIŞ & GENEL SATIŞ)
   ========================================================================== */
function setupAddNewCigaretteModal() {
  const openBtn = document.getElementById('btn-open-add-new-cig');
  const modal = document.getElementById('modal-add-new-cigarette');
  const closeBtn = document.getElementById('btn-close-add-new-cig');
  const cancelBtn = document.getElementById('btn-cancel-add-new-cig');
  const form = document.getElementById('form-add-new-cigarette');
  const cartonInp = document.getElementById('input-new-cig-carton-price');
  const previewPacket = document.getElementById('preview-new-packet-price');

  if (openBtn) {
    openBtn.onclick = () => {
      if (form) form.reset();
      if (previewPacket) previewPacket.textContent = "₺ 0";
      if (modal) modal.classList.remove('hidden');
    };
  }

  if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
  if (cancelBtn) cancelBtn.onclick = () => modal.classList.add('hidden');

  if (cartonInp && previewPacket) {
    cartonInp.oninput = () => {
      const val = parseFloat(cartonInp.value) || 0;
      const packetVal = Math.round((val / 10) * 10) / 10;
      previewPacket.textContent = `₺ ${packetVal}`;
    };
  }

  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById('input-new-cig-name').value.trim();
      const group = document.getElementById('input-new-cig-group').value;
      const buyPrice = parseFloat(document.getElementById('input-new-cig-buy-price').value) || 0;
      const cartonPrice = parseFloat(document.getElementById('input-new-cig-carton-price').value) || 0;
      const packetPrice = Math.round((cartonPrice / 10) * 10) / 10;

      const groupBrandMap = {
        "bat": "BAT Grubu",
        "pm": "Philip Morris",
        "jti": "JTI Grubu",
        "imperial": "Imperial",
        "other": "Diğer"
      };

      const newCig = {
        id: "cig-custom-" + Date.now(),
        group: group,
        brand: groupBrandMap[group] || "Diğer",
        name: name,
        buyPrice: buyPrice,
        cartonPrice: cartonPrice,
        packetPrice: packetPrice
      };

      // Kataloğun en başına ekle
      CIGARETTES_DB.unshift(newCig);
      localStorage.setItem(STORAGE_KEY_CIGS, JSON.stringify(CIGARETTES_DB));

      // Tüm listeleri güncelle
      renderCigaretteList();
      renderPurchaseCigaretteList();
      renderHomeStockTable();
      renderStockPieChart();

      modal.classList.add('hidden');
      alert(`"${name}" isimli sigara başarıyla kataloga eklendi!\nAlış: ₺${buyPrice} / Satış: ₺${cartonPrice} (Paket: ₺${packetPrice})`);
    };
  }
}

/* ==========================================================================
   21. SÜRÜKLE-BIRAK & BASILI TUTARAK SİGARA SIRALAMASINI DEĞİŞTİRME (DRAG & DROP)
   ========================================================================== */
function setupListReordering(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const cards = container.querySelectorAll('.cigarette-row-card.draggable-card');
  let draggedCard = null;
  let touchStartY = 0;

  cards.forEach(card => {
    // --- HTML5 Desktop Drag & Drop ---
    card.addEventListener('dragstart', (e) => {
      draggedCard = card;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.getAttribute('data-cig-id'));
    });

    card.addEventListener('dragend', () => {
      if (draggedCard) draggedCard.classList.remove('dragging');
      draggedCard = null;
      cards.forEach(c => c.classList.remove('drag-over'));
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!draggedCard || draggedCard === card) return;
      card.classList.add('drag-over');
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');
      if (!draggedCard || draggedCard === card) return;

      const sourceId = draggedCard.getAttribute('data-cig-id');
      const targetId = card.getAttribute('data-cig-id');

      performCigaretteReorder(sourceId, targetId);
    });

    // --- Tablet / Mobile Touch Events (Basılı Tutup Kaydırarak Sıralama) ---
    const handle = card.querySelector('.drag-handle') || card;
    let touchTimer = null;
    let isTouchDragging = false;

    handle.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;

      touchTimer = setTimeout(() => {
        isTouchDragging = true;
        card.classList.add('dragging');
        if (navigator.vibrate) navigator.vibrate(40);
      }, 200);
    }, { passive: true });

    handle.addEventListener('touchmove', (e) => {
      if (!isTouchDragging) {
        if (Math.abs(e.touches[0].clientY - touchStartY) > 10) {
          clearTimeout(touchTimer);
        }
        return;
      }
      e.preventDefault();

      const touchY = e.touches[0].clientY;
      const elemBelow = document.elementFromPoint(e.touches[0].clientX, touchY);
      const targetCard = elemBelow ? elemBelow.closest('.cigarette-row-card.draggable-card') : null;

      cards.forEach(c => c.classList.remove('drag-over'));
      if (targetCard && targetCard !== card) {
        targetCard.classList.add('drag-over');
      }
    }, { passive: false });

    handle.addEventListener('touchend', (e) => {
      clearTimeout(touchTimer);
      if (isTouchDragging) {
        isTouchDragging = false;
        card.classList.remove('dragging');

        const touchY = e.changedTouches[0].clientY;
        const elemBelow = document.elementFromPoint(e.changedTouches[0].clientX, touchY);
        const targetCard = elemBelow ? elemBelow.closest('.cigarette-row-card.draggable-card') : null;

        cards.forEach(c => c.classList.remove('drag-over'));

        if (targetCard && targetCard !== card) {
          const sourceId = card.getAttribute('data-cig-id');
          const targetId = targetCard.getAttribute('data-cig-id');
          performCigaretteReorder(sourceId, targetId);
        }
      }
    });

    handle.addEventListener('touchcancel', () => {
      clearTimeout(touchTimer);
      isTouchDragging = false;
      card.classList.remove('dragging');
      cards.forEach(c => c.classList.remove('drag-over'));
    });
  });
}

function performCigaretteReorder(sourceId, targetId) {
  const sourceIndex = CIGARETTES_DB.findIndex(c => c.id === sourceId);
  const targetIndex = CIGARETTES_DB.findIndex(c => c.id === targetId);

  if (sourceIndex !== -1 && targetIndex !== -1 && sourceIndex !== targetIndex) {
    const [movedItem] = CIGARETTES_DB.splice(sourceIndex, 1);
    CIGARETTES_DB.splice(targetIndex, 0, movedItem);

    // Yeni sıralamayı kalıcı olarak kaydet
    localStorage.setItem(STORAGE_KEY_CIGS, JSON.stringify(CIGARETTES_DB));

    // Hem satış hem bayi alım hem de ana ekran listelerini anında güncelle
    renderCigaretteList();
    renderPurchaseCigaretteList();
    renderHomeStockTable();
  }
}

/* ==========================================================================
   20. BAYİ ALIM FİYATLARINI GÜNCELLEME MODÜLÜ (KIRMIZI TUŞ & TOPLU ZAM)
   ========================================================================== */
let tempBuyPrices = {};

function setupDealerBuyPricesModule() {
  const modal = document.getElementById('modal-dealer-buy-prices');
  const openBtn = document.getElementById('btn-open-dealer-buy-prices-modal');
  const closeBtn = document.getElementById('btn-close-dealer-buy-prices');
  const cancelBtn = document.getElementById('btn-cancel-dealer-buy-prices');
  const searchInput = document.getElementById('input-search-dealer-buy-price');
  const bulkIncreaseInput = document.getElementById('input-bulk-dealer-buy-increase');
  const applyBulkBtn = document.getElementById('btn-apply-bulk-buy-increase');
  const saveBtn = document.getElementById('btn-save-dealer-buy-prices');
  const resetBtn = document.getElementById('btn-reset-dealer-buy-prices');

  function open() {
    tempBuyPrices = {};
    CIGARETTES_DB.forEach(c => {
      tempBuyPrices[c.id] = c.buyPrice;
    });
    if (searchInput) searchInput.value = '';
    if (bulkIncreaseInput) bulkIncreaseInput.value = '';
    renderDealerBuyPricesTable('');
    if (modal) modal.classList.remove('hidden');
  }

  function close() {
    if (modal) modal.classList.add('hidden');
  }

  if (openBtn) openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (cancelBtn) cancelBtn.addEventListener('click', close);

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderDealerBuyPricesTable(e.target.value.toLowerCase().trim());
    });
  }

  // Toplu Alış Fiyatı Zammı Ekleme (Örn: 10 TL ekle)
  if (applyBulkBtn && bulkIncreaseInput) {
    applyBulkBtn.addEventListener('click', () => {
      const addAmount = parseFloat(bulkIncreaseInput.value) || 0;
      if (addAmount <= 0) {
        alert("Lütfen geçerli bir zam tutarı giriniz (Örn: 10)!");
        return;
      }

      CIGARETTES_DB.forEach(c => {
        const current = tempBuyPrices[c.id] !== undefined ? tempBuyPrices[c.id] : c.buyPrice;
        tempBuyPrices[c.id] = Math.round((current + addAmount) * 100) / 100;
      });

      renderDealerBuyPricesTable(searchInput ? searchInput.value.toLowerCase().trim() : '');
      alert(`Tüm sigaraların bayi alış fiyatlarına +₺${addAmount} zam eklendi! Kaydetmek için 'Alış Fiyatlarını Kaydet & Güncelle' butonuna basınız.`);
    });
  }

  // Kaydet & Güncelle
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      CIGARETTES_DB.forEach(c => {
        if (tempBuyPrices[c.id] !== undefined) {
          c.buyPrice = Math.max(0, tempBuyPrices[c.id]);
        }
      });

      localStorage.setItem(STORAGE_KEY_CIGS, JSON.stringify(CIGARETTES_DB));
      updateDashboardMetrics();
      updateDynamicCharts();
      updateDailySalesReports();
      renderHomeStockTable();
      renderStockPieChart();

      close();
      alert("Bayi alım fiyatları başarıyla güncellendi ve depoya kaydedildi!");
    });
  }

  // Varsayılanlara Sıfırla
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm("Bayi alış fiyatlarını fabrika varsayılan liste değerlerine geri yüklemek istiyor musunuz?")) {
        CIGARETTES_DB.forEach(c => {
          tempBuyPrices[c.id] = c.cartonPrice * 0.96; // Varsayılan alış oranı
        });
        renderDealerBuyPricesTable(searchInput ? searchInput.value.toLowerCase().trim() : '');
      }
    });
  }
}

function renderDealerBuyPricesTable(filterQuery) {
  const tbody = document.getElementById('dealer-buy-prices-tbody');
  if (!tbody) return;

  const filtered = CIGARETTES_DB.filter(c => {
    if (!filterQuery) return true;
    return c.name.toLowerCase().includes(filterQuery) ||
      c.brand.toLowerCase().includes(filterQuery) ||
      c.group.toLowerCase().includes(filterQuery);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#64748b;">Aramanıza uygun sigara bulunamadı.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(cig => {
    const buyVal = tempBuyPrices[cig.id] !== undefined ? tempBuyPrices[cig.id] : cig.buyPrice;
    const margin = cig.cartonPrice - buyVal;
    const marginColor = margin >= 0 ? '#34d399' : '#f43f5e';

    return `
      <tr>
        <td>
          <span class="brand-chip group-${cig.group}" style="font-size:0.75rem;">${cig.brand}</span>
        </td>
        <td>
          <strong style="color:#ffffff;">${cig.name}</strong>
        </td>
        <td style="text-align:center; font-family:var(--font-mono); color:#94a3b8; font-weight:700;">
          ₺ ${cig.buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </td>
        <td style="text-align:center;">
          <input type="number" step="0.01" class="form-input inp-dealer-buy-price" data-cig-id="${cig.id}" value="${buyVal}" 
                 style="width:120px; text-align:center; color:#f87171; font-weight:800; font-family:var(--font-mono); background:#090d18; border:1px solid #334155; border-radius:6px; padding:6px 10px; margin:0 auto;" />
        </td>
        <td style="text-align:center; font-family:var(--font-mono); color:#60a5fa; font-weight:800;">
          ₺ ${cig.cartonPrice.toLocaleString('tr-TR')}
        </td>
        <td style="text-align:center; font-family:var(--font-mono); font-weight:800; color:${marginColor};">
          ₺ ${margin.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.inp-dealer-buy-price').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const cigId = inp.getAttribute('data-cig-id');
      const val = parseFloat(e.target.value) || 0;
      tempBuyPrices[cigId] = val;
    });
  });
}

/* ==========================================================================
   21. GEÇMİŞ SATIŞI GÖRÜNTÜLEME VE DÜZENLEME MODÜLÜ
   ========================================================================== */
let currentViewingSale = null;
let currentViewingDealer = null;
let editingSaleItems = [];

function setupViewAndEditSaleModule() {
  // 1. Satışı Görüntüle Modalı
  const viewModal = document.getElementById('modal-view-sale-detail');
  const closeViewBtn = document.getElementById('btn-close-view-sale');
  const closeViewActionBtn = document.getElementById('btn-close-view-sale-action');
  const openEditBtn = document.getElementById('btn-open-edit-sale-action');

  if (closeViewBtn) closeViewBtn.addEventListener('click', () => viewModal.classList.add('hidden'));
  if (closeViewActionBtn) closeViewActionBtn.addEventListener('click', () => viewModal.classList.add('hidden'));

  if (openEditBtn) {
    openEditBtn.addEventListener('click', () => {
      viewModal.classList.add('hidden');
      if (currentViewingSale && currentViewingDealer) {
        openEditSaleModal(currentViewingSale, currentViewingDealer);
      }
    });
  }

  // 2. Satışı Düzenle Modalı
  const editModal = document.getElementById('modal-edit-sale');
  const closeEditBtn = document.getElementById('btn-close-edit-sale');
  const cancelEditBtn = document.getElementById('btn-cancel-edit-sale');
  const openAddItemBtn = document.getElementById('btn-open-edit-sale-add-item');
  const proceedPaymentBtn = document.getElementById('btn-proceed-update-sale-payment');

  if (closeEditBtn) closeEditBtn.addEventListener('click', () => editModal.classList.add('hidden'));
  if (cancelEditBtn) cancelEditBtn.addEventListener('click', () => editModal.classList.add('hidden'));

  if (openAddItemBtn) {
    openAddItemBtn.addEventListener('click', () => {
      openEditSaleAddItemModal();
    });
  }

  if (proceedPaymentBtn) {
    proceedPaymentBtn.addEventListener('click', () => {
      if (editingSaleItems.length === 0) {
        alert("Satışta en az bir ürün bulunmalıdır!");
        return;
      }
      editModal.classList.add('hidden');
      openEditSalePaymentModal();
    });
  }

  // 3. Sigara Ekleme Modalı
  const addItemModal = document.getElementById('modal-edit-sale-add-item');
  const closeAddItemBtn = document.getElementById('btn-close-edit-sale-add-item');
  const doneAddItemBtn = document.getElementById('btn-done-edit-sale-add-item');
  const searchAddCig = document.getElementById('input-search-edit-sale-add-cig');

  if (closeAddItemBtn) closeAddItemBtn.addEventListener('click', () => addItemModal.classList.add('hidden'));
  if (doneAddItemBtn) doneAddItemBtn.addEventListener('click', () => addItemModal.classList.add('hidden'));

  if (searchAddCig) {
    searchAddCig.addEventListener('input', (e) => {
      renderEditSaleAddCatalog('all', e.target.value.toLowerCase().trim());
    });
  }

  const groupChips = document.querySelectorAll('#edit-sale-add-group-chips .filter-chip');
  groupChips.forEach(chip => {
    chip.addEventListener('click', () => {
      groupChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const group = chip.getAttribute('data-group');
      const query = searchAddCig ? searchAddCig.value.toLowerCase().trim() : '';
      renderEditSaleAddCatalog(group, query);
    });
  });

  // 4. Yeni Ödenen Tutarı Gir & Tamamla Modalı
  const paymentModal = document.getElementById('modal-edit-sale-payment');
  const closePaymentBtn = document.getElementById('btn-close-edit-sale-payment');
  const cancelPaymentBtn = document.getElementById('btn-cancel-edit-sale-payment');
  const confirmUpdateSaleBtn = document.getElementById('btn-confirm-final-update-sale');
  const newPaidInput = document.getElementById('input-edit-sale-new-paid');
  const fullPayBtn = document.getElementById('btn-edit-sale-full-pay');
  const fullPayCheck = document.getElementById('edit-sale-full-pay-check');

  if (closePaymentBtn) closePaymentBtn.addEventListener('click', () => paymentModal.classList.add('hidden'));
  if (cancelPaymentBtn) {
    cancelPaymentBtn.addEventListener('click', () => {
      paymentModal.classList.add('hidden');
      editModal.classList.remove('hidden');
    });
  }

  if (newPaidInput) {
    newPaidInput.addEventListener('input', () => {
      const orderTotal = editingSaleItems.reduce((acc, itm) => acc + itm.total, 0);
      const paid = Math.max(0, parseFloat(newPaidInput.value) || 0);
      const debt = Math.max(0, orderTotal - paid);
      const debtEl = document.getElementById('edit-sale-new-remaining-debt-val');
      if (debtEl) debtEl.textContent = `₺ ${debt.toLocaleString('tr-TR')} Borç`;

      if (paid >= orderTotal && orderTotal > 0) {
        if (fullPayCheck) fullPayCheck.classList.add('checked');
      } else {
        if (fullPayCheck) fullPayCheck.classList.remove('checked');
      }
    });
  }

  if (fullPayBtn && fullPayCheck && newPaidInput) {
    fullPayBtn.addEventListener('click', () => {
      const orderTotal = editingSaleItems.reduce((acc, itm) => acc + itm.total, 0);
      if (fullPayCheck.classList.contains('checked')) {
        fullPayCheck.classList.remove('checked');
        newPaidInput.value = 0;
      } else {
        fullPayCheck.classList.add('checked');
        newPaidInput.value = orderTotal;
      }
      newPaidInput.dispatchEvent(new Event('input'));
    });
  }

  // Tamam: Satışı Doğrudan Güncelle & Eski Kaydı Sil
  if (confirmUpdateSaleBtn) {
    confirmUpdateSaleBtn.addEventListener('click', () => {
      if (!currentViewingSale || !currentViewingDealer) return;

      const newOrderTotal = editingSaleItems.reduce((acc, itm) => acc + itm.total, 0);
      const newPaid = Math.max(0, parseFloat(newPaidInput.value) || 0);
      const newDebt = Math.max(0, newOrderTotal - newPaid);

      // 1. Depo Stok Dengelenmesi (Eski satıştaki adetleri iade et, yeni satıştaki adetleri düş)
      if (currentViewingSale.itemsList && Array.isArray(currentViewingSale.itemsList)) {
        currentViewingSale.itemsList.forEach(oldItm => {
          const oldCartons = oldItm.type === 'carton' ? oldItm.qty : (oldItm.qty / 10);
          inventoryStock[oldItm.cigId] = (inventoryStock[oldItm.cigId] || 0) + oldCartons;
        });
      }

      editingSaleItems.forEach(newItm => {
        const newCartons = newItm.type === 'carton' ? newItm.qty : (newItm.qty / 10);
        inventoryStock[newItm.cigId] = Math.max(0, Math.round(((inventoryStock[newItm.cigId] || 0) - newCartons) * 100) / 100);
      });
      saveInventoryToStorage();

      // 2. Satış Noktası Borç Bakiyesi Düzenlemesi
      const oldDebt = currentViewingSale.debt || 0;
      const debtDiff = newDebt - oldDebt;
      currentViewingDealer.totalDebt = Math.max(0, (currentViewingDealer.totalDebt || 0) + debtDiff);

      // İlgili Fiş No'ya ait borç kaydını güncelle veya sil
      if (currentViewingDealer.debts) {
        const matchDebt = currentViewingDealer.debts.find(d => d.desc && d.desc.includes(currentViewingSale.receipt));
        if (matchDebt) {
          if (newDebt > 0) {
            matchDebt.amount = newDebt;
            matchDebt.remaining = newDebt;
            matchDebt.status = "Ödeme Bekleniyor";
          } else {
            matchDebt.amount = newDebt;
            matchDebt.remaining = 0;
            matchDebt.status = "Ödendi (Kapatıldı)";
          }
        } else if (newDebt > 0) {
          currentViewingDealer.debts.unshift({
            id: "d-" + Date.now(),
            date: currentViewingSale.date.split(' ')[0] || "27 Ağustos 2026",
            desc: `Vadeli Sigara Siparişi (${currentViewingSale.receipt})`,
            dueDate: "15 Eylül 2026",
            amount: newDebt,
            remaining: newDebt,
            status: "Ödeme Bekleniyor"
          });
        }
      }

      // 3. Satış Kaydını Temizce Güncelle
      const itemsSummary = editingSaleItems.map(i => `${i.qty} ${i.type === 'carton' ? 'Karton' : 'Adet'} ${i.name}`).join(', ');
      currentViewingSale.itemsList = JSON.parse(JSON.stringify(editingSaleItems));
      currentViewingSale.items = itemsSummary;
      currentViewingSale.total = newOrderTotal;
      currentViewingSale.paid = newPaid;
      currentViewingSale.debt = newDebt;

      saveDealersToStorage();
      renderHomeStockTable();
      renderStockPieChart();
      openDedicatedDealerScreen(currentViewingDealer.id);
      renderDealersTable();

      paymentModal.classList.add('hidden');
      alert(`Satış kaydı (#${currentViewingSale.receipt}) başarıyla güncellendi! Yeni hesaplama doğrudan borç ve stoklara yansıtıldı.`);

      // Güncellenmiş döküm kutucuğunu tekrar göster
      openViewSaleDetailModal(currentViewingSale, currentViewingDealer);
    });
  }
}

/**
 * Satış Detayı Kutucuğunu Aç (Satışı Görüntüle)
 */
function openViewSaleDetailModal(sale, dealer) {
  currentViewingSale = sale;
  currentViewingDealer = dealer;

  const modal = document.getElementById('modal-view-sale-detail');
  const titleEl = document.getElementById('view-sale-modal-title');
  const subEl = document.getElementById('view-sale-modal-sub');
  const totalVal = document.getElementById('view-sale-total-val');
  const paidVal = document.getElementById('view-sale-paid-val');
  const debtVal = document.getElementById('view-sale-debt-val');
  const tbody = document.getElementById('view-sale-items-tbody');

  if (titleEl) titleEl.textContent = `Satış Detayı & Fiş Dökümü (${sale.receipt})`;
  if (subEl) subEl.textContent = `Satış Noktası: ${dealer.name} • Tarih: ${sale.date}`;
  if (totalVal) totalVal.textContent = `₺ ${sale.total.toLocaleString('tr-TR')}`;
  if (paidVal) paidVal.textContent = `₺ ${sale.paid.toLocaleString('tr-TR')}`;
  if (debtVal) debtVal.textContent = `₺ ${sale.debt.toLocaleString('tr-TR')}`;

  const items = sale.itemsList && Array.isArray(sale.itemsList) && sale.itemsList.length > 0
    ? sale.itemsList
    : parseSaleItemsString(sale.items, sale.total);

  if (tbody) {
    tbody.innerHTML = items.map((itm, idx) => `
      <tr>
        <td style="color:#64748b; font-family:var(--font-mono);">${idx + 1}</td>
        <td><strong style="color:#ffffff;">${itm.name}</strong></td>
        <td><span class="brand-chip group-${itm.brand ? (itm.brand.toLowerCase().includes('morris') ? 'pm' : (itm.brand.toLowerCase().includes('jti') ? 'jti' : 'bat')) : 'bat'}" style="font-size:0.7rem;">${itm.brand || 'Sigara'}</span></td>
        <td style="text-align:center; font-family:var(--font-mono); font-weight:800; color:#38bdf8;">
          ${itm.qty} ${itm.type === 'carton' ? 'Karton' : 'Adet'}
        </td>
        <td style="text-align:right; font-family:var(--font-mono); color:#94a3b8;">
          ₺ ${(itm.unitPrice || 0).toLocaleString('tr-TR')}
        </td>
        <td style="text-align:right; font-family:var(--font-mono); font-weight:800; color:#00f2fe;">
          ₺ ${(itm.total || (itm.qty * itm.unitPrice) || 0).toLocaleString('tr-TR')}
        </td>
      </tr>
    `).join('');
  }

  if (modal) modal.classList.remove('hidden');
}

/**
 * Satış Düzenleme Modalı Aç
 */
function openEditSaleModal(sale, dealer) {
  currentViewingSale = sale;
  currentViewingDealer = dealer;

  editingSaleItems = sale.itemsList && Array.isArray(sale.itemsList) && sale.itemsList.length > 0
    ? JSON.parse(JSON.stringify(sale.itemsList))
    : parseSaleItemsString(sale.items, sale.total);

  const modal = document.getElementById('modal-edit-sale');
  const titleEl = document.getElementById('edit-sale-modal-title');
  const subEl = document.getElementById('edit-sale-modal-sub');

  if (titleEl) titleEl.textContent = `Satışı Düzenle (${sale.receipt})`;
  if (subEl) subEl.textContent = `Satış Noktası: ${dealer.name} • Tarih: ${sale.date}`;

  renderEditSaleItemsList();
  if (modal) modal.classList.remove('hidden');
}

function renderEditSaleItemsList() {
  const container = document.getElementById('edit-sale-items-container');
  const liveTotalEl = document.getElementById('edit-sale-live-total');
  const countBadge = document.getElementById('edit-sale-items-count-badge');
  if (!container) return;

  const currentTotal = editingSaleItems.reduce((acc, itm) => acc + (itm.total || (itm.qty * itm.unitPrice)), 0);
  if (liveTotalEl) liveTotalEl.textContent = `₺ ${currentTotal.toLocaleString('tr-TR')}`;
  if (countBadge) countBadge.textContent = `${editingSaleItems.length} Ürün`;

  if (editingSaleItems.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:36px 20px; color:#94a3b8; background:#090d18; border:1px dashed #334155; border-radius:10px;">
        <div style="font-size:1.8rem; margin-bottom:8px; color:#60a5fa;"><svg class="icon-inline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>
        <div style="font-weight:700; color:#cbd5e1;">Satışta şu an ürün bulunmuyor.</div>
        <div style="font-size:0.75rem; margin-top:4px;">Yukarıdaki "+ Sigara Ekle" butonunu kullanarak satışa ürün ekleyebilirsiniz.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = editingSaleItems.map((itm, idx) => {
    const isSelling = itm.qty > 0;
    const statusBadge = isSelling
      ? `<span style="background:rgba(56,189,248,0.18); border:1px solid #38bdf8; color:#38bdf8; font-weight:800; font-size:0.72rem; padding:2px 8px; border-radius:4px;">SATILIYOR (${itm.qty} ${itm.type === 'carton' ? 'Karton' : 'Adet'})</span>`
      : `<span style="background:#1e293b; border:1px solid #475569; color:#94a3b8; font-weight:700; font-size:0.72rem; padding:2px 8px; border-radius:4px;">0 ADET</span>`;

    return `
      <div class="edit-sale-row" style="background:#0b1120; border:1px solid ${isSelling ? 'rgba(56,189,248,0.3)' : '#1e293b'}; border-radius:10px; padding:12px 16px; margin-bottom:8px;">
        <div style="flex:1; min-width:180px;">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <strong style="color:#ffffff; font-size:0.9rem;">${itm.name}</strong>
            ${statusBadge}
          </div>
          <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
            <span style="font-size:0.72rem; color:#94a3b8;">${itm.brand || 'Sigara'}</span>
            <span style="font-size:0.72rem; color:#60a5fa; font-family:var(--font-mono); font-weight:700;">Birim: ₺${(itm.unitPrice || 0).toLocaleString('tr-TR')}</span>
          </div>
        </div>

        <!-- Miktar Tipi ve +/- Butonları ve Sayısal Klavye Girişi -->
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          <span style="font-size:0.75rem; font-weight:700; color:${itm.type === 'carton' ? '#38bdf8' : '#a78bfa'}; background:#1e293b; padding:4px 8px; border-radius:6px;">
            ${itm.type === 'carton' ? 'Karton' : 'Adet (Paket)'}
          </span>

          <div class="edit-sale-stepper-box">
            <button type="button" class="edit-sale-step-btn minus btn-edit-qty-minus" data-idx="${idx}">-</button>
            <input type="number" min="0" step="1" inputmode="numeric" pattern="[0-9]*" class="stepper-num-input inp-edit-sale-qty" data-idx="${idx}" value="${itm.qty}" title="Miktarı doğrudan girmek için tıklayın" />
            <button type="button" class="edit-sale-step-btn plus btn-edit-qty-plus" data-idx="${idx}">+</button>
          </div>
        </div>

        <!-- Kalem Tutarı ve Sil Butonu -->
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="font-family:var(--font-mono); font-weight:900; color:#fdba74; font-size:0.95rem; min-width:80px; text-align:right;">
            ₺ ${(itm.qty * itm.unitPrice).toLocaleString('tr-TR')}
          </div>
          <button type="button" class="btn-remove-edit-item" data-idx="${idx}" style="background:transparent; border:none; cursor:pointer; font-size:1.1rem; padding:4px;" title="Bu ürünü satıştan çıkar">
            <svg class="icon-inline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Sayısal Giriş Olayları
  container.querySelectorAll('.inp-edit-sale-qty').forEach(inp => {
    inp.addEventListener('focus', () => inp.select());
    inp.addEventListener('input', (e) => {
      const idx = parseInt(inp.getAttribute('data-idx'));
      if (editingSaleItems[idx]) {
        const val = Math.max(0, parseInt(e.target.value) || 0);
        editingSaleItems[idx].qty = val;
        editingSaleItems[idx].total = val * editingSaleItems[idx].unitPrice;
        renderEditSaleItemsList();
      }
    });
  });

  container.querySelectorAll('.btn-edit-qty-plus').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      if (editingSaleItems[idx]) {
        editingSaleItems[idx].qty += 1;
        editingSaleItems[idx].total = editingSaleItems[idx].qty * editingSaleItems[idx].unitPrice;
        renderEditSaleItemsList();
      }
    };
  });

  container.querySelectorAll('.btn-edit-qty-minus').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      if (editingSaleItems[idx]) {
        editingSaleItems[idx].qty = Math.max(0, editingSaleItems[idx].qty - 1);
        editingSaleItems[idx].total = editingSaleItems[idx].qty * editingSaleItems[idx].unitPrice;
        renderEditSaleItemsList();
      }
    };
  });

  container.querySelectorAll('.btn-remove-edit-item').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      editingSaleItems.splice(idx, 1);
      renderEditSaleItemsList();
    };
  });
}

function openEditSaleAddItemModal() {
  const modal = document.getElementById('modal-edit-sale-add-item');
  const searchInput = document.getElementById('input-search-edit-sale-add-cig');
  if (searchInput) searchInput.value = '';
  renderEditSaleAddCatalog('all', '');
  if (modal) modal.classList.remove('hidden');
}

function renderEditSaleAddCatalog(group, query) {
  const container = document.getElementById('edit-sale-catalog-list-container');
  if (!container) return;

  const filtered = CIGARETTES_DB.filter(c => {
    const matchGroup = group === 'all' || c.group === group;
    const matchQuery = !query || c.name.toLowerCase().includes(query) || c.brand.toLowerCase().includes(query);
    return matchGroup && matchQuery;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:24px; color:#94a3b8;">Aradığınız kriterde sigara bulunamadı.</div>`;
    return;
  }

  container.innerHTML = filtered.map(cig => {
    const prices = getEffectiveCigarettePrice(cig, currentViewingDealer);
    return `
      <div class="cigarette-card" style="margin-bottom:8px; padding:12px 14px; background:#0b1120; border:1px solid #1e293b; border-radius:10px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
        <div style="flex:1; min-width:180px;">
          <div style="font-weight:800; color:#ffffff; font-size:0.85rem;">${cig.name}</div>
          <div style="font-size:0.72rem; color:#94a3b8; margin-top:2px;">${cig.brand}</div>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          <button type="button" class="btn-secondary btn-add-cig-to-edit" data-cig-id="${cig.id}" data-type="carton" style="padding:6px 12px; font-size:0.75rem; font-weight:800; background:rgba(56,189,248,0.12); border:1px solid rgba(56,189,248,0.3); color:#38bdf8; border-radius:6px; cursor:pointer;">
            + 1 Karton (₺${prices.cartonPrice})
          </button>
          <button type="button" class="btn-secondary btn-add-cig-to-edit" data-cig-id="${cig.id}" data-type="packet" style="padding:6px 12px; font-size:0.75rem; font-weight:800; background:rgba(167,139,250,0.12); border:1px solid rgba(167,139,250,0.3); color:#a78bfa; border-radius:6px; cursor:pointer;">
            + 1 Adet (₺${prices.packetPrice})
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-add-cig-to-edit').forEach(btn => {
    btn.onclick = () => {
      const cigId = btn.getAttribute('data-cig-id');
      const type = btn.getAttribute('data-type');
      const cig = CIGARETTES_DB.find(c => c.id === cigId);
      if (!cig) return;

      const prices = getEffectiveCigarettePrice(cig, currentViewingDealer);
      const unitPrice = type === 'carton' ? prices.cartonPrice : prices.packetPrice;
      const typeName = type === 'carton' ? "Karton" : "Adet (Paket)";

      const existing = editingSaleItems.find(i => i.cigId === cig.id && i.type === type);
      if (existing) {
        existing.qty += 1;
        existing.total = existing.qty * existing.unitPrice;
      } else {
        editingSaleItems.push({
          cigId: cig.id,
          name: cig.name,
          brand: cig.brand,
          type: type,
          typeName: typeName,
          unitPrice: unitPrice,
          qty: 1,
          total: unitPrice
        });
      }

      renderEditSaleItemsList();
      btn.style.transform = 'scale(0.95)';
      setTimeout(() => { btn.style.transform = 'none'; }, 150);
    };
  });
}

function openEditSalePaymentModal() {
  const modal = document.getElementById('modal-edit-sale-payment');
  const totalAmountEl = document.getElementById('edit-sale-payment-total-amount');
  const prevPaidEl = document.getElementById('edit-sale-prev-paid-display');
  const newPaidInput = document.getElementById('input-edit-sale-new-paid');
  const fullPayCheck = document.getElementById('edit-sale-full-pay-check');
  const remainingDebtEl = document.getElementById('edit-sale-new-remaining-debt-val');

  const newTotal = editingSaleItems.reduce((acc, itm) => acc + itm.total, 0);
  const prevPaid = currentViewingSale.paid || 0;

  if (totalAmountEl) totalAmountEl.textContent = `₺ ${newTotal.toLocaleString('tr-TR')}`;
  if (prevPaidEl) prevPaidEl.textContent = `₺ ${prevPaid.toLocaleString('tr-TR')}`;
  if (newPaidInput) newPaidInput.value = prevPaid > newTotal ? newTotal : prevPaid;

  const currentNewPaid = parseFloat(newPaidInput.value) || 0;
  const newDebt = Math.max(0, newTotal - currentNewPaid);

  if (remainingDebtEl) remainingDebtEl.textContent = `₺ ${newDebt.toLocaleString('tr-TR')} Borç`;
  if (fullPayCheck) {
    if (currentNewPaid >= newTotal && newTotal > 0) fullPayCheck.classList.add('checked');
    else fullPayCheck.classList.remove('checked');
  }

  if (modal) modal.classList.remove('hidden');
}

/**
 * Eski String Formatındaki Satışları Liste Formatına Çevirme Yardımcısı
 */
function parseSaleItemsString(itemsStr, saleTotal) {
  if (!itemsStr) return [];
  const parts = itemsStr.split(', ');
  return parts.map((part, idx) => {
    const match = part.match(/^(\d+)\s+(Karton|Adet)\s+(.*)$/);
    if (match) {
      const qty = parseInt(match[1]) || 1;
      const type = match[2] === 'Karton' ? 'carton' : 'packet';
      const name = match[3];
      const cig = CIGARETTES_DB.find(c => c.name.toLowerCase().includes(name.toLowerCase())) || CIGARETTES_DB[0];
      const unitPrice = type === 'carton' ? cig.cartonPrice : cig.packetPrice;
      return {
        cigId: cig.id,
        name: name,
        brand: cig.brand,
        type: type,
        typeName: type === 'carton' ? "Karton" : "Adet (Paket)",
        unitPrice: unitPrice,
        qty: qty,
        total: qty * unitPrice
      };
    }
    return {
      cigId: CIGARETTES_DB[0].id,
      name: part,
      brand: "Toptan Sigara",
      type: "carton",
      typeName: "Karton",
      unitPrice: saleTotal / parts.length,
      qty: 1,
      total: saleTotal / parts.length
    };
  });
}

/* ==========================================================================
   BÖLÜM 17: ÖDENECEK BORÇLAR (TEDARİKCİ) & SATIŞ SİLME ANİMASYON SİSTEMİ
   ========================================================================== */

const STORAGE_KEY_PAYABLES = 'sat_panel_payables';
let payablesData = [];
let targetPayableDebtId = null;

let targetDealerForDeletion = null;
let targetSaleIdForDeletion = null;

function initPayablesModule() {
  const saved = localStorage.getItem(STORAGE_KEY_PAYABLES);
  if (saved) {
    try {
      payablesData = JSON.parse(saved);
    } catch (e) {
      payablesData = getInitialPayables();
    }
  } else {
    payablesData = getInitialPayables();
    savePayablesToStorage();
  }

  setupPayablesEventHandlers();
  renderPayablesList();
}

function savePayablesToStorage() {
  localStorage.setItem(STORAGE_KEY_PAYABLES, JSON.stringify(payablesData));
  renderPayablesList();
}

function getInitialPayables() {
  const todayStr = new Date().toISOString().split('T')[0];
  return [
    {
      id: "p-1",
      recipient: "Philip Morris A.Ş.",
      amount: 120000,
      remaining: 120000,
      dueDate: todayStr,
      date: "2026-08-20",
      status: "Ödeme Bekleniyor"
    },
    {
      id: "p-2",
      recipient: "BAT Türkiye Tedarik",
      amount: 74200,
      remaining: 74200,
      dueDate: "2026-09-15",
      date: "2026-08-25",
      status: "Ödeme Bekleniyor"
    }
  ];
}

function isDateDueOrPast(dateStr) {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return dueDateOnly <= today;
}

function formatDateTR(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylul", "Ekim", "Kasım", "Aralık"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
  return dateStr;
}

function renderPayablesList() {
  const payList = document.getElementById('payables-list');
  const payBadge = document.getElementById('payables-total-top-badge');
  if (!payList) return;

  const totalRemaining = payablesData.reduce((acc, p) => acc + (p.remaining || 0), 0);
  if (payBadge) payBadge.textContent = `TOPLAM: ₺ ${totalRemaining.toLocaleString('tr-TR')}`;

  if (payablesData.length === 0) {
    payList.innerHTML = `<div style="text-align:center; color:#64748b; padding:28px;">Kayıtlı verilecek tedarikçi borcu bulunmuyor.</div>`;
    return;
  }

  payList.innerHTML = payablesData.map(p => {
    const isDue = isDateDueOrPast(p.dueDate);
    const dueDateDisplay = p.dueDate ? formatDateTR(p.dueDate) : 'Vade Yok';
    const statusTag = p.remaining === 0
      ? `<span class="badge-tag" style="background:rgba(16,185,129,0.15); color:#34d399;">Ödendi</span>`
      : isDue
        ? `<span class="badge-tag" style="background:rgba(244,63,94,0.15); color:#f43f5e;">Vadesi Geldi/Geçti</span>`
        : `<span class="badge-tag" style="background:rgba(245,158,11,0.15); color:#fde68a;">Vadeli (${dueDateDisplay})</span>`;

    return `
      <div class="payable-debt-card">
        <div>
          <div style="font-size:1rem; font-weight:800; color:#ffffff; margin-bottom:4px;">${p.recipient}</div>
          <div style="font-size:0.78rem; color:#94a3b8; display:flex; gap:12px; align-items:center;">
            <span>Vade: <strong style="color:${isDue && p.remaining > 0 ? '#f43f5e' : '#cbd5e1'};">${dueDateDisplay}</strong></span>
            <span>• ${statusTag}</span>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:16px;">
          <div style="text-align:right;">
            <div style="font-size:0.7rem; color:#64748b; font-weight:700;">KALAN BORÇ</div>
            <div style="font-family:var(--font-mono); font-size:1.1rem; font-weight:900; color:${p.remaining > 0 ? '#f43f5e' : '#10b981'};">
              ₺ ${(p.remaining || 0).toLocaleString('tr-TR')}
            </div>
          </div>
          <div class="payable-card-actions">
            ${p.remaining > 0 ? `<button type="button" class="btn-pay-action" onclick="openPayPayableModal('${p.id}')"><svg class="icon-inline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="18"/><path d="M8 9h8a2 2 0 0 1 0 4H8a2 2 0 0 0 0 4h8"/></svg> Ödeme Yap</button>` : ''}
            <button type="button" class="btn-delete-action" onclick="deletePayableDebt('${p.id}')"><svg class="icon-inline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Borcu Sil</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function checkPayablesDueAlert() {
  const dueItems = payablesData.filter(p => (p.remaining || 0) > 0 && isDateDueOrPast(p.dueDate));
  if (dueItems.length > 0) {
    const tbody = document.getElementById('payable-due-tbody');
    if (tbody) {
      tbody.innerHTML = dueItems.map(item => `
        <tr>
          <td><strong style="color:#ffffff;">${item.recipient}</strong></td>
          <td><span style="color:#f59e0b; font-weight:700;">${formatDateTR(item.dueDate)}</span></td>
          <td style="text-align:right; font-family:var(--font-mono); font-weight:900; color:#f43f5e;">
            ₺ ${(item.remaining || 0).toLocaleString('tr-TR')}
          </td>
        </tr>
      `).join('');
    }
    const modal = document.getElementById('modal-payable-due-alert');
    if (modal) modal.classList.remove('hidden');
  }
}

function setupPayablesEventHandlers() {
  const openBtn = document.getElementById('btn-open-add-payable-modal');
  const addModal = document.getElementById('modal-add-payable-debt');
  const closeAddBtn = document.getElementById('btn-close-add-payable');
  const cancelAddBtn = document.getElementById('btn-cancel-add-payable');
  const saveAddBtn = document.getElementById('btn-save-add-payable');

  if (openBtn) openBtn.onclick = () => {
    document.getElementById('input-payable-recipient').value = '';
    document.getElementById('input-payable-amount').value = '';
    document.getElementById('input-payable-duedate').value = '';
    if (addModal) addModal.classList.remove('hidden');
  };

  if (closeAddBtn) closeAddBtn.onclick = () => addModal.classList.add('hidden');
  if (cancelAddBtn) cancelAddBtn.onclick = () => addModal.classList.add('hidden');

  if (saveAddBtn) {
    saveAddBtn.onclick = () => {
      const recipient = document.getElementById('input-payable-recipient').value.trim();
      const amount = parseFloat(document.getElementById('input-payable-amount').value) || 0;
      const dueDate = document.getElementById('input-payable-duedate').value;

      if (!recipient) {
        alert("Lütfen kime/nereye ödeneceğini giriniz!");
        return;
      }
      if (amount <= 0) {
        alert("Lütfen geçerli bir tutar giriniz!");
        return;
      }

      payablesData.unshift({
        id: "p-" + Date.now(),
        recipient,
        amount,
        remaining: amount,
        dueDate: dueDate || null,
        date: new Date().toISOString().split('T')[0],
        status: "Ödeme Bekleniyor"
      });

      savePayablesToStorage();
      addModal.classList.add('hidden');
      if (typeof showToast === 'function') showToast("Ödenecek borç başarıyla eklendi.", "success");
    };
  }

  // Ödeme Yap Modalı
  const payModal = document.getElementById('modal-pay-payable-debt');
  const closePayBtn = document.getElementById('btn-close-pay-payable');
  const cancelPayBtn = document.getElementById('btn-cancel-pay-payable');
  const confirmPayBtn = document.getElementById('btn-confirm-pay-payable');

  if (closePayBtn) closePayBtn.onclick = () => payModal.classList.add('hidden');
  if (cancelPayBtn) cancelPayBtn.onclick = () => payModal.classList.add('hidden');

  if (confirmPayBtn) {
    confirmPayBtn.onclick = () => {
      const amountInput = document.getElementById('input-pay-payable-amount');
      const payAmount = parseFloat(amountInput.value) || 0;
      const target = payablesData.find(p => p.id === targetPayableDebtId);

      if (!target) return;
      if (payAmount <= 0) {
        alert("Lütfen geçerli bir ödeme miktarı giriniz!");
        return;
      }
      if (payAmount > target.remaining) {
        alert(`Girilen miktar kalan borçtan (₺${target.remaining.toLocaleString('tr-TR')}) fazla olamaz!`);
        return;
      }

      const confirmText = `${target.recipient} şirketine/kişisine ₺${payAmount.toLocaleString('tr-TR')} tutarında ödeme yapılacaktır. Onaylıyor musunuz?`;
      if (confirm(confirmText)) {
        target.remaining -= payAmount;
        if (target.remaining <= 0) {
          target.remaining = 0;
          target.status = "Ödendi";
        }
        savePayablesToStorage();
        payModal.classList.add('hidden');
        if (typeof showToast === 'function') showToast("Ödeme başarıyla işlendi.", "success");
      }
    };
  }

  // Alert kapatma butonları
  const alertModal = document.getElementById('modal-payable-due-alert');
  const closeAlertBtn = document.getElementById('btn-close-payable-alert');
  const closeAlertAction = document.getElementById('btn-close-payable-alert-action');
  if (closeAlertBtn) closeAlertBtn.onclick = () => alertModal.classList.add('hidden');
  if (closeAlertAction) closeAlertAction.onclick = () => alertModal.classList.add('hidden');

  const alert3DaysModal = document.getElementById('modal-3days-unpaid-alert');
  const close3DaysBtn = document.getElementById('btn-close-3days-alert');
  const close3DaysAction = document.getElementById('btn-close-3days-action');
  if (close3DaysBtn) close3DaysBtn.onclick = () => alert3DaysModal.classList.add('hidden');
  if (close3DaysAction) close3DaysAction.onclick = () => alert3DaysModal.classList.add('hidden');
}

function openPayPayableModal(id) {
  targetPayableDebtId = id;
  const target = payablesData.find(p => p.id === id);
  if (!target) return;

  const sub = document.getElementById('pay-payable-subtitle');
  const amountInput = document.getElementById('input-pay-payable-amount');

  if (sub) sub.textContent = `${target.recipient} (Kalan Borç: ₺${target.remaining.toLocaleString('tr-TR')})`;
  if (amountInput) amountInput.value = target.remaining;

  const modal = document.getElementById('modal-pay-payable-debt');
  if (modal) modal.classList.remove('hidden');
}

function deletePayableDebt(id) {
  const target = payablesData.find(p => p.id === id);
  if (!target) return;

  if (confirm(`${target.recipient} borç kaydını silmek istediğinizden emin misiniz?`)) {
    payablesData = payablesData.filter(p => p.id !== id);
    savePayablesToStorage();
    if (typeof showToast === 'function') showToast("Borç kaydı silindi.", "success");
  }
}

function initiateSaleDeletionProcess(dealer, saleId) {
  targetDealerForDeletion = dealer;
  targetSaleIdForDeletion = saleId;

  const modalStep1 = document.getElementById('modal-delete-sale-step1');
  if (modalStep1) modalStep1.classList.remove('hidden');
}

function setupSaleDeletionHandlers() {
  const step1 = document.getElementById('modal-delete-sale-step1');
  const closeStep1 = document.getElementById('btn-close-del-step1');
  const cancelStep1 = document.getElementById('btn-cancel-del-step1');
  const confirmStep1 = document.getElementById('btn-confirm-del-step1');

  const step2 = document.getElementById('modal-delete-sale-step2');
  const closeStep2 = document.getElementById('btn-close-del-step2');
  const cancelStep2 = document.getElementById('btn-cancel-del-step2');
  const confirmStep2 = document.getElementById('btn-confirm-del-step2');

  const successModal = document.getElementById('modal-delete-sale-success');

  if (closeStep1) closeStep1.onclick = () => step1.classList.add('hidden');
  if (cancelStep1) cancelStep1.onclick = () => step1.classList.add('hidden');

  if (confirmStep1) {
    confirmStep1.onclick = () => {
      step1.classList.add('hidden');
      if (step2) step2.classList.remove('hidden');
    };
  }

  if (closeStep2) closeStep2.onclick = () => step2.classList.add('hidden');
  if (cancelStep2) cancelStep2.onclick = () => step2.classList.add('hidden');

  if (confirmStep2) {
    confirmStep2.onclick = () => {
      step2.classList.add('hidden');

      if (targetDealerForDeletion && targetSaleIdForDeletion) {
        const d = targetDealerForDeletion;
        const sIndex = (d.sales || []).findIndex(s => s.id === targetSaleIdForDeletion);

        if (sIndex !== -1) {
          const deletedSale = d.sales[sIndex];
          d.sales.splice(sIndex, 1);

          if ((deletedSale.debt || 0) > 0) {
            d.totalDebt = Math.max(0, (d.totalDebt || 0) - deletedSale.debt);
          }

          saveDealersToStorage();
          renderDealerSalesList(d);
          openDedicatedDealerScreen(d.id);
          renderDealersTable();

          if (successModal) {
            successModal.classList.remove('hidden');
            setTimeout(() => {
              successModal.classList.add('hidden');
            }, 1600);
          }
        }
      }
    };
  }
}

/* ==========================================================================
   BÖLÜM 18: SİGARA VERİSİNİ DÜZENLE MODÜLÜ (İSİM, MARKA VE FİYAT GÜNCELLEME)
   ========================================================================== */

let editingTargetCigaretteId = null;
let activeEditCigGroupFilter = 'all';

function setupEditCigaretteDataModule() {
  const openBtn = document.getElementById('btn-open-edit-cig-data-modal');
  const listModal = document.getElementById('modal-edit-cig-data-list');
  const closeListBtn = document.getElementById('btn-close-edit-cig-list-modal');
  const closeListAction = document.getElementById('btn-close-edit-cig-list-action');
  const searchInput = document.getElementById('input-search-edit-cig-list');
  const chips = document.querySelectorAll('#edit-cig-group-chips .filter-chip');

  if (openBtn) {
    openBtn.onclick = () => {
      activeEditCigGroupFilter = 'all';
      if (searchInput) searchInput.value = '';
      chips.forEach(c => c.classList.remove('active'));
      const allChip = document.querySelector('#edit-cig-group-chips .filter-chip[data-group="all"]');
      if (allChip) allChip.classList.add('active');

      renderEditCigaretteDataList();
      if (listModal) listModal.classList.remove('hidden');
    };
  }

  if (closeListBtn) closeListBtn.onclick = () => listModal.classList.add('hidden');
  if (closeListAction) closeListAction.onclick = () => listModal.classList.add('hidden');

  if (searchInput) {
    searchInput.oninput = () => {
      renderEditCigaretteDataList();
    };
  }

  chips.forEach(chip => {
    chip.onclick = () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeEditCigGroupFilter = chip.getAttribute('data-group');
      renderEditCigaretteDataList();
    };
  });

  // Tekil düzenleme modalı
  const editModal = document.getElementById('modal-edit-single-cig');
  const closeEditBtn = document.getElementById('btn-close-edit-single-cig');
  const cancelEditBtn = document.getElementById('btn-cancel-edit-single-cig');
  const saveBtn = document.getElementById('btn-save-single-cig-data');

  if (closeEditBtn) closeEditBtn.onclick = () => editModal.classList.add('hidden');
  if (cancelEditBtn) cancelEditBtn.onclick = () => editModal.classList.add('hidden');

  const cartonInp = document.getElementById('input-edit-single-cig-carton-price');
  const packetInp = document.getElementById('input-edit-single-cig-packet-price');
  if (cartonInp) {
    cartonInp.oninput = () => {
      const cVal = parseFloat(cartonInp.value) || 0;
      if (packetInp) packetInp.value = Math.round((cVal / 10) * 10) / 10;
    };
  }

  if (saveBtn) {
    saveBtn.onclick = () => {
      if (!editingTargetCigaretteId) return;
      const cig = CIGARETTES_DB.find(c => c.id === editingTargetCigaretteId);
      if (!cig) return;

      const nameVal = document.getElementById('input-edit-single-cig-name').value.trim();
      const brandVal = document.getElementById('input-edit-single-cig-brand').value.trim();
      const cartonVal = parseFloat(document.getElementById('input-edit-single-cig-carton-price').value) || 0;
      const packetVal = parseFloat(document.getElementById('input-edit-single-cig-packet-price').value) || 0;
      const buyVal = parseFloat(document.getElementById('input-edit-single-cig-buy-price').value) || 0;

      if (!nameVal) {
        alert("Lütfen sigara adını boş bırakmayınız!");
        return;
      }
      if (cartonVal <= 0) {
        alert("Lütfen geçerli bir karton fiyatı giriniz!");
        return;
      }

      cig.name = nameVal;
      cig.brand = brandVal || cig.brand;
      cig.cartonPrice = cartonVal;
      cig.packetPrice = packetVal;
      cig.buyPrice = buyVal;

      localStorage.setItem(STORAGE_KEY_CIGS, JSON.stringify(CIGARETTES_DB));

      editModal.classList.add('hidden');
      renderEditCigaretteDataList();
      if (typeof renderCigaretteList === 'function') renderCigaretteList();
      if (typeof showToast === 'function') showToast(`${cig.name} verileri başarıyla güncellendi.`, 'success');
    };
  }
}

function renderEditCigaretteDataList() {
  const container = document.getElementById('edit-cig-list-container');
  if (!container) return;

  const searchInput = document.getElementById('input-search-edit-cig-list');
  const queryNorm = normalizeCigSearch(searchInput ? searchInput.value : '');

  const filtered = CIGARETTES_DB.filter(cig => {
    const matchGroup = (activeEditCigGroupFilter === 'all') || (cig.group === activeEditCigGroupFilter);
    if (!matchGroup) return false;
    if (!queryNorm) return true;

    const nameNorm = normalizeCigSearch(cig.name);
    const brandNorm = normalizeCigSearch(cig.brand);

    return nameNorm.includes(queryNorm) || brandNorm.includes(queryNorm);
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:#64748b; padding:32px;">Aramanıza uygun sigara bulunamadı.</div>`;
    return;
  }

  container.innerHTML = filtered.map(cig => {
    return `
      <div class="cig-edit-row-card" onclick="openEditSingleCigModal('${cig.id}')">
        <div>
          <div style="font-size:0.75rem; color:#f59e0b; font-weight:800; margin-bottom:2px;">${cig.brand}</div>
          <div style="font-size:0.95rem; font-weight:800; color:#ffffff;">${cig.name}</div>
          <div style="font-size:0.75rem; color:#94a3b8; margin-top:2px;">
            Alış Maliyeti: <strong style="color:#fde68a;">₺ ${cig.buyPrice}</strong>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:16px;">
          <div style="text-align:right;">
            <div style="font-size:0.85rem; font-weight:900; color:#00f2fe; font-family:var(--font-mono);">
              Karton: ₺ ${cig.cartonPrice}
            </div>
            <div style="font-size:0.78rem; font-weight:800; color:#34d399; font-family:var(--font-mono);">
              Paket: ₺ ${cig.packetPrice}
            </div>
          </div>
          <button type="button" class="btn-amber" style="padding:6px 12px; font-size:0.75rem; font-weight:800;">
            <svg class="icon-inline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Düzenle
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openEditSingleCigModal(id) {
  const cig = CIGARETTES_DB.find(c => c.id === id);
  if (!cig) return;

  editingTargetCigaretteId = id;

  const titleEl = document.getElementById('edit-single-cig-modal-title');
  const subEl = document.getElementById('edit-single-cig-modal-subtitle');
  const nameInp = document.getElementById('input-edit-single-cig-name');
  const brandInp = document.getElementById('input-edit-single-cig-brand');
  const cartonInp = document.getElementById('input-edit-single-cig-carton-price');
  const packetInp = document.getElementById('input-edit-single-cig-packet-price');
  const buyInp = document.getElementById('input-edit-single-cig-buy-price');

  if (titleEl) titleEl.textContent = `Düzenle: ${cig.name}`;
  if (subEl) subEl.textContent = `${cig.brand} • Fiyat ve İsim Güncelleme`;

  if (nameInp) nameInp.value = cig.name;
  if (brandInp) brandInp.value = cig.brand;
  if (cartonInp) cartonInp.value = cig.cartonPrice;
  if (packetInp) packetInp.value = cig.packetPrice;
  if (buyInp) buyInp.value = cig.buyPrice || 0;

  const modal = document.getElementById('modal-edit-single-cig');
  if (modal) modal.classList.remove('hidden');
}

/* ==========================================================================
   BÖLÜM 19: ALINACAK TOPLAM BORÇ (MÜŞTERİ ALACAKLARI, BORÇ SİLME VE TAHSİLAT)
   ========================================================================== */

function initiateReceivableDelete(type, id) {
  let targetName = '';
  let currentDebt = 0;

  if (type === 'dealer') {
    const d = dealersData.find(x => x.id === id);
    if (!d) return;
    targetName = d.name;
    currentDebt = d.totalDebt || 0;
  } else {
    const c = customerReceivablesData.find(x => x.id === id);
    if (!c) return;
    targetName = c.name;
    currentDebt = c.amount || 0;
  }

  targetRecToDelete = { type, id, name: targetName, currentDebt };

  const subEl = document.getElementById('del-rec-amount-subtitle');
  if (subEl) subEl.textContent = `${targetName} • Mevcut Borç: ₺${currentDebt.toLocaleString('tr-TR')}`;

  const amountInp = document.getElementById('input-del-rec-amount');
  if (amountInp) amountInp.value = currentDebt;

  const modal = document.getElementById('modal-delete-receivable-amount');
  if (modal) modal.classList.remove('hidden');
}

function setupCustomerReceivablesHandlers() {
  const searchInp = document.getElementById('input-search-receivables');
  const sortSelect = document.getElementById('select-sort-receivables');
  if (searchInp) searchInp.oninput = () => renderDebtLists();
  if (sortSelect) sortSelect.onchange = () => renderDebtLists();

  // Modal 30: + Borç Ekle Modalı
  const openAddBtn = document.getElementById('btn-open-add-receivable-modal');
  const addModal = document.getElementById('modal-add-receivable-debt');
  const closeAddBtn = document.getElementById('btn-close-add-rec-modal');
  const cancelAddBtn = document.getElementById('btn-cancel-add-rec');
  const saveAddBtn = document.getElementById('btn-save-add-rec');

  if (openAddBtn) {
    openAddBtn.onclick = () => {
      document.getElementById('input-add-rec-name').value = '';
      document.getElementById('input-add-rec-amount').value = '';
      document.getElementById('input-add-rec-duedate').value = '';
      if (addModal) addModal.classList.remove('hidden');
    };
  }

  if (closeAddBtn) closeAddBtn.onclick = () => addModal.classList.add('hidden');
  if (cancelAddBtn) cancelAddBtn.onclick = () => addModal.classList.add('hidden');

  if (saveAddBtn) {
    saveAddBtn.onclick = () => {
      const nameVal = document.getElementById('input-add-rec-name').value.trim();
      const amountVal = parseFloat(document.getElementById('input-add-rec-amount').value) || 0;
      const duedateVal = document.getElementById('input-add-rec-duedate').value;

      if (!nameVal) {
        alert("Lütfen ad soyad veya iş yeri adını giriniz!");
        return;
      }
      if (amountVal <= 0) {
        alert("Lütfen geçerli bir borç miktarı giriniz!");
        return;
      }

      customerReceivablesData.push({
        id: 'rec-' + Date.now(),
        name: nameVal,
        amount: amountVal,
        dueDate: duedateVal || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });

      saveCustomerReceivablesStorage();
      addModal.classList.add('hidden');
      renderDebtLists();
      if (typeof showToast === 'function') showToast(`${nameVal} için ₺${amountVal.toLocaleString('tr-TR')} borç eklendi.`, 'success');
    };
  }

  // Modal 31: Silinen Borç Kutucuğu (Miktar Girme -> Tamam -> Emin misiniz?)
  const amtModal = document.getElementById('modal-delete-receivable-amount');
  const closeAmtBtn = document.getElementById('btn-close-del-rec-amount');
  const cancelAmtBtn = document.getElementById('btn-cancel-del-rec-amount');
  const confirmAmtBtn = document.getElementById('btn-confirm-del-rec-amount');

  if (closeAmtBtn) closeAmtBtn.onclick = () => amtModal.classList.add('hidden');
  if (cancelAmtBtn) cancelAmtBtn.onclick = () => amtModal.classList.add('hidden');

  const confirmModal = document.getElementById('modal-delete-receivable-confirm');
  const closeConfirmBtn = document.getElementById('btn-close-del-rec-confirm');
  const cancelConfirmBtn = document.getElementById('btn-cancel-del-rec-confirm');
  const finalConfirmBtn = document.getElementById('btn-confirm-del-rec-final');
  const successModal = document.getElementById('modal-delete-receivable-success');

  if (confirmAmtBtn) {
    confirmAmtBtn.onclick = () => {
      if (!targetRecToDelete) return;
      const inputVal = parseFloat(document.getElementById('input-del-rec-amount').value) || 0;
      if (inputVal <= 0) {
        alert("Lütfen geçerli bir silinecek miktar giriniz!");
        return;
      }
      if (inputVal > targetRecToDelete.currentDebt) {
        alert(`Silinecek miktar mevcut borçtan (₺${targetRecToDelete.currentDebt.toLocaleString('tr-TR')}) fazla olamaz!`);
        return;
      }

      pendingRecDeleteAmount = inputVal;
      amtModal.classList.add('hidden');
      if (confirmModal) confirmModal.classList.remove('hidden');
    };
  }

  if (closeConfirmBtn) closeConfirmBtn.onclick = () => confirmModal.classList.add('hidden');
  if (cancelConfirmBtn) cancelConfirmBtn.onclick = () => confirmModal.classList.add('hidden');

  if (finalConfirmBtn) {
    finalConfirmBtn.onclick = () => {
      confirmModal.classList.add('hidden');

      if (!targetRecToDelete || pendingRecDeleteAmount <= 0) return;

      if (targetRecToDelete.type === 'dealer') {
        const d = dealersData.find(x => x.id === targetRecToDelete.id);
        if (d) {
          d.totalDebt = Math.max(0, (d.totalDebt || 0) - pendingRecDeleteAmount);
          saveDealersToStorage();
        }
      } else {
        const idx = customerReceivablesData.findIndex(x => x.id === targetRecToDelete.id);
        if (idx !== -1) {
          customerReceivablesData[idx].amount = Math.max(0, customerReceivablesData[idx].amount - pendingRecDeleteAmount);
          if (customerReceivablesData[idx].amount === 0) {
            customerReceivablesData.splice(idx, 1);
          }
          saveCustomerReceivablesStorage();
        }
      }

      renderDebtLists();
      renderDealersTable();

      if (successModal) {
        successModal.classList.remove('hidden');
        setTimeout(() => {
          successModal.classList.add('hidden');
        }, 1600);
      }
    };
  }
}

function openPayReceivableModal(type, id) {
  let targetName = '';
  let currentDebt = 0;
  let phone = '';
  let region = '';

  if (type === 'dealer') {
    const d = dealersData.find(x => x.id === id);
    if (!d) return;
    targetName = d.name;
    currentDebt = d.totalDebt || 0;
    phone = d.phone || '';
    region = d.region || 'İstanbul';
  } else {
    const c = customerReceivablesData.find(x => x.id === id);
    if (!c) return;
    targetName = c.name;
    currentDebt = c.amount || 0;
    phone = '';
    region = 'Müşteri Alacağı';
  }

  const payStr = prompt(`${targetName} borç tahsilatı yapılıyor.\nMevcut Borç: ₺${currentDebt.toLocaleString('tr-TR')}\n\nTahsil Edilen Tutar (₺):`, currentDebt);
  if (payStr === null) return;

  const payAmt = parseFloat(payStr) || 0;
  if (payAmt <= 0) {
    alert("Geçersiz tahsilat miktarı!");
    return;
  }
  if (payAmt > currentDebt) {
    alert(`Tahsilat miktarı mevcut borçtan (₺${currentDebt.toLocaleString('tr-TR')}) fazla olamaz!`);
    return;
  }

  if (confirm(`₺${payAmt.toLocaleString('tr-TR')} tutarında tahsilat yapılacaktır. Onaylıyor musunuz?`)) {
    let remainingDebt = currentDebt - payAmt;

    if (type === 'dealer') {
      const d = dealersData.find(x => x.id === id);
      if (d) {
        d.totalDebt = Math.max(0, (d.totalDebt || 0) - payAmt);
        saveDealersToStorage();
      }
    } else {
      const idx = customerReceivablesData.findIndex(x => x.id === id);
      if (idx !== -1) {
        customerReceivablesData[idx].amount = Math.max(0, customerReceivablesData[idx].amount - payAmt);
        if (customerReceivablesData[idx].amount === 0) {
          customerReceivablesData.splice(idx, 1);
        }
        saveCustomerReceivablesStorage();
      }
    }

    renderDebtLists();
    renderDealersTable();

    // Birebir aynı PDF & WhatsApp paylaşımlı Tahsilat Makbuzu / Fatura Modalı
    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR') + ' ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const receiptNo = 'MAK-' + Math.floor(1000 + Math.random() * 9000);

    openPaymentReceiptModal({
      receiptNo: receiptNo,
      dateStr: dateStr,
      dealerName: targetName,
      dealerRegion: region,
      dealerPhone: phone,
      prevTotalDebt: currentDebt,
      paidDebtAmount: payAmt,
      remainingTotalDebt: remainingDebt,
      isBulk: false
    });
  }
}

/* ==========================================================================
   BÖLÜM 20: SATIŞ NOKTASI BİLGİLERİNİ GÜNCELLEME VE BORÇ DETAYI DÜZENLEME
   ========================================================================== */

let targetDebtToEdit = null;

function setupMissingPhoneSaveHandler() {
  const savePhoneBtn = document.getElementById('btn-save-missing-phone');
  if (savePhoneBtn) {
    savePhoneBtn.onclick = () => {
      const val = document.getElementById('input-missing-phone-val').value.trim();
      if (!val || val.replace(/\D/g, '').length < 10) {
        alert("Lütfen geçerli bir telefon numarası giriniz (en az 10 hane)!");
        return;
      }

      if (currentInvoiceData && currentInvoiceData.dealerName) {
        const d = dealersData.find(x => x.name === currentInvoiceData.dealerName || x.phone === currentInvoiceData.dealerPhone);
        if (d) {
          d.phone = val;
          saveDealersToStorage();
          renderDealersTable();
        }
        currentInvoiceData.dealerPhone = val;
      } else if (currentActiveDealer) {
        currentActiveDealer.phone = val;
        saveDealersToStorage();
        renderDealersTable();
        if (currentInvoiceData) currentInvoiceData.dealerPhone = val;
      }

      document.getElementById('modal-missing-phone-warning').classList.add('hidden');
      if (typeof showToast === 'function') showToast("Telefon numarası kaydedildi.", "success");
      sendInvoiceViaWhatsApp();
    };
  }
}

function setupEditDealerInfoModule() {
  const openBtn = document.getElementById('btn-open-edit-dealer-info-modal');
  const modal = document.getElementById('modal-edit-dealer-info');
  const closeBtn = document.getElementById('btn-close-edit-dealer-info');
  const cancelBtn = document.getElementById('btn-cancel-edit-dealer-info');
  const saveBtn = document.getElementById('btn-save-edit-dealer-info');

  if (openBtn) {
    openBtn.onclick = () => {
      if (!currentActiveDealer) return;
      const nameInp = document.getElementById('input-edit-dealer-info-name');
      const phoneInp = document.getElementById('input-edit-dealer-info-phone');
      const regionInp = document.getElementById('input-edit-dealer-info-region');

      if (nameInp) nameInp.value = currentActiveDealer.name || '';
      if (phoneInp) phoneInp.value = currentActiveDealer.phone || '';
      if (regionInp) regionInp.value = currentActiveDealer.region || '';

      if (modal) modal.classList.remove('hidden');
    };
  }

  if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
  if (cancelBtn) cancelBtn.onclick = () => modal.classList.add('hidden');

  if (saveBtn) {
    saveBtn.onclick = () => {
      if (!currentActiveDealer) return;

      const nameVal = document.getElementById('input-edit-dealer-info-name').value.trim();
      const phoneVal = document.getElementById('input-edit-dealer-info-phone').value.trim();
      const regionVal = document.getElementById('input-edit-dealer-info-region').value.trim();

      if (!nameVal) {
        alert("Lütfen satış noktası adını boş bırakmayınız!");
        return;
      }

      currentActiveDealer.name = nameVal;
      currentActiveDealer.phone = phoneVal;
      currentActiveDealer.region = regionVal;

      saveDealersToStorage();
      modal.classList.add('hidden');
      openDedicatedDealerScreen(currentActiveDealer.id);
      renderDealersTable();
      if (typeof showToast === 'function') showToast(`${nameVal} bilgileri güncellendi.`, "success");
    };
  }
}

function openEditPendingDebtModal(debtId) {
  if (!currentActiveDealer || !currentActiveDealer.debts) return;
  const debt = currentActiveDealer.debts.find(d => d.id === debtId);
  if (!debt) return;

  targetDebtToEdit = debt;

  const descInp = document.getElementById('input-edit-debt-desc');
  const paidInp = document.getElementById('input-edit-debt-paid');
  const remInp = document.getElementById('input-edit-debt-remaining');
  const itemsText = document.getElementById('edit-pending-debt-items-text');

  if (descInp) descInp.value = debt.desc || '';
  if (paidInp) paidInp.value = debt.paid !== undefined ? debt.paid : Math.max(0, (debt.amount || 0) - (debt.remaining || 0));
  if (remInp) remInp.value = debt.remaining !== undefined ? debt.remaining : debt.amount;
  if (itemsText) itemsText.textContent = debt.itemsSummary || debt.desc || 'Satış Detay Kaydı';

  const modal = document.getElementById('modal-edit-pending-debt');
  if (modal) modal.classList.remove('hidden');
}

function setupEditPendingDebtModule() {
  const modal = document.getElementById('modal-edit-pending-debt');
  const closeBtn = document.getElementById('btn-close-edit-pending-debt');
  const cancelBtn = document.getElementById('btn-cancel-edit-pending-debt');
  const saveBtn = document.getElementById('btn-save-edit-pending-debt');

  if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
  if (cancelBtn) cancelBtn.onclick = () => modal.classList.add('hidden');

  if (saveBtn) {
    saveBtn.onclick = () => {
      if (!targetDebtToEdit || !currentActiveDealer) return;

      const descVal = document.getElementById('input-edit-debt-desc').value.trim();
      const paidVal = parseFloat(document.getElementById('input-edit-debt-paid').value) || 0;
      const remVal = parseFloat(document.getElementById('input-edit-debt-remaining').value) || 0;

      targetDebtToEdit.desc = descVal || targetDebtToEdit.desc;
      targetDebtToEdit.remaining = Math.max(0, remVal);
      targetDebtToEdit.paid = paidVal;

      if (targetDebtToEdit.remaining === 0) {
        targetDebtToEdit.status = 'Ödendi';
      }

      // Bayi toplam borcunu yeniden hesapla
      let sumDebt = 0;
      (currentActiveDealer.debts || []).forEach(d => {
        sumDebt += (d.remaining || 0);
      });
      currentActiveDealer.totalDebt = sumDebt;

      saveDealersToStorage();
      modal.classList.add('hidden');
      openDedicatedDealerScreen(currentActiveDealer.id);
      renderDealersTable();
      if (typeof showToast === 'function') showToast("Borç detayı ve bakiyesi başarıyla güncellendi.", "success");
    };
  }
}

/* ==========================================================================
   38. GECE 02:00 GÜN SONU DEVRI, TAKVIM ARŞIV VE 7 GÜNLÜK ZAMAN ÇIZELGESI MODÜLÜ
   ========================================================================== */
function getTodayCutoffMetrics() {
  const activeKey = getActiveBusinessDateStr();
  const activeDate = getActiveBusinessDate();
  const activeDay = activeDate.getDate();
  const activeMonth = activeDate.getMonth();
  const activeYear = activeDate.getFullYear();

  let todaySalesSum = 0;
  let todayProfitSum = 0;
  let todayDebtSum = 0;
  const activePointsSet = new Set();

  dealersData.forEach(d => {
    let dealerHadTodaySale = false;
    (d.sales || []).forEach(s => {
      const saleDate = getSaleBusinessDate(s.timestamp || s.date);
      const isToday = !s.isArchivedCutoff && (
        s.businessDateKey === activeKey ||
        (saleDate.day === activeDay && saleDate.month === activeMonth && saleDate.year === activeYear) ||
        !s.businessDateKey
      );

      if (isToday) {
        const saleTotal = s.total || s.totalAmount || 0;
        let saleProfit = s.netProfit;
        if (saleProfit === undefined || saleProfit === null) {
          if (s.itemsList && Array.isArray(s.itemsList) && s.itemsList.length > 0) {
            saleProfit = 0;
            s.itemsList.forEach(itm => {
              const cig = CIGARETTES_DB.find(c => c.id === itm.cigId);
              if (cig) {
                const buyPerUnit = itm.type === 'carton' ? (cig.buyPrice || 0) : ((cig.buyPrice || 0) / 10);
                const margin = (itm.unitPrice || 0) - buyPerUnit;
                saleProfit += margin * (itm.qty || 0);
              } else {
                saleProfit += (itm.total || 0) * 0.04;
              }
            });
          } else {
            saleProfit = saleTotal * 0.04;
          }
        }

        const remDebt = s.debt !== undefined ? s.debt : (s.remainingDebt !== undefined ? s.remainingDebt : Math.max(0, saleTotal - (s.paid || s.paidAmount || 0)));

        todaySalesSum += saleTotal;
        todayProfitSum += saleProfit;
        todayDebtSum += remDebt;
        dealerHadTodaySale = true;
      }
    });

    if (dealerHadTodaySale) {
      activePointsSet.add(d.id || d.name);
    }
  });

  return {
    sales: todaySalesSum,
    pointsCount: activePointsSet.size,
    profit: Math.round(todayProfitSum),
    debt: Math.round(todayDebtSum)
  };
}

function checkDailyCutoff() {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentHour = now.getHours();

  const lastCutoff = localStorage.getItem(STORAGE_KEY_LAST_CUTOFF) || '';

  // Gece 02:00 sonrasındaysak ve bugünün devri henüz yapılmadıysa
  if (currentHour >= 2 && lastCutoff !== todayStr && lastCutoff !== '') {
    performDayCutoff(todayStr, false);
  }
}

function performDayCutoff(targetDateStr, isManual = false) {
  const now = new Date();
  const todayKey = targetDateStr || getActiveBusinessDateStr();
  const metrics = getTodayCutoffMetrics();

  dailyHistoryStore[todayKey] = {
    sales: metrics.sales,
    profit: metrics.profit,
    pointsCount: metrics.pointsCount,
    debt: metrics.debt,
    count: metrics.pointsCount,
    dateStr: getActiveBusinessDate().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  };

  localStorage.setItem(STORAGE_KEY_DAILY_HISTORY, JSON.stringify(dailyHistoryStore));
  localStorage.setItem(STORAGE_KEY_LAST_CUTOFF, todayKey);

  if (isManual) {
    if (typeof showToast === 'function') {
      showToast("Gün Sonu Devri Yapıldı! Günlük veriler sıfırlandı ve geçmişe arşivlendi.");
    }
  }
}

function openCutoffConfirmPrompt() {
  const modal = document.getElementById('modal-cutoff-confirm-prompt');
  if (!modal) return;

  const metrics = getTodayCutoffMetrics();

  const salesEl = document.getElementById('prompt-today-sales');
  const pointsEl = document.getElementById('prompt-today-points');
  const profitEl = document.getElementById('prompt-today-profit');
  const debtEl = document.getElementById('prompt-today-debt');

  if (salesEl) salesEl.textContent = `₺ ${metrics.sales.toLocaleString('tr-TR')}`;
  if (pointsEl) pointsEl.textContent = `${metrics.pointsCount} Nokta`;
  if (profitEl) profitEl.textContent = `₺ ${metrics.profit.toLocaleString('tr-TR')}`;
  if (debtEl) debtEl.textContent = `₺ ${metrics.debt.toLocaleString('tr-TR')}`;

  const closeX = document.getElementById('btn-close-cutoff-confirm-x');
  const cancelBtn = document.getElementById('btn-cancel-cutoff-confirm');
  const proceedBtn = document.getElementById('btn-proceed-cutoff-confirm');

  if (closeX) closeX.onclick = () => modal.classList.add('hidden');
  if (cancelBtn) cancelBtn.onclick = () => modal.classList.add('hidden');
  if (proceedBtn) {
    proceedBtn.onclick = () => {
      modal.classList.add('hidden');
      startCutoffCelebrationFlow();
    };
  }

  modal.classList.remove('hidden');
}
window.openCutoffConfirmPrompt = openCutoffConfirmPrompt;

function setupDatePickerAndHistoryModule() {
  const dateInput = document.getElementById('topbar-date-input');
  const dateLabel = document.getElementById('live-date-label');
  const manualCutoffBtn = document.getElementById('btn-manual-day-cutoff');
  const returnTodayBtn = document.getElementById('btn-return-today-live');
  const banner = document.getElementById('history-mode-banner');
  const bannerText = document.getElementById('history-mode-text');

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  if (dateInput && !dateInput.value) {
    dateInput.value = todayStr;
  }

  const dateWrap = document.getElementById('topbar-date-picker-wrap');
  if (dateWrap && dateInput) {
    dateWrap.onclick = (e) => {
      if (e.target !== dateInput) {
        try {
          if (typeof dateInput.showPicker === 'function') {
            dateInput.showPicker();
          } else {
            dateInput.focus();
            dateInput.click();
          }
        } catch (err) {
          dateInput.focus();
          dateInput.click();
        }
      }
    };
  }

  const cutoffModal = document.getElementById('modal-day-cutoff-summary');
  const closeCutoffX = document.getElementById('btn-close-cutoff-summary-x');
  const cancelCutoffBtn = document.getElementById('btn-cancel-cutoff-summary');
  const confirmCutoffBtn = document.getElementById('btn-confirm-cutoff-action');
  const downloadCutoffPdfBtn = document.getElementById('btn-download-cutoff-pdf');

  if (manualCutoffBtn) {
    manualCutoffBtn.onclick = () => {
      openCutoffConfirmPrompt();
    };
  }

  if (closeCutoffX && cutoffModal) closeCutoffX.onclick = () => cutoffModal.classList.add('hidden');
  if (cancelCutoffBtn && cutoffModal) cancelCutoffBtn.onclick = () => cutoffModal.classList.add('hidden');

  if (confirmCutoffBtn) {
    confirmCutoffBtn.onclick = () => {
      startCutoffCelebrationFlow(todayStr);
    };
  }

  if (downloadCutoffPdfBtn) {
    downloadCutoffPdfBtn.onclick = () => downloadCutoffSummaryPDF();
  }

  if (returnTodayBtn) {
    returnTodayBtn.onclick = () => {
      currentSelectedDateStr = null;
      if (dateInput) dateInput.value = todayStr;
      if (dateLabel) dateLabel.textContent = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      if (banner) banner.classList.add('hidden');
      updateDashboardMetrics();
    };
  }

  if (dateInput) {
    dateInput.addEventListener('change', (e) => {
      const val = e.target.value;
      if (!val) return;

      if (val === todayStr) {
        currentSelectedDateStr = null;
        if (banner) banner.classList.add('hidden');
        if (dateLabel) dateLabel.textContent = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        updateDashboardMetrics();
      } else {
        currentSelectedDateStr = val;
        const formatted = new Date(val).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        if (dateLabel) dateLabel.textContent = formatted;

        if (banner) {
          banner.classList.remove('hidden');
          if (bannerText) bannerText.innerHTML = `Seçilen Tarih: <strong>${formatted}</strong>. Ekrandaki günlük veriler arşiv kaydından gösterilmektedir.`;
        }

        const record = dailyHistoryStore[val] || { sales: 0, profit: 0 };
        const totalSalesEl = document.getElementById('stat-total-sales');
        const totalProfitEl = document.getElementById('stat-total-profit');
        if (totalSalesEl) totalSalesEl.textContent = record.sales.toLocaleString('tr-TR');
        if (totalProfitEl) totalProfitEl.textContent = record.profit.toLocaleString('tr-TR');
      }
    });
  }
}

function setupTimelineNavigationModule() {
  const prevBtn = document.getElementById('btn-timeline-prev');
  const nextBtn = document.getElementById('btn-timeline-next');

  if (prevBtn) {
    prevBtn.onclick = () => {
      const maxOffset = Math.max(0, dailySalesData.length - 7);
      if (timelineWindowOffset < maxOffset) {
        timelineWindowOffset += 7;
        if (timelineWindowOffset > maxOffset) timelineWindowOffset = maxOffset;
        updateDynamicCharts();
        updateDailySalesReports();
      } else {
        if (typeof showToast === 'function') showToast("Daha eski bir tarih dilimi bulunmuyor.");
      }
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      if (timelineWindowOffset > 0) {
        timelineWindowOffset -= 7;
        if (timelineWindowOffset < 0) timelineWindowOffset = 0;
        updateDynamicCharts();
        updateDailySalesReports();
      } else {
        if (typeof showToast === 'function') showToast("En güncel (bugünkü) 7 günlük dilimdesiniz.");
      }
    };
  }
}

function setupFullReportModule() {
  const openBtn = document.getElementById('btn-open-full-report');
  const viewWeeklyBtn = document.getElementById('btn-view-weekly-report');
  const closeBtn = document.getElementById('btn-close-full-report-modal');
  const closeActionBtn = document.getElementById('btn-close-full-report-action');
  const downloadPdfBtn = document.getElementById('btn-download-report-pdf');

  if (openBtn) openBtn.onclick = () => openFullReportModal();
  if (viewWeeklyBtn) viewWeeklyBtn.onclick = () => openFullReportModal();

  const modal = document.getElementById('modal-full-report-analytics');
  if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
  if (closeActionBtn) closeActionBtn.onclick = () => modal.classList.add('hidden');

  if (downloadPdfBtn) {
    downloadPdfBtn.onclick = () => downloadFullReportPDF();
  }
}

function openFullReportModal() {
  const modal = document.getElementById('modal-full-report-analytics');
  if (!modal) return;

  const dateEl = document.getElementById('report-modal-current-date');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // 1. Günlük Veriler (Bugün)
  let todaySalesSum = 0;
  let todayProfitSum = 0;
  let todayOrderCount = 0;

  dealersData.forEach(d => {
    (d.sales || []).forEach(s => {
      todaySalesSum += (s.totalAmount || 0);
      todayProfitSum += (s.netProfit || 0);
      todayOrderCount++;
    });
  });

  document.getElementById('report-today-sales').textContent = `₺ ${todaySalesSum.toLocaleString('tr-TR')}`;
  document.getElementById('report-today-profit').textContent = `₺ ${Math.round(todayProfitSum).toLocaleString('tr-TR')}`;
  document.getElementById('report-today-count').textContent = `${todayOrderCount} Adet`;

  // 2. Haftalık Veriler (Son 7 Gün)
  const last7Days = dailySalesData.slice(-7);
  let weeklySales = 0;
  let weeklyProfit = 0;
  last7Days.forEach(d => {
    weeklySales += (d.sales || 0);
    weeklyProfit += (d.profit || 0);
  });
  const weeklyAvg = Math.round(weeklySales / Math.max(1, last7Days.length));

  document.getElementById('report-weekly-sales').textContent = `₺ ${weeklySales.toLocaleString('tr-TR')}`;
  document.getElementById('report-weekly-profit').textContent = `₺ ${Math.round(weeklyProfit).toLocaleString('tr-TR')}`;
  document.getElementById('report-weekly-avg').textContent = `₺ ${weeklyAvg.toLocaleString('tr-TR')}`;

  // 3. Aylık Veriler (Son 30 Gün / Tüm Zamanlar)
  let monthlySales = 0;
  let monthlyProfit = 0;
  dailySalesData.forEach(d => {
    monthlySales += (d.sales || 0);
    monthlyProfit += (d.profit || 0);
  });
  const marginPct = monthlySales > 0 ? Math.round((monthlyProfit / monthlySales) * 100) : 0;

  document.getElementById('report-monthly-sales').textContent = `₺ ${monthlySales.toLocaleString('tr-TR')}`;
  document.getElementById('report-monthly-profit').textContent = `₺ ${Math.round(monthlyProfit).toLocaleString('tr-TR')}`;
  document.getElementById('report-monthly-margin').textContent = `%${marginPct}`;

  // 4. Son 7 Günlük Kırılım Tablosu
  const tbody = document.getElementById('report-daily-breakdown-tbody');
  if (tbody) {
    tbody.innerHTML = last7Days.map(d => {
      const margin = d.sales > 0 ? Math.round((d.profit / d.sales) * 100) : 0;
      return `
        <tr>
          <td><strong style="color:#ffffff;">${d.label}</strong> <span style="font-size:0.75rem; color:#94a3b8;">(${d.dayName})</span></td>
          <td style="text-align:right; font-family:'JetBrains Mono', monospace; font-weight:800; color:#ffffff;">₺ ${d.sales.toLocaleString('tr-TR')}</td>
          <td style="text-align:right; font-family:'JetBrains Mono', monospace; font-weight:800; color:#34d399;">₺ ${Math.round(d.profit).toLocaleString('tr-TR')}</td>
          <td style="text-align:center; font-family:'JetBrains Mono', monospace; color:#60a5fa;">%${margin}</td>
        </tr>
      `;
    }).join('');
  }

  // 5. Öne Çıkan Satış Özeti
  const topItemsEl = document.getElementById('report-top-items-summary');
  if (topItemsEl) {
    topItemsEl.innerHTML = `
      <strong>Genel Satış Değerlendirmesi:</strong><br>
      • Bu ay toplam <strong>₺ ${monthlySales.toLocaleString('tr-TR')}</strong> ciro ve <strong>₺ ${Math.round(monthlyProfit).toLocaleString('tr-TR')}</strong> net kâr elde edilmiştir.<br>
      • Son 7 günde günlük ortalama ciro <strong>₺ ${weeklyAvg.toLocaleString('tr-TR')}</strong> seviyesinde gerçekleşmiştir.<br>
      • Sistemde <strong>${dealersData.length}</strong> aktif bayi ve satış noktası tanımlıdır. Toplam alacak bakiyesi <strong>₺ ${dealersData.reduce((acc, d) => acc + (d.totalDebt || 0), 0).toLocaleString('tr-TR')}</strong> olarak takip edilmektedir.
    `;
  }

  modal.classList.remove('hidden');
}

function downloadFullReportPDF() {
  const element = document.getElementById('full-report-printable-area');
  if (!element) return;

  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `01_TOPTAN_SATIS_VE_KAR_RAPORU_${dateStr}.pdf`;

  const opt = {
    margin: [10, 10, 10, 10],
    filename: fileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  if (window.html2pdf) {
    if (typeof showToast === 'function') showToast("Satış-Kâr Raporu PDF belgesi derleniyor...");
    window.html2pdf().set(opt).from(element).save();
  } else {
    window.print();
  }
}

function openDayCutoffSummaryModal() {
  const modal = document.getElementById('modal-day-cutoff-summary');
  if (!modal) return;

  const now = new Date();
  const dateSub = document.getElementById('cutoff-modal-date-subtitle');
  if (dateSub) {
    dateSub.innerHTML = `Vardiya Kapanış Tarihi: <strong>${now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })} • Saat 02:00</strong>`;
  }

  // Bugünkü Metrikleri Hesapla
  let todaySalesSum = 0;
  let todayProfitSum = 0;
  let todayOrderCount = 0;
  let todayNewDebtSum = 0;

  const debtorsMap = {};

  dealersData.forEach(d => {
    (d.sales || []).forEach(s => {
      todaySalesSum += (s.totalAmount || 0);
      todayProfitSum += (s.netProfit || 0);
      todayOrderCount++;

      const remDebt = s.remainingDebt !== undefined ? s.remainingDebt : Math.max(0, (s.totalAmount || 0) - (s.paidAmount || 0));
      if (remDebt > 0) {
        todayNewDebtSum += remDebt;

        if (!debtorsMap[d.id]) {
          debtorsMap[d.id] = {
            name: d.name,
            region: d.region || d.district || 'Merkez',
            todayDebt: 0,
            totalDebt: d.totalDebt || 0
          };
        }
        debtorsMap[d.id].todayDebt += remDebt;
      }
    });
  });

  const debtorsList = Object.values(debtorsMap).sort((a, b) => b.todayDebt - a.todayDebt);

  // Depo Stok ve Mal Varlığı Hesaplaması
  let totalDepotCartonsFloat = 0;
  let totalDepotCostVal = 0;
  let totalDepotSaleVal = 0;
  const depotStockList = [];

  CIGARETTES_DB.forEach(cig => {
    const cartonsFloat = inventoryStock[cig.id] || 0;
    if (cartonsFloat > 0) {
      const costVal = Math.round(cartonsFloat * (cig.buyPrice || 0));
      const saleVal = Math.round(cartonsFloat * (cig.cartonPrice || 0));
      totalDepotCartonsFloat += cartonsFloat;
      totalDepotCostVal += costVal;
      totalDepotSaleVal += saleVal;
      depotStockList.push({
        cig,
        cartonsFloat,
        stockInfo: formatStockQuantity(cartonsFloat),
        costVal,
        saleVal
      });
    }
  });

  depotStockList.sort((a, b) => b.cartonsFloat - a.cartonsFloat);
  const totalStockFormatted = formatStockQuantity(totalDepotCartonsFloat);

  // Metrik kartlarını doldur
  const salesEl = document.getElementById('cutoff-today-sales');
  const profitEl = document.getElementById('cutoff-today-profit');
  const marginEl = document.getElementById('cutoff-today-margin');
  const debtEl = document.getElementById('cutoff-today-debt');
  const countEl = document.getElementById('cutoff-today-count');
  const debtorsBadge = document.getElementById('cutoff-debtors-count-badge');

  const stockQtyEl = document.getElementById('cutoff-today-stock-qty');
  const stockSubEl = document.getElementById('cutoff-today-stock-sub');
  const stockValEl = document.getElementById('cutoff-today-stock-value');
  const stockValSubEl = document.getElementById('cutoff-today-stock-val-sub');
  const stockTypesBadge = document.getElementById('cutoff-stock-types-badge');

  if (salesEl) salesEl.textContent = `₺ ${todaySalesSum.toLocaleString('tr-TR')}`;
  if (profitEl) profitEl.textContent = `₺ ${Math.round(todayProfitSum).toLocaleString('tr-TR')}`;
  if (marginEl) {
    const margin = todaySalesSum > 0 ? Math.round((todayProfitSum / todaySalesSum) * 100) : 0;
    marginEl.textContent = `%${margin} Net Marj`;
  }
  if (debtEl) debtEl.textContent = `₺ ${Math.round(todayNewDebtSum).toLocaleString('tr-TR')}`;
  if (countEl) countEl.textContent = `${todayOrderCount} Adet`;
  if (debtorsBadge) debtorsBadge.textContent = `${debtorsList.length} Yer Borçlandı`;

  if (stockQtyEl) stockQtyEl.textContent = totalStockFormatted.text;
  if (stockSubEl) stockSubEl.textContent = `${totalStockFormatted.totalPackets.toLocaleString('tr-TR')} Paket Toplam Sayım`;
  if (stockValEl) stockValEl.textContent = `₺ ${totalDepotCostVal.toLocaleString('tr-TR')}`;
  if (stockValSubEl) stockValSubEl.textContent = `Satış Değeri: ₺ ${totalDepotSaleVal.toLocaleString('tr-TR')}`;
  if (stockTypesBadge) stockTypesBadge.textContent = `${depotStockList.length} Çeşit Sigara Depoda`;

  // Borçlu yerler tablosunu doldur
  const tbody = document.getElementById('cutoff-debtors-tbody');
  if (tbody) {
    if (debtorsList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; color:#94a3b8; padding:16px;">
            Bugün borca (veresiye) sigara alan satış noktası bulunmuyor. Tüm tahsilatlar peşin yapıldı!
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = debtorsList.map((d, idx) => `
        <tr>
          <td><strong style="color:#fbbf24;">#${idx + 1}</strong></td>
          <td><strong style="color:#ffffff;">${d.name}</strong></td>
          <td><span style="color:#94a3b8; font-size:0.75rem;">${d.region}</span></td>
          <td style="text-align:right; font-family:'JetBrains Mono', monospace; font-weight:800; color:#fb7185;">₺ ${d.todayDebt.toLocaleString('tr-TR')}</td>
          <td style="text-align:right; font-family:'JetBrains Mono', monospace; font-weight:700; color:#f43f5e;">₺ ${d.totalDebt.toLocaleString('tr-TR')}</td>
        </tr>
      `).join('');
    }
  }

  // Depo gün sonu sayım tablosunu doldur
  const stockTbody = document.getElementById('cutoff-warehouse-stock-tbody');
  if (stockTbody) {
    if (depotStockList.length === 0) {
      stockTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:16px;">Depoda stoklu ürün bulunmamaktadır.</td></tr>`;
    } else {
      stockTbody.innerHTML = depotStockList.map((itm, idx) => `
        <tr>
          <td style="color:#64748b; font-family:var(--font-mono); font-weight:700;">#${idx + 1}</td>
          <td><strong style="color:#ffffff;">${itm.cig.name}</strong></td>
          <td><span style="color:#94a3b8; font-size:0.75rem;">${itm.cig.brand}</span></td>
          <td style="text-align:center;">
            <span class="stock-fraction-tag ${itm.stockInfo.packets > 0 ? 'has-loose' : ''}" style="padding:2px 8px; font-size:0.75rem;">
              ${itm.stockInfo.text}
            </span>
          </td>
          <td style="text-align:center; font-family:'JetBrains Mono', monospace; color:#94a3b8;">₺ ${(itm.cig.buyPrice || 0).toLocaleString('tr-TR')}</td>
          <td style="text-align:right; font-family:'JetBrains Mono', monospace; font-weight:800; color:#34d399;">₺ ${itm.costVal.toLocaleString('tr-TR')}</td>
        </tr>
      `).join('');
    }
  }

  modal.classList.remove('hidden');
}

function startCutoffCelebrationFlow() {
  const cutoffModal = document.getElementById('modal-day-cutoff-summary');
  if (cutoffModal) cutoffModal.classList.add('hidden');

  const confirmModal = document.getElementById('modal-cutoff-confirm-prompt');
  if (confirmModal) confirmModal.classList.add('hidden');

  const celebrationModal = document.getElementById('modal-cutoff-celebration');
  const loadingView = document.getElementById('cutoff-loading-view');
  const successView = document.getElementById('cutoff-success-view');
  const progressBar = document.getElementById('cutoff-progress-bar');
  const progressText = document.getElementById('cutoff-progress-text');

  const metrics = getTodayCutoffMetrics();
  const currentActiveDate = getActiveBusinessDate();
  const currentKey = getActiveBusinessDateStr();
  const dateStrTR = currentActiveDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  if (celebrationModal) {
    if (loadingView) loadingView.classList.remove('hidden');
    if (successView) successView.classList.add('hidden');
    if (progressBar) progressBar.style.width = '20%';
    if (progressText) progressText.textContent = "Günlük satışlar ve borç devirleri hesaplanıyor (%20)...";
    celebrationModal.classList.remove('hidden');
  }

  setTimeout(() => {
    if (progressBar) progressBar.style.width = '60%';
    if (progressText) progressText.textContent = "Gün sonu raporu ve kâr verileri arşivleniyor (%60)...";
  }, 350);

  setTimeout(() => {
    if (progressBar) progressBar.style.width = '90%';
    if (progressText) progressText.textContent = "Gün sonu devri tamamlanıyor ve yeni gün hazırlanıyor (%90)...";
  }, 750);

  setTimeout(() => {
    if (progressBar) progressBar.style.width = '100%';
    if (progressText) progressText.textContent = "Gün Sonu Başarıyla Tamamlandı!";

    // Gün sonu verisini arşive kaydet
    dailyHistoryStore[currentKey] = {
      sales: metrics.sales,
      profit: metrics.profit,
      pointsCount: metrics.pointsCount,
      debt: metrics.debt,
      count: metrics.pointsCount,
      dateStr: dateStrTR
    };
    localStorage.setItem(STORAGE_KEY_DAILY_HISTORY, JSON.stringify(dailyHistoryStore));
    localStorage.setItem(STORAGE_KEY_LAST_CUTOFF, currentKey);

    // Mevcut satışları arşivlenmiş olarak işaretle
    dealersData.forEach(d => {
      (d.sales || []).forEach(s => {
        if (!s.isArchivedCutoff) {
          s.isArchivedCutoff = true;
          s.archivedDateKey = currentKey;
        }
      });
    });

    // Bir sonraki güne devret (+1 gün)
    const nextDate = new Date(currentActiveDate.getTime() + 24 * 60 * 60 * 1000);
    const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
    const nextDateLabelTR = nextDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

    localStorage.setItem('toptan_active_business_date', nextKey);

    const topbarDateInput = document.getElementById('topbar-date-input');
    const topbarDateLabel = document.getElementById('live-date-label');
    if (topbarDateInput) topbarDateInput.value = nextKey;
    if (topbarDateLabel) topbarDateLabel.textContent = nextDateLabelTR;
    currentSelectedDateStr = null;

    saveDealersToStorage();

    setTimeout(() => {
      if (loadingView) loadingView.classList.add('hidden');
      if (successView) successView.classList.remove('hidden');

      const salesEl = document.getElementById('celebrate-today-sales');
      const pointsEl = document.getElementById('celebrate-today-points');
      const profitEl = document.getElementById('celebrate-today-profit');
      const marginEl = document.getElementById('celebrate-today-margin');
      const debtEl = document.getElementById('celebrate-today-debt');

      const marginPct = metrics.sales > 0 ? Math.round((metrics.profit / metrics.sales) * 100) : 0;

      if (salesEl) salesEl.textContent = `₺ ${metrics.sales.toLocaleString('tr-TR')}`;
      if (pointsEl) pointsEl.textContent = `${metrics.pointsCount} Nokta`;
      if (profitEl) profitEl.textContent = `₺ ${metrics.profit.toLocaleString('tr-TR')}`;
      if (marginEl) marginEl.textContent = `%${marginPct} Net Marj`;
      if (debtEl) debtEl.textContent = `₺ ${metrics.debt.toLocaleString('tr-TR')}`;

      const closeCelebrateBtn = document.getElementById('btn-close-cutoff-celebration');
      const downloadPdfBtn = document.getElementById('btn-celebrate-download-pdf');

      if (closeCelebrateBtn) {
        closeCelebrateBtn.onclick = () => {
          if (celebrationModal) celebrationModal.classList.add('hidden');
          if (typeof showToast === 'function') {
            showToast(`Yeni gün (${nextDateLabelTR}) başladı! Satışlar yeni güne kaydedilecektir.`);
          }
        };
      }

      if (downloadPdfBtn) {
        downloadPdfBtn.onclick = () => {
          downloadCutoffSummaryPDF();
        };
      }
    }, 350);
  }, 1100);
}

function downloadCutoffSummaryPDF() {
  const element = document.getElementById('cutoff-report-printable-area');
  if (!element) return;

  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `01_GUN_SONU_DEVIR_RAPORU_${dateStr}.pdf`;

  const opt = {
    margin: [10, 10, 10, 10],
    filename: fileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  if (window.html2pdf) {
    if (typeof showToast === 'function') showToast("Gün Sonu Kapanış Raporu PDF belgesi indiriliyor...");
    window.html2pdf().set(opt).from(element).save();
  } else {
    window.print();
  }
}

/* ==========================================================================
   39. TAM SİSTEM VERİ YEDEKLEME & GERİ YÜKLEME MODÜLÜ (BULUT / DOSYA / ANİMASYON)
   ========================================================================== */
const BACKUP_STORAGE_KEY_SNAPSHOTS = 'toptan_backup_snapshots_v1';

let selectedBackupPayloadToRestore = null;

function setupBackupRestoreModule() {
  const exportBtnModal = document.getElementById('btn-export-backup-json');
  const exportBtnPage = document.getElementById('btn-page-export-backup-json');

  const importBtnModal = document.getElementById('btn-import-backup-json');
  const importBtnPage = document.getElementById('btn-page-import-backup-json');

  const fileInputModal = document.getElementById('input-backup-file');
  const fileInputPage = document.getElementById('input-page-backup-file');

  const dropZoneModal = document.getElementById('drop-backup-file-zone');
  const dropZonePage = document.getElementById('drop-page-backup-file-zone');

  const fileNameModal = document.getElementById('selected-backup-file-name');
  const fileNamePage = document.getElementById('page-selected-backup-file-name');

  const finishBtn = document.getElementById('btn-finish-restore-flow');
  const snapshotBtnModal = document.getElementById('btn-create-local-snapshot');
  const snapshotBtnPage = document.getElementById('btn-page-create-local-snapshot');
  const modal = document.getElementById('modal-data-backup-restore');
  const closeX = document.getElementById('btn-close-backup-restore-modal');

  if (closeX && modal) {
    closeX.onclick = () => modal.classList.add('hidden');
  }

  // Handle export buttons
  const handleExport = () => {
    downloadSystemBackupFile();
    renderBackupPageData();
  };
  if (exportBtnModal) exportBtnModal.onclick = handleExport;
  if (exportBtnPage) exportBtnPage.onclick = handleExport;

  // Handle dropzone click to open file dialog
  if (dropZoneModal && fileInputModal) {
    dropZoneModal.onclick = () => fileInputModal.click();
  }
  if (dropZonePage && fileInputPage) {
    dropZonePage.onclick = () => fileInputPage.click();
  }

  // Handle file selection
  const handleFileSelect = (file, fileNameEl, importBtnEl) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!parsed || !parsed.data || !Array.isArray(parsed.data.dealersData)) {
          throw new Error("Geçersiz yedek dosyası formatı");
        }
        selectedBackupPayloadToRestore = parsed;
        if (fileNameEl) {
          fileNameEl.innerHTML = `✓ <span style="color:#ffffff;">${file.name}</span> (${(file.size / 1024).toFixed(1)} KB)`;
        }
        if (importBtnEl) importBtnEl.disabled = false;
        if (importBtnModal) importBtnModal.disabled = false;
        if (importBtnPage) importBtnPage.disabled = false;
        if (typeof showToast === 'function') {
          showToast("Yedek dosyası seçildi ve doğrulandı. Geri yüklemeye hazır.");
        }
      } catch (err) {
        console.error("Yedek okuma hatası:", err);
        alert("Seçilen dosya geçerli bir toptancı sistem yedek dosyası (.json) değil!");
        if (fileNameEl) fileNameEl.textContent = "📁 Hatalı Dosya! Tekrar Seçin (.json)";
        if (importBtnEl) importBtnEl.disabled = true;
        selectedBackupPayloadToRestore = null;
      }
    };
    reader.readAsText(file);
  };

  if (fileInputModal) {
    fileInputModal.onchange = (e) => handleFileSelect(e.target.files && e.target.files[0], fileNameModal, importBtnModal);
  }
  if (fileInputPage) {
    fileInputPage.onchange = (e) => handleFileSelect(e.target.files && e.target.files[0], fileNamePage, importBtnPage);
  }

  // Handle import/restore buttons
  const handleImport = () => {
    if (!selectedBackupPayloadToRestore) {
      alert("Lütfen önce yüklenecek bir .json yedek dosyası seçiniz!");
      return;
    }
    const confirmAction = confirm("DİKKAT: Mevcut sistem verileriniz seçilen yedek dosyasındaki verilerle değiştirilecektir.\n\nGeri yükleme işlemine devam etmek istiyor musunuz?");
    if (confirmAction) {
      if (modal) modal.classList.remove('hidden');
      startSystemRestoreAnimationFlow(selectedBackupPayloadToRestore);
    }
  };
  if (importBtnModal) importBtnModal.onclick = handleImport;
  if (importBtnPage) importBtnPage.onclick = handleImport;

  // Handle finish flow button
  if (finishBtn && modal) {
    finishBtn.onclick = () => {
      modal.classList.add('hidden');
      if (typeof showToast === 'function') {
        showToast("Tüm veriler başarıyla yerleştirildi!");
      }
    };
  }

  // Handle snapshot creation
  const handleSnapshot = () => {
    createAndSaveLocalSnapshot("Manuel Anlık Sistem Yedeği");
    renderBackupSnapshotsTable();
    renderBackupPageData();
    if (typeof showToast === 'function') {
      showToast("Cihazda yeni bir anlık sistem yedeği noktası oluşturuldu.");
    }
  };
  if (snapshotBtnModal) snapshotBtnModal.onclick = handleSnapshot;
  if (snapshotBtnPage) snapshotBtnPage.onclick = handleSnapshot;
}

function renderBackupPageData() {
  const dealersEl = document.getElementById('page-backup-dealers-count');
  const stockEl = document.getElementById('page-backup-stock-count');
  const dateEl = document.getElementById('page-backup-date-label');
  const countLabel = document.getElementById('page-snapshots-count-label');
  const tbody = document.getElementById('page-backup-snapshots-tbody');

  if (dealersEl) dealersEl.textContent = `${(dealersData || []).length} Bayi`;
  if (dateEl) dateEl.textContent = getActiveBusinessDateStr();

  let totalCartons = 0;
  try {
    const rawStock = localStorage.getItem('toptan_inventory_stock_v1');
    if (rawStock) {
      const parsedStock = JSON.parse(rawStock);
      Object.values(parsedStock).forEach(v => {
        if (typeof v === 'number') totalCartons += v;
        else if (v && typeof v.stockCartons === 'number') totalCartons += v.stockCartons;
      });
    }
  } catch (e) {}

  if (stockEl) stockEl.textContent = `${totalCartons.toLocaleString('tr-TR')} Karton`;

  const snapshots = getLocalSnapshots();
  if (snapshots.length === 0) {
    createAndSaveLocalSnapshot("İlk Otomatik Başlangıç Yedeği");
    return renderBackupPageData();
  }

  if (countLabel) countLabel.textContent = `${snapshots.length} Kayıtlı Yedek`;

  if (tbody) {
    tbody.innerHTML = snapshots.map((item, idx) => {
      const dealerCount = item.metadata ? item.metadata.totalDealers : (item.data && item.data.dealersData ? item.data.dealersData.length : '--');
      const stockCount = item.metadata ? item.metadata.totalStockCartons : '--';
      const dateStr = item.formattedDate || new Date(item.exportTimestamp || Date.now()).toLocaleString('tr-TR');
      const note = item.backupNote || `Yedek #${idx + 1}`;

      return `
        <tr>
          <td><strong style="color:#ffffff;">${dateStr}</strong></td>
          <td><span style="color:#94a3b8;">${note}</span></td>
          <td><span style="color:#38bdf8; font-weight:700;">${dealerCount} Bayi</span></td>
          <td><span style="color:#34d399; font-weight:700;">${stockCount} Karton</span></td>
          <td style="text-align:right;">
            <button type="button" class="pill-btn active" style="padding:4px 10px; font-size:0.75rem; background:#10b981; border:none; cursor:pointer;" onclick="restoreSnapshotByIndex(${idx})">
              ⚡ Geri Yükle
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }
}

function openBackupRestoreModal() {
  const panel = document.getElementById('drawer-panel');
  const backdrop = document.getElementById('drawer-backdrop');
  if (panel) panel.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');

  const modal = document.getElementById('modal-data-backup-restore');
  if (!modal) return;

  const mainView = document.getElementById('backup-restore-main-view');
  const loadingView = document.getElementById('backup-restore-loading-view');
  const importBtn = document.getElementById('btn-import-backup-json');
  const fileNameDisplay = document.getElementById('selected-backup-file-name');
  const dealersBadge = document.getElementById('backup-dealers-count-badge');
  const stockBadge = document.getElementById('backup-stock-count-badge');

  if (mainView) mainView.classList.remove('hidden');
  if (loadingView) loadingView.classList.add('hidden');
  if (importBtn) importBtn.disabled = true;
  if (fileNameDisplay) fileNameDisplay.textContent = "📁 Yedek Dosyası Seç (.json)";
  selectedBackupPayloadToRestore = null;

  if (dealersBadge) dealersBadge.textContent = `${(dealersData || []).length} Bayi`;

  // Calculate stock count
  let totalCartons = 0;
  try {
    const rawStock = localStorage.getItem('toptan_inventory_stock_v1');
    if (rawStock) {
      const parsedStock = JSON.parse(rawStock);
      Object.values(parsedStock).forEach(v => {
        if (typeof v === 'number') totalCartons += v;
        else if (v && typeof v.stockCartons === 'number') totalCartons += v.stockCartons;
      });
    }
  } catch (e) {}

  if (stockBadge) stockBadge.textContent = `${totalCartons.toLocaleString('tr-TR')} Karton`;

  renderBackupSnapshotsTable();

  modal.classList.remove('hidden');
}

function createSystemBackupPayload(note = 'Manuel Tam Yedek') {
  const now = new Date();
  const dateStr = now.toISOString();

  let inventoryStock = {};
  try {
    const rawStock = localStorage.getItem('toptan_inventory_stock_v1');
    if (rawStock) inventoryStock = JSON.parse(rawStock);
  } catch (e) {}

  let totalStockCartons = 0;
  Object.values(inventoryStock).forEach(v => {
    if (typeof v === 'number') totalStockCartons += v;
    else if (v && typeof v.stockCartons === 'number') totalStockCartons += v.stockCartons;
  });

  return {
    app: "Toptan Satis Yonetim Paneli",
    schemaVersion: "5.0",
    exportDate: dateStr,
    exportTimestamp: now.getTime(),
    formattedDate: now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    backupNote: note,
    metadata: {
      totalDealers: (dealersData || []).length,
      totalStockCartons: totalStockCartons,
      activeBusinessDate: getActiveBusinessDateStr(),
      lastCutoffDate: localStorage.getItem(STORAGE_KEY_LAST_CUTOFF) || ''
    },
    data: {
      dealersData: dealersData || [],
      cigarettesDb: (typeof CIGARETTES_DB !== 'undefined' ? CIGARETTES_DB : []),
      dailyHistoryStore: dailyHistoryStore || {},
      inventoryStock: inventoryStock,
      activeBusinessDate: localStorage.getItem('toptan_active_business_date') || '',
      lastCutoff: localStorage.getItem(STORAGE_KEY_LAST_CUTOFF) || '',
      dealerCustomPrices: localStorage.getItem('toptan_dealer_custom_prices_v1') || null,
      warehousePurchases: localStorage.getItem('toptan_warehouse_purchases_v1') || null
    }
  };
}

function downloadSystemBackupFile() {
  const payload = createSystemBackupPayload("İndirilen Tam Sistem Yedeği");
  const jsonStr = JSON.stringify(payload, null, 2);

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');

  const fileName = `TOPTANCI_SISTEM_YEDEGI_${y}_${m}_${d}_${h}${min}.json`;

  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Also auto-save to snapshots
  createAndSaveLocalSnapshot(`İndirilen Dosya Yedeği (${fileName})`);
  renderBackupSnapshotsTable();

  if (typeof showToast === 'function') {
    showToast(`Tam sistem yedeği (${fileName}) indirildi ve cihaz hafızasına kaydedildi!`);
  }
}

function getLocalSnapshots() {
  try {
    const raw = localStorage.getItem(BACKUP_STORAGE_KEY_SNAPSHOTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function saveLocalSnapshots(list) {
  try {
    localStorage.setItem(BACKUP_STORAGE_KEY_SNAPSHOTS, JSON.stringify(list.slice(0, 15)));
  } catch (e) {}
}

function createAndSaveLocalSnapshot(note = "Anlık Yedek Noktası") {
  const payload = createSystemBackupPayload(note);
  const list = getLocalSnapshots();
  list.unshift(payload);
  saveLocalSnapshots(list);
}

function renderBackupSnapshotsTable() {
  const tbody = document.getElementById('backup-snapshots-tbody');
  if (!tbody) return;

  const snapshots = getLocalSnapshots();

  if (snapshots.length === 0) {
    createAndSaveLocalSnapshot("İlk Otomatik Başlangıç Yedeği");
    return renderBackupSnapshotsTable();
  }

  tbody.innerHTML = snapshots.map((item, idx) => {
    const dealerCount = item.metadata ? item.metadata.totalDealers : (item.data && item.data.dealersData ? item.data.dealersData.length : '--');
    const stockCount = item.metadata ? item.metadata.totalStockCartons : '--';
    const dateStr = item.formattedDate || new Date(item.exportTimestamp || Date.now()).toLocaleString('tr-TR');
    const note = item.backupNote || `Yedek #${idx + 1}`;

    return `
      <tr>
        <td><strong style="color:#ffffff;">${dateStr}</strong></td>
        <td><span style="color:#94a3b8;">${note}</span></td>
        <td><span style="color:#38bdf8; font-weight:700;">${dealerCount} Bayi</span></td>
        <td><span style="color:#34d399; font-weight:700;">${stockCount} Karton</span></td>
        <td style="text-align:right;">
          <button type="button" class="pill-btn active" style="padding:3px 8px; font-size:0.7rem; background:#10b981; border:none; cursor:pointer;" onclick="restoreSnapshotByIndex(${idx})">
            ⚡ Geri Yükle
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.restoreSnapshotByIndex = function(idx) {
  const snapshots = getLocalSnapshots();
  if (snapshots[idx]) {
    const confirmAction = confirm(`"${snapshots[idx].formattedDate}" tarihli yedeği geri yüklemek istediğinizden emin misiniz?`);
    if (confirmAction) {
      startSystemRestoreAnimationFlow(snapshots[idx]);
    }
  }
};

function startSystemRestoreAnimationFlow(payload) {
  const mainView = document.getElementById('backup-restore-main-view');
  const loadingView = document.getElementById('backup-restore-loading-view');
  const progressStage = document.getElementById('restore-progress-stage');
  const successStage = document.getElementById('restore-success-stage');
  const progressBar = document.getElementById('restore-progress-bar');
  const progressStepText = document.getElementById('restore-progress-step-text');
  const progressPercent = document.getElementById('restore-progress-percent');

  if (mainView) mainView.classList.add('hidden');
  if (loadingView) loadingView.classList.remove('hidden');
  if (progressStage) progressStage.classList.remove('hidden');
  if (successStage) successStage.classList.add('hidden');

  if (progressBar) progressBar.style.width = '25%';
  if (progressStepText) progressStepText.textContent = "⏳ Yedek dosyası ve veri bütünlüğü doğrulanıyor...";
  if (progressPercent) progressPercent.textContent = "25%";

  setTimeout(() => {
    if (progressBar) progressBar.style.width = '55%';
    if (progressStepText) progressStepText.textContent = "🏬 Bayi kartları, sipariş geçmişleri ve borç bakiyeleri yerleştiriliyor...";
    if (progressPercent) progressPercent.textContent = "55%";

    // Restore Dealers
    if (payload.data && Array.isArray(payload.data.dealersData)) {
      dealersData = payload.data.dealersData;
      localStorage.setItem('toptan_dealers_v3', JSON.stringify(dealersData));
    }

    // Restore Daily History Store
    if (payload.data && payload.data.dailyHistoryStore) {
      dailyHistoryStore = payload.data.dailyHistoryStore;
      localStorage.setItem(STORAGE_KEY_DAILY_HISTORY, JSON.stringify(dailyHistoryStore));
    }

    // Restore Active Date & Cutoff
    if (payload.data && payload.data.activeBusinessDate) {
      localStorage.setItem('toptan_active_business_date', payload.data.activeBusinessDate);
    }
    if (payload.data && payload.data.lastCutoff) {
      localStorage.setItem(STORAGE_KEY_LAST_CUTOFF, payload.data.lastCutoff);
    }
  }, 400);

  setTimeout(() => {
    if (progressBar) progressBar.style.width = '85%';
    if (progressStepText) progressStepText.textContent = "📦 Depo stok sayımları, sigara kataloğu ve fiyat yapılandırmaları yükleniyor...";
    if (progressPercent) progressPercent.textContent = "85%";

    // Restore Inventory Stock
    if (payload.data && payload.data.inventoryStock) {
      const stockVal = typeof payload.data.inventoryStock === 'string' ? payload.data.inventoryStock : JSON.stringify(payload.data.inventoryStock);
      localStorage.setItem('toptan_inventory_stock_v1', stockVal);
    }

    // Restore Cigarettes DB
    if (payload.data && Array.isArray(payload.data.cigarettesDb) && payload.data.cigarettesDb.length > 0) {
      CIGARETTES_DB = payload.data.cigarettesDb;
      localStorage.setItem('toptan_cigarettes_db_v1', JSON.stringify(CIGARETTES_DB));
    }

    // Restore Custom Prices & Purchases
    if (payload.data && payload.data.dealerCustomPrices) {
      localStorage.setItem('toptan_dealer_custom_prices_v1', typeof payload.data.dealerCustomPrices === 'string' ? payload.data.dealerCustomPrices : JSON.stringify(payload.data.dealerCustomPrices));
    }
    if (payload.data && payload.data.warehousePurchases) {
      localStorage.setItem('toptan_warehouse_purchases_v1', typeof payload.data.warehousePurchases === 'string' ? payload.data.warehousePurchases : JSON.stringify(payload.data.warehousePurchases));
    }
  }, 800);

  setTimeout(() => {
    if (progressBar) progressBar.style.width = '100%';
    if (progressStepText) progressStepText.textContent = "✓ Geri yükleme başarıyla tamamlandı!";
    if (progressPercent) progressPercent.textContent = "100%";

    // Refresh all views and re-render
    try {
      initClock();
      renderHomeStockTable();
      renderStockPieChart();
      renderPurchaseHistoryTable();
      renderOrdersGrid();
      renderDebtLists();
      updateDailySalesReports();
      if (typeof renderDealersManagementTable === 'function') renderDealersManagementTable();
      if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
      if (typeof renderTopSellingCigarettesList === 'function') renderTopSellingCigarettesList();
    } catch (err) {
      console.warn("View re-render notice:", err);
    }

    setTimeout(() => {
      if (progressStage) progressStage.classList.add('hidden');
      if (successStage) successStage.classList.remove('hidden');

      const restoredDealersEl = document.getElementById('restored-dealers-count');
      const restoredStockEl = document.getElementById('restored-stock-count');
      const restoredDateEl = document.getElementById('restored-date-label');
      const restoredHistoryEl = document.getElementById('restored-history-count');

      if (restoredDealersEl) restoredDealersEl.textContent = `${(dealersData || []).length} Satış Noktası`;
      if (restoredStockEl) {
        const stockCount = payload.metadata ? payload.metadata.totalStockCartons : 'Tam Depo';
        restoredStockEl.textContent = `${stockCount} Karton Stok`;
      }
      if (restoredDateEl) restoredDateEl.textContent = getActiveBusinessDateStr();
      if (restoredHistoryEl) restoredHistoryEl.textContent = `${Object.keys(dailyHistoryStore || {}).length} Vardiya Arşivi`;
    }, 400);

  }, 1300);
}
window.resetTestDataForRestoreDemo = function() {
  const confirmAction = confirm("DİKKAT: Test amacıyla satış geçmişleri, bayi borçları ve depo stokları sıfırlanacaktır (Sigara kataloğu, fiyat listesi ve fabrika borçları korunacaktır).\n\nDevam etmek istiyor musunuz?");
  if (!confirmAction) return;

  // 1. Sıfırla: Bayi satışları ve borçları
  (dealersData || []).forEach(d => {
    d.sales = [];
    d.totalDebt = 0;
    d.balance = 0;
  });
  localStorage.setItem(STORAGE_KEY_DEALERS, JSON.stringify(dealersData));

  // 2. Sıfırla: Depo Stokları
  inventoryStock = {};
  localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inventoryStock));
  localStorage.setItem('toptan_inventory_stock_v1', JSON.stringify(inventoryStock));

  // 3. Sıfırla: Gün sonu geçmişi
  dailyHistoryStore = {};
  localStorage.setItem(STORAGE_KEY_DAILY_HISTORY, JSON.stringify(dailyHistoryStore));

  // 4. Arayüzleri Yeniden Çiz
  saveDealersToStorage();
  renderHomeStockTable();
  renderStockPieChart();
  renderDealersTable();
  renderOrdersGrid();
  renderDebtLists();
  updateDailySalesReports();
  renderBackupPageData();
  if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
  if (typeof renderTopSellingCigarettesList === 'function') renderTopSellingCigarettesList();

  if (typeof showToast === 'function') {
    showToast("Satışlar ve depo stokları sıfırlandı! Şimdi indirdiğiniz yedeği seçip geri yükleyebilirsiniz.");
  }
};

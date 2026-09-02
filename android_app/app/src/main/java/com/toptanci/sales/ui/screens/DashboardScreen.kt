package com.toptanci.sales.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.toptanci.sales.ui.components.*
import com.toptanci.sales.viewmodel.SalesViewModel

@Composable
fun DashboardScreen(
    viewModel: SalesViewModel,
    modifier: Modifier = Modifier
) {
    val totalSales by viewModel.totalSales.collectAsState()
    val totalProfit by viewModel.totalProfit.collectAsState()
    val dailySales by viewModel.dailySales.collectAsState()
    val selectedComparison by viewModel.selectedComparison.collectAsState()
    val categories by viewModel.categoryShares.collectAsState()
    val profitMargins by viewModel.profitShares.collectAsState()

    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // 1. Top Stat Cards (Toplam Satış & Toplam Kar)
        StatCardsRow(
            totalSales = totalSales,
            totalProfit = totalProfit,
            formattedSales = viewModel.formatCurrency(totalSales),
            formattedProfit = viewModel.formatCurrency(totalProfit)
        )

        // 2. Çift Pasta/Halka Grafiği (Yan Yana)
        PieChartsSection(
            categories = categories,
            profitMargins = profitMargins
        )

        // 3. Gün Gün Satışlar Çizgi/Zaman Çizelgesi Grafiği (Tıklanınca Önceki Gün Kıyası)
        DailySalesTimelineCard(
            dailySales = dailySales,
            selectedComparison = selectedComparison,
            onSelectDayIndex = { index ->
                viewModel.selectDayIndex(index)
            }
        )

        // 4. Haftalık Öne Çıkan Başarı Kartı (Bu hafta en çok bugün...)
        WeeklyInsightCard()
    }
}

package com.toptanci.sales.model

data class DailySale(
    val day: Int,
    val dayLabel: String,
    val dayName: String,
    val salesAmount: Double,
    val profitAmount: Double
)

data class CategoryShare(
    val categoryName: String,
    val percentage: Float,
    val colorHex: Long
)

data class ProfitMarginShare(
    val title: String,
    val percentage: Float,
    val colorHex: Long
)

data class CigaretteProduct(
    val id: String,
    val group: String, // "pm", "jti", "bat", "imperial"
    val brand: String,
    val name: String,
    val packetPrice: Double,
    val cartonPrice: Double
)

data class SelectedOrderItem(
    val cigarette: CigaretteProduct,
    val packetQty: Int,
    val cartonQty: Int,
    val totalAmount: Double
)

data class StoreDebtRecord(
    val id: String,
    val date: String,
    val description: String,
    val dueDate: String,
    val amount: Double,
    val remainingAmount: Double,
    val status: String
)

data class StoreSaleRecord(
    val id: String,
    val date: String,
    val itemsSummary: String,
    val totalAmount: Double,
    val paidAmount: Double,
    val remainingDebt: Double,
    val receiptNo: String
)

data class DealerItem(
    val id: String,
    val name: String,
    val phone: String,
    val region: String,
    val lastOrderTime: String,
    val totalDebt: Double,
    val debts: List<StoreDebtRecord> = emptyList(),
    val sales: List<StoreSaleRecord> = emptyList()
)

data class DayComparisonResult(
    val currentDay: DailySale,
    val previousDay: DailySale?,
    val diffAmount: Double,
    val diffPercentage: Double,
    val isIncrease: Boolean
)

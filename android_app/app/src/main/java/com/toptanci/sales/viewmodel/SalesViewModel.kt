package com.toptanci.sales.viewmodel

import androidx.lifecycle.ViewModel
import com.toptanci.sales.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.NumberFormat
import java.util.Locale

class SalesViewModel : ViewModel() {

    private val turkishLocale = Locale("tr", "TR")
    private val currencyFormatter = NumberFormat.getCurrencyInstance(turkishLocale).apply {
        maximumFractionDigits = 0
    }

    private val _dealers = MutableStateFlow<List<DealerItem>>(emptyList())
    val dealers: StateFlow<List<DealerItem>> = _dealers.asStateFlow()

    private val _selectedDealer = MutableStateFlow<DealerItem?>(null)
    val selectedDealer: StateFlow<DealerItem?> = _selectedDealer.asStateFlow()

    private val _cigarettes = MutableStateFlow<List<CigaretteProduct>>(emptyList())
    val cigarettes: StateFlow<List<CigaretteProduct>> = _cigarettes.asStateFlow()

    private val _cart = MutableStateFlow<Map<String, Pair<Int, Int>>>(emptyMap())
    val cart: StateFlow<Map<String, Pair<Int, Int>>> = _cart.asStateFlow()

    private val _dailySales = MutableStateFlow<List<DailySale>>(emptyList())
    val dailySales: StateFlow<List<DailySale>> = _dailySales.asStateFlow()

    private val _totalSales = MutableStateFlow(864250.0)
    val totalSales: StateFlow<Double> = _totalSales.asStateFlow()

    private val _totalProfit = MutableStateFlow(224800.0)
    val totalProfit: StateFlow<Double> = _totalProfit.asStateFlow()

    private val _selectedComparison = MutableStateFlow<DayComparisonResult?>(null)
    val selectedComparison: StateFlow<DayComparisonResult?> = _selectedComparison.asStateFlow()

    private val _categoryShares = MutableStateFlow<List<CategoryShare>>(
        listOf(
            CategoryShare("Philip Morris", 42f, 0xFF3B82F6),
            CategoryShare("JTI Grubu", 32f, 0xFF10B981),
            CategoryShare("BAT Grubu", 18f, 0xFFF59E0B),
            CategoryShare("Imperial", 8f, 0xFFEC4899)
        )
    )
    val categoryShares: StateFlow<List<CategoryShare>> = _categoryShares.asStateFlow()

    private val _profitShares = MutableStateFlow<List<ProfitMarginShare>>(
        listOf(
            ProfitMarginShare("Yüksek Marj (%25+)", 54f, 0xFF10B981),
            ProfitMarginShare("Orta Marj (%15-25)", 34f, 0xFF00F2FE),
            ProfitMarginShare("Düşük Marj (%0-15)", 12f, 0xFFF43F5E)
        )
    )
    val profitShares: StateFlow<List<ProfitMarginShare>> = _profitShares.asStateFlow()

    init {
        loadInitialData()
    }

    private fun loadInitialData() {
        _cigarettes.value = listOf(
            CigaretteProduct("pm-1", "pm", "Philip Morris", "Parliament Night Blue Pack", 130.0, 1300.0),
            CigaretteProduct("pm-2", "pm", "Philip Morris", "Parliament Aqua Blue Slims", 130.0, 1300.0),
            CigaretteProduct("pm-3", "pm", "Philip Morris", "Parliament Midnight Blue", 125.0, 1250.0),
            CigaretteProduct("pm-4", "pm", "Philip Morris", "Marlboro Red (Kısa / Uzun)", 125.0, 1250.0),
            CigaretteProduct("pm-5", "pm", "Philip Morris", "Marlboro Touch Blue / Gray", 125.0, 1250.0),
            CigaretteProduct("pm-6", "pm", "Philip Morris", "Marlboro Edge Blue", 120.0, 1200.0),
            CigaretteProduct("pm-7", "pm", "Philip Morris", "Muratti / Muratti Blu", 122.0, 1220.0),
            CigaretteProduct("pm-8", "pm", "Philip Morris", "Chesterfield Navy", 120.0, 1200.0),
            CigaretteProduct("pm-9", "pm", "Philip Morris", "L&M Red / Blue", 120.0, 1200.0),
            CigaretteProduct("pm-10", "pm", "Philip Morris", "Lark Blue", 120.0, 1200.0),

            CigaretteProduct("jti-1", "jti", "JTI Grubu", "Winston Slims Blue", 130.0, 1300.0),
            CigaretteProduct("jti-2", "jti", "JTI Grubu", "Winston Classic Red", 125.0, 1250.0),
            CigaretteProduct("jti-3", "jti", "JTI Grubu", "Winston Dark Blue", 120.0, 1200.0),
            CigaretteProduct("jti-4", "jti", "JTI Grubu", "Winston Slender Blue", 120.0, 1200.0),
            CigaretteProduct("jti-5", "jti", "JTI Grubu", "Camel Yellow (Kısa/Soft)", 120.0, 1200.0),
            CigaretteProduct("jti-6", "jti", "JTI Grubu", "Camel White / Brown", 120.0, 1200.0),
            CigaretteProduct("jti-7", "jti", "JTI Grubu", "Monte Carlo Slender", 115.0, 1150.0),
            CigaretteProduct("jti-8", "jti", "JTI Grubu", "LD Blue / Red", 115.0, 1150.0),

            CigaretteProduct("bat-1", "bat", "BAT Grubu", "Kent Blue / White", 125.0, 1250.0),
            CigaretteProduct("bat-2", "bat", "BAT Grubu", "Kent Slims Black", 130.0, 1300.0),
            CigaretteProduct("bat-3", "bat", "BAT Grubu", "Kent D-Range Blue", 120.0, 1200.0),
            CigaretteProduct("bat-4", "bat", "BAT Grubu", "Rothmans Blue", 115.0, 1150.0),
            CigaretteProduct("bat-5", "bat", "BAT Grubu", "Tekel 2000 Kırmızı/Mavi", 110.0, 1100.0),

            CigaretteProduct("imp-1", "imperial", "Imperial", "Davidoff Classic / Gold", 135.0, 1350.0),
            CigaretteProduct("imp-2", "imperial", "Imperial", "West Red / Silver", 115.0, 1150.0)
        )

        _dealers.value = emptyList()
        _dailySales.value = (1..27).map { day ->
            DailySale(day, "$day Ağu", "Gün", 0.0, 0.0)
        }
        _totalSales.value = 0.0
        _totalProfit.value = 0.0
    }

    fun selectDealer(dealerId: String) {
        _selectedDealer.value = _dealers.value.find { it.id == dealerId }
    }

    /**
     * Tekil Borç Ödeme
     */
    fun paySingleDebt(dealerId: String, debtId: String, payAmount: Double) {
        val updated = _dealers.value.map { dealer ->
            if (dealer.id == dealerId) {
                var actualPaid = 0.0
                val newDebts = dealer.debts.map { d ->
                    if (d.id == debtId) {
                        actualPaid = payAmount.coerceAtMost(d.remainingAmount)
                        val newRemaining = (d.remainingAmount - actualPaid).coerceAtLeast(0.0)
                        d.copy(
                            remainingAmount = newRemaining,
                            status = if (newRemaining == 0.0) "Ödendi (Kapatıldı)" else "Kısmi Ödendi"
                        )
                    } else d
                }
                dealer.copy(
                    totalDebt = (dealer.totalDebt - actualPaid).coerceAtLeast(0.0),
                    debts = newDebts
                )
            } else dealer
        }
        _dealers.value = updated
        _selectedDealer.value = updated.find { it.id == dealerId }
    }

    /**
     * Toptan Borç Ödeme (En eskiden itibaren doğru orantılı / FIFO sırayla düşüş)
     */
    fun payBulkDebt(dealerId: String, totalPayAmount: Double) {
        val updated = _dealers.value.map { dealer ->
            if (dealer.id == dealerId) {
                var payPool = totalPayAmount.coerceAtMost(dealer.totalDebt)
                val newDebts = dealer.debts.map { d ->
                    if (d.remainingAmount > 0 && payPool > 0) {
                        if (payPool >= d.remainingAmount) {
                            payPool -= d.remainingAmount
                            d.copy(remainingAmount = 0.0, status = "Ödendi (Kapatıldı)")
                        } else {
                            val newRem = d.remainingAmount - payPool
                            payPool = 0.0
                            d.copy(remainingAmount = newRem, status = "Kısmi Ödendi")
                        }
                    } else d
                }
                dealer.copy(
                    totalDebt = (dealer.totalDebt - totalPayAmount).coerceAtLeast(0.0),
                    debts = newDebts
                )
            } else dealer
        }
        _dealers.value = updated
        _selectedDealer.value = updated.find { it.id == dealerId }
    }

    fun addNewDealer(name: String, phone: String, region: String, initialDebt: Double) {
        val newDealer = DealerItem(
            id = "dealer-${System.currentTimeMillis()}",
            name = name,
            phone = phone,
            region = region.ifEmpty { "İstanbul" },
            lastOrderTime = "Yeni Eklendi",
            totalDebt = initialDebt,
            debts = if (initialDebt > 0) listOf(
                StoreDebtRecord("d-init", "27 Ağustos 2026", "Açılış Bakiye / Devir Borcu", "15 Eylül 2026", initialDebt, initialDebt, "Devir Borcu")
            ) else emptyList(),
            sales = emptyList()
        )
        _dealers.value = listOf(newDealer) + _dealers.value
        _selectedDealer.value = newDealer
    }

    fun updateCartQuantity(cigId: String, isCarton: Boolean, delta: Int) {
        val currentMap = _cart.value.toMutableMap()
        val currentPair = currentMap[cigId] ?: Pair(0, 0)

        val newPair = if (isCarton) {
            val newCarton = (currentPair.second + delta).coerceAtLeast(0)
            Pair(currentPair.first, newCarton)
        } else {
            val newPacket = (currentPair.first + delta).coerceAtLeast(0)
            Pair(newPacket, currentPair.second)
        }

        if (newPair.first == 0 && newPair.second == 0) {
            currentMap.remove(cigId)
        } else {
            currentMap[cigId] = newPair
        }
        _cart.value = currentMap
    }

    fun getCartTotalAmount(): Double {
        var total = 0.0
        val cigMap = _cigarettes.value.associateBy { it.id }
        _cart.value.forEach { (cigId, qtyPair) ->
            val cig = cigMap[cigId]
            if (cig != null) {
                total += (qtyPair.first * cig.packetPrice) + (qtyPair.second * cig.cartonPrice)
            }
        }
        return total
    }

    fun finalizeSale(dealerId: String, totalAmount: Double, paidAmount: Double, itemsSummary: String) {
        val remainingDebt = (totalAmount - paidAmount).coerceAtLeast(0.0)
        val receiptNo = "TR-${(1000..9999).random()}"

        val updatedList = _dealers.value.map { dealer ->
            if (dealer.id == dealerId) {
                val newSales = listOf(
                    StoreSaleRecord(
                        id = "s-${System.currentTimeMillis()}",
                        date = "27 Ağustos 2026",
                        itemsSummary = itemsSummary,
                        totalAmount = totalAmount,
                        paidAmount = paidAmount,
                        remainingDebt = remainingDebt,
                        receiptNo = receiptNo
                    )
                ) + dealer.sales

                val newDebts = if (remainingDebt > 0) {
                    listOf(
                        StoreDebtRecord(
                            id = "d-${System.currentTimeMillis()}",
                            date = "27 Ağustos 2026",
                            description = "Vadeli Sigara Satışı ($receiptNo)",
                            dueDate = "15 Eylül 2026",
                            amount = remainingDebt,
                            remainingAmount = remainingDebt,
                            status = "Ödeme Bekleniyor"
                        )
                    ) + dealer.debts
                } else dealer.debts

                dealer.copy(
                    totalDebt = dealer.totalDebt + remainingDebt,
                    debts = newDebts,
                    sales = newSales
                )
            } else dealer
        }

        _dealers.value = updatedList
        _selectedDealer.value = updatedList.find { it.id == dealerId }
        _totalSales.value += totalAmount
        _totalProfit.value += (totalAmount * 0.22)
        _cart.value = emptyMap()
    }

    fun selectDayIndex(index: Int) {
        val list = _dailySales.value
        if (index !in list.indices) return
        val current = list[index]
        if (index == 0) {
            _selectedComparison.value = DayComparisonResult(current, null, 0.0, 0.0, true)
        } else {
            val prev = list[index - 1]
            val diff = current.salesAmount - prev.salesAmount
            val percentage = if (prev.salesAmount > 0) (diff / prev.salesAmount) * 100 else 0.0
            _selectedComparison.value = DayComparisonResult(current, prev, diff, percentage, diff >= 0)
        }
    }

    fun formatCurrency(amount: Double): String {
        return currencyFormatter.format(amount)
    }
}

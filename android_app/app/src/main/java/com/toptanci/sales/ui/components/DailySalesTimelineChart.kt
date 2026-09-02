package com.toptanci.sales.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.TrendingDown
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.toptanci.sales.model.DailySale
import com.toptanci.sales.model.DayComparisonResult
import com.toptanci.sales.ui.theme.*
import java.text.NumberFormat
import java.util.Locale
import kotlin.math.abs

@Composable
fun DailySalesTimelineCard(
    dailySales: List<DailySale>,
    selectedComparison: DayComparisonResult?,
    onSelectDayIndex: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    val currencyFormat = remember {
        NumberFormat.getCurrencyInstance(Locale("tr", "TR")).apply {
            maximumFractionDigits = 0
        }
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(BgSurfaceCard, RoundedCornerShape(18.dp))
            .border(1.dp, BorderSubtle, RoundedCornerShape(18.dp))
            .padding(20.dp)
    ) {
        Column {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Gün Gün Satış ve Ciro Zaman Çizelgesi",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                    )
                    Text(
                        text = "Ayın günleri bazında ciro eğrisi (Güne dokunarak önceki gün kıyasını görün)",
                        style = MaterialTheme.typography.labelSmall
                    )
                }

                Box(
                    modifier = Modifier
                        .background(Color(0x2600F2FE), RoundedCornerShape(20.dp))
                        .border(1.dp, Color(0x4000F2FE), RoundedCornerShape(20.dp))
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = "Ağustos 2026",
                        color = AccentCyan,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Dynamic Difference / Comparison Banner
            selectedComparison?.let { comp ->
                DayComparisonBanner(
                    comparison = comp,
                    currencyFormat = currencyFormat
                )
                Spacer(modifier = Modifier.height(14.dp))
            }

            // Interactive Line Chart Canvas
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
            ) {
                DailySalesCanvas(
                    dailySales = dailySales,
                    selectedDayIndex = dailySales.indexOfFirst { it.day == selectedComparison?.currentDay?.day },
                    onDayTapped = onSelectDayIndex
                )
            }
        }
    }
}

@Composable
fun DayComparisonBanner(
    comparison: DayComparisonResult,
    currencyFormat: NumberFormat
) {
    val isInc = comparison.isIncrease
    val accentCol = if (isInc) AccentEmerald else AccentRose
    val icon = if (isInc) Icons.Default.TrendingUp else Icons.Default.TrendingDown
    val currentFormatted = currencyFormat.format(comparison.currentDay.salesAmount)
    val diffFormatted = currencyFormat.format(abs(comparison.diffAmount))
    val percentFormatted = String.format(Locale.US, "%.1f", abs(comparison.diffPercentage))
    val statusWord = if (isInc) "DAHA FAZLA" else "DAHA AZ"

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0x1F00F2FE), RoundedCornerShape(12.dp))
            .border(1.dp, Color(0x4000F2FE), RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .background(accentCol.copy(alpha = 0.2f), RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = accentCol,
                    modifier = Modifier.size(20.dp)
                )
            }

            Column {
                Text(
                    text = "${comparison.currentDay.day} Ağustos (${comparison.currentDay.dayName}) - Ciro: $currentFormatted",
                    fontWeight = FontWeight.Bold,
                    color = AccentCyan,
                    fontSize = 13.sp
                )
                if (comparison.previousDay != null) {
                    Text(
                        text = "Bir önceki günden ($diffFormatted - %$percentFormatted) $statusWord satış yapıldı.",
                        color = TextPure,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                } else {
                    Text(
                        text = "Ayın ilk açılış günü başlangıç cirosu.",
                        color = TextMuted,
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

@Composable
fun DailySalesCanvas(
    dailySales: List<DailySale>,
    selectedDayIndex: Int,
    onDayTapped: (Int) -> Unit
) {
    if (dailySales.isEmpty()) return

    val maxSales = (dailySales.maxOfOrNull { it.salesAmount } ?: 100000.0).toFloat()
    val minSales = (dailySales.minOfOrNull { it.salesAmount } ?: 0.0).toFloat()

    Canvas(
        modifier = Modifier
            .fillMaxSize()
            .pointerInput(dailySales) {
                detectTapGestures { offset ->
                    val stepX = size.width / (dailySales.size - 1).coerceAtLeast(1)
                    val tappedIndex = ((offset.x + stepX / 2) / stepX).toInt().coerceIn(0, dailySales.size - 1)
                    onDayTapped(tappedIndex)
                }
            }
    ) {
        val width = size.width
        val height = size.height
        val paddingBottom = 20.dp.toPx()
        val graphHeight = height - paddingBottom
        val stepX = width / (dailySales.size - 1).coerceAtLeast(1)

        val points = mutableListOf<Offset>()
        dailySales.forEachIndexed { i, sale ->
            val normY = (sale.salesAmount.toFloat() - minSales) / (maxSales - minSales).coerceAtLeast(1f)
            val y = graphHeight - (normY * (graphHeight - 20.dp.toPx())) - 10.dp.toPx()
            val x = i * stepX
            points.add(Offset(x, y))
        }

        // Fill Area
        val fillPath = Path().apply {
            moveTo(0f, graphHeight)
            points.forEach { lineTo(it.x, it.y) }
            lineTo(width, graphHeight)
            close()
        }

        drawPath(
            path = fillPath,
            brush = Brush.verticalGradient(
                colors = listOf(AccentCyan.copy(alpha = 0.35f), Color.Transparent),
                startY = 0f,
                endY = graphHeight
            )
        )

        // Line Path
        val linePath = Path().apply {
            moveTo(points.first().x, points.first().y)
            for (i in 1 until points.size) {
                val prev = points[i - 1]
                val curr = points[i]
                val midX = (prev.x + curr.x) / 2
                cubicTo(midX, prev.y, midX, curr.y, curr.x, curr.y)
            }
        }

        drawPath(
            path = linePath,
            color = AccentCyan,
            style = Stroke(width = 3.dp.toPx())
        )

        // Draw points & Highlight selected day
        points.forEachIndexed { i, point ->
            val isSelected = i == selectedDayIndex
            val radius = if (isSelected) 7.dp.toPx() else 3.5.dp.toPx()
            val color = if (isSelected) AccentEmerald else AccentCyan

            drawCircle(
                color = color,
                radius = radius,
                center = point
            )
            drawCircle(
                color = Color.White,
                radius = if (isSelected) 3.5.dp.toPx() else 1.5.dp.toPx(),
                center = point
            )
        }
    }
}

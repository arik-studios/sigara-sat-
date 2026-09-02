package com.toptanci.sales.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ElevatedButton
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.toptanci.sales.ui.theme.*

@Composable
fun WeeklyInsightCard(
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(
                brush = Brush.linearGradient(
                    colors = listOf(Color(0xFF182033), Color(0xFF111827))
                ),
                shape = RoundedCornerShape(18.dp)
            )
            .border(1.dp, Color(0x59FBBF24), RoundedCornerShape(18.dp))
            .padding(20.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .background(Color(0x26FBBF24), RoundedCornerShape(14.dp))
                    .border(1.dp, Color(0x4DFBBF24), RoundedCornerShape(14.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Star,
                    contentDescription = null,
                    tint = AccentGold,
                    modifier = Modifier.size(28.dp)
                )
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "HAFTALIK PERFORMANS REKORU",
                    color = AccentGold,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 1.sp
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = buildAnnotatedString {
                        append("Bu hafta en çok ")
                        withStyle(SpanStyle(color = AccentCyan, fontWeight = FontWeight.ExtraBold)) {
                            append("bugün (27 Ağustos Perşembe)")
                        }
                        append(" ")
                        withStyle(SpanStyle(color = Color(0xFF38BDF8), fontWeight = FontWeight.ExtraBold)) {
                            append("₺ 164.200")
                        }
                        append(" satış yaptın ve ")
                        withStyle(SpanStyle(color = AccentEmerald, fontWeight = FontWeight.ExtraBold)) {
                            append("₺ 42.800")
                        }
                        append(" kâr ettin!")
                    },
                    color = TextPure,
                    fontSize = 15.sp,
                    lineHeight = 22.sp
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "Bu hafta toplam 6 sevkiyat tamamlandı, ortalama sepet tutarı hedefin %132 üzerine çıktı.",
                    color = TextMuted,
                    fontSize = 12.sp
                )
            }

            ElevatedButton(
                onClick = { /* Rapor Detayı */ },
                colors = ButtonDefaults.elevatedButtonColors(
                    containerColor = Color(0x1AFFFFFF),
                    contentColor = TextPure
                ),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.border(1.dp, BorderBright, RoundedCornerShape(10.dp))
            ) {
                Text(text = "Raporu Gör", fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
        }
    }
}

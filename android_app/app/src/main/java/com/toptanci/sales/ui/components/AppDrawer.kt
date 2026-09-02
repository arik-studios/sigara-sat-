package com.toptanci.sales.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.toptanci.sales.ui.theme.*

sealed class DrawerDestination(
    val route: String,
    val title: String,
    val subtitle: String,
    val icon: ImageVector,
    val iconBgColor: Color,
    val iconTintColor: Color,
    val badgeText: String? = null,
    val badgeColor: Color = AccentCyan
) {
    object Dashboard : DrawerDestination("dashboard", "Ana Ekran & Özet", "Genel Ciro & Kâr", Icons.Default.Home, Color(0x263B82F6), AccentBlue, "Canlı")
    object SalesPoints : DrawerDestination("points", "Satış Noktaları", "48 Aktif Bayi & Market", Icons.Default.Place, Color(0x266366F1), AccentIndigo, "48")
    object DealerPurchases : DrawerDestination("dealers", "Bayi Alım", "Gelen Siparişler", Icons.Default.ShoppingCart, Color(0x26A855F7), AccentPurple, "12 Yeni")
    object SalesCharts : DrawerDestination("charts", "Satış Grafikleri", "Kırılım Raporları", Icons.Default.Poll, Color(0x2600F2FE), AccentCyan)
    object ReceivablesDebt : DrawerDestination("receivables", "Alınacak Toplam Borç", "Bayi Bakiyeleri", Icons.Default.TrendingUp, Color(0x2610B981), AccentEmerald, "₺428.5K", AccentEmerald)
    object PayablesDebt : DrawerDestination("payables", "Verilecek Toplam Borç", "Tedarikçi Borçları", Icons.Default.TrendingDown, Color(0x26F43F5E), AccentRose, "₺194.2K", AccentRose)
}

@Composable
fun AppDrawerSheet(
    currentRoute: String,
    onNavigate: (String) -> Unit,
    onCloseDrawer: () -> Unit
) {
    val items = listOf(
        DrawerDestination.Dashboard,
        DrawerDestination.SalesPoints,
        DrawerDestination.DealerPurchases,
        DrawerDestination.SalesCharts,
        DrawerDestination.ReceivablesDebt,
        DrawerDestination.PayablesDebt
    )

    ModalDrawerSheet(
        drawerContainerColor = BgSurface,
        drawerContentColor = TextPure,
        modifier = Modifier.width(360.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp)
        ) {
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .background(Color(0x2600F2FE), RoundedCornerShape(12.dp))
                        .border(1.dp, Color(0x4000F2FE), RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Storefront,
                        contentDescription = null,
                        tint = AccentCyan
                    )
                }

                Column {
                    Text(
                        text = "TÜRK TOPTAN GIDA",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 0.5.sp
                        )
                    )
                    Text(
                        text = "Tablet Satış Yönetim Ağı",
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }

            Divider(color = BorderSubtle)
            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "MENÜ MODÜLLERİ",
                style = MaterialTheme.typography.labelSmall.copy(
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                ),
                modifier = Modifier.padding(start = 8.dp, bottom = 8.dp)
            )

            // Items List
            items.forEach { dest ->
                val isSelected = currentRoute == dest.route
                DrawerItemRow(
                    destination = dest,
                    isSelected = isSelected,
                    onClick = {
                        onNavigate(dest.route)
                        onCloseDrawer()
                    }
                )
                Spacer(modifier = Modifier.height(6.dp))
            }

            Spacer(modifier = Modifier.weight(1f))

            // Footer
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(BgSurfaceElevated, RoundedCornerShape(14.dp))
                    .padding(14.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column {
                        Text(
                            text = "Ramazan Türk",
                            fontWeight = FontWeight.Bold,
                            color = TextPure,
                            fontSize = 14.sp
                        )
                        Text(
                            text = "Ana Yönetici (Super Admin)",
                            color = TextDim,
                            fontSize = 11.sp
                        )
                    }

                    Box(
                        modifier = Modifier
                            .background(Color(0x2610B981), RoundedCornerShape(20.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "Aktif",
                            color = AccentEmerald,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun DrawerItemRow(
    destination: DrawerDestination,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val bg = if (isSelected) Color(0x2600F2FE) else Color.Transparent
    val border = if (isSelected) BorderBright else Color.Transparent

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(bg, RoundedCornerShape(12.dp))
            .border(1.dp, border, RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(38.dp)
                .background(destination.iconBgColor, RoundedCornerShape(10.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = destination.icon,
                contentDescription = null,
                tint = destination.iconTintColor,
                modifier = Modifier.size(20.dp)
            )
        }

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = destination.title,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = TextPure
            )
            Text(
                text = destination.subtitle,
                fontSize = 11.sp,
                color = TextDim
            )
        }

        destination.badgeText?.let { badge ->
            Box(
                modifier = Modifier
                    .background(destination.badgeColor.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = badge,
                    color = destination.badgeColor,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

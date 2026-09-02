package com.toptanci.sales.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = AccentCyan,
    secondary = AccentEmerald,
    tertiary = AccentIndigo,
    background = BgCore,
    surface = BgSurface,
    onPrimary = BgCore,
    onSecondary = BgCore,
    onBackground = TextPure,
    onSurface = TextPure
)

@Composable
fun ToptanciSalesTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = AppTypography,
        content = content
    )
}

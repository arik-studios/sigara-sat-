# 🚀 Toptancı Satış Sistemi (Tablet Özel & Siyah OLED Tema)

**Yönetici:** Ramazan Türk  
**Hedef Platform:** Tablet (Android Jetpack Compose & Web Canlı Emülatörü)  
**Tasarım Dili:** Koyu Siyah OLED (Dark Mode), Beyaz Tipografi, Neon Cam Efektleri, 60 FPS Akıcı Animasyonlar  

---

## 📱 Proje Özellikleri ve Karşılanan Talepler

1. **Top Bar & Drawer (Yan Menü)**:
   - **En Üstte:** `Hoş geldin Ramazan Türk` karşılama başlığı ve canlı durum göstergesi.
   - **Sol Üst:** Animasyonlu Drawer butonu (Hamburger menü).
   - **Drawer İçeriği & Özel İkonlar:**
     - 📍 **Satış Noktaları** (48 Aktif Bayi ve market lokasyonu)
     - 🛒 **Bayi Alım** (Gelen toptan siparişler ve sevkiyat talepleri)
     - 📊 **Satış Grafikleri** (Kategori ve kârlılık derin analizleri)
     - 📥 **Alınacak Toplam Borç** (`₺ 428.500` - Müşteri vadeli alacakları)
     - 📤 **Verilecek Toplam Borç** (`₺ 194.200` - Tedarikçi & fabrika borçları)

2. **Ana Ekran (Dashboard - Tablet Görünümü)**:
   - **Üst Metrik Kartları:** **Toplam Satış (₺864.250)** ve **Toplam Kâr (₺224.800)** özet kartları.
   - **İki Adet Yan Yana Pasta/Halka Grafiği:**
     - *Grafik 1:* Kategori Bazlı Satış Dağılımı (Gıda & Bakliyat, İçecek, Temizlik vb.)
     - *Grafik 2:* Kâr Marjı ve Bayi Segment Dağılımı (%35+ Yüksek Marj, Standart Marj vb.)
   - **Gün Gün Satışlar Çizgi / Zaman Çizelgesi Grafiği:**
     - Ayın günleri (1 Ağu, 2 Ağu ... 27 Ağu) zaman çizelgesi olarak yatay eksende yer alır.
     - Yapılan toplam ciroya göre eğri artar.
     - **İnteraktif Tıklama:** Grafikte herhangi bir güne tıklandığında:  
       👉 *"Bir önceki günden ₺18.400 (%12.6) DAHA FAZLA / DAHA AZ satış yapıldı"* şeklinde dinamik kıyaslama kutusu ve bildirimi açılır.
   - **Haftalık Öne Çıkan Başarı Kartı (Alt Kısım):**
     - ⭐ *"Bu hafta en çok bugün (27 Ağustos Perşembe) ₺ 164.200 satış yaptın ve ₺ 42.800 kâr ettin!"*

---

## 🖥️ 1. Tablet Emülatörünü Anında Çalıştırma (Tarayıcıda Canlı Test)

Bilgisayarınızda herhangi bir kurulum yapmadan doğrudan çift tıklayarak sistemi test edebilirsiniz:

1. Proje ana dizinindeki `index.html` dosyasına çift tıklayın veya tarayıcınızda açın.
2. Açılan ekranda **fiziksel tablet kasası, dokunmatik kontroller, canlı saat ve butonlar** çalışır.
3. Üstteki **"Canlı Satış Simüle Et"** butonuna basarak sisteme anlık rastgele toptan satışlar ekleyip grafiklerin animasyonla güncellenmesini izleyebilirsiniz.
4. **"Yönü Çevir"** butonu ile tableti yatay ve dikey modlar arasında çevirebilirsiniz.
5. Grafik üzerindeki gün noktalarına tıklayarak gün gün kıyaslamayı test edebilirsiniz.

---

## 🤖 2. Native Android Kotlin (Jetpack Compose) Projesi

Native Android tablet uygulaması `android_app/` klasörü içinde yer almaktadır:

- **Dil:** Kotlin 1.9+
- **Arayüz:** Jetpack Compose & Material 3
- **Mimari:** MVVM (Model-View-ViewModel) & StateFlow
- **Çalıştırma:** Android Studio'da `android_app` klasörünü `Open Project` diyerek açın ve tablet emülatöründe veya fiziksel tabletinizde `Run` butonuna basın.

---

## 📁 Dosya Yapısı

```
satış sistemi/
├── index.html                 # İnteraktif Canlı Tablet Emülatörü
├── style.css                  # Siyah OLED Cam Teması & Tablet Çerçevesi
├── app.js                     # 60 FPS Grafik Motoru & Kıyaslama Mantığı
├── README.md                  # Bu dokümantasyon
│
└── android_app/               # Android Studio Kotlin Projesi
    ├── app/
    │   ├── src/main/java/com/toptanci/sales/
    │   │   ├── MainActivity.kt
    │   │   ├── model/SalesModels.kt
    │   │   ├── viewmodel/SalesViewModel.kt
    │   │   └── ui/
    │   │       ├── theme/ (Color.kt, Theme.kt, Type.kt)
    │   │       ├── components/ (TopBar, Drawer, StatCards, PieCharts, DailySales)
    │   │       └── screens/DashboardScreen.kt
    │   └── build.gradle.kts
    └── build.gradle.kts
```

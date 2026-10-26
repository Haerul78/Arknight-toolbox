# Brief: MaterialPage + halaman detail material

Status: **menunggu persetujuan**, belum ada kode yang diubah.
Screenshot audit: `docs/material-audit/` (1440×900 dan 390×844, data 2026-10-25).

---

## 1. Audit halaman sekarang (`/materials`)

Angka diukur headless dari halaman yang sedang jalan.

| | 1440×900 | 390×844 |
|---|---|---|
| Tinggi halaman | 18.883 px (**21 layar**) | 57.826 px (**68,5 layar**) |
| Item di layar pertama | 24 | **6** |
| Ukuran kartu dan ikon | 211×130, ikon 56 px | 163×150, ikon 56 px |

### Boros ruang
- **81% daftar berisi item milik satu operator**: 400 token potensial, 163 Kernel Token, dan 34 Personal Letter (597 dari 736). Material umum habis di item ke-90; 646 kartu sisanya hanya berguna kalau orang mencari operator tertentu.
- Satu kartu 211×130 hanya memuat satu ikon 56 px dan satu baris nama. Sekitar 85% luasnya kosong atau dekorasi: garis warna, tile gradien, badge tier.
- Ada blok header setinggi ±350 px (kicker "Depot", judul, garis putus-putus, search, chip) sebelum item pertama.

### Susah dibaca dan dicari
- **Urutan mengikuti tabel mentah tanpa judul grup**: Battle Record, lalu Chip, lalu Orirock, lalu token. Rantai crafting (Orirock → Cube → Cluster → Concentration) tidak terlihat sebagai satu keluarga.
- **Filter tier memecah keluarga.** Pilih T3, dan Orirock Cluster bercampur dengan Sniper Chip dan Original… Token. Tier adalah atribut, bukan cara orang mencari.
- Tier ditampilkan tiga kali (garis atas, label "T3", warna tile), tetapi warna T2 (kuning-hijau) dan T5 (emas) sulit dibedakan di ukuran sekecil itu.
- **Tinggi kartu tidak rata.** Nama dua baris ("Transmuted Salt Agglomerate", "Replicated Vanguard Token") membuat baris grid bergerigi.
- Jumlah hasil ditulis "004", dengan nol di depan yang terbaca seperti kode, bukan jumlah.

### Kurang informatif
- **Kartu tidak bisa diklik**, padahal hover-nya mengangkat kartu dan memberi bayangan, jadi terlihat seperti tautan.
- Tidak ada cara pakai, resep, sumber, atau jumlah yang dibutuhkan, padahal semuanya ada di data (lihat bagian 3).

### Tidak konsisten
- Ini satu-satunya halaman yang masih memakai gaya lama: kartu gelap membulat di atas kertas terang, bayangan, garis putus-putus, dan font Barlow. Home, Operators, dan detail operator sudah memakai grid Swiss.
- Animasi stagger diputar ulang setiap filter berganti (`key={rarity}`), sehingga 24 kartu pertama selalu "lahir" lagi.

> Template permintaanmu masih berisi placeholder `[tulis di sini…]`, jadi audit ini dari pengamatanku sendiri. Kalau ada keluhan spesifik yang belum tercakup, tambahkan dan brief-nya kusesuaikan.

---

## 2. Arah yang diusulkan: `/materials`

Mengikuti sistem halaman Operators: sel persegi `--cell`, 12 kolom desktop dan 4 kolom HP, `SwissPage`, `Band`, `FitTitle` untuk judul, `Label` mono, dan aksen amber. Tidak ada token warna atau font baru. Warna tier dipertahankan hanya sebagai kotak kecil 8 px. Tier dibaca dari **posisi kolom** (varian A) atau **angka** (varian B), bukan dari warna.

### Keputusan bersama untuk kedua varian
1. **Field `category` baru** di `materials.json`, diturunkan dari id dan sortId:

   | Kategori | Isi | Jumlah |
   |---|---|---|
   | Crafting materials | Orirock…Rephasic Enantiomer | 56 |
   | Chips | termasuk Chip Catalyst | 25 |
   | Battle records | | 4 |
   | Skill summaries | | 3 |
   | Module materials | | 3 |
   | Class tokens | Replicated…Prime | 48 |
   | Operator tokens and letters | | 597 |

   Total yang tampil secara default: **139 item**.
2. **Grup "Operator tokens and letters (597)" tertutup secara default.** Saat dibuka, isinya berupa strip avatar kecil, bukan kartu. Saat orang mengetik nama operator di search, item yang cocok muncul langsung tanpa perlu membuka grup.
3. **Search** mencocokkan nama material, nama operator (untuk token), dan kategori. Filter tier diganti **filter kategori**. Tier tetap bisa dipakai sebagai urutan atau filter sekunder di varian B.
4. **Setiap item menjadi `<Link to="/materials/:id">`.** id-nya adalah id game yang stabil (`30135` = D32 Steel), jadi kalkulator nanti bisa menautkan langsung.
5. **Tanpa animasi masuk per item.** Satu reveal untuk judul saja, seperti di Home.
6. Jumlah hasil ditulis "Showing 139 of 139", sama seperti Operators.

### Varian A: Chain chart (`?v=a`)
Material disusun sebagai **bagan rantai crafting**: satu baris per keluarga dan satu kolom per tier. Keluarga diambil dari id game (digit terakhir = tier), contohnya `3001x` Orirock dan `3007x` Loxic Kohl → White Horse Kohl. Di garis antar-sel ada angka resep kecil, misalnya **3** di antara Orirock dan Cube (3 Orirock → 1 Cube). Inilah elemen "berani" halaman ini; selebihnya tenang.

```
1440 — 12 kolom
┌────────────┬─────┬─────┬─────┬─────┬─────┬─────┬───────────────────────┐
│ (01) CRAFTING MATERIALS                    T1 … T6 │  Showing 139 of 139  │
├────────────┼─────┼─────┼─────┼─────┼─────┼─────┼───────────────────────┤
│ Orirock    │ ▣  3│ ▣  5│ ▣  4│ ▣   │     │     │  ORIROCK CLUSTER  T3  │
│ Sugar      │ ▣  3│ ▣  4│ ▣  ·│ ▣   │     │     │  Workshop: 5 Cube     │
│ …          │     │     │     │     │     │     │  + 200 LMD            │
│ Loxic Kohl │     │     │ ▣  ·│ ▣   │     │     │  Needed by 149 ops    │
│ …          │     │     │     │     │     │     │  Stage 2-4, 4-6 …     │
├────────────┼─────┴─────┴─────┴─────┼─────┤     │  [Open material]      │
│ Tier 5     │  crafted from three T4 │ ▣ D32 Steel, ▣ Bipolar…       │
├────────────┼───────────────────────┴─────┴─────┴───────────────────────┤
│ (02) CHIPS            Vanguard  │ T3 │ T4 │ T5 │   (same chart)        │
│ (03) BATTLE RECORDS · SKILL SUMMARIES · MODULE · CLASS TOKENS          │
│ (04) OPERATOR TOKENS AND LETTERS (597)                       [ Open ]  │
└─────────────────────────────────────────────────────────────────────────┘
```
- Desktop: label keluarga di 2 kolom, tier di kolom 3–8, dan **4 kolom kanan sebagai caption yang mengikuti item aktif** (hover-intent `useActiveRow`). Caption berisi resep, jumlah operator, dan stage terbaik. Caption ini adalah "caption melebar ke kiri di kolom kanan" yang kita sepakati dulu, dan menjadi pratinjau halaman detail.
- HP (4 kolom): label keluarga mengisi sel kosong di kiri (keluarga T3/T4 hanya memakai kolom 3–4). Keluarga T1–T4 memakai satu baris penuh dengan label di atasnya. Class token yang punya 6 tier dibagi 4 + 2. Tanpa caption; tap langsung membuka detail.
- Perkiraan tinggi: sekitar **4 layar** di desktop (dari 21) dan sekitar **9 layar** di HP (dari 68,5).
- Risiko: orang yang belum kenal sistem tier perlu sekilas untuk memahami bahwa kolom = tier. Header kolom T1…T6 wajib ada.

### Varian B: Index list (`?v=b`)
Daftar seperti "Daftar A" di Operators: **satu baris per item**, digrup per kategori, pemisah grup mengikuti urutan sort (Category, Tier, atau Name).

```
1440
┌──┬──────────────────────────┬────┬──────────────────────────┬──────────┬──────────────┐
│▣ │ Orirock Cluster          │ T3 │ 5× Orirock Cube + 200 LMD│ 149 ops  │ 2-4, 4-6 …   │
│▣ │ Orirock Concentration    │ T4 │ 4× Orirock Cluster       │ … ops    │ …            │
│▣ │ D32 Steel                │ T5 │ ▣1 ▣1 ▣1 + 400 LMD       │ 248 ops  │ Workshop only│
└──┴──────────────────────────┴────┴──────────────────────────┴──────────┴──────────────┘
390: ▣ nama (2 baris boleh) / T3 · 149 ops di baris kedua; resep dan stage disembunyikan
```
- Kolom: ikon 1 sel, nama, tier (angka), resep inline dengan mini-ikon, "needed by" (jumlah operator), dan sumber utama.
- Tinggi baris = 1 sel (±116 px desktop). Kalau terlalu renggang, ½ sel dengan ikon 48 px; ini titik yang akan kubandingkan di screenshot.
- Perkiraan tinggi: sekitar **9 layar** di desktop dan sekitar **13 layar** di HP (139 baris; token tertutup).
- Kelebihan: paling mudah dipindai dan dicari, serta langsung menjawab "untuk apa / dari mana". Kekurangan: rantai crafting tidak terlihat sebagai bentuk.

Kedua varian memakai data, filter, search, dan komponen yang sama. Hanya bagian daftarnya yang berbeda. Setelah kamu memilih, varian yang kalah langsung dihapus (pelajaran dari detail operator).

---

## 3. Halaman detail baru: `/materials/:id`

### Data (semuanya sudah ada di `src/data/raw`, kecuali satu file)
Script baru `generate-material-details.mjs` akan menulis `material-details.json`, di-lazy-load seperti `operator-details.json`.

| Bagian | Sumber | Catatan |
|---|---|---|
| Deskripsi, usage | `item_table` | |
| **Resep** | `building_data.workshopFormulas` (68) dan `manufactFormulas` | Bahan beserta jumlah, LMD, syarat level Workshop, dan peluang byproduct 10% (daftar byproduct beserta bobotnya). Battle Record dibuat di Factory. Konversi chip (3 Medic Chip ↔ 3 Defender Chip) ditampilkan terpisah. |
| **Breakdown total ke T1** | dihitung rekursif | Contoh: D32 Steel = … Orirock, … LMD. Bagian ini juga akan dipakai kalkulator. |
| **Dipakai untuk membuat** | kebalikan dari resep | Orirock Cluster → Orirock Concentration, RMA70-24, Optimized Device, Solidified Fiber Board. |
| **Operator yang membutuhkan** | `character_table` (elite, skill 1→7, mastery) dan `uniequip_table` (modul) | Per operator, jumlah per jenis. Skalanya besar: D32 Steel dibutuhkan **248 operator (total 1.548)**, Skill Summary 3 **390 operator**, Module Data Block **365**. |
| **Cara mendapatkan: stage** | `stageDropList` (75 material) | Hanya berisi kategori peluang (`ALWAYS/ALMOST/USUAL/OFTEN/SOMETIMES`), **tanpa persentase**. Kode stage dan biaya sanity butuh `stage_table.json` (15 MB, belum ada; masuk `src/data/raw` yang sudah di-gitignore). |
| **Cara mendapatkan: lainnya** | `obtainApproach`, `shopRelateInfoList` | Nama toko (`LGGSHD_SHOP`, `EPGS_SHOP`, `REP_SHOP`, `XSHD_SHOP`) belum kupastikan artinya. Yang tidak bisa diverifikasi tidak akan ditampilkan. |

Ditemukan 2 resep Workshop yang hasilnya tidak ada di `item_table` EN (kemungkinan material CN yang belum rilis). Keduanya dilewati dan dicatat di log script.

### Layout (mengikuti detail operator versi yang dipulihkan)
```
1440
┌ ← Materials ─────────────────────────────── Data 2026-10-25 ┐
│ ┌──────────┐  ▪ T5 · Crafting materials                      │
│ │   ikon   │  D32 STEEL  (FitTitle)                          │
│ │  3×3 sel │  Usage, satu kalimat dari data                  │
│ └──────────┘  Needed by 248 operators · 1,548 in total      │
│               Workshop · 400 LMD · byproduct 10%            │
├ (01) Recipe ─────────────────────────────────────────────────┤
│  ▣×1 Manganese Trihydrate  ▣×1 Grindstone Penta.  ▣×1 RMA… │
│  [Show full breakdown]  → baris T1 beserta total LMD         │
├ (02) Used to craft ──────────────────────────────────────────┤
├ (03) How to get ─────────────────────────────────────────────┤
│  Stage     Name            Chance       Sanity              │
│  2-4       …               Often        …                   │
│  Event stages (12) [tertutup, bisa sudah tidak tersedia]    │
├ (04) Needed by ──────────────────────────────────────────────┤
│  [All | Elite | Skills | Mastery | Modules]  sort: amount   │
│  avatar ×12  avatar ×12  avatar ×9 …  (grid sel, 12/baris)  │
└──────────────────────────────────────────────────────────────┘
```
- Bagian tanpa data disembunyikan, bukan ditampilkan kosong. Material T1 tidak punya resep; T5 tidak punya stage.
- **Token dan letter** memakai template yang sama: kepala berisi ikon dan nama, bagian "Needed by" hanya berisi satu operator beserta tautan ke `/operators/:id`, dan bagian "How to get" berisi `obtainApproach`.
- Avatar di "Needed by" menaut ke detail operator. Angka jumlah ditulis mono di sudut sel.
- Kait untuk kalkulator: `/materials/30135` dan anchor `#recipe` / `#needed-by`. Breakdown T1 diekspor sebagai fungsi di `src/lib/` supaya kalkulator memakai logika yang sama.
- Satu desain saja untuk detail (tanpa varian), kecuali kamu minta.

---

## 4. Yang perlu kamu putuskan
1. **Varian A dan B dibuat dua-duanya untuk dibandingkan?** Saranku ya, karena ini perubahan struktur, bukan sekadar kepadatan.
2. **Unduh `stage_table.json` (15 MB) ke `src/data/raw/`?** Tanpa file ini, bagian stage hanya bisa menampilkan id mentah seperti `main_02-04`.
3. **Stage event lama**: tampilkan dalam grup tertutup (usulanku), atau sembunyikan seluruhnya?
4. **Persentase drop**: data game hanya punya kategori. Angka sungguhan butuh Penguin Statistics (API eksternal, diambil saat build). Usulanku: tidak sekarang.

## 5. Urutan kerja setelah disetujui
1. Generator: `category` di `materials.json`, lalu `material-details.json` (dan `stage_table` bila disetujui).
2. Halaman detail `/materials/:id` beserta route-nya.
3. `/materials` varian A dan B, dengan screenshot berdampingan 1440×900 dan 390 px. Jalur yang diperiksa: daftar default, search "orirock", search "exusiai" (token), dan grup token dibuka.
4. Kamu memilih, lalu varian yang kalah dihapus.

# Brief: OperatorDetailPage sebagai "Dossier Rhodes Island"

Status: disetujui dan diimplementasikan (2026-10-25). Keputusan: `branches.json` dibuat;
ringkasan skill memakai level tertinggi yang bisa dicapai (Mastery 3 bila ada datanya,
Level 7 bila tidak); galeri berhenti sticky di bawah tinggi viewport ~700 px.

Konteks: halaman detail operator adalah halaman **referensi**, bukan halaman kesan seperti Home.
Halaman ini harus padat informasi tapi tetap rapi, tetap dalam bahasa Swiss proyek ini (grid
terlihat, label mono, aksen amber, garis tipis).

---

## 1. Audit halaman sekarang

Diukur pada `/operators/char_103_angel` (Exusiai). Viewport dibuat persis lewat iframe, karena
window browser tidak bisa diubah ukurannya.

Screenshot diambil di 1440×900 dan 1920×1080 (file sementara, tidak disimpan di repo).

### Peta isi sel di atas lipatan

`█` = sel berisi konten, `·` = sel kosong (hanya garis grid). Seluruh kotak art dihitung sebagai
terisi, termasuk bagian transparannya.

```
1440×900 (sel 116 px, 8 baris, 54% terisi)    1920×1080 (sel 156 px, 7 baris, 51% terisi)
█····███████                                   █·····██████
·······█████   ← blok kosong 4×3               ·······█████   ← blok kosong 5×3
██·····█████     di kiri atas                  ·······█████
████···█████                                   ████···█████
████···█████                                   ████·███···█
████·█·██··█                                   ████·███···█
██·········█   ← baris label section           ············   ← satu baris kosong penuh
███·········
```

### Apa yang terlihat di atas lipatan

| Info | 1440×900 | 1920×1080 |
|---|---|---|
| Nama, rarity | terlihat | terlihat |
| Class (ikon), posisi | terlihat | terlihat |
| Faction, tags, obtain | terlihat | terlihat |
| Trait | terlihat | terlihat |
| Nama branch | **tidak ada di data** (hanya id seperti `fastshot`) | sama |
| Stat | sebagian, mulai di 752 px; nilai di bawah lipatan | mulai di 992 px |
| Cost, block | tidak | tidak |
| Range | tidak (mulai di 1.332 px) | tidak (mulai di 1.772 px) |
| Skill | tidak (mulai di 1.796 px) | tidak (mulai di 2.396 px) |

### Bagian paling boros ruang

1. **Kiri atas: blok kosong 4×3 sel (1440) / 5×3 sel (1920).** Judul di-*bottom-align* di area
   setinggi 5 baris, sehingga separuh atas zona info kosong. Ini blok kosong terbesar di halaman,
   dan tidak disengaja.
2. **Baris label section.** 9 baris setinggi satu sel penuh yang hanya berisi "0N (Name)":
   1.404 px, atau **23% dari tinggi halaman** di 1920×1080. Tinggi halaman 6.140 px (sekitar 6 layar).
3. **Semua section bertumpuk selebar 12 kolom.**
   - Range memakai band 12×3 sel (1872×468 px), padahal petak dan caption-nya hanya mengisi
     15 dari 36 sel.
   - Material promosi memakai 5 dari 12 sel per baris elite (label 2 sel + 3 material).
   - Baris "Max trust" setinggi satu sel penuh (156 px) untuk satu baris teks.
4. **Info penting di bawah lipatan.** Cost, block, 8 stat, range, dan skill tidak terlihat di atas
   lipatan. Nilai stat juga hanya tampil untuk satu elite sekaligus (lewat tab E0/E1/E2), dan
   skill hanya untuk satu level sekaligus (toggle Lv 7/M3).

---

## 2. Brief perbaikan

### Prinsip

Lembar spesifikasi yang bisa di-scan sekali lihat. Ruang kosong hanya ada di satu tempat yang
disengaja, yaitu kotak art. Semua sisanya dipakai untuk data.

### Ritme

- **Unit `u` = setengah sel** (58 px di 1440, 78 px di 1920). Batas setiap blok membulat ke `u`.
- **Baris tabel padat memakai tinggi tetap 28 px** dengan angka mono tabular, bukan mengikuti
  ukuran sel. Kalau mengikuti sel, tabel di 1920 akan ikut membengkak.
- **Garis grid tetap per sel,** jadi blok yang mengunci ke `u` jatuh di garis grid setiap 2 unit.
- **Label section tidak lagi punya baris sendiri.** Label jadi judul kecil di garis atas bloknya,
  setinggi satu baris tabel. Ke-9 baris label yang sekarang hilang.

### Tipe

- Judul: `FitTitle` yang sudah ada, dengan batas lebih kecil (sekitar 0,8 sel), karena kolomnya
  sekarang 7, bukan 12.
- Label: IBM Plex Mono 11 px.
- Tabel: IBM Plex Mono 13–14 px, tabular.
- Teks skill dan talent: Archivo 14–15 px, maksimal sekitar 70 karakter per baris.

### Layout desktop: dua zona

```
┌ kiri: 5 kolom, STICKY ───────┐┌ kanan: 7 kolom, di-scroll ─────────────────────────────┐
│ ⌐                        ⌐  ││ ← Operators            (File PL03)    Data 2026-10-25  │ u
│                              ││ ★★★★★★                                                 │
│        ART (galeri,          ││ EXUSIAI  (FitTitle)                                    │ 2u
│        tinggi viewport       ││ ◯ Sniper / Marksman  Ranged │ Lungmen / Penguin │ DPS  │ u
│        dikurangi caption)    ││ (Attacks aerial enemies first)  Obtain: Recruitment    │
│                              │├ Stats (level maks, semua elite) ──────┬ Range ─────────┤
│                              ││      Lv  HP   ATK DEF RES Cost Blk Int  Re│ ▓▓▓▓       │
│                              ││ E0   50  1016 305  95  0  12   1  1.00 70│◘▓▓▓  3-3   │ 3u
│                              ││ E1   80  1338 437 136  0  14   1  1.00 70│ ▓▓▓▓ (E2)  │
│                              ││ E2   90  1673 540 161  0  14   1  1.00 70│ ← tebal     │
│ ⌙                        ⌙  ││ Pilih  [E0|E1|E2] Lv ━━●━ 61 → 1430 498…  Trust ATK+90  │ u
│ 02/05 (Elite 2)     (←)(→)  │├ Skills (nilai M3) ──────────────────────────────────────┤
└──────────────────────────────┘│ [ic] S1 Charging │ [ic] S2 Shooting  │ [ic] S3 Overload │
                                │ Auto · SP 0/4    │ Manual · 25/35 15s│ Auto · 20/30 15s │ 4u
                                │ Shoots 3 times…  │ Shoots 4 times…   │ Shoots 5 times…  │
                                ╞═════════════ ↑ lipatan layar 1440×900 ═════════════════╡
                                │ Skill detail: Lv 7 dan M3 berdampingan per skill        │
                                ├ Talents ───────────────────┬ Potential (2→6) ───────────┤
                                ├ Modules (2 kolom) ─────────┬ Base skills ───────────────┤
                                ├ Promotion E1 │ E2 (ikon ½ sel)┬ Profile ───────────────────┤
```

Angka di wireframe hanya contoh tata letak; nilai sebenarnya diambil dari data.

#### Zona kiri (5 kolom, sticky di bawah navbar)

- Galeri yang sudah ada (`ArtGallery`), setinggi viewport dikurangi baris caption.
- **Ini satu-satunya ruang lega yang disengaja.** Art adalah satu-satunya visual di halaman
  referensi. Karena kotaknya ikut terlihat selama zona kanan di-scroll, kotak itu bekerja sebagai
  penanda identitas, bukan ruang terbuang.

#### Zona kanan, di atas lipatan

Dihitung untuk 844 px tinggi konten di 1440×900:

| Blok | Isi | Tinggi |
|---|---|---|
| Identitas | Link kembali, file no., tanggal data, rarity, nama, class/branch, posisi, faction, tags, trait, obtain | 3u |
| Stat + range | Tabel stat semua elite + baris "Pilih", dengan range di sebelahnya | 4u |
| Ringkasan skill | Semua skill dalam 3 kolom | 4u |
| **Total** | | **11u ≈ 640 px** |

Masih ada sisa ruang untuk jaga-jaga kalau teks skill panjang.

#### Tabel stat

- Ketiga elite di level maksimalnya tampil sekaligus, tanpa klik. Baris E2 dicetak tebal.
- Kolom: Lv, HP, ATK, DEF, RES, Cost, Block, Atk interval, Redeploy.
- Baris "Pilih" tetap bisa memilih elite dan level apa pun, dan nilainya muncul di baris itu,
  memakai `statsAt` yang sudah ada. Bonus trust maksimal pindah ke baris ini.
- Tab E0/E1/E2 yang sekarang dihapus.

#### Range

- `RangeOnGrid` yang sudah ada, dengan petak seukuran `u` (setengah sel).
- Sprite idle tetap berdiri di petak operator.
- Range mengikuti elite yang dipilih di baris "Pilih", dengan fallback `resolveRange` yang sudah ada.

#### Ringkasan skill

- Semua skill dalam 3 kolom sejajar: ikon, nama, jenis pemicu dan pemulihan SP, SP awal/biaya,
  durasi, dan deskripsi M3 (maksimal 3 baris).
- Tidak ada toggle.
- Di bawah lipatan ada blok **"Skill detail"** yang menampilkan Lv 7 dan M3 berdampingan dengan
  teks lengkap, jadi tidak ada info yang tersembunyi.

#### Info sekunder (multi-kolom)

- Talents di samping Potential (rank 2–6).
- Modules (2 kolom) di samping Base skills.
- Material promosi (ikon setengah sel, E1 dan E2) di samping Profile.

#### Aturan ruang kosong

Tidak ada blok kosong di zona kanan yang lebih besar dari 2×2 sel. Setelah implementasi, aturan
ini diuji dengan peta sel yang sama seperti di audit, di 1440×900 dan 1920×1080.

### HP (satu kolom, urutan prioritas sama)

1. Galeri (4×4 sel + caption)
2. Identitas
3. Tabel stat yang **ditransposisi**: 8 baris stat × kolom E0/E1/E2, karena 8 kolom tidak muat
   di 4 sel
4. Baris "Pilih"
5. Range (diagram kecil seperti sekarang)
6. Skill bertumpuk
7. Info sekunder satu kolom

### Yang tetap dipakai

`ArtGallery`, `FitTitle`, petak range dengan sprite idle, `statsAt` / `resolveRange`, dan semua
komponen di `components/swiss`. Logika data tidak berubah.

### Yang dibuang

- Tab Elite dan toggle Lv 7/M3, karena keduanya menyembunyikan info.
- 9 baris label section.
- Baris "Max trust" sendiri (pindah ke baris "Pilih").

---

## 3. Keputusan yang masih terbuka

1. **Nama branch.** Semua 75 branch punya nama resmi di `src/data/raw/uniequip_table.json`
   (`subProfDict`), dan tidak ada branch operator yang tanpa nama. Usulan: generator menulis satu
   file kecil `branches.json` (id → nama, mis. `fastshot` → "Marksman"). Ini hanya menambah file;
   logika lain tidak berubah. Tanpa file ini, yang bisa tampil hanya ikon branch.
2. **Skill di atas lipatan.** Ringkasan memakai nilai **M3**, dan Lv 7 ada di blok detail di
   bawahnya. Atau Lv 7 yang jadi default?
3. **Sticky di layar pendek.** Kalau tinggi viewport di bawah sekitar 700 px, galeri berhenti
   sticky supaya tidak terpotong.

## 4. Catatan terkait (di luar brief ini)

- 14 subclass (36 operator, mis. counsellor, hammer, soulcaster) tidak punya file ikon di
  `public/subclass/`, sehingga ikon branch mereka tampil kosong. Ikonnya juga tidak ada di repo
  sumber art (`PuppiizSunniiz/Arknight-Images`, folder `classes/`).

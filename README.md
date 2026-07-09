# Kad Jemputan Kahwin — Munirah &amp; Alif

Kad jemputan perkahwinan digital (satu halaman) bertemakan biru diraja & bunga.
Dibina dengan HTML, CSS dan JavaScript tulen — tiada pemasangan diperlukan.

## Cara guna
Buka `index.html` dalam pelayar (double-click). Tekan **Buka Jemputan** untuk mula.

## Ciri-ciri
- **Kulit (cover)** dengan monogram, nama pengantin & butang buka.
- **Muzik latar** — main automatik selepas jemputan dibuka; boleh togol di butang bulat kanan bawah.
- **Salam & jemputan** penuh (Bismillah, ibu bapa, nama pengantin).
- **Tarikh, lokasi & masa** + butang **Peta Lokasi** (Google Maps).
- **Countdown** ke hari majlis + butang **Simpan Ke Kalendar** (.ics).
- **Ucapan & RSVP** — tetamu tinggalkan ucapan/kehadiran (disimpan dalam pelayar).
- **Reka bentuk responsif** — sesuai untuk telefon.

## Menukar muzik
Fail `assets/music.mp3` sekarang hanyalah *placeholder*. Jika ia bukan audio sah,
laman akan **menjana nada latar lembut secara automatik** (Web Audio API) supaya
tetap ada bunyi.

Untuk guna lagu sebenar: gantikan `assets/music.mp3` dengan fail MP3 anda
(nama sama). Pastikan anda ada hak guna lagu tersebut.

## Menyesuaikan
Semua tetapan mudah ada di bahagian atas `script.js`:
- `EVENT_DATE` — tarikh & masa majlis (untuk countdown/kalendar).
- `WA_PHONE`  — no. telefon WhatsApp untuk terima RSVP (cth `'60123456789'`).
  Biar kosong jika mahu simpan setempat sahaja.

### Nama tetamu peribadi
Tambah `?to=` pada pautan untuk paparkan nama tetamu, contohnya:
```
index.html?to=Keluarga%20Ahmad
```

## Struktur
```
wedding-invitation-site
├── index.html    # Struktur kad
├── styles.css    # Gaya & animasi
├── script.js     # Muzik, countdown, kalendar, RSVP
├── assets/
│   └── music.mp3 # Muzik latar (ganti dengan lagu sebenar)
└── README.md
```

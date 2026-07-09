# Kumpul Ucapan/RSVP ke Google Sheet (Percuma)

Panduan menyambungkan borang "Ucapan & Kehadiran" ke satu Google Sheet.
Selepas siap, setiap ucapan tetamu akan masuk automatik ke sheet — keluarga boleh lihat semua di satu tempat.

---

## Langkah 1 — Cipta Google Sheet
1. Buka https://sheets.google.com dan cipta helaian baru.
2. Namakan, cth. **Ucapan Munirah & Alif**.
3. Di baris pertama (row 1), taip tajuk lajur:

   | A | B | C | D | E |
   |---|---|---|---|---|
   | Tarikh | Nama | Kehadiran | Pax | Ucapan |

## Langkah 2 — Tambah Apps Script
1. Dalam sheet: menu **Extensions → Apps Script**.
2. Padam kod sedia ada, tampal kod di bawah, kemudian **Save** (ikon disket).

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var d = JSON.parse(e.postData.contents);
    sheet.appendRow([
      new Date(),              // Tarikh diterima
      d.name || '',
      d.attend || '',
      d.pax || '',
      d.msg || ''
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Langkah 3 — Deploy sebagai Web App
1. Klik **Deploy → New deployment**.
2. Pada "Select type" (ikon gear) → pilih **Web app**.
3. Isi:
   - **Description**: apa-apa (cth. "RSVP kahwin")
   - **Execute as**: **Me** (akaun anda)
   - **Who has access**: **Anyone**  ← PENTING
4. Klik **Deploy**. Benarkan/authorize bila diminta (pilih akaun → Advanced → Go to project → Allow).
5. Salin **Web app URL** — bentuknya:
   `https://script.google.com/macros/s/AKfyc.../exec`

## Langkah 4 — Masukkan URL ke laman
1. Buka fail `script.js`.
2. Cari baris:
   ```javascript
   var SHEET_URL = '';
   ```
3. Tampal URL tadi di antara tanda petik:
   ```javascript
   var SHEET_URL = 'https://script.google.com/macros/s/AKfyc.../exec';
   ```
4. Simpan. Selesai! ✅

---

## Uji
- Buka laman, hantar satu ucapan ujian → semak sheet, satu baris baru sepatutnya muncul.
- Nota: penghantaran guna `mode: 'no-cors'` (fire-and-forget) — laman tak baca balasan, jadi ia sentiasa nampak "berjaya" di sisi tetamu walau sheet bermasalah. Sebab itu uji sekali selepas deploy.

## Kalau nak ubah kemudian
- Jika ubah kod Apps Script: **Deploy → Manage deployments → Edit (pensel) → Version: New version → Deploy** (URL kekal sama).
- Selagi `SHEET_URL` kosong, laman guna **WhatsApp** (+601119949565) sebagai sandaran.

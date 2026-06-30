# Checklist Go-Live: Auto Buy & Auto Sell (Cutloss)

> ⚠️ **JANGAN PERNAH** tulis Private Key asli di sini atau di chat AI manapun.
> File ini cuma checklist & template — isinya placeholder doang.

---

## 0. Sebelum mulai

- [ ] Bot udah dites pakai `AUTO_BUY_DRY_RUN=true` minimal beberapa siklus
- [ ] Notif Telegram (AUTOBUY, AUTOSELL CUTLOSS) muncul dengan benar pas dry run
- [ ] Udah ngerti: `AUTO_BUY_DRY_RUN` itu satu saklar buat BUY *dan* SELL sekaligus

---

## 1. Wallet — pakai yang BARU, jangan wallet utama

- [ ] Bikin wallet baru khusus bot (Phantom/Solflare → Create New Wallet)
- [ ] **Jangan** pakai wallet yang isinya tabungan/NFT utama
- [ ] Alasan: kalau ada bug / token rug, kerugian terbatas ke isi wallet ini aja

**Cara ambil Private Key (base58):**
Phantom → Settings → pilih wallet → Export Private Key → masukin password → copy
(Hasilnya 1 baris base58, BUKAN seed phrase 12 kata)

---

## 2. RPC URL — jangan pakai default publik

RPC publik Solana gampang kena rate-limit buat bot. Pilih salah satu:

- [ ] [Helius](https://helius.dev) — ada free tier
- [ ] [QuickNode](https://quicknode.com)
- [ ] [Triton](https://triton.one)

Format URL biasanya: `https://mainnet.helius-rpc.com/?api-key=xxx`

---

## 3. Template `.env` (isi sendiri di server, JANGAN di sini)

```
# === SOLANA ===
RPC_URL=isi_rpc_url_lo
PRIVATE_KEY=isi_private_key_base58_wallet_BARU

# === AUTO BUY ===
AUTO_BUY_ENABLED=true
AUTO_BUY_DRY_RUN=false        # false = LIVE, true = simulasi
AUTO_BUY_AMOUNT=0.02          # mulai KECIL dulu
AUTO_BUY_MAX_PER=1            # mulai 1 dulu, naikin belakangan
AUTO_BUY_SLIPPAGE=500
AUTO_BUY_GRADE=ALL

# === AUTO SELL (cutloss & take-profit) ===
AUTO_SELL_ENABLED=true
AUTO_SELL_CUTLOSS_PCT=30      # jual otomatis kalau rugi >= 30%
AUTO_SELL_TP_PCT=0            # 0 = take-profit tetap manual (cuma notif target)
AUTO_SELL_SLIPPAGE=500
```

> 💡 Variabel lain (`TG_TOKEN`, `TG_CHAT_ID`, `GMGN_API_KEY`, dll) tetap dari `.env` lama lo, gak perlu diubah.

---

## 4. Top up wallet baru

- [ ] Hitung kebutuhan: `AUTO_BUY_AMOUNT` × `AUTO_BUY_MAX_PER` + buffer fee (~0.05 SOL)
- [ ] Contoh dengan setting di atas: kirim **~0.1 SOL** ke wallet baru udah cukup buat tes
- [ ] Transfer SOL dari wallet utama → wallet bot

---

## 5. Restart bot & verifikasi

```bash
node screen_asli_lokal_tidak_social.js
# atau: pm2 restart <nama-proses>
```

Cek log startup, **harus** muncul:
```
[ Auto Buy ]  Enabled: true | DryRun: false | ...
[ Auto Sell ] Enabled: true | CutLoss: -30% | ...
```

- [ ] Kalau `DryRun` masih `true` → `.env` belum ke-load, cek typo / proses lama belum ke-kill
- [ ] Kalau `Auto Sell Enabled: false` → cutloss gak akan eksekusi sama sekali, cek lagi `AUTO_SELL_ENABLED`

---

## 6. Kill switch — siapin SEBELUM lepas tangan

| Situasi | Cara stop |
|---|---|
| Jalan langsung di terminal | `Ctrl + C` (state otomatis tersimpan) |
| Pakai pm2 | `pm2 stop <nama-proses>` |
| Ada posisi nyangkut, autosell gagal terus | Jual manual lewat Phantom/Jupiter — token tetap aman di wallet |

---

## 7. Monitoring awal (24–48 jam pertama)

- [ ] Pantau channel Telegram thread `AUTO` tiap ada notif AUTOBUY / AUTOSELL
- [ ] Cek `screen.log` kalau ada error berulang
- [ ] Kalau ada notif **"AUTOSELL FAILED"** berkali-kali → cek manual posisi itu di Phantom, jual manual kalau perlu
- [ ] Setelah yakin jalan normal → baru naikin `AUTO_BUY_AMOUNT` / `AUTO_BUY_MAX_PER` pelan-pelan

---

## 8. Kalau mau minta bantuan cek error nanti

✅ Boleh kirim: isi `screen.log`, isi pesan error, screenshot notif Telegram
❌ Jangan kirim: isi `.env`, `PRIVATE_KEY`, seed phrase

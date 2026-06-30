# Auto Buy — Design Spec
Date: 2026-06-26

## Overview
Tambah fitur auto buy + auto sell ke auto-screen. Ketika token migrasi lolos semua filter di `screen.js`, bot otomatis beli via Jupiter, lalu monitor harga untuk sell di trailing stop atau cutloss.

## File yang Berubah
- `trader.js` — baru, semua logika buy/sell/monitor
- `screen.js` — edit kecil, panggil `autoBuy(token)` setelah token lolos filter
- `.env` — tambah keys baru
- `.gitignore` — tambah `wallet.json`

## Environment Variables Baru
```
BUY_ENABLED=true
BUY_AMOUNT_SOL=0.05
WALLET_PRIVATE_KEY=
SLIPPAGE_BPS=500
PRIORITY_FEE_LAMPORTS=100000
TP_PCT=30
TRAILING_STOP_PCT=15
CUTLOSS_PCT=20
MONITOR_HOURS=24
```

## Flow
```
Token lolos filter di screen.js
  └─ autoBuy(token)
       ├─ Skip kalau BUY_ENABLED=false
       ├─ Quote Jupiter (SOL → token)
       ├─ Execute swap
       │    ├─ Gagal → retry 1x
       │    └─ Gagal lagi → notif TG "❌ Buy FAILED [TOKEN]" → stop
       ├─ Berhasil → notif TG "✅ Buy [TOKEN] X SOL @ $price"
       └─ startMonitor(token, entryPrice)
            ├─ Tiap 30 detik cek harga
            ├─ Harga <= entry * (1 - CUTLOSS_PCT/100)
            │    └─ Sell semua → notif TG "🔴 Cutloss -20% [TOKEN]"
            ├─ Harga >= entry * (1 + TP_PCT/100)
            │    └─ Aktifkan trailing, track peakPrice
            │         └─ Harga turun TRAILING_STOP_PCT% dari peak
            │              └─ Sell semua → notif TG "✅ Trailing stop [TOKEN] +X%"
            └─ Lewat MONITOR_HOURS jam → stop monitor → notif TG "⏰ Expired [TOKEN]"
```

## trader.js — Fungsi Utama
- `autoBuy(token)` — entry point dari screen.js
- `getJupiterQuote(inputMint, outputMint, amount)` — call Jupiter quote API
- `executeSwap(quoteResponse, walletKeypair)` — build + sign + send tx
- `startMonitor(token, entryPrice, tokenBalance)` — loop monitor harga
- `autoSell(token, tokenBalance, reason)` — sell semua balance
- `sendTradeTelegram(msg)` — notif ke TG_THREAD_MIG

## Dependencies Baru
```
@solana/web3.js
bs58
```

## Safety
- Wallet khusus bot, bukan wallet utama
- Test dulu dengan BUY_AMOUNT_SOL=0.01
- BUY_ENABLED=false untuk disable tanpa stop bot
- Monitor auto-stop setelah MONITOR_HOURS untuk hindari memory leak

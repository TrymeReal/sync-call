# Smart Money Signal Feed — Mode 3

## Summary
Real-time signal feed dari GMGN endpoint `market signal --signal-type 12` untuk mendeteksi token yang baru dibeli Smart Money wallets (1-5 menit after trigger). Feed ketiga setelah New Migration dan Swing 1D.

## Sumber Data
- **Endpoint:** `gmgn-cli market signal --chain sol --signal-type 12 --raw`
- **Response:** Array signal events, masing-masing berisi:
  - `token_address`, `signal_type` (12 = SM buy)
  - `trigger_mc`, `market_cap` (current), `ath`
  - `data` object: full token snapshot (symbol, name, rug_ratio, liquidity, holder_count, top_10_holder_rate, smart_degen_wallets, dll)
  - `cur_data`: real-time current stats (top_10_holder_rate, holder_count, liquidity)

## Arsitektur
```
processTokens()
  ├── fetchGmgnTrenches()     → New Migration (existing)
  ├── fetchGmgnTrending()     → Swing 1D (existing)
  ├── fetchGmgnSignal()       → Signal events mentah
  ├── normalizeSignal()       → Group by token_address, ambil latest
  ├── Filter gates (5 gates)
  └── buildSignalMsg()        → Notifikasi ke tgThreadSignal (14050)
```

## Gates
| Gate | Field | Threshold | Config |
|------|-------|-----------|--------|
| Market Cap trigger | `trigger_mc` | < $500K | SIGNAL_MAX_MC |
| Liquidity | `data.liquidity` | > $5K | SIGNAL_MIN_LIQ |
| Holder count | `data.holder_count` | > 50 | SIGNAL_MIN_HOLDERS |
| Top 10 holder rate | `data.top_10_holder_rate` | < 25% | SIGNAL_MAX_TOP10 |
| Rug ratio | `data.rug_ratio` | reuse maxRugScore | MAX_RUG_SCORE |

## Normalisasi
- `normalizeSignal()` group signal events by `token_address`, ambil event terbaru
- Extract dari `data` field: symbol, name, price (calculated from mc/supply), liquidity, holder_count, rug_ratio, dll
- Return array of flat token objects (siap difilter)

## Notifikasi
Format ringkas via `buildSignalMsg()`:
```
🔔 SMART MONEY SIGNAL
Nama (SYMBOL)
━━━━━━━━━━━━━━━━━━━━
🟡 LP      : $12K
✅ Rug     : 0
👥 Holders : 199
🔍 Top10   : 23.9%
💎 SM Buy  : 3 wallets
📊 MC trig : $23.5K
📊 MC skrg : $26.2K
━━━━━━━━━━━━━━━━━━━━
Chart | GMGN
<code>address</code>
```

## Env Vars
```
SIGNAL_ENABLED=true
TG_THREAD_SIGNAL=14050
SIGNAL_MIN_LIQ=5000
SIGNAL_MIN_HOLDERS=50
SIGNAL_MAX_MC=500000
SIGNAL_MAX_TOP10=25
```

## Files Changed
- `screen.js`: +fetchGmgnSignal(), +normalizeSignal(), +buildSignalMsg(), config, processing loop, startup log
- `.env`: new API key + signal config

## Testing
- Unit test: `filters.test.js` unchanged (gates di screen.js inline)
- Integration: signal fetch → normalize → gates → notif (run via `node screen.js`)

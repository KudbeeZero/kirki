# Invstr & Social-Trading Competitive Analysis

> Research compiled 2026-06-09 via multi-source web research with adversarial
> verification. Claims are tagged with confidence and sources. This informs
> Simcoin's social/competition feature set (see `docs/game-design/social.md`).

---

## TL;DR — three things that change our assumptions

1. **Invstr has effectively wound down — it's not just "gone from the US."**
   - Its US real-money brokerage shut down in **May 2024** when clearing firm
     **Apex** ended the relationship. Invstr Financial LLC is listed **Inactive**
     at FINRA. *(High confidence.)*
   - The UK operating company (Invstr Limited, renamed "Newincco 1218 Ltd" in Jul
     2024) entered **creditors' voluntary liquidation on 24 Nov 2025**. *(High —
     UK Companies House.)*
   - Founder **Kerim Derhalli** appears to have pivoted the surviving shell into
     an AI venture (**AI Portfolio Solutions**, formerly "Invstr Crypto Limited").
   - The US App Store listing 404s as of 2026-06-09; whether the Fantasy Finance
     game still runs anywhere is **unconfirmed**. *(Medium/Low.)*
   - **Implication for us:** Invstr is a *design reference, not a live competitor*.
     There's an open lane for a polished, crypto-native successor. We should learn
     from their mechanics and their failure modes (below), not chase parity.

2. **The game is "Fantasy Finance," not "Fantasy Stock Exchange / FSX."**
   No source ties "FSX" to Invstr. *(High confidence.)* We don't need their name —
   ours is **Simcoin Seasons / Leagues**.

3. **"Bloom" is NOT an Invstr feature.** "Bloom"/"Blossom" are *separate*
   social-investing apps (e.g. Blossom Social, Canada). Invstr's social product was
   a **"Social Stream" feed + price-prediction mechanic**. *(High confidence.)*
   If you specifically liked "Bloom," that's a different app we can analyze
   separately — say the word.

---

## 1. Invstr feature inventory (as it existed)

### Fantasy Finance (the simulated game)
- **$1,000,000 virtual portfolio**, no real-money risk, tracking real markets. *(High)*
- Objective: highest returns → climb the **Invstr Fantasy League (IFL)** global ranking. *(High)*
- **Three monthly leagues by behavior**, not skill rating: *(High — Invstr support)*
  - **Raw** — everyone starts here each month.
  - **Supreme** — joined once you use a Power-Up or Undo.
  - **Xtreme** — joined once you hit 400 trades.
- **Monthly reset**; finish **top 25 of your league** to win in-app prizes or a
  **cash voucher** usable on the real brokerage. *(High; some reviews say "top 10" — likely per-tier/dated.)*
- **Private leagues**: invite friends/family/classmates/clubs/schools. *(High, 4 sources.)*
- **"100k Challenge"**: a selected user manages a real $100k account. *(Medium, single source.)*
- Trade tranches of $50k/$100k/$200k. *(High.)*

### Progression & gamification
- **Points + badges + XP**, unlocking features at milestones. *(High.)*
- **7-tier ladder** (e.g. Intern/Apprentice → … → **Guru**, 10 levels per tier).
  Only the top tier name ("Guru") is consistent across sources; intermediate
  names conflict. *(Medium.)*
- Academy learning had its own **levels + trophies**. *(Medium.)*
- **Monetized** enhancers: extra trades ($0.99), 2x/4x multipliers, undo/safety
  nets — **the most-criticized part** (see anti-patterns). *(Medium.)*

### Social ("Social Stream")
- A **Facebook-style feed** aggregating users' **price predictions**, status
  updates, comments, shared news. *(High.)*
- **Like / comment / share**; **follow** other investors "for tips"; **copy a
  prediction** with one tap. *(High.)*
- A **"Chat"** surface and **community polls**. *(Medium.)*
- Full **portfolio copy-trading** (eToro-style): **NOT confirmed** for Invstr —
  they copied *predictions*, not whole portfolios. *(Unverified.)*

### Education — Invstr Academy
- **~80–85 lessons across 10 modules**, quizzes, glossary, ~100 articles, market
  blogs, "Invstr Crunch" podcast. *(High.)*

### Real investing (now defunct)
- Commission-free US stocks/ETFs/ADRs/fractional + crypto (via DriveWealth /
  Coinbase), FDIC checking via Vast Bank, **Portfolio Builder** robo-picker. *(High, historical.)*

### Recent AI (post-rebrand to "Invxst"/Invstr.ai)
- AI report/earnings-call summaries, AI risk analysis, AI chat. *(Medium, single source.)*

### Ratings (historical)
- iOS ~**4.6/5**, Android ~**3.7–4.2/5**; ~500k users claimed. *(Medium.)*

---

## 2. What users loved vs. hated (design signal)

**Loved:** easy/beginner-friendly; the **risk-free $1M sim → live leaderboard**
loop; strong free **education**; low entry barrier; **"Glance Cards" with a single
composite Instrument Score** that reduces cognitive load. *(High.)*

**Hated (anti-patterns to avoid):**
- **Hard daily trade caps** (≈4 free / 8 premium) — the #1 complaint; felt
  paywall-driven and throttled engagement. *(Medium-High.)*
- **Over-indexing on the league format** with no free-form practice. *(Medium.)*
- **Thin charting/analytics** once users outgrew beginner mode. *(High.)*
- **Email-only support** for a finance product. *(Medium.)*

---

## 3. Competitor mechanics worth adapting (each tied to proof)

| # | Mechanic | Proven by |
|---|----------|-----------|
| 1 | **Weekly season w/ hard reset + prize pool** (crypto-native retention spine) | LARP (fantasy crypto) |
| 2 | **Constraint mechanic — "lock picks, no swaps"** (manufactures leaderboard drama) | LARP |
| 3 | **Tiered creator / copy economy paying top players** (Cadet→Elite Pro, ~1.5% of assets-under-copy, mandatory posting cadence) | eToro |
| 4 | **Real-crypto prizes + in-game badge/credit economy** | Altcoin Fantasy |
| 5 | **Multiple contest formats** (swing / streak-prediction / live race) | MarketDraft |
| 6 | **Private friend leagues w/ custom rules** | Invstr, Wall Street Survivor, MarketWatch VSE |
| 7 | **Education coupled to play** (learn a concept → place the trade) | Wall Street Survivor, Investopedia, Invstr |
| 8 | **Actionable social (sentiment + shareable "ideas/picks"), NOT a generic feed** | Stocktwits, TradingView |
| 9 | **Fantasy → real-product conversion funnel** (winners get credits) | Invstr |
| 10 | **Team tournaments / seasonal championships at scale** | Binance/Bybit/HTX tournaments |

**Critical counter-signal:** **Public.com terminated its social feed in 2025**,
replacing it with AI-generated content — evidence that a *generic activity feed is
not automatically retentive*. Build **actionable** social (sentiment, shareable
trade ideas, head-to-head leagues), not a vanity stream. *(Medium.)*

---

## 4. Key contradictions / gaps (don't over-trust)
- Invstr prize threshold: **top 25 (official)** vs **top 10 (reviews)** — unresolved.
- Progression tier names conflict; only "Guru" is consistent.
- Portfolio copy-trading for Invstr: **unverified** (predictions only, confirmed).
- Streaks for Invstr: **unverified**.
- App-store galleries were bot-blocked → screen layouts are inferred, not pixel-verified.

---

## 5. Primary sources
- Invstr support — https://invstr.com/support/learning-with-fantasy-finance/invstr/
- Invstr progression — https://invstr.com/support/learning-with-fantasy-finance/how-does-progression-work/
- FINRA BrokerCheck — https://brokercheck.finra.org/
- UK Companies House (08265075) — https://find-and-update.company-information.service.gov.uk/company/08265075/insolvency
- Invstr shutdown account — https://fatwalletrefugee.com/2024/05/21/invstr-shutdown/
- Finder review — https://www.finder.com/uk/share-trading/share-trading-reviews/invstr
- SmartAsset review — https://smartasset.com/investing/invstr-review
- MobileAppDaily review — https://www.mobileappdaily.com/product-review/invstr-stock-trading-app
- eToro Popular Investor — https://www.etoro.com/copytrader/popular-investor/
- Public.com terminates social — https://www.tradingview.com/news/financemagnates:a69690791094b:0-public-com-terminates-social-trading/
- LARP — https://www.larp.run/ · Altcoin Fantasy — https://altcoinfantasy.com/ · MarketDraft — https://marketdraft.com/
- TradingView social — https://www.tradingview.com/social-network/ · Stocktwits — https://stocktwits.com/
- Blossom Social (the real "Bloom"-ish app) — https://www.blossomsocial.com/

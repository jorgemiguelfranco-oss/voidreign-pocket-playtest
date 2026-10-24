# VOIDREIGN: Pocket Empire

Touch-first, offline-first, character-led science-fiction strategy. Public play-test site: https://jorgemiguelfranco-oss.github.io/voidreign-pocket-playtest/

## Android install and offline play

Open the site in Chrome for Android while online, choose **Install app** or **Add to Home screen**, then allow the first launch to complete. The service worker caches the HTML, manifest, SVG artwork and 192px/512px install icons. You can then relaunch the installed app offline. Save files are local to that browser profile; export a backup from Ledger before clearing browser data.

## Game systems

- 200 connected star systems with seeded generation, 16 fictional civilizations and direct-hyperlane travel.
- Sixteen hand-drawn faction emblems, custom vector command-deck art, stylized planet/system art and ship-class silhouettes.
- Captain XP/perk trees, ranked companions and personal ambitions, contracts, rewards and a five-chapter campaign.
- Ship construction/refits, tactical command-round battles, focus-fire/brace/boarding/retreat, enemy retaliation, disabled hulls and salvage.
- Claimable systems, population growth, stability pressure, construction, policies, seven technologies, treaties and rival expansion.
- Creditor interest with manual debt repayment; the loan has a meaningful economic cost.
- Research-gated orbital devastation with diplomatic consequences, content advisory and reduced graphic descriptions.
- Local save/autosave, JSON export/import with validation, cosmetic prototype currency, install icons and service-worker offline cache.

There are no forced ads, analytics or online gameplay calls. Void Shards are not sold for real money and the Google Play Billing integration is not implemented.

## Automated QA

The gameplay suite checks galaxy generation, story rewards, economy, ships/combat, save import security, PWA assets and the 16 faction crests. The Chromium suite tests 320/360/390/412-pixel phone layouts, tactical combat, recruitment, save/reload, safe/hostile backup import, install manifest and icons, service-worker registration and offline reload. A deployment job runs the Chromium suite against the live HTTPS site.

## Scope

This is a playable vertical slice, not a finished commercial game. Real-device Android QA, late-game balance, deeper AI/event systems, final production art/animation and commercial Android packaging remain outstanding.

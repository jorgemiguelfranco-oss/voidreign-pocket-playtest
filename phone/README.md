# VOIDREIGN: Pocket Empire

Touch-first, offline-first, character-led science-fiction strategy.

## Play locally

Open index.html for a quick offline session. Home-screen installation and offline caching require the app to be served over HTTPS; for Android, use the published project site and Chrome's **Install app / Add to Home screen** option. The first load/update must be online so the service worker can cache the game and artwork.

## Game systems

- 200 connected star systems with deterministic seeds and 16 distinct fictional civilizations.
- Captain XP and perk trees, ranked companions with individual ambitions and rewards, milestones, contracts and a five-chapter Silent Crown story.
- Ship construction and refits, original vector ship silhouettes, command-round tactical combat, retaliation, hull disablement, retreat and salvage.
- Colonization, population and stability pressure, buildings, economy/policies, seven technologies, treaties/diplomacy and rival expansion.
- Creditor interest and player-controlled loan repayment; colony stability reacts to habitability, population, industrial strain and hazards.
- Research-gated orbital devastation with diplomatic, reputation and ongoing sanction consequences; mature-content advisory and reduced descriptions.
- Original command-deck and system/planet vectors, custom 192px/512px PNG Android icons, local save/autosave, JSON export/import validation and offline service-worker cache.
- No forced ads or tracking. Void Shards and cosmetics are a local prototype economy only; Google Play Billing is not implemented.

## QA

The smoke-test file exercises seeded topology, story completion and rewards, player/economy actions, ship refits/combat, debt/colony pressures, save-import security and PWA assets. The browser-test file uses Chromium at 320/360/390/412 CSS-pixel widths and tests the actual mobile UI, saves, safe imports, service worker and offline reload.

## Scope

This is an actively developed playable vertical slice, not a finished commercial game. Physical Android device testing, late-game balance, deeper AI/event systems, ratings review and commercial Android packaging remain outstanding.

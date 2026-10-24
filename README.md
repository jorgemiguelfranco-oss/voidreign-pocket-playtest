# VOIDREIGN: Pocket Empire — Android play-test

A mobile-first, offline-first science-fiction strategy prototype: begin as a debtor-captain with one ship, recruit specialists, explore a 200-system galaxy, build an empire and decide whether to rule through diplomacy or force.

**Status: public play-test build, not a finished commercial release.** There is no Google Play billing, multiplayer backend, ad network or real-money currency purchase. The Void Shard exchange is prototype-only and does not grant combat bonuses.

## Play on Android

1. Open the play-test site in **Chrome for Android** while online.
2. Choose Chrome's menu, then **Install app** or **Add to Home screen**.
3. Launch VOIDREIGN from the new home-screen icon and let the first load finish.
4. Keep the phone online for this first load so the app shell, vector art, manifest and service worker can be cached.
5. Once loaded, disconnect from Wi-Fi/mobile data and relaunch the app to test offline play. Campaign progress is stored locally in that browser profile; export a backup from **Ledger** before clearing browser data or uninstalling.

A later build may not replace the previous installed copy until Chrome refreshes the service worker. Reopen the site online to receive the latest test build.

## What's in this build

- 200 seeded, connected systems and 16 fictional civilizations, with a pan/zoom star chart and direct-hyperlane travel.
- Captain levels and perks, companion progression and personal ambitions, campaign chapters, contracts and milestone rewards.
- Ship construction, modules/refits, tactical command-round combat, enemy retaliation, disabled hulls, retreat and salvage.
- Claimable systems, colonies, population and stability pressure, construction, policy, research, diplomacy/treaties and rival expansion.
- Creditor interest with manual principal repayment; the opening loan is an actual survival pressure.
- Consequential fictional orbital devastation, content advisory and reduced-graphic-description setting.
- Original vector command-deck, planet/system and ship illustrations, 192px and 512px Android icons, local saves and validated JSON backup import.
- No forced ads, no tracking and no network dependency during gameplay. First install/update does need an internet connection.

## Validation

Every push to main runs the automated gameplay suite and a real Chromium mobile/offline suite. The browser checks use 320, 360, 390 and 412 CSS-pixel viewports, exercise tactical combat, companion recruitment, save/reload, hostile and valid backup imports, service-worker registration and offline reload.

## Current limitations

This is an actively developed play-test slice. It still needs physical-device testing on multiple Android phones, deeper late-game AI/economy balance, more event chains and species-specific content, and full commercial-release work. A passing automated suite is not a substitute for testing on your device.

## Feedback

When reporting an issue, include the device model, Android/Chrome version, exact steps, whether you were online/offline and the turn/system where it happened. Export a save if the issue affects your campaign, but remove any personal notes before sharing it.

# VOIDREIGN: Pocket Empire — Android play-test

**Play now:** https://jorgemiguelfranco-oss.github.io/voidreign-pocket-playtest/

A mobile-first, offline-first science-fiction strategy prototype. Start as a debtor-captain with one ship, recruit specialists, explore a 200-system galaxy and build an interstellar empire through trade, diplomacy, research and warfare.

**Status: public play-test build, not a finished commercial release.** There is no Google Play billing, multiplayer backend, ad network or real-money currency purchase. The Void Shard exchange is a local prototype economy and does not grant combat bonuses.

## Install on Android and play offline

1. Open the play-test link above in **Chrome for Android** while online.
2. Open Chrome's menu and choose **Install app** or **Add to Home screen**.
3. Launch VOIDREIGN from the home-screen icon and let the first load finish.
4. Stay online during the first load so the game shell, artwork, manifest and service worker are cached.
5. Relaunch from the icon with Wi-Fi and mobile data disabled to test offline play.

Campaign progress is stored locally in that browser profile. In Ledger, export a backup before clearing browser data or uninstalling. Updates arrive when you open the site online and Chrome refreshes the service worker.

## Playable systems

- 200 seeded, connected star systems and 16 fictional civilizations, with pan/zoom/search chart and direct-hyperlane travel.
- Sixteen bespoke hand-drawn SVG faction crests, star/planet illustrations, angular vessel silhouettes and an original command-deck scene.
- Captain levels/perk trees, ranked companions with individual ambitions and rewards, contracts, milestones and a five-chapter Silent Crown campaign.
- Ship construction and refits, tactical command-round combat, enemy retaliation, disabled hulls, retreat and salvage.
- Claimable systems, colony construction, population growth and stability pressure, economic policies, research technologies, treaties and rival expansion.
- Creditor interest and manual principal repayment; the starting loan creates a real survival choice.
- Consequential fictional orbital devastation, content advisory and reduced-graphic-description setting.
- Local saves, safe JSON backup import/export, 192px/512px Android app icons and offline service-worker caching.

No forced ads, tracking, account or online gameplay service is needed. Internet is required for the first load and updates.

## Validation and release state

The repository runs gameplay/security tests plus real Chromium tests, including all 16 faction crests, 320/360/390/412 CSS-pixel layouts, combat and companion flows, safe and malicious save imports, install manifest/icons, service-worker registration and offline reload. The deployment workflow also re-tests the live HTTPS site.

This is an actively developed vertical slice, not a finished commercial game. Physical Android handset testing, further balancing, deeper late-game AI and event chains, production-grade final art/animation, age-rating review and any signed commercial Android package remain outstanding.

## Feedback

When reporting an issue, include phone model, Android/Chrome version, whether you were online or offline, and steps to reproduce. Export your save if it affects the campaign, and remove any personal notes before sharing it.

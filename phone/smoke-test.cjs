"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const match = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match, "Phone game must include its local script");
let source = match[1];
assert.doesNotThrow(() => new Function(source), "Browser JavaScript must parse");
assert.ok(!source.includes("prompt("), "Travel must use touch-first controls, not prompt()");
assert.ok(!source.includes("confirm("), "Reset must not use browser confirm()");
assert.ok(!/https?:\/\//i.test(source), "Offline game code must not make external requests");

const elements = new Map();
function element(selector) {
  if (!elements.has(selector)) {
    elements.set(selector, {
      textContent: "", innerHTML: "", value: "", style: {}, attributes: {},
      listeners: {},
      classList: { toggle() {} },
      addEventListener(type, callback) { this.listeners[type] = callback; },
      setAttribute(name, value) { this.attributes[name] = String(value); },
      setPointerCapture() {},
      click() {}
    });
  }
  return elements.get(selector);
}
const storage = new Map();
const sandbox = {
  document: {
    querySelector: element,
    querySelectorAll: () => [],
    addEventListener() {},
    createElement: () => ({ click() {}, setAttribute() {} })
  },
  window: { addEventListener() {} },
  localStorage: {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
  },
  console, setTimeout, clearTimeout, Blob, URL,
  FileReader: function () {}
};
const hook = "\nload();\n})();";
assert.ok(source.includes(hook), "Game startup hook should be discoverable for isolated testing");
source = source.replace(hook,
  "\nglobalThis.__voidreignTest={state:()=>s,makeGalaxy,speciesRoster,gainXp,choosePerk,recruitCompanion,dismissCompanion,travel,act,endTurn,renderGalaxyMap,buildBuilding,researchTechnology,setPolicy,refitShip,resolveAIEmpires,addCompanionXp,resolveColonyGrowth,startBattle,resolveBattleMove,purchaseCosmetic,renderShop,COSMETIC_ITEMS,validateImportSave,updateStoryArc,renderStoryArc,factionCrest};\nload();\n})();");
vm.runInNewContext(source, sandbox, { timeout: 10000 });

const game = sandbox.__voidreignTest;
assert.ok(game, "Game should initialise in a minimal browser harness");
const state = game.state();
const galaxy = game.makeGalaxy();
const species = game.speciesRoster;
assert.equal(state.systems.length, 200, "Campaign must have exactly 200 systems");
assert.equal(new Set(state.systems.map(x => x.id)).size, 200, "System IDs must be unique");
assert.equal(new Set(galaxy.map(x => x.name)).size, 200, "System names must be unique");
assert.equal(species.length, 16, "Roster must include 16 species");
assert.equal(new Set(species.map(f => game.factionCrest(f))).size, 16, "Each civilization should have a distinct original SVG crest");
assert.equal((element("#factions").innerHTML.match(/class="faction-crest"/g) || []).length, 16, "Diplomacy should render a crest for every civilization");
assert.equal(new Set([...element("#factions").innerHTML.matchAll(/data-faction="([^"]+)"/g)].map(match => match[1])).size, 16, "Every crest should identify a unique civilization");
assert.equal(game.validateImportSave(state), true, "The current campaign should be safe to export and re-import");
const hostileImport = JSON.parse(JSON.stringify(state));
hostileImport.systems[0].name = '<img src=x onerror="alert(1)">';
assert.equal(game.validateImportSave(hostileImport), false, "Markup-bearing saves must be rejected before render");
const brokenImport = JSON.parse(JSON.stringify(state));
brokenImport.systems[0].lanes = ["sys-999"];
assert.equal(game.validateImportSave(brokenImport), false, "Import must reject missing/invalid hyperlane targets");
const duplicateImport = JSON.parse(JSON.stringify(state));
duplicateImport.systems[1].id = duplicateImport.systems[0].id;
assert.equal(game.validateImportSave(duplicateImport), false, "Import must reject duplicate or out-of-position system IDs");
const badEconomyImport = JSON.parse(JSON.stringify(state));
badEconomyImport.credits = -999;
assert.equal(game.validateImportSave(badEconomyImport), false, "Import must reject impossible negative currencies");
const legitimateNegativeRep = JSON.parse(JSON.stringify(state));
legitimateNegativeRep.rep = -35;
assert.equal(game.validateImportSave(legitimateNegativeRep), true, "Negative reputation from war crimes or retreat must remain importable");
assert.equal(new Set(species.map(x => x.id)).size, 16, "Species IDs must be unique");
assert.deepEqual(JSON.parse(JSON.stringify(galaxy)), JSON.parse(JSON.stringify(game.makeGalaxy())), "Galaxy generation must be deterministic for the fixed seed");

assert.ok(Number.isInteger(state.seed), "Each campaign should persist its generation seed");
assert.equal(new Set(state.systems.map(x => x.name)).size, 200, "The random campaign should not duplicate system names");
for (let seed = 1; seed <= 10; seed++) {
  const generated = game.makeGalaxy(seed);
  assert.equal(generated.length, 200, "Every generated seed must contain exactly 200 systems");
  assert.equal(new Set(generated.map(x => x.name)).size, 200, "Every generated seed must produce unique system names");
  const generatedById = new Map(generated.map(x => [x.id, x]));
  for (const system of generated) {
    for (const neighbour of system.lanes) {
      assert.ok(generatedById.has(neighbour), "Generated hyperlane must reference an existing system");
      assert.ok(generatedById.get(neighbour).lanes.includes(system.id), "Generated hyperlane must be reciprocal for every seed");
    }
  }
  const reachable = new Set([generated[0].id]);
  const pending = [generated[0].id];
  while (pending.length) {
    for (const neighbour of generatedById.get(pending.shift()).lanes) {
      if (!reachable.has(neighbour)) { reachable.add(neighbour); pending.push(neighbour); }
    }
  }
  assert.equal(reachable.size, 200, "Every generated seed must remain fully connected");
}

const byId = new Map(state.systems.map(x => [x.id, x]));
const seen = new Set([state.system]);
const queue = [state.system];
let directedEdges = 0;
while (queue.length) {
  const id = queue.shift();
  for (const next of byId.get(id).lanes) {
    directedEdges++;
    assert.ok(byId.has(next), "Every lane target must exist");
    assert.ok(byId.get(next).lanes.includes(id), "Every hyperlane must be bidirectional");
    if (!seen.has(next)) { seen.add(next); queue.push(next); }
  }
}
assert.equal(seen.size, 200, "All 200 systems must be connected by hyperlanes");
assert.ok(element("#galaxy-svg").innerHTML.includes('data-map-system="sys-017"'), "The complete star chart should be rendered");
assert.ok(element("#galaxy-svg").innerHTML.length > 30000, "The star chart should contain a meaningful lane network");
assert.ok(element("#galaxy-svg").attributes.viewBox, "The chart should initialise its view box");
assert.ok(element(".galaxy-map").listeners.pointerdown && element(".galaxy-map").listeners.pointermove, "The chart must support touch/mouse drag-to-pan");

assert.equal(state.voidShards, 0, "New campaigns should start with no premium currency");
assert.equal(state.cosmetics.length, 0, "New campaigns should start without purchased cosmetics");
assert.ok(game.COSMETIC_ITEMS.length >= 3, "The exchange should offer a small fixed cosmetic catalogue");
state.voidShards = 25;
game.purchaseCosmetic("aurora-hull");
assert.ok(state.cosmetics.includes("aurora-hull"), "Cosmetic purchase should unlock the item");
assert.equal(state.equippedCosmetic, "aurora-hull", "Newly unlocked cosmetic should be equipped");
assert.equal(state.voidShards, 15, "Cosmetic purchase should deduct its exact shard price");
game.purchaseCosmetic("aurora-hull");
assert.equal(state.voidShards, 15, "Equipping an owned cosmetic should not charge again");
state.voidShards = 0;
game.purchaseCosmetic("imperial-sigil");
assert.ok(!state.cosmetics.includes("imperial-sigil"), "Insufficient premium currency must reject a cosmetic unlock");
assert.ok(element("#cosmetic-shop").innerHTML.includes("Void Shards"), "Exchange should render the currency and cosmetic prices");
assert.ok(html.includes('data-tab="shop"'), "The exchange should be reachable from the main tabs");
assert.ok(html.includes("Real-money top-ups are not enabled"), "The UI must not imply billing is implemented before Play Billing is integrated");

const initialLevel = state.level;
game.gainXp(50, "exploration");
assert.equal(state.level, initialLevel + 1, "Threshold XP must trigger a level-up");
assert.equal(state.perkPoints, 1, "A level-up must grant one perk point");
game.choosePerk("vanguard");
assert.equal(state.perks.vanguard, 1, "Perk choice must persist to campaign state");
assert.equal(state.perkPoints, 0, "Choosing a perk must spend one point");

const creditsBeforeHire = state.credits;
game.recruitCompanion("mara");
assert.equal(state.companions.length, 1, "Recruitment should add a companion");
assert.ok(state.credits < creditsBeforeHire, "Recruitment should charge its hire cost");
assert.ok(state.companions[0].loyalty >= 0, "Companions should have loyalty state");
const companionRankBefore = state.companions[0].rank;
game.addCompanionXp(state.companions[0], 30, state.companions[0].skill);
assert.ok(state.companions[0].rank > companionRankBefore, "Companions should level through their own experience");
assert.ok(state.companions[0].ambition && state.companions[0].ambition.complete, "Matching companion experience should complete the personal ambition");
assert.ok(state.log.some(line => line.includes("personal ambition")), "Ambition completion should be recorded in the campaign log");
assert.ok(element("#party").innerHTML.includes("Personal ambition"), "The retinue UI should display individual companion ambitions");
assert.ok(state.flags.milestones.crew, "Recruiting a companion should complete the retinue milestone");
game.dismissCompanion("mara");
assert.equal(state.companions.length, 0, "The player must be able to dismiss a companion");
game.recruitCompanion("mara");

const positionBefore = state.system;
const invalidTarget = state.systems.find(x => !byId.get(positionBefore).lanes.includes(x.id));
game.travel(invalidTarget.id);
assert.equal(state.system, positionBefore, "Travel must reject non-adjacent systems");
const next = byId.get(positionBefore).lanes[0];
game.travel(next);
assert.equal(state.system, next, "Travel along a hyperlane must work");

const colony = state.systems.find(x => x.id === "sys-020");
colony.owner = null;
colony.habit = 90;
state.system = colony.id;
state.credits = 100;
game.act("claim");
assert.equal(colony.owner, "you", "Claiming an eligible unowned system should create an outpost");
const populationBeforeGrowth = colony.population;
colony.population = 5;
colony.habit = 90;
colony.stability = 70;
state.turn = 3;
game.resolveColonyGrowth([colony]);
assert.ok(colony.population >= populationBeforeGrowth + 2 || colony.population >= 7, "A stable habitable colony should grow population");
state.turn = 1;

const home = state.systems.find(x => x.id === "sys-017");
state.system = home.id;
state.credits = 1000;
state.minerals = 500;
const previousTradeHub = home.buildings.trade || 0;
game.buildBuilding(home.id, "trade");
assert.equal(home.buildings.trade, previousTradeHub + 1, "Colony construction should upgrade a trade hub");

state.science = 300;
game.researchTechnology("naval_gunnery");
assert.equal(state.techs.naval_gunnery, true, "Research should unlock a technology");
assert.equal(state.science, 255, "Research should deduct its science cost");
game.setPolicy("research");
assert.equal(state.policy, "research", "Government policy should persist");
assert.ok(state.flags.milestones.research, "First technology should complete a research milestone");

game.act("build-scout");
const scout = state.ships.find(ship => ship.type === "Scout");
assert.ok(scout && Number.isFinite(scout.maxHp), "Shipyard must build a valid scout");
const attackBeforeRefit = scout.attack;
game.refitShip(scout.id, "weapon");
assert.equal(scout.attack, attackBeforeRefit + 2, "Weapon module must increase ship attack");
assert.equal(scout.modules.weapon, 1, "Ship module level must persist");

game.gainXp(55, "command");
assert.ok(state.level >= 3, "Repeated XP should continue levelling");

// Tactical encounters must resolve one command per round and reward victory.
game.startBattle();
assert.ok(state.battle && state.battle.active, "A tactical encounter should start from the Fleet tab");
assert.ok(element("#battle-panel").innerHTML.includes('data-battle-move="brace"'), "Combat bridge should render tactical commands");
state.battle.enemy.hp = 999;
state.battle.enemy.maxHp = 999;
state.battle.enemy.attack = 1;
const fleetHpBeforeBrace = state.ships.reduce((sum, ship) => sum + ship.hp, 0);
game.resolveBattleMove("brace");
assert.ok(state.battle.active && state.battle.round === 2, "A tactical command should advance the round");
assert.ok(state.ships.reduce((sum, ship) => sum + ship.hp, 0) < fleetHpBeforeBrace, "Enemy retaliation should damage the fleet");
game.resolveBattleMove("retreat");
assert.ok(!state.battle.active && state.battle.retreated, "Retreat should end combat without salvage");
game.startBattle();
state.battle.enemy.hp = 1;
const creditsBeforeSalvage = state.credits;
game.resolveBattleMove("focus");
assert.ok(!state.battle.active && state.battle.won, "Focused fire should finish a weakened enemy");
assert.ok(state.credits > creditsBeforeSalvage, "Victory should award salvage");

const victim = state.systems.find(x => x.owner && x.owner !== "you");
state.system = victim.id;
state.techs.orbital_annihilator = true;
state.credits = 1000;
state.minerals = 500;
const reputationBeforeStrike = state.rep;
game.act("cataclysm");
assert.equal(state.flags.strikePending, victim.id, "Cataclysm must require a separate confirmation tap");
game.act("cataclysm");
assert.equal(victim.owner, null, "Orbital strike must remove the victim from control");
assert.equal(victim.population, 0, "Orbital strike must destroy the population");
assert.equal(victim.habit, 0, "Orbital strike must leave an uninhabitable ruin");
assert.equal(state.flags.atrocityCount, 1, "Atrocity count must persist");
assert.equal(state.treaties.length, 0, "An atrocity must break existing treaties");
assert.equal(state.rep, reputationBeforeStrike - 35, "An atrocity must carry a reputation penalty");

const reducedBefore = state.flags.reducedGore;
game.act("toggle-gore");
assert.equal(state.flags.reducedGore, !reducedBefore, "Mature description setting should toggle");
game.act("ack-warning");
assert.equal(state.flags.contentWarningSeen, true, "Content advisory should be acknowledgeable");

// Force a deterministic unclaimed frontier node next to one selected NPC faction.
const aiFaction = species[2];
const aiBase = state.systems.find(x => x.owner === aiFaction.id);
assert.ok(aiBase, "AI faction should have a home or owned system");
for (const node of state.systems) if (node.owner === null) node.habit = 10;
const aiTarget = state.systems.find(x => aiBase.lanes.includes(x.id) && x.id !== victim.id && x.owner !== "you");
assert.ok(aiTarget, "AI faction should have a neighbour available to contest");
aiTarget.owner = null; aiTarget.ownerSpeciesId = null; aiTarget.habit = 100; aiTarget.wealth = 100; aiTarget.minerals = 100;
state.turn = 2;
game.resolveAIEmpires();
assert.equal(aiTarget.owner, aiFaction.id, "Faction turn should claim a suitable adjacent system");
state.turn = 1;
game.endTurn();
assert.equal(state.turn, 2, "End-turn should advance campaign time");
assert.ok(storage.has("voidreign-pocket-v2"), "Campaign state should autosave locally");
game.endTurn();
assert.equal(state.turn, 3, "Second end-turn should keep progressing");
assert.ok(state.log.some(line => line.includes("Coalition sanctions")), "Atrocity should trigger recurring sanctions");
assert.ok(state.log.some(line => line.includes("Creditor interest")), "End-turn should charge explicit creditor interest");
assert.ok(state.debt >= 0, "Debt principal must never become negative");
const repBeforePayoff = state.rep;
state.debt = 30;
state.credits = 50;
game.act("repay-debt");
assert.equal(state.debt, 5, "Repayment should reduce principal by up to 25 credits");
assert.equal(state.credits, 25, "Repayment should charge credits once");
game.act("repay-debt");
assert.equal(state.debt, 0, "A final principal payment should clear debt exactly");
assert.equal(state.credits, 20, "Final repayment should only deduct the remaining principal");
assert.equal(state.rep, Math.min(100, repBeforePayoff + 5), "Clearing debt should reward reputation");
const stressedColony = {id:"stress-world",name:"Stress World",habit:90,danger:90,population:60,stability:55,buildings:{mine:3,trade:0,lab:0,defense:0}};
state.turn = 3;
game.resolveColonyGrowth([stressedColony]);
assert.ok(stressedColony.stability < 55, "Overcrowding, intensive extraction and danger should create stability pressure");
state.turn = 1;
assert.ok(!source.includes("prompt(") && !source.includes("confirm(") && !source.includes("alert("), "No browser-native modal blockers");
assert.ok(source.includes("function validateImportSave(v)"), "Import must validate campaign data at the trust boundary");
assert.ok(source.includes("5 MB safety limit"), "Import must cap backup size");
assert.ok(source.includes("Your current campaign was kept."), "A failed import must preserve the existing campaign");
assert.ok(source.includes("function renderPlanetArt(system)"), "Systems should use an original vector planet illustration");
assert.ok(source.includes("function factionCrest(f)"), "Every civilization should have a hand-authored emblem");
assert.ok(source.includes("Creditor interest"), "Debt should charge interest rather than forgiving principal automatically");
assert.ok(source.includes("case'repay-debt':"), "The player should be able to repay principal manually");
assert.ok(source.includes("Environmental stress"), "Colony habitability and industrial strain should affect stability");
assert.ok(source.includes("function shipIllustration(type)"), "Ships should use original vector silhouettes");
assert.ok(html.includes("command-deck") && html.includes("command-bridge.svg"), "The campaign should have a bespoke command-deck illustration");
assert.ok(html.includes("STORY_CHAPTERS") && html.includes("campaign-chronicle"), "The campaign should show a multi-chapter story arc");
assert.ok(html.includes("faction-sigil") && (html.match(/id:"[a-z]+",color:"#/g) || []).length === 16, "All species should have distinct colours and sigils");
assert.ok(html.includes('id="battle-panel"') && html.includes("TACTICAL CONTACT"), "Fleet UI should include the tactical battle bridge");
assert.ok(html.includes("Personal ambition"), "Companion UI should explain personal ambitions");
assert.ok(html.includes('rel="manifest"') && html.includes('register("./sw.js")'), "Installable/offline PWA integration should be present");
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "manifest.webmanifest"), "utf8"));
assert.equal(manifest.name, "VOIDREIGN: Pocket Empire", "PWA manifest should use the game name");
const sw = fs.readFileSync(path.join(__dirname, "sw.js"), "utf8");
assert.doesNotThrow(() => new Function(sw), "Service worker JavaScript should parse");
assert.ok(sw.includes("./cover.svg") && sw.includes("./icon.svg"), "Offline cache should include both original SVG art assets");
const coverSvg = fs.readFileSync(path.join(__dirname, "cover.svg"), "utf8");
const iconSvg = fs.readFileSync(path.join(__dirname, "icon.svg"), "utf8");
assert.ok(coverSvg.trim().startsWith("<svg") && coverSvg.trim().endsWith("</svg>"), "Cinematic cover must be a complete SVG document");
assert.ok(coverSvg.includes('id="planet"'), "Cinematic cover should include the ringed-planet artwork layer");
assert.ok(iconSvg.trim().startsWith("<svg") && iconSvg.trim().endsWith("</svg>"), "Application icon must be a complete SVG document");
const manifestIcons = manifest.icons || [];
assert.ok(manifestIcons.some(icon => icon.src === "./icon.svg" && icon.sizes === "any"), "Manifest must reference the scalable vector icon");
assert.ok(manifestIcons.some(icon => icon.src === "./icon-192.png" && icon.sizes === "192x192"), "Manifest must provide the 192px Android install icon");
assert.ok(manifestIcons.some(icon => icon.src === "./icon-512.png" && icon.sizes === "512x512"), "Manifest must provide the 512px Android install icon");
for (const [name, size] of [["icon-192.png", 192], ["icon-512.png", 512]]) {
  const png = fs.readFileSync(path.join(__dirname, name));
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", name + " should be a valid PNG file");
  assert.equal(png.readUInt32BE(16), size, name + " should have the declared width");
  assert.equal(png.readUInt32BE(20), size, name + " should have the declared height");
  assert.ok(sw.includes("./" + name), name + " should be cached for offline use");
}
const deployWorkflow = fs.readFileSync(path.join(__dirname, "..", ".github", "workflows", "deploy-pocket-empire.yml"), "utf8");
assert.ok(deployWorkflow.includes("actions/upload-pages-artifact") && deployWorkflow.includes("actions/deploy-pages"), "Static PWA Pages deployment workflow should package and publish the phone directory");
assert.ok(sw.includes("voidreign-pocket-empire-v6"), "Offline cache version should be bumped for Android install icon assets");
assert.ok(sw.includes("./command-bridge.svg"), "Offline cache should include the bespoke command-deck artwork");
const bridgeSvg = fs.readFileSync(path.join(__dirname, "command-bridge.svg"), "utf8");
assert.ok(bridgeSvg.trim().startsWith("<svg") && bridgeSvg.trim().endsWith("</svg>"), "Command-deck artwork must be a complete SVG document");

// Exercise the whole story arc without relying on random play order.
state.flags.storyStage = 0;
delete state.flags.storyComplete;
state.visited = [state.system];
state.companions = [];
state.ships = state.ships.slice(0, 1);
game.updateStoryArc();
assert.equal(state.flags.storyStage, 0, "The opening chapter should wait for five distinct visits");
state.visited = [...new Set([state.system, ...state.systems.map(x => x.id).filter(id => id !== state.system).slice(0, 4)])];
const shardBalanceBeforeStory = state.voidShards;
game.updateStoryArc();
assert.equal(state.flags.storyStage, 1, "Surveying five systems should unlock the retinue chapter");
assert.equal(state.voidShards, shardBalanceBeforeStory + 5, "First chapter should grant its Void Shard reward");
state.credits = 500;
game.recruitCompanion("mara");
game.act("build-scout");
game.updateStoryArc();
assert.equal(state.flags.storyStage, 2, "A companion and a second ship should unlock the frontier chapter");
state.systems.slice(0, 3).forEach(x => { x.owner = "you"; x.ownerSpeciesId = null; });
state.techs.naval_gunnery = true;
game.updateStoryArc();
assert.equal(state.flags.storyStage, 3, "Three controlled systems plus one technology should unlock the compact chapter");
state.treaties = ["solari", "vel"];
state.level = 5;
game.updateStoryArc();
assert.equal(state.flags.storyStage, 4, "Two treaties and captain level five should unlock ascension");
state.systems.slice(0, 10).forEach(x => { x.owner = "you"; x.ownerSpeciesId = null; });
state.techs = {deep_survey:true,industrial_automation:true,reinforced_hulls:true,naval_gunnery:true,diplomatic_corps:true};
while (state.ships.length < 4) state.ships.push({id:state.nextShip++,name:"Test hull "+state.nextShip,type:"Scout",hp:14,maxHp:14,attack:3,cargo:5,modules:{weapon:0,armor:0,shields:0,sensors:0,cargo:0}});
state.treaties = ["solari","vel","khepri"];
state.level = 10;
game.updateStoryArc();
assert.equal(state.flags.storyStage, 5, "Meeting all strategic requirements should complete the five-chapter story");
assert.equal(state.flags.storyComplete, true, "Campaign completion should be saved");
game.renderStoryArc();
assert.ok(element("#story-chapters").innerHTML.includes("THE CROWN IS YOURS"), "Completed story should render an epilogue");
console.log("PASS: galaxy count/topology/chart, story arc and rewards, vector command/ship/planet art, level-up/perks, companions, tactical combat, empire systems, import safety and offline assets.");

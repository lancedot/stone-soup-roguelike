import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { newGame, movePlayer, useItem, useSkill, waitTurn } from '../src/game/engine.js';
import { isWalkable } from '../src/game/map.js';
import { CLASSES, ENEMY_TYPES, ITEM_TYPES } from '../src/game/data.js';
import { sprites } from '../src/sprites.js';

test('new game places player on a walkable tile and spawns content with sprites', () => {
  const state = newGame('fighter', 1234);
  assert.equal(state.status, 'playing');
  assert.equal(isWalkable(state.map, state.player.x, state.player.y), true);
  assert.ok(state.enemies.length > 0);
  assert.ok(state.items.length > 0);
  assert.ok(state.enemies.every((e) => e.sprite));
  assert.ok(state.items.every((i) => i.sprite));
});

test('all classes enemies and items declare sprite ids', () => {
  for (const cls of Object.values(CLASSES)) assert.ok(cls.sprite, cls.name);
  for (const enemy of ENEMY_TYPES) assert.ok(enemy.sprite, enemy.name);
  for (const item of ITEM_TYPES) assert.ok(item.sprite, item.name);
});

test('four bread-squad classes exist and every class declares a distinctive skill', () => {
  assert.deepEqual(Object.keys(CLASSES).sort(), ['breadKnight', 'butterArcher', 'hamWarrior', 'lettucePriest']);
  assert.deepEqual(Object.values(CLASSES).map((c) => c.name), ['面包骑士', '黄油射手', '火腿战士', '生菜牧师']);
  const skillIds = new Set();
  for (const cls of Object.values(CLASSES)) {
    assert.ok(cls.skill?.id, `${cls.name} should have skill id`);
    assert.ok(cls.skill?.name, `${cls.name} should have skill name`);
    assert.ok(cls.skill?.desc, `${cls.name} should have skill desc`);
    assert.ok(cls.skill?.cooldown > 0, `${cls.name} should have cooldown`);
    skillIds.add(cls.skill.id);
  }
  assert.equal(skillIds.size, 4);
});

test('bread-squad classes initialize with themed sprites and skills', () => {
  const knight = newGame('breadKnight', 100);
  assert.equal(knight.player.classId, 'breadKnight');
  assert.equal(knight.player.sprite, 'hero_bread_knight');
  assert.equal(knight.player.skill.id, 'baguette_lance');
  const priest = newGame('lettucePriest', 101);
  assert.equal(priest.player.classId, 'lettucePriest');
  assert.equal(priest.player.sprite, 'hero_lettuce_priest');
  assert.equal(priest.player.skill.id, 'leaf_prayer');
});

test('using healing item cannot exceed max hp', () => {
  const state = newGame('breadKnight', 44);
  state.player.hp = 3;
  state.enemies = [];
  state.player.inventory = [{ id: 'warm_milk', name: '热牛奶', kind: 'heal', amount: 999, sprite: 'item_warm_milk', desc: '回复生命，帮助你假装还能睡。' }];
  useItem(state, 0);
  assert.equal(state.player.hp, state.player.maxHp);
  assert.equal(state.player.inventory.length, 0);
});

test('floor loot keeps scrolls rare and does not flood early game with ham slices', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const state = newGame('breadKnight', seed);
    const scrolls = state.items.filter((i) => i.kind === 'scroll');
    assert.ok(scrolls.length <= 1, `seed ${seed} spawned too many scrolls`);
    assert.equal(state.items.some((i) => i.id === 'ham_slice'), false, `seed ${seed} spawned early ham slice`);
  }
});

test('moving into adjacent enemy attacks it', () => {
  const state = newGame('breadKnight', 55);
  state.enemies = [{ id: 'nightmare_rat', name: '测试梦魇鼠', hp: 8, maxHp: 8, attack: 0, defense: 0, xp: 1, sprite: 'enemy_nightmare_rat', x: state.player.x + 1, y: state.player.y }];
  state.items = [];
  movePlayer(state, 1, 0);
  assert.ok(state.enemies.length === 0 || state.enemies[0].hp < 8);
});

test('bread knight skill damages adjacent enemy and starts cooldown', () => {
  const state = newGame('breadKnight', 200);
  state.enemies = [{ id: 'nightmare_rat', name: '测试梦魇鼠', hp: 30, maxHp: 30, attack: 5, defense: 0, xp: 1, sprite: 'enemy_nightmare_rat', x: state.player.x + 1, y: state.player.y }];
  state.items = [];
  const beforeHp = state.player.hp;
  useSkill(state);
  assert.ok(state.enemies[0].hp < 30);
  assert.ok(state.player.skill.remaining > 0);
  assert.ok(state.player.effects.some((e) => e.id === 'guard'));
  assert.ok(state.player.hp < beforeHp, 'successful skill should consume an enemy turn');
});

test('failed ready skill does not spend a turn or let enemies move', () => {
  const state = newGame('breadKnight', 207);
  state.items = [];
  state.enemies = [{ id: 'nightmare_rat', name: '测试梦魇鼠', hp: 8, maxHp: 8, attack: 3, defense: 0, xp: 1, sprite: 'enemy_nightmare_rat', x: state.player.x + 2, y: state.player.y }];
  const before = {
    enemyX: state.enemies[0].x,
    enemyY: state.enemies[0].y,
    playerHp: state.player.hp,
  };
  useSkill(state);
  assert.equal(state.enemies[0].x, before.enemyX);
  assert.equal(state.enemies[0].y, before.enemyY);
  assert.equal(state.player.hp, before.playerHp);
  assert.equal(state.player.skill.remaining, 0);
});

test('lettuce priest skill restores hp without exceeding max hp', () => {
  const state = newGame('lettucePriest', 201);
  state.enemies = [];
  state.player.hp = state.player.maxHp - 2;
  useSkill(state);
  assert.equal(state.player.hp, state.player.maxHp);
  assert.ok(state.player.skill.remaining > 0);
});

test('butter archer skill hits enemies at range and moves to a nearby open tile', () => {
  const state = newGame('butterArcher', 202);
  const start = { x: state.player.x, y: state.player.y };
  state.enemies = [{ id: 'hall_spirit', name: '走廊巡夜灵', hp: 28, maxHp: 28, attack: 0, defense: 0, xp: 1, sprite: 'enemy_hall_spirit', x: state.player.x + 4, y: state.player.y }];
  state.items = [];
  useSkill(state);
  assert.ok(state.enemies[0].hp < 28);
  assert.notDeepEqual({ x: state.player.x, y: state.player.y }, start);
  assert.ok(state.player.skill.remaining > 0);
});

test('ham warrior skill cleaves adjacent enemies and grants a brief guard', () => {
  const state = newGame('hamWarrior', 303);
  state.enemies = [];
  state.items = [];
  state.enemies.push({ id: 'canteen_beetle', name: '食堂甲虫', hp: 22, maxHp: 22, attack: 0, defense: 0, xp: 1, sprite: 'enemy_canteen_beetle', x: state.player.x + 1, y: state.player.y });
  state.enemies.push({ id: 'hall_spirit', name: '走廊巡夜灵', hp: 22, maxHp: 22, attack: 0, defense: 0, xp: 1, sprite: 'enemy_hall_spirit', x: state.player.x, y: state.player.y + 1 });
  useSkill(state);
  assert.ok(state.enemies.every((e) => e.hp < 22));
  assert.ok(state.player.effects.some((e) => e.id === 'sizzle_guard'));
});

test('wait turn lets enemies act and reduces skill cooldown', () => {
  const state = newGame('breadKnight', 304);
  state.enemies = [{ id: 'nightmare_rat', name: '测试梦魇鼠', hp: 8, maxHp: 8, attack: 3, defense: 0, xp: 1, sprite: 'enemy_nightmare_rat', x: state.player.x + 1, y: state.player.y }];
  state.items = [];
  state.player.skill.remaining = 2;
  const beforeHp = state.player.hp;
  waitTurn(state);
  assert.ok(state.player.hp < beforeHp);
  assert.equal(state.player.skill.remaining, 1);
});

test('the final boss on depth four grants victory when defeated', () => {
  const state = newGame('breadKnight', 305);
  state.depth = 4;
  state.enemies = [{ id: 'insomnia_lord', name: '失眠魔王', hp: 1, maxHp: 1, attack: 0, defense: 0, xp: 50, sprite: 'enemy_insomnia_lord', x: state.player.x + 1, y: state.player.y }];
  state.items = [];
  movePlayer(state, 1, 0);
  assert.equal(state.status, 'won');
});

test('using item is instant and does not trigger enemy turn or cooldown tick', () => {
  const state = newGame('breadKnight', 306);
  state.enemies = [{ id: 'nightmare_rat', name: '测试梦魇鼠', hp: 8, maxHp: 8, attack: 3, defense: 0, xp: 1, sprite: 'enemy_nightmare_rat', x: state.player.x + 1, y: state.player.y }];
  state.player.hp = 5;
  state.player.skill.remaining = 2;
  state.player.inventory = [{ id: 'warm_milk', name: '热牛奶', kind: 'heal', amount: 12, sprite: 'item_warm_milk', desc: '回复生命。' }];
  useItem(state, 0);
  assert.equal(state.player.hp, 17);
  assert.equal(state.player.skill.remaining, 2);
});

test('all usable items have short player-facing descriptions', () => {
  for (const item of ITEM_TYPES) {
    assert.ok(item.desc, `${item.name} should explain itself`);
    assert.ok(item.desc.length <= 28, `${item.name} desc should stay short`);
  }
});

test('character and enemy sprites declare four-direction animation sheets', () => {
  const animatedIds = [
    ...Object.values(CLASSES).map((c) => c.sprite),
    ...ENEMY_TYPES.filter((e) => !e.boss).map((e) => e.sprite),
  ];
  for (const id of animatedIds) {
    assert.equal(sprites[id]?.kind, 'sheet', `${id} should use a sprite sheet`);
    assert.equal(sprites[id]?.cols, 4);
    assert.equal(sprites[id]?.rows, 4);
    assert.ok(sprites[id]?.src.endsWith('_sheet.png'));
  }
});

test('four classes have rough victory CG assets and skill FX sheets', () => {
  const cgIds = Object.values(CLASSES).map((c) => c.victoryCg);
  assert.deepEqual(cgIds.sort(), ['cg_bread_knight', 'cg_butter_archer', 'cg_ham_warrior', 'cg_lettuce_priest']);
  for (const id of cgIds) assert.ok(sprites[id], `${id} should exist`);
  for (const cls of Object.values(CLASSES)) {
    assert.ok(cls.skill.fx, `${cls.name} should name a skill fx`);
    assert.equal(sprites[cls.skill.fx]?.kind, 'sheet');
  }
});

test('successful skills create visible FX while failed skills do not', () => {
  const success = newGame('breadKnight', 501);
  success.enemies = [{ id: 'nightmare_rat', name: '测试梦魇鼠', hp: 30, maxHp: 30, attack: 0, defense: 0, xp: 1, sprite: 'enemy_nightmare_rat', x: success.player.x + 1, y: success.player.y }];
  useSkill(success);
  assert.equal(success.fx.length, 1);
  assert.equal(success.fx[0].sprite, 'fx_baguette_lance');

  const fail = newGame('breadKnight', 502);
  fail.enemies = [{ id: 'nightmare_rat', name: '测试梦魇鼠', hp: 30, maxHp: 30, attack: 0, defense: 0, xp: 1, sprite: 'enemy_nightmare_rat', x: fail.player.x + 3, y: fail.player.y }];
  useSkill(fail);
  assert.equal(fail.fx.length, 0);
});

test('UI can render sheet previews and class victory CGs', () => {
  const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(source, /SpritePreview/);
  assert.match(source, /VictoryArt/);
  assert.match(source, /victoryCg/);
});

test('UI exposes side instructions and inventory descriptions', () => {
  const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(source, /操作说明/);
  assert.match(source, /item\.desc/);
  assert.match(source, /面包小队/);
});

test('R key returns to class select menu instead of immediately rerolling current dungeon', () => {
  const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(source, /const\s+returnToMenu\s*=\s*\(\)\s*=>\s*\{/);
  assert.match(source, /setStarted\(false\)/);
  assert.doesNotMatch(source, /k\s*===\s*['"]r['"]\)\s*restart\(classId\)/);
  assert.match(source, /k\s*===\s*['"]r['"][\s\S]*?returnToMenu\(\)/);
});

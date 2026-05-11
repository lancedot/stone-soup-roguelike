import { CLASSES, ENEMY_TYPES, ITEM_TYPES, MAX_LOG, TILES } from './data.js';
import { makeMap, isWalkable, randomFloor } from './map.js';
import { distance, key, RNG } from './utils.js';

const MAX_HEAL_ITEMS_PER_FLOOR = 1;
const MAX_STACKED_CONSUMABLES = 2;

export function newGame(classId = 'fighter', seed = Date.now()) {
  const rng = new RNG(seed);
  const cls = CLASSES[classId] ?? CLASSES.breadKnight;
  const state = {
    rng,
    seed,
    status: 'playing',
    depth: 1,
    player: {
      x: 0,
      y: 0,
      classId: cls.id,
      name: cls.name,
      sprite: cls.sprite,
      dir: 'down',
      maxHp: cls.hp,
      hp: cls.hp,
      attack: cls.attack,
      defense: cls.defense,
      xp: 0,
      level: 1,
      inventory: [],
      skill: { ...cls.skill, remaining: 0 },
      effects: [],
    },
    map: null,
    enemies: [],
    items: [],
    summons: [],
    fx: [],
    log: [],
  };
  enterDepth(state, 1);
  addLog(state, `你作为${cls.name}踏入安眠圣域。凌晨两点的远征开始了。`);
  return state;
}

export function enterDepth(state, depth) {
  state.depth = depth;
  state.map = makeMap(state.rng, depth);
  state.player.x = state.map.start.x;
  state.player.y = state.map.start.y;
  state.enemies = [];
  state.items = [];
  state.summons = [];
  populate(state);
}

function populate(state) {
  const occupied = new Set([key(state.player.x, state.player.y)]);
  const enemyCount = state.depth >= 4 ? 3 : 5 + state.depth;
  for (let i = 0; i < enemyCount; i++) {
    const options = ENEMY_TYPES.filter((e) => !e.boss && e.depth <= state.depth + 1);
    const base = state.rng.pick(options);
    const pos = randomFloor(state.map, state.rng, occupied);
    occupied.add(key(pos.x, pos.y));
    state.enemies.push({ ...base, x: pos.x, y: pos.y, hp: base.hp + state.depth * 2, maxHp: base.hp + state.depth * 2 });
  }
  if (state.depth >= 4) {
    const boss = ENEMY_TYPES.find((e) => e.boss);
    const room = state.map.rooms[state.map.rooms.length - 1];
    state.enemies.push({ ...boss, x: room.cx, y: room.cy, hp: boss.hp, maxHp: boss.hp });
    occupied.add(key(room.cx, room.cy));
  }
  const itemCount = state.depth >= 4 ? 2 : 3 + Math.floor(state.depth / 2);
  const itemCounts = {};
  for (let i = 0; i < itemCount; i++) {
    const base = pickItemForDepth(state, itemCounts);
    itemCounts[base.id] = (itemCounts[base.id] ?? 0) + 1;
    const pos = randomFloor(state.map, state.rng, occupied);
    occupied.add(key(pos.x, pos.y));
    state.items.push({ ...base, x: pos.x, y: pos.y, uid: `${base.id}-${state.depth}-${i}-${state.rng.int(1, 9999)}` });
  }
}

export function movePlayer(state, dx, dy) {
  if (state.status !== 'playing') return state;
  state.fx = [];
  const nx = state.player.x + dx;
  const ny = state.player.y + dy;
  state.player.dir = dirFromDelta(dx, dy);
  const enemy = state.enemies.find((e) => e.x === nx && e.y === ny);
  const summon = state.summons.find((s) => s.x === nx && s.y === ny);
  if (enemy) {
    attack(state, state.player, enemy);
    if (enemy.hp <= 0) killEnemy(state, enemy);
  } else if (summon) {
    summon.x = state.player.x;
    summon.y = state.player.y;
    state.player.x = nx;
    state.player.y = ny;
    addLog(state, `你和${summon.name}交换了位置。`);
  } else if (isWalkable(state.map, nx, ny)) {
    state.player.x = nx;
    state.player.y = ny;
    pickUpAtPlayer(state);
    if (state.map.tiles[ny][nx] === TILES.stairs) {
      enterDepth(state, state.depth + 1);
      addLog(state, `你沿楼梯来到第 ${state.depth} 层。`);
      return state;
    }
  } else {
    addLog(state, '你撞上了冰冷的石墙。');
    return state;
  }
  finishPlayerTurn(state);
  return state;
}

function attack(state, attacker, defender) {
  const crit = attacker.classId === 'butterArcher' && state.rng.next() < 0.18;
  const raw = attacker.attack + state.rng.int(0, 3) + (crit ? 5 : 0);
  const reduction = defender === state.player ? activeDamageReduction(state.player) : 0;
  const dmg = Math.max(1, raw - (defender.defense ?? 0) - reduction);
  defender.hp -= dmg;
  addLog(state, `${attacker.name ?? '怪物'}攻击${defender.name}造成 ${dmg} 点伤害${crit ? '（暴击）' : ''}。`);
}

function activeDamageReduction(player) {
  return player.effects.reduce((sum, e) => sum + (e.damageReduction ?? 0), 0);
}

function temporaryDefense(player) {
  return player.effects.reduce((sum, e) => sum + (e.defenseBonus ?? 0), 0);
}

function killEnemy(state, enemy) {
  state.enemies = state.enemies.filter((e) => e !== enemy);
  state.player.xp += enemy.xp;
  addLog(state, `${enemy.name}倒下了。获得 ${enemy.xp} 经验。`);
  const need = state.player.level * 18;
  if (state.player.xp >= need) {
    state.player.xp -= need;
    state.player.level += 1;
    state.player.maxHp += 5;
    state.player.hp = state.player.maxHp;
    state.player.attack += 1;
    addLog(state, `升级！你达到 ${state.player.level} 级，生命回满。`);
  }
  if (enemy.id === 'insomnia_lord' && state.depth >= 4) {
    state.status = 'won';
    addLog(state, '失眠魔王碎成一地闹钟。你们夺回了安眠圣杯！');
  }
}

function pickUpAtPlayer(state) {
  const idx = state.items.findIndex((i) => i.x === state.player.x && i.y === state.player.y);
  if (idx >= 0) {
    const [item] = state.items.splice(idx, 1);
    if (state.player.inventory.length < 8) {
      if (isConsumable(item) && carriedCount(state, item.id) >= MAX_STACKED_CONSUMABLES) {
        addLog(state, `${item.name}已经带够了，先留在原地。`);
        state.items.push(item);
        return;
      }
      state.player.inventory.push(item);
      addLog(state, `捡起：${item.name}。`);
    } else {
      addLog(state, '背包满了，物品留在原地。');
      state.items.push(item);
    }
  }
}

export function useItem(state, index) {
  if (state.status !== 'playing') return state;
  state.fx = [];
  const item = state.player.inventory[index];
  if (!item) return state;
  state.player.inventory.splice(index, 1);
  if (item.kind === 'heal') {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + item.amount);
    addLog(state, `使用${item.name}，回复 ${item.amount} 点生命。`);
  } else if (item.kind === 'weapon') {
    state.player.attack += item.attack;
    addLog(state, `装备${item.name}，攻击 +${item.attack}。`);
  } else if (item.kind === 'armor') {
    state.player.defense += item.defense;
    addLog(state, `装备${item.name}，防御 +${item.defense}。`);
  } else if (item.kind === 'scroll') {
    const targets = state.enemies.filter((e) => distance(e, state.player) <= 8);
    targets.forEach((e) => { e.hp -= item.damage; });
    addLog(state, `使用${item.name}，${targets.length} 个敌人受到 ${item.damage} 点伤害。`);
    [...targets].forEach((e) => { if (e.hp <= 0) killEnemy(state, e); });
  }
  removeDeadSummons(state);
  checkGameOver(state);
  return state;
}

export function useSkill(state) {
  if (state.status !== 'playing') return state;
  state.fx = [];
  const skill = state.player.skill;
  if (!skill || skill.remaining > 0) {
    addLog(state, skill ? `${skill.name}还需要 ${skill.remaining} 回合冷却。` : '你没有技能。');
    return state;
  }
  let used = false;
  if (skill.id === 'baguette_lance') used = baguetteLance(state);
  else if (skill.id === 'butter_shot') used = butterShot(state);
  else if (skill.id === 'ham_cleave') used = hamCleave(state);
  else if (skill.id === 'leaf_prayer') used = leafPrayer(state);
  if (!used) {
    return state;
  }
  skill.remaining = skill.cooldown;
  finishPlayerTurn(state);
  return state;
}

function baguetteLance(state) {
  const target = nearestEnemy(state, 1);
  if (!target) { addLog(state, '法棍突刺需要相邻敌人。'); return false; }
  target.hp -= state.player.attack + state.player.defense + temporaryDefense(state.player) + 5;
  state.player.effects = state.player.effects.filter((e) => e.id !== 'guard');
  state.player.effects.push({ id: 'guard', name: '列巴护盾', turns: 2, damageReduction: 2 });
  addFx(state, state.player.skill.fx, target.x, target.y);
  addLog(state, `法棍突刺命中${target.name}，列巴护在胸前。`);
  if (target.hp <= 0) killEnemy(state, target);
  return true;
}

function butterShot(state) {
  const target = nearestEnemy(state, 6);
  if (!target) { addLog(state, '黄油箭找不到射程内的敌人。'); return false; }
  target.hp -= state.player.attack + 4;
  const spot = adjacentOpenSquares(state, state.player)[0];
  if (spot) {
    state.player.x = spot.x;
    state.player.y = spot.y;
  }
  addFx(state, state.player.skill.fx, target.x, target.y);
  addLog(state, `黄油箭射中${target.name}，你顺势滑开。`);
  if (target.hp <= 0) killEnemy(state, target);
  return true;
}

function hamCleave(state) {
  const targets = state.enemies.filter((e) => distance(e, state.player) === 1);
  if (targets.length === 0) { addLog(state, '火腿横扫需要相邻敌人。'); return false; }
  targets.forEach((e) => { e.hp -= state.player.attack + 3; });
  state.player.effects = state.player.effects.filter((e) => e.id !== 'sizzle_guard');
  state.player.effects.push({ id: 'sizzle_guard', name: '焦香防守', turns: 2, damageReduction: 1 });
  addFx(state, state.player.skill.fx, state.player.x, state.player.y);
  addLog(state, `火腿横扫扫过 ${targets.length} 个敌人，香气形成护身热浪。`);
  [...targets].forEach((e) => { if (e.hp <= 0) killEnemy(state, e); });
  return true;
}

function leafPrayer(state) {
  if (state.player.hp < state.player.maxHp) {
    const amount = Math.min(10, state.player.maxHp - state.player.hp);
    state.player.hp += amount;
    addFx(state, state.player.skill.fx, state.player.x, state.player.y);
    addLog(state, `生菜祈祷清脆作响，回复 ${amount} 点生命。`);
  } else {
    state.player.effects = state.player.effects.filter((e) => e.id !== 'leaf_shield');
    state.player.effects.push({ id: 'leaf_shield', name: '清脆护盾', turns: 3, defenseBonus: 1 });
    addFx(state, state.player.skill.fx, state.player.x, state.player.y);
    addLog(state, '生菜叶展开，临时防御 +1。');
  }
  return true;
}

function nearestEnemy(state, maxRange) {
  return state.enemies
    .filter((e) => distance(e, state.player) <= maxRange)
    .sort((a, b) => distance(a, state.player) - distance(b, state.player))[0];
}

function adjacentOpenSquares(state, origin) {
  const occupied = new Set([
    key(state.player.x, state.player.y),
    ...state.enemies.map((e) => key(e.x, e.y)),
    ...state.summons.map((s) => key(s.x, s.y)),
  ]);
  return [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(([dx, dy]) => ({ x: origin.x + dx, y: origin.y + dy }))
    .filter((p) => isWalkable(state.map, p.x, p.y) && !occupied.has(key(p.x, p.y)));
}

export function waitTurn(state) {
  if (state.status === 'playing') {
    state.fx = [];
    addLog(state, '你屏息等待。');
    finishPlayerTurn(state);
  }
  return state;
}

function finishPlayerTurn(state) {
  tickCooldownsAndEffects(state);
  summonTurn(state);
  removeDeadEnemies(state);
  enemyTurn(state);
  removeDeadSummons(state);
  checkGameOver(state);
}

function tickCooldownsAndEffects(state) {
  if (state.player.skill?.remaining > 0) state.player.skill.remaining -= 1;
  state.player.effects = state.player.effects
    .map((e) => ({ ...e, turns: e.turns - 1 }))
    .filter((e) => e.turns > 0);
}

function summonTurn(state) {
  for (const summon of state.summons) {
    const target = state.enemies
      .filter((e) => distance(e, summon) === 1)
      .sort((a, b) => a.hp - b.hp)[0];
    if (!target) continue;
    const dmg = Math.max(1, state.player.attack - (target.defense ?? 0));
    target.hp -= dmg;
    addLog(state, `${summon.name}撞击${target.name}造成 ${dmg} 点伤害。`);
  }
}

function removeDeadEnemies(state) {
  [...state.enemies].forEach((enemy) => { if (enemy.hp <= 0) killEnemy(state, enemy); });
}

function enemyTurn(state) {
  const occupied = new Set(state.enemies.map((e) => key(e.x, e.y)));
  for (const enemy of state.enemies) {
    if (state.status !== 'playing') return;
    const adjacentSummon = state.summons.find((s) => distance(enemy, s) === 1);
    if (adjacentSummon) {
      attack(state, enemy, adjacentSummon);
      continue;
    }
    if (distance(enemy, state.player) === 1) {
      attack(state, enemy, state.player);
      continue;
    }
    const target = chooseEnemyTarget(state, enemy);
    if (distance(enemy, target) <= 7) {
      const dx = Math.sign(target.x - enemy.x);
      const dy = Math.sign(target.y - enemy.y);
      const candidates = Math.abs(target.x - enemy.x) > Math.abs(target.y - enemy.y)
        ? [{ dx, dy: 0 }, { dx: 0, dy }]
        : [{ dx: 0, dy }, { dx, dy: 0 }];
      for (const step of candidates) {
        const nx = enemy.x + step.dx;
        const ny = enemy.y + step.dy;
        const k = key(nx, ny);
        if (isWalkable(state.map, nx, ny) && !occupied.has(k) && !isPlayerAt(state, nx, ny) && !isSummonAt(state, nx, ny)) {
          occupied.delete(key(enemy.x, enemy.y));
          enemy.dir = dirFromDelta(step.dx, step.dy);
          enemy.x = nx; enemy.y = ny;
          occupied.add(k);
          break;
        }
      }
    }
  }
}

function chooseEnemyTarget(state, enemy) {
  const candidates = [state.player, ...state.summons];
  return candidates.sort((a, b) => distance(enemy, a) - distance(enemy, b))[0];
}

function isPlayerAt(state, x, y) {
  return state.player.x === x && state.player.y === y;
}

function isSummonAt(state, x, y) {
  return state.summons.some((s) => s.x === x && s.y === y);
}

function removeDeadSummons(state) {
  const before = state.summons.length;
  state.summons = state.summons.filter((s) => s.hp > 0);
  if (before > state.summons.length) addLog(state, '面团伙伴被打散了。');
}

function checkGameOver(state) {
  if (state.player.hp <= 0) {
    state.player.hp = 0;
    state.status = 'lost';
    addLog(state, '你倒在了地牢里。按 R 重新开始。');
  }
}

export function addLog(state, message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, MAX_LOG);
}

function addFx(state, sprite, x, y) {
  if (!sprite) return;
  state.fx = [{ id: `${sprite}-${state.rng.int(1, 999999)}`, name: '技能效果', sprite, x, y }];
}

function pickItemForDepth(state, itemCounts) {
  const options = ITEM_TYPES.filter((item) => {
    if ((item.minDepth ?? 1) > state.depth) return false;
    if ((itemCounts[item.id] ?? 0) >= (item.maxPerFloor ?? Infinity)) return false;
    if (item.kind === 'scroll' && countItemsByKind(itemCounts, 'scroll') >= 1) return false;
    if (item.kind === 'heal' && countItemsByKind(itemCounts, 'heal') >= MAX_HEAL_ITEMS_PER_FLOOR) return false;
    return true;
  });
  const total = options.reduce((sum, item) => sum + (item.weight ?? 1), 0);
  let roll = state.rng.next() * total;
  for (const item of options) {
    roll -= item.weight ?? 1;
    if (roll <= 0) return item;
  }
  return options[options.length - 1];
}

function countItemsByKind(itemCounts, kind) {
  return ITEM_TYPES
    .filter((item) => item.kind === kind)
    .reduce((sum, item) => sum + (itemCounts[item.id] ?? 0), 0);
}

function isConsumable(item) {
  return item.kind === 'heal' || item.kind === 'scroll';
}

function carriedCount(state, itemId) {
  return state.player.inventory.filter((item) => item.id === itemId).length;
}

function dirFromDelta(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  if (dy < 0) return 'up';
  return 'down';
}

export function serializeState(state) {
  return JSON.stringify(state, (k, v) => (k === 'rng' ? { seed: v.seed } : v));
}

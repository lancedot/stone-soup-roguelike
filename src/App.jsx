import React, { useEffect, useMemo, useState } from 'react';
import { CLASSES, TILE_SIZE, TILES } from './game/data.js';
import { movePlayer, newGame, useItem, useSkill, waitTurn } from './game/engine.js';
import { sprites } from './sprites.js';
import './style.css';

function cloneState(state) {
  return {
    ...state,
    player: { ...state.player, inventory: [...state.player.inventory], skill: { ...state.player.skill }, effects: [...state.player.effects] },
    enemies: state.enemies.map((e) => ({ ...e })),
    items: state.items.map((i) => ({ ...i })),
    summons: state.summons.map((s) => ({ ...s })),
    fx: (state.fx ?? []).map((f) => ({ ...f })),
    log: [...state.log],
    map: { ...state.map, tiles: state.map.tiles.map((r) => [...r]), rooms: state.map.rooms.map((r) => ({ ...r })) },
  };
}

export default function App() {
  const [classId, setClassId] = useState('breadKnight');
  const [state, setState] = useState(() => newGame('breadKnight'));
  const [started, setStarted] = useState(false);

  const restart = (cls = classId) => {
    setState(newGame(cls));
    setStarted(true);
    window.scrollTo({ top: 0, left: 0 });
    setTimeout(() => window.scrollTo({ top: 0, left: 0 }), 0);
    setTimeout(() => window.scrollTo({ top: 0, left: 0 }), 80);
  };
  const returnToMenu = () => {
    setStarted(false);
    window.scrollTo({ top: 0, left: 0 });
    setTimeout(() => window.scrollTo({ top: 0, left: 0 }), 0);
  };
  const apply = (fn) => setState((old) => { const next = cloneState(old); next.rng = old.rng; return fn(next); });

  useEffect(() => {
    window.render_game_to_text = () => JSON.stringify({
      mode: started ? state.status : 'menu',
      note: 'Grid origin is top-left. x grows right, y grows down.',
      depth: state.depth,
      player: {
        classId: state.player.classId,
        name: state.player.name,
        x: state.player.x,
        y: state.player.y,
        hp: state.player.hp,
        maxHp: state.player.maxHp,
        skill: state.player.skill,
      },
      enemies: state.enemies.map((e) => ({ id: e.id, name: e.name, x: e.x, y: e.y, size: e.size ?? 1, hp: e.hp })),
      items: state.items.map((i) => ({ id: i.id, name: i.name, desc: i.desc, x: i.x, y: i.y })),
      inventory: state.player.inventory.map((i) => ({ id: i.id, name: i.name, desc: i.desc })),
      fx: (state.fx ?? []).map((f) => ({ sprite: f.sprite, x: f.x, y: f.y })),
      latestLog: state.log[0] ?? '',
    });
    window.advanceTime = () => {};
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [state, started]);

  useEffect(() => {
    const onKey = (e) => {
      if (!started) return;
      const k = e.key.toLowerCase();
      const dirs = { arrowup: [0, -1], w: [0, -1], k: [0, -1], arrowdown: [0, 1], s: [0, 1], j: [0, 1], arrowleft: [-1, 0], a: [-1, 0], h: [-1, 0], arrowright: [1, 0], d: [1, 0], l: [1, 0] };
      if (dirs[k]) {
        e.preventDefault();
        apply((next) => movePlayer(next, dirs[k][0], dirs[k][1]));
      } else if (k >= '1' && k <= '8') {
        e.preventDefault();
        apply((next) => useItem(next, Number(k) - 1));
      } else if (k === 'q') {
        e.preventDefault();
        apply((next) => useSkill(next));
      } else if (k === '.' || k === ' ') {
        e.preventDefault();
        apply((next) => waitTurn(next));
      } else if (k === 'r') {
        e.preventDefault();
        returnToMenu();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, classId]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
    const id = setTimeout(() => window.scrollTo({ top: 0, left: 0 }), 80);
    return () => clearTimeout(id);
  }, [started]);

  useEffect(() => {
    if (!state.fx?.length) return undefined;
    const id = setTimeout(() => {
      setState((old) => old.fx?.length ? { ...old, fx: [] } : old);
    }, 520);
    return () => clearTimeout(id);
  }, [state.fx]);

  if (!started) {
    return <main className="menu">
      <h1>面包小队</h1>
      <section className="storyIntro">
        <h2>[ 副本名称：失眠远征委托 ]</h2>
        <article>
          <b>&gt;&gt; (楼主)</b>
          <p>这一切要从室友 A 买了根法棍开始。他左手拿列巴，右手执法棍，站在我们床前问：“勇士，要一起去冒险吗？”</p>
          <em>[ 面包骑士 ] 已解锁。</em>
        </article>
        <article>
          <b>&gt;&gt; (室友 B)</b>
          <p>“黄油玩得多的我，当然是黄油射手啦！”</p>
          <em>[ 黄油射手 ] 已入队。</em>
        </article>
        <article>
          <b>&gt;&gt; (室友 C)</b>
          <p>“梦里我是水手战士，梦是反的，所以我现在是火腿战士。”</p>
          <em>[ 火腿战士 ] 已入队。</em>
        </article>
        <article>
          <b>&gt;&gt; (楼主)</b>
          <p>凌晨两点。我想睡觉。我忍不了了。坏了，我也开始传染了……</p>
          <p>为了这个小队的膳食纤维，我只能成为生菜牧师了。</p>
          <em>[ 生菜牧师 ] 已上线。</em>
        </article>
      </section>
      <div className="classGrid">{Object.values(CLASSES).map((c) => <button key={c.id} className={classId === c.id ? 'selected' : ''} onClick={() => setClassId(c.id)}>
        <SpritePreview spriteId={c.sprite} label={c.name} /><b>{c.name}</b><span>{c.desc}</span><em>技能：{c.skill.name} — {c.skill.desc}</em>
      </button>)}</div>
      <button className="start" onClick={() => restart(classId)}>出发冒险</button>
      <p className="hint">小体量传统肉鸽：移动就是探索，撞上敌人就是攻击，死了就重来。目标：第 4 层击败失眠魔王。</p>
    </main>;
  }

  return <main className="game">
    <section className="board" style={{ width: state.map.width * TILE_SIZE, height: state.map.height * TILE_SIZE }}>
      {state.map.tiles.flatMap((row, y) => row.map((tile, x) => <Tile key={`${x},${y}`} map={state.map} tile={tile} x={x} y={y} />))}
      {state.items.map((item) => <Sprite key={item.uid} entity={item} />)}
      {state.summons.map((summon) => <Sprite key={summon.id} entity={summon} hp summon />)}
      {state.enemies.map((enemy, i) => <Sprite key={`${enemy.id}-${i}-${enemy.x}-${enemy.y}`} entity={enemy} hp />)}
      <Sprite entity={state.player} player />
      {(state.fx ?? []).map((fx) => <Sprite key={fx.id} entity={fx} fx />)}
      {state.status !== 'playing' && <div className="overlay">
        {state.status === 'won' && <VictoryArt classId={state.player.classId} />}
        <h2>{state.status === 'won' ? '夺回安眠圣杯！' : '你睡过去了'}</h2>
        <button onClick={() => restart(classId)}>再来一局</button>
      </div>}
    </section>
    <aside className="panel">
      <h2>安眠圣域 第 {state.depth} 层</h2>
      <Stats p={state.player} />
      <SkillBox skill={state.player.skill} effects={state.player.effects} onUse={() => apply((next) => useSkill(next))} />
      <button className="waitButton" onClick={() => apply((next) => waitTurn(next))}>等待 <kbd>空格</kbd><kbd>.</kbd></button>
      <HelpBox />
      <h3>背包</h3>
      <div className="inventory">{state.player.inventory.length === 0 ? <em>空</em> : state.player.inventory.map((item, i) => <button key={item.uid} title={item.desc} onClick={() => apply((next) => useItem(next, i))}><span>{i + 1}</span><img src={sprites[item.sprite]} alt={item.name} /><strong>{item.name}<small>{item.desc}</small></strong></button>)}</div>
      <h3>日志</h3>
      <ul className="log">{state.log.map((l, i) => <li key={i}>{l}</li>)}</ul>
    </aside>
  </main>;
}

function HelpBox() {
  return <div className="helpBox">
    <h3>操作说明</h3>
    <p><kbd>方向键</kbd> / <kbd>WASD</kbd> 移动；撞到敌人会近战攻击。</p>
    <p><kbd>Q</kbd> 使用职业技能；成功才消耗回合。</p>
    <p><kbd>1-8</kbd> 使用背包道具；道具是瞬间动作。</p>
    <p>站到 <b>&gt;</b> 楼梯上下楼；第 4 层打倒失眠魔王获胜。</p>
    <p><kbd>R</kbd> 回到选角；死亡后可以立刻再来。</p>
  </div>;
}

function SpritePreview({ spriteId, label }) {
  const sprite = sprites[spriteId];
  if (typeof sprite === 'string') return <img src={sprite} alt={label} />;
  return <span className="classPreview" aria-label={label} title={label} style={{ backgroundImage: `url(${sprite.src})`, '--cols': sprite.cols, '--rows': sprite.rows }} />;
}

function VictoryArt({ classId }) {
  const cls = CLASSES[classId] ?? CLASSES.breadKnight;
  const src = sprites[cls.victoryCg];
  return <img className="victoryArt" src={src} alt={`${cls.name}通关结算`} />;
}

function Tile({ map, tile, x, y }) {
  const wallSpec = tile === TILES.wall ? wallTileSpec(map, x, y) : null;
  if (tile === TILES.wall && !wallSpec) return null;
  const tileSprites = wallSpec?.sprites ?? (tile === TILES.stairs ? sprites.tile_stairs : sprites.tile_floor);
  const spriteCount = Array.isArray(tileSprites) ? tileSprites.length : 1;
  const variant = wallSpec ? wallVariantIndex(wallSpec.orientation, x, y, spriteCount, map.visualSeed ?? 1) : tileVariantIndex(x, y, spriteCount, map.visualSeed ?? 1);
  const src = Array.isArray(tileSprites) ? tileSprites[variant] : tileSprites;
  const transform = wallSpec?.transform ?? (tile === TILES.floor ? floorTransform(x, y, map.visualSeed ?? 1) : undefined);
  if (wallSpec) {
    const floorSprites = sprites.tile_floor;
    const floorSrc = floorSprites[tileVariantIndex(x, y, floorSprites.length, map.visualSeed ?? 1)];
    return <div className="tile tileComposite" style={{ left: x * TILE_SIZE, top: y * TILE_SIZE }}>
      {floorFillRects(wallSpec.orientation).map((rect) => <span key={`${rect.x},${rect.y}`} className="floorPatch" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, backgroundImage: `url(${floorSrc})`, backgroundPosition: `-${rect.x}px -${rect.y}px` }} />)}
      <img className="wallLayer" src={src} alt={tile} style={{ transform }} />
    </div>;
  }
  return <img className="tile" src={src} alt={tile} style={{ left: x * TILE_SIZE, top: y * TILE_SIZE, transform }} />;
}

function wallOrientationFor(map, x, y) {
  if (isOpenTile(map, x, y + 1)) return 'north';
  if (isOpenTile(map, x, y - 1)) return 'south';
  if (isOpenTile(map, x + 1, y)) return 'west';
  if (isOpenTile(map, x - 1, y)) return 'east';
  return null;
}

function wallTileSpec(map, x, y) {
  const orientation = wallOrientationFor(map, x, y);
  if (orientation === 'south') return { orientation, sprites: sprites.tile_wall_south };
  if (orientation === 'west') return { orientation, sprites: sprites.tile_wall_south, transform: 'rotate(-90deg)' };
  if (orientation === 'east') return { orientation, sprites: sprites.tile_wall_south, transform: 'rotate(90deg)' };
  if (orientation === 'north') return { orientation, sprites: sprites.tile_wall_north };
  const corner = wallCornerFor(map, x, y);
  if (corner) return { orientation: `corner_${corner}`, sprites: sprites[`tile_wall_corner_${corner}`] };
  return null;
}

function wallCornerFor(map, x, y) {
  const corners = [
    ['nw', x + 1, y + 1, [['north', x + 1, y], ['west', x, y + 1]]],
    ['ne', x - 1, y + 1, [['north', x - 1, y], ['east', x, y + 1]]],
    ['sw', x + 1, y - 1, [['south', x + 1, y], ['west', x, y - 1]]],
    ['se', x - 1, y - 1, [['south', x - 1, y], ['east', x, y - 1]]],
  ].filter(([, cx, cy, arms]) => isOpenTile(map, cx, cy) && arms.every(([orientation, ax, ay]) => wallOrientationFor(map, ax, ay) === orientation));
  return corners.length === 1 ? corners[0][0] : null;
}

function isOpenTile(map, x, y) {
  return x >= 0 && y >= 0 && x < map.width && y < map.height && map.tiles[y][x] !== TILES.wall;
}

function tileVariantIndex(x, y, count, seed) {
  return hashTile(x + Math.floor(y / 2), y + Math.floor(x / 3), seed) % count;
}

function wallVariantIndex(orientation, x, y, count, seed) {
  if (orientation === 'west' || orientation === 'east') return 0;
  return hashTile(x, y, seed + 31) % count;
}

function floorFillRects(orientation) {
  const half = TILE_SIZE / 2;
  const cardinal = {
    north: [{ x: 0, y: half, w: TILE_SIZE, h: half }],
    south: [{ x: 0, y: 0, w: TILE_SIZE, h: half }],
    west: [{ x: half, y: 0, w: half, h: TILE_SIZE }],
    east: [{ x: 0, y: 0, w: half, h: TILE_SIZE }],
  };
  const corners = {
    corner_nw: [{ x: half, y: half, w: half, h: half }],
    corner_ne: [{ x: 0, y: half, w: half, h: half }],
    corner_sw: [{ x: half, y: 0, w: half, h: half }],
    corner_se: [{ x: 0, y: 0, w: half, h: half }],
  };
  return cardinal[orientation] ?? corners[orientation] ?? [];
}

function floorTransform(x, y, seed) {
  const h = hashTile(x, y, seed + 17);
  const rotation = [0, 90, 180, 270][h % 4];
  const flip = h % 7 === 0 ? ' scaleX(-1)' : h % 11 === 0 ? ' scaleY(-1)' : '';
  return `rotate(${rotation}deg)${flip}`;
}

function hashTile(x, y, seed) {
  let h = (seed ^ (x * 374761393) ^ (y * 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

function Sprite({ entity, player, hp, summon, fx }) {
  const sprite = sprites[entity.sprite];
  const direction = entity.dir ?? 'down';
  const size = entity.size ?? 1;
  const pixelSize = TILE_SIZE * size;
  return <div className={`sprite ${player ? 'player' : ''} ${summon ? 'summon' : ''} ${fx ? 'fx' : ''} ${size > 1 ? 'large' : ''}`} style={{ left: entity.x * TILE_SIZE, top: entity.y * TILE_SIZE, width: pixelSize, height: pixelSize }}>
    {typeof sprite === 'string'
      ? <img src={sprite} alt={entity.name} title={entity.name} style={{ width: pixelSize, height: pixelSize }} />
      : <span className={`spriteSheet dir-${direction}`} title={entity.name} style={{ width: pixelSize, height: pixelSize, backgroundImage: `url(${sprite.src})`, '--tile-size': `${pixelSize}px`, '--cols': sprite.cols, '--rows': sprite.rows, '--frame-ms': `${sprite.frameMs ?? 520}ms` }} />}
    {hp && <small>{entity.hp}</small>}
  </div>;
}

function Stats({ p }) {
  const hpPct = useMemo(() => `${Math.max(0, Math.round((p.hp / p.maxHp) * 100))}%`, [p.hp, p.maxHp]);
  const effectDefense = p.effects.reduce((sum, e) => sum + (e.defenseBonus ?? 0), 0);
  return <div className="stats">
    <b>{p.name}</b><div className="bar"><i style={{ width: hpPct }} /></div>
    <p>HP {p.hp}/{p.maxHp}　攻 {p.attack}　防 {p.defense + effectDefense}</p>
    <p>等级 {p.level}　经验 {p.xp}/{p.level * 18}</p>
  </div>;
}

function SkillBox({ skill, effects, onUse }) {
  return <div className="skillBox">
    <h3>技能 <kbd>Q</kbd></h3>
    <button disabled={skill.remaining > 0} onClick={onUse}>
      <b>{skill.name}</b>
      <span>{skill.remaining > 0 ? `冷却 ${skill.remaining}` : '可用'}</span>
    </button>
    <p>{skill.desc}</p>
    {effects.length > 0 && <div className="effects">{effects.map((e) => <i key={e.id}>{e.name} {e.turns}</i>)}</div>}
  </div>;
}

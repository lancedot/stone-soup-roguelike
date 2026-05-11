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

  if (!started) {
    return <main className="menu">
      <h1>面包小队</h1>
      <section className="storyIntro">
        <p>凌晨两点，宿舍群里那个离谱段子成真了：有人说睡不着就吃点面包，有人说抹黄油会滑进梦里，还有人坚持火腿和生菜才是安眠配方。</p>
        <p>笑声刚落，安眠圣域裂开一条缝。面包骑士、黄油射手、火腿战士和生菜牧师被一起卷进地牢，只剩一个目标：打败把全楼都吵醒的失眠魔王，夺回能让人闭眼的安眠圣杯。</p>
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
      {state.map.tiles.flatMap((row, y) => row.map((tile, x) => <Tile key={`${x},${y}`} tile={tile} x={x} y={y} />))}
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

function Tile({ tile, x, y }) {
  const tileSprites = tile === TILES.wall ? sprites.tile_wall : tile === TILES.stairs ? sprites.tile_stairs : sprites.tile_floor;
  const src = Array.isArray(tileSprites) ? tileSprites[tileVariantIndex(x, y, tileSprites.length)] : tileSprites;
  return <img className="tile" src={src} alt={tile} style={{ left: x * TILE_SIZE, top: y * TILE_SIZE }} />;
}

function tileVariantIndex(x, y, count) {
  return Math.abs((x * 73856093) ^ (y * 19349663) ^ ((x + y) * 83492791)) % count;
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

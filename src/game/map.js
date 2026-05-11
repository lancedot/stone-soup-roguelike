import { MAP_HEIGHT, MAP_WIDTH, TILES } from './data.js';
import { rectsOverlap } from './utils.js';

export function makeMap(rng, depth = 1) {
  const tiles = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(TILES.wall));
  const rooms = [];
  const attempts = 140;
  const targetRooms = MAP_WIDTH <= 20 ? 6 : 10;

  for (let i = 0; i < attempts && rooms.length < targetRooms; i++) {
    const w = rng.int(4, MAP_WIDTH <= 20 ? 8 : 10);
    const h = rng.int(3, MAP_WIDTH <= 20 ? 6 : 8);
    const x = rng.int(1, MAP_WIDTH - w - 2);
    const y = rng.int(1, MAP_HEIGHT - h - 2);
    const room = { x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) };
    if (rooms.some((r) => rectsOverlap(room, r))) continue;
    carveRoom(tiles, room);
    if (rooms.length > 0) {
      const prev = rooms[rooms.length - 1];
      if (rng.next() < 0.5) {
        carveHTunnel(tiles, prev.cx, room.cx, prev.cy);
        carveVTunnel(tiles, prev.cy, room.cy, room.cx);
      } else {
        carveVTunnel(tiles, prev.cy, room.cy, prev.cx);
        carveHTunnel(tiles, prev.cx, room.cx, room.cy);
      }
    }
    rooms.push(room);
  }

  if (rooms.length === 0) throw new Error('map generation failed');
  const start = { x: rooms[0].cx, y: rooms[0].cy };
  if (depth < 4) {
    const endRoom = rooms[rooms.length - 1];
    tiles[endRoom.cy][endRoom.cx] = TILES.stairs;
  }

  return { width: MAP_WIDTH, height: MAP_HEIGHT, tiles, rooms, start, depth, visualSeed: rng.int(1, 999999) };
}

function carveRoom(tiles, room) {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) tiles[y][x] = TILES.floor;
  }
}

function carveHTunnel(tiles, x1, x2, y) {
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) tiles[y][x] = TILES.floor;
}

function carveVTunnel(tiles, y1, y2, x) {
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) tiles[y][x] = TILES.floor;
}

export function isWalkable(map, x, y) {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return false;
  return map.tiles[y][x] !== TILES.wall;
}

export function randomFloor(map, rng, occupied = new Set()) {
  for (let tries = 0; tries < 1000; tries++) {
    const room = rng.pick(map.rooms);
    const x = rng.int(room.x, room.x + room.w - 1);
    const y = rng.int(room.y, room.y + room.h - 1);
    const k = `${x},${y}`;
    if (map.tiles[y][x] === TILES.floor && !occupied.has(k)) return { x, y };
  }
  throw new Error('no empty floor found');
}

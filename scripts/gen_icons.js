const fs = require('fs');
const zlib = require('zlib');

const W = 81, H = 81;

// --- PNG encoder ---
function createPNG(width, height, rgba) {
  let raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const off = y * (1 + width * 4) + 1 + x * 4;
      raw[off] = rgba[idx];
      raw[off + 1] = rgba[idx + 1];
      raw[off + 2] = rgba[idx + 2];
      raw[off + 3] = rgba[idx + 3];
    }
  }
  const compressed = zlib.deflateSync(raw);

  function crc32(buf) {
    const table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c;
    }
    let c = -1;
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeB = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeB, data]);
    const crcVal = Buffer.alloc(4);
    crcVal.writeUInt32BE(crc32(crcData), 0);
    return Buffer.concat([len, typeB, data, crcVal]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

// --- Drawing helpers ---
function setPx(rgba, x, y, color) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 4;
  rgba[i] = color[0]; rgba[i+1] = color[1]; rgba[i+2] = color[2]; rgba[i+3] = color[3];
}

function fillCircle(rgba, cx, cy, r, color) {
  for (let y = Math.round(cy-r); y <= Math.round(cy+r); y++) {
    for (let x = Math.round(cx-r); x <= Math.round(cx+r); x++) {
      if ((x-cx)*(x-cx) + (y-cy)*(y-cy) <= r*r) setPx(rgba, x, y, color);
    }
  }
}

function drawThickLine(rgba, x0, y0, x1, y1, color, thick) {
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy, x = x0, y = y0;
  while (true) {
    for (let tx = -thick; tx <= thick; tx++)
      for (let ty = -thick; ty <= thick; ty++)
        setPx(rgba, Math.round(x + tx), Math.round(y + ty), color);
    if (Math.abs(x - x1) < 1 && Math.abs(y - y1) < 1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
}

function fillTriangle(rgba, x0, y0, x1, y1, x2, y2, color) {
  const minY = Math.max(0, Math.min(y0, y1, y2));
  const maxY = Math.min(H-1, Math.max(y0, y1, y2));
  for (let y = minY; y <= maxY; y++) {
    const intersections = [];
    [[x0,y0,x1,y1],[x1,y1,x2,y2],[x2,y2,x0,y0]].forEach(([ax,ay,bx,by]) => {
      if ((ay <= y && by > y) || (by <= y && ay > y)) {
        const t = (y - ay) / (by - ay);
        intersections.push(ax + t * (bx - ax));
      }
    });
    if (intersections.length >= 2) {
      intersections.sort((a,b) => a-b);
      for (let x = Math.round(intersections[0]); x <= Math.round(intersections[1]); x++)
        setPx(rgba, x, y, color);
    }
  }
}

function fillRect(rgba, x0, y0, x1, y1, color) {
  for (let y = Math.round(y0); y <= Math.round(y1); y++)
    for (let x = Math.round(x0); x <= Math.round(x1); x++)
      setPx(rgba, x, y, color);
}

function fillRoundedRect(rgba, x0, y0, x1, y1, r, color) {
  for (let y = Math.round(y0); y <= Math.round(y1); y++) {
    for (let x = Math.round(x0); x <= Math.round(x1); x++) {
      let inside = true;
      if (y < y0 + r && x < x0 + r) inside = (x-x0-r)*(x-x0-r) + (y-y0-r)*(y-y0-r) <= r*r;
      else if (y < y0 + r && x > x1 - r) inside = (x-x1+r)*(x-x1+r) + (y-y0-r)*(y-y0-r) <= r*r;
      else if (y > y1 - r && x < x0 + r) inside = (x-x0-r)*(x-x0-r) + (y-y1+r)*(y-y1+r) <= r*r;
      else if (y > y1 - r && x > x1 - r) inside = (x-x1+r)*(x-x1+r) + (y-y1+r)*(y-y1+r) <= r*r;
      if (inside) setPx(rgba, x, y, color);
    }
  }
}

// --- Icon draw functions ---
function drawMap(rgba, color) {
  // Pin shape: circle + pointed bottom
  fillCircle(rgba, 40, 28, 16, color);
  fillTriangle(rgba, 24, 28, 56, 28, 40, 65, color);
  // Center hole
  fillCircle(rgba, 40, 28, 7, [0,0,0,0]);
}

function drawExplore(rgba, color) {
  // Rounded rectangle body
  fillRoundedRect(rgba, 10, 16, 70, 64, 8, color);
  // White play triangle
  fillTriangle(rgba, 32, 28, 32, 52, 52, 40, [0,0,0,0]);
}

function drawMine(rgba, color) {
  // Head circle
  fillCircle(rgba, 40, 22, 12, color);
  // Body: wider at shoulders, tapering down
  fillCircle(rgba, 40, 45, 18, color);
  // Connect head and body
  fillRect(rgba, 30, 18, 50, 58, color);
  // Trim sides to create neck + rounded body
  for (let y = 28; y < 35; y++) { // neck area - slim
    for (let x = 33; x < 48; x++) setPx(rgba, x, y, color);
  }
  for (let y = 35; y < 58; y++) { // body - wider
    const w = 12 + Math.sin((y-35)/23 * Math.PI/2) * 8;
    for (let x = Math.round(40-w); x <= Math.round(40+w); x++) setPx(rgba, x, y, color);
  }
}

// --- Generate ---
const colors = {
  normal: [0x99, 0x99, 0x99, 255],
  active: [0x07, 0xC1, 0x60, 255],
};

// --- Marker (location pin for map) ---
function drawMarker(rgba, color) {
  // Pin shape
  fillCircle(rgba, 40, 26, 18, color);
  fillTriangle(rgba, 22, 26, 58, 26, 40, 70, color);
  // Center hole
  fillCircle(rgba, 40, 26, 8, [0,0,0,0]);
}

// --- Locate (crosshair / target) ---
function drawLocate(rgba, color) {
  // Outer ring
  for (let y = 8; y < 74; y++) {
    for (let x = 8; x < 74; x++) {
      const d = Math.sqrt((x-40)*(x-40) + (y-40)*(y-40));
      if (d >= 26 && d <= 30) setPx(rgba, x, y, color);
    }
  }
  // Cross lines
  fillRect(rgba, 38, 12, 43, 22, color);
  fillRect(rgba, 38, 60, 43, 70, color);
  fillRect(rgba, 12, 38, 22, 43, color);
  fillRect(rgba, 60, 38, 70, 43, color);
  // Center dot
  fillCircle(rgba, 40, 40, 5, color);
}

const icons = [
  { name: 'map', draw: drawMap },
  { name: 'explore', draw: drawExplore },
  { name: 'mine', draw: drawMine },
  { name: 'marker', draw: drawMarker },
  { name: 'locate', draw: drawLocate, single: true },
];

const outDir = process.argv[2] || '.';

for (const icon of icons) {
  const variants = icon.single ? [['normal', colors.normal]] : Object.entries(colors);
  for (const [variant, color] of variants) {
    const rgba = Buffer.alloc(W * H * 4, 0);
    icon.draw(rgba, color);
    const png = createPNG(W, H, rgba);
    const suffix = (variant === 'active' && !icon.single) ? '-active' : '';
    const fname = `${icon.name}${suffix}.png`;
    fs.writeFileSync(`${outDir}/${fname}`, png);
    console.log(`Created ${fname} (${png.length} bytes)`);
  }
}

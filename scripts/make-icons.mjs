// Generates the app icons (white × on indigo) as PNGs without any dependency.
// Run: node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
}
function png(n) {
  const rows = [];
  const w = n * 0.07; // half stroke width
  for (let y = 0; y < n; y++) {
    const row = [0];
    for (let x = 0; x < n; x++) {
      const u = x - n / 2, v = y - n / 2;
      const inBox = Math.abs(u) < n * 0.26 && Math.abs(v) < n * 0.26;
      const onX = Math.abs(u - v) / Math.SQRT2 < w || Math.abs(u + v) / Math.SQRT2 < w;
      row.push(...(inBox && onX ? [255, 255, 255] : [79, 70, 229]));
    }
    rows.push(Buffer.from(row));
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(n, 0);
  ihdr.writeUInt32BE(n, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
for (const n of [180, 192, 512]) writeFileSync(new URL(`../public/icon-${n}.png`, import.meta.url), png(n));

#!/usr/bin/env node
/**
 * Minimal PNG generator (no deps).
 * Produces a 1200x630 social card PNG with simple brand blocks.
 */
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const width = 1200;
const height = 630;

// Colors (RGBA)
const navy = [0x06, 0x10, 0x2a, 0xff]; // deep navy
const gold = [0xf6, 0x82, 0x1f, 0xff]; // warm orange (matches other Nir sites)
const white = [0xff, 0xff, 0xff, 0xff];

// Build raw image bytes: each row = 1 filter byte + width*4 RGBA
const rowBytes = 1 + width * 4;
const raw = Buffer.alloc(height * rowBytes);

function setPixel(x, y, rgba) {
  const o = y * rowBytes + 1 + x * 4;
  raw[o] = rgba[0];
  raw[o + 1] = rgba[1];
  raw[o + 2] = rgba[2];
  raw[o + 3] = rgba[3];
}

for (let y = 0; y < height; y++) {
  raw[y * rowBytes] = 0; // filter: None
  for (let x = 0; x < width; x++) {
    // Layout:
    // - Navy background
    // - Gold band at bottom (approx 18%)
    // - Thin white line separating band
    const isBand = y >= Math.floor(height * 0.82);
    const isSeparator = y === Math.floor(height * 0.82) - 1;
    const color = isSeparator ? white : isBand ? gold : navy;
    setPixel(x, y, color);
  }
}

// --- PNG encoding ---

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8; // bit depth
// color type: 6 = RGBA
// compression: 0, filter: 0, interlace: 0
ihdr[9] = 6;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const idat = deflateSync(raw, { level: 9 });

const png = Buffer.concat([
  SIGNATURE,
  chunk("IHDR", ihdr),
  chunk("IDAT", idat),
  chunk("IEND", Buffer.alloc(0)),
]);

const out = process.argv[2] || new URL("../public/telavivyacht-og.png", import.meta.url).pathname;
writeFileSync(out, png);
console.log(`Wrote ${out} (${png.length} bytes)`);

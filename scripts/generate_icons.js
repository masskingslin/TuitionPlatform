import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, drawFn) {
  // RGBA buffer: width * height * 4
  const rgba = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const color = drawFn(x, y, width, height);
      rgba[idx] = color.r;     // R
      rgba[idx + 1] = color.g; // G
      rgba[idx + 2] = color.b; // B
      rgba[idx + 3] = color.a; // A
    }
  }

  // Raw scanlines with filter byte 0 (None)
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    scanlines[y * (width * 4 + 1)] = 0; // Filter type 0
    rgba.copy(scanlines, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const deflated = zlib.deflateSync(scanlines);

  // Helper CRC32
  const crcTable = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let c = -1;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ -1) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const typeAndData = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData), 0);
    return Buffer.concat([len, typeAndData, crc]);
  }

  // PNG Header
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type 6 (RGBA)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = chunk('IHDR', ihdr);
  const idatChunk = chunk('IDAT', deflated);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Draw function: Teal background (#00695C) with white graduation cap shape
function drawIcon(x, y, w, h) {
  const relX = x / w;
  const relY = y / h;

  // Outer rounded rect margin
  const margin = 0.05;
  if (relX < margin || relX > 1 - margin || relY < margin || relY > 1 - margin) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  // Background teal: #00695C (0, 105, 92)
  let r = 0, g = 105, b = 92, a = 255;

  // Cap Diamond (rhombus around top-middle)
  // Center (0.5, 0.42), rx 0.35, ry 0.18
  const dx = Math.abs(relX - 0.5) / 0.35;
  const dy = Math.abs(relY - 0.42) / 0.18;
  if (dx + dy <= 1.0) {
    // White diamond
    r = 255; g = 255; b = 255;
  }

  // Cap Base (bottom curved arch around y 0.52 - 0.68)
  if (relY >= 0.52 && relY <= 0.68 && relX >= 0.28 && relX <= 0.72) {
    const archDist = Math.abs(relX - 0.5) / 0.22;
    if (archDist <= 1.0) {
      r = 224; g = 242; b = 241; // Light teal (#E0F2F1)
    }
  }

  // Tassel (gold dot & string on right side)
  const tasselX = Math.abs(relX - 0.84);
  const tasselY = Math.abs(relY - 0.42);
  if (tasselX < 0.03 && relY >= 0.42 && relY <= 0.65) {
    r = 255; g = 213; b = 79; // Gold #FFD54F
  }

  return { r, g, b, a };
}

fs.writeFileSync('public/pwa-192x192.png', createPng(192, 192, drawIcon));
fs.writeFileSync('public/pwa-512x512.png', createPng(512, 512, drawIcon));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPng(512, 512, drawIcon));
fs.writeFileSync('public/apple-touch-icon.png', createPng(180, 180, drawIcon));
console.log('Successfully generated all PWA PNG icons!');

// One-time script: packs the PNG icons in this folder into a single icon.ico
// (Windows Vista+ ICO format supports embedding PNG-compressed frames directly,
// so no BMP/DIB conversion is needed.)
"use strict";
const fs = require("fs");
const path = require("path");

const sizes = [16, 32, 48, 64, 128, 256];
const pngs = sizes.map((s) => fs.readFileSync(path.join(__dirname, `icon-${s}.png`)));

const headerSize = 6;
const dirEntrySize = 16;
const dirSize = dirEntrySize * sizes.length;
let offset = headerSize + dirSize;

const header = Buffer.alloc(headerSize);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(sizes.length, 4); // image count

const dirEntries = [];
sizes.forEach((size, i) => {
  const entry = Buffer.alloc(dirEntrySize);
  entry.writeUInt8(size === 256 ? 0 : size, 0); // width (0 = 256)
  entry.writeUInt8(size === 256 ? 0 : size, 1); // height (0 = 256)
  entry.writeUInt8(0, 2); // color count
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // planes
  entry.writeUInt16LE(32, 6); // bit count
  entry.writeUInt32LE(pngs[i].length, 8); // bytes in resource
  entry.writeUInt32LE(offset, 12); // offset
  offset += pngs[i].length;
  dirEntries.push(entry);
});

const ico = Buffer.concat([header, ...dirEntries, ...pngs]);
fs.writeFileSync(path.join(__dirname, "..", "icon.ico"), ico);
console.log(`Wrote electron/icon.ico (${ico.length} bytes, ${sizes.length} frames)`);

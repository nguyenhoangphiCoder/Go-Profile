const fs = require('fs');
const zlib = require('zlib');

function decodePng(filePath) {
  const buf = fs.readFileSync(filePath);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const colorType = buf[25];

  let pos = 33;
  const idatChunks = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IDAT') {
      idatChunks.push(buf.subarray(pos + 8, pos + 8 + len));
    }
    pos += 12 + len;
  }
  const idat = Buffer.concat(idatChunks);
  const raw = zlib.inflateSync(idat);

  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
  const pixels = Buffer.alloc(width * height * bpp);

  let rawPos = 0;
  let prevScanline = Buffer.alloc(width * bpp);

  for (let y = 0; y < height; y++) {
    const filter = raw[rawPos++];
    const currentScanline = Buffer.alloc(width * bpp);

    for (let x = 0; x < width * bpp; x++) {
      const byte = raw[rawPos++];
      const left = x >= bpp ? currentScanline[x - bpp] : 0;
      const up = prevScanline[x];
      const upLeft = x >= bpp ? prevScanline[x - bpp] : 0;

      let val = 0;
      if (filter === 0) val = byte;
      else if (filter === 1) val = (byte + left) & 0xff;
      else if (filter === 2) val = (byte + up) & 0xff;
      else if (filter === 3) val = (byte + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        const pr = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
        val = (byte + pr) & 0xff;
      }
      currentScanline[x] = val;
    }
    currentScanline.copy(pixels, y * width * bpp);
    prevScanline = currentScanline;
  }

  return { width, height, pixels, bpp };
}

const file = 'C:/Users/ACER/.gemini/antigravity/brain/e0784f15-eb4c-457c-b057-5cc05e0c61d7/.user_uploaded/media_1794214921089_5d178983.png';
const { width, height, pixels, bpp } = decodePng(file);

function rgbAt(x, y) {
  const idx = (y * width + x) * bpp;
  return `rgb(${pixels[idx]}, ${pixels[idx+1]}, ${pixels[idx+2]}) (#${pixels[idx].toString(16).padStart(2,'0')}${pixels[idx+1].toString(16).padStart(2,'0')}${pixels[idx+2].toString(16).padStart(2,'0')})`;
}

console.log('Top-Left background (x=20, y=20):', rgbAt(20, 20));
console.log('Top-Left background (x=100, y=100):', rgbAt(100, 100));
console.log('Near card shadow (x=220, y=100):', rgbAt(220, 100));
console.log('Card edge (x=255, y=100):', rgbAt(255, 100));
console.log('Inside Card (x=270, y=50):', rgbAt(270, 50));
console.log('Top-Center above card (x=512, y=20):', rgbAt(512, 20));
console.log('Top-Right background (x=900, y=100):', rgbAt(900, 100));
console.log('Far-Right background (x=1000, y=20):', rgbAt(1000, 20));

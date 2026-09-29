import { deflateSync, crc32 } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const SS = 4
const BG = [0xf4, 0xf5, 0xf7, 255]
const BLUE = [0x3b, 0x82, 0xf6, 255]
const INK = [0x1a, 0x1a, 0x2e, 255]

const CELLS = [
  { x: 8, y: 8, stroke: true },
  { x: 25, y: 8, stroke: false },
  { x: 42, y: 8, stroke: true },
  { x: 8, y: 25, stroke: false },
  { x: 25, y: 25, stroke: false },
  { x: 42, y: 25, stroke: false },
  { x: 8, y: 42, stroke: false },
  { x: 25, y: 42, stroke: true },
  { x: 42, y: 42, stroke: false }
]

export function inRoundRect(ux, uy, x, y, w, h, r) {
  if (ux < x || uy < y || ux > x + w || uy > y + h) return false
  const cx = Math.min(Math.max(ux, x + r), x + w - r)
  const cy = Math.min(Math.max(uy, y + r), y + h - r)
  const dx = ux - cx
  const dy = uy - cy
  return dx * dx + dy * dy <= r * r
}

function sampleColor(ux, uy) {
  if (!inRoundRect(ux, uy, 0, 0, 64, 64, 14)) return [0, 0, 0, 0]
  let col = BG
  for (const c of CELLS) {
    if (c.stroke) {
      if (
        inRoundRect(ux, uy, c.x - 1, c.y - 1, 16, 16, 5) &&
        !inRoundRect(ux, uy, c.x + 1, c.y + 1, 12, 12, 3)
      ) {
        col = INK
      }
    } else if (inRoundRect(ux, uy, c.x, c.y, 14, 14, 4)) {
      col = BLUE
    }
  }
  return col
}

export function renderRGBA(size) {
  const scale = size / 64
  const out = Buffer.alloc(size * size * 4)
  const total = SS * SS
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const ux = (px + (sx + 0.5) / SS) / scale
          const uy = (py + (sy + 0.5) / SS) / scale
          const c = sampleColor(ux, uy)
          r += c[0] * c[3]
          g += c[1] * c[3]
          b += c[2] * c[3]
          a += c[3]
        }
      }
      const i = (py * size + px) * 4
      if (a === 0) {
        out[i] = 0
        out[i + 1] = 0
        out[i + 2] = 0
        out[i + 3] = 0
      } else {
        out[i] = Math.round(r / a)
        out[i + 1] = Math.round(g / a)
        out[i + 2] = Math.round(b / a)
        out[i + 3] = Math.round(a / total)
      }
    }
  }
  return out
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

export function encodePNG(size, rgba) {
  if (rgba.length !== size * size * 4) {
    throw new Error('rgba length mismatch')
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const stride = size * 4 + 1
  const raw = Buffer.alloc(stride * size)
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

export function encodeICO(entries) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(entries.length, 4)
  const dir = Buffer.alloc(16 * entries.length)
  let offset = 6 + dir.length
  const blobs = []
  entries.forEach((e, i) => {
    const b = i * 16
    dir[b] = e.size >= 256 ? 0 : e.size
    dir[b + 1] = e.size >= 256 ? 0 : e.size
    dir.writeUInt16LE(1, b + 4)
    dir.writeUInt16LE(32, b + 6)
    dir.writeUInt32LE(e.png.length, b + 8)
    dir.writeUInt32LE(offset, b + 12)
    offset += e.png.length
    blobs.push(e.png)
  })
  return Buffer.concat([header, dir, ...blobs])
}

function png(size) {
  return encodePNG(size, renderRGBA(size))
}

export function main() {
  const out = new URL('../assets/', import.meta.url)
  writeFileSync(new URL('icon-192.png', out), png(192))
  writeFileSync(new URL('icon-512.png', out), png(512))
  writeFileSync(new URL('apple-touch-icon.png', out), png(180))
  writeFileSync(
    new URL('favicon.ico', out),
    encodeICO([
      { size: 16, png: png(16) },
      { size: 32, png: png(32) },
      { size: 48, png: png(48) }
    ])
  )
  console.log('icons written: icon-192.png, icon-512.png, apple-touch-icon.png, favicon.ico')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}

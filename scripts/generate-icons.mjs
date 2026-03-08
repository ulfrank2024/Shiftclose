/**
 * Génère pwa-192x192.png et pwa-512x512.png pour ShiftClose
 * Aucune dépendance externe — pure Node.js (zlib intégré)
 * Usage : node scripts/generate-icons.mjs
 */

import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '..', 'frontend', 'public')

// ── CRC32 ────────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcInput = Buffer.concat([typeBytes, data])
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(crcInput))
  return Buffer.concat([len, typeBytes, data, crcBuf])
}

// ── Dessin du logo ShiftClose ─────────────────────────────────────────────────
// Retourne un tableau de pixels RGB [r, g, b, ...] pour width×height
function drawIcon(size) {
  const pixels = new Uint8Array(size * size * 3)
  const fill = (x, y, r, g, b) => {
    if (x < 0 || x >= size || y < 0 || y >= size) return
    const off = (y * size + x) * 3
    pixels[off] = r; pixels[off + 1] = g; pixels[off + 2] = b
  }

  // Fond sombre
  const BG = [15, 23, 42]       // #0f172a
  const BLUE = [59, 130, 246]   // #3b82f6
  const WHITE = [255, 255, 255]

  // Remplir fond
  for (let i = 0; i < size * size; i++) {
    pixels[i * 3] = BG[0]; pixels[i * 3 + 1] = BG[1]; pixels[i * 3 + 2] = BG[2]
  }

  // Carré bleu avec coins arrondis (radius = 22% du size)
  const pad = Math.round(size * 0.08)
  const r = Math.round(size * 0.22)
  const x0 = pad, y0 = pad, x1 = size - pad - 1, y1 = size - pad - 1

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      // Coin supérieur gauche
      let inRect = true
      if (x < x0 + r && y < y0 + r) {
        const dx = x - (x0 + r), dy = y - (y0 + r)
        inRect = dx * dx + dy * dy <= r * r
      }
      // Coin supérieur droit
      else if (x > x1 - r && y < y0 + r) {
        const dx = x - (x1 - r), dy = y - (y0 + r)
        inRect = dx * dx + dy * dy <= r * r
      }
      // Coin inférieur gauche
      else if (x < x0 + r && y > y1 - r) {
        const dx = x - (x0 + r), dy = y - (y1 - r)
        inRect = dx * dx + dy * dy <= r * r
      }
      // Coin inférieur droit
      else if (x > x1 - r && y > y1 - r) {
        const dx = x - (x1 - r), dy = y - (y1 - r)
        inRect = dx * dx + dy * dy <= r * r
      }
      if (inRect) fill(x, y, BLUE[0], BLUE[1], BLUE[2])
    }
  }

  // Lettre "S" stylisée — construite pixel par pixel relative au centre
  const cx = size / 2, cy = size / 2
  const sw = Math.round(size * 0.35)   // largeur de la lettre
  const sh = Math.round(size * 0.45)   // hauteur de la lettre
  const thick = Math.max(2, Math.round(size * 0.08))  // épaisseur des barres

  // S = trois barres horizontales + deux barres verticales (connectant)
  // Barre du haut
  for (let x = cx - sw / 2; x <= cx + sw / 2; x++)
    for (let t = 0; t < thick; t++)
      fill(Math.round(x), Math.round(cy - sh / 2 + t), WHITE[0], WHITE[1], WHITE[2])

  // Barre du milieu
  for (let x = cx - sw / 2; x <= cx + sw / 2; x++)
    for (let t = 0; t < thick; t++)
      fill(Math.round(x), Math.round(cy - thick / 2 + t), WHITE[0], WHITE[1], WHITE[2])

  // Barre du bas
  for (let x = cx - sw / 2; x <= cx + sw / 2; x++)
    for (let t = 0; t < thick; t++)
      fill(Math.round(x), Math.round(cy + sh / 2 - thick + t), WHITE[0], WHITE[1], WHITE[2])

  // Barre verticale gauche (milieu → bas)
  for (let y = cy; y <= cy + sh / 2; y++)
    for (let t = 0; t < thick; t++)
      fill(Math.round(cx - sw / 2 + t), Math.round(y), WHITE[0], WHITE[1], WHITE[2])

  // Barre verticale droite (haut → milieu)
  for (let y = cy - sh / 2; y <= cy; y++)
    for (let t = 0; t < thick; t++)
      fill(Math.round(cx + sw / 2 - thick + t), Math.round(y), WHITE[0], WHITE[1], WHITE[2])

  return pixels
}

// ── Construction du PNG ───────────────────────────────────────────────────────
function createPNG(size) {
  const pixels = drawIcon(size)

  // Signature PNG
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // color type: RGB
  // compression, filter, interlace = 0

  // Données brutes (filtre 0 par scanline)
  const raw = Buffer.alloc(size * (1 + size * 3))
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 3)] = 0  // filtre None
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 3
      const dst = y * (1 + size * 3) + 1 + x * 3
      raw[dst] = pixels[src]
      raw[dst + 1] = pixels[src + 1]
      raw[dst + 2] = pixels[src + 2]
    }
  }

  const idat = deflateSync(raw, { level: 6 })

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0))
  ])
}

// ── Export ────────────────────────────────────────────────────────────────────
mkdirSync(OUTPUT_DIR, { recursive: true })

for (const size of [192, 512]) {
  const path = join(OUTPUT_DIR, `pwa-${size}x${size}.png`)
  writeFileSync(path, createPNG(size))
  console.log(`✅ Généré : pwa-${size}x${size}.png (${(createPNG(size).length / 1024).toFixed(1)} KB)`)
}

console.log('\n🎉 Icônes PWA prêtes dans frontend/public/')

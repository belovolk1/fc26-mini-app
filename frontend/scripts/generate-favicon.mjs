/**
 * Генерирует favicon.ico из public/Logo.svg.
 * Запуск: node scripts/generate-favicon.mjs
 * Требует: npm i -D sharp to-ico
 */
import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const toIco = require('to-ico')
const sharp = (await import('sharp')).default

const root = join(__dirname, '..')
const svgPath = join(root, 'public', 'Logo.svg')
const outPath = join(root, 'public', 'favicon.ico')

const svg = readFileSync(svgPath)
const sizes = [16, 32]
const pngBuffers = await Promise.all(
  sizes.map((size) =>
    sharp(svg).resize(size, size).png().toBuffer()
  )
)
const ico = await toIco(pngBuffers)
writeFileSync(outPath, ico)
console.log('Written', outPath)

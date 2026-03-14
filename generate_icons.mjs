// Exécute : node generate_icons.mjs
// Génère public/icons/icon-192.png et icon-512.png
// Nécessite : npm install sharp

import sharp from 'sharp'
import { mkdir } from 'fs/promises'

await mkdir('./public/icons', { recursive: true })

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#0d0d1a"/>
  <rect x="10" y="10" width="80" height="80" rx="16" fill="url(#g)"/>
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6ee7b7"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>
  <text x="50" y="62" font-family="system-ui" font-size="42" font-weight="900"
    text-anchor="middle" fill="#0d0d1a">S</text>
</svg>`

const buf = Buffer.from(svg)
await sharp(buf).resize(192, 192).png().toFile('./public/icons/icon-192.png')
await sharp(buf).resize(512, 512).png().toFile('./public/icons/icon-512.png')
console.log('✅ Icônes générées dans public/icons/')

// Deterministic sample dataset: regional retail sales (includes a few blanks + a duplicate row for the quality demo)
const regions = ['North', 'South', 'East', 'West']
const products = [
  ['Laptop Pro 14', 'Electronics', 1200], ['Wireless Mouse', 'Accessories', 35], ['Standing Desk', 'Furniture', 480],
  ['4K Monitor', 'Electronics', 420], ['Ergo Chair', 'Furniture', 310], ['USB-C Hub', 'Accessories', 60],
  ['Noise-Cancel Headset', 'Electronics', 220], ['Webcam HD', 'Accessories', 90],
]
const channels = ['Online', 'Retail Store', 'Partner']
let seed = 42
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)

const lines = ['Date,Region,Product,Category,Channel,Units,Revenue,Profit']
for (let i = 0; i < 120; i++) {
  const month = (i % 12) + 1
  const day = 1 + Math.floor(rnd() * 27)
  const [name, cat, price] = products[Math.floor(rnd() * products.length)]
  const units = 1 + Math.floor(rnd() * 20)
  const revenue = Math.round(units * price * (0.9 + rnd() * 0.2))
  const profit = Math.round(revenue * (0.12 + rnd() * 0.25))
  const region = regions[Math.floor(rnd() * 4)]
  const channel = i % 17 === 0 ? '' : channels[Math.floor(rnd() * 3)]
  const date = `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  lines.push([date, region, name, cat, channel, units, i % 23 === 0 ? '' : revenue, profit].join(','))
}
lines.push(lines[5])
export const SAMPLE_CSV = lines.join('\n')

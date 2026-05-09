/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { reactive, ref, computed } from 'vue'
import LZString from 'lz-string'

/* ─── Font constants ─────────────────────────────────────────────────────── */
const FONT_JAPANESE = "'M PLUS 1p', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif"
const FONT_HELVETICA = "'Helvetica', 'Arial', sans-serif"
const FONT_FRUTIGER = "'Cabin', 'Open Sans', 'Lato', sans-serif"
const FONT_CHINESE = "'Noto Sans SC', sans-serif"
const FONT_KOREAN = "'Noto Sans KR', sans-serif"

/* ─── Types ──────────────────────────────────────────────────────────────── */
export interface Numbering { text: string; color: string }

export interface SideStation {
  name: { kanji: string; english: string }
  lineColor: string
  go: boolean
  numberings: Numbering[]
}

export interface MainStation {
  name: { kanji: string; english: string; kana: string; chinese: string; korean: string }
  enableTlc: boolean
  tlc: string
  numberings: Numbering[]
}

export interface CityNotation { text: string; fill: boolean }

export interface SignState {
  signType: string
  signBoard: { type: string; light: boolean; showFrame: boolean }
  numbering: boolean
  branchRight: boolean
  branchLeft: boolean
  black: string
  sta: MainStation
  rightStations: SideStation[]
  leftStations: SideStation[]
  cityNotations: CityNotation[]
  routeColors: string[]
}

export interface McExportSettings { enabled: boolean; cols: number; rows: number }

interface FramePadding { top: number; bottom: number; left: number; right: number }
interface FrameDef { padding: FramePadding; width: number; height: number }

/* ─── Color presets ──────────────────────────────────────────────────────── */
export const NUMBERING_COLORS = [
  { color: '#F0862B', ja: '東海道線', zh: '东海道线' },
  { color: '#1069B4', ja: '横須賀・総武快速線', zh: '横须贺・总武快速线' },
  { color: '#1DAED1', ja: '京浜東北・根岸線', zh: '京浜东北・根岸线' },
  { color: '#B3CC36', ja: '山手線', zh: '山手线' },
  { color: '#DD6935', ja: '中央線快速・青梅線・五日市線', zh: '中央线快速' },
  { color: '#F2D01F', ja: '中央・総武線各駅停車', zh: '中央总武线各站停车' },
  { color: '#F18E41', ja: '宇都宮線・高崎線', zh: '宇都宫线・高崎线' },
  { color: '#14A676', ja: '埼京線', zh: '埼京线' },
  { color: '#1DAF7E', ja: '常磐線快速', zh: '常磐线快速' },
  { color: '#868587', ja: '常磐線各駅停車', zh: '常磐线各站停车' },
  { color: '#D01827', ja: '京葉線', zh: '京叶线' },
  { color: '#DB2027', ja: '湘南新宿ライン', zh: '湘南新宿线' },
  { color: '#B1CB39', ja: '横浜線', zh: '横滨线' },
  { color: '#EB5A28', ja: '武蔵野線', zh: '武藏野线' },
]

export const ROUTE_COLORS = [
  { color: '#80C241', ja: '山手線', zh: '山手线' },
  { color: '#00B48D', ja: '埼京線・川越線', zh: '埼京线・川越线' },
  { color: '#00B2E5', ja: '京浜東北・根岸線', zh: '京浜东北・根岸线' },
  { color: '#F15A22', ja: '中央線快速・青梅線・五日市線', zh: '中央线快速' },
  { color: '#FFD400', ja: '中央総武線各駅停車', zh: '中央总武线各站停车' },
  { color: '#00B261', ja: '常磐線・成田線', zh: '常磐线・成田线' },
  { color: '#C9242F', ja: '京葉線', zh: '京叶线' },
  { color: '#F15A22', ja: '武蔵野線', zh: '武藏野线' },
  { color: '#FFD400', ja: '南武線', zh: '南武线' },
  { color: '#80C241', ja: '横浜線', zh: '横滨线' },
  { color: '#009793', ja: '相模線', zh: '相模线' },
  { color: '#A8A39D', ja: '八高線・川越線', zh: '八高线' },
  { color: '#F68B1E', ja: '東海道線', zh: '东海道线' },
  { color: '#007AC0', ja: '横須賀・総武快速線', zh: '横须贺线' },
  { color: '#00B9F1', ja: '内房線', zh: '内房线' },
  { color: '#DB4028', ja: '外房線', zh: '外房线' },
  { color: '#880022', ja: '日光線', zh: '日光线' },
  { color: '#339966', ja: '烏山線', zh: '乌山线' },
]

/* ─── Default data ───────────────────────────────────────────────────────── */
const defaultData = (): SignState => ({
  signType: 'jre-kanji',
  signBoard: { type: 'SE-7', light: false, showFrame: true },
  numbering: true,
  branchRight: false,
  branchLeft: false,
  black: '#1A1A1A',
  sta: {
    name: { kanji: '新宿', english: 'Shinjuku', kana: 'しんじゅく', chinese: '新宿', korean: '신주쿠' },
    enableTlc: true,
    tlc: 'SJK',
    numberings: [{ text: 'JY 17', color: '#72C11D' }],
  },
  rightStations: [
    { name: { kanji: '新大久保', english: 'Shin-Ōkubo' }, lineColor: '#006400', go: false, numberings: [{ text: 'JY 16', color: '#72C11D' }] },
    { name: { kanji: '', english: '' }, lineColor: '#006400', go: false, numberings: [] },
  ],
  leftStations: [
    { name: { kanji: '代々木', english: 'Yoyogi' }, lineColor: '#006400', go: true, numberings: [{ text: 'JY 18', color: '#72C11D' }] },
    { name: { kanji: '', english: '' }, lineColor: '#006400', go: false, numberings: [] },
  ],
  cityNotations: [{ text: '山', fill: false }, { text: '区', fill: true }],
  routeColors: ['#80C241'],
})

/* ─── Serialization (desig1 format) ─────────────────────────────────────── */
const desig1 = {
  stringify(data: SignState): string {
    const sl = (s: string) => s.length + ':' + s
    const sn = (ns: Numbering[]) =>
      ns.length + ':' + ns.map(n => n.text + ',' + n.color.slice(1) + ';').join('')
    let r = ''
    r += data.signType + ','
    r += data.signBoard.type + ','
    r += data.signBoard.light ? '1' : '0'
    r += data.signBoard.showFrame ? '1' : '0'
    r += data.numbering ? '1' : '0'
    r += data.branchRight ? '1' : '0'
    r += data.branchLeft ? '1' : '0'
    r += data.black.slice(1)
    r += sl(data.sta.name.kanji) + sl(data.sta.name.english) + sl(data.sta.name.kana)
    if (data.numbering) {
      r += sl(data.sta.name.chinese) + sl(data.sta.name.korean)
      r += data.sta.enableTlc ? '1' + data.sta.tlc : '0'
      r += sn(data.sta.numberings)
    }
    const ss = (s: SideStation) => {
      r += sl(s.name.kanji) + sl(s.name.english) + s.lineColor.slice(1) + (s.go ? '1' : '0')
      if (data.numbering && s.go) r += sn(s.numberings)
    }
    ss(data.rightStations[0]!); if (data.branchRight) ss(data.rightStations[1]!)
    ss(data.leftStations[0]!); if (data.branchLeft) ss(data.leftStations[1]!)
    r += data.cityNotations.length + ':' + data.cityNotations.map(n => n.text + (n.fill ? '1' : '0')).join('')
    r += data.routeColors.length + ':' + data.routeColors.map(c => c.slice(1)).join('')
    return r
  },

  parse(str: string): SignState {
    let cur = 0
    const pls = (_pos: number) => {
      const colon = str.indexOf(':', cur)
      const len = +str.slice(cur, colon)
      cur = colon + len + 1
      return str.substr(colon + 1, len)
    }
    const pns = (): Numbering[] => {
      const colon = str.indexOf(':', cur)
      const len = +str.slice(cur, colon)
      const res: Numbering[] = []
      cur = colon + 1
      for (let i = 0; i < len; i++) {
        const sc = str.indexOf(';', cur)
        const [text, color] = str.slice(cur, sc).split(',') as [string, string]
        res.push({ text, color: '#' + color })
        cur = sc + 1
      }
      return res
    }
    const d = defaultData()
    const p1 = str.indexOf(','); d.signType = str.slice(0, p1); cur = p1 + 1
    const p2 = str.indexOf(',', cur); d.signBoard.type = str.slice(cur, p2); cur = p2 + 1
    d.signBoard.light = !!+(str[cur] ?? '0')
    d.signBoard.showFrame = !!+(str[++cur] ?? '1')
    const numbering = !!+(str[++cur] ?? '0'); d.numbering = numbering
    const branchRight = !!+(str[++cur] ?? '0'); d.branchRight = branchRight
    const branchLeft = !!+(str[++cur] ?? '0'); d.branchLeft = branchLeft
    d.black = '#' + str.substr(++cur, 6); cur += 6
    d.sta.name.kanji = pls(cur); d.sta.name.english = pls(cur); d.sta.name.kana = pls(cur)
    if (numbering) {
      d.sta.name.chinese = pls(cur); d.sta.name.korean = pls(cur)
      const tlc = !!+(str[cur++] ?? '0'); d.sta.enableTlc = tlc
      if (tlc) { d.sta.tlc = str.substr(cur, 3); cur += 3 } else { d.sta.tlc = '' }
      d.sta.numberings = pns()
    } else {
      d.sta.name.chinese = ''; d.sta.name.korean = ''
      d.sta.enableTlc = false; d.sta.tlc = ''; d.sta.numberings = []
    }
    const ss = (s: SideStation) => {
      s.name.kanji = pls(cur); s.name.english = pls(cur)
      s.lineColor = '#' + str.substr(cur, 6); cur += 6
      s.go = !!+(str[cur++] ?? '0')
      s.numberings = (numbering && s.go) ? pns() : []
    }
    ss(d.rightStations[0]!); if (branchRight) ss(d.rightStations[1]!)
    ss(d.leftStations[0]!); if (branchLeft) ss(d.leftStations[1]!)
    d.cityNotations = []
    const cc = str.indexOf(':', cur); const cl = +str.slice(cur, cc); cur = cc + 1
    for (let i = 0; i < cl; i++) { d.cityNotations.push({ text: str[cur] ?? '', fill: !!+(str[cur + 1] ?? '0') }); cur += 2 }
    d.routeColors = []
    const rc = str.indexOf(':', cur); const rl = +str.slice(cur, rc); cur = rc + 1
    for (let i = 0; i < rl; i++) { d.routeColors.push('#' + str.substr(cur, 6)); cur += 6 }
    return d
  },
}

/* ─── Canvas utilities ───────────────────────────────────────────────────── */
const ZERO_PADDING: FramePadding = { top: 0, bottom: 0, left: 0, right: 0 }
const effectivePadding = (fp: FramePadding, showFrame: boolean): FramePadding =>
  showFrame ? fp : ZERO_PADDING

const contain = (w1: number, h1: number, w2: number, h2: number) => {
  const r1 = w1 / h1, r2 = w2 / h2
  return r1 > r2 ? { width: r2 * h1, height: h1 } : { width: w1, height: w1 / r2 }
}

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath()
  ctx.moveTo(x, y + r)
  ctx.arcTo(x, y, x + w - r, y, r)
  ctx.arcTo(x + w, y, x + w, y + h - r, r)
  ctx.arcTo(x + w, y + h, x + r, y + h, r)
  ctx.arcTo(x, y + h, x, y + r, r)
  ctx.closePath()
}

/* ─── Frame definitions ──────────────────────────────────────────────────── */
const FRAMES: Record<string, FrameDef> = {
  'SE-6': { padding: { top: 80, bottom: 30, left: 35, right: 35 }, width: 1830, height: 490 },
  'SE-7': { padding: { top: 80, bottom: 30, left: 35, right: 35 }, width: 2410, height: 490 },
  'SE-8': { padding: { top: 80, bottom: 30, left: 40, right: 40 }, width: 3620, height: 490 },
}

/* ─── SE frame drawing ───────────────────────────────────────────────────── */
function drawFrame(
  ctx: CanvasRenderingContext2D,
  fw: number, fh: number,
  data: SignState,
  fp: FramePadding,
) {
  if (data.signBoard.showFrame) {
    ctx.fillStyle = '#333'
    ctx.fillRect(0, 0, fw, fh)
    ctx.beginPath()
    ctx.moveTo(6, fh); ctx.lineTo(6, 6); ctx.lineTo(fw - 6, 6); ctx.lineTo(fw - 6, fh)
    ctx.lineWidth = 2; ctx.strokeStyle = '#1A1A1A'; ctx.stroke()
    ctx.beginPath(); ctx.moveTo(10, 6); ctx.lineTo(10, fp.top); ctx.lineWidth = 1; ctx.stroke()
    ctx.beginPath(); ctx.moveTo(fw - 10, 6); ctx.lineTo(fw - 10, fp.top); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(6, fp.top); ctx.lineTo(fw - 6, fp.top); ctx.stroke()
    const bGrad = ctx.createLinearGradient(0, fh, 0, fh - 8)
    bGrad.addColorStop(0, 'rgba(0,0,0,.5)'); bGrad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = bGrad; ctx.fillRect(7, fh - 8, fw - 14, 8)
    ctx.shadowColor = '#000'; ctx.shadowBlur = 5
    ctx.fillStyle = '#333'; ctx.fillRect(10, fh - fp.bottom, fw - 20, 10)
    ctx.shadowColor = 'rgba(0,0,0,0)'; ctx.shadowBlur = 0
  }
  ctx.fillStyle = data.signBoard.light ? '#F0F8FF' : '#EEE'
  ctx.fillRect(fp.left, fp.top, fw - fp.left - fp.right, fh - fp.top - fp.bottom)
}

function drawFrameShadow(
  ctx: CanvasRenderingContext2D,
  fw: number, fh: number,
  fp: FramePadding,
) {
  const width = fw - fp.left - fp.right
  const height = fh - fp.top - fp.bottom
  const tmp1 = document.createElement('canvas')
  const tCtx1 = tmp1.getContext('2d')!
  tmp1.width = width; tmp1.height = height
  tCtx1.fillStyle = '#FFF'; tCtx1.fillRect(0, 0, width, height)
  tCtx1.shadowColor = '#000'; tCtx1.shadowBlur = 40; tCtx1.shadowOffsetY = height
  tCtx1.fillStyle = 'rgba(0,0,0,.5)'; tCtx1.fillRect(30, 30 - height, width - 60, height - 60)
  tCtx1.shadowBlur = 100
  tCtx1.beginPath()
  tCtx1.moveTo(100, 100 - height); tCtx1.lineTo(width - 100, 100 - height)
  tCtx1.lineTo(width - 200, -200); tCtx1.lineTo(200, -200); tCtx1.closePath(); tCtx1.fill()
  const tmp2 = document.createElement('canvas')
  const tCtx2 = tmp2.getContext('2d')!
  tmp2.width = width; tmp2.height = height
  tCtx2.fillStyle = '#000'; tCtx2.fillRect(0, 0, width, height)
  const img1 = tCtx1.getImageData(0, 0, width, height)
  const img2 = tCtx2.getImageData(0, 0, width, height)
  for (let i = 0, len = width * height; i < len; i++)
    (img2.data as Uint8ClampedArray)[i * 4 + 3] = ((img1.data as Uint8ClampedArray)[i * 4]! - 63) * 0.2
  tCtx2.putImageData(img2, 0, 0)
  ctx.drawImage(tmp2, fp.left, fp.top)
}

/* ─── Content drawing: JR East kanji-style ──────────────────────────────── */
function drawJreKanji(
  colorCtx: CanvasRenderingContext2D,
  maskCtx: CanvasRenderingContext2D,
  data: SignState,
) {
  const frame = FRAMES[data.signBoard.type]!
  const { width, height } = frame
  const hw = width / 2
  const hw_floor = Math.floor(hw)
  const hw_ceil = Math.ceil(hw)

  const lineY = height / 2 + 80
  const lineHeight = 100
  const lineHeight_ceil = Math.ceil(lineHeight)
  const lineTop = lineY - lineHeight / 2
  const lineTop_floor = Math.floor(lineTop)
  const lineBottom = lineY + lineHeight / 2
  const branchStart = Math.min(620, hw - lineHeight)

  /* ── Band shape (mask) ── */
  maskCtx.beginPath()

  if (data.branchRight) {
    maskCtx.moveTo(width - branchStart, lineTop)
    maskCtx.lineTo(width - branchStart + 65, lineTop - 65)
    if (data.rightStations[0]!.go) {
      maskCtx.lineTo(width - 130, lineTop - 65)
      maskCtx.lineTo(width - 50, lineTop - 25)
      maskCtx.lineTo(width - 130, lineTop + 12)
    } else {
      maskCtx.lineTo(width, lineTop - 65)
      maskCtx.lineTo(width, lineTop + 12)
    }
    maskCtx.lineTo(width - branchStart + 100, lineTop + 12)
    maskCtx.lineTo(width - branchStart + 60, lineY)
    maskCtx.lineTo(width - branchStart + 100, lineBottom - 12)
    if (data.rightStations[1]!.go) {
      maskCtx.lineTo(width - 130, lineBottom - 12)
      maskCtx.lineTo(width - 50, lineBottom + 25)
      maskCtx.lineTo(width - 130, lineBottom + 65)
    } else {
      maskCtx.lineTo(width, lineBottom - 12)
      maskCtx.lineTo(width, lineBottom + 65)
    }
    maskCtx.lineTo(width - branchStart + 65, lineBottom + 65)
    maskCtx.lineTo(width - branchStart, lineBottom)
  } else if (data.rightStations[0]!.go) {
    maskCtx.moveTo(width - 160, lineTop)
    maskCtx.lineTo(width - 65, lineY)
    maskCtx.lineTo(width - 160, lineBottom)
  } else {
    maskCtx.moveTo(width, lineTop)
    maskCtx.lineTo(width, lineBottom)
  }

  if (data.branchLeft) {
    maskCtx.lineTo(branchStart, lineBottom)
    maskCtx.lineTo(branchStart - 65, lineBottom + 65)
    if (data.leftStations[1]!.go) {
      maskCtx.lineTo(130, lineBottom + 65)
      maskCtx.lineTo(50, lineBottom + 25)
      maskCtx.lineTo(130, lineBottom - 12)
    } else {
      maskCtx.lineTo(0, lineBottom + 65)
      maskCtx.lineTo(0, lineBottom - 12)
    }
    maskCtx.lineTo(branchStart - 100, lineBottom - 12)
    maskCtx.lineTo(branchStart - 60, lineY)
    maskCtx.lineTo(branchStart - 100, lineTop + 12)
    if (data.leftStations[0]!.go) {
      maskCtx.lineTo(130, lineTop + 12)
      maskCtx.lineTo(50, lineTop - 25)
      maskCtx.lineTo(130, lineTop - 65)
    } else {
      maskCtx.lineTo(0, lineTop + 12)
      maskCtx.lineTo(0, lineTop - 65)
    }
    maskCtx.lineTo(branchStart - 65, lineTop - 65)
    maskCtx.lineTo(branchStart, lineTop)
  } else if (data.leftStations[0]!.go) {
    maskCtx.lineTo(160, lineBottom)
    maskCtx.lineTo(65, lineY)
    maskCtx.lineTo(160, lineTop)
  } else {
    maskCtx.lineTo(0, lineBottom)
    maskCtx.lineTo(0, lineTop)
  }

  maskCtx.closePath()
  maskCtx.fill()

  /* ── Color fills for the band ── */
  if (data.branchRight) {
    colorCtx.fillStyle = data.rightStations[0]!.lineColor
    colorCtx.fillRect(hw_floor, lineTop_floor - 65, hw_ceil, 65 + lineHeight_ceil / 2)
    colorCtx.fillStyle = data.rightStations[1]!.lineColor
    colorCtx.fillRect(hw_floor, lineY, hw_ceil, 65 + lineHeight_ceil / 2)
  } else {
    colorCtx.fillStyle = data.rightStations[0]!.lineColor
    colorCtx.fillRect(hw_floor, lineTop_floor, hw_ceil, lineHeight_ceil)
  }
  if (data.branchLeft) {
    colorCtx.fillStyle = data.leftStations[0]!.lineColor
    colorCtx.fillRect(0, lineTop_floor - 65, hw, 65 + lineHeight_ceil / 2)
    colorCtx.fillStyle = data.leftStations[1]!.lineColor
    colorCtx.fillRect(0, lineY, hw, 65 + lineHeight_ceil / 2)
  } else {
    colorCtx.fillStyle = data.leftStations[0]!.lineColor
    colorCtx.fillRect(0, lineTop_floor, hw, lineHeight_ceil)
  }

  /* Route colors at center */
  const routeLen = data.routeColors.length
  const rh = lineHeight / routeLen
  const rx = hw - lineHeight / 2
  for (let i = 0; i < routeLen; i++) {
    colorCtx.fillStyle = data.routeColors[i]!
    colorCtx.fillRect(rx, i ? lineTop + rh * i : lineTop_floor, lineHeight, Math.ceil(rh))
  }

  /* ── Text helpers ── */
  const drawText = (opts: {
    x: number; y: number; text: string; weight?: string
    size: number; font: string; maxWidth?: number; align?: CanvasTextAlign
  }): number => {
    const { x, y, text, weight, size, font, maxWidth, align } = opts
    maskCtx.textAlign = align || 'center'
    maskCtx.font = `${weight || ''} ${size}px ${font}`
    maskCtx.fillText(text, x, y, maxWidth)
    colorCtx.fillStyle = data.black
    const tw = Math.min(maxWidth ?? Infinity, maskCtx.measureText(text).width)
    const bx = align === 'left' ? x : align === 'right' ? x - tw : x - tw / 2
    colorCtx.fillRect(bx, y - size, tw, size * 1.22)
    maskCtx.textAlign = 'center'
    return tw
  }

  const insertSpace = (text: string, spaces: string[]) =>
    text.split('').join(spaces[text.length - 2] || '')

  const drawNumbering = (x: number, y: number, size: number, text: string, color: string, tlc?: boolean) => {
    const r = size * 0.1
    const inner = size - 2 * r
    const route = (text.match(/[A-Z]+/g) ?? ['?'])[0]
    const number = (text.match(/[0-9]{2,}/g) ?? ['00'])[0]
    if (tlc) {
      roundRect(colorCtx, x, y, size, size, r)
      colorCtx.fillStyle = color; colorCtx.fill()
    } else {
      colorCtx.fillStyle = color
      colorCtx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(size) + 1, Math.ceil(size) + 1)
      roundRect(maskCtx, x, y, size, size, r); maskCtx.fill()
    }
    maskCtx.fillStyle = '#000'; maskCtx.fillRect(x + r, y + r, inner, inner)
    maskCtx.fillStyle = '#FFF'
    colorCtx.fillStyle = data.black
    colorCtx.fillRect(Math.ceil(x + r) + 2, Math.ceil(y + r) + 2, Math.floor(inner) - 4, Math.floor(inner) - 4)
    maskCtx.textAlign = 'center'
    maskCtx.font = `bold ${r * 3}px ${FONT_FRUTIGER}`
    maskCtx.fillText(route, x + size / 2, y + 4 * r, inner * 0.9)
    maskCtx.font = `bold ${r * 4.4}px ${FONT_FRUTIGER}`
    maskCtx.fillText(number, x + size / 2, y + 8 * r, inner * 0.9)
  }

  /* ── Main station name ── */
  const kanjiWidth = drawText({
    x: hw, y: lineTop - 120,
    text: insertSpace(data.sta.name.kanji, ['　', ' ']),
    weight: '800', size: 150, font: FONT_JAPANESE,
  })
  drawText({ x: hw, y: lineTop - 40, text: data.sta.name.kana, weight: '800', size: 50, font: FONT_JAPANESE })
  const englishWidth = drawText({ x: hw, y: lineBottom + 80, text: data.sta.name.english, weight: 'bold', size: 65, font: FONT_HELVETICA })

  /* ── 4-language + numbering ── */
  if (data.numbering) {
    drawText({ x: hw + kanjiWidth / 2 + 65, y: lineTop - 195, text: data.sta.name.chinese, size: 50, font: FONT_CHINESE, align: 'left' })
    drawText({ x: hw + kanjiWidth / 2 + 65, y: lineTop - 120, text: data.sta.name.korean, size: 50, font: FONT_KOREAN, align: 'left' })

    const tlc = data.sta.enableTlc
    const nbLen = data.sta.numberings.length
    const tlcX = Math.max(25, hw - kanjiWidth / 2 - 80 - 183.6 * nbLen)
    const sc = (tlcX < branchStart - 50) && data.branchLeft && tlc ? 1.2 : 1.5

    if (tlc) {
      const ty = lineTop - 250
      const bw = (108 * nbLen + 8) * sc
      const bh = 142 * sc
      colorCtx.fillStyle = data.black
      colorCtx.fillRect(Math.floor(tlcX), Math.floor(ty), Math.ceil(bw) + 1, Math.ceil(bh) + 1)
      roundRect(maskCtx, tlcX, ty, bw, bh, 18 * sc); maskCtx.fill()
      maskCtx.font = `bold ${32 * sc}px ${FONT_FRUTIGER}`
      maskCtx.fillStyle = '#000'
      maskCtx.fillText(data.sta.tlc, tlcX + bw / 2, ty + 30 * sc)
      maskCtx.fillStyle = '#FFF'
    }
    for (let i = 0; i < nbLen; i++) {
      const i_ = nbLen - i - 1
      const n = data.sta.numberings[i_]!
      drawNumbering(tlcX + 8 * sc + 108 * sc * i_, lineTop - (tlc ? 250 - 34 * sc : 250), 100 * sc, n.text, n.color, tlc)
    }
  }

  /* ── Side stations ── */
  const sideStation = (branch: boolean, stations: SideStation[], align: CanvasTextAlign) => {
    const isRight = align === 'right'
    const cxw = isRight ? (v: number) => width - v : (v: number) => v
    for (let i = 0, len = branch ? 2 : 1; i < len; i++) {
      const s = stations[i]!
      const x = cxw(branch ? 130 : s.go ? 200 : 80)
      const maxWidth = Math.min(
        Math.abs(x - (isRight ? hw + englishWidth / 2 : hw - englishWidth / 2)) - 20,
        branch ? Math.abs(x - (isRight ? width - branchStart + 100 : branchStart - 100)) : Infinity,
      )
      maskCtx.fillStyle = '#000'
      maskCtx.textAlign = align
      maskCtx.textBaseline = 'middle'
      maskCtx.font = `500 ${branch ? 60 : s.go ? 80 : 70}px ${FONT_JAPANESE}`
      const branchY = ([lineTop - 25, lineBottom + 25] as [number, number])[i as 0 | 1]!
      maskCtx.fillText(insertSpace(s.name.kanji, [' ']), x, branch ? branchY : lineY, maxWidth)
      maskCtx.fillStyle = '#FFF'
      maskCtx.textBaseline = 'alphabetic'
      drawText({
        x, y: branch ? branchY + 80 : lineBottom + 70,
        text: s.name.english, size: branch ? 40 : 55, font: FONT_HELVETICA, align, maxWidth,
      })
      const nSize = branch ? 50 : 80
      for (let j = 0; data.numbering && s.go && j < s.numberings.length; j++) {
        const n = s.numberings[j]!
        drawNumbering(
          cxw(branch ? 120 : 180) + nSize * 1.08 * j + (isRight ? 0 : -nSize * 1.08 * s.numberings.length),
          branch ? branchY + 36 : lineBottom + 15,
          nSize, n.text, n.color,
        )
      }
    }
  }

  sideStation(data.branchRight, data.rightStations, 'right')
  sideStation(data.branchLeft, data.leftStations, 'left')
  maskCtx.textAlign = 'center'

  /* ── City notations ── */
  maskCtx.lineWidth = 4
  for (let i = 0, len = data.cityNotations.length; i < len; i++) {
    const n = data.cityNotations[len - i - 1]!
    const x = width - 160 - 100 * i
    const y = lineTop - (n.fill ? 230 : 228)
    colorCtx.fillStyle = data.black
    colorCtx.fillRect(Math.floor(x) - 3, Math.floor(y) - 3, 86, 86)
    roundRect(maskCtx, x, y, 80, 80, n.fill ? 8 : 7)
    maskCtx[n.fill ? 'fill' : 'stroke']()
    maskCtx.fillStyle = n.fill ? '#000' : '#FFF'
    maskCtx.font = `bold 70px ${FONT_JAPANESE}`
    maskCtx.fillText(n.text, x + 40, y + 65, 75)
  }
}

/* ─── Composite draw function ───────────────────────────────────────────── */
function draw(ctx: CanvasRenderingContext2D, width: number, height: number, data: SignState) {
  const frame = FRAMES[data.signBoard.type]!
  const fp = effectivePadding(frame.padding, data.signBoard.showFrame)
  const fw = width + fp.left + fp.right
  const fh = height + fp.top + fp.bottom

  drawFrame(ctx, fw, fh, data, fp)
  ctx.shadowColor = 'rgba(0,0,0,0)'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0

  const colorCanvas = document.createElement('canvas')
  const maskCanvas = document.createElement('canvas')
  colorCanvas.width = width; colorCanvas.height = height
  maskCanvas.width = width; maskCanvas.height = height

  const colorCtx = colorCanvas.getContext('2d')!
  const maskCtx = maskCanvas.getContext('2d')!
  maskCtx.fillStyle = '#000'; maskCtx.fillRect(0, 0, width, height)
  maskCtx.fillStyle = '#FFF'; maskCtx.strokeStyle = '#FFF'

  drawJreKanji(colorCtx, maskCtx, data)

  const colorImg = colorCtx.getImageData(0, 0, width, height)
  const maskImg = maskCtx.getImageData(0, 0, width, height)
  const cData = colorImg.data
  const mData = maskImg.data
  for (let i = 0, len = width * height; i < len; i++)
    (cData as Uint8ClampedArray)[i * 4 + 3] = (mData as Uint8ClampedArray)[i * 4]!
  colorCtx.putImageData(colorImg, 0, 0)
  ctx.drawImage(colorCanvas, fp.left, fp.top)

  if (data.signBoard.light) drawFrameShadow(ctx, fw, fh, fp)
}

/* ─── Composable ─────────────────────────────────────────────────────────── */
export function useSignGenerator() {
  const state = reactive<SignState>(defaultData())
  const mcExport = reactive<McExportSettings>({ enabled: false, cols: 3, rows: 2 })
  const shareURL = ref('')
  const fontLoad = reactive({ japanese: false, chinese: false, korean: false })
  const macrons = ['Ā', 'Ē', 'Ī', 'Ō', 'Ū', 'ā', 'ē', 'ī', 'ō', 'ū']

  const enableBoardLight = computed(() =>
    state.signBoard.type.startsWith('SE') || state.signBoard.type.charAt(0) === 'B',
  )

  const mcTotalWidth = computed(() => mcExport.cols * 128)
  const mcTotalHeight = computed(() => mcExport.rows * 128)

  function reset() {
    const d = defaultData()
    Object.assign(state, d)
    // deep assign nested objects
    Object.assign(state.signBoard, d.signBoard)
    Object.assign(state.sta, d.sta)
    Object.assign(state.sta.name, d.sta.name)
    state.sta.numberings = d.sta.numberings.map(n => ({ ...n }))
    state.rightStations = d.rightStations.map(s => ({ ...s, name: { ...s.name }, numberings: s.numberings.map(n => ({ ...n })) }))
    state.leftStations = d.leftStations.map(s => ({ ...s, name: { ...s.name }, numberings: s.numberings.map(n => ({ ...n })) }))
    state.cityNotations = d.cityNotations.map(c => ({ ...c }))
    state.routeColors = [...d.routeColors]
  }

  function update(canvas: HTMLCanvasElement) {
    const frame = FRAMES[state.signBoard.type]!
    const fp = effectivePadding(frame.padding, state.signBoard.showFrame)
    const fw = frame.width + fp.left + fp.right
    const fh = frame.height + fp.top + fp.bottom
    const container = canvas.parentElement ?? document.body
    const maxW = container.clientWidth || 800
    const maxH = Math.max(300, window.innerHeight * 0.45)
    const { width: _cw, height: _ch } = contain(maxW, maxH, fw, fh)
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.floor(_cw) * dpr
    canvas.height = Math.floor(_ch) * dpr
    canvas.style.width = _cw + 'px'
    canvas.style.height = _ch + 'px'
    const ctx = canvas.getContext('2d')!
    const scale = canvas.width / fw
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    draw(ctx, frame.width, frame.height, state)
    try {
      localStorage.setItem('lastSaved', LZString.compressToEncodedURIComponent(desig1.stringify(state)))
    } catch { /* ignore */ }
  }

  function saveAsPNG() {
    const c = document.createElement('canvas')
    const frame = FRAMES[state.signBoard.type]!
    const fp = effectivePadding(frame.padding, state.signBoard.showFrame)
    c.width = frame.width + fp.left + fp.right
    c.height = frame.height + fp.top + fp.bottom
    draw(c.getContext('2d')!, frame.width, frame.height, state)
    const a = document.createElement('a')
    a.download = '駅名標_' + state.sta.name.kanji + '.png'
    a.href = c.toDataURL()
    a.dispatchEvent(new MouseEvent('click'))
  }

  function exportForMinecraft(cols: number, rows: number) {
    const frame = FRAMES[state.signBoard.type]!
    const fp = effectivePadding(frame.padding, state.signBoard.showFrame)
    const signW = frame.width + fp.left + fp.right
    const signH = frame.height + fp.top + fp.bottom
    const totalW = cols * 128
    const totalH = rows * 128

    const tmpC = document.createElement('canvas')
    tmpC.width = signW; tmpC.height = signH
    draw(tmpC.getContext('2d')!, frame.width, frame.height, state)

    const { width: fitW, height: fitH } = contain(totalW, totalH, signW, signH)
    const offsetX = Math.round((totalW - fitW) / 2)
    const offsetY = Math.round((totalH - fitH) / 2)

    const outC = document.createElement('canvas')
    outC.width = totalW; outC.height = totalH
    const bgColor = state.signBoard.showFrame ? '#333' : (state.signBoard.light ? '#F0F8FF' : '#EEE')
    const outCtx = outC.getContext('2d')!
    outCtx.fillStyle = bgColor; outCtx.fillRect(0, 0, totalW, totalH)
    outCtx.drawImage(tmpC, offsetX, offsetY, fitW, fitH)

    const a = document.createElement('a')
    a.download = `駅名標_MC_${cols}x${rows}_${state.sta.name.kanji}.png`
    a.href = outC.toDataURL()
    a.dispatchEvent(new MouseEvent('click'))
  }

  function shareUrl(): string {
    const url = `${location.protocol}//${location.host}${location.pathname}?desig1=${LZString.compressToEncodedURIComponent(desig1.stringify(state))}`
    shareURL.value = url
    return url
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
  }

  function loadFont(lang: 'japanese' | 'chinese' | 'korean', onLoaded: () => void) {
    if (fontLoad[lang]) { onLoaded(); return }
    const urls: Record<string, string> = {
      japanese: 'https://fonts.font.im/css2?family=M+PLUS+1p:wght@500;800&display=swap',
      chinese: 'https://fonts.font.im/css2?family=Noto+Sans+SC&display=swap',
      korean: 'https://fonts.font.im/css2?family=Noto+Sans+KR&display=swap',
    }
    const link = document.createElement('link')
    link.rel = 'stylesheet'; link.href = urls[lang]!
    document.head.appendChild(link)
    document.fonts.ready.then(() => {
      fontLoad[lang] = true
      onLoaded()
    })
  }

  function formatUppercase(v: string): string {
    return v
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 65248))
      .toUpperCase()
  }

  function init(canvas: HTMLCanvasElement) {
    let openData: SignState | null = null
    if (location.search.startsWith('?desig1=')) {
      try { openData = desig1.parse(LZString.decompressFromEncodedURIComponent(location.search.slice(8))) } catch { /* ignore */ }
    } else {
      const saved = localStorage.getItem('lastSaved')
      if (saved) {
        try { openData = desig1.parse(LZString.decompressFromEncodedURIComponent(saved)) } catch { /* ignore */ }
      }
    }
    if (openData) {
      Object.assign(state, openData)
      Object.assign(state.signBoard, openData.signBoard)
      Object.assign(state.sta, openData.sta)
      Object.assign(state.sta.name, openData.sta.name)
      state.sta.numberings = openData.sta.numberings.map(n => ({ ...n }))
      state.rightStations = openData.rightStations.map(s => ({ ...s, name: { ...s.name }, numberings: s.numberings.map(n => ({ ...n })) }))
      state.leftStations = openData.leftStations.map(s => ({ ...s, name: { ...s.name }, numberings: s.numberings.map(n => ({ ...n })) }))
      state.cityNotations = openData.cityNotations.map(c => ({ ...c }))
      state.routeColors = [...openData.routeColors]
    }
    update(canvas)
  }

  return {
    state, mcExport, shareURL, fontLoad, macrons,
    enableBoardLight, mcTotalWidth, mcTotalHeight,
    reset, update, saveAsPNG, exportForMinecraft,
    shareUrl, copyToClipboard, loadFont, formatUppercase, init,
    NUMBERING_COLORS, ROUTE_COLORS,
  }
}

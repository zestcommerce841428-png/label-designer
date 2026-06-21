import bwipjs from 'bwip-js'

// ─── Type catalogue ────────────────────────────────────────────────────────────
// bwip-js bcid strings.  Grouped for UI display.

export const BARCODE_GROUPS: {
  label: string
  types: { value: string; label: string; noText?: boolean }[]
}[] = [
  {
    label: '2D',
    types: [
      { value: 'qrcode',      label: 'QR Code',          noText: true },
      { value: 'datamatrix',  label: 'Data Matrix',       noText: true },
      { value: 'pdf417',      label: 'PDF417',            noText: true },
      { value: 'azteccode',   label: 'Aztec Code',        noText: true },
      { value: 'dotcode',     label: 'DotCode',           noText: true },
      { value: 'micropdf417', label: 'Micro PDF417',      noText: true },
      { value: 'microqrcode', label: 'Micro QR Code',     noText: true },
      { value: 'hanxin',      label: 'Han Xin Code',      noText: true },
      { value: 'ultracode',   label: 'Ultracode',         noText: true },
    ],
  },
  {
    label: 'GS1',
    types: [
      { value: 'gs1-128',          label: 'GS1-128' },
      { value: 'gs1datamatrix',    label: 'GS1 Data Matrix',   noText: true },
      { value: 'gs1qrcode',        label: 'GS1 QR Code',       noText: true },
      { value: 'gs1databar',       label: 'GS1 DataBar Omni' },
      { value: 'gs1dbarexpanded',  label: 'GS1 DataBar Expanded' },
      { value: 'gs1dbarstacked',   label: 'GS1 DataBar Stacked' },
      { value: 'gs1dbarlimited',   label: 'GS1 DataBar Limited' },
      { value: 'itf14',            label: 'ITF-14' },
    ],
  },
  {
    label: 'Linear (retail)',
    types: [
      { value: 'ean13',  label: 'EAN-13' },
      { value: 'ean8',   label: 'EAN-8' },
      { value: 'upca',   label: 'UPC-A' },
      { value: 'upce',   label: 'UPC-E' },
      { value: 'ean5',   label: 'EAN-5 Supplement' },
      { value: 'ean2',   label: 'EAN-2 Supplement' },
      { value: 'isbn',   label: 'ISBN' },
      { value: 'ismn',   label: 'ISMN' },
      { value: 'issn',   label: 'ISSN' },
    ],
  },
  {
    label: 'Linear (industrial)',
    types: [
      { value: 'code128',        label: 'Code 128' },
      { value: 'code39',         label: 'Code 39' },
      { value: 'code93',         label: 'Code 93' },
      { value: 'code11',         label: 'Code 11' },
      { value: 'code32',         label: 'Code 32 (PharmaCode IT)' },
      { value: 'codabar',        label: 'Codabar' },
      { value: 'interleaved2of5', label: 'Interleaved 2 of 5' },
      { value: 'industrial2of5', label: 'Industrial 2 of 5' },
      { value: 'iata2of5',       label: 'IATA 2 of 5' },
      { value: 'matrix2of5',     label: 'Matrix 2 of 5' },
      { value: 'datalogic2of5',  label: 'Datalogic 2 of 5' },
      { value: 'code25',         label: 'Code 25' },
      { value: 'plessey',        label: 'Plessey' },
      { value: 'msi',            label: 'MSI / Modified Plessey' },
      { value: 'pharmacode',     label: 'Pharmacode' },
      { value: 'pharmacode2',    label: 'Pharmacode 2-track' },
      { value: 'telepen',        label: 'Telepen' },
      { value: 'telepennumeric', label: 'Telepen Numeric' },
    ],
  },
  {
    label: 'Postal',
    types: [
      { value: 'auspost',        label: 'Australia Post', noText: true },
      { value: 'ausreply',       label: 'Australia Post Reply Paid', noText: true },
      { value: 'ausroute',       label: 'Australia Post Routing', noText: true },
      { value: 'ausredirect',    label: 'Australia Post Redirect', noText: true },
      { value: 'postnet',        label: 'POSTNET (US)',  noText: true },
      { value: 'planet',         label: 'PLANET (US)',   noText: true },
      { value: 'royalmail',      label: 'Royal Mail (RM4SCC)', noText: true },
      { value: 'kix',            label: 'KIX (Netherlands)', noText: true },
      { value: 'japanpost',      label: 'Japan Post',    noText: true },
      { value: 'onecode',        label: 'USPS Intelligent Mail', noText: true },
      { value: 'identcode',      label: 'Deutsche Post Identcode' },
      { value: 'leitcode',       label: 'Deutsche Post Leitcode' },
    ],
  },
  {
    label: 'Healthcare / Pharma',
    types: [
      { value: 'hibccode128', label: 'HIBC Code 128' },
      { value: 'hibccode39',  label: 'HIBC Code 39' },
      { value: 'hibcdatamatrix', label: 'HIBC Data Matrix', noText: true },
      { value: 'hibcpdf417',  label: 'HIBC PDF417',     noText: true },
      { value: 'hibcqrcode',  label: 'HIBC QR Code',    noText: true },
      { value: 'hibcazteccode', label: 'HIBC Aztec',    noText: true },
      { value: 'pzn',         label: 'PZN (German pharma)' },
    ],
  },
  {
    label: 'Specialty',
    types: [
      { value: 'maxicode',       label: 'MaxiCode',      noText: true },
      { value: 'channelcode',    label: 'Channel Code' },
      { value: 'coop2of5',       label: 'COOP 2 of 5' },
      { value: 'flattermarken',  label: 'Flattermarken' },
      { value: 'bc412',          label: 'BC412' },
      { value: 'code32',         label: 'Code 32' },
      { value: 'daft',           label: 'DAFT (4-state generic)', noText: true },
    ],
  },
]

// Flat list used by the Properties panel selector
export const BARCODE_TYPES = BARCODE_GROUPS.flatMap(g => g.types)

export type BarcodeType = string

/** bcids that should not have human-readable text below them */
const NO_TEXT_SET = new Set(
  BARCODE_GROUPS.flatMap(g => g.types.filter(t => t.noText).map(t => t.value))
)

export async function generateBarcodeDataURL(
  value: string,
  type: BarcodeType = 'qrcode',
  opts: {
    width?: number
    height?: number
    scale?: number
    showText?: boolean
    barColor?: string
    bgColor?: string
    textColor?: string
  } = {}
): Promise<string> {
  const showText = opts.showText !== undefined ? opts.showText : !NO_TEXT_SET.has(type)
  const canvas = document.createElement('canvas')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bwipOpts: Record<string, any> = {
    bcid: type,
    text: value || ' ',
    scale: opts.scale ?? 3,
    height: opts.height ?? 10,
    width: opts.width,
    includetext: showText,
    textxalign: 'center',
  }
  if (opts.barColor) bwipOpts.barcolor = opts.barColor.replace('#', '')
  if (opts.bgColor)  bwipOpts.backgroundcolor = opts.bgColor.replace('#', '')
  if (opts.textColor) bwipOpts.textcolor = opts.textColor.replace('#', '')
  await bwipjs.toCanvas(canvas, bwipOpts)
  return canvas.toDataURL('image/png')
}

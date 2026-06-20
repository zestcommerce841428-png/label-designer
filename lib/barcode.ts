import bwipjs from 'bwip-js'

export type BarcodeType =
  | 'qrcode'
  | 'code128'
  | 'ean13'
  | 'ean8'
  | 'upca'
  | 'datamatrix'
  | 'pdf417'
  | 'code39'

export const BARCODE_TYPES: { value: BarcodeType; label: string }[] = [
  { value: 'qrcode', label: 'QR Code' },
  { value: 'code128', label: 'Code 128' },
  { value: 'ean13', label: 'EAN-13' },
  { value: 'ean8', label: 'EAN-8' },
  { value: 'upca', label: 'UPC-A' },
  { value: 'datamatrix', label: 'Data Matrix' },
  { value: 'pdf417', label: 'PDF417' },
  { value: 'code39', label: 'Code 39' },
]

export async function generateBarcodeDataURL(
  value: string,
  type: BarcodeType = 'qrcode',
  opts: { width?: number; height?: number; scale?: number } = {}
): Promise<string> {
  const canvas = document.createElement('canvas')
  await bwipjs.toCanvas(canvas, {
    bcid: type,
    text: value || ' ',
    scale: opts.scale ?? 3,
    height: opts.height ?? 10,
    width: opts.width,
    includetext: type !== 'qrcode' && type !== 'datamatrix',
    textxalign: 'center',
  })
  return canvas.toDataURL('image/png')
}

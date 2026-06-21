import type { FabricObject, FabricImage, IText } from 'fabric'

export interface FabricCustomData {
  type?: 'barcode' | 'layer'
  barcodeType?: string
  /** Raw template string before merge-tag substitution */
  template?: string
  /** JS expression evaluated per row — element is hidden when falsy */
  condition?: string
  /** Barcode display options */
  showText?: boolean
  barColor?: string
  bgColor?: string
  textColor?: string
  /** Shrink-to-fit text options */
  shrinkToFit?: boolean
  maxFontSize?: number
  fixedWidth?: number
  fixedHeight?: number
  /** Layer group options */
  layerName?: string
  _alblPlaceholder?: boolean
}

export interface FabricObjectWithCustomData extends FabricObject {
  id: string
  customData?: FabricCustomData
}

export interface FabricImageWithCustomData extends FabricImage {
  id: string
  customData?: FabricCustomData
}

export interface FabricITextWithCustomData extends IText {
  id: string
  customData?: FabricCustomData
}

export type AnyFabricObj = FabricObjectWithCustomData

/** Narrows an unknown Fabric object to our extended type */
export function hasCustomData(obj: FabricObject): obj is FabricObjectWithCustomData {
  return 'customData' in obj
}

export function isBarcode(obj: FabricObject): obj is FabricImageWithCustomData {
  return hasCustomData(obj) && (obj as FabricObjectWithCustomData).customData?.type === 'barcode'
}

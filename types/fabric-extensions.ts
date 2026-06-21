import type { FabricObject, FabricImage, IText } from 'fabric'

export interface FabricCustomData {
  type?: 'barcode'
  barcodeType?: string
  /** Raw template string before merge-tag substitution */
  template?: string
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

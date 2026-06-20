export type LabelSize = {
  id: string
  name: string
  width: number  // mm
  height: number // mm
  category: string
}

export const LABEL_SIZES: LabelSize[] = [
  { id: 'custom', name: 'Custom', width: 100, height: 50, category: 'Custom' },
  // Avery common sizes
  { id: 'avery-5160', name: 'Avery 5160 (Address)', width: 66.7, height: 25.4, category: 'Avery' },
  { id: 'avery-5163', name: 'Avery 5163 (Shipping)', width: 101.6, height: 50.8, category: 'Avery' },
  { id: 'avery-5164', name: 'Avery 5164 (Large Ship)', width: 101.6, height: 101.6, category: 'Avery' },
  { id: 'avery-5167', name: 'Avery 5167 (Return)', width: 43.2, height: 12.7, category: 'Avery' },
  { id: 'avery-5371', name: 'Avery 5371 (Business Card)', width: 88.9, height: 50.8, category: 'Avery' },
  // Common product labels
  { id: 'product-50x25', name: 'Product 50×25mm', width: 50, height: 25, category: 'Product' },
  { id: 'product-100x50', name: 'Product 100×50mm', width: 100, height: 50, category: 'Product' },
  { id: 'product-70x40', name: 'Product 70×40mm', width: 70, height: 40, category: 'Product' },
  // Thermal
  { id: 'thermal-80x40', name: 'Thermal 80×40mm', width: 80, height: 40, category: 'Thermal' },
  { id: 'thermal-100x150', name: 'Thermal 100×150mm (Shipping)', width: 100, height: 150, category: 'Thermal' },
  { id: 'thermal-57x32', name: 'Thermal 57×32mm', width: 57, height: 32, category: 'Thermal' },
  // Standard sheets
  { id: 'a4', name: 'A4 Sheet', width: 210, height: 297, category: 'Sheet' },
  { id: 'letter', name: 'Letter Sheet', width: 215.9, height: 279.4, category: 'Sheet' },
]

export const MM_TO_PX = 3.7795275591  // 96dpi

export function mmToPx(mm: number) {
  return Math.round(mm * MM_TO_PX)
}

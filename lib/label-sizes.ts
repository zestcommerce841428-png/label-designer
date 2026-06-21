export type LabelSize = {
  id: string
  name: string
  width: number  // mm
  height: number // mm
  category: string
}

export const LABEL_SIZES: LabelSize[] = [
  { id: 'custom', name: 'Custom', width: 100, height: 50, category: 'Custom' },

  // Avery US sizes
  { id: 'avery-5160', name: 'Avery 5160 (Address)', width: 66.7, height: 25.4, category: 'Avery' },
  { id: 'avery-5161', name: 'Avery 5161 (Address)', width: 101.6, height: 25.4, category: 'Avery' },
  { id: 'avery-5162', name: 'Avery 5162 (Address)', width: 101.6, height: 33.8, category: 'Avery' },
  { id: 'avery-5163', name: 'Avery 5163 (Shipping)', width: 101.6, height: 50.8, category: 'Avery' },
  { id: 'avery-5164', name: 'Avery 5164 (Large Ship)', width: 101.6, height: 101.6, category: 'Avery' },
  { id: 'avery-5167', name: 'Avery 5167 (Return)', width: 43.2, height: 12.7, category: 'Avery' },
  { id: 'avery-5371', name: 'Avery 5371 (Business Card)', width: 88.9, height: 50.8, category: 'Avery' },
  { id: 'avery-6241', name: 'Avery 6241 (Mini)', width: 44.5, height: 25.4, category: 'Avery' },
  { id: 'avery-8167', name: 'Avery 8167 (Return)', width: 43.2, height: 12.7, category: 'Avery' },

  // Herma (European)
  { id: 'herma-4200', name: 'Herma 4200 (70×35mm)', width: 70, height: 35, category: 'Herma' },
  { id: 'herma-4455', name: 'Herma 4455 (105×42mm)', width: 105, height: 42, category: 'Herma' },
  { id: 'herma-4612', name: 'Herma 4612 (97×42.3mm)', width: 97, height: 42.3, category: 'Herma' },
  { id: 'herma-4477', name: 'Herma 4477 (Address 70×25.4mm)', width: 70, height: 25.4, category: 'Herma' },

  // Common product labels
  { id: 'product-50x25', name: 'Product 50×25mm', width: 50, height: 25, category: 'Product' },
  { id: 'product-60x40', name: 'Product 60×40mm', width: 60, height: 40, category: 'Product' },
  { id: 'product-70x40', name: 'Product 70×40mm', width: 70, height: 40, category: 'Product' },
  { id: 'product-100x50', name: 'Product 100×50mm', width: 100, height: 50, category: 'Product' },
  { id: 'product-100x70', name: 'Product 100×70mm', width: 100, height: 70, category: 'Product' },

  // Thermal / direct thermal
  { id: 'thermal-38x25', name: 'Thermal 38×25mm (Small)', width: 38, height: 25, category: 'Thermal' },
  { id: 'thermal-57x32', name: 'Thermal 57×32mm', width: 57, height: 32, category: 'Thermal' },
  { id: 'thermal-58x40', name: 'Thermal 58×40mm', width: 58, height: 40, category: 'Thermal' },
  { id: 'thermal-80x40', name: 'Thermal 80×40mm', width: 80, height: 40, category: 'Thermal' },
  { id: 'thermal-100x100', name: 'Thermal 100×100mm (Square)', width: 100, height: 100, category: 'Thermal' },
  { id: 'thermal-100x150', name: 'Thermal 100×150mm (Shipping)', width: 100, height: 150, category: 'Thermal' },
  { id: 'thermal-4x6in', name: 'Thermal 4×6 inch (Shipping)', width: 101.6, height: 152.4, category: 'Thermal' },

  // Standard sheets
  { id: 'a4', name: 'A4 Sheet', width: 210, height: 297, category: 'Sheet' },
  { id: 'a5', name: 'A5 Sheet', width: 148, height: 210, category: 'Sheet' },
  { id: 'letter', name: 'Letter Sheet', width: 215.9, height: 279.4, category: 'Sheet' },
  { id: 'legal', name: 'Legal Sheet', width: 215.9, height: 355.6, category: 'Sheet' },
]

export const MM_TO_PX = 3.7795275591  // 96dpi

export function mmToPx(mm: number) {
  return Math.round(mm * MM_TO_PX)
}

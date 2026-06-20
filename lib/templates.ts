export type Template = {
  id: string
  name: string
  category: string
  thumbnail: string
  size: { width: number; height: number }
  canvas_json: object
}

export const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: 'product-basic',
    name: 'Product Label',
    category: 'Product',
    thumbnail: '',
    size: { width: 70, height: 40 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        {
          type: 'rect', left: 0, top: 0, width: 264, height: 151,
          fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1,
          selectable: false, evented: false,
        },
        {
          type: 'i-text', left: 10, top: 12, text: '{{product_name}}',
          fontSize: 18, fontWeight: 'bold', fontFamily: 'Arial', fill: '#111827',
          customData: { template: '{{product_name}}' },
        },
        {
          type: 'i-text', left: 10, top: 38, text: 'SKU: {{sku}}',
          fontSize: 11, fontFamily: 'Arial', fill: '#6b7280',
          customData: { template: 'SKU: {{sku}}' },
        },
        {
          type: 'i-text', left: 10, top: 110, text: '${{price}}',
          fontSize: 22, fontWeight: 'bold', fontFamily: 'Arial', fill: '#2563eb',
          customData: { template: '${{price}}' },
        },
      ],
    },
  },
  {
    id: 'shipping-label',
    name: 'Shipping Label',
    category: 'Shipping',
    thumbnail: '',
    size: { width: 100, height: 150 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        {
          type: 'i-text', left: 10, top: 10, text: 'SHIP TO:',
          fontSize: 10, fontWeight: 'bold', fontFamily: 'Arial', fill: '#6b7280',
          customData: { template: 'SHIP TO:' },
        },
        {
          type: 'i-text', left: 10, top: 26, text: '{{customer_name}}',
          fontSize: 16, fontWeight: 'bold', fontFamily: 'Arial', fill: '#111827',
          customData: { template: '{{customer_name}}' },
        },
        {
          type: 'i-text', left: 10, top: 50, text: '{{address}}',
          fontSize: 13, fontFamily: 'Arial', fill: '#374151',
          customData: { template: '{{address}}' },
        },
        {
          type: 'i-text', left: 10, top: 72, text: '{{city}}, {{state}} {{zip}}',
          fontSize: 13, fontFamily: 'Arial', fill: '#374151',
          customData: { template: '{{city}}, {{state}} {{zip}}' },
        },
        {
          type: 'line', x1: 10, y1: 105, x2: 368, y2: 105,
          stroke: '#d1d5db', strokeWidth: 1,
        },
        {
          type: 'i-text', left: 10, top: 115, text: 'Order: {{order_number}}',
          fontSize: 11, fontFamily: 'Arial', fill: '#6b7280',
          customData: { template: 'Order: {{order_number}}' },
        },
      ],
    },
  },
  {
    id: 'price-tag',
    name: 'Price Tag',
    category: 'Retail',
    thumbnail: '',
    size: { width: 50, height: 30 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        {
          type: 'rect', left: 0, top: 0, width: 189, height: 113,
          fill: '#fef3c7', stroke: '#f59e0b', strokeWidth: 2, rx: 6, ry: 6,
          selectable: false, evented: false,
        },
        {
          type: 'i-text', left: 10, top: 8, text: '{{product_name}}',
          fontSize: 13, fontWeight: 'bold', fontFamily: 'Arial', fill: '#92400e',
          customData: { template: '{{product_name}}' },
        },
        {
          type: 'i-text', left: 10, top: 65, text: '${{price}}',
          fontSize: 28, fontWeight: 'bold', fontFamily: 'Arial', fill: '#b45309',
          customData: { template: '${{price}}' },
        },
      ],
    },
  },
  {
    id: 'inventory-tag',
    name: 'Inventory Tag',
    category: 'Warehouse',
    thumbnail: '',
    size: { width: 80, height: 40 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        {
          type: 'i-text', left: 10, top: 8, text: '{{item_name}}',
          fontSize: 15, fontWeight: 'bold', fontFamily: 'Arial', fill: '#111827',
          customData: { template: '{{item_name}}' },
        },
        {
          type: 'i-text', left: 10, top: 32, text: 'Qty: {{quantity}}  Loc: {{location}}',
          fontSize: 11, fontFamily: 'Arial', fill: '#6b7280',
          customData: { template: 'Qty: {{quantity}}  Loc: {{location}}' },
        },
      ],
    },
  },
  {
    id: 'address-label',
    name: 'Address Label',
    category: 'Office',
    thumbnail: '',
    size: { width: 66.7, height: 25.4 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        {
          type: 'i-text', left: 8, top: 6, text: '{{name}}',
          fontSize: 12, fontWeight: 'bold', fontFamily: 'Arial', fill: '#111827',
          customData: { template: '{{name}}' },
        },
        {
          type: 'i-text', left: 8, top: 22, text: '{{street}}',
          fontSize: 10, fontFamily: 'Arial', fill: '#374151',
          customData: { template: '{{street}}' },
        },
        {
          type: 'i-text', left: 8, top: 35, text: '{{city}}, {{state}} {{zip}}',
          fontSize: 10, fontFamily: 'Arial', fill: '#374151',
          customData: { template: '{{city}}, {{state}} {{zip}}' },
        },
      ],
    },
  },
  {
    id: 'food-label',
    name: 'Food / Ingredients',
    category: 'Food',
    thumbnail: '',
    size: { width: 100, height: 60 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        {
          type: 'rect', left: 0, top: 0, width: 378, height: 227,
          fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2,
          selectable: false, evented: false,
        },
        {
          type: 'i-text', left: 10, top: 10, text: '{{product_name}}',
          fontSize: 18, fontWeight: 'bold', fontFamily: 'Arial', fill: '#14532d',
          customData: { template: '{{product_name}}' },
        },
        {
          type: 'i-text', left: 10, top: 38, text: 'Net Wt: {{weight}}',
          fontSize: 12, fontFamily: 'Arial', fill: '#166534',
          customData: { template: 'Net Wt: {{weight}}' },
        },
        {
          type: 'i-text', left: 10, top: 58, text: 'Best by: {{best_by}}',
          fontSize: 12, fontFamily: 'Arial', fill: '#166534',
          customData: { template: 'Best by: {{best_by}}' },
        },
        {
          type: 'i-text', left: 10, top: 82, text: 'Ingredients: {{ingredients}}',
          fontSize: 10, fontFamily: 'Arial', fill: '#374151',
          customData: { template: 'Ingredients: {{ingredients}}' },
        },
      ],
    },
  },
  {
    id: 'asset-tag',
    name: 'Asset Tag',
    category: 'Warehouse',
    thumbnail: '',
    size: { width: 80, height: 40 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        {
          type: 'i-text', left: 10, top: 8, text: 'ASSET: {{asset_id}}',
          fontSize: 14, fontWeight: 'bold', fontFamily: 'Arial', fill: '#111827',
          customData: { template: 'ASSET: {{asset_id}}' },
        },
        {
          type: 'i-text', left: 10, top: 30, text: '{{description}}',
          fontSize: 11, fontFamily: 'Arial', fill: '#6b7280',
          customData: { template: '{{description}}' },
        },
        {
          type: 'i-text', left: 10, top: 50, text: 'Dept: {{department}}',
          fontSize: 10, fontFamily: 'Arial', fill: '#6b7280',
          customData: { template: 'Dept: {{department}}' },
        },
      ],
    },
  },
  {
    id: 'blank-80x40',
    name: 'Blank 80×40mm',
    category: 'Blank',
    thumbnail: '',
    size: { width: 80, height: 40 },
    canvas_json: { version: '5.3.0', objects: [] },
  },
  {
    id: 'blank-100x50',
    name: 'Blank 100×50mm',
    category: 'Blank',
    thumbnail: '',
    size: { width: 100, height: 50 },
    canvas_json: { version: '5.3.0', objects: [] },
  },
  {
    id: 'blank-a4',
    name: 'Blank A4',
    category: 'Blank',
    thumbnail: '',
    size: { width: 210, height: 297 },
    canvas_json: { version: '5.3.0', objects: [] },
  },
]

export const TEMPLATE_CATEGORIES = [...new Set(BUILT_IN_TEMPLATES.map(t => t.category))]

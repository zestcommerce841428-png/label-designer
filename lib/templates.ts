export type Template = {
  id: string
  name: string
  category: string
  thumbnail: string
  size: { width: number; height: number }
  canvas_json: object
  /** Optional pre-loaded sample data rows shown when the template is opened */
  sampleData?: Record<string, string>[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function px(mm: number) { return Math.round(mm * 3.7795275591) }

// Shorthand object constructors
function rect(left: number, top: number, width: number, height: number, fill: string, opts: object = {}) {
  return { type: 'rect', left, top, width, height, fill, strokeWidth: 0, selectable: false, evented: false, ...opts }
}
function txt(left: number, top: number, text: string, size: number, color: string, opts: object = {}) {
  return { type: 'i-text', left, top, text, fontSize: size, fontFamily: 'Arial', fill: color, customData: { template: text }, ...opts }
}
function boldTxt(left: number, top: number, text: string, size: number, color: string, opts: object = {}) {
  return txt(left, top, text, size, color, { fontWeight: 'bold', ...opts })
}

// ─── Template catalogue ──────────────────────────────────────────────────────

export const BUILT_IN_TEMPLATES: Template[] = [

  // ── Product ──────────────────────────────────────────────────────────────
  {
    id: 'product-basic',
    name: 'Product Label',
    category: 'Product',
    thumbnail: '',
    size: { width: 70, height: 40 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(70), px(40), '#ffffff', { stroke: '#e5e7eb', strokeWidth: 1 }),
        boldTxt(10, 12, '{{product_name}}', 18, '#111827'),
        txt(10, 38, 'SKU: {{sku}}', 11, '#6b7280'),
        txt(10, 55, '{{brand}}', 11, '#9ca3af'),
        boldTxt(10, px(40) - 30, '₹{{price}}', 22, '#2563eb'),
      ],
    },
    sampleData: [
      { product_name: 'Wireless Earbuds Pro', sku: 'WEP-001-BLK', brand: 'TechSound', price: '3999' },
      { product_name: 'USB-C Hub 7-in-1', sku: 'UCH-007-SLV', brand: 'ConnectPro', price: '2799' },
      { product_name: 'Laptop Stand Aluminum', sku: 'LSA-002-SLV', brand: 'DeskMate', price: '2499' },
      { product_name: 'Wireless Mouse Slim', sku: 'WMS-003-WHT', brand: 'ClickPro', price: '1999' },
      { product_name: 'Mechanical Keyboard TKL', sku: 'MKT-004-BLK', brand: 'KeyForge', price: '6499' },
    ],
  },
  {
    id: 'product-dark',
    name: 'Product Label (Dark)',
    category: 'Product',
    thumbnail: '',
    size: { width: 70, height: 40 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(70), px(40), '#111827'),
        boldTxt(10, 12, '{{product_name}}', 16, '#f9fafb'),
        txt(10, 36, 'SKU: {{sku}}', 10, '#9ca3af'),
        boldTxt(10, px(40) - 30, '₹{{price}}', 22, '#60a5fa'),
        txt(px(70) - 70, px(40) - 18, '{{brand}}', 9, '#6b7280', { textAlign: 'right' }),
      ],
    },
  },

  {
    id: 'amazon-bundle',
    name: 'Amazon Bundle',
    category: 'Amazon',
    thumbnail: '',
    size: { width: 66, height: 38 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(66), px(38), '#FFF8E7', { stroke: '#FF9900', strokeWidth: 2 }),
        boldTxt(6, 6, 'BUNDLE — {{bundle_count}} items', 12, '#B45309'),
        txt(6, 24, '{{product_name}}', 11, '#111827'),
        txt(6, 40, 'ASIN: {{asin}}', 9, '#6b7280'),
        txt(6, 54, 'SKU: {{sku}}', 9, '#6b7280'),
        boldTxt(6, px(38) - 20, 'Do not separate', 9, '#DC2626'),
      ],
    },
  },

  // ── Electronics ──────────────────────────────────────────────────────────
  {
    id: 'electronics-basic',
    name: 'Electronics Label',
    category: 'Electronics',
    thumbnail: '',
    size: { width: 80, height: 50 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(80), 8, '#1e40af'),
        rect(0, 8, px(80), px(50) - 8, '#ffffff', { stroke: '#dbeafe', strokeWidth: 1 }),
        boldTxt(6, 10, '{{brand}}', 9, '#f8fafc'),
        boldTxt(6, 22, '{{product_name}}', 14, '#1e3a8a'),
        txt(6, 44, 'Model: {{model}}', 10, '#374151'),
        txt(6, 60, 'S/N: {{serial}}', 10, '#374151'),
        txt(6, 76, '{{voltage}}  {{wattage}}', 9, '#6b7280'),
        boldTxt(6, px(50) - 18, '₹{{price}}', 16, '#2563eb'),
      ],
    },
  },
  {
    id: 'electronics-spec',
    name: 'Electronics Spec Sheet',
    category: 'Electronics',
    thumbnail: '',
    size: { width: 90, height: 55 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(90), px(55), '#f8fafc', { stroke: '#e2e8f0', strokeWidth: 1 }),
        boldTxt(8, 8, '{{product_name}}', 15, '#0f172a'),
        txt(8, 30, '{{model}} · {{sku}}', 10, '#64748b'),
        { type: 'line', x1: 8, y1: 44, x2: px(90) - 8, y2: 44, stroke: '#e2e8f0', strokeWidth: 1 },
        txt(8, 50, 'CPU: {{cpu}}', 9, '#374151', { customData: { template: 'CPU: {{cpu}}' } }),
        txt(8, 64, 'RAM: {{ram}}   Storage: {{storage}}', 9, '#374151', { customData: { template: 'RAM: {{ram}}   Storage: {{storage}}' } }),
        txt(8, 78, 'Display: {{display}}', 9, '#374151', { customData: { template: 'Display: {{display}}' } }),
        txt(8, 92, 'Battery: {{battery}}', 9, '#374151', { customData: { template: 'Battery: {{battery}}' } }),
        boldTxt(8, px(55) - 20, '₹{{price}}', 16, '#1d4ed8'),
        txt(px(90) - 80, px(55) - 18, '{{warranty}} warranty', 8, '#64748b'),
      ],
    },
  },

  // ── Clothes ──────────────────────────────────────────────────────────────
  {
    id: 'clothes-hang-tag',
    name: 'Clothes Hang Tag',
    category: 'Clothes',
    thumbnail: '',
    size: { width: 45, height: 80 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(45), px(80), '#ffffff', { stroke: '#e5e7eb', strokeWidth: 1, rx: 4, ry: 4 }),
        boldTxt(6, 10, '{{brand}}', 14, '#111827'),
        txt(6, 30, '{{product_name}}', 11, '#374151'),
        { type: 'line', x1: 6, y1: 46, x2: px(45) - 6, y2: 46, stroke: '#f3f4f6', strokeWidth: 1 },
        txt(6, 52, 'Size: {{size}}', 12, '#374151', { customData: { template: 'Size: {{size}}' } }),
        txt(6, 68, 'Color: {{color}}', 11, '#374151', { customData: { template: 'Color: {{color}}' } }),
        txt(6, 84, 'Material: {{material}}', 10, '#6b7280', { customData: { template: 'Material: {{material}}' } }),
        { type: 'line', x1: 6, y1: 102, x2: px(45) - 6, y2: 102, stroke: '#f3f4f6', strokeWidth: 1 },
        boldTxt(6, px(80) - 25, '₹{{price}}', 18, '#111827'),
        txt(px(45) - 55, px(80) - 20, 'SKU: {{sku}}', 8, '#9ca3af'),
      ],
    },
  },
  {
    id: 'clothes-jeans',
    name: 'Jeans Label',
    category: 'Clothes',
    thumbnail: '',
    size: { width: 50, height: 30 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(50), px(30), '#1e3a5f'),
        boldTxt(8, 8, '{{brand}}', 16, '#f8fafc'),
        txt(8, 30, '{{style}}', 10, '#93c5fd'),
        txt(8, 44, 'W{{waist}} L{{length}}', 13, '#ffffff', { customData: { template: 'W{{waist}} L{{length}}' } }),
        txt(8, 62, '{{material}}', 9, '#93c5fd'),
        boldTxt(px(50) - 55, 8, '₹{{price}}', 15, '#fbbf24'),
      ],
    },
  },
  {
    id: 'clothes-shoes',
    name: 'Shoes Label',
    category: 'Clothes',
    thumbnail: '',
    size: { width: 60, height: 35 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(60), px(35), '#fafafa', { stroke: '#e5e7eb', strokeWidth: 1 }),
        boldTxt(8, 8, '{{brand}}', 14, '#111827'),
        txt(8, 28, '{{product_name}}', 11, '#374151'),
        txt(8, 44, 'Size EU {{size_eu}} / US {{size_us}}', 11, '#374151', { customData: { template: 'Size EU {{size_eu}} / US {{size_us}}' } }),
        txt(8, 60, 'Color: {{color}}  Width: {{width}}', 9, '#6b7280', { customData: { template: 'Color: {{color}}  Width: {{width}}' } }),
        boldTxt(8, px(35) - 22, '₹{{price}}', 16, '#111827'),
        txt(px(60) - 65, px(35) - 16, 'SKU: {{sku}}', 8, '#9ca3af'),
      ],
    },
  },

  // ── Discounts ─────────────────────────────────────────────────────────────
  {
    id: 'discount-sale',
    name: 'Sale Discount',
    category: 'Discounts',
    thumbnail: '',
    size: { width: 60, height: 40 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(60), px(40), '#fef2f2', { stroke: '#fca5a5', strokeWidth: 2 }),
        boldTxt(6, 6, 'SALE', 20, '#dc2626'),
        boldTxt(6, 34, '{{discount}}% OFF', 16, '#dc2626'),
        txt(6, 56, '{{product_name}}', 11, '#374151'),
        txt(6, 72, 'Was: ₹{{original_price}}', 10, '#9ca3af'),
        boldTxt(6, px(40) - 25, 'Now: ₹{{sale_price}}', 14, '#dc2626'),
      ],
    },
  },
  {
    id: 'discount-black-friday',
    name: 'Black Friday',
    category: 'Discounts',
    thumbnail: '',
    size: { width: 70, height: 45 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(70), px(45), '#111827'),
        boldTxt(6, 8, 'BLACK FRIDAY', 14, '#fbbf24'),
        boldTxt(6, 28, '{{discount}}% OFF', 24, '#ffffff'),
        txt(6, 58, '{{product_name}}', 11, '#d1d5db'),
        boldTxt(6, 76, '₹{{sale_price}}', 18, '#fbbf24'),
        txt(6, 100, 'Was ₹{{original_price}}', 10, '#6b7280'),
      ],
    },
  },
  {
    id: 'discount-conditional',
    name: 'Show Discount if Lower',
    category: 'Discounts',
    thumbnail: '',
    size: { width: 60, height: 35 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(60), px(35), '#ffffff', { stroke: '#e5e7eb', strokeWidth: 1 }),
        boldTxt(6, 6, '{{product_name}}', 13, '#111827'),
        boldTxt(6, 26, '₹{{price}}', 18, '#111827'),
        txt(6, 50, 'Was ₹{{original_price}}', 10, '#9ca3af',
          { customData: { template: 'Was ₹{{original_price}}', condition: 'parseFloat(row.price) < parseFloat(row.original_price)' } }),
        txt(6, 64, '{{discount}}% off', 10, '#dc2626',
          { customData: { template: '{{discount}}% off', condition: 'parseFloat(row.price) < parseFloat(row.original_price)' } }),
      ],
    },
  },

  // ── Food ──────────────────────────────────────────────────────────────────
  {
    id: 'food-label',
    name: 'Food / Ingredients',
    category: 'Food',
    thumbnail: '',
    size: { width: 100, height: 60 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(100), px(60), '#f0fdf4', { stroke: '#16a34a', strokeWidth: 2 }),
        boldTxt(10, 10, '{{product_name}}', 18, '#14532d'),
        txt(10, 38, 'Net Wt: {{weight}}', 12, '#166534'),
        txt(10, 58, 'Best by: {{best_by}}', 12, '#166534', { customData: { template: 'Best by: {{best_by}}' } }),
        txt(10, 82, 'Ingredients: {{ingredients}}', 10, '#374151', { customData: { template: 'Ingredients: {{ingredients}}' } }),
      ],
    },
    sampleData: [
      { product_name: 'Organic Granola', weight: '340g (12oz)', best_by: '2026-12-15', ingredients: 'Rolled oats, honey, almonds, raisins' },
      { product_name: 'Almond Butter', weight: '250g (8.8oz)', best_by: '2027-03-01', ingredients: 'Dry roasted almonds, sea salt' },
      { product_name: 'Trail Mix Deluxe', weight: '200g (7oz)', best_by: '2026-10-30', ingredients: 'Mixed nuts, dried fruits, dark chocolate chips' },
    ],
  },
  {
    id: 'food-nutrition',
    name: 'Nutrition Facts',
    category: 'Food',
    thumbnail: '',
    size: { width: 80, height: 100 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(80), px(100), '#ffffff', { stroke: '#000000', strokeWidth: 2 }),
        boldTxt(6, 6, 'Nutrition Facts', 16, '#000000'),
        txt(6, 28, 'Serving size: {{serving_size}}', 9, '#000000', { customData: { template: 'Serving size: {{serving_size}}' } }),
        txt(6, 42, 'Servings per container: {{servings}}', 9, '#000000', { customData: { template: 'Servings per container: {{servings}}' } }),
        { type: 'rect', left: 4, top: 52, width: px(80) - 8, height: 3, fill: '#000000', selectable: false, evented: false },
        txt(6, 60, 'Calories: {{calories}}', 11, '#000000', { customData: { template: 'Calories: {{calories}}' } }),
        { type: 'line', x1: 4, y1: 78, x2: px(80) - 4, y2: 78, stroke: '#cccccc', strokeWidth: 1 },
        txt(6, 84, 'Total Fat: {{fat}}g', 9, '#000000', { customData: { template: 'Total Fat: {{fat}}g' } }),
        txt(6, 98, 'Sodium: {{sodium}}mg', 9, '#000000', { customData: { template: 'Sodium: {{sodium}}mg' } }),
        txt(6, 112, 'Total Carbs: {{carbs}}g', 9, '#000000', { customData: { template: 'Total Carbs: {{carbs}}g' } }),
        txt(6, 126, 'Protein: {{protein}}g', 9, '#000000', { customData: { template: 'Protein: {{protein}}g' } }),
        { type: 'line', x1: 4, y1: 142, x2: px(80) - 4, y2: 142, stroke: '#000000', strokeWidth: 2 },
        txt(6, 148, 'Ingredients: {{ingredients}}', 8, '#374151', { customData: { template: 'Ingredients: {{ingredients}}' } }),
        txt(6, 166, 'Best by: {{best_by}}', 8, '#374151', { customData: { template: 'Best by: {{best_by}}' } }),
      ],
    },
  },
  {
    id: 'food-bakery',
    name: 'Bakery Label',
    category: 'Food',
    thumbnail: '',
    size: { width: 70, height: 35 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(70), px(35), '#fdf6ec', { stroke: '#d97706', strokeWidth: 1 }),
        boldTxt(6, 6, '{{product_name}}', 15, '#92400e'),
        txt(6, 28, '{{ingredients}}', 9, '#78350f'),
        txt(6, 44, 'Weight: {{weight}}', 9, '#78350f', { customData: { template: 'Weight: {{weight}}' } }),
        boldTxt(6, px(35) - 22, '₹{{price}}', 14, '#b45309'),
        txt(px(70) - 80, px(35) - 16, 'Best by: {{best_by}}', 8, '#9ca3af'),
      ],
    },
  },

  // ── Shipping ──────────────────────────────────────────────────────────────
  {
    id: 'shipping-label',
    name: 'Shipping Label',
    category: 'Shipping',
    thumbnail: '',
    size: { width: 100, height: 150 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        boldTxt(10, 10, 'SHIP TO:', 10, '#6b7280'),
        boldTxt(10, 26, '{{customer_name}}', 16, '#111827'),
        txt(10, 50, '{{address}}', 13, '#374151'),
        txt(10, 72, '{{city}}, {{state}} {{zip}}', 13, '#374151', { customData: { template: '{{city}}, {{state}} {{zip}}' } }),
        { type: 'line', x1: 10, y1: 105, x2: px(100) - 10, y2: 105, stroke: '#d1d5db', strokeWidth: 1 },
        txt(10, 115, 'Order: {{order_number}}', 11, '#6b7280', { customData: { template: 'Order: {{order_number}}' } }),
        txt(10, 133, 'Weight: {{weight}}  Items: {{item_count}}', 10, '#6b7280', { customData: { template: 'Weight: {{weight}}  Items: {{item_count}}' } }),
      ],
    },
    sampleData: [
      { customer_name: 'Alice Johnson', address: '123 Main Street', city: 'Austin', state: 'TX', zip: '78701', order_number: 'ORD-10042', weight: '1.2 lbs', item_count: '2' },
      { customer_name: 'Bob Martinez', address: '456 Oak Avenue', city: 'Seattle', state: 'WA', zip: '98101', order_number: 'ORD-10043', weight: '0.8 lbs', item_count: '1' },
      { customer_name: 'Carol Smith', address: '789 Pine Road', city: 'Chicago', state: 'IL', zip: '60601', order_number: 'ORD-10044', weight: '2.5 lbs', item_count: '3' },
    ],
  },
  {
    id: 'shipping-fragile',
    name: 'Fragile / Handle with Care',
    category: 'Shipping',
    thumbnail: '',
    size: { width: 100, height: 50 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(100), px(50), '#fef9c3', { stroke: '#eab308', strokeWidth: 3 }),
        boldTxt(12, 10, '⚠ FRAGILE', 22, '#ca8a04'),
        boldTxt(12, 40, 'Handle with Care', 14, '#854d0e'),
        txt(12, 62, '{{product_name}}', 11, '#374151'),
        txt(12, 80, 'Order: {{order_number}}', 10, '#6b7280', { customData: { template: 'Order: {{order_number}}' } }),
      ],
    },
  },

  // ── Retail ────────────────────────────────────────────────────────────────
  {
    id: 'price-tag',
    name: 'Price Tag',
    category: 'Retail',
    thumbnail: '',
    size: { width: 50, height: 30 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(50), px(30), '#fef3c7', { stroke: '#f59e0b', strokeWidth: 2, rx: 6, ry: 6 }),
        boldTxt(10, 8, '{{product_name}}', 13, '#92400e'),
        boldTxt(10, 65, '₹{{price}}', 28, '#b45309'),
      ],
    },
    sampleData: [
      { product_name: 'Coffee Mug', price: '999' },
      { product_name: 'Desk Organizer', price: '1999' },
      { product_name: 'Notebook A5', price: '749' },
      { product_name: 'Pen Set (12)', price: '1199' },
      { product_name: 'Sticky Notes 400pk', price: '499' },
    ],
  },
  {
    id: 'price-tag-two-price',
    name: 'Sale vs Original Price',
    category: 'Retail',
    thumbnail: '',
    size: { width: 55, height: 32 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(55), px(32), '#ffffff', { stroke: '#e5e7eb', strokeWidth: 1 }),
        boldTxt(6, 6, '{{product_name}}', 12, '#111827'),
        txt(6, 26, 'Was: ₹{{original_price}}', 10, '#9ca3af'),
        boldTxt(6, 44, 'Now: ₹{{price}}', 18, '#dc2626'),
        txt(px(55) - 55, px(32) - 16, '{{discount}}% off', 9, '#dc2626'),
      ],
    },
  },

  // ── Office ────────────────────────────────────────────────────────────────
  {
    id: 'address-label',
    name: 'Address Label',
    category: 'Office',
    thumbnail: '',
    size: { width: 66.7, height: 25.4 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        boldTxt(8, 6, '{{name}}', 12, '#111827'),
        txt(8, 22, '{{street}}', 10, '#374151'),
        txt(8, 35, '{{city}}, {{state}} {{zip}}', 10, '#374151', { customData: { template: '{{city}}, {{state}} {{zip}}' } }),
      ],
    },
  },
  {
    id: 'name-badge',
    name: 'Name Badge',
    category: 'Office',
    thumbnail: '',
    size: { width: 86, height: 54 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(86), 20, '#2563eb'),
        rect(0, 20, px(86), px(54) - 20, '#ffffff', { stroke: '#dbeafe', strokeWidth: 1 }),
        boldTxt(8, 4, '{{company}}', 10, '#dbeafe'),
        boldTxt(8, 30, '{{name}}', 22, '#111827'),
        txt(8, 60, '{{title}}', 13, '#6b7280'),
        txt(8, 80, '{{department}}', 11, '#9ca3af'),
      ],
    },
  },
  {
    id: 'folder-label',
    name: 'Folder / Binder Label',
    category: 'Office',
    thumbnail: '',
    size: { width: 90, height: 38 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, 10, px(38), '#2563eb'),
        rect(10, 0, px(90) - 10, px(38), '#ffffff', { stroke: '#e5e7eb', strokeWidth: 1 }),
        boldTxt(18, 10, '{{title}}', 16, '#111827'),
        txt(18, 34, '{{subtitle}}', 11, '#6b7280'),
        txt(18, 52, '{{date}}', 10, '#9ca3af'),
      ],
    },
  },

  // ── Warehouse ─────────────────────────────────────────────────────────────
  {
    id: 'inventory-tag',
    name: 'Inventory Tag',
    category: 'Warehouse',
    thumbnail: '',
    size: { width: 80, height: 40 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        boldTxt(10, 8, '{{item_name}}', 15, '#111827'),
        txt(10, 32, 'Qty: {{quantity}}  Loc: {{location}}', 11, '#6b7280', { customData: { template: 'Qty: {{quantity}}  Loc: {{location}}' } }),
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
        boldTxt(10, 8, 'ASSET: {{asset_id}}', 14, '#111827'),
        txt(10, 30, '{{description}}', 11, '#6b7280'),
        txt(10, 50, 'Dept: {{department}}', 10, '#6b7280', { customData: { template: 'Dept: {{department}}' } }),
      ],
    },
  },
  {
    id: 'pallet-label',
    name: 'Pallet / Box Label',
    category: 'Warehouse',
    thumbnail: '',
    size: { width: 100, height: 70 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(100), 22, '#111827'),
        boldTxt(8, 4, 'PALLET ID: {{pallet_id}}', 11, '#f9fafb'),
        boldTxt(8, 28, '{{product_name}}', 16, '#111827'),
        txt(8, 52, 'SKU: {{sku}}', 11, '#374151'),
        txt(8, 70, 'Qty: {{quantity}}  Units: {{unit}}', 11, '#374151', { customData: { template: 'Qty: {{quantity}}  Units: {{unit}}' } }),
        txt(8, 90, 'Lot: {{lot_number}}', 11, '#374151', { customData: { template: 'Lot: {{lot_number}}' } }),
        txt(8, 108, 'Exp: {{expiry}}  Mfg: {{manufactured}}', 10, '#6b7280', { customData: { template: 'Exp: {{expiry}}  Mfg: {{manufactured}}' } }),
        boldTxt(8, px(70) - 22, 'Location: {{location}}', 12, '#1d4ed8'),
      ],
    },
  },

  // ── Clothing ─────────────────────────────────────────────────────────────
  {
    id: 'clothing-hang-tag',
    name: 'Clothing Hang Tag',
    category: 'Clothing',
    thumbnail: '',
    size: { width: 55, height: 90 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(55), px(90), '#ffffff', { stroke: '#e5e7eb', strokeWidth: 1 }),
        boldTxt(8, 10, '{{brand}}', 14, '#111827'),
        txt(8, 30, '{{product_name}}', 11, '#374151'),
        { type: 'line', x1: 8, y1: 50, x2: px(55) - 8, y2: 50, stroke: '#e5e7eb', strokeWidth: 1 },
        txt(8, 60, 'Size: {{size}}', 11, '#374151', { customData: { template: 'Size: {{size}}' } }),
        txt(8, 76, 'Color: {{color}}', 11, '#374151', { customData: { template: 'Color: {{color}}' } }),
        txt(8, 92, 'Material: {{material}}', 10, '#6b7280', { customData: { template: 'Material: {{material}}' } }),
        txt(8, 108, 'Care: {{care_instructions}}', 9, '#9ca3af', { customData: { template: 'Care: {{care_instructions}}' } }),
        boldTxt(8, px(90) - 28, '₹{{price}}', 20, '#2563eb'),
        txt(px(55) - 60, px(90) - 18, 'SKU: {{sku}}', 8, '#9ca3af'),
      ],
    },
  },
  {
    id: 'clothing-size-label',
    name: 'Garment Size Label',
    category: 'Clothing',
    thumbnail: '',
    size: { width: 50, height: 25 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(50), px(25), '#1e293b'),
        boldTxt(10, 8, '{{size}}', 22, '#f8fafc'),
        txt(px(50) - 70, px(25) - 16, '{{brand}}', 9, '#94a3b8'),
      ],
    },
  },
  {
    id: 'clothing-care-label',
    name: 'Care / Wash Label',
    category: 'Clothing',
    thumbnail: '',
    size: { width: 45, height: 30 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(45), px(30), '#ffffff', { stroke: '#d1d5db', strokeWidth: 1 }),
        boldTxt(5, 5, '{{brand}}', 10, '#111827'),
        txt(5, 20, '{{material_composition}}', 8, '#374151'),
        txt(5, 32, 'Wash: {{wash_instruction}}', 8, '#6b7280', { customData: { template: 'Wash: {{wash_instruction}}' } }),
        txt(5, 46, 'Made in {{country}}', 8, '#9ca3af', { customData: { template: 'Made in {{country}}' } }),
      ],
    },
  },

  // ── Healthcare ────────────────────────────────────────────────────────────
  {
    id: 'medication-label',
    name: 'Medication Label',
    category: 'Healthcare',
    thumbnail: '',
    size: { width: 80, height: 50 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(80), px(50), '#ffffff', { stroke: '#000000', strokeWidth: 2 }),
        boldTxt(6, 6, '{{pharmacy_name}}', 13, '#111827'),
        txt(6, 24, 'Rx: {{rx_number}}', 10, '#374151', { customData: { template: 'Rx: {{rx_number}}' } }),
        { type: 'line', x1: 4, y1: 38, x2: px(80) - 4, y2: 38, stroke: '#000000', strokeWidth: 1 },
        boldTxt(6, 44, '{{patient_name}}', 13, '#111827'),
        txt(6, 62, '{{drug_name}} {{dosage}}', 12, '#111827', { customData: { template: '{{drug_name}} {{dosage}}' } }),
        txt(6, 78, '{{instructions}}', 10, '#374151'),
        txt(6, 92, 'Qty: {{quantity}}  Refills: {{refills}}', 10, '#6b7280', { customData: { template: 'Qty: {{quantity}}  Refills: {{refills}}' } }),
        txt(6, 108, 'Exp: {{expiry_date}}', 9, '#6b7280', { customData: { template: 'Exp: {{expiry_date}}' } }),
        txt(6, px(50) - 16, 'Dr: {{doctor_name}}', 9, '#9ca3af', { customData: { template: 'Dr: {{doctor_name}}' } }),
      ],
    },
  },
  {
    id: 'specimen-label',
    name: 'Lab Specimen Label',
    category: 'Healthcare',
    thumbnail: '',
    size: { width: 75, height: 35 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(75), px(35), '#ffffff', { stroke: '#dc2626', strokeWidth: 2 }),
        boldTxt(6, 5, '{{patient_name}}', 13, '#111827'),
        txt(6, 22, 'DOB: {{dob}}  ID: {{patient_id}}', 10, '#374151', { customData: { template: 'DOB: {{dob}}  ID: {{patient_id}}' } }),
        txt(6, 38, 'Collected: {{collected_datetime}}', 10, '#374151', { customData: { template: 'Collected: {{collected_datetime}}' } }),
        txt(6, 54, 'Test: {{test_type}}', 10, '#374151', { customData: { template: 'Test: {{test_type}}' } }),
        txt(6, 70, 'Collector: {{collector_id}}', 9, '#9ca3af', { customData: { template: 'Collector: {{collector_id}}' } }),
      ],
    },
  },

  // ── Electronics ───────────────────────────────────────────────────────────
  {
    id: 'electronics-serial',
    name: 'Electronics Serial Label',
    category: 'Electronics',
    thumbnail: '',
    size: { width: 60, height: 30 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(60), px(30), '#f8fafc', { stroke: '#cbd5e1', strokeWidth: 1 }),
        boldTxt(6, 5, '{{product_name}}', 11, '#0f172a'),
        txt(6, 22, 'S/N: {{serial_number}}', 10, '#374151', { customData: { template: 'S/N: {{serial_number}}' } }),
        txt(6, 36, 'P/N: {{part_number}}', 10, '#374151', { customData: { template: 'P/N: {{part_number}}' } }),
        txt(6, 52, 'Mfg: {{manufacture_date}}', 9, '#64748b', { customData: { template: 'Mfg: {{manufacture_date}}' } }),
        txt(6, px(30) - 14, 'Model: {{model}}', 9, '#94a3b8', { customData: { template: 'Model: {{model}}' } }),
      ],
    },
  },
  {
    id: 'electronics-warranty',
    name: 'Warranty Seal',
    category: 'Electronics',
    thumbnail: '',
    size: { width: 50, height: 20 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(50), px(20), '#dc2626', { rx: 4, ry: 4 }),
        boldTxt(8, 6, 'WARRANTY VOID', 12, '#ffffff'),
        txt(8, 22, 'IF SEAL BROKEN', 9, '#fecaca'),
      ],
    },
  },
  {
    id: 'electronics-cable-label',
    name: 'Cable / Wire Label',
    category: 'Electronics',
    thumbnail: '',
    size: { width: 60, height: 15 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(60), px(15), '#dbeafe', { stroke: '#93c5fd', strokeWidth: 1 }),
        boldTxt(6, 4, '{{cable_label}}', 12, '#1e40af'),
        txt(px(60) - 100, 4, '{{port}}', 12, '#1d4ed8'),
      ],
    },
  },

  // ── Events ────────────────────────────────────────────────────────────────
  {
    id: 'event-wristband',
    name: 'Event Wristband',
    category: 'Events',
    thumbnail: '',
    size: { width: 240, height: 25 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(240), px(25), '#1d4ed8'),
        boldTxt(8, 6, '{{event_name}}', 12, '#ffffff'),
        txt(8, 22, '{{event_date}}', 9, '#bfdbfe'),
        boldTxt(px(240) / 2 - 30, 6, '{{ticket_type}}', 12, '#fbbf24'),
        txt(px(240) - 100, 8, '#{{ticket_number}}', 11, '#dbeafe'),
        txt(px(240) - 100, 24, '{{gate}}', 9, '#93c5fd'),
      ],
    },
  },
  {
    id: 'event-badge',
    name: 'Event Name Badge',
    category: 'Events',
    thumbnail: '',
    size: { width: 86, height: 54 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(86), px(54), '#ffffff', { stroke: '#e5e7eb', strokeWidth: 1 }),
        rect(0, 0, px(86), 18, '#7c3aed'),
        boldTxt(8, 3, '{{event_name}}', 10, '#ede9fe'),
        boldTxt(8, 28, '{{attendee_name}}', 18, '#111827'),
        txt(8, 52, '{{company}}', 11, '#6b7280'),
        txt(8, 68, '{{role}}', 10, '#9ca3af'),
        txt(px(86) - 70, px(54) - 14, '{{ticket_type}}', 9, '#7c3aed'),
      ],
    },
  },
  {
    id: 'event-entry-ticket',
    name: 'Entry Ticket',
    category: 'Events',
    thumbnail: '',
    size: { width: 150, height: 60 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(150), px(60), '#fdf2f8', { stroke: '#a855f7', strokeWidth: 2 }),
        boldTxt(10, 8, '{{event_name}}', 16, '#6b21a8'),
        txt(10, 32, '{{venue}}', 11, '#7e22ce'),
        txt(10, 48, '{{event_date}} · {{event_time}}', 10, '#9333ea', { customData: { template: '{{event_date}} · {{event_time}}' } }),
        { type: 'line', x1: px(100), y1: 4, x2: px(100), y2: px(60) - 4, stroke: '#d8b4fe', strokeWidth: 1, strokeDashArray: [4, 4] },
        boldTxt(px(105), 10, '{{ticket_type}}', 10, '#7c3aed'),
        txt(px(105), 30, '#{{ticket_number}}', 14, '#6b21a8'),
        txt(px(105), 52, '{{gate}}', 10, '#9ca3af'),
      ],
    },
  },

  // ── Serial / Counter ──────────────────────────────────────────────────────
  {
    id: 'serial-counter',
    name: 'Serial Number Label',
    category: 'Serial',
    thumbnail: '',
    size: { width: 70, height: 35 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(70), px(35), '#f0f9ff', { stroke: '#0284c7', strokeWidth: 1 }),
        boldTxt(6, 5, '{{product_name}}', 12, '#0c4a6e'),
        txt(6, 22, 'S/N: {{=Left("000000", 6 - Len(String(rowIndex+1))) + String(rowIndex+1)}}', 10, '#0369a1'),
        txt(6, 36, '{{#counter:1000:1:6}}', 10, '#075985', { customData: { template: '{{#counter:1000:1:6}}' } }),
        txt(6, 52, 'Batch: {{batch_number}}', 9, '#64748b', { customData: { template: 'Batch: {{batch_number}}' } }),
        boldTxt(px(70) - 50, px(35) - 18, '{{=today()}}', 9, '#94a3b8'),
      ],
    },
  },
  {
    id: 'asset-serial-barcode',
    name: 'Asset Tag with Counter',
    category: 'Serial',
    thumbnail: '',
    size: { width: 80, height: 40 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(80), px(40), '#f8fafc', { stroke: '#1e40af', strokeWidth: 2 }),
        rect(0, 0, px(80), 16, '#1e40af'),
        boldTxt(6, 2, '{{company_name}}', 10, '#dbeafe'),
        boldTxt(6, 22, 'ASSET #{{#counter}}', 14, '#0f172a'),
        txt(6, 42, '{{description}}', 10, '#374151'),
        txt(6, 58, 'Dept: {{department}}', 9, '#6b7280', { customData: { template: 'Dept: {{department}}' } }),
        txt(px(80) - 80, px(40) - 16, '{{=today()}}', 9, '#94a3b8'),
      ],
    },
  },

  // ── Wine / Beverage ───────────────────────────────────────────────────────
  {
    id: 'wine-label',
    name: 'Wine / Bottle Label',
    category: 'Beverage',
    thumbnail: '',
    size: { width: 90, height: 120 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(90), px(120), '#faf5eb', { stroke: '#a16207', strokeWidth: 2 }),
        rect(0, 0, px(90), 14, '#a16207'),
        rect(0, px(120) - 14, px(90), 14, '#a16207'),
        boldTxt(8, 18, '{{winery}}', 14, '#78350f'),
        { type: 'line', x1: 8, y1: 40, x2: px(90) - 8, y2: 40, stroke: '#d97706', strokeWidth: 1 },
        boldTxt(10, 48, '{{wine_name}}', 20, '#451a03'),
        txt(10, 76, '{{vintage}} · {{varietal}}', 12, '#92400e', { customData: { template: '{{vintage}} · {{varietal}}' } }),
        txt(10, 96, '{{region}}', 11, '#78350f'),
        txt(10, 114, '{{volume}} · {{alcohol}}% ABV', 10, '#92400e', { customData: { template: '{{volume}} · {{alcohol}}% ABV' } }),
        txt(10, 135, '{{description}}', 9, '#78350f', { italic: true }),
        txt(8, px(120) - 12, '{{appellation}}', 9, '#fef3c7'),
      ],
    },
  },
  {
    id: 'beer-label',
    name: 'Craft Beer Label',
    category: 'Beverage',
    thumbnail: '',
    size: { width: 80, height: 100 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(80), px(100), '#fef3c7', { stroke: '#d97706', strokeWidth: 2 }),
        rect(0, 0, px(80), 20, '#92400e'),
        rect(0, px(100) - 20, px(80), 20, '#92400e'),
        boldTxt(8, 3, '{{brewery}}', 11, '#fef3c7'),
        boldTxt(8, 28, '{{beer_name}}', 20, '#78350f'),
        txt(8, 56, '{{style}}', 13, '#92400e'),
        txt(8, 76, '{{description}}', 9, '#78350f'),
        txt(8, 100, 'ABV: {{abv}}%  IBU: {{ibu}}', 10, '#92400e', { customData: { template: 'ABV: {{abv}}%  IBU: {{ibu}}' } }),
        txt(8, 118, '{{volume}}', 10, '#78350f'),
        txt(8, px(100) - 16, '{{brewery_location}}', 9, '#fef3c7'),
      ],
    },
  },

  // ── Blank ─────────────────────────────────────────────────────────────────
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
    id: 'blank-57x32',
    name: 'Blank 57×32mm (Thermal)',
    category: 'Blank',
    thumbnail: '',
    size: { width: 57, height: 32 },
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

  // ── Amazon ────────────────────────────────────────────────────────────────
  {
    id: 'amazon-fnsku',
    name: 'Amazon FNSKU Label',
    category: 'Amazon',
    thumbnail: '',
    size: { width: 50, height: 25 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(50), px(25), '#ffffff', { stroke: '#d1d5db', strokeWidth: 1 }),
        boldTxt(4, 4, '{{product_name}}', 8, '#111827', { customData: { template: '{{product_name}}', shrinkToFit: true, maxFontSize: 8, fixedWidth: px(50) - 8 } }),
        txt(4, 20, 'FNSKU: {{FNSKU}}', 7, '#374151', { customData: { template: 'FNSKU: {{FNSKU}}' } }),
        txt(4, 32, 'Condition: {{condition}}', 6, '#6b7280', { customData: { template: 'Condition: {{condition}}' } }),
        txt(4, px(25) - 14, 'SKU: {{sku}}', 6, '#9ca3af', { customData: { template: 'SKU: {{sku}}' } }),
        txt(px(50) - 62, px(25) - 14, '{{=today()}}', 6, '#9ca3af'),
      ],
    },
    sampleData: [
      { product_name: 'Wireless Bluetooth Headphones Pro', FNSKU: 'X001AB2CD3', condition: 'New', sku: 'WBH-PRO-BLK' },
      { product_name: 'USB-C Fast Charger 65W', FNSKU: 'X002EF3GH4', condition: 'New', sku: 'USBC-65W-WHT' },
      { product_name: 'Portable Power Bank 20000mAh', FNSKU: 'X003IJ4KL5', condition: 'New', sku: 'PPB-20K-BLK' },
      { product_name: 'Smart LED Desk Lamp', FNSKU: 'X004MN5OP6', condition: 'New', sku: 'LED-DESK-WHT' },
      { product_name: 'Mechanical Keyboard Compact TKL', FNSKU: 'X005QR6ST7', condition: 'New', sku: 'MK-TKL-BLK-RED' },
    ],
  },
  {
    id: 'amazon-fnsku-thermal',
    name: 'Amazon FNSKU (Thermal 4×1")',
    category: 'Amazon',
    thumbnail: '',
    size: { width: 101.6, height: 25.4 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(101.6), px(25.4), '#ffffff', { stroke: '#e5e7eb', strokeWidth: 0.5 }),
        boldTxt(6, 3, '{{product_name}}', 9, '#111827', { customData: { template: '{{product_name}}', shrinkToFit: true, maxFontSize: 9, fixedWidth: px(101.6) - 12 } }),
        txt(6, 18, 'FNSKU: {{FNSKU}}', 7, '#374151', { customData: { template: 'FNSKU: {{FNSKU}}' } }),
        txt(6, 30, 'Condition: {{condition}}', 6, '#6b7280', { customData: { template: 'Condition: {{condition}}' } }),
        txt(6, 42, 'SKU: {{sku}}  Sold by: {{seller_name}}', 6, '#9ca3af', { customData: { template: 'SKU: {{sku}}  Sold by: {{seller_name}}' } }),
        txt(px(101.6) - 54, px(25.4) - 14, '{{=today()}}', 6, '#9ca3af'),
      ],
    },
  },
  {
    id: 'amazon-transparency',
    name: 'Amazon Transparency Label (1.125")',
    category: 'Amazon',
    thumbnail: '',
    size: { width: 28.575, height: 28.575 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(28.575), px(28.575), '#ffffff', { stroke: '#d1d5db', strokeWidth: 1 }),
        boldTxt(4, 4, 'Scan with the', 6, '#374151'),
        boldTxt(4, 14, 'Transparency app', 6, '#374151'),
        txt(4, 26, 'ASIN: {{ASIN}}', 5, '#6b7280', { customData: { template: 'ASIN: {{ASIN}}' } }),
        txt(4, 36, '{{brand}}', 5, '#374151', { customData: { template: '{{brand}}' } }),
        txt(4, 48, '{{UniqueCode}}', 5, '#9ca3af', { customData: { template: '{{UniqueCode}}' } }),
        txt(4, px(28.575) - 14, 'Add QR barcode for UniqueCode above', 4, '#93c5fd'),
      ],
    },
  },
  {
    id: 'amazon-fba-shipment',
    name: 'Amazon FBA Shipment Label',
    category: 'Amazon',
    thumbnail: '',
    size: { width: 101.6, height: 152.4 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(101.6), px(152.4), '#ffffff', { stroke: '#374151', strokeWidth: 1 }),
        rect(0, 0, px(101.6), 22, '#111827'),
        boldTxt(8, 4, 'Amazon FBA Shipment', 11, '#f9fafb'),
        txt(6, 30, 'Shipment ID:', 8, '#374151'),
        boldTxt(6, 44, '{{shipment_id}}', 14, '#111827', { customData: { template: '{{shipment_id}}' } }),
        txt(6, 68, 'Destination: {{fc_name}}', 8, '#374151', { customData: { template: 'Destination: {{fc_name}}' } }),
        txt(6, 82, '{{fc_address}}', 8, '#374151', { customData: { template: '{{fc_address}}' } }),
        txt(6, 96, '{{fc_city}}, {{fc_state}} {{fc_zip}}', 8, '#374151', { customData: { template: '{{fc_city}}, {{fc_state}} {{fc_zip}}' } }),
        { type: 'line', x1: 6, y1: 115, x2: px(101.6) - 6, y2: 115, stroke: '#d1d5db', strokeWidth: 1 },
        boldTxt(6, 122, 'Box {{box_number}} of {{total_boxes}}', 13, '#111827', { customData: { template: 'Box {{box_number}} of {{total_boxes}}' } }),
        txt(6, 142, 'Units: {{unit_count}}', 9, '#374151', { customData: { template: 'Units: {{unit_count}}' } }),
        txt(6, 158, 'Weight: {{weight_lbs}} lbs', 9, '#374151', { customData: { template: 'Weight: {{weight_lbs}} lbs' } }),
        txt(6, 174, 'Seller: {{seller_name}}', 9, '#374151', { customData: { template: 'Seller: {{seller_name}}' } }),
        txt(6, px(152.4) - 18, '{{=today("MM/dd/yyyy")}}', 8, '#9ca3af'),
        txt(6, px(152.4) - 6, 'Add Code 128 barcode for shipment_id', 5, '#93c5fd'),
      ],
    },
  },
  {
    id: 'amazon-product-listing',
    name: 'Amazon Product Price Tag',
    category: 'Amazon',
    thumbnail: '',
    size: { width: 70, height: 40 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(70), px(40), '#ffffff', { stroke: '#e5e7eb', strokeWidth: 1 }),
        rect(0, 0, px(70), 14, '#FF9900'),
        boldTxt(6, 2, 'amazon', 8, '#ffffff'),
        boldTxt(6, 18, '{{product_name}}', 10, '#111827', { customData: { template: '{{product_name}}', shrinkToFit: true, maxFontSize: 10, fixedWidth: px(70) - 12 } }),
        txt(6, 36, 'ASIN: {{ASIN}}', 7, '#6b7280', { customData: { template: 'ASIN: {{ASIN}}' } }),
        boldTxt(6, px(40) - 28, '₹{{price}}', 16, '#B12704', { customData: { template: '₹{{price}}' } }),
        txt(px(40), px(40) - 26, 'Was: ₹{{original_price}}', 7, '#6b7280', { customData: { template: 'Was: ₹{{original_price}}' } }),
        txt(px(40), px(40) - 14, 'Save {{=CalcDiscount(row.price,row.original_price)}}%', 7, '#007600', { customData: { template: 'Save {{=CalcDiscount(row.price,row.original_price)}}%' } }),
      ],
    },
  },

  // ── Retail ───────────────────────────────────────────────────────────────
  {
    id: 'retail-circle-sale',
    name: 'Circle Sale Badge',
    category: 'Retail',
    thumbnail: '',
    size: { width: 50, height: 50 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        { type: 'circle', left: 0, top: 0, radius: px(25), fill: '#DC2626', strokeWidth: 0, selectable: false, evented: false },
        boldTxt(px(25) - 30, px(12), 'SALE', 18, '#ffffff', { textAlign: 'center', fontFamily: 'Arial' }),
        boldTxt(px(25) - 40, px(24), '{{discount}}% OFF', 22, '#FEF08A', { textAlign: 'center', fontFamily: 'Arial' }),
        txt(px(25) - 38, px(36), 'Was ₹{{original_price}}', 11, '#fca5a5', { textAlign: 'center' }),
        boldTxt(px(25) - 32, px(44), 'Now ₹{{sale_price}}', 14, '#ffffff', { textAlign: 'center' }),
      ],
    },
  },
  {
    id: 'retail-shelf-talker',
    name: 'Shelf Talker',
    category: 'Retail',
    thumbnail: '',
    size: { width: 80, height: 30 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(80), px(30), '#1e3a5f'),
        rect(px(52), 0, px(28), px(30), '#f59e0b'),
        boldTxt(6, 6, '{{product_name}}', 13, '#ffffff'),
        txt(6, 26, '{{brand}}', 9, '#93c5fd'),
        txt(6, 40, 'SKU: {{sku}}', 8, '#bfdbfe'),
        boldTxt(px(54), 5, '₹', 10, '#1e3a5f'),
        boldTxt(px(55), 10, '{{price}}', 28, '#1e3a5f', { fontFamily: 'Arial' }),
      ],
    },
  },

  // ── Healthcare / Pharma ──────────────────────────────────────────────────
  {
    id: 'pharma-rx-label',
    name: 'Rx Prescription Label',
    category: 'Healthcare',
    thumbnail: '',
    size: { width: 101.6, height: 50.8 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(101.6), px(50.8), '#ffffff', { stroke: '#000000', strokeWidth: 1 }),
        rect(0, 0, px(101.6), px(10), '#1e40af'),
        boldTxt(4, 2, '{{pharmacy_name}}', 10, '#ffffff'),
        txt(px(101.6) - 100, 2, 'Ph: {{pharmacy_phone}}', 8, '#bfdbfe', { textAlign: 'right' }),
        txt(4, 14, 'Rx# {{rx_number}}', 9, '#374151'),
        txt(4, 24, 'Patient: {{patient_name}}', 10, '#111827'),
        boldTxt(4, 36, '{{drug_name}} {{strength}}', 13, '#111827'),
        txt(4, 52, '{{directions}}', 9, '#374151'),
        txt(4, 65, 'Qty: {{quantity}}   Refills: {{refills}}', 9, '#374151'),
        txt(4, 77, 'Dr. {{prescriber}}   Exp: {{expiry_date}}', 9, '#374151'),
        txt(4, 90, 'Dispensed: {{dispensed_date}}', 8, '#6b7280'),
        { type: 'rect', left: px(70), top: px(28), width: px(28), height: px(20), fill: '#fff', stroke: '#d1d5db', strokeWidth: 1, selectable: false, evented: false },
        txt(px(71), px(29), '[Barcode:\n{{rx_number}}]', 7, '#9ca3af'),
      ],
    },
  },
  {
    id: 'lab-specimen',
    name: 'Lab Specimen (Cryogenic)',
    category: 'Healthcare',
    thumbnail: '',
    size: { width: 38, height: 13 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(38), px(13), '#ffffff', { stroke: '#000000', strokeWidth: 0.5 }),
        boldTxt(2, 2, '{{patient_id}}', 8, '#111827'),
        txt(2, 12, '{{sample_type}}', 6, '#374151'),
        txt(2, 20, '{{collected_date}}', 6, '#374151'),
        txt(px(20), 2, '{{test_code}}', 8, '#1d4ed8'),
        txt(px(20), 12, 'Lab: {{lab_id}}', 6, '#374151'),
      ],
    },
  },

  // ── Logistics / Warehouse ─────────────────────────────────────────────────
  {
    id: 'warehouse-location',
    name: 'Warehouse Location',
    category: 'Logistics',
    thumbnail: '',
    size: { width: 100, height: 50 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(100), px(50), '#111827'),
        rect(0, 0, px(100), px(14), '#2563eb'),
        boldTxt(5, 2, '{{warehouse_name}}', 10, '#ffffff'),
        txt(px(100) - 80, 2, 'Zone {{zone}}', 9, '#bfdbfe', { textAlign: 'right' }),
        boldTxt(5, px(14) + 4, '{{aisle}}-{{bay}}-{{level}}', 40, '#f9fafb', { fontFamily: 'Arial' }),
        txt(5, px(50) - 20, 'Cap: {{capacity}} units', 9, '#9ca3af'),
        txt(px(60), px(50) - 20, '{{product_category}}', 9, '#6b7280', { textAlign: 'right' }),
      ],
    },
  },
  {
    id: 'pallet-label',
    name: 'Pallet / Carton Label',
    category: 'Logistics',
    thumbnail: '',
    size: { width: 101.6, height: 152.4 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(101.6), px(152.4), '#ffffff', { stroke: '#000000', strokeWidth: 1 }),
        rect(0, 0, px(101.6), px(20), '#1f2937'),
        boldTxt(5, 4, 'SHIP TO:', 10, '#9ca3af'),
        boldTxt(5, 14, '{{ship_to_name}}', 13, '#ffffff'),
        txt(5, px(20) + 4, '{{ship_to_address}}', 10, '#111827'),
        txt(5, px(20) + 17, '{{ship_to_city}}, {{ship_to_state}} {{ship_to_zip}}', 10, '#111827'),
        { type: 'rect', left: 0, top: px(45), width: px(101.6), height: 1, fill: '#d1d5db', strokeWidth: 0, selectable: false, evented: false },
        txt(5, px(47), 'PO#: {{po_number}}', 10, '#374151'),
        txt(5, px(57), 'Item: {{item_number}}', 10, '#374151'),
        txt(5, px(67), 'Qty: {{quantity}} {{unit}}', 10, '#374151'),
        txt(5, px(77), 'Lot: {{lot_number}}', 10, '#374151'),
        txt(5, px(87), 'Exp: {{expiry_date}}', 10, '#374151'),
        { type: 'rect', left: 0, top: px(100), width: px(101.6), height: 1, fill: '#d1d5db', strokeWidth: 0, selectable: false, evented: false },
        boldTxt(5, px(103), 'Carton {{carton_number}} of {{total_cartons}}', 14, '#111827'),
        txt(5, px(120), 'Weight: {{weight_lbs}} lbs / {{weight_kg}} kg', 9, '#374151'),
        txt(5, px(130), 'Shipped: {{ship_date}}', 9, '#374151'),
        txt(5, px(140), '[Add barcode for {{po_number}} here]', 8, '#9ca3af'),
      ],
    },
  },

  // ── Food / Beverage extras ────────────────────────────────────────────────
  {
    id: 'food-allergen',
    name: 'Allergen Warning Label',
    category: 'Food',
    thumbnail: '',
    size: { width: 70, height: 35 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(70), px(35), '#FEF9C3', { stroke: '#CA8A04', strokeWidth: 2 }),
        rect(0, 0, px(70), px(10), '#CA8A04'),
        boldTxt(5, 1, '⚠ ALLERGEN WARNING', 10, '#ffffff'),
        boldTxt(5, px(12), 'Contains: {{allergens}}', 11, '#78350F'),
        txt(5, px(23), '{{product_name}}', 9, '#92400E'),
        txt(5, px(31), 'Lot: {{lot_number}}   Mfg: {{mfg_date}}', 8, '#92400E'),
      ],
    },
  },
  {
    id: 'food-restaurant',
    name: 'Restaurant / Prep Label',
    category: 'Food',
    thumbnail: '',
    size: { width: 57, height: 32 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(57), px(32), '#ffffff', { stroke: '#d1d5db', strokeWidth: 1 }),
        rect(0, 0, px(57), px(9), '#065F46'),
        boldTxt(4, 1, '{{item_name}}', 10, '#ffffff'),
        txt(4, px(10), 'Prep: {{prep_date}}  {{prep_time}}', 9, '#111827'),
        txt(4, px(19), 'Use by: {{use_by_date}}', 10, '#DC2626', { fontWeight: 'bold' }),
        txt(4, px(28), 'Prep by: {{staff_name}}', 8, '#6b7280'),
      ],
    },
  },

  // ── Serial Number extras ──────────────────────────────────────────────────
  // ── Amazon DIY ───────────────────────────────────────────────────────────
  // Barcode objects use type:'image' + customData.type:'barcode' so the merge
  // engine regenerates them from live data. BLANK_PNG is a 1×1 transparent
  // placeholder so Fabric.js can load the image object at init time.
  {
    id: 'amazon-diy-fnsku-barcode',
    name: 'Amazon FNSKU (with Barcode)',
    category: 'Amazon',
    thumbnail: '',
    size: { width: 66, height: 38 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(66), px(38), '#ffffff', { stroke: '#d1d5db', strokeWidth: 1 }),
        rect(0, 0, px(66), 10, '#FF9900'),
        boldTxt(4, 1, 'amazon', 7, '#ffffff'),
        boldTxt(px(66) - 44, 1, 'FBA', 7, '#ffffff'),
        boldTxt(4, 14, '{{product_name}}', 8, '#111827', {
          customData: { template: '{{product_name}}', shrinkToFit: true, maxFontSize: 8, fixedWidth: px(66) - 8 },
        }),
        { type: 'i-text', left: 4, top: 26, text: 'Condition: {{condition}}', fontSize: 6, fontFamily: 'Arial', fill: '#374151', customData: { template: 'Condition: {{condition}}' } },
        { type: 'i-text', left: 4, top: 35, text: 'SKU: {{sku}}', fontSize: 6, fontFamily: 'Arial', fill: '#6b7280', customData: { template: 'SKU: {{sku}}' } },
        {
          type: 'image',
          src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjE+ibYAAAAASUVORK5CYII=',
          left: 4, top: 44, scaleX: 1, scaleY: 1, width: px(58), height: 30,
          customData: { type: 'barcode', template: '{{FNSKU}}', barcodeType: 'code128', showText: true, barColor: '#000000', bgColor: '#ffffff' },
        },
        { type: 'i-text', left: 4, top: px(38) - 10, text: '{{=today()}}', fontSize: 5, fontFamily: 'Arial', fill: '#9ca3af', customData: { template: '{{=today()}}' } },
      ],
    },
    sampleData: [
      { product_name: 'Wireless Bluetooth Headphones Pro', FNSKU: 'X001AB2CD3', condition: 'New', sku: 'WBH-PRO-BLK' },
      { product_name: 'USB-C Fast Charger 65W', FNSKU: 'X002EF3GH4', condition: 'New', sku: 'USBC-65W-WHT' },
      { product_name: 'Portable Power Bank 20000mAh', FNSKU: 'X003IJ4KL5', condition: 'New', sku: 'PPB-20K-BLK' },
    ],
  },
  {
    id: 'amazon-diy-ean-product',
    name: 'Amazon Product (EAN-13 Barcode)',
    category: 'Amazon',
    thumbnail: '',
    size: { width: 70, height: 50 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(70), px(50), '#ffffff', { stroke: '#e5e7eb', strokeWidth: 1 }),
        rect(0, 0, px(70), 12, '#FF9900'),
        boldTxt(4, 2, 'amazon.in', 8, '#ffffff'),
        boldTxt(4, 16, '{{product_name}}', 9, '#111827', {
          customData: { template: '{{product_name}}', shrinkToFit: true, maxFontSize: 9, fixedWidth: px(70) - 8 },
        }),
        { type: 'i-text', left: 4, top: 32, text: '{{brand}}  |  ASIN: {{ASIN}}', fontSize: 6, fontFamily: 'Arial', fill: '#6b7280', customData: { template: '{{brand}}  |  ASIN: {{ASIN}}' } },
        boldTxt(4, 42, '₹{{price}}', 14, '#B12704', { customData: { template: '₹{{price}}' } }),
        {
          type: 'image',
          src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjE+ibYAAAAASUVORK5CYII=',
          left: px(38), top: 24, scaleX: 1, scaleY: 1, width: px(28), height: 40,
          customData: { type: 'barcode', template: '{{ean13}}', barcodeType: 'ean13', showText: true, barColor: '#000000', bgColor: '#ffffff' },
        },
        { type: 'i-text', left: 4, top: px(50) - 12, text: 'Sold by: {{seller}}  |  {{=today()}}', fontSize: 5, fontFamily: 'Arial', fill: '#9ca3af', customData: { template: 'Sold by: {{seller}}  |  {{=today()}}' } },
      ],
    },
    sampleData: [
      { product_name: 'Smart LED Desk Lamp 12W', brand: 'LumiTech', ASIN: 'B09XYZ1234', ean13: '8901234567890', price: '1499', seller: 'LumiTech Official' },
      { product_name: 'Stainless Steel Water Bottle 1L', brand: 'AquaPure', ASIN: 'B08ABC5678', ean13: '8901234567891', price: '899', seller: 'AquaPure Store' },
    ],
  },
  {
    id: 'amazon-diy-suffocation',
    name: 'Amazon Suffocation Warning',
    category: 'Amazon',
    thumbnail: '',
    size: { width: 76, height: 51 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(76), px(51), '#ffffff', { stroke: '#374151', strokeWidth: 2 }),
        boldTxt(px(76) / 2 - 40, 6, '⚠ WARNING', 14, '#DC2626', { textAlign: 'center' }),
        { type: 'i-text', left: 6, top: 26, text: 'To avoid danger of suffocation, keep this', fontSize: 7, fontFamily: 'Arial', fill: '#111827', customData: { template: 'To avoid danger of suffocation, keep this' } },
        { type: 'i-text', left: 6, top: 36, text: 'bag away from babies and children. Do not', fontSize: 7, fontFamily: 'Arial', fill: '#111827', customData: { template: 'bag away from babies and children. Do not' } },
        { type: 'i-text', left: 6, top: 46, text: 'use in cribs, beds, carriages or playpens.', fontSize: 7, fontFamily: 'Arial', fill: '#111827', customData: { template: 'use in cribs, beds, carriages or playpens.' } },
        { type: 'i-text', left: 6, top: 56, text: 'This bag is not a toy.', fontSize: 7, fontFamily: 'Arial', fill: '#111827', customData: { template: 'This bag is not a toy.' } },
        { type: 'line', x1: 6, y1: 72, x2: px(76) - 6, y2: 72, stroke: '#d1d5db', strokeWidth: 0.5 },
        { type: 'i-text', left: 6, top: 75, text: 'ASIN: {{ASIN}}  SKU: {{sku}}', fontSize: 6, fontFamily: 'Arial', fill: '#6b7280', customData: { template: 'ASIN: {{ASIN}}  SKU: {{sku}}' } },
        { type: 'i-text', left: 6, top: 84, text: '{{product_name}}', fontSize: 6, fontFamily: 'Arial', fill: '#374151', customData: { template: '{{product_name}}' } },
      ],
    },
    sampleData: [
      { ASIN: 'B09XYZ1234', sku: 'POLYBAG-12x16', product_name: 'Clear Poly Bag 12×16 inch' },
      { ASIN: 'B08ABC5678', sku: 'POLYBAG-6x9', product_name: 'Clear Poly Bag 6×9 inch' },
    ],
  },
  {
    id: 'amazon-diy-sold-as-set',
    name: 'Amazon Sold as Set / Bundle',
    category: 'Amazon',
    thumbnail: '',
    size: { width: 66, height: 25 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(66), px(25), '#FFF3CD', { stroke: '#FF9900', strokeWidth: 2 }),
        boldTxt(6, 4, 'SOLD AS SET — DO NOT SEPARATE', 9, '#92400E', { textAlign: 'center' }),
        boldTxt(6, 20, '{{bundle_count}} items', 11, '#B45309'),
        { type: 'i-text', left: 6, top: 36, text: '{{product_name}}', fontSize: 7, fontFamily: 'Arial', fill: '#374151', customData: { template: '{{product_name}}' } },
        { type: 'i-text', left: 6, top: px(25) - 12, text: 'ASIN: {{ASIN}}  FNSKU: {{FNSKU}}', fontSize: 6, fontFamily: 'Arial', fill: '#6b7280', customData: { template: 'ASIN: {{ASIN}}  FNSKU: {{FNSKU}}' } },
      ],
    },
    sampleData: [
      { product_name: 'Kitchen Knife Set', bundle_count: '5', ASIN: 'B07KNIFE05', FNSKU: 'X001KNF5PC' },
      { product_name: 'Baby Clothing Set', bundle_count: '3', ASIN: 'B08BABY03P', FNSKU: 'X002BAB3PC' },
    ],
  },
  {
    id: 'amazon-diy-removal',
    name: 'Amazon Removal Order Label',
    category: 'Amazon',
    thumbnail: '',
    size: { width: 101.6, height: 50.8 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(101.6), px(50.8), '#ffffff', { stroke: '#374151', strokeWidth: 1 }),
        rect(0, 0, px(101.6), 14, '#DC2626'),
        boldTxt(6, 2, 'AMAZON FBA REMOVAL ORDER', 9, '#ffffff'),
        { type: 'i-text', left: 6, top: 20, text: 'Removal ID: {{removal_id}}', fontSize: 8, fontFamily: 'Arial', fill: '#111827', customData: { template: 'Removal ID: {{removal_id}}' } },
        boldTxt(6, 34, '{{product_name}}', 10, '#111827', { customData: { template: '{{product_name}}', shrinkToFit: true, maxFontSize: 10, fixedWidth: px(101.6) - 12 } }),
        { type: 'i-text', left: 6, top: 50, text: 'FNSKU: {{FNSKU}}   ASIN: {{ASIN}}', fontSize: 7, fontFamily: 'Arial', fill: '#374151', customData: { template: 'FNSKU: {{FNSKU}}   ASIN: {{ASIN}}' } },
        { type: 'i-text', left: 6, top: 62, text: 'Qty: {{quantity}}   Condition: {{condition}}', fontSize: 7, fontFamily: 'Arial', fill: '#374151', customData: { template: 'Qty: {{quantity}}   Condition: {{condition}}' } },
        {
          type: 'image',
          src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjE+ibYAAAAASUVORK5CYII=',
          left: px(65), top: 18, scaleX: 1, scaleY: 1, width: px(32), height: 44,
          customData: { type: 'barcode', template: '{{removal_id}}', barcodeType: 'code128', showText: false, barColor: '#000000', bgColor: '#ffffff' },
        },
        { type: 'i-text', left: 6, top: px(50.8) - 14, text: 'Ship to: {{return_address}}', fontSize: 6, fontFamily: 'Arial', fill: '#6b7280', customData: { template: 'Ship to: {{return_address}}' } },
        { type: 'i-text', left: px(65), top: px(50.8) - 14, text: '{{=today()}}', fontSize: 6, fontFamily: 'Arial', fill: '#9ca3af', customData: { template: '{{=today()}}' } },
      ],
    },
    sampleData: [
      { removal_id: 'REM-2024-001234', product_name: 'Wireless Earbuds Pro', FNSKU: 'X001AB2CD3', ASIN: 'B09XYZ1234', quantity: '12', condition: 'Unsellable', return_address: 'Your Warehouse, Mumbai' },
    ],
  },
  {
    id: 'amazon-diy-mto-label',
    name: 'Amazon MTO / Made to Order',
    category: 'Amazon',
    thumbnail: '',
    size: { width: 101.6, height: 38 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(101.6), px(38), '#ffffff', { stroke: '#d1d5db', strokeWidth: 1 }),
        rect(0, 0, 10, px(38), '#FF9900'),
        boldTxt(14, 4, '{{product_name}}', 10, '#111827', {
          customData: { template: '{{product_name}}', shrinkToFit: true, maxFontSize: 10, fixedWidth: px(101.6) - 80 },
        }),
        { type: 'i-text', left: 14, top: 20, text: 'Order: {{order_id}}', fontSize: 7, fontFamily: 'Arial', fill: '#374151', customData: { template: 'Order: {{order_id}}' } },
        { type: 'i-text', left: 14, top: 32, text: 'ASIN: {{ASIN}}  Qty: {{quantity}}', fontSize: 7, fontFamily: 'Arial', fill: '#6b7280', customData: { template: 'ASIN: {{ASIN}}  Qty: {{quantity}}' } },
        { type: 'i-text', left: 14, top: 44, text: 'Customization: {{customization}}', fontSize: 7, fontFamily: 'Arial', fill: '#374151', customData: { template: 'Customization: {{customization}}' } },
        {
          type: 'image',
          src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjE+ibYAAAAASUVORK5CYII=',
          left: px(65), top: 6, scaleX: 1, scaleY: 1, width: px(33), height: 46,
          customData: { type: 'barcode', template: '{{order_id}}', barcodeType: 'code128', showText: false, barColor: '#000000', bgColor: '#ffffff' },
        },
        { type: 'i-text', left: 14, top: px(38) - 14, text: 'Ship by: {{ship_date}}  |  {{=today()}}', fontSize: 6, fontFamily: 'Arial', fill: '#9ca3af', customData: { template: 'Ship by: {{ship_date}}  |  {{=today()}}' } },
      ],
    },
    sampleData: [
      { product_name: 'Custom Engraved Mug', order_id: '114-1234567-8901234', ASIN: 'B08MUG0001', quantity: '2', customization: 'Name: Rahul, Color: Red', ship_date: '2026-06-25' },
    ],
  },

  {
    id: 'serial-prefixed',
    name: 'Serial with Prefix/Suffix',
    category: 'Serial',
    thumbnail: '',
    size: { width: 80, height: 25 },
    canvas_json: {
      version: '5.3.0',
      objects: [
        rect(0, 0, px(80), px(25), '#f8fafc', { stroke: '#cbd5e1', strokeWidth: 1 }),
        txt(5, 4, '{{company}}', 8, '#6b7280'),
        boldTxt(5, 14, '{{#counter:1:1:6:SN-:}}', 20, '#111827', { fontFamily: 'Courier New' }),
        txt(px(80) - 70, px(25) - 16, '{{product_model}}', 8, '#94a3b8', { textAlign: 'right' }),
      ],
    },
  },
]

export const TEMPLATE_CATEGORIES = [...new Set(BUILT_IN_TEMPLATES.map(t => t.category))]

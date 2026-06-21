import { IText, Textbox, Rect, Circle, Line, Triangle, FabricImage, Group, ActiveSelection, loadSVGFromString, util, type Canvas, type FabricObject } from 'fabric'
import { generateBarcodeDataURL } from '@/lib/barcode'
import { MAX_IMAGE_BYTES } from '@/lib/constants'
import { snapshot } from './history'

function uid(): string {
  return Math.random().toString(36).slice(2)
}

export function addText(canvas: Canvas): void {
  snapshot(canvas)
  const obj = new IText('Click to edit text', {
    left: 30, top: 30, fontSize: 16, fontFamily: 'Arial', fill: '#000000',
  }) as IText & { id: string; customData: object }
  obj.id = uid()
  obj.customData = { template: 'Click to edit text' }
  canvas.add(obj)
  canvas.setActiveObject(obj)
  canvas.renderAll()
}

export function addTextbox(canvas: Canvas): void {
  snapshot(canvas)
  const obj = new Textbox('Multi-line text here', {
    left: 30, top: 30, width: 120, fontSize: 14, fontFamily: 'Arial', fill: '#000000',
  }) as Textbox & { id: string; customData: object }
  obj.id = uid()
  obj.customData = { template: 'Multi-line text here' }
  canvas.add(obj)
  canvas.setActiveObject(obj)
  canvas.renderAll()
}

export function addRect(canvas: Canvas): void {
  snapshot(canvas)
  const obj = new Rect({
    left: 30, top: 30, width: 80, height: 40,
    fill: 'transparent', stroke: '#000000', strokeWidth: 1,
  }) as Rect & { id: string }
  obj.id = uid()
  canvas.add(obj)
  canvas.setActiveObject(obj)
  canvas.renderAll()
}

export function addCircle(canvas: Canvas): void {
  snapshot(canvas)
  const obj = new Circle({
    left: 30, top: 30, radius: 30,
    fill: 'transparent', stroke: '#000000', strokeWidth: 1,
  }) as Circle & { id: string }
  obj.id = uid()
  canvas.add(obj)
  canvas.setActiveObject(obj)
  canvas.renderAll()
}

export function addTriangle(canvas: Canvas): void {
  snapshot(canvas)
  const obj = new Triangle({
    left: 30, top: 30, width: 70, height: 60,
    fill: 'transparent', stroke: '#000000', strokeWidth: 1,
  }) as Triangle & { id: string }
  obj.id = uid()
  canvas.add(obj)
  canvas.setActiveObject(obj)
  canvas.renderAll()
}

export function addLine(canvas: Canvas): void {
  snapshot(canvas)
  const obj = new Line([20, 50, 200, 50], {
    stroke: '#000000', strokeWidth: 1,
  }) as Line & { id: string }
  obj.id = uid()
  canvas.add(obj)
  canvas.setActiveObject(obj)
  canvas.renderAll()
}

export async function addBarcode(canvas: Canvas): Promise<void> {
  snapshot(canvas)
  const dataURL = await generateBarcodeDataURL('123456789012', 'ean13')
  const img = await FabricImage.fromURL(dataURL)
  const i = img as FabricImage & { id: string; customData: object }
  i.id = uid()
  i.customData = { type: 'barcode', barcodeType: 'ean13', template: '123456789012' }
  i.scaleToWidth(120)
  i.set({ left: 30, top: 30 })
  canvas.add(i)
  canvas.setActiveObject(i)
  canvas.renderAll()
}

export async function addQR(canvas: Canvas): Promise<void> {
  snapshot(canvas)
  const dataURL = await generateBarcodeDataURL('https://labelforge.app', 'qrcode')
  const img = await FabricImage.fromURL(dataURL)
  const i = img as FabricImage & { id: string; customData: object }
  i.id = uid()
  i.customData = { type: 'barcode', barcodeType: 'qrcode', template: 'https://labelforge.app' }
  i.scaleToWidth(80)
  i.set({ left: 30, top: 30 })
  canvas.add(i)
  canvas.setActiveObject(i)
  canvas.renderAll()
}

export function addImage(canvas: Canvas): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      alert('Image too large. Maximum size is 5 MB.')
      return
    }
    snapshot(canvas)
    const reader = new FileReader()
    reader.onerror = () => { console.error('Failed to read image file') }
    reader.onload = async (e) => {
      const img = await FabricImage.fromURL(e.target!.result as string)
      const i = img as FabricImage & { id: string }
      i.id = uid()
      i.scaleToWidth(100)
      i.set({ left: 30, top: 30 })
      canvas.add(i)
      canvas.setActiveObject(i)
      canvas.renderAll()
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

export function addSvg(canvas: Canvas): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.svg,image/svg+xml'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      alert('SVG too large. Maximum size is 5 MB.')
      return
    }
    const text = await file.text()
    snapshot(canvas)
    const { objects, options } = await loadSVGFromString(text)
    const group = util.groupSVGElements(objects.filter(Boolean) as FabricObject[], options) as Group & { id: string }
    group.id = uid()
    group.scaleToWidth(Math.min(100, canvas.width ?? 200))
    group.set({ left: 30, top: 30 })
    canvas.add(group)
    canvas.setActiveObject(group)
    canvas.renderAll()
  }
  input.click()
}

export function deleteSelected(canvas: Canvas): void {
  snapshot(canvas)
  canvas.getActiveObjects().forEach((o: FabricObject) => canvas.remove(o))
  canvas.discardActiveObject()
  canvas.renderAll()
}

export function duplicateSelected(canvas: Canvas): void {
  const active = canvas.getActiveObject()
  if (!active) return
  snapshot(canvas)
  active.clone(['customData', 'id']).then((cloned: FabricObject) => {
    const cl = cloned as FabricObject & { id: string }
    cl.id = uid()
    cl.set({ left: (active.left ?? 0) + 10, top: (active.top ?? 0) + 10 })
    canvas.add(cl)
    canvas.setActiveObject(cl)
    canvas.renderAll()
  })
}

export function setTextAlign(canvas: Canvas, align: 'left' | 'center' | 'right'): void {
  const obj = canvas.getActiveObject()
  if (obj instanceof IText) {
    obj.set({ textAlign: align })
    canvas.renderAll()
  }
}

// ─── Alignment ────────────────────────────────────────────────────────────────

type AlignDir = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'

export function alignObjects(canvas: Canvas, dir: AlignDir): void {
  const active = canvas.getActiveObject()
  if (!active) return
  const objs = canvas.getActiveObjects()
  if (objs.length < 2) return

  snapshot(canvas)

  const bounds = {
    left:   Math.min(...objs.map(o => o.left ?? 0)),
    top:    Math.min(...objs.map(o => o.top  ?? 0)),
    right:  Math.max(...objs.map(o => (o.left ?? 0) + (o.width  ?? 0) * (o.scaleX ?? 1))),
    bottom: Math.max(...objs.map(o => (o.top  ?? 0) + (o.height ?? 0) * (o.scaleY ?? 1))),
  }

  for (const o of objs) {
    const w = (o.width  ?? 0) * (o.scaleX ?? 1)
    const h = (o.height ?? 0) * (o.scaleY ?? 1)
    if (dir === 'left')   o.set({ left: bounds.left })
    if (dir === 'right')  o.set({ left: bounds.right - w })
    if (dir === 'center') o.set({ left: bounds.left + (bounds.right  - bounds.left - w) / 2 })
    if (dir === 'top')    o.set({ top:  bounds.top })
    if (dir === 'bottom') o.set({ top:  bounds.bottom - h })
    if (dir === 'middle') o.set({ top:  bounds.top  + (bounds.bottom - bounds.top  - h) / 2 })
    o.setCoords()
  }
  canvas.renderAll()
}

// Distribute evenly (horizontal or vertical)
export function distributeObjects(canvas: Canvas, axis: 'h' | 'v'): void {
  const active = canvas.getActiveObject()
  if (!active) return
  const objs = canvas.getActiveObjects()
  if (objs.length < 3) return

  snapshot(canvas)

  if (axis === 'h') {
    const sorted = [...objs].sort((a, b) => (a.left ?? 0) - (b.left ?? 0))
    const totalW = sorted.reduce((s, o) => s + (o.width ?? 0) * (o.scaleX ?? 1), 0)
    const span   = ((sorted.at(-1)?.left ?? 0) + (sorted.at(-1)?.width ?? 0) * (sorted.at(-1)?.scaleX ?? 1))
                 - (sorted[0].left ?? 0)
    const gap    = (span - totalW) / (sorted.length - 1)
    let x = sorted[0].left ?? 0
    for (const o of sorted) {
      o.set({ left: x })
      o.setCoords()
      x += (o.width ?? 0) * (o.scaleX ?? 1) + gap
    }
  } else {
    const sorted = [...objs].sort((a, b) => (a.top ?? 0) - (b.top ?? 0))
    const totalH = sorted.reduce((s, o) => s + (o.height ?? 0) * (o.scaleY ?? 1), 0)
    const span   = ((sorted.at(-1)?.top ?? 0) + (sorted.at(-1)?.height ?? 0) * (sorted.at(-1)?.scaleY ?? 1))
                 - (sorted[0].top ?? 0)
    const gap    = (span - totalH) / (sorted.length - 1)
    let y = sorted[0].top ?? 0
    for (const o of sorted) {
      o.set({ top: y })
      o.setCoords()
      y += (o.height ?? 0) * (o.scaleY ?? 1) + gap
    }
  }
  canvas.renderAll()
}

// ─── Label-relative positioning ──────────────────────────────────────────────

export function flipHorizontal(canvas: Canvas): void {
  const obj = canvas.getActiveObject()
  if (!obj) return
  snapshot(canvas)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(obj as any).set({ flipX: !(obj as any).flipX })
  canvas.renderAll()
}

export function flipVertical(canvas: Canvas): void {
  const obj = canvas.getActiveObject()
  if (!obj) return
  snapshot(canvas)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(obj as any).set({ flipY: !(obj as any).flipY })
  canvas.renderAll()
}

export function centerOnLabel(canvas: Canvas, bleedPx = 0): void {
  const obj = canvas.getActiveObject()
  if (!obj) return
  snapshot(canvas)
  const zoom = canvas.getZoom()
  const totalW = (canvas.width  ?? 0) / zoom
  const totalH = (canvas.height ?? 0) / zoom
  const labelW = totalW - 2 * bleedPx
  const labelH = totalH - 2 * bleedPx
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ow = ((obj as any).width  ?? 0) * ((obj as any).scaleX ?? 1)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oh = ((obj as any).height ?? 0) * ((obj as any).scaleY ?? 1)
  obj.set({ left: bleedPx + (labelW - ow) / 2, top: bleedPx + (labelH - oh) / 2 })
  obj.setCoords()
  canvas.renderAll()
}

export function fitToLabel(canvas: Canvas, bleedPx = 0): void {
  const obj = canvas.getActiveObject()
  if (!obj) return
  snapshot(canvas)
  const zoom = canvas.getZoom()
  const totalW = (canvas.width  ?? 0) / zoom
  const totalH = (canvas.height ?? 0) / zoom
  const labelW = totalW - 2 * bleedPx
  const labelH = totalH - 2 * bleedPx
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ow = (obj as any).width  ?? 1
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oh = (obj as any).height ?? 1
  obj.set({ left: bleedPx, top: bleedPx, scaleX: labelW / ow, scaleY: labelH / oh })
  obj.setCoords()
  canvas.renderAll()
}

// ─── Internal copy / paste ────────────────────────────────────────────────────

let _copyBuffer: import('fabric').FabricObject | null = null

export function copySelected(canvas: Canvas): void {
  const obj = canvas.getActiveObject()
  if (!obj) return
  obj.clone(['customData', 'id']).then((cloned: FabricObject) => {
    _copyBuffer = cloned
  })
}

export function pasteBuffer(canvas: Canvas): void {
  if (!_copyBuffer) return
  snapshot(canvas)
  _copyBuffer.clone(['customData', 'id']).then((cloned: FabricObject) => {
    const cl = cloned as FabricObject & { id: string }
    cl.id = uid()
    cl.set({ left: (cloned.left ?? 0) + 10, top: (cloned.top ?? 0) + 10 })
    canvas.add(cl)
    canvas.setActiveObject(cl)
    canvas.renderAll()
    // Update buffer position so repeated pastes cascade
    if (_copyBuffer) {
      _copyBuffer.set({ left: (_copyBuffer.left ?? 0) + 10, top: (_copyBuffer.top ?? 0) + 10 })
    }
  })
}

// ─── Clipboard paste ──────────────────────────────────────────────────────────

export async function pasteFromClipboard(canvas: Canvas): Promise<void> {
  try {
    const items = await navigator.clipboard.read()
    for (const item of items) {
      const imageType = item.types.find(t => t.startsWith('image/'))
      if (!imageType) continue
      const blob = await item.getType(imageType)
      const url  = URL.createObjectURL(blob)
      snapshot(canvas)
      const img = await FabricImage.fromURL(url)
      const i   = img as FabricImage & { id: string }
      i.id = uid()
      i.scaleToWidth(Math.min(100, canvas.width ?? 100))
      i.set({ left: 20, top: 20 })
      canvas.add(i)
      canvas.setActiveObject(i)
      canvas.renderAll()
      URL.revokeObjectURL(url)
      return
    }
  } catch {
    // Clipboard API not available or no image — silently ignore
  }
}

// ─── Z-order ──────────────────────────────────────────────────────────────────

export function bringToFront(canvas: Canvas): void {
  const obj = canvas.getActiveObject()
  if (!obj) return
  canvas.bringObjectToFront(obj)
  canvas.renderAll()
}

export function sendToBack(canvas: Canvas): void {
  const obj = canvas.getActiveObject()
  if (!obj) return
  canvas.sendObjectToBack(obj)
  canvas.renderAll()
}

export function bringForward(canvas: Canvas): void {
  const obj = canvas.getActiveObject()
  if (!obj) return
  canvas.bringObjectForward(obj)
  canvas.renderAll()
}

export function sendBackward(canvas: Canvas): void {
  const obj = canvas.getActiveObject()
  if (!obj) return
  canvas.sendObjectBackwards(obj)
  canvas.renderAll()
}

/**
 * Group the currently selected objects into a single Layer group.
 * The group inherits the "Show when" condition field from PropertiesPanel,
 * letting you hide/show the entire group based on a merge-row expression.
 */
export function groupSelected(canvas: Canvas): void {
  const active = canvas.getActiveObject()
  if (!active || active.type !== 'activeSelection') return
  snapshot(canvas)
  const sel = active as ActiveSelection
  if (sel.getObjects().length < 2) return
  // Fabric.js 6: toGroup() converts the ActiveSelection in-place
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const group = (sel as any).toGroup() as Group & { id: string; customData: { type: string; condition: string } }
  group.id = uid()
  group.customData = { type: 'layer', condition: '' }
  canvas.setActiveObject(group)
  canvas.renderAll()
}

/**
 * Break a Layer group back into individual objects and select them all.
 */
export function ungroupSelected(canvas: Canvas): void {
  const active = canvas.getActiveObject()
  if (!active || active.type !== 'group') return
  snapshot(canvas)
  // Fabric.js 6: toActiveSelection() breaks the group in-place
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sel = (active as any).toActiveSelection() as ActiveSelection
  canvas.setActiveObject(sel)
  canvas.renderAll()
}

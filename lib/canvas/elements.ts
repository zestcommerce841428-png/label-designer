import { IText, Rect, Circle, Line, FabricImage, Group, ActiveSelection, type Canvas, type FabricObject } from 'fabric'
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

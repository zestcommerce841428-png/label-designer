'use client'

import {
  Canvas, IText, Rect, Circle, Line, FabricImage,
  type FabricObject
} from 'fabric'
import {
  Type, Square, Circle as CircleIcon, Minus, Image as ImageIcon,
  QrCode, Undo2, Redo2, Trash2, Copy, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react'
import { getCanvas } from './FabricCanvas'
import { generateBarcodeDataURL } from '@/lib/barcode'

const historyStack: string[] = []
const redoStack: string[] = []

function snapshot() {
  const c = getCanvas()
  if (!c) return
  historyStack.push(JSON.stringify(c.toObject(['customData', 'id'])))
  redoStack.length = 0
}

function undo() {
  const c = getCanvas()
  if (!c || historyStack.length < 2) return
  redoStack.push(historyStack.pop()!)
  const prev = JSON.parse(historyStack[historyStack.length - 1])
  c.loadFromJSON(prev).then(() => c.renderAll())
}

function redo() {
  const c = getCanvas()
  if (!c || !redoStack.length) return
  const next = redoStack.pop()!
  historyStack.push(next)
  c.loadFromJSON(JSON.parse(next)).then(() => c.renderAll())
}

function uid() { return Math.random().toString(36).slice(2) }

function addText() {
  const c = getCanvas(); if (!c) return
  snapshot()
  const obj = new IText('Click to edit text', {
    left: 30, top: 30, fontSize: 16, fontFamily: 'Arial', fill: '#000000',
  }) as IText & { id: string; customData: object }
  obj.id = uid()
  obj.customData = { template: 'Click to edit text' }
  c.add(obj); c.setActiveObject(obj); c.renderAll()
}

function addRect() {
  const c = getCanvas(); if (!c) return
  snapshot()
  const obj = new Rect({
    left: 30, top: 30, width: 80, height: 40,
    fill: 'transparent', stroke: '#000000', strokeWidth: 1,
  }) as Rect & { id: string }
  obj.id = uid()
  c.add(obj); c.setActiveObject(obj); c.renderAll()
}

function addCircle() {
  const c = getCanvas(); if (!c) return
  snapshot()
  const obj = new Circle({
    left: 30, top: 30, radius: 30,
    fill: 'transparent', stroke: '#000000', strokeWidth: 1,
  }) as Circle & { id: string }
  obj.id = uid()
  c.add(obj); c.setActiveObject(obj); c.renderAll()
}

function addLine() {
  const c = getCanvas(); if (!c) return
  snapshot()
  const obj = new Line([20, 50, 200, 50], {
    stroke: '#000000', strokeWidth: 1,
  }) as Line & { id: string }
  obj.id = uid()
  c.add(obj); c.setActiveObject(obj); c.renderAll()
}

async function addBarcode() {
  const c = getCanvas(); if (!c) return
  snapshot()
  const dataURL = await generateBarcodeDataURL('123456789012', 'ean13')
  const img = await FabricImage.fromURL(dataURL)
  const i = img as FabricImage & { id: string; customData: object }
  i.id = uid()
  i.customData = { type: 'barcode', barcodeType: 'ean13', template: '123456789012' }
  i.scaleToWidth(120)
  i.set({ left: 30, top: 30 })
  c.add(i); c.setActiveObject(i); c.renderAll()
}

async function addQR() {
  const c = getCanvas(); if (!c) return
  snapshot()
  const dataURL = await generateBarcodeDataURL('https://labelforge.app', 'qrcode')
  const img = await FabricImage.fromURL(dataURL)
  const i = img as FabricImage & { id: string; customData: object }
  i.id = uid()
  i.customData = { type: 'barcode', barcodeType: 'qrcode', template: 'https://labelforge.app' }
  i.scaleToWidth(80)
  i.set({ left: 30, top: 30 })
  c.add(i); c.setActiveObject(i); c.renderAll()
}

function addImage() {
  const input = document.createElement('input')
  input.type = 'file'; input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]; if (!file) return
    const c = getCanvas(); if (!c) return
    snapshot()
    const reader = new FileReader()
    reader.onload = async (e) => {
      const img = await FabricImage.fromURL(e.target!.result as string)
      const i = img as FabricImage & { id: string }
      i.id = uid()
      i.scaleToWidth(100)
      i.set({ left: 30, top: 30 })
      c.add(i); c.setActiveObject(i); c.renderAll()
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

function deleteSelected() {
  const c = getCanvas(); if (!c) return
  snapshot()
  c.getActiveObjects().forEach((o: FabricObject) => c.remove(o))
  c.discardActiveObject(); c.renderAll()
}

function duplicateSelected() {
  const c = getCanvas(); if (!c) return
  snapshot()
  const active = c.getActiveObject()
  if (!active) return
  active.clone(['customData', 'id']).then((cloned: FabricObject) => {
    const cl = cloned as FabricObject & { id: string }
    cl.id = uid()
    cl.set({ left: (active.left ?? 0) + 10, top: (active.top ?? 0) + 10 })
    c.add(cl); c.setActiveObject(cl); c.renderAll()
  })
}

function setAlign(align: 'left' | 'center' | 'right') {
  const c = getCanvas(); if (!c) return
  const obj = c.getActiveObject()
  if (obj instanceof IText) { obj.set({ textAlign: align }); c.renderAll() }
}

function Tool({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label}
      className="flex items-center justify-center w-8 h-8 rounded hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 transition-colors">
      <Icon className="w-4 h-4" />
    </button>
  )
}

function Sep() { return <div className="w-px h-5 bg-zinc-200 mx-0.5" /> }

export default function Toolbar() {
  return (
    <div className="flex items-center gap-0.5 px-3 py-2 bg-white border-b border-zinc-200 flex-wrap shrink-0">
      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mr-2">Add</span>
      <Tool icon={Type} label="Text" onClick={addText} />
      <Tool icon={Square} label="Rectangle" onClick={addRect} />
      <Tool icon={CircleIcon} label="Circle" onClick={addCircle} />
      <Tool icon={Minus} label="Line" onClick={addLine} />
      <Tool icon={ImageIcon} label="Image" onClick={addImage} />
      <Tool icon={QrCode} label="QR Code" onClick={addQR} />
      <button type="button" onClick={addBarcode} title="Barcode (EAN-13)" aria-label="Add barcode"
        className="flex items-center gap-1 px-2 h-8 rounded hover:bg-zinc-100 text-zinc-700 text-xs font-medium transition-colors">
        ▮▯▮ Barcode
      </button>
      <Sep />
      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mr-1">Align</span>
      <Tool icon={AlignLeft} label="Left" onClick={() => setAlign('left')} />
      <Tool icon={AlignCenter} label="Center" onClick={() => setAlign('center')} />
      <Tool icon={AlignRight} label="Right" onClick={() => setAlign('right')} />
      <Sep />
      <Tool icon={Copy} label="Duplicate" onClick={duplicateSelected} />
      <Tool icon={Trash2} label="Delete" onClick={deleteSelected} />
      <Sep />
      <Tool icon={Undo2} label="Undo" onClick={undo} />
      <Tool icon={Redo2} label="Redo" onClick={redo} />
    </div>
  )
}

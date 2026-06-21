'use client'

import { useState, useEffect, useCallback } from 'react'
import { IText, FabricImage, type FabricObject } from 'fabric'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { getCanvas } from './FabricCanvas'
import { BARCODE_GROUPS, generateBarcodeDataURL } from '@/lib/barcode'
import { LABEL_SIZES } from '@/lib/label-sizes'
import { useEditorStore } from '@/lib/store/editor'
import type { AnyFabricObj } from '@/types/fabric-extensions'

export default function PropertiesPanel() {
  const { activeObjectId, selectedSize, setSelectedSize } = useEditorStore()
  const [obj, setObj] = useState<AnyFabricObj | null>(null)
  const [version, setVersion] = useState(0)

  const syncObj = useCallback(() => {
    const active = getCanvas()?.getActiveObject()
    setObj(active ? (active as AnyFabricObj) : null)
  }, [])

  // Sync selected object when selection changes
  useEffect(() => {
    syncObj()
  }, [activeObjectId, syncObj])

  // Re-read obj props after each canvas modification so controls stay in sync
  useEffect(() => {
    const canvas = getCanvas()
    if (!canvas) return
    const handler = () => setVersion(v => v + 1)
    canvas.on('object:modified', handler)
    return () => { canvas.off('object:modified', handler) }
  }, [])

  // Force re-read from the live canvas object when version bumps
  useEffect(() => {
    syncObj()
  }, [version, syncObj])

  function updateShape(props: Record<string, unknown>) {
    const c = getCanvas()
    if (!c || !obj) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(obj as any).set(props)
    c.renderAll()
    setVersion(v => v + 1)
  }

  async function updateBarcode(value: string, type: string) {
    const c = getCanvas()
    if (!c || !obj) return
    try {
      const dataURL = await generateBarcodeDataURL(value, type as 'qrcode')
      if (obj instanceof FabricImage) {
        const imgObj = obj as FabricImage & { customData?: Record<string, unknown> }
        await imgObj.setSrc(dataURL)
        imgObj.customData = { ...imgObj.customData, template: value, barcodeType: type }
        c.renderAll()
        setVersion(v => v + 1)
      }
    } catch {
      // Barcode generation can fail for invalid values (e.g. wrong EAN digit count) — silently ignore
    }
  }

  function updateCondition(condition: string) {
    const c = getCanvas()
    if (!c || !obj) return
    ;(obj as AnyFabricObj).customData = { ...obj.customData, condition }
    c.renderAll()
  }

  const isText = obj instanceof IText
  const isBarcode = obj?.customData?.type === 'barcode'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textObj = isText ? (obj as any) : null

  return (
    <aside className="w-60 bg-white border-l border-zinc-200 overflow-y-auto shrink-0">
      <div className="p-4 border-b border-zinc-100">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Label Size</h3>
        <select
          title="Label size"
          value={selectedSize.id}
          onChange={e => {
            const s = LABEL_SIZES.find(s => s.id === e.target.value)
            if (s) setSelectedSize(s)
          }}
          className="w-full text-sm border border-zinc-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {LABEL_SIZES.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <p className="text-xs text-zinc-400 mt-1">{selectedSize.width} × {selectedSize.height} mm</p>
      </div>

      {!obj && (
        <div className="p-4 text-xs text-zinc-400">Select an element to edit properties.</div>
      )}

      {obj && isText && textObj && (
        <div className="p-4 space-y-3">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Text</h3>
          <div>
            <label className="text-xs text-zinc-600 block mb-1">Content / Merge tag</label>
            <textarea
              className="w-full text-sm border border-zinc-300 rounded-md px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              value={textObj.text ?? ''}
              onChange={e => {
                textObj.set({ text: e.target.value })
                ;(obj as AnyFabricObj).customData = { ...obj.customData, template: e.target.value }
                getCanvas()?.renderAll()
                setVersion(v => v + 1)
              }}
              placeholder="Text or {{field_name}}"
            />
          </div>
          <PRow label="Font size">
            <input type="number" min={6} max={200} title="Font size"
              className="w-16 text-sm border border-zinc-300 rounded px-2 py-1"
              value={textObj.fontSize ?? 16}
              onChange={e => updateShape({ fontSize: +e.target.value })} />
          </PRow>
          <PRow label="Color">
            <input type="color" title="Text color"
              value={String(textObj.fill ?? '#000000')}
              onChange={e => updateShape({ fill: e.target.value })} />
          </PRow>
          <PRow label="Align">
            <div className="flex gap-0.5">
              {(['left','center','right'] as const).map(align => {
                const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight
                return (
                  <button
                    key={align}
                    type="button"
                    title={align}
                    onClick={() => updateShape({ textAlign: align })}
                    className={`p-1 rounded transition-colors ${textObj.textAlign === align ? 'bg-blue-100 text-blue-700' : 'text-zinc-500 hover:bg-zinc-100'}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                )
              })}
            </div>
          </PRow>
          <PRow label="Bold">
            <input type="checkbox" title="Bold"
              checked={textObj.fontWeight === 'bold'}
              onChange={e => updateShape({ fontWeight: e.target.checked ? 'bold' : 'normal' })} />
          </PRow>
          <PRow label="Italic">
            <input type="checkbox" title="Italic"
              checked={textObj.fontStyle === 'italic'}
              onChange={e => updateShape({ fontStyle: e.target.checked ? 'italic' : 'normal' })} />
          </PRow>
          <PRow label="Line height">
            <input type="number" min={0.5} max={4} step={0.1} title="Line height"
              className="w-16 text-sm border border-zinc-300 rounded px-2 py-1"
              value={textObj.lineHeight ?? 1.16}
              onChange={e => updateShape({ lineHeight: +e.target.value })} />
          </PRow>
        </div>
      )}

      {obj && isBarcode && (() => {
        const bObj = obj as AnyFabricObj
        return (
          <div className="p-4 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Barcode</h3>
            <div>
              <label className="text-xs text-zinc-600 block mb-1">Type</label>
              <select
                title="Barcode type"
                className="w-full text-sm border border-zinc-300 rounded-md px-2 py-1.5"
                value={bObj.customData?.barcodeType ?? 'qrcode'}
                onChange={e => updateBarcode(bObj.customData?.template ?? '', e.target.value)}
              >
                {BARCODE_GROUPS.map(g => (
                  <optgroup key={g.label} label={g.label}>
                    {g.types.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-600 block mb-1">Value / Merge tag</label>
              <input type="text"
                className="w-full text-sm border border-zinc-300 rounded-md px-2 py-1.5"
                value={bObj.customData?.template ?? ''}
                onChange={e => updateBarcode(e.target.value, bObj.customData?.barcodeType ?? 'qrcode')}
                placeholder="Value or {{barcode}}"
              />
            </div>
          </div>
        )
      })()}

      {obj && !isText && !isBarcode && obj instanceof FabricImage && (() => {
        const imgObj = obj as AnyFabricObj
        return (
          <div className="p-4 space-y-3 border-b border-zinc-100">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Image</h3>
            <div>
              <label className="text-xs text-zinc-600 block mb-1">Source URL / Merge tag</label>
              <input type="text"
                className="w-full text-xs border border-zinc-300 rounded-md px-2 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="https://… or {{image_url}}"
                value={imgObj.customData?.template ?? ''}
                onChange={e => {
                  ;(obj as AnyFabricObj).customData = { ...imgObj.customData, template: e.target.value }
                  getCanvas()?.renderAll()
                }}
              />
              <p className="text-xs text-zinc-400 mt-1">
                Use a merge tag to load a different image per data row.
              </p>
            </div>
          </div>
        )
      })()}

      {obj && !isText && !isBarcode && !(obj instanceof FabricImage) && (() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sObj = obj as any
        return (
          <div className="p-4 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Shape</h3>
            <PRow label="Fill">
              <input type="color" title="Fill color"
                value={String(sObj.fill ?? '#ffffff')}
                onChange={e => updateShape({ fill: e.target.value })} />
            </PRow>
            <PRow label="Stroke">
              <input type="color" title="Stroke color"
                value={String(sObj.stroke ?? '#000000')}
                onChange={e => updateShape({ stroke: e.target.value })} />
            </PRow>
            <PRow label="Stroke width">
              <input type="number" min={0} max={20} title="Stroke width"
                className="w-16 text-sm border border-zinc-300 rounded px-2 py-1"
                value={sObj.strokeWidth ?? 1}
                onChange={e => updateShape({ strokeWidth: +e.target.value })} />
            </PRow>
            <PRow label="Opacity">
              <input type="range" min={0} max={1} step={0.05} title="Opacity"
                value={sObj.opacity ?? 1}
                onChange={e => updateShape({ opacity: +e.target.value })} />
            </PRow>
          </div>
        )
      })()}

      {obj && (
        <div className="p-4 border-t border-zinc-100 space-y-2">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Logic</h3>
          <div>
            <label className="text-xs text-zinc-600 block mb-1">
              Show when <span className="text-zinc-400">(JS expression)</span>
            </label>
            <input
              type="text"
              className="w-full text-xs border border-zinc-300 rounded-md px-2 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={`row.status === "active"`}
              value={obj.customData?.condition ?? ''}
              onChange={e => updateCondition(e.target.value)}
              title="Leave empty to always show. Use row.field to reference data."
            />
            <p className="text-xs text-zinc-400 mt-1">
              e.g. <code className="bg-zinc-100 px-1 rounded">row.qty &gt; 0</code>
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}

function PRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-zinc-600 shrink-0">{label}</span>
      {children}
    </div>
  )
}

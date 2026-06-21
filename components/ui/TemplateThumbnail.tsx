'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  canvasJson: object
  width: number  // label width in mm
  height: number // label height in mm
  className?: string
}

const MM_TO_PX = 3.7795275591

export default function TemplateThumbnail({ canvasJson, width, height, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      entries => {
        if (!entries[0].isIntersecting) return
        observer.disconnect()
        renderThumbnail()
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)

    async function renderThumbnail() {
      try {
        const { StaticCanvas } = await import('fabric')

        const scaledW = Math.round(width  * MM_TO_PX)
        const scaledH = Math.round(height * MM_TO_PX)

        // Render at full resolution then scale down via CSS
        const fc = new StaticCanvas(undefined, {
          width:  scaledW,
          height: scaledH,
          renderOnAddRemove: false,
        })

        await fc.loadFromJSON(canvasJson)
        fc.renderAll()

        const url = fc.toDataURL({ format: 'jpeg', multiplier: 1, quality: 0.8 })
        fc.dispose()

        if (!cancelled) setDataUrl(url)
      } catch {
        if (!cancelled) setError(true)
      }
    }

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [canvasJson, width, height])

  if (error) {
    return (
      <div ref={containerRef} className={className}>
        <div className="w-full h-full flex items-center justify-center text-[var(--fg-subtle)] text-xs">
          {width}×{height}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={className}>
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt="Template preview"
          className="w-full h-full object-contain"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[var(--border)] border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

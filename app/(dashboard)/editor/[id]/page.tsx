import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditorClient from './EditorClient'

async function EditorLoader({ id }: { id: string }) {
  const supabase = await createClient()

  const { data: label } = await supabase
    .from('labels')
    .select('*')
    .eq('id', id)
    .single()

  if (!label) notFound()

  return <EditorClient label={label} />
}

// params is a runtime API — must be accessed inside Suspense
export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">Loading editor…</div>}>
      <EditorPageInner params={params} />
    </Suspense>
  )
}

async function EditorPageInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EditorLoader id={id} />
}

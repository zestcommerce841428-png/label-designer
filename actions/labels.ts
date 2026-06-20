'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createLabel() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('labels')
    .insert({ user_id: user.id, name: 'Untitled Label', canvas_json: {} })
    .select('id')
    .single()

  if (error) throw error
  redirect(`/editor/${data.id}`)
}

export async function saveLabel(id: string, name: string, canvasJson: object, sizeConfig: object) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('labels')
    .update({ name, canvas_json: canvasJson, size_config: sizeConfig })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
  revalidatePath('/dashboard')
  revalidatePath(`/editor/${id}`)
}

export async function deleteLabel(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase.from('labels').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/dashboard')
}

export async function duplicateLabel(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: src } = await supabase.from('labels').select('*').eq('id', id).single()
  if (!src) throw new Error('Label not found')

  const { data, error } = await supabase
    .from('labels')
    .insert({ user_id: user.id, name: `${src.name} (copy)`, canvas_json: src.canvas_json, size_config: src.size_config })
    .select('id')
    .single()

  if (error) throw error
  revalidatePath('/dashboard')
}

export async function logPrintJob(labelId: string, labelName: string, recordCount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase.from('print_jobs').insert({
    user_id: user.id,
    label_id: labelId,
    label_name: labelName,
    record_count: recordCount,
    status: 'done',
  })
  revalidatePath('/history')
}

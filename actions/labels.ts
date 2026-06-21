'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertUUID, assertLabelName, assertCanvasJson, assertRecordCount } from '@/lib/validation'

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

export async function saveLabel(
  id: string,
  name: string,
  canvasJson: object,
  sizeConfig: object,
  thumbnail?: string | null,
) {
  assertUUID(id)
  assertLabelName(name)
  assertCanvasJson(canvasJson)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const update: Record<string, unknown> = {
    name: name.trim(),
    canvas_json: canvasJson,
    size_config: sizeConfig,
  }
  if (thumbnail !== undefined) update.thumbnail = thumbnail

  const { error } = await supabase
    .from('labels')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
  revalidatePath('/dashboard')
  revalidatePath(`/editor/${id}`)
}

export async function saveAsNewLabel(
  id: string,
  name: string,
  canvasJson: object,
  sizeConfig: object,
): Promise<string> {
  assertUUID(id)
  assertLabelName(name)
  assertCanvasJson(canvasJson)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('labels')
    .insert({
      user_id: user.id,
      name: name.trim(),
      canvas_json: canvasJson,
      size_config: sizeConfig,
    })
    .select('id')
    .single()

  if (error) throw error
  revalidatePath('/dashboard')
  return data.id
}

export async function renameLabel(id: string, name: string) {
  assertUUID(id)
  assertLabelName(name)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('labels')
    .update({ name: name.trim() })
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
}

export async function deleteLabel(id: string) {
  assertUUID(id)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase.from('labels').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/dashboard')
}

export async function duplicateLabel(id: string) {
  assertUUID(id)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: src } = await supabase
    .from('labels')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!src) throw new Error('Label not found')

  const { error } = await supabase
    .from('labels')
    .insert({
      user_id: user.id,
      name: `${src.name} (copy)`,
      canvas_json: src.canvas_json,
      size_config: src.size_config,
    })
    .select('id')
    .single()

  if (error) throw error
  revalidatePath('/dashboard')
}

export async function logPrintJob(labelId: string, labelName: string, recordCount: number) {
  assertUUID(labelId, 'labelId')
  assertLabelName(labelName)
  assertRecordCount(recordCount)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase.from('print_jobs').insert({
    user_id: user.id,
    label_id: labelId,
    label_name: labelName.trim(),
    record_count: recordCount,
    status: 'done',
  })
  revalidatePath('/history')
}

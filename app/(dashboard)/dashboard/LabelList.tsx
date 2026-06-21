import { createClient } from '@/lib/supabase/server'
import LabelGrid from './LabelGrid'

export default async function LabelList() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: labels } = await supabase
    .from('labels')
    .select('id, name, size_config, thumbnail, updated_at')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })

  return <LabelGrid labels={labels ?? []} />
}

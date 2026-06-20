import { BUILT_IN_TEMPLATES, TEMPLATE_CATEGORIES } from '@/lib/templates'
import { cacheLife } from 'next/cache'
import TemplateGrid from './TemplateGrid'

export default async function TemplatesPage() {
  'use cache'
  cacheLife('hours')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Template Library</h1>
        <p className="text-zinc-500 mt-1 text-sm">Choose a template to start your label design</p>
      </div>
      <TemplateGrid templates={BUILT_IN_TEMPLATES} categories={TEMPLATE_CATEGORIES} />
    </div>
  )
}

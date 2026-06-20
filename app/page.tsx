import Link from 'next/link'

const features = [
  { icon: '🎨', title: 'Visual Designer', desc: 'Drag-and-drop canvas with text, shapes, images, and barcodes' },
  { icon: '📊', title: 'Data Merge', desc: 'Import CSV or Excel and auto-fill label fields from your data' },
  { icon: '▮▯▮', title: '8 Barcode Types', desc: 'QR Code, EAN-13, Code 128, Data Matrix and more' },
  { icon: '🖨️', title: 'Print Anywhere', desc: 'Print from any browser on any OS — no install needed' },
  { icon: '📄', title: 'PDF & PNG Export', desc: 'Export high-res PDFs or PNGs for professional printing' },
  { icon: '📁', title: '10 Templates', desc: 'Product, shipping, price tag, food label, and more' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-zinc-100">
        <span className="text-xl font-bold text-blue-600 tracking-tight">LabelForge</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-zinc-600 hover:text-zinc-900">Sign in</Link>
          <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          ✨ Now available in your browser — no install required
        </div>
        <h1 className="text-5xl font-bold text-zinc-900 leading-tight tracking-tight mb-6">
          Design & print labels<br />
          <span className="text-blue-600">from anywhere</span>
        </h1>
        <p className="text-xl text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          The professional label designer that works in your browser. Import your product data,
          design once, print thousands.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/signup" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm">
            Start designing free →
          </Link>
          <Link href="/templates" className="px-6 py-3 bg-zinc-100 text-zinc-700 font-semibold rounded-xl hover:bg-zinc-200 transition-colors text-sm">
            Browse templates
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-8 pb-24">
        <h2 className="text-2xl font-bold text-zinc-900 text-center mb-12">Everything you need to label your products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(f => (
            <div key={f.title} className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-zinc-900 mb-1">{f.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to start designing?</h2>
        <p className="text-blue-100 mb-8 text-sm">Free plan includes 3 labels and 50 prints per month.</p>
        <Link href="/signup" className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors text-sm">
          Create free account
        </Link>
      </section>

      <footer className="py-8 text-center text-xs text-zinc-400">
        © 2025 LabelForge. Built with Next.js 16.
      </footer>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'

const YEAR = 2026

export const metadata: Metadata = {
  title: 'LabelForge — Professional Web Label Designer',
  description:
    'Design, merge, and print professional product labels from your browser. Import CSV/Excel, add barcodes, print on Avery sheets — no software to install.',
  alternates: { canonical: '/' },
}

const features = [
  {
    icon: '🎨',
    title: 'Visual Drag-and-Drop Designer',
    desc: 'Canvas editor with text, shapes, images, and 95 barcode types. Full undo/redo, alignment tools, and layer groups.',
  },
  {
    icon: '📊',
    title: 'CSV & Excel Data Merge',
    desc: 'Import your product data and auto-fill {{field}} merge tags. Or connect a live Google Sheets URL.',
  },
  {
    icon: '▮▯▮',
    title: '95 Barcode Types',
    desc: 'QR Code, EAN-13, Code 128, Data Matrix, GS1, PDF417, HIBC, ITF, and many more — rendered client-side.',
  },
  {
    icon: '🖨️',
    title: 'Sheet & Thermal Printing',
    desc: 'Print single labels, batch hundreds, or tile on Avery 5160/L7160 sheets. Export ZPL II or TSPL for thermal printers.',
  },
  {
    icon: '⚡',
    title: 'Formula Engine',
    desc: 'Use {{= row.price * 1.1 }} or await httpGet() to pull live data. Built-in helpers: fmt(), If(), Left(), CalcDiscount().',
  },
  {
    icon: '📄',
    title: '28+ Templates',
    desc: 'Amazon FNSKU, food labels, hang tags, shipping labels, price tags, asset tags, and more — ready to customise.',
  },
  {
    icon: '🔑',
    title: 'REST API',
    desc: 'Trigger print jobs from your own systems using API keys. Integrate with Shopify, WooCommerce, or any ERP.',
  },
  {
    icon: '🔒',
    title: 'Secure by Default',
    desc: 'Supabase auth, row-level security, HSTS, CSP headers, and SSRF-safe HTTP formula proxy.',
  },
  {
    icon: '☁️',
    title: 'Works Everywhere',
    desc: 'Chrome, Firefox, Safari, Edge — any browser, any OS. Your labels live in the cloud, accessible from anywhere.',
  },
]

const pricing = [
  { plan: 'Free',     price: '$0',  period: '/mo', limits: '3 labels · 50 prints · CSV import',           cta: 'Get started', href: '/signup', highlight: false },
  { plan: 'Starter',  price: '$12', period: '/mo', limits: '50 labels · 500 prints · Google Sheets',      cta: 'Start trial',  href: '/signup', highlight: false },
  { plan: 'Pro',      price: '$29', period: '/mo', limits: 'Unlimited labels · API access · 3 seats',      cta: 'Start trial',  href: '/signup', highlight: true  },
  { plan: 'Business', price: '$79', period: '/mo', limits: '10 seats · DB connections · priority support', cta: 'Contact us',  href: '/signup', highlight: false },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'LabelForge',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Any (web browser)',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description: 'Professional web-based label design and printing platform.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://labelforge.app',
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
        {/* Nav */}
        <header className="sticky top-0 z-30 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)]">
          <nav
            className="flex items-center justify-between px-6 sm:px-8 py-3.5 max-w-7xl mx-auto"
            aria-label="Main navigation"
          >
            <Link href="/" className="flex items-center gap-2" aria-label="LabelForge home">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">LF</span>
              </div>
              <span className="text-base font-bold text-[var(--fg)] tracking-tight">LabelForge</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/templates" className="hidden sm:block text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors px-2 py-1">
                Templates
              </Link>
              <ThemeToggle compact />
              <Link href="/login" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors px-2 py-1">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm"
              >
                Get started free
              </Link>
            </div>
          </nav>
        </header>

        <main>
          {/* Hero */}
          <section className="max-w-4xl mx-auto px-6 sm:px-8 py-20 sm:py-28 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-blue-200 dark:border-blue-800">
              ✨ No software to install — works in any browser
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--fg)] leading-tight tracking-tight mb-6">
              Design &amp; print labels<br />
              <span className="text-blue-600">from anywhere</span>
            </h1>
            <p className="text-lg sm:text-xl text-[var(--fg-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
              The professional label designer that runs in your browser. Import product data,
              design once, merge thousands of unique labels, and print on any printer.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-7 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all text-sm shadow-sm hover:shadow-md"
              >
                Start designing free →
              </Link>
              <Link
                href="/templates"
                className="w-full sm:w-auto px-7 py-3 bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg)] font-semibold rounded-xl hover:border-blue-400 transition-all text-sm"
              >
                Browse templates
              </Link>
            </div>
            <p className="mt-4 text-xs text-[var(--fg-subtle)]">Free plan · No credit card required</p>
          </section>

          {/* Social proof strip */}
          <section className="bg-[var(--bg-subtle)] border-y border-[var(--border)] py-10 text-center" aria-label="Key metrics">
            <div className="max-w-4xl mx-auto px-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { value: '95',   label: 'Barcode types' },
                { value: '28+',  label: 'Built-in templates' },
                { value: '500',  label: 'Labels per batch' },
                { value: '100%', label: 'Browser-based' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-3xl font-bold text-blue-600">{value}</p>
                  <p className="text-sm text-[var(--fg-muted)] mt-1">{label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Feature grid */}
          <section className="max-w-6xl mx-auto px-6 sm:px-8 py-20" aria-labelledby="features-heading">
            <h2 id="features-heading" className="text-2xl sm:text-3xl font-bold text-[var(--fg)] text-center mb-3">
              Everything you need to label your products
            </h2>
            <p className="text-center text-[var(--fg-muted)] text-sm mb-12 max-w-xl mx-auto">
              From small batches to enterprise scale — LabelForge grows with your operation.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map(f => (
                <article key={f.title} className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md dark:hover:shadow-black/20 transition-all">
                  <div className="text-3xl mb-3" aria-hidden>{f.icon}</div>
                  <h3 className="font-semibold text-[var(--fg)] mb-2 text-sm">{f.title}</h3>
                  <p className="text-sm text-[var(--fg-muted)] leading-relaxed">{f.desc}</p>
                </article>
              ))}
            </div>
          </section>

          {/* Pricing */}
          <section className="bg-[var(--bg-subtle)] border-t border-[var(--border)]">
            <div className="max-w-5xl mx-auto px-6 sm:px-8 py-20" aria-labelledby="pricing-heading">
              <h2 id="pricing-heading" className="text-2xl sm:text-3xl font-bold text-[var(--fg)] text-center mb-3">
                Simple, transparent pricing
              </h2>
              <p className="text-center text-[var(--fg-muted)] text-sm mb-12">Start free. Upgrade when you need more.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {pricing.map(p => (
                  <div
                    key={p.plan}
                    className={`rounded-2xl border p-6 flex flex-col ${
                      p.highlight
                        ? 'border-blue-500 bg-blue-600 text-white shadow-xl shadow-blue-500/20'
                        : 'border-[var(--border)] bg-[var(--bg-card)]'
                    }`}
                  >
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${p.highlight ? 'text-blue-200' : 'text-[var(--fg-subtle)]'}`}>
                      {p.plan}
                    </p>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className={`text-3xl font-bold ${p.highlight ? 'text-white' : 'text-[var(--fg)]'}`}>{p.price}</span>
                      <span className={`text-sm ${p.highlight ? 'text-blue-200' : 'text-[var(--fg-subtle)]'}`}>{p.period}</span>
                    </div>
                    <p className={`text-xs mb-6 flex-1 leading-relaxed ${p.highlight ? 'text-blue-100' : 'text-[var(--fg-muted)]'}`}>
                      {p.limits}
                    </p>
                    <Link
                      href={p.href}
                      className={`text-center py-2 rounded-xl text-sm font-semibold transition-all ${
                        p.highlight
                          ? 'bg-white text-blue-600 hover:bg-blue-50 shadow-sm'
                          : 'bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-blue-400'
                      }`}
                    >
                      {p.cta}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-blue-600 py-20 text-center px-6" aria-labelledby="cta-heading">
            <h2 id="cta-heading" className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Ready to start designing?
            </h2>
            <p className="text-blue-100 mb-8 text-sm max-w-md mx-auto">
              Free plan includes 3 labels and 50 prints per month. No credit card required.
            </p>
            <Link
              href="/signup"
              className="inline-block px-8 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors text-sm shadow-sm"
            >
              Create free account →
            </Link>
          </section>
        </main>

        <footer className="py-8 px-8 border-t border-[var(--border)] bg-[var(--bg)]">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[var(--fg-subtle)]">© {YEAR} LabelForge. All rights reserved.</p>
            <nav className="flex items-center gap-6" aria-label="Footer navigation">
              <Link href="/templates" className="text-xs text-[var(--fg-subtle)] hover:text-[var(--fg)] transition-colors">Templates</Link>
              <Link href="/login"     className="text-xs text-[var(--fg-subtle)] hover:text-[var(--fg)] transition-colors">Sign in</Link>
              <Link href="/signup"    className="text-xs text-[var(--fg-subtle)] hover:text-[var(--fg)] transition-colors">Sign up</Link>
            </nav>
          </div>
        </footer>
      </div>
    </>
  )
}

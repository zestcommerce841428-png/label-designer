import type { NextConfig } from 'next'

const CSP = [
  "default-src 'self'",
  // Fabric.js and bwip-js require eval at runtime
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  // data: and blob: for canvas PNG exports; Supabase storage for images
  "img-src 'self' data: blob: https://*.supabase.co",
  // Supabase REST + Realtime; /api/script-fetch proxies external URLs server-side
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  // Web Workers from blob URLs (Fabric.js off-screen canvas)
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  // Prevents browsers sniffing MIME types
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  // Disallow embedding in frames from other origins
  { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
  // Control referrer info sent on navigation
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  // Disable browser-side XSS filter (modern browsers use CSP instead)
  { key: 'X-XSS-Protection',          value: '0' },
  // Enable HTTPS preloading (only effective when actually on HTTPS)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Restrict browser feature access
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Speed up DNS resolution for known origins
  { key: 'X-DNS-Prefetch-Control',    value: 'on' },
  // Content Security Policy
  { key: 'Content-Security-Policy',   value: CSP },
]

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig

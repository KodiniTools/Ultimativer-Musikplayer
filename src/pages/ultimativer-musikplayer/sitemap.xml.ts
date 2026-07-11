/**
 * Ultimativer Musikplayer – Sitemap
 * Statischer Endpoint, der beim Build nach
 * dist/ultimativer-musikplayer/sitemap.xml generiert wird und damit unter
 * https://kodinitools.com/ultimativer-musikplayer/sitemap.xml erreichbar ist.
 *
 * Enthält alle öffentlichen Seiten der Anwendung. Die Basis-URL wird aus der
 * Astro-Konfiguration (site + base) abgeleitet – Single Source of Truth.
 */
import type { APIRoute } from 'astro'

// Seiten der Anwendung relativ zur Basis-URL (mit führendem Slash).
// changefreq/priority als Hinweis für Suchmaschinen.
const pages = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/app', changefreq: 'monthly', priority: '0.8' },
]

export const GET: APIRoute = ({ site }) => {
  // site = https://kodinitools.com (aus astro.config.mjs), base = /ultimativer-musikplayer
  const base = import.meta.env.BASE_URL.replace(/\/$/, '') // -> /ultimativer-musikplayer
  const origin = (site?.origin ?? 'https://kodinitools.com').replace(/\/$/, '')
  const lastmod = new Date().toISOString().split('T')[0]

  const urls = pages
    .map((page) => {
      const loc = `${origin}${base}${page.path === '/' ? '/' : page.path}`
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}

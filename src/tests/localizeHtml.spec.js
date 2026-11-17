// @vitest-environment node
import { test } from 'vitest'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { escapeHtml, localizeHtml } from '../utils/localizeHtml.js'
import { EN_PAGES, appMeta, pageMeta } from '../config/pageMeta.js'

// Prüft die englische Sprachfassung, die der Build als dist/ultimativer-musikplayer/index.en.html schreibt
// (nginx liefert sie für ?lang=en aus), gegen den Quelltext der Landingpage (index.astro).
const html = readFileSync(
  new URL('../pages/ultimativer-musikplayer/index.astro', import.meta.url),
  'utf8'
)
const DE = pageMeta.de
const EN = pageMeta.en
const DE_URL = pageMeta.url
const EN_URL = `${DE_URL}?lang=en`

const unescape = (value) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
const pick = (source, pattern) => unescape(source.match(pattern)?.[1] ?? '')
const headOf = (source) => source.slice(0, source.search(/<\/head>/i))
const title = (source) => pick(headOf(source), /<title[^>]*>([\s\S]*?)<\/title>/i)
const lang = (source) => pick(source, /<html\b[^>]*\slang="([^"]*)"/i)
const meta = (source, name) =>
  pick(
    headOf(source).match(
      new RegExp(`<meta\\b[^>]*\\s(?:name|property)="${name}"[^>]*>`, 'i')
    )?.[0] ?? '',
    /\scontent="([^"]*)"/i
  )
const canonical = (source) =>
  pick(headOf(source).match(/<link\b[^>]*\srel="canonical"[^>]*>/i)?.[0] ?? '', /\shref="([^"]*)"/i)
const hreflangs = (source) => headOf(source).match(/<link\b[^>]*\shreflang="[^"]*"[^>]*>/gi) ?? []

const en = localizeHtml(html, { lang: 'en', ...EN, canonical: EN_URL })

test('englische Fassung: lang, Titel, Description und Canonical', () => {
  assert.equal(lang(en), 'en')
  assert.equal(title(en), EN.title)
  assert.equal(meta(en, 'description'), EN.description)
  assert.equal(canonical(en), EN_URL)
})

test('englische Fassung: Open Graph und Twitter folgen, soweit vorhanden', () => {
  for (const name of ['og:title', 'twitter:title']) {
    if (meta(html, name)) assert.equal(meta(en, name), EN.title)
  }
  for (const name of ['og:description', 'twitter:description']) {
    if (meta(html, name)) assert.equal(meta(en, name), EN.description)
  }
  for (const name of ['og:url', 'twitter:url']) {
    if (meta(html, name)) assert.equal(meta(en, name), EN_URL)
  }
  if (meta(html, 'og:locale')) assert.equal(meta(en, 'og:locale'), 'en_US')
})

test('hreflang, Body und SSI-Includes bleiben unverändert', () => {
  assert.equal(hreflangs(html).length, 3)
  assert.deepEqual(hreflangs(en), hreflangs(html))
  assert.equal(en.slice(en.search(/<\/head>/i)), html.slice(html.search(/<\/head>/i)))
  const includes = (source) => source.match(/<!--\s*#include [^>]*-->/g) ?? []
  assert.deepEqual(includes(en), includes(html))
})

test('deutscher Head der Quelldatei stimmt mit den Metadaten überein', () => {
  assert.equal(lang(html), 'de')
  assert.equal(title(html), DE.title)
  assert.equal(meta(html, 'description'), DE.description)
  assert.equal(canonical(html), DE_URL)
})

test('englische Metadaten halten die SEO-Längen ein', () => {
  assert.ok(EN.title.length <= 70, `Titel ${EN.title.length} Zeichen`)
  assert.ok(EN.description.length >= 100 && EN.description.length <= 165)
})

test('maskiert Sonderzeichen und bricht bei fehlenden oder doppelten Pflicht-Tags ab', () => {
  const minimal = (extra = '') =>
    `<!doctype html><html lang="de"><head><title>T</title>` +
    `<meta name="description" content="D"><link rel="canonical" href="${DE_URL}">${extra}` +
    `</head><body><svg><title>Icon</title></svg></body></html>`
  const head = { lang: 'en', title: 'A & "B" <C>', description: 'x > y & z', canonical: EN_URL }
  const out = localizeHtml(minimal(), head)
  assert.ok(out.includes('<title>A &amp; &quot;B&quot; &lt;C&gt;</title>'))
  assert.ok(out.includes('content="x &gt; y &amp; z"'))
  assert.ok(out.includes('<svg><title>Icon</title></svg>'))
  assert.equal(escapeHtml('$&'), '$&amp;')
  assert.throws(() => localizeHtml(minimal().replace(/<link[^>]*>/, ''), head), /canonical/)
  assert.throws(
    () => localizeHtml(minimal('<meta name="description" content="E">'), head),
    /description/
  )
  assert.throws(() => localizeHtml('<html lang="de"><title>x</title>', head), /head/)
})

// App-Seite: der Build schreibt dist/ultimativer-musikplayer/app/index.en.html.
const appHtml = readFileSync(
  new URL('../pages/ultimativer-musikplayer/app.astro', import.meta.url),
  'utf8'
)
const APP_EN_URL = `${appMeta.url}?lang=en`
const appEn = localizeHtml(appHtml, { lang: 'en', ...appMeta.en, canonical: APP_EN_URL })

test('App-Seite: englische Fassung mit eigenem Titel, Description und Canonical', () => {
  assert.equal(lang(appEn), 'en')
  assert.equal(title(appEn), appMeta.en.title)
  assert.equal(meta(appEn, 'description'), appMeta.en.description)
  assert.equal(canonical(appEn), APP_EN_URL)
  assert.notEqual(appMeta.en.title, EN.title)
})

test('App-Seite: hreflang zeigt auf die App-Seite, Body bleibt unverändert', () => {
  assert.deepEqual(
    hreflangs(appEn).map((link) => pick(link, /\shref="([^"]*)"/i)),
    [appMeta.url, APP_EN_URL, appMeta.url]
  )
  assert.equal(appEn.slice(appEn.search(/<\/head>/i)), appHtml.slice(appHtml.search(/<\/head>/i)))
})

test('App-Seite: deutscher Head der Quelldatei stimmt mit den Metadaten überein', () => {
  assert.equal(lang(appHtml), 'de')
  assert.equal(title(appHtml), appMeta.de.title)
  assert.equal(meta(appHtml, 'description'), appMeta.de.description)
  assert.equal(canonical(appHtml), appMeta.url)
})

test('der Build schreibt je deutsche Seite genau eine englische Fassung daneben', () => {
  assert.deepEqual(
    EN_PAGES.map(({ source, file }) => [source, file]),
    [
      ['ultimativer-musikplayer/index.html', 'ultimativer-musikplayer/index.en.html'],
      ['ultimativer-musikplayer/app/index.html', 'ultimativer-musikplayer/app/index.en.html'],
    ]
  )
  assert.deepEqual(
    EN_PAGES.map(({ meta: pageData }) => pageData.url),
    [pageMeta.url, appMeta.url]
  )
})

import enUS from './en-US.json'

type LocaleKey = keyof typeof enUS
type LocaleMap = Partial<Record<LocaleKey, string>>

/**
 * Statically bundled locale fallback.
 *
 * In v0.3.0 only `en-US` is bundled eagerly. The other 18 locales are
 * loaded on demand by `loadLocale(key)` via dynamic `import()`, which
 * lets a bundler split them into their own chunks. Consumers that only
 * use English do not pay for the other dictionaries.
 *
 * If a locale is requested before its chunk arrives, lookups fall back
 * to `en-US` and then to the raw key. Existing `load(key, dictionary)`
 * still works for fully custom registrations.
 */
const locales: Record<string, LocaleMap> = {
  'en-US': enUS,
}

const loaders: Record<string, () => Promise<{ default: LocaleMap }>> = {
  'zh-CN': () => import('./zh-CN.json'),
  'ja-JP': () => import('./ja-JP.json'),
  'ko-KR': () => import('./ko-KR.json'),
  'de-DE': () => import('./de-DE.json'),
  'fr-FR': () => import('./fr-FR.json'),
  'es-ES': () => import('./es-ES.json'),
  'pt-BR': () => import('./pt-BR.json'),
  'ru-RU': () => import('./ru-RU.json'),
  'ar-SA': () => import('./ar-SA.json'),
  'hi-IN': () => import('./hi-IN.json'),
  'tr-TR': () => import('./tr-TR.json'),
  'nl-NL': () => import('./nl-NL.json'),
  'pl-PL': () => import('./pl-PL.json'),
  'it-IT': () => import('./it-IT.json'),
  'vi-VN': () => import('./vi-VN.json'),
  'th-TH': () => import('./th-TH.json'),
  'id-ID': () => import('./id-ID.json'),
}

const inflight: Record<string, Promise<LocaleMap | null>> = {}

/**
 * Register a locale dictionary explicitly. Use this to ship your own
 * translations or to override a built-in locale at runtime.
 */
export function load(key: string, ls: LocaleMap): void {
  locales[key] = ls
}

/**
 * Asynchronously load one of the built-in locales. Resolves with the
 * dictionary, or `null` when the locale is not a built-in (already
 * loaded locales return the cached map). Subsequent lookups for that
 * locale will return its translations.
 *
 * ```ts
 * await loadLocale('ja-JP')
 * chartRef.current?.setLocale('ja-JP')
 * ```
 */
export function loadLocale(key: string): Promise<LocaleMap | null> {
  const cached = locales[key]
  if (cached) return Promise.resolve(cached)
  if (key in inflight) return inflight[key]
  const loader = loaders[key]
  if (!loader) return Promise.resolve(null)
  inflight[key] = loader().then(mod => {
    locales[key] = mod.default
    delete inflight[key]
    return mod.default
  })
  return inflight[key]
}

/** Names of all built-in locales that can be passed to `loadLocale`. */
export const BUILTIN_LOCALES: ReadonlyArray<string> = [
  'en-US', 'zh-CN', 'ja-JP', 'ko-KR', 'de-DE', 'fr-FR', 'es-ES', 'pt-BR',
  'ru-RU', 'ar-SA', 'hi-IN', 'tr-TR', 'nl-NL', 'pl-PL', 'it-IT', 'vi-VN',
  'th-TH', 'id-ID',
]

export default (key: string, locale: string): string => {
  const raw = (locales[locale]?.[key as LocaleKey] ?? locales['en-US']?.[key as LocaleKey] ?? key)
  // Strip HTML tags to prevent XSS via locale injection.
  // Consumers that need rich text should use the raw locale map directly.
  return raw.replace(/<[^>]*>/g, '')
}

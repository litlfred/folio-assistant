/**
 * Site language. Source order: ?lang=<code> in the URL (then remembered), else the remembered choice in
 * localStorage, else the browser's first supported language, else English. Changing it stores the
 * choice and reloads the page, because the scenario text is filled in once at start-up.
 *
 * The six UN languages, as web-app.json `locales` lists them. English is the source; the others are
 * translated through smart-trust's translation process (translations/<locale>/apps/onboarding-game.po).
 */
export const LOCALES = ['en', 'ar', 'es', 'fr', 'ru', 'zh'] as const;
export type Lang = (typeof LOCALES)[number];

/** Each language's name in itself, for the switcher. */
export const NATIVE: Record<Lang, string> = { en: 'English', ar: 'العربية', es: 'Español', fr: 'Français', ru: 'Русский', zh: '中文' };
/** Short label for the switcher button. */
export const SHORT: Record<Lang, string> = { en: 'EN', ar: 'ع', es: 'ES', fr: 'FR', ru: 'RU', zh: '中' };

const KEY = 'gdhcn-lang';

export const isLang = (v: unknown): v is Lang => typeof v === 'string' && (LOCALES as readonly string[]).includes(v);

function detect(): Lang {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (isLang(q)) {
      try { localStorage.setItem(KEY, q); } catch { /* private window: the URL still wins for this load */ }
      return q;
    }
  } catch { /* no location (build tooling) */ }
  try {
    const s = localStorage.getItem(KEY);
    if (isLang(s)) return s;
  } catch { /* blocked storage */ }
  try {
    for (const l of navigator.languages ?? []) { const b = l.slice(0, 2).toLowerCase(); if (isLang(b)) return b; }
  } catch { /* no navigator */ }
  return 'en';
}

let current: Lang = detect();

export const lang = (): Lang => current;

/** Writing direction: Arabic is right to left. */
export const dir = (l: Lang = current): 'rtl' | 'ltr' => (l === 'ar' ? 'rtl' : 'ltr');

/** Set <html lang> and <html dir> for the current language. Called once at start-up. */
export function applyHtmlLang() {
  document.documentElement.lang = current;
  document.documentElement.dir = dir();
}

/** Store the choice, drop ?lang from the URL so it cannot override it, and reload. */
export function setLang(next: Lang) {
  try { localStorage.setItem(KEY, next); } catch { /* private window: carry it in the URL instead */
    const url = new URL(location.href); url.searchParams.set('lang', next); location.replace(url.toString()); return;
  }
  try { sessionStorage.removeItem('uc-lang'); } catch { /* ignore */ }
  const url = new URL(location.href);
  if (url.searchParams.has('lang')) { url.searchParams.delete('lang'); history.replaceState(null, '', url.toString()); }
  location.reload();
}

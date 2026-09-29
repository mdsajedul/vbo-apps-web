import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './config';
import { LocaleDirection, SupportedLocale } from './types';

interface I18nState {
  locale: SupportedLocale;
  dir: LocaleDirection;
  isRTL: boolean;
  setLocale: (locale: SupportedLocale) => void;
}

function updateDocumentLocale(locale: SupportedLocale, dir: LocaleDirection) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    // Set cookie for potential SSR / middleware access
    document.cookie = `bos_locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  }
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      dir: SUPPORTED_LOCALES[DEFAULT_LOCALE]?.dir || 'ltr',
      isRTL: (SUPPORTED_LOCALES[DEFAULT_LOCALE]?.dir || 'ltr') === 'rtl',
      setLocale: (newLocale) => {
        const targetLocale = SUPPORTED_LOCALES[newLocale]?.enabled ? newLocale : DEFAULT_LOCALE;
        const dir = SUPPORTED_LOCALES[targetLocale]?.dir || 'ltr';
        const isRTL = dir === 'rtl';

        updateDocumentLocale(targetLocale, dir);

        set({
          locale: targetLocale,
          dir,
          isRTL,
        });
      },
    }),
    {
      name: 'bos-locale-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.locale) {
          const dir = SUPPORTED_LOCALES[state.locale]?.dir || 'ltr';
          updateDocumentLocale(state.locale, dir);
        }
      },
    }
  )
);

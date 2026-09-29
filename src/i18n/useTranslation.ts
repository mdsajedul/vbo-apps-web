'use client';

import { useCallback } from 'react';
import { useI18nStore } from './store';
import { ACTIVE_LOCALES, SUPPORTED_LOCALES } from './config';
import { SupportedLocale, TranslationParams } from './types';
import { en } from './locales/en';
import { bn } from './locales/bn';

const DICTIONARIES: Record<string, any> = {
  en,
  bn,
};

function resolveNestedKey(obj: any, path: string): string | undefined {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(text: string, params?: TranslationParams): string {
  if (!params || !text) return text;
  return Object.entries(params).reduce((acc, [key, val]) => {
    return acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
  }, text);
}

export function useTranslation() {
  const { locale, setLocale, dir, isRTL } = useI18nStore();

  const t = useCallback(
    (key: string, params?: TranslationParams, fallback?: string): string => {
      const activeDict = DICTIONARIES[locale] || DICTIONARIES.en;
      let translation = resolveNestedKey(activeDict, key);

      // Fallback to English if missing in active locale
      if (!translation && locale !== 'en') {
        translation = resolveNestedKey(DICTIONARIES.en, key);
      }

      // If still missing, use provided fallback or key
      if (!translation) {
        translation = fallback || key.split('.').pop() || key;
      }

      return interpolate(translation, params);
    },
    [locale]
  );

  const formatCurrency = useCallback(
    (amount: number, customSymbol?: string): string => {
      const defaultSymbol = locale === 'bn' ? '৳' : '$';
      const symbol = customSymbol !== undefined ? customSymbol : defaultSymbol;
      const formattedNumber = Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      return `${symbol} ${formattedNumber}`;
    },
    [locale]
  );

  return {
    locale,
    setLocale,
    dir,
    isRTL,
    t,
    formatCurrency,
    locales: ACTIVE_LOCALES,
    currentMetadata: SUPPORTED_LOCALES[locale] || SUPPORTED_LOCALES.en,
  };
}

export const useLanguage = useTranslation;


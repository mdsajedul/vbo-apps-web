'use client';

import { useState } from 'react';
import { useTranslation } from '@/i18n';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { SUPPORTED_LOCALES } from '@/i18n/config';
import { SupportedLocale } from '@/i18n/types';

interface LanguageSwitcherProps {
  compact?: boolean;
}

/**
 * High-definition, cross-platform SVG Flag component.
 * Avoids browser/OS text fallback issues (e.g. Windows rendering country emojis as "US" / "BD" text).
 */
export function FlagIcon({ code, className = "w-5 h-3.5" }: { code: string; className?: string }) {
  if (code === 'en') {
    return (
      <svg 
        viewBox="0 0 20 14" 
        className={`inline-block rounded-[2px] shadow-2xs shrink-0 border border-slate-200/80 dark:border-slate-700 ${className}`}
        aria-hidden="true"
      >
        <rect width="20" height="14" fill="#b22234" />
        <path d="M0,2.15h20v1.08h-20z M0,4.31h20v1.08h-20z M0,6.46h20v1.08h-20z M0,8.62h20v1.08h-20z M0,10.77h20v1.08h-20z M0,12.92h20v1.08h-20z" fill="#fff" />
        <rect width="8.5" height="7.54" fill="#3c3b6e" />
        <circle cx="2" cy="1.8" r="0.5" fill="#fff" />
        <circle cx="4.25" cy="1.8" r="0.5" fill="#fff" />
        <circle cx="6.5" cy="1.8" r="0.5" fill="#fff" />
        <circle cx="3.12" cy="3.77" r="0.5" fill="#fff" />
        <circle cx="5.37" cy="3.77" r="0.5" fill="#fff" />
        <circle cx="2" cy="5.7" r="0.5" fill="#fff" />
        <circle cx="4.25" cy="5.7" r="0.5" fill="#fff" />
        <circle cx="6.5" cy="5.7" r="0.5" fill="#fff" />
      </svg>
    );
  }

  if (code === 'bn') {
    return (
      <svg 
        viewBox="0 0 20 14" 
        className={`inline-block rounded-[2px] shadow-2xs shrink-0 border border-slate-200/80 dark:border-slate-700 ${className}`}
        aria-hidden="true"
      >
        <rect width="20" height="14" fill="#006a4e" />
        <circle cx="9" cy="7" r="4.2" fill="#f42a41" />
      </svg>
    );
  }

  if (code === 'ar') {
    return (
      <svg 
        viewBox="0 0 20 14" 
        className={`inline-block rounded-[2px] shadow-2xs shrink-0 border border-slate-200/80 dark:border-slate-700 ${className}`}
        aria-hidden="true"
      >
        <rect width="20" height="14" fill="#006C35" />
        <path d="M4 7h12v1H4z" fill="#fff" opacity="0.9" />
        <circle cx="10" cy="5" r="1" fill="#fff" opacity="0.9" />
      </svg>
    );
  }

  if (code === 'hi') {
    return (
      <svg 
        viewBox="0 0 20 14" 
        className={`inline-block rounded-[2px] shadow-2xs shrink-0 border border-slate-200/80 dark:border-slate-700 ${className}`}
        aria-hidden="true"
      >
        <rect width="20" height="4.66" fill="#FF9933" />
        <rect y="4.66" width="20" height="4.66" fill="#FFFFFF" />
        <rect y="9.33" width="20" height="4.66" fill="#138808" />
        <circle cx="10" cy="7" r="1.8" fill="none" stroke="#000080" strokeWidth="0.6" />
        <circle cx="10" cy="7" r="0.5" fill="#000080" />
      </svg>
    );
  }

  return null;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const current = SUPPORTED_LOCALES[locale] || SUPPORTED_LOCALES.en;
  const currentDisplay = current.code === 'en' ? 'ENG' : 'বাংলা';

  const handleSelect = (code: SupportedLocale) => {
    setLocale(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button: [Flag] ENG / [Flag] বাংলা */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 transition-all text-xs font-semibold shadow-2xs cursor-pointer ${
          compact ? 'px-2 py-1' : ''
        }`}
        title="Switch Language / ভাষা পরিবর্তন"
        aria-label="Switch Language"
      >
        <FlagIcon code={current.code} className="w-4 h-3" />
        {!compact && (
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {currentDisplay}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Click-outside backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Language / ভাষা
              </span>
            </div>

            <div className="p-1 space-y-0.5">
              {/* Active / Enabled Languages */}
              {Object.values(SUPPORTED_LOCALES)
                .filter((l) => l.enabled)
                .map((item) => {
                  const isSelected = item.code === locale;
                  const itemLabel = item.code === 'en' ? 'ENG' : 'বাংলা';
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleSelect(item.code)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FlagIcon code={item.code} className="w-5 h-3.5" />
                        <span className="font-semibold text-xs">{itemLabel}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    </button>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

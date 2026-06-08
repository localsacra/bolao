import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLang } from '../contexts/LanguageContext';
import type { Language } from '../i18n';

interface LanguageOption {
  code: Language;
  flagUrl: string;
  emoji: string;
  label: string;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: 'pt',
    flagUrl: 'https://flagcdn.com/w40/br.png',
    emoji: '🇧🇷',
    label: 'PT',
  },
  {
    code: 'en',
    flagUrl: 'https://flagcdn.com/w40/ie.png',
    emoji: '🇮🇪',
    label: 'EN',
  },
];

export function LanguageToggle() {
  const { lang, setLang } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentLanguage = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg 
                   bg-slate-900 border border-white/20 text-white/90 
                   hover:bg-white/10 hover:text-white transition-all duration-200 
                   focus:outline-none cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="relative w-5 h-3.5 flex items-center justify-center overflow-hidden rounded-sm">
          <img
            src={currentLanguage.flagUrl}
            alt={currentLanguage.emoji}
            className="w-full h-full object-cover shadow-sm"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
          <span className="hidden text-xs">{currentLanguage.emoji}</span>
        </span>
        
        <span className="text-xs font-bold uppercase tracking-wider">
          {currentLanguage.label}
        </span>

        <ChevronDown 
          className={`w-3.5 h-3.5 text-white/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute right-0 mt-1.5 w-24 rounded-lg 
                     bg-slate-900 border border-white/10 shadow-xl z-50 
                     overflow-hidden py-1"
        >
          {LANGUAGES.map((langOption) => (
            <li key={langOption.code}>
              <button
                onClick={() => {
                  setLang(langOption.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors duration-150
                           cursor-pointer ${
                             langOption.code === lang
                               ? 'bg-white/10 text-green-400 font-bold'
                               : 'text-white/80 hover:bg-white/5 hover:text-white'
                           }`}
              >
                <span className="relative w-5 h-3.5 flex items-center justify-center overflow-hidden rounded-sm">
                  <img
                    src={langOption.flagUrl}
                    alt={langOption.emoji}
                    className="w-full h-full object-cover shadow-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                  <span className="hidden text-xs">{langOption.emoji}</span>
                </span>
                <span className="font-bold uppercase">{langOption.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

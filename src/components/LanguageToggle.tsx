import { useLang } from '../contexts/LanguageContext';

// Flag SVG URLs from flagcdn.com (reliable, fast CDN)
const FLAGS = {
  pt: {
    url: 'https://flagcdn.com/w40/br.png',
    label: 'Português (Brasil)',
    alt: '🇧🇷',
  },
  en: {
    url: 'https://flagcdn.com/w40/ie.png',
    label: 'English (Ireland)',
    alt: '🇮🇪',
  },
};

export function LanguageToggle() {
  const { lang, setLang } = useLang();
  const other = lang === 'pt' ? 'en' : 'pt';
  const flag = FLAGS[other]; // Show the flag you'd SWITCH TO

  return (
    <button
      onClick={() => setLang(other)}
      title={`Switch to ${flag.label}`}
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg 
                 hover:bg-white/10 transition-colors duration-200
                 border border-white/20"
    >
      <img
        src={flag.url}
        alt={flag.alt}
        className="w-6 h-4 rounded-sm object-cover shadow-sm"
        onError={(e) => {
          // Fallback to emoji if image fails
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling!.classList.remove('hidden');
        }}
      />
      <span className="hidden text-sm">{flag.alt}</span>
      <span className="text-xs text-white/80 font-medium uppercase">
        {other}
      </span>
    </button>
  );
}

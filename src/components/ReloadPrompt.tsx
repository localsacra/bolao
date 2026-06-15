import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { useLang } from '../contexts/LanguageContext';
import { t } from '../i18n';
import { RefreshCw, Wifi, X } from 'lucide-react';

export function ReloadPrompt() {
  const { lang } = useLang();
  const [showUpdating, setShowUpdating] = useState(false);
  const [showOfflineReady, setShowOfflineReady] = useState(false);

  useEffect(() => {
    // Register the service worker and check for updates
    registerSW({
      onOfflineReady() {
        setShowOfflineReady(true);
        // Automatically hide offline ready toast after 4 seconds
        setTimeout(() => setShowOfflineReady(false), 4000);
      },
      onNeedRefresh() {
        // Fallback for browsers/scenarios where controllerchange doesn't fire
        setShowUpdating(true);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    });

    // Guard against infinite reload loops on controllerchange
    let refreshing = false;
    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      setShowUpdating(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      }
    };
  }, []);

  if (!showUpdating && !showOfflineReady) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      {showUpdating && (
        <div className="bg-slate-800/95 border border-slate-700/80 rounded-xl p-4 shadow-2xl backdrop-blur-md flex items-center gap-3 text-slate-100 animate-slide-up">
          <div className="p-2 bg-green-500/10 text-green-400 rounded-lg shrink-0">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white">
              {t(lang, 'pwa.updating')}
            </h4>
          </div>
        </div>
      )}

      {showOfflineReady && !showUpdating && (
        <div className="bg-slate-800/95 border border-slate-700/80 rounded-xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3 text-slate-100 animate-slide-up">
          <div className="p-2 bg-green-500/10 text-green-400 rounded-lg shrink-0">
            <Wifi className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white">
              {t(lang, 'pwa.offlineReady')}
            </h4>
          </div>
          <button
            onClick={() => setShowOfflineReady(false)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-700/50 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

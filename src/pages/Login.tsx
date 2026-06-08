import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useLang } from '../contexts/LanguageContext';
import { t } from '../i18n';

export function Login() {
  const { user, login } = useAuthStore();
  const { lang } = useLang();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/predictions" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError(lang === 'pt' ? 'Por favor insira um e-mail válido' : 'Please enter a valid email');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    console.log('Attempting login with email:', email);
    const { error: loginErr } = await login(email.trim());
    setIsSubmitting(false);

    if (loginErr) {
      console.error('Login error:', loginErr);
      setError(lang === 'pt' ? `Erro ao enviar o link de login: ${loginErr.message}` : `Error sending login link: ${loginErr.message}`);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="w-full max-w-sm bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 text-center">
        <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">{t(lang, 'auth.title')}</h1>
        <p className="text-slate-400 mb-8">{t(lang, 'auth.subtitle')}</p>

        {success ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
            <p className="text-green-400 font-medium">
              {t(lang, 'auth.checkEmail')} {t(lang, 'auth.checkEmailDesc')} <strong className="text-white block mt-1">{email}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm text-left">
                {error}
              </div>
            )}
            <div className="text-left">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {t(lang, 'auth.emailLabel')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t(lang, 'auth.emailPlaceholder')}
                required
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:opacity-50 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t(lang, 'auth.sending') : t(lang, 'auth.sendLink')}
            </button>
            <p className="text-xs text-slate-500 mt-2">
              {t(lang, 'auth.noAccount')}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

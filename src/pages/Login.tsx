import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export function Login() {
  const { user, login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (user) {
    return <Navigate to="/predictions" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    const { error } = await login(email.trim());
    setIsSubmitting(false);

    if (error) {
      console.error('Login error:', error);
      alert('Erro ao enviar o link de login. Tente novamente.');
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="w-full max-w-sm bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 text-center">
        <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Bolão da Copa</h1>
        <p className="text-slate-400 mb-8">Faça login para gerenciar seus palpites</p>

        {success ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
            <p className="text-green-400 font-medium">
              Verifique seu email! Clique no link enviado para entrar.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Magic Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

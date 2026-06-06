import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export function ProfileSetupModal() {
  const { user, profile, isLoading } = useAuthStore();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading || !user || profile) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      name: name.trim(),
      email: user.email || '',
      is_admin: false,
    });

    if (error) {
      console.error('Error creating profile:', error);
      setIsSubmitting(false);
      alert('Erro ao salvar o perfil. Tente novamente.');
    } else {
      window.location.assign('/predictions');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Bem-vindo(a)!</h2>
        <p className="text-slate-400 mb-6">
          Para começar a participar do Bolão da Copa, como você gostaria de ser chamado?
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome ou apelido"
            required
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar e Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}

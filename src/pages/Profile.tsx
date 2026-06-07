import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { LogOut, Trophy, Star, Calendar, Loader2, ArrowRight } from 'lucide-react';

export function Profile() {
  const { user, profile, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<any>(null);
  const [ranking, setRanking] = useState<number | string>('-');
  const [specialPreds, setSpecialPreds] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const [scoresRes, allScoresRes, specialRes] = await Promise.all([
          supabase.from('player_scores').select('*').eq('player_id', user.id).maybeSingle(),
          supabase.from('player_scores').select('player_id, total_points').order('total_points', { ascending: false }),
          supabase.from('special_predictions').select('*').eq('player_id', user.id).maybeSingle()
        ]);

        if (scoresRes.data) {
          setStats(scoresRes.data);
        }

        if (allScoresRes.data) {
          const index = allScoresRes.data.findIndex(s => s.player_id === user.id);
          if (index !== -1) {
            setRanking(index + 1);
          }
        }

        if (specialRes.data) {
          setSpecialPreds(specialRes.data);
        }
      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full pt-20">
        <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
      </div>
    );
  }

  // Format creation date
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : '';

  const totalPoints = stats?.total_points ?? 0;
  const matchPoints = stats?.match_points ?? 0;
  const groupPoints = stats?.group_points ?? 0;
  const specialPoints = stats?.special_points ?? 0;

  return (
    <div className="max-w-md mx-auto w-full space-y-6 pb-24 text-slate-100">
      {/* 1. User Info Card */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 shadow-lg flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500 text-2xl font-bold uppercase shrink-0">
          {profile?.name ? profile.name.charAt(0) : 'U'}
        </div>
        <div className="overflow-hidden">
          <h2 className="text-xl font-bold text-white truncate">{profile?.name || 'Jogador'}</h2>
          <p className="text-sm text-slate-400 truncate">{profile?.email || user?.email}</p>
          {memberSince && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Membro desde {memberSince}
            </p>
          )}
        </div>
      </div>

      {/* 2. My Stats Card */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-4 border-b border-slate-700/50 pb-2 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-green-500" />
          Minhas Estatísticas
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-lg text-center">
            <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">Pontos Totais</span>
            <span className="text-3xl font-extrabold text-green-500">{totalPoints}</span>
          </div>
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-lg text-center">
            <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">Classificação</span>
            <span className="text-3xl font-extrabold text-white">
              {ranking !== '-' ? `${ranking}º` : '-'}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex justify-between items-center bg-slate-900/20 p-2.5 rounded-lg border border-slate-800/30 text-sm">
            <span className="text-slate-400">Pontos em Partidas (Mata-Mata & Grupos)</span>
            <span className="font-bold text-white">{matchPoints} pts</span>
          </div>
          <div className="flex justify-between items-center bg-slate-900/20 p-2.5 rounded-lg border border-slate-800/30 text-sm">
            <span className="text-slate-400">Pontos de Grupos</span>
            <span className="font-bold text-white">{groupPoints} pts</span>
          </div>
          <div className="flex justify-between items-center bg-slate-900/20 p-2.5 rounded-lg border border-slate-800/30 text-sm">
            <span className="text-slate-400">Pontos Especiais</span>
            <span className="font-bold text-white">{specialPoints} pts</span>
          </div>
        </div>
      </div>

      {/* 3. My Special Predictions Card */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-4 border-b border-slate-700/50 pb-2 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          Palpites Especiais
        </h3>

        <div className="space-y-3">
          {[
            { label: '🏆 Campeão', val: specialPreds?.champion },
            { label: '🥈 Vice-campeão', val: specialPreds?.vice_champion },
            { label: '🥉 3º Colocado', val: specialPreds?.third_place },
            { label: '⚽ Artilheiro', val: specialPreds?.top_scorer },
            { label: '⭐ Melhor Jogador', val: specialPreds?.best_player }
          ].map((item, idx) => (
            <div key={idx} className="flex justify-between items-center bg-slate-900/40 p-3 rounded-lg border border-slate-850">
              <span className="text-sm text-slate-400 font-medium">{item.label}</span>
              <span className={`text-sm font-bold ${item.val ? 'text-white' : 'text-slate-500 font-normal italic'}`}>
                {item.val || 'Não preenchido'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Logout Button */}
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full flex items-center justify-center gap-2 bg-red-600/15 hover:bg-red-600/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-bold py-3 px-4 rounded-xl transition-all min-h-[48px]"
      >
        <LogOut className="w-5 h-5" />
        Sair da Conta
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-2">Sair da Conta</h3>
            <p className="text-slate-400 text-sm mb-6">Tem certeza que deseja sair?</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 font-medium text-slate-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-lg font-semibold transition-colors flex items-center gap-1.5"
              >
                Sair
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

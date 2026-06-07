import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import type { Database } from '../lib/supabase';
import { formatMatchDate } from '../utils/dateFormat';

type PlayerScore = Database['public']['Tables']['player_scores']['Row'] & {
  profiles?: { name: string } | null;
};

export function Leaderboard() {
  const { user } = useAuthStore();
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [championPredictions, setChampionPredictions] = useState<Record<string, string>>({});
  const [actualChampion, setActualChampion] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      const [scoresRes, specialRes] = await Promise.all([
        supabase.from('player_scores').select('*, profiles(name)'),
        supabase.from('special_predictions').select('*')
      ]);
      
      if (scoresRes.error) {
        console.error('Error fetching leaderboard scores:', scoresRes.error);
        return;
      }
      
      if (scoresRes.data) {
        setScores(scoresRes.data as PlayerScore[]);
        setLastUpdated(formatMatchDate(new Date().toISOString()));
      }

      if (specialRes.data) {
        const officialRow = specialRes.data.find(r => r.player_id === '00000000-0000-0000-0000-000000000000');
        setActualChampion(officialRow?.champion || null);

        const map: Record<string, string> = {};
        specialRes.data.forEach(r => {
          if (r.player_id !== '00000000-0000-0000-0000-000000000000') {
            map[r.player_id] = r.champion;
          }
        });
        setChampionPredictions(map);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    const channel = supabase
      .channel('leaderboard')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'player_scores'
      }, () => {
        // Refetch immediately to get the updated profiles join as well
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const leaderboardWithRank = useMemo(() => {
    const sorted = [...scores].sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      
      // Tiebreaker 1: Champion correct
      const isChampionshipCorrectA = actualChampion && championPredictions[a.player_id] === actualChampion;
      const isChampionshipCorrectB = actualChampion && championPredictions[b.player_id] === actualChampion;
      if (isChampionshipCorrectA !== isChampionshipCorrectB) {
        return isChampionshipCorrectA ? -1 : 1;
      }

      // Tiebreaker 2: Most match points
      if (b.match_points !== a.match_points) return b.match_points - a.match_points;

      // Tiebreaker 3: Most teams correctly advanced (group_points)
      if (b.group_points !== a.group_points) return b.group_points - a.group_points;

      const nameA = a.profiles?.name || '';
      const nameB = b.profiles?.name || '';
      return nameA.localeCompare(nameB);
    });

    const result = [];
    let currentRank = 1;
    for (let index = 0; index < sorted.length; index++) {
      const score = sorted[index];
      const isChampCorrect = actualChampion && championPredictions[score.player_id] === actualChampion;
      const isPrevChampCorrect = index > 0 && actualChampion && championPredictions[sorted[index - 1].player_id] === actualChampion;

      const isTieWithPrev = index > 0 &&
        score.total_points === sorted[index - 1].total_points &&
        isChampCorrect === isPrevChampCorrect &&
        score.match_points === sorted[index - 1].match_points &&
        score.group_points === sorted[index - 1].group_points;
      
      if (!isTieWithPrev) {
        currentRank = index + 1;
      }
      
      const isNextChampCorrect = index < sorted.length - 1 && actualChampion && championPredictions[sorted[index + 1].player_id] === actualChampion;
      const isTieWithNext = index < sorted.length - 1 &&
        score.total_points === sorted[index + 1].total_points &&
        isChampCorrect === isNextChampCorrect &&
        score.match_points === sorted[index + 1].match_points &&
        score.group_points === sorted[index + 1].group_points;

      result.push({
        ...score,
        rank: currentRank,
        isTied: isTieWithPrev || isTieWithNext
      });
    }
    return result;
  }, [scores, championPredictions, actualChampion]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}º`;
  };

  if (loading && scores.length === 0) {
    return (
      <div className="flex flex-col h-full bg-slate-900 text-slate-100 pb-20 max-w-3xl mx-auto w-full p-4">
        <h1 className="text-2xl font-bold mb-2">🏆 Classificação</h1>
        <div className="animate-pulse bg-slate-800/50 h-4 w-48 rounded mb-6"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse bg-slate-800/60 h-20 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 pb-24 max-w-3xl mx-auto w-full p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-emerald-400">🏆 Classificação</h1>
        {lastUpdated && (
          <p className="text-xs text-slate-400 mt-1">Atualizado em: {lastUpdated}</p>
        )}
      </div>

      {leaderboardWithRank.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 px-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
          <div className="text-4xl mb-4">⚽</div>
          <h2 className="text-xl font-bold text-slate-200 mb-2">Nenhum resultado ainda</h2>
          <p className="text-slate-400">Os pontos aparecerão aqui assim que as partidas forem encerradas!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboardWithRank.map((item) => {
            const isCurrentUser = user?.id === item.player_id;
            
            // Apply top 3 styles and highlight
            let containerClasses = "relative flex items-center justify-between p-4 rounded-xl border transition-colors ";
            
            if (isCurrentUser) {
              containerClasses += "border-l-4 border-l-emerald-500 border-t-emerald-500/20 border-r-emerald-500/20 border-b-emerald-500/20 bg-slate-800 shadow-md ";
            } else {
              containerClasses += "border-slate-700 bg-slate-800/50 hover:bg-slate-800/70 ";
            }

            if (item.rank === 1) containerClasses += "bg-gradient-to-r from-yellow-500/10 to-transparent ";
            else if (item.rank === 2) containerClasses += "bg-gradient-to-r from-slate-300/10 to-transparent ";
            else if (item.rank === 3) containerClasses += "bg-gradient-to-r from-orange-600/10 to-transparent ";

            return (
              <div key={item.player_id} className={containerClasses}>
                <div className="flex items-center gap-4 flex-1">
                  <div className={`flex items-center justify-center font-bold w-10 h-10 rounded-full shrink-0 ${
                    item.rank === 1 ? 'bg-yellow-500/20 text-yellow-500 text-xl' :
                    item.rank === 2 ? 'bg-slate-300/20 text-slate-300 text-xl' :
                    item.rank === 3 ? 'bg-orange-500/20 text-orange-400 text-xl' :
                    'bg-slate-700/50 text-slate-400 text-base'
                  }`}>
                    {getRankBadge(item.rank)}
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isCurrentUser ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {item.profiles?.name || 'Jogador Desconhecido'}
                      </span>
                      {isCurrentUser && <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Você</span>}
                      {item.isTied && <span className="text-xs font-bold bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded" title="Empate">=</span >}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Partidas: {item.match_points} pts | Grupos: {item.group_points} pts | Especiais: {item.special_points} pts
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-4">
                  <span className="text-2xl font-black text-white">{item.total_points}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pontos</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Prize Reminder Footer */}
      <div className="mt-8 bg-slate-800/80 border border-slate-700 rounded-xl p-5 text-sm text-center shadow-lg">
        <h3 className="font-bold text-slate-200 mb-3 uppercase tracking-wide text-xs">Premiação Final</h3>
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 flex-wrap">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl">🥇</span>
            <span className="text-yellow-500 font-semibold">1º lugar: <span className="text-white">70%</span> do valor arrecadado</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl">🥈</span>
            <span className="text-slate-300 font-semibold">2º lugar: <span className="text-white">20%</span> do valor arrecadado</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl">🥉</span>
            <span className="text-amber-600 font-semibold">3º lugar: <span className="text-white">10%</span> do valor arrecadado</span>
          </div>
        </div>
      </div>
    </div>
  );
}

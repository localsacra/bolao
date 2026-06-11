import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import type { Database } from '../lib/supabase';
import { formatMatchTime } from '../utils/dateUtils';
import { useLang } from '../contexts/LanguageContext';
import { t } from '../i18n';
import { normalizeSpecialPrediction } from '../engine/scoring';
import {
  GROUP_STAGE_LOCK,
  TOTAL_MATCH_PREDICTIONS,
  TOTAL_GROUP_PREDICTIONS,
  TOTAL_SPECIAL_PREDICTIONS
} from '../utils/constants';

type PlayerScore = Database['public']['Tables']['player_scores']['Row'] & {
  profiles?: { name: string } | null;
};

interface CountdownSubtitleProps {
  lockTime: Date;
  updatedAt: string | null;
}

function CountdownSubtitle({ lockTime, updatedAt }: CountdownSubtitleProps) {
  const { lang } = useLang();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeRemaining = lockTime.getTime() - now.getTime();
  const isLocked = timeRemaining <= 0;

  if (isLocked) {
    if (!updatedAt) return null;
    return (
      <p className="text-xs text-slate-400 mt-1">
        {lang === 'pt' ? 'Atualizado em:' : 'Updated at:'} {updatedAt}
      </p>
    );
  }

  const d = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const h = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  const text = lang === 'pt'
    ? `⏳ Palpites fecham em ${d}d ${h}h ${m}m`
    : `⏳ Predictions lock in ${d}d ${h}h ${m}m`;

  return (
    <p className="text-xs text-slate-400 mt-1">
      {text}
    </p>
  );
}

export function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { lang } = useLang();
  const isLocked = new Date() >= GROUP_STAGE_LOCK;
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [profiles, setProfiles] = useState<Database['public']['Tables']['profiles']['Row'][]>([]);
  const [hasResults, setHasResults] = useState(false);
  const [matchPredictionCounts, setMatchPredictionCounts] = useState<Record<string, number>>({});
  const [groupPredictionCounts, setGroupPredictionCounts] = useState<Record<string, number>>({});
  const [specialPredictionCounts, setSpecialPredictionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [championPredictions, setChampionPredictions] = useState<Record<string, string>>({});
  const [actualChampion, setActualChampion] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      const fetchAllPredictions = async () => {
        let allData: { player_id: string }[] = [];
        let from = 0;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('predictions')
            .select('player_id')
            .range(from, from + 999);
          if (error) throw error;
          if (data && data.length > 0) {
            allData = [...allData, ...data];
            if (data.length < 1000) {
              hasMore = false;
            } else {
              from += 1000;
            }
          } else {
            hasMore = false;
          }
        }
        return allData;
      };

      const fetchAllGroupPredictions = async () => {
        let allData: { player_id: string }[] = [];
        let from = 0;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('group_predictions')
            .select('player_id')
            .range(from, from + 999);
          if (error) throw error;
          if (data && data.length > 0) {
            allData = [...allData, ...data];
            if (data.length < 1000) {
              hasMore = false;
            } else {
              from += 1000;
            }
          } else {
            hasMore = false;
          }
        }
        return allData;
      };

      const fetchAllPlayerScores = async () => {
        let allData: any[] = [];
        let from = 0;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('player_scores')
            .select('*, profiles(name)')
            .range(from, from + 999);
          if (error) throw error;
          if (data && data.length > 0) {
            allData = [...allData, ...data];
            if (data.length < 1000) {
              hasMore = false;
            } else {
              from += 1000;
            }
          } else {
            hasMore = false;
          }
        }
        return allData;
      };

      const fetchAllSpecialPredictions = async () => {
        let allData: any[] = [];
        let from = 0;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('special_predictions')
            .select('*')
            .range(from, from + 999);
          if (error) throw error;
          if (data && data.length > 0) {
            allData = [...allData, ...data];
            if (data.length < 1000) {
              hasMore = false;
            } else {
              from += 1000;
            }
          } else {
            hasMore = false;
          }
        }
        return allData;
      };

      const fetchAllProfiles = async () => {
        let allData: any[] = [];
        let from = 0;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .range(from, from + 999);
          if (error) throw error;
          if (data && data.length > 0) {
            allData = [...allData, ...data];
            if (data.length < 1000) {
              hasMore = false;
            } else {
              from += 1000;
            }
          } else {
            hasMore = false;
          }
        }
        return allData;
      };

      const [
        scoresData,
        specialData,
        profilesData,
        predsData,
        groupPredsData,
        matchCountRes,
        matchesCheckRes
      ] = await Promise.all([
        fetchAllPlayerScores(),
        fetchAllSpecialPredictions(),
        fetchAllProfiles(),
        fetchAllPredictions(),
        fetchAllGroupPredictions(),
        supabase.from('matches').select('*', { count: 'exact', head: true }),
        supabase.from('matches').select('id').not('actual_score_a', 'is', null).limit(1)
      ]);
      
      if (matchCountRes.error) {
        console.error('Error fetching match count:', matchCountRes.error);
        return;
      }

      const resultsExist = matchesCheckRes.data && matchesCheckRes.data.length > 0;
      setHasResults(!!resultsExist);

      setScores(scoresData as PlayerScore[]);
      setLastUpdated(formatMatchTime(new Date().toISOString()));

      setProfiles(profilesData);

      const matchCounts: Record<string, number> = {};
      predsData.forEach(p => {
        matchCounts[p.player_id] = (matchCounts[p.player_id] || 0) + 1;
      });

      const groupCounts: Record<string, number> = {};
      groupPredsData.forEach(p => {
        groupCounts[p.player_id] = (groupCounts[p.player_id] || 0) + 1;
      });

      const specialCounts: Record<string, number> = {};
      const officialRow = specialData.find(r => r.player_id === '00000000-0000-0000-0000-000000000000');
      setActualChampion(officialRow?.champion || null);

      const map: Record<string, string> = {};
      for (const row of specialData) {
        if (row.player_id !== '00000000-0000-0000-0000-000000000000') {
          map[row.player_id] = row.champion;
          
          const filled = [
            row.champion,
            row.vice_champion,
            row.third_place,
            row.top_scorer,
            row.best_player,
          ].filter(v => v !== null && v !== '').length;
          specialCounts[row.player_id] = filled;
        }
      }
      setChampionPredictions(map);

      setMatchPredictionCounts(matchCounts);
      setGroupPredictionCounts(groupCounts);
      setSpecialPredictionCounts(specialCounts);
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
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
  }, [lang]); // Refetch on language change to update dateFormat format

  const leaderboardWithRank = useMemo(() => {
    const sorted = [...scores].sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      
      // Tiebreaker 1: Champion correct
      const isChampionshipCorrectA = actualChampion && normalizeSpecialPrediction(championPredictions[a.player_id]) === normalizeSpecialPrediction(actualChampion);
      const isChampionshipCorrectB = actualChampion && normalizeSpecialPrediction(championPredictions[b.player_id]) === normalizeSpecialPrediction(actualChampion);
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
      const isChampCorrect = actualChampion && normalizeSpecialPrediction(championPredictions[score.player_id]) === normalizeSpecialPrediction(actualChampion);
      const isPrevChampCorrect = index > 0 && actualChampion && normalizeSpecialPrediction(championPredictions[sorted[index - 1].player_id]) === normalizeSpecialPrediction(actualChampion);

      const isTieWithPrev = index > 0 &&
        score.total_points === sorted[index - 1].total_points &&
        isChampCorrect === isPrevChampCorrect &&
        score.match_points === sorted[index - 1].match_points &&
        score.group_points === sorted[index - 1].group_points;
      
      if (!isTieWithPrev) {
        currentRank = index + 1;
      }
      
      const isNextChampCorrect = index < sorted.length - 1 && actualChampion && normalizeSpecialPrediction(championPredictions[sorted[index + 1].player_id]) === normalizeSpecialPrediction(actualChampion);
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

  const activeEntrants = useMemo(() => {
    return profiles
      .filter(profile => profile.id !== '00000000-0000-0000-0000-000000000000')
      .sort((a, b) => a.name.localeCompare(b.name, lang));
  }, [profiles, lang]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}º`;
  };

  if (loading && scores.length === 0 && profiles.length === 0) {
    return (
      <div className="flex flex-col h-full bg-slate-900 text-slate-100 pb-20 max-w-3xl mx-auto w-full p-4">
        <h1 className="text-2xl font-bold mb-2">🏆 {t(lang, 'leaderboard.title')}</h1>
        <div className="animate-pulse bg-slate-800/50 h-4 w-48 rounded mb-6"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse bg-slate-800/60 h-20 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
      <div className="text-4xl mb-4">⚽</div>
      <h2 className="text-xl font-bold text-slate-200 mb-2">
        {lang === 'pt' ? 'Nenhum resultado ainda' : 'No results yet'}
      </h2>
      <p className="text-slate-400">
        {lang === 'pt'
          ? 'Os pontos aparecerão aqui assim que as partidas forem encerradas!'
          : 'Points will appear here once matches are finished!'}
      </p>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 pb-24 max-w-3xl mx-auto w-full p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-emerald-400">🏆 {t(lang, 'leaderboard.title')}</h1>
        <CountdownSubtitle lockTime={GROUP_STAGE_LOCK} updatedAt={lastUpdated} />
      </div>

      {hasResults ? (
        leaderboardWithRank.length === 0 ? renderEmptyState() : (
          <div className="space-y-3">
            {leaderboardWithRank.map((item) => {
              const isCurrentUser = user?.id === item.player_id;
              
              // Apply top 3 styles and highlight
              let containerClasses = "relative flex items-center justify-between p-4 rounded-xl border transition-all ";
              
              if (isLocked) {
                containerClasses += "cursor-pointer ";
              } else {
                containerClasses += "cursor-default ";
              }

              if (isCurrentUser) {
                containerClasses += "border-l-4 border-l-emerald-500 border-t-emerald-500/20 border-r-emerald-500/20 border-b-emerald-500/20 bg-slate-800 shadow-md ";
                if (isLocked) {
                  containerClasses += "hover:bg-slate-850 ";
                }
              } else {
                containerClasses += "border-slate-700 bg-slate-800/50 ";
                if (isLocked) {
                  containerClasses += "hover:bg-slate-800/70 ";
                }
              }

              if (item.rank === 1) containerClasses += "bg-gradient-to-r from-yellow-500/10 to-transparent ";
              else if (item.rank === 2) containerClasses += "bg-gradient-to-r from-slate-300/10 to-transparent ";
              else if (item.rank === 3) containerClasses += "bg-gradient-to-r from-orange-600/10 to-transparent ";

              return (
                <div 
                  key={item.player_id} 
                  className={containerClasses}
                  onClick={() => {
                    if (isLocked) {
                      navigate(`/player/${item.player_id}`);
                    }
                  }}
                >
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
                          {item.profiles?.name || (lang === 'pt' ? 'Jogador Desconhecido' : 'Unknown Player')}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                            {lang === 'pt' ? 'Você' : 'You'}
                          </span>
                        )}
                        {item.isTied && (
                          <span className="text-xs font-bold bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded" title={lang === 'pt' ? 'Empate' : 'Tie'}>
                            =
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {lang === 'pt' ? 'Partidas' : 'Matches'}: {item.match_points} {t(lang, 'predictions.points')} | {lang === 'pt' ? 'Grupos' : 'Groups'}: {item.group_points} {t(lang, 'predictions.points')} | {lang === 'pt' ? 'Especiais' : 'Specials'}: {item.special_points} {t(lang, 'predictions.points')}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 pl-4">
                    <span className="text-2xl font-black text-white">{item.total_points}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t(lang, 'leaderboard.points')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        activeEntrants.length === 0 ? renderEmptyState() : (
          <div className="space-y-3">
            {activeEntrants.map((profile) => {
              const isCurrentUser = user?.id === profile.id;
              const matchCount = matchPredictionCounts[profile.id] ?? 0;
              const groupCount = groupPredictionCounts[profile.id] ?? 0;
              const specialCount = specialPredictionCounts[profile.id] ?? 0;
              
              const isSubmitted = 
                matchCount === TOTAL_MATCH_PREDICTIONS &&
                groupCount === TOTAL_GROUP_PREDICTIONS &&
                specialCount === TOTAL_SPECIAL_PREDICTIONS;
              
              // Apply highlight styling for current user
              let containerClasses = "relative flex items-center justify-between p-4 rounded-xl border transition-all ";
              
              if (isLocked) {
                containerClasses += "cursor-pointer ";
              } else {
                containerClasses += "cursor-default ";
              }

              if (isCurrentUser) {
                containerClasses += "border-l-4 border-l-emerald-500 border-t-emerald-500/20 border-r-emerald-500/20 border-b-emerald-500/20 bg-slate-800 shadow-md ";
                if (isLocked) {
                  containerClasses += "hover:bg-slate-855 ";
                }
              } else {
                containerClasses += "border-slate-700 bg-slate-800/50 ";
                if (isLocked) {
                  containerClasses += "hover:bg-slate-800/70 ";
                }
              }

              return (
                <div 
                  key={profile.id} 
                  className={containerClasses}
                  onClick={() => {
                    if (isLocked) {
                      navigate(`/player/${profile.id}`);
                    }
                  }}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center font-bold w-10 h-10 rounded-full shrink-0 bg-slate-800 border border-slate-700/50 text-slate-400 text-base">
                      —
                    </div>
                    
                    <div className="flex flex-col">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-semibold ${isCurrentUser ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {profile.name || (lang === 'pt' ? 'Jogador Desconhecido' : 'Unknown Player')}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                            {lang === 'pt' ? 'Você' : 'You'}
                          </span>
                        )}
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                          isSubmitted
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          <span>{isSubmitted ? '✅' : '⏳'}</span>
                          <span>
                            {isSubmitted
                              ? (lang === 'pt' ? 'Enviado' : 'Submitted')
                              : (lang === 'pt' ? 'Pendente' : 'Pending')}
                          </span>
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {lang === 'pt' 
                          ? `Partidas: ${matchCount} / ${TOTAL_MATCH_PREDICTIONS} | Grupos: ${groupCount} / ${TOTAL_GROUP_PREDICTIONS} | Especiais: ${specialCount} / ${TOTAL_SPECIAL_PREDICTIONS}`
                          : `Matches: ${matchCount} / ${TOTAL_MATCH_PREDICTIONS} | Groups: ${groupCount} / ${TOTAL_GROUP_PREDICTIONS} | Specials: ${specialCount} / ${TOTAL_SPECIAL_PREDICTIONS}`
                        }
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 pl-4">
                    <span className="text-2xl font-black text-slate-400">—</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t(lang, 'leaderboard.points')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Prize Reminder Footer */}
      <div className="mt-8 bg-slate-800/80 border border-slate-700 rounded-xl p-5 text-sm text-center shadow-lg">
        <h3 className="font-bold text-slate-200 mb-3 uppercase tracking-wide text-xs">
          {lang === 'pt' ? 'Premiação Final' : 'Final Prizes'}
        </h3>
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 flex-wrap">
          <div className="flex items-center justify-center gap-2 text-yellow-400 font-semibold">
            {lang === 'pt' ? '🥇 1º lugar: 70% do valor arrecadado' : '🥇 1st place: 70% of total pool'}
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-300 font-semibold">
            {lang === 'pt' ? '🥈 2º lugar: 20% do valor arrecadado' : '🥈 2nd place: 20% of total pool'}
          </div>
          <div className="flex items-center justify-center gap-2 text-amber-600 font-semibold">
            {lang === 'pt' ? '🥉 3º lugar: 10% do valor arrecadado' : '🥉 3rd place: 10% of total pool'}
          </div>
        </div>
      </div>
    </div>
  );
}




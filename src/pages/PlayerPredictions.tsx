import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import type { Database } from '../lib/supabase';
import { formatMatchTime } from '../utils/dateUtils';
import { FlagIcon } from '../components/FlagIcon';
import { ArrowLeft, Trophy, Medal, Star, Award } from 'lucide-react';
import { 
  calculatePoints, 
  calculateGroupPositionPoints, 
  calculateThirdPlaceQualifierPoints,
  normalizeSpecialPrediction 
} from '../engine/scoring';
import { useLang } from '../contexts/LanguageContext';
import { t } from '../i18n';
import { GROUP_STAGE_LOCK } from '../utils/constants';

type Match = Database['public']['Tables']['matches']['Row'];
type Prediction = Database['public']['Tables']['predictions']['Row'];
type GroupPrediction = Database['public']['Tables']['group_predictions']['Row'];
type SpecialPredictionRow = Database['public']['Tables']['special_predictions']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export function PlayerPredictions() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isLoading: authLoading } = useAuthStore();
  const { lang } = useLang();
  
  const [viewMode, setViewMode] = useState<'group' | 'date'>(() => {
    const stored = localStorage.getItem('predictions_view_mode');
    return (stored === 'group' || stored === 'date') ? stored : 'group';
  });

  const handleViewModeChange = (mode: 'group' | 'date') => {
    setViewMode(mode);
    localStorage.setItem('predictions_view_mode', mode);
  };

  const isLocked = useMemo(() => new Date() >= GROUP_STAGE_LOCK, []);

  // Redirect if accessed before lock
  useEffect(() => {
    if (!isLocked) {
      navigate('/leaderboard', { replace: true });
    }
  }, [isLocked, navigate]);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({});
  const [groupPredictions, setGroupPredictions] = useState<Record<string, GroupPrediction>>({});
  const [specialPreds, setSpecialPreds] = useState<SpecialPredictionRow | null>(null);
  
  // Actual results & standings
  const [actualStandings, setActualStandings] = useState<Record<string, GroupPrediction>>({});
  const [actualSpecial, setActualSpecial] = useState<SpecialPredictionRow | null>(null);

  // Redirect if profile is hidden and is not the current user
  useEffect(() => {
    if (authLoading) return; // Wait for authentication to resolve
    if (profile && profile.is_hidden && profile.id !== currentUser?.id) {
      navigate('/leaderboard', { replace: true });
    }
  }, [profile, currentUser, authLoading, navigate]);

  useEffect(() => {
    if (!playerId || !isLocked) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          profileRes,
          matchesRes,
          predsRes,
          groupPredsRes,
          specialPredsRes,
        ] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', playerId).maybeSingle(),
          supabase.from('matches').select('*').order('match_date', { ascending: true }),
          supabase.from('predictions').select('*').eq('player_id', playerId),
          supabase.from('group_predictions').select('*').eq('player_id', playerId),
          supabase.from('special_predictions').select('*').eq('player_id', playerId).maybeSingle(),
        ]);

        if (profileRes.data) {
          setProfile(profileRes.data);
        }

        if (matchesRes.data) {
          setMatches(matchesRes.data);
        }

        if (predsRes.data) {
          const predsMap: Record<number, Prediction> = {};
          predsRes.data.forEach(p => {
            predsMap[p.match_id] = p;
          });
          setPredictions(predsMap);
        }

        if (groupPredsRes.data) {
          const groupMap: Record<string, GroupPrediction> = {};
          groupPredsRes.data.forEach(gp => {
            groupMap[gp.group_name] = gp;
          });
          setGroupPredictions(groupMap);
        }

        if (specialPredsRes.data) {
          setSpecialPreds(specialPredsRes.data);
        }

        // Fetch official results (system player UUID '00000000-0000-0000-0000-000000000000')
        const [officialGroupRes, officialSpecialRes] = await Promise.all([
          supabase.from('group_predictions').select('*').eq('player_id', '00000000-0000-0000-0000-000000000000'),
          supabase.from('special_predictions').select('*').eq('player_id', '00000000-0000-0000-0000-000000000000').maybeSingle()
        ]);

        if (officialGroupRes.data) {
          const officialMap: Record<string, GroupPrediction> = {};
          officialGroupRes.data.forEach(gp => {
            officialMap[gp.group_name] = gp;
          });
          setActualStandings(officialMap);
        }

        if (officialSpecialRes.data) {
          setActualSpecial(officialSpecialRes.data);
        }

      } catch (err) {
        console.error('Error fetching player predictions details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [playerId, isLocked]);

  // Derive which third-place teams actually qualified
  const actualThirdPlacesAdvanced = useMemo(() => {
    const allThirdPlaces = Object.values(actualStandings).map(a => a.position_3).filter(t => t);
    const knockoutTeams = new Set(
      matches
        .filter(m => m.phase !== 'group')
        .flatMap(m => [m.team_a, m.team_b])
    );
    return allThirdPlaces.filter(t => knockoutTeams.has(t));
  }, [actualStandings, matches]);

  const thirdPlacePicks = useMemo(() => {
    return Object.values(groupPredictions)
      .map(gp => gp.position_3)
      .filter(t => t && t !== '');
  }, [groupPredictions]);

  const thirdPlaceSlots = useMemo(() => {
    const list = Object.values(groupPredictions)
      .map(gp => ({ team: gp.position_3, group: gp.group_name }))
      .filter(p => p.team && p.team !== '')
      .sort((a, b) => a.group.localeCompare(b.group));
    const slots = [...list];
    while (slots.length < 8) {
      slots.push({ team: '', group: '' });
    }
    return slots;
  }, [groupPredictions]);

  // Group stage matches only, grouped A -> L
  const groupStageMatchesByGroup = useMemo(() => {
    const map: Record<string, Match[]> = {};
    matches
      .filter(m => m.phase === 'group' && m.group_name)
      .forEach(m => {
        if (!map[m.group_name]) map[m.group_name] = [];
        map[m.group_name].push(m);
      });
    return map;
  }, [matches]);

  // Ordered list of group names A -> L
  const sortedGroupNames = useMemo(() => {
    return Object.keys(groupStageMatchesByGroup).sort();
  }, [groupStageMatchesByGroup]);

  // Chronological list of group stage matches
  const sortedGroupStageMatches = useMemo(() => {
    return [...matches]
      .filter(m => m.phase === 'group')
      .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
  }, [matches]);

  if (!isLocked) {
    return null;
  }

  // Loading skeleton matching user preference
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-slate-900 text-slate-100 pb-20 max-w-3xl mx-auto w-full p-4 space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-4 animate-pulse">
          <div className="w-10 h-10 bg-slate-800 rounded-full"></div>
          <div className="space-y-2 flex-1">
            <div className="h-6 bg-slate-800 rounded w-1/3"></div>
            <div className="h-4 bg-slate-800 rounded w-1/5"></div>
          </div>
        </div>

        {/* Section 1 Matches Skeleton */}
        <div className="space-y-4">
          <div className="h-6 bg-slate-800 rounded w-48 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-4 animate-pulse">
                <div className="h-4 bg-slate-850 rounded w-24"></div>
                <div className="flex justify-between items-center gap-4">
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-10 h-7 bg-slate-850 rounded"></div>
                    <div className="h-4 bg-slate-855 rounded w-16"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-10 h-12 bg-slate-850 rounded"></div>
                    <div className="w-10 h-12 bg-slate-850 rounded"></div>
                  </div>
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-10 h-7 bg-slate-855 rounded"></div>
                    <div className="h-4 bg-slate-850 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === playerId;

  function renderMatchCard(match: Match) {
    const pred = predictions[match.id];
    const hasPred = pred !== undefined;
    const points = hasPred ? calculatePoints(match, pred) : 0;
    
    const scoreA = hasPred ? pred.predicted_score_a : null;
    const scoreB = hasPred ? pred.predicted_score_b : null;

    return (
      <div key={match.id} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 relative flex flex-col justify-between hover:bg-slate-800 transition-colors">
        
        {/* Time and Saved Icon */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-medium text-slate-400 bg-slate-900/50 px-2 py-1 rounded-md">
            {formatMatchTime(match.match_date)}
          </span>
          {hasPred && (
            <span className="text-xs text-slate-400">
              {t(lang, 'predictions.saved')}
            </span>
          )}
        </div>

        {/* Flags and Predicted Scores */}
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Team A */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <FlagIcon country={match.team_a} size="sm" />
            <span className="font-semibold text-xs text-center leading-tight text-slate-200">{match.team_a}</span>
          </div>

          {/* Prediction Inputs Style (Disabled) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-12 flex items-center justify-center bg-slate-900 border border-slate-700 rounded-lg text-lg font-bold text-white opacity-85">
              {scoreA !== null ? scoreA : '—'}
            </div>
            <span className="text-slate-500 font-bold text-sm">X</span>
            <div className="w-10 h-12 flex items-center justify-center bg-slate-900 border border-slate-700 rounded-lg text-lg font-bold text-white opacity-85">
              {scoreB !== null ? scoreB : '—'}
            </div>
          </div>

          {/* Team B */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <FlagIcon country={match.team_b} size="sm" />
            <span className="font-semibold text-xs text-center leading-tight text-slate-200">{match.team_b}</span>
          </div>
        </div>

        {/* Real Result & Score Badge */}
        {match.actual_score_a !== null && match.actual_score_b !== null && (
          <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 flex justify-between items-center text-xs">
            <span className="text-slate-300">
              {lang === 'pt' ? 'Placar Real:' : 'Real Score:'} <strong className="text-white ml-1">{match.actual_score_a} x {match.actual_score_b}</strong>
            </span>
            <span className="text-emerald-400 font-bold">
              +{points} {t(lang, 'predictions.points')}
            </span>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 pb-20 max-w-3xl mx-auto w-full p-4 space-y-8">
      
      {/* Page Header */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
        <button
          onClick={() => navigate('/leaderboard')}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          aria-label={lang === 'pt' ? 'Voltar para classificação' : 'Back to leaderboard'}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100">
              {profile?.name || (lang === 'pt' ? 'Jogador Desconhecido' : 'Unknown Player')}
            </h1>
            {isCurrentUser && (
              <span className="text-xs uppercase font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                {lang === 'pt' ? 'Você' : 'You'}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 mt-1">
            {lang === 'pt' ? 'Palpites Enviados' : 'Submitted Predictions'}
          </span>
        </div>
      </div>

      {/* SECTION 1: MATCH PREDICTIONS (Group Stage) */}
      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
            ⚽ {lang === 'pt' ? 'Palpites de Partidas (Fase de Grupos)' : 'Match Predictions (Group Stage)'}
          </h2>
          <div className="flex bg-slate-955 border border-slate-700/60 rounded-lg p-0.5 text-xs font-semibold text-slate-400">
            <button
              onClick={() => handleViewModeChange('group')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'group'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'hover:text-slate-205 hover:bg-slate-800/40'
              }`}
            >
              {t(lang, 'predictions.viewByGroup')}
            </button>
            <button
              onClick={() => handleViewModeChange('date')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'date'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'hover:text-slate-205 hover:bg-slate-800/40'
              }`}
            >
              {t(lang, 'predictions.viewByDate')}
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {viewMode === 'date' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedGroupStageMatches.map(match => renderMatchCard(match))}
            </div>
          ) : (
            sortedGroupNames.map(groupName => {
              const groupMatches = groupStageMatchesByGroup[groupName] || [];

              return (
                <div key={groupName} className="space-y-3">
                  <h3 className="text-md font-semibold text-slate-300 flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-md w-fit">
                    {lang === 'pt' ? 'Grupo' : 'Group'} {groupName}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupMatches.map(match => renderMatchCard(match))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* SECTION 2: GROUP STANDINGS PREDICTIONS */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2">
          📊 {lang === 'pt' ? 'Palpites de Classificados' : 'Group Standings Predictions'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedGroupNames.map(groupName => {
            const pred = groupPredictions[groupName];
            const actual = actualStandings[groupName];
            const hasActual = actual !== undefined && (actual.position_1 || actual.position_2);
            
            const firstPick = pred?.position_1 || null;
            const secondPick = pred?.position_2 || null;

            // Points calculation helpers per pick
            const getPointsForPick = (pick: string | null, targetPosition: '1' | '2') => {
              if (!pick || !actual) return 0;
              const predPos = targetPosition;
              const actPos = actual.position_1 === pick ? '1' : actual.position_2 === pick ? '2' : actual.position_3 === pick ? '3' : '4';
              const predQualify = true; // since it was picked in top 2
              const didQualify = actPos === '1' || actPos === '2' || (actPos === '3' && actualThirdPlacesAdvanced.includes(pick));
              return calculateGroupPositionPoints(predPos, actPos, predQualify, didQualify);
            };

            const points1st = getPointsForPick(firstPick, '1');
            const points2nd = getPointsForPick(secondPick, '2');
            const totalGroupPoints = points1st + points2nd;

            return (
              <div key={groupName} className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-emerald-400">{lang === 'pt' ? 'GRUPO' : 'GROUP'} {groupName}</h3>
                    {hasActual && (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-md font-bold">
                        +{totalGroupPoints} {t(lang, 'predictions.points')}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    
                    {/* 1st Place Pick */}
                    <div className="space-y-1">
                      <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">1º {lang === 'pt' ? 'Lugar' : 'Place'}</div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-[#ca8a04]/40 bg-[#ca8a04]/5 min-h-[46px]">
                        {firstPick ? (
                          <div className="flex items-center gap-3">
                            <FlagIcon country={firstPick} size="sm" />
                            <span className="text-white font-medium text-sm">{firstPick}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs italic">{lang === 'pt' ? 'Não selecionado' : 'Not selected'}</span>
                        )}

                        {firstPick && hasActual && (
                          <div className="flex items-center gap-2">
                            {actual.position_1 === firstPick ? (
                              <span className="text-emerald-400 text-xs font-semibold">✓ {t(lang, 'predictions.correct')} (+15 pts)</span>
                            ) : (
                              <div className="text-right">
                                <span className="text-red-400 text-xs font-semibold block">✗ (+{points1st} pts)</span>
                                <span className="text-slate-400 text-[10px]">({lang === 'pt' ? 'Real: 1º ' : 'Real: 1st '} {actual.position_1})</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2nd Place Pick */}
                    <div className="space-y-1">
                      <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">2º {lang === 'pt' ? 'Lugar' : 'Place'}</div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-[#6b7280]/40 bg-[#6b7280]/5 min-h-[46px]">
                        {secondPick ? (
                          <div className="flex items-center gap-3">
                            <FlagIcon country={secondPick} size="sm" />
                            <span className="text-white font-medium text-sm">{secondPick}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs italic">{lang === 'pt' ? 'Não selecionado' : 'Not selected'}</span>
                        )}

                        {secondPick && hasActual && (
                          <div className="flex items-center gap-2">
                            {actual.position_2 === secondPick ? (
                              <span className="text-emerald-400 text-xs font-semibold">✓ {t(lang, 'predictions.correct')} (+15 pts)</span>
                            ) : (
                              <div className="text-right">
                                <span className="text-red-400 text-xs font-semibold block">✗ (+{points2nd} pts)</span>
                                <span className="text-slate-400 text-[10px]">({lang === 'pt' ? 'Real: 2º ' : 'Real: 2nd '} {actual.position_2})</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3rd Place Advancing Teams Predictions */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex justify-between items-center border-b border-slate-700 pb-3">
            <h3 className="text-md font-bold text-slate-200 flex items-center gap-2">
              🏆 {t(lang, 'predictions.thirdQualifiers')}
            </h3>
            {actualThirdPlacesAdvanced.length > 0 && (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-md font-bold">
                +{calculateThirdPlaceQualifierPoints(thirdPlacePicks, actualThirdPlacesAdvanced)} {t(lang, 'predictions.points')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {thirdPlaceSlots.map((item, idx) => {
              const pick = item.team;
              const gName = item.group;
              const isCorrect = pick && actualThirdPlacesAdvanced.includes(pick);
              const showResultStatus = actualThirdPlacesAdvanced.length > 0;

              return (
                <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 flex flex-col justify-between min-h-[90px]">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2">
                    {lang === 'pt' ? `Vaga ${idx + 1}` : `Slot ${idx + 1}`} {gName && `(${lang === 'pt' ? 'Grupo' : 'Group'} ${gName})`}
                  </div>
                  {pick ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FlagIcon country={pick} size="sm" />
                        <span className="text-white text-xs font-semibold">{pick}</span>
                      </div>
                      {showResultStatus && (
                        isCorrect ? (
                          <span className="text-emerald-400 text-[10px] font-bold">✓ +10 pts</span>
                        ) : (
                          <span className="text-red-400 text-[10px] font-bold">✗ 0 pts</span>
                        )
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-500 text-xs italic">{lang === 'pt' ? 'Vazio' : 'Empty'}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: SPECIAL PREDICTIONS */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2">
          🏆 {t(lang, 'predictions.specialPredictions')}
        </h2>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4">
          
          {/* List of 5 Special predictions fields */}
          {[
            {
              label: t(lang, 'predictions.champion'),
              icon: <Trophy className="w-5 h-5 text-yellow-500" />,
              value: specialPreds?.champion,
              actualValue: actualSpecial?.champion,
              pointsValue: 25,
            },
            {
              label: `🥈 ${t(lang, 'predictions.runnerUp')}`,
              icon: <Medal className="w-5 h-5 text-slate-300" />,
              value: specialPreds?.vice_champion,
              actualValue: actualSpecial?.vice_champion,
              pointsValue: 10,
            },
            {
              label: `🥉 ${t(lang, 'predictions.thirdPlace')}`,
              icon: <Award className="w-5 h-5 text-amber-600" />,
              value: specialPreds?.third_place,
              actualValue: actualSpecial?.third_place,
              pointsValue: 10,
            },
            {
              label: t(lang, 'predictions.topScorer'),
              icon: <Medal className="w-5 h-5 text-slate-400" />,
              value: specialPreds?.top_scorer,
              actualValue: actualSpecial?.top_scorer,
              pointsValue: 15,
            },
            {
              label: t(lang, 'predictions.bestPlayer'),
              icon: <Star className="w-5 h-5 text-emerald-400" />,
              value: specialPreds?.best_player,
              actualValue: actualSpecial?.best_player,
              pointsValue: 15,
            }
          ].map((item, idx) => {
            const hasActualValue = item.actualValue !== undefined && item.actualValue !== null && item.actualValue !== '';
            const isCorrect = hasActualValue && item.value && normalizeSpecialPrediction(item.value) === normalizeSpecialPrediction(item.actualValue);
            const pointsAwarded = isCorrect ? item.pointsValue : 0;

            return (
              <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Field label */}
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-sm font-semibold text-slate-300">{item.label}</span>
                </div>

                {/* Player prediction and actual result */}
                <div className="flex flex-col sm:items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{lang === 'pt' ? 'Palpite:' : 'Prediction:'}</span>
                    <strong className="text-sm text-white">{item.value || '—'}</strong>
                  </div>

                  {hasActualValue && (
                    <div className="flex flex-wrap items-center gap-2 mt-1 sm:justify-end text-xs">
                      {isCorrect ? (
                        <span className="text-emerald-400 font-semibold">✓ {lang === 'pt' ? 'Correto' : 'Correct'} (+{pointsAwarded} pts)</span>
                      ) : (
                        <>
                          <span className="text-red-400 font-semibold">✗ (0 pts)</span>
                          <span className="text-slate-400">({lang === 'pt' ? 'Real:' : 'Real:'} <strong>{item.actualValue}</strong>)</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}

        </div>
      </section>

    </div>
  );
}

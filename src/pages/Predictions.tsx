import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Trophy, Medal, Star, Lock, Loader2, XCircle, Award } from 'lucide-react';
import type { Database } from '../lib/supabase';
import { formatMatchTime } from '../utils/dateUtils';
import { FlagIcon } from '../components/FlagIcon';
import { GroupPredictions } from '../components/GroupPredictions';

type Match = Database['public']['Tables']['matches']['Row'];
type Prediction = Database['public']['Tables']['predictions']['Row'];
type SpecialPredictionRow = Database['public']['Tables']['special_predictions']['Row'];

import { calculatePoints } from '../engine/scoring';
import { useLang } from '../contexts/LanguageContext';
import { t } from '../i18n';
import { GROUP_STAGE_LOCK } from '../utils/constants';

const TABS = ["Todos", "Especiais", "Grupos", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];


const PHASE_ORDER: Record<string, number> = {
  'group': 1,
  'round_16': 2,
  'quarter_finals': 3,
  'semi_finals': 4,
  'third_place': 5,
  'final': 6
};

const formatPhaseName = (phase: string, lang: 'pt' | 'en') => {
  const map: Record<string, string> = lang === 'pt' ? {
    'group': 'Fase de Grupos',
    'round_16': 'Oitavas de Final',
    'quarter_finals': 'Quartas de Final',
    'semi_finals': 'Semifinal',
    'third_place': 'Disputa de 3º Lugar',
    'final': 'Final'
  } : {
    'group': 'Group Stage',
    'round_16': 'Round of 16',
    'quarter_finals': 'Quarterfinals',
    'semi_finals': 'Semifinals',
    'third_place': '3rd Place Match',
    'final': 'Final'
  };
  return map[phase] || phase;
};

export function Predictions() {
  const { user } = useAuthStore();
  const { lang } = useLang();
  const isSpecialLocked = new Date() >= GROUP_STAGE_LOCK;
  const [matches, setMatches] = useState<Match[]>([]);
  const [localPredictions, setLocalPredictions] = useState<Record<number, Partial<Prediction>>>({});
  const [specialPreds, setSpecialPreds] = useState<Partial<SpecialPredictionRow>>({
    champion: '', vice_champion: '', third_place: '', top_scorer: '', best_player: ''
  });
  
  const [activeTab, setActiveTab] = useState("Todos");
  const [viewMode, setViewMode] = useState<'group' | 'date'>(() => {
    const stored = localStorage.getItem('predictions_view_mode');
    return (stored === 'group' || stored === 'date') ? stored : 'date';
  });

  const handleViewModeChange = (mode: 'group' | 'date') => {
    setViewMode(mode);
    localStorage.setItem('predictions_view_mode', mode);
  };
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<Record<number, 'saving' | 'saved' | 'error' | undefined>>({});
  const [specialSaveStatus, setSpecialSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [groupPredictions, setGroupPredictions] = useState<any[]>([]);

  const refetchGroupPredictions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('group_predictions')
      .select('*')
      .eq('player_id', user.id);
    if (data) setGroupPredictions(data);
  };

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      setLoading(true);
      
      const [matchesRes, predsRes, specialRes, groupPredsRes] = await Promise.all([
        supabase.from('matches').select('*').order('match_date', { ascending: true }),
        supabase.from('predictions').select('*').eq('player_id', user.id),
        supabase.from('special_predictions').select('*').eq('player_id', user.id).maybeSingle(),
        supabase.from('group_predictions').select('*').eq('player_id', user.id)
      ]);

      if (matchesRes.data) setMatches(matchesRes.data);
      
      if (predsRes.data) {
        const predsMap: Record<number, Partial<Prediction>> = {};
        predsRes.data.forEach(p => {
          predsMap[p.match_id] = p;
        });
        setLocalPredictions(predsMap);
        setPredictions(predsRes.data);
      }

      if (specialRes.data) {
        setSpecialPreds(specialRes.data);
        setSpecialSaveStatus('saved');
      }

      if (groupPredsRes.data) {
        setGroupPredictions(groupPredsRes.data);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (predictions.length === 0) return;
    const initialStatus: Record<number, 'saved' | 'saving' | 'error'> = {};
    predictions.forEach(p => {
      initialStatus[p.match_id] = 'saved';
    });
    setSaveStatus(initialStatus);
  }, [predictions]);

  const handleScoreChange = (matchId: number, team: 'a' | 'b', value: string) => {
    let numValue: number | undefined;
    if (value !== '') {
      numValue = parseInt(value, 10);
      if (isNaN(numValue)) numValue = undefined;
    }
    setLocalPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [`predicted_score_${team}`]: numValue
      }
    }));
    setSaveStatus(prev => ({
      ...prev,
      [matchId]: undefined
    }));
  };

  const handleTieChange = (matchId: number, field: 'team' | 'method', value: string) => {
    const match = matches.find(m => m.id === matchId);
    setLocalPredictions(prev => {
      const pred = prev[matchId] || {};
      const nextPred = {
        ...pred,
        [`advance_${field}`]: value
      };
      if (field === 'team' && match) {
        if (value === match.team_a) {
          nextPred.predicted_tiebreaker_winner = 'A';
        } else if (value === match.team_b) {
          nextPred.predicted_tiebreaker_winner = 'B';
        } else {
          nextPred.predicted_tiebreaker_winner = null;
        }
      }
      return {
        ...prev,
        [matchId]: nextPred
      };
    });
    setSaveStatus(prev => ({
      ...prev,
      [matchId]: undefined
    }));
  };

  const savePrediction = async (matchId: number) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    const isGroup = match.phase === 'group';
    const isLocked = isGroup
      ? new Date() >= GROUP_STAGE_LOCK
      : new Date() > new Date(match.deadline);
    if (isLocked) return;

    const pred = localPredictions[matchId];
    if (pred?.predicted_score_a === undefined || pred?.predicted_score_b === undefined) return;

    setSaveStatus(prev => ({ ...prev, [matchId]: 'saving' }));

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      console.log('Auth user:', user);
      console.log('Auth error:', authError);
      
      if (!user) {
        console.error('No authenticated user found');
        setSaveStatus(prev => ({ ...prev, [matchId]: 'error' }));
        return;
      }

      const isDraw = pred.predicted_score_a === pred.predicted_score_b;
      const isKnockout = match.phase !== 'group';

      let advance_team = pred.advance_team || null;
      let advance_method = pred.advance_method || null;
      let predicted_tiebreaker_winner = pred.predicted_tiebreaker_winner || null;

      if (isKnockout && isDraw) {
        if (advance_team === match.team_a) {
          predicted_tiebreaker_winner = 'A';
        } else if (advance_team === match.team_b) {
          predicted_tiebreaker_winner = 'B';
        } else {
          predicted_tiebreaker_winner = null;
        }
      } else {
        advance_team = null;
        advance_method = null;
        predicted_tiebreaker_winner = null;
      }

      // Update local state to cleaned-up values
      setLocalPredictions(prev => ({
        ...prev,
        [matchId]: {
          ...prev[matchId],
          advance_team,
          advance_method,
          predicted_tiebreaker_winner
        }
      }));

      const payload = {
        player_id: user.id,
        match_id: matchId,
        predicted_score_a: pred.predicted_score_a,
        predicted_score_b: pred.predicted_score_b,
        advance_team,
        advance_method,
        predicted_tiebreaker_winner,
      };

      console.log('Attempting upsert with payload:', payload);

      const { data, error } = await supabase
        .from('predictions')
        .upsert(payload, { onConflict: 'player_id,match_id' })
        .select();

      console.log('Upsert result - data:', data);
      console.log('Upsert result - error:', error);

      if (error) throw error;

      setSaveStatus(prev => ({ ...prev, [matchId]: 'saved' }));
    } catch (err) {
      console.error('Full error object:', JSON.stringify(err));
      setSaveStatus(prev => ({ ...prev, [matchId]: 'error' }));
    }
  };

  const saveSpecial = async () => {
    if (new Date() >= GROUP_STAGE_LOCK) return;
    setSpecialSaveStatus('saving');
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      console.log('Auth user:', user);
      console.log('Auth error:', authError);
      
      if (!user) {
        console.error('No authenticated user found');
        setSpecialSaveStatus('error');
        return;
      }

      const payload = {
        player_id: user.id,
        champion: specialPreds.champion || '',
        vice_champion: specialPreds.vice_champion || '',
        third_place: specialPreds.third_place || '',
        top_scorer: specialPreds.top_scorer || '',
        best_player: specialPreds.best_player || ''
      };

      console.log('Attempting upsert with payload:', payload);

      const { data, error } = await supabase
        .from('special_predictions')
        .upsert(payload, { onConflict: 'player_id' })
        .select();

      console.log('Upsert result - data:', data);
      console.log('Upsert result - error:', error);

      if (error) throw error;

      // Refresh to get the latest state including any DB default values
      const { data: refreshedData } = await supabase
        .from('special_predictions')
        .select('*')
        .eq('player_id', user.id)
        .maybeSingle();
      if (refreshedData) setSpecialPreds(refreshedData);

      setSpecialSaveStatus('saved');
      setTimeout(() => setSpecialSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Full error object:', JSON.stringify(err));
      setSpecialSaveStatus('error');
    }
  };
  const getTabBadgeCount = (tabKey: string): number => {
    // Hide badges on all tabs when group stage lock has passed
    const groupStageLocked = new Date() >= GROUP_STAGE_LOCK;
    if (groupStageLocked) return 0;

    // Special predictions incomplete count
    let unfilledSpecial = 0;
    if (!specialPreds.champion) unfilledSpecial++;
    if (!specialPreds.vice_champion) unfilledSpecial++;
    if (!specialPreds.third_place) unfilledSpecial++;
    if (!specialPreds.top_scorer) unfilledSpecial++;
    if (!specialPreds.best_player) unfilledSpecial++;

    if (tabKey === 'Especiais') {
      return unfilledSpecial;
    }

    if (tabKey === 'Grupos') {
      const GROUP_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
      let incompleteGroupsCount = 0;
      GROUP_NAMES.forEach(gName => {
        const pred = groupPredictions.find(p => p.group_name === gName);
        if (!pred || !pred.position_1 || !pred.position_2) {
          incompleteGroupsCount++;
        }
      });
      const selectedThirdPlacesCount = groupPredictions.filter(p => p.position_3).length;
      const thirdPlaceIncomplete = Math.max(0, 8 - selectedThirdPlacesCount);
      return incompleteGroupsCount + thirdPlaceIncomplete;
    }

    if (tabKey === 'Todos') {
      let incompleteGroupMatches = 0;
      matches.forEach(m => {
        if (m.phase === 'group') {
          const pred = localPredictions[m.id];
          const hasScoreA = pred && pred.predicted_score_a !== undefined && pred.predicted_score_a !== null;
          const hasScoreB = pred && pred.predicted_score_b !== undefined && pred.predicted_score_b !== null;
          if (!hasScoreA || !hasScoreB) {
            incompleteGroupMatches++;
          }
        }
      });
      return incompleteGroupMatches;
    }

    // Individual group tabs (A, B, C...)
    const groupMatches = matches.filter(m => m.group_name === tabKey);
    let incompleteMatchesCount = 0;
    groupMatches.forEach(m => {
      const pred = localPredictions[m.id];
      const hasScoreA = pred && pred.predicted_score_a !== undefined && pred.predicted_score_a !== null;
      const hasScoreB = pred && pred.predicted_score_b !== undefined && pred.predicted_score_b !== null;
      if (!hasScoreA || !hasScoreB) {
        incompleteMatchesCount++;
      }
    });
    return incompleteMatchesCount;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const filteredMatches = matches.filter(m => activeTab === 'Todos' || m.group_name === activeTab);
  
  const groupedMatches: Record<string, Match[]> = {};
  filteredMatches.forEach(m => {
    if (!groupedMatches[m.phase]) groupedMatches[m.phase] = [];
    groupedMatches[m.phase].push(m);
  });

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 pb-20 max-w-3xl mx-auto w-full">
      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 p-4">
        <div className="flex overflow-x-auto gap-2 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TABS.map(g => (
            <button
              key={g}
              onClick={() => setActiveTab(g)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === g 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>
                {g === 'Todos' 
                  ? (lang === 'pt' ? 'Todos' : 'All') 
                  : g === 'Especiais' 
                  ? (lang === 'pt' ? 'Especiais' : 'Special') 
                  : g === 'Grupos' 
                  ? (lang === 'pt' ? 'Grupos' : 'Groups') 
                  : (lang === 'pt' ? `Grupo ${g}` : `Group ${g}`)}
              </span>
              {getTabBadgeCount(g) > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                  activeTab === g
                    ? 'bg-white text-emerald-600'
                    : 'bg-emerald-500 text-white'
                }`}>
                  {getTabBadgeCount(g)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Special Predictions */}
        {activeTab === 'Especiais' && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 shadow-lg">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              {t(lang, 'predictions.specialPredictions')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4" /> {t(lang, 'predictions.champion')}
                </label>
                <input 
                  type="text" 
                  value={specialPreds.champion || ''}
                  onChange={e => {
                    setSpecialPreds(p => ({ ...p, champion: e.target.value }));
                    setSpecialSaveStatus('idle');
                  }}
                  disabled={isSpecialLocked}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                  placeholder={lang === 'pt' ? 'Ex: Brasil' : 'e.g. Brazil'}
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 flex items-center gap-2 mb-1">
                  <Medal className="w-4 h-4 text-slate-300" /> 🥈 {t(lang, 'predictions.runnerUp')}
                </label>
                <input 
                  type="text" 
                  value={specialPreds.vice_champion || ''}
                  onChange={e => {
                    setSpecialPreds(p => ({ ...p, vice_champion: e.target.value }));
                    setSpecialSaveStatus('idle');
                  }}
                  disabled={isSpecialLocked}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                  placeholder={lang === 'pt' ? 'Ex: Argentina' : 'e.g. Argentina'}
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-amber-600" /> 🥉 {t(lang, 'predictions.thirdPlace')}
                </label>
                <input 
                  type="text" 
                  value={specialPreds.third_place || ''}
                  onChange={e => {
                    setSpecialPreds(p => ({ ...p, third_place: e.target.value }));
                    setSpecialSaveStatus('idle');
                  }}
                  disabled={isSpecialLocked}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                  placeholder={lang === 'pt' ? 'Ex: França' : 'e.g. France'}
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 flex items-center gap-2 mb-1">
                  <Medal className="w-4 h-4" /> {t(lang, 'predictions.topScorer')}
                </label>
                <input 
                  type="text" 
                  value={specialPreds.top_scorer || ''}
                  onChange={e => {
                    setSpecialPreds(p => ({ ...p, top_scorer: e.target.value }));
                    setSpecialSaveStatus('idle');
                  }}
                  disabled={isSpecialLocked}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                  placeholder={lang === 'pt' ? 'Ex: Vini Jr' : 'e.g. Vini Jr'}
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4" /> {t(lang, 'predictions.bestPlayer')}
                </label>
                <input 
                  type="text" 
                  value={specialPreds.best_player || ''}
                  onChange={e => {
                    setSpecialPreds(p => ({ ...p, best_player: e.target.value }));
                    setSpecialSaveStatus('idle');
                  }}
                  disabled={isSpecialLocked}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                  placeholder={lang === 'pt' ? 'Ex: Bellingham' : 'e.g. Bellingham'}
                />
              </div>
              <button 
                onClick={saveSpecial}
                disabled={isSpecialLocked || specialSaveStatus === 'saving' || specialSaveStatus === 'saved'}
                className={`w-full font-medium py-2 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-70 ${
                  specialSaveStatus === 'saved' || isSpecialLocked
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isSpecialLocked ? (lang === 'pt' ? '🔒 Palpites Encerrados' : '🔒 Predictions Closed') : (
                  <>
                    {specialSaveStatus === 'saving' && t(lang, 'predictions.saving')}
                    {specialSaveStatus === 'saved' && `✓ ${t(lang, 'predictions.saved')}!`}
                    {specialSaveStatus === 'error' && (lang === 'pt' ? 'Erro ao Salvar' : 'Error Saving')}
                    {specialSaveStatus === 'idle' && (lang === 'pt' ? 'Salvar Palpites Especiais' : 'Save Special Predictions')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Full Group Predictions tab view */}
        {activeTab === 'Grupos' && (
          <GroupPredictions matches={matches} onSave={refetchGroupPredictions} />
        )}

        {/* Group Prediction card at the TOP of group matches */}
        {activeTab !== 'Todos' && activeTab !== 'Especiais' && activeTab !== 'Grupos' && (
          <GroupPredictions matches={matches} groupName={activeTab} onSave={refetchGroupPredictions} />
        )}

        {/* Matches List */}
        {activeTab !== 'Grupos' && activeTab !== 'Especiais' && Object.entries(groupedMatches)
          .sort(([a], [b]) => (PHASE_ORDER[a] || 99) - (PHASE_ORDER[b] || 99))
          .map(([phase, phaseMatches]) => (
          <div key={phase} className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 pt-2">
              <h2 className="text-xl font-bold text-emerald-400 capitalize">
                {formatPhaseName(phase, lang)}
              </h2>
              {phase === 'group' && (
                <div className="flex bg-slate-950 border border-slate-700/60 rounded-lg p-0.5 text-xs font-semibold text-slate-400">
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
              )}
            </div>
            
            {phase === 'group' ? (
              viewMode === 'date' ? (
                // By Date: all group stage matches displayed in a single flat list ordered by match_date ASC
                <div className="space-y-3 mt-4">
                  {[...phaseMatches]
                    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
                    .map(m => renderMatchCard(m))}
                </div>
              ) : (
                // By Group (default): grouped by group_name
                Object.entries(
                  phaseMatches.reduce((acc, m) => {
                    if (!acc[m.group_name]) acc[m.group_name] = [];
                    acc[m.group_name].push(m);
                    return acc;
                  }, {} as Record<string, Match[]>)
                ).sort(([a], [b]) => a.localeCompare(b)).map(([groupName, gMatches]) => (
                  <div key={groupName} className="space-y-3">
                    <h3 className="text-md font-semibold text-slate-300 flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-md w-fit mt-4">
                      {t(lang, 'predictions.group')} {groupName}
                    </h3>
                    {gMatches.map(m => renderMatchCard(m))}
                  </div>
                ))
              )
            ) : (
              // Knockout matches just listed
              <div className="space-y-3 mt-4">
                {phaseMatches.map(m => renderMatchCard(m))}
              </div>
            )}
          </div>
        ))}

        {activeTab !== 'Grupos' && activeTab !== 'Especiais' && filteredMatches.length === 0 && (
          <div className="text-center text-slate-500 py-10">
            {lang === 'pt' ? 'Nenhuma partida encontrada para este filtro.' : 'No matches found for this filter.'}
          </div>
        )}
      </div>
    </div>
  );

  function renderMatchCard(match: Match) {
    const isGroup = match.phase === 'group';
    const isDeadlinePassed = isGroup
      ? new Date() >= GROUP_STAGE_LOCK
      : new Date() > new Date(match.deadline);
    const pred = localPredictions[match.id] || {};
    const isKnockout = match.phase !== 'group';
    const isDraw = pred.predicted_score_a !== undefined && 
                   pred.predicted_score_a === pred.predicted_score_b;

    return (
      <div key={match.id} className={`bg-slate-800/60 border ${isDeadlinePassed ? 'border-slate-700/50 opacity-80' : 'border-slate-700'} rounded-xl p-4 relative transition-all hover:bg-slate-800`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs font-medium text-slate-400 bg-slate-900/50 px-2 py-1 rounded-md">
            {formatMatchTime(match.match_date)}
          </div>
        </div>

        {/* Teams & Score Inputs */}
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Team A */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <FlagIcon country={match.team_a} size="lg" />
            <span className="font-semibold text-sm text-center leading-tight">{match.team_a}</span>
          </div>

          {/* Scores */}
          <div className="flex items-center gap-3 shrink-0">
            <input
              type="number"
              min="0"
              max="20"
              value={pred.predicted_score_a ?? ''}
              onChange={e => handleScoreChange(match.id, 'a', e.target.value)}
              onBlur={() => savePrediction(match.id)}
              disabled={isDeadlinePassed}
              className="w-12 h-14 text-center bg-slate-900 border border-slate-700 rounded-lg text-2xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-70 transition-all"
            />
            <span className="text-slate-500 font-bold text-lg">X</span>
            <input
              type="number"
              min="0"
              max="20"
              value={pred.predicted_score_b ?? ''}
              onChange={e => handleScoreChange(match.id, 'b', e.target.value)}
              onBlur={() => savePrediction(match.id)}
              disabled={isDeadlinePassed}
              className="w-12 h-14 text-center bg-slate-900 border border-slate-700 rounded-lg text-2xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-70 transition-all"
            />
          </div>

          {/* Team B */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <FlagIcon country={match.team_b} size="lg" />
            <span className="font-semibold text-sm text-center leading-tight">{match.team_b}</span>
          </div>
        </div>

        {/* Tie Breaker Settings (Knockout only) */}
        {isKnockout && isDraw && (
          <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                {lang === 'pt' ? 'Quem avança?' : 'Who advances?'}
              </label>
              <select
                value={pred.advance_team || ''}
                onChange={e => handleTieChange(match.id, 'team', e.target.value)}
                onBlur={() => savePrediction(match.id)}
                disabled={isDeadlinePassed}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70"
              >
                <option value="">{lang === 'pt' ? 'Selecione...' : 'Select...'}</option>
                <option value={match.team_a}>{match.team_a}</option>
                <option value={match.team_b}>{match.team_b}</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                {lang === 'pt' ? 'Como?' : 'How?'}
              </label>
              <select
                value={pred.advance_method || ''}
                onChange={e => handleTieChange(match.id, 'method', e.target.value)}
                onBlur={() => savePrediction(match.id)}
                disabled={isDeadlinePassed}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70"
              >
                <option value="">{lang === 'pt' ? 'Selecione...' : 'Select...'}</option>
                <option value="Prorrogação">{lang === 'pt' ? 'Prorrogação' : 'Extra Time'}</option>
                <option value="Pênaltis">{lang === 'pt' ? 'Pênaltis' : 'Penalties'}</option>
              </select>
            </div>
          </div>
        )}

        {/* Save Status */}
        <div className="absolute top-4 right-4 flex items-center justify-end">
          {saveStatus[match.id] === 'saving' && <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />}
          {saveStatus[match.id] === 'saved' && <span className="text-xs text-slate-400">{t(lang, 'predictions.saved')}</span>}
          {saveStatus[match.id] === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
        </div>

        {/* Actual Score and Points */}
        {match.actual_score_a !== null && match.actual_score_b !== null && (
          <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex justify-between items-center">
            <div className="text-sm text-slate-300">
              {lang === 'pt' ? 'Placar Real:' : 'Real Score:'} <strong className="text-white ml-1">{match.actual_score_a} {t(lang, 'common.vs')} {match.actual_score_b}</strong>
            </div>
            <div className="text-emerald-400 font-bold flex items-center gap-1">
              +{calculatePoints(match, pred)} <span className="text-xs font-normal opacity-80">{t(lang, 'predictions.points')}</span>
            </div>
          </div>
        )}

        {isDeadlinePassed && (
          <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-800/30 border border-slate-700/50 px-2 py-1 rounded-md w-fit mx-auto mt-4">
            <Lock className="w-3 h-3" /> {lang === 'pt' ? 'Encerrado' : 'Closed'}
          </div>
        )}
      </div>
    );
  }
}

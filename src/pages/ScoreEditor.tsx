import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';
import { recalculateScores } from '../engine/recalculate';
import { Check, Edit2, Loader2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { formatMatchTime } from '../utils/dateUtils';
import { FlagIcon } from '../components/FlagIcon';
import { useLang } from '../contexts/LanguageContext';
import { t } from '../i18n';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate } from 'react-router-dom';

type Match = Database['public']['Tables']['matches']['Row'];

const PHASE_ORDER: Record<string, number> = {
  'group': 1,
  'round_of_32': 2,
  'round_of_16': 3,
  'quarter_final': 4,
  'semi_final': 5,
  'third_place': 6,
  'final': 7
};

const formatPhaseName = (phase: string, lang: 'pt' | 'en') => {
  const map: Record<string, string> = lang === 'pt' ? {
    'group': 'Fase de Grupos',
    'round_of_32': 'Dezesseis-avos de Final',
    'round_of_16': 'Oitavas de Final',
    'quarter_final': 'Quartas de Final',
    'semi_final': 'Semifinal',
    'third_place': 'Disputa de 3º Lugar',
    'final': 'Final'
  } : {
    'group': 'Group Stage',
    'round_of_32': 'Round of 32',
    'round_of_16': 'Round of 16',
    'quarter_final': 'Quarterfinals',
    'semi_final': 'Semifinals',
    'third_place': '3rd Place Match',
    'final': 'Final'
  };
  return map[phase] || phase;
};

export function ScoreEditor() {
  const { lang } = useLang();
  const { user, isScoreEditor, isAdmin } = useAuthStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'group' | 'date'>(() => {
    const stored = localStorage.getItem('score_editor_view_mode');
    return (stored === 'group' || stored === 'date') ? stored : 'date';
  });

  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);
  const [editingScores, setEditingScores] = useState<Record<number, { a: string, b: string, tiebreaker?: 'A' | 'B' | '', advance_method?: 'Prorrogação' | 'Pênaltis' | '' }>>({});
  const [savingResult, setSavingResult] = useState<number | null>(null);
  const [expandedMatches, setExpandedMatches] = useState<Record<number, boolean>>({});
  const [groupStageExpanded, setGroupStageExpanded] = useState<boolean | null>(null);

  // Guard routing internally as well, in case layout navigation gets bypassed
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!isScoreEditor && !isAdmin) {
    return <Navigate to="/predictions" replace />;
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleViewModeChange = (mode: 'group' | 'date') => {
    setViewMode(mode);
    localStorage.setItem('score_editor_view_mode', mode);
  };

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true });

      if (error) {
        showToast(lang === 'pt' ? 'Erro ao carregar partidas' : 'Error loading matches', 'error');
      } else if (data) {
        setMatches(data);
      }
      setLoading(false);
    };

    fetchMatches();
  }, [lang]);

  const handleScoreChange = (matchId: number, team: 'a' | 'b', val: string) => {
    setEditingScores(prev => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { a: '', b: '', tiebreaker: '', advance_method: '' }),
        [team]: val
      }
    }));
  };

  const handleTiebreakerChange = (matchId: number, val: 'A' | 'B' | '') => {
    setEditingScores(prev => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { a: '', b: '', tiebreaker: '', advance_method: '' }),
        tiebreaker: val
      }
    }));
  };

  const handleAdvanceMethodChange = (matchId: number, val: 'Prorrogação' | 'Pênaltis' | '') => {
    setEditingScores(prev => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { a: '', b: '', tiebreaker: '', advance_method: '' }),
        advance_method: val
      }
    }));
  };

  const saveMatchResult = async (matchId: number) => {
    const scores = editingScores[matchId];
    if (!scores || scores.a === '' || scores.b === '') {
      showToast(lang === 'pt' ? 'Preencha os dois placares' : 'Fill in both scores', 'error');
      return;
    }

    setSavingResult(matchId);
    const actual_score_a = parseInt(scores.a, 10);
    const actual_score_b = parseInt(scores.b, 10);

    const match = matches.find(m => m.id === matchId);
    const isKnockout = match && match.phase !== 'group';
    const isDraw = actual_score_a === actual_score_b;
    let actual_tiebreaker_winner: 'A' | 'B' | null = null;
    let actual_advance_method: string | null = null;

    if (isKnockout && isDraw) {
      if (scores.tiebreaker === 'A' || scores.tiebreaker === 'B') {
        actual_tiebreaker_winner = scores.tiebreaker;
      } else {
        showToast(lang === 'pt' ? 'Selecione o vencedor do desempate' : 'Select the tie-breaker winner', 'error');
        setSavingResult(null);
        return;
      }

      if (scores.advance_method === 'Prorrogação' || scores.advance_method === 'Pênaltis') {
        actual_advance_method = scores.advance_method;
      } else {
        showToast(lang === 'pt' ? 'Selecione como avançou (Prorrogação ou Pênaltis)' : 'Select how they advanced (Extra Time or Penalties)', 'error');
        setSavingResult(null);
        return;
      }
    }

    const { error } = await supabase.from('matches')
      .update({ actual_score_a, actual_score_b, actual_tiebreaker_winner, actual_advance_method })
      .eq('id', matchId);

    if (error) {
      showToast(t(lang, 'scoreEditor.saveError'), 'error');
    } else {
      // Trigger recalculation only on manual save click
      await recalculateScores(matchId);
      showToast(t(lang, 'scoreEditor.saveSuccess'), 'success');
      
      // Clear edit state
      setEditingScores(prev => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
      // Collapse card
      setExpandedMatches(prev => ({ ...prev, [matchId]: false }));

      // Refresh matches
      const { data } = await supabase.from('matches').select('*').order('match_date', { ascending: true });
      if (data) setMatches(data);
    }
    setSavingResult(null);
  };

  const toggleExpand = (matchId: number) => {
    setExpandedMatches(prev => ({
      ...prev,
      [matchId]: !prev[matchId]
    }));
  };

  const renderMatchCard = (match: Match) => {
    const hasResult = match.actual_score_a !== null && match.actual_score_b !== null;
    const isEditing = editingScores[match.id] !== undefined;
    const isKnockout = match.phase !== 'group';
    const currentA = editingScores[match.id]?.a ?? (hasResult ? String(match.actual_score_a) : '');
    const currentB = editingScores[match.id]?.b ?? (hasResult ? String(match.actual_score_b) : '');
    const isCurrentDraw = currentA !== '' && currentB !== '' && currentA === currentB;

    const isGroup = match.phase === 'group';
    const canCollapse = isGroup && hasResult;
    const isExpanded = isEditing ? true : (canCollapse ? (expandedMatches[match.id] ?? false) : true);

    if (!isExpanded) {
      return (
        <div 
          key={match.id} 
          onClick={() => toggleExpand(match.id)}
          className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800 hover:border-slate-600 transition-colors select-none"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 justify-end flex-1 min-w-0">
              <span className="font-semibold text-sm text-slate-200 truncate text-right hidden sm:inline">{match.team_a}</span>
              <span className="font-semibold text-xs text-slate-200 truncate text-right sm:hidden">{match.team_a.substring(0, 3).toUpperCase()}</span>
              <FlagIcon country={match.team_a} size="sm" />
            </div>

            <div className="flex items-center justify-center bg-slate-950/80 px-3 py-1 rounded-md text-sm font-bold text-slate-100 border border-slate-700/30 shrink-0 min-w-[70px]">
              {match.actual_score_a} - {match.actual_score_b}
            </div>

            <div className="flex items-center gap-2 justify-start flex-1 min-w-0">
              <FlagIcon country={match.team_b} size="sm" />
              <span className="font-semibold text-sm text-slate-200 truncate text-left hidden sm:inline">{match.team_b}</span>
              <span className="font-semibold text-xs text-slate-200 truncate text-left sm:hidden">{match.team_b.substring(0, 3).toUpperCase()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      );
    }

    return (
      <div key={match.id} className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 relative">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs text-slate-400">{formatMatchTime(match.match_date)}</div>
          {canCollapse && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpand(match.id); }}
              className="p-1 hover:bg-slate-700 rounded-md transition-colors text-slate-400 hover:text-slate-200"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex-1 font-medium flex items-center justify-start gap-2">
            <span>{match.team_a}</span>
            <FlagIcon country={match.team_a} size="lg" />
          </div>
          
          <div className="flex items-center gap-3 shrink-0 mx-4">
            {(!hasResult || isEditing) ? (
              <>
                <input
                  type="number"
                  min="0"
                  value={editingScores[match.id]?.a ?? (hasResult ? match.actual_score_a : '')}
                  onChange={e => handleScoreChange(match.id, 'a', e.target.value)}
                  className="w-10 h-10 text-center bg-slate-900 border border-slate-600 rounded text-lg font-bold outline-none focus:border-emerald-500"
                />
                <span className="text-slate-500 font-bold">X</span>
                <input
                  type="number"
                  min="0"
                  value={editingScores[match.id]?.b ?? (hasResult ? match.actual_score_b : '')}
                  onChange={e => handleScoreChange(match.id, 'b', e.target.value)}
                  className="w-10 h-10 text-center bg-slate-900 border border-slate-600 rounded text-lg font-bold outline-none focus:border-emerald-500"
                />
              </>
            ) : (
              <div className="text-xl font-bold bg-slate-900/50 px-4 py-1 rounded">
                {match.actual_score_a} - {match.actual_score_b}
              </div>
            )}
          </div>

          <div className="flex-1 font-medium flex items-center justify-end gap-2">
            <FlagIcon country={match.team_b} size="lg" />
            <span>{match.team_b}</span>
          </div>
        </div>

        {/* Tie-breaker selections for Draw in Knockout Stage */}
        {isKnockout && isCurrentDraw && (!hasResult || isEditing) && (
          <div className="mt-3 pt-3 border-t border-slate-700 flex flex-col sm:flex-row gap-3 items-center justify-center animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {lang === 'pt' ? 'Vencedor:' : 'Winner:'}
              </span>
              <select
                value={editingScores[match.id]?.tiebreaker ?? (hasResult ? (match.actual_tiebreaker_winner || '') : '')}
                onChange={e => handleTiebreakerChange(match.id, e.target.value as 'A' | 'B' | '')}
                className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm font-semibold outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">{lang === 'pt' ? 'Selecione...' : 'Select...'}</option>
                <option value="A">{match.team_a}</option>
                <option value="B">{match.team_b}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {lang === 'pt' ? 'Como avançou?:' : 'How?:'}
              </span>
              <select
                value={editingScores[match.id]?.advance_method ?? (hasResult ? (match.actual_advance_method || '') : '')}
                onChange={e => handleAdvanceMethodChange(match.id, e.target.value as 'Prorrogação' | 'Pênaltis' | '')}
                className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm font-semibold outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">{lang === 'pt' ? 'Selecione...' : 'Select...'}</option>
                <option value="Prorrogação">{lang === 'pt' ? 'Prorrogação' : 'Extra Time'}</option>
                <option value="Pênaltis">{lang === 'pt' ? 'Pênaltis' : 'Penalties'}</option>
              </select>
            </div>
          </div>
        )}

        {isKnockout && match.actual_score_a === match.actual_score_b && hasResult && !isEditing && (
          <div className="mt-3 pt-3 border-t border-slate-700/50 text-center text-xs text-emerald-400 font-semibold flex flex-col gap-1 items-center">
            <div>
              {lang === 'pt' ? 'Vencedor do desempate: ' : 'Tie-breaker Winner: '}
              <span className="text-white font-bold">
                {match.actual_tiebreaker_winner === 'A' ? match.team_a : match.actual_tiebreaker_winner === 'B' ? match.team_b : (lang === 'pt' ? 'Não definido' : 'Not set')}
              </span>
            </div>
            {match.actual_advance_method && (
              <div>
                {lang === 'pt' ? 'Como avançou: ' : 'How they advanced: '}
                <span className="text-white font-bold">
                  {match.actual_advance_method === 'Prorrogação' ? (lang === 'pt' ? 'Prorrogação' : 'Extra Time') : (lang === 'pt' ? 'Pênaltis' : 'Penalties')}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          {(!hasResult || isEditing) ? (
            <button
              onClick={() => saveMatchResult(match.id)}
              disabled={savingResult === match.id}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {savingResult === match.id ? t(lang, 'admin.saving') : t(lang, 'admin.save')}
              <Check className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                setGroupStageExpanded(true);
                setEditingScores(prev => ({
                  ...prev,
                  [match.id]: {
                    a: String(match.actual_score_a),
                    b: String(match.actual_score_b),
                    tiebreaker: match.actual_tiebreaker_winner || '',
                    advance_method: (match.actual_advance_method as any) || ''
                  }
                }));
              }}
              className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              {lang === 'pt' ? 'Editar' : 'Edit'} <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const groupedMatches: Record<string, Match[]> = {};
  matches.forEach(m => {
    if (!groupedMatches[m.phase]) groupedMatches[m.phase] = [];
    groupedMatches[m.phase].push(m);
  });

  const groupMatches = matches.filter(m => m.phase === 'group');
  const scoredGroupCount = groupMatches.filter(m => m.actual_score_a !== null && m.actual_score_b !== null).length;
  const totalGroupCount = groupMatches.length;
  const allGroupMatchesScored = groupMatches.length > 0 && scoredGroupCount === totalGroupCount;
  const isGroupStageExpanded = groupStageExpanded ?? !allGroupMatchesScored;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-top duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-100' 
            : 'bg-red-900/90 border-red-500/30 text-red-100'
        }`}>
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-black text-white">
          {t(lang, 'scoreEditor.title')}
        </h2>
        <p className="text-sm text-slate-400">
          {t(lang, 'scoreEditor.subtitle')}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
          <span className="text-slate-400 text-sm">{t(lang, 'common.loading')}</span>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-800/20 border border-slate-800 rounded-xl">
          {t(lang, 'scoreEditor.noMatches')}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMatches)
            .sort(([a], [b]) => (PHASE_ORDER[a] || 99) - (PHASE_ORDER[b] || 99))
            .map(([phase, phaseMatches]) => (
              <div key={phase} className="space-y-4">
                {phase === 'group' ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => setGroupStageExpanded(prev => !prev)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-left font-sans cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white capitalize">
                          {formatPhaseName(phase, lang)}
                        </span>
                        <span className="text-sm text-slate-400 hidden sm:inline">
                          {scoredGroupCount}/{totalGroupCount} {t(lang, 'predictions.scored')}
                        </span>
                        <span className="text-xs text-slate-400 sm:hidden">
                          ({scoredGroupCount}/{totalGroupCount})
                        </span>
                      </div>

                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                          isGroupStageExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isGroupStageExpanded && (
                      <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex justify-end">
                          <div className="flex bg-slate-950 border border-slate-700/60 rounded-lg p-0.5 text-xs font-semibold text-slate-400">
                            <button
                              onClick={() => handleViewModeChange('group')}
                              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                                viewMode === 'group'
                                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                                  : 'hover:text-slate-200 hover:bg-slate-800/40'
                              }`}
                            >
                              {t(lang, 'predictions.viewByGroup')}
                            </button>
                            <button
                              onClick={() => handleViewModeChange('date')}
                              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                                viewMode === 'date'
                                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                                  : 'hover:text-slate-200 hover:bg-slate-800/40'
                              }`}
                            >
                              {t(lang, 'predictions.viewByDate')}
                            </button>
                          </div>
                        </div>

                        {viewMode === 'date' ? (
                          <div className="space-y-3">
                            {[...phaseMatches]
                              .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
                              .map(m => renderMatchCard(m))}
                          </div>
                        ) : (
                          Object.entries(
                            phaseMatches.reduce((acc, m) => {
                              if (!acc[m.group_name]) acc[m.group_name] = [];
                              acc[m.group_name].push(m);
                              return acc;
                            }, {} as Record<string, Match[]>)
                          ).sort(([a], [b]) => a.localeCompare(b)).map(([groupName, gMatches]) => (
                            <div key={groupName} className="space-y-3">
                              <h3 className="text-sm font-semibold text-slate-400">{t(lang, 'predictions.group')} {groupName}</h3>
                              {gMatches.map(m => renderMatchCard(m))}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2 pt-2">
                      <h2 className="text-xl font-bold text-emerald-400 capitalize">
                        {formatPhaseName(phase, lang)}
                      </h2>
                    </div>

                    <div className="space-y-3">
                      {phaseMatches.map(m => renderMatchCard(m))}
                    </div>
                  </div>
                )}
              </div>
          ))}
        </div>
      )}
    </div>
  );
}

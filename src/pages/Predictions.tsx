import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { CheckCircle, AlertCircle, Trophy, Medal, Star, Lock } from 'lucide-react';
import type { Database } from '../lib/supabase';
import { formatMatchDate } from '../utils/dateFormat';

type Match = Database['public']['Tables']['matches']['Row'];
type Prediction = Database['public']['Tables']['predictions']['Row'];
type SpecialPredictionRow = Database['public']['Tables']['special_predictions']['Row'];

const FLAG_MAP: Record<string, string> = {
  'Brasil': '🇧🇷', 'Argentina': '🇦🇷', 'França': '🇫🇷', 'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Espanha': '🇪🇸', 'Alemanha': '🇩🇪', 'Portugal': '🇵🇹', 'Itália': '🇮🇹',
  'Holanda': '🇳🇱', 'Bélgica': '🇧🇪', 'Croácia': '🇭🇷', 'Uruguai': '🇺🇾',
  'Colômbia': '🇨🇴', 'Chile': '🇨🇱', 'Estados Unidos': '🇺🇸', 'México': '🇲🇽'
};
const getFlag = (team: string) => FLAG_MAP[team] || '🏳️';

import { calculatePoints } from '../engine/scoring';

const GROUPS = ["Todos", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const PHASE_ORDER: Record<string, number> = {
  'group': 1,
  'round_16': 2,
  'quarter_finals': 3,
  'semi_finals': 4,
  'third_place': 5,
  'final': 6
};

const formatPhaseName = (phase: string) => {
  const map: Record<string, string> = {
    'group': 'Fase de Grupos',
    'round_16': 'Oitavas de Final',
    'quarter_finals': 'Quartas de Final',
    'semi_finals': 'Semifinal',
    'third_place': 'Disputa de 3º Lugar',
    'final': 'Final'
  };
  return map[phase] || phase;
};

export function Predictions() {
  const { user } = useAuthStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [localPredictions, setLocalPredictions] = useState<Record<number, Partial<Prediction>>>({});
  const [specialPreds, setSpecialPreds] = useState<Partial<SpecialPredictionRow>>({
    champion: '', top_scorer: '', best_player: ''
  });
  
  const [activeTab, setActiveTab] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<Record<number, 'saving' | 'saved' | 'error'>>({});
  const [specialSaveStatus, setSpecialSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      setLoading(true);
      
      const [matchesRes, predsRes, specialRes] = await Promise.all([
        supabase.from('matches').select('*').order('match_date', { ascending: true }),
        supabase.from('predictions').select('*').eq('player_id', user.id),
        supabase.from('special_predictions').select('*').eq('player_id', user.id).maybeSingle()
      ]);

      if (matchesRes.data) setMatches(matchesRes.data);
      
      if (predsRes.data) {
        const predsMap: Record<number, Partial<Prediction>> = {};
        predsRes.data.forEach(p => {
          predsMap[p.match_id] = p;
        });
        setLocalPredictions(predsMap);
      }

      if (specialRes.data) {
        setSpecialPreds(specialRes.data);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

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
  };

  const handleTieChange = (matchId: number, field: 'team' | 'method', value: string) => {
    setLocalPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [`advance_${field}`]: value
      }
    }));
  };

  const savePrediction = async (matchId: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    if (new Date() > new Date(match.deadline)) return;

    const pred = localPredictions[matchId];
    if (pred?.predicted_score_a === undefined || pred?.predicted_score_b === undefined) return;

    setSaveStatus(prev => ({ ...prev, [matchId]: 'saving' }));

    const payload = {
      player_id: user.id,
      match_id: matchId,
      predicted_score_a: pred.predicted_score_a,
      predicted_score_b: pred.predicted_score_b,
      advance_team: pred.advance_team || null,
      advance_method: pred.advance_method || null,
    };

    console.log('Saving prediction:', payload);

    const { error } = await supabase.from('predictions').upsert(payload, { onConflict: 'player_id,match_id' });

    if (error) {
      setSaveStatus(prev => ({ ...prev, [matchId]: 'error' }));
    } else {
      setSaveStatus(prev => ({ ...prev, [matchId]: 'saved' }));
      setTimeout(() => {
        setSaveStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[matchId];
          return newStatus;
        });
      }, 3000);
    }
  };

  const saveSpecial = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSpecialSaveStatus('saving');
    
    const payload = {
      player_id: user.id,
      champion: specialPreds.champion || '',
      top_scorer: specialPreds.top_scorer || '',
      best_player: specialPreds.best_player || ''
    };

    console.log('Saving prediction:', payload);

    const { error } = await supabase.from('special_predictions').upsert(payload, { onConflict: 'player_id' });

    if (!error) {
      // Refresh to get the latest state including any DB default values
      const { data } = await supabase
        .from('special_predictions')
        .select('*')
        .eq('player_id', user.id)
        .maybeSingle();
      if (data) setSpecialPreds(data);
    }

    if (error) {
      setSpecialSaveStatus('error');
    } else {
      setSpecialSaveStatus('saved');
      setTimeout(() => setSpecialSaveStatus('idle'), 3000);
    }
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
          {GROUPS.map(g => (
            <button
              key={g}
              onClick={() => setActiveTab(g)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === g 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {g === 'Todos' ? g : `Grupo ${g}`}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Special Predictions */}
        {(activeTab === 'Todos' || activeTab === 'A') && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 shadow-lg">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Palpites Especiais
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4" /> Campeão
                </label>
                <input 
                  type="text" 
                  value={specialPreds.champion || ''}
                  onChange={e => setSpecialPreds(p => ({ ...p, champion: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Ex: Brasil"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 flex items-center gap-2 mb-1">
                  <Medal className="w-4 h-4" /> Artilheiro
                </label>
                <input 
                  type="text" 
                  value={specialPreds.top_scorer || ''}
                  onChange={e => setSpecialPreds(p => ({ ...p, top_scorer: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Ex: Vini Jr"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4" /> Melhor Jogador
                </label>
                <input 
                  type="text" 
                  value={specialPreds.best_player || ''}
                  onChange={e => setSpecialPreds(p => ({ ...p, best_player: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Ex: Bellingham"
                />
              </div>
              <button 
                onClick={saveSpecial}
                disabled={specialSaveStatus === 'saving'}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {specialSaveStatus === 'saving' ? 'Salvando...' : 'Salvar Palpites Especiais'}
                {specialSaveStatus === 'saved' && <CheckCircle className="w-4 h-4" />}
                {specialSaveStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-300" />}
              </button>
            </div>
          </div>
        )}

        {/* Matches List */}
        {Object.entries(groupedMatches)
          .sort(([a], [b]) => (PHASE_ORDER[a] || 99) - (PHASE_ORDER[b] || 99))
          .map(([phase, phaseMatches]) => (
          <div key={phase} className="space-y-4">
            <h2 className="text-xl font-bold text-emerald-400 capitalize pt-2 border-b border-slate-800 pb-2">
              {formatPhaseName(phase)}
            </h2>
            
            {phase === 'group' ? (
              // Group by group_name
              Object.entries(
                phaseMatches.reduce((acc, m) => {
                  if (!acc[m.group_name]) acc[m.group_name] = [];
                  acc[m.group_name].push(m);
                  return acc;
                }, {} as Record<string, Match[]>)
              ).sort(([a], [b]) => a.localeCompare(b)).map(([groupName, gMatches]) => (
                <div key={groupName} className="space-y-3">
                  <h3 className="text-md font-semibold text-slate-300 flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-md w-fit mt-4">
                    Grupo {groupName}
                  </h3>
                  {gMatches.map(m => renderMatchCard(m))}
                </div>
              ))
            ) : (
              // Knockout matches just listed
              <div className="space-y-3 mt-4">
                {phaseMatches.map(m => renderMatchCard(m))}
              </div>
            )}
          </div>
        ))}

        {filteredMatches.length === 0 && (
          <div className="text-center text-slate-500 py-10">
            Nenhuma partida encontrada para este filtro.
          </div>
        )}
      </div>
    </div>
  );

  function renderMatchCard(match: Match) {
    const isDeadlinePassed = new Date() > new Date(match.deadline);
    const pred = localPredictions[match.id] || {};
    const isKnockout = match.phase !== 'group';
    const isDraw = pred.predicted_score_a !== undefined && 
                   pred.predicted_score_a === pred.predicted_score_b;

    return (
      <div key={match.id} className={`bg-slate-800/60 border ${isDeadlinePassed ? 'border-slate-700/50 opacity-80' : 'border-slate-700'} rounded-xl p-4 relative transition-all hover:bg-slate-800`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs font-medium text-slate-400 bg-slate-900/50 px-2 py-1 rounded-md">
            {formatMatchDate(match.match_date)}
          </div>
          {isDeadlinePassed && (
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-md">
              <Lock className="w-3 h-3" /> Encerrado
            </div>
          )}
        </div>

        {/* Teams & Score Inputs */}
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Team A */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-2xl">{getFlag(match.team_a)}</span>
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
            <span className="text-2xl">{getFlag(match.team_b)}</span>
            <span className="font-semibold text-sm text-center leading-tight">{match.team_b}</span>
          </div>
        </div>

        {/* Tie Breaker Settings (Knockout only) */}
        {isKnockout && isDraw && (
          <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">Quem avança?</label>
              <select
                value={pred.advance_team || ''}
                onChange={e => handleTieChange(match.id, 'team', e.target.value)}
                onBlur={() => savePrediction(match.id)}
                disabled={isDeadlinePassed}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70"
              >
                <option value="">Selecione...</option>
                <option value={match.team_a}>{match.team_a}</option>
                <option value={match.team_b}>{match.team_b}</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">Como?</label>
              <select
                value={pred.advance_method || ''}
                onChange={e => handleTieChange(match.id, 'method', e.target.value)}
                onBlur={() => savePrediction(match.id)}
                disabled={isDeadlinePassed}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70"
              >
                <option value="">Selecione...</option>
                <option value="Prorrogação">Prorrogação</option>
                <option value="Pênaltis">Pênaltis</option>
              </select>
            </div>
          </div>
        )}

        {/* Save Status */}
        <div className="absolute top-4 right-4 flex items-center justify-end">
          {saveStatus[match.id] === 'saving' && <span className="text-slate-400 text-xs animate-pulse">Salvando...</span>}
          {saveStatus[match.id] === 'saved' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
          {saveStatus[match.id] === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
        </div>

        {/* Actual Score and Points */}
        {match.actual_score_a !== null && match.actual_score_b !== null && (
          <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex justify-between items-center">
            <div className="text-sm text-slate-300">
              Placar Real: <strong className="text-white ml-1">{match.actual_score_a} x {match.actual_score_b}</strong>
            </div>
            <div className="text-emerald-400 font-bold flex items-center gap-1">
              +{calculatePoints(match, pred)} <span className="text-xs font-normal opacity-80">pts</span>
            </div>
          </div>
        )}
      </div>
    );
  }
}

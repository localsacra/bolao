import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';
import { recalculateScores } from '../engine/recalculate';
import { CheckCircle, AlertCircle, Calendar, Users, Trophy, Plus, Check, Edit2, X, Download } from 'lucide-react';
import { formatMatchDate } from '../utils/dateFormat';
import { getFlagEmoji } from '../utils/flagEmoji';

type Match = Database['public']['Tables']['matches']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

const PHASE_ORDER: Record<string, number> = {
  'group': 1,
  'round_of_32': 2,
  'round_of_16': 3,
  'quarterfinal': 4,
  'semifinal': 5,
  'final': 6
};

const formatPhaseName = (phase: string) => {
  const map: Record<string, string> = {
    'group': 'Fase de Grupos',
    'round_of_32': 'Dezesseis-avos',
    'round_of_16': 'Oitavas de Final',
    'quarterfinal': 'Quartas de Final',
    'semifinal': 'Semifinal',
    'final': 'Final'
  };
  return map[phase] || phase;
};


export function Admin() {
  const [activeTab, setActiveTab] = useState<'resultados' | 'partidas' | 'jogadores'>('resultados');
  const [matches, setMatches] = useState<Match[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);
  
  // Tab 1 state
  const [editingScores, setEditingScores] = useState<Record<number, { a: string, b: string }>>({});
  const [savingResult, setSavingResult] = useState<number | null>(null);

  // Tab 2 state
  const [showNewMatchModal, setShowNewMatchModal] = useState(false);
  const [newMatch, setNewMatch] = useState({
    phase: 'round_of_16', team_a: '', team_b: '', match_date: '', deadline: ''
  });
  const [savingMatch, setSavingMatch] = useState(false);

  // Tab 3 state
  const [togglingAdmin, setTogglingAdmin] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [{ data: matchesData }, { data: profilesData }] = await Promise.all([
        supabase.from('matches').select('*').order('match_date', { ascending: true }),
        supabase.from('profiles').select('*').order('name', { ascending: true })
      ]);

      if (matchesData) setMatches(matchesData);
      if (profilesData) setProfiles(profilesData);
      setLoading(false);
    };

    fetchData();
  }, []);

  // RESULTADOS (TAB 1)
  const handleScoreChange = (matchId: number, team: 'a' | 'b', val: string) => {
    setEditingScores(prev => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { a: '', b: '' }),
        [team]: val
      }
    }));
  };

  const saveMatchResult = async (matchId: number) => {
    const scores = editingScores[matchId];
    if (!scores || scores.a === '' || scores.b === '') {
      showToast('Preencha os dois placares', 'error');
      return;
    }

    setSavingResult(matchId);
    const actual_score_a = parseInt(scores.a, 10);
    const actual_score_b = parseInt(scores.b, 10);

    const { error } = await supabase.from('matches')
      .update({ actual_score_a, actual_score_b })
      .eq('id', matchId);

    if (error) {
      showToast('Erro ao salvar resultado', 'error');
    } else {
      await recalculateScores(matchId);
      showToast('Resultado salvo e pontos recalculados!', 'success');
      
      // Remove edit state so it displays normally
      setEditingScores(prev => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
      // Refresh matches to see updated scores
      const { data } = await supabase.from('matches').select('*').order('match_date', { ascending: true });
      if (data) setMatches(data);
    }
    setSavingResult(null);
  };

  // PARTIDAS (TAB 2)
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    if (dateStr) {
      const date = new Date(dateStr);
      date.setMinutes(date.getMinutes() - 15);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const deadlineStr = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
      setNewMatch(prev => ({ ...prev, match_date: dateStr, deadline: deadlineStr }));
    } else {
      setNewMatch(prev => ({ ...prev, match_date: '' }));
    }
  };

  const createNewMatch = async () => {
    if (!newMatch.team_a || !newMatch.team_b || !newMatch.match_date || !newMatch.deadline) {
      showToast('Preencha todos os campos', 'error');
      return;
    }

    setSavingMatch(true);
    const { error } = await supabase.from('matches').insert({
      phase: newMatch.phase,
      group_name: 'Knockout',
      team_a: newMatch.team_a,
      team_b: newMatch.team_b,
      match_date: new Date(newMatch.match_date).toISOString(),
      deadline: new Date(newMatch.deadline).toISOString(),
    });

    if (error) {
      showToast('Erro ao criar partida', 'error');
    } else {
      showToast('Partida criada com sucesso!', 'success');
      setShowNewMatchModal(false);
      setNewMatch({ phase: 'round_of_16', team_a: '', team_b: '', match_date: '', deadline: '' });
      const { data } = await supabase.from('matches').select('*').order('match_date', { ascending: true });
      if (data) setMatches(data);
    }
    setSavingMatch(false);
  };

  // JOGADORES (TAB 3)
  const toggleAdmin = async (profileId: string, currentStatus: boolean) => {
    setTogglingAdmin(profileId);
    const { error } = await supabase.from('profiles')
      .update({ is_admin: !currentStatus })
      .eq('id', profileId);
    
    if (error) {
      showToast('Erro ao alterar status de admin', 'error');
    } else {
      showToast('Status atualizado!', 'success');
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, is_admin: !currentStatus } : p));
    }
    setTogglingAdmin(null);
  };

  const exportLeaderboard = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from('player_scores')
        .select(`
          total_points,
          profiles ( name )
        `)
        .order('total_points', { ascending: false });

      if (error) throw error;
      if (!data) throw new Error("No data");

      const typedData = data as unknown as { total_points: number, profiles: { name: string } | null }[];

      let text = "🏆 Bolão da Copa 2026 - Classificação Parcial\n\n";
      typedData.forEach((row, index: number) => {
        text += `${index + 1}º ${row.profiles?.name || 'Unknown'} - ${row.total_points} pts\n`;
      });

      await navigator.clipboard.writeText(text);
      showToast("Classificação copiada para a área de transferência!", "success");
    } catch (e) {
      showToast("Erro ao exportar classificação.", "error");
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const renderResultados = () => {
    const groupedMatches: Record<string, Match[]> = {};
    matches.forEach(m => {
      if (!groupedMatches[m.phase]) groupedMatches[m.phase] = [];
      groupedMatches[m.phase].push(m);
    });

    return (
      <div className="space-y-6">
        {Object.entries(groupedMatches)
          .sort(([a], [b]) => (PHASE_ORDER[a] || 99) - (PHASE_ORDER[b] || 99))
          .map(([phase, phaseMatches]) => (
            <div key={phase} className="space-y-4">
              <h2 className="text-xl font-bold text-emerald-400 capitalize border-b border-slate-800 pb-2">
                {formatPhaseName(phase)}
              </h2>
              
              {phase === 'group' ? (
                Object.entries(
                  phaseMatches.reduce((acc, m) => {
                    if (!acc[m.group_name]) acc[m.group_name] = [];
                    acc[m.group_name].push(m);
                    return acc;
                  }, {} as Record<string, Match[]>)
                ).sort(([a], [b]) => a.localeCompare(b)).map(([groupName, gMatches]) => (
                  <div key={groupName} className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-400">Grupo {groupName}</h3>
                    {gMatches.map(m => renderMatchAdminCard(m))}
                  </div>
                ))
              ) : (
                <div className="space-y-3">
                  {phaseMatches.map(m => renderMatchAdminCard(m))}
                </div>
              )}
            </div>
        ))}
      </div>
    );
  };

  const renderMatchAdminCard = (match: Match) => {
    const hasResult = match.actual_score_a !== null && match.actual_score_b !== null;
    const isEditing = editingScores[match.id] !== undefined;

    return (
      <div key={match.id} className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
        <div className="text-xs text-slate-400 mb-2">{formatMatchDate(match.match_date)}</div>
        <div className="flex items-center justify-between">
          <div className="flex-1 font-medium">{match.team_a} {getFlagEmoji(match.team_a)}</div>
          
          <div className="flex items-center gap-3 shrink-0 mx-4">
            {(!hasResult || isEditing) ? (
              <>
                <input
                  type="number"
                  min="0"
                  value={editingScores[match.id]?.a ?? (hasResult ? match.actual_score_a : '')}
                  onChange={e => handleScoreChange(match.id, 'a', e.target.value)}
                  className="w-10 h-10 text-center bg-slate-900 border border-slate-600 rounded text-lg font-bold"
                />
                <span className="text-slate-500">X</span>
                <input
                  type="number"
                  min="0"
                  value={editingScores[match.id]?.b ?? (hasResult ? match.actual_score_b : '')}
                  onChange={e => handleScoreChange(match.id, 'b', e.target.value)}
                  className="w-10 h-10 text-center bg-slate-900 border border-slate-600 rounded text-lg font-bold"
                />
              </>
            ) : (
              <div className="text-xl font-bold bg-slate-900/50 px-4 py-1 rounded">
                {match.actual_score_a} - {match.actual_score_b}
              </div>
            )}
          </div>

          <div className="flex-1 font-medium text-right">{getFlagEmoji(match.team_b)} {match.team_b}</div>
        </div>

        <div className="mt-4 flex justify-end">
          {(!hasResult || isEditing) ? (
            <button
              onClick={() => saveMatchResult(match.id)}
              disabled={savingResult === match.id}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {savingResult === match.id ? 'Salvando...' : 'Salvar Resultado'}
              <Check className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingScores(prev => ({
                  ...prev,
                  [match.id]: { a: String(match.actual_score_a), b: String(match.actual_score_b) }
                }));
              }}
              className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
            >
              Editar <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderPartidas = () => {
    const knockoutMatches = matches.filter(m => m.phase !== 'group');

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-xl border border-slate-700">
          <div>
            <h2 className="font-bold text-lg">Mata-Mata</h2>
            <p className="text-sm text-slate-400">Gerencie partidas das fases eliminatórias.</p>
          </div>
          <button
            onClick={() => setShowNewMatchModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nova Partida
          </button>
        </div>

        <div className="space-y-3">
          {knockoutMatches.map(m => (
            <div key={m.id} className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-xs text-emerald-400 font-medium mb-1 uppercase tracking-wider">{formatPhaseName(m.phase)}</div>
                <div className="text-sm font-bold text-slate-200">
                  {getFlagEmoji(m.team_a)} {m.team_a} vs {m.team_b} {getFlagEmoji(m.team_b)}
                </div>
              </div>
              <div className="text-right text-xs text-slate-400">
                Data: {formatMatchDate(m.match_date)}<br/>
                Deadline: {formatMatchDate(m.deadline)}
              </div>
            </div>
          ))}
          {knockoutMatches.length === 0 && (
            <div className="text-center text-slate-500 py-8">Nenhuma partida de mata-mata cadastrada.</div>
          )}
        </div>
      </div>
    );
  };

  const renderJogadores = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-xl border border-slate-700">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" /> 
              Jogadores ({profiles.length})
            </h2>
          </div>
          <button
            onClick={exportLeaderboard}
            disabled={exporting}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Exportar Classificação
          </button>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-center">Admin</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {profiles.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-slate-400">{p.email}</td>
                    <td className="px-4 py-3 text-center">
                      {p.is_admin ? (
                        <span className="inline-flex bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold">Sim</span>
                      ) : (
                        <span className="inline-flex bg-slate-500/10 text-slate-400 px-2 py-0.5 rounded text-xs font-bold">Não</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleAdmin(p.id, p.is_admin)}
                        disabled={togglingAdmin === p.id}
                        className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                      >
                        {p.is_admin ? 'Remover Admin' : 'Tornar Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 pb-20 max-w-4xl mx-auto w-full">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-medium animate-in fade-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* Admin Tabs */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 p-4">
        <div className="flex bg-slate-800 rounded-lg p-1">
          {[
            { id: 'resultados', label: 'Resultados', icon: Trophy },
            { id: 'partidas', label: 'Partidas', icon: Calendar },
            { id: 'jogadores', label: 'Jogadores', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'resultados' | 'partidas' | 'jogadores')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'resultados' && renderResultados()}
        {activeTab === 'partidas' && renderPartidas()}
        {activeTab === 'jogadores' && renderJogadores()}
      </div>

      {/* Modal Nova Partida */}
      {showNewMatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/30">
              <h3 className="font-bold text-lg flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-500"/> Nova Partida</h3>
              <button onClick={() => setShowNewMatchModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Fase</label>
                <select
                  value={newMatch.phase}
                  onChange={e => setNewMatch(p => ({ ...p, phase: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="round_of_32">Dezesseis-avos (Round of 32)</option>
                  <option value="round_of_16">Oitavas de Final (Round of 16)</option>
                  <option value="quarterfinal">Quartas de Final</option>
                  <option value="semifinal">Semifinal</option>
                  <option value="final">Final</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Time A</label>
                  <input
                    type="text"
                    value={newMatch.team_a}
                    onChange={e => setNewMatch(p => ({ ...p, team_a: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ex: Brasil"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Time B</label>
                  <input
                    type="text"
                    value={newMatch.team_b}
                    onChange={e => setNewMatch(p => ({ ...p, team_b: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ex: Argentina"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Data da Partida</label>
                <input
                  type="datetime-local"
                  value={newMatch.match_date}
                  onChange={handleDateChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Encerramento (Deadline)</label>
                <input
                  type="datetime-local"
                  value={newMatch.deadline}
                  onChange={e => setNewMatch(p => ({ ...p, deadline: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  onClick={() => setShowNewMatchModal(false)}
                  className="px-4 py-2 font-medium text-slate-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={createNewMatch}
                  disabled={savingMatch}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
                >
                  {savingMatch ? 'Salvando...' : 'Salvar Partida'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

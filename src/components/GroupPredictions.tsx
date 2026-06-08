import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { CheckCircle, Lock, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import type { Database } from '../lib/supabase';
import { FlagIcon } from './FlagIcon';
import { calculateGroupPositionPoints, calculateThirdPlaceQualifierPoints } from '../engine/scoring';
import { useLang } from '../contexts/LanguageContext';
import { t } from '../i18n';
import { GROUP_STAGE_LOCK } from '../utils/constants';

console.log('GROUP_STAGE_LOCK:', GROUP_STAGE_LOCK);
console.log('Is locked:', new Date() >= GROUP_STAGE_LOCK);

type Match = Database['public']['Tables']['matches']['Row'];

type GroupSelection = {
  first: string | null;   // team selected for 1st
  second: string | null;  // team selected for 2nd
  saved: boolean;
  saving: boolean;
};

interface GroupPredictionsProps {
  matches: Match[];
  groupName?: string; // Optional filter for a single group card
}

export function GroupPredictions({ matches, groupName }: GroupPredictionsProps) {
  const { user } = useAuthStore();
  const { lang } = useLang();
  const isLocked = new Date() >= GROUP_STAGE_LOCK;
  const [selections, setSelections] = useState<Record<string, GroupSelection>>({});
  const [thirdPlaceSelections, setThirdPlaceSelections] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [shakingGroup, setShakingGroup] = useState<string | null>(null);
  
  // Third place state
  const [thirdSaveStatus, setThirdSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showThirdWarning, setShowThirdWarning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Derive groups from matches
  const groups = useMemo(() => {
    const list = Array.from(new Set(
      matches
        .filter(m => m.phase === 'group' && m.group_name)
        .map(m => m.group_name)
    )).sort();
    return groupName ? list.filter(g => g === groupName) : list;
  }, [matches, groupName]);

  // Derive teams per group from matches
  const teamsByGroup = useMemo(() => {
    const map: Record<string, string[]> = {};
    matches.forEach(m => {
      if (m.phase === 'group' && m.group_name) {
        if (!map[m.group_name]) map[m.group_name] = [];
        if (!map[m.group_name].includes(m.team_a)) map[m.group_name].push(m.team_a);
        if (!map[m.group_name].includes(m.team_b)) map[m.group_name].push(m.team_b);
      }
    });
    Object.keys(map).forEach(key => {
      map[key].sort();
    });
    return map;
  }, [matches]);

  // Official actual standings (where player_id is the system UUID)
  const [actualStandings, setActualStandings] = useState<Record<string, { position_1: string, position_2: string, position_3: string, position_4: string }>>({});

  // Get the group of a team
  const getGroupForTeam = (team: string) => {
    for (const [gName, teams] of Object.entries(teamsByGroup)) {
      if (teams.includes(team)) return gName;
    }
    return null;
  };

  // Derive the actual advancing 3rd-placed teams
  const actualThirdPlacesAdvanced = useMemo(() => {
    const allThirdPlaces = Object.values(actualStandings).map(a => a.position_3).filter(t => t);
    const knockoutTeams = new Set(
      matches
        .filter(m => m.phase !== 'group')
        .flatMap(m => [m.team_a, m.team_b])
    );
    return allThirdPlaces.filter(t => knockoutTeams.has(t));
  }, [actualStandings, matches]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch player's group predictions
        const { data: userPreds, error: userError } = await supabase
          .from('group_predictions')
          .select('*')
          .eq('player_id', user.id);

        if (userError) throw userError;

        // Fetch official actual standings
        const { data: officialPreds, error: officialError } = await supabase
          .from('group_predictions')
          .select('*')
          .eq('player_id', '00000000-0000-0000-0000-000000000000');

        if (officialError) throw officialError;

        // Populate selections map
        const initialSelections: Record<string, GroupSelection> = {};
        groups.forEach(g => {
          initialSelections[g] = { first: null, second: null, saved: false, saving: false };
        });

        const thirdSelections: string[] = [];

        if (userPreds) {
          userPreds.forEach(p => {
            if (initialSelections[p.group_name]) {
              initialSelections[p.group_name] = {
                first: p.position_1 || null,
                second: p.position_2 || null,
                saved: true,
                saving: false
              };
            }
            if (p.position_3) {
              thirdSelections.push(p.position_3);
            }
          });
        }

        setSelections(initialSelections);
        setThirdPlaceSelections(thirdSelections);

        if (officialPreds) {
          const officialMap: Record<string, any> = {};
          officialPreds.forEach(p => {
            officialMap[p.group_name] = p;
          });
          setActualStandings(officialMap);
        }

      } catch (err) {
        console.error('Error loading group predictions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, matches, groups]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const triggerShake = (groupName: string) => {
    setShakingGroup(groupName);
    setTimeout(() => {
      setShakingGroup(null);
    }, 500);
  };

  function handleTeamClick(groupName: string, team: string) {
    if (isLocked) return;

    setSelections(prev => {
      const current = prev[groupName] || { first: null, second: null, saved: false, saving: false };
      
      // If team already selected, deselect it
      if (current.first === team) {
        return {
          ...prev,
          [groupName]: {
            ...current,
            first: current.second,
            second: null,
            saved: false
          }
        };
      }
      if (current.second === team) {
        return {
          ...prev,
          [groupName]: { ...current, second: null, saved: false }
        };
      }
      
      // Assign to first available slot
      if (!current.first) {
        return {
          ...prev,
          [groupName]: { ...current, first: team, saved: false }
        };
      }
      if (!current.second) {
        return {
          ...prev,
          [groupName]: { ...current, second: team, saved: false }
        };
      }
      
      // Both slots taken - do nothing (add shake class)
      triggerShake(groupName);
      return prev;
    });
  }

  const handleThirdPlaceClick = (team: string) => {
    if (isLocked) return;
    const teamGroup = getGroupForTeam(team);
    if (!teamGroup) return;

    setThirdSaveStatus('idle');

    if (thirdPlaceSelections.includes(team)) {
      setThirdPlaceSelections(prev => prev.filter(t => t !== team));
      setShowThirdWarning(false);
    } else {
      // A group can only have one 3rd placed team. Remove previous selection from same group.
      const sameGroupTeam = thirdPlaceSelections.find(t => getGroupForTeam(t) === teamGroup);
      
      if (sameGroupTeam) {
        setThirdPlaceSelections(prev => [...prev.filter(t => t !== sameGroupTeam), team]);
        setShowThirdWarning(false);
      } else {
        if (thirdPlaceSelections.length < 8) {
          setThirdPlaceSelections(prev => [...prev, team]);
          setShowThirdWarning(false);
        } else {
          setShowThirdWarning(true);
          showToast(lang === 'pt' ? 'Você já selecionou o limite máximo de 8 terceiros colocados!' : 'You have already selected the maximum limit of 8 third-place qualifiers!');
          triggerShake('third_place');
        }
      }
    }
  };

  const saveGroup = async (groupName: string) => {
    if (!user) return;
    if (isLocked) return;

    const selection = selections[groupName];
    if (!selection) return;

    setSelections(prev => ({
      ...prev,
      [groupName]: { ...prev[groupName], saving: true }
    }));

    try {
      const groupTeams = teamsByGroup[groupName] || [];
      const selectedThirdTeam = thirdPlaceSelections.find(t => groupTeams.includes(t)) || '';

      const payload = {
        player_id: user.id,
        group_name: groupName,
        position_1: selection.first || '',
        position_2: selection.second || '',
        position_3: selectedThirdTeam,
        position_4: ''
      };

      const { error } = await supabase
        .from('group_predictions')
        .upsert(payload, { onConflict: 'player_id,group_name' });

      if (error) throw error;

      setSelections(prev => ({
        ...prev,
        [groupName]: { ...prev[groupName], saving: false, saved: true }
      }));
    } catch (e) {
      console.error('Error saving group:', e);
      setSelections(prev => ({
        ...prev,
        [groupName]: { ...prev[groupName], saving: false, saved: false }
      }));
      showToast(lang === 'pt' ? 'Erro ao salvar palpites do grupo!' : 'Error saving group predictions!');
    }
  };

  const saveThirdPlaceSelections = async () => {
    if (!user) return;
    if (isLocked) return;

    setThirdSaveStatus('saving');
    try {
      const upserts = Object.keys(teamsByGroup).map(g => {
        const selection = selections[g] || { first: null, second: null };
        const groupTeams = teamsByGroup[g] || [];
        const selectedThirdTeam = thirdPlaceSelections.find(t => groupTeams.includes(t)) || '';

        return {
          player_id: user.id,
          group_name: g,
          position_1: selection.first || '',
          position_2: selection.second || '',
          position_3: selectedThirdTeam,
          position_4: ''
        };
      });

      const { error } = await supabase
        .from('group_predictions')
        .upsert(upserts, { onConflict: 'player_id,group_name' });

      if (error) throw error;
      setThirdSaveStatus('saved');
      
      // Update all group saved states to true since saving third places upserts their latest state
      setSelections(prev => {
        const next = { ...prev };
        Object.keys(teamsByGroup).forEach(g => {
          if (next[g]) {
            next[g] = { ...next[g], saved: true };
          }
        });
        return next;
      });

      setTimeout(() => setThirdSaveStatus('idle'), 3000);
    } catch (e) {
      console.error('Error saving third place qualifiers:', e);
      setThirdSaveStatus('error');
      showToast(lang === 'pt' ? 'Erro ao salvar terceiros colocados!' : 'Error saving third place qualifiers!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold animate-bounce">
          <AlertCircle className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      {/* Group Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map(groupName => {
          const groupTeams = teamsByGroup[groupName] || [];
          const selection = selections[groupName] || { first: null, second: null, saved: false, saving: false };
          const isShaking = shakingGroup === groupName;
          
          // Check actual standings score if available
          const actual = actualStandings[groupName];
          const hasOfficialStandings = !!actual && (actual.position_1 || actual.position_2);
          
          let pointsEarned = 0;
          if (hasOfficialStandings) {
            groupTeams.forEach(team => {
              const predPos = selection.first === team ? '1' : selection.second === team ? '2' : thirdPlaceSelections.includes(team) ? '3' : '';
              const actPos = actual.position_1 === team ? '1' : actual.position_2 === team ? '2' : actual.position_3 === team ? '3' : '4';
              const predQualify = predPos === '1' || predPos === '2' || predPos === '3';
              const didQualify = actPos === '1' || actPos === '2' || (actPos === '3' && actualThirdPlacesAdvanced.includes(team));
              pointsEarned += calculateGroupPositionPoints(predPos, actPos, predQualify, didQualify);
            });
          }

          return (
            <div 
              key={groupName} 
              className={`bg-slate-800/60 border ${isLocked ? 'border-slate-700/50 opacity-90' : 'border-slate-700'} rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all hover:bg-slate-800/80 ${isShaking ? 'shake' : ''}`}
            >
              <div>
                {/* Card Header */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-emerald-400">{lang === 'pt' ? 'GRUPO' : 'GROUP'} {groupName}</h3>
                  <div className="flex items-center gap-2">
                    {hasOfficialStandings && (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-md font-bold">
                        +{pointsEarned} {t(lang, 'predictions.points')}
                      </span>
                    )}
                    {isLocked && (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-red-400 bg-red-400/10 px-2.5 py-1 rounded-md">
                        <Lock className="w-3 h-3" /> {lang === 'pt' ? 'Encerrado' : 'Closed'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Team Buttons list */}
                <div className="space-y-2 mb-4">
                  {groupTeams.map(team => (
                    <button
                      key={team}
                      onClick={() => handleTeamClick(groupName, team)}
                      disabled={isLocked}
                      className={`
                        w-full flex items-center justify-between p-3
                        rounded-lg border transition-all min-h-[48px]
                        ${selection.first === team 
                          ? 'border-[#ca8a04] bg-[#ca8a04]/10' 
                          : selection.second === team
                          ? 'border-[#6b7280] bg-[#6b7280]/10'
                          : 'border-slate-700 bg-slate-800 hover:border-slate-500'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <FlagIcon country={team} size="sm" />
                        <span className="text-white font-medium text-sm sm:text-base">{team}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Correctness check if official standings are available */}
                        {hasOfficialStandings && (
                          <>
                            {selection.first === team && (
                              actual.position_1 === team ? (
                                <span className="text-emerald-400 text-xs font-semibold">✓ {t(lang, 'predictions.correct')}</span>
                              ) : (
                                <span className="text-red-400 text-xs font-semibold">✗ ({t(lang, 'predictions.actual')}: 1º {actual.position_1})</span>
                              )
                            )}
                            {selection.second === team && (
                              actual.position_2 === team ? (
                                <span className="text-emerald-400 text-xs font-semibold">✓ {t(lang, 'predictions.correct')}</span>
                              ) : (
                                <span className="text-red-400 text-xs font-semibold">✗ ({t(lang, 'predictions.actual')}: 2º {actual.position_2})</span>
                              )
                            )}
                          </>
                        )}
                        {/* Position badge */}
                        {selection.first === team && (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-[#ca8a04] text-black w-8 text-center">1º</span>
                        )}
                        {selection.second === team && (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-[#6b7280] text-black w-8 text-center">2º</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              {!isLocked && (
                <button
                  onClick={() => saveGroup(groupName)}
                  disabled={selection.saving || selection.saved || (!selection.first && !selection.second)}
                  className={`w-full font-medium py-2 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-75 ${
                    selection.saved
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {selection.saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {selection.saved && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  {selection.saved ? t(lang, 'predictions.saved') : selection.saving ? t(lang, 'predictions.saving') : (lang === 'pt' ? `Salvar Grupo ${groupName}` : `Save Group ${groupName}`)}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Third Place Qualifiers Section (only visible if we are showing all groups) */}
      {!groupName && (
        <div 
          className={`bg-slate-800/40 border border-slate-700 rounded-xl p-5 shadow-lg mt-8 ${shakingGroup === 'third_place' ? 'shake' : ''}`}
        >
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-700 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                🏆 {t(lang, 'predictions.thirdQualifiers')}
              </h2>
              {actualThirdPlacesAdvanced.length > 0 && (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-md font-bold">
                  +{calculateThirdPlaceQualifierPoints(thirdPlaceSelections, actualThirdPlacesAdvanced)} {t(lang, 'predictions.points')}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                thirdPlaceSelections.length === 8 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-slate-700 text-slate-300'
              }`}>
                {thirdPlaceSelections.length} {t(lang, 'predictions.of8Selected')}
              </span>
            </div>
          </div>
 
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            {t(lang, 'predictions.thirdQualifiersDescription')}
          </p>

          {showThirdWarning && (
            <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>
                {t(lang, 'predictions.limitWarning')}
              </span>
            </div>
          )}

          {/* Groups list */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(teamsByGroup).sort().map(gName => {
              const groupTeams = teamsByGroup[gName] || [];

              return (
                <div key={gName} className="bg-slate-900/40 border border-slate-800 rounded-lg p-4">
                  <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                    {t(lang, 'predictions.group')} {gName} {isLocked && '🔒'}
                  </h4>
                  <div className="space-y-1.5">
                    {groupTeams.map(team => {
                      const isSelected = thirdPlaceSelections.includes(team);
                      const is1or2 = selections[gName]?.first === team || selections[gName]?.second === team;
                      
                      const isCorrect = actualThirdPlacesAdvanced.includes(team);
                      const showResultStatus = actualThirdPlacesAdvanced.length > 0;

                      return (
                        <button
                          key={team}
                          onClick={() => handleThirdPlaceClick(team)}
                          disabled={isLocked}
                          className={`
                            w-full flex items-center justify-between px-3 py-2
                            rounded-md border text-left transition-all min-h-[48px]
                            ${isSelected 
                              ? 'border-emerald-500 bg-emerald-500/10' 
                              : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}
                            ${is1or2 ? 'opacity-55 border-dashed' : ''}
                          `}
                        >
                          <div className="flex items-center gap-2">
                            <FlagIcon country={team} size="sm" />
                            <span className={`text-xs font-medium text-slate-200 ${is1or2 ? 'italic' : ''}`}>
                              {team} {is1or2 && <span className="text-[10px] text-slate-500 font-normal">(1º/2º)</span>}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {showResultStatus && isSelected && (
                               isCorrect ? (
                                 <span className="text-emerald-400 text-[10px] font-bold mr-1">✓ +15 {t(lang, 'predictions.points')}</span>
                               ) : (
                                 <span className="text-red-400 text-[10px] font-bold mr-1">✗ 0 {t(lang, 'predictions.points')}</span>
                               )
                             )}
                            {isSelected && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white flex items-center justify-center">
                                ✓
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action button */}
          <div className="mt-8 pt-4 border-t border-slate-700 flex justify-end">
            <button
              onClick={saveThirdPlaceSelections}
              disabled={isLocked || thirdSaveStatus === 'saving' || thirdSaveStatus === 'saved' || thirdPlaceSelections.length === 0}
              className={`px-6 py-2.5 font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70 ${
                thirdSaveStatus === 'saved'
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {thirdSaveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
              {thirdSaveStatus === 'saved' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
              {thirdSaveStatus === 'saved' 
                ? (lang === 'pt' ? 'Terceiros Salvos' : 'Third Places Saved')
                : thirdSaveStatus === 'saving' 
                ? t(lang, 'predictions.saving')
                : (lang === 'pt' ? 'Salvar Terceiros Classificados' : 'Save Third Place Qualifiers')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';
import { recalculateScores } from '../engine/recalculate';
import { calculatePoints, calculateGroupPositionPoints, calculateThirdPlaceQualifierPoints, calculateSpecialPoints, normalizeSpecialPrediction, parseApprovedSpecialKeys } from '../engine/scoring';

import { CheckCircle, AlertCircle, Calendar, Users, Trophy, Plus, Check, Edit2, X, Download, Loader2, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { formatMatchTime } from '../utils/dateUtils';
import { FlagIcon } from '../components/FlagIcon';
import { useLang } from '../contexts/LanguageContext';
import { t } from '../i18n';
import { COLLAPSIBLE_PHASES } from '../utils/constants';

type Match = Database['public']['Tables']['matches']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

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


type SpecialCategory = 'champion' | 'vice_champion' | 'third_place' | 'top_scorer' | 'best_player';
const SPECIAL_CATEGORIES: { id: SpecialCategory; labelPt: string; labelEn: string; pts: number }[] = [
  { id: 'champion', labelPt: 'Campeão', labelEn: 'Champion', pts: 25 },
  { id: 'vice_champion', labelPt: 'Vice-campeão', labelEn: 'Runner-up', pts: 10 },
  { id: 'third_place', labelPt: '3º Lugar', labelEn: '3rd Place', pts: 10 },
  { id: 'top_scorer', labelPt: 'Artilheiro', labelEn: 'Top Scorer', pts: 15 },
  { id: 'best_player', labelPt: 'Melhor Jogador', labelEn: 'Best Player', pts: 15 },
];

export function Admin() {
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState<'resultados' | 'partidas' | 'jogadores' | 'grupos' | 'especiais'>('resultados');
  const [activeSpecialCategory, setActiveSpecialCategory] = useState<SpecialCategory>('champion');
  const [specialPredictionsData, setSpecialPredictionsData] = useState<any[]>([]);
  const [approvedSpecialKeys, setApprovedSpecialKeys] = useState<Record<SpecialCategory, Set<string>>>({
    champion: new Set(),
    vice_champion: new Set(),
    third_place: new Set(),
    top_scorer: new Set(),
    best_player: new Set()
  });
  const [expandedSpecialGroups, setExpandedSpecialGroups] = useState<Record<string, boolean>>({});
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  const [savingSpecial, setSavingSpecial] = useState(false);

  const [matches, setMatches] = useState<Match[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'group' | 'date'>(() => {
    const stored = localStorage.getItem('admin_match_view_mode');
    return (stored === 'group' || stored === 'date') ? stored : 'date';
  });

  const handleViewModeChange = (mode: 'group' | 'date') => {
    setViewMode(mode);
    localStorage.setItem('admin_match_view_mode', mode);
  };

  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);
  
  // Tab 1 state
  const [editingScores, setEditingScores] = useState<Record<number, { a: string, b: string, tiebreaker?: 'A' | 'B' | '', advance_method?: 'Prorrogação' | 'Pênaltis' | '' }>>({});
  const [savingResult, setSavingResult] = useState<number | null>(null);
  const [sectionsExpanded, setSectionsExpanded] = useState<Record<string, boolean>>({});
  const [hasInitializedExpanded, setHasInitializedExpanded] = useState(false);

  useEffect(() => {
    if (matches.length > 0 && !hasInitializedExpanded) {
      const initial: Record<string, boolean> = {};
      COLLAPSIBLE_PHASES.forEach(phase => {
        const phaseMatches = matches.filter(m => m.phase === phase);
        const scoredCount = phaseMatches.filter(m => m.actual_score_a !== null && m.actual_score_b !== null).length;
        const totalCount = phaseMatches.length;
        const allScored = totalCount > 0 && scoredCount === totalCount;
        initial[phase] = !allScored;
      });
      setSectionsExpanded(initial);
      setHasInitializedExpanded(true);
    }
  }, [matches, hasInitializedExpanded]);

  const [expandedMatches, setExpandedMatches] = useState<Record<number, boolean>>({});

  const toggleExpand = (matchId: number) => {
    setExpandedMatches(prev => ({
      ...prev,
      [matchId]: !prev[matchId]
    }));
  };

  // Tab 2 state
  const [showNewMatchModal, setShowNewMatchModal] = useState(false);
  const [newMatch, setNewMatch] = useState({
    phase: 'round_of_32', team_a: '', team_b: '', match_date: '', deadline: ''
  });
  const [savingMatch, setSavingMatch] = useState(false);
  const [lockingMatchId, setLockingMatchId] = useState<number | null>(null);

  // Tab 3 state
  const [togglingAdmin, setTogglingAdmin] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportingPredictions, setExportingPredictions] = useState(false);

  // Tab 4 (Grupos) state
  const [officialStandings, setOfficialStandings] = useState<Record<string, { first: string, second: string }>>({});
  const [savingGroup, setSavingGroup] = useState<Record<string, boolean>>({});
  const [officialThirdPlaces, setOfficialThirdPlaces] = useState<Record<string, string>>({});
  const [savingThirdPlaces, setSavingThirdPlaces] = useState(false);

  // Recalculation preview & dry-run state
  const [recalculating, setRecalculating] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<Array<{
    playerId: string,
    name: string,
    oldTotal: number,
    newTotal: number,
    oldMatch: number,
    newMatch: number,
    oldGroup: number,
    newGroup: number
  }>>([]);
  const [isCommitting, setIsCommitting] = useState(false);

  const teamsByGroup = React.useMemo(() => {
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

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const runPreview = async () => {
    try {
      setRecalculating(true);
      
      const fetchAllPredictions = async () => {
        let allData: any[] = [];
        let from = 0;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('predictions')
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

      const fetchAllPlayerScores = async () => {
        let allData: any[] = [];
        let from = 0;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('player_scores')
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
            .select('id, name')
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
        allMatchesRes,
        allPredictions,
        allPlayerScores,
        allProfiles,
        officialGroupPredsRes,
        allGroupPredictionsRes,
        officialSpecialPredRes,
        allSpecialPredictionsRes
      ] = await Promise.all([
        supabase.from('matches').select('*').not('actual_score_a', 'is', null),
        fetchAllPredictions(),
        fetchAllPlayerScores(),
        fetchAllProfiles(),
        supabase.from('group_predictions').select('*').eq('player_id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('group_predictions').select('*').neq('player_id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('special_predictions').select('*').eq('player_id', '00000000-0000-0000-0000-000000000000').maybeSingle(),
        supabase.from('special_predictions').select('*').neq('player_id', '00000000-0000-0000-0000-000000000000')
      ]);

      const allMatches = allMatchesRes.data;
      if (!allMatches || !allPredictions || !allProfiles) {
        showToast('Error fetching data for preview.', 'error');
        return;
      }

      const matchMap = new Map(allMatches.map(m => [m.id, m]));
      const scoresByPlayer = new Map<string, number>();

      allPredictions.forEach(pred => {
        const match = matchMap.get(pred.match_id);
        if (match) {
          const points = calculatePoints(match, pred);
          scoresByPlayer.set(pred.player_id, (scoresByPlayer.get(pred.player_id) || 0) + points);
        }
      });

      const officialGroups = new Map<string, any>();
      const officialStandingsRecord: Record<string, any> = {};

      if (officialGroupPredsRes.data) {
        officialGroupPredsRes.data.forEach(g => {
          if (g.position_1 && g.position_2) {
            officialGroups.set(g.group_name, g);
          }
          officialStandingsRecord[g.group_name] = {
            position_1: g.position_1 || '',
            position_2: g.position_2 || '',
            position_3: g.position_3 || '',
            position_4: g.position_4 || ''
          };
        });
      }

      const confirmedThirdPlaceQualifiers = new Set<string>(
        Object.values(officialStandingsRecord)
          .map(g => g.position_3)
          .filter((t): t is string => t !== '' && t != null)
      );

      const groupPredsMap = new Map<string, Map<string, any>>();
      if (allGroupPredictionsRes.data) {
        allGroupPredictionsRes.data.forEach(gp => {
          if (!groupPredsMap.has(gp.player_id)) {
            groupPredsMap.set(gp.player_id, new Map());
          }
          groupPredsMap.get(gp.player_id)!.set(gp.group_name, gp);
        });
      }

      const officialSpecial = officialSpecialPredRes.data || {
        champion: '',
        vice_champion: '',
        third_place: '',
        top_scorer: '',
        best_player: ''
      };

      const specialPredsMap = new Map<string, any>();
      if (allSpecialPredictionsRes.data) {
        allSpecialPredictionsRes.data.forEach(sp => {
          specialPredsMap.set(sp.player_id, sp);
        });
      }

      const existingScoresMap = new Map(allPlayerScores?.map(s => [s.player_id, s]) || []);

      const list = allProfiles.map(profile => {
        const pId = profile.id;
        const newMatchPoints = scoresByPlayer.get(pId) || 0;
        
        let groupPoints = 0;
        const playerGroupPreds = groupPredsMap.get(pId);
        
        officialGroups.forEach((official, groupName) => {
          const pred = playerGroupPreds?.get(groupName);
          if (pred) {
            const firstPick = pred.position_1 || null;
            const secondPick = pred.position_2 || null;

            const getPointsForPick = (pick: string | null, targetPosition: '1' | '2') => {
              if (!pick) return 0;
              const predPos = targetPosition;
              const actPos = official.position_1 === pick ? '1' : official.position_2 === pick ? '2' : official.position_3 === pick ? '3' : '4';
              const predQualify = true;
              const didQualify = actPos === '1' || actPos === '2';
              return calculateGroupPositionPoints(predPos, actPos, predQualify, didQualify);
            };

            const p1Points = getPointsForPick(firstPick, '1');
            const p2Points = getPointsForPick(secondPick, '2');
            groupPoints += p1Points + p2Points;
          }
        });

        const playerThirdPlaces: string[] = [];
        const playerThirdPlacesSet = new Set<string>();
        if (playerGroupPreds) {
          playerGroupPreds.forEach(gp => {
            if (gp.position_3 && typeof gp.position_3 === 'string' && gp.position_3.trim() !== '') {
              playerThirdPlaces.push(gp.position_3);
              playerThirdPlacesSet.add(gp.position_3);
            }
          });
        }

        const thirdPlacePoints = calculateThirdPlaceQualifierPoints(playerThirdPlaces, officialStandingsRecord);

        let crossSlotPoints = 0;
        if (playerGroupPreds) {
          playerGroupPreds.forEach((gp, groupName) => {
            const official = officialStandingsRecord[groupName];
            if (!official) return;

            const p1 = gp.position_1;
            const p2 = gp.position_2;

            if (p1 && confirmedThirdPlaceQualifiers.has(p1) && !playerThirdPlacesSet.has(p1)) {
              crossSlotPoints += 10;
            }
            if (p2 && confirmedThirdPlaceQualifiers.has(p2) && !playerThirdPlacesSet.has(p2)) {
              crossSlotPoints += 10;
            }
          });
        }

        const newGroupPoints = groupPoints + thirdPlacePoints + crossSlotPoints;

        const playerSpecialPred = specialPredsMap.get(pId) || {
          champion: '',
          vice_champion: '',
          third_place: '',
          top_scorer: '',
          best_player: ''
        };
        const newSpecialPoints = calculateSpecialPoints(playerSpecialPred, officialSpecial);

        const existing = existingScoresMap.get(pId) || { total_points: 0, match_points: 0, group_points: 0, special_points: 0 };
        
        return {
          playerId: pId,
          name: profile.name,
          oldTotal: existing.total_points || 0,
          newTotal: newMatchPoints + newGroupPoints + newSpecialPoints,
          oldMatch: existing.match_points || 0,
          newMatch: newMatchPoints,
          oldGroup: existing.group_points || 0,
          newGroup: newGroupPoints
        };
      });

      // Filter out profiles with no predictions or scores to keep preview clean if necessary,
      // but let's keep all active profiles who have any changes or are participating
      setPreviewData(list.sort((a, b) => b.newTotal - a.newTotal));
      setShowPreviewModal(true);
    } catch (err) {
      console.error(err);
      showToast('Error generating recalculation preview.', 'error');
    } finally {
      setRecalculating(false);
    }
  };

  const commitRecalculation = async () => {
    try {
      setIsCommitting(true);
      await recalculateScores();
      showToast(lang === 'pt' ? 'Pontuações recalculadas e salvas com sucesso!' : 'Scores recalculated and saved successfully!', 'success');
      setShowPreviewModal(false);
    } catch (e) {
      console.error(e);
      showToast(lang === 'pt' ? 'Erro ao salvar pontuações.' : 'Error saving scores.', 'error');
    } finally {
      setIsCommitting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [
        { data: matchesData },
        { data: profilesData },
        { data: officialGroupsData },
        { data: officialSpecialData },
        { data: specialPredsData }
      ] = await Promise.all([
        supabase.from('matches').select('*').order('match_date', { ascending: true }),
        supabase.from('profiles').select('*').order('name', { ascending: true }).limit(10000),
        supabase.from('group_predictions').select('*').eq('player_id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('special_predictions').select('*').eq('player_id', '00000000-0000-0000-0000-000000000000').maybeSingle(),
        supabase.from('special_predictions').select('*').limit(10000)
      ]);

      if (matchesData) setMatches(matchesData);
      if (profilesData) setProfiles(profilesData);
      if (specialPredsData) setSpecialPredictionsData(specialPredsData);

      if (officialSpecialData) {
        setApprovedSpecialKeys({
          champion: parseApprovedSpecialKeys(officialSpecialData.champion),
          vice_champion: parseApprovedSpecialKeys(officialSpecialData.vice_champion),
          third_place: parseApprovedSpecialKeys(officialSpecialData.third_place),
          top_scorer: parseApprovedSpecialKeys(officialSpecialData.top_scorer),
          best_player: parseApprovedSpecialKeys(officialSpecialData.best_player),
        });
      }

      const standingsMap: Record<string, { first: string, second: string }> = {};
      const thirdPlacesMap: Record<string, string> = {};
      const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
      GROUP_NAMES.forEach(g => {
        standingsMap[g] = { first: '', second: '' };
        thirdPlacesMap[g] = '';
      });

      if (officialGroupsData) {
        officialGroupsData.forEach(p => {
          standingsMap[p.group_name] = {
            first: p.position_1 || '',
            second: p.position_2 || ''
          };
          if (p.position_3) {
            thirdPlacesMap[p.group_name] = p.position_3;
          }
        });
      }
      setOfficialStandings(standingsMap);
      setOfficialThirdPlaces(thirdPlacesMap);

      setLoading(false);
    };

    fetchData();
  }, []);

  // RESULTADOS (TAB 1)
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
      }

      if (scores.advance_method === 'Prorrogação' || scores.advance_method === 'Pênaltis') {
        actual_advance_method = scores.advance_method;
      }
    }

    const { error } = await supabase.from('matches')
      .update({ actual_score_a, actual_score_b, actual_tiebreaker_winner, actual_advance_method })
      .eq('id', matchId);

    if (error) {
      showToast(lang === 'pt' ? 'Erro ao salvar resultado' : 'Error saving result', 'error');
    } else {
      await recalculateScores(matchId);
      showToast(lang === 'pt' ? 'Resultado salvo e pontos recalculados!' : 'Result saved and points recalculated!', 'success');
      
      // Remove edit state so it displays normally
      setEditingScores(prev => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
      // Collapse the card automatically
      setExpandedMatches(prev => ({ ...prev, [matchId]: false }));
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
      setNewMatch(prev => ({ ...prev, match_date: dateStr, deadline: dateStr }));
    } else {
      setNewMatch(prev => ({ ...prev, match_date: '', deadline: '' }));
    }
  };

  const createNewMatch = async () => {
    if (!newMatch.team_a || !newMatch.team_b || !newMatch.match_date || !newMatch.deadline) {
      showToast(lang === 'pt' ? 'Preencha todos os campos' : 'Fill in all fields', 'error');
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
      showToast(lang === 'pt' ? 'Erro ao criar partida' : 'Error creating match', 'error');
    } else {
      showToast(lang === 'pt' ? 'Partida criada com sucesso!' : 'Match created successfully!', 'success');
      setShowNewMatchModal(false);
      setNewMatch({ phase: 'round_of_32', team_a: '', team_b: '', match_date: '', deadline: '' });
      const { data } = await supabase.from('matches').select('*').order('match_date', { ascending: true });
      if (data) setMatches(data);
    }
    setSavingMatch(false);
  };

  const lockMatchNow = async (matchId: number) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    if (match.phase === 'group') {
      showToast(
        lang === 'pt' ? 'Partidas da fase de grupos não podem ser bloqueadas manualmente' : 'Group stage matches cannot be locked manually',
        'error'
      );
      return;
    }

    const confirmMsg = lang === 'pt'
      ? 'Bloquear esta partida agora? Os jogadores não poderão mais editar seus palpites.'
      : 'Lock this match now? Players will no longer be able to edit their predictions.';

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setLockingMatchId(matchId);
    const nowIso = new Date().toISOString();

    try {
      const { error } = await supabase
        .from('matches')
        .update({ deadline: nowIso })
        .eq('id', matchId);

      if (error) {
        console.error(error);
        showToast(
          lang === 'pt' ? `Erro ao bloquear partida: ${error.message}` : `Error locking match: ${error.message}`,
          'error'
        );
      } else {
        setMatches(prev =>
          prev.map(m =>
            m.id === matchId ? { ...m, deadline: nowIso } : m
          )
        );
        showToast(
          lang === 'pt' ? 'Partida bloqueada com sucesso!' : 'Match locked successfully!',
          'success'
        );
      }
    } catch (err: any) {
      console.error(err);
      showToast(
        lang === 'pt' ? `Erro inesperado: ${err.message || err}` : `Unexpected error: ${err.message || err}`,
        'error'
      );
    } finally {
      setLockingMatchId(null);
    }
  };

  // JOGADORES (TAB 3)
  const toggleAdmin = async (profileId: string, currentStatus: boolean) => {
    setTogglingAdmin(profileId);
    const { error } = await supabase.from('profiles')
      .update({ is_admin: !currentStatus })
      .eq('id', profileId);
    
    if (error) {
      showToast(lang === 'pt' ? 'Erro ao alterar status de admin' : 'Error changing admin status', 'error');
    } else {
      showToast(lang === 'pt' ? 'Status atualizado!' : 'Status updated!', 'success');
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
        .order('total_points', { ascending: false })
        .limit(10000);

      if (error) throw error;
      if (!data) throw new Error("No data");

      const typedData = data as unknown as { total_points: number, profiles: { name: string } | null }[];

      let text = lang === 'pt' ? "🏆 Bolão da Copa 2026 - Classificação Parcial\n\n" : "🏆 World Cup Pool 2026 - Partial Leaderboard\n\n";
      typedData.forEach((row, index: number) => {
        text += `${index + 1}º ${row.profiles?.name || (lang === 'pt' ? 'Desconhecido' : 'Unknown')} - ${row.total_points} ${t(lang, 'predictions.points')}\n`;
      });

      await navigator.clipboard.writeText(text);
      showToast(lang === 'pt' ? "Classificação copiada para a área de transferência!" : "Leaderboard copied to clipboard!", "success");
    } catch (e) {
      showToast(lang === 'pt' ? "Erro ao exportar classificação." : "Error exporting leaderboard.", "error");
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const exportPredictions = async () => {
    setExportingPredictions(true);
    try {
      const fetchAllPredictions = async () => {
        let allData: any[] = [];
        let from = 0;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('predictions')
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

      const fetchAllGroupPredictions = async () => {
        let allData: any[] = [];
        let from = 0;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('group_predictions')
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

      const fetchAllMatches = async () => {
        let allData: any[] = [];
        let from = 0;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('matches')
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
        predsData,
        groupPredsData,
        specialPredsData,
        profilesData,
        matchesData
      ] = await Promise.all([
        fetchAllPredictions(),
        fetchAllGroupPredictions(),
        fetchAllSpecialPredictions(),
        fetchAllProfiles(),
        fetchAllMatches()
      ]);

      // Determine active players (exclude admin UUID '00000000-0000-0000-0000-000000000000')
      const activePlayerIds = new Set<string>();
      predsData.forEach(p => {
        if (p.player_id) activePlayerIds.add(p.player_id);
      });
      groupPredsData.forEach(g => {
        if (g.player_id) activePlayerIds.add(g.player_id);
      });
      specialPredsData.forEach(s => {
        if (s.player_id) activePlayerIds.add(s.player_id);
      });
      activePlayerIds.delete('00000000-0000-0000-0000-000000000000');

      // Create maps for lookup
      const profileMap = new Map<string, string>();
      profilesData.forEach(p => {
        profileMap.set(p.id, p.name || 'Unknown Player');
      });

      const activePlayers = Array.from(activePlayerIds).map(id => ({
        id,
        name: profileMap.get(id) || 'Unknown Player'
      }));

      // Sort players alphabetically by name (A-Z)
      activePlayers.sort((a, b) => a.name.localeCompare(b.name, lang));

      // Sort matches by date ASC
      const sortedMatches = [...matchesData].sort(
        (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
      );

      // Map predictions
      const matchPredictionsMap = new Map<string, any>();
      predsData.forEach(p => {
        matchPredictionsMap.set(`${p.player_id}_${p.match_id}`, p);
      });

      const groupPredictionsMap = new Map<string, any>();
      groupPredsData.forEach(g => {
        groupPredictionsMap.set(`${g.player_id}_${g.group_name}`, g);
      });

      const specialPredictionsMap = new Map<string, any>();
      specialPredsData.forEach(s => {
        specialPredictionsMap.set(s.player_id, s);
      });

      // Escape helper
      const escapeCSV = (val: any): string => {
        if (val === null || val === undefined) return '';
        const str = String(val).trim();
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvParts: string[] = [];

      // SECTION 1: Match Predictions
      csvParts.push("=== MATCH PREDICTIONS ===");
      csvParts.push("Player, Group, Match, Home Team, Away Team, Predicted Home, Predicted Away");
      activePlayers.forEach(player => {
        sortedMatches.forEach(match => {
          const pred = matchPredictionsMap.get(`${player.id}_${match.id}`);
          const row = [
            escapeCSV(player.name),
            escapeCSV(match.group_name),
            escapeCSV(match.id),
            escapeCSV(match.team_a),
            escapeCSV(match.team_b),
            pred ? escapeCSV(pred.predicted_score_a) : '',
            pred ? escapeCSV(pred.predicted_score_b) : ''
          ];
          csvParts.push(row.join(', '));
        });
      });

      // Separator
      csvParts.push("");

      // SECTION 2: Group Predictions
      csvParts.push("=== GROUP PREDICTIONS ===");
      csvParts.push("Player, Group, Predicted Winner");
      const GROUP_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
      activePlayers.forEach(player => {
        GROUP_NAMES.forEach(gName => {
          const gPred = groupPredictionsMap.get(`${player.id}_${gName}`);
          const row = [
            escapeCSV(player.name),
            escapeCSV(gName),
            gPred ? escapeCSV(gPred.position_1) : ''
          ];
          csvParts.push(row.join(', '));
        });
      });

      // Separator
      csvParts.push("");

      // SECTION 3: Special Predictions
      csvParts.push("=== SPECIAL PREDICTIONS ===");
      csvParts.push("Player, Champion, Runner-up, 3rd Place, Top Scorer, Best Player");
      activePlayers.forEach(player => {
        const sPred = specialPredictionsMap.get(player.id);
        const row = [
          escapeCSV(player.name),
          sPred ? escapeCSV(sPred.champion) : '',
          sPred ? escapeCSV(sPred.vice_champion) : '',
          sPred ? escapeCSV(sPred.third_place) : '',
          sPred ? escapeCSV(sPred.top_scorer) : '',
          sPred ? escapeCSV(sPred.best_player) : ''
        ];
        csvParts.push(row.join(', '));
      });

      const csvContent = csvParts.join('\n');

      // Trigger download
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const filename = `predictions-export-${year}-${month}-${day}.csv`;

      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(
        lang === 'pt' ? 'Palpites exportados com sucesso!' : 'Predictions exported successfully!',
        'success'
      );
    } catch (e) {
      showToast(
        lang === 'pt' ? 'Erro ao exportar palpites.' : 'Error exporting predictions.',
        'error'
      );
      console.error(e);
    } finally {
      setExportingPredictions(false);
    }
  };

  const saveGroupStanding = async (groupName: string) => {
    const standing = officialStandings[groupName];
    if (!standing) return;
    
    if (standing.first && standing.second && standing.first === standing.second) {
      showToast(
        lang === 'pt' ? 'O primeiro e segundo colocado devem ser times diferentes!' : '1st and 2nd place must be different teams!',
        'error'
      );
      return;
    }
    
    setSavingGroup(prev => ({ ...prev, [groupName]: true }));
    try {
      // Fetch the existing official row for this group to preserve position_3 and position_4
      const { data: existing, error: fetchError } = await supabase
        .from('group_predictions')
        .select('*')
        .eq('player_id', '00000000-0000-0000-0000-000000000000')
        .eq('group_name', groupName)
        .maybeSingle();

      if (fetchError) {
        console.error('Supabase fetch official standing error:', fetchError);
        throw fetchError;
      }

      const payload = {
        player_id: '00000000-0000-0000-0000-000000000000',
        group_name: groupName,
        position_1: standing.first || '',
        position_2: standing.second || '',
        position_3: existing?.position_3 || '',
        position_4: existing?.position_4 || ''
      };

      const { error: upsertError } = await supabase
        .from('group_predictions')
        .upsert(payload, { onConflict: 'player_id,group_name' });

      if (upsertError) {
        console.error('Supabase upsert official standing error:', upsertError);
        throw upsertError;
      }

      // Automatically trigger a full recalculation of points for all players
      // Ensure the save fully resolves before calling recalculateScores()
      await recalculateScores();

      showToast(
        lang === 'pt' ? `Classificação do Grupo ${groupName} salva e pontos recalculados!` : `Group ${groupName} standings saved and points recalculated!`,
        'success'
      );
    } catch (e) {
      console.error('Error saving group standing:', e);
      showToast(
        lang === 'pt' ? 'Erro ao salvar classificação do grupo.' : 'Error saving group standings.',
        'error'
      );
    } finally {
      setSavingGroup(prev => ({ ...prev, [groupName]: false }));
    }
  };

  const saveOfficialThirdPlaces = async () => {
    const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const selectedCount = Object.values(officialThirdPlaces).filter(t => t).length;
    if (selectedCount !== 8) {
      showToast(
        lang === 'pt' ? 'Você deve selecionar exatamente 8 terceiros colocados!' : 'You must select exactly 8 third-place qualifiers!',
        'error'
      );
      return;
    }

    setSavingThirdPlaces(true);
    try {
      // Fetch the existing official rows to make sure we have position_1 and position_2
      const { data: existingRows, error: fetchError } = await supabase
        .from('group_predictions')
        .select('*')
        .eq('player_id', '00000000-0000-0000-0000-000000000000');

      if (fetchError) throw fetchError;

      const existingMap = new Map(existingRows?.map(r => [r.group_name, r]) || []);

      const upserts = GROUP_NAMES.map(groupName => {
        const existing = existingMap.get(groupName);
        const position1 = existing?.position_1 || '';
        const position2 = existing?.position_2 || '';
        const position3 = officialThirdPlaces[groupName] || '';
        
        // Find position 4 (the remaining team)
        const groupTeams = teamsByGroup[groupName] || [];
        const usedTeams = [position1, position2, position3].filter(t => t);
        const remainingTeams = groupTeams.filter(t => !usedTeams.includes(t));
        const position4 = remainingTeams[0] || '';

        return {
          ...(existing?.id ? { id: existing.id } : {}),
          player_id: '00000000-0000-0000-0000-000000000000',
          group_name: groupName,
          position_1: position1,
          position_2: position2,
          position_3: position3,
          position_4: position3 ? position4 : '' // if no position_3, don't set position_4 officially
        };
      });

      const { error: upsertError } = await supabase
        .from('group_predictions')
        .upsert(upserts, { onConflict: 'player_id,group_name' });

      if (upsertError) throw upsertError;

      await recalculateScores();

      showToast(
        lang === 'pt' ? 'Terceiros colocados oficiais salvos e pontos recalculados!' : 'Official third-place qualifiers saved and points recalculated!',
        'success'
      );
    } catch (e) {
      console.error('Error saving official third-place qualifiers:', e);
      showToast(
        lang === 'pt' ? 'Erro ao salvar terceiros colocados oficiais.' : 'Error saving official third-place qualifiers.',
        'error'
      );
    } finally {
      setSavingThirdPlaces(false);
    }
  };

  const renderGrupos = () => {
    const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const selectedThirdCount = Object.values(officialThirdPlaces).filter(t => t).length;

    return (
      <div className="space-y-6">
        <div className="border-b border-slate-800 pb-2">
          <h2 className="text-xl font-bold text-emerald-400">
            {lang === 'pt' ? 'Classificação Oficial dos Grupos' : 'Official Group Standings'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'pt'
              ? 'Defina o 1º e 2º colocados de cada grupo. O salvamento recalcula automaticamente os pontos dos jogadores para a fase de grupos (posições 1 e 2).'
              : 'Set the 1st and 2nd place finishers for each group. Saving automatically recalculates player points for the group stage (positions 1 and 2).'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GROUP_NAMES.map(groupName => {
            const groupTeams = teamsByGroup[groupName] || [];
            const standing = officialStandings[groupName] || { first: '', second: '' };
            const isSaving = !!savingGroup[groupName];

            return (
              <div
                key={groupName}
                className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-lg font-bold text-emerald-400 mb-4">
                    {lang === 'pt' ? 'GRUPO' : 'GROUP'} {groupName}
                  </h3>

                  <div className="space-y-4">
                    {/* 1st Place */}
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
                        1º {lang === 'pt' ? 'Lugar' : 'Place'}
                      </label>
                      <select
                        value={standing.first}
                        onChange={e =>
                          setOfficialStandings(prev => ({
                            ...prev,
                            [groupName]: { ...prev[groupName], first: e.target.value }
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      >
                        <option value="">-- {lang === 'pt' ? 'Selecione' : 'Select'} --</option>
                        {groupTeams.map(team => (
                          <option key={team} value={team}>
                            {team}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2nd Place */}
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
                        2º {lang === 'pt' ? 'Lugar' : 'Place'}
                      </label>
                      <select
                        value={standing.second}
                        onChange={e =>
                          setOfficialStandings(prev => ({
                            ...prev,
                            [groupName]: { ...prev[groupName], second: e.target.value }
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      >
                        <option value="">-- {lang === 'pt' ? 'Selecione' : 'Select'} --</option>
                        {groupTeams.map(team => (
                          <option key={team} value={team}>
                            {team}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-700 flex justify-end">
                  <button
                    onClick={() => saveGroupStanding(groupName)}
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t(lang, 'admin.saving')}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{t(lang, 'admin.save')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Official 3rd Place Qualifiers Section */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 shadow-lg mt-8">
          <div className="border-b border-slate-700 pb-3 mb-4">
            <h3 className="text-lg font-bold text-emerald-400">
              🏆 {lang === 'pt' ? 'Terceiros Colocados Classificados' : 'Official 3rd Place Qualifiers'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'pt'
                ? 'Selecione as 8 seleções que se classificaram em 3º lugar e avançaram para a próxima fase.'
                : 'Select the 8 teams that advanced to the Round of 32 from 3rd place.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GROUP_NAMES.map(groupName => {
              const groupTeams = teamsByGroup[groupName] || [];
              const standing = officialStandings[groupName] || { first: '', second: '' };
              const selectedThird = officialThirdPlaces[groupName] || '';
              
              // Enable dropdown only if first and second place are set
              const isGroupDefined = standing.first && standing.second;
              
              // Remaining teams that can be the 3rd place qualifier (i.e. not 1st or 2nd place)
              const remainingTeams = groupTeams.filter(t => t !== standing.first && t !== standing.second);

              return (
                <div key={groupName} className="bg-slate-900/40 border border-slate-800/60 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      {lang === 'pt' ? 'GRUPO' : 'GROUP'} {groupName}
                    </h4>
                    {/* Optional currently-saved indicator */}
                    {selectedThird && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/30 border border-emerald-900/30 px-1.5 py-0.5 rounded">
                        {lang === 'pt' ? 'Salvo: ' : 'Saved: '} {selectedThird}
                      </span>
                    )}
                  </div>
                  {isGroupDefined ? (
                    <select
                      value={selectedThird}
                      onChange={e => {
                        setOfficialThirdPlaces(prev => ({
                          ...prev,
                          [groupName]: e.target.value
                        }));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                    >
                      <option value="">-- {lang === 'pt' ? 'Não se classificou' : 'Did not qualify'} --</option>
                      {remainingTeams.map(team => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs text-slate-500 italic py-2 bg-slate-950/20 px-3 rounded-md border border-dashed border-slate-850">
                      {lang === 'pt' ? 'Defina o 1º e 2º colocado primeiro' : 'Define 1st and 2nd place first'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-700 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="text-sm font-semibold">
              <span className={selectedThirdCount === 8 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                {lang === 'pt' ? 'Selecionados: ' : 'Selected: '}
                {selectedThirdCount} / 8
              </span>
            </div>
            <button
              onClick={saveOfficialThirdPlaces}
              disabled={selectedThirdCount !== 8 || savingThirdPlaces}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingThirdPlaces ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'pt' ? 'Salvando...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{lang === 'pt' ? 'Salvar Terceiros Colocados' : 'Save 3rd Place Qualifiers'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
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
          .map(([phase, phaseMatches]) => {
            const isCollapsible = COLLAPSIBLE_PHASES.includes(phase);
            const scoredCount = phaseMatches.filter(m => m.actual_score_a !== null && m.actual_score_b !== null).length;
            const totalCount = phaseMatches.length;
            const isExpanded = isCollapsible ? (sectionsExpanded[phase] ?? true) : true;

            const ariaLabelText = lang === 'pt'
              ? `${formatPhaseName(phase, lang)}, ${scoredCount} de ${totalCount} pontuados`
              : `${formatPhaseName(phase, lang)}, ${scoredCount} of ${totalCount} scored`;

            return (
              <div key={phase} className="space-y-4">
                {isCollapsible ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => setSectionsExpanded(prev => ({ ...prev, [phase]: !isExpanded }))}
                      aria-expanded={isExpanded}
                      aria-label={ariaLabelText}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-left font-sans"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white capitalize">
                          {formatPhaseName(phase, lang)}
                        </span>
                        <span className="text-sm text-slate-400 hidden sm:inline">
                          {scoredCount}/{totalCount} {t(lang, 'predictions.scored')}
                        </span>
                        <span className="text-xs text-slate-400 sm:hidden">
                          ({scoredCount}/{totalCount})
                        </span>
                      </div>

                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                        {phase === 'group' ? (
                          <>
                            <div className="flex justify-end">
                              <div className="flex bg-slate-955 border border-slate-700/60 rounded-lg p-0.5 text-xs font-semibold text-slate-400">
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
                                  .map(m => renderMatchAdminCard(m))}
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
                                  {gMatches.map(m => renderMatchAdminCard(m))}
                                </div>
                              ))
                            )}
                          </>
                        ) : (
                          <div className="space-y-3">
                            {[...phaseMatches]
                              .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
                              .map(m => renderMatchAdminCard(m))}
                          </div>
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
                      {phaseMatches.map(m => renderMatchAdminCard(m))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    );
  };

  const renderMatchAdminCard = (match: Match) => {
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
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={lang === 'pt' ? 'Expandir detalhes da partida' : 'Expand match details'}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(match.id); } }}
          className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800 hover:border-slate-600 transition-colors select-none"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Team A */}
            <div className="flex items-center gap-2 justify-end flex-1 min-w-0">
              <span className="font-semibold text-sm text-slate-200 truncate text-right hidden sm:inline">{match.team_a}</span>
              <span className="font-semibold text-xs text-slate-200 truncate text-right sm:hidden">{match.team_a.substring(0, 3).toUpperCase()}</span>
              <FlagIcon country={match.team_a} size="sm" />
            </div>

            {/* Score */}
            <div className="flex items-center justify-center bg-slate-950/80 px-3 py-1 rounded-md text-sm font-bold text-slate-100 border border-slate-700/30 shrink-0 min-w-[70px]">
              {match.actual_score_a} - {match.actual_score_b}
            </div>

            {/* Team B */}
            <div className="flex items-center gap-2 justify-start flex-1 min-w-0">
              <FlagIcon country={match.team_b} size="sm" />
              <span className="font-semibold text-sm text-slate-200 truncate text-left hidden sm:inline">{match.team_b}</span>
              <span className="font-semibold text-xs text-slate-200 truncate text-left sm:hidden">{match.team_b.substring(0, 3).toUpperCase()}</span>
            </div>
          </div>

          {/* Chevron */}
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
              aria-expanded={isExpanded}
              aria-label="Toggle match details"
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

          <div className="flex-1 font-medium flex items-center justify-end gap-2">
            <FlagIcon country={match.team_b} size="lg" />
            <span>{match.team_b}</span>
          </div>
        </div>

        {/* Tie-breaker dropdown / display */}
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
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {savingResult === match.id ? t(lang, 'admin.saving') : t(lang, 'admin.save')}
              <Check className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                setSectionsExpanded(prev => ({ ...prev, [match.phase]: true }));
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
              className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
            >
              {lang === 'pt' ? 'Editar' : 'Edit'} <Edit2 className="w-4 h-4" />
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
            <h2 className="font-bold text-lg">{t(lang, 'admin.matches')}</h2>
            <p className="text-sm text-slate-400">{lang === 'pt' ? 'Gerencie partidas das fases eliminatórias.' : 'Manage knockout phase matches.'}</p>
          </div>
          <button
            onClick={() => setShowNewMatchModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> {t(lang, 'admin.addMatch')}
          </button>
        </div>

        <div className="space-y-3">
          {knockoutMatches.map(m => {
            const isLocked = new Date() > new Date(m.deadline);
            return (
              <div key={m.id} className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 flex justify-between items-center gap-4">
                <div>
                  <div className="text-xs text-emerald-400 font-medium mb-1 uppercase tracking-wider">{formatPhaseName(m.phase, lang)}</div>
                  <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <FlagIcon country={m.team_a} size="lg" />
                    <span>{m.team_a} vs {m.team_b}</span>
                    <FlagIcon country={m.team_b} size="lg" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-xs text-slate-400">
                    {lang === 'pt' ? 'Data' : 'Date'}: {formatMatchTime(m.match_date)}<br/>
                    Deadline: {formatMatchTime(m.deadline)}
                  </div>
                  <div className="shrink-0">
                    {isLocked ? (
                      <span className="inline-flex items-center gap-1 bg-red-950/30 text-red-400 border border-red-900/50 px-2.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider">
                        <Lock className="w-3.5 h-3.5" />
                        {lang === 'pt' ? 'Bloqueado' : 'Locked'}
                      </span>
                    ) : (
                      <button
                        onClick={() => lockMatchNow(m.id)}
                        disabled={lockingMatchId === m.id}
                        className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 hover:text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                      >
                        {lockingMatchId === m.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                        {lang === 'pt' ? 'Bloquear Agora' : 'Lock Now'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {knockoutMatches.length === 0 && (
            <div className="text-center text-slate-500 py-8">
              {lang === 'pt' ? 'Nenhuma partida de mata-mata cadastrada.' : 'No knockout matches registered.'}
            </div>
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
              {t(lang, 'admin.players')} ({profiles.length})
            </h2>
          </div>
          <button
            onClick={exportLeaderboard}
            disabled={exporting}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> {lang === 'pt' ? 'Exportar Classificação' : 'Export Leaderboard'}
          </button>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">{t(lang, 'admin.playerName')}</th>
                  <th className="px-4 py-3">{t(lang, 'admin.playerEmail')}</th>
                  <th className="px-4 py-3 text-center">{t(lang, 'admin.playerRole')}</th>
                  <th className="px-4 py-3 text-right">{lang === 'pt' ? 'Ações' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {profiles.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-slate-400">{p.email}</td>
                    <td className="px-4 py-3 text-center">
                      {p.is_admin ? (
                        <span className="inline-flex bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold">{t(lang, 'admin.admin')}</span>
                      ) : (
                        <span className="inline-flex bg-slate-500/10 text-slate-400 px-2 py-0.5 rounded text-xs font-bold">{t(lang, 'admin.user')}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleAdmin(p.id, p.is_admin)}
                        disabled={togglingAdmin === p.id}
                        className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                      >
                        {p.is_admin ? (lang === 'pt' ? 'Remover Admin' : 'Remove Admin') : (lang === 'pt' ? 'Tornar Admin' : 'Make Admin')}
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

  const renderEspeciais = () => {
    const activePlayers = profiles.filter(p => p.id !== '00000000-0000-0000-0000-000000000000');
    
    const playerSpecMap = new Map<string, any>();
    specialPredictionsData.forEach(sp => {
      if (sp.player_id !== '00000000-0000-0000-0000-000000000000') {
        playerSpecMap.set(sp.player_id, sp);
      }
    });

    const currentCatMeta = SPECIAL_CATEGORIES.find(c => c.id === activeSpecialCategory)!;

    interface GroupedPrediction {
      key: string;
      rawSample: string;
      isBlank: boolean;
      players: { id: string; name: string; email: string; raw: string }[];
    }

    const groupMap = new Map<string, GroupedPrediction>();

    activePlayers.forEach(player => {
      const specRow = playerSpecMap.get(player.id);
      const rawVal = specRow ? (specRow[activeSpecialCategory] || '').trim() : '';
      const normKey = normalizeSpecialPrediction(rawVal);
      const isBlank = normKey === '';

      if (!groupMap.has(normKey)) {
        groupMap.set(normKey, {
          key: normKey,
          rawSample: isBlank ? t(lang, 'admin.specials.noPrediction') : rawVal,
          isBlank,
          players: []
        });
      }

      const grp = groupMap.get(normKey)!;
      if (!isBlank && grp.rawSample.length < rawVal.length) {
        grp.rawSample = rawVal;
      }
      grp.players.push({
        id: player.id,
        name: player.name || player.email || 'Usuário',
        email: player.email || '',
        raw: rawVal
      });
    });

    const sortedGroups = Array.from(groupMap.values()).sort((a, b) => {
      if (a.isBlank) return 1;
      if (b.isBlank) return -1;
      return b.players.length - a.players.length;
    });

    const categoryApprovedSet = approvedSpecialKeys[activeSpecialCategory] || new Set();

    const toggleGroupApproved = (key: string) => {
      if (!key) return; // Cannot approve blank predictions
      setApprovedSpecialKeys(prev => {
        const currentSet = new Set(prev[activeSpecialCategory]);
        if (currentSet.has(key)) {
          currentSet.delete(key);
        } else {
          currentSet.add(key);
        }
        return { ...prev, [activeSpecialCategory]: currentSet };
      });
    };

    const markAllSelectedCorrect = () => {
      setApprovedSpecialKeys(prev => {
        const currentSet = new Set(prev[activeSpecialCategory]);
        sortedGroups.forEach(g => {
          if (!g.isBlank) {
            currentSet.add(g.key);
          }
        });
        return { ...prev, [activeSpecialCategory]: currentSet };
      });
    };

    const clearCategorySelections = () => {
      setApprovedSpecialKeys(prev => ({
        ...prev,
        [activeSpecialCategory]: new Set()
      }));
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-slate-800 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-emerald-400">
              {t(lang, 'admin.specials.title')}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {t(lang, 'admin.specials.subtitle')}
            </p>
          </div>

          <button
            onClick={() => setShowSpecialModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all self-start md:self-auto"
          >
            <Trophy className="w-4 h-4" />
            <span>{t(lang, 'admin.specials.saveAndRecalculate')}</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {SPECIAL_CATEGORIES.map(cat => {
            const isSelected = activeSpecialCategory === cat.id;
            const countApproved = (approvedSpecialKeys[cat.id] || new Set()).size;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveSpecialCategory(cat.id)}
                className={`p-3 rounded-xl border flex flex-col items-start justify-between transition-all ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-300 ring-1 ring-emerald-500/50'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {lang === 'pt' ? cat.labelPt : cat.labelEn}
                  </span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    +{cat.pts} pts
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {countApproved} {t(lang, 'admin.specials.groupsApproved')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Batch Controls for Current Category */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-300 font-medium flex items-center gap-2">
            <span className="text-emerald-400 font-bold">
              {lang === 'pt' ? currentCatMeta.labelPt : currentCatMeta.labelEn}
            </span>
            <span className="text-slate-500">•</span>
            <span>{categoryApprovedSet.size} {t(lang, 'admin.specials.groupsApproved')}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={markAllSelectedCorrect}
              className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              {t(lang, 'admin.specials.markSelectedCorrect')}
            </button>
            <button
              onClick={clearCategorySelections}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              {t(lang, 'admin.specials.clearSelections')}
            </button>
          </div>
        </div>

        {/* Groups List */}
        <div className="space-y-3">
          {sortedGroups.map(group => {
            const isApproved = categoryApprovedSet.has(group.key);
            const isExpanded = !!expandedSpecialGroups[`${activeSpecialCategory}_${group.key}`];

            const toggleExpandGroup = () => {
              setExpandedSpecialGroups(prev => ({
                ...prev,
                [`${activeSpecialCategory}_${group.key}`]: !prev[`${activeSpecialCategory}_${group.key}`]
              }));
            };

            return (
              <div
                key={group.key || '__blank__'}
                className={`rounded-xl border transition-all ${
                  group.isBlank
                    ? 'bg-slate-900/40 border-slate-800 text-slate-500'
                    : isApproved
                    ? 'bg-emerald-950/30 border-emerald-600/60 shadow-md shadow-emerald-950/20'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      disabled={group.isBlank}
                      checked={isApproved}
                      onChange={() => toggleGroupApproved(group.key)}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-bold text-base ${group.isBlank ? 'italic text-slate-500' : isApproved ? 'text-emerald-300' : 'text-white'}`}>
                          {group.rawSample}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-semibold">
                          {group.players.length} {t(lang, 'admin.specials.playersCount')}
                        </span>
                        {isApproved && (
                          <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {t(lang, 'predictions.correct')} (+{currentCatMeta.pts} pts)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {!group.isBlank && (
                      <button
                        onClick={() => toggleGroupApproved(group.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          isApproved
                            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {isApproved ? t(lang, 'admin.specials.markIncorrect') : t(lang, 'admin.specials.markCorrect')}
                      </button>
                    )}
                    <button
                      onClick={toggleExpandGroup}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expandable Player List */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-700/40 bg-slate-900/40 rounded-b-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {group.players.map(p => (
                        <div key={p.id} className="p-2 rounded bg-slate-800/60 border border-slate-700/50 text-xs">
                          <div className="font-semibold text-slate-200">{p.name}</div>
                          <div className="text-[11px] text-slate-400 truncate">{p.email}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSpecialConfirmationModal = () => {
    if (!showSpecialModal) return null;

    const activePlayers = profiles.filter(p => p.id !== '00000000-0000-0000-0000-000000000000');
    const playerSpecMap = new Map<string, any>();
    specialPredictionsData.forEach(sp => {
      if (sp.player_id !== '00000000-0000-0000-0000-000000000000') {
        playerSpecMap.set(sp.player_id, sp);
      }
    });

    const summaries = SPECIAL_CATEGORIES.map(cat => {
      const approvedSet = approvedSpecialKeys[cat.id] || new Set();
      let playersReceivingPoints = 0;
      let playersZeroPoints = 0;

      activePlayers.forEach(p => {
        const specRow = playerSpecMap.get(p.id);
        const rawVal = specRow ? specRow[cat.id] : '';
        const normKey = normalizeSpecialPrediction(rawVal);
        if (normKey && approvedSet.has(normKey)) {
          playersReceivingPoints++;
        } else {
          playersZeroPoints++;
        }
      });

      return {
        cat,
        approvedGroupsCount: approvedSet.size,
        playersReceivingPoints,
        playersZeroPoints
      };
    });

    const handleConfirmSaveSpecial = async () => {
      setSavingSpecial(true);
      try {
        const payload: Database['public']['Tables']['special_predictions']['Insert'] = {
          player_id: '00000000-0000-0000-0000-000000000000',
          champion: '',
          vice_champion: '',
          third_place: '',
          top_scorer: '',
          best_player: ''
        };

        SPECIAL_CATEGORIES.forEach(cat => {
          const approvedSet = approvedSpecialKeys[cat.id] || new Set();
          const keysArr = Array.from(approvedSet).filter(k => k.trim().length > 0);

          keysArr.forEach(k => {
            if (k.includes('|')) {
              throw new Error(`Key contains illegal delimiter: ${k}`);
            }
          });

          payload[cat.id] = keysArr.join(' | ');
        });

        const { error: upsertError } = await supabase
          .from('special_predictions')
          .upsert(payload, { onConflict: 'player_id' });

        if (upsertError) throw upsertError;

        await recalculateScores();

        showToast(
          lang === 'pt' ? 'Palpites Especiais salvos e pontos recalculados!' : 'Special predictions saved and points recalculated!',
          'success'
        );
        setShowSpecialModal(false);
      } catch (err) {
        console.error('Error saving special predictions:', err);
        showToast(
          lang === 'pt' ? 'Erro ao salvar palpites especiais.' : 'Error saving special predictions.',
          'error'
        );
      } finally {
        setSavingSpecial(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">
                {t(lang, 'admin.specials.modalTitle')}
              </h3>
            </div>
            <button
              onClick={() => setShowSpecialModal(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-slate-300">
            {t(lang, 'admin.specials.modalSubtitle')}
          </p>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {summaries.map(s => (
              <div key={s.cat.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-emerald-400 text-sm">
                    {lang === 'pt' ? s.cat.labelPt : s.cat.labelEn} (+{s.cat.pts} pts)
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {s.approvedGroupsCount} {t(lang, 'admin.specials.groupsApproved')}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    {s.playersReceivingPoints} {t(lang, 'admin.specials.playersReceivingPoints')}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-700 text-slate-400 font-medium">
                    {s.playersZeroPoints} {t(lang, 'admin.specials.playersZeroPoints')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => setShowSpecialModal(false)}
              disabled={savingSpecial}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
            >
              {t(lang, 'admin.specials.cancel')}
            </button>
            <button
              onClick={handleConfirmSaveSpecial}
              disabled={savingSpecial}
              className="px-5 py-2 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {savingSpecial ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'pt' ? 'Salvando...' : 'Saving...'}</span>
                </>
              ) : (
                <span>{t(lang, 'admin.specials.confirmSave')}</span>
              )}
            </button>
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

      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 p-4">
        <div className="flex bg-slate-800 rounded-lg p-1">
          {[
            { id: 'resultados', label: t(lang, 'admin.results'), icon: Trophy },
            { id: 'partidas', label: t(lang, 'admin.matches'), icon: Calendar },
            { id: 'jogadores', label: t(lang, 'admin.players'), icon: Users },
            { id: 'grupos', label: lang === 'pt' ? 'Grupos' : 'Groups', icon: Trophy },
            { id: 'especiais', label: lang === 'pt' ? 'Especiais' : 'Specials', icon: Trophy }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'resultados' | 'partidas' | 'jogadores' | 'grupos' | 'especiais')}
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
        {activeTab === 'grupos' && renderGrupos()}
        {activeTab === 'especiais' && renderEspeciais()}
      </div>

      {/* Export Predictions Section */}
      <div className="p-4 border-t border-slate-800 mt-4">
        <h2 className="text-xl font-bold text-slate-200 mb-3">
          {t(lang, 'admin.exportPredictions')}
        </h2>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-300">
              {lang === 'pt' ? 'Exportar todos os palpites dos jogadores ativos' : 'Export all active players\' predictions'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'pt' 
                ? 'Gera um arquivo CSV contendo os palpites de jogos, grupos e palpites especiais de todos os participantes.' 
                : 'Generates a CSV file containing match, group, and special predictions for all participants.'}
            </p>
          </div>
          <button
            onClick={exportPredictions}
            disabled={exportingPredictions}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors shrink-0"
          >
            {exportingPredictions ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>{lang === 'pt' ? 'Carregando...' : 'Loading...'}</span>
              </>
            ) : (
              <>
                <span>{t(lang, 'admin.downloadCsv')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recalculate Scores Section */}
      <div className="p-4 border-t border-slate-800 mt-4">
        <h2 className="text-xl font-bold text-slate-200 mb-3">
          {lang === 'pt' ? 'Recalcular Pontuações' : 'Recalculate Scores'}
        </h2>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-300">
              {lang === 'pt' ? 'Forçar recálculo de pontos' : 'Force points recalculation'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'pt' 
                ? 'Recalcula os pontos de todos os jogadores para todas as partidas, grupos e palpites especiais. Use isso após atualizações de regras ou correção de dados.' 
                : 'Recalculates points for all players across all matches, groups, and special predictions. Use this after rule updates or data corrections.'}
            </p>
          </div>
          <button
            onClick={runPreview}
            disabled={recalculating}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors shrink-0"
          >
            {recalculating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{lang === 'pt' ? 'Recalculando...' : 'Recalculating...'}</span>
              </>
            ) : (
              <span>{lang === 'pt' ? 'Recalcular Tudo' : 'Recalculate All'}</span>
            )}
          </button>
        </div>
      </div>

      {/* Modal Nova Partida */}
      {showNewMatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/30">
              <h3 className="font-bold text-lg flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-500"/> {t(lang, 'admin.addMatch')}</h3>
              <button onClick={() => setShowNewMatchModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">{lang === 'pt' ? 'Fase' : 'Phase'}</label>
                <select
                  value={newMatch.phase}
                  onChange={e => setNewMatch(p => ({ ...p, phase: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="round_of_32">{lang === 'pt' ? 'Oitavas de Final (Round of 32)' : 'Round of 32'}</option>
                  <option value="round_of_16">{lang === 'pt' ? 'Oitavas de Final (Round of 16)' : 'Round of 16'}</option>
                  <option value="quarter_final">{lang === 'pt' ? 'Quartas de Final' : 'Quarterfinal'}</option>
                  <option value="semi_final">{lang === 'pt' ? 'Semifinal' : 'Semifinal'}</option>
                  <option value="third_place">{lang === 'pt' ? 'Disputa de 3º Lugar' : '3rd Place Match'}</option>
                  <option value="final">{lang === 'pt' ? 'Final' : 'Final'}</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">{t(lang, 'admin.homeTeam')}</label>
                  <input
                    type="text"
                    value={newMatch.team_a}
                    onChange={e => setNewMatch(p => ({ ...p, team_a: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder={lang === 'pt' ? 'Ex: Brasil' : 'e.g. Brazil'}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">{t(lang, 'admin.awayTeam')}</label>
                  <input
                    type="text"
                    value={newMatch.team_b}
                    onChange={e => setNewMatch(p => ({ ...p, team_b: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder={lang === 'pt' ? 'Ex: Argentina' : 'e.g. Argentina'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">{t(lang, 'admin.matchDate')}</label>
                <input
                  type="datetime-local"
                  value={newMatch.match_date}
                  onChange={handleDateChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">{lang === 'pt' ? 'Encerramento (Deadline)' : 'Deadline'}</label>
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
                  {lang === 'pt' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  onClick={createNewMatch}
                  disabled={savingMatch}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
                >
                  {savingMatch ? t(lang, 'admin.saving') : t(lang, 'admin.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Recalculation Preview / Dry-run */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/30 shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-2 text-emerald-400">
                <Trophy className="w-5 h-5" /> 
                {lang === 'pt' ? 'Pré-visualização do Recálculo (Dry-Run)' : 'Recalculation Preview (Dry-Run)'}
              </h3>
              <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-white" disabled={isCommitting}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              <p className="text-xs text-slate-400">
                {lang === 'pt' 
                  ? 'Abaixo está a comparação das pontuações calculadas localmente em relação aos dados salvos no banco. Revise as alterações antes de confirmar.'
                  : 'Below is a comparison of in-memory calculated scores against currently stored database values. Review changes before committing.'}
              </p>
              
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-800/50 text-slate-400 font-semibold border-b border-slate-800">
                      <th className="p-3">{lang === 'pt' ? 'Jogador' : 'Player'}</th>
                      <th className="p-3 text-center">{lang === 'pt' ? 'Jogos' : 'Matches'}</th>
                      <th className="p-3 text-center">{lang === 'pt' ? 'Grupos' : 'Groups'}</th>
                      <th className="p-3 text-center">{lang === 'pt' ? 'Total Atual' : 'Current Total'}</th>
                      <th className="p-3 text-center">{lang === 'pt' ? 'Total Novo' : 'New Total'}</th>
                      <th className="p-3 text-center">{lang === 'pt' ? 'Diferença' : 'Difference'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {previewData.map(row => {
                      const diff = row.newTotal - row.oldTotal;
                      return (
                        <tr key={row.playerId} className="hover:bg-slate-800/20 text-slate-300">
                          <td className="p-3 font-medium text-slate-200">{row.name}</td>
                          <td className="p-3 text-center">
                            {row.oldMatch} &rarr; <strong className={row.newMatch !== row.oldMatch ? 'text-emerald-400' : ''}>{row.newMatch}</strong>
                          </td>
                          <td className="p-3 text-center">
                            {row.oldGroup} &rarr; <strong className={row.newGroup !== row.oldGroup ? 'text-emerald-400' : ''}>{row.newGroup}</strong>
                          </td>
                          <td className="p-3 text-center font-semibold">{row.oldTotal}</td>
                          <td className="p-3 text-center font-bold text-white">{row.newTotal}</td>
                          <td className="p-3 text-center">
                            {diff === 0 ? (
                              <span className="text-slate-500 font-medium">—</span>
                            ) : diff > 0 ? (
                              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">+{diff}</span>
                            ) : (
                              <span className="text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">{diff}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-800/10 shrink-0">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 font-medium text-slate-300 hover:text-white"
                disabled={isCommitting}
              >
                {lang === 'pt' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={commitRecalculation}
                disabled={isCommitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {isCommitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{lang === 'pt' ? 'Gravando...' : 'Committing...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{lang === 'pt' ? 'Confirmar & Gravar' : 'Confirm & Commit'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {renderSpecialConfirmationModal()}
    </div>
  );
}

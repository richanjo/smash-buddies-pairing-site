'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type SkillLevel = 'Beginner' | 'Advanced Beginner' | 'Intermediate' | 'Advanced';
type Gender = 'Male' | 'Female';
type GameMode = "Men's Doubles" | "Women's Doubles" | "Mixed Doubles";
type GameStatus = 'pending' | 'active' | 'finished';

interface Player {
  id: string;
  name: string;
  skill: SkillLevel;
  gender: Gender;
}

interface Team {
  players: Player[];
  score: number;
}

interface Game {
  id: number;
  teamA: Team;
  teamB: Team;
  targetScore: number;
  status: GameStatus;
  winner: 'teamA' | 'teamB' | null;
  gameTime?: number;
  teamAScore?: number;
  teamBScore?: number;
}

const SKILL_ORDER: Record<SkillLevel, number> = {
  'Beginner': 1,
  'Advanced Beginner': 2,
  'Intermediate': 3,
  'Advanced': 4,
};

const SKILL_OPTIONS: SkillLevel[] = ['Beginner', 'Advanced Beginner', 'Intermediate', 'Advanced'];

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getTeamSkill(players: Player[]): number {
  return players.reduce((sum, p) => sum + SKILL_ORDER[p.skill], 0);
}

function generateTeams(players: Player[], gameMode: GameMode): { teamA: Player[]; teamB: Player[]; unused: Player[] } {
  let filteredPlayers: Player[];

  if (gameMode === "Men's Doubles") {
    filteredPlayers = players.filter((p) => p.gender === 'Male');
  } else if (gameMode === "Women's Doubles") {
    filteredPlayers = players.filter((p) => p.gender === 'Female');
  } else {
    filteredPlayers = [...players];
  }

  if (filteredPlayers.length < 4) {
    return { teamA: [], teamB: [], unused: [] };
  }

  const shuffled = shuffleArray(filteredPlayers);
  let bestTeamA: Player[] = [];
  let bestTeamB: Player[] = [];
  let bestDiff = Infinity;

  for (let i = 0; i < Math.min(100, shuffled.length); i++) {
    const candidates = shuffleArray(shuffled).slice(0, 4);
    if (gameMode === "Mixed Doubles") {
      const males = candidates.filter((p) => p.gender === 'Male');
      const females = candidates.filter((p) => p.gender === 'Female');
      if (males.length !== 2 || females.length !== 2) continue;
      
      const teamA: Player[] = [males[0], females[0]];
      const teamB: Player[] = [males[1], females[1]];
      const diff = Math.abs(getTeamSkill(teamA) - getTeamSkill(teamB));
      
      if (diff < bestDiff) {
        bestDiff = diff;
        bestTeamA = teamA;
        bestTeamB = teamB;
      }
    } else {
      const teamA: Player[] = [candidates[0], candidates[1]];
      const teamB: Player[] = [candidates[2], candidates[3]];
      const diff = Math.abs(getTeamSkill(teamA) - getTeamSkill(teamB));
      
      if (diff < bestDiff) {
        bestDiff = diff;
        bestTeamA = teamA;
        bestTeamB = teamB;
      }
    }
  }

  if (bestTeamA.length === 0) {
    bestTeamA = shuffled.slice(0, 2);
    bestTeamB = shuffled.slice(2, 4);
  }

  const usedPlayerIds = new Set([...bestTeamA, ...bestTeamB].map(p => p.id));
  const unused = filteredPlayers.filter(p => !usedPlayerIds.has(p.id));

  return { teamA: bestTeamA, teamB: bestTeamB, unused };
}

export default function Home() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [newName, setNewName] = useState('');
  const [newSkill, setNewSkill] = useState<SkillLevel>('Intermediate');
  const [newGender, setNewGender] = useState<Gender>('Male');
  const [gameMode, setGameMode] = useState<GameMode>('Mixed Doubles');
  const [games, setGames] = useState<Game[]>([]);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [targetScore, setTargetScore] = useState<number>(11);
  const [customScore, setCustomScore] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showCourtChangeAlert, setShowCourtChangeAlert] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [history, setHistory] = useState<{ teamA: number; teamB: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'players' | 'game'>('players');
  const [userEmail, setUserEmail] = useState('');
  const [editingGameId, setEditingGameId] = useState<number | null>(null);
  const [editingTeamA, setEditingTeamA] = useState<Player[]>([]);
  const [editingTeamB, setEditingTeamB] = useState<Player[]>([]);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const currentGame = games[currentGameIndex] || null;

useEffect(() => {
  const handlePreventBack = () => {
    window.history.pushState(null, '', window.location.href);
  };

  const isLoggedIn = localStorage.getItem('pickleball_logged_in');
  if (isLoggedIn !== 'true') {
    window.location.href = '/login';
    return;
  }
  document.cookie = 'pickleball_logged_in=true; path=/';
  const email = localStorage.getItem('pickleball_user_email') || '';
  setUserEmail(email);

  const cachedPlayers = localStorage.getItem('pickleball_players');
  const cachedGames = localStorage.getItem('pickleball_games');
  const cachedTargetScore = localStorage.getItem('pickleball_target_score');
  const cachedCurrentGameIndex = localStorage.getItem('pickleball_current_game_index');
  
  if (cachedPlayers) setPlayers(JSON.parse(cachedPlayers));
  if (cachedGames) setGames(JSON.parse(cachedGames));
  if (cachedTargetScore) setTargetScore(parseInt(cachedTargetScore));
  if (cachedCurrentGameIndex) setCurrentGameIndex(parseInt(cachedCurrentGameIndex));

  window.history.pushState(null, '', window.location.href);
  window.addEventListener('popstate', handlePreventBack);
  return () => window.removeEventListener('popstate', handlePreventBack);
}, [router]);

  useEffect(() => {
    if (timerRunning && currentGame?.status === 'active') {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning, currentGame?.status]);

  useEffect(() => {
    if (currentGame && currentGame.status === 'active') {
      const halfScore = Math.floor(currentGame.targetScore / 2);
      const currentMax = Math.max(currentGame.teamA.score, currentGame.teamB.score);
      if (currentMax >= halfScore && currentMax < halfScore + 1) {
        const prevMax = history.length > 0 ? Math.max(history[history.length - 1].teamA, history[history.length - 1].teamB) : 0;
        if (prevMax < halfScore) {
          setShowCourtChangeAlert(true);
          setTimeout(() => setShowCourtChangeAlert(false), 4000);
        }
      }
    }
  }, [currentGame?.teamA.score, currentGame?.teamB.score, currentGame?.status, history]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addPlayer = () => {
    if (!newName.trim()) return;
    const exists = players.some(p => p.name.toLowerCase() === newName.trim().toLowerCase());
    if (exists) {
      alert('Player already exists!');
      return;
    }
    setPlayers([...players, { id: generateId(), name: newName.trim(), skill: newSkill, gender: newGender }]);
    setNewName('');
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const updatePlayerSkill = (id: string, skill: SkillLevel) => {
    setPlayers(players.map(p => p.id === id ? { ...p, skill } : p));
  };

  const generateAllGames = () => {
    const score = customScore ? parseInt(customScore) : targetScore;
    if (isNaN(score) || score < 1) {
      alert('Please enter a valid score');
      return;
    }

    const filteredPlayers: Player[] = gameMode === "Men's Doubles" 
      ? players.filter(p => p.gender === 'Male')
      : gameMode === "Women's Doubles"
        ? players.filter(p => p.gender === 'Female')
        : [...players];

    if (filteredPlayers.length < 4) {
      alert('Need at least 4 players for selected mode');
      return;
    }

    const allGames: Game[] = [];
    const playerRotation: Player[] = [...filteredPlayers];
    let gameNum = 1;

    while (playerRotation.length >= 4) {
      const result = generateTeams(playerRotation, gameMode);
      if (result.teamA.length === 0) break;

      allGames.push({
        id: gameNum,
        teamA: { players: result.teamA, score: 0 },
        teamB: { players: result.teamB, score: 0 },
        targetScore: score,
        status: 'pending',
        winner: null,
      });

      const usedIds = new Set([...result.teamA, ...result.teamB].map(p => p.id));
      const remaining = playerRotation.filter(p => !usedIds.has(p.id));
      
      if (remaining.length < 4 && gameNum < 10) {
        const rotationPlayers = [...remaining, ...playerRotation.slice(0, 4)];
        const newRotation = generateTeams(rotationPlayers, gameMode);
        if (newRotation.teamA.length >= 4) {
          playerRotation.length = 0;
          playerRotation.push(...newRotation.teamA, ...newRotation.teamB, ...remaining);
        } else {
          break;
        }
      } else {
        playerRotation.length = 0;
        playerRotation.push(...remaining);
      }
      
      gameNum++;
    }

    if (allGames.length === 0) {
      alert('Not enough players to generate any games');
      return;
    }

    setGames(allGames);
    setTargetScore(score);
    setCurrentGameIndex(0);
    setTimer(0);
    setTimerRunning(false);
    setHistory([]);
    setActiveTab('game');
  };

  const startGame = () => {
    if (!currentGame) return;
    const updatedGames = [...games];
    updatedGames[currentGameIndex] = {
      ...updatedGames[currentGameIndex],
      status: 'active',
      teamA: { ...updatedGames[currentGameIndex].teamA, score: 0 },
      teamB: { ...updatedGames[currentGameIndex].teamB, score: 0 },
    };
    setGames(updatedGames);
    setTimer(0);
    setTimerRunning(true);
    setHistory([]);
  };

  const restartGame = () => {
    if (!currentGame) return;
    const updatedGames = [...games];
    updatedGames[currentGameIndex] = {
      ...updatedGames[currentGameIndex],
      teamA: { ...updatedGames[currentGameIndex].teamA, score: 0 },
      teamB: { ...updatedGames[currentGameIndex].teamB, score: 0 },
      status: 'active',
      winner: null,
    };
    setGames(updatedGames);
    setTimer(0);
    setTimerRunning(true);
    setHistory([]);
  };

  const startGameById = (gameId: number) => {
    const gameIdx = games.findIndex(g => g.id === gameId);
    if (gameIdx === -1) return;
    const updatedGames = [...games];
    updatedGames[gameIdx] = {
      ...updatedGames[gameIdx],
      status: 'active',
      teamA: { ...updatedGames[gameIdx].teamA, score: 0 },
      teamB: { ...updatedGames[gameIdx].teamB, score: 0 },
    };
    setGames(updatedGames);
    setCurrentGameIndex(gameIdx);
    setTimer(0);
    setTimerRunning(true);
    setHistory([]);
  };

  const addPoint = (team: 'teamA' | 'teamB') => {
    if (!currentGame || currentGame.status !== 'active') return;
    const updatedGames = [...games];
    const game = { ...updatedGames[currentGameIndex] };
    game[team].score += 1;
    setHistory([...history, { teamA: game.teamA.score, teamB: game.teamB.score }]);
    
    if (game[team].score >= game.targetScore) {
      game.status = 'finished';
      game.winner = team;
      game.gameTime = timer;
      game.teamAScore = game.teamA.score;
      game.teamBScore = game.teamB.score;
      setTimerRunning(false);
      setShowWinnerModal(true);
    }
    
    updatedGames[currentGameIndex] = game;
    setGames(updatedGames);
  };

  const undoLastPoint = () => {
    if (history.length === 0 || !currentGame || currentGame.status !== 'active') return;
    const lastState = history[history.length - 1];
    const updatedGames = [...games];
    updatedGames[currentGameIndex] = {
      ...updatedGames[currentGameIndex],
      teamA: { ...updatedGames[currentGameIndex].teamA, score: lastState.teamA },
      teamB: { ...updatedGames[currentGameIndex].teamB, score: lastState.teamB },
    };
    setGames(updatedGames);
    setHistory(history.slice(0, -1));
  };

  const stopGame = () => {
    if (!currentGame) return;
    const updatedGames = [...games];
    updatedGames[currentGameIndex] = {
      ...updatedGames[currentGameIndex],
      status: 'pending',
    };
    setGames(updatedGames);
    setTimer(0);
    setTimerRunning(false);
  };

  const stopGameById = (gameId: number) => {
    const gameIdx = games.findIndex(g => g.id === gameId);
    if (gameIdx === -1) return;
    const updatedGames = [...games];
    updatedGames[gameIdx] = {
      ...updatedGames[gameIdx],
      status: 'pending',
    };
    setGames(updatedGames);
    if (currentGameIndex === gameIdx) {
      setTimer(0);
      setTimerRunning(false);
    }
  };

  const finishGameManually = () => {
    if (!currentGame) return;
    const updatedGames = [...games];
    const game = { ...updatedGames[currentGameIndex] };
    const winner = game.teamA.score > game.teamB.score ? 'teamA' : 'teamB';
    game.status = 'finished';
    game.winner = winner;
    updatedGames[currentGameIndex] = game;
    setGames(updatedGames);
    setTimerRunning(false);
  };

  const resetAll = () => {
    const score = customScore ? parseInt(customScore) : targetScore;
    if (isNaN(score) || score < 1) {
      alert('Please enter a valid score');
      return;
    }

    const filteredPlayers: Player[] = gameMode === "Men's Doubles" 
      ? players.filter(p => p.gender === 'Male')
      : gameMode === "Women's Doubles"
        ? players.filter(p => p.gender === 'Female')
        : [...players];

    if (filteredPlayers.length < 4) {
      alert('Need at least 4 players for selected mode');
      return;
    }

    const result = generateTeams(filteredPlayers, gameMode);
    if (result.teamA.length === 0) {
      alert('Cannot generate teams');
      return;
    }

    const newGame: Game = {
      id: games.length > 0 ? Math.max(...games.map(g => g.id)) + 1 : 1,
      teamA: { players: result.teamA, score: 0 },
      teamB: { players: result.teamB, score: 0 },
      targetScore: score,
      status: 'pending',
      winner: null,
      gameTime: 0,
      teamAScore: 0,
      teamBScore: 0
    };

    setGames([...games, newGame]);
    setCurrentGameIndex(games.length);
    setTargetScore(score);
    setTimer(0);
    setTimerRunning(false);
    setHistory([]);
    setEditingGameId(null);
    setShowWinnerModal(false);
  };

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem('pickleball_logged_in');
      localStorage.removeItem('pickleball_user_email');
      localStorage.removeItem('pickleball_players');
      localStorage.removeItem('pickleball_games');
      localStorage.removeItem('pickleball_target_score');
      localStorage.removeItem('pickleball_current_game_index');
      document.cookie = 'pickleball_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.href = '/login';
    }, 1000);
  };

  const regeneratePairing = () => {
    const score = customScore ? parseInt(customScore) : targetScore;
    if (isNaN(score) || score < 1) {
      alert('Please enter a valid score');
      return;
    }

    const filteredPlayers: Player[] = gameMode === "Men's Doubles" 
      ? players.filter(p => p.gender === 'Male')
      : gameMode === "Women's Doubles"
        ? players.filter(p => p.gender === 'Female')
        : [...players];

    if (filteredPlayers.length < 4) {
      alert('Need at least 4 players for selected mode');
      return;
    }

    // Shuffle all players and generate new games
    const shuffled = shuffleArray(filteredPlayers);
    const allGames: Game[] = [];
    let gameNum = 1;
    let availablePlayers: Player[] = [...shuffled];
    
    while (availablePlayers.length >= 4) {
      const result = generateTeams(availablePlayers, gameMode);
      if (result.teamA.length === 0) break;

      allGames.push({
        id: gameNum,
        teamA: { players: result.teamA, score: 0 },
        teamB: { players: result.teamB, score: 0 },
        targetScore: score,
        status: 'pending',
        winner: null,
        gameTime: 0,
        teamAScore: 0,
        teamBScore: 0
      });

      const usedIds = new Set([...result.teamA, ...result.teamB].map(p => p.id));
      availablePlayers = availablePlayers.filter(p => !usedIds.has(p.id));
      gameNum++;
    }

    if (allGames.length === 0) {
      alert('Cannot generate games');
      return;
    }

    setGames(allGames);
    setTargetScore(score);
    setCurrentGameIndex(0);
    setTimer(0);
    setTimerRunning(false);
    setHistory([]);
    setActiveTab('game');
  };

  const malePlayers = players.filter(p => p.gender === 'Male');
  const femalePlayers = players.filter(p => p.gender === 'Female');

  const getGamesPlayed = (playerId: string) => {
    return games.filter(g => 
      g.teamA.players.some(p => p.id === playerId) || g.teamB.players.some(p => p.id === playerId)
    ).length;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#84cc16' }}>
      <header className="bg-white shadow-sm border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="Smash Buddies" width={40} height={40} className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover" />
            <h1 className="text-lg md:text-2xl font-black tracking-tight text-zinc-900">
              Smash Buddies
            </h1>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="bg-blue-900 hover:bg-blue-800 disabled:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg text-sm"
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-zinc-200">
          <div className="flex border-b border-zinc-200">
            <button
              onClick={() => setActiveTab('players')}
              className={`flex-1 py-4 px-6 font-black text-center transition-all ${
                activeTab === 'players'
                  ? 'bg-green-600 text-white'
                  : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'
              }`}
            >
              PLAYERS
            </button>
            <button
              onClick={() => setActiveTab('game')}
              className={`flex-1 py-4 px-6 font-black text-center transition-all ${
                activeTab === 'game'
                  ? 'bg-green-600 text-white'
                  : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'
              }`}
            >
              GAME
            </button>
          </div>

          {activeTab === 'players' && (
            <div className="p-4 md:p-6">
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter Player Name"
                  className="w-full px-4 py-3 text-base bg-black border-2 border-zinc-800 rounded-xl focus:border-green-500 focus:outline-none text-white placeholder:text-white"
                  onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value as SkillLevel)}
                    className="flex-1 px-4 py-3 text-base bg-black border-2 border-zinc-800 rounded-xl focus:border-green-500 focus:outline-none text-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Advanced Beginner">Advanced Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as Gender)}
                    className="flex-1 px-4 py-3 text-base bg-black border-2 border-zinc-800 rounded-xl focus:border-green-500 focus:outline-none text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <button
                    onClick={addPlayer}
                    className="bg-green-600 hover:bg-green-700 text-white font-black py-3 px-4 rounded-xl transition-all"
                  >
                    Add Player
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold text-sm">
                  Male: {malePlayers.length}
                </span>
                <span className="bg-pink-100 text-pink-700 px-3 py-1.5 rounded-lg font-bold text-sm">
                  Female: {femalePlayers.length}
                </span>
                <span className="bg-zinc-200 text-zinc-700 px-3 py-1.5 rounded-lg font-bold text-sm">
                  Total: {players.length}
                </span>
              </div>

              {players.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-100">
                        <th className="px-3 py-2 text-left font-black text-zinc-600">Name</th>
                        <th className="px-3 py-2 text-left font-black text-zinc-600">Skill</th>
                        <th className="px-3 py-2 text-left font-black text-zinc-600">Gender</th>
                        <th className="px-3 py-2 text-center font-black text-zinc-600">Total Game</th>
                        <th className="px-3 py-2 text-right font-black text-zinc-600"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((player) => (
                        <tr key={player.id} className="border-b border-zinc-100">
                          <td className="px-3 py-2 font-bold text-zinc-800">{player.name}</td>
                          <td className="px-3 py-2">
                            <select
                              value={player.skill}
                              onChange={(e) => updatePlayerSkill(player.id, e.target.value as SkillLevel)}
                              className="px-2 py-1 text-xs bg-black border border-zinc-700 rounded-lg focus:border-green-500 focus:outline-none text-white font-bold"
                            >
                              {SKILL_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 font-bold text-zinc-600">{player.gender}</td>
                          <td className="px-3 py-2 text-center font-bold text-zinc-800">{getGamesPlayed(player.id)}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => removePlayer(player.id)}
                              className="text-zinc-900 hover:text-red-500 text-xl leading-none"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-900">
                  <p className="font-bold">No players added</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'game' && (
            <div className="p-4 md:p-6">
              {games.length === 0 ? (
                <div className="space-y-4">
                  <div>
                    <div className="font-bold text-zinc-600 mb-2">Game Mode</div>
                    <select
                      value={gameMode}
                      onChange={(e) => setGameMode(e.target.value as GameMode)}
                      className="w-full px-4 py-3 text-base bg-black border-2 border-zinc-800 rounded-xl focus:border-green-500 focus:outline-none text-white font-bold"
                    >
                      <option value="Mixed Doubles">Mixed Doubles</option>
                      <option value="Men&apos;s Doubles">Men&apos;s Doubles</option>
                      <option value="Women&apos;s Doubles">Women&apos;s Doubles</option>
                    </select>
                  </div>

                  <div>
                    <div className="font-bold text-zinc-600 mb-2">Target Score</div>
                    <div className="flex flex-wrap gap-2">
                      {[11, 15, 21].map((score) => (
                        <button
                          key={score}
                          onClick={() => { setTargetScore(score); setShowCustomInput(false); }}
                          className={`px-5 py-2 rounded-lg font-black text-sm ${
                            targetScore === score && !showCustomInput
                              ? 'bg-green-600 text-white'
                              : 'bg-zinc-200 text-zinc-700'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                      <button
                        onClick={() => setShowCustomInput(!showCustomInput)}
                        className={`px-5 py-2 rounded-lg font-black text-sm ${
                          showCustomInput
                            ? 'bg-green-600 text-white'
                            : 'bg-zinc-200 text-zinc-700'
                        }`}
                      >
                        Custom
                      </button>
                    </div>
                    {showCustomInput && (
                      <input
                        type="number"
                        value={customScore}
                        onChange={(e) => setCustomScore(e.target.value)}
                        placeholder="Enter score"
                        className="mt-2 w-full px-4 py-3 text-base bg-black border-2 border-zinc-800 rounded-xl focus:border-green-500 focus:outline-none text-white"
                      />
                    )}
                  </div>

                  <button
                    onClick={generateAllGames}
                    disabled={players.length < 4 || games.some(game => game.status === 'active')}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition-all"
                  >
                    Generate Games ({Math.floor(players.length / 4)} possible)
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-zinc-600 mb-1">TARGET</span>
                      <span className="bg-green-600 text-black px-4 py-2 rounded-xl font-black">
                        {currentGame?.targetScore}
                      </span>
                    </div>
                    <div className="bg-black px-3 py-1.5 rounded-lg">
                      <span className="text-green-400 font-mono font-bold">{formatTime(timer)}</span>
                    </div>
                  </div>

                  {currentGame && (
<div>
                  {showCourtChangeAlert && (
                    <div className="bg-yellow-400 text-zinc-900 px-3 py-2 rounded-lg text-center font-black animate-pulse mb-4">
                      SWITCH COURTS AT {Math.floor(currentGame.targetScore / 2)}
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-6 mb-4">
                    <div className="text-center">
                      <div className="text-5xl md:text-6xl font-black text-blue-600">{currentGame.teamA.score}</div>
                      <div className="text-sm font-bold text-blue-600">Team A</div>
                    </div>
                    <div className="text-4xl md:text-5xl font-bold text-zinc-900">-</div>
                    <div className="text-center">
                      <div className="text-5xl md:text-6xl font-black text-rose-600">{currentGame.teamB.score}</div>
                      <div className="text-sm font-bold text-rose-600">Team B</div>
                    </div>
                  </div>

                  <div className="relative w-full aspect-[2/1] md:aspect-[2/1] rounded-2xl overflow-hidden border-4 border-zinc-800 shadow-xl mx-auto max-w-lg md:max-w-2xl mb-4" style={{ backgroundColor: '#84cc16' }}>
                        <div className="absolute left-[28%] top-0 bottom-[45%] bg-blue-950" />
                        <div className="absolute left-[72%] top-0 bottom-[45%] bg-blue-950" />
                        <div className="absolute left-1/2 top-0 bottom-0 w-1.5 bg-white" />
                        <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-white" />
                        <div className="absolute left-[28%] top-0 bottom-0 w-0.5 bg-yellow-400" />
                        <div className="absolute left-[28%] top-[40%] bottom-[45%] h-0.5 bg-yellow-400" />
                        <div className="absolute left-[72%] top-0 bottom-0 w-0.5 bg-yellow-400" />
                        <div className="absolute left-[72%] top-[40%] bottom-[45%] h-0.5 bg-yellow-400" />

                        <div className="absolute left-1 top-1">
                          <span className="bg-blue-600 text-white px-2 py-1 rounded-lg font-black text-sm">TEAM A</span>
                        </div>
                        <div className="absolute right-1 top-1">
                          <span className="bg-rose-600 text-white px-2 py-1 rounded-lg font-black text-sm">TEAM B</span>
                        </div>

                        <div className="absolute left-[10%] top-[15%] flex flex-col items-center gap-1">
                          {currentGame.teamA.players[0] ? (
                            <div className="flex items-center gap-1">
                              <span className="text-lg">{currentGame.teamA.players[0].gender === 'Male' ? '👨' : '👩'}</span>
                              <div className="text-sm font-black text-white">{currentGame.teamA.players[0].name}</div>
                            </div>
                          ) : (
                            <div className="text-sm font-bold text-zinc-900">TBD</div>
                          )}
                        </div>

                        <div className="absolute left-[10%] bottom-[15%] flex flex-col items-center gap-1">
                          {currentGame.teamA.players[1] ? (
                            <div className="flex items-center gap-1">
                              <span className="text-lg">{currentGame.teamA.players[1].gender === 'Male' ? '👨' : '👩'}</span>
                              <div className="text-sm font-black text-white">{currentGame.teamA.players[1].name}</div>
                            </div>
                          ) : (
                            <div className="text-sm font-bold text-zinc-900">TBD</div>
                          )}
                        </div>

                        <div className="absolute right-[10%] top-[15%] flex flex-col items-center gap-1">
                          {currentGame.teamB.players[0] ? (
                            <div className="flex items-center gap-1">
                              <span className="text-lg">{currentGame.teamB.players[0].gender === 'Male' ? '👨' : '👩'}</span>
                              <div className="text-sm font-black text-white">{currentGame.teamB.players[0].name}</div>
                            </div>
                          ) : (
                            <div className="text-sm font-bold text-zinc-900">TBD</div>
                          )}
                        </div>

                        <div className="absolute right-[10%] bottom-[15%] flex flex-col items-center gap-1">
                          {currentGame.teamB.players[1] ? (
                            <div className="flex items-center gap-1">
                              <span className="text-lg">{currentGame.teamB.players[1].gender === 'Male' ? '👨' : '👩'}</span>
                              <div className="text-sm font-black text-white">{currentGame.teamB.players[1].name}</div>
                            </div>
                          ) : (
                            <div className="text-sm font-bold text-zinc-900">TBD</div>
                          )}
                        </div>

                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                          <span className="bg-zinc-900/70 text-lime-200 px-2 py-0.5 rounded-full text-[10px] font-bold">NET</span>
                        </div>
                      </div>

                      {currentGame.status === 'active' && (
                        <div>
                          <div className="flex gap-2 mb-4">
                            <button
                              onClick={() => addPoint('teamA')}
                              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-black py-4 rounded-xl"
                            >
                              +1 A
                            </button>
                            <button
                              onClick={() => addPoint('teamB')}
                              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-black py-4 rounded-xl"
                            >
                              +1 B
                            </button>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={undoLastPoint}
                              disabled={history.length === 0}
                              className="flex-1 bg-zinc-200 hover:bg-zinc-300 disabled:bg-zinc-100 text-zinc-700 font-bold py-2 rounded-xl"
                            >
                              Undo
                            </button>
                            <button
                              onClick={stopGame}
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-xl"
                            >
                              Stop
                            </button>
                            <button
                              onClick={restartGame}
                              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-xl"
                            >
                              Restart
                            </button>
                          </div>
                        </div>
                      )}

                      {currentGame.status === 'pending' && (
                        <button
                          onClick={startGame}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl mt-4"
                        >
                          Start Game
                        </button>
                      )}

                      {currentGame.status === 'finished' && (
                        <div className="text-center py-4">
                          <div className="text-3xl font-black text-green-600 mb-4">
                            GAME OVER
                          </div>
                        </div>
                      )}

                      {showWinnerModal && currentGame.status === 'finished' && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4">
                            <div className="text-center">
                              <div className="text-3xl font-black text-green-600 mb-4">WINNER!</div>
                              <div className={`text-2xl font-bold mb-2 ${currentGame.winner === 'teamA' ? 'text-blue-600' : 'text-rose-600'}`}>
                                {currentGame.winner === 'teamA' ? 'Team A' : 'Team B'}
                              </div>
                              <div className="text-lg text-zinc-600 mb-6">
                                {currentGame.winner === 'teamA' 
                                  ? currentGame.teamA.players.map(p => p.name).join(' & ')
                                  : currentGame.teamB.players.map(p => p.name).join(' & ')
                                }
                              </div>
                              <button
                                onClick={() => setShowWinnerModal(false)}
                                className="bg-green-600 hover:bg-green-700 text-white font-black py-3 px-8 rounded-xl"
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 border-t border-zinc-200 pt-4">
                    <div className="text-sm font-bold text-zinc-600 mb-2">Games List</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-zinc-100">
                            <th className="px-2 py-2 text-left font-black text-zinc-600">Game No</th>
                            <th className="px-2 py-2 text-left font-black text-blue-600">Team A</th>
                            <th className="px-2 py-2 text-center font-black text-blue-600">Score</th>
                            <th className="px-2 py-2 text-left font-black text-rose-600">Team B</th>
                            <th className="px-2 py-2 text-center font-black text-rose-600">Score</th>
                            <th className="px-2 py-2 text-left font-black text-zinc-600">Winner</th>
                            <th className="px-2 py-2 text-center font-black text-zinc-600">Time</th>
                            <th className="px-2 py-2 text-left font-black text-zinc-600">Action</th>
                            <th className="px-2 py-2 text-center font-black text-zinc-600"></th>
                          </tr>
                        </thead>
<tbody>
                          {games.map((g, idx) => (
                            <tr 
                              key={g.id} 
                              className={`border-b border-zinc-100 ${
                                g.status === 'active' ? 'bg-green-100' : 
                                idx < currentGameIndex ? 'bg-zinc-100' : 'bg-white'
                              }`}
                            >
                              <td className="px-2 py-2 font-bold text-zinc-800 align-middle">#{g.id}</td>
                              <td className="px-2 py-2 align-middle">
                                {editingGameId === g.id ? (
                                  <div className="flex flex-col gap-1">
                                    {editingTeamA.slice(0, 2).map((p, idx) => (
                                      <select
                                        key={idx}
                                        value={p.id}
                                        onChange={(e) => {
                                          const newPlayer = players.find(pl => pl.id === e.target.value);
                                          if (newPlayer && !editingTeamB.some(tp => tp.id === newPlayer.id)) {
                                            const newTeam = [...editingTeamA];
                                            newTeam[idx] = newPlayer;
                                            setEditingTeamA(newTeam);
                                          }
                                        }}
                                        className="px-1 py-0.5 text-xs bg-white border border-zinc-400 rounded focus:border-green-500 focus:outline-none text-blue-600 font-bold"
                                      >
                                        {players.filter(pl => !editingTeamB.some(tp => tp.id === pl.id)).map(pl => (
                                          <option key={pl.id} value={pl.id}>{pl.name}</option>
                                        ))}
                                      </select>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-1">
                                    {g.teamA.players.slice(0, 2).map((p) => (
                                      <div key={p.id} className="text-xs font-bold text-blue-600">{p.name}</div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="px-2 py-2 text-center font-bold text-blue-600 align-middle">
                                {g.status === 'finished' ? g.teamAScore ?? g.teamA.score : g.teamA.score}
                              </td>
                              <td className="px-2 py-2 align-middle">
                                {editingGameId === g.id ? (
                                  <div className="flex flex-col gap-1">
                                    {editingTeamB.slice(0, 2).map((p, idx) => (
                                      <select
                                        key={idx}
                                        value={p.id}
                                        onChange={(e) => {
                                          const newPlayer = players.find(pl => pl.id === e.target.value);
                                          if (newPlayer && !editingTeamA.some(tp => tp.id === newPlayer.id)) {
                                            const newTeam = [...editingTeamB];
                                            newTeam[idx] = newPlayer;
                                            setEditingTeamB(newTeam);
                                          }
                                        }}
                                        className="px-1 py-0.5 text-xs bg-white border border-zinc-400 rounded focus:border-green-500 focus:outline-none text-rose-600 font-bold"
                                      >
                                        {players.filter(pl => !editingTeamA.some(tp => tp.id === pl.id)).map(pl => (
                                          <option key={pl.id} value={pl.id}>{pl.name}</option>
                                        ))}
                                      </select>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-1">
                                    {g.teamB.players.slice(0, 2).map((p) => (
                                      <div key={p.id} className="text-xs font-bold text-rose-600">{p.name}</div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="px-2 py-2 text-center font-bold text-rose-600 align-middle">
                                {g.status === 'finished' ? g.teamBScore ?? g.teamB.score : g.teamB.score}
                              </td>
                              <td className="px-2 py-2">
                                {g.status === 'finished' ? (
                                  <span className="px-2 py-1 rounded-lg font-bold text-xs bg-green-100 text-green-700">
                                    {g.winner === 'teamA' ? 'Team A' : 'Team B'}
                                  </span>
                                ) : g.status === 'active' ? (
                                  <span className="px-2 py-1 rounded-lg font-bold text-xs bg-yellow-100 text-yellow-700">
                                    Playing
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded-lg font-bold text-xs bg-zinc-100 text-zinc-500">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="px-2 py-2 text-center font-bold text-zinc-600 align-middle">
                                {g.status === 'finished' && g.gameTime ? formatTime(g.gameTime) : '-'}
                              </td>
                              <td className="px-2 py-2 align-middle">
                                {g.status === 'active' || g.status === 'finished' ? (
                                  <span className="text-zinc-900 text-xs">Locked</span>
                                ) : editingGameId === g.id ? (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => {
                                        const gameIdx = games.findIndex(game => game.id === g.id);
                                        const updatedGames = [...games];
                                        updatedGames[gameIdx] = {
                                          ...updatedGames[gameIdx],
                                          teamA: { ...updatedGames[gameIdx].teamA, players: editingTeamA },
                                          teamB: { ...updatedGames[gameIdx].teamB, players: editingTeamB },
                                        };
                                        setGames(updatedGames);
                                        setEditingGameId(null);
                                      }}
                                      className="text-green-600 hover:text-green-800 font-bold text-xs"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingGameId(null)}
                                      className="text-red-500 hover:text-red-700 font-bold text-xs"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const newTeamA = g.teamA.players.length > 0 ? [...g.teamA.players] : [];
                                      const newTeamB = g.teamB.players.length > 0 ? [...g.teamB.players] : [];
                                      setEditingGameId(g.id);
                                      setEditingTeamA(newTeamA);
                                      setEditingTeamB(newTeamB);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                                  >
                                    Edit
                                  </button>
                                )}
                              </td>
                              <td className="px-2 py-2 text-center">
                                {g.status === 'pending' && !games.some(game => game.status === 'active') && (
                                  <button
                                    onClick={() => startGameById(g.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-lg text-xs"
                                  >
                                    Start
                                  </button>
                                )}
                                {g.status === 'active' && (
                                  <button
                                    onClick={() => stopGameById(g.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-lg text-xs"
                                  >
                                    Stop
                                  </button>
                                )}
                                {g.status === 'finished' && (
                                  <span className="text-zinc-900 text-xs">Done</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {games.length > 0 && games.every(g => g.status === 'pending') && (
                      <button
                        onClick={regeneratePairing}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl"
                      >
                        Regenerate Pairing
                      </button>
                    )}
                    {games.length > 0 && games.every(g => g.status === 'finished') && (
                      <button
                        onClick={resetAll}
                        className="flex-1 bg-zinc-800 text-white font-bold py-2 rounded-xl"
                      >
                        Generate 1 Game
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <footer className="text-center py-4 text-zinc-900 text-sm font-bold">
        Developed by Rits
      </footer>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  UserPlus, 
  Play, 
  CheckCircle2, 
  RotateCcw, 
  Flame,
  Crown,
  Settings,
  StopCircle,
  Zap,
  Sparkles,
  UserCheck,
  UserX,
  Trash2,
  GitMerge,
  ListOrdered,
  Layers
} from 'lucide-react';

export default function App() {
  // --- STATE MANAGEMENT ---
  const [totalCourtCount, setTotalCourtCount] = useState(() => {
    return parseInt(localStorage.getItem('pickleq_court_count') || '3', 10);
  });

  const [sessionActive, setSessionActive] = useState(() => {
    return JSON.parse(localStorage.getItem('pickleq_session_active') || 'false');
  });

  const [courts, setCourts] = useState(() => {
    const saved = localStorage.getItem('pickleq_courts');
    if (saved) return JSON.parse(saved);
    return Array.from({ length: totalCourtCount }, (_, i) => ({
      id: i + 1,
      teamA: [],
      teamB: [],
      isLive: false
    }));
  });

  // Venue Roster State
  const [roster, setRoster] = useState(() => {
    const saved = localStorage.getItem('pickleq_roster');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', name: 'Alex Rivera', rank: 95, gamesPlayed: 0, assignedCourt: 1, isCheckedIn: true, checkedInAt: Date.now() - 6000 },
      { id: '2', name: 'Jordan Chen', rank: 90, gamesPlayed: 0, assignedCourt: 1, isCheckedIn: true, checkedInAt: Date.now() - 5000 },
      { id: '3', name: 'Sam Taylor', rank: 85, gamesPlayed: 0, assignedCourt: 2, isCheckedIn: true, checkedInAt: Date.now() - 4000 },
      { id: '4', name: 'Morgan Smith', rank: 80, gamesPlayed: 0, assignedCourt: 2, isCheckedIn: true, checkedInAt: Date.now() - 3000 },
      { id: '5', name: 'Chris Lee', rank: 75, gamesPlayed: 0, assignedCourt: 3, isCheckedIn: true, checkedInAt: Date.now() - 2000 },
      { id: '6', name: 'Pat Gomez', rank: 70, gamesPlayed: 0, assignedCourt: 3, isCheckedIn: true, checkedInAt: Date.now() - 1000 },
    ];
  });

  const [playerName, setPlayerName] = useState('');
  const [playerRank, setPlayerRank] = useState('');
  const [totalMatches, setTotalMatches] = useState(() => {
    return parseInt(localStorage.getItem('pickleq_matches') || '0', 10);
  });

  // Active Players currently in a live match
  const activeCourtPlayerIds = new Set(
    courts.flatMap((c) => [...c.teamA, ...c.teamB].map((p) => p.id))
  );

  // Checked-In Waiting Pool
  const checkedInQueue = roster.filter(
    (p) => p.isCheckedIn && !activeCourtPlayerIds.has(p.id)
  );

  // LocalStorage Persistence
  useEffect(() => localStorage.setItem('pickleq_court_count', totalCourtCount.toString()), [totalCourtCount]);
  useEffect(() => localStorage.setItem('pickleq_session_active', JSON.stringify(sessionActive)), [sessionActive]);
  useEffect(() => localStorage.setItem('pickleq_courts', JSON.stringify(courts)), [courts]);
  useEffect(() => localStorage.setItem('pickleq_roster', JSON.stringify(roster)), [roster]);
  useEffect(() => localStorage.setItem('pickleq_matches', totalMatches.toString()), [totalMatches]);

  const handleCourtCountChange = (newCount) => {
    const count = Math.max(1, Math.min(10, parseInt(newCount, 10) || 1));
    setTotalCourtCount(count);
    
    setCourts((prevCourts) => {
      if (count > prevCourts.length) {
        const added = Array.from({ length: count - prevCourts.length }, (_, i) => ({
          id: prevCourts.length + i + 1,
          teamA: [],
          teamB: [],
          isLive: false
        }));
        return [...prevCourts, ...added];
      } else {
        return prevCourts.slice(0, count);
      }
    });
  };

  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    const newPlayer = {
      id: Date.now().toString(),
      name: playerName.trim(),
      rank: parseInt(playerRank, 10) || 50,
      gamesPlayed: 0,
      assignedCourt: totalCourtCount, // Initial court tier
      isCheckedIn: false,
      checkedInAt: null
    };

    setRoster((prev) => [...prev, newPlayer]);
    setPlayerName('');
    setPlayerRank('');
  };

  const handleToggleCheckIn = (playerId) => {
    setRoster((prev) =>
      prev.map((p) => {
        if (p.id === playerId) {
          const nextState = !p.isCheckedIn;
          return {
            ...p,
            isCheckedIn: nextState,
            checkedInAt: nextState ? Date.now() : null
          };
        }
        return p;
      })
    );
  };

  const handleRemoveFromRoster = (playerId) => {
    setRoster((prev) => prev.filter((p) => p.id !== playerId));
  };

  // --- DYNAMIC PER-COURT QUEUE FILTERING ---
  // RULE: If gamesPlayed === 0, player appears in ALL courts' queues.
  // Otherwise, player only appears in their specific assigned court queue.
  const getQueueForCourt = (courtId) => {
    return checkedInQueue
      .filter((player) => {
        if (player.gamesPlayed === 0) return true; // 0-Game player added to ALL courts
        return player.assignedCourt === courtId;   // Tier-assigned court after 1st match
      })
      .sort((a, b) => {
        // Unplayed priority -> Lowest games played -> Checked-in time
        if (a.gamesPlayed === 0 && b.gamesPlayed > 0) return -1;
        if (b.gamesPlayed === 0 && a.gamesPlayed > 0) return 1;
        return a.gamesPlayed - b.gamesPlayed || (a.checkedInAt || 0) - (b.checkedInAt || 0);
      });
  };

  // --- DRAFT MATCH FOR INDIVIDUAL COURT ---
  const generateMatchForCourt = (courtId) => {
    if (!sessionActive) {
      alert("Please click 'Start Session' first!");
      return;
    }

    const courtQueue = getQueueForCourt(courtId);

    if (courtQueue.length < 4) {
      alert(`Court 0${courtId} needs at least 4 checked-in players in queue. Currently available: ${courtQueue.length}`);
      return;
    }

    // Pick top 4 from court queue
    const selected = courtQueue.slice(0, 4);

    // Sort 4 selected players by rank descending
    selected.sort((a, b) => b.rank - a.rank);

    // Snake Draft Pairing: Team A (#1 + #4) vs Team B (#2 + #3)
    const teamA = [selected[0], selected[3]];
    const teamB = [selected[1], selected[2]];

    setCourts((prev) =>
      prev.map((c) => {
        if (c.id === courtId) {
          return {
            ...c,
            teamA,
            teamB,
            isLive: true
          };
        }
        return c;
      })
    );
  };

  // --- FINISH MATCH & APPLY STRICT QUEUE MOVEMENT RULES ---
  const handleFinishMatch = (courtId, winningTeamKey) => {
    setCourts((prevCourts) => {
      const courtIndex = prevCourts.findIndex((c) => c.id === courtId);
      const currentCourt = prevCourts[courtIndex];

      const winners = winningTeamKey === 'A' ? currentCourt.teamA : currentCourt.teamB;
      const losers = winningTeamKey === 'A' ? currentCourt.teamB : currentCourt.teamA;

      const updatedStats = new Map();

      // 1. KING COURT (Court 1): Winners retain Court 1, Losers drop to Court 2
      if (courtId === 1) {
        winners.forEach((p) => updatedStats.set(p.id, { gamesPlayed: p.gamesPlayed + 1, assignedCourt: 1 }));
        losers.forEach((p) => updatedStats.set(p.id, { gamesPlayed: p.gamesPlayed + 1, assignedCourt: 2 }));
      } 
      // 2. BOTTOM COURT (Court N): Winners move up to Court N-1, Losers stay in Bottom Court
      else if (courtId === totalCourtCount) {
        winners.forEach((p) => updatedStats.set(p.id, { gamesPlayed: p.gamesPlayed + 1, assignedCourt: courtId - 1 }));
        losers.forEach((p) => updatedStats.set(p.id, { gamesPlayed: p.gamesPlayed + 1, assignedCourt: courtId }));
      } 
      // 3. MIDDLE COURTS: Winners move UP, Losers move DOWN
      else {
        winners.forEach((p) => updatedStats.set(p.id, { gamesPlayed: p.gamesPlayed + 1, assignedCourt: courtId - 1 }));
        losers.forEach((p) => updatedStats.set(p.id, { gamesPlayed: p.gamesPlayed + 1, assignedCourt: courtId + 1 }));
      }

      // Update Roster: Refresh games played & new assigned court tier
      setRoster((prevRoster) =>
        prevRoster.map((player) => {
          if (updatedStats.has(player.id)) {
            const stats = updatedStats.get(player.id);
            return {
              ...player,
              gamesPlayed: stats.gamesPlayed,
              assignedCourt: stats.assignedCourt,
              isCheckedIn: true,
              checkedInAt: Date.now() // Refreshes wait timestamp for the new court queue
            };
          }
          return player;
        })
      );

      // Reset court state
      let newCourts = [...prevCourts];
      newCourts[courtIndex] = { ...currentCourt, teamA: [], teamB: [], isLive: false };

      setTotalMatches((prev) => prev + 1);
      return newCourts;
    });
  };

  const handleResetSession = () => {
    if (window.confirm("Reset all session data, courts, and queues?")) {
      localStorage.clear();
      setSessionActive(false);
      setCourts(Array.from({ length: totalCourtCount }, (_, i) => ({ id: i + 1, teamA: [], teamB: [], isLive: false })));
      setRoster([]);
      setTotalMatches(0);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans antialiased">
      {/* HEADER */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pb-6 mb-8 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400 uppercase">
              PickleQ: King of the Court
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            0 Games = Included in All Courts • King Retain • Winners Up / Losers Down
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setSessionActive((prev) => !prev)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition cursor-pointer shadow-md ${
              sessionActive 
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {sessionActive ? (
              <><StopCircle className="w-4 h-4" /> Pause Session</>
            ) : (
              <><Play className="w-4 h-4 fill-current" /> Start Session</>
            )}
          </button>

          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-3">
            <Flame className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium">MATCHES</div>
              <div className="text-base font-bold text-slate-100">{totalMatches}</div>
            </div>
          </div>

          <button
            onClick={handleResetSession}
            className="p-2.5 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/50 rounded-xl transition cursor-pointer"
            title="Reset Session"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* SETTINGS DASHBOARD */}
      <div className="max-w-7xl mx-auto mb-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-cyan-400" />
          <label className="text-sm font-semibold text-slate-300">Total Active Courts:</label>
          <select
            value={totalCourtCount}
            onChange={(e) => handleCourtCountChange(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-cyan-400 font-bold rounded-lg px-3 py-1.5 text-sm outline-none cursor-pointer focus:border-cyan-400"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'Court' : 'Courts'}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Rule Active: Players with 0 Games appear in ALL court queues</span>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COURTS SECTION */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-400 fill-emerald-400" /> Active Courts & Specific Queues
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-950/60 text-amber-400 border border-amber-800/50 rounded-md flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" /> Court 01 = King Court
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courts.map((court) => {
              const isOccupied = court.teamA.length > 0 || court.teamB.length > 0;
              const isKingCourt = court.id === 1;
              const isBottomCourt = court.id === totalCourtCount;
              const courtQueue = getQueueForCourt(court.id);

              return (
                <div
                  key={court.id}
                  className={`relative bg-slate-900/80 border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                    isKingCourt
                      ? 'border-amber-500/60 shadow-lg shadow-amber-500/10'
                      : 'border-slate-800'
                  }`}
                >
                  <div>
                    {/* COURT TITLE & STATUS */}
                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className={`font-extrabold text-lg ${isKingCourt ? 'text-amber-400' : 'text-cyan-400'}`}>
                          Court 0{court.id}
                        </span>
                        {isKingCourt ? (
                          <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded border border-amber-500/30 uppercase flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-400" /> King Court
                          </span>
                        ) : isBottomCourt ? (
                          <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            Bottom Court
                          </span>
                        ) : (
                          <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            Middle Court
                          </span>
                        )}
                      </div>
                      
                      {isOccupied ? (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/50 border border-emerald-800/40 px-2.5 py-1 rounded-full">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-full">
                          Available
                        </span>
                      )}
                    </div>

                    {/* LIVE MATCH */}
                    {isOccupied ? (
                      <div className="space-y-3 my-2">
                        {/* TEAM A */}
                        <div className="bg-slate-950/60 border-l-4 border-cyan-400 border-y border-r border-slate-800/60 p-3 rounded-lg">
                          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                            Team A (Rank #1 + #4)
                          </span>
                          {court.teamA.map((p) => (
                            <div key={p.id} className="flex justify-between text-sm py-0.5">
                              <span className="font-semibold text-slate-200">{p.name}</span>
                              <span className="text-xs text-slate-400">Rank: {p.rank}</span>
                            </div>
                          ))}
                          
                          <button
                            onClick={() => handleFinishMatch(court.id, 'A')}
                            className="mt-3 w-full py-1.5 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 font-bold text-xs rounded border border-cyan-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> 
                            {isKingCourt 
                              ? 'Team A Wins (Retain King Court)' 
                              : 'Team A Wins (Move Up)'}
                          </button>
                        </div>

                        <div className="text-center text-[10px] font-black text-slate-500 tracking-widest">VS</div>

                        {/* TEAM B */}
                        <div className="bg-slate-950/60 border-l-4 border-rose-500 border-y border-r border-slate-800/60 p-3 rounded-lg">
                          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                            Team B (Rank #2 + #3)
                          </span>
                          {court.teamB.map((p) => (
                            <div key={p.id} className="flex justify-between text-sm py-0.5">
                              <span className="font-semibold text-slate-200">{p.name}</span>
                              <span className="text-xs text-slate-400">Rank: {p.rank}</span>
                            </div>
                          ))}

                          <button
                            onClick={() => handleFinishMatch(court.id, 'B')}
                            className="mt-3 w-full py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-950 font-bold text-xs rounded border border-rose-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> 
                            {isKingCourt 
                              ? 'Team B Wins (Retain King Court)' 
                              : 'Team B Wins (Move Up)'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 px-4 text-center border-2 border-dashed border-slate-800 rounded-xl my-2 flex flex-col items-center justify-center gap-3">
                        <button
                          onClick={() => generateMatchForCourt(court.id)}
                          disabled={!sessionActive || courtQueue.length < 4}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                            sessionActive && courtQueue.length >= 4
                              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/10'
                              : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                          }`}
                        >
                          <Sparkles className="w-4 h-4" /> Snake Draft Court 0{court.id} ({courtQueue.length} Available)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* QUEUE FOR THIS SPECIFIC COURT */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <ListOrdered className="w-3.5 h-3.5 text-cyan-400" /> Court 0{court.id} Queue List
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-950 text-slate-400 rounded-md border border-slate-800">
                        {courtQueue.length} Waiting
                      </span>
                    </div>

                    {courtQueue.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic py-2 text-center">No players currently queued for Court 0{court.id}</p>
                    ) : (
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {courtQueue.map((player, idx) => (
                          <div
                            key={player.id}
                            className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg border text-xs ${
                              player.gamesPlayed === 0
                                ? 'bg-cyan-950/30 border-cyan-500/40'
                                : 'bg-slate-950/70 border-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-bold text-slate-500 text-[10px] w-3">#{idx + 1}</span>
                              <span className="font-medium text-slate-200 truncate">{player.name}</span>
                              {player.gamesPlayed === 0 && (
                                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1 py-0.2 font-black rounded uppercase">
                                  0 Games
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-slate-400">Rank: {player.rank}</span>
                              <span className="text-[9px] bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded font-mono">
                                {player.gamesPlayed}G
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </section>

        {/* ROSTER SIDEBAR */}
        <section className="space-y-6">
          
          {/* ADD PLAYER FORM */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" /> Add Player
            </h2>

            <form onSubmit={handleAddPlayer} className="space-y-3">
              <input
                type="text"
                placeholder="Player Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
              />

              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Rank (1-100)"
                  min="1"
                  max="100"
                  value={playerRank}
                  onChange={(e) => setPlayerRank(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
                />
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition cursor-pointer"
                >
                  Add
                </button>
              </div>
            </form>
          </div>

          {/* VENUE ROSTER LIST */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" /> Roster ({roster.length})
            </h2>

            {roster.length === 0 ? (
              <p className="text-center py-6 text-slate-500 text-sm italic">No players added yet.</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {roster.map((player) => {
                  const isPlaying = activeCourtPlayerIds.has(player.id);

                  return (
                    <div
                      key={player.id}
                      className={`flex justify-between items-center p-3 rounded-xl border transition ${
                        player.isCheckedIn 
                          ? 'bg-emerald-950/30 border-emerald-500/40' 
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-200">{player.name}</span>
                          <span className="text-[10px] text-slate-400">Rank: {player.rank}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Played: <span className="text-cyan-400 font-bold">{player.gamesPlayed}</span> | Status: {' '}
                          <span className="text-amber-400 font-bold">
                            {player.gamesPlayed === 0 ? 'All Courts' : `Court 0${player.assignedCourt}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPlaying ? (
                          <span className="text-[10px] font-bold px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg">
                            On Court
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleCheckIn(player.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                              player.isCheckedIn
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                            }`}
                          >
                            {player.isCheckedIn ? (
                              <><UserX className="w-3.5 h-3.5" /> Check Out</>
                            ) : (
                              <><UserCheck className="w-3.5 h-3.5" /> Check In</>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => handleRemoveFromRoster(player.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </section>

      </main>
    </div>
  );
}
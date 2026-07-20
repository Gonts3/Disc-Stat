import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  BookOpen, 
  Zap, 
  BarChart3, 
  Download, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Calendar, 
  FileText, 
  TrendingUp, 
  Smartphone,
  Award,
  ChevronRight,
  Info,
  RotateCcw
} from "lucide-react";
import { Player, AttendanceRecord, PracticeLog, ScrimmageMatch } from "./types";
import { DEFAULT_PLAYERS, exportToCSV, generateSingleFileHTML } from "./utils";

export default function App() {
  // --- Persistent States ---
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem("discforce_players");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(p => ({
            ...p,
            throwaways: p.throwaways ?? 0,
            drops: p.drops ?? 0
          }));
        }
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_PLAYERS;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem("discforce_attendance");
    return saved ? JSON.parse(saved) : [];
  });

  const [practiceLogs, setPracticeLogs] = useState<PracticeLog[]>(() => {
    const saved = localStorage.getItem("discforce_practice_logs");
    return saved ? JSON.parse(saved) : [];
  });

  const [matches, setMatches] = useState<ScrimmageMatch[]>(() => {
    const saved = localStorage.getItem("discforce_matches");
    return saved ? JSON.parse(saved) : [];
  });

  // --- UI States ---
  const [currentTab, setCurrentTab] = useState<"roster" | "practice" | "scrimmage" | "export">("roster");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{ playerId: string; field: keyof Omit<Player, "id" | "name">; prevValue: number } | null>(null);
  const [filterPresentOnly, setFilterPresentOnly] = useState<boolean>(true);

  // --- Form States ---
  const [newPlayerName, setNewPlayerName] = useState("");
  
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [tempAttendance, setTempAttendance] = useState<Record<string, boolean>>({});

  const [practiceDate, setPracticeDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [practiceFocus, setPracticeFocus] = useState("");
  const [practiceNotes, setPracticeNotes] = useState("");

  const [matchDate, setMatchDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [matchOpponent, setMatchOpponent] = useState("Light vs Dark");
  const [lightScore, setLightScore] = useState(0);
  const [darkScore, setDarkScore] = useState(0);

  // --- Synchronize with localStorage ---
  useEffect(() => {
    localStorage.setItem("discforce_players", JSON.stringify(players));
    if (players.length > 0 && !selectedPlayerId) {
      setSelectedPlayerId(players[0].id);
    }
  }, [players]);

  useEffect(() => {
    localStorage.setItem("discforce_attendance", JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem("discforce_practice_logs", JSON.stringify(practiceLogs));
  }, [practiceLogs]);

  useEffect(() => {
    localStorage.setItem("discforce_matches", JSON.stringify(matches));
  }, [matches]);

  // --- Load Attendance for selected date ---
  useEffect(() => {
    const record = attendance.find(r => r.date === attendanceDate);
    const initialMap: Record<string, boolean> = {};
    players.forEach(p => {
      // Default to present if there is no attendance log for this date yet
      initialMap[p.id] = record ? record.presentIds.includes(p.id) : true;
    });
    setTempAttendance(initialMap);
  }, [attendanceDate, players, attendance]);

  // --- Helper to trigger a toast notification ---
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // --- Actions ---
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPlayerName.trim();
    if (!name) return;

    const newPlayer: Player = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      goals: 0,
      assists: 0,
      ds: 0,
      turnovers: 0,
      throwaways: 0,
      drops: 0
    };

    setPlayers([...players, newPlayer]);
    setNewPlayerName("");
    triggerToast(`Added ${name} to Roster!`);
  };

  const handleRemovePlayer = (id: string, name: string) => {
    if (confirm(`Remove ${name} from the roster? Historical stats remain, but they won't appear on active tracking sheets.`)) {
      setPlayers(players.filter(p => p.id !== id));
      triggerToast(`Removed ${name}`);
    }
  };

  const handleSaveAttendance = () => {
    const presentIds = Object.entries(tempAttendance)
      .filter(([_, isPresent]) => isPresent)
      .map(([id]) => id);

    // Filter out previous attendance record of the same date
    const updatedAttendance = attendance.filter(r => r.date !== attendanceDate);
    const newRecord: AttendanceRecord = {
      id: Math.random().toString(36).substring(2, 9),
      date: attendanceDate,
      presentIds
    };

    setAttendance([...updatedAttendance, newRecord]);
    triggerToast(`Attendance saved for ${attendanceDate}!`);
  };

  const toggleAttendancePlayer = (playerId: string) => {
    setTempAttendance(prev => ({
      ...prev,
      [playerId]: !prev[playerId]
    }));
  };

  const handleSavePracticeLog = (e: React.FormEvent) => {
    e.preventDefault();
    const focus = practiceFocus.trim();
    const notes = practiceNotes.trim();
    if (!focus || !notes) return;

    const newLog: PracticeLog = {
      id: Math.random().toString(36).substring(2, 9),
      date: practiceDate,
      focus,
      notes
    };

    setPracticeLogs([newLog, ...practiceLogs]);
    setPracticeFocus("");
    setPracticeNotes("");
    triggerToast("Practice log saved!");
  };

  const handleDeletePracticeLog = (id: string) => {
    if (confirm("Delete this practice log record?")) {
      setPracticeLogs(practiceLogs.filter(l => l.id !== id));
      triggerToast("Deleted log entry");
    }
  };

  const handleSaveMatch = (e: React.FormEvent) => {
    e.preventDefault();
    const opponent = matchOpponent.trim() || "Light vs Dark";

    const newMatch: ScrimmageMatch = {
      id: Math.random().toString(36).substring(2, 9),
      date: matchDate,
      opponent,
      ourScore: lightScore,
      opponentScore: darkScore
    };

    setMatches([newMatch, ...matches]);
    setLightScore(0);
    setDarkScore(0);
    triggerToast("Scrimmage match saved!");
  };

  const handleDeleteMatch = (id: string) => {
    if (confirm("Delete this match record?")) {
      setMatches(matches.filter(m => m.id !== id));
      triggerToast("Deleted match record");
    }
  };

  const adjustStat = (field: keyof Omit<Player, "id" | "name">, amount: number) => {
    if (!selectedPlayerId) {
      triggerToast("Please select a player first!");
      return;
    }

    setPlayers(prevPlayers => prevPlayers.map(p => {
      if (p.id === selectedPlayerId) {
        const newVal = Math.max(0, p[field] + amount);
        setLastAction({ playerId: p.id, field, prevValue: p[field] });
        return { ...p, [field]: newVal };
      }
      return p;
    }));
  };

  const sidelineLogStat = (playerId: string, field: keyof Omit<Player, "id" | "name">, amount: number) => {
    setPlayers(prevPlayers => prevPlayers.map(p => {
      if (p.id === playerId) {
        const newVal = Math.max(0, p[field] + amount);
        setLastAction({ playerId, field, prevValue: p[field] });
        return { ...p, [field]: newVal };
      }
      return p;
    }));

    const p = players.find(player => player.id === playerId);
    if (p) {
      const fieldLabels: Record<keyof Omit<Player, "id" | "name">, string> = {
        goals: "Goal 🥏",
        assists: "Assist 🤝",
        ds: "D (Block) 🚫",
        turnovers: "Turnover ⚠️",
        throwaways: "Throwaway ☄️",
        drops: "Drop 🪂"
      };
      triggerToast(`${p.name}: +1 ${fieldLabels[field]}`);
    }
  };

  const undoLastAction = () => {
    if (!lastAction) return;
    setPlayers(prevPlayers => prevPlayers.map(p => {
      if (p.id === lastAction.playerId) {
        return { ...p, [lastAction.field]: lastAction.prevValue };
      }
      return p;
    }));
    const player = players.find(p => p.id === lastAction.playerId);
    triggerToast(`Undid stat change for ${player ? player.name : "player"}`);
    setLastAction(null);
  };

  const handleDownloadCSV = () => {
    exportToCSV(players, attendance, practiceLogs, matches);
    triggerToast("CSV Downloaded!");
  };

  const handleDownloadSingleFile = () => {
    const htmlCode = generateSingleFileHTML(players, attendance, practiceLogs, matches);
    const blob = new Blob([htmlCode], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "discforce_ultimate_manager.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Offline App File Downloaded!");
  };

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  // Sorting Leaderboard by Overall Contributions: Goals + Assists + D's - Turnovers
  const leaderboardPlayers = [...players].sort((a, b) => {
    const scoreA = a.goals + a.assists + a.ds - a.turnovers;
    const scoreB = b.goals + b.assists + b.ds - b.turnovers;
    return scoreB - scoreA;
  });

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col pb-24 font-sans select-none">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-full shadow-xl font-bold text-xs tracking-wide flex items-center space-x-2 border border-slate-700/50"
          >
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER BAR */}
      <header className="bg-slate-900 text-white py-4 px-6 sticky top-0 z-40 shadow-md flex justify-between items-center max-w-md mx-auto w-full md:rounded-b-2xl border-b border-slate-800">
        <div className="flex items-center space-x-2">
          {/* Stylized flying disc svg */}
          <svg className="w-7 h-7 text-sky-400 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(-30 12 12)" />
          </svg>
          <span className="text-xl font-black tracking-widest text-sky-400">DISCFORCE</span>
        </div>
        <div className="flex items-center space-x-1 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black text-slate-300 font-mono tracking-wider">LOCAL DATA</span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-grow w-full max-w-md mx-auto p-4 md:p-6 overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: ROSTER & ATTENDANCE */}
          {currentTab === "roster" && (
            <motion.div
              key="roster"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">Attendance</h2>
                  <p className="text-xs text-slate-500 font-medium">Track who turned up to throw</p>
                </div>
                <span className="bg-sky-100 text-sky-800 text-xs px-3 py-1 rounded-full font-extrabold shadow-sm">
                  {players.length} Players
                </span>
              </div>

              {/* Add Player Input Form */}
              <form onSubmit={handleAddPlayer} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex space-x-2">
                <input
                  type="text"
                  placeholder="Add player name..."
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="flex-grow px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                />
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 active:scale-95 text-white px-4 py-2.5 rounded-xl font-black text-sm transition-all flex items-center space-x-1 shadow-md shadow-sky-500/10"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </form>

              {/* Attendance Tracker Card */}
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-sky-500" />
                    <span className="text-sm font-bold text-slate-700">Practice Date</span>
                  </div>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50"
                  />
                </div>

                {/* Checklist of Players */}
                <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                  {players.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">
                      No players in roster yet. Please add a player using the input above!
                    </div>
                  ) : (
                    players.map(player => {
                      const isPresent = !!tempAttendance[player.id];
                      return (
                        <div key={player.id} className="flex items-center justify-between py-3">
                          <span className="font-bold text-slate-800 text-sm truncate max-w-[180px]">
                            {player.name}
                          </span>

                          <div className="flex items-center space-x-4">
                            {/* Thumb-Optimized Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => toggleAttendancePlayer(player.id)}
                              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
                                isPresent ? "bg-sky-600" : "bg-slate-200"
                              }`}
                            >
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                  isPresent ? "translate-x-8" : "translate-x-1"
                                }`}
                              />
                            </button>
                            <span className={`text-xs font-black w-14 text-center ${isPresent ? "text-sky-600" : "text-slate-400"}`}>
                              {isPresent ? "Present" : "Absent"}
                            </span>

                            {/* Detach option */}
                            <button
                              type="button"
                              onClick={() => handleRemovePlayer(player.id, player.name)}
                              className="text-slate-300 hover:text-rose-500 p-1 active:scale-90 transition-transform"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Save Button */}
                {players.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSaveAttendance}
                    className="w-full bg-slate-900 hover:bg-slate-800 active:scale-98 text-white py-3.5 rounded-2xl font-extrabold text-sm transition-all shadow-md flex justify-center items-center space-x-2"
                  >
                    <Check className="w-4 h-4 text-sky-400" />
                    <span>Save Today's Attendance</span>
                  </button>
                )}
              </div>

              {/* Attendance Records List */}
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-3">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Attendance History</h3>
                {attendance.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No practice logs saved yet.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {[...attendance]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map(record => {
                        const totalPlayers = players.length;
                        // Count present players that are still in our active roster
                        const presentCount = record.presentIds.filter(id => players.some(p => p.id === id)).length;

                        return (
                          <div key={record.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs font-bold text-slate-700">{record.date}</span>
                            </div>
                            <span className="bg-sky-100 text-sky-800 text-[10px] px-2 py-1 rounded font-extrabold">
                              {presentCount}/{totalPlayers} Present
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: PRACTICE LOG */}
          {currentTab === "practice" && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Practice Log</h2>
                <p className="text-xs text-slate-500 font-medium">Record drills run, focus areas, and coaching points</p>
              </div>

              {/* New Log Entry Form */}
              <form onSubmit={handleSavePracticeLog} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                <div className="grid grid-cols-3 gap-3 items-center">
                  <label className="text-xs font-black text-slate-500 uppercase">Session Date</label>
                  <input
                    type="date"
                    value={practiceDate}
                    onChange={(e) => setPracticeDate(e.target.value)}
                    required
                    className="col-span-2 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-500 uppercase">Practice Focus</label>
                  <input
                    type="text"
                    placeholder="e.g., Vertical stack, cup defense, hucks..."
                    value={practiceFocus}
                    onChange={(e) => setPracticeFocus(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-500 uppercase">Detailed Notes & Drills</label>
                  <textarea
                    placeholder="Write session specifics, wind adjustments, and areas needing improvement..."
                    value={practiceNotes}
                    onChange={(e) => setPracticeNotes(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-sky-600 hover:bg-sky-700 active:scale-98 text-white py-3.5 rounded-2xl font-black text-sm transition-all shadow-md flex justify-center items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Practice Log</span>
                </button>
              </form>

              {/* History list */}
              <div className="space-y-3">
                <h3 className="text-base font-black tracking-tight text-slate-800">Session History</h3>
                {practiceLogs.length === 0 ? (
                  <div className="bg-white p-8 text-center text-slate-400 rounded-2xl border border-slate-100 text-sm italic">
                    No session notes recorded yet. Save one above to build history!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {practiceLogs.map(log => (
                      <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-2 relative">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-1.5 text-xs text-sky-600 font-bold">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{log.date}</span>
                          </div>
                          <button
                            onClick={() => handleDeletePracticeLog(log.id)}
                            className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <h4 className="font-extrabold text-slate-800 text-sm flex items-center space-x-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.focus}</span>
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap pl-5 border-l-2 border-slate-100">
                          {log.notes}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: SCRIMMAGE & STATS MERGED TRACKER */}
          {currentTab === "scrimmage" && (
            <motion.div
              key="scrimmage"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">Scrimmage & Stats</h2>
                  <p className="text-xs text-slate-500 font-medium font-semibold">Keep scores and log live player statistics simultaneously from the sideline</p>
                </div>
              </div>

              {/* SECTION 1: LIVE GAME SCOREBOARD */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-5 rounded-3xl shadow-lg border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-sky-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Scrimmage Date & Opponent</span>
                  </div>
                  <input
                    type="date"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    required
                    className="border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-950"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={matchOpponent}
                      onChange={(e) => setMatchOpponent(e.target.value)}
                      placeholder="e.g. Scrimmage Drill or Opponent Name"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Scoreboard Column Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Light Team (White styling) */}
                  <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl text-center space-y-3 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-white/40"></div>
                    <span className="block text-[10px] font-black text-slate-300 uppercase tracking-wider">Light Team</span>
                    <div className="text-5xl font-black text-white font-mono">{lightScore}</div>
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setLightScore(prev => Math.max(0, prev - 1))}
                        className="w-10 h-10 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center font-black text-lg text-slate-300 active:bg-slate-800 active:scale-95 transition-transform"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setLightScore(prev => prev + 1)}
                        className="w-12 h-12 rounded-full bg-white text-slate-950 flex items-center justify-center font-black text-2xl shadow-sm active:bg-slate-200 active:scale-95 transition-transform"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Dark Team (Navy styling) */}
                  <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl text-center space-y-3 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500/80"></div>
                    <span className="block text-[10px] font-black text-sky-400 uppercase tracking-wider">Dark Team</span>
                    <div className="text-5xl font-black text-white font-mono">{darkScore}</div>
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setDarkScore(prev => Math.max(0, prev - 1))}
                        className="w-10 h-10 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center font-black text-lg text-slate-300 active:bg-slate-800 active:scale-95 transition-transform"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setDarkScore(prev => prev + 1)}
                        className="w-12 h-12 rounded-full bg-sky-600 flex items-center justify-center font-black text-2xl text-white shadow-md shadow-sky-500/20 active:bg-sky-700 active:scale-95 transition-transform"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveMatch}
                  className="w-full bg-slate-800 hover:bg-slate-750 active:scale-98 text-white py-3 rounded-xl font-black text-xs transition-all flex justify-center items-center space-x-2 border border-slate-700"
                >
                  <Check className="w-4 h-4 text-sky-400" />
                  <span>Save Scrimmage Match Score</span>
                </button>
              </div>

              {/* SECTION 2: SIDELINE QUICK STAT CLICKER */}
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-amber-500 animate-bounce" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Sideline Quick Stat Clicker</h3>
                  </div>
                  {lastAction && (
                    <button
                      type="button"
                      onClick={undoLastAction}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-lg font-black flex items-center space-x-1 border border-rose-200 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Undo Last</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                  <span className="text-[11px] font-bold text-slate-500">Only show active present players on {matchDate}</span>
                  <button
                    type="button"
                    onClick={() => setFilterPresentOnly(!filterPresentOnly)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                      filterPresentOnly ? "bg-sky-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        filterPresentOnly ? "translate-x-4" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Player list for quick sideline stats logging */}
                <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1 space-y-2">
                  {players.length === 0 ? (
                    <p className="text-center text-slate-400 py-6 text-xs italic">No roster players found to log.</p>
                  ) : (
                    players
                      .filter(p => {
                        if (!filterPresentOnly) return true;
                        const matchDateAttendance = attendance.find(r => r.date === matchDate);
                        return matchDateAttendance ? matchDateAttendance.presentIds.includes(p.id) : true;
                      })
                      .map(p => (
                        <div key={p.id} className="flex flex-col py-2.5 space-y-2 border-b border-slate-100 last:border-b-0">
                          {/* Name and high-density stats overview */}
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-slate-800 text-sm truncate max-w-[150px]">
                              {p.name}
                            </span>
                            <div className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold text-slate-500 flex space-x-2">
                              <span className="text-emerald-700">G:{p.goals}</span>
                              <span className="text-sky-700">A:{p.assists}</span>
                              <span className="text-indigo-700">D:{p.ds}</span>
                              <span className="text-rose-700">T:{p.turnovers}</span>
                              <span className="text-amber-700">TA:{p.throwaways ?? 0}</span>
                              <span className="text-teal-700">DP:{p.drops ?? 0}</span>
                            </div>
                          </div>

                          {/* Quick touch point action logger layout */}
                          <div className="grid grid-cols-6 gap-1.5">
                            {/* +Goal */}
                            <button
                              type="button"
                              onClick={() => sidelineLogStat(p.id, "goals", 1)}
                              className="bg-emerald-500 hover:bg-emerald-600 active:scale-90 text-white rounded-xl py-2 font-black text-xs shadow-sm flex flex-col items-center justify-center transition-all"
                              title="Log Goal"
                            >
                              <span className="text-[8px] font-bold text-emerald-100 leading-none">GOAL</span>
                              <span className="text-[11px] font-black">+G</span>
                            </button>

                            {/* +Assist */}
                            <button
                              type="button"
                              onClick={() => sidelineLogStat(p.id, "assists", 1)}
                              className="bg-sky-500 hover:bg-sky-600 active:scale-90 text-white rounded-xl py-2 font-black text-xs shadow-sm flex flex-col items-center justify-center transition-all"
                              title="Log Assist"
                            >
                              <span className="text-[8px] font-bold text-sky-100 leading-none">ASST</span>
                              <span className="text-[11px] font-black">+A</span>
                            </button>

                            {/* +D (Block) */}
                            <button
                              type="button"
                              onClick={() => sidelineLogStat(p.id, "ds", 1)}
                              className="bg-indigo-500 hover:bg-indigo-600 active:scale-90 text-white rounded-xl py-2 font-black text-xs shadow-sm flex flex-col items-center justify-center transition-all"
                              title="Log Defensive Block"
                            >
                              <span className="text-[8px] font-bold text-indigo-100 leading-none">D-BLK</span>
                              <span className="text-[11px] font-black">+D</span>
                            </button>

                            {/* +Turnover */}
                            <button
                              type="button"
                              onClick={() => sidelineLogStat(p.id, "turnovers", 1)}
                              className="bg-rose-500 hover:bg-rose-600 active:scale-90 text-white rounded-xl py-2 font-black text-xs shadow-sm flex flex-col items-center justify-center transition-all"
                              title="Log Turnover"
                            >
                              <span className="text-[8px] font-bold text-rose-100 leading-none">TURN</span>
                              <span className="text-[11px] font-black">+T</span>
                            </button>

                            {/* +Throwaway (Bad Throw) */}
                            <button
                              type="button"
                              onClick={() => sidelineLogStat(p.id, "throwaways", 1)}
                              className="bg-amber-500 hover:bg-amber-600 active:scale-90 text-white rounded-xl py-2 font-black text-xs shadow-sm flex flex-col items-center justify-center transition-all"
                              title="Log Throwaway / Bad Throw"
                            >
                              <span className="text-[8px] font-bold text-amber-100 leading-none">THROW</span>
                              <span className="text-[11px] font-black">+TA</span>
                            </button>

                            {/* +Drop */}
                            <button
                              type="button"
                              onClick={() => sidelineLogStat(p.id, "drops", 1)}
                              className="bg-teal-500 hover:bg-teal-600 active:scale-90 text-white rounded-xl py-2 font-black text-xs shadow-sm flex flex-col items-center justify-center transition-all"
                              title="Log Dropped Pass"
                            >
                              <span className="text-[8px] font-bold text-teal-100 leading-none">DROP</span>
                              <span className="text-[11px] font-black">+DP</span>
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* SECTION 3: DEEP STAT CORRECTIONS & PLAYER SELECTOR */}
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                <div>
                  <div className="flex items-center space-x-1 mb-2">
                    <Users className="w-4 h-4 text-sky-500" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Detailed Player Stat Corrector</h3>
                  </div>
                  <select
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-bold text-slate-700"
                  >
                    {players.length === 0 ? (
                      <option value="">No players in roster</option>
                    ) : (
                      players.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))
                    )}
                  </select>
                </div>

                {selectedPlayer ? (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Goals */}
                    <div className="bg-emerald-50/50 border border-emerald-100/60 p-3 rounded-xl text-center space-y-1 shadow-sm">
                      <span className="text-[9px] font-black text-emerald-800 tracking-wider uppercase">Goals</span>
                      <div className="text-2xl font-black text-emerald-900">{selectedPlayer.goals}</div>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => adjustStat("goals", -1)}
                          className="flex-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold py-1 text-xs active:scale-95 transition-transform"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustStat("goals", 1)}
                          className="flex-1 bg-emerald-600 text-white rounded-lg font-black py-1 text-xs hover:bg-emerald-700 active:scale-95 transition-transform"
                        >
                          +1
                        </button>
                      </div>
                    </div>

                    {/* Assists */}
                    <div className="bg-sky-50/50 border border-sky-100/60 p-3 rounded-xl text-center space-y-1 shadow-sm">
                      <span className="text-[9px] font-black text-sky-800 tracking-wider uppercase">Assists</span>
                      <div className="text-2xl font-black text-sky-900">{selectedPlayer.assists}</div>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => adjustStat("assists", -1)}
                          className="flex-1 bg-white hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg font-bold py-1 text-xs active:scale-95 transition-transform"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustStat("assists", 1)}
                          className="flex-1 bg-sky-600 text-white rounded-lg font-black py-1 text-xs hover:bg-sky-700 active:scale-95 transition-transform"
                        >
                          +1
                        </button>
                      </div>
                    </div>

                    {/* D's (Blocks) */}
                    <div className="bg-indigo-50/50 border border-indigo-100/60 p-3 rounded-xl text-center space-y-1 shadow-sm">
                      <span className="text-[9px] font-black text-indigo-800 tracking-wider uppercase">D's (Blocks)</span>
                      <div className="text-2xl font-black text-indigo-900">{selectedPlayer.ds}</div>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => adjustStat("ds", -1)}
                          className="flex-1 bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg font-bold py-1 text-xs active:scale-95 transition-transform"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustStat("ds", 1)}
                          className="flex-1 bg-indigo-600 text-white rounded-lg font-black py-1 text-xs hover:bg-indigo-700 active:scale-95 transition-transform"
                        >
                          +1
                        </button>
                      </div>
                    </div>

                    {/* Turnovers */}
                    <div className="bg-rose-50/50 border border-rose-100/60 p-3 rounded-xl text-center space-y-1 shadow-sm">
                      <span className="text-[9px] font-black text-rose-800 tracking-wider uppercase">Turnovers</span>
                      <div className="text-2xl font-black text-rose-900">{selectedPlayer.turnovers}</div>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => adjustStat("turnovers", -1)}
                          className="flex-1 bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg font-bold py-1 text-xs active:scale-95 transition-transform"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustStat("turnovers", 1)}
                          className="flex-1 bg-rose-600 text-white rounded-lg font-black py-1 text-xs hover:bg-rose-700 active:scale-95 transition-transform"
                        >
                          +1
                        </button>
                      </div>
                    </div>

                    {/* Throwaways */}
                    <div className="bg-amber-50/50 border border-amber-100/60 p-3 rounded-xl text-center space-y-1 shadow-sm">
                      <span className="text-[9px] font-black text-amber-800 tracking-wider uppercase">Throwaways</span>
                      <div className="text-2xl font-black text-amber-900">{selectedPlayer.throwaways ?? 0}</div>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => adjustStat("throwaways", -1)}
                          className="flex-1 bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold py-1 text-xs active:scale-95 transition-transform"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustStat("throwaways", 1)}
                          className="flex-1 bg-amber-600 text-white rounded-lg font-black py-1 text-xs hover:bg-amber-700 active:scale-95 transition-transform"
                        >
                          +1
                        </button>
                      </div>
                    </div>

                    {/* Drops */}
                    <div className="bg-teal-50/50 border border-teal-100/60 p-3 rounded-xl text-center space-y-1 shadow-sm">
                      <span className="text-[9px] font-black text-teal-800 tracking-wider uppercase">Drops</span>
                      <div className="text-2xl font-black text-teal-900">{selectedPlayer.drops ?? 0}</div>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => adjustStat("drops", -1)}
                          className="flex-1 bg-white hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-bold py-1 text-xs active:scale-95 transition-transform"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustStat("drops", 1)}
                          className="flex-1 bg-teal-600 text-white rounded-lg font-black py-1 text-xs hover:bg-teal-700 active:scale-95 transition-transform"
                        >
                          +1
                        </button>
                      </div>
                    </div>

                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-2">No player selected for detailed stat edits.</p>
                )}
              </div>

              {/* SECTION 4: LIVE TEAM STATS LEDGER */}
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Live Team Stats Ledger</h3>
                  <div className="flex items-center text-[9px] text-slate-400 font-bold space-x-1.5">
                    <span>G:Goals</span>
                    <span>A:Assists</span>
                    <span>D:Ds</span>
                    <span>T:Turnovers</span>
                    <span>TA:Throwaways</span>
                    <span>DP:Drops</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold">
                        <th className="py-2 pl-1 text-[11px]">Player</th>
                        <th className="py-2 text-center w-8 text-[11px]">G</th>
                        <th className="py-2 text-center w-8 text-[11px]">A</th>
                        <th className="py-2 text-center w-8 text-[11px]">D</th>
                        <th className="py-2 text-center w-8 text-[11px]">T</th>
                        <th className="py-2 text-center w-8 text-[11px]">TA</th>
                        <th className="py-2 text-center w-8 text-[11px]">DP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-600 font-semibold">
                      {players.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-400 italic text-[11px]">
                            No player stats logged yet.
                          </td>
                        </tr>
                      ) : (
                        [...players]
                          .sort((a, b) => {
                            // Sort by overall positive contribution: goals + assists + ds - (turnovers + throwaways + drops)
                            const contributionA = a.goals + a.assists + a.ds - (a.turnovers + (a.throwaways ?? 0) + (a.drops ?? 0));
                            const contributionB = b.goals + b.assists + b.ds - (b.turnovers + (b.throwaways ?? 0) + (b.drops ?? 0));
                            return contributionB - contributionA;
                          })
                          .map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-2.5 pl-1 font-extrabold text-slate-800 text-[11px] truncate max-w-[100px]">{p.name}</td>
                              <td className="py-2.5 text-center text-emerald-600 font-bold text-[11px]">{p.goals}</td>
                              <td className="py-2.5 text-center text-sky-600 font-bold text-[11px]">{p.assists}</td>
                              <td className="py-2.5 text-center text-indigo-600 font-bold text-[11px]">{p.ds}</td>
                              <td className="py-2.5 text-center text-rose-500 font-bold text-[11px]">{p.turnovers}</td>
                              <td className="py-2.5 text-center text-amber-600 font-bold text-[11px]">{p.throwaways ?? 0}</td>
                              <td className="py-2.5 text-center text-teal-600 font-bold text-[11px]">{p.drops ?? 0}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 5: HISTORICAL MATCH SCORES LIST */}
              <div className="space-y-3">
                <h3 className="text-base font-black tracking-tight text-slate-800">Scrimmage Match History</h3>
                {matches.length === 0 ? (
                  <div className="bg-white p-8 text-center text-slate-400 rounded-2xl border border-slate-100 text-xs italic">
                    No scrimmage matches recorded yet. Save a completed score above to keep tabs.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matches.map(m => {
                      const won = m.ourScore > m.opponentScore;
                      const lost = m.ourScore < m.opponentScore;
                      const isTie = m.ourScore === m.opponentScore;
                      const badgeBg = won ? "bg-slate-50 border border-slate-200 text-slate-800" : lost ? "bg-slate-900 text-white border border-slate-800" : "bg-sky-50 border border-sky-150 text-sky-800";
                      const badgeLabel = won ? "Light Win 🏆" : lost ? "Dark Win 🏆" : "Draw 🤝";

                      return (
                        <div key={m.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center relative">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{m.date}</span>
                            <h4 className="font-extrabold text-slate-800 text-xs">{m.opponent}</h4>
                            <p className="text-base font-black text-slate-900">
                              <span className="text-slate-500 font-bold text-xs">Light </span>
                              {m.ourScore} 
                              <span className="text-[10px] font-semibold text-slate-400 mx-1">to</span> 
                              {m.opponentScore}
                              <span className="text-slate-400 font-bold text-xs"> Dark</span>
                            </p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className={`${badgeBg} px-2 py-1 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm border`}>
                              {badgeLabel}
                            </span>
                            <button
                              onClick={() => handleDeleteMatch(m.id)}
                              className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                              title="Delete Match Record"
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
            </motion.div>
          )}

          {/* TAB 5: EXPORT & ANDROID INSTRUCTIONS */}
          {currentTab === "export" && (
            <motion.div
              key="export"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Export & Setup</h2>
                <p className="text-xs text-slate-500 font-medium">Backup your data or run the tool entirely local</p>
              </div>

              {/* Data Portability Box */}
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center space-x-2 text-slate-700">
                  <TrendingUp className="w-5 h-5 text-sky-500" />
                  <h3 className="font-extrabold text-slate-800 text-sm">Data Portability Tools</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Your stats, scrimmage results, attendance records, and notes are securely preserved inside your local phone browser. You can export or backup at any time.
                </p>

                <div className="grid grid-cols-1 gap-3.5">
                  {/* Download CSV button */}
                  <button
                    onClick={handleDownloadCSV}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white py-3.5 px-4 rounded-2xl font-black text-sm transition-all shadow-md flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4.5 h-4.5 text-emerald-200" />
                    <span>Download Stats as CSV</span>
                  </button>

                  {/* Single-File HTML App bundle download */}
                  <button
                    onClick={handleDownloadSingleFile}
                    className="w-full bg-sky-600 hover:bg-sky-700 active:scale-98 text-white py-3.5 px-4 rounded-2xl font-black text-sm transition-all shadow-md flex items-center justify-center space-x-2"
                  >
                    <Smartphone className="w-4.5 h-4.5 text-sky-200" />
                    <span>Download Standalone HTML App</span>
                  </button>
                </div>
              </div>

              {/* Android Add to Home Screen Instructions */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-3xl shadow-lg border border-slate-800 space-y-4">
                <div className="flex items-center space-x-2.5">
                  <Award className="w-6 h-6 text-sky-400" />
                  <h3 className="text-lg font-black tracking-wide">Run as Android Home App</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                  Make this tool feel like a premium native utility on your phone! By doing this, you can open it directly from your Android home screen with zero internet connection required, right on the field.
                </p>

                <div className="border-t border-slate-800 pt-3 space-y-3 text-xs font-bold">
                  <div className="flex items-start space-x-2.5">
                    <span className="bg-sky-500/20 text-sky-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">1</span>
                    <p className="text-slate-300">
                      Open this application in Chrome or Firefox on your Android browser, or open the downloaded Standalone HTML app.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <span className="bg-sky-500/20 text-sky-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">2</span>
                    <p className="text-slate-300">
                      Tap the <strong className="text-white">three vertical dots</strong> (&vellip;) in Chrome's top-right corner, or bottom-right in Firefox.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <span className="bg-sky-500/20 text-sky-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">3</span>
                    <p className="text-slate-300">
                      Select <strong class="text-sky-400">"Add to Home screen"</strong> from the popup option menu.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <span className="bg-sky-500/20 text-sky-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">4</span>
                    <p className="text-slate-300">
                      Give it a clean name like <strong class="text-white">"DiscForce"</strong> and press Add. The icon is now ready to use offline!
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* BOTTOM THUMB NAVIGATION RAIL */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 text-slate-400 z-45 shadow-2xl max-w-md mx-auto rounded-t-2xl">
        <div className="grid grid-cols-4 h-16 text-[10px] font-black">
          {/* Tab 1: Attendance */}
          <button
            onClick={() => setCurrentTab("roster")}
            className={`flex flex-col items-center justify-center space-y-1 active:scale-95 transition-transform ${
              currentTab === "roster" ? "text-sky-400" : "text-slate-400"
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Roster</span>
          </button>

          {/* Tab 2: Practice Focus */}
          <button
            onClick={() => setCurrentTab("practice")}
            className={`flex flex-col items-center justify-center space-y-1 active:scale-95 transition-transform ${
              currentTab === "practice" ? "text-sky-400" : "text-slate-400"
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Practice</span>
          </button>

          {/* Tab 3: Scrimmage & Stats */}
          <button
            onClick={() => setCurrentTab("scrimmage")}
            className={`flex flex-col items-center justify-center space-y-1 active:scale-95 transition-transform ${
              currentTab === "scrimmage" ? "text-sky-400" : "text-slate-400"
            }`}
          >
            <Zap className="w-5 h-5" />
            <span>Scrimmage & Stats</span>
          </button>

          {/* Tab 4: Export */}
          <button
            onClick={() => setCurrentTab("export")}
            className={`flex flex-col items-center justify-center space-y-1 active:scale-95 transition-transform ${
              currentTab === "export" ? "text-sky-400" : "text-slate-400"
            }`}
          >
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
        </div>
      </nav>

    </div>
  );
}

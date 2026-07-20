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
  ChevronDown,
  ChevronUp,
  Info,
  RotateCcw,
  Camera,
  UploadCloud,
  Eye
} from "lucide-react";
import { Player, AttendanceRecord, PracticeLog, ScrimmageMatch } from "./types";
import { DEFAULT_PLAYERS, exportToCSV, generateSingleFileHTML } from "./utils";

export default function App() {
  // --- Persistent States ---
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem("discstat_players") || localStorage.getItem("discforce_players");
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
    const saved = localStorage.getItem("discstat_attendance") || localStorage.getItem("discforce_attendance");
    return saved ? JSON.parse(saved) : [];
  });

  const [practiceLogs, setPracticeLogs] = useState<PracticeLog[]>(() => {
    const saved = localStorage.getItem("discstat_practice_logs") || localStorage.getItem("discforce_practice_logs");
    return saved ? JSON.parse(saved) : [];
  });

  const [matches, setMatches] = useState<ScrimmageMatch[]>(() => {
    const saved = localStorage.getItem("discstat_matches") || localStorage.getItem("discforce_matches");
    return saved ? JSON.parse(saved) : [];
  });

  // --- UI States ---
  const [currentTab, setCurrentTab] = useState<"attendance" | "scrimmage" | "export">("attendance");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{ playerId: string; field: keyof Omit<Player, "id" | "name">; prevValue: number } | null>(null);
  const [filterPresentOnly, setFilterPresentOnly] = useState<boolean>(false);

  // --- Form States ---
  const [newPlayerName, setNewPlayerName] = useState("");
  
  const [practiceDate, setPracticeDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [practiceFocus, setPracticeFocus] = useState("");
  const [practiceNotes, setPracticeNotes] = useState("");
  const [sessionAttendees, setSessionAttendees] = useState<string[]>([]);
  const [attendeeInput, setAttendeeInput] = useState("");
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [expandedLogIds, setExpandedLogIds] = useState<string[]>([]);

  const [matchDate, setMatchDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [matchOpponent, setMatchOpponent] = useState("Light vs Dark");
  const [lightScore, setLightScore] = useState(0);
  const [darkScore, setDarkScore] = useState(0);

  // --- Photo Upload, Lightbox & Delete confirmation States ---
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);

  // --- Synchronize with localStorage ---
  useEffect(() => {
    localStorage.setItem("discstat_players", JSON.stringify(players));
    if (players.length > 0 && !selectedPlayerId) {
      setSelectedPlayerId(players[0].id);
    }
  }, [players]);

  useEffect(() => {
    localStorage.setItem("discstat_attendance", JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem("discstat_practice_logs", JSON.stringify(practiceLogs));
  }, [practiceLogs]);

  useEffect(() => {
    localStorage.setItem("discstat_matches", JSON.stringify(matches));
  }, [matches]);

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

  const handleAddAttendee = () => {
    const name = attendeeInput.trim();
    if (!name) return;
    if (sessionAttendees.includes(name)) {
      triggerToast(`${name} is already added!`);
      return;
    }
    setSessionAttendees([...sessionAttendees, name]);
    setAttendeeInput("");
  };

  const handleRemoveAttendee = (name: string) => {
    setSessionAttendees(sessionAttendees.filter(n => n !== name));
  };

  const handleSavePracticeLog = (e: React.FormEvent) => {
    e.preventDefault();
    const focus = practiceFocus.trim();
    const notes = practiceNotes.trim();
    if (!focus || !notes) return;
    if (sessionAttendees.length === 0) {
      triggerToast("Please add at least one attendee to save log!");
      return;
    }

    // Save as a neat comma-separated string
    const att = sessionAttendees.join(", ");

    const newLog: PracticeLog = {
      id: Math.random().toString(36).substring(2, 9),
      date: practiceDate,
      focus,
      notes,
      attendance: att,
      photo: uploadedPhoto || undefined
    };

    setPracticeLogs([newLog, ...practiceLogs]);
    setPracticeFocus("");
    setPracticeNotes("");
    setSessionAttendees([]);
    setAttendeeInput("");
    setUploadedPhoto(null);
    triggerToast("Practice log and attendance saved!");
  };

  const handleDeletePracticeLog = (id: string) => {
    setPracticeLogs(practiceLogs.filter(l => l.id !== id));
    triggerToast("Deleted log entry");
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

  const handleDownloadSingleFile = async () => {
    triggerToast("Preparing offline bundle...");
    let tailwindCode = "";
    try {
      const res = await fetch("https://cdn.tailwindcss.com");
      if (res.ok) {
        tailwindCode = await res.text();
      }
    } catch (e) {
      console.warn("Could not pre-fetch Tailwind CDN for offline packaging, falling back to CDN script tag.", e);
    }

    const htmlCode = generateSingleFileHTML(players, attendance, practiceLogs, matches, tailwindCode);
    const blob = new Blob([htmlCode], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "discstat_ultimate_manager.html";
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
          <span className="text-xl font-black tracking-widest text-sky-400">DISCSTAT</span>
        </div>
        <div className="flex items-center space-x-1 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black text-slate-300 font-mono tracking-wider">LOCAL DATA</span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-grow w-full max-w-md mx-auto p-4 md:p-6 overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: ATTENDANCE & PRACTICE LOGS */}
          {currentTab === "attendance" && (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Attendance & Practice</h2>
                <p className="text-xs text-slate-500 font-semibold">Record drills run, focus areas, and who attended</p>
              </div>

              {/* Combined Log Entry Form */}
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-500 uppercase">Detailed Notes & Drills</label>
                  <textarea
                    placeholder="Write session specifics, wind adjustments, and drills run..."
                    value={practiceNotes}
                    onChange={(e) => setPracticeNotes(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold leading-relaxed text-slate-800"
                  />
                </div>

                {/* Who Attended - Single name input & add */}
                <div className="space-y-3">
                  <label className="block text-xs font-black text-slate-500 uppercase">Who Attended? (Attendance)</label>
                  
                  {/* Row input */}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Type name of attendee..."
                      value={attendeeInput}
                      onChange={(e) => setAttendeeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddAttendee();
                        }
                      }}
                      className="flex-grow px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={handleAddAttendee}
                      className="bg-slate-900 hover:bg-slate-800 active:scale-95 text-white px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center space-x-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Registered Roster Quick Toggles */}
                  {players.length > 0 && (
                    <div className="bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100 space-y-1.5">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Quick Select from Registered Roster:</span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-0.5">
                        {players.map(p => {
                          const isAdded = sessionAttendees.includes(p.name);
                          return (
                            <button
                              type="button"
                              key={p.id}
                              onClick={() => {
                                if (isAdded) {
                                  setSessionAttendees(sessionAttendees.filter(n => n !== p.name));
                                } else {
                                  setSessionAttendees([...sessionAttendees, p.name]);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center space-x-1 ${
                                isAdded
                                  ? "bg-sky-600 border-sky-600 text-white shadow-sm"
                                  : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                              }`}
                            >
                              <span>{p.name}</span>
                              {isAdded && <Check className="w-3 h-3" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Selected Attendees List */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Current Attendance List:</span>
                      <span className="bg-sky-100 text-sky-800 text-[10px] px-2.5 py-0.5 rounded-full font-black">
                        {sessionAttendees.length} Attending
                      </span>
                    </div>
                    {sessionAttendees.length === 0 ? (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100 border-dashed text-center">
                        No attendees added yet. Add names above or click from registered roster.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100 max-h-32 overflow-y-auto">
                        {sessionAttendees.map((name, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center space-x-1.5 bg-sky-50 text-sky-800 border border-sky-100 px-2.5 py-1 rounded-xl text-xs font-bold shadow-sm"
                          >
                            <span>{name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttendee(name)}
                              className="text-sky-600 hover:text-rose-500 font-bold transition-colors focus:outline-none"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* End of Session Photo Upload Option */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-500 uppercase flex items-center space-x-1.5">
                    <Camera className="w-3.5 h-3.5 text-sky-500" />
                    <span>End of Session Photo (Our Tradition 📸)</span>
                  </label>
                  
                  {uploadedPhoto ? (
                    <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-2.5 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={uploadedPhoto} 
                          alt="End of session preview" 
                          className="w-14 h-14 object-cover rounded-xl border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-700">Tradition Photo Loaded!</p>
                          <p className="text-[10px] text-slate-400 font-medium">Will save with notes below</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedPhoto(null)}
                        className="p-1.5 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-colors mr-1"
                        title="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (typeof event.target?.result === "string") {
                              setUploadedPhoto(event.target.result);
                              triggerToast("Tradition photo loaded!");
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                        isDragging 
                          ? "border-sky-500 bg-sky-50/50" 
                          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/50"
                      }`}
                      onClick={() => {
                        const fileInput = document.getElementById("practice-photo-upload");
                        fileInput?.click();
                      }}
                    >
                      <input
                        id="practice-photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (typeof event.target?.result === "string") {
                                setUploadedPhoto(event.target.result);
                                triggerToast("Tradition photo loaded!");
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-black text-slate-700">Drag & drop your tradition photo here</p>
                      <p className="text-[10px] text-slate-400 mt-1">or click to browse from device</p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-sky-600 hover:bg-sky-700 active:scale-98 text-white py-3.5 rounded-2xl font-black text-sm transition-all shadow-md flex justify-center items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Practice & Attendance Log</span>
                </button>
              </form>

              {/* Session History List */}
              <div className="space-y-3">
                <h3 className="text-base font-black tracking-tight text-slate-800">Session History</h3>
                {practiceLogs.length === 0 ? (
                  <div className="bg-white p-8 text-center text-slate-400 rounded-2xl border border-slate-100 text-sm italic">
                    No session notes recorded yet. Save one above to build history!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {practiceLogs.map(log => {
                      const isExpanded = expandedLogIds.includes(log.id);
                      return (
                        <div
                          key={log.id}
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedLogIds(expandedLogIds.filter(id => id !== log.id));
                            } else {
                              setExpandedLogIds([...expandedLogIds, log.id]);
                            }
                          }}
                          className={`bg-white p-4 rounded-2xl shadow-sm border transition-all cursor-pointer select-none relative ${
                            isExpanded ? "border-sky-500 ring-1 ring-sky-100" : "border-slate-100 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-1.5 text-xs text-sky-600 font-bold">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{log.date}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {/* Delete confirmation or trash icon */}
                              <div onClick={(e) => e.stopPropagation()} className="relative z-10 flex items-center">
                                {deletingLogId === log.id ? (
                                  <div className="flex items-center space-x-1 bg-rose-50 border border-rose-100 p-1 rounded-xl">
                                    <span className="text-[9px] font-black text-rose-700 uppercase px-1">Delete?</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleDeletePracticeLog(log.id);
                                        setDeletingLogId(null);
                                      }}
                                      className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] px-2 py-1 rounded transition-colors"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingLogId(null)}
                                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-[9px] px-2 py-1 rounded transition-colors"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingLogId(log.id)}
                                    className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                                    title="Delete Session Log"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              {/* Expansion Indicator */}
                              <div className="text-slate-400">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-sky-500" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-1">
                            <h4 className="font-extrabold text-slate-800 text-sm flex items-center space-x-1.5">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              <span>{log.focus}</span>
                            </h4>
                            {!isExpanded && log.attendance && (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                {log.attendance.split(",").length} Attended
                              </span>
                            )}
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="space-y-3 mt-3 pt-3 border-t border-slate-100 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                              {log.notes && (
                                <div className="space-y-1">
                                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Session Notes & Drills</span>
                                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap pl-3.5 border-l-2 border-sky-400">
                                    {log.notes}
                                  </p>
                                </div>
                              )}

                              {log.attendance && (
                                <div className="space-y-1.5">
                                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                                    <Users className="w-3 h-3 text-sky-500" />
                                    <span>Who Attended ({log.attendance.split(",").length})</span>
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {log.attendance.split(",").map(name => name.trim()).filter(Boolean).map((name, idx) => (
                                      <span key={idx} className="bg-slate-50 text-slate-750 border border-slate-200 px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center shadow-sm">
                                        <span className="text-sky-500 mr-1">•</span>
                                        <span>{name}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Tradition photo preview */}
                              {log.photo && (
                                <div className="space-y-1.5">
                                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                                    <Camera className="w-3 h-3 text-sky-500" />
                                    <span>Session Tradition Photo</span>
                                  </span>
                                  <div 
                                    className="relative group max-w-xs cursor-zoom-in" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLightboxPhoto(log.photo || null);
                                    }}
                                  >
                                    <img 
                                      src={log.photo} 
                                      alt="End of Session Tradition" 
                                      className="rounded-xl border border-slate-100 max-h-40 w-full object-cover shadow-sm group-hover:brightness-95 transition-all"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                      <Eye className="w-5 h-5 text-white drop-shadow" />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Team Roster Management Section (Purely for Stats Tracker reference) */}
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-sky-500" />
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Team Roster (For Scrimmage Stats)</span>
                  </div>
                  <span className="bg-sky-50 text-sky-800 text-[10px] px-2.5 py-1 rounded-full font-black border border-sky-100">
                    {players.length} Registered
                  </span>
                </div>

                {/* Add Player Input Form */}
                <form onSubmit={handleAddPlayer} className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Register new player..."
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    className="flex-grow px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold text-slate-800"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 active:scale-95 text-white px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center space-x-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register</span>
                  </button>
                </form>

                {/* Roster list purely with remove button */}
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                  {players.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">No roster players registered yet.</p>
                  ) : (
                    players.map(player => (
                      <div key={player.id} className="flex items-center justify-between py-2 text-sm font-semibold text-slate-800">
                        <span>{player.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPlayers(players.filter(p => p.id !== player.id));
                            triggerToast(`Removed ${player.name} from registered roster`);
                          }}
                          className="text-slate-300 hover:text-rose-500 p-1 active:scale-90 transition-transform"
                          title="Unregister Player"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
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
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-150 space-y-4 text-slate-800">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-sky-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Scrimmage Date & Opponent</span>
                  </div>
                  <input
                    type="date"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    required
                    className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={matchOpponent}
                      onChange={(e) => setMatchOpponent(e.target.value)}
                      placeholder="e.g. Scrimmage Drill or Opponent Name"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Scoreboard Column Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Light Team (White styling) */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-3 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-sky-400"></div>
                    <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Light Team</span>
                    <div className="text-5xl font-black text-slate-900 font-mono">{lightScore}</div>
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setLightScore(prev => Math.max(0, prev - 1))}
                        className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-black text-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 active:scale-95 transition-transform"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setLightScore(prev => prev + 1)}
                        className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-sm active:bg-slate-800 active:scale-95 transition-transform"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Dark Team (Navy/Slate styling) */}
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center space-y-3 shadow-md relative overflow-hidden text-white">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
                    <span className="block text-[10px] font-black text-sky-400 uppercase tracking-wider">Dark Team</span>
                    <div className="text-5xl font-black text-white font-mono">{darkScore}</div>
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setDarkScore(prev => Math.max(0, prev - 1))}
                        className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-lg text-slate-300 hover:bg-slate-700 active:scale-95 transition-transform"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setDarkScore(prev => prev + 1)}
                        className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center font-black text-2xl shadow-sm hover:bg-slate-100 active:scale-95 transition-transform"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveMatch}
                  className="w-full bg-slate-900 hover:bg-slate-800 active:scale-98 text-white py-3.5 rounded-2xl font-black text-sm transition-all flex justify-center items-center space-x-2 shadow-sm"
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
                  <span className="text-[11px] font-bold text-slate-500">Click actions to log live player stats for scrimmage</span>
                  <span className="bg-slate-200 text-slate-700 text-[9px] px-2 py-0.5 rounded-md font-black">
                    {players.length} Players
                  </span>
                </div>

                {/* Player list for quick sideline stats logging */}
                <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1 space-y-2">
                  {players.length === 0 ? (
                    <p className="text-center text-slate-400 py-6 text-xs italic">No roster players found to log.</p>
                  ) : (
                    players.map(p => (
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
                              <span className="text-teal-700">DP:{p.drops ?? 0}</span>
                            </div>
                          </div>

                          {/* Quick touch point action logger layout */}
                          <div className="grid grid-cols-5 gap-1.5">
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
                        <th className="py-2 text-center w-8 text-[11px]">DP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-600 font-semibold">
                      {players.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400 italic text-[11px]">
                            No player stats logged yet.
                          </td>
                        </tr>
                      ) : (
                        [...players]
                          .sort((a, b) => {
                            // Sort by overall positive contribution: goals + assists + ds - (turnovers + drops)
                            const contributionA = a.goals + a.assists + a.ds - (a.turnovers + (a.drops ?? 0));
                            const contributionB = b.goals + b.assists + b.ds - (b.turnovers + (b.drops ?? 0));
                            return contributionB - contributionA;
                          })
                          .map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-2.5 pl-1 font-extrabold text-slate-800 text-[11px] truncate max-w-[100px]">{p.name}</td>
                              <td className="py-2.5 text-center text-emerald-600 font-bold text-[11px]">{p.goals}</td>
                              <td className="py-2.5 text-center text-sky-600 font-bold text-[11px]">{p.assists}</td>
                              <td className="py-2.5 text-center text-indigo-600 font-bold text-[11px]">{p.ds}</td>
                              <td className="py-2.5 text-center text-rose-500 font-bold text-[11px]">{p.turnovers}</td>
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

                      // Background highlights: light background for Light won, dark background for Dark won
                      const cardBg = won 
                        ? "bg-slate-50/90 border-slate-200" 
                        : lost 
                          ? "bg-slate-900 border-slate-850 text-white" 
                          : "bg-white border-slate-150";

                      const textMuted = lost ? "text-slate-400" : "text-slate-400";
                      const textPrimary = lost ? "text-slate-200" : "text-slate-800";
                      const textScore = lost ? "text-white" : "text-slate-900";

                      const badgeBg = won 
                        ? "bg-white border-slate-300 text-slate-800" 
                        : lost 
                          ? "bg-slate-800 border-slate-700 text-white" 
                          : "bg-slate-100 border-slate-200 text-slate-500";

                      // Winner label: says Light Win or Opponent/Dark Win based on top text input
                      const isDefaultOpp = !m.opponent || m.opponent.trim().toLowerCase() === "light vs dark" || m.opponent.trim().toLowerCase() === "dark";
                      const badgeLabel = won 
                        ? "Light Win 🏆" 
                        : lost 
                          ? (isDefaultOpp ? "Dark Win 🏆" : `${m.opponent} Win 🏆`) 
                          : "Draw 🤝";

                      return (
                        <div key={m.id} className={`${cardBg} p-4 rounded-2xl shadow-sm border flex justify-between items-center relative transition-all`}>
                          <div className="space-y-1">
                            <span className={`text-[9px] font-black uppercase tracking-wider ${textMuted}`}>{m.date}</span>
                            <h4 className={`font-extrabold text-xs ${textPrimary}`}>{m.opponent}</h4>
                            <p className={`text-base font-black ${textScore}`}>
                              <span className="text-xs font-bold text-slate-400">Light </span>
                              {m.ourScore} 
                              <span className="text-[10px] font-semibold text-slate-400 mx-1">to</span> 
                              {m.opponentScore}
                              <span className="text-xs font-bold text-slate-400"> Dark</span>
                            </p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className={`${badgeBg} px-2.5 py-1 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm border`}>
                              {badgeLabel}
                            </span>
                            
                            {deletingMatchId === m.id ? (
                              <div className="flex items-center space-x-1 bg-rose-50 border border-rose-100 p-1 rounded-xl">
                                <span className="text-[9px] font-black text-rose-700 uppercase px-1">Delete?</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setMatches(matches.filter(item => item.id !== m.id));
                                    setDeletingMatchId(null);
                                    triggerToast("Deleted scrimmage record");
                                  }}
                                  className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] px-2 py-1 rounded transition-colors"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDeletingMatchId(null);
                                  }}
                                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-[9px] px-2 py-1 rounded transition-colors"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDeletingMatchId(m.id);
                                }}
                                className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                                title="Delete Match Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
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
                      Select <strong className="text-sky-400">"Add to Home screen"</strong> from the popup option menu.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <span className="bg-sky-500/20 text-sky-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">4</span>
                    <p className="text-slate-300">
                      Give it a clean name like <strong className="text-white">"DiscStat"</strong> and press Add. The icon is now ready to use offline!
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
        <div className="grid grid-cols-3 h-16 text-[10px] font-black">
          {/* Tab 1: Attendance & Practice */}
          <button
            onClick={() => setCurrentTab("attendance")}
            className={`flex flex-col items-center justify-center space-y-1 active:scale-95 transition-transform ${
              currentTab === "attendance" ? "text-sky-400" : "text-slate-400"
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Attendance</span>
          </button>

          {/* Tab 2: Scrimmage & Stats */}
          <button
            onClick={() => setCurrentTab("scrimmage")}
            className={`flex flex-col items-center justify-center space-y-1 active:scale-95 transition-transform ${
              currentTab === "scrimmage" ? "text-sky-400" : "text-slate-400"
            }`}
          >
            <Zap className="w-5 h-5" />
            <span>Scrimmage & Stats</span>
          </button>

          {/* Tab 3: Export */}
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

      {/* LIGHTBOX MODAL FOR TRADITION PHOTOS */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setLightboxPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-lg w-full bg-slate-900 rounded-3xl p-3 border border-slate-800 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={lightboxPhoto} 
                alt="Enlarged Tradition Photo" 
                className="w-full h-auto max-h-[70vh] object-contain rounded-2xl border border-slate-800 bg-slate-950"
                referrerPolicy="no-referrer"
              />
              <div className="flex justify-between items-center mt-3 px-2">
                <span className="text-[11px] font-bold text-slate-400 flex items-center space-x-1">
                  <Camera className="w-3.5 h-3.5 text-sky-500" />
                  <span>Session Tradition Photo</span>
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxPhoto(null)}
                  className="bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-black transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

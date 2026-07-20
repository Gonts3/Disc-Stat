import { Player, AttendanceRecord, PracticeLog, ScrimmageMatch } from "./types";

export const DEFAULT_PLAYERS: Player[] = [
  { id: "1", name: "Alex Carter", goals: 14, assists: 18, ds: 9, turnovers: 4, throwaways: 3, drops: 2 },
  { id: "2", name: "Jordan Miller", goals: 10, assists: 15, ds: 6, turnovers: 5, throwaways: 4, drops: 1 },
  { id: "3", name: "Taylor Reece", goals: 22, assists: 8, ds: 14, turnovers: 3, throwaways: 2, drops: 4 },
  { id: "4", name: "Sam Rivera", goals: 6, assists: 25, ds: 5, turnovers: 7, throwaways: 6, drops: 2 },
  { id: "5", name: "Chris Evans", goals: 15, assists: 12, ds: 11, turnovers: 4, throwaways: 3, drops: 3 },
  { id: "6", name: "Morgan Taylor", goals: 8, assists: 9, ds: 17, turnovers: 2, throwaways: 1, drops: 1 },
  { id: "7", name: "Casey Zhang", goals: 12, assists: 11, ds: 7, turnovers: 5, throwaways: 4, drops: 2 },
  { id: "8", name: "Pat Kennedy", goals: 5, assists: 20, ds: 4, turnovers: 8, throwaways: 5, drops: 3 },
  { id: "9", name: "Drew Sterling", goals: 19, assists: 6, ds: 10, turnovers: 4, throwaways: 3, drops: 2 },
  { id: "10", name: "Jamie Vance", goals: 9, assists: 13, ds: 8, turnovers: 6, throwaways: 4, drops: 2 }
];

export function exportToCSV(players: Player[], attendance: AttendanceRecord[], logs: PracticeLog[], matches: ScrimmageMatch[]) {
  // 1. Players Stats CSV
  let csvContent = "";
  
  csvContent += "=== PLAYER STATS ===\n";
  csvContent += "Player Name,Goals,Assists,D's (Deflection/Blocks),Turnovers,Throwaways (Bad Throws),Drops\n";
  players.forEach(p => {
    csvContent += `"${p.name.replace(/"/g, '""')}",${p.goals},${p.assists},${p.ds},${p.turnovers},${p.throwaways ?? 0},${p.drops ?? 0}\n`;
  });

  // 2. Attendance CSV
  csvContent += "\n=== ATTENDANCE RECORDS ===\n";
  csvContent += "Date,Present Players\n";
  attendance.forEach(att => {
    const presentNames = att.presentIds
      .map(id => players.find(p => p.id === id)?.name || "Unknown")
      .map(name => `• ${name}`)
      .join("\n");
    csvContent += `"${att.date}","${presentNames.replace(/"/g, '""')}"\n`;
  });

  // 3. Practice Logs CSV
  csvContent += "\n=== PRACTICE LOGS ===\n";
  csvContent += "Date,Focus Area,Who Attended,Session Notes & Drills\n";
  logs.forEach(log => {
    const attendees = log.attendance 
      ? log.attendance.split(",").map(name => `• ${name.trim()}`).join("\n") 
      : "";
    const notesFormatted = log.notes
      ? log.notes.split("\n").map(line => line.trim()).filter(Boolean).map(line => line.startsWith("•") || line.startsWith("-") ? line : `• ${line}`).join("\n")
      : "";
    csvContent += `"${log.date}","${log.focus.replace(/"/g, '""')}","${attendees.replace(/"/g, '""')}","${notesFormatted.replace(/"/g, '""')}"\n`;
  });

  // 4. Scrimmage Matches CSV
  csvContent += "\n=== SCRIMMAGE MATCHES ===\n";
  csvContent += "Date,Opponent,Our Score,Opponent Score,Result\n";
  matches.forEach(m => {
    const result = m.ourScore > m.opponentScore ? "Win" : m.ourScore < m.opponentScore ? "Loss" : "Tie";
    csvContent += `"${m.date}","${m.opponent.replace(/"/g, '""')}",${m.ourScore},${m.opponentScore},${result}\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `ultimate_frisbee_stats_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateSingleFileHTML(players: Player[], attendance: AttendanceRecord[], logs: PracticeLog[], matches: ScrimmageMatch[]): string {
  // We serialize the initial state from the client to bundle their current data straight into the file
  const serializedData = JSON.stringify({ players, attendance, practiceLogs: logs, matches });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>DiscForce - Ultimate Frisbee Manager</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* Prevent text selection and long-press menus on mobile for an app-like feel */
    body {
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
      font-family: system-ui, -apple-system, sans-serif;
    }
    input, textarea {
      -webkit-user-select: text;
      user-select: text;
    }
    /* Simple custom scrollbars */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #f1f5f9;
    }
    ::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col pb-24">

  <!-- TOP HEADER BAR -->
  <header class="bg-slate-900 text-white py-4 px-6 sticky top-0 z-50 shadow-md flex justify-between items-center">
    <div class="flex items-center space-x-2">
      <!-- Embedded Disc Logo -->
      <svg class="w-7 h-7 text-sky-400 animate-pulse" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <ellipse cx="12" cy="12" rx="10" ry="3" transform="rotate(-30 12 12)" />
      </svg>
      <span class="text-xl font-black tracking-wider text-sky-400">DISCFORCE</span>
    </div>
    <div class="text-xs text-slate-300 font-mono">OFFLINE MODE</div>
  </header>

  <!-- MAIN CONTAINER (Centered & constrained for desktop, fluid for mobile) -->
  <main class="flex-grow w-full max-w-md mx-auto p-4 md:p-6" id="app-container">
    
    <!-- ROSTER / ATTENDANCE SECTION -->
    <section id="section-roster" class="app-section space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-slate-800">Attendance & Roster</h2>
        <span class="bg-sky-100 text-sky-800 text-xs px-2.5 py-1 rounded-full font-semibold" id="roster-count">0 Players</span>
      </div>

      <!-- Add Player Quick Input -->
      <form id="add-player-form" class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex space-x-2">
        <input type="text" id="new-player-name" placeholder="Quick Add Player Name..." required
          class="flex-grow px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm">
        <button type="submit" class="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center space-x-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
          <span>Add</span>
        </button>
      </form>

      <!-- Date Selection for Attendance -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
        <div class="flex items-center justify-between">
          <label class="text-sm font-semibold text-slate-600">Attendance Date</label>
          <input type="date" id="attendance-date" class="border border-slate-200 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-sky-500">
        </div>
        
        <!-- Attendance Checklist Container -->
        <div id="attendance-list" class="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
          <!-- Dynamic checklist rows -->
        </div>

        <button id="save-attendance-btn" class="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-sm flex justify-center items-center space-x-2">
          <svg class="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
          <span>Save Today's Attendance</span>
        </button>
      </div>

      <!-- Attendance History -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
        <h3 class="text-sm font-bold text-slate-700">Past Attendance Sessions</h3>
        <div id="attendance-history" class="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
          <!-- Dynamic past items -->
        </div>
      </div>
    </section>

    <!-- PRACTICE LOG SECTION -->
    <section id="section-practice" class="app-section space-y-6 hidden">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-slate-800">Practice Log</h2>
      </div>

      <!-- New Practice Log Form -->
      <form id="practice-form" class="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Session Date</label>
          <input type="date" id="practice-date" required
            class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Practice Focus</label>
          <input type="text" id="practice-focus" placeholder="e.g. Endzone plays, Cup defense, Hucks..." required
            class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Session Notes & Drill Details</label>
          <textarea id="practice-notes" rows="4" placeholder="Drills run, attendance highlights, wind conditions..." required
            class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm"></textarea>
        </div>

        <button type="submit" class="w-full bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-sm flex justify-center items-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          <span>Save Practice Log</span>
        </button>
      </form>

      <!-- Past Logs List -->
      <div class="space-y-3">
        <h3 class="text-lg font-bold text-slate-800">Session History</h3>
        <div id="practice-logs-list" class="space-y-3">
          <!-- Dynamic logs -->
        </div>
      </div>
    </section>

    <!-- SCRIMMAGE SCORES SECTION -->
    <section id="section-scrimmage" class="app-section space-y-6 hidden">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-slate-800">Scrimmage Scores</h2>
      </div>

      <!-- New Match Record Form -->
      <form id="match-form" class="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center space-x-2">
            <svg class="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span class="text-xs font-bold text-slate-500 uppercase">Scrimmage Date</span>
          </div>
          <input type="date" id="match-date" required
            class="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-50">
        </div>

        <!-- Scoreboard Column Grid -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Light Team (White styling) -->
          <div class="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center space-y-3 shadow-sm">
            <span class="block text-xs font-bold text-slate-600 uppercase tracking-wider">Light Team</span>
            <div class="text-5xl font-black text-slate-800" id="light-score-display">0</div>
            <input type="hidden" id="match-our-score" value="0">
            <div class="flex items-center justify-center space-x-2">
              <button type="button" onclick="adjustLightScore(-1)"
                class="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-lg text-slate-600 active:bg-slate-200 active:scale-95 transition-transform">
                -
              </button>
              <button type="button" onclick="adjustLightScore(1)"
                class="w-12 h-12 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center font-bold text-2xl text-slate-800 shadow-sm active:bg-slate-200 active:scale-95 transition-transform">
                +
              </button>
            </div>
          </div>

          <!-- Dark Team (Navy styling) -->
          <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center space-y-3 shadow-sm text-white">
            <span class="block text-xs font-bold text-slate-300 uppercase tracking-wider">Dark Team</span>
            <div class="text-5xl font-black text-white" id="dark-score-display">0</div>
            <input type="hidden" id="match-their-score" value="0">
            <div class="flex items-center justify-center space-x-2">
              <button type="button" onclick="adjustDarkScore(-1)"
                class="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-lg text-slate-300 active:bg-slate-700 active:scale-95 transition-transform">
                -
              </button>
              <button type="button" onclick="adjustDarkScore(1)"
                class="w-12 h-12 rounded-full bg-sky-600 flex items-center justify-center font-bold text-2xl text-white shadow-md active:bg-sky-700 active:scale-95 transition-transform">
                +
              </button>
            </div>
          </div>
        </div>

        <button type="submit" class="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md flex justify-center items-center space-x-2">
          <svg class="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
          <span>Save Scrimmage Score</span>
        </button>
      </form>

      <!-- SIDELINE QUICK STAT LOGGER -->
      <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-1.5">
            <svg class="w-4 h-4 text-amber-500 animate-bounce" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Sideline Quick Stat Clicker</h3>
          </div>
          <button type="button" id="sideline-undo-btn" onclick="undoLastSidelineAction()" class="hidden bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs px-2.5 py-1 rounded font-bold flex items-center space-x-1 border border-rose-200 transition-colors">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            <span>Undo</span>
          </button>
        </div>

        <div class="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span class="text-xs font-bold text-slate-500">Filter list by present players only</span>
          <button type="button" onclick="toggleSidelineFilter()" id="sideline-filter-toggle"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-sky-600 focus:outline-none">
            <span id="sideline-filter-dot" class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6"></span>
          </button>
        </div>

        <!-- Player list for quick sideline stats logging -->
        <div id="sideline-players-list" class="divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1 space-y-2">
          <!-- Dynamically populated sideline player rows -->
        </div>
      </div>

      <!-- Scrimmage History List -->
      <div class="space-y-3">
        <h3 class="text-lg font-bold text-slate-800">Scrimmage Match Records</h3>
        <div id="matches-list" class="space-y-3">
          <!-- Dynamic matches -->
        </div>
      </div>
    </section>

    <!-- STATS TRACKER SECTION -->
    <section id="section-stats" class="app-section space-y-6 hidden">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-slate-800">Player Stats</h2>
      </div>

      <!-- Select Player Card -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Player to Edit</label>
          <select id="stats-player-select" onchange="loadPlayerStats()"
            class="w-full p-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium">
            <!-- Dynamic players -->
          </select>
        </div>

        <!-- Grid of Large Thumb-Friendly Counters -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Goals (G) -->
          <div class="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col justify-between items-center">
            <span class="text-xs font-extrabold text-emerald-800 uppercase tracking-widest">GOALS</span>
            <div class="text-4xl font-black text-emerald-900 my-2" id="stat-val-goals">0</div>
            <div class="flex space-x-2 w-full">
              <button onclick="incrementStat('goals', -1)" class="flex-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-black py-2 rounded-xl text-lg">-</button>
              <button onclick="incrementStat('goals', 1)" class="flex-1 bg-emerald-600 text-white font-black py-2 rounded-xl text-lg hover:bg-emerald-700 active:scale-95 transition-all shadow-sm">+1</button>
            </div>
          </div>

          <!-- Assists (A) -->
          <div class="bg-sky-50 border border-sky-100 p-4 rounded-2xl flex flex-col justify-between items-center">
            <span class="text-xs font-extrabold text-sky-800 uppercase tracking-widest">ASSISTS</span>
            <div class="text-4xl font-black text-sky-900 my-2" id="stat-val-assists">0</div>
            <div class="flex space-x-2 w-full">
              <button onclick="incrementStat('assists', -1)" class="flex-1 bg-white hover:bg-sky-100 text-sky-900 border border-sky-200 font-black py-2 rounded-xl text-lg">-</button>
              <button onclick="incrementStat('assists', 1)" class="flex-1 bg-sky-600 text-white font-black py-2 rounded-xl text-lg hover:bg-sky-700 active:scale-95 transition-all shadow-sm">+1</button>
            </div>
          </div>

          <!-- D's (D) -->
          <div class="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex flex-col justify-between items-center">
            <span class="text-xs font-extrabold text-indigo-800 uppercase tracking-widest">D'S (BLOCKS)</span>
            <div class="text-4xl font-black text-indigo-900 my-2" id="stat-val-ds">0</div>
            <div class="flex space-x-2 w-full">
              <button onclick="incrementStat('ds', -1)" class="flex-1 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-black py-2 rounded-xl text-lg">-</button>
              <button onclick="incrementStat('ds', 1)" class="flex-1 bg-indigo-600 text-white font-black py-2 rounded-xl text-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm">+1</button>
            </div>
          </div>

          <!-- Turnovers (T) -->
          <div class="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex flex-col justify-between items-center">
            <span class="text-xs font-extrabold text-rose-800 uppercase tracking-widest">TURNOVERS</span>
            <div class="text-4xl font-black text-rose-900 my-2" id="stat-val-turnovers">0</div>
            <div class="flex space-x-2 w-full">
              <button onclick="incrementStat('turnovers', -1)" class="flex-1 bg-white hover:bg-rose-100 text-rose-900 border border-rose-200 font-black py-2 rounded-xl text-lg">-</button>
              <button onclick="incrementStat('turnovers', 1)" class="flex-1 bg-rose-600 text-white font-black py-2 rounded-xl text-lg hover:bg-rose-700 active:scale-95 transition-all shadow-sm">+1</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Roster Stats Table Summary -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h3 class="text-sm font-bold text-slate-700 mb-3">Team Leaderboard</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-100 text-slate-400 font-semibold">
                <th class="py-2">Player</th>
                <th class="py-2 text-center">G</th>
                <th class="py-2 text-center">A</th>
                <th class="py-2 text-center">D</th>
                <th class="py-2 text-center">T</th>
              </tr>
            </thead>
            <tbody id="stats-leaderboard-body" class="divide-y divide-slate-50 text-slate-600 font-medium">
              <!-- Dynamic table rows -->
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- EXPORT & DEVICE INTEGRATION -->
    <section id="section-export" class="app-section space-y-6 hidden">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-slate-800">Export & Setup</h2>
      </div>

      <!-- Download Buttons -->
      <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-4">
        <h3 class="text-base font-bold text-slate-800">Data Portability</h3>
        <p class="text-xs text-slate-500 leading-relaxed">
          Your team's stats, practice notes, and attendance records are stored locally on this browser. You can export them at any time.
        </p>

        <!-- CSV Export -->
        <button id="export-csv-btn" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center space-x-2">
          <svg class="w-5 h-5 text-emerald-200" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Download Stats as CSV</span>
        </button>

        <!-- Single-File HTML Download -->
        <button id="export-html-btn" class="w-full bg-sky-600 hover:bg-sky-700 text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center space-x-2">
          <svg class="w-5 h-5 text-sky-200" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span>Get Offline Single-File HTML App</span>
        </button>
      </div>

      <!-- Add to Home Screen Instructions for Android -->
      <div class="bg-gradient-to-br from-sky-500 to-indigo-600 text-white p-5 rounded-2xl shadow-md space-y-3">
        <div class="flex items-center space-x-2">
          <!-- Smartphone Icon -->
          <svg class="w-6 h-6 text-sky-200" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h3 class="text-lg font-black tracking-wide">Add to Home Screen</h3>
        </div>
        <p class="text-xs text-sky-100 leading-relaxed font-medium">
          Make this feel like a native app on your Android phone! This lets you open it instantly on the sideline with zero internet required.
        </p>
        
        <div class="border-t border-sky-400/40 pt-3 space-y-2.5 text-xs font-semibold">
          <div class="flex items-start space-x-2">
            <span class="bg-sky-400/50 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">1</span>
            <p class="text-sky-100">Open the app or the downloaded HTML file in Chrome or Firefox on Android.</p>
          </div>
          <div class="flex items-start space-x-2">
            <span class="bg-sky-400/50 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">2</span>
            <p class="text-sky-100">Tap the <strong class="text-white">three dots menu button</strong> (&vellip;) in the top-right corner of Chrome (or bottom-right in Firefox).</p>
          </div>
          <div class="flex items-start space-x-2">
            <span class="bg-sky-400/50 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">3</span>
            <p class="text-sky-100">Select <strong class="text-white">"Add to Home screen"</strong> from the menu.</p>
          </div>
          <div class="flex items-start space-x-2">
            <span class="bg-sky-400/50 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">4</span>
            <p class="text-sky-100">Give it a name like <strong class="text-white">DiscForce</strong>. An icon will be added to your home screen, opening in a distraction-free window!</p>
          </div>
        </div>
      </div>
    </section>

  </main>

  <!-- BOTTOM THUMB NAVIGATION RAIL -->
  <nav class="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 text-slate-400 z-50 shadow-xl max-w-md mx-auto rounded-t-2xl">
    <div class="grid grid-cols-5 h-16 text-[10px] font-bold">
      <!-- Attendance & Roster Tab -->
      <button onclick="switchTab('roster')" id="nav-roster" class="flex flex-col items-center justify-center space-y-1 active:scale-95 transition-transform text-sky-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        <span>Roster</span>
      </button>

      <!-- Practice Log Tab -->
      <button onclick="switchTab('practice')" id="nav-practice" class="flex flex-col items-center justify-center space-y-1 active:scale-95 transition-transform">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        <span>Practice</span>
      </button>

      <!-- Scrimmage Tab -->
      <button onclick="switchTab('scrimmage')" id="nav-scrimmage" class="flex flex-col items-center justify-center space-y-1 active:scale-95 transition-transform">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        <span>Scrimmage</span>
      </button>

      <!-- Stats Tab -->
      <button onclick="switchTab('stats')" id="nav-stats" class="flex flex-col items-center justify-center space-y-1 active:scale-95 transition-transform">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" /></svg>
        <span>Stats</span>
      </button>

      <!-- Export Tab -->
      <button onclick="switchTab('export')" id="nav-export" class="flex flex-col items-center justify-center space-y-1 active:scale-95 transition-transform">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        <span>Export</span>
      </button>
    </div>
  </nav>

  <!-- SCRIPT LOGIC -->
  <script>
    // Load initial embedded data, otherwise look into localStorage, otherwise fallback
    let initialEmbeddedData = ${serializedData};
    let appData = {
      players: [],
      attendance: [],
      practiceLogs: [],
      matches: []
    };
    
    let lastAction = null;
    let sidelineFilterPresentOnly = true;

    // Load state from localStorage or initial bundle
    function loadState() {
      const stored = localStorage.getItem('discforce_team_data');
      if (stored) {
        try {
          appData = JSON.parse(stored);
        } catch (e) {
          appData = initialEmbeddedData;
        }
      } else {
        appData = initialEmbeddedData;
        saveState();
      }
    }

    function saveState() {
      localStorage.setItem('discforce_team_data', JSON.stringify(appData));
    }

    // Tab Switching
    function switchTab(tabId) {
      document.querySelectorAll('.app-section').forEach(s => s.classList.add('hidden'));
      document.getElementById('section-' + tabId).classList.remove('hidden');

      // Update Active Navigation Item Color
      document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.remove('text-sky-400');
        btn.classList.add('text-slate-400');
      });
      document.getElementById('nav-' + tabId).classList.add('text-sky-400');
      document.getElementById('nav-' + tabId).classList.remove('text-slate-400');

      // Extra loads for specific tabs
      if (tabId === 'roster') {
        renderRosterSection();
      } else if (tabId === 'practice') {
        renderPracticeLogs();
      } else if (tabId === 'scrimmage') {
        renderMatches();
        renderSidelinePlayers();
      } else if (tabId === 'stats') {
        loadPlayerStatsDropdown();
        loadPlayerStats();
        renderLeaderboard();
      }
    }

    // Set Date fields to today
    function initDates() {
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('attendance-date').value = today;
      document.getElementById('practice-date').value = today;
      document.getElementById('match-date').value = today;
    }

    // Adjust Input utilities for plus/minus counters
    function adjustInput(inputId, val) {
      const el = document.getElementById(inputId);
      let currentVal = parseInt(el.value, 10) || 0;
      el.value = Math.max(0, currentVal + val);
    }

    // Roster Management & Attendance Rendering
    function renderRosterSection() {
      const rosterCountEl = document.getElementById('roster-count');
      rosterCountEl.textContent = appData.players.length + ' Players';

      const listContainer = document.getElementById('attendance-list');
      listContainer.innerHTML = '';

      if (appData.players.length === 0) {
        listContainer.innerHTML = '<p class="text-center text-slate-400 text-sm py-8">No players in roster. Use form above to add some!</p>';
        return;
      }

      // Check attendance for selected date
      const selectedDate = document.getElementById('attendance-date').value;
      const attRecord = appData.attendance.find(r => r.date === selectedDate);
      const presentIds = attRecord ? attRecord.presentIds : appData.players.map(p => p.id); // Default present if record doesn't exist

      appData.players.forEach(player => {
        const isChecked = presentIds.includes(player.id);
        const div = document.createElement('div');
        div.className = "flex items-center justify-between py-3.5";
        div.innerHTML = \`
          <div class="flex items-center space-x-3">
            <span class="font-bold text-slate-800 text-sm">\${player.name}</span>
          </div>
          <div class="flex items-center space-x-4">
            <!-- Large Mobile-Friendly Toggle -->
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" \${isChecked ? 'checked' : ''} data-player-id="\${player.id}" class="sr-only peer attendance-checkbox">
              <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              <span class="ml-2 text-xs font-semibold text-slate-500 peer-checked:text-sky-600 select-none">\${isChecked ? 'Present' : 'Absent'}</span>
            </label>
            <button onclick="removePlayer('\${player.id}')" class="text-slate-300 hover:text-rose-500 transition-colors p-1" title="Delete Player">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        \`;
        
        // Setup listener on toggle change
        div.querySelector('input').addEventListener('change', (e) => {
          const span = e.target.parentElement.querySelector('span');
          span.textContent = e.target.checked ? 'Present' : 'Absent';
          span.className = "ml-2 text-xs font-semibold select-none " + (e.target.checked ? 'text-sky-600' : 'text-slate-500');
        });

        listContainer.appendChild(div);
      });

      renderAttendanceHistory();
    }

    function removePlayer(id) {
      if (confirm("Are you sure you want to remove this player? This will remove them from the roster but keep their historical stats.")) {
        appData.players = appData.players.filter(p => p.id !== id);
        saveState();
        renderRosterSection();
      }
    }

    function renderAttendanceHistory() {
      const historyContainer = document.getElementById('attendance-history');
      historyContainer.innerHTML = '';

      if (appData.attendance.length === 0) {
        historyContainer.innerHTML = '<p class="text-slate-400 italic">No attendance records saved yet.</p>';
        return;
      }

      // Sort by date desc
      const sorted = [...appData.attendance].sort((a,b) => b.date.localeCompare(a.date));
      sorted.forEach(record => {
        const presentCount = record.presentIds.filter(id => appData.players.some(p => p.id === id)).length;
        const totalCount = appData.players.length;
        const div = document.createElement('div');
        div.className = "flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100";
        div.innerHTML = \`
          <span class="font-bold text-slate-700">\${record.date}</span>
          <span class="bg-sky-100 text-sky-800 text-[10px] px-2 py-0.5 rounded font-bold">\${presentCount}/\${totalCount} Present</span>
        \`;
        historyContainer.appendChild(div);
      });
    }

    // Save Attendance Form Action
    document.getElementById('save-attendance-btn').addEventListener('click', () => {
      const date = document.getElementById('attendance-date').value;
      if (!date) {
        alert("Please select a date!");
        return;
      }

      const checkBoxes = document.querySelectorAll('.attendance-checkbox');
      const presentIds = [];
      checkBoxes.forEach(cb => {
        if (cb.checked) {
          presentIds.push(cb.getAttribute('data-player-id'));
        }
      });

      // Remove previous entry for same date if exists
      appData.attendance = appData.attendance.filter(r => r.date !== date);
      appData.attendance.push({ id: Math.random().toString(36).substring(2, 9), date, presentIds });
      saveState();
      alert("Attendance saved successfully!");
      renderAttendanceHistory();
    });

    // Add Player Form Action
    document.getElementById('add-player-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('new-player-name');
      const name = nameInput.value.trim();
      if (!name) return;

      const newId = Math.random().toString(36).substring(2, 9);
      const newPlayer = {
        id: newId,
        name,
        goals: 0,
        assists: 0,
        ds: 0,
        turnovers: 0
      };

      appData.players.push(newPlayer);
      saveState();
      nameInput.value = '';
      renderRosterSection();
    });

    // Practice Log Rendering
    function renderPracticeLogs() {
      const container = document.getElementById('practice-logs-list');
      container.innerHTML = '';

      if (appData.practiceLogs.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-400 py-6 text-sm">No practice logs written yet. Create your first above!</p>';
        return;
      }

      // Sort logs by date desc
      const sorted = [...appData.practiceLogs].sort((a,b) => b.date.localeCompare(a.date));
      sorted.forEach(log => {
        const card = document.createElement('div');
        card.className = "bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-2";
        card.innerHTML = \`
          <div class="flex justify-between items-start">
            <span class="text-xs font-bold text-sky-600">\${log.date}</span>
            <button onclick="deletePracticeLog('\${log.id}')" class="text-slate-300 hover:text-rose-500 transition-colors p-0.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
          <h4 class="font-bold text-slate-800 text-sm">\${log.focus}</h4>
          <p class="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">\${log.notes}</p>
        \`;
        container.appendChild(card);
      });
    }

    function deletePracticeLog(id) {
      if (confirm("Delete this practice log record?")) {
        appData.practiceLogs = appData.practiceLogs.filter(l => l.id !== id);
        saveState();
        renderPracticeLogs();
      }
    }

    // Practice form submission
    document.getElementById('practice-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const date = document.getElementById('practice-date').value;
      const focus = document.getElementById('practice-focus').value.trim();
      const notes = document.getElementById('practice-notes').value.trim();

      if (!date || !focus || !notes) return;

      const newLog = {
        id: Math.random().toString(36).substring(2, 9),
        date,
        focus,
        notes
      };

      appData.practiceLogs.push(newLog);
      saveState();

      // Reset form (keep date)
      document.getElementById('practice-focus').value = '';
      document.getElementById('practice-notes').value = '';

      alert("Practice log saved!");
      renderPracticeLogs();
    });

    // Scrimmage Scoring Rendering
    function renderMatches() {
      const container = document.getElementById('matches-list');
      container.innerHTML = '';

      if (appData.matches.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-400 py-6 text-sm">No scrimmage matches saved yet.</p>';
        return;
      }

      const sorted = [...appData.matches].sort((a,b) => b.date.localeCompare(a.date));
      sorted.forEach(m => {
        const isWin = m.ourScore > m.opponentScore;
        const isLoss = m.ourScore < m.opponentScore;
        const isTie = m.ourScore === m.opponentScore;
        const badgeClass = isWin ? 'bg-slate-50 border border-slate-200 text-slate-800' : isLoss ? 'bg-slate-900 text-white border border-slate-800' : 'bg-sky-50 border border-sky-150 text-sky-800';
        const badgeLabel = isWin ? 'Light Win 🏆' : isLoss ? 'Dark Win 🏆' : 'Draw 🤝';

        const card = document.createElement('div');
        card.className = "bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between";
        card.innerHTML = \`
          <div class="space-y-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase">\${m.date}</span>
            <h4 class="font-bold text-slate-800 text-sm">\${m.opponent}</h4>
            <p class="text-lg font-black text-slate-900">
              <span class="text-slate-500 font-bold text-sm">Light </span>\${m.ourScore} 
              <span class="text-xs font-semibold text-slate-400 mx-1">to</span> 
              \${m.opponentScore}<span class="text-slate-400 font-bold text-sm"> Dark</span>
            </p>
          </div>
          <div class="flex items-center space-x-3">
            <span class="\${badgeClass} px-3 py-1.5 rounded-full flex items-center justify-center font-bold text-xs shadow-sm border">\${badgeLabel}</span>
            <button onclick="deleteMatch('\${m.id}')" class="text-slate-300 hover:text-rose-500 transition-colors p-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        \`;
        container.appendChild(card);
      });
    }

    function deleteMatch(id) {
      if (confirm("Delete this match record?")) {
        appData.matches = appData.matches.filter(m => m.id !== id);
        saveState();
        renderMatches();
      }
    }

    // Save match form submission
    document.getElementById('match-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const date = document.getElementById('match-date').value;
      const opponent = "Light vs Dark";
      const ourScore = parseInt(document.getElementById('match-our-score').value, 10) || 0;
      const opponentScore = parseInt(document.getElementById('match-their-score').value, 10) || 0;

      if (!date) return;

      const newMatch = {
        id: Math.random().toString(36).substring(2, 9),
        date,
        opponent,
        ourScore,
        opponentScore
      };

      appData.matches.push(newMatch);
      saveState();

      // Reset score inputs
      document.getElementById('match-our-score').value = 0;
      document.getElementById('match-their-score').value = 0;
      document.getElementById('light-score-display').textContent = '0';
      document.getElementById('dark-score-display').textContent = '0';

      alert("Scrimmage match score saved!");
      renderMatches();
    });

    function adjustLightScore(val) {
      const el = document.getElementById('match-our-score');
      let currentVal = parseInt(el.value, 10) || 0;
      const newVal = Math.max(0, currentVal + val);
      el.value = newVal;
      document.getElementById('light-score-display').textContent = newVal;
    }

    function adjustDarkScore(val) {
      const el = document.getElementById('match-their-score');
      let currentVal = parseInt(el.value, 10) || 0;
      const newVal = Math.max(0, currentVal + val);
      el.value = newVal;
      document.getElementById('dark-score-display').textContent = newVal;
    }

    function toggleSidelineFilter() {
      sidelineFilterPresentOnly = !sidelineFilterPresentOnly;
      const toggleBtn = document.getElementById('sideline-filter-toggle');
      const toggleDot = document.getElementById('sideline-filter-dot');
      
      if (sidelineFilterPresentOnly) {
        toggleBtn.classList.remove('bg-slate-300');
        toggleBtn.classList.add('bg-sky-600');
        toggleDot.classList.remove('translate-x-1');
        toggleDot.classList.add('translate-x-6');
      } else {
        toggleBtn.classList.remove('bg-sky-600');
        toggleBtn.classList.add('bg-slate-300');
        toggleDot.classList.remove('translate-x-6');
        toggleDot.classList.add('translate-x-1');
      }
      renderSidelinePlayers();
    }

    function sidelineLogStat(playerId, field, amount) {
      const player = appData.players.find(p => p.id === playerId);
      if (!player) return;

      // Save for undo
      lastAction = {
        playerId: playerId,
        field: field,
        prevValue: player[field] || 0
      };

      player[field] = Math.max(0, (player[field] || 0) + amount);
      saveState();

      // Show Undo Button
      document.getElementById('sideline-undo-btn').classList.remove('hidden');

      renderSidelinePlayers();
      // Update stats leaderboards/dropdowns in case user switches tabs
      renderLeaderboard();
    }

    function undoLastSidelineAction() {
      if (!lastAction) return;

      const player = appData.players.find(p => p.id === lastAction.playerId);
      if (player) {
        player[lastAction.field] = lastAction.prevValue;
        saveState();
        alert("Undid last stat change for " + player.name);
      }

      lastAction = null;
      document.getElementById('sideline-undo-btn').classList.add('hidden');
      renderSidelinePlayers();
      renderLeaderboard();
    }

    function renderSidelinePlayers() {
      const container = document.getElementById('sideline-players-list');
      if (!container) return;
      container.innerHTML = '';

      if (appData.players.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-400 py-6 text-xs italic">No roster players found to log.</p>';
        return;
      }

      // Check attendance for selected scrimmage date
      const selectedDate = document.getElementById('match-date').value || new Date().toISOString().split('T')[0];
      const attRecord = appData.attendance.find(r => r.date === selectedDate);
      const presentIds = attRecord ? attRecord.presentIds : appData.players.map(p => p.id);

      const filteredPlayers = sidelineFilterPresentOnly 
        ? appData.players.filter(p => presentIds.includes(p.id))
        : appData.players;

      if (filteredPlayers.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-400 py-6 text-xs italic">No present players found. Toggle filter to show all.</p>';
        return;
      }

      filteredPlayers.forEach(p => {
        const div = document.createElement('div');
        div.className = "flex flex-col sm:flex-row sm:items-center justify-between py-2.5 space-y-2 sm:space-y-0 border-b border-slate-50 last:border-b-0";
        div.innerHTML = \`
          <div class="truncate pr-2">
            <span class="font-extrabold text-slate-800 text-sm block truncate max-w-[150px]">\${p.name}</span>
            <span class="text-[10px] font-mono font-bold text-slate-400">G:\${p.goals || 0} | A:\${p.assists || 0} | D:\${p.ds || 0} | T:\${p.turnovers || 0}</span>
          </div>
          <div class="flex items-center space-x-1.5 self-end sm:self-auto">
            <button type="button" onclick="sidelineLogStat('\${p.id}', 'goals', 1)" class="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-sm flex flex-col items-center justify-center active:scale-90 transition-transform">
              <span class="text-[8px] font-bold text-emerald-100">GOAL</span>
              <span class="text-xs -mt-1 font-black">+G</span>
            </button>
            <button type="button" onclick="sidelineLogStat('\${p.id}', 'assists', 1)" class="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-black text-xs shadow-sm flex flex-col items-center justify-center active:scale-90 transition-transform">
              <span class="text-[8px] font-bold text-sky-100">ASST</span>
              <span class="text-xs -mt-1 font-black">+A</span>
            </button>
            <button type="button" onclick="sidelineLogStat('\${p.id}', 'ds', 1)" class="w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs shadow-sm flex flex-col items-center justify-center active:scale-90 transition-transform">
              <span class="text-[8px] font-bold text-indigo-100">DEF</span>
              <span class="text-xs -mt-1 font-black">+D</span>
            </button>
            <button type="button" onclick="sidelineLogStat('\${p.id}', 'turnovers', 1)" class="w-10 h-10 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-black text-xs shadow-sm flex flex-col items-center justify-center active:scale-90 transition-transform">
              <span class="text-[8px] font-bold text-rose-100">TURN</span>
              <span class="text-xs -mt-1 font-black">+T</span>
            </button>
          </div>
        \`;
        container.appendChild(div);
      });
    }

    // Bind change listener to match-date
    document.addEventListener('DOMContentLoaded', () => {
      const matchDateEl = document.getElementById('match-date');
      if (matchDateEl) {
        matchDateEl.addEventListener('change', () => {
          renderSidelinePlayers();
        });
      }
    });

    // Player Stats Tracking
    function loadPlayerStatsDropdown() {
      const select = document.getElementById('stats-player-select');
      select.innerHTML = '';

      if (appData.players.length === 0) {
        select.innerHTML = '<option value="">No Players Available</option>';
        return;
      }

      appData.players.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        select.appendChild(opt);
      });
    }

    function loadPlayerStats() {
      const select = document.getElementById('stats-player-select');
      const playerId = select.value;
      if (!playerId) return;

      const player = appData.players.find(p => p.id === playerId);
      if (!player) return;

      document.getElementById('stat-val-goals').textContent = player.goals || 0;
      document.getElementById('stat-val-assists').textContent = player.assists || 0;
      document.getElementById('stat-val-ds').textContent = player.ds || 0;
      document.getElementById('stat-val-turnovers').textContent = player.turnovers || 0;
    }

    function incrementStat(field, amount) {
      const select = document.getElementById('stats-player-select');
      const playerId = select.value;
      if (!playerId) {
        alert("Please add/select a player first!");
        return;
      }

      const player = appData.players.find(p => p.id === playerId);
      if (!player) return;

      // Ensure stats don't go below 0
      player[field] = Math.max(0, (player[field] || 0) + amount);
      saveState();
      loadPlayerStats();
      renderLeaderboard();
    }

    function renderLeaderboard() {
      const tbody = document.getElementById('stats-leaderboard-body');
      tbody.innerHTML = '';

      if (appData.players.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-slate-400 italic">No players available.</td></tr>';
        return;
      }

      // Sort by Goals + Assists (Contributions) Desc
      const sorted = [...appData.players].sort((a,b) => {
        const scoreA = (a.goals || 0) + (a.assists || 0) + (a.ds || 0) - (a.turnovers || 0);
        const scoreB = (b.goals || 0) + (b.assists || 0) + (b.ds || 0) - (b.turnovers || 0);
        return scoreB - scoreA;
      });

      sorted.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-50 hover:bg-slate-50";
        tr.innerHTML = \`
          <td class="py-2.5 font-bold text-slate-800 text-xs">\${p.name}</td>
          <td class="py-2.5 text-center text-emerald-600 font-bold">\${p.goals || 0}</td>
          <td class="py-2.5 text-center text-sky-600 font-bold">\${p.assists || 0}</td>
          <td class="py-2.5 text-center text-indigo-600 font-bold">\${p.ds || 0}</td>
          <td class="py-2.5 text-center text-rose-500 font-bold">\${p.turnovers || 0}</td>
        \`;
        tbody.appendChild(tr);
      });
    }

    // CSV Download Trigger in Offline HTML
    document.getElementById('export-csv-btn').addEventListener('click', () => {
      let csvContent = "data:text/csv;charset=utf-8,";
      
      csvContent += "=== PLAYER STATS ===\\n";
      csvContent += "Player Name,Goals,Assists,D's (Deflection/Blocks),Turnovers\\n";
      appData.players.forEach(p => {
        csvContent += \`"\${p.name.replace(/"/g, '""')}",\${p.goals},\${p.assists},\${p.ds},\${p.turnovers}\\n\`;
      });

      csvContent += "\\n=== ATTENDANCE RECORDS ===\\n";
      csvContent += "Date,Present Players\\n";
      appData.attendance.forEach(att => {
        const presentNames = att.presentIds
          .map(id => appData.players.find(p => p.id === id)?.name || "Unknown")
          .join("; ");
        csvContent += \`"\${att.date}","\${presentNames.replace(/"/g, '""')}"\\n\`;
      });

      csvContent += "\\n=== PRACTICE LOGS ===\\n";
      csvContent += "Date,Focus Area,Session Notes\\n";
      appData.practiceLogs.forEach(log => {
        csvContent += \`"\${log.date}","\${log.focus.replace(/"/g, '""')}","\${log.notes.replace(/"/g, '""')}"\\n\`;
      });

      csvContent += "\\n=== SCRIMMAGE MATCHES ===\\n";
      csvContent += "Date,Opponent,Our Score,Opponent Score,Result\\n";
      appData.matches.forEach(m => {
        const result = m.ourScore > m.opponentScore ? "Win" : m.ourScore < m.opponentScore ? "Loss" : "Tie";
        csvContent += \`"\${m.date}","\${m.opponent.replace(/"/g, '""')}",\${m.ourScore},\${m.opponentScore},\${result}\\n\`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "discforce_ultimate_stats.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    // Re-download this Single-File HTML with latest data bundled inside it!
    document.getElementById('export-html-btn').addEventListener('click', () => {
      // Re-generates the entire current markup but embeds the active localStorage snapshot!
      // This is a beautiful recursive self-bundler!
      const currentHTML = document.documentElement.outerHTML;
      const scriptToModify = "let initialEmbeddedData = " + JSON.stringify(appData) + ";";
      
      let htmlCopy = \`<!DOCTYPE html>\\n<html lang="en">\\n\` + currentHTML + \`\\n</html>\`;
      // Replace the initial embedded data definition in the script so the fresh file has current data baked-in!
      const regex = /let initialEmbeddedData = \\{.*?\\};/;
      htmlCopy = htmlCopy.replace(regex, scriptToModify);

      const blob = new Blob([htmlCopy], { type: "text/html;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "discforce_ultimate_manager.html";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    // Global Initialization
    window.addEventListener('DOMContentLoaded', () => {
      loadState();
      initDates();
      renderRosterSection();
      renderLeaderboard();
    });
  </script>
</body>
</html>`;
}

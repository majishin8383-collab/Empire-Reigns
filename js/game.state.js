/* Empire Reigns — game.state.js
   Build: ER-20260109d2d
   Purpose: state + persistence + small utilities (no wiring, no UI binding)
*/
(() => {
  const BUILD = "ER-20260109d2d";
  window.BUILD = window.BUILD || BUILD;

  // Global namespace
  const ER = (window.ER = window.ER || {});
  ER.BUILD = BUILD;

  // ---------------------------
  // Constants / Keys
  // ---------------------------
  const SAVE_KEY = "empire_reigns_cozy_v5_milestones";
  const SFX_KEY  = "empire_reigns_sfx_on";

  ER.keys = { SAVE_KEY, SFX_KEY };

  // ---------------------------
  // Utilities
  // ---------------------------
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const $ = (id) => document.getElementById(id);

  function money(n){
    const abs = Math.abs(n);
    if (abs >= 1e9) return "$" + (n/1e9).toFixed(2) + "B";
    if (abs >= 1e6) return "$" + (n/1e6).toFixed(2) + "M";
    if (abs >= 1e3) return "$" + (n/1e3).toFixed(2) + "K";
    return "$" + Number(n || 0).toFixed(2);
  }
  const fmtX = (n) => "x" + Number(n || 0).toFixed(2);

  function floatText(text, x, y){
    const d = document.createElement("div");
    d.className = "floater";
    d.textContent = text;
    d.style.left = x + "px";
    d.style.top = y + "px";
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 650);
  }

  function setStatus(msg){
    const el = $("status");
    if (!el) return;
    el.textContent = msg;
    clearTimeout(setStatus._t);
    setStatus._t = setTimeout(() => {
      if (el.textContent === msg) el.textContent = "Ready";
    }, 1100);
  }

  ER.util = { clamp, $, money, fmtX, floatText, setStatus };

  // ---------------------------
  // State (single source of truth)
  // ---------------------------
  const state = {
    cash: 0,
    lastTickMs: Date.now(),
    lastSaveMs: Date.now(),
    lifetimeEarned: 0,
    ep: 0,
    prestigeCount: 0,

    owned: { assistant: 0, tools: 0, proc: 0, auto: 0 },
    assistantCost: 25,
    toolsCost: 60,
    procCost: 150,
    autoCost: 400,

    // streak + golden
    streakCount: 0,
    streakMult: 1.0,
    lastWorkMs: 0,
    goldenHeat: 0,
    lastGoldenMs: 0,

    // building levels + costs (keys match game.economy BUILDINGS keys)
    bLvl: { office: 1, warehouse: 1, workshop: 1, market: 1 },
    bCost: { office: 50, warehouse: 120, workshop: 280, market: 650 },

    // sparkle timer
    nextSparkleMs: Date.now() + 1400,

    // ✅ MONETIZATION (new)
    starterPack: false // permanent 2× income
  };

  ER.state = state;

  // ---------------------------
  // Sanity merge (for old saves / missing fields)
  // ---------------------------
  function safeMerge(){
    state.owned = Object.assign({assistant:0, tools:0, proc:0, auto:0}, state.owned || {});
    if (typeof state.ep !== "number") state.ep = 0;
    if (typeof state.prestigeCount !== "number") state.prestigeCount = 0;

    if (typeof state.streakCount !== "number") state.streakCount = 0;
    if (typeof state.streakMult !== "number") state.streakMult = 1.0;
    if (typeof state.lastWorkMs !== "number") state.lastWorkMs = 0;
    if (typeof state.goldenHeat !== "number") state.goldenHeat = 0;
    if (typeof state.lastGoldenMs !== "number") state.lastGoldenMs = 0;

    state.bLvl = Object.assign({office:1, warehouse:1, workshop:1, market:1}, state.bLvl || {});
    state.bCost = Object.assign({ office:50, warehouse:120, workshop:280, market:650 }, state.bCost || {});

    if (typeof state.nextSparkleMs !== "number") state.nextSparkleMs = Date.now() + 1400;

    // ✅ monetization default for old saves
    if (typeof state.starterPack !== "boolean") state.starterPack = false;
  }

  // ---------------------------
  // Persistence
  // ---------------------------
  function save(silent=false){
    state.lastSaveMs = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    if(!silent) setStatus("Saved");
  }

  function load(){
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return false;
    try {
      Object.assign(state, JSON.parse(raw));
      safeMerge();
      return true;
    } catch {
      return false;
    }
  }

  function hardReset(){
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }

  ER.persist = { safeMerge, save, load, hardReset };

  // ---------------------------
  // Run reset helper (keeps EP)
  // Note: UI refresh happens in game.main.js after it calls this.
  // ---------------------------
  function resetRunKeepEP(){
    state.cash = 0;
    state.lastTickMs = Date.now();
    state.lastSaveMs = Date.now();
    state.lifetimeEarned = 0;

    state.owned = { assistant:0, tools:0, proc:0, auto:0 };
    state.assistantCost = 25;
    state.toolsCost = 60;
    state.procCost = 150;
    state.autoCost = 400;

    state.streakCount = 0;
    state.streakMult = 1.0;
    state.lastWorkMs = 0;
    state.goldenHeat = 0;
    state.lastGoldenMs = 0;

    state.bLvl = { office:1, warehouse:1, workshop:1, market:1 };
    state.bCost = { office:50, warehouse:120, workshop:280, market:650 };

    state.nextSparkleMs = Date.now() + 1400;

    // Keep monetization (DO NOT reset paid flag)
    if (typeof state.starterPack !== "boolean") state.starterPack = false;

    // Let main handle bubble close / render / status
    ER.persist.save(true);
  }

  ER.reset = { resetRunKeepEP };

  // ---------------------------
  // Monetization helper (optional but safe)
  // ---------------------------
  ER.monetize = ER.monetize || {};
  ER.monetize.setStarterPack = (on) => {
    state.starterPack = !!on;
    ER.persist.save(true);
    setStatus(state.starterPack ? "Starter Pack: ACTIVE (2×)" : "Starter Pack: OFF");
  };
})();

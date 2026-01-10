/* Empire Reigns — Cozy Idle
   Build: ER-20260109c
   A: streak + golden
   B: building level tracks + gated unlocks + per-building income/sec
   C: milestones + permanent bonuses (via milestones.js)
*/
(() => {
  const BUILD = (window.BUILD || "unknown");

  // ---------------------------
  // Crash overlay (no silent black screen)
  // ---------------------------
  const crash = (msg) => {
    try {
      const d = document.createElement("div");
      d.style.cssText = `
        position:fixed; inset:0; z-index:99999; padding:18px;
        background:#07080c; color:#f3f1ea; font-family:system-ui,Segoe UI,Roboto,Arial;
        overflow:auto; border-top:6px solid rgba(255,140,170,.35);
      `;
      d.innerHTML = `
        <div style="max-width:980px;margin:0 auto;">
          <h2 style="margin:0 0 10px 0;">Empire Reigns crashed</h2>
          <div style="opacity:.85;margin-bottom:10px;">Build: <b>${BUILD}</b></div>
          <pre style="white-space:pre-wrap;opacity:.9;border:1px solid rgba(255,255,255,.14);
            background:rgba(255,255,255,.04);padding:12px;border-radius:14px;">${String(msg || "Unknown error")}</pre>
          <div style="opacity:.88;margin-top:12px;">
            Fix checklist:
            <ul>
              <li>Confirm <b>index.html</b>, <b>styles.css</b>, <b>game.js</b>, <b>milestones.js</b> are in the <b>repo root</b>.</li>
              <li>Open with cache buster: <b>?v=${BUILD}</b> then hard refresh <b>Ctrl+Shift+R</b>.</li>
              <li>If this appears, copy/paste the error block back to me.</li>
            </ul>
          </div>
        </div>
      `;
      document.body.appendChild(d);
    } catch {}
  };
  window.addEventListener("error", (e) => {
    const msg = [
      e?.message || "Unknown error",
      `${e?.filename || ""}:${e?.lineno || ""}:${e?.colno || ""}`
    ].join("\n");
    crash(msg);
  });
  window.addEventListener("unhandledrejection", (e) => crash(String(e?.reason || "Unhandled promise rejection")));

  // ---------------------------
  // Utilities
  // ---------------------------
  const SAVE_KEY = "empire_reigns_cozy_v5_milestones";
  const SFX_KEY  = "empire_reigns_sfx_on";

  const clamp = (n,a,b) => Math.max(a, Math.min(b,n));
  const $ = (id) => document.getElementById(id);

  function money(n){
    const abs = Math.abs(n);
    if (abs >= 1e9) return "$" + (n/1e9).toFixed(2) + "B";
    if (abs >= 1e6) return "$" + (n/1e6).toFixed(2) + "M";
    if (abs >= 1e3) return "$" + (n/1e3).toFixed(2) + "K";
    return "$" + n.toFixed(2);
  }
  const fmtX = (n) => "x" + n.toFixed(2);

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

  // ---------------------------
  // Milestones (Upgrade C) integration
  // ---------------------------
  const MS = (() => {
    // Safe wrapper around window.ER_MILESTONES
    const api = window.ER_MILESTONES || null;
    return {
      exists: !!api,
      load: () => { try { api?.load?.(); } catch {} },
      tick: (state, hooks) => { try { api?.tick?.(state, hooks); } catch {} },
      bonuses: () => {
        try { return api?.getBonuses?.() || { globalMult:1, buildingMult:1, streakHold:1 }; }
        catch { return { globalMult:1, buildingMult:1, streakHold:1 }; }
      },
      list: () => {
        try { return api?.getList?.() || []; }
        catch { return []; }
      },
      progressFor: (id, state) => {
        try { return api?.progressFor?.(id, state) ?? 0; }
        catch { return 0; }
      }
    };
  })();

  // ---------------------------
  // SFX (WebAudio)
  // ---------------------------
  const SFX = (() => {
    let ctx = null;
    let enabled = true;

    function loadEnabled(){
      const raw = localStorage.getItem(SFX_KEY);
      enabled = raw == null ? true : raw === "1";
    }
    function saveEnabled(){ localStorage.setItem(SFX_KEY, enabled ? "1" : "0"); }
    function ensure(){
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume().catch(()=>{});
    }
    function beep({type="sine", f=440, t=0.06, v=0.06, det=0, a=0.005, r=0.06}){
      if (!enabled) return;
      ensure();
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, now);
      if (det) o.detune.setValueAtTime(det, now);

      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0001, v), now + a);
      g.gain.exponentialRampToValueAtTime(0.0001, now + t + r);

      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + t + r + 0.01);
    }

    function click(){ beep({type:"triangle", f:520, t:0.03, v:0.035, det:-15, a:0.003, r:0.03}); }
    function purchase(){
      beep({type:"sine", f:420, t:0.05, v:0.06, det:12, a:0.004, r:0.06});
      setTimeout(() => beep({type:"triangle", f:720, t:0.04, v:0.04, det:-8, a:0.003, r:0.05}), 35);
    }
    function levelUp(){
      beep({type:"sine", f:660, t:0.08, v:0.05, a:0.004, r:0.09});
      setTimeout(() => beep({type:"sine", f:990, t:0.08, v:0.045, a:0.004, r:0.09}), 70);
    }
    function prestige(){
      beep({type:"sine", f:330, t:0.12, v:0.05, a:0.01, r:0.14});
      setTimeout(() => beep({type:"triangle", f:440, t:0.12, v:0.05, a:0.01, r:0.14}), 120);
      setTimeout(() => beep({type:"sine", f:660, t:0.14, v:0.055, a:0.01, r:0.18}), 240);
    }
    function golden(){
      beep({type:"sine", f:880, t:0.08, v:0.055, a:0.004, r:0.10});
      setTimeout(() => beep({type:"triangle", f:1320, t:0.10, v:0.05, a:0.004, r:0.12}), 90);
      setTimeout(() => beep({type:"sine", f:1760, t:0.12, v:0.05, a:0.004, r:0.16}), 210);
    }

    function setEnabled(v){ enabled = !!v; saveEnabled(); }
    function isEnabled(){ return enabled; }
    function armOneTimeUnlock(){
      const handler = () => { ensure(); };
      window.addEventListener("pointerdown", handler, {capture:true, once:true});
    }

    loadEnabled(); armOneTimeUnlock();
    return { click, purchase, levelUp, prestige, golden, setEnabled, isEnabled, ensure };
  })();

  // ---------------------------
  // Upgrade B: Building Track Definitions
  // ---------------------------
  const BUILDINGS = {
    office:    { name:"Office",    gate: null,                   baseCost: 50,  costGrow: 1.35, incomePerLevel: 0.40 },
    warehouse: { name:"Warehouse", gate: { b:"office", lv:2 },   baseCost: 120, costGrow: 1.38, incomePerLevel: 0.85 },
    workshop:  { name:"Workshop",  gate: { b:"warehouse", lv:2 },baseCost: 280, costGrow: 1.42, incomePerLevel: 1.70 },
    market:    { name:"Market",    gate: { b:"workshop", lv:2 }, baseCost: 650, costGrow: 1.46, incomePerLevel: 3.40 },
  };

  // ---------------------------
  // State
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

    // Upgrade A: streak + golden
    streakCount: 0,
    streakMult: 1.0,
    lastWorkMs: 0,
    goldenHeat: 0,
    lastGoldenMs: 0,

    // Upgrade B: building levels + level costs
    bLvl: { office: 1, warehouse: 1, workshop: 1, market: 1 },
    bCost: { office: 50, warehouse: 120, workshop: 280, market: 650 }
  };

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
    state.bCost = Object.assign({
      office: BUILDINGS.office.baseCost,
      warehouse: BUILDINGS.warehouse.baseCost,
      workshop: BUILDINGS.workshop.baseCost,
      market: BUILDINGS.market.baseCost
    }, state.bCost || {});
  }

  function save(silent=false){
    state.lastSaveMs = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    if(!silent) setStatus("Saved");
  }
  function load(){
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return false;
    try { Object.assign(state, JSON.parse(raw)); safeMerge(); return true; }
    catch { return false; }
  }
  function hardReset(){
    localStorage.removeItem(SAVE_KEY);
    // milestones remain (by design) unless user wipes localStorage manually
    location.reload();
  }

  // ---------------------------
  // Economy (Milestone bonuses applied here)
  // ---------------------------
  function opsMultiplier(){
    const toolsMult = Math.pow(1.25, state.owned.tools || 0);
    const procMult  = Math.pow(1.40, state.owned.proc  || 0);
    const autoMult  = Math.pow(2.00, state.owned.auto  || 0);
    return toolsMult * procMult * autoMult;
  }
  function prestigeMultiplier(){ return Math.pow(1.2, state.ep || 0); }

  function buildingIncomePerSecondRaw(){
    let total = 0;
    for (const k of Object.keys(BUILDINGS)){
      const lv = Math.max(1, state.bLvl[k] || 1);
      const def = BUILDINGS[k];
      const extra = Math.max(0, lv - 1);
      const baseTrickle = def.incomePerLevel * 0.25;
      total += baseTrickle + extra * def.incomePerLevel;
    }
    return total;
  }

  function baseIncomePerSecond(){
    return (state.owned.assistant || 0) * 1.0;
  }

  function incomePerSecond(){
    const b = MS.bonuses();
    const buildingsPart = buildingIncomePerSecondRaw() * (b.buildingMult || 1);
    const basePart = baseIncomePerSecond();
    const totalBase = basePart + buildingsPart;
    return totalBase * opsMultiplier() * prestigeMultiplier() * (b.globalMult || 1);
  }

  function buildingIncomeShown(){
    const b = MS.bonuses();
    return buildingIncomePerSecondRaw() * (b.buildingMult || 1);
  }

  function unlockedTools(){ return (state.owned.assistant||0) >= 1; }
  function unlockedProc(){  return (state.owned.tools||0) >= 1; }
  function unlockedAuto(){  return (state.owned.proc||0) >= 1; }

  const PRESTIGE_GOAL = 10000;
  const canPrestige = () => (state.cash||0) >= PRESTIGE_GOAL;

  function epGainIfPrestigeNow(){
    const le = Math.max(0, state.lifetimeEarned || 0) + 1;
    return Math.max(1, Math.floor(Math.log10(le)));
  }

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
    state.bCost = {
      office: BUILDINGS.office.baseCost,
      warehouse: BUILDINGS.warehouse.baseCost,
      workshop: BUILDINGS.workshop.baseCost,
      market: BUILDINGS.market.baseCost
    };

    closeBubble();
    save(true);
    setStatus("New run started");
    render();
  }

  function doPrestige(){
    if(!canPrestige()) return;
    const gain = epGainIfPrestigeNow();
    state.ep = (state.ep||0) + gain;
    state.prestigeCount = (state.prestigeCount||0) + 1;
    SFX.prestige();
    resetRunKeepEP();
    setStatus(`Prestiged: +${gain} EP`);
  }

  function applyOfflineProgress(){
    const now = Date.now();
    const secondsAway = (now - (state.lastTickMs || now)) / 1000;
    const capped = clamp(secondsAway, 0, 6*3600);
    const earned = incomePerSecond() * capped;
    if(earned > 0.01){
      state.cash += earned;
      state.lifetimeEarned += earned;
      setStatus(`Offline: +${money(earned)}`);
    } else setStatus("Ready");
    state.lastTickMs = now;
  }

  // ---------------------------
  // Upgrade A: Streak logic (Milestone streakHold affects decay window)
  // ---------------------------
  const STREAK_WINDOW_MS_BASE = 1300;
  const STREAK_MAX = 45;
  const STREAK_STEP = 0.025;
  const STREAK_MAX_MULT = 2.50;

  function streakWindowMs(){
    const b = MS.bonuses();
    return STREAK_WINDOW_MS_BASE * (b.streakHold || 1);
  }

  function updateStreak(nowMs){
    const dt = nowMs - (state.lastWorkMs || 0);
    const win = streakWindowMs();
    if (dt <= win) state.streakCount = Math.min(STREAK_MAX, (state.streakCount||0) + 1);
    else state.streakCount = 1;

    state.lastWorkMs = nowMs;

    const m = 1 + STREAK_STEP * Math.max(0, state.streakCount - 1);
    state.streakMult = clamp(m, 1.0, STREAK_MAX_MULT);

    state.goldenHeat = clamp((state.goldenHeat||0) + 0.08 + (state.streakCount * 0.004), 0, 1.0);
  }

  function decayStreak(nowMs){
    const win = streakWindowMs();
    const dt = nowMs - (state.lastWorkMs || 0);
    if (state.streakCount > 0 && dt > win){
      const over = dt - win;
      const drop = Math.floor(over / 550);
      if (drop > 0){
        state.streakCount = Math.max(0, state.streakCount - drop);
        const m = 1 + STREAK_STEP * Math.max(0, state.streakCount - 1);
        state.streakMult = clamp(m, 1.0, STREAK_MAX_MULT);
        state.goldenHeat = clamp((state.goldenHeat||0) - 0.10 * drop, 0, 1.0);
        if (state.streakCount === 0){
          state.streakMult = 1.0;
          state.goldenHeat = 0;
        }
      }
    }
  }

  function goldenChance(){
    const base = 0.012;
    const streakBoost = 0.010 * Math.min(1, (state.streakCount||0) / 20);
    const heatBoost = 0.018 * (state.goldenHeat || 0);
    const cooldownOk = (Date.now() - (state.lastGoldenMs||0)) > 1600;
    const raw = base + streakBoost + heatBoost;
    return cooldownOk ? clamp(raw, 0.012, 0.040) : 0;
  }

  function playGoldFx(x, y, label="GOLDEN PAYOUT!"){
    const badge = document.createElement("div");
    badge.className = "fxBadge gold";
    badge.textContent = label;
    badge.style.left = x + "px";
    badge.style.top = (y - 6) + "px";
    document.body.appendChild(badge);
    setTimeout(() => badge.remove(), 980);

    const burst = document.createElement("div");
    burst.className = "fxBurst";
    burst.style.left = x + "px";
    burst.style.top = y + "px";
    document.body.appendChild(burst);

    const count = 22;
    for(let i=0;i<count;i++){
      const p = document.createElement("div");
      const type = (i % 4 === 0) ? "blue" : "gold";
      p.className = "fxParticle " + type;
      const ang = (Math.PI * 2) * (i / count);
      const mag = 22 + Math.random() * 42;
      const dx = Math.cos(ang) * mag;
      const dy = Math.sin(ang) * mag - (12 + Math.random()*14);
      p.style.setProperty("--dx", dx.toFixed(1) + "px");
      p.style.setProperty("--dy", dy.toFixed(1) + "px");
      p.style.left = "0px";
      p.style.top = "0px";
      burst.appendChild(p);
    }
    setTimeout(() => burst.remove(), 760);
  }

  function tryGoldenPayout(baseAmount, x, y){
    const p = goldenChance();
    if (Math.random() > p) return 0;

    const streakFactor = 1.0 + (state.streakCount || 0) * 0.06;
    const econFactor = 1.0 + Math.min(2.0, incomePerSecond() / 40);
    const payout = baseAmount * (6 + Math.random()*6) * streakFactor * econFactor;

    state.cash += payout;
    state.lifetimeEarned += payout;
    state.lastGoldenMs = Date.now();
    state.goldenHeat = 0;

    SFX.golden();
    playGoldFx(x, y);
    floatText("+" + money(payout), x, y);
    setStatus("✨ GOLDEN PAYOUT!");
    return payout;
  }

  // ---------------------------
  // Upgrade B: Building level rules
  // ---------------------------
  function buildingGateLocked(key){
    const def = BUILDINGS[key];
    if (!def.gate) return null;
    const need = def.gate;
    const cur = state.bLvl[need.b] || 1;
    if (cur >= need.lv) return null;
    return `${BUILDINGS[need.b].name} LV${need.lv} required`;
  }

  function buildingLevelIncomeDelta(key){
    return BUILDINGS[key].incomePerLevel;
  }

  function buildingLevelCost(key){
    return Math.max(1, Math.floor(state.bCost[key] || BUILDINGS[key].baseCost));
  }

  function bumpBuildingCost(key){
    const def = BUILDINGS[key];
    const cur = buildingLevelCost(key);
    state.bCost[key] = Math.ceil(cur * def.costGrow);
  }

  // ---------------------------
  // Buildings SVG bodies
  // ---------------------------
  const SVG_BODIES = {
    office: `
      <svg viewBox="0 0 220 190" width="100%" height="100%">
        <ellipse cx="112" cy="170" rx="76" ry="12" fill="rgba(0,0,0,.25)"/>
        <path d="M40 85 L110 35 L182 85 L170 96 L110 55 L52 96 Z"
              fill="rgba(255,210,120,.14)" stroke="rgba(255,245,220,.28)" stroke-width="3" stroke-linejoin="round"/>
        <path d="M56 92 L110 58 L166 92" stroke="rgba(0,0,0,.18)" stroke-width="4" stroke-linecap="round" opacity=".35"/>
        <rect x="52" y="88" width="116" height="78" rx="20"
              fill="rgba(255,245,220,.08)" stroke="rgba(255,245,220,.26)" stroke-width="3"/>
        <rect x="58" y="94" width="104" height="66" rx="18"
              fill="rgba(0,0,0,.10)" opacity=".55"/>
        <rect x="70" y="150" width="80" height="16" rx="10"
              fill="rgba(120,180,255,.10)" stroke="rgba(120,180,255,.18)" stroke-width="3"/>
        <rect x="98" y="118" width="28" height="48" rx="12"
              fill="rgba(0,0,0,.25)" stroke="rgba(255,245,220,.22)" stroke-width="3"/>
        <circle cx="121" cy="143" r="2.3" fill="rgba(255,210,120,.35)"/>

        <g opacity=".95">
          <rect x="68" y="110" width="28" height="22" rx="10"
                fill="rgba(120,180,255,.10)" stroke="rgba(120,180,255,.20)" stroke-width="3"/>
          <path d="M82 110 V132" stroke="rgba(255,245,220,.18)" stroke-width="3" opacity=".7"/>
          <path d="M68 121 H96" stroke="rgba(255,245,220,.16)" stroke-width="3" opacity=".7"/>
          <rect x="136" y="110" width="28" height="22" rx="10"
                fill="rgba(120,180,255,.10)" stroke="rgba(120,180,255,.20)" stroke-width="3"/>
          <path d="M150 110 V132" stroke="rgba(255,245,220,.18)" stroke-width="3" opacity=".7"/>
          <path d="M136 121 H164" stroke="rgba(255,245,220,.16)" stroke-width="3" opacity=".7"/>
        </g>

        <g class="lvl2" style="display:none;" opacity=".95">
          <rect x="64" y="138" width="26" height="18" rx="9"
                fill="rgba(255,210,120,.10)" stroke="rgba(255,210,120,.18)" stroke-width="3"/>
          <rect x="140" y="138" width="26" height="18" rx="9"
                fill="rgba(255,210,120,.10)" stroke="rgba(255,210,120,.18)" stroke-width="3"/>
        </g>
        <g class="lvl3" style="display:none;" opacity=".95">
          <circle cx="56" cy="132" r="10" fill="rgba(120,220,180,.10)" stroke="rgba(120,220,180,.20)" stroke-width="3"/>
          <path d="M56 125 V139" stroke="rgba(255,245,220,.18)" stroke-width="3"/>
          <path d="M49 132 H63" stroke="rgba(255,245,220,.16)" stroke-width="3"/>
        </g>
        <g class="lvl4" style="display:none;" opacity=".95">
          <path d="M74 86 C92 70, 128 70, 146 86" fill="none" stroke="rgba(255,210,120,.20)" stroke-width="4" stroke-linecap="round"/>
          <circle cx="110" cy="72" r="4" fill="rgba(255,210,120,.26)"/>
        </g>

        <rect x="62" y="78" width="96" height="22" rx="11"
              fill="rgba(12,10,14,.40)" stroke="rgba(255,245,220,.20)" stroke-width="3"/>
        <text x="110" y="93" text-anchor="middle" font-size="10" font-weight="900" fill="rgba(255,245,220,.88)">OFFICE</text>
        <text x="110" y="106" text-anchor="middle" font-size="10" font-weight="900" fill="rgba(255,245,220,.78)" class="lvlText">LV1</text>
      </svg>
    `,
    warehouse: `
      <svg viewBox="0 0 220 190" width="100%" height="100%">
        <ellipse cx="110" cy="172" rx="84" ry="12" fill="rgba(0,0,0,.25)"/>
        <path d="M56 72 L110 36 L164 72 L164 86 L56 86 Z"
              fill="rgba(255,140,170,.10)" stroke="rgba(255,245,220,.26)" stroke-width="3" stroke-linejoin="round"/>
        <rect x="52" y="84" width="116" height="84" rx="22"
              fill="rgba(255,245,220,.06)" stroke="rgba(255,245,220,.24)" stroke-width="3"/>
        <rect x="64" y="108" width="92" height="60" rx="18"
              fill="rgba(0,0,0,.24)" stroke="rgba(255,245,220,.16)" stroke-width="3"/>
        <path d="M110 108 V168" stroke="rgba(255,245,220,.10)" stroke-width="3"/>
        <g opacity=".9">
          <rect x="70" y="92" width="22" height="16" rx="8"
                fill="rgba(120,180,255,.10)" stroke="rgba(120,180,255,.20)" stroke-width="3"/>
          <rect x="128" y="92" width="22" height="16" rx="8"
                fill="rgba(120,180,255,.10)" stroke="rgba(120,180,255,.20)" stroke-width="3"/>
        </g>

        <g class="lvl2" style="display:none;" opacity=".95">
          <rect x="42" y="148" width="18" height="14" rx="7" fill="rgba(255,210,120,.10)" stroke="rgba(255,210,120,.18)" stroke-width="3"/>
          <rect x="160" y="148" width="18" height="14" rx="7" fill="rgba(255,210,120,.10)" stroke="rgba(255,210,120,.18)" stroke-width="3"/>
        </g>
        <g class="lvl3" style="display:none;" opacity=".95">
          <path d="M40 138 H70" stroke="rgba(120,220,180,.18)" stroke-width="4" stroke-linecap="round"/>
          <circle cx="40" cy="138" r="5" fill="rgba(120,220,180,.18)"/>
        </g>
        <g class="lvl4" style="display:none;" opacity=".95">
          <path d="M178 120 C190 110, 196 122, 188 134" fill="none" stroke="rgba(255,210,120,.18)" stroke-width="4" stroke-linecap="round"/>
          <circle cx="188" cy="136" r="5" fill="rgba(255,210,120,.18)"/>
        </g>

        <rect x="62" y="64" width="96" height="22" rx="11"
              fill="rgba(12,10,14,.40)" stroke="rgba(255,245,220,.20)" stroke-width="3"/>
        <text x="110" y="79" text-anchor="middle" font-size="10" font-weight="900" fill="rgba(255,245,220,.88)">WAREHOUSE</text>
        <text x="110" y="92" text-anchor="middle" font-size="10" font-weight="900" fill="rgba(255,245,220,.78)" class="lvlText">LV1</text>
      </svg>
    `,
    garage: `
      <svg viewBox="0 0 220 190" width="100%" height="100%">
        <ellipse cx="110" cy="172" rx="84" ry="12" fill="rgba(0,0,0,.25)"/>
        <path d="M54 78 L110 42 L166 78 L154 90 L110 62 L66 90 Z"
              fill="rgba(120,220,180,.10)" stroke="rgba(255,245,220,.26)" stroke-width="3" stroke-linejoin="round"/>
        <rect x="52" y="88" width="116" height="80" rx="22"
              fill="rgba(255,245,220,.06)" stroke="rgba(255,245,220,.24)" stroke-width="3"/>
        <rect x="74" y="110" width="72" height="58" rx="18"
              fill="rgba(0,0,0,.24)" stroke="rgba(255,245,220,.16)" stroke-width="3"/>
        <g opacity=".65">
          <path d="M80 122 H140" stroke="rgba(255,245,220,.10)" stroke-width="3"/>
          <path d="M80 134 H140" stroke="rgba(255,245,220,.10)" stroke-width="3"/>
          <path d="M80 146 H140" stroke="rgba(255,245,220,.10)" stroke-width="3"/>
        </g>

        <circle cx="68" cy="120" r="12" fill="rgba(120,180,255,.10)" stroke="rgba(120,180,255,.20)" stroke-width="3"/>
        <path d="M64 120 L72 128" stroke="rgba(255,245,220,.75)" stroke-width="3" stroke-linecap="round"/>
        <path d="M72 114 L78 120" stroke="rgba(255,245,220,.75)" stroke-width="3" stroke-linecap="round"/>

        <g class="lvl2" style="display:none;" opacity=".95">
          <rect x="40" y="148" width="22" height="14" rx="7"
                fill="rgba(255,210,120,.10)" stroke="rgba(255,210,120,.18)" stroke-width="3"/>
        </g>
        <g class="lvl3" style="display:none;" opacity=".95">
          <path d="M170 92 V116" stroke="rgba(255,245,220,.14)" stroke-width="3" stroke-linecap="round"/>
          <circle cx="170" cy="124" r="10" fill="rgba(255,210,120,.12)" stroke="rgba(255,210,120,.20)" stroke-width="3"/>
        </g>
        <g class="lvl4" style="display:none;" opacity=".95">
          <path d="M152 68 C162 54, 176 54, 186 68" fill="none" stroke="rgba(255,210,120,.18)" stroke-width="4" stroke-linecap="round"/>
          <circle cx="169" cy="52" r="4" fill="rgba(255,210,120,.20)"/>
        </g>

        <rect x="62" y="80" width="96" height="22" rx="11"
              fill="rgba(12,10,14,.40)" stroke="rgba(255,245,220,.20)" stroke-width="3"/>
        <text x="110" y="95" text-anchor="middle" font-size="10" font-weight="900" fill="rgba(255,245,220,.88)">WORKSHOP</text>
        <text x="110" y="108" text-anchor="middle" font-size="10" font-weight="900" fill="rgba(255,245,220,.78)" class="lvlText">LV1</text>
      </svg>
    `,
    shop: `
      <svg viewBox="0 0 220 190" width="100%" height="100%">
        <ellipse cx="110" cy="172" rx="84" ry="12" fill="rgba(0,0,0,.25)"/>
        <path d="M58 80 H162 L154 104 H66 Z"
              fill="rgba(255,210,120,.14)" stroke="rgba(255,245,220,.26)" stroke-width="3" stroke-linejoin="round"/>
        <g opacity=".42">
          <path d="M72 80 L68 104" stroke="rgba(0,0,0,.25)" stroke-width="3"/>
          <path d="M92 80 L88 104" stroke="rgba(0,0,0,.25)" stroke-width="3"/>
          <path d="M112 80 L108 104" stroke="rgba(0,0,0,.25)" stroke-width="3"/>
          <path d="M132 80 L128 104" stroke="rgba(0,0,0,.25)" stroke-width="3"/>
          <path d="M152 80 L148 104" stroke="rgba(0,0,0,.25)" stroke-width="3"/>
        </g>

        <rect x="60" y="102" width="104" height="66" rx="22"
              fill="rgba(255,245,220,.06)" stroke="rgba(255,245,220,.24)" stroke-width="3"/>
        <rect x="76" y="120" width="50" height="30" rx="14"
              fill="rgba(120,180,255,.10)" stroke="rgba(120,180,255,.20)" stroke-width="3"/>
        <rect x="134" y="118" width="22" height="50" rx="14"
              fill="rgba(0,0,0,.22)" stroke="rgba(255,245,220,.16)" stroke-width="3"/>
        <circle cx="150" cy="144" r="2.3" fill="rgba(255,210,120,.35)"/>

        <g class="lvl2" style="display:none;" opacity=".95">
          <rect x="78" y="112" width="26" height="10" rx="5" fill="rgba(255,210,120,.10)" stroke="rgba(255,210,120,.18)" stroke-width="3"/>
        </g>
        <g class="lvl3" style="display:none;" opacity=".95">
          <rect x="168" y="132" width="16" height="22" rx="8" fill="rgba(120,180,255,.10)" stroke="rgba(120,180,255,.18)" stroke-width="3"/>
        </g>
        <g class="lvl4" style="display:none;" opacity=".95">
          <rect x="60" y="102" width="104" height="66" rx="22" fill="none" stroke="rgba(255,210,120,.18)" stroke-width="4"/>
        </g>

        <rect x="62" y="64" width="96" height="22" rx="11"
              fill="rgba(12,10,14,.40)" stroke="rgba(255,245,220,.20)" stroke-width="3"/>
        <text x="110" y="79" text-anchor="middle" font-size="10" font-weight="900" fill="rgba(255,245,220,.88)">MARKET</text>
        <text x="110" y="92" text-anchor="middle" font-size="10" font-weight="900" fill="rgba(255,245,220,.78)" class="lvlText">LV1</text>
      </svg>
    `
  };

  function mountBuildingSvgs(){
    $("bOffice").innerHTML = SVG_BODIES.office;
    $("bWarehouse").innerHTML = SVG_BODIES.warehouse;
    $("bGarage").innerHTML = SVG_BODIES.garage;
    $("bShop").innerHTML = SVG_BODIES.shop;
  }

  // ---------------------------
  // Bubble UI
  // ---------------------------
  const bubble = {
    el: $("bubble"),
    catcher: $("bubbleCatcher"),
    closeBtn: $("bubbleClose"),
    title: $("bubbleTitle"),
    subtitle: $("bubbleSubtitle"),
    desc: $("bubbleDesc"),
    owned: $("bubbleOwned"),
    cost: $("bubbleCost"),
    buyBtn: $("bubbleBuyBtn"),
    lockNote: $("bubbleLockNote"),
    lvlPill: $("bubbleLevel"),
    lvlIncome: $("bubbleLevelIncome"),
    lvlCost: $("bubbleLevelCost"),
    lvlBtn: $("bubbleLevelBtn"),
    ctx: null,
    anchor: null
  };

  function positionBubble(){
    if(!bubble.anchor) return;
    const anchor = bubble.anchor.getBoundingClientRect();
    const bub = bubble.el.getBoundingClientRect();
    const padding = 12;

    let left = anchor.left + anchor.width * 0.5 - bub.width * 0.5;
    left = Math.max(padding, Math.min(window.innerWidth - bub.width - padding, left));

    let top = anchor.top - bub.height - 10;
    if (top < 70) top = anchor.bottom + 10;

    bubble.el.style.left = left + "px";
    bubble.el.style.top = top + "px";

    const anchorCenterX = anchor.left + anchor.width * 0.5;
    const tailX = clamp(anchorCenterX - left, 18, bub.width - 18);
    bubble.el.style.setProperty("--tailX", tailX + "px");
  }

  function openBubble(kind, anchorEl){
    bubble.ctx = kind;
    bubble.anchor = anchorEl;
    bubble.el.style.display = "block";
    bubble.catcher.style.display = "block";
    renderBubble();
    requestAnimationFrame(positionBubble);
  }
  function closeBubble(){
    bubble.el.style.display = "none";
    bubble.catcher.style.display = "none";
    bubble.ctx = null;
    bubble.anchor = null;
  }

  function renderBubble(){
    const cash = state.cash || 0;
    const map = { assistant:"office", tools:"warehouse", proc:"workshop", auto:"market" };
    const bKey = map[bubble.ctx];

    if (bKey){
      const lv = state.bLvl[bKey] || 1;
      bubble.lvlPill.textContent = `Building LV ${lv}`;
      bubble.lvlIncome.textContent = `+ ${money(buildingLevelIncomeDelta(bKey))}/s`;
      bubble.lvlCost.textContent = `Cost: ${money(buildingLevelCost(bKey))}`;

      const gate = buildingGateLocked(bKey);
      const canLvl = !gate && cash >= buildingLevelCost(bKey);
      bubble.lvlBtn.disabled = !canLvl;
      bubble.lvlBtn.textContent = gate ? "Locked" : (canLvl ? "Upgrade Building" : "Need more cash");
      bubble.lvlPill.classList.toggle("sparkle", canLvl);
    }

    if (bubble.ctx === "assistant"){
      bubble.title.textContent = "Office";
      bubble.subtitle.textContent = "Hiring & staffing";
      bubble.desc.textContent = "Hire assistants for base income. Upgrade the building to add passive income scaling.";
      bubble.owned.textContent = "Owned: " + (state.owned.assistant||0);
      bubble.cost.textContent = "Cost: " + money(state.assistantCost);
      const can = cash >= state.assistantCost;
      bubble.buyBtn.disabled = !can;
      bubble.buyBtn.textContent = can ? "Hire Assistant" : "Need more cash";
      bubble.lockNote.textContent = "Building LV gates: Warehouse LV upgrades require Office LV2.";
    }

    if (bubble.ctx === "tools"){
      bubble.title.textContent = "Warehouse";
      bubble.subtitle.textContent = "Equipment & output";
      bubble.desc.textContent = "Tools multiply income. Upgrade the building for stronger passive income scaling.";
      bubble.owned.textContent = "Owned: " + (state.owned.tools||0);
      bubble.cost.textContent = "Cost: " + money(state.toolsCost);
      const unlocked = unlockedTools();
      const can = unlocked && cash >= state.toolsCost;
      bubble.buyBtn.disabled = !can;
      bubble.buyBtn.textContent = !unlocked ? "Locked" : (can ? "Buy Tools" : "Need more cash");
      bubble.lockNote.textContent = unlocked ? "Unlocked." : "Locked until: 1 assistant.";
    }

    if (bubble.ctx === "proc"){
      bubble.title.textContent = "Workshop";
      bubble.subtitle.textContent = "Systems & workflow";
      bubble.desc.textContent = "Processes multiply income. Upgrade the building for stronger passive income scaling.";
      bubble.owned.textContent = "Owned: " + (state.owned.proc||0);
      bubble.cost.textContent = "Cost: " + money(state.procCost);
      const unlocked = unlockedProc();
      const can = unlocked && cash >= state.procCost;
      bubble.buyBtn.disabled = !can;
      bubble.buyBtn.textContent = !unlocked ? "Locked" : (can ? "Standardize" : "Need more cash");
      bubble.lockNote.textContent = unlocked ? "Unlocked." : "Locked until: 1 tools.";
    }

    if (bubble.ctx === "auto"){
      bubble.title.textContent = "Market";
      bubble.subtitle.textContent = "Automation & scaling";
      bubble.desc.textContent = "Automation multiplies income hard. Upgrade the building for stronger passive income scaling.";
      bubble.owned.textContent = "Owned: " + (state.owned.auto||0);
      bubble.cost.textContent = "Cost: " + money(state.autoCost);
      const unlocked = unlockedAuto();
      const can = unlocked && cash >= state.autoCost;
      bubble.buyBtn.disabled = !can;
      bubble.buyBtn.textContent = !unlocked ? "Locked" : (can ? "Install Automation" : "Need more cash");
      bubble.lockNote.textContent = unlocked ? "Unlocked." : "Locked until: 1 process.";
    }
  }

  // ---------------------------
  // Level-up FX + visuals
  // ---------------------------
  let lastLevels = null;

  function playLevelUpFx(buildingEl, newLevel){
    SFX.levelUp();
    const r = buildingEl.getBoundingClientRect();
    const cx = r.left + r.width * 0.55;
    const cy = r.top + r.height * 0.30;

    const badge = document.createElement("div");
    badge.className = "fxBadge";
    badge.textContent = `LV${newLevel}!`;
    badge.style.left = cx + "px";
    badge.style.top = (cy - 8) + "px";
    document.body.appendChild(badge);
    setTimeout(() => badge.remove(), 950);

    const burst = document.createElement("div");
    burst.className = "fxBurst";
    burst.style.left = cx + "px";
    burst.style.top = cy + "px";
    document.body.appendChild(burst);

    const count = 14;
    for(let i=0;i<count;i++){
      const p = document.createElement("div");
      const isBlue = i % 3 === 0;
      p.className = "fxParticle" + (isBlue ? " blue" : "");
      const ang = (Math.PI * 2) * (i / count);
      const mag = 18 + Math.random() * 26;
      const dx = Math.cos(ang) * mag;
      const dy = Math.sin(ang) * mag - (10 + Math.random()*8);
      p.style.setProperty("--dx", dx.toFixed(1) + "px");
      p.style.setProperty("--dy", dy.toFixed(1) + "px");
      p.style.left = "0px";
      p.style.top = "0px";
      burst.appendChild(p);
    }
    setTimeout(() => burst.remove(), 700);
  }

  function setBuildingVisual(buildingEl, level){
    buildingEl.dataset.lvl = String(level);
    const svg = buildingEl.querySelector("svg");
    if (!svg) return;

    const txt = svg.querySelector(".lvlText");
    if (txt) txt.textContent = "LV" + level;

    const lvl2 = svg.querySelector(".lvl2");
    const lvl3 = svg.querySelector(".lvl3");
    const lvl4 = svg.querySelector(".lvl4");

    if (lvl2) lvl2.style.display = level >= 2 ? "block" : "none";
    if (lvl3) lvl3.style.display = level >= 3 ? "block" : "none";
    if (lvl4) lvl4.style.display = level >= 4 ? "block" : "none";
  }

  function renderBuildingLevels(){
    const lo = Math.min(4, state.bLvl.office || 1);
    const lw = Math.min(4, state.bLvl.warehouse || 1);
    const lg = Math.min(4, state.bLvl.workshop || 1);
    const ls = Math.min(4, state.bLvl.market || 1);

    const bOffice = $("bOffice");
    const bWarehouse = $("bWarehouse");
    const bGarage = $("bGarage");
    const bShop = $("bShop");

    if (!lastLevels){
      lastLevels = { office: lo, warehouse: lw, workshop: lg, market: ls };
    } else {
      if (lo > lastLevels.office)    playLevelUpFx(bOffice, lo);
      if (lw > lastLevels.warehouse) playLevelUpFx(bWarehouse, lw);
      if (lg > lastLevels.workshop)  playLevelUpFx(bGarage, lg);
      if (ls > lastLevels.market)    playLevelUpFx(bShop, ls);
      lastLevels = { office: lo, warehouse: lw, workshop: lg, market: ls };
    }

    setBuildingVisual(bOffice, lo);
    setBuildingVisual(bWarehouse, lw);
    setBuildingVisual(bGarage, lg);
    setBuildingVisual(bShop, ls);
  }

  // ---------------------------
  // Milestones UI (screen)
  // ---------------------------
  function renderMilestones(){
    const listEl = $("msList");
    const pillEl = $("msBonusPill");
    const noteEl = $("msNote");
    if (!listEl || !pillEl || !noteEl) return;

    if (!MS.exists){
      pillEl.textContent = "Bonus x1.00";
      listEl.innerHTML = "";
      noteEl.textContent = "milestones.js not detected. Confirm milestones.js is in repo root and loaded before game.js.";
      return;
    }

    const b = MS.bonuses();
    const bonusX = (b.globalMult || 1) * (b.buildingMult || 1);
    pillEl.textContent = "Bonus " + fmtX(bonusX);

    const items = MS.list();
    noteEl.textContent = "Bonuses are permanent and stack.";

    const rows = [];
    for (const it of items){
      const prog = clamp(MS.progressFor(it.id, state), 0, 1);
      const pct = Math.round(prog * 100);
      const claimed = !!it.claimed;

      rows.push(`
        <div class="item" style="margin-top:10px; ${claimed ? "opacity:.82;" : ""}">
          <div class="itemTop">
            <div>
              <div class="h">${it.title}</div>
              <div class="small">${it.desc}</div>
            </div>
            <div class="pill mono ${claimed ? "" : "sparkle"}">${claimed ? "CLAIMED" : (pct + "%")}</div>
          </div>
          <div class="hr"></div>
          <div style="height:10px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg, rgba(255,210,120,.24), rgba(120,180,255,.18));"></div>
          </div>
          <div class="small" style="margin-top:8px; opacity:.88;"><b>Reward:</b> ${it.reward}</div>
        </div>
      `);
    }

    listEl.innerHTML = rows.join("");
  }

  // ---------------------------
  // Render
  // ---------------------------
  function renderPeople(){
    const row = $("peopleRow");
    const count = Math.min(12, state.owned.assistant || 0);
    row.innerHTML = "";
    for(let i=0;i<count;i++){
      const p = document.createElement("div");
      p.className = "person";
      p.style.transform = `translateY(${(i%3)*2}px)`;
      row.appendChild(p);
    }
  }

  function setRow(rowEl, btnEl, noteEl, locked, noteText, canBuy){
    if(locked){
      rowEl.classList.add("locked");
      btnEl.disabled = true;
      btnEl.textContent = "Locked";
      noteEl.textContent = noteText;
      rowEl.classList.remove("canBuy");
    } else {
      rowEl.classList.remove("locked");
      btnEl.disabled = !canBuy;
      btnEl.textContent = canBuy ? "Buy" : "Need more cash";
      noteEl.textContent = noteText;
      rowEl.classList.toggle("canBuy", canBuy);
    }
  }

  function render(){
    const cash = state.cash||0;
    const ips = incomePerSecond();
    const ep = state.ep||0;

    const buildingsIps = buildingIncomeShown();
    const ops = opsMultiplier();
    const pm = prestigeMultiplier();
    const bns = MS.bonuses();
    const gmult = (bns.globalMult || 1);
    const bmult = (bns.buildingMult || 1);

    $("hudCash").textContent = money(cash);
    $("hudIps").textContent = money(ips) + "/s";
    $("hudEp").textContent = String(ep);

    // streak UI
    const streakX = state.streakMult || 1.0;
    $("hudStreak").textContent = fmtX(streakX);
    $("streakPill").textContent = `Streak: ${fmtX(streakX)} (${state.streakCount||0})`;
    const luckPill = $("luckPill");
    const near = (state.goldenHeat || 0) > 0.70 && (state.streakCount || 0) >= 10;
    luckPill.style.display = near ? "inline-flex" : "none";

    $("ownedPill").textContent = "Owned: " + (
      (state.owned.assistant||0) +
      (state.owned.tools||0) +
      (state.owned.proc||0) +
      (state.owned.auto||0)
    );
    $("epPill").textContent = "EP: " + ep;

    // upgrade costs
    $("assistantCost").textContent = money(state.assistantCost);
    $("toolsCost").textContent = money(state.toolsCost);
    $("procCost").textContent = money(state.procCost);
    $("autoCost").textContent = money(state.autoCost);

    const rowA = $("rowAssistant");
    const buyA = $("buyAssistantBtn");
    const canBuyA = cash >= state.assistantCost;
    buyA.disabled = !canBuyA;
    buyA.textContent = canBuyA ? "Buy" : "Need more cash";
    rowA.classList.toggle("canBuy", canBuyA);

    setRow($("rowTools"), $("buyToolsBtn"), $("toolsLockNote"), !unlockedTools(), "Unlocks after: 1 assistant", cash >= state.toolsCost);
    setRow($("rowProc"),  $("buyProcBtn"),  $("procLockNote"),  !unlockedProc(),  "Unlocks after: 1 tools",    cash >= state.procCost);
    setRow($("rowAuto"),  $("buyAutoBtn"),  $("autoLockNote"),  !unlockedAuto(),  "Unlocks after: 1 process",  cash >= state.autoCost);

    // prestige
    $("prestReq").textContent = money(PRESTIGE_GOAL) + " goal";
    const ok = canPrestige();
    const pbtn = $("prestigeBtn");
    pbtn.disabled = !ok;
    pbtn.textContent = ok ? `Prestige (+${epGainIfPrestigeNow()} EP)` : "Prestige (Locked)";
    $("prestHint").textContent = ok ? "Ready. Prestige resets your run but permanently boosts income."
                                   : `Prestige unlocks at ${money(PRESTIGE_GOAL)} cash.`;

    // multipliers panel
    $("multSummary").textContent = fmtX(ops * pm * gmult) + " total";
    $("multDetails").textContent =
      `Buildings ${money(buildingsIps)}/s · Ops ${fmtX(ops)} · Prestige ${fmtX(pm)} · Milestones ${fmtX(gmult)} (global) / ${fmtX(bmult)} (build)`;

    $("lifetime").textContent = money(state.lifetimeEarned||0);
    $("lifetime2").textContent = money(state.lifetimeEarned||0);
    $("statsLine").textContent =
      `${money(ips)}/s · Buildings ${money(buildingsIps)}/s · Ops ${fmtX(ops)} · Prestige ${fmtX(pm)} · MS ${fmtX(gmult)}`;

    // building levels summary
    $("bLvlSummary").textContent =
      `Office ${state.bLvl.office||1} · Warehouse ${state.bLvl.warehouse||1} · Workshop ${state.bLvl.workshop||1} · Market ${state.bLvl.market||1}`;

    // world note
    const note = $("sceneNote");
    const lvlSum = (state.bLvl.office||1) + (state.bLvl.warehouse||1) + (state.bLvl.workshop||1) + (state.bLvl.market||1);
    if (lvlSum <= 4) note.textContent = "starting out";
    else if (lvlSum <= 7) note.textContent = "getting built";
    else if (lvlSum <= 10) note.textContent = "city growing";
    else note.textContent = "empire humming";

    // SFX button
    const sfxBtn = $("sfxToggleBtn");
    sfxBtn.textContent = SFX.isEnabled() ? "SFX: ON" : "SFX: OFF";
    sfxBtn.classList.toggle("gold", SFX.isEnabled());

    // build pill
    const ver = $("verPill");
    if (ver) ver.textContent = BUILD;

    // Work label reflects streak
    const work = $("workBtn");
    const base = 1;
    const perTap = base * (state.streakMult || 1);
    work.textContent = `Do Work (+${money(perTap)})`;

    // glow cues
    $("quickHireBtn").classList.toggle("canBuy", canBuyA);
    $("bOffice").classList.toggle("canBuy", canBuyA);

    const canTools = unlockedTools() && cash >= state.toolsCost;
    const canProc  = unlockedProc()  && cash >= state.procCost;
    const canAuto  = unlockedAuto()  && cash >= state.autoCost;
    $("bWarehouse").classList.toggle("canBuy", canTools);
    $("bGarage").classList.toggle("canBuy", canProc);
    $("bShop").classList.toggle("canBuy", canAuto);

    // visuals
    renderPeople();
    renderBuildingLevels();

    // bubble refresh
    if (bubble.el.style.display === "block"){
      renderBubble();
      positionBubble();
    }

    // milestones screen
    renderMilestones();
  }

  // ---------------------------
  // Tick loop
  // ---------------------------
  function tick(){
    const now = Date.now();
    const dt = (now - state.lastTickMs) / 1000;
    state.lastTickMs = now;

    decayStreak(now);

    const earned = incomePerSecond() * dt;
    if(earned > 0){
      state.cash += earned;
      state.lifetimeEarned += earned;
    }

    // Milestones check (auto-claim)
    MS.tick(state, {
      onMilestoneClaim: (_id, meta) => {
        // subtle status ping; milestones.js also toasts
        if (meta?.title) setStatus(`Milestone: ${meta.title}`);
      }
    });

    if(now - state.lastSaveMs > 10000) save(true);
    render();
  }

  function tryBuy(cost, onSuccess, event){
    if((state.cash||0) < cost){
      if(event) floatText("Need " + money(cost - state.cash), event.clientX, event.clientY);
      return false;
    }
    state.cash -= cost;
    onSuccess();
    return true;
  }

  // ---------------------------
  // Tabs + Bottom Nav
  // ---------------------------
  function setActive(which){
    const isW = which === "world";
    const isU = which === "up";
    const isM = which === "ms";
    const isP = which === "pr";

    $("screenWorld").style.display = isW ? "block" : "none";
    $("screenUpgrades").style.display = isU ? "block" : "none";
    $("screenMilestones").style.display = isM ? "block" : "none";
    $("screenPrestige").style.display = isP ? "block" : "none";

    $("tabWorld").classList.toggle("active", isW);
    $("tabUpgrades").classList.toggle("active", isU);
    $("tabMilestones").classList.toggle("active", isM);
    $("tabPrestige").classList.toggle("active", isP);

    $("navWorld").classList.toggle("active", isW);
    $("navUp").classList.toggle("active", isU);
    $("navMs").classList.toggle("active", isM);
    $("navPr").classList.toggle("active", isP);

    document.querySelector(".buildings").style.display = isW ? "block" : "none";
    $("peopleRow").style.display = isW ? "flex" : "none";
    document.querySelector(".sign").style.display = isW ? "block" : "none";
    if (!isW) closeBubble();
  }

  // ---------------------------
  // Bind events
  // ---------------------------
  function bind(){
    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.tagName === "BUTTON" && !t.disabled) SFX.click();
    }, true);

    $("sfxToggleBtn").addEventListener("click", () => {
      SFX.setEnabled(!SFX.isEnabled());
      setStatus(SFX.isEnabled() ? "SFX enabled" : "SFX disabled");
      render();
    });

    $("workBtn").addEventListener("click", (e) => {
      const now = Date.now();
      updateStreak(now);

      const base = 1;
      const gain = base * (state.streakMult || 1);
      state.cash += gain;
      state.lifetimeEarned += gain;

      floatText("+" + money(gain), e.clientX, e.clientY);
      tryGoldenPayout(gain, e.clientX, e.clientY);

      render();
    });

    $("quickHireBtn").addEventListener("click", (e) => {
      const ok = tryBuy(state.assistantCost, () => {
        state.owned.assistant = (state.owned.assistant||0) + 1;
        state.assistantCost = Math.ceil(state.assistantCost * 1.35);
        setStatus("Assistant hired");
        SFX.purchase();
      }, e);
      if (ok) render();
    });

    $("saveBtn").addEventListener("click", () => save(false));
    $("newRunBtn").addEventListener("click", resetRunKeepEP);
    $("resetBtn").addEventListener("click", hardReset);
    $("prestigeBtn").addEventListener("click", doPrestige);

    $("buyAssistantBtn").addEventListener("click", () => openBubble("assistant", $("bOffice")));
    $("buyToolsBtn").addEventListener("click", () => openBubble("tools", $("bWarehouse")));
    $("buyProcBtn").addEventListener("click", () => openBubble("proc", $("bGarage")));
    $("buyAutoBtn").addEventListener("click", () => openBubble("auto", $("bShop")));

    const bindBuilding = (el, kind) => {
      el.addEventListener("click", () => openBubble(kind, el));
      el.addEventListener("keydown", (e) => {
        if(e.key === "Enter" || e.key === " "){ e.preventDefault(); openBubble(kind, el); }
      });
    };
    bindBuilding($("bOffice"), "assistant");
    bindBuilding($("bWarehouse"), "tools");
    bindBuilding($("bGarage"), "proc");
    bindBuilding($("bShop"), "auto");

    bubble.closeBtn.addEventListener("click", closeBubble);
    bubble.catcher.addEventListener("click", closeBubble);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && bubble.el.style.display === "block") closeBubble();
    });
    window.addEventListener("resize", () => {
      if (bubble.el.style.display === "block") positionBubble();
    });

    // Main purchase button
    bubble.buyBtn.addEventListener("click", (e) => {
      const cash = state.cash || 0;

      if (bubble.ctx === "assistant"){
        const ok = tryBuy(state.assistantCost, () => {
          state.owned.assistant = (state.owned.assistant||0) + 1;
          state.assistantCost = Math.ceil(state.assistantCost * 1.35);
          setStatus("Assistant hired");
          SFX.purchase();
        }, e);
        if(ok) render();
        return;
      }

      if (bubble.ctx === "tools"){
        if(!unlockedTools()) return;
        const ok = tryBuy(state.toolsCost, () => {
          state.owned.tools = (state.owned.tools||0) + 1;
          state.toolsCost = Math.ceil(state.toolsCost * 1.45);
          setStatus("Tools upgraded");
          SFX.purchase();
        }, e);
        if(ok) render();
        return;
      }

      if (bubble.ctx === "proc"){
        if(!unlockedProc()) return;
        const ok = tryBuy(state.procCost, () => {
          state.owned.proc = (state.owned.proc||0) + 1;
          state.procCost = Math.ceil(state.procCost * 1.55);
          setStatus("Processes standardized");
          SFX.purchase();
        }, e);
        if(ok) render();
        return;
      }

      if (bubble.ctx === "auto"){
        if(!unlockedAuto()) return;
        const ok = tryBuy(state.autoCost, () => {
          state.owned.auto = (state.owned.auto||0) + 1;
          state.autoCost = Math.ceil(state.autoCost * 1.70);
          setStatus("Automation installed");
          SFX.purchase();
        }, e);
        if(ok) render();
        return;
      }
    });

    // Building level button
    bubble.lvlBtn.addEventListener("click", (e) => {
      if (!bubble.ctx) return;
      const map = { assistant:"office", tools:"warehouse", proc:"workshop", auto:"market" };
      const key = map[bubble.ctx];
      if (!key) return;

      const gate = buildingGateLocked(key);
      if (gate) { setStatus(gate); return; }

      const cost = buildingLevelCost(key);
      const ok = tryBuy(cost, () => {
        state.bLvl[key] = (state.bLvl[key] || 1) + 1;
        bumpBuildingCost(key);
        setStatus(`${BUILDINGS[key].name} leveled up`);
        SFX.levelUp();
      }, e);
      if (ok) render();
    });

    // Tabs / Nav
    $("tabWorld").addEventListener("click", () => setActive("world"));
    $("tabUpgrades").addEventListener("click", () => setActive("up"));
    $("tabMilestones").addEventListener("click", () => setActive("ms"));
    $("tabPrestige").addEventListener("click", () => setActive("pr"));

    $("navWorld").addEventListener("click", () => setActive("world"));
    $("navUp").addEventListener("click", () => setActive("up"));
    $("navMs").addEventListener("click", () => setActive("ms"));
    $("navPr").addEventListener("click", () => setActive("pr"));
  }

  // ---------------------------
  // Boot
  // ---------------------------
  function boot(){
    mountBuildingSvgs();
    MS.load();

    const hadSave = load();
    safeMerge();
    lastLevels = null;

    applyOfflineProgress();
    bind();
    render();
    setActive("world");
    setStatus(hadSave ? "Loaded" : "New run");

    setInterval(tick, 100);
  }

  function assertDom(){
    const required = [
      "hudCash","hudIps","hudEp","hudStreak","streakPill","workBtn",
      "bOffice","bWarehouse","bGarage","bShop",
      "bubbleLevel","bubbleLevelIncome","bubbleLevelCost","bubbleLevelBtn",
      "bLvlSummary",
      "tabMilestones","navMs","screenMilestones","msList","msBonusPill"
    ];
    for (const id of required){
      if (!document.getElementById(id)) throw new Error(`Missing DOM element #${id}. Check index.html matches game.js.`);
    }
  }

  assertDom();
  boot();
})();

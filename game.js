/* Empire Reigns — Cozy Idle
   Upgrade A:
   - Work combo streak (fast taps increase multiplier)
   - Rare Golden Payout proc (big shiny reward + FX + SFX)
   - UI shows streak + golden hint
   - Crash overlay remains (no silent black screen)
*/
(() => {
  // ---------------------------
  // Crash overlay (prevents silent black screen)
  // ---------------------------
  const BUILD = (window.BUILD || "unknown");
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
              <li>Confirm <b>index.html</b>, <b>styles.css</b>, <b>game.js</b> are in the <b>repo root</b> (same folder).</li>
              <li>Open with cache buster: <b>?v=${BUILD}</b> and hard refresh <b>Ctrl+Shift+R</b>.</li>
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

  window.addEventListener("unhandledrejection", (e) => {
    crash(String(e?.reason || "Unhandled promise rejection"));
  });

  // ---------------------------
  // Utilities
  // ---------------------------
  const SAVE_KEY = "empire_reigns_cozy_v3_upgradeA";
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
  // SFX (WebAudio)
  // ---------------------------
  const SFX = (() => {
    let ctx = null;
    let enabled = true;

    function loadEnabled(){
      const raw = localStorage.getItem(SFX_KEY);
      enabled = raw == null ? true : raw === "1";
    }
    function saveEnabled(){
      localStorage.setItem(SFX_KEY, enabled ? "1" : "0");
    }
    function ensure(){
      if (!ctx){
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
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

      o.connect(g);
      g.connect(ctx.destination);

      o.start(now);
      o.stop(now + t + r + 0.01);
    }

    function click(){
      beep({type:"triangle", f:520, t:0.03, v:0.035, det:-15, a:0.003, r:0.03});
    }
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
      // bright triple chime
      beep({type:"sine", f:880, t:0.08, v:0.055, a:0.004, r:0.10});
      setTimeout(() => beep({type:"triangle", f:1320, t:0.10, v:0.05, a:0.004, r:0.12}), 90);
      setTimeout(() => beep({type:"sine", f:1760, t:0.12, v:0.05, a:0.004, r:0.16}), 210);
    }

    function setEnabled(v){
      enabled = !!v;
      saveEnabled();
    }
    function isEnabled(){ return enabled; }

    // Unlock audio on first interaction
    function armOneTimeUnlock(){
      const handler = () => { ensure(); };
      window.addEventListener("pointerdown", handler, {capture:true, once:true});
    }

    loadEnabled();
    armOneTimeUnlock();

    return { click, purchase, levelUp, prestige, golden, setEnabled, isEnabled, ensure };
  })();

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
    goldenHeat: 0,           // ramps up with streak to make "almost!" feel
    lastGoldenMs: 0
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
    location.reload();
  }

  // ---------------------------
  // Economy
  // ---------------------------
  function opsMultiplier(){
    const toolsMult = Math.pow(1.25, state.owned.tools || 0);
    const procMult  = Math.pow(1.40, state.owned.proc  || 0);
    const autoMult  = Math.pow(2.00, state.owned.auto  || 0);
    return toolsMult * procMult * autoMult;
  }
  function prestigeMultiplier(){ return Math.pow(1.2, state.ep || 0); }
  function baseIncomePerSecond(){ return (state.owned.assistant || 0) * 1.0; }
  function incomePerSecond(){ return baseIncomePerSecond() * opsMultiplier() * prestigeMultiplier(); }

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

    // reset streak/golden
    state.streakCount = 0;
    state.streakMult = 1.0;
    state.lastWorkMs = 0;
    state.goldenHeat = 0;
    state.lastGoldenMs = 0;

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
  // Upgrade A: Streak logic
  // ---------------------------
  const STREAK_WINDOW_MS = 1300;    // tap within this keeps combo alive
  const STREAK_MAX = 45;            // caps multiplier growth
  const STREAK_STEP = 0.025;        // 2.5% per tap (feels good fast)
  const STREAK_MAX_MULT = 2.50;     // max work multiplier

  function updateStreak(nowMs){
    const dt = nowMs - (state.lastWorkMs || 0);
    if (dt <= STREAK_WINDOW_MS){
      state.streakCount = Math.min(STREAK_MAX, (state.streakCount||0) + 1);
    } else {
      state.streakCount = 1;
    }
    state.lastWorkMs = nowMs;

    // multiplier: 1 + step*(count-1), capped
    const m = 1 + STREAK_STEP * Math.max(0, state.streakCount - 1);
    state.streakMult = clamp(m, 1.0, STREAK_MAX_MULT);

    // golden heat increases with streak (psychological “almost there”)
    state.goldenHeat = clamp((state.goldenHeat||0) + 0.08 + (state.streakCount * 0.004), 0, 1.0);
  }

  function decayStreak(nowMs){
    const dt = nowMs - (state.lastWorkMs || 0);
    if (state.streakCount > 0 && dt > STREAK_WINDOW_MS){
      // soft decay rather than instant reset (feels less punishing)
      const over = dt - STREAK_WINDOW_MS;
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

  // ---------------------------
  // Upgrade A: Golden proc logic
  // ---------------------------
  function goldenChance(){
    // base rare chance + streak influence + a little “heat”
    const base = 0.012; // 1.2%
    const streakBoost = 0.010 * Math.min(1, (state.streakCount||0) / 20); // up to +1.0%
    const heatBoost = 0.018 * (state.goldenHeat || 0); // up to +1.8%
    const cooldownOk = (Date.now() - (state.lastGoldenMs||0)) > 1600;
    const raw = base + streakBoost + heatBoost;
    return cooldownOk ? clamp(raw, 0.012, 0.040) : 0; // cap at 4.0%
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

    // payout scales with streak + current economy a bit
    const streakFactor = 1.0 + (state.streakCount || 0) * 0.06;  // big feels
    const econFactor = 1.0 + Math.min(2.0, incomePerSecond() / 40); // scales later but capped
    const payout = baseAmount * (6 + Math.random()*6) * streakFactor * econFactor;

    state.cash += payout;
    state.lifetimeEarned += payout;
    state.lastGoldenMs = Date.now();
    state.goldenHeat = 0; // reset heat after hit

    SFX.golden();
    playGoldFx(x, y);
    floatText("+" + money(payout), x, y);
    setStatus("✨ GOLDEN PAYOUT!");
    return payout;
  }

  // ---------------------------
  // Buildings SVG (same as prior build)
  // ---------------------------
  function mountBuildingSvgs(){
    $("bOffice").innerHTML = officeSvg();
    $("bWarehouse").innerHTML = warehouseSvg();
    $("bGarage").innerHTML = garageSvg();
    $("bShop").innerHTML = shopSvg();
  }

  function officeSvg(){ return `
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
  `; }

  function warehouseSvg(){ return `
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
  `; }

  function garageSvg(){ return `
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
  `; }

  function shopSvg(){ return `
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
  `; }

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

    if (bubble.ctx === "assistant"){
      bubble.title.textContent = "Office";
      bubble.subtitle.textContent = "Hiring & staffing";
      bubble.desc.textContent = "Hire assistants to generate steady income per second.";
      bubble.owned.textContent = "Owned: " + (state.owned.assistant||0);
      bubble.cost.textContent = "Cost: " + money(state.assistantCost);
      const can = cash >= state.assistantCost;
      bubble.buyBtn.disabled = !can;
      bubble.buyBtn.textContent = can ? "Hire Assistant" : "Need more cash";
      bubble.lockNote.textContent = "Unlock: available immediately.";
    }

    if (bubble.ctx === "tools"){
      bubble.title.textContent = "Warehouse";
      bubble.subtitle.textContent = "Equipment & output";
      bubble.desc.textContent = "Better tools multiply income. Unlocks after hiring 1 assistant.";
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
      bubble.desc.textContent = "Standardize processes multiply income. Unlocks after buying 1 tools.";
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
      bubble.desc.textContent = "Automation multiplies income hard. Unlocks after buying 1 process.";
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
  // Leveling + FX (existing)
  // ---------------------------
  let lastLevels = null;

  function levelOffice(assistants){
    if (assistants >= 6) return 4;
    if (assistants >= 3) return 3;
    if (assistants >= 1) return 2;
    return 1;
  }
  function levelGeneric(n){
    if (n >= 3) return 4;
    if (n >= 2) return 3;
    if (n >= 1) return 2;
    return 1;
  }

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
    const a = state.owned.assistant || 0;
    const t = state.owned.tools || 0;
    const p = state.owned.proc || 0;
    const x = state.owned.auto || 0;

    const lo = levelOffice(a);
    const lt = levelGeneric(t);
    const lp = levelGeneric(p);
    const lx = levelGeneric(x);

    const bOffice = $("bOffice");
    const bWarehouse = $("bWarehouse");
    const bGarage = $("bGarage");
    const bShop = $("bShop");

    if (!lastLevels){
      lastLevels = { office: lo, warehouse: lt, garage: lp, shop: lx };
    } else {
      if (lo > lastLevels.office)    playLevelUpFx(bOffice, lo);
      if (lt > lastLevels.warehouse) playLevelUpFx(bWarehouse, lt);
      if (lp > lastLevels.garage)    playLevelUpFx(bGarage, lp);
      if (lx > lastLevels.shop)      playLevelUpFx(bShop, lx);
      lastLevels = { office: lo, warehouse: lt, garage: lp, shop: lx };
    }

    setBuildingVisual(bOffice, lo);
    setBuildingVisual(bWarehouse, lt);
    setBuildingVisual(bGarage, lp);
    setBuildingVisual(bShop, lx);
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

    $("hudCash").textContent = money(cash);
    $("hudIps").textContent = money(ips) + "/s";
    $("hudEp").textContent = String(ep);

    // Streak UI
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

    $("prestReq").textContent = money(PRESTIGE_GOAL) + " goal";
    const ok = canPrestige();
    const pbtn = $("prestigeBtn");
    pbtn.disabled = !ok;
    pbtn.textContent = ok ? `Prestige (+${epGainIfPrestigeNow()} EP)` : "Prestige (Locked)";
    $("prestHint").textContent = ok ? "Ready. Prestige resets your run but permanently boosts income."
                                   : `Prestige unlocks at ${money(PRESTIGE_GOAL)} cash.`;

    const ops = opsMultiplier();
    const pm = prestigeMultiplier();
    $("multSummary").textContent = fmtX(ops * pm) + " total";
    $("multDetails").textContent = `Ops ${fmtX(ops)} · Prestige ${fmtX(pm)}`;

    $("lifetime").textContent = money(state.lifetimeEarned||0);
    $("lifetime2").textContent = money(state.lifetimeEarned||0);
    $("statsLine").textContent = `${money(ips)}/s · Ops ${fmtX(ops)} · Prestige ${fmtX(pm)}`;

    const note = $("sceneNote");
    const aa = (state.owned.assistant||0) > 0;
    const tt = (state.owned.tools||0) > 0;
    const pp = (state.owned.proc||0) > 0;
    const xx = (state.owned.auto||0) > 0;
    if (!aa && !tt && !pp && !xx) note.textContent = "starting out";
    else if (aa && !tt) note.textContent = "hired help";
    else if (tt && !pp) note.textContent = "better tools";
    else if (pp && !xx) note.textContent = "systems in place";
    else note.textContent = "automation online";

    $("quickHireBtn").classList.toggle("canBuy", canBuyA);

    const bOffice = $("bOffice");
    const bWarehouse = $("bWarehouse");
    const bGarage = $("bGarage");
    const bShop = $("bShop");

    bOffice.classList.toggle("canBuy", canBuyA);
    bWarehouse.classList.toggle("canBuy", unlockedTools() && cash >= state.toolsCost);
    bGarage.classList.toggle("canBuy", unlockedProc() && cash >= state.procCost);
    bShop.classList.toggle("canBuy", unlockedAuto() && cash >= state.autoCost);

    renderPeople();
    renderBuildingLevels();

    if (bubble.el.style.display === "block"){
      renderBubble();
      positionBubble();
    }

    const sfxBtn = $("sfxToggleBtn");
    sfxBtn.textContent = SFX.isEnabled() ? "SFX: ON" : "SFX: OFF";
    sfxBtn.classList.toggle("gold", SFX.isEnabled());

    const ver = $("verPill");
    if (ver) ver.textContent = BUILD;

    // Work button label reflects streak
    const work = $("workBtn");
    const base = 1;
    const perTap = base * (state.streakMult || 1);
    work.textContent = `Do Work (+${money(perTap).replace("$","$")})`;
  }

  // ---------------------------
  // Tick loop
  // ---------------------------
  function tick(){
    const now = Date.now();
    const dt = (now - state.lastTickMs) / 1000;
    state.lastTickMs = now;

    // streak decay (soft)
    decayStreak(now);

    const earned = incomePerSecond() * dt;
    if(earned > 0){
      state.cash += earned;
      state.lifetimeEarned += earned;
    }

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
    const isP = which === "pr";

    $("screenWorld").style.display = isW ? "block" : "none";
    $("screenUpgrades").style.display = isU ? "block" : "none";
    $("screenPrestige").style.display = isP ? "block" : "none";

    $("tabWorld").classList.toggle("active", isW);
    $("tabUpgrades").classList.toggle("active", isU);
    $("tabPrestige").classList.toggle("active", isP);

    $("navWorld").classList.toggle("active", isW);
    $("navUp").classList.toggle("active", isU);
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
      if (t.tagName === "BUTTON" && !t.disabled){
        SFX.click();
      }
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

      // Try golden payout (uses streak & heat)
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

    bubble.buyBtn.addEventListener("click", (e) => {
      if(!bubble.ctx) return;

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
        if(!((state.owned.assistant||0) >= 1)) return;
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
        if(!((state.owned.tools||0) >= 1)) return;
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
        if(!((state.owned.proc||0) >= 1)) return;
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

    $("tabWorld").addEventListener("click", () => setActive("world"));
    $("tabUpgrades").addEventListener("click", () => setActive("up"));
    $("tabPrestige").addEventListener("click", () => setActive("pr"));
    $("navWorld").addEventListener("click", () => setActive("world"));
    $("navUp").addEventListener("click", () => setActive("up"));
    $("navPr").addEventListener("click", () => setActive("pr"));
  }

  // ---------------------------
  // Boot
  // ---------------------------
  function boot(){
    mountBuildingSvgs();

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

  // Final safety: if key DOM nodes missing, throw so overlay tells you
  function assertDom(){
    const required = ["hudCash","hudIps","hudEp","hudStreak","streakPill","workBtn","bOffice","bWarehouse","bGarage","bShop"];
    for (const id of required){
      if (!document.getElementById(id)) throw new Error(`Missing DOM element #${id}. Check index.html matches game.js.`);
    }
  }

  assertDom();
  boot();
})();

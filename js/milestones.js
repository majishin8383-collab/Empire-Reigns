/* Empire Reigns — Milestones (Upgrade C)
   Build: ER-20260109c-m1
   This module is SAFE to add before game.js exposes the API.
   It will quietly wait until window.ER_API exists.
*/
(() => {
  const BUILD = "ER-20260109c-m1";

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const money = (n) => {
    const abs = Math.abs(n);
    if (abs >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
    if (abs >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
    if (abs >= 1e3) return "$" + (n / 1e3).toFixed(2) + "K";
    return "$" + n.toFixed(2);
  };

  // Persistent storage key (separate from main save; we’ll merge later in game.js)
  const KEY = "empire_reigns_milestones_v1";

  const DEFAULT = {
    version: 1,
    claimed: {},         // id -> true
    bonuses: {           // applied globally (multiplicative)
      globalMult: 1.0,   // multiplies total income
      buildingMult: 1.0, // multiplies building income portion
      streakHold: 1.0    // multiplies streak decay window (higher = slower decay)
    },
    lastToastTs: 0
  };

  const store = {
    data: { ...DEFAULT },
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return;
        const d = JSON.parse(raw);
        if (!d || typeof d !== "object") return;
        this.data = {
          ...DEFAULT,
          ...d,
          claimed: { ...(d.claimed || {}) },
          bonuses: { ...DEFAULT.bonuses, ...(d.bonuses || {}) }
        };
      } catch {}
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch {}
    },
    isClaimed(id) { return !!this.data.claimed[id]; },
    claim(id) { this.data.claimed[id] = true; this.save(); }
  };

  // Milestones (simple, dopamine, stackable)
  // Each gives a small permanent bonus.
  const M = [
    {
      id: "m_assistant_1",
      title: "First Hire",
      desc: "Hire 1 assistant.",
      reward: "+2% global income",
      bonus: { globalMult: 1.02 },
      check: (s) => (s?.owned?.assistant || 0) >= 1,
      progress: (s) => clamp((s?.owned?.assistant || 0) / 1, 0, 1)
    },
    {
      id: "m_office_lv2",
      title: "Office Expansion",
      desc: "Upgrade Office to LV2.",
      reward: "+3% building income",
      bonus: { buildingMult: 1.03 },
      check: (s) => (s?.bLvl?.office || 1) >= 2,
      progress: (s) => clamp(((s?.bLvl?.office || 1) - 1) / 1, 0, 1)
    },
    {
      id: "m_cash_1k",
      title: "First Grand",
      desc: "Reach $1K cash in a run.",
      reward: "+2% global income",
      bonus: { globalMult: 1.02 },
      check: (s) => (s?.cash || 0) >= 1000,
      progress: (s) => clamp((s?.cash || 0) / 1000, 0, 1)
    },
    {
      id: "m_cash_10k",
      title: "Five Figures",
      desc: "Reach $10K cash in a run.",
      reward: "+3% global income",
      bonus: { globalMult: 1.03 },
      check: (s) => (s?.cash || 0) >= 10000,
      progress: (s) => clamp((s?.cash || 0) / 10000, 0, 1)
    },
    {
      id: "m_prestige_1",
      title: "Rebirth",
      desc: "Prestige 1 time.",
      reward: "+5% global income",
      bonus: { globalMult: 1.05 },
      check: (s) => (s?.prestigeCount || 0) >= 1,
      progress: (s) => clamp((s?.prestigeCount || 0) / 1, 0, 1)
    },
    {
      id: "m_streak_x2",
      title: "In The Zone",
      desc: "Hit streak multiplier x2.00+.",
      reward: "+15% streak hold (decay slower)",
      bonus: { streakHold: 1.15 },
      check: (s) => (s?.streakMult || 1) >= 2.0,
      progress: (s) => clamp(((s?.streakMult || 1) - 1) / 1, 0, 1)
    }
  ];

  // Apply bonus multiplicatively
  function applyBonus(b) {
    const cur = store.data.bonuses;
    if (b.globalMult) cur.globalMult *= b.globalMult;
    if (b.buildingMult) cur.buildingMult *= b.buildingMult;
    if (b.streakHold) cur.streakHold *= b.streakHold;
    store.save();
  }

  // Simple toast (non-invasive)
  function toast(text) {
    const now = Date.now();
    if (now - (store.data.lastToastTs || 0) < 900) return;
    store.data.lastToastTs = now;
    store.save();

    const d = document.createElement("div");
    d.style.cssText = `
      position:fixed; left:50%; bottom:92px; transform:translateX(-50%);
      z-index:9999; padding:10px 12px; border-radius:16px;
      border:1px solid rgba(255,220,120,.30);
      background:rgba(12,10,14,.70); color:rgba(255,245,220,.95);
      font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;
      font-weight:950; letter-spacing:.2px; font-size:12px;
      box-shadow:0 0 0 1px rgba(255,220,120,.12), 0 30px 90px rgba(0,0,0,.65);
      backdrop-filter: blur(10px);
    `;
    d.textContent = text;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 1200);
  }

  // Public API: consumed by game.js once we wire it
  const Milestones = {
    BUILD,
    load: () => store.load(),
    getBonuses: () => ({ ...store.data.bonuses }),
    getList: () => M.map(x => ({
      id: x.id,
      title: x.title,
      desc: x.desc,
      reward: x.reward,
      claimed: store.isClaimed(x.id),
      // progress requires state; filled later
    })),
    // Called on tick with (state, hooks)
    tick: (state, hooks = {}) => {
      // hooks: { onMilestoneClaim?: (id, meta)=>void }
      for (const m of M) {
        if (store.isClaimed(m.id)) continue;
        if (!m.check(state)) continue;

        store.claim(m.id);
        applyBonus(m.bonus);

        toast(`Milestone: ${m.title} — ${m.reward}`);
        if (typeof hooks.onMilestoneClaim === "function") {
          hooks.onMilestoneClaim(m.id, { title: m.title, reward: m.reward });
        }
      }
    },
    // Helper for UI panels later
    progressFor: (id, state) => {
      const m = M.find(x => x.id === id);
      if (!m) return 0;
      return m.progress(state);
    },
    // Debug
    _wipe: () => { localStorage.removeItem(KEY); store.data = { ...DEFAULT }; }
  };

  // Expose globally so game.js can call it later
  window.ER_MILESTONES = Milestones;

  // Load immediately
  store.load();
})();

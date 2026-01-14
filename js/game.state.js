/* Empire Reigns — Cozy Idle
   State + Persistence
   Build: ER-20260109d2d-state1
*/
(() => {
  const BUILD = "ER-20260109d2d";
  window.ER = window.ER || {};
  window.BUILD = window.BUILD || BUILD;

  // Keep your existing save key so we don't nuke player progress.
  const SAVE_KEY = "empire_reigns_cozy_v5_milestones";

  // If other modules already created ER.state, we respect it.
  const state = (window.ER.state = window.ER.state || {
    // core
    cash: 0,
    lastTickMs: Date.now(),
    lastSaveMs: Date.now(),
    lifetimeEarned: 0,
    ep: 0,
    prestigeCount: 0,

    // upgrades
    owned: { assistant: 0, tools: 0, proc: 0, auto: 0 },
    assistantCost: 25,
    toolsCost: 60,
    procCost: 150,
    autoCost: 400,

    // streak / golden
    streakCount: 0,
    streakMult: 1.0,
    lastWorkMs: 0,
    goldenHeat: 0,
    lastGoldenMs: 0,

    // buildings
    bLvl: { office: 1, warehouse: 1, workshop: 1, market: 1 },
    bCost: { office: 50, warehouse: 120, workshop: 280, market: 650 },

    // fx timers
    nextSparkleMs: Date.now() + 1400,

    // ✅ MONETIZATION (new)
    starterPack: false, // permanent 2× income
  });

  function safeMerge() {
    // ensure objects exist
    state.owned = Object.assign({ assistant: 0, tools: 0, proc: 0, auto: 0 }, state.owned || {});
    state.bLvl = Object.assign({ office: 1, warehouse: 1, workshop: 1, market: 1 }, state.bLvl || {});
    state.bCost = Object.assign({ office: 50, warehouse: 120, workshop: 280, market: 650 }, state.bCost || {});

    // ensure numbers
    const nums = [
      "cash","lastTickMs","lastSaveMs","lifetimeEarned","ep","prestigeCount",
      "assistantCost","toolsCost","procCost","autoCost",
      "streakCount","streakMult","lastWorkMs","goldenHeat","lastGoldenMs",
      "nextSparkleMs"
    ];
    for (const k of nums) {
      if (typeof state[k] !== "number" || Number.isNaN(state[k])) {
        // set sensible defaults
        if (k === "streakMult") state[k] = 1.0;
        else if (k.endsWith("Cost")) {
          // leave costs alone if missing: fall back to baseline
          const base = { assistantCost:25, toolsCost:60, procCost:150, autoCost:400 };
          state[k] = base[k] || 0;
        } else if (k === "nextSparkleMs") state[k] = Date.now() + 1400;
        else state[k] = 0;
      }
    }

    // ✅ monetization default (important for old saves)
    if (typeof state.starterPack !== "boolean") state.starterPack = false;
  }

  function save(silent = false) {
    state.lastSaveMs = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      // If storage fails, we don't crash the game.
      console.warn("Save failed:", e);
    }
    if (!silent && window.ER.ui?.setStatus) window.ER.ui.setStatus("Saved");
  }

  function load() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const obj = JSON.parse(raw);
      Object.assign(state, obj);
      safeMerge();
      return true;
    } catch (e) {
      console.warn("Load failed:", e);
      return false;
    }
  }

  // Optional helpers (used by existing UI buttons in many builds)
  function hardReset() {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }

  // Export under ER.persist so other modules can call it without imports.
  window.ER.persist = Object.assign(window.ER.persist || {}, {
    SAVE_KEY,
    safeMerge,
    save,
    load,
    hardReset,
  });

  // Make sure defaults are sane even on first load.
  safeMerge();
})();

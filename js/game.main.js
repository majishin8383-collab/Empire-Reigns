/* Empire Reigns — game.main.js
   Build: ER-20260109d2d
   Purpose: wiring + events + tick loop + boot
*/
(() => {
  const ER = (window.ER = window.ER || {});
  const S  = ER.state;
  const U  = ER.util;
  const E  = ER.econ;

  // ---------------------------
  // Bubble modal controls (simple)
  // ---------------------------
  const bubble = {
    el: null,
    catcher: null,
    closeBtn: null,
    title: null,
    subtitle: null,
    desc: null,
    owned: null,
    cost: null,
    buyBtn: null,
    lockNote: null,
    lvlPill: null,
    lvlIncome: null,
    lvlCost: null,
    lvlBtn: null,
    ctx: null
  };

  function cacheBubbleEls(){
    bubble.el = U.$("bubble");
    bubble.catcher = U.$("bubbleCatcher");
    bubble.closeBtn = U.$("bubbleClose");
    bubble.title = U.$("bubbleTitle");
    bubble.subtitle = U.$("bubbleSubtitle");
    bubble.desc = U.$("bubbleDesc");
    bubble.owned = U.$("bubbleOwned");
    bubble.cost = U.$("bubbleCost");
    bubble.buyBtn = U.$("bubbleBuyBtn");
    bubble.lockNote = U.$("bubbleLockNote");
    bubble.lvlPill = U.$("bubbleLevel");
    bubble.lvlIncome = U.$("bubbleLevelIncome");
    bubble.lvlCost = U.$("bubbleLevelCost");
    bubble.lvlBtn = U.$("bubbleLevelBtn");
  }

  function openBubble(kind){
    bubble.ctx = kind;
    bubble.el.style.display = "block";
    bubble.catcher.style.display = "block";
    renderBubble();
  }

  function closeBubble(){
    bubble.el.style.display = "none";
    bubble.catcher.style.display = "none";
    bubble.ctx = null;
  }

  function renderBubble(){
    if (!bubble.ctx) return;

    const cash = S.cash || 0;
    const map = { assistant:"office", tools:"warehouse", proc:"workshop", auto:"market" };
    const bKey = map[bubble.ctx];

    if (bKey){
      const lv = S.bLvl[bKey] || 1;
      bubble.lvlPill.textContent = `Building LV ${lv}`;
      bubble.lvlIncome.textContent = `+ ${U.money(E.buildingLevelIncomeDelta(bKey))}/s`;
      bubble.lvlCost.textContent = `Cost: ${U.money(E.buildingLevelCost(bKey))}`;

      const gate = E.buildingGateLocked(bKey);
      const canLvl = !gate && cash >= E.buildingLevelCost(bKey);
      bubble.lvlBtn.disabled = !canLvl;
      bubble.lvlBtn.textContent = gate ? "Locked" : (canLvl ? "Upgrade Building" : "Need more cash");
    }

    if (bubble.ctx === "assistant"){
      bubble.title.textContent = "Office";
      bubble.subtitle.textContent = "Hiring & staffing";
      bubble.desc.textContent = "Hire assistants for base income. Upgrade the building to add passive income scaling.";
      bubble.owned.textContent = "Owned: " + (S.owned.assistant||0);
      bubble.cost.textContent = "Cost: " + U.money(S.assistantCost);
      const can = cash >= S.assistantCost;
      bubble.buyBtn.disabled = !can;
      bubble.buyBtn.textContent = can ? "Hire Assistant" : "Need more cash";
      bubble.lockNote.textContent = "Building LV gates: Warehouse LV upgrades require Office LV2.";
    }

    if (bubble.ctx === "tools"){
      bubble.title.textContent = "Warehouse";
      bubble.subtitle.textContent = "Equipment & output";
      bubble.desc.textContent = "Tools multiply income. Upgrade the building for stronger passive income scaling.";
      bubble.owned.textContent = "Owned: " + (S.owned.tools||0);
      bubble.cost.textContent = "Cost: " + U.money(S.toolsCost);
      const unlocked = E.unlockedTools();
      const can = unlocked && cash >= S.toolsCost;
      bubble.buyBtn.disabled = !can;
      bubble.buyBtn.textContent = !unlocked ? "Locked" : (can ? "Buy Tools" : "Need more cash");
      bubble.lockNote.textContent = unlocked ? "Unlocked." : "Locked until: 1 assistant.";
    }

    if (bubble.ctx === "proc"){
      bubble.title.textContent = "Workshop";
      bubble.subtitle.textContent = "Systems & workflow";
      bubble.desc.textContent = "Processes multiply income. Upgrade the building for stronger passive income scaling.";
      bubble.owned.textContent = "Owned: " + (S.owned.proc||0);
      bubble.cost.textContent = "Cost: " + U.money(S.procCost);
      const unlocked = E.unlockedProc();
      const can = unlocked && cash >= S.procCost;
      bubble.buyBtn.disabled = !can;
      bubble.buyBtn.textContent = !unlocked ? "Locked" : (can ? "Standardize" : "Need more cash");
      bubble.lockNote.textContent = unlocked ? "Unlocked." : "Locked until: 1 tools.";
    }

    if (bubble.ctx === "auto"){
      bubble.title.textContent = "Market";
      bubble.subtitle.textContent = "Automation & scaling";
      bubble.desc.textContent = "Automation multiplies income hard. Upgrade the building for stronger passive income scaling.";
      bubble.owned.textContent = "Owned: " + (S.owned.auto||0);
      bubble.cost.textContent = "Cost: " + U.money(S.autoCost);
      const unlocked = E.unlockedAuto();
      const can = unlocked && cash >= S.autoCost;
      bubble.buyBtn.disabled = !can;
      bubble.buyBtn.textContent = !unlocked ? "Locked" : (can ? "Install Automation" : "Need more cash");
      bubble.lockNote.textContent = unlocked ? "Unlocked." : "Locked until: 1 process.";
    }
  }

  // ---------------------------
  // Tabs / Nav
  // ---------------------------
  function setActive(which){
    const isW = which === "world";
    const isU = which === "up";
    const isM = which === "ms";
    const isP = which === "pr";

    U.$("screenWorld").style.display = isW ? "block" : "none";
    U.$("screenUpgrades").style.display = isU ? "block" : "none";
    U.$("screenMilestones").style.display = isM ? "block" : "none";
    U.$("screenPrestige").style.display = isP ? "block" : "none";

    U.$("tabWorld").classList.toggle("active", isW);
    U.$("tabUpgrades").classList.toggle("active", isU);
    U.$("tabMilestones").classList.toggle("active", isM);
    U.$("tabPrestige").classList.toggle("active", isP);

    U.$("navWorld").classList.toggle("active", isW);
    U.$("navUp").classList.toggle("active", isU);
    U.$("navMs").classList.toggle("active", isM);
    U.$("navPr").classList.toggle("active", isP);

    document.querySelector(".buildings").style.display = isW ? "block" : "none";
    U.$("peopleRow").style.display = isW ? "flex" : "none";
    document.querySelector(".sign").style.display = isW ? "block" : "none";

    if (!isW) closeBubble();
  }

  // ---------------------------
  // Milestones screen (optional; safe if milestones missing)
  // ---------------------------
  function renderMilestones(){
    const listEl = U.$("msList");
    const pillEl = U.$("msBonusPill");
    const noteEl = U.$("msNote");
    if (!listEl || !pillEl || !noteEl) return;

    if (!ER.ms || !ER.ms.exists){
      pillEl.textContent = "Bonus x1.00";
      listEl.innerHTML = "";
      noteEl.textContent = "milestones.js not detected (ok for now).";
      return;
    }

    const b = ER.ms.bonuses();
    pillEl.textContent = "Bonus " + U.fmtX(b.globalMult || 1);
    noteEl.textContent = "Bonuses are permanent and stack.";

    const items = ER.ms.list();
    const rows = [];
    for (const it of items){
      const prog = U.clamp(ER.ms.progressFor(it.id, S), 0, 1);
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
  // Tick loop
  // ---------------------------
  function tick(){
    const now = Date.now();
    const dt = (now - S.lastTickMs) / 1000;
    S.lastTickMs = now;

    E.decayStreak(now);

    const earned = E.incomePerSecond() * dt;
    if (earned > 0){
      S.cash += earned;
      S.lifetimeEarned += earned;
    }

    // milestones tick (auto-claim safe)
    ER.ms?.tick?.(S, { onMilestoneClaim: (_id, meta) => { if (meta?.title) U.setStatus(`Milestone: ${meta.title}`); } });

    // autosave
    if (now - S.lastSaveMs > 10000) ER.persist.save(true);

    // render
    ER.ui.renderAll();
    renderMilestones();

    if (bubble.el.style.display === "block") renderBubble();
  }

  // ---------------------------
  // Events
  // ---------------------------
  function bind(){
    // Tabs / nav
    U.$("tabWorld").addEventListener("click", () => setActive("world"));
    U.$("tabUpgrades").addEventListener("click", () => setActive("up"));
    U.$("tabMilestones").addEventListener("click", () => setActive("ms"));
    U.$("tabPrestige").addEventListener("click", () => setActive("pr"));

    U.$("navWorld").addEventListener("click", () => setActive("world"));
    U.$("navUp").addEventListener("click", () => setActive("up"));
    U.$("navMs").addEventListener("click", () => setActive("ms"));
    U.$("navPr").addEventListener("click", () => setActive("pr"));

    // Bubble close
    bubble.closeBtn.addEventListener("click", closeBubble);
    bubble.catcher.addEventListener("click", closeBubble);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && bubble.el.style.display === "block") closeBubble();
    });

    // Do Work
    U.$("workBtn").addEventListener("click", (e) => {
      const now = Date.now();
      E.updateStreak(now);

      const gain = 1 * (S.streakMult || 1);
      S.cash += gain;
      S.lifetimeEarned += gain;

      U.floatText("+" + U.money(gain), e.clientX, e.clientY);

      // golden payout (pure econ) + status
      const payout = E.tryGoldenPayout(gain, e.clientX, e.clientY, ({ payout }) => {
        U.setStatus("✨ GOLDEN PAYOUT!");
        U.floatText("+" + U.money(payout), e.clientX, e.clientY);
      });
      if (payout === 0) U.setStatus("Working…");

      ER.ui.renderAll();
      if (bubble.el.style.display === "block") renderBubble();
    });

    // Quick Hire (assistant)
    U.$("quickHireBtn").addEventListener("click", (e) => {
      if (!E.spend(S.assistantCost)) {
        U.floatText("Need " + U.money(S.assistantCost - (S.cash||0)), e.clientX, e.clientY);
        return;
      }
      S.owned.assistant = (S.owned.assistant||0) + 1;
      S.assistantCost = Math.ceil(S.assistantCost * 1.35);
      U.setStatus("Assistant hired");
      ER.ui.renderAll();
      if (bubble.el.style.display === "block") renderBubble();
    });

    // Save / Reset / New Run / Prestige
    U.$("saveBtn").addEventListener("click", () => ER.persist.save(false));
    U.$("resetBtn").addEventListener("click", ER.persist.hardReset);

    U.$("newRunBtn").addEventListener("click", () => {
      ER.reset.resetRunKeepEP();
      closeBubble();
      U.setStatus("New run started");
      ER.ui.renderAll();
      renderMilestones();
    });

    U.$("prestigeBtn").addEventListener("click", () => {
      if (!E.canPrestige()) return;
      const gain = E.epGainIfPrestigeNow();
      S.ep = (S.ep||0) + gain;
      S.prestigeCount = (S.prestigeCount||0) + 1;

      ER.reset.resetRunKeepEP();
      closeBubble();
      U.setStatus(`Prestiged: +${gain} EP`);
      ER.ui.renderAll();
      renderMilestones();
    });

    // Open bubble from upgrades panel buttons
    U.$("buyAssistantBtn").addEventListener("click", () => openBubble("assistant"));
    U.$("buyToolsBtn").addEventListener("click", () => openBubble("tools"));
    U.$("buyProcBtn").addEventListener("click", () => openBubble("proc"));
    U.$("buyAutoBtn").addEventListener("click", () => openBubble("auto"));

    // Open bubble from buildings
    U.$("bOffice").addEventListener("click", () => openBubble("assistant"));
    U.$("bWarehouse").addEventListener("click", () => openBubble("tools"));
    U.$("bGarage").addEventListener("click", () => openBubble("proc"));
    U.$("bShop").addEventListener("click", () => openBubble("auto"));

    // Bubble: buy button
    bubble.buyBtn.addEventListener("click", (e) => {
      const cash = S.cash || 0;

      if (bubble.ctx === "assistant"){
        if (!E.spend(S.assistantCost)) { U.floatText("Need cash", e.clientX, e.clientY); return; }
        S.owned.assistant = (S.owned.assistant||0) + 1;
        S.assistantCost = Math.ceil(S.assistantCost * 1.35);
        U.setStatus("Assistant hired");
      }

      if (bubble.ctx === "tools"){
        if (!E.unlockedTools()) return;
        if (!E.spend(S.toolsCost)) { U.floatText("Need cash", e.clientX, e.clientY); return; }
        S.owned.tools = (S.owned.tools||0) + 1;
        S.toolsCost = Math.ceil(S.toolsCost * 1.45);
        U.setStatus("Tools upgraded");
      }

      if (bubble.ctx === "proc"){
        if (!E.unlockedProc()) return;
        if (!E.spend(S.procCost)) { U.floatText("Need cash", e.clientX, e.clientY); return; }
        S.owned.proc = (S.owned.proc||0) + 1;
        S.procCost = Math.ceil(S.procCost * 1.55);
        U.setStatus("Processes standardized");
      }

      if (bubble.ctx === "auto"){
        if (!E.unlockedAuto()) return;
        if (!E.spend(S.autoCost)) { U.floatText("Need cash", e.clientX, e.clientY); return; }
        S.owned.auto = (S.owned.auto||0) + 1;
        S.autoCost = Math.ceil(S.autoCost * 1.70);
        U.setStatus("Automation installed");
      }

      ER.ui.renderAll();
      renderMilestones();
      renderBubble();
    });

    // Bubble: building level upgrade
    bubble.lvlBtn.addEventListener("click", (e) => {
      if (!bubble.ctx) return;
      const map = { assistant:"office", tools:"warehouse", proc:"workshop", auto:"market" };
      const key = map[bubble.ctx];
      if (!key) return;

      const gate = E.buildingGateLocked(key);
      if (gate) { U.setStatus(gate); return; }

      const cost = E.buildingLevelCost(key);
      if (!E.spend(cost)) { U.floatText("Need cash", e.clientX, e.clientY); return; }

      S.bLvl[key] = (S.bLvl[key] || 1) + 1;
      E.bumpBuildingCost(key);
      U.setStatus(`${ER.BUILDINGS[key].name} leveled up`);

      ER.ui.renderAll();
      renderMilestones();
      renderBubble();
    });
  }

  // ---------------------------
  // DOM asserts (helps prevent silent mismatch)
  // ---------------------------
  function assertDom(){
    const required = [
      "hudCash","hudIps","hudEp","hudStreak","streakPill","workBtn",
      "bOffice","bWarehouse","bGarage","bShop",
      "bubbleLevel","bubbleLevelIncome","bubbleLevelCost","bubbleLevelBtn",
      "bLvlSummary",
      "tabMilestones","navMs","screenMilestones","msList","msBonusPill"
    ];
    for (const id of required){
      if (!document.getElementById(id)) throw new Error(`Missing DOM element #${id}. Check index.html matches game files.`);
    }
  }

  // ---------------------------
  // Boot
  // ---------------------------
  function boot(){
    cacheBubbleEls();
    assertDom();

    ER.ms?.load?.();

    const hadSave = ER.persist.load();
    ER.persist.safeMerge?.(); // safe if present
    E.applyOfflineProgress();

    bind();
    ER.ui.renderAll();
    renderMilestones();
    setActive("world");

    U.setStatus(hadSave ? "Loaded" : "New run");
    setInterval(tick, 100);
  }

  window.addEventListener("DOMContentLoaded", boot);
})();

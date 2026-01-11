/* Empire Reigns — game.ui.js
   Build: ER-20260109d2d
   Purpose: rendering + DOM updates + visual FX hooks
*/
(() => {
  const ER = (window.ER = window.ER || {});
  const S  = ER.state;
  const U  = ER.util;
  const E  = ER.econ;

  // ---------------------------
  // Cached DOM helpers
  // ---------------------------
  const $ = U.$;

  // ---------------------------
  // People row (simple idle visuals)
  // ---------------------------
  function renderPeople(){
    const row = $("peopleRow");
    if (!row) return;
    const count = Math.min(12, S.owned.assistant || 0);
    row.innerHTML = "";
    for(let i=0;i<count;i++){
      const p = document.createElement("div");
      p.className = "person";
      p.style.transform = `translateY(${(i%3)*2}px)`;
      row.appendChild(p);
    }
  }

  // ---------------------------
  // Buildings: visual level state
  // ---------------------------
  function setBuildingVisual(buildingEl, level){
    if (!buildingEl) return;
    buildingEl.dataset.lvl = String(level);

    const svg = buildingEl.querySelector("svg");
    if (!svg) return;

    const txt = svg.querySelector(".lvlText");
    if (txt) txt.textContent = "LV" + level;

    ["lvl2","lvl3","lvl4"].forEach((cls, i) => {
      const el = svg.querySelector("." + cls);
      if (el) el.style.display = level >= (i+2) ? "block" : "none";
    });
  }

  function renderBuildingLevels(){
    setBuildingVisual($("bOffice"),    Math.min(4, S.bLvl.office   || 1));
    setBuildingVisual($("bWarehouse"), Math.min(4, S.bLvl.warehouse|| 1));
    setBuildingVisual($("bGarage"),    Math.min(4, S.bLvl.workshop || 1));
    setBuildingVisual($("bShop"),      Math.min(4, S.bLvl.market   || 1));
  }

  // ---------------------------
  // HUD + panels
  // ---------------------------
  function renderHud(){
    $("hudCash").textContent   = U.money(S.cash || 0);
    $("hudIps").textContent    = U.money(E.incomePerSecond()) + "/s";
    $("hudEp").textContent     = String(S.ep || 0);
    $("hudStreak").textContent = U.fmtX(S.streakMult || 1);

    $("streakPill").textContent =
      `Streak: ${U.fmtX(S.streakMult || 1)} (${S.streakCount || 0})`;

    $("ownedPill").textContent =
      "Owned: " +
      ((S.owned.assistant||0)+(S.owned.tools||0)+(S.owned.proc||0)+(S.owned.auto||0));

    $("epPill").textContent = "EP: " + (S.ep||0);

    $("assistantCost").textContent = U.money(S.assistantCost);
    $("toolsCost").textContent     = U.money(S.toolsCost);
    $("procCost").textContent      = U.money(S.procCost);
    $("autoCost").textContent      = U.money(S.autoCost);

    $("bLvlSummary").textContent =
      `Office ${S.bLvl.office||1} · Warehouse ${S.bLvl.warehouse||1} · Workshop ${S.bLvl.workshop||1} · Market ${S.bLvl.market||1}`;

    const luck = $("luckPill");
    const near = (S.goldenHeat || 0) > 0.7 && (S.streakCount || 0) >= 10;
    luck.style.display = near ? "inline-flex" : "none";

    $("verPill").textContent = ER.BUILD;
  }

  // ---------------------------
  // Upgrade rows (enabled / locked)
  // ---------------------------
  function renderUpgradeRows(){
    const cash = S.cash || 0;

    const canA = cash >= S.assistantCost;
    $("rowAssistant").classList.toggle("canBuy", canA);

    function setRow(row, btn, note, locked, canBuy, msg){
      row.classList.toggle("locked", locked);
      row.classList.toggle("canBuy", canBuy && !locked);
      btn.disabled = locked || !canBuy;
      btn.textContent = locked ? "Locked" : (canBuy ? "Open" : "Need more cash");
      if (note) note.textContent = msg || "";
    }

    setRow(
      $("rowTools"),
      $("buyToolsBtn"),
      $("toolsLockNote"),
      !E.unlockedTools(),
      cash >= S.toolsCost,
      "Unlocks after: 1 assistant"
    );

    setRow(
      $("rowProc"),
      $("buyProcBtn"),
      $("procLockNote"),
      !E.unlockedProc(),
      cash >= S.procCost,
      "Unlocks after: 1 tools"
    );

    setRow(
      $("rowAuto"),
      $("buyAutoBtn"),
      $("autoLockNote"),
      !E.unlockedAuto(),
      cash >= S.autoCost,
      "Unlocks after: 1 process"
    );
  }

  // ---------------------------
  // Prestige panel
  // ---------------------------
  function renderPrestige(){
    const ok = E.canPrestige();
    $("prestReq").textContent = U.money(E.PRESTIGE_GOAL) + " goal";

    const btn = $("prestigeBtn");
    btn.disabled = !ok;
    btn.textContent = ok
      ? `Prestige (+${E.epGainIfPrestigeNow()} EP)`
      : "Prestige (Locked)";

    $("prestHint").textContent = ok
      ? "Ready. Prestige resets your run but permanently boosts income."
      : `Prestige unlocks at ${U.money(E.PRESTIGE_GOAL)} cash.`;

    $("lifetime").textContent  = U.money(S.lifetimeEarned || 0);
    $("lifetime2").textContent = U.money(S.lifetimeEarned || 0);
  }

  // ---------------------------
  // Multipliers panel
  // ---------------------------
  function renderMultipliers(){
    const ops = E.opsMultiplier();
    const pm  = E.prestigeMultiplier();
    const ms  = ER.ms?.bonuses?.() || { globalMult:1, buildingMult:1 };

    $("multSummary").textContent = U.fmtX(ops * pm * ms.globalMult) + " total";
    $("multDetails").textContent =
      `Ops ${U.fmtX(ops)} · Prestige ${U.fmtX(pm)} · Milestones ${U.fmtX(ms.globalMult)}`;
  }

  // ---------------------------
  // World note
  // ---------------------------
  function renderSceneNote(){
    const sum =
      (S.bLvl.office||1)+(S.bLvl.warehouse||1)+(S.bLvl.workshop||1)+(S.bLvl.market||1);

    const note = $("sceneNote");
    if (sum <= 4) note.textContent = "starting out";
    else if (sum <= 7) note.textContent = "getting built";
    else if (sum <= 10) note.textContent = "city growing";
    else note.textContent = "empire humming";
  }

  // ---------------------------
  // Main render entry
  // ---------------------------
  function renderAll(){
    renderHud();
    renderPeople();
    renderBuildingLevels();
    renderUpgradeRows();
    renderMultipliers();
    renderPrestige();
    renderSceneNote();
  }

  ER.ui = { renderAll };
})();

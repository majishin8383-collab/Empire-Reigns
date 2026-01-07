const state = {
  cash: 0,
  incomePerSecond: 1,
  lastTick: Date.now()
};

function tick() {
  const now = Date.now();
  const delta = (now - state.lastTick) / 1000;
  state.cash += state.incomePerSecond * delta;
  state.lastTick = now;

  console.clear();
  console.log("Cash:", state.cash.toFixed(2));
  console.log("Income/sec:", state.incomePerSecond);
}

setInterval(tick, 100);

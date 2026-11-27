// Passenger arrival times are uniform over a complete repeating cycle.
function compareWait(gaps, count = 20000, seed = 42) {
  if (!gaps.length || gaps.some((x) => !Number.isFinite(x) || x <= 0)) {
    throw new Error("Los intervalos deben ser positivos.");
  }
  const cycle = gaps.reduce((a, b) => a + b, 0);
  const mean = gaps.reduce((s, h) => s + h * h, 0) / (2 * cycle);
  let low = 0,
    high = Math.max(...gaps);
  for (let i = 0; i < 50; i++) {
    const middle = (low + high) / 2;
    const cdf = gaps.reduce((s, h) => s + Math.min(h, middle), 0) / cycle;
    if (cdf < 0.9) low = middle;
    else high = middle;
  }
  let sum = 0;
  for (let i = 0; i < count; i++) {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    let arrival = (seed / 4294967296) * cycle;
    for (const gap of gaps) {
      if (arrival < gap) {
        sum += gap - arrival;
        break;
      }
      arrival -= gap;
    }
  }
  return { mean, p90: high, simulated: sum / count };
}
if (typeof module !== "undefined") module.exports = { compareWait };

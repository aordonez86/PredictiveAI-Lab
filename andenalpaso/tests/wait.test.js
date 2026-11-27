const test = require("node:test");
const assert = require("node:assert/strict");
const { compareWait } = require("../wait");
for (const [g, mean, p90] of [
  [[10, 10], 5, 9],
  [[2, 18], 8.2, 16],
]) {
  test("Uniform arrival over " + g.join("/"), () => {
    const r = compareWait(g);
    assert.equal(r.mean, mean);
    assert.ok(Math.abs(r.p90 - p90) < 1e-8);
    assert.ok(Math.abs(r.simulated - mean) < 0.1);
  });
}
test("Nonpositive intervals rejected", () =>
  assert.throws(() => compareWait([0, 10])));

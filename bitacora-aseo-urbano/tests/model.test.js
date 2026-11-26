const {test}=require("node:test");
const assert=require("node:assert/strict");
const {analyze,breakEven,instant}=require("../src/model");
const example=require("../examples/demo.json");
function fresh(){return structuredClone(example);}
test("demo population, bounds and seven-day denominator",()=>{
 const r=analyze(example);
 assert.deepEqual([r.n,r.seen,r.positive,r.bounds],[4,2,1,[0.25,0.75]]);
 assert.deepEqual(r.rows[0].interval.map(t=>new Date(t).getUTCDate()),[4,8]);
 assert.equal(r.rows[0].extra,1);
 assert.equal(r.rows[2].interrupted,true);
 assert.equal(r.rows[2].extra,0);
});
test("follow-up after another cleanup cannot validate the original episode",()=>{
 const d=fresh(); d.casos=[d.casos[2]];
 assert.equal(analyze(d).seen,0);
});
test("calendar errors, future events, ties and reversed visits rejected",()=>{
 assert.throws(()=>instant("2026-02-30T12:00:00Z"));
 for(const hora of ["2026-11-30T15:00:00Z","2026-11-04T15:00:00Z","2026-11-03T15:00:00Z"]){
  const d=fresh();d.casos[0].visitas[1].hora=hora;assert.throws(()=>analyze(d));
 }
});
test("incomplete, repeated and unsupported records rejected",()=>{
 for(const edit of [d=>d.casos.push(d.casos[0]),d=>d.casos[0].fuente="",d=>d.origen="otro",d=>d.casos[0].visitas[0].antes="otro"]){
  const d=fresh();edit(d);assert.throws(()=>analyze(d));
 }
});
test("no eligible points and unobserved eligible points",()=>{
 const d=fresh();d.casos=[];assert.equal(analyze(d).bounds,null);
 d.casos=[fresh().casos[3]];assert.deepEqual(analyze(d).bounds,[0,1]);
});
test("day seven is exact and lack of an observation is unknown",()=>{
 const d=fresh();d.casos=[d.casos[1]];d.casos[0].visitas[0].hora="2026-11-08T15:01:00Z";
 assert.equal(analyze(d).seen,0);
});
test("integer break-even and invalid costs",()=>{
 assert.equal(breakEven(180000,60000,80000),3);assert.equal(breakEven(1,1,3),1);
 assert.equal(breakEven(0,0,1),0);
 for(const invalid of [0,-1,NaN,Infinity,1.25])assert.throws(()=>breakEven(2,2,invalid));
});

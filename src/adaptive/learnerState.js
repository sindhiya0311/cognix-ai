/* ============================ LEARNER STATE ============================ */

const blankSkill = ()=>({mastery:0,attempts:0,correct:0,errors:0,hints:0,times:[],difficulty:1,modality:"mcq",
  consecWrong:0,consecRight:0,misconception:null,misCounts:{},seen:[],mStats:{},completed:[]});

const blankState = ()=>({
  xp:0, streak:0, best:0, badges:[], skills:{}, log:[], adaptLog:[], bossBeaten:{},
  preferred:"mcq", createdAt:Date.now()
});

const MODALITIES = ["mcq","scenario","sequence","matching","speed"];
const MODALITY_LABEL = {mcq:"Multiple choice",scenario:"Scenario",sequence:"Sequence",matching:"Matching",speed:"Speed round"};

function preferredModality(st){
  const tot = {};
  Object.values(st.skills).forEach(s=>Object.keys(s.mStats||{}).forEach(m=>{
    tot[m] = tot[m] || {n:0,c:0}; tot[m].n += s.mStats[m].n; tot[m].c += s.mStats[m].c;
  }));
  let best = null, bv = -1;
  Object.keys(tot).forEach(m=>{ if(tot[m].n>=2){ const r = tot[m].c/tot[m].n; if(r>bv){bv=r;best=m;} } });
  return best || "mcq";
}

const getSkill = (st,id)=>{ const s = st.skills[id] || (st.skills[id]=blankSkill());
  if(!s.mStats) s.mStats={}; if(!s.completed) s.completed=[]; return s; };
const level = st => Math.floor(st.xp/120)+1;
const acc = s => s.attempts? s.correct/s.attempts : 0;
const avgTime = s => s.times.length? s.times.reduce((a,b)=>a+b,0)/s.times.length : 0;

function overall(st){
  const v = Object.values(st.skills);
  if(!v.length) return {mastery:0,accuracy:0,attempts:0,errors:0,hints:0,time:0};
  return {
    mastery: v.reduce((a,s)=>a+s.mastery,0)/v.length,
    accuracy: v.reduce((a,s)=>a+acc(s),0)/v.length,
    attempts: v.reduce((a,s)=>a+s.attempts,0),
    errors: v.reduce((a,s)=>a+s.errors,0),
    hints: v.reduce((a,s)=>a+s.hints,0),
    time: v.reduce((a,s)=>a+avgTime(s),0)/v.length
  };
}

function recordAttempt(st, {skillId, correct, seconds, hintUsed, difficulty, type, misTag}){
  const s = getSkill(st, skillId);
  s.attempts++; s.times.push(seconds); s.difficulty = difficulty; s.modality = type;
  s.seen.push(arguments[1].challengeId);
  s.mStats[type] = s.mStats[type] || {n:0,c:0};
  s.mStats[type].n++; if(correct) s.mStats[type].c++;
  if(hintUsed) s.hints++;
  if(correct){
    s.correct++; s.consecRight++; s.consecWrong=0;
    s.mastery = Math.min(1, s.mastery + 0.16*difficulty*(hintUsed?0.6:1));
    st.streak++; st.best=Math.max(st.best,st.streak);
    if(s.consecRight>=2 && s.misconception) s.misconception=null;
  }else{
    s.errors++; s.consecWrong++; s.consecRight=0;
    s.mastery = Math.max(0, s.mastery - 0.07);
    st.streak = 0;
    if(misTag){ s.misCounts[misTag]=(s.misCounts[misTag]||0)+1; }
  }
  if(correct && !s.completed.includes(arguments[1].challengeId)) s.completed.push(arguments[1].challengeId);
  st.preferred = preferredModality(st);
  const xp = correct ? Math.round(20*difficulty*(hintUsed?0.7:1)) : 4;
  st.xp += xp;
  st.log.push({t:Date.now(), skillId, correct, seconds, hintUsed, difficulty, type, mastery:s.mastery});
  return {xp, skill:s};
}

export { blankSkill, blankState, MODALITIES, MODALITY_LABEL, preferredModality, getSkill, level, acc, avgTime, overall, recordAttempt };

import React, { useState, useMemo } from 'react';
import { SUBJECTS, BOSS, CHALLENGES } from '../data/content.js';
import { getSkill } from '../adaptive/learnerState.js';
import Quest from './Quest.jsx';

function bossRounds(st, subject){
  const ks = Object.keys(SUBJECTS[subject].skills);
  const m = ks.reduce((a,k)=>a+getSkill(st,k).mastery,0)/ks.length;
  const hard = m>=0.7;
  const want = [["scenario",ks[0]],["sequence",ks[1]],["speed",ks[2]]];
  return {
    hard, mastery:m,
    rounds: want.map(([mod,sk])=>{
      const pool = CHALLENGES.filter(c=>c.skill===sk);
      const exact = pool.filter(c=>c.type===mod);
      const list = exact.length? exact : pool;
      return list.slice().sort((a,b)=>Math.abs(a.diff-(hard?3:2))-Math.abs(b.diff-(hard?3:2)))[0];
    })
  };
}

function BossBattle({st,subject,onFinish}){
  const cfg = BOSS[subject];
  const plan = useMemo(()=>bossRounds(st, subject),[subject]);
  const [stage,setStage] = useState(0);
  const [bossHp,setBossHp] = useState(100);
  const [hp,setHp] = useState(100);
  const [note,setNote] = useState("");
  const ch = plan.rounds[Math.min(stage,plan.rounds.length-1)];
  const dmg = plan.hard? 34 : 40;

  const submit = (r)=>{
    if(r.correct){
      const nb = Math.max(0,bossHp-dmg); setBossHp(nb); setNote("Direct hit. "+ch.explain);
      if(nb<=0 || stage+1>=plan.rounds.length){ setTimeout(()=>onFinish(true,r),1000); return; }
    }else{
      const nh = Math.max(0,hp-34); setHp(nh); setNote("You take damage. "+ch.explain);
      if(nh<=0){ setTimeout(()=>onFinish(false,r),1000); return; }
    }
    setTimeout(()=>{ setStage(s=>s+1); setNote(""); }, 1300);
  };

  return (
    <div className="grid" style={{maxWidth:860,margin:"0 auto"}}>
      <div className="glass pad frame-boss flash">
        <div className="row sp wrap">
          <div>
            <div className="muted small">Challenge Citadel — final encounter</div>
            <h2 style={{margin:"4px 0 0",color:"var(--red)"}}>{cfg.name}</h2>
            <div className="small muted" style={{marginTop:4}}>{cfg.line}</div>
          </div>
          <div className="row wrap" style={{gap:7}}>
            <span className="chip r">Round {Math.min(stage+1,3)} of 3</span>
            <span className="chip a">{plan.hard?"High mastery: harder rounds, no hints":"Building mastery: easier rounds, hints on"}</span>
          </div>
        </div>
        <div className="row wrap small muted" style={{gap:8,marginTop:10}}>
          <span>Round 1 Scenario</span><span>→</span><span>Round 2 Sequence</span><span>→</span><span>Round 3 Speed</span>
        </div>
        <div style={{marginTop:14}}>
          <div className="small muted" style={{marginBottom:4}}>Boss integrity {bossHp}%</div>
          <div className="hp"><i style={{width:bossHp+"%",background:"linear-gradient(90deg,var(--red),#ff8aa2)"}}/></div>
          <div className="small muted" style={{margin:"10px 0 4px"}}>Your focus {hp}%</div>
          <div className="hp"><i style={{width:hp+"%",background:"linear-gradient(90deg,var(--green),#9dffd8)"}}/></div>
        </div>
        {note && <div className="why" style={{marginTop:12}}>{note}</div>}
      </div>
      <Quest key={stage} ch={ch} onSubmit={submit} auto={null} questType="BOSS" allowHint={!plan.hard}/>
    </div>
  );
}


export default BossBattle;

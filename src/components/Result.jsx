import React, { useEffect } from 'react';
import { byId, skillName } from '../data/content.js';
import { MODALITY_LABEL } from '../adaptive/learnerState.js';
import { QT_CLASS, QT_TEXT } from './questVisuals.js';

function Result({res, onNext, auto}){
  useEffect(()=>{ if(!auto) return; const t=setTimeout(onNext,3600); return ()=>clearTimeout(t); },[auto,res]);
  const d = res.decision, before = res.before, after = res.after;
  const delta = (a,b,fmt)=> {
    const up = b>a; const same = Math.abs(b-a)<0.0001;
    return <b style={{color: same?"var(--muted)":(up?"var(--green)":"var(--red)")}}>{fmt(b)} {same?"":(up?"↑":"↓")}</b>;
  };
  const next = byId(d.challengeId);
  return (
    <div className="grid flash" style={{maxWidth:880,margin:"0 auto"}}>
      <div className="glass pad" style={{borderColor: res.correct?"rgba(37,245,154,.45)":"rgba(255,63,99,.45)"}}>
        <div className="row sp wrap">
          <h2 style={{margin:0,color:res.correct?"var(--green)":"var(--red)"}}>{res.correct?"Correct":"Incorrect"}</h2>
          <div className="row wrap" style={{gap:7}}>
            <span className="chip">{res.seconds.toFixed(1)}s</span>
            <span className="chip">{res.hintUsed?"1 hint":"no hint"}</span>
            <span className="chip g">+{res.xp} XP</span>
          </div>
        </div>
        <div className="small muted" style={{marginTop:8}}>{res.explain}</div>
      </div>

      <div className="glass pad">
        <h3 style={{margin:"0 0 10px"}}>What GameLearn learned</h3>
        <div className="kv"><span className="muted">Mastery — {skillName(res.skillId)}</span>{delta(before.mastery,after.mastery,v=>(v*100|0)+"%")}</div>
        <div className="kv"><span className="muted">Accuracy</span>{delta(before.accuracy,after.accuracy,v=>(v*100|0)+"%")}</div>
        <div className="kv"><span className="muted">Consecutive errors</span>{delta(-before.consecWrong,-after.consecWrong,v=>String(-v))}</div>
        <div className="kv"><span className="muted">Struggle risk</span>
          <span className={"chip "+(d.risk.level==="HIGH"?"r":d.risk.level==="MEDIUM"?"a":"g")}>{d.risk.level}</span></div>
        <div className="kv"><span className="muted">Misconception</span>
          {d.misconception? <span className="chip r">{MIS_LABEL[d.misconception]||d.misconception}</span> : <span className="chip g">none detected</span>}</div>
      </div>

      <div className="glass pad">
        <h3 style={{margin:"0 0 10px"}}>GameLearn decision</h3>
        <div className="kv"><span className="muted">Difficulty</span>
          <b>D{d.prevDifficulty} → <span style={{color:d.difficulty>d.prevDifficulty?"var(--green)":d.difficulty<d.prevDifficulty?"var(--red)":"var(--muted)"}}>D{d.difficulty}</span></b></div>
        <div className="kv"><span className="muted">Modality</span>
          <b>{MODALITY_LABEL[d.prevModality]} → <span style={{color:d.modality!==d.prevModality?"var(--green)":"var(--muted)"}}>{MODALITY_LABEL[d.modality]}</span></b></div>
        <div className="kv"><span className="muted">Quest type</span><span className={"qtype "+QT_CLASS[d.questType]}>{QT_TEXT[d.questType]}</span></div>
        <div className="kv"><span className="muted">Skill</span><b>{skillName(d.nextSkill)}</b></div>
        <div className="kv"><span className="muted">Boss</span><b style={{color:d.bossReady?"var(--green)":"var(--muted)"}}>{d.bossReady?"unlocked":"locked"}</b></div>
      </div>

      <div className="glass pad">
        <h3 style={{margin:"0 0 8px"}}>Why this challenge?</h3>
        <div className="why">{d.reason}</div>
      </div>

      <div className="glass pad">
        <div className="row sp wrap" style={{gap:10}}>
          <div>
            <div className="muted small">Next quest</div>
            <h3 style={{margin:"4px 0 0"}}>{skillName(d.nextSkill)}</h3>
            <div className="row wrap" style={{gap:7,marginTop:8}}>
              <span className={"qtype "+QT_CLASS[d.questType]}>{QT_TEXT[d.questType]}</span>
              <span className="chip">D{next.diff}</span>
              <span className="chip">{MODALITY_LABEL[next.type]}</span>
            </div>
          </div>
          <button className="btn" onClick={onNext}>Play next quest</button>
        </div>
        {res.unlocked && <div className="why" style={{marginTop:14}}><b>Region unlocked.</b> {res.unlocked}</div>}
        {res.newBadges.length>0 && <div className="row wrap" style={{gap:7,marginTop:12}}>{res.newBadges.map(b=><span key={b} className="chip g">Badge earned: {b}</span>)}</div>}
      </div>
    </div>
  );
}

export default Result;

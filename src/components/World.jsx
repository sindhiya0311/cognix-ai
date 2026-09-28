import React from 'react';
import { SUBJECTS, BOSS, skillName } from '../data/content.js';
import { getSkill, overall, MODALITY_LABEL } from '../adaptive/learnerState.js';
import { struggleRisk } from '../adaptive/engine.js';
import { regionState } from '../services/progression.js';
import { CHALLENGES } from '../data/content.js';
import Bar from './Bar.jsx';
import { QT_CLASS, QT_TEXT } from './questVisuals.js';

function World({st,subject,start,startBoss,demo}){
  const subj = SUBJECTS[subject];
  const rs = regionState(st, subject);
  const cur = Object.keys(subj.skills).find(k=>getSkill(st,k).mastery<0.8) || Object.keys(subj.skills)[0];
  const o = overall(st);
  return (
    <div className="grid" style={{gridTemplateColumns:"minmax(0,2fr) minmax(0,1fr)"}}>
      <div className="grid">
        <div className="glass pad">
          <div className="row sp wrap">
            <div>
              <div className="muted small">{subj.name} — {subj.topic}</div>
              <h2 style={{margin:"4px 0 0",fontSize:22}}>Current quest: {skillName(cur)}</h2>
              <div className="small muted" style={{marginTop:4}}>Difficulty {getSkill(st,cur).difficulty} · {getSkill(st,cur).modality} · struggle risk {struggleRisk(getSkill(st,cur)).level}</div>
            </div>
            <div className="row" style={{gap:8}}>
              <button className="btn" onClick={()=>start(cur)}>Start quest</button>
              <button className="btn ghost" onClick={demo}>Run guided demo</button>
            </div>
          </div>
          <div style={{marginTop:14}}>
            <Bar v={rs.allm} label="Subject mastery" right={(rs.allm*100|0)+"%"} />
            <div className="small muted">Next unlock: {rs.r2.unlocked? (rs.r3.unlocked? "Boss is open" : rs.r3.need) : rs.r2.need}</div>
          </div>
        </div>

        {subj.regions.map((r,i)=>{
          const key = "r"+(i+1), rst = rs[key];
          return (
            <div key={r.id} className={"region"+(rst.unlocked?"":" locked")}>
              <div className="row sp">
                <div>
                  <h3>{r.name}</h3>
                  <div className="small muted">{r.blurb}</div>
                </div>
                <span className={"chip "+(rst.unlocked?"g":"r")}>{rst.unlocked?"Open":"Locked"}</span>
              </div>
              {!rst.unlocked && <div className="small muted" style={{marginTop:8}}>{rst.need}</div>}
              {r.boss ? (
                <button className="node" disabled={!rst.unlocked} onClick={startBoss}>
                  <div className="row sp"><b>{BOSS[subject].name}</b><span className="chip r">Boss</span></div>
                  <div className="small muted" style={{marginTop:4}}>{st.bossBeaten[subject]?"Defeated — rematch available":"Three stages, one health bar"}</div>
                </button>
              ) : r.skills.map(sk=>{
                const s = getSkill(st,sk);
                const total = CHALLENGES.filter(c=>c.skill===sk).length;
                const doneN = s.completed.length;
                const state = !rst.unlocked ? "LOCKED" : (s.mastery>=0.8 ? "COMPLETED" : "AVAILABLE");
                const qt = s.consecWrong>=2 ? "RECOVERY" : (s.mastery>=0.55 && s.difficulty>=3 ? "CHALLENGE" : "NORMAL");
                return (
                  <button key={sk} className={"node "+(state==="COMPLETED"?"done":state==="AVAILABLE"?"avail":"")}
                    disabled={!rst.unlocked} onClick={()=>start(sk)}>
                    <div className="row sp wrap" style={{gap:6}}>
                      <b>{skillName(sk)}</b>
                      <span className="row wrap" style={{gap:6}}>
                        <span className={"qtype "+QT_CLASS[qt]}>{QT_TEXT[qt]}</span>
                        <span className="small muted">{state.toLowerCase()}</span>
                      </span>
                    </div>
                    <div className="bar" style={{marginTop:7}}><i style={{width:Math.max(2,s.mastery*100)+"%"}}/></div>
                    <div className="row sp small muted" style={{marginTop:6}}>
                      <span>D{s.difficulty} · {MODALITY_LABEL[s.modality]}</span>
                      <span>{doneN}/{total} quests cleared · {(s.mastery*100|0)}% mastery</span>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="grid" style={{alignContent:"start"}}>
        <div className="glass pad">
          <h3 style={{margin:"0 0 10px"}}>Learner DNA</h3>
          <div className="kv"><span className="muted">Mastery</span><b>{(o.mastery*100|0)}%</b></div>
          <div className="kv"><span className="muted">Accuracy</span><b>{(o.accuracy*100|0)}%</b></div>
          <div className="kv"><span className="muted">Avg response</span><b>{o.time.toFixed(1)}s</b></div>
          <div className="kv"><span className="muted">Attempts / errors</span><b>{o.attempts} / {o.errors}</b></div>
          <div className="kv"><span className="muted">Hints used</span><b>{o.hints}</b></div>
          <div className="kv"><span className="muted">Preferred format</span><b>{getSkill(st,cur).modality}</b></div>
        </div>
        <div className="glass pad">
          <h3 style={{margin:"0 0 10px"}}>Badges</h3>
          <div className="row wrap" style={{gap:7}}>
            {st.badges.length? st.badges.map(b=><span key={b} className="chip g">{b}</span>) : <span className="small muted">Answer a challenge to earn your first badge.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default World;

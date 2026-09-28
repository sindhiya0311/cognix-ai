import React from 'react';
import { SUBJECTS, skillName } from '../data/content.js';
import { getSkill, acc, avgTime, MODALITIES, MODALITY_LABEL } from '../adaptive/learnerState.js';
import { struggleRisk } from '../adaptive/engine.js';
import { QT_CLASS, QT_TEXT } from './questVisuals.js';

function Analytics({st,subject}){
  const subj = SUBJECTS[subject];
  const log = st.log.slice(-14);
  const W=520,H=150;
  const pts = log.map((l,i)=>[20+i*(W-40)/Math.max(1,log.length-1), H-16-(l.mastery*(H-40))]);
  const path = pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" ");
  return (
    <div className="grid">
      <div className="glass pad">
        <h3 style={{margin:"0 0 4px"}}>Mastery over attempts</h3>
        <div className="small muted" style={{marginBottom:10}}>Each point is one recorded attempt. Dips are where the engine intervened.</div>
        <div className="scroll">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{minWidth:420,height:160}}>
          <line x1="20" y1={H-16} x2={W-20} y2={H-16} stroke="rgba(255,255,255,.15)"/>
          {log.length>1 && <path d={path} fill="none" stroke="var(--green)" strokeWidth="2.5"/>}
          {pts.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="4" fill={log[i].correct?"var(--green)":"var(--red)"}/>)}
          {!log.length && <text x="20" y="80" fill="#8fa3b0" fontSize="13">No attempts recorded yet.</text>}
        </svg>
        </div>
      </div>
      <div className="grid" style={{gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)"}}>
        <div className="glass pad">
          <h3 style={{margin:"0 0 4px"}}>Modality usage</h3>
          <div className="small muted" style={{marginBottom:10}}>How the engine has been delivering challenges, and how you performed in each.</div>
          {MODALITIES.map(m=>{
            const used = st.log.filter(l=>l.type===m);
            const ok = used.filter(l=>l.correct).length;
            const share = st.log.length? used.length/st.log.length : 0;
            return <div key={m} style={{marginBottom:9}}>
              <div className="row sp small" style={{marginBottom:4}}>
                <span className={st.preferred===m?"":"muted"}>{MODALITY_LABEL[m]}{st.preferred===m?" · preferred":""}</span>
                <span className="muted">{used.length} played · {used.length?Math.round(ok/used.length*100):0}% correct</span>
              </div>
              <div className="bar"><i style={{width:Math.max(1,share*100)+"%"}}/></div>
            </div>;
          })}
        </div>
        <div className="glass pad">
          <h3 style={{margin:"0 0 4px"}}>Adaptation history</h3>
          <div className="small muted" style={{marginBottom:10}}>Every decision the engine actually made this session.</div>
          <div className="hist" style={{maxHeight:300,overflowY:"auto"}}>
            {st.adaptLog.slice().reverse().slice(0,10).map((a,i)=>(
              <div key={i} className={"step "+(a.correct?"ok":"no")}>
                <div className="row wrap" style={{gap:6}}>
                  <b className="small">Attempt {a.n}</b>
                  <span className="small muted">{MODALITY_LABEL[a.playedType]} · D{a.playedDiff} · {a.correct?"correct":"incorrect"}</span>
                </div>
                <div className="small" style={{marginTop:3}}>
                  → <span className={"qtype "+QT_CLASS[a.questType]} style={{fontSize:11,padding:"3px 8px"}}>{QT_TEXT[a.questType]}</span>{" "}
                  {MODALITY_LABEL[a.modality]} · D{a.difficulty} · risk {a.risk}{a.misconception?" · misconception":""}
                </div>
              </div>
            ))}
            {!st.adaptLog.length && <div className="small muted" style={{padding:"8px 0"}}>Play a quest to see the engine's decisions.</div>}
          </div>
        </div>
      </div>

      <div className="glass pad scroll">
        <h3 style={{margin:"0 0 10px"}}>Skill analytics — {subj.name}</h3>
        <table>
          <thead><tr><th>Skill</th><th>Mastery</th><th>Accuracy</th><th>Attempts</th><th>Errors</th><th>Hints</th><th>Avg time</th><th>Difficulty</th><th>Struggle</th></tr></thead>
          <tbody>
            {Object.keys(subj.skills).map(k=>{
              const s = getSkill(st,k), r = struggleRisk(s);
              return <tr key={k}>
                <td><b>{skillName(k)}</b></td>
                <td>{(s.mastery*100|0)}%</td><td>{(acc(s)*100|0)}%</td><td>{s.attempts}</td><td>{s.errors}</td><td>{s.hints}</td>
                <td>{avgTime(s).toFixed(1)}s</td><td>D{s.difficulty}</td>
                <td><span className={"chip "+(r.level==="HIGH"?"r":r.level==="MEDIUM"?"a":"g")}>{r.level}</span></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      <div className="glass pad scroll">
        <h3 style={{margin:"0 0 10px"}}>Attempt log</h3>
        <table>
          <thead><tr><th>#</th><th>Skill</th><th>Result</th><th>Type</th><th>Diff</th><th>Time</th><th>Hint</th></tr></thead>
          <tbody>
            {st.log.slice().reverse().slice(0,12).map((l,i)=>(
              <tr key={i}><td>{st.log.length-i}</td><td>{skillName(l.skillId)}</td>
                <td style={{color:l.correct?"var(--green)":"var(--red)"}}>{l.correct?"correct":"incorrect"}</td>
                <td>{l.type}</td><td>D{l.difficulty}</td><td>{l.seconds.toFixed(1)}s</td><td>{l.hintUsed?"yes":"no"}</td></tr>
            ))}
            {!st.log.length && <tr><td colSpan="7" className="muted">Nothing yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Analytics;

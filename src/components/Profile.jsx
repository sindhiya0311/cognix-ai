import React from 'react';
import { SUBJECTS, skillName } from '../data/content.js';
import { getSkill, overall, acc, avgTime, level, MODALITY_LABEL } from '../adaptive/learnerState.js';
import { struggleRisk, MIS_LABEL } from '../adaptive/engine.js';
import Bar from './Bar.jsx';
import SkillGraph from './SkillGraph.jsx';

function Profile({st,subject}){
  const subj = SUBJECTS[subject];
  const o = overall(st);
  return (
    <div className="grid" style={{gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)"}}>
      <div className="glass pad">
        <h3 style={{margin:"0 0 12px"}}>Learner DNA — {subj.name}</h3>
        {Object.keys(subj.skills).map(k=>{
          const s = getSkill(st,k);
          return (
            <div key={k} style={{marginBottom:16}}>
              <Bar v={s.mastery} label={skillName(k)} right={(s.mastery*100|0)+"% mastery"}/>
              <div className="row wrap" style={{gap:6}}>
                <span className="chip">acc {(acc(s)*100|0)}%</span>
                <span className="chip">{s.attempts} attempts</span>
                <span className="chip">{s.errors} errors</span>
                <span className="chip">{s.hints} hints</span>
                <span className="chip">{avgTime(s).toFixed(1)}s avg</span>
                <span className="chip">D{s.difficulty}</span>
                <span className="chip">{s.modality}</span>
                <span className={"chip "+(struggleRisk(s).level==="HIGH"?"r":struggleRisk(s).level==="MEDIUM"?"a":"g")}>risk {struggleRisk(s).level}</span>
              </div>
              {s.misconception && <div className="small" style={{color:"var(--red)",marginTop:6}}>Misconception: {MIS_LABEL[s.misconception]||s.misconception}</div>}
            </div>
          );
        })}
      </div>
      <div className="grid" style={{alignContent:"start"}}>
        <div className="glass pad">
          <h3 style={{margin:"0 0 10px"}}>Profile</h3>
          <div className="kv"><span className="muted">Level</span><b>{level(st)}</b></div>
          <div className="kv"><span className="muted">XP</span><b>{st.xp}</b></div>
          <div className="kv"><span className="muted">Best streak</span><b>{st.best}</b></div>
          <div className="kv"><span className="muted">Overall mastery</span><b>{(o.mastery*100|0)}%</b></div>
          <div className="kv"><span className="muted">Bosses defeated</span><b>{Object.keys(st.bossBeaten).length}</b></div>
          <div className="kv"><span className="muted">Preferred modality</span><b style={{color:"var(--green)"}}>{MODALITY_LABEL[st.preferred||"mcq"]}</b></div>
        </div>
        <SkillGraph st={st} subject={subject}/>
        <div className="glass pad">
          <h3 style={{margin:"0 0 10px"}}>Badges</h3>
          <div className="row wrap" style={{gap:7}}>
            {st.badges.length? st.badges.map(b=><span key={b} className="chip g">{b}</span>) : <span className="small muted">None yet.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;

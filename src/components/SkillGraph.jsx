import React from 'react';
import { SUBJECTS, BOSS, skillName } from '../data/content.js';
import { getSkill } from '../adaptive/learnerState.js';
import { struggleRisk } from '../adaptive/engine.js';
import { regionState } from '../services/progression.js';

function SkillGraph({st,subject}){
  const subj = SUBJECTS[subject];
  const ks = Object.keys(subj.skills);
  const rs = regionState(st, subject);
  const nodes = ks.map((k,i)=>{
    const s = getSkill(st,k);
    const locked = i>0 && !rs.r2.unlocked;
    const state = locked ? "locked" : s.mastery>=0.8 ? "mastered"
      : (s.attempts>0 && (s.mastery<0.25 || struggleRisk(s).level==="HIGH")) ? "practice"
      : s.attempts>0 ? "progress" : "progress";
    const label = {mastered:"Mastered", progress:"In progress", practice:"Needs practice", locked:"Locked"}[state];
    return {k, state, label, s, tier: i===0?"Foundation":i===1?"Core concept":"Applied skill"};
  });
  nodes.push({k:"boss", state: rs.r3.unlocked? (st.bossBeaten[subject]?"mastered":"progress") : "locked",
    label: rs.r3.unlocked? (st.bossBeaten[subject]?"Defeated":"Available"):"Locked", tier:"Advanced challenge", boss:true});
  return (
    <div className="glass pad">
      <h3 style={{margin:"0 0 12px"}}>Skill path</h3>
      <div className="graph">
        {nodes.map((n,i)=>(
          <div key={n.k}>
            <div className={"gnode "+n.state}>
              <div className="row sp wrap" style={{gap:6}}>
                <b>{n.boss? BOSS[subject].name : skillName(n.k)}</b>
                <span className="small muted">{n.label}</span>
              </div>
              <div className="small muted" style={{marginTop:3}}>{n.tier}{n.s?` · ${(n.s.mastery*100|0)}% mastery`:""}</div>
            </div>
            {i<nodes.length-1 && <div className="garrow">↓</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SkillGraph;

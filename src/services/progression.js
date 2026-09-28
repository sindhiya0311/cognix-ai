import { SUBJECTS, skillName } from '../data/content.js';
import { getSkill } from '../adaptive/learnerState.js';

function regionState(st, subjectKey){
  const subj = SUBJECTS[subjectKey];
  const m = id => getSkill(st,id).mastery;
  const r1 = subj.regions[0], r2 = subj.regions[1];
  const r1m = r1.skills.reduce((a,k)=>a+m(k),0)/r1.skills.length;
  const all = Object.keys(subj.skills);
  const allm = all.reduce((a,k)=>a+m(k),0)/all.length;
  return {
    r1:{unlocked:true, mastery:r1m},
    r2:{unlocked:r1m>=0.5, mastery:r2.skills.reduce((a,k)=>a+m(k),0)/r2.skills.length, need:"Reach 50% mastery in "+skillName(r1.skills[0])},
    r3:{unlocked:allm>=0.5, mastery:allm, need:"Reach 50% average mastery across all skills"},
    allm
  };
}

function checkBadges(st, ev){
  const add = b => { if(!st.badges.includes(b)) st.badges.push(b); };
  if(ev.correct) add("First Light");
  if(ev.correct && ev.comeback) add("Comeback");
  if(st.streak>=3) add("Sharpshooter");
  if(Object.values(st.skills).some(s=>s.mastery>=0.8)) add("Skill Master");
  if(ev.hintless && ev.correct && ev.difficulty>=3) add("No Safety Net");
}

export { regionState, checkBadges };

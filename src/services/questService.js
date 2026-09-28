import { CHALLENGES } from '../data/content.js';
import { getSkill } from '../adaptive/learnerState.js';

function pickChallenge(st, skillId, diff, modality){
  const s = getSkill(st, skillId);
  const pool = CHALLENGES.filter(c=>c.skill===skillId);
  const score = c => {
    let v = 0;
    v += Math.abs(c.diff-diff)*10;
    v += (c.type===modality?0:4);
    v += (s.seen.includes(c.id)? 6 + s.seen.filter(x=>x===c.id).length*3 : 0);
    return v;
  };
  return pool.slice().sort((a,b)=>score(a)-score(b)||a.id.localeCompare(b.id))[0];
}

function firstChallenge(st, skillId){
  const s = getSkill(st, skillId);
  return pickChallenge(st, skillId, s.attempts? s.difficulty : 1, s.attempts? s.modality : "mcq");
}

export { pickChallenge, firstChallenge };

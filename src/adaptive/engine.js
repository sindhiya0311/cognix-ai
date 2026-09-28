import { SUBJECTS, BOSS, skillName, subjectOfSkill } from '../data/content.js';
import { getSkill, acc, avgTime, MODALITY_LABEL } from './learnerState.js';
import { regionState } from '../services/progression.js';
import { pickChallenge } from '../services/questService.js';


function struggleRisk(s){
  let score = 0; const f = [];
  if(s.attempts>=2 && acc(s)<0.5){ score+=2; f.push("accuracy below 50%"); }
  if(s.consecWrong>=2){ score+=2; f.push("repeated errors on this skill"); }
  else if(s.consecWrong===1){ score+=1; f.push("a recent error"); }
  if(avgTime(s)>22){ score+=1; f.push("long response times"); }
  if(s.attempts>=3 && s.mastery<0.35){ score+=1; f.push("low mastery after several attempts"); }
  if(s.hints>=2){ score+=1; f.push("repeated hint use"); }
  return {level: score>=4?"HIGH": score>=2?"MEDIUM":"LOW", score, factors:f};
}

function detectMisconception(s){
  const tag = Object.keys(s.misCounts).find(k=>s.misCounts[k]>=2);
  if(tag) return tag;
  if(s.consecWrong>=2) return "persistent-error";
  return null;
}

const MIS_LABEL = {
  offbyone:"Off-by-one boundary error", noinc:"Loop counter never updated", addboth:"Adding denominators as well as numerators",
  orderops:"Order of operations reversed", impetus:"Belief that motion needs a continuous force",
  area:"Area confused with perimeter", isolate:"Treating species as independent", duplicate:"Copy-paste instead of reuse",
  "persistent-error":"Repeated errors on this skill", noassign:"Assignment result not stored", linear:"Assuming temperature always rises",
  swap:"Coefficient and constant swapped", surface:"Focusing on surface details", gas:"State properties confused", solid:"State properties confused"
};

function adapt(st, skillId, lastCorrect){
  const s = getSkill(st, skillId);
  const risk = struggleRisk(s);
  const mis = detectMisconception(s);
  s.misconception = mis;

  const subj = SUBJECTS[subjectOfSkill(skillId)];
  const skillOrder = Object.keys(subj.skills);

  const prevDifficulty = s.difficulty, prevModality = s.modality;
  let difficulty = s.difficulty, modality = s.modality, nextSkill = skillId;
  let questType = "NORMAL", recovery = false; const reasons = [];

  if(risk.level==="HIGH"){
    recovery = true; questType = "RECOVERY";
    difficulty = Math.max(1, s.difficulty-1);
    if(prevModality==="mcq") modality = mis ? "matching" : "scenario";
    else if(prevModality==="scenario") modality = "matching";
    else if(prevModality==="matching") modality = "scenario";
    else modality = "sequence";
    reasons.push(`Struggle risk is HIGH (${risk.factors.join(", ")}), so a recovery quest drops difficulty to D${difficulty}`);
    reasons.push(`and switches the interaction from ${MODALITY_LABEL[prevModality]} to ${MODALITY_LABEL[modality]}, which shows the idea instead of testing recall`);
    if(mis) reasons.push(`It targets the detected misconception "${MIS_LABEL[mis]||mis}"`);
  } else if(risk.level==="MEDIUM"){
    questType = "NORMAL";
    difficulty = s.difficulty;
    if(!lastCorrect){
      const rotate = {mcq:"scenario", scenario:"matching", matching:"mcq", sequence:"matching", speed:"mcq"};
      modality = rotate[prevModality] || "mcq";
      reasons.push(`Struggle risk is MEDIUM (${risk.factors.join(", ")||"mixed signals"}), so difficulty holds at D${difficulty} and the format changes to ${MODALITY_LABEL[modality]} to approach the idea from another angle`);
    } else {
      modality = prevModality;
      reasons.push(`Struggle risk is MEDIUM, so difficulty holds at D${difficulty} while the format stays ${MODALITY_LABEL[modality]}`);
    }
  } else {
    if(lastCorrect && s.consecRight>=1 && s.mastery>=0.4 && s.difficulty<3){
      difficulty = s.difficulty+1;
      reasons.push(`Clean run on this skill, so difficulty rises to D${difficulty}`);
    } else {
      reasons.push(`Performance is stable, so difficulty stays at D${difficulty}`);
    }
    if(difficulty>=3 && s.mastery>=0.55){
      questType = "CHALLENGE"; modality = "speed";
      reasons.push("and a timed speed round checks whether the rule is now automatic");
    } else if(difficulty>=3){
      modality = "sequence";
      reasons.push("and a sequence challenge tests whether you can order the whole procedure");
    } else {
      modality = st.preferred || prevModality;
      reasons.push(`using ${MODALITY_LABEL[modality]}, your strongest interaction so far`);
    }
    if(s.mastery>=0.8){
      const i = skillOrder.indexOf(skillId);
      const next = skillOrder.slice(i+1).find(k=>getSkill(st,k).mastery<0.8);
      if(next){ nextSkill = next; difficulty = Math.max(1, getSkill(st,next).difficulty); modality="mcq"; questType="NORMAL";
        reasons.push(`${skillName(skillId)} is mastered, so the path moves on to ${skillName(next)}`); }
    }
  }

  const bossReady = regionState(st, subjectOfSkill(skillId)).r3.unlocked;
  if(bossReady && questType!=="RECOVERY") reasons.push(`Average mastery has passed the gate, so ${BOSS[subjectOfSkill(skillId)].name} is unlocked in Challenge Citadel`);

  const ch = pickChallenge(st, nextSkill, difficulty, modality);
  return {
    nextSkill, difficulty, modality, prevDifficulty, prevModality,
    questType, questLabel: questType==="RECOVERY"?"Recovery Quest":questType==="CHALLENGE"?"Challenge Quest":"Normal Quest",
    risk, misconception: mis, recovery, bossReady,
    reason: reasons.join(". ") + ".",
    challengeId: ch.id
  };
}

export { struggleRisk, detectMisconception, MIS_LABEL, adapt };

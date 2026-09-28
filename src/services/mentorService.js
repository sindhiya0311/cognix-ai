import { getSkill, acc, overall, MODALITY_LABEL } from '../adaptive/learnerState.js';
import { struggleRisk, MIS_LABEL } from '../adaptive/engine.js';
import { skillName } from '../data/content.js';

function mentorLocal(st, skillId, text){
  const s = getSkill(st, skillId);
  const r = struggleRisk(s);
  const t = (text||"").toLowerCase();
  if(t.includes("why")) return `You are on ${skillName(skillId)} at difficulty ${s.difficulty}. Struggle risk is ${r.level}${r.factors.length?" because of "+r.factors.join(" and "):""}. That is what set your next challenge.`;
  if(t.includes("wrong")||t.includes("mistake")) return `Your last miss on ${skillName(skillId)} looks like ${s.misconception?(MIS_LABEL[s.misconception]||s.misconception):"a slip rather than a gap"}. That is why the engine moved you to a ${MODALITY_LABEL[s.modality]} challenge at D${s.difficulty} — different interaction, same idea.`;
  if(t.includes("modality")||t.includes("format")) return `Your strongest interaction so far is ${MODALITY_LABEL[st.preferred||"mcq"]}, so the engine leans on it when you are stable and switches away from a failing format when you are not.`;
  if(t.includes("hint")||t.includes("stuck")) return `Slow down on the first line of the question. On ${skillName(skillId)} your errors cluster around ${s.misconception?(MIS_LABEL[s.misconception]||s.misconception):"small procedural slips"}. Re-read the question and say the rule out loud before choosing.`;
  if(t.includes("progress")||t.includes("how am i")) return `Mastery ${(s.mastery*100|0)}%, accuracy ${(acc(s)*100|0)}%, ${s.attempts} attempts, ${s.errors} errors. ${s.mastery>=0.8?"You are ready to move on.":"Two clean answers in a row will push you up a difficulty."}`;
  if(t.includes("boss")) return `The boss opens at 50% average mastery across the subject's three skills. You are at ${(overall(st).mastery*100|0)}%.`;
  if(t.includes("explain")) return `Think of ${skillName(skillId)} as a rule you apply, not a fact you recall. Name the rule, then apply it to the numbers or words in front of you.`;
  return `I am tracking ${skillName(skillId)}. Struggle risk ${r.level}, mastery ${(s.mastery*100|0)}%. Ask me "why this challenge", "give me a hint", or "how am I doing".`;
}

async function mentorReply(st, skillId, text, key){
  if(!key) return mentorLocal(st, skillId, text);
  const s = getSkill(st, skillId);
  const sys = `You are the GameLearn AI mentor. You do NOT control game logic. The adaptive engine decided: skill=${skillName(skillId)}, difficulty=${s.difficulty}, modality=${s.modality}, mastery=${(s.mastery*100|0)}%, struggle risk=${struggleRisk(s).level}, misconception=${s.misconception||"none"}. Reply in under 70 words, encouraging, concrete, no lists.`;
  try{
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,{
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({system_instruction:{parts:[{text:sys}]}, contents:[{role:"user",parts:[{text}]}]})
    });
    const d = await res.json();
    const out = d?.candidates?.[0]?.content?.parts?.[0]?.text;
    return out ? out.trim() : mentorLocal(st, skillId, text);
  }catch(e){ return mentorLocal(st, skillId, text) + "  (Gemini unreachable, using built-in mentor.)"; }
}

export { mentorLocal, mentorReply };

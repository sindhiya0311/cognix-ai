import { GAME_ORDER, GAME_LABELS, worldGames } from "../data/v2data.js";

export function signalsFor(world){
  const h=world.history||[];
  const attempts=h.length;
  const correct=h.filter(x=>x.correct).length;
  const accuracy=attempts?correct/attempts:0;
  const avgTime=attempts?h.reduce((a,x)=>a+(x.seconds||0),0)/attempts:0;
  const errors=attempts-correct;
  const recent=h.slice(-4);
  const wrongStreak=recent.length?recent.slice().reverse().findIndex(x=>x.correct!==false):-1;
  return {attempts,accuracy,avgTime,errors,wrongStreak};
}
export function decideNext(space,world){
  const s=signalsFor(world);
  const last=world.history?.at(-1);
  let game="quiz", difficulty=world.difficulty||1, mode="normal", reason="Start with a baseline check.";
  if(s.attempts===0){ game=world.games?.[0]||"quiz"; }
  else if(s.accuracy<0.5 || s.errors>=2){
    const prev=last?.game;
    game=prev==="quiz"?"match":prev==="match"?"scenario":prev==="sequence"?"puzzle":"scenario";
    difficulty=Math.max(1,difficulty-1); mode="recovery";
    reason="Repeated errors suggest a gap, so the next activity changes modality and lowers difficulty.";
  } else if(last && !last.correct){
    const rotate={quiz:"scenario",scenario:"match",match:"puzzle",puzzle:"sequence",sequence:"flashcards",flashcards:"scenario",explore:"match",speed:"puzzle"};
    game=rotate[last.game]||"scenario"; mode="guided";
    reason="A recent miss triggers a different representation of the same concept.";
  } else if(s.accuracy>=0.8 && s.avgTime>0 && s.avgTime<12){
    difficulty=Math.min(4,difficulty+1);
    game=difficulty>=3?"speed":"puzzle"; mode="challenge";
    reason="Fast, accurate performance supports a harder challenge.";
  } else {
    const prev=last?.game;
    const idx=Math.max(0,GAME_ORDER.indexOf(prev));
    game=GAME_ORDER[(idx+1)%GAME_ORDER.length]||"puzzle";
    reason="Stable performance rotates the modality so learning is not reduced to one interaction type.";
  }
  const mastery=world.mastery||0;
  const bossReady=mastery>=0.72 && s.accuracy>=0.65 && s.attempts>=4;
  return {game,difficulty,mode,reason,bossReady,mastery};
}
export function applyGameResult(world,result){
  const prev=world.mastery||0;
  const weight=result.game==="flashcards"?0.12:0.18;
  let next=result.correct ? Math.min(1,prev+weight*(result.difficulty||1)*(.75+result.confidence*.25)) : Math.max(0,prev-0.04);
  world.mastery=next;
  world.difficulty=result.correct ? Math.min(4,Math.max(world.difficulty||1,(next>=.7?3:(world.difficulty||1)))) : Math.max(1,(world.difficulty||1)-1);
  world.history=[...(world.history||[]),result].slice(-30);
  if(result.correct && !world.completedGames.includes(result.game)) world.completedGames.push(result.game);
  return next;
}
export function misconception(world){
  const bad=(world.history||[]).filter(x=>!x.correct);
  if(bad.length>=2){
    const g=bad.at(-1)?.game;
    return g==="sequence"?"Sequence/order misconception":g==="match"?"Concept relationship misconception":"Concept application misconception";
  }
  return null;
}

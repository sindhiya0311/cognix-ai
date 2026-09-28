import React, { useState, useEffect, useMemo, useRef } from 'react';
import { QT_FRAME, QT_CLASS, QT_TEXT, shuffleStable } from './questVisuals.js';

function Quest({ch, onSubmit, auto, questType="NORMAL", allowHint=true}){
  const [sel,setSel] = useState(null);
  const [order,setOrder] = useState([]);
  const [hint,setHint] = useState(false);
  const [t0] = useState(()=>Date.now());
  const [,setTick] = useState(0);
  // matching state
  const [pick,setPick] = useState(null);
  const [linked,setLinked] = useState([]);
  const [bad,setBad] = useState(null);
  const [miss,setMiss] = useState(0);
  // speed state
  const [idx,setIdx] = useState(0);
  const [got,setGot] = useState(0);
  const [left,setLeft] = useState(ch.limit||35);
  const done = useRef(false);

  const rights = useMemo(()=> ch.type==="matching" ? shuffleStable(ch.pairs.map(p=>p[1])) : [], [ch.id]);
  const shuffled = useMemo(()=> ch.type==="sequence" ? shuffleStable(ch.seq) : [], [ch.id]);

  useEffect(()=>{ const i=setInterval(()=>setTick(x=>x+1),1000); return ()=>clearInterval(i); },[]);
  useEffect(()=>{ setSel(null); setOrder([]); setHint(false); setPick(null); setLinked([]); setMiss(0);
    setIdx(0); setGot(0); setLeft(ch.limit||35); done.current=false; },[ch.id]);

  // speed countdown
  useEffect(()=>{
    if(ch.type!=="speed") return;
    const i = setInterval(()=>setLeft(v=>{
      if(v<=1){ clearInterval(i); finishSpeed(got); return 0; }
      return v-1;
    }),1000);
    return ()=>clearInterval(i);
  },[ch.id, got]);

  function send(correct, misTag){
    if(done.current) return; done.current = true;
    onSubmit({correct, seconds:Math.max(1,(Date.now()-t0)/1000), hintUsed:hint, misTag: correct?null:misTag});
  }
  function finishSpeed(score){ send(score >= Math.ceil(ch.items.length*0.75), "speed-recall"); }

  function answerSpeed(i){
    const item = ch.items[idx];
    const ok = i===item.ok;
    const ns = got + (ok?1:0);
    setGot(ns);
    if(idx+1>=ch.items.length) finishSpeed(ns); else setIdx(idx+1);
  }
  function tryMatch(rightText){
    if(pick===null) return;
    const correct = ch.pairs[pick][1]===rightText;
    if(correct){
      const nl = [...linked, pick]; setLinked(nl); setPick(null);
      if(nl.length===ch.pairs.length) send(miss<=1, "mismatch");
    }else{
      setBad(rightText); setMiss(m=>m+1); setTimeout(()=>setBad(null),320);
    }
  }
  function submitClassic(i,o){
    if(ch.type==="sequence"){
      const chosen = o || order;
      const correct = chosen.length===ch.seq.length && chosen.every((x,k)=>x===ch.seq[k]);
      send(correct, "sequence-order");
    }else{
      const k = (i===null||i===undefined)? sel : i;
      const opt = ch.options[k];
      send(!!opt.ok, opt.mis||"persistent-error");
    }
  }

  // guided demo autoplay
  useEffect(()=>{
    if(!auto) return;
    const t = setTimeout(()=>{
      if(ch.type==="sequence") submitClassic(null, auto.correct? ch.seq.slice() : ch.seq.slice().reverse());
      else if(ch.type==="matching"){
        if(auto.correct) send(true,null); else { setMiss(3); send(false,"mismatch"); }
      }
      else if(ch.type==="speed") finishSpeed(auto.correct? ch.items.length : 1);
      else submitClassic(auto.correct ? ch.options.findIndex(o=>o.ok) : ch.options.findIndex(o=>!o.ok), null);
    }, 1500);
    return ()=>clearTimeout(t);
  },[ch.id, auto]);

  const secs = Math.round((Date.now()-t0)/1000);
  const ready = ch.type==="sequence" ? order.length===ch.seq.length : sel!==null;
  const kind = {mcq:"Multiple choice", scenario:"Scenario", sequence:"Order the steps", matching:"Match the pairs", speed:"Speed round"}[ch.type];

  return (
    <div className={"glass pad flash "+QT_FRAME[questType]} style={{maxWidth:820,margin:"0 auto"}}>
      <div className="row sp wrap" style={{marginBottom:12,gap:8}}>
        <div className="row wrap" style={{gap:7}}>
          <span className={"qtype "+QT_CLASS[questType]}>{QT_TEXT[questType]}</span>
          <span className="chip g">{skillName(ch.skill)}</span>
          <span className="chip">D{ch.diff}</span>
          <span className="chip">{kind}</span>
        </div>
        <span className="chip a">{ch.type==="speed"? left+"s left" : secs+"s"}</span>
      </div>

      {questType==="RECOVERY" && <div className="why" style={{marginBottom:12,borderLeftColor:"var(--red)",background:"linear-gradient(90deg,rgba(255,63,99,.10),transparent)"}}>
        Recovery quest. GameLearn slowed the game down for you: lower difficulty, a different interaction, more guidance.</div>}
      {questType==="CHALLENGE" && <div className="why" style={{marginBottom:12,borderLeftColor:"var(--amber)",background:"linear-gradient(90deg,rgba(255,196,77,.10),transparent)"}}>
        Challenge quest. You earned a harder, timed encounter.</div>}

      {ch.story && <div className="why" style={{marginBottom:12,fontSize:14.5}}>{ch.story}</div>}

      {ch.type==="speed" ? (
        <div>
          <h2 style={{margin:"0 0 2px",fontSize:20}}>{ch.prompt}</h2>
          <div className="small muted">Answer {ch.items.length} in {ch.limit}s. {Math.ceil(ch.items.length*0.75)} correct clears it.</div>
          <div className="timerbar"><i style={{width:(left/(ch.limit||35)*100)+"%"}}/></div>
          <div className="row sp small muted" style={{marginBottom:6}}><span>Question {Math.min(idx+1,ch.items.length)} of {ch.items.length}</span><span>{got} correct</span></div>
          <h3 style={{margin:"6px 0 0",fontSize:17}}>{ch.items[Math.min(idx,ch.items.length-1)].q}</h3>
          {ch.items[Math.min(idx,ch.items.length-1)].o.map((o,i)=>
            <button key={i} className="opt" onClick={()=>answerSpeed(i)}>{o}</button>)}
        </div>
      ) : ch.type==="matching" ? (
        <div>
          <h2 style={{margin:"0 0 4px",fontSize:20,lineHeight:1.35}}>{ch.prompt}</h2>
          <div className="small muted">Tap a term, then tap the description that belongs to it. {miss>0 && <span style={{color:"var(--red)"}}>{miss} mismatch{miss>1?"es":""}</span>}</div>
          <div className="match">
            <div className="mcol">
              {ch.pairs.map((p,i)=>(
                <button key={i} disabled={linked.includes(i)}
                  className={linked.includes(i)?"done":(pick===i?"sel":"")}
                  onClick={()=>setPick(i)}>{p[0]}</button>
              ))}
            </div>
            <div className="mcol">
              {rights.map((r,i)=>{
                const solved = linked.some(k=>ch.pairs[k][1]===r);
                return <button key={i} disabled={solved}
                  className={solved?"done":(bad===r?"bad":"")}
                  onClick={()=>tryMatch(r)}>{r}</button>;
              })}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h2 style={{margin:"0 0 6px",fontSize:20,lineHeight:1.35}}>{ch.prompt}</h2>
          {ch.type==="sequence" ? (
            <div>
              <div className="small muted" style={{margin:"10px 0 4px"}}>Tap the steps in the correct order.</div>
              <div>
                {shuffled.map(item=>(
                  <button key={item} className={"seq"+(order.includes(item)?" used":"")} disabled={order.includes(item)}
                    onClick={()=>setOrder([...order,item])}>{item}</button>
                ))}
              </div>
              <div className="glass pad" style={{marginTop:12,background:"rgba(255,255,255,.03)"}}>
                {order.length? order.map((x,i)=><div key={x} className="kv"><span className="muted">{i+1}</span><span>{x}</span></div>)
                  : <span className="small muted">Your order will appear here.</span>}
              </div>
              {order.length>0 && <button className="btn ghost" style={{marginTop:10}} onClick={()=>setOrder([])}>Clear order</button>}
            </div>
          ) : ch.options.map((o,i)=>(
            <button key={i} className={"opt"+(sel===i?" sel":"")} onClick={()=>setSel(i)}>{o.t}</button>
          ))}
        </div>
      )}

      {hint && <div className="why" style={{marginTop:12}}><b>Mentor hint.</b> {ch.hint}</div>}

      <div className="row sp wrap" style={{marginTop:16,gap:10}}>
        <button className="btn ghost" onClick={()=>setHint(true)} disabled={hint||!allowHint}>
          {!allowHint? "Hints disabled at this mastery" : hint?"Hint shown":"Use a hint (costs XP)"}</button>
        {(ch.type==="mcq"||ch.type==="scenario"||ch.type==="sequence") &&
          <button className="btn" disabled={!ready} onClick={()=>submitClassic()}>Submit answer</button>}
      </div>
    </div>
  );
}

export default Quest;

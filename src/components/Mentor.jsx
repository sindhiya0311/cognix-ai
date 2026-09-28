import React, { useState } from 'react';
import { skillName } from '../data/content.js';
import { mentorReply } from '../services/mentorService.js';

function Mentor({st,subject,skillId,apiKey,setApiKey}){
  const [msgs,setMsgs] = useState([{who:"bot",t:`I am your GameLearn mentor. The adaptive engine picks your challenges; I explain them. You are working on ${skillName(skillId)}.`}]);
  const [text,setText] = useState("");
  const [busy,setBusy] = useState(false);
  const send = async (q)=>{
    const msg = (q||text).trim(); if(!msg) return;
    setMsgs(m=>[...m,{who:"me",t:msg}]); setText(""); setBusy(true);
    const r = await mentorReply(st, skillId, msg, apiKey);
    setMsgs(m=>[...m,{who:"bot",t:r}]); setBusy(false);
  };
  return (
    <div className="grid" style={{gridTemplateColumns:"minmax(0,2fr) minmax(0,1fr)"}}>
      <div className="glass pad">
        <h3 style={{margin:"0 0 12px"}}>AI Mentor</h3>
        <div className="grid" style={{gap:9,maxHeight:420,overflowY:"auto",marginBottom:12}}>
          {msgs.map((m,i)=><div key={i} className={"msg "+(m.who==="me"?"me":"bot")}>{m.t}</div>)}
          {busy && <div className="msg bot muted">Thinking…</div>}
        </div>
        <div className="row wrap" style={{gap:7,marginBottom:10}}>
          {["Why this challenge?","Give me a hint","How am I doing?","When does the boss open?"].map(q=>
            <button key={q} className="chip" style={{cursor:"pointer"}} onClick={()=>send(q)}>{q}</button>)}
        </div>
        <div className="row" style={{gap:8}}>
          <input style={{flex:1}} value={text} placeholder="Ask the mentor…" onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}/>
          <button className="btn" onClick={()=>send()} disabled={busy}>Send</button>
        </div>
      </div>
      <div className="glass pad" style={{alignSelf:"start"}}>
        <h3 style={{margin:"0 0 8px"}}>Gemini (optional)</h3>
        <div className="small muted" style={{marginBottom:10}}>Leave this empty and the built-in mentor answers from your live learner state. Add a key to have Gemini phrase the explanations. The engine still decides what you play.</div>
        <input style={{width:"100%"}} type="password" placeholder="Gemini API key" value={apiKey} onChange={e=>setApiKey(e.target.value)}/>
        <div className="small muted" style={{marginTop:10}}>Context sent: skill, difficulty, modality, mastery, struggle risk, misconception.</div>
      </div>
    </div>
  );
}

export default Mentor;

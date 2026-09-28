import React from 'react';
import { level } from '../adaptive/learnerState.js';
import { SUBJECTS } from '../data/content.js';

function TopBar({st,view,setView,subject,setSubject}){
  const lv = level(st), into = st.xp % 120;
  return (
    <div className="topbar">
      <div className="row sp wrap" style={{gap:10}}>
        <div className="row" style={{gap:10}}>
          <div className="logo">GAME<span>LEARN</span> AI</div>
          <span className="chip g">LV {lv}</span>
          <span className="chip">{st.xp} XP</span>
          <span className={"chip "+(st.streak>1?"a":"")}>{st.streak} streak</span>
        </div>
        <div className="row" style={{gap:8,flex:1,minWidth:200,maxWidth:340}}>
          <div className="xpbar"><i style={{width:(into/120*100)+"%"}}/></div>
          <select value={subject} onChange={e=>setSubject(e.target.value)} style={{padding:"7px 10px",fontSize:13}}>
            {Object.keys(SUBJECTS).map(k=><option key={k} value={k}>{SUBJECTS[k].name}</option>)}
          </select>
        </div>
      </div>
      <div className="nav" style={{marginTop:9}}>
        {["World","Quests","Mentor","Profile","Analytics"].map(v=>
          <button key={v} className={view===v.toLowerCase()?"on":""} onClick={()=>setView(v.toLowerCase())}>{v}</button>)}
      </div>
    </div>
  );
}

export default TopBar;

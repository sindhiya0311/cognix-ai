import React from 'react';

function Bar({v,label,right}){
  return (
    <div style={{marginBottom:10}}>
      <div className="row sp small" style={{marginBottom:5}}><span className="muted">{label}</span><span>{right}</span></div>
      <div className="bar"><i style={{width:Math.max(2,Math.round(v*100))+"%"}}/></div>
    </div>
  );
}

export default Bar;

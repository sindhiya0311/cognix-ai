import { blankState } from '../adaptive/learnerState.js';

const save = st => { try{ localStorage.setItem("gamelearn_v1", JSON.stringify(st)); }catch(e){} };
const load = () => { try{ const r = localStorage.getItem("gamelearn_v1"); if(!r) return null;
  const o = JSON.parse(r); return Object.assign(blankState(), o, {adaptLog:o.adaptLog||[], preferred:o.preferred||"mcq"}); }catch(e){ return null; } };

export { save, load };

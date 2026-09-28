const KEY="cognix_v2";
export function loadSpaces(){try{return JSON.parse(localStorage.getItem(KEY))||null}catch{return null}}
export function saveSpaces(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}}

const QT_FRAME = {RECOVERY:"frame-recovery", CHALLENGE:"frame-challenge", BOSS:"frame-boss", NORMAL:""};
const QT_CLASS = {RECOVERY:"qt-recovery", CHALLENGE:"qt-challenge", BOSS:"qt-boss", NORMAL:"qt-normal"};
const QT_TEXT = {RECOVERY:"Recovery Quest", CHALLENGE:"Challenge Quest", BOSS:"Boss Battle", NORMAL:"Normal Quest"};
const shuffleStable = arr => arr.slice().sort((a,b)=>(String(a).length%5)-(String(b).length%5)||String(a).localeCompare(String(b)));

export { QT_FRAME, QT_CLASS, QT_TEXT, shuffleStable };

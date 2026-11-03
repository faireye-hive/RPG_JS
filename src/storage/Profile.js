const KEY='cronicas_eter_profile_v1';
export function getProfile() {
  try {
    const v=JSON.parse(localStorage.getItem(KEY) || '{}');
    return { bestTime: Number(v.bestTime)||0, bestKills:Number(v.bestKills)||0, runs:Number(v.runs)||0 };
  } catch { return { bestTime:0,bestKills:0,runs:0 }; }
}
export function recordRun(time,kills) {
  const p=getProfile();
  p.bestTime=Math.max(p.bestTime,Math.floor(time));p.bestKills=Math.max(p.bestKills,kills);p.runs++;
  try { localStorage.setItem(KEY,JSON.stringify(p)); } catch {}
  return p;
}

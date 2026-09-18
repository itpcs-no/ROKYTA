import {sitePavedHeight,siteShoulderHeight,secondaryAccess} from './site-layout.js';
import {caretakerGardenHeight,gardenBlend,sideApproach} from './caretaker-access-layout.js';

// Grassy replacement for the long eastern retaining wall shown by the owner.
// Its rounded front stays beside the cellars, outside every doorway and apron.
export const gardenBank={edgeX:34.5,width:secondaryAccess.x-secondaryAccess.width/2-34.5,front:-2.5,roundLength:4.2,rear:24.4,end:28,top:2.55};
const p=gardenBank,clamp=t=>Math.max(0,Math.min(1,t)),smooth=t=>{const u=clamp(t);return u*u*(3-2*u)};
export function gardenBankWidth(z){const t=clamp((z-p.front)/p.roundLength);return p.width*Math.sqrt(Math.max(0,1-(1-t)*(1-t)))}
export function gardenBankBase(x,z,roadLevel){return sitePavedHeight(x,z,roadLevel)??siteShoulderHeight(x,z,roadLevel)??-.06}
export function gardenBankHeight(x,z,roadLevel){
 if(z<p.front||z>p.end||x<p.edgeX)return null;
 const width=gardenBankWidth(z);if(x>p.edgeX+width+1e-8)return null;
 if(width<1e-8)return p.top;
 const u=clamp((x-p.edgeX)/width),base=gardenBankBase(x,z,roadLevel);
 const inner=caretakerGardenHeight(z),top=inner+(gardenBankBase(p.edgeX,z,roadLevel)-inner)*smooth((z-p.rear)/(p.end-p.rear));
 return base+(top-base)*(1-smooth(u));
}
export const gardenBankRows=[...new Set([p.front,p.front+.015,p.front+.05,p.front+.12,p.front+.25,p.front+.45,p.front+.75,p.front+1.1,p.front+1.6,p.front+2.4,p.front+3.3,p.front+p.roundLength,p.rear,p.end,gardenBlend.z0,gardenBlend.z1,sideApproach.z1,...Array.from({length:62},(_,i)=>p.front+i*.5)])].filter(z=>z<=p.end).sort((a,b)=>a-b);
export const gardenBankOutline=[[p.edgeX,p.front],[p.edgeX,p.end],...gardenBankRows.toReversed().map(z=>[p.edgeX+gardenBankWidth(z),z])].filter((a,i,all)=>!i||Math.hypot(a[0]-all[i-1][0],a[1]-all[i-1][1])>1e-8);

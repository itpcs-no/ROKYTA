// Landscape reconstruction from the three aerial photographs dated 2007.
// Positions, grading and the smaller court's markings are visual estimates.
// The proposed building's PDF geometry is intentionally not used as a 2007 survey.
import {raisedParkingTerrain,courtFrontWalls} from './parking-layout.js';
import {homesLevel,homeGroundHeight} from './homes-layout.js';
import {curvedBankHeight,curvedParking} from './curved-parking-layout.js';
export const courtSite={
 level:homesLevel,ground:homesLevel-.04,x0:-73,x1:49,z0:33,z1:98,
 plateauX0:-58,plateauX1:29,plateauZ0:47,plateauZ1:79,
 stairs:{x:1,width:2,z0:34,z1:46,count:29},
 link:{x0:-45.35,x1:0,z0:47.2,z1:48.5}
};
export const courtTerrainBounds={...courtSite,z0:curvedParking.terrainZ0};
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t)};
const inRect=(x,z,a,b,c,d)=>x>=a&&x<=c&&z>=b&&z<=d;
export function courtStairHeight(z,roadLevel){
 const s=courtSite.stairs;if(z<s.z0)return roadLevel;if(z>=s.z1)return courtSite.level;
 const t=clamp((z-s.z0)/(s.z1-s.z0));
 return roadLevel+(Math.floor(t*s.count)+1)*(courtSite.level-roadLevel)/s.count;
}
export function courtTerrainHeight(x,z,roadLevel){
 const s=courtSite;if(!inRect(x,z,s.x0,s.z0,s.x1,s.z1))return curvedBankHeight(x,z,roadLevel);
 const across=smooth((x-s.x0)/(s.plateauX0-s.x0))*smooth((s.x1-x)/(s.x1-s.plateauX1));
 const rear=smooth((s.z1-z)/(s.z1-s.plateauZ1));
 const rise=clamp((z-s.z0)/(s.plateauZ0-s.z0));
 const road=x>=-47.5&&x<=47.5?roadLevel:-.06;
 let y=-.06+(s.ground+.06)*across*rear;
 if(z<s.plateauZ0)y=road*(1-rise)+y*rise;
 // Shallow irregularities belong to the slopes, not beneath the level courts.
 if(rise>0&&rise<1)y+=Math.sin(x*.23)*Math.sin(z*.31)*.13*Math.sin(rise*Math.PI);
 y=raisedParkingTerrain(x,z,roadLevel,y);
 y=curvedBankHeight(x,z,roadLevel,y)??y;
 const st=s.stairs;
 if(Math.abs(x-st.x)<=st.width/2+.16&&z<=49.35){
  const linear=roadLevel+clamp((z-st.z0)/(st.z1-st.z0))*(s.level-roadLevel);
  y=Math.min(y,linear-.2);
 }
 return homeGroundHeight(x,z,roadLevel,y);
}
export function courtWalkingHeight(x,z,roadLevel){
 let y=courtTerrainHeight(x,z,roadLevel);if(y===null)return null;
 const s=courtSite,st=s.stairs;
 if(Math.abs(x-st.x)<=st.width/2&&z>=s.z0&&z<=49.35)y=courtStairHeight(z,roadLevel);
 if(inRect(x,z,s.link.x0,s.link.z0,s.link.x1,s.link.z1))y=s.level;
 return y;
}
function nearSegment(x,z,s,r){
 const [ax,az]=s.a,[bx,bz]=s.b,dx=bx-ax,dz=bz-az,t=clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz));
 return Math.hypot(x-ax-t*dx,z-az-t*dz)<r;
}
export function courtBarrierAt(x,z){
 const st=courtSite.stairs;
 const sides=[{a:[st.x-st.width/2-.08,st.z0],b:[st.x-st.width/2-.08,st.z1]},{a:[st.x+st.width/2+.08,st.z0],b:[st.x+st.width/2+.08,st.z1]},
  ...courtFrontWalls.map(([a,b])=>({a:[a,33.12],b:[b,33.12]}))];
 return sides.some(s=>nearSegment(x,z,s,.18));
}

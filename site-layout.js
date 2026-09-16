// Site envelope reconstructed from the supplied 2007 aerial photographs.
// Ancillary footprints corrected against the supplied site map: the long wing
// gives 2.5401 px/m; the pool fixes orientation (map right is model negative x).
// Ground levels outside the PDF ramp remain estimates.
import {curvedRoadPoints,curvedBankHeight} from './curved-parking-layout.js';
export const entrance={x:44,z:30.5,width:6,slide:6.7};
export const serviceHouse={x0:-57.7,x1:-51.3,z0:-10.25,z1:4.45,base:.06,eaves:3.1,rise:.75};
export const serviceShed={x0:-60.7,x1:-56.7,z0:-32.85,z1:-23.05,base:.06};
// Social pavilion replaces the open shed; furniture coordinates are local to
// its rear corner and shared by the visible model and movement barriers.
export const pavilion={ceiling:2.7,screenDepth:2.1,
 counter:{x0:.16,x1:1.08,z0:.45,z1:4.65},bar:{x0:2.6,x1:3.38,z0:.8,z1:4.6},
 table:{x0:1.9,x1:3.05,z0:6.2,z1:8.9},
 benches:[{x0:1.04,x1:1.52,z0:6.15,z1:8.95},{x0:3.48,x1:3.96,z0:6.15,z1:8.95}],
 posts:[{x:4.15,z:0},{x:4.15,z:4.9},{x:4.15,z:9.8}],
 stools:[1.25,2.2,3.15,4.1].map(z=>({x:4.08,z})),
 planters:[{x0:4.3,x1:5.05,z0:-.35,z1:.55},{x0:4.3,x1:5.05,z0:9.25,z1:10.15}],
 entry:{x:-55.1,z:-27.4},target:{x:-58.25,y:1.35,z:-27.9}
};
export function pavilionCeiling(x,z){const s=serviceShed;return x>=s.x0-.28&&x<=s.x1+.65&&z>=s.z0-.28&&z<=s.z1+.28?s.base+pavilion.ceiling:null}
export function pavilionBarrierAt(x,z){
 const s=serviceShed,p=pavilion,u=x-s.x0,v=z-s.z0;
 if(near(u,v,[0,0],[0,9.8],.28)||near(u,v,[0,0],[p.screenDepth,0],.23)||near(u,v,[0,9.8],[p.screenDepth,9.8],.23))return true;
 if(p.posts.some(a=>Math.hypot(u-a.x,v-a.z)<.29)||p.stools.some(a=>Math.hypot(u-a.x,v-a.z)<.42))return true;
 return [p.counter,p.bar,p.table,...p.benches,...p.planters].some(r=>u>r.x0-.18&&u<r.x1+.18&&v>r.z0-.18&&v<r.z1+.18);
}
export const servicePaving=[[-58.5,5.05],[-45.6,5.05],[-45.6,-11.05],[-46.9,-11.05],[-46.9,-33.65],[-61.5,-33.65],[-61.5,-22.25],[-55.8,-22.25],[-55.8,-11.05],[-58.5,-11.05]];
// Fill the garden-side verge flush with the straight road; blend only its
// outer ends into the surrounding terrain, not down into a ditch by the road.
export const roadsideGarden={x0:-37,x1:39,z0:23.5,z1:28,blend:3.6};
const clamp=x=>Math.max(0,Math.min(1,x));
export function inSitePolygon(x,z,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
 const [a,b]=points[i],[c,d]=points[j];if((b>z)!==(d>z)&&x<(c-a)*(z-b)/(d-b)+a)inside=!inside;
}return inside}
function sample(points){
 const result=[];
 for(let i=0;i<points.length-1;i++){
  const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
  const n=Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])*2);
  for(let k=0;k<n;k++){const t=k/n;result.push(b.map((v,j)=>j===2?v+(c[j]-v)*(t*t*(3-2*t)):.5*((2*v)+(-a[j]+c[j])*t+(2*a[j]-5*v+4*c[j]-d[j])*t*t+(-a[j]+3*v-3*c[j]+d[j])*t*t*t)))}
 }
 result.push(points.at(-1));return result;
}
const roadCache=new Map();
export function siteRoads(level){
 if(!roadCache.has(level))roadCache.set(level,[
  {name:'Cesta od brány okolo záhrady',width:5,points:[...sample([[48.75,30.5,level],[39,30.5,level],[16,30.5,level],[-22,30.5,level],[-37,30.5,level],[-47.5,30.5,level]]).slice(0,-1),...curvedRoadPoints(level),...sample([[-48.3,5.6,.06],[-48.6,-7.8,.06],[-49.3,-20,.06],[-50,-34,.06]]).slice(1)]},
  {name:'Vonkajšia príjazdová cesta',width:5.5,points:sample([[51.5,-65,.06],[51.5,-42,.06],[51.5,-15,.38],[51.5,14,level],[51.5,26,level],[51.5,34,level],[51.5,43,level],[51.5,70,.06]])}
 ]);
 return roadCache.get(level);
}
export function closestRoad(x,z,road){
 let best={distance:Infinity,height:0};
 for(let i=1;i<road.points.length;i++){
  const a=road.points[i-1],b=road.points[i],dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz));
  const distance=Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);
  if(distance<best.distance)best={distance,height:a[2]+t*(b[2]-a[2])};
 }return best;
}
export function sitePavedHeight(x,z,level){
 if(x>=43.3&&x<=44.4&&z>=20&&z<=27.5)return level;
 // Apron, side entrance to existing covered parking, and pedestrian exit.
 if(inSitePolygon(x,z,servicePaving)||(x>=-48.6&&x<=37&&z>=-9.95&&z<=-5.65)||(x>=-37&&x<=-35&&z>=-49&&z<=-43.5))return .06;
 for(const road of siteRoads(level)){const p=closestRoad(x,z,road);if(p.distance<=road.width/2+.001)return p.height}
 return null;
}
export function siteShoulderHeight(x,z,level){
 // The existing court bank starts at z=33; never cover it with a second terrain.
 if(z>=33&&x<49)return null;
 if(curvedBankHeight(x,z,level)!==null)return null;
 let y=null;
 if(!(x>-37&&x<39&&z<25))for(const road of siteRoads(level)){
  const p=closestRoad(x,z,road),r=road.width/2;
  if(p.distance>r&&p.distance<r+3.6){const t=clamp((p.distance-r)/3.6);y=Math.max(y??-.06,(p.height-.025)*(1-t)-.06*t)}
 }
 const g=roadsideGarden;
 if(z<=g.z1){
  const distance=Math.max(g.x0-x,0,x-g.x1,g.z0-z),t=clamp(1-distance/g.blend);
  if(t>0){const weight=t*t*(3-2*t);y=(y??-.06)*(1-weight)+level*weight}
 }
 return y;
}
export const siteBoundary=[
 {points:[[44,27.2],[44,-41],[33,-48],[-35,-48]],type:'wall'},
 {points:[[-37,-48],[-59,-48],[-66,-40],[-66,25],[-64,35],[-65,72]],type:'fence'},
 {points:[[-65,72],[-58,86],[31,86],[43,76],[45,42],[44,33.8]],type:'fence'}
];
export const boundarySegments=siteBoundary.flatMap(part=>part.points.slice(1).map((p,i)=>({a:part.points[i],b:p,type:part.type})));
function near(x,z,a,b,r){const dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)<r}
export function siteBarrierAt(x,z,open){
 if(boundarySegments.some(s=>near(x,z,s.a,s.b,.35)))return true;
 if(Math.abs(x-entrance.x)<.48&&(Math.abs(z-27.2)<.52||Math.abs(z-33.8)<.52))return true;
 const cz=entrance.z-(open?entrance.slide:0);
 if(Math.abs(x-(entrance.x-.29))<.24&&Math.abs(z-cz)<entrance.width/2+.18)return true;
 const h=serviceHouse;
 if(x>h.x0-.18&&x<h.x1+.18&&z>h.z0-.18&&z<h.z1+.18)return true;
 return pavilionBarrierAt(x,z);
}

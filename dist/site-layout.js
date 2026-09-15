// Site envelope reconstructed from the supplied 2007 aerial photographs.
// Ancillary footprints corrected against the supplied site map: the long wing
// gives 2.5401 px/m; the pool fixes orientation (map right is model negative x).
// Ground levels outside the PDF ramp remain estimates.
export const entrance={x:44,z:30.5,width:6,slide:6.7};
export const serviceHouse={x0:-57.7,x1:-51.3,z0:-10.25,z1:4.45,base:.06,eaves:3.1,rise:.75};
export const serviceShed={x0:-60.7,x1:-56.7,z0:-32.85,z1:-23.05,base:.06};
export const servicePaving=[[-58.5,5.05],[-45.6,5.05],[-45.6,-11.05],[-46.9,-11.05],[-46.9,-33.65],[-61.5,-33.65],[-61.5,-22.25],[-55.8,-22.25],[-55.8,-11.05],[-58.5,-11.05]];
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
  {name:'Cesta od brány okolo záhrady',width:5,points:sample([[48.75,30.5,level],[39,30.5,level],[16,30.5,level],[-22,30.5,level],[-37,30.5,level],[-46.5,30.5,level],[-51,27,1.35],[-51,18,.95],[-48.3,5.6,.06],[-48.6,-7.8,.06],[-49.3,-20,.06],[-50,-34,.06]])},
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
 if((z>=33&&x<49)||(x>-37&&x<39&&z<25))return null;
 let y=null;
 for(const road of siteRoads(level)){
  const p=closestRoad(x,z,road),r=road.width/2;
  if(p.distance>r&&p.distance<r+3.6){const t=clamp((p.distance-r)/3.6);y=Math.max(y??-.06,(p.height-.025)*(1-t)-.06*t)}
 }return y;
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
 const h=serviceHouse,s=serviceShed;
 if(x>h.x0-.18&&x<h.x1+.18&&z>h.z0-.18&&z<h.z1+.18)return true;
 if(near(x,z,[s.x0,s.z0],[s.x1,s.z0],.3)||near(x,z,[s.x0,s.z0],[s.x0,s.z1],.3)||near(x,z,[s.x0,s.z1],[s.x1,s.z1],.3))return true;
 for(let i=0;i<=3;i++)if(Math.hypot(x-s.x1,z-s.z0-(s.z1-s.z0)*i/3)<.3)return true;
 return false;
}

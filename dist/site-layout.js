// Site envelope reconstructed from the supplied 2007 aerial photographs.
// Horizontal extents and ground levels outside the PDF ramp are estimates.
export const entrance={x:44,z:30.5,width:6,slide:6.7};
export const serviceHouse={x0:-54,x1:-47,z0:-30,z1:-16,base:.06,eaves:3.1,rise:.75};
export const serviceShed={x0:-53.5,x1:-43,z0:-43,z1:-38,base:.06};
export const servicePaving=[[-54.8,-43.5],[-34,-43.5],[-34,-31],[-44.5,-31],[-44.5,-15],[-54.8,-15]];
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
  {name:'Cesta od brány okolo záhrady',width:5,points:sample([[48.75,30.5,level],[39,30.5,level],[16,30.5,level],[-22,30.5,level],[-37,30.5,level],[-46.5,30.5,level],[-51,27,1.35],[-51,18,.95],[-46,4,.34],[-42,-7.8,.06],[-42,-19,.06],[-42,-31,.06]])},
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
 if(inSitePolygon(x,z,servicePaving)||(x>=-42&&x<=37&&z>=-9.95&&z<=-5.65)||(x>=-37&&x<=-35&&z>=-49&&z<=-43.5))return .06;
 for(const road of siteRoads(level)){const p=closestRoad(x,z,road);if(p.distance<=road.width/2+.001)return p.height}
 return null;
}
export function siteShoulderHeight(x,z,level){
 // The existing court bank starts at z=33; never cover it with a second terrain.
 if((z>=33&&x<49)||(x>-37&&x<39&&z<25))return null;
 let y=null;
 for(const road of siteRoads(level)){
  const p=closestRoad(x,z,road),r=road.width/2;
  if(p.distance>r&&p.distance<r+3.6){const t=clamp((p.distance-r)/3.6);y=Math.max(y??-.06,p.height*(1-t)-.06*t-.025)}
 }return y;
}
export const siteBoundary=[
 {points:[[44,27.2],[44,-41],[33,-48],[-35,-48]],type:'wall'},
 {points:[[-37,-48],[-53,-48],[-58,-40],[-58,25],[-64,35],[-65,72]],type:'fence'},
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
 if(near(x,z,[s.x0,s.z0],[s.x1,s.z0],.3)||near(x,z,[s.x0,s.z0],[s.x0,s.z1],.3)||near(x,z,[s.x1,s.z0],[s.x1,s.z1],.3))return true;
 for(let i=0;i<=3;i++)if(Math.hypot(x-s.x0-(s.x1-s.x0)*i/3,z-s.z1)<.3)return true;
 return false;
}

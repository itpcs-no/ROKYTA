// New concept requested by the owner in place of the two former courts.
export const homesLevel=6.6;
export const hillsideHomes=[
 {id:1,name:'Rodinný dom 1',x0:-7,x1:9,z0:59,z1:70,garageWidth:5.4,garageDepth:6.6,garageDoorWidth:4.6,
  pool:{x0:11,x1:18,z0:54,z1:58},terrace:{x0:-9,x1:19.5,z0:52.5,z1:59.2},entryX:-4.9},
 {id:2,name:'Rodinný dom 2',x0:-46.7,x1:-33.3,z0:56.2,z1:66.2,garageWidth:4.5,garageDepth:6.2,garageDoorWidth:3.5,
  pool:{x0:-31.4,x1:-28.2,z0:50.7,z1:57.7},terrace:{x0:-48,x1:-26.7,z0:49.2,z1:56.4},entryX:-44.6}
];
for(const home of hillsideHomes){
 home.base=homesLevel;
 home.garage={x0:home.x1-home.garageWidth,x1:home.x1,z0:home.z1-home.garageDepth,z1:home.z1};
 home.garage.doorX=(home.garage.x0+home.garage.x1)/2;
 home.garage.doorZ=home.garage.z0+1.5;
 home.pool.bottom=homesLevel-1.35;home.pool.water=homesLevel-.14;
 home.poolDeck={x0:home.pool.x0-1.5,x1:home.pool.x1+1.5,z0:home.pool.z0-1.5,z1:home.pool.z1+1.5};
 home.drive={x0:home.garage.doorX-3,x1:home.garage.doorX+3,z0:home.z1-.15,z1:78.1};
}
export const inRect=(x,z,r,pad=0)=>x>=r.x0-pad&&x<=r.x1+pad&&z>=r.z0-pad&&z<=r.z1+pad;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t)};
const roadCache=new Map();
export function homeRoads(base){
 if(roadCache.has(base))return roadCache.get(base);
 const straight=31.5,radius=13.5,length=straight+radius*Math.PI/2,transition=4;
 const height=s=>{s=Math.max(0,Math.min(length,s));const rise=s<transition?s*s/(2*transition):s>length-transition?length-transition-(length-s)**2/(2*transition):s-transition/2;return base+(homesLevel-base)*rise/(length-transition)};
 const ramp=[];
 for(let i=0;i<=70;i++){const s=straight*i/70;ramp.push([37,30.5+s,height(s)])}
 for(let i=1;i<=60;i++){const angle=Math.PI/2*i/60;ramp.push([23.5+radius*Math.cos(angle),62+radius*Math.sin(angle),height(straight+radius*angle)])}
 const upper=[];for(let x=23.5;x>=-54;x-=.5)upper.push([x,75.5,homesLevel]);
 const result=[{name:'Plynulý príjazd k rodinným domom',width:5.2,points:ramp,endDirection:[-1,0]},{name:'Cesta ku garážam rodinných domov',width:5.2,points:upper}];
 for(const road of result){const pad=road.width/2+3.5;road.bounds={x0:Math.min(...road.points.map(p=>p[0]))-pad,x1:Math.max(...road.points.map(p=>p[0]))+pad,z0:Math.min(...road.points.map(p=>p[1]))-pad,z1:Math.max(...road.points.map(p=>p[1]))+pad}}
 roadCache.set(base,result);return result;
}
export function closestHomeRoad(x,z,road){
 let best={distance:Infinity,height:0};
 for(let i=1;i<road.points.length;i++){
  const a=road.points[i-1],b=road.points[i],dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz));
  const distance=Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);
  if(distance<best.distance)best={distance,height:a[2]+t*(b[2]-a[2])};
 }return best;
}
export function homeRoadHeight(x,z,base){
 for(const road of homeRoads(base)){if(!inRect(x,z,road.bounds))continue;const p=closestHomeRoad(x,z,road);if(p.distance<=road.width/2+.002)return p.height}
 return null;
}
export function homeGroundHeight(x,z,base,original){
 let y=original;
 for(const home of hillsideHomes)if(inRect(x,z,home,.3)||inRect(x,z,home.terrace,.2)||inRect(x,z,home.poolDeck,.2)||inRect(x,z,home.drive,.2))y=homesLevel-.05;
 let nearest=null;
 for(const road of homeRoads(base)){
  if(!inRect(x,z,road.bounds))continue;
  const p=closestHomeRoad(x,z,road);if(!nearest||p.distance<nearest.distance)nearest={...p,radius:road.width/2};
 }
 if(nearest){const weight=1-smooth((nearest.distance-nearest.radius-.6)/3.2);if(weight>0)y=y*(1-weight)+(nearest.height-.07)*weight}
 return y;
}
export function homeWalkingHeight(x,z,base){
 const road=homeRoadHeight(x,z,base);if(road!==null)return road;
 for(const home of hillsideHomes)if(inRect(x,z,home)||inRect(x,z,home.terrace)||inRect(x,z,home.poolDeck)||inRect(x,z,home.drive)||(Math.abs(x-home.entryX)<=.75&&z>=48.5&&z<=home.terrace.z0))return homesLevel;
 return null;
}
export function homeAt(x,z,pad=0){return hillsideHomes.find(h=>inRect(x,z,h,pad))}
function near(x,z,ax,az,bx,bz,r=.22){const dx=bx-ax,dz=bz-az,t=clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz));return Math.hypot(x-ax-t*dx,z-az-t*dz)<r}
export function homeBarrierAt(x,z,open){
 for(const h of hillsideHomes){
  if(inRect(x,z,h.pool,.16))return true;
  if(!inRect(x,z,h,.4))continue;
  const g=h.garage;
  if(near(x,z,h.x0,h.z0,h.x0,h.z1)||near(x,z,h.x1,h.z0,h.x1,h.z1))return true;
  if(Math.abs(z-h.z0)<.22&&x>h.x0-.2&&x<h.x1+.2&&(!open||Math.abs(x-h.entryX)>.55))return true;
  if(Math.abs(z-h.z1)<.22&&x>h.x0-.2&&x<h.x1+.2&&(!open||Math.abs(x-g.doorX)>h.garageDoorWidth/2-.2))return true;
  if(near(x,z,g.x0,g.z0,g.x1,g.z0))return true;
  if(Math.abs(x-g.x0)<.22&&z>=g.z0-.2&&z<=g.z1+.2&&(!open||Math.abs(z-g.doorZ)>.42))return true;
 }
 return false;
}

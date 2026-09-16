// Continuation of the western parking row around the bend marked by the owner.
// The road, parking structure and hillside share the same arc and elevations.
export const curvedParking={cx:-47.5,cz:24.5,roadRadius:6,frontRadius:8.5,depth:7.5,outerRadius:20,
 endZ:11,terrainZ0:6.5,arcCount:4,tailCount:4,clearance:2.6,roof:.28,soil:.22};
const p=curvedParking,clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const t=clamp(x);return t*t*(3-2*t)};
export const curvedArcLength=p.frontRadius*Math.PI/2;
export const curvedLength=curvedArcLength+p.cz-p.endZ;
export function curvedFrame(s){
 s=Math.max(0,Math.min(curvedLength,s));
 if(s<=curvedArcLength){const a=s/p.frontRadius;return {x:p.cx-p.frontRadius*Math.sin(a),z:p.cz+p.frontRadius*Math.cos(a),nx:-Math.sin(a),nz:Math.cos(a),angle:-a,s}}
 return {x:p.cx-p.frontRadius,z:p.cz-(s-curvedArcLength),nx:-1,nz:0,angle:-Math.PI/2,s};
}
export function curvedFloor(s,base){return base+(.48-base)*smooth((s-curvedArcLength)/(p.cz-p.endZ))}
export function curvedAt(x,z,extra=0){
 if(z>=p.cz&&x<=p.cx+.00001){const dx=p.cx-x,dz=z-p.cz,r=Math.hypot(dx,dz),a=Math.atan2(dx,dz);if(r>=p.frontRadius-extra&&r<=p.frontRadius+p.depth+extra&&a>=0&&a<=Math.PI/2)return {s:a*p.frontRadius,depth:r-p.frontRadius}}
 if(z<p.cz&&z>=p.endZ-extra&&x<=p.cx-p.frontRadius+extra&&x>=p.cx-p.frontRadius-p.depth-extra)return {s:curvedArcLength+p.cz-z,depth:p.cx-p.frontRadius-x};
 return null;
}
export const curvedBayCuts=[...Array.from({length:p.arcCount+1},(_,i)=>curvedArcLength*i/p.arcCount),...Array.from({length:p.tailCount},(_,i)=>curvedArcLength+(p.cz-p.endZ)*(i+1)/p.tailCount)];
export const curvedParkingBays=curvedBayCuts.slice(1).map((end,i)=>{const start=curvedBayCuts[i],s=(start+end)/2,f=curvedFrame(s);return {id:23+i,start,end,s,x:f.x+f.nx*4,z:f.z+f.nz*4,angle:f.angle,width:end-start,arc:s<curvedArcLength}});
export const curvedSamples=[...new Set([...Array.from({length:65},(_,i)=>curvedArcLength*i/64),...Array.from({length:41},(_,i)=>curvedArcLength+(p.cz-p.endZ)*i/40),...curvedBayCuts])].sort((a,b)=>a-b);
export function curvedOutline(depth=p.depth,frontOffset=0){const front=curvedSamples.map(s=>{const f=curvedFrame(s);return [f.x+f.nx*frontOffset,f.z+f.nz*frontOffset]}),back=curvedSamples.toReversed().map(s=>{const f=curvedFrame(s);return [f.x+f.nx*depth,f.z+f.nz*depth]});return [...front,...back]}
export function curvedRoadPoints(base){
 const points=[];
 for(let i=0;i<=64;i++){const a=Math.PI/2*i/64;points.push([p.cx-p.roadRadius*Math.sin(a),p.cz+p.roadRadius*Math.cos(a),base])}
 for(let i=1;i<=40;i++){const t=i/40,z=p.cz+(p.endZ-p.cz)*t;points.push([p.cx-p.roadRadius,z,curvedFloor(curvedArcLength+(p.cz-z),base)])}
 // Smoothly descend to the existing service yard, with vertical tangents at
 // each end of this short S-bend and no change to the yard's level.
 for(let i=1;i<=32;i++){const t=i/32,u=1-t,x=u*u*u*(p.cx-p.roadRadius)+3*u*u*t*(p.cx-p.roadRadius)+3*u*t*t*(-48.3)+t*t*t*(-48.3),z=u*u*u*p.endZ+3*u*u*t*8+3*u*t*t*8.6+t*t*t*5.6;points.push([x,z,.48+(.06-.48)*smooth(t)])}
 return points;
}
export function curvedBankHeight(x,z,base,original=-.06){
 let s,depth,tailWeight=1;
 if(x>p.cx||z<p.terrainZ0)return null;
 if(z>=p.cz){const r=Math.hypot(p.cx-x,z-p.cz);depth=r-p.frontRadius;s=Math.atan2(p.cx-x,z-p.cz)*p.frontRadius}
 else{depth=p.cx-p.frontRadius-x;s=curvedArcLength+p.cz-Math.max(p.endZ,z);tailWeight=smooth((z-p.terrainZ0)/(p.endZ-p.terrainZ0))}
 if(depth<0||depth>p.outerRadius-p.frontRadius||tailWeight<=0)return null;
 const weight=(1-smooth((depth-p.depth)/(p.outerRadius-p.frontRadius-p.depth)))*tailWeight;
 return original+Math.max(0,curvedFloor(s,base)+p.clearance+p.roof+p.soil-original)*weight;
}
function near(x,z,a,b,r){const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz));return Math.hypot(x-a.x-t*dx,z-a.z-t*dz)<r}
export function curvedParkingBarrierAt(x,z,foot,base){
 if(z>=p.terrainZ0&&z<p.endZ&&Math.abs(x-(p.cx-p.frontRadius))<.27)return true;
 const hit=curvedAt(x,z,.4);if(!hit)return false;
 const floor=curvedFloor(hit.s,base),high=foot>floor+p.clearance+.1;
 if(high)return Math.abs(hit.depth-.18)<.22;
 if(Math.abs(hit.depth-p.depth)<.3)return true;
 for(const s of [0,curvedLength]){const f=curvedFrame(s);if(near(x,z,f,{x:f.x+f.nx*p.depth,z:f.z+f.nz*p.depth},.3))return true}
 for(const s of curvedBayCuts){const f=curvedFrame(s);if(Math.hypot(x-f.x,z-f.z)<.32)return true}
 for(const b of curvedParkingBays){const f=curvedFrame(b.s),a={x:f.x+f.nx*6.7+f.nz*.9,z:f.z+f.nz*6.7-f.nx*.9},c={x:f.x+f.nx*6.7-f.nz*.9,z:f.z+f.nz*6.7+f.nx*.9};if(near(x,z,a,c,.2))return true}
 return false;
}

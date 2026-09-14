// User-requested concept: recessed parking across the entire court frontage.
// These new parking/storage volumes are not part of the supplied PDF proposal.
export const hillsideParking={front:33,back:40.5,clearance:2.6,roof:.28,soil:.22,post:.26,
 blocks:[{x0:-47.5,x1:-.3,count:14},{x0:2.3,x1:29,count:8}]};
export const parkingBays=hillsideParking.blocks.flatMap((b,block)=>Array.from({length:b.count},(_,i)=>({
 id:hillsideParking.blocks.slice(0,block).reduce((sum,row)=>sum+row.count,0)+i+1,x:b.x0+(i+.5)*(b.x1-b.x0)/b.count,z:37,width:(b.x1-b.x0)/b.count
})));
export const cellars={x0:-35.5,x1:-10.5,front:-4.7,back:1.4,floor:.06,ceiling:2.24,count:8,pitch:3.125,doorWidth:.96,doorHeight:2.02};
export const cellarDoors=Array.from({length:cellars.count},(_,i)=>({x:cellars.x0+(i+.5)*cellars.pitch-cellars.doorWidth/2,z:cellars.front,width:cellars.doorWidth,id:i+1}));
const smooth=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t)};
export function parkingBlockAt(x,z){return z>=hillsideParking.front&&z<=hillsideParking.back?hillsideParking.blocks.find(b=>x>=b.x0&&x<=b.x1):undefined}
export function cellarAt(x,z){return x>=cellars.x0&&x<=cellars.x1&&z>=cellars.front&&z<=cellars.back}
export function parkingRoofLevel(base){const p=hillsideParking;return base+p.clearance+p.roof+p.soil}
export function raisedParkingTerrain(x,z,base,original){
 const p=hillsideParking;if(z<p.front||z>p.back+4)return original;
 let y=original;
 for(const b of p.blocks){const outside=Math.max(b.x0-x,x-b.x1,0),weight=(1-smooth(outside/3.5))*(1-smooth((z-p.back)/4));
  y=Math.max(y,original+Math.max(0,parkingRoofLevel(base)-original)*weight)}
 return y;
}
// Existing front retaining wall, with vehicle openings and stair access removed.
export const courtFrontWalls=[[-47.5,-.3],[2.3,29]].flatMap(([a,b])=>{
 const parts=[];let start=a;
 for(const p of hillsideParking.blocks){if(p.x1<=a||p.x0>=b)continue;if(p.x0>start)parts.push([start,p.x0]);start=Math.max(start,p.x1)}
 if(start<b)parts.push([start,b]);return parts;
});
function near(x,z,ax,az,bx,bz,r){const dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));return Math.hypot(x-ax-t*dx,z-az-t*dz)<r}
export function parkingBarrierAt(x,z,footHeight,base){
 const p=hillsideParking;
 for(const b of p.blocks){
  if(footHeight>base+p.clearance+.1){if(near(x,z,b.x0,p.front+.18,b.x1,p.front+.18,.22))return true;continue}
  for(const wallX of [b.x0,b.x1])if(near(x,z,wallX,p.front,wallX,p.back,.32))return true;
  if(near(x,z,b.x0,p.back,b.x1,p.back,.32))return true;
  for(let i=0;i<=b.count;i++)if(Math.hypot(x-b.x0-(b.x1-b.x0)*i/b.count,z-p.front)<.32)return true;
  // A low rear wheel stop leaves a pedestrian passage behind each vehicle.
  for(const bay of parkingBays.filter(bay=>bay.x>b.x0&&bay.x<b.x1))if(Math.abs(x-bay.x)<1.0&&Math.abs(z-39.7)<.22)return true;
 }
 return false;
}
export function cellarBarrierAt(x,z,footHeight,open){
 const c=cellars;if(footHeight>c.ceiling+.05)return false;
 if(near(x,z,c.x0,c.back,c.x1,c.back,.3))return true;
 for(let i=0;i<=c.count;i++)if(near(x,z,c.x0+i*c.pitch,c.front,c.x0+i*c.pitch,c.back,.23))return true;
 if(Math.abs(z-c.front)<.23&&x>=c.x0-.18&&x<=c.x1+.18&&!cellarDoors.some(d=>x>d.x+.18&&x<d.x+d.width-.18))return true;
 for(const d of cellarDoors)if(near(x,z,d.x,d.z,d.x+(open?0:d.width),d.z+(open?d.width:0),.16))return true;
 return false;
}

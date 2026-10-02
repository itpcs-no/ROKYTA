// New outdoor wellness concept, on the lawn between the long wing and service yard.
// Levels match the existing pedestrian paving. Dimensions are design choices.
export const wellnessLevel=.06;
// The terrace now runs to the boundary: the 20 m lap pool ends 1.6 m before the wall.
// A short paved link at x -30.4..-28.85 joins the terrace to the indoor wellness door.
export const wellnessOutline=[[-43.9,-47.4],[-30.9,-47.4],[-30.4,-46.9],[-30.4,-17.95],[-28.85,-17.95],[-28.85,-15.75],[-30.4,-15.75],[-30.4,-12.5],[-30.9,-12],[-39.3,-12],[-39.3,-9.95],[-41.5,-9.95],[-41.5,-12],[-43.9,-12],[-44.4,-12.5],[-44.4,-27.8],[-46.9,-27.8],[-46.9,-30],[-44.4,-30],[-44.4,-46.9]];
export const wellnessBasins=[
 {id:'swimming',name:'Vonkajší plavecký bazén 20 × 4 m',x0:-39.4,x1:-35.4,z0:-45.8,z1:-25.8,bottom:-1.5,water:-.10,rim:.32},
 {id:'spa',name:'Zapustená vírivka',x:-40.8,z:-14.85,radius:1.55,bottom:-1.02,water:-.10,rim:.32},
 {id:'plunge',name:'Ochladzovací bazén',x0:-35.8,x1:-33.6,z0:-16.8,z1:-14,bottom:-1.24,water:-.10,rim:.32}
];
export const wellnessLoungers=[-43.4,-40.4,-37.4,-34.4,-31.4].map(z=>({x:-32.35,z}));
export const wellnessPergola={x0:-43.6,x1:-40.6,z0:-33.6,z1:-26.6};
export const wellnessPosts=[wellnessPergola.x0,wellnessPergola.x1].flatMap(x=>[wellnessPergola.z0,wellnessPergola.z1].map(z=>({x,z})));
export const wellnessFurniture=[
 ...wellnessLoungers.map(({x,z})=>({x0:x-1.04,x1:x+1.04,z0:z-.39,z1:z+.39})),
 {x0:-43.55,x1:-42.6,z0:-32.7,z1:-27.5},
 {x0:-42.25,x1:-41.5,z0:-31,z1:-29.2}
];
export const wellnessBeds=[
 {x0:-45.35,x1:-44.55,z0:-26.8,z1:-13},
 {x0:-43.6,x1:-41.2,z0:-46.9,z1:-45.9},
 {x0:-29.95,x1:-29.2,z0:-44.4,z1:-23.6}
];
export const wellnessTrees=[{x:-45.6,z:-36.5},{x:-29.6,z:-46.4}];
export const wellnessLights=[[-43.95,-38],[-43.95,-19],[-30.85,-28.5],[-30.85,-15]];
export const wellnessEntry={x:-40.4,z:-10.6};
export const wellnessTarget={x:-37.2,y:.3,z:-22.8};
export function inWellnessPolygon(x,z,points=wellnessOutline){let result=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
 const a=points[i],b=points[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])result=!result;
}return result}
export function basinOutline(b,expand=0){
 if(b.radius)return Array.from({length:64},(_,i)=>{const a=i*Math.PI/32;return [b.x+Math.cos(a)*(b.radius+expand),b.z+Math.sin(a)*(b.radius+expand)]});
 return [[b.x0-expand,b.z0-expand],[b.x1+expand,b.z0-expand],[b.x1+expand,b.z1+expand],[b.x0-expand,b.z1+expand]];
}
export function basinContains(b,x,z,margin=0){return b.radius?Math.hypot(x-b.x,z-b.z)<b.radius+margin:x>b.x0-margin&&x<b.x1+margin&&z>b.z0-margin&&z<b.z1+margin}
// Telescopic enclosure: five aluminium arches with polycarbonate skin on rails.
// Closed, it covers the whole basin; open, the segments nest over the north end.
export const poolEnclosure={x:-37.4,z0:-46.25,z1:-25.35,segments:5,length:4.35,width0:5.5,widthStep:.14,height0:2.2,heightStep:.07,overlap:.25,open:0};
export function enclosureSegments(open=poolEnclosure.open){
 const e=poolEnclosure,pitch=e.length-e.overlap;
 return Array.from({length:e.segments},(_,i)=>{const closed=e.z0+i*pitch,stacked=e.z0+i*.12,z0=closed+(stacked-closed)*open;return {i,z0,z1:z0+e.length,width:e.width0-i*e.widthStep,height:e.height0-i*e.heightStep}});
}
export function enclosureBarrierAt(x,z){
 const e=poolEnclosure,segs=enclosureSegments(),half=e.width0/2;
 const zMin=segs[0].z0,zMax=Math.max(...segs.map(s=>s.z1));
 if(z<zMin-.15||z>zMax+.15)return false;
 return Math.abs(Math.abs(x-e.x)-half)<.16;
}
export function wellnessBarrierAt(x,z){
 if(enclosureBarrierAt(x,z))return true;
 if(wellnessBasins.some(b=>basinContains(b,x,z,.2)))return true;
 if(wellnessFurniture.some(r=>x>r.x0-.18&&x<r.x1+.18&&z>r.z0-.18&&z<r.z1+.18))return true;
 if(wellnessPosts.some(p=>Math.hypot(x-p.x,z-p.z)<.3))return true;
 if(wellnessLights.some(p=>Math.hypot(x-p[0],z-p[1])<.22))return true;
 return wellnessTrees.some(p=>Math.hypot(x-p.x,z-p.z)<.35);
}
export function wellnessWalkingHeight(x,z){return inWellnessPolygon(x,z)?wellnessLevel:null}
export function wellnessCeiling(x,z){const p=wellnessPergola;return x>p.x0-.22&&x<p.x1+.22&&z>p.z0-.25&&z<p.z1+.25?2.49:null}

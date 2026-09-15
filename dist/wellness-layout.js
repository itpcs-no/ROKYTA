// New outdoor wellness concept, on the lawn between the long wing and service yard.
// Levels match the existing pedestrian paving. Dimensions are design choices.
export const wellnessLevel=.06;
export const wellnessOutline=[[-43.9,-34],[-30.9,-34],[-30.4,-33.5],[-30.4,-12.5],[-30.9,-12],[-39.3,-12],[-39.3,-9.95],[-41.5,-9.95],[-41.5,-12],[-43.9,-12],[-44.4,-12.5],[-44.4,-27.8],[-46.9,-27.8],[-46.9,-30],[-44.4,-30],[-44.4,-33.5]];
export const wellnessBasins=[
 {id:'swimming',name:'Vonkajší bazén',x0:-39,x1:-34,z0:-28.5,z1:-18.5,bottom:-1.5,water:-.10,rim:.32},
 {id:'spa',name:'Zapustená vírivka',x:-40.8,z:-14.85,radius:1.55,bottom:-1.02,water:-.10,rim:.32},
 {id:'plunge',name:'Ochladzovací bazén',x0:-35.8,x1:-33.6,z0:-16.8,z1:-14,bottom:-1.24,water:-.10,rim:.32}
];
export const wellnessLoungers=[-26.8,-23.2,-19.6].map(z=>({x:-32,z}));
export const wellnessPergola={x0:-43,x1:-36,z0:-33.2,z1:-30.2};
export const wellnessPosts=[wellnessPergola.x0,wellnessPergola.x1].flatMap(x=>[wellnessPergola.z0,wellnessPergola.z1].map(z=>({x,z})));
export const wellnessFurniture=[
 ...wellnessLoungers.map(({x,z})=>({x0:x-1.04,x1:x+1.04,z0:z-.39,z1:z+.39})),
 {x0:-42.3,x1:-37.1,z0:-32.92,z1:-31.95},
 {x0:-40.6,x1:-38.8,z0:-31.55,z1:-30.8}
];
export const wellnessBeds=[
 {x0:-45.35,x1:-44.55,z0:-26.8,z1:-13},
 {x0:-43.4,x1:-31.5,z0:-35.3,z1:-34.4},
 {x0:-29.95,x1:-29.2,z0:-32.4,z1:-23.6}
];
export const wellnessTrees=[{x:-44.9,z:-34.9},{x:-29.6,z:-34.8}];
export const wellnessLights=[[-43.95,-26],[-43.95,-19],[-30.85,-28.5],[-30.85,-15]];
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
export function wellnessBarrierAt(x,z){
 if(wellnessBasins.some(b=>basinContains(b,x,z,.2)))return true;
 if(wellnessFurniture.some(r=>x>r.x0-.18&&x<r.x1+.18&&z>r.z0-.18&&z<r.z1+.18))return true;
 if(wellnessPosts.some(p=>Math.hypot(x-p.x,z-p.z)<.3))return true;
 if(wellnessLights.some(p=>Math.hypot(x-p[0],z-p[1])<.22))return true;
 return wellnessTrees.some(p=>Math.hypot(x-p.x,z-p.z)<.35);
}
export function wellnessWalkingHeight(x,z){return inWellnessPolygon(x,z)?wellnessLevel:null}
export function wellnessCeiling(x,z){const p=wellnessPergola;return x>p.x0-.22&&x<p.x1+.22&&z>p.z0-.25&&z<p.z1+.25?2.49:null}

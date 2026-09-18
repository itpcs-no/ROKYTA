import * as T from 'three';
import {garage} from './project-geometry.js';
import {surface} from './surface-materials.js';

// Owner-requested conversion of the attached garage, independent of the PDF.
// The original footprint, floor elevation, roof and connection are retained.
export const caretaker={...garage,entry:{x:garage.x1-.1875,z:18.15},connection:{x:-3.27627,z:15.691466},partitionX:-8.85};
const rect=(x0,z0,x1,z1)=>[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];
export function outsideRectangle(poly,r){
 let remaining=poly;const result=[];
 for(const [axis,limit,sign] of [[0,r.x0,1],[0,r.x1,-1],[1,r.z0,1],[1,r.z1,-1]]){
  const inside=[],outside=[];
  for(let i=0;i<remaining.length;i++){
   const a=remaining[i],b=remaining[(i+1)%remaining.length],da=(a[axis]-limit)*sign,db=(b[axis]-limit)*sign;
   (da>=0?inside:outside).push(a);
   if((da>=0)!==(db>=0)){const t=da/(da-db),p=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])];inside.push(p);outside.push(p)}
  }
  if(outside.length>=3)result.push(outside);remaining=inside;if(!remaining.length)break;
 }
 return result.filter(p=>Math.abs(p.reduce((a,v,i)=>{const q=p[(i+1)%p.length];return a+v[0]*q[1]-q[0]*v[1]},0))>1e-7);
}
export function applyCaretakerLayout(data){
 const d=data[1],c=caretaker,t=.375,mask={x0:c.x0-.005,x1:c.x1+.002,z0:c.z0-.002,z1:c.z1+.005};
 d.walls=d.walls.flatMap(p=>outsideRectangle(p,mask));
 d.windows=d.windows.filter(([x,z,dx,dz])=>!(x+dx>mask.x0&&x<mask.x1&&z+dz>mask.z0&&z<mask.z1));
 d.doors=d.doors.filter(a=>!(a.hinge[0]>=mask.x0&&a.hinge[0]<=mask.x1&&a.hinge[1]>=mask.z0&&a.hinge[1]<=mask.z1));
 function wall(axis,fixed,a,b,openings=[],thickness=t){
  let start=a;
  for(const [lo,hi] of [...openings,[b,b]]){
   if(lo>start+.001)d.walls.push(axis==='x'?rect(start,fixed-thickness/2,lo,fixed+thickness/2):rect(fixed-thickness/2,start,fixed+thickness/2,lo));
   start=hi;
  }
 }
 function door(name,hinge,closed,open){d.doors.push({name,hinge,closed,open,width:Math.hypot(closed[0]-hinge[0],closed[1]-hinge[1]),height:2.18,heightFromDimension:false})}
 const west=c.x0+t/2,east=c.x1-t/2,south=c.z0+t/2,north=c.z1-t/2;
 // Connection remains in the same place as the original door into the main wing.
 wall('x',south,c.x0,c.x1,[[-3.76627,-2.78627]]);
 door('Dom správcu · priechod do hlavnej budovy',[-3.72627,south],[-2.82627,south],[-3.72627,south-.9]);
 wall('x',north,c.x0,c.x1,[[-11.7,-9.7],[-7.65,-4.65]]);
 d.windows.push([-11.7,north-t/2,2,t],[-7.65,north-t/2,3,t]);
 wall('z',west,south+t/2,north-t/2,[[16.65,17.65],[20.15,22.4]]);
 d.windows.push([west-t/2,16.65,t,1,1.35,.75],[west-t/2,20.15,t,2.25]);
 wall('z',east,south+t/2,north-t/2,[[17.55,18.75],[20.0,22.8]]);
 door('Dom správcu · vstup',[east,18.70],[east,17.60],[east-1.10,18.70]);
 d.windows.push([east-t/2,20,t,2.8]);
 wall('z',c.partitionX,south+t/2,north-t/2,[[17.15,18.13],[20.0,20.98]],.15);
 wall('x',18.65,west+t/2,c.partitionX,[],.15);
 door('Dom správcu · kúpeľňa',[c.partitionX,17.19],[c.partitionX,18.09],[c.partitionX-.9,17.19]);
 door('Dom správcu · spálňa',[c.partitionX,20.04],[c.partitionX,20.94],[c.partitionX-.9,20.04]);
}

export const caretakerFurniture=[
 {x0:-12.25,x1:-10.25,z0:20.6,z1:22.7},
 {x0:-12.65,x1:-10.1,z0:19.05,z1:19.65},
 {x0:-8.5,x1:-5.0,z0:15.92,z1:16.57},
 {x0:-7.75,x1:-5.1,z0:22.05,z1:23.0},
 {x0:-7.15,x1:-6.35,z0:20.65,z1:21.35},
 {x0:-12.65,x1:-11.25,z0:15.95,z1:17.35},
 {x0:-9.85,x1:-9.15,z0:15.95,z1:16.65},
 {x0:-12.6,x1:-11.0,z0:17.85,z1:18.45}
];
export function caretakerBarrierAt(x,z,y){
 const c=caretaker;if(y<c.floor-.1||y>=c.floor+2)return false;
 // Glass remains a physical boundary even though the floor plan has an opening.
 if(z>c.z0&&z<c.z1&&Math.abs(x-(c.x0+.1875))<.35)return true;
 if(x>c.x0&&x<c.x1&&Math.abs(z-(c.z1-.1875))<.35)return true;
 if(z>c.z0&&z<c.z1&&Math.abs(x-(c.x1-.1875))<.35&&(z<17.75||z>18.55))return true;
 return caretakerFurniture.some(r=>x>r.x0-.16&&x<r.x1+.16&&z>r.z0-.16&&z<r.z1+.16);
}
export function buildCaretakerInterior(){
 const g=new T.Group();g.name='Dom správcu · bývanie';
 const wood=surface('wood'),light=new T.MeshStandardMaterial({color:0xe9e5dc,roughness:.85}),fabric=new T.MeshStandardMaterial({color:0x48616a,roughness:.95}),dark=new T.MeshStandardMaterial({color:0x293133,roughness:.35}),white=new T.MeshStandardMaterial({color:0xf3f3ed,roughness:.24});
 function box(name,x,y,z,w,h,d,m=wood){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.name=name;o.castShadow=true;o.receiveShadow=true;g.add(o);return o}
 box('Spálňa · posteľ',-11.25,.22,21.65,2,.44,2.1);box('Matrac',-11.25,.52,21.65,1.94,.18,2.04,light);box('Prikrývka',-11.25,.635,21.9,1.92,.05,1.5,fabric);
 for(const x of [-11.7,-10.8])box('Vankúš',x,.66,20.96,.72,.14,.4,light);
 box('Čelo postele',-11.25,.61,20.57,2.06,1.1,.12);box('Šatníková skriňa',-11.375,1.1,19.35,2.55,2.2,.6,light);
 box('Kuchyňa',-6.75,.43,16.245,3.5,.86,.65,light);box('Pracovná doska',-6.75,.89,16.245,3.55,.06,.7,wood);
 box('Drez',-7.8,.928,16.24,.55,.022,.43,dark);box('Varná doska',-5.8,.928,16.24,.58,.022,.48,dark);
 box('Pohovka',-6.425,.37,22.525,2.65,.62,.95,fabric);box('Operadlo pohovky',-6.425,.81,22.93,2.65,.44,.16,fabric);
 for(const x of [-7.65,-5.2])box('Opierka pohovky',x,.6,22.5,.2,.55,.95,fabric);
 box('Konferenčný stolík',-6.75,.38,21,.8,.07,.7);box('Podnož stolíka',-6.75,.18,21,.1,.36,.1,dark);
 box('Sprchová vanička',-11.95,.055,16.65,1.4,.11,1.4,white);box('Sprchový panel',-12.58,1.15,16.65,.08,1.9,.35,dark);
 box('WC',-9.5,.25,16.3,.47,.5,.63,white);box('Nádržka WC',-9.5,.61,16.03,.48,.52,.17,white);
 box('Kúpeľňová skrinka',-11.8,.42,18.15,1.6,.84,.6);box('Umývadlo',-11.8,.87,18.15,1.64,.08,.64,white);
 g.userData.rooms=['Obývacia izba s kuchyňou','Spálňa','Kúpeľňa'];return g;
}

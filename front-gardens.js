import * as T from 'three';
import {surface} from './surface-materials.js';
import {createPlanting} from './planting.js';

// Private front gardens for every ground-floor flat facing north, each the full
// width of its flat and 5 m deep, so all end on one line 18.4 m from the wall.
const edge=-24.63;
export const frontGardens=[
 {name:'Predzáhradka bytu 1.02 (pri fitness)',x0:-19.5,x1:-4.95,depth:5},
 {name:'Predzáhradka apartmánu 1.03',x0:5.0,x1:12.6,depth:5},
 {name:'Predzáhradka apartmánu 1.04',x0:12.7,x1:20.5,depth:5},
 {name:'Predzáhradka apartmánu 1.05',x0:20.6,x1:28.6,depth:5}
].map(g=>({...g,z0:edge-g.depth,z1:edge,gate:(g.x0+g.x1)/2}));
const hedgeWidth=.45,gateWidth=1.0;
function hedges(g){
 const list=[{x0:g.x0,x1:g.x0+hedgeWidth,z0:g.z0,z1:g.z1},{x0:g.x1-hedgeWidth,x1:g.x1,z0:g.z0,z1:g.z1}];
 list.push({x0:g.x0,x1:g.gate-gateWidth/2,z0:g.z0,z1:g.z0+hedgeWidth},{x0:g.gate+gateWidth/2,x1:g.x1,z0:g.z0,z1:g.z0+hedgeWidth});
 return list;
}
export const gardenHedges=frontGardens.flatMap(hedges);
export const gardenFurniture=[];
export function frontGardenBarrierAt(x,z){
 return gardenHedges.some(r=>x>r.x0-.12&&x<r.x1+.12&&z>r.z0-.12&&z<r.z1+.12)||gardenFurniture.some(r=>x>r[0]-.12&&x<r[2]+.12&&z>r[1]-.12&&z<r[3]+.12);
}
export function buildFrontGardens(){
 const root=new T.Group();root.name='Predzáhradky bytov na prízemí';gardenFurniture.length=0;
 const deck=surface('wood').clone();deck.color.set(0xa98463);
 const hedge=new T.MeshStandardMaterial({color:0x3f5f31,roughness:.95});
 const hedgeDark=new T.MeshStandardMaterial({color:0x34522a,roughness:.97});
 const metal=new T.MeshStandardMaterial({color:0x343b3d,metalness:.6,roughness:.4});
 const teak=surface('wood').clone();teak.color.set(0x9c7650);
 const cushion=new T.MeshStandardMaterial({color:0xd9d2c0,roughness:.95});
 const pot=new T.MeshStandardMaterial({color:0x8d8a83,roughness:.8});
 const box=(name,x,y,z,sx,sy,sz,m,solid=false)=>{const o=new T.Mesh(new T.BoxGeometry(sx,sy,sz),m);o.position.set(x,y,z);o.name=name;o.castShadow=true;o.receiveShadow=true;root.add(o);if(solid)gardenFurniture.push([x-sx/2,z-sz/2,x+sx/2,z+sz/2]);return o};
 const planting=createPlanting();
 for(const g of frontGardens){
  const terraceDepth=Math.min(2.4,g.depth-1.2),cx=(g.x0+g.x1)/2;
  box(g.name+' · drevená terasa',cx,.045,g.z1-terraceDepth/2,g.x1-g.x0-2*hedgeWidth,.05,terraceDepth,deck);
  for(const r of hedges(g)){const sx=r.x1-r.x0,sz=r.z1-r.z0,o=box(g.name+' · živý plot',(r.x0+r.x1)/2,.48,(r.z0+r.z1)/2,sx,.95,sz,(Math.round(r.x0*3)%2)?hedge:hedgeDark);o.geometry=new T.BoxGeometry(sx,.95,sz,Math.max(1,Math.round(sx*2)),2,Math.max(1,Math.round(sz*2)));}
  // Low steel wicket in the hedge gap.
  box(g.name+' · bránka',g.gate,.5,g.z0+hedgeWidth/2,gateWidth-.08,.9,.03,metal);
  for(const sx of [-1,1])box(g.name+' · stĺpik bránky',g.gate+sx*gateWidth/2,.52,g.z0+hedgeWidth/2,.06,1.04,.06,metal);
  // Table with four chairs on the terrace, two planters and a small tree.
  const tx=g.x0+1.9,tz=g.z1-terraceDepth/2;
  box('Záhradný stôl',tx,.73,tz,1.2,.04,.8,teak,true);for(const [dx,dz] of [[-.52,-.32],[.52,-.32],[-.52,.32],[.52,.32]])box('Noha stola',tx+dx,.36,tz+dz,.05,.7,.05,metal);
  for(const dx of [-.42,.42])for(const dz of [-.68,.68]){box('Záhradná stolička',tx+dx,.45,tz+dz,.44,.05,.44,teak);box('Podsedák',tx+dx,.49,tz+dz,.4,.04,.4,cushion);box('Operadlo',tx+dx,.75,tz+dz+Math.sign(dz)*.2,.42,.5,.04,teak)}
  for(const x of [g.x1-1.2,g.x1-2.2]){box('Kvetináč',x,.3,g.z1-.5,.5,.6,.5,pot,true);planting.shrub(x,g.z1-.5,.6,.38)}
  planting.tree(g.x1-1.4,g.z0+1.4,.05,.42,true);
  for(let x=g.x0+.9;x<g.x1-.6;x+=.8)planting.tuft(x,g.z0+.75,.05,.3);
 }
 root.add(planting.finish());
 return root;
}

// Three central entrances, all into the communal hall core with the stair and
// lift: A from the north path, B and C from the walkways either side of hall 1.02.
export const centralEntrances=[
 {id:'A',name:'Vstup A · sever',x:-.35,z:-21.85,out:[0,-1],width:3.2},
 {id:'B',name:'Vstup B · západ',x:-4.78,z:-6.46,out:[-1,0],width:2.6},
 {id:'C',name:'Vstup C · východ',x:4.87,z:-3.4,out:[1,0],width:2.6}
];
export function buildEntrances(){
 const root=new T.Group();root.name='Centrálne vstupy';
 const steel=new T.MeshStandardMaterial({color:0x2d3336,metalness:.7,roughness:.35});
 const glass=new T.MeshPhysicalMaterial({color:0xdfeef2,transparent:true,opacity:.35,roughness:.05});
 const mat=new T.MeshStandardMaterial({color:0x3b3f40,roughness:.95});
 for(const e of centralEntrances){
  const g=new T.Group();g.name=e.name;root.add(g);const [ox,oz]=e.out,along=ox===0;
  const depth=1.6,cx=e.x+ox*depth/2,cz=e.z+oz*depth/2,sx=along?e.width:depth,sz=along?depth:e.width;
  const roof=new T.Mesh(new T.BoxGeometry(sx,.03,sz),glass);roof.position.set(cx,2.7,cz);g.add(roof);
  for(const s of [-1,1]){const b=new T.Mesh(new T.BoxGeometry(along?.06:depth,.12,along?depth:.06),steel);b.position.set(along?cx+s*(e.width/2-.05):cx,2.66,along?cz:cz+s*(e.width/2-.05));b.castShadow=true;g.add(b)}
  const m=new T.Mesh(new T.BoxGeometry(along?2:1.2,.02,along?1.2:2),mat);m.position.set(e.x+ox*.7,.07,e.z+oz*.7);g.add(m);
  // Letter sign beside the door.
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  if(x){x.fillStyle='#22313a';x.fillRect(0,0,128,128);x.fillStyle='#f4efe4';x.font='bold 92px system-ui,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(e.id,64,70)}
  const sign=new T.Mesh(new T.PlaneGeometry(.42,.42),new T.MeshStandardMaterial({map:new T.CanvasTexture(c),roughness:.6}));
  sign.position.set(e.x+ox*.02+(along?e.width/2+.35:0),2.1,e.z+oz*.02+(along?0:e.width/2+.35));sign.rotation.y=Math.atan2(ox,oz);g.add(sign);
 }
 return root;
}

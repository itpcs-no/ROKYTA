import * as T from 'three';
import {surface} from './surface-materials.js';
import {createPlanting} from './planting.js';

// Private front gardens for the ground-floor flats on the north side of the long
// wing, each the full width of its flat. Depth follows the location: 3.5 m next
// to the entrance plaza, 4 m in the middle, 5 m at the quiet ends.
const edge=-24.63;
export const frontGardens=[
 {name:'Predzáhradka bytu namiesto bazéna',x0:-19.5,x1:-4.95,depth:5},
 {name:'Predzáhradka apartmánu 2',x0:5.0,x1:12.6,depth:3.5},
 {name:'Predzáhradka apartmánu 3',x0:12.7,x1:20.5,depth:4},
 {name:'Predzáhradka apartmánu 4',x0:20.6,x1:28.6,depth:5}
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

import * as T from 'three';
import {surface,glassMaterial} from './surface-materials.js';

// Cellar under the former garage (ground floor, x -12.72..-2.72, z 15.88..23.45):
// stair hall up to the caretaker's flat, wine bar with cigar lounge (37 m2),
// glazed wine store (14 m2) and WC. Excavation is limited to the strip under
// the annex; the rest of the space already exists at this level. From the
// reception in hall 1.02 a corridor runs along the west edge of the unused
// ground level of the front block.
export const cellar={
 x0:-12.72,x1:-2.72,z0:15.88,z1:23.45,
 lounge:{x0:-12.72,x1:-5.42,z0:18.38,z1:23.45},
 store:{x0:-5.28,x1:-2.72,z0:18.12,z1:23.45},
 wc:{x0:-5.28,x1:-2.72,z0:15.88,z1:17.98},
 stair:{x0:-12.72,x1:-8.22,z0:15.88,z1:17.08},
 corridor:{x0:-7.53,x1:-5.6,z0:1.2,z1:15.5},
 reception:{x0:-3.45,x1:-1.85,z0:-4.75,z1:-4.15},
 entry:{x:-.05,z:-2.2},target:{x:-7.6,y:1.1,z:19.6}
};
const rect=(a,b,c,d)=>[[a,b],[c,b],[c,d],[a,d]];
export const cellarGlass=[
 {axis:'x',at:18.3,a:-12.72,b:-5.42,gaps:[[-7.55,-6.6]]},
 {axis:'z',at:-5.35,a:18.1,b:23.45,gaps:[[18.9,19.75]]}
];
export function applyWineCellar(data){
 const d=data[0];
 // Opening from vestibule 1.05 into the front block's ground level.
 d.walls=d.walls.flatMap(p=>{const xs=p.map(q=>q[0]),zs=p.map(q=>q[1]);const hit=Math.min(...zs)>-1.4&&Math.max(...zs)<-.97&&Math.min(...xs)<-.6&&Math.max(...xs)>.5;
  if(!hit)return [p];const z0=Math.min(...zs),z1=Math.max(...zs),x0=Math.min(...xs),x1=Math.max(...xs);return [rect(x0,z0,-.56,z1),rect(.52,z0,x1,z1)]});
 // Opening through the front block's south wall into the cellar.
 d.walls=d.walls.flatMap(p=>{const xs=p.map(q=>q[0]),zs=p.map(q=>q[1]);const hit=Math.min(...zs)>15.45&&Math.max(...zs)<15.95&&Math.min(...xs)<-7.4&&Math.max(...xs)>-6.4;
  if(!hit)return [p];const z0=Math.min(...zs),z1=Math.max(...zs),x0=Math.min(...xs),x1=Math.max(...xs);return [rect(x0,z0,-7.45,z1),rect(-6.35,z0,x1,z1)]});
 // Clear the old partitions under the garage.
 const mask={x0:-12.72,x1:-2.72,z0:15.88,z1:23.45},inside=p=>p.every(([x,z])=>x>mask.x0-.01&&x<mask.x1+.01&&z>mask.z0-.01&&z<mask.z1+.01);
 d.walls=d.walls.filter(p=>!inside(p));
 const wall=(axis,f,a,b,gaps=[],t=.15)=>{let start=a;for(const [lo,hi] of [...gaps,[b,b]]){if(lo>start)d.walls.push(axis==='x'?rect(start,f-t/2,lo,f+t/2):rect(f-t/2,start,f+t/2,lo));start=hi}};
 const door=(name,hinge,closed,open)=>d.doors.push({name:'Pivnica · '+name,hinge,closed,open,width:Math.hypot(closed[0]-hinge[0],closed[1]-hinge[1]),height:2.1});
 // Corridor: landing behind the vestibule door, then south along the west wall.
 wall('x',1.2,-5.6,.89);wall('z',.89,-1.0,1.2);wall('z',-5.6,1.2,15.5);
 d.doors.push({name:'Vstup do pivnice',hinge:[-.53,-1.185],closed:[.47,-1.185],open:[-.53,-.2],width:1,height:2.1});
 door('chodba',[-7.42,15.69],[-6.4,15.69],[-7.42,16.6]);
 // WC and wine-store walls; glazed partitions are drawn separately.
 wall('z',-5.35,15.88,18.05,[[16.55,17.4]]);wall('x',18.05,-5.35,-2.72);
 door('WC',[-5.35,16.58],[-5.35,17.37],[-4.6,16.58]);
 door('vinotéka a cigar bar',[-7.52,18.3],[-6.63,18.3],[-7.52,19.15]);
 door('vínny sklad',[-5.35,18.93],[-5.35,19.72],[-4.6,18.93]);
}
export const cellarFurniture=[];
function nearSegment(x,z,s){if(s.axis==='z'){if(Math.abs(x-s.at)>.12||z<s.a||z>s.b)return false;return !s.gaps.some(([a,b])=>z>a&&z<b)}if(Math.abs(z-s.at)>.12||x<s.a||x>s.b)return false;return !s.gaps.some(([a,b])=>x>a&&x<b)}
export function cellarBarrierAt(x,z,y){
 if(y<-.15||y>2)return false;
 if(cellarGlass.some(s=>nearSegment(x,z,s)))return true;
 return cellarFurniture.some(r=>x>r[0]-.15&&x<r[2]+.15&&z>r[1]-.15&&z<r[3]+.15);
}
export function buildWineCellar(){
 const g=new T.Group();g.name='Pivnica pod garážou: vinotéka, cigar bar, vínny sklad';cellarFurniture.length=0;
 const c=cellar,oak=surface('wood').clone();oak.color.set(0x8a6646);
 const walnut=surface('wood').clone();walnut.color.set(0x4a2f22);
 const brick=surface('plaster').clone();brick.color.set(0xa56f53);
 const stone=new T.MeshStandardMaterial({color:0x5c5853,roughness:.62});
 const leather=new T.MeshStandardMaterial({color:0x6b3520,roughness:.55});
 const brass=new T.MeshStandardMaterial({color:0xb08d57,metalness:.9,roughness:.3});
 const black=new T.MeshStandardMaterial({color:0x1d1f20,roughness:.4,metalness:.25});
 const bottleGreen=new T.MeshStandardMaterial({color:0x1f3b2a,roughness:.18,metalness:.1});
 const bottleRed=new T.MeshStandardMaterial({color:0x4a1418,roughness:.2});
 const white=new T.MeshStandardMaterial({color:0xf0eeea,roughness:.3});
 const lamp=new T.MeshStandardMaterial({color:0xffe3b0,emissive:0xffc777,emissiveIntensity:.75});
 const glass=glassMaterial();
 const box=(name,x,y,z,sx,sy,sz,m,solid=false)=>{const o=new T.Mesh(new T.BoxGeometry(sx,sy,sz),m);o.position.set(x,y,z);o.name=name;o.castShadow=sy>.08&&!m.transparent;o.receiveShadow=true;g.add(o);if(solid)cellarFurniture.push([x-sx/2,z-sz/2,x+sx/2,z+sz/2]);return o};
 const cyl=(name,x,y,z,r0,r1,h,m,solid=false)=>{const o=new T.Mesh(new T.CylinderGeometry(r0,r1,h,20),m);o.position.set(x,y,z);o.name=name;o.castShadow=true;o.receiveShadow=true;g.add(o);if(solid)cellarFurniture.push([x-r1,z-r1,x+r1,z+r1]);return o};
 // Instanced bottles keep thousands of bottle ends cheap to draw.
 const bottleGeo=new T.CylinderGeometry(.038,.038,.3,6);bottleGeo.rotateX(Math.PI/2);
 const bottles={green:[],red:[]},dummy=new T.Object3D();
 function rack(name,x0,x1,z,face,height=2.2,depth=.4){
  const cx=(x0+x1)/2,len=x1-x0;box(name,cx,height/2,z,len,height,.03,walnut);
  for(let y=.12;y<height;y+=.36)box(name+' – polica',cx,y,z+face*depth/2,len,.025,depth,walnut);
  for(let x=x0;x<=x1+.01;x+=.6)box(name+' – stojka',x,height/2,z+face*depth/2,.03,height,depth,walnut);
  for(let y=.2;y<height-.1;y+=.12)for(let x=x0+.06;x<x1-.04;x+=.11){dummy.position.set(x,y,z+face*(depth/2));dummy.rotation.set(0,0,0);dummy.updateMatrix();((Math.floor(x*11+y*7)%3)?bottles.green:bottles.red).push(dummy.matrix.clone())}
 }
 function rackZ(name,x,z0,z1,face,height=2.2,depth=.4){
  const cz=(z0+z1)/2,len=z1-z0;box(name,x,height/2,cz,.03,height,len,walnut);
  for(let y=.12;y<height;y+=.36)box(name+' – polica',x+face*depth/2,y,cz,depth,.025,len,walnut);
  for(let y=.2;y<height-.1;y+=.12)for(let z=z0+.06;z<z1-.04;z+=.11){dummy.position.set(x+face*(depth/2),y,z);dummy.rotation.set(0,Math.PI/2,0);dummy.updateMatrix();((Math.floor(z*11+y*7)%3)?bottles.green:bottles.red).push(dummy.matrix.clone())}
  cellarFurniture.push([Math.min(x,x+face*depth),z0,Math.max(x,x+face*depth),z1]);
 }
 // Floors and finishes: oak in the lounge, stone elsewhere, brick in the store.
 box('Kamenná dlažba pivnice',(c.x0+c.x1)/2,.014,(c.z0+c.z1)/2,c.x1-c.x0-.02,.028,c.z1-c.z0-.02,stone);
 box('Kamenná dlažba chodby',(c.corridor.x0+c.corridor.x1)/2,.014,(-1+15.5)/2,c.corridor.x1-c.corridor.x0,.028,16.5,stone);
 box('Dubová podlaha salónika',(c.lounge.x0+c.lounge.x1)/2,.032,(c.lounge.z0+c.lounge.z1)/2,c.lounge.x1-c.lounge.x0-.05,.012,c.lounge.z1-c.lounge.z0-.05,oak);
 box('Orechový obklad',c.x0+.03,1.2,(c.lounge.z0+c.lounge.z1)/2,.04,2.4,c.lounge.z1-c.lounge.z0,walnut);
 box('Orechový obklad',(c.lounge.x0+c.lounge.x1)/2,1.2,c.z1-.03,c.lounge.x1-c.lounge.x0,2.4,.04,walnut);
 {const r=c.store;box('Tehlový obklad vínneho skladu',r.x1-.03,1.2,(r.z0+r.z1)/2,.04,2.4,r.z1-r.z0,brick);box('Tehlový obklad vínneho skladu',(r.x0+r.x1)/2,1.2,r.z1-.03,r.x1-r.x0,2.4,.04,brick)}
 for(let z=2;z<15;z+=3)box('Svetlo chodby',(c.corridor.x0+c.corridor.x1)/2,2.42,z,.25,.03,.6,lamp);
 // Stair hall: straight flight up to the caretaker's flat at +2.78.
 {const st=c.stair,steps=16,run=(st.x1-st.x0)/steps;for(let i=0;i<steps;i++){const h=(i+1)*2.78/steps;box('Schod',st.x1-(i+.5)*run,h/2,(st.z0+st.z1)/2,run+.01,h,st.z1-st.z0-.06,i%2?oak:walnut,true)}
  box('Zábradlie',(st.x0+st.x1)/2,1.95,st.z1+.02,st.x1-st.x0,.05,.05,brass)}
 // Wine bar with cigar lounge (37 m2): bar counter, back bar, club chairs, humidor.
 {const r=c.lounge;
  box('Barový pult',-8.4,.55,19.45,3.6,1.1,.65,walnut,true);box('Doska pultu',-8.4,1.12,19.45,3.75,.05,.78,stone);
  rackZ('Stena s vínami za barom',c.x0+.02,18.5,20.9,1,2.2,.36);
  for(let i=0;i<4;i++){const x=-9.8+i*.95;cyl('Barová stolička',x,.72,20.15,.2,.2,.06,leather);cyl('Noha stoličky',x,.36,20.15,.025,.12,.7,brass);cellarFurniture.push([x-.2,19.95,x+.2,20.35])}
  for(const x of [-9.6,-8.4,-7.2])box('Závesné svetlo nad pultom',x,2.2,19.45,.22,.18,.22,lamp);
  box('Humidor',-5.75,1.05,22.6,.55,2.1,1.4,walnut,true);box('Sklo humidora',-6.04,1.2,22.6,.02,1.5,1.2,glass);for(let y=.6;y<1.9;y+=.32)box('Krabice cigár',-5.8,y,22.6,.4,.12,1.1,oak);
  for(const [x,z] of [[-11.2,22.1],[-8.3,22.2]]){cyl('Nízky stolík',x,.5,z,.42,.42,.05,walnut);cyl('Podnož stolíka',x,.25,z,.06,.18,.48,brass,true);box('Popolník',x,.54,z,.18,.03,.18,black);
   for(const [dx,dz,rot] of [[-.95,0,Math.PI/2],[.95,0,-Math.PI/2],[0,-.95,0]]){
    const chair=new T.Group();chair.position.set(x+dx,0,z+dz);chair.rotation.y=rot;g.add(chair);
    const seat=new T.Mesh(new T.BoxGeometry(.82,.42,.78),leather);seat.position.y=.24;const back=new T.Mesh(new T.BoxGeometry(.82,.5,.18),leather);back.position.set(0,.66,-.32);
    const armL=new T.Mesh(new T.BoxGeometry(.16,.28,.78),leather);armL.position.set(-.38,.56,0);const armR=armL.clone();armR.position.x=.38;
    for(const o of [seat,back,armL,armR]){o.castShadow=true;o.receiveShadow=true;chair.add(o)}
    cellarFurniture.push([x+dx-.42,z+dz-.42,x+dx+.42,z+dz+.42]);
   }}
  box('Odsávacia mriežka',-9.7,2.53,22.2,1.2,.02,.6,black);box('Prívodná mriežka',-7,2.53,18.9,1.2,.02,.3,black);
  for(const [x,z] of [[-11.2,22.1],[-8.3,22.2]])box('Svietidlo',x,2.3,z,.35,.12,.35,lamp)}
 // Wine store (14 m2): racks on both long sides, cooling unit above the door.
 {const r=c.store;rackZ('Regál vínneho skladu',r.x1-.06,18.4,23.2,-1);rack('Regál vínneho skladu',r.x0+.4,r.x1-.5,r.z1-.06,-1);
  box('Degustačný stolík',-4.4,.9,21.2,.6,.05,1.2,oak,true);box('Chladiaca jednotka',-4.0,2.25,18.25,1.2,.4,.25,white);
  box('Svetelná lišta skladu',(r.x0+r.x1)/2,2.42,(r.z0+r.z1)/2,.06,.03,4.6,lamp)}
 // WC by the stair hall.
 box('WC',-3.1,.26,16.5,.62,.52,.42,white,true);box('Umývadlo',-4.8,.86,15.95+.2,.5,.12,.4,white,true);
 // Reception desk in hall 1.02, passed on the way to the cellar corridor.
 {const r=c.reception;box('Recepčný pult',(r.x0+r.x1)/2,.55,(r.z0+r.z1)/2,r.x1-r.x0,1.1,r.z1-r.z0,walnut,true);box('Doska recepcie',(r.x0+r.x1)/2,1.12,(r.z0+r.z1)/2-.05,r.x1-r.x0+.1,.04,r.z1-r.z0+.12,stone);
  box('Monitor recepcie',(r.x0+r.x1)/2,1.32,r.z0+.12,.55,.34,.04,black);box('Stolička recepcie',(r.x0+r.x1)/2,.5,r.z0-.55,.5,.08,.5,black,true);box('Svetlo recepcie',(r.x0+r.x1)/2,2.4,(r.z0+r.z1)/2,1.4,.04,.2,lamp)}
 // Glass partitions with brass frames.
 for(const s of cellarGlass){let start=s.a;for(const [lo,hi] of [...s.gaps,[s.b,s.b]]){if(lo>start){const len=lo-start,mid=(start+lo)/2;
   if(s.axis==='z'){box('Sklenená priečka',s.at,1.25,mid,.02,2.5,len,glass);box('Rám priečky',s.at,2.52,mid,.05,.05,len,brass);box('Rám priečky',s.at,.03,mid,.05,.05,len,brass)}
   else{box('Sklenená priečka',mid,1.25,s.at,len,2.5,.02,glass);box('Rám priečky',mid,2.52,s.at,len,.05,.05,brass);box('Rám priečky',mid,.03,s.at,len,.05,.05,brass)}}start=hi}}
 for(const [key,m] of [['green',bottleGreen],['red',bottleRed]]){const list=bottles[key];if(!list.length)continue;const inst=new T.InstancedMesh(bottleGeo,m,list.length);list.forEach((mat,i)=>inst.setMatrixAt(i,mat));inst.name='Fľaše vína';inst.castShadow=false;inst.receiveShadow=true;g.add(inst)}
 g.userData.rooms=['Recepcia','Chodba do pivnice','Schodisko k správcovi','Vinotéka a cigar bar','Vínny sklad','WC'];
 return g;
}

// Caretaker's office at +2.78 in the former garage: 10 m2 by the outside door and
// the link to the main building, so visitors do not pass through the flat.
export const caretakerOffice={x0:-4.9,x1:-2.72,z0:15.88,z1:20.6,floor:2.78};
export function applyCaretakerOffice(data){
 const d=data[1],o=caretakerOffice;
 d.walls.push(rect(o.x0-.06,o.z0,o.x0+.06,19.5),rect(o.x0-.06,20.4,o.x0+.06,o.z1+.06),rect(o.x0-.06,o.z1-.06,o.x1,o.z1+.06));
 d.doors.push({name:'Dom správcu · kancelária',hinge:[o.x0,19.52],closed:[o.x0,20.38],open:[o.x0-.86,19.52],width:.86,height:2.1});
}
export const officeFurniture=[];
export function caretakerOfficeBarrierAt(x,z,y){return y>caretakerOffice.floor-.1&&y<caretakerOffice.floor+2&&officeFurniture.some(r=>x>r[0]-.15&&x<r[2]+.15&&z>r[1]-.15&&z<r[3]+.15)}
export function buildCaretakerOffice(){
 const g=new T.Group();g.name='Kancelária správcu';officeFurniture.length=0;const y0=caretakerOffice.floor;
 const oak=surface('wood').clone();oak.color.set(0x9a7656);
 const white=new T.MeshStandardMaterial({color:0xf0eeea,roughness:.35}),black=new T.MeshStandardMaterial({color:0x22272a,roughness:.45,metalness:.25});
 const lamp=new T.MeshStandardMaterial({color:0xfff1d6,emissive:0xffdcaa,emissiveIntensity:.6});
 const box=(name,x,y,z,sx,sy,sz,m,solid=false)=>{const o=new T.Mesh(new T.BoxGeometry(sx,sy,sz),m);o.position.set(x,y0+y,z);o.name=name;o.castShadow=true;o.receiveShadow=true;g.add(o);if(solid)officeFurniture.push([x-sx/2,z-sz/2,x+sx/2,z+sz/2]);return o};
 box('Pracovný stôl',-3.1,.74,19.65,.75,.05,1.5,oak,true);box('Kontajner',-3.1,.33,19.15,.6,.62,.45,white);
 box('Monitor',-2.82,1.02,19.75,.04,.38,.62,black);box('Kancelárska stolička',-3.8,.48,19.65,.5,.08,.5,black,true);box('Operadlo',-4.04,.8,19.65,.06,.55,.46,black);
 box('Stolička pre návštevu',-4.45,.46,18.9,.45,.06,.45,oak,true);
 box('Regál so šanónmi',-4.62,1.0,17.3,.36,2,2.5,white,true);for(let i=0;i<4;i++)box('Šanóny',-4.6,.5+i*.45,17.3,.3,.3,2.3,new T.MeshStandardMaterial({color:[0x3d5a6c,0x8a6a3a,0x5b6b4f,0x704040][i],roughness:.8}));
 box('Skrinka s kľúčmi',-4.82,1.5,19.0,.08,.5,.4,black);box('Tlačiareň',-3.1,.9,18.8,.45,.25,.4,white);
 box('Svetlo kancelárie',-3.8,2.47,18.2,.4,.04,1.4,lamp);
 return g;
}

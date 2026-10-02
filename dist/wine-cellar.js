import * as T from 'three';
import {surface,glassMaterial} from './surface-materials.js';
import {caretakerFurniture} from './caretaker-house.js';

// Cellar under the former garage (ground floor, x -12.72..-2.72, z 15.88..23.45):
// wine bar with cigar lounge (37 m2), glazed wine store (14 m2) and WC. It is
// reached only by the existing stair from the entrance lobby above, which also
// serves the main entrance, the caretaker's office and the caretaker's flat.
export const cellar={
 x0:-12.72,x1:-2.72,z0:15.88,z1:23.45,
 lounge:{x0:-12.72,x1:-5.42,z0:18.38,z1:23.45},
 store:{x0:-5.28,x1:-2.72,z0:18.12,z1:23.45},
 wc:{x0:-5.28,x1:-2.72,z0:15.88,z1:17.98},
 stair:{x0:-12.72,x1:-7.91,z0:15.88,z1:16.86},
 entry:{x:-6.6,z:17.55},target:{x:-7.6,y:1.1,z:19.6}
};
const rect=(a,b,c,d)=>[[a,b],[c,b],[c,d],[a,d]];
export const cellarGlass=[
 {axis:'x',at:18.3,a:-12.72,b:-5.42,gaps:[[-7.55,-6.6]]},
 {axis:'z',at:-5.35,a:18.1,b:23.45,gaps:[[18.9,19.75]]}
];
export function applyWineCellar(data){
 const d=data[0];
 // Clear the old partitions under the garage.
 const mask={x0:-12.72,x1:-2.72,z0:15.88,z1:23.45},inside=p=>p.every(([x,z])=>x>mask.x0-.01&&x<mask.x1+.01&&z>mask.z0-.01&&z<mask.z1+.01);
 // Keep the existing stair and its side wall (z 16.88..17.13) as they are.
 const stairWall=p=>{const zs=p.map(q=>q[1]);return Math.min(...zs)>16.85&&Math.max(...zs)<17.16};
 d.walls=d.walls.filter(p=>!inside(p)||stairWall(p));
 const wall=(axis,f,a,b,gaps=[],t=.15)=>{let start=a;for(const [lo,hi] of [...gaps,[b,b]]){if(lo>start)d.walls.push(axis==='x'?rect(start,f-t/2,lo,f+t/2):rect(f-t/2,start,f+t/2,lo));start=hi}};
 const door=(name,hinge,closed,open)=>d.doors.push({name:'Pivnica · '+name,hinge,closed,open,width:Math.hypot(closed[0]-hinge[0],closed[1]-hinge[1]),height:2.1});
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
 box('Dubová podlaha salónika',(c.lounge.x0+c.lounge.x1)/2,.032,(c.lounge.z0+c.lounge.z1)/2,c.lounge.x1-c.lounge.x0-.05,.012,c.lounge.z1-c.lounge.z0-.05,oak);
 box('Orechový obklad',c.x0+.03,1.2,(c.lounge.z0+c.lounge.z1)/2,.04,2.4,c.lounge.z1-c.lounge.z0,walnut);
 box('Orechový obklad',(c.lounge.x0+c.lounge.x1)/2,1.2,c.z1-.03,c.lounge.x1-c.lounge.x0,2.4,.04,walnut);
 {const r=c.store;box('Tehlový obklad vínneho skladu',r.x1-.03,1.2,(r.z0+r.z1)/2,.04,2.4,r.z1-r.z0,brick);box('Tehlový obklad vínneho skladu',(r.x0+r.x1)/2,1.2,r.z1-.03,r.x1-r.x0,2.4,.04,brick)}
 // Existing straight stair: from the entrance lobby above (east end) down to the cellar (west end).
 {const st=c.stair,steps=16,run=(st.x1-st.x0)/steps;for(let i=0;i<steps;i++){const h=(i+1)*2.78/steps;box('Schod',st.x0+(i+.5)*run,h/2,(st.z0+st.z1)/2,run+.01,h,st.z1-st.z0-.04,i%2?oak:walnut,true)}
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
 // Glass partitions with brass frames.
 for(const s of cellarGlass){let start=s.a;for(const [lo,hi] of [...s.gaps,[s.b,s.b]]){if(lo>start){const len=lo-start,mid=(start+lo)/2;
   if(s.axis==='z'){box('Sklenená priečka',s.at,1.25,mid,.02,2.5,len,glass);box('Rám priečky',s.at,2.52,mid,.05,.05,len,brass);box('Rám priečky',s.at,.03,mid,.05,.05,len,brass)}
   else{box('Sklenená priečka',mid,1.25,s.at,len,2.5,.02,glass);box('Rám priečky',mid,2.52,s.at,len,.05,.05,brass);box('Rám priečky',mid,.03,s.at,len,.05,.05,brass)}}start=hi}}
 for(const [key,m] of [['green',bottleGreen],['red',bottleRed]]){const list=bottles[key];if(!list.length)continue;const inst=new T.InstancedMesh(bottleGeo,m,list.length);list.forEach((mat,i)=>inst.setMatrixAt(i,mat));inst.name='Fľaše vína';inst.castShadow=false;inst.receiveShadow=true;g.add(inst)}
 g.userData.rooms=['Schodisko z vstupnej haly','Vinotéka a cigar bar','Vínny sklad','WC'];
 return g;
}

// Former garage at +2.78: entrance lobby by the main entrance with the stair
// down to the wine bar, the door into the complex and the doors to the
// caretaker's office (23 m2, meeting table for eight) and the caretaker's flat.
export const caretakerOffice={x0:-7.95,x1:-2.72,z0:19.05,z1:23.45,floor:2.78};
export const caretakerLobby={x0:-7.95,x1:-2.72,z0:15.88,z1:18.95};
export const caretakerFlat={x0:-12.72,x1:-8.05,z0:16.95,z1:23.45};
export function applyCaretakerOffice(data){
 const d=data[1],m={x0:-12.72,x1:-2.72,z0:15.88,z1:23.45};
 const inside=p=>p.every(([x,z])=>x>m.x0-.01&&x<m.x1+.01&&z>m.z0-.01&&z<m.z1+.01);
 d.walls=d.walls.filter(p=>!inside(p));
 d.doors=d.doors.filter(p=>!/Dom správcu · (kúpeľňa|spálňa)/.test(p.name||''));
 const wall=(axis,f,a,b,gaps=[],t=.14)=>{let start=a;for(const [lo,hi] of [...gaps,[b,b]]){if(lo>start)d.walls.push(axis==='x'?rect(start,f-t/2,lo,f+t/2):rect(f-t/2,start,f+t/2,lo));start=hi}};
 const door=(name,hinge,closed,open)=>d.doors.push({name:'Dom správcu · '+name,hinge,closed,open,width:Math.hypot(closed[0]-hinge[0],closed[1]-hinge[1]),height:2.1});
 wall('x',16.95,-12.72,-7.95);                    // stair well | flat
 wall('z',-8.0,16.95,23.45,[[17.3,18.2]]);         // lobby | flat
 wall('x',19.0,-7.95,-2.72,[[-5.6,-4.7]]);         // lobby | office
 wall('x',19.25,-12.72,-10.15);wall('z',-10.15,16.95,19.25,[[18.1,18.85]]); // bathroom
 door('vstup do bytu',[-8.0,17.32],[-8.0,18.18],[-8.86,17.32]);
 door('kancelária',[-5.58,19.0],[-4.72,19.0],[-5.58,19.86]);
 door('kúpeľňa',[-10.15,18.12],[-10.15,18.83],[-10.86,18.12]);
 caretakerFurniture.length=0;
}
export const officeFurniture=[];
export function caretakerOfficeBarrierAt(x,z,y){return y>caretakerOffice.floor-.1&&y<caretakerOffice.floor+2&&officeFurniture.some(r=>x>r[0]-.15&&x<r[2]+.15&&z>r[1]-.15&&z<r[3]+.15)}
export function buildCaretakerOffice(){
 const g=new T.Group();g.name='Vstupná hala, kancelária a byt správcu';officeFurniture.length=0;const y0=0; // group sits at the floor level
 const oak=surface('wood').clone();oak.color.set(0x9a7656);const walnut=surface('wood').clone();walnut.color.set(0x5a3b2a);
 const white=new T.MeshStandardMaterial({color:0xf0eeea,roughness:.35}),black=new T.MeshStandardMaterial({color:0x22272a,roughness:.45,metalness:.25});
 const fabric=new T.MeshStandardMaterial({color:0x56666b,roughness:.95}),steel=new T.MeshStandardMaterial({color:0xa6adb0,metalness:.85,roughness:.25});
 const lamp=new T.MeshStandardMaterial({color:0xfff1d6,emissive:0xffdcaa,emissiveIntensity:.6}),glass=glassMaterial();
 const box=(name,x,y,z,sx,sy,sz,m,solid=false)=>{const o=new T.Mesh(new T.BoxGeometry(sx,sy,sz),m);o.position.set(x,y0+y,z);o.name=name;o.castShadow=true;o.receiveShadow=true;g.add(o);if(solid)officeFurniture.push([x-sx/2,z-sz/2,x+sx/2,z+sz/2]);return o};
 // Lobby: stair-well railing, reception counter, mat by the main entrance.
 box('Zábradlie schodiska',-10.3,.95,16.92,4.8,.05,.05,steel);for(let x=-12.6;x<-7.9;x+=.6)box('Stĺpik zábradlia',x,.48,16.92,.03,.95,.03,steel);
 box('Recepčný pult',-6.9,.55,18.62,1.6,1.1,.55,walnut,true);box('Doska pultu',-6.9,1.12,18.62,1.7,.04,.62,white);
 box('Rohožka',-3.3,.012,18.15,1.2,.02,1.6,black);
 box('Orientačná tabuľa',-2.76,1.6,16.7,.03,.7,1.0,white);
 // Office (23 m2): table for eight, caretaker's desk, cabinets.
 const tx=-5.35,tz=21.55;box('Rokovací stôl',tx,.74,tz,1.1,.05,2.6,oak,true);for(const [dx,dz] of [[-.45,-1.2],[.45,-1.2],[-.45,1.2],[.45,1.2]])box('Noha stola',tx+dx,.36,tz+dz,.06,.72,.06,black);
 for(const s of [-1,1])for(let i=0;i<3;i++){const z=tz-.85+i*.85;box('Stolička',tx+s*.85,.46,z,.46,.06,.46,fabric,true);box('Operadlo',tx+s*1.06,.76,z,.05,.5,.44,fabric)}
 for(const s of [-1,1]){box('Stolička',tx,.46,tz+s*1.6,.46,.06,.46,fabric,true);box('Operadlo',tx,.76,tz+s*1.82,.44,.5,.05,fabric)}
 box('Pracovný stôl správcu',-3.15,.74,22.6,.75,.05,1.5,oak,true);box('Monitor',-2.85,1.02,22.6,.04,.38,.62,black);box('Kancelárska stolička',-3.8,.48,22.6,.5,.08,.5,black,true);
 box('Skrine so šanónmi',-7.65,1.0,21.4,.5,2,3.0,white,true);box('Skrinka s kľúčmi',-2.78,1.5,19.9,.06,.5,.4,black);
 box('Televízor na prezentácie',-5.35,1.4,23.4,1.3,.75,.04,black);
 for(const z of [20.6,22.4])box('Svetlo kancelárie',-5.35,2.47,z,.6,.04,1.2,lamp);
 // Caretaker's flat (30 m2): living with kitchenette and bed alcove, shower room.
 const f=caretakerFlat;
 box('Posteľ',-11.8,.25,22.4,1.6,.5,2.0,white,true);box('Prikrývka',-11.8,.53,22.6,1.6,.06,1.6,fabric);box('Čelo postele',-11.8,.7,23.4,1.6,.9,.08,walnut);
 box('Pohovka',-8.55,.4,20.5,.8,.8,1.9,fabric,true);box('Konferenčný stolík',-9.6,.38,20.5,.6,.06,1.0,oak,true);
 box('Kuchynská linka',-10.9,.45,19.6,2.6,.9,.6,white,true);box('Pracovná doska',-10.9,.92,19.6,2.6,.04,.62,walnut);box('Varná doska',-11.5,.945,19.6,.6,.01,.5,black);box('Drez',-10.2,.945,19.6,.5,.02,.4,steel);
 box('Jedálenský stolík',-9.4,.74,22.6,.8,.05,.8,oak,true);
 box('Sprcha',-12.25,.04,17.45,.85,.06,.85,white);box('Sklo sprchy',-11.82,1.05,17.45,.01,2,.85,glass);box('WC',-12.45,.26,18.75,.42,.52,.62,white,true);box('Umývadlo',-11.2,.85,19.08,.55,.12,.38,white,true);
 return g;
}

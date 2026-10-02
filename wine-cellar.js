import * as T from 'three';
import {surface,glassMaterial} from './surface-materials.js';

// The semi-buried ground floor under the front block (x -7.53..10.47,
// z -1.0..15.5) becomes the cellar: wine bar, a sealed cigar lounge with its
// own extract, and a cool wine archive. It is entered from vestibule 1.05,
// past the new reception desk in hall 1.02. The WC sits at the hall end, on the
// same drain line as the hall toilets; the cigar extract and the wine-cooling
// unit share the technical room in the far corner, next to the facade.
export const cellar={
 x0:-7.53,x1:10.47,z0:-1.0,z1:15.5,
 cigar:{x0:4.66,x1:10.47,z0:-1.0,z1:7.94},
 archive:{x0:-7.53,x1:10.47,z0:8.06,z1:15.5},
 wc:{x0:-7.53,x1:-5.36,z0:-1.0,z1:1.84},
 tech:{x0:8.26,x1:10.47,z0:13.26,z1:15.5},
 reception:{x0:-3.45,x1:-1.85,z0:-4.75,z1:-4.15},
 entry:{x:-.05,z:-2.2},target:{x:1.5,y:1.1,z:4.5}
};
const rect=(a,b,c,d)=>[[a,b],[c,b],[c,d],[a,d]];
// Glass partitions are drawn here and act as barriers; solid walls go into the plan data.
export const cellarGlass=[
 {axis:'z',at:4.6,a:-1.0,b:7.94,gaps:[[2.9,3.9]]},
 {axis:'x',at:8.0,a:-7.53,b:4.6,gaps:[[-2.4,-1.4]]}
];
export function applyWineCellar(data){
 const d=data[0];
 // Opening from vestibule 1.05 through the front block's north wall.
 d.walls=d.walls.flatMap(p=>{const xs=p.map(q=>q[0]),zs=p.map(q=>q[1]);const hit=Math.min(...zs)>-1.4&&Math.max(...zs)<-.97&&Math.min(...xs)<-.6&&Math.max(...xs)>.5;
  if(!hit)return [p];const z0=Math.min(...zs),z1=Math.max(...zs),x0=Math.min(...xs),x1=Math.max(...xs);return [rect(x0,z0,-.56,z1),rect(.52,z0,x1,z1)]});
 d.doors.push({name:'Vstup do vinotéky',hinge:[-.53,-1.185],closed:[.47,-1.185],open:[-.53,-.2],width:1,height:2.1});
 const wall=(axis,f,a,b,gaps=[],t=.15)=>{let start=a;for(const [lo,hi] of [...gaps,[b,b]]){if(lo>start)d.walls.push(axis==='x'?rect(start,f-t/2,lo,f+t/2):rect(f-t/2,start,f+t/2,lo));start=hi}};
 const door=(name,hinge,closed,open)=>d.doors.push({name:'Pivnica · '+name,hinge,closed,open,width:Math.hypot(closed[0]-hinge[0],closed[1]-hinge[1]),height:2.1});
 // Solid wall between cigar lounge and archive keeps smoke out of the wine store.
 wall('x',8.0,4.6,10.47);
 // WC
 wall('z',-5.3,-1.0,1.9,[[.85,1.7]]);wall('x',1.9,-7.53,-5.3);
 door('WC',[-5.3,.88],[-5.3,1.68],[-4.5,.88]);
 // Technical room: cigar-lounge extract with heat recovery, wine-cooling unit.
 wall('z',8.2,13.2,15.5,[[13.45,14.35]]);wall('x',13.2,8.2,10.47);
 door('technika',[8.2,13.48],[8.2,14.32],[7.4,13.48]);
 // Glass doors in the glazed partitions.
 door('cigar bar',[4.6,2.93],[4.6,3.87],[3.7,2.93]);
 door('archív vín',[-2.37,8.0],[-1.43,8.0],[-2.37,7.1]);
}
export const cellarFurniture=[];
function nearSegment(x,z,s){if(s.axis==='z'){if(Math.abs(x-s.at)>.12||z<s.a||z>s.b)return false;return !s.gaps.some(([a,b])=>z>a&&z<b)}if(Math.abs(z-s.at)>.12||x<s.a||x>s.b)return false;return !s.gaps.some(([a,b])=>x>a&&x<b)}
export function cellarBarrierAt(x,z,y){
 if(y<-.15||y>2)return false;
 if(cellarGlass.some(s=>nearSegment(x,z,s)))return true;
 return cellarFurniture.some(r=>x>r[0]-.15&&x<r[2]+.15&&z>r[1]-.15&&z<r[3]+.15);
}
export function buildWineCellar(){
 const g=new T.Group();g.name='Vinotéka, cigar bar a archív vín';cellarFurniture.length=0;
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
 // Floors and finishes.
 box('Kamenná dlažba pivnice',(c.x0+c.x1)/2,.014,(c.z0+c.z1)/2,c.x1-c.x0-.02,.028,c.z1-c.z0-.02,stone);
 box('Dubová podlaha cigar baru',(c.cigar.x0+c.cigar.x1)/2,.032,(c.cigar.z0+c.cigar.z1)/2,c.cigar.x1-c.cigar.x0-.05,.012,c.cigar.z1-c.cigar.z0-.05,oak);
 box('Tehlový obklad archívu',c.x0+.03,1.2,(c.archive.z0+c.archive.z1)/2,.04,2.4,c.archive.z1-c.archive.z0,brick);
 box('Tehlový obklad archívu',(c.x0+c.x1)/2,1.2,c.z1-.03,c.x1-c.x0,2.4,.04,brick);
 // Wine bar: back-lit wall rack along the west wall, bar counter, high tables.
 rackZ('Vinotéka – stena s vínami',c.x0+.02,2.0,7.8,1);
 box('Barový pult',-3.3,.55,5.4,4.6,1.1,.7,walnut,true);box('Doska pultu',-3.3,1.12,5.4,4.75,.05,.82,stone);
 box('Zadná linka baru',-3.3,.45,6.85,4.6,.9,.6,walnut,true);box('Doska zadnej linky',-3.3,.92,6.85,4.6,.04,.62,stone);
 box('Drez baru',-4.6,.945,6.85,.45,.02,.38,black);box('Vínotéka chladiaca',-1.6,.45,6.86,.6,.86,.58,glass);
 box('Police na poháre',-3.3,1.75,7.55,4.4,.03,.3,walnut);for(let x=-5.3;x<-1.3;x+=.18)cyl('Pohár',x,1.82,7.55,.035,.025,.12,glass);
 for(let i=0;i<5;i++){const x=-5.1+i*.95;cyl('Barová stolička',x,.72,4.55,.2,.2,.06,leather);cyl('Noha stoličky',x,.36,4.55,.025,.12,.7,brass);cellarFurniture.push([x-.2,4.35,x+.2,4.75])}
 for(const [x,z] of [[-4.6,1.6],[-2.0,2.2],[2.4,1.4],[2.6,6.2]]){cyl('Vysoký stolík',x,1.05,z,.38,.38,.04,oak);cyl('Noha stolíka',x,.52,z,.04,.2,1.04,black,true);
  for(const a of [0,Math.PI]){const sx=x+Math.cos(a)*.62,sz=z+Math.sin(a)*.62;cyl('Barová stolička',sx,.72,sz,.19,.19,.06,leather);cyl('Noha stoličky',sx,.36,sz,.025,.12,.7,brass)}}
 for(const x of [-5,-3.3,-1.6])box('Závesné svetlo nad pultom',x,2.2,5.4,.22,.18,.22,lamp);
 box('Svetelná lišta',c.x0+.5,2.38,4.9,.06,.03,5.6,lamp);
 // Cigar lounge: walnut panelling, club chairs, humidor and an extract grille.
 {const r=c.cigar,cx=(r.x0+r.x1)/2;
  box('Orechový obklad',r.x1-.03,1.2,(r.z0+r.z1)/2,.04,2.4,r.z1-r.z0,walnut);box('Orechový obklad',cx,1.2,r.z1-.1,r.x1-r.x0,2.4,.04,walnut);
  box('Humidor',r.x1-.35,1.05,1.2,.6,2.1,1.6,walnut,true);box('Sklo humidora',r.x1-.66,1.2,1.2,.02,1.5,1.3,glass);for(let y=.6;y<1.9;y+=.32)box('Krabice cigár',r.x1-.4,y,1.2,.4,.12,1.2,oak);
  for(const [x,z] of [[6.4,3.0],[8.6,5.6]]){cyl('Nízky stolík',x,.5,z,.42,.42,.05,walnut);cyl('Podnož stolíka',x,.25,z,.06,.18,.48,brass,true);box('Popolník',x,.54,z,.18,.03,.18,black);
   for(const [dx,dz,rot] of [[-.95,0,Math.PI/2],[.95,0,-Math.PI/2],[0,-.95,0],[0,.95,Math.PI]]){
    const chair=new T.Group();chair.position.set(x+dx,0,z+dz);chair.rotation.y=rot;g.add(chair);
    const seat=new T.Mesh(new T.BoxGeometry(.82,.42,.78),leather);seat.position.y=.24;const back=new T.Mesh(new T.BoxGeometry(.82,.5,.18),leather);back.position.set(0,.66,-.32);
    const armL=new T.Mesh(new T.BoxGeometry(.16,.28,.78),leather);armL.position.set(-.38,.56,0);const armR=armL.clone();armR.position.x=.38;
    for(const o of [seat,back,armL,armR]){o.castShadow=true;o.receiveShadow=true;chair.add(o)}
    cellarFurniture.push([x+dx-.42,z+dz-.42,x+dx+.42,z+dz+.42]);
   }}
  box('Odsávacia mriežka',cx,2.53,4.2,1.2,.02,.6,black);box('Prívodná mriežka',cx,2.53,.4,1.2,.02,.3,black);
  for(const [x,z] of [[6.4,3],[8.6,5.6]])box('Svietidlo',x,2.3,z,.35,.12,.35,lamp)}
 // Wine archive: free-standing double racks, barrels and a tasting table.
 for(const z of [9.6,11.6,13.6]){rack('Regál archívu',-7.0,2.4,z-.21,-1);rack('Regál archívu',-7.0,2.4,z+.21,1);cellarFurniture.push([-7.0,z-.45,2.4,z+.45])}
 for(const [x,z] of [[4.0,14.6],[5.3,14.6],[6.6,14.6]]){const barrel=new T.Mesh(new T.CylinderGeometry(.36,.36,.9,20),oak);barrel.rotation.x=Math.PI/2;barrel.position.set(x,.46,z);barrel.castShadow=true;g.add(barrel);cellarFurniture.push([x-.4,z-.5,x+.4,z+.5]);for(const dz of [-.3,.3]){const hoop=new T.Mesh(new T.TorusGeometry(.365,.012,6,24),black);hoop.position.set(x,.46,z+dz);g.add(hoop)}}
 box('Degustačný stôl',5.6,.76,11,1.0,.06,3.2,oak,true);for(const [dx,dz] of [[-.4,-1.4],[.4,-1.4],[-.4,1.4],[.4,1.4]])box('Noha stola',5.6+dx,.37,11+dz,.07,.72,.07,black);
 for(const z of [9.9,10.7,11.5,12.3])for(const sx of [-1,1]){box('Stolička',5.6+sx*.8,.46,z,.44,.06,.44,oak,true);box('Operadlo',5.6+sx*1.0,.75,z,.05,.5,.42,oak)}
 for(const z of [9.6,11.6,13.6])box('Svetelná lišta archívu',-2.3,2.42,z,9,.03,.06,lamp);
 // WC fixtures on the hall drain line; technical room units.
 box('WC',-6.95,.26,-.5,.42,.52,.62,white,true);box('Umývadlo',-6.9,.86,1.35,.5,.12,.4,white,true);
 box('Vzduchotechnická jednotka',9.35,.9,14.4,1.6,1.8,1.4,new T.MeshStandardMaterial({color:0xb8bfc0,metalness:.6,roughness:.4}),true);
 box('Chladiaca jednotka archívu',9.6,2.15,13.45,1.4,.5,.3,white);
 // Reception desk in hall 1.02, passed on the way down to the cellar.
 {const r=c.reception;box('Recepčný pult',(r.x0+r.x1)/2,.55,(r.z0+r.z1)/2,r.x1-r.x0,1.1,r.z1-r.z0,walnut,true);box('Doska recepcie',(r.x0+r.x1)/2,1.12,(r.z0+r.z1)/2-.05,r.x1-r.x0+.1,.04,r.z1-r.z0+.12,stone);
  box('Monitor recepcie',(r.x0+r.x1)/2,1.32,r.z0+.12,.55,.34,.04,black);box('Stolička recepcie',(r.x0+r.x1)/2,.5,r.z0-.55,.5,.08,.5,black,true);box('Svetlo recepcie',(r.x0+r.x1)/2,2.4,(r.z0+r.z1)/2,1.4,.04,.2,lamp)}
 // Glass partitions with brass frames.
 for(const s of cellarGlass){let start=s.a;for(const [lo,hi] of [...s.gaps,[s.b,s.b]]){if(lo>start){const len=lo-start,mid=(start+lo)/2;
   if(s.axis==='z'){box('Sklenená priečka',s.at,1.25,mid,.02,2.5,len,glass);box('Rám priečky',s.at,2.52,mid,.05,.05,len,brass);box('Rám priečky',s.at,.03,mid,.05,.05,len,brass)}
   else{box('Sklenená priečka',mid,1.25,s.at,len,2.5,.02,glass);box('Rám priečky',mid,2.52,s.at,len,.05,.05,brass);box('Rám priečky',mid,.03,s.at,len,.05,.05,brass)}}start=hi}}
 for(const [key,m] of [['green',bottleGreen],['red',bottleRed]]){const list=bottles[key];if(!list.length)continue;const inst=new T.InstancedMesh(bottleGeo,m,list.length);list.forEach((mat,i)=>inst.setMatrixAt(i,mat));inst.name='Fľaše vína';inst.castShadow=false;inst.receiveShadow=true;g.add(inst)}
 g.userData.rooms=['Recepcia','Vinotéka','Cigar bar','Archív vín','WC','Technika'];
 return g;
}

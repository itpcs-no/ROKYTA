import * as T from 'three';
import {surface,glassMaterial} from './surface-materials.js';
import {outsideRectangle} from './caretaker-house.js';
import {makeWaterMaterial} from './water-material.js';

// The former indoor pool hall becomes two through flats, 1.02 (east) and 1.07
// (west), each with windows to the south garden and the north courtyard. Water
// and drainage stay on the south side: kitchens by the garden glazing and the
// two bathrooms back to back on the new party wall with one shared riser.
// Bedrooms face north. The old basin is not filled to floor level: in each
// flat it becomes a sunken living area ("conversation pit", 45 cm deep) with a
// built-in upholstered bench and a band of the original pool mosaic on the rim.
export const apartment={x0:-19.63,x1:-4.79,z0:-21.44,z1:-11.20,entry:{x:-13.0,z:-12.2}};
export const flats=[{code:'1.02',x0:-19.63,x1:-12.33},{code:'1.07',x0:-12.08,x1:-4.79}];
export const livingPits=[{x0:-19.1,x1:-15.1,z0:-17.95,z1:-14.95,depth:.45},{x0:-9.75,x1:-6.75,z0:-17.95,z1:-14.95,depth:.45}];
const rect=(a,b,c,d)=>[[a,b],[c,b],[c,d],[a,d]];
export function applyPoolApartment(data){
 const d=data[0];
 const mask={x0:-19.62,x1:-4.781,z0:-21.44,z1:-11.2};
 d.walls=d.walls.flatMap(p=>outsideRectangle(p,mask));
 d.doors=d.doors.filter(p=>!(p.hinge[0]>mask.x0&&p.hinge[0]<mask.x1&&p.hinge[1]>mask.z0&&p.hinge[1]<mask.z1));
 const wall=(axis,f,a,b,gaps=[],t=.14)=>{let start=a;for(const [lo,hi] of [...gaps,[b,b]]){if(lo>start)d.walls.push(axis==='x'?rect(start,f-t/2,lo,f+t/2):rect(f-t/2,start,f+t/2,lo));start=hi;}};
 const door=(code,name,hinge,closed,open,height=2.18)=>d.doors.push({name:`Byt ${code} · ${name}`,hinge,closed,open,width:Math.hypot(closed[0]-hinge[0],closed[1]-hinge[1]),height});
 // Party wall, continued through both facades.
 wall('z',-12.205,-21.44,-11.2,[],.25);d.walls.push(rect(-12.33,-21.98,-12.08,-21.45),rect(-12.45,-11.19,-11.95,-10.66));
 d.windows=d.windows.filter(w=>!(Math.abs(w[0]+19.30527)<.01&&w[1]<-21.9)&&!(Math.abs(w[0]+13.52646)<.01&&w[1]>-11.3&&w[1]<-11.1));
 d.windows.push([-19.30527,-21.9765,6.975,.53015],[-12.08,-21.9765,4.175,.53015],[-13.52646,-11.19396,1.07,.5301],[-11.95,-11.19396,1.67,.5301]);
 // 1.02: bedroom and hall to the north, bathroom on the party wall.
 wall('x',-14.4,-19.63,-14.55);wall('z',-14.55,-14.4,-11.2,[[-13.4,-12.55]]);
 wall('z',-14.55,-18.4,-15.6);wall('x',-18.4,-14.55,-12.33);wall('x',-15.6,-14.55,-12.33,[[-14.3,-13.6]]);
 door('1.02','vstup',[-13.45,-10.93],[-12.55,-10.93],[-13.45,-11.83],2.25);
 door('1.02','spálňa',[-14.55,-13.38],[-14.55,-12.57],[-13.74,-13.38]);
 door('1.02','kúpeľňa',[-14.28,-15.6],[-13.62,-15.6],[-14.28,-14.94]);
 // 1.07: mirror image.
 wall('x',-14.4,-9.95,-4.79);wall('z',-9.95,-14.4,-11.2,[[-13.4,-12.55]]);
 wall('z',-9.95,-18.4,-15.6);wall('x',-18.4,-12.08,-9.95);wall('x',-15.6,-12.08,-9.95,[[-10.8,-10.14]]);
 door('1.07','vstup',[-11.9,-10.93],[-11.0,-10.93],[-11.9,-11.83],2.25);
 door('1.07','spálňa',[-9.95,-13.38],[-9.95,-12.57],[-10.76,-13.38]);
 door('1.07','kúpeľňa',[-10.12,-15.6],[-10.78,-15.6],[-10.12,-14.94]);
}
export const apartmentFurniture=[];
export function apartmentBarrierAt(x,z,y){return y>-.15&&y<2&&(apartmentFurniture.some(r=>x>r[0]-.16&&x<r[2]+.16&&z>r[1]-.16&&z<r[3]+.16)||livingPits.some(p=>x>p.x0-.1&&x<p.x1+.1&&z>p.z0-.1&&z<p.z1+.1))};
export function buildPoolApartment(){
 const g=new T.Group();g.name='Byty 1.02 a 1.07 v bývalej bazénovej hale';apartmentFurniture.length=0;
 const wood=surface('wood'),oak=wood.clone();oak.color.set(0xb08a63);
 const white=new T.MeshStandardMaterial({color:0xf2f1ec,roughness:.3}),cream=new T.MeshStandardMaterial({color:0xebe7dc,roughness:.9});
 const fabric=new T.MeshStandardMaterial({color:0x7a5d4a,roughness:.95}),fabric2=new T.MeshStandardMaterial({color:0x52656a,roughness:.95}),dark=new T.MeshStandardMaterial({color:0x2a2f31,roughness:.5,metalness:.2});
 const stone=new T.MeshStandardMaterial({color:0xcfc8ba,roughness:.5}),mosaic=new T.MeshStandardMaterial({color:0x5f9ea6,roughness:.25}),pitFloor=oak.clone();pitFloor.color.set(0x9c7650);
 const steel=new T.MeshStandardMaterial({color:0xa9b0b2,metalness:.85,roughness:.25}),lamp=new T.MeshStandardMaterial({color:0xfff1d6,emissive:0xffdcaa,emissiveIntensity:.6}),glass=glassMaterial();
 const box=(name,x,y,z,sx,sy,sz,m,solid=false)=>{const o=new T.Mesh(new T.BoxGeometry(sx,sy,sz),m);o.position.set(x,y,z);o.name=name;o.castShadow=sy>.08&&!m.transparent;o.receiveShadow=true;g.add(o);if(solid)apartmentFurniture.push([x-sx/2,z-sz/2,x+sx/2,z+sz/2]);return o};
 // Oak floor with openings over the two pits.
 {const shape=new T.Shape([[-19.6,-21.42],[-4.82,-21.42],[-4.82,-11.22],[-19.6,-11.22]].map(([x,z])=>new T.Vector2(x,-z)));
  for(const p of livingPits)shape.holes.push(new T.Path([[p.x0,p.z0],[p.x0,p.z1],[p.x1,p.z1],[p.x1,p.z0]].map(([x,z])=>new T.Vector2(x,-z))));
  const geo=new T.ExtrudeGeometry(shape,{depth:.02,bevelEnabled:false});geo.rotateX(-Math.PI/2);const o=new T.Mesh(geo,oak);o.receiveShadow=true;o.name='Dubová podlaha bytov';g.add(o)}
 // Conversation pits in the old basin: oak floor, upholstered U-bench, mosaic rim band, three steps.
 livingPits.forEach((p,k)=>{const cx=(p.x0+p.x1)/2,cz=(p.z0+p.z1)/2,L=p.x1-p.x0,W=p.z1-p.z0,y=-p.depth;
  box('Podlaha obývacej jamy',cx,y+.01,cz,L,.02,W,pitFloor);
  for(const [x,z,sx,sz] of [[cx,p.z0+.01,L,.02],[cx,p.z1-.01,L,.02],[p.x0+.01,cz,.02,W],[p.x1-.01,cz,.02,W]])box('Stena jamy',x,y/2,z,sx,p.depth,sz,stone);
  for(const [x,z,sx,sz] of [[cx,p.z0-.06,L+.24,.12],[cx,p.z1+.06,L+.24,.12],[p.x0-.06,cz,.12,W],[p.x1+.06,cz,.12,W]])box('Lem z pôvodnej mozaiky bazéna',x,.012,z,sx,.025,sz,mosaic);
  const back=k?p.x1:p.x0,dir=k?-1:1;
  box('Lavica obývacej jamy',back+dir*.33,y+.22,cz,.62,.44,W-.1,fabric);box('Operadlo lavice',back+dir*.06,y+.42,cz,.1,.5,W-.1,fabric);
  box('Lavica obývacej jamy',cx,y+.22,p.z0+.32,L-.1,.44,.6,fabric);box('Operadlo lavice',cx,y+.42,p.z0+.06,L-.1,.5,.1,fabric);
  for(let i=0;i<4;i++)box('Vankúš',back+dir*.33,y+.5,p.z0+.9+i*.55,.5,.12,.45,fabric2);
  box('Konferenčný stolík v jame',cx+dir*.35,y+.3,cz+.15,1.1,.06,.8,oak);
  for(let i=0;i<3;i++)box('Schod do jamy',k?p.x0+.5:p.x1-.5,y+(i+1)*.15-.075,p.z1-.25-(2-i)*.3,.9,.15,.3,oak);
  box('Závesné svietidlo nad jamou',cx,2.15,cz,.5,.25,.5,lamp);
 });
 // 1.02 (east of the pair): kitchen and dining by the south glazing.
 box('Kuchynská linka 1.02',-19.3,.45,-19.85,.62,.9,3.0,white,true);box('Pracovná doska',-19.3,.92,-19.85,.64,.04,3.0,stone);box('Varná doska',-19.3,.945,-19.3,.5,.01,.6,dark);box('Drez',-19.3,.945,-20.6,.42,.02,.5,steel);
 box('Vysoká skriňa',-19.3,1.1,-18.05,.62,2.2,.62,white,true);
 box('Jedálenský stôl 1.02',-16.6,.75,-20.2,1.8,.05,.9,oak,true);for(const dx of [-.6,0,.6])for(const sz of [-1,1])box('Stolička',-16.6+dx,.47,-20.2+sz*.7,.42,.06,.42,dark,true);
 box('Sedačka pri okne 1.02',-14.0,.4,-20.9,2.4,.8,.85,fabric2,true);box('TV a knižnica',-12.55,1.1,-17.0,.3,2.2,2.2,oak);
 // 1.07 (west of the pair): mirror image with kitchen on the solid wall part.
 box('Kuchynská linka 1.07',-5.12,.45,-19.85,.62,.9,3.0,white,true);box('Pracovná doska',-5.12,.92,-19.85,.64,.04,3.0,stone);box('Varná doska',-5.12,.945,-19.3,.5,.01,.6,dark);box('Drez',-5.12,.945,-20.6,.42,.02,.5,steel);
 box('Vysoká skriňa',-5.12,1.1,-18.05,.62,2.2,.62,white,true);
 box('Jedálenský stôl 1.07',-7.9,.75,-20.2,1.8,.05,.9,oak,true);for(const dx of [-.6,0,.6])for(const sz of [-1,1])box('Stolička',-7.9+dx,.47,-20.2+sz*.7,.42,.06,.42,dark,true);
 box('Sedačka pri okne 1.07',-10.4,.4,-20.9,2.4,.8,.85,fabric2,true);
 // Bathrooms back to back on the party wall (shared riser).
 for(const [s,x0,x1] of [[1,-14.55,-12.33],[-1,-12.08,-9.95]]){const cx=(x0+x1)/2;
  box('Sprchový kút',s>0?x1-.5:x0+.5,.03,-17.85,.9,.06,.9,white);box('Sklo sprchy',s>0?x1-.95:x0+.95,1.05,-17.85,.01,2,.9,glass);
  box('WC',s>0?x1-.3:x0+.3,.26,-16.55,.62,.52,.42,white,true);box('Umývadlo',s>0?x0+.3:x1-.3,.85,-17.3,.42,.12,.5,white,true);box('Stúpačka v inštalačnej šachte',s>0?x1-.12:x0+.12,1.3,-16.0,.2,2.6,.3,steel)}
 // Bedrooms on the north side.
 box('Manželská posteľ 1.02',-17.4,.25,-12.45,1.8,.5,2.05,white,true);box('Prikrývka',-17.4,.53,-12.6,1.8,.06,1.7,cream);box('Čelo postele',-17.4,.7,-11.35,1.9,.9,.08,oak);box('Šatník',-19.3,1.1,-13.0,.6,2.2,2.0,white,true);
 box('Manželská posteľ 1.07',-7.2,.25,-12.45,1.8,.5,2.05,white,true);box('Prikrývka',-7.2,.53,-12.6,1.8,.06,1.7,cream);box('Čelo postele',-7.2,.7,-11.35,1.9,.9,.08,oak);box('Šatník',-5.12,1.1,-13.0,.6,2.2,2.0,white,true);
 // Entrance halls with wardrobes.
 box('Vstavaná skriňa 1.02',-14.2,1.1,-12.8,.6,2.2,1.4,white,true);box('Vstavaná skriňa 1.07',-10.3,1.1,-12.8,.6,2.2,1.4,white,true);
 for(const [x,z] of [[-16.6,-20.2],[-7.9,-20.2],[-17.4,-12.9],[-7.2,-12.9],[-13.4,-17],[-11.0,-17]])box('Stropné svetlo',x,2.48,z,.45,.03,.45,lamp);
 return g;
}

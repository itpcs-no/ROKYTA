import * as T from 'three';
import {surface,glassMaterial} from './surface-materials.js';
import {outsideRectangle} from './caretaker-house.js';

// East end of the long wing (model -x), ground floor (former rooms 1.19-1.23 beside the
// lap pool). Wet rooms sit against the existing sanitary column (1.19-1.21),
// so sauna, steam generator, showers and floor drains share one short drain
// run and one ventilation riser. The gym takes the daylit corner by the pool.
export const indoorWellness={
 zone:{x0:-28.29,x1:-19.78,z0:-21.44,z1:-15.71},
 gym:{x0:-28.3,x1:-23.91,z0:-21.45,z1:-15.71},
 sauna:{x0:-23.79,x1:-21.41,z0:-21.45,z1:-18.91},
 steam:{x0:-21.29,x1:-19.77,z0:-21.45,z1:-18.91},
 showers:{x0:-23.79,x1:-19.77,z0:-18.79,z1:-15.71},
 office:{x0:-21.6,x1:-19.75,z0:-14.19,z1:-11.19},
 terraceDoor:{x:-28.565,z0:-17.8,z1:-15.9},
 entry:{x:-26.2,z:-18.4},target:{x:-24.6,y:1.2,z:-18.6}
};
const rect=(a,b,c,d)=>[[a,b],[c,b],[c,d],[a,d]];
export function applyIndoorWellness(data){
 const d=data[0],w=indoorWellness;
 // Clear the old partitions of room 1.23 and the column (1.19-1.21), keeping
 // the column's south wall and door to the corridor.
 for(const mask of [{x0:-28.29,x1:-21.6,z0:-21.44,z1:-15.71},{x0:-21.6,x1:-19.78,z0:-21.44,z1:-16.05}])d.walls=d.walls.flatMap(p=>outsideRectangle(p,mask));
 // The column's two doors into the former pool hall now open into the flat's
 // bedroom; close them and continue the wall.
 d.doors=d.doors.filter(p=>!(Math.abs(p.hinge[0]+19.635)<.02&&p.hinge[1]<-18&&p.hinge[1]>-21));
 d.walls.push(rect(-19.77,-20.44,-19.63,-19.74),rect(-19.77,-18.84,-19.63,-18.14));
 // The flat beside the fitness gets its own front door from the south walkway;
 // its old door into the fitness corridor is walled up.
 d.doors=d.doors.filter(p=>!(p.name||'').endsWith('· vstup')||!(p.name||'').startsWith('Byt pri bývalom bazéne'));
 d.walls.push(rect(-19.77,-16.05,-19.63,-14.3));
 d.doors=d.doors.filter(p=>!(p.name||'').startsWith('Byt pri bývalom bazéne'));
 d.doors.push({name:'Byt 1.02 · vlastný vstup',hinge:[-7.3,-10.93],closed:[-6.3,-10.93],open:[-7.3,-11.93],width:1,height:2.25});
 // Two separate entrances: fitness from the pool terrace (glazed doors), sauna
 // from the courtyard walkway through hall 1.24; the hall's door into the gym is closed.
 d.doors=d.doors.filter(p=>!(p.hinge[0]>-25.45&&p.hinge[0]<-24.3&&p.hinge[1]>-15.85&&p.hinge[1]<-15.35));
 d.walls.push(rect(-25.36,-15.71,-24.34,-15.49));
 for(const mask of [{x0:-26.55,x1:-25.45,z0:-11.35,z1:-10.6}])d.walls=d.walls.flatMap(p=>outsideRectangle(p,mask));
 d.doors.push({name:'Wellness · vstup do sauny',hinge:[-26.5,-10.99],closed:[-25.5,-10.99],open:[-26.5,-11.95],width:1,height:2.25});
 const wall=(axis,f,a,b,gaps=[],t=.12)=>{let start=a;for(const [lo,hi] of [...gaps,[b,b]]){if(lo>start)d.walls.push(axis==='x'?rect(start,f-t/2,lo,f+t/2):rect(f-t/2,start,f+t/2,lo));start=hi}};
 const door=(name,hinge,closed,open,height=2.1)=>d.doors.push({name:'Wellness · '+name,hinge,closed,open,width:Math.hypot(closed[0]-hinge[0],closed[1]-hinge[1]),height});
 // Gym | wet zone, with a door at the shower end.
 wall('z',-23.85,-21.44,-15.71,[[-17.25,-16.35]]);
 door('telocvičňa – sprchy',[-23.85,-17.22],[-23.85,-16.38],[-23.0,-17.22]);
 // Sauna and steam room front wall with their two glass doors.
 wall('x',-18.85,-23.85,-19.78,[[-23.25,-22.55],[-21.15,-20.45]]);
 wall('z',-21.35,-21.44,-18.85);
 door('sauna',[-23.22,-18.85],[-22.58,-18.85],[-23.22,-18.2],2.0);
 door('parná kúpeľ',[-21.12,-18.85],[-20.48,-18.85],[-21.12,-18.2],2.0);
 // Glazed door from the gym straight onto the pool terrace link.
 door('terasa',[w.terraceDoor.x,w.terraceDoor.z0],[w.terraceDoor.x,(w.terraceDoor.z0+w.terraceDoor.z1)/2],[w.terraceDoor.x+.94,w.terraceDoor.z0],2.25);
 door('terasa 2',[w.terraceDoor.x,w.terraceDoor.z1],[w.terraceDoor.x,(w.terraceDoor.z0+w.terraceDoor.z1)/2],[w.terraceDoor.x+.94,w.terraceDoor.z1],2.25);
}
export const indoorWellnessFurniture=[];
export function indoorWellnessBarrierAt(x,z,y){return y>-.15&&y<2&&indoorWellnessFurniture.some(r=>x>r[0]-.15&&x<r[2]+.15&&z>r[1]-.15&&z<r[3]+.15)}
export function buildIndoorWellness(){
 const g=new T.Group();g.name='Fitness s suchou a parnou saunou';indoorWellnessFurniture.length=0;
 const w=indoorWellness,wood=surface('wood'),tile=surface('paving');
 const cedar=wood.clone();cedar.color.set(0xc79a62);
 const aspen=wood.clone();aspen.color.set(0xe7d0a8);
 const rubber=new T.MeshStandardMaterial({color:0x30363a,roughness:.92});
 const black=new T.MeshStandardMaterial({color:0x1c2124,roughness:.45,metalness:.3});
 const steel=new T.MeshStandardMaterial({color:0xa6adb0,metalness:.86,roughness:.24});
 const white=new T.MeshStandardMaterial({color:0xf2f1ec,roughness:.3});
 const stone=new T.MeshStandardMaterial({color:0x8e9493,roughness:.55});
 const mosaic=new T.MeshStandardMaterial({color:0x9fb8b8,roughness:.22,metalness:.05});
 const towel=new T.MeshStandardMaterial({color:0xece6d8,roughness:.97});
 const mirror=new T.MeshStandardMaterial({color:0xd8e0e2,metalness:1,roughness:.04});
 const lamp=new T.MeshStandardMaterial({color:0xfff1d6,emissive:0xffdcaa,emissiveIntensity:.6});
 const glass=glassMaterial();
 const box=(name,x,y,z,sx,sy,sz,m,solid=false)=>{const o=new T.Mesh(new T.BoxGeometry(sx,sy,sz),m);o.position.set(x,y,z);o.name=name;o.castShadow=sy>.08&&!m.transparent;o.receiveShadow=true;g.add(o);if(solid)indoorWellnessFurniture.push([x-sx/2,z-sz/2,x+sx/2,z+sz/2]);return o};
 const cyl=(name,x,y,z,r,h,m,axis='y')=>{const o=new T.Mesh(new T.CylinderGeometry(r,r,h,20),m);if(axis==='x')o.rotation.z=Math.PI/2;if(axis==='z')o.rotation.x=Math.PI/2;o.position.set(x,y,z);o.name=name;o.castShadow=true;o.receiveShadow=true;g.add(o);return o};
 const area=(r,name,m,y=.016)=>box(name,(r.x0+r.x1)/2,y,(r.z0+r.z1)/2,r.x1-r.x0-.02,.03,r.z1-r.z0-.02,m);
 // Floors: sports rubber in the gym, slip-resistant stone in the wet zone.
 area(w.gym,'Športová podlaha telocvične',rubber);
 area({x0:w.sauna.x0,x1:w.steam.x1,z0:w.showers.z0,z1:w.showers.z1},'Protišmyková dlažba spŕch',stone);
 area(w.steam,'Mozaika parnej kúpele',mosaic);area(w.sauna,'Drevený rošt sauny',cedar);
 // Gym equipment: treadmill, upright bike, dumbbell rack with bench, mirror wall.
 {const x=-27.35,z=-20.2;box('Bežecký pás – základňa',x,.12,z,.82,.2,1.9,black,true);box('Bežecký pás – pás',x,.235,z+.1,.56,.03,1.5,rubber);
  for(const dx of [-.36,.36])box('Bežecký pás – stĺpik',x+dx,.75,z-.86,.06,1.2,.08,black);box('Bežecký pás – konzola',x,1.38,z-.84,.78,.1,.32,black);box('Bežecký pás – displej',x,1.47,z-.8,.38,.2,.03,lamp)}
 {const x=-25.4,z=-20.55;box('Rotoped – rám',x,.38,z,.5,.08,1.1,black,true);box('Rotoped – zotrvačník',x,.36,z-.38,.12,.46,.46,steel);box('Rotoped – stĺpik sedla',x,.68,z+.25,.05,.62,.05,black);box('Rotoped – sedlo',x,1.0,z+.27,.18,.06,.28,rubber);box('Rotoped – riadidlá',x,1.12,z-.32,.5,.05,.06,black);box('Rotoped – stĺpik riadidiel',x,.78,z-.3,.05,.72,.05,black)}
 {const x=-28.0,z=-17.9;box('Stojan na činky',x,.45,z,.42,.9,1.5,steel,true);for(let i=0;i<5;i++)for(const y of [.62,.25]){const zz=z-.6+i*.3;cyl('Jednoručka',x+.02,y,zz,.055+i*.006,.34,black,'x')}}
 {box('Posilňovacia lavica',-26.2,.42,-17.1,.36,.08,1.25,rubber,true);box('Lavica – podstavec',-26.2,.2,-17.1,.1,.36,1.0,black)}
 box('Zrkadlová stena telocvične',-23.94,1.3,-18.6,.02,1.8,4.1,mirror);
 box('Televízor v telocvični',-28.25,1.8,-19.0,.05,.55,.95,black);
 // Sauna: cedar lining, two bench tiers, heater with stones, glass door.
 {const s=w.sauna;
  box('Obklad sauny',s.x0+.03,1.15,(s.z0+s.z1)/2,.04,2.2,s.z1-s.z0-.04,cedar);box('Obklad sauny',s.x1-.03,1.15,(s.z0+s.z1)/2,.04,2.2,s.z1-s.z0-.04,cedar);box('Obklad sauny',(s.x0+s.x1)/2,1.15,s.z0+.03,s.x1-s.x0,2.2,.04,cedar);
  box('Strop sauny',(s.x0+s.x1)/2,2.18,(s.z0+s.z1)/2,s.x1-s.x0,.04,s.z1-s.z0,cedar);
  box('Horná lavica sauny',(s.x0+s.x1)/2,1.0,s.z0+.36,s.x1-s.x0-.1,.06,.62,aspen,true);box('Dolná lavica sauny',(s.x0+s.x1)/2,.5,s.z0+.95,s.x1-s.x0-.1,.06,.5,aspen,true);
  for(const x of [s.x0+.3,s.x1-.3])box('Podpera lavice',x,.5,s.z0+.6,.06,1,.06,cedar);
  box('Saunová pec',s.x1-.38,.42,s.z1-.45,.46,.84,.42,black,true);box('Kamene pece',s.x1-.38,.9,s.z1-.45,.42,.14,.38,stone);
  box('Svetlo sauny',(s.x0+s.x1)/2,1.75,s.z0+.06,1.6,.04,.04,lamp)}
 // Steam room: mosaic bench along the long side, vaulted ceiling, generator in the column.
 {const s=w.steam;box('Lavica parnej kúpele',s.x0+.32,.45,(s.z0+s.z1)/2,.5,.9,s.z1-s.z0-.12,mosaic,true);
  box('Obklad parnej kúpele',s.x1-.02,1.15,(s.z0+s.z1)/2,.03,2.2,s.z1-s.z0,mosaic);box('Strop parnej kúpele',(s.x0+s.x1)/2,2.2,(s.z0+s.z1)/2,s.x1-s.x0,.05,s.z1-s.z0,mosaic);
  box('Parná tryska',s.x1-.05,.35,s.z0+.4,.04,.08,.12,steel);box('Svetlo parnej kúpele',(s.x0+s.x1)/2,2.16,(s.z0+s.z1)/2,.15,.02,.15,lamp)}
 // Showers on the shared wet wall, with a linear drain; bench and towel shelf opposite.
 {const s=w.showers;for(const z of [-18.25,-17.2]){box('Hlavová sprcha',s.x1-.25,2.15,z,.3,.02,.3,steel);box('Sprchová batéria',s.x1-.03,1.1,z,.04,.2,.1,steel)}
  box('Sklenená zástena spŕch',s.x1-.95,1.05,-17.72,.012,2,.9,glass);box('Líniový žľab',s.x1-.6,.036,(s.z0+s.z1)/2,.08,.01,s.z1-s.z0-.4,steel);
  box('Lavica pri sprchách',-23.3,.45,-16.9,.45,.06,1.35,aspen,true);box('Polica na uteráky',-23.6,1.3,-16.9,.3,.04,1.3,aspen);
  for(let i=0;i<4;i++)box('Uterák',-23.6,1.35,-17.4+i*.33,.28,.06,.28,towel);
  for(const [x,z] of [[-22.8,-17.6],[-21,-16.5]])box('Stropné svetlo',x,2.47,z,.5,.04,.5,lamp)}
 for(const [x,z] of [[-27.2,-19.6],[-25.2,-19.6],[-27.2,-17.3],[-25.2,-17.3]])box('Stropné svetlo telocvične',x,2.47,z,.9,.04,.24,lamp);
 // Former room 1.22: towels, cleaning and the sauna/steam control cabinet.
 {const o=w.office;box('Regál na uteráky',o.x0+.22,1.0,-12.7,.4,2,2.2,white,true);for(let i=0;i<4;i++)box('Uteráky',o.x0+.24,.45+i*.45,-12.7,.34,.22,2.0,towel);
  box('Rozvádzač sauny a parného generátora',o.x1-.12,1.3,-13.4,.2,.9,.6,steel,true);box('Parný generátor',o.x1-.25,.4,-12.0,.45,.7,.35,white,true)}
 // Strength machines: cable station in the gym, leg press and chest press in the stair hall's east bay.
 function machine(name,x,z,sx,sz,h){box(name+' – rám',x,h/2,z-sz/2+.06,sx,h,.08,black,true);box(name+' – základňa',x,.06,z,sx,.12,sz,black,true);box(name+' – závažia',x+sx/2-.12,h*.42,z-sz/2+.18,.18,h*.7,.14,steel);box(name+' – sedadlo',x,.5,z+.1,.5,.08,.55,rubber);box(name+' – operadlo',x,.85,z+sz/2-.25,.5,.6,.08,rubber);box(name+' – rukoväte',x,1.1,z-.15,sx*.85,.04,.04,steel)}
 machine('Kladkový posilňovací stroj',-24.75,-18.2,1.3,1.4,2.1);
 machine('Leg press',-22.8,-13.0,1.0,1.9,1.4);
 machine('Bench press stroj',-24.2,-12.1,1.1,1.2,1.7);
 box('Gumená podlaha posilňovne',-23.3,.016,-13.3,2.8,.03,4.1,rubber);
 g.userData.rooms=['Fitness: kardio a posilňovňa','Suchá sauna','Parná sauna','Sprchy','Sklad wellness'];
 return g;
}

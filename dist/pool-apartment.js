import * as T from 'three';
import {surface} from './surface-materials.js';
import {outsideRectangle} from './caretaker-house.js';
export const apartment={x0:-19.63,x1:-4.79,z0:-21.44,z1:-11.20,entry:{x:-19.7,z:-14.86}};
const rect=(a,b,c,d)=>[[a,b],[c,b],[c,d],[a,d]];
export function applyPoolApartment(data){
 const d=data[0];
 // Replace only the pool hall's small shower stalls. Retain its perimeter and stair lobby.
 const mask={x0:-19.62,x1:-4.781,z0:-21.44,z1:-11.2};
 d.walls=d.walls.flatMap(p=>outsideRectangle(p,mask));
 d.doors=d.doors.filter(p=>!(p.hinge[0]>mask.x0&&p.hinge[0]<mask.x1&&p.hinge[1]>mask.z0&&p.hinge[1]<mask.z1));
 const wall=(axis,f,a,b,gaps=[],t=.14)=>{let start=a;for(const [lo,hi] of [...gaps,[b,b]]){if(lo>start)d.walls.push(axis==='x'?rect(start,f-t/2,lo,f+t/2):rect(f-t/2,start,f+t/2,lo));start=hi;}};
 const door=(name,hinge,closed,open)=>d.doors.push({name:'Byt pri bývalom bazéne · '+name,hinge,closed,open,width:Math.hypot(closed[0]-hinge[0],closed[1]-hinge[1]),height:2.18});
 wall('x',-17,-19.63,-9.5,[[-18.55,-17.47],[-13.1,-12.02]]);
 wall('z',-14.55,-21.44,-17);
 wall('z',-9.5,-21.44,-17);
 wall('z',-8.1,-21.44,-17.5);
 wall('x',-17.5,-8.1,-4.79,[[-6.95,-5.87]]);
 door('spálňa',[-18.5,-17],[-17.52,-17],[-18.5,-17.98]);
 door('druhá izba',[-13.05,-17],[-12.07,-17],[-13.05,-17.98]);
 door('kúpeľňa',[-6.9,-17.5],[-5.92,-17.5],[-6.9,-18.48]);
 // Existing vestibule opening: a proper apartment entrance without opening the adjacent apartment.
 wall('z',-19.70,-15.86,-14.31,[[-15.45,-14.31]]);
 door('vstup',[-19.70,-15.4],[-19.70,-14.36],[-18.66,-15.4]);
 // Split the long north glazing at the new bedroom party wall for privacy.
 d.windows=d.windows.flatMap(w=>Math.abs(w[0]+19.30527)<.001&&w[1]<-21?
 [[w[0],w[1],4.68,w[3]],[-14.48,w[1],4.91,w[3]],[-9.43,w[1],1.525,w[3]]]:[w]);
 d.walls.push(rect(-14.625,-21.9765,-14.48,-21.44635),rect(-9.57,-21.9765,-9.43,-21.44635));
}
export const apartmentFurniture=[];
export function apartmentBarrierAt(x,z,y){return y>-.15&&y<2&&apartmentFurniture.some(r=>x>r[0]-.16&&x<r[2]+.16&&z>r[1]-.16&&z<r[3]+.16)};
export function buildPoolApartment(){
 const g=new T.Group();g.name='Byt na mieste vnútorného bazéna';apartmentFurniture.length=0;
 const wood=surface('wood'),plaster=surface('plaster'),tile=surface('paving');
 const cream=new T.MeshStandardMaterial({color:0xebe7dc,roughness:.9}),fabric=new T.MeshStandardMaterial({color:0x52656a,roughness:.95}),white=new T.MeshStandardMaterial({color:0xf0eeea,roughness:.27}),dark=new T.MeshStandardMaterial({color:0x252d31,roughness:.4}),metal=new T.MeshStandardMaterial({color:0x979d9e,metalness:.85,roughness:.23});
 const box=(name,x,y,z,w,h,d,m=wood,solid=false)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.name=name;o.castShadow=h>.08;o.receiveShadow=true;g.add(o);if(solid)apartmentFurniture.push([x-w/2,z-d/2,x+w/2,z+d/2]);return o;};
 box('Dubová podlaha bytu',-12.21,.014,-16.32,14.82,.028,10.24,wood);
 box('Dlažba kúpeľne',-6.44,.032,-19.47,3.18,.024,3.8,tile);
 function bed(name,x,z,w){box(name,x,.22,z,w,.44,2.1,wood,true);box('Matrac',x,.52,z,w-.06,.18,2.04,cream);box('Prikrývka',x,.635,z+.23,w-.07,.07,1.5,fabric);box('Čelo',x,.65,z-1.08,w+.08,1.1,.1);for(const dx of w>1.4?[-.43,.43]:[0])box('Vankúš',x+dx,.68,z-.7,.65,.14,.4,white);}
 bed('Manželská posteľ',-16.35,-19.8,1.8);bed('Posteľ v druhej izbe',-10.35,-19.8,1.1);
 box('Úložná skriňa v chodbe',-8.8,1.1,-20.9,1.05,2.2,.62,cream,true);
 box('Šatníková skriňa spálne',-19.22,1.12,-20.05,.62,2.24,2.2,cream,true);
 box('Šatníková skriňa druhej izby',-14.13,1.12,-20.12,.62,2.24,2.1,cream,true);
 box('Písací stôl',-11.3,.75,-17.7,1.35,.08,.58,wood,true);for(const x of [-11.87,-10.73])box('Nohy stola',x,.37,-17.7,.055,.7,.48,dark);
 box('Stolička k písaciemu stolu',-11.3,.45,-18.35,.48,.08,.48,fabric,true);box('Operadlo',-11.3,.75,-18.55,.48,.55,.07,fabric);
 box('Kuchynská linka',-5.22,.44,-13.8,.7,.88,3.8,cream,true);box('Kamenná pracovná doska',-5.22,.91,-13.8,.74,.055,3.85,white);
 box('Chladnička',-5.22,1.06,-16.05,.72,2.12,.72,metal,true);
 box('Drez',-5.21,.944,-14.65,.47,.023,.6,dark);box('Batéria',-4.98,1.1,-14.65,.04,.32,.04,metal);
 box('Varná doska',-5.2,.947,-12.95,.53,.025,.63,dark);box('Rúra',-5.582,.47,-12.95,.02,.49,.56,dark);
 for(let z=-15.3;z<-12;z+=.64){box('Kuchynské úchytky',-5.585,.77,z,.035,.025,.32,metal);box('Horné kuchynské skrinky',-5.02,1.91,z,.38,.65,.61,cream);}
 box('Jedálenská doska',-9.2,.76,-13.1,2.1,.08,1.05,wood,true);for(const x of [-10.05,-8.35])for(const z of [-13.48,-12.72])box('Nohy stola',x,.36,z,.07,.72,.07,dark);
 for(const x of [-9.9,-9.2,-8.5])for(const z of [-13.96,-12.24]){box('Jedálenská stolička',x,.46,z,.46,.09,.48,fabric,true);box('Operadlo stoličky',x,.73,z+(z<-13?-.21:.21),.46,.55,.065,fabric);}
 box('Koberec obývačky',-14.8,.035,-13.1,4.6,.015,3.2,cream);
 box('Pohovka',-15.1,.38,-15.35,3.1,.65,.95,fabric,true);box('Operadlo pohovky',-15.1,.81,-15.73,3.1,.48,.18,fabric);
 for(const x of [-16.55,-13.65])box('Opierka',x,.58,-15.35,.2,.55,.95,fabric);
 box('Konferenčný stolík',-15.1,.37,-13.8,1.2,.1,.65,wood,true);box('Podnož stolíka',-15.1,.17,-13.8,.65,.34,.35,dark);
 box('TV skrinka',-18.99,.32,-12.7,.55,.64,2,wood,true);box('Televízor',-18.68,1.25,-12.7,.065,.85,1.5,dark);
 box('Sprchová vanička',-7.32,.09,-20.65,1.35,.12,1.35,white,true);box('Sprchový panel',-7.94,1.24,-20.65,.06,2,.27,metal);
 const glass=new T.MeshPhysicalMaterial({color:0xd3e6e8,transparent:true,opacity:.25,roughness:.08,depthWrite:false});box('Sprchové sklo',-7.3,1.05,-19.99,1.3,2,.025,glass);
 box('Umývadlová skrinka',-5.24,.43,-19.16,.65,.86,1.4,wood,true);box('Umývadlo',-5.24,.89,-19.16,.68,.085,1.42,white);box('Zrkadlo',-4.84,1.55,-19.16,.025,.9,1.35,metal);
 box('WC',-5.46,.26,-20.8,.48,.52,.68,white,true);box('Nádržka WC',-5.46,.63,-21.06,.49,.53,.18,white);
 for(const [x,z] of [[-16.8,-19],[-12,-19],[-6.4,-19.3],[-14.6,-13],[-8.2,-14]]){const lamp=box('Stropné svietidlo',x,2.46,z,.6,.06,.6,new T.MeshStandardMaterial({color:0xffefd5,emissive:0xffddb0,emissiveIntensity:.45}));const light=new T.PointLight(0xffe6c4,5,6,2);light.position.set(x,2.3,z);g.add(light);}
 g.userData.rooms=['Spálňa','Druhá izba','Kúpeľňa','Obývačka s kuchyňou a jedálňou'];return g;
}

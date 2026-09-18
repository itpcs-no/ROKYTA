import * as T from 'three';
import {surface} from './surface-materials.js';
import {batchStaticMeshes} from './static-batching.js';
import {levels} from './project-geometry.js';
const barriers=[[],[],[],[]];
export function furnishingsBarrierAt(x,z,y){const f=levels.findIndex(h=>y>=h-.18&&y<h+2);return f>=0&&barriers[f].some(r=>x>r[0]-.10&&x<r[2]+.10&&z>r[1]-.10&&z<r[3]+.10)}
export function buildApartmentFurnishings(f,records){
 const root=new T.Group();root.name=`Zariadenie bytov podľa pôdorysu · ${f+1}. NP`;barriers[f]=[];
 const wood=surface('wood'),cream=new T.MeshStandardMaterial({color:0xe4dfd5,roughness:.78}),white=new T.MeshStandardMaterial({color:0xf2f0e9,roughness:.22}),fabric=new T.MeshStandardMaterial({color:[0x667980,0x84715e,0x586960][f]??0x667980,roughness:.96}),linen=new T.MeshStandardMaterial({color:0xe9e5de,roughness:1}),dark=new T.MeshStandardMaterial({color:0x252c31,roughness:.28}),metal=new T.MeshStandardMaterial({color:0xb6bdc0,metalness:.85,roughness:.23}),glass=new T.MeshPhysicalMaterial({color:0xd9edf0,transparent:true,opacity:.22,roughness:.08,depthWrite:false});
 const cube=new T.BoxGeometry(1,1,1),ball=new T.SphereGeometry(1,12,8),cylinder=new T.CylinderGeometry(1,1,1,12);
 function mesh(g,name,x,y,z,w,h,d,m=wood,geo=cube){const o=new T.Mesh(geo,m);o.name=name;o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=!m.transparent;o.receiveShadow=true;g.add(o);return o;}
 const labels={chair:'Jedálenská stolička',bed:'Posteľ',sofa:'Pohovka',coffee:'Konferenčný stolík',kitchen:'Kuchynská linka',wardrobe:'Šatníková skriňa',dining:'Jedálenský stôl',desk:'Písací stôl',bath:'Vaňa',wc:'WC',vanity:'Umývadlo',shower:'Sprcha'};
 records.forEach((r,index)=>{
  const g=new T.Group();g.name=`${labels[r.type]} · ${f+1}. NP / ${index+1}`;g.position.set((r.x0+r.x1)/2,0,(r.z0+r.z1)/2);g.userData.furniture={...r,floor:f};root.add(g);
  let w=r.x1-r.x0-.07,d=r.z1-r.z0-.07;
  const angle={n:0,e:-Math.PI/2,s:Math.PI,w:Math.PI/2}[r.side]??0;
  g.rotation.y=angle;if(r.side==='e'||r.side==='w')[w,d]=[d,w];
  const b=(name,x,y,z,ww,hh,dd,mat=wood)=>mesh(g,name,x,y,z,Math.max(.012,ww),Math.max(.012,hh),Math.max(.012,dd),mat);
  const leg=(x,z,h=.70)=>b('Noha',x,h/2,z,.045,h,.045,dark);
  const seat=(x,z,angle=0)=>{const q=new T.Group();q.position.set(x,0,z);q.rotation.y=angle;g.add(q);mesh(q,'Sedadlo',0,.46,0,.43,.09,.43,fabric);mesh(q,'Operadlo',0,.73,.19,.43,.51,.065,fabric);for(const xx of [-.16,.16])for(const zz of [-.16,.16])mesh(q,'Noha stoličky',xx,.22,zz,.035,.44,.035,metal);};
  switch(r.type){
   case 'chair':
    b('Sedadlo',0,.46,0,w,.08,d,fabric);b('Operadlo',0,.75,-d/2+.025,w,.54,.055,fabric);for(const x of [-w/2+.05,w/2-.05])for(const z of [-d/2+.05,d/2-.05])leg(x,z,.43);break;
   case 'bed':
    b('Rám postele',0,.23,0,w,.32,d);b('Matrac',0,.48,0,w-.035,.20,d-.035,linen);b('Prikrývka',0,.592,.19,w-.065,.045,Math.max(.3,d-.48),fabric);b('Čelo',0,.65,-d/2+.04,w,1.1,.08);
    for(const x of w>1.35?[-w*.24,w*.24]:[0])b('Vankúš',x,.63,-d/2+.33,Math.min(.65,w*.8),.14,.40,white);break;
   case 'sofa':
    b('Sokel',0,.16,0,w-.12,.20,d-.12,dark);b('Čalúnené sedadlo',0,.42,0,w,.32,d,fabric);b('Operadlo',0,.77,-d/2+.09,w,.48,.18,fabric);
    for(const x of [-w/2+.075,w/2-.075])b('Opierka',x,.61,0,.15,.55,d,fabric);
    for(let i=1;i<Math.round(w/.7);i++)b('Šev sedadla',-w/2+w*i/Math.round(w/.7),.586,0,.008,.006,d-.2,linen);break;
   case 'wardrobe':
    b('Korpus',0,1.08,0,w,2.16,d,cream);for(let i=0;i<Math.max(1,Math.round(w/.55));i++){const n=Math.max(1,Math.round(w/.55)),x=-w/2+w*(i+.5)/n;b('Dvere skrine',x,1.1,d/2+.006,w/n-.018,2.1,.024,wood);b('Úchytka',x+w/n*.30,1.08,d/2+.035,.018,.22,.027,metal);}break;
   case 'kitchen':{
    // Long counter runs follow the traced footprint and facing wall.
    b('Spodné skrinky',0,.44,0,w,.86,d,cream);b('Pracovná doska',0,.895,0,w+.025,.055,d+.025,white);
    const count=Math.max(1,Math.round(w/.6));for(let i=0;i<count;i++){const x=-w/2+w*(i+.5)/count;b('Dvierka linky',x,.46,d/2+.012,w/count-.018,.78,.025,wood);b('Úchytka',x,.76,d/2+.035,Math.min(.28,w/count*.6),.018,.025,metal);}
    if(w>2.7){const x=-w/2+.29;b('Chladnička',x,1.03,0,.56,2.06,d,metal);b('Dvere chladničky',x,1.36,d/2+.035,.54,1.27,.03,cream);b('Mraznička',x,.35,d/2+.035,.54,.63,.03,cream);b('Madlo chladničky',x+.2,1.15,d/2+.07,.026,.40,.035,metal);}
    if(w>1.5){const sinkX=-w*.25,hobX=w*.25;b('Drez',sinkX,.932,0,Math.min(.52,w*.26),.022,Math.min(.42,d*.7),metal);b('Vnútro drezu',sinkX,.947,0,Math.min(.42,w*.2),.012,Math.min(.32,d*.55),dark);b('Batéria',sinkX,.107+1,-d*.32,.032,.32,.032,metal);b('Výtok',sinkX,.123+1,-d*.18,.035,.035,d*.3,metal);b('Varná doska',hobX,.931,0,.52,.018,Math.min(.48,d*.8),dark);for(const dx of [-.14,.14])for(const dz of [-.12,.12])mesh(g,'Varná zóna',hobX+dx,.944,dz,.08,.004,.08,metal,cylinder);b('Rúra',hobX,.44,d/2+.032,.49,.42,.03,dark);}
    break;}
   case 'coffee':case 'desk':case 'dining':{
    const h=r.type==='coffee'?.40:.76;b('Doska stola',0,h,0,w,.07,d);for(const x of [-w/2+.09,w/2-.09])for(const z of [-d/2+.09,d/2-.09])leg(x,z,h-.045);
    // Chairs are confined to the traced dining zone, then tested against walls/doors below.
    if(r.type==='desk')seat(0,d/2+.3,0);
    break;}
   case 'bath':{
    b('Dno vane',0,.13,0,w,.18,d,white);const t=.08;for(const x of [-w/2+t/2,w/2-t/2])b('Bok vane',x,.36,0,t,.5,d,white);for(const z of [-d/2+t/2,d/2-t/2])b('Čelo vane',0,.36,z,w,.5,t,white);b('Vnútro vane',0,.235,0,w-.16,.015,d-.16,cream);b('Batéria vane',0,.68,-d/2+.08,.17,.045,.10,metal);break;}
   case 'shower':
    b('Sprchová vanička',0,.07,0,w,.12,d,white);b('Odtok',0,.134,0,.13,.01,.13,metal);b('Sprchový panel',0,1.13,-d/2+.04,.16,1.95,.055,metal);b('Hlavica sprchy',0,2.06,-d/2+.20,.22,.035,.26,metal);b('Sprchové sklo',-w/2+.015,1.06,0,.025,2,d,glass);break;
   case 'wc':
    b('Nádržka',0,.62,-d/2+.09,Math.min(w,.43),.45,.18,white);mesh(g,'Keramická misa',0,.34,d*.08,w*.47,.23,d*.39,white,ball);mesh(g,'Sedátko',0,.49,d*.08,w*.45,.025,d*.37,white,ball);mesh(g,'Otvor misy',0,.512,d*.09,w*.31,.009,d*.26,dark,ball);b('Podstavec WC',0,.16,.03,w*.51,.32,d*.44,white);b('Splachovanie',0,.86,-d/2+.09,.1,.018,.055,metal);break;
   case 'vanity':
    b('Skrinka pod umývadlom',0,.43,0,w,.80,d,wood);b('Keramická doska',0,.87,0,w+.015,.09,d+.015,white);b('Umývadlová misa',0,.922,0,w*.69,.012,d*.62,metal);b('Batéria umývadla',0,1.04,-d*.34,.035,.23,.035,metal);b('Zrkadlo',0,1.53,-d/2+.025,w*.94,.83,.025,metal);break;
  }
  barriers[f].push([r.x0+.035,r.z0+.035,r.x1-.035,r.z1-.035]);
  // Flatten static opaque furniture into a few material batches per floor.
  g.updateMatrix();for(const o of [...g.children])if(o.isMesh){o.applyMatrix4(g.matrix);g.remove(o);root.add(o);}
 });
 root.userData.records=records;root.userData.batching=batchStaticMeshes(root);return root;
}

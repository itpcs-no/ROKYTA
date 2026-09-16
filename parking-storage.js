import * as T from 'three';
import {surface} from './surface-materials.js';
import {ramp} from './project-geometry.js';
import {hillsideParking as parking,parkingBays,parkingRoofLevel,cellarRows,cellarDoors} from './parking-layout.js';
import {buildCurvedParking} from './curved-parking.js';
import {curvedOutline} from './curved-parking-layout.js';
import {subtractTopSurfaces} from './surface-geometry.js';

export function buildParkingAndStorage(){
 const root=new T.Group();root.name='Zapustené parkovanie a pivničné kobky';
 const parkingGroup=new T.Group(),storage=new T.Group();parkingGroup.name='Parkovanie pod rodinnými domami';storage.name='Pivničné kobky pod oboma záhradami';root.add(parkingGroup,storage);
 const concrete=surface('concrete'),white=surface('plaster'),paving=surface('paving'),wood=surface('wood');
 const metal=new T.MeshStandardMaterial({color:0x414d50,metalness:.58,roughness:.4});
 const line=new T.MeshStandardMaterial({color:0xe0e0d4,roughness:.85});
 const lamp=new T.MeshStandardMaterial({color:0xffefcc,emissive:0xffdfab,emissiveIntensity:1.2,roughness:.6});
 const occluders=[],doors=[];
 function box(g,x,y,z,w,h,d,m=white,occlude=true){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=!m.transparent;o.receiveShadow=true;g.add(o);if(occlude)occluders.push(o);return o}
 // Small physical number plates remain legible without loading external fonts.
 function number(g,n,x,y,z){
  box(g,x,y,z,.31,.25,.025,metal,false);
  const segments={0:[0,1,2,4,5,6],1:[2,5],2:[0,2,3,4,6],3:[0,2,3,5,6],4:[1,2,3,5],5:[0,1,3,5,6],6:[0,1,3,4,5,6],7:[0,2,5],8:[0,1,2,3,4,5,6],9:[0,1,2,3,5,6]};
  const parts=[[-.0,.082,.073,.012],[-.04,.04,.012,.073],[.04,.04,.012,.073],[0,0,.073,.012],[-.04,-.04,.012,.073],[.04,-.04,.012,.073],[0,-.082,.073,.012]];
  String(n).padStart(2,'0').split('').forEach((digit,i)=>segments[digit].forEach(s=>{const [dx,dy,w,h]=parts[s];box(g,x+(i-.5)*.13+dx,y+dy,z-.016,w,h,.01,line,false)}));
 }
 const floor=ramp.bottom,ceiling=floor+parking.clearance,roof=parkingRoofLevel(floor);
 for(const block of parking.blocks){
  const center=(block.x0+block.x1)/2,depth=parking.back-parking.front,width=block.x1-block.x0;
  const slab=box(parkingGroup,center,(floor-.12)/2,(parking.front+parking.back)/2,width+.26,floor+.12,depth+.26,concrete);slab.name='Podlaha parkovania v úrovni cesty';
  const roofSlab=box(parkingGroup,center,ceiling+parking.roof/2,(parking.front+parking.back)/2,width+.28,parking.roof,depth+.28,concrete);roofSlab.name='Nosný strop pod svahom';
  if(block===parking.blocks[0]){subtractTopSurfaces(slab,[curvedOutline()],true);subtractTopSurfaces(roofSlab,[curvedOutline(depth+.1,-.1)],true)}
  for(const x of [block.x0,block.x1])box(parkingGroup,x,(floor+ceiling)/2,(parking.front+parking.back)/2,.26,parking.clearance,depth,concrete);
  box(parkingGroup,center,(floor+ceiling)/2,parking.back,width,parking.clearance,.26,concrete);
  box(parkingGroup,center,(ceiling+roof)/2,parking.front,width+.28,roof-ceiling,.3,white).name='Čelo stropu a zeleného zásypu';
  for(let i=0;i<=block.count;i++){
   const x=block.x0+i*width/block.count;
   box(parkingGroup,x,(floor+ceiling)/2,parking.front,parking.post,parking.clearance,parking.post,white);
   if(i>0&&i<block.count)box(parkingGroup,x,floor+.005,36.5,.065,.01,6.1,line,false);
  }
  // Guard the exposed edge of the walkable grass roof.
  box(parkingGroup,center,roof+1.02,parking.front+.18,width,.035,.04,metal);
  const posts=Math.ceil(width/1.5);for(let i=0;i<=posts;i++)box(parkingGroup,block.x0+width*i/posts,roof+.51,parking.front+.18,.035,1.02,.035,metal);
 }
 for(const bay of parkingBays){
  number(parkingGroup,bay.id,bay.x,floor+1.9,parking.back-.15);
  box(parkingGroup,bay.x,floor+.075,39.7,1.8,.15,.22,concrete);
  box(parkingGroup,bay.x,ceiling-.045,36.5,1.35,.08,.16,lamp,false);
 }
 const curved=buildCurvedParking(floor,number);parkingGroup.add(curved);occluders.push(...curved.userData.occluders);
 // Both rows share the original doors, partitions, shelving and finish.
 for(const [row,c] of cellarRows.entries()){
 const h=c.ceiling-c.floor;
 for(let i=0;i<=c.count;i++)box(storage,c.x0+i*c.pitch,(c.ceiling+c.floor)/2,(c.front+c.back)/2,.14,h,c.back-c.front,white);
 for(const d of cellarDoors.filter(d=>d.row===row)){
  const center=d.x+d.width/2,a=center-c.pitch/2,b=center+c.pitch/2;
  box(storage,(a+d.x)/2,(c.ceiling+c.floor)/2,c.front,d.x-a,h,.15,white);
  box(storage,(d.x+d.width+b)/2,(c.ceiling+c.floor)/2,c.front,b-d.x-d.width,h,.15,white);
  const lintelBottom=c.floor+c.doorHeight;
  box(storage,center,(c.ceiling+lintelBottom)/2,c.front,d.width,c.ceiling-lintelBottom,.15,white);
  for(const x of [d.x,d.x+d.width])box(storage,x,c.floor+c.doorHeight/2,c.front,.045,c.doorHeight,.2,metal);
  box(storage,center,lintelBottom,c.front,d.width+.07,.04,.2,metal);
  const pivot=new T.Group();pivot.position.set(d.x,c.floor,c.front);pivot.name=`Dvere kobky ${d.id}`;storage.add(pivot);doors.push(pivot);
  box(pivot,d.width/2,c.doorHeight/2,0,d.width-.025,c.doorHeight-.02,.055,metal);
  for(let j=0;j<5;j++)box(pivot,d.width/2,1.34+j*.055,-.033,.57,.016,.012,line,false);
  box(pivot,d.width-.12,.95,-.065,.14,.025,.07,line,false);number(pivot,d.id,d.width/2,1.76,-.048);
  // Shelves at the back leave each doorway and the central walking strip clear.
  for(const y of [.5,1.1,1.7])box(storage,center,y,c.back-.6,c.pitch-.475,.065,.58,wood,false);
  for(const x of [center-c.pitch/2+.3425,center+c.pitch/2-.3425])box(storage,x,.94,c.back-.6,.035,1.88,.54,metal,false);
  box(storage,center,c.ceiling-.045,(c.front+c.back)/2,.75,.075,.13,lamp,false);
 }
 }
 const setDoors=open=>{doors.forEach(p=>p.rotation.y=open?-Math.PI/2:0);root.updateMatrixWorld(true)};
 setDoors(true);root.userData={parkingGroup,storage,curved,occluders,doors,setDoors};return root;
}

import {createDriving} from './driving.js';
import {surface,glassMaterial,finishSurfaces} from './surface-materials.js';
import {addDaylight} from './daylight.js';
import {courtSite,courtBarrierAt} from './court-layout.js';
import {homeAt,homeBarrierAt,homesLevel} from './homes-layout.js';
import {siteBarrierAt,serviceHouse,serviceShed} from './site-layout.js';
import {hillsideParking,parkingBays,parkingBlockAt,cellarAt,cellars,cellarDoors,parkingBarrierAt,cellarBarrierAt} from './parking-layout.js';
import * as T from 'three';
import {createWalker} from './avatar.js';
import {createMountedRider} from './mounted-rider.js';
import {garage,ramp,rampHeight,levels,slabThickness,footprints,gardenStairs,exteriorHeight} from './project-geometry.js';
import {buildExterior} from './exterior.js';
import {wellnessBarrierAt,wellnessCeiling,wellnessEntry,wellnessTarget} from './wellness-layout.js';
import {OrbitControls} from './assets/OrbitControls.js';
const $=id=>document.getElementById(id), view=$('view');
try{await start()}catch(e){$('loading').style.display='block';$('loading').textContent='Model sa nepodarilo načítať. Skús obnoviť stránku v prehliadači s podporou WebGL.';console.error(e)}
async function start(){
const data=await fetch('./assets/model.json').then(r=>{if(!r.ok)throw Error('model');return r.json()});
data.forEach((level,i)=>level.base=levels[i]);
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor(0xdce6eb);view.append(renderer.domElement);renderer.outputColorSpace=T.SRGBColorSpace;
const scene=new T.Scene();const camera=new T.PerspectiveCamera(48,innerWidth/innerHeight,.35,1600);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxDistance=150;controls.minDistance=2;controls.maxPolarAngle=Math.PI*.49;controls.target.set(0,3,-3);
addDaylight(scene,renderer);
const mat=surface('plaster'),sideMat=mat,slabMat=surface('paving'),glassMat=glassMaterial(),frameMat=new T.MeshStandardMaterial({color:0x30383b,metalness:.72,roughness:.3});
function box(g,x,y,z,w,h,d,m){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=!m.transparent;mesh.receiveShadow=true;g.add(mesh);return mesh}
const ground=box(scene,0,-.5,0,210,.5,190,new T.MeshStandardMaterial({color:0xbccbc2,roughness:1}));const grid=new T.GridHelper(160,32,0xb1c1be,0xc5d1cc);grid.position.y=-.235;scene.add(grid);
const exterior=buildExterior();scene.add(exterior);
const groups=[],floorMeshes=[],roofMeshes=[],doorPivots=[];
const doorMat=surface('wood'),jambMat=new T.MeshStandardMaterial({color:0xe1dfd7,roughness:.58}),handleMat=new T.MeshStandardMaterial({color:0x899399,metalness:.9,roughness:.22});
const loader=new T.TextureLoader();const textures=[];
for(let f=0;f<4;f++){
 const group=new T.Group();group.position.y=data[f].base;scene.add(group);groups.push(group);floorMeshes[f]=[];roofMeshes[f]=[];
 const texture=loader.load(`assets/plan${f+1}.png`);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();textures.push(texture);
 for(const poly of data[f].walls){const shape=new T.Shape();poly.forEach((p,i)=>i?shape.lineTo(p[0],-p[1]):shape.moveTo(p[0],-p[1]));shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:data[f].wallHeight||2.55,bevelEnabled:false});geo.rotateX(-Math.PI/2);const bounds=geo.boundingBox;const south=poly.every(p=>p[0]>-8.5&&p[0]<10.8&&p[1]>-1.8&&p[1]<16.3);const wallMaterial=f===2&&south?surface('stone'):sideMat;const mesh=new T.Mesh(geo,[mat,wallMaterial]);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
 for(const d of data[f].doors||[]){
  const [hx,hz]=d.hinge,[cx,cz]=d.closed,[ox,oz]=d.open;
  const closed=-Math.atan2(cz-hz,cx-hx),opened=-Math.atan2(oz-hz,ox-hx),height=d.height;
  const pivot=new T.Group();pivot.position.set(hx,0,hz);pivot.rotation.y=opened;group.add(pivot);pivot.userData={closed,opened,floor:f};doorPivots.push(pivot);
  box(pivot,d.width/2,height/2,0,Math.max(.1,d.width-.035),height-.025,.038,doorMat);
  box(pivot,d.width-.12,1.02,.045,.1,.025,.035,handleMat);box(pivot,d.width-.12,1.02,-.045,.1,.025,.035,handleMat);
  const frame=new T.Group();frame.position.set(hx,0,hz);frame.rotation.y=closed;group.add(frame);
  for(const x of [-.025,d.width+.025])box(frame,x,height/2,0,.045,height,.12,jambMat);
  box(frame,d.width/2,height+.025,0,d.width+.095,.055,.12,jambMat);
  const lintelHeight=(data[f].wallHeight||2.55)-height-.06;if(lintelHeight>0)box(frame,d.width/2,height+.06+lintelHeight/2,0,d.width,lintelHeight,.12,mat);
 }
 for(const w of data[f].windows){const [x,z,dx,dz]=w;const cx=x+dx/2,cz=z+dz/2;const horizontal=dx>dz,start=horizontal?x:z,end=start+(horizontal?dx:dz);let panes=[[start,end]];
 for(const d of data[f].doors||[]){const a=d.hinge,b=d.closed;const along=horizontal?Math.abs(a[1]-b[1])<.02:Math.abs(a[0]-b[0])<.02;const near=horizontal?Math.abs(a[1]-cz)<.5:Math.abs(a[0]-cx)<.5;if(!along||!near)continue;const da=Math.min(a[horizontal?0:1],b[horizontal?0:1])-.025,db=Math.max(a[horizontal?0:1],b[horizontal?0:1])+.025;panes=panes.flatMap(([l,r])=>db<=l||da>=r?[[l,r]]:[[l,Math.max(l,da)],[Math.min(r,db),r]].filter(([a,b])=>b-a>.025))}
 for(const [l,r] of panes){
  const pcx=horizontal?(l+r)/2:cx,pcz=horizontal?cz:(l+r)/2,pw=horizontal?r-l:dx,pd=horizontal?dz:r-l;
  box(group,pcx,1.15,pcz,horizontal?r-l:.045,2.1,horizontal?.045:r-l,glassMat);
  box(group,pcx,.05,pcz,pw,.1,pd,mat);
  const head=(data[f].wallHeight||2.55)-2.2;box(group,pcx,2.2+head/2,pcz,pw,head+.006,pd,mat);
  for(const y of [.12,2.18])box(group,pcx,y,pcz,horizontal?r-l:.065,.045,horizontal?.065:r-l,frameMat);
  for(const edge of [l+.022,r-.022])box(group,horizontal?edge:cx,1.15,horizontal?cz:edge,horizontal?.045:.065,2.1,horizontal?.065:.045,frameMat);
 }
 }

 // The former indoor pool is closed with the same continuous ground-floor slab.
 for(const [x,z,x1,z1] of footprints[f])floorMeshes[f].push(box(group,(x+x1)/2,-slabThickness/2,(z+z1)/2,x1-x,slabThickness,z1-z,slabMat));
 const geo=new T.PlaneGeometry(62,52);geo.rotateX(-Math.PI/2);const plan=new T.Mesh(geo,new T.MeshBasicMaterial({map:texture,transparent:true,opacity:.94,depthWrite:false}));plan.position.set(.175,.016,0);plan.visible=false;group.add(plan);group.userData.plan=plan;
}
const walker=createWalker();scene.add(walker.root);walker.root.visible=false;const nav=new T.Vector3();let walkingTime=0,jumpOffset=0,jumpVelocity=0;
const rider=createMountedRider();scene.add(rider.root);rider.root.visible=false;let mounted=false;
const riderFootprint=[...Array.from({length:9},(_,i)=>[0,-1.5+i*.3]),...[-.45,.45].flatMap(side=>Array.from({length:5},(_,i)=>[side,-.6+i*.3]))];
let selected='all', mode='orbit', yaw=0,pitch=-.45,walkDistance=5.5,keys={},drag=null;const clock=new T.Clock();
function setDoors(){renderer.shadowMap.needsUpdate=true;const shutter=exterior.userData.garageDoor;shutter.scale.y=$('doors').checked?.045:1;shutter.position.y=(garage.floor+garage.doorHeight)*(1-shutter.scale.y);doorPivots.forEach(p=>p.rotation.y=$('doors').checked?p.userData.opened:p.userData.closed);exterior.userData.parkingStorage.userData.setDoors($('doors').checked);exterior.userData.homes.userData.setDoors($('doors').checked)}
$('doors').onchange=setDoors;
$('gate').onchange=()=>{exterior.userData.site.userData.setGate($('gate').checked);renderer.shadowMap.needsUpdate=true};
function status(){const visible=mode==='walk'&&!driving.active&&$('figure').checked;walker.root.visible=visible&&!mounted;rider.root.visible=visible&&mounted;$('ride').textContent=mounted?'Zosadnúť':'Na oslíkovi';$('ride').classList.toggle('active',mounted);$('ride').ariaPressed=String(mounted);$('startWalk').textContent=mounted?'Prejsť na panáčika':mode==='walk'?'Ukončiť prechádzku':'Prejsť sa s panáčikom';$('status').textContent=mounted?'Oslík · WASD / šípky · E: zosadnúť':`${selected==='all'?'Celá budova':`${selected+1}. NP`} · ${mode==='walk'?'WASD · pohyb':'obhliadka'}`;$('orbit').classList.toggle('active',mode==='orbit');$('walk').classList.toggle('active',mode==='walk'&&!mounted);document.body.classList.toggle('walking',mode==='walk') }
function visibility(){renderer.shadowMap.needsUpdate=true;exterior.visible=selected==='all'||mode==='walk';ground.visible=selected!=='all'&&selected!==0;grid.visible=selected!=='all'&&selected!==0;renderer.clippingPlanes=$('cutaway').checked?[new T.Plane(new T.Vector3(0,-1,0),2.55)]:[];for(let f=0;f<4;f++){groups[f].visible=selected==='all'||selected===f||(mode==='walk'&&f<selected);groups[f].userData.plan.visible=$('plan').checked&&selected===f} $('maptitle').textContent=`${(selected==='all'?1:selected)+1}. NP`;$('mapimg').src=`assets/plan${(selected==='all'?1:selected)+1}.png`;status()}
function orbitHome(top=false){driving.leave();jumpOffset=jumpVelocity=0;mode='orbit';mounted=false;camera.near=.35;camera.updateProjectionMatrix();visibility();controls.enabled=true;const y=selected==='all'?4:data[selected].base;camera.up.set(0,1,0);camera.position.set(top?0:61,top?95:40,top?-.01:63);controls.target.set(0,y,-1);controls.update();$('dot').style.display='none';$('hint').textContent='Ťahaním otáčaj model. Kolieskom približuj. Pravým tlačidlom posúvaj.';status()}
function walkAt(x=2.3,z=-4.1,outside=false){if(selected==='all'&&!outside){selected=1;$('floor').value='1';visibility()}driving.leave();jumpOffset=jumpVelocity=0;mode='walk';mounted=false;camera.near=.12;camera.updateProjectionMatrix();controls.enabled=false;nav.set(x,(selected==='all'?0:data[selected].base)+1.65,z);camera.position.copy(nav);yaw=0;pitch=$('figure').checked?-.45:0;camera.rotation.order='YXZ';camera.rotation.set(0,0,0);$('hint').textContent='WASD / šípky: pohyb · ťahanie myšou: pohľad do strán aj hore/dole · koliesko: vzdialenosť · medzerník: skok · E: nastúpiť/vystúpiť · Shift: beh · Esc: obhliadka. Podlažie zmeníš hore; klik do mapy ťa premiestni.';visibility();status();$('panel').classList.remove('open')}
$('figure').onchange=()=>{pitch=$('figure').checked?-.45:0;status()};$('startWalk').onclick=()=>mounted?dismountRider():mode==='walk'?orbitHome():selected==='all'?walkAt(5,-31,true):walkAt();
$('floor').onchange=()=>{selected=$('floor').value==='all'?'all':Number($('floor').value);$('cutaway').checked=false;visibility();if(mode==='walk'){if(selected==='all')walkAt(5,-31,true);else walkAt(selected===3?1:2.3,selected===3?-5:-4.1)}else orbitHome()};$('orbit').onclick=()=>orbitHome();$('walk').onclick=()=>selected==='all'?walkAt(5,-31,true):walkAt();$('top').onclick=()=>orbitHome(true);$('reset').onclick=()=>orbitHome();$('plan').onchange=visibility;$('cutaway').onchange=visibility;$('panelToggle').onclick=()=>$('panel').classList.toggle('open');
$('poolView').onclick=()=>{selected='all';$('floor').value='all';$('cutaway').checked=false;orbitHome();const target=new T.Vector3(wellnessTarget.x,wellnessTarget.y,wellnessTarget.z),direction=new T.Vector3(-.85,1.2,-1).normalize(),distance=Math.max(39,15/Math.sin(Math.atan(Math.tan(camera.fov*Math.PI/360)*Math.min(camera.aspect,1))));if(innerWidth>760)target.addScaledVector(new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize(),-5);controls.target.copy(target);camera.position.copy(target).addScaledVector(direction,distance);controls.maxDistance=Math.max(150,distance*1.2);controls.update();$('panel').classList.remove('open')};
$('poolWalk').onclick=()=>{selected='all';$('floor').value='all';$('cutaway').checked=false;walkAt(wellnessEntry.x,wellnessEntry.z,true);yaw=0;pitch=-.4};
$('garageView').onclick=()=>{selected='all';$('floor').value='all';$('cutaway').checked=false;visibility();orbitHome();camera.position.set(20,10,35);controls.target.set(-4,3,20);controls.update()};
$('courtsView').onclick=()=>{selected='all';$('floor').value='all';$('cutaway').checked=false;orbitHome();const direction=new T.Vector3(56,35.4,-38).normalize(),right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize(),distance=Math.max(85,40/Math.sin(Math.atan(Math.tan(camera.fov*Math.PI/360)*Math.min(camera.aspect,1))));controls.target.set(-17,8.6,62);if(innerWidth>760)controls.target.addScaledVector(right,-7);camera.position.copy(controls.target).addScaledVector(direction,distance);controls.maxDistance=Math.max(150,distance*1.2);controls.update()};
$('courtsWalk').onclick=()=>{selected='all';$('floor').value='all';$('cutaway').checked=false;walkAt(courtSite.stairs.x,49,true);yaw=Math.PI;pitch=-.25};
$('entranceView').onclick=()=>{selected='all';$('floor').value='all';$('cutaway').checked=false;orbitHome();camera.position.set(85,28,7);controls.target.set(36,2,26);controls.update()};
$('serviceView').onclick=()=>{selected='all';$('floor').value='all';$('cutaway').checked=false;orbitHome();const x=(serviceHouse.x1+serviceShed.x0)/2,z=(serviceHouse.z1+serviceShed.z0)/2;camera.position.set(x-29,30,z+30);controls.target.set(x+7,1,z);controls.update()};
$('entranceWalk').onclick=()=>{selected='all';$('floor').value='all';$('cutaway').checked=false;walkAt(49,30.5,true);yaw=Math.PI/2;pitch=-.3};
$('map').onclick=e=>{const r=$('map').getBoundingClientRect();walkAt((e.clientX-r.left)/r.width*62-30.825,(e.clientY-r.top)/r.height*52-26);$('panel').classList.remove('open')};
const canvas=renderer.domElement;canvas.addEventListener('pointerdown',e=>{if(mode==='walk'){drag={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId)}});canvas.addEventListener('pointermove',e=>{if(drag&&mode==='walk'){yaw-=(e.clientX-drag.x)*.004;pitch=Math.max(-1.35,Math.min(1.35,pitch-(e.clientY-drag.y)*.004));drag.x=e.clientX;drag.y=e.clientY}});canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('lostpointercapture',()=>drag=null);canvas.addEventListener('contextmenu',e=>{if(mode==='walk')e.preventDefault()});canvas.addEventListener('wheel',e=>{if(mode==='walk'&&$('figure').checked){e.preventDefault();walkDistance=Math.max(2,Math.min(10,walkDistance*Math.exp(e.deltaY*.001))) }},{passive:false});
const cars=exterior.getObjectByName('Cars in covered parking');
const driving=createDriving(cars,exteriorHeight,(x,z)=>canMove(x,z));
function useCar(){
 if(mode!=='walk'||jumpOffset>0)return;
 if(mounted){dismountRider();return}
 if(driving.active){
  const car=driving.active;let exit=null;
  for(const [side,back] of [[1.7,0],[-1.7,0],[0,3],[0,-3]]){const x=car.position.x+side*Math.cos(car.rotation.y)+back*Math.sin(car.rotation.y),z=car.position.z-side*Math.sin(car.rotation.y)+back*Math.cos(car.rotation.y);if(canMove(x,z)&&Math.abs(exteriorHeight(x,z)-car.position.y)<.3&&!cars.children.some(c=>c!==car&&Math.hypot(x-c.position.x,z-c.position.z)<1.4)){exit={x,z};break}}
  if(!exit){$('status').textContent='Na vystúpenie tu nie je miesto.';return}
  driving.leave();nav.set(exit.x,exteriorHeight(exit.x,exit.z)+1.65,exit.z);status();return;
 }
 const car=driving.nearest(nav);if(!car){$('status').textContent='Príď bližšie k autu alebo klikni na K autám.';return}
 selected='all';$('floor').value='all';driving.enter(car);nav.set(car.position.x,car.position.y+1.65,car.position.z);yaw=car.rotation.y;pitch=-.35;walkDistance=7;visibility();
}
$('carsView').onclick=()=>{selected='all';$('floor').value='all';$('cutaway').checked=false;walkAt(parkingBays[0].x,33.8,true);yaw=Math.PI;pitch=-.25};
$('parkingView').onclick=()=>{selected='all';$('floor').value='all';$('cutaway').checked=false;orbitHome();const a=hillsideParking.blocks[0].x0,b=hillsideParking.blocks.at(-1).x1,wide=innerWidth>760,center=(a+b)/2+(wide?10:0),distance=Math.max(63,((b-a)/2+(wide?16:6))/(Math.tan(camera.fov*Math.PI/360)*camera.aspect));controls.maxDistance=Math.max(150,distance*1.25);camera.position.set(center,3.7+distance*.43,36-distance);controls.target.set(center,3.7,36);controls.update();$('panel').classList.remove('open')};
$('cellarsView').onclick=()=>{selected='all';$('floor').value='all';$('cutaway').checked=false;walkAt(cellarDoors[0].x+cellars.doorWidth/2,cellars.front-1.4,true);yaw=Math.PI;pitch=-.25};
$('enterCar').onclick=useCar;
const mapped={ArrowUp:'w',ArrowDown:'s',ArrowLeft:'a',ArrowRight:'d'};window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;const k=mapped[e.key]||e.key.toLowerCase();if(mode==='walk'&&e.code==='Space'){e.preventDefault();if(!e.repeat&&!driving.active&&jumpOffset===0)jumpVelocity=mounted?3.6:4.2}if(mode==='walk'&&k==='e'&&!e.repeat){e.preventDefault();useCar()}keys[k]=true;if(mode==='walk'&&['w','a','s','d'].includes(k))e.preventDefault();if(e.key==='Escape')orbitHome()});window.addEventListener('keyup',e=>{keys[mapped[e.key]||e.key.toLowerCase()]=false});window.addEventListener('blur',()=>{keys={};drag=null});document.querySelectorAll('[data-move]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[b.dataset.move]=true};b.onpointerup=b.onpointercancel=()=>keys[b.dataset.move]=false});
function inside(x,z,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
function canMove(x,z){
 if($('free').checked)return true;
 if(selected==='all'&&(parkingBarrierAt(x,z,nav.y-1.65,ramp.bottom)||cellarBarrierAt(x,z,nav.y-1.65,$('doors').checked)))return false;
 if(selected==='all'&&(courtBarrierAt(x,z)||wellnessBarrierAt(x,z)))return false;
 if(selected==='all'&&homeBarrierAt(x,z,$('doors').checked))return false;
 if(selected==='all'&&siteBarrierAt(x,z,$('gate').checked))return false;
 const floor=selected==='all'?(nav.y-1.65>2.5?1:0):selected;
 if(selected==='all'&&!$('doors').checked&&Math.abs(x-garage.x1)<.2&&z>garage.doorZ0&&z<garage.doorZ1)return false;
 if(selected!=='all'){
  let supported=footprints[floor].some(([a,b,c,d])=>x>=a+.15&&x<=c-.15&&z>=b+.15&&z<=d-.15);
  if(floor===2)supported ||= inside(x,z,exterior.userData.deckOutline);
  if(floor<2)supported ||= x>-28.68&&x<28.68&&z>-24.63&&z<-22.9;
  if(!supported)return false;
 }
 for(const d of data[floor].doors||[]){const end=$('doors').checked?d.open:d.closed;const a=d.hinge,dx=end[0]-a[0],dz=end[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));if(Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)<.17)return false}
 return !data[floor].walls.some(p=>[[0,0],[.18,0],[-.18,0],[0,.18],[0,-.18]].some(o=>inside(x+o[0],z+o[1],p)));
}
const cameraRay=new T.Raycaster(),cameraTarget=new T.Vector3(),cameraDirection=new T.Vector3();
function coveredCeiling(x=nav.x,z=nav.z,foot=nav.y-1.65){
 const wellness=wellnessCeiling(x,z);if(wellness!==null)return wellness;
 if(parkingBlockAt(x,z)&&foot<ramp.bottom+hillsideParking.clearance+.1)return ramp.bottom+hillsideParking.clearance;
 if(cellarAt(x,z)&&foot<cellars.ceiling+.05)return cellars.ceiling;
 if(homeAt(x,z))return homesLevel+2.98;
 return null;
}
function canRideMove(x,z,heading){
 const base=exteriorHeight(x,z,nav.y-1.65),ceiling=coveredCeiling(x,z,base);
 if(ceiling!==null&&ceiling-base<rider.height+.06)return false;
 if(!canMove(x,z))return false;
 const sine=Math.sin(heading),cosine=Math.cos(heading);
 for(const [side,along] of riderFootprint){
  const px=x+side*cosine+along*sine,pz=z-side*sine+along*cosine;
  if(!canMove(px,pz))return false;
  if((side===0||Math.abs(along)<.001)&&Math.abs(exteriorHeight(px,pz,base)-base)>.46)return false;
 }
 return true;
}
function dismountRider(){
 if(jumpOffset>0)return;
 const heading=rider.root.rotation.y,foot=nav.y-1.65;
 for(const side of [1,-1,0]){const x=nav.x+side*Math.cos(heading),z=nav.z-side*Math.sin(heading);if(canMove(x,z)&&Math.abs(exteriorHeight(x,z,foot)-foot)<.35){mounted=false;walkAt(x,z,true);walker.root.rotation.y=heading;return}}
 $('status').textContent='Na zosadnutie tu nie je miesto.';
}
function mountRider(){
 if(mounted){dismountRider();return}
 const keep=mode==='walk'&&selected==='all'&&!driving.active,x=keep?nav.x:25,z=keep?nav.z:30.5;let heading=keep?walker.root.rotation.y:Math.PI/2;
 selected='all';$('floor').value='all';$('cutaway').checked=false;$('figure').checked=true;walkAt(x,z,true);nav.y=exteriorHeight(x,z,nav.y-1.65)+1.65;
 if(!canRideMove(x,z,heading)){heading=Math.PI/2;nav.set(25,exteriorHeight(25,30.5)+1.65,30.5)}
 mounted=true;rider.root.position.set(nav.x,nav.y-1.65,nav.z);rider.root.rotation.set(0,heading,0);yaw=heading+Math.PI*.78;pitch=-.16;walkDistance=5.6;
 $('hint').textContent='WASD / šípky: jazda · ťahanie myšou: otáčanie a sklon pohľadu · koliesko: vzdialenosť · Shift: rýchlejší krok · medzerník: skok · E alebo Zosadnúť: panáčik · Esc: obhliadka.';status();
}
$('ride').onclick=mountRider;
function keepCoveredCamera(eyeY){
 if(selected!=='all')return;
 const ceiling=coveredCeiling(),foot=nav.y-1.65;
 const nearParking=foot<ramp.bottom+hillsideParking.clearance+.1&&nav.z>hillsideParking.front-8&&nav.z<hillsideParking.back+1&&hillsideParking.blocks.some(b=>nav.x>b.x0-4&&nav.x<b.x1+4);
 const nearCellars=foot<cellars.ceiling+.05&&nav.x>cellars.x0-3&&nav.x<cellars.x1+3&&nav.z>cellars.front-6&&nav.z<cellars.back+1;
 const nearHome=homeAt(nav.x,nav.z,4);
 const nearWellness=wellnessCeiling(nav.x,nav.z)!==null;
 if(!nearParking&&!nearCellars&&!nearHome&&!nearWellness)return;
 if(ceiling!==null)camera.position.y=Math.min(camera.position.y,ceiling-.18);
 cameraTarget.set(nav.x,eyeY-.35,nav.z);cameraDirection.subVectors(camera.position,cameraTarget);const distance=cameraDirection.length();cameraDirection.normalize();
 cameraRay.set(cameraTarget,cameraDirection);cameraRay.far=distance;
 const hit=cameraRay.intersectObjects(nearWellness?exterior.userData.wellness.userData.occluders:nearHome?exterior.userData.homes.userData.occluders:exterior.userData.parkingStorage.userData.occluders,false)[0];
 if(hit)camera.position.copy(cameraTarget).addScaledVector(cameraDirection,Math.max(.4,hit.distance-.16));
 camera.lookAt(cameraTarget);
}
finishSurfaces(scene,renderer);
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}window.addEventListener('resize',resize);setDoors();visibility();orbitHome();$('loading').style.display='none';renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);exterior.userData.wellness.userData.update(dt);if(mode==='walk'){const previousX=nav.x,previousZ=nav.z;if(selected==='all')nav.y=exteriorHeight(nav.x,nav.z,nav.y-1.65)+1.65;const f=(keys.w?1:0)-(keys.s?1:0),r=(keys.d?1:0)-(keys.a?1:0),norm=Math.hypot(f,r)||1,speed=(keys.shift?6:2.7)*dt/norm,dx=(-Math.sin(yaw)*f+Math.cos(yaw)*r)*speed,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*r)*speed;const x=Math.max(-110,Math.min(110,nav.x+dx)),z=Math.max(-110,Math.min(110,nav.z+dz));if(driving.active){const heading=driving.active.rotation.y;driving.update(dt,f,-r,!!keys[' ']);yaw+=driving.active.rotation.y-heading;nav.set(driving.active.position.x,driving.active.position.y+1.65,driving.active.position.z);$('status').textContent=`Auto · ${Math.round(Math.abs(driving.speed)*3.6)} km/h · E: vystúpiť · medzerník: brzda`}else{if(mounted){if(f||r){const desired=yaw+Math.atan2(-r,f),difference=Math.atan2(Math.sin(desired-rider.root.rotation.y),Math.cos(desired-rider.root.rotation.y)),heading=rider.root.rotation.y+T.MathUtils.clamp(difference,-dt*4,dt*4),step=(keys.shift?4.2:2.1)*dt,rx=Math.max(-110,Math.min(110,nav.x-Math.sin(heading)*step)),rz=Math.max(-110,Math.min(110,nav.z-Math.cos(heading)*step));if(canRideMove(rx,rz,heading)){nav.x=rx;nav.z=rz;rider.root.rotation.y=heading}else if(canRideMove(nav.x,nav.z,heading))rider.root.rotation.y=heading}}else{if(canMove(x,nav.z))nav.x=x;if(canMove(nav.x,z))nav.z=z}if(selected==='all')nav.y=exteriorHeight(nav.x,nav.z,nav.y-1.65)+1.65;if(jumpVelocity!==0||jumpOffset>0){jumpVelocity-=12*dt;jumpOffset=Math.max(0,jumpOffset+jumpVelocity*dt);const ceiling=coveredCeiling();if(ceiling!==null&&jumpOffset>ceiling-(nav.y-1.65)-(mounted?rider.height:1.75)){jumpOffset=Math.max(0,ceiling-(nav.y-1.65)-(mounted?rider.height:1.75));jumpVelocity=Math.min(0,jumpVelocity)}if(jumpOffset===0)jumpVelocity=0}}const mx=(nav.x+30.825)/62,mz=(nav.z+26)/52;$('dot').style.display=mx>=0&&mx<=1&&mz>=0&&mz<=1?'block':'none';$('dot').style.left=mx*100+'%';$('dot').style.top=mz*100+'%'
 walkingTime+=dt;const eyeY=nav.y+jumpOffset+(mounted?rider.eyeHeight-1.65:0);walker.root.position.set(nav.x,nav.y+jumpOffset-1.65,nav.z);if(f||r)walker.root.rotation.y=yaw+Math.atan2(-r,f);walker.animate(walkingTime,!!(f||r));if(mounted){rider.root.position.set(nav.x,nav.y-1.65+jumpOffset,nav.z);rider.animate(walkingTime,Math.hypot(nav.x-previousX,nav.z-previousZ)/Math.max(dt,.000001),dt,jumpOffset>0,(x,z)=>exteriorHeight(x,z,nav.y-1.65))}
 if($('figure').checked||driving.active){const targetY=eyeY-(mounted?.65:.35),horizontal=walkDistance*Math.cos(pitch);camera.position.set(nav.x+Math.sin(yaw)*horizontal,Math.max(nav.y-1.4,targetY-walkDistance*Math.sin(pitch)),nav.z+Math.cos(yaw)*horizontal);camera.lookAt(nav.x,targetY,nav.z);keepCoveredCamera(eyeY)}else{camera.position.set(nav.x,eyeY,nav.z);camera.rotation.set(pitch,yaw,0,'YXZ')}
 const insideHome=selected==='all'&&homeAt(nav.x,nav.z),indoors=!!insideHome||selected!=='all'||footprints[0].some(([a,b,c,d])=>nav.x>a&&nav.x<c&&nav.z>b&&nav.z<d);
 renderer.clippingPlanes=$('cutaway').checked?[new T.Plane(new T.Vector3(0,-1,0),2.55)]:indoors&&$('figure').checked?[new T.Plane(new T.Vector3(0,-1,0),(mounted?nav.y-1.65+rider.height+.15:(insideHome?homesLevel:selected==='all'?0:levels[selected])+2.3))]:[];
 renderer.shadowMap.needsUpdate=true;}else controls.update();renderer.render(scene,camera)});
}

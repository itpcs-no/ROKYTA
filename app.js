import * as T from 'three';
import {createWalker} from './avatar.js';
import {garage,ramp,pool,rampHeight,levels,slabThickness,footprints,gardenStairs} from './project-geometry.js';
import {buildExterior} from './exterior.js';
import {OrbitControls} from './assets/OrbitControls.js';
const $=id=>document.getElementById(id), view=$('view');
try{await start()}catch(e){$('loading').style.display='block';$('loading').textContent='Model sa nepodarilo načítať. Skús obnoviť stránku v prehliadači s podporou WebGL.';console.error(e)}
async function start(){
const data=await fetch('./assets/model.json').then(r=>{if(!r.ok)throw Error('model');return r.json()});
data.forEach((level,i)=>level.base=levels[i]);
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor(0xdce6eb);view.append(renderer.domElement);renderer.outputColorSpace=T.SRGBColorSpace;
const scene=new T.Scene();scene.fog=new T.Fog(0xdce6eb,130,260);const camera=new T.PerspectiveCamera(48,innerWidth/innerHeight,.06,350);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxDistance=150;controls.minDistance=2;controls.maxPolarAngle=Math.PI*.49;controls.target.set(0,3,-3);
scene.add(new T.HemisphereLight(0xeaf6ff,0x9b9689,2.5));const sun=new T.DirectionalLight(0xfff3dc,3.2);sun.position.set(-28,70,22);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-55,right:55,top:55,bottom:-55,near:1,far:150});sun.shadow.bias=-.0002;scene.add(sun);
const mat=new T.MeshStandardMaterial({color:0xf0f0ec,roughness:.88}),sideMat=new T.MeshStandardMaterial({color:0xeeeeea,roughness:.8}),slabMat=new T.MeshStandardMaterial({color:0xe4ddd0,roughness:.92}),glassMat=new T.MeshStandardMaterial({color:0x7aa7b7,transparent:true,opacity:.22,depthWrite:false,roughness:.2,metalness:.12}),frameMat=new T.MeshStandardMaterial({color:0x37494f});
function box(g,x,y,z,w,h,d,m){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh}
const ground=box(scene,0,-.5,0,210,.5,190,new T.MeshStandardMaterial({color:0xbccbc2,roughness:1}));const grid=new T.GridHelper(160,32,0xb1c1be,0xc5d1cc);grid.position.y=-.235;scene.add(grid);
const exterior=buildExterior();scene.add(exterior);
const groups=[],floorMeshes=[],roofMeshes=[],doorPivots=[];
const doorMat=new T.MeshStandardMaterial({color:0xb38c63,roughness:.7}),jambMat=new T.MeshStandardMaterial({color:0xebe7e0}),handleMat=new T.MeshStandardMaterial({color:0x596167,metalness:.7,roughness:.3});
const loader=new T.TextureLoader();const textures=[];
for(let f=0;f<4;f++){
 const group=new T.Group();group.position.y=data[f].base;scene.add(group);groups.push(group);floorMeshes[f]=[];roofMeshes[f]=[];
 const texture=loader.load(`assets/plan${f+1}.png`);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();textures.push(texture);
 for(const poly of data[f].walls){const shape=new T.Shape();poly.forEach((p,i)=>i?shape.lineTo(p[0],-p[1]):shape.moveTo(p[0],-p[1]));shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:data[f].wallHeight||2.55,bevelEnabled:false});geo.rotateX(-Math.PI/2);const bounds=geo.boundingBox;const south=poly.every(p=>p[0]>-8.5&&p[0]<10.8&&p[1]>-1.8&&p[1]<16.3);const wallMaterial=f===2&&south?new T.MeshStandardMaterial({color:0x45494a,roughness:.88}):sideMat;const mesh=new T.Mesh(geo,[mat,wallMaterial]);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
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

 for(const [x,z,x1,z1] of footprints[f]){
  if(f===0&&x<pool.x0&&x1>pool.x1&&z<pool.z0&&z1>pool.z1){
   const shape=new T.Shape();shape.moveTo(x,-z);shape.lineTo(x1,-z);shape.lineTo(x1,-z1);shape.lineTo(x,-z1);shape.closePath();const hole=new T.Path();hole.moveTo(pool.x0,-pool.z0);hole.lineTo(pool.x1,-pool.z0);hole.lineTo(pool.x1,-pool.z1);hole.lineTo(pool.x0,-pool.z1);hole.closePath();shape.holes.push(hole);const geo=new T.ExtrudeGeometry(shape,{depth:slabThickness,bevelEnabled:false});geo.rotateX(-Math.PI/2);const slab=new T.Mesh(geo,slabMat);slab.position.y=-slabThickness;slab.receiveShadow=true;group.add(slab);floorMeshes[f].push(slab);
  }else floorMeshes[f].push(box(group,(x+x1)/2,-slabThickness/2,(z+z1)/2,x1-x,slabThickness,z1-z,slabMat));
 }
 const geo=new T.PlaneGeometry(62,52);geo.rotateX(-Math.PI/2);const plan=new T.Mesh(geo,new T.MeshBasicMaterial({map:texture,transparent:true,opacity:.94,depthWrite:false}));plan.position.set(.175,.016,0);plan.visible=false;group.add(plan);group.userData.plan=plan;
}
// The pool's measured inner outline and -1.500 bottom come from 01_1NP.
const poolGroup=new T.Group();poolGroup.name='Pool 1NP bottom -1.500';groups[0].add(poolGroup);
const tileMat=new T.MeshStandardMaterial({color:0xa4c7cd,roughness:.48}),waterMat=new T.MeshStandardMaterial({color:0x339baa,transparent:true,opacity:.42,depthWrite:false,roughness:.15,metalness:.06,side:T.DoubleSide});
const px=(pool.x0+pool.x1)/2,pz=(pool.z0+pool.z1)/2,pw=pool.x1-pool.x0,pd=pool.z1-pool.z0;
box(poolGroup,px,pool.bottom-.06,pz,pw,.12,pd,tileMat);
for(const x of [pool.x0-.06,pool.x1+.06])box(poolGroup,x,pool.bottom/2,pz,.12,-pool.bottom,pd+.24,tileMat);
for(const z of [pool.z0-.06,pool.z1+.06])box(poolGroup,px,pool.bottom/2,z,pw,.0-pool.bottom,.12,tileMat);
for(const x of [pool.x0-.16,pool.x1+.16])box(poolGroup,x,.035,pz,.25,.07,pd+.55,slabMat);
for(const z of [pool.z0-.16,pool.z1+.16])box(poolGroup,px,.035,z,pw,.07,.25,slabMat);
const water=new T.Mesh(new T.PlaneGeometry(pw,pd),waterMat);water.rotation.x=-Math.PI/2;water.position.set(px,pool.water,pz);poolGroup.add(water);
for(let i=0;i<6;i++)box(poolGroup,pool.x1-1.6+(i+.5)*.24,pool.bottom+(i+1)*.23/2,pool.z1-.6,.24,(i+1)*.23,1.2,tileMat);
for(const z of [pz-.35,pz+.35]){box(poolGroup,pool.x0+.25,-.3,z,.04,1.8,.04,handleMat);box(poolGroup,pool.x0-.25,.35,z,.04,.7,.04,handleMat);box(poolGroup,pool.x0,.69,z,.5,.04,.04,handleMat)}
const walker=createWalker();scene.add(walker.root);walker.root.visible=false;const nav=new T.Vector3();let walkingTime=0;
let selected='all', mode='orbit', yaw=0,pitch=0,keys={},drag=null;const clock=new T.Clock();
function setDoors(){doorPivots.forEach(p=>p.rotation.y=$('doors').checked?p.userData.opened:p.userData.closed)}
$('doors').onchange=setDoors;
function status(){walker.root.visible=mode==='walk'&&$('figure').checked;$('startWalk').textContent=mode==='walk'?'Ukončiť prechádzku':'Prejsť sa s panáčikom'; $('status').textContent=`${selected==='all'?'Celá budova':`${selected+1}. NP`} · ${mode==='walk'?'WASD · pohyb':'obhliadka'}`;$('orbit').classList.toggle('active',mode==='orbit');$('walk').classList.toggle('active',mode==='walk');document.body.classList.toggle('walking',mode==='walk') }
function visibility(){exterior.visible=selected==='all'||mode==='walk';ground.visible=selected!=='all'&&selected!==0;grid.visible=selected!=='all'&&selected!==0;renderer.clippingPlanes=$('cutaway').checked?[new T.Plane(new T.Vector3(0,-1,0),2.55)]:[];for(let f=0;f<4;f++){groups[f].visible=selected==='all'||selected===f||(mode==='walk'&&f<selected);groups[f].userData.plan.visible=$('plan').checked&&selected===f} $('maptitle').textContent=`${(selected==='all'?1:selected)+1}. NP`;$('mapimg').src=`assets/plan${(selected==='all'?1:selected)+1}.png`;status()}
function orbitHome(top=false){mode='orbit';visibility();controls.enabled=true;const y=selected==='all'?4:data[selected].base;camera.up.set(0,1,0);camera.position.set(top?0:61,top?95:40,top?-.01:63);controls.target.set(0,y,-1);controls.update();$('dot').style.display='none';$('hint').textContent='Ťahaním otáčaj model. Kolieskom približuj. Pravým tlačidlom posúvaj.';status()}
function walkAt(x=2.3,z=-4.1,outside=false){if(selected==='all'&&!outside){selected=1;$('floor').value='1';visibility()}mode='walk';controls.enabled=false;nav.set(x,(selected==='all'?0:data[selected].base)+1.65,z);camera.position.copy(nav);yaw=0;pitch=0;camera.rotation.order='YXZ';camera.rotation.set(0,0,0);$('hint').textContent='WASD / šípky: pohyb · ťahanie: otočenie kamery · Shift: beh · Esc: obhliadka. Podlažie zmeníš hore; klik do mapy ťa premiestni.';visibility();status();$('panel').classList.remove('open')}
$('figure').onchange=()=>status();$('startWalk').onclick=()=>mode==='walk'?orbitHome():selected==='all'?walkAt(5,-31,true):walkAt();
$('floor').onchange=()=>{selected=$('floor').value==='all'?'all':Number($('floor').value);$('cutaway').checked=false;visibility();if(mode==='walk'){if(selected==='all')walkAt(5,-31,true);else walkAt(selected===3?1:2.3,selected===3?-5:-4.1)}else orbitHome()};$('orbit').onclick=()=>orbitHome();$('walk').onclick=()=>selected==='all'?walkAt(5,-31,true):walkAt();$('top').onclick=()=>orbitHome(true);$('reset').onclick=()=>orbitHome();$('plan').onchange=visibility;$('cutaway').onchange=visibility;$('panelToggle').onclick=()=>$('panel').classList.toggle('open');
$('poolView').onclick=()=>{selected='all';$('floor').value='all';$('cutaway').checked=true;visibility();orbitHome();camera.position.set(-31,19,-32);controls.target.set(px,-.6,pz);controls.update()};
$('garageView').onclick=()=>{selected='all';$('floor').value='all';$('cutaway').checked=false;visibility();orbitHome();camera.position.set(20,10,35);controls.target.set(-4,3,20);controls.update()};
$('map').onclick=e=>{const r=$('map').getBoundingClientRect();walkAt((e.clientX-r.left)/r.width*62-30.825,(e.clientY-r.top)/r.height*52-26);$('panel').classList.remove('open')};
const canvas=renderer.domElement;canvas.addEventListener('pointerdown',e=>{if(mode==='walk'){drag={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId)}});canvas.addEventListener('pointermove',e=>{if(drag&&mode==='walk'){yaw-=(e.clientX-drag.x)*.004;pitch=Math.max(-1.35,Math.min(1.35,pitch-(e.clientY-drag.y)*.004));drag.x=e.clientX;drag.y=e.clientY}});canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
const mapped={ArrowUp:'w',ArrowDown:'s',ArrowLeft:'a',ArrowRight:'d'};window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;const k=mapped[e.key]||e.key.toLowerCase();keys[k]=true;if(mode==='walk'&&['w','a','s','d'].includes(k))e.preventDefault();if(e.key==='Escape')orbitHome()});window.addEventListener('keyup',e=>{keys[mapped[e.key]||e.key.toLowerCase()]=false});window.addEventListener('blur',()=>{keys={};drag=null});document.querySelectorAll('[data-move]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[b.dataset.move]=true};b.onpointerup=b.onpointercancel=()=>keys[b.dataset.move]=false});
function inside(x,z,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
function canMove(x,z){
 if($('free').checked)return true;
 const floor=selected==='all'?0:selected;
 if(selected!=='all'){
  let supported=footprints[floor].some(([a,b,c,d])=>x>=a+.15&&x<=c-.15&&z>=b+.15&&z<=d-.15);
  if(floor===2)supported ||= inside(x,z,exterior.userData.deckOutline);
  if(floor<2)supported ||= x>-28.68&&x<28.68&&z>-24.63&&z<-22.9;
  if(!supported)return false;
 }
 if(floor===0&&x>pool.x0-.12&&x<pool.x1+.12&&z>pool.z0-.12&&z<pool.z1+.12)return false;
 for(const d of data[floor].doors||[]){const end=$('doors').checked?d.open:d.closed;const a=d.hinge,dx=end[0]-a[0],dz=end[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));if(Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)<.17)return false}
 return !data[floor].walls.some(p=>[[0,0],[.18,0],[-.18,0],[0,.18],[0,-.18]].some(o=>inside(x+o[0],z+o[1],p)));
}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}window.addEventListener('resize',resize);visibility();orbitHome();$('loading').style.display='none';renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);if(mode==='walk'){if(selected==='all'){const x=nav.x,z=nav.z;const elevated=z>-2.5&&z<23.5&&((x>-32.5&&x<-13.5)||(x>15.5&&x<34.5));let groundY=elevated?2.58:.05;for(const sx of gardenStairs.x){if(Math.abs(x-sx)<=gardenStairs.width/2){if(z>=gardenStairs.z0&&z<gardenStairs.z1)groundY=Math.ceil((z-gardenStairs.z0)/(gardenStairs.z1-gardenStairs.z0)*gardenStairs.count)*gardenStairs.top/gardenStairs.count;else if(z>=gardenStairs.z1&&z<=22.4)groundY=gardenStairs.top;}}if(z>=ramp.z0&&z<=ramp.z1&&x>=garage.x1&&x<=ramp.x1)groundY=rampHeight(x);if(z>=garage.z0&&z<=garage.z1&&x>=garage.x0&&x<garage.x1)groundY=garage.floor;if((x>=ramp.x1&&x<=16&&z>=ramp.z0&&z<29)||(z>=28&&z<=33))groundY=ramp.bottom;nav.y=groundY+1.65}const f=(keys.w?1:0)-(keys.s?1:0),r=(keys.d?1:0)-(keys.a?1:0),norm=Math.hypot(f,r)||1,speed=(keys.shift?6:2.7)*dt/norm,dx=(-Math.sin(yaw)*f+Math.cos(yaw)*r)*speed,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*r)*speed;const x=Math.max(-70,Math.min(70,nav.x+dx)),z=Math.max(-70,Math.min(70,nav.z+dz));if(canMove(x,nav.z))nav.x=x;if(canMove(nav.x,z))nav.z=z;const mx=(nav.x+30.825)/62,mz=(nav.z+26)/52;$('dot').style.display=mx>=0&&mx<=1&&mz>=0&&mz<=1?'block':'none';$('dot').style.left=mx*100+'%';$('dot').style.top=mz*100+'%'
 walkingTime+=dt;walker.root.position.set(nav.x,nav.y-1.65,nav.z);walker.root.rotation.y=yaw;walker.animate(walkingTime,!!(f||r));
 if($('figure').checked){const distance=4.4,height=3.2+pitch*1.2;camera.position.set(nav.x+Math.sin(yaw)*distance,nav.y+height,nav.z+Math.cos(yaw)*distance);camera.lookAt(nav.x,nav.y-.55,nav.z)}else{camera.position.copy(nav);camera.rotation.set(pitch,yaw,0,'YXZ')}
 const indoors=selected!=='all'||footprints[0].some(([a,b,c,d])=>nav.x>a&&nav.x<c&&nav.z>b&&nav.z<d);
 renderer.clippingPlanes=$('cutaway').checked?[new T.Plane(new T.Vector3(0,-1,0),2.55)]:indoors&&$('figure').checked?[new T.Plane(new T.Vector3(0,-1,0),(selected==='all'?0:levels[selected])+2.3)]:[];
 }else controls.update();renderer.render(scene,camera)});
}

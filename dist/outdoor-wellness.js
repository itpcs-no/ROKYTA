import * as T from 'three';
import {surface} from './surface-materials.js';
import {makeWaterMaterial,addPoolCaustics} from './water-material.js';
import {createPlanting} from './planting.js';
import {rectOutline} from './surface-geometry.js';
import {wellnessLevel,wellnessOutline,wellnessBasins,wellnessLoungers,wellnessPergola,wellnessPosts,wellnessBeds,wellnessTrees,wellnessLights,basinOutline,poolEnclosure,enclosureSegments} from './wellness-layout.js';

export function buildOutdoorWellness(){
 const root=new T.Group();root.name='Vonkajší bazén a záhradné wellness';
 const paving=surface('paving').clone();paving.color.set(0xf0e7d4);
 const coping=surface('concrete').clone();coping.color.set(0xe5ddc9);
 const tile=addPoolCaustics(surface('pool')),wood=surface('wood'),soil=surface('soil');
 const metal=new T.MeshStandardMaterial({color:0x555f5c,metalness:.8,roughness:.27});
 const steel=new T.MeshStandardMaterial({color:0xc6d0cb,metalness:.88,roughness:.19});
 const fabric=new T.MeshStandardMaterial({color:0xe7dfc9,roughness:.96});
 const cushion=new T.MeshStandardMaterial({color:0x5c817a,roughness:.93});
 const box=(g,x,y,z,w,h,d,m)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=!m.transparent;o.receiveShadow=true;g.add(o);return o};
 function shapeFor(outline,holes=[]){const shape=new T.Shape();outline.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();for(const points of holes){const hole=new T.Path();points.forEach(([x,z],i)=>i?hole.lineTo(x,-z):hole.moveTo(x,-z));hole.closePath();shape.holes.push(hole)}return shape}
 function solid(g,name,outline,holes,bottom,top,material){
  const geo=new T.ExtrudeGeometry(shapeFor(outline,holes),{depth:top-bottom,bevelEnabled:false,curveSegments:1});geo.rotateX(-Math.PI/2);
  const mesh=new T.Mesh(geo,material);mesh.position.y=bottom;mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;
 }
 // One terrace, two access links, and real cut-outs. No overlaid coplanar paving.
 const deck=solid(root,'Súvislá wellness terasa',wellnessOutline,wellnessBasins.map(b=>basinOutline(b,b.rim)),-.18,wellnessLevel,paving);
 const time={value:0},waters=[],bubbles=[];
 function tube(g,points,r=.026){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const mesh=new T.Mesh(new T.TubeGeometry(curve,32,r,8,false),steel);mesh.castShadow=true;g.add(mesh)}
 const lit=new T.MeshStandardMaterial({color:0xfff3cc,emissive:0xffdea0,emissiveIntensity:.45,roughness:.3});
 for(const b of wellnessBasins){
  const group=new T.Group();group.name=b.name;group.userData.basinId=b.id;root.add(group);
  solid(group,'Dno · '+b.name,basinOutline(b,.18),[],b.bottom-.16,b.bottom,tile);
  solid(group,'Steny · '+b.name,basinOutline(b,.18),[basinOutline(b)],b.bottom,wellnessLevel-.10,tile);
  solid(group,'Lem · '+b.name,basinOutline(b,b.rim),[basinOutline(b)],wellnessLevel-.10,wellnessLevel,coping);
  const cx=b.radius?b.x:(b.x0+b.x1)/2,cz=b.radius?b.z:(b.z0+b.z1)/2;
  const water=new T.Mesh(b.radius?new T.CircleGeometry(b.radius,64):new T.PlaneGeometry(b.x1-b.x0,b.z1-b.z0),makeWaterMaterial(b.id==='spa'));water.rotation.x=-Math.PI/2;water.position.set(cx,b.water,cz);water.name='Voda · '+b.name;water.receiveShadow=true;group.add(water);waters.push(water);
  if(b.id==='swimming'){
   // Broad submerged steps descend from the short end into the main basin.
   for(let i=0;i<6;i++){const top=-.20-i*.22;box(group,cx,(b.bottom+top)/2,b.z1-(i+.5)*.30,b.x1-b.x0,top-b.bottom,.30,tile)}
   for(const z of [-42,-36,-30]){const light=new T.Mesh(new T.SphereGeometry(.075,12,8),lit);light.position.set(b.x0+.025,-.48,z);group.add(light)}
  }else if(b.id==='spa'){
   solid(group,'Podvodná lavica vírivky',basinOutline(b),[basinOutline({...b,radius:.95})],b.bottom,-.55,tile);
   const jetMaterial=new T.MeshStandardMaterial({color:0x899b99,metalness:.72,roughness:.28});
   const bubbleMaterial=new T.MeshStandardMaterial({color:0xe0f4eb,transparent:true,opacity:.42,depthWrite:false,roughness:.15});
   const bubbleGeometry=new T.SphereGeometry(1,8,6);
   for(let i=0;i<12;i++){
    const a=i*Math.PI/6;const jet=new T.Mesh(new T.SphereGeometry(.04,10,6),jetMaterial);jet.position.set(cx+Math.cos(a)*1.52,-.31,cz+Math.sin(a)*1.52);group.add(jet);
    for(let j=0;j<3;j++){const bubble=new T.Mesh(bubbleGeometry,bubbleMaterial);bubble.userData={angle:a+j*.06,phase:i*.33+j*.21,radius:1.15+j*.08};bubble.scale.setScalar(.025+j*.009);group.add(bubble);bubbles.push(bubble)}
   }
  }else{
   for(let i=0;i<3;i++){const top=-.26-i*.28;box(group,b.x1-.5,(b.bottom+top)/2,b.z1-(i+.5)*.32,1,top-b.bottom,.32,tile)}
   tube(group,[[b.x1+.19,.06,b.z1+.18],[b.x1+.19,.85,b.z1+.18],[b.x1-.03,.92,b.z1-.18],[b.x1-.10,.36,b.z1-.92],[b.x1-.10,-.4,b.z1-1.1]]);
  }
 }
 // Timber shade at the end of the pool, with a sofa and low table beneath it.
 const lounge=new T.Group();lounge.name='Pergola a oddychové sedenie';root.add(lounge);
 const p=wellnessPergola;
 for(const {x,z} of wellnessPosts)box(lounge,x,wellnessLevel+1.3,z,.16,2.6,.16,wood);
 for(const x of [p.x0,p.x1])box(lounge,x,2.59,(p.z0+p.z1)/2,.16,.20,p.z1-p.z0+.36,wood);
 for(let z=p.z0-.13;z<=p.z1+.14;z+=.35)box(lounge,(p.x0+p.x1)/2,2.75,z,p.x1-p.x0+.5,.12,.12,wood);
 // Sofa against the west planting bed, facing the pool across a low table.
 box(lounge,-43.08,.25,-30.1,.95,.36,5.2,wood);box(lounge,-43.48,.94,-30.1,.13,.5,5.2,wood);
 for(let i=0;i<5;i++){const z=-32.16+i*1.03;box(lounge,-43.06,.5,z,.83,.14,.99,fabric);box(lounge,-43.42,.82,z,.16,.54,.99,fabric);box(lounge,-43.23,.78,z,.18,.42,.45,cushion)}
 box(lounge,-41.88,.41,-30.1,.75,.12,1.8,wood);for(const z of [-30.78,-29.42])box(lounge,-41.88,.20,z,.57,.28,.09,metal);
 const loungers=new T.Group();loungers.name='Ležadlá pri bazéne';root.add(loungers);
 for(const {x,z} of wellnessLoungers){
  box(loungers,x,.31,z,2.08,.12,.78,wood);box(loungers,x-.27,.41,z,1.38,.10,.72,fabric);
  const back=box(loungers,x+.68,.57,z,.72,.10,.72,fabric);back.rotation.z=.42;
  for(const dx of [-.8,.8])for(const dz of [-.29,.29])box(loungers,x+dx,.17,z+dz,.055,.22,.055,metal);
  box(loungers,x+.84,.70,z,.22,.07,.58,cushion);
 }
 // Telescopic pool enclosure: anodised aluminium arches, clear polycarbonate,
 // low steel rails on both coping edges. Segments nest when slid open.
 const enclosure=new T.Group();enclosure.name='Zasúvacie zastrešenie bazéna';root.add(enclosure);
 const alu=new T.MeshStandardMaterial({color:0xd5dadb,metalness:.85,roughness:.28});
 const poly=new T.MeshPhysicalMaterial({color:0xeaf3f5,transparent:true,opacity:.2,roughness:.06,metalness:0,side:T.DoubleSide,depthWrite:false});
 poly.userData.reflectionSurface=true;
 const e=poolEnclosure,segmentMeshes=[];
 for(const x of [e.x-e.width0/2-.06,e.x+e.width0/2+.06])box(enclosure,x,wellnessLevel+.05,(e.z0+e.z1)/2,.1,.1,e.z1-e.z0+.3,alu).name='Koľajnica zastrešenia';
 for(const seg of enclosureSegments(0)){
  const g=new T.Group();g.name='Segment zastrešenia '+(seg.i+1);enclosure.add(g);
  const skin=new T.CylinderGeometry(1,1,seg.z1-seg.z0,32,1,true,-Math.PI/2,Math.PI);skin.rotateX(-Math.PI/2);
  const shell=new T.Mesh(skin,poly);shell.scale.set(seg.width/2,seg.height,1);shell.position.y=wellnessLevel+.1;shell.castShadow=false;shell.receiveShadow=false;g.add(shell);
  const ribs=4;for(let r=0;r<ribs;r++){
   const z=(r/(ribs-1)-.5)*(seg.z1-seg.z0-.08);
   const pts=Array.from({length:17},(_,k)=>{const a=Math.PI*k/16;return new T.Vector3(Math.cos(a)*seg.width/2,wellnessLevel+.1+Math.sin(a)*seg.height,z)});
   const rib=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),24,.035,6,false),alu);rib.castShadow=true;g.add(rib);
  }
  for(const sx of [-1,1])box(g,sx*seg.width/2,wellnessLevel+.12,0,.08,.14,seg.z1-seg.z0,alu);
  if(seg.i===0||seg.i===e.segments-1){
   const end=new T.Mesh(new T.CircleGeometry(1,32,0,Math.PI),poly);end.scale.set(seg.width/2,seg.height,1);end.position.set(0,wellnessLevel+.1,(seg.i?1:-1)*(seg.z1-seg.z0)/2);g.add(end);
  }
  g.position.set(e.x,0,(seg.z0+seg.z1)/2);segmentMeshes.push(g);
 }
 let enclosureOpen=0,enclosureTarget=0;
 const placeEnclosure=()=>{e.open=enclosureOpen;for(const seg of enclosureSegments(enclosureOpen))segmentMeshes[seg.i].position.z=(seg.z0+seg.z1)/2};
 // Recessed planting beds use actual ground openings and meet the terrace edge.
 const planting=createPlanting();
 for(const bed of wellnessBeds){
  solid(root,'Zapustený záhon',rectOutline(bed),[],-.18,-.065,soil);
  const longX=bed.x1-bed.x0>bed.z1-bed.z0,length=longX?bed.x1-bed.x0:bed.z1-bed.z0,n=Math.floor(length/.85);
  for(let i=0;i<n;i++){const t=(i+.5)/n,x=longX?bed.x0+length*t:(bed.x0+bed.x1)/2,z=longX?(bed.z0+bed.z1)/2:bed.z0+length*t;
   if(i%3===0)planting.shrub(x,z,-.065,.45);else planting.tuft(x,z,-.065,.43);
  }
 }
 for(const {x,z} of wellnessTrees)planting.tree(x,z,-.06,.65,true);
 root.add(planting.finish());
 // Small path lights stay outside both clear pedestrian entrances.
 for(const [x,z] of wellnessLights){
  box(root,x,.29,z,.10,.46,.10,metal);box(root,x,.535,z,.14,.045,.14,lit);
 }
 root.userData={deck,waters,basins:wellnessBasins,enclosure,occluders:lounge.children.filter(o=>o.position.y>2.4),setEnclosureOpen(open,instant=false){enclosureTarget=open?1:0;if(instant){enclosureOpen=enclosureTarget;placeEnclosure()}},get enclosureMoving(){return enclosureOpen!==enclosureTarget},update(dt){time.value+=dt;if(enclosureOpen!==enclosureTarget){const step=dt*.12;enclosureOpen=enclosureTarget>enclosureOpen?Math.min(enclosureTarget,enclosureOpen+step):Math.max(enclosureTarget,enclosureOpen-step);placeEnclosure()}for(const bubble of bubbles){const d=bubble.userData,t=(time.value*.55+d.phase)%1,a=d.angle+Math.sin(time.value+d.phase)*.025;bubble.position.set(-40.8+Math.cos(a)*d.radius,-.28+t*.21,-14.85+Math.sin(a)*d.radius);bubble.scale.setScalar(.012+.029*t)}}};
 root.userData.update(0);return root;
}

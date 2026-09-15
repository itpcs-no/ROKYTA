import * as T from 'three';
import {surface} from './surface-materials.js';
import {createPlanting} from './planting.js';
import {rectOutline} from './surface-geometry.js';
import {wellnessLevel,wellnessOutline,wellnessBasins,wellnessLoungers,wellnessPergola,wellnessPosts,wellnessBeds,wellnessTrees,wellnessLights,basinOutline} from './wellness-layout.js';

export function buildOutdoorWellness(){
 const root=new T.Group();root.name='Vonkajší bazén a záhradné wellness';
 const paving=surface('paving').clone();paving.color.set(0xf0e7d4);
 const coping=surface('concrete').clone();coping.color.set(0xe5ddc9);
 const tile=surface('pool'),wood=surface('wood'),soil=surface('soil');
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
 function waterMaterial(spa){
  const m=new T.MeshPhysicalMaterial({color:spa?0x67b5b5:0x3695aa,transparent:true,opacity:spa?.60:.48,depthWrite:false,roughness:spa?.16:.075,metalness:.08,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:1.3,side:T.DoubleSide});
  m.onBeforeCompile=shader=>{shader.uniforms.wellnessTime=time;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vWellnessSurface;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWellnessSurface=position.xy;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float wellnessTime;varying vec2 vWellnessSurface;').replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize(normal+vec3(sin(vWellnessSurface.x*7.0+vWellnessSurface.y*4.0+wellnessTime*1.1)*.06,cos(vWellnessSurface.y*9.0-wellnessTime*.8)*.045,0.0));')};
  m.customProgramCacheKey=()=> 'rokyta-outdoor-water-1';return m;
 }
 function tube(g,points,r=.026){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const mesh=new T.Mesh(new T.TubeGeometry(curve,32,r,8,false),steel);mesh.castShadow=true;g.add(mesh)}
 const lit=new T.MeshStandardMaterial({color:0xfff3cc,emissive:0xffdea0,emissiveIntensity:.45,roughness:.3});
 for(const b of wellnessBasins){
  const group=new T.Group();group.name=b.name;group.userData.basinId=b.id;root.add(group);
  solid(group,'Dno · '+b.name,basinOutline(b,.18),[],b.bottom-.16,b.bottom,tile);
  solid(group,'Steny · '+b.name,basinOutline(b,.18),[basinOutline(b)],b.bottom,wellnessLevel-.10,tile);
  solid(group,'Lem · '+b.name,basinOutline(b,b.rim),[basinOutline(b)],wellnessLevel-.10,wellnessLevel,coping);
  const cx=b.radius?b.x:(b.x0+b.x1)/2,cz=b.radius?b.z:(b.z0+b.z1)/2;
  const water=new T.Mesh(b.radius?new T.CircleGeometry(b.radius,64):new T.PlaneGeometry(b.x1-b.x0,b.z1-b.z0),waterMaterial(b.id==='spa'));water.rotation.x=-Math.PI/2;water.position.set(cx,b.water,cz);water.name='Voda · '+b.name;water.receiveShadow=true;group.add(water);waters.push(water);
  if(b.id==='swimming'){
   // Broad submerged steps descend from the short end into the main basin.
   for(let i=0;i<6;i++){const top=-.20-i*.22;box(group,cx,(b.bottom+top)/2,b.z1-(i+.5)*.30,b.x1-b.x0,top-b.bottom,.30,tile)}
   for(const z of [-21,-25.8]){const light=new T.Mesh(new T.SphereGeometry(.075,12,8),lit);light.position.set(b.x0+.025,-.48,z);group.add(light)}
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
 for(const z of [p.z0,p.z1])box(lounge,(p.x0+p.x1)/2,2.59,z,p.x1-p.x0+.36,.20,.16,wood);
 for(let x=p.x0-.13;x<=p.x1+.14;x+=.35)box(lounge,x,2.75,(p.z0+p.z1)/2,.12,.12,p.z1-p.z0+.5,wood);
 box(lounge,-39.7,.25,-32.45,5.2,.36,.95,wood);box(lounge,-39.7,.94,-32.85,5.2,.5,.13,wood);
 for(let i=0;i<5;i++){box(lounge,-41.76+i*1.03,.5,-32.43,.99,.14,.83,fabric);box(lounge,-41.76+i*1.03,.82,-32.79,.99,.54,.16,fabric);box(lounge,-41.76+i*1.03,.78,-32.60,.45,.42,.18,cushion)}
 box(lounge,-39.7,.41,-31.175,1.8,.12,.75,wood);for(const x of [-40.38,-39.02])box(lounge,x,.20,-31.175,.09,.28,.57,metal);
 const loungers=new T.Group();loungers.name='Ležadlá pri bazéne';root.add(loungers);
 for(const {x,z} of wellnessLoungers){
  box(loungers,x,.31,z,2.08,.12,.78,wood);box(loungers,x-.27,.41,z,1.38,.10,.72,fabric);
  const back=box(loungers,x+.68,.57,z,.72,.10,.72,fabric);back.rotation.z=.42;
  for(const dx of [-.8,.8])for(const dz of [-.29,.29])box(loungers,x+dx,.17,z+dz,.055,.22,.055,metal);
  box(loungers,x+.84,.70,z,.22,.07,.58,cushion);
 }
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
 root.userData={deck,waters,basins:wellnessBasins,occluders:lounge.children.filter(o=>o.position.y>2.4),update(dt){time.value+=dt;for(const bubble of bubbles){const d=bubble.userData,t=(time.value*.55+d.phase)%1,a=d.angle+Math.sin(time.value+d.phase)*.025;bubble.position.set(-40.8+Math.cos(a)*d.radius,-.28+t*.21,-14.85+Math.sin(a)*d.radius);bubble.scale.setScalar(.012+.029*t)}}};
 root.userData.update(0);return root;
}

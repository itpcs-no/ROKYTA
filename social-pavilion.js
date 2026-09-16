import * as T from 'three';
import {surface} from './surface-materials.js';
import {createPlanting} from './planting.js';
import {serviceShed,pavilion} from './site-layout.js';
import {subtractTopSurfaces,rectOutline} from './surface-geometry.js';

export function buildSocialPavilion(){
 const root=new T.Group();root.name='Záhradný altánok s grilom a barom';
 const s=serviceShed,p=pavilion;root.position.set(s.x0,s.base,s.z0);
 const wood=surface('wood'),stone=surface('concrete'),soil=surface('soil');
 const charcoal=new T.MeshStandardMaterial({color:0x293331,metalness:.62,roughness:.38});
 const black=new T.MeshStandardMaterial({color:0x141a18,roughness:.61});
 const steel=new T.MeshPhysicalMaterial({color:0xb0b6b2,metalness:.92,roughness:.28,clearcoat:.2});
 const linen=new T.MeshStandardMaterial({color:0xc9bb9f,roughness:.98});
 const ceramic=new T.MeshStandardMaterial({color:0xe2ddd1,roughness:.4});
 const warm=new T.MeshStandardMaterial({color:0xffdc9c,emissive:0xffb35e,emissiveIntensity:2.1,roughness:.6});
 const occluders=[];
 function mesh(geometry,material,x,y,z,name='',occlude=false){const o=new T.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=material!==warm;o.receiveShadow=true;o.name=name;root.add(o);if(occlude)occluders.push(o);return o}
 const box=(x,y,z,w,h,d,m=charcoal,name='',occlude=false)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,name,occlude);
 const cylinder=(x,y,z,rt,rb,h,m=charcoal,name='')=>mesh(new T.CylinderGeometry(rt,rb,h,20),m,x,y,z,name);
 function rod(a,b,r=.018,m=charcoal){const av=new T.Vector3(...a),bv=new T.Vector3(...b),delta=bv.clone().sub(av);const o=mesh(new T.CylinderGeometry(r,r,delta.length(),10),m,...av.clone().add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o}
 function solid(r,y,h,m,name,occlude=false){return box((r.x0+r.x1)/2,y,(r.z0+r.z1)/2,r.x1-r.x0,h,r.z1-r.z0,m,name,occlude)}
 function top(r,y,h,m,name,holes=[]){
  const shape=new T.Shape();[[r.x0,r.z0],[r.x1,r.z0],[r.x1,r.z1],[r.x0,r.z1]].forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
  for(const h of holes){const hole=new T.Path();[[h.x0,h.z0],[h.x1,h.z0],[h.x1,h.z1],[h.x0,h.z1]].forEach(([x,z],i)=>i?hole.lineTo(x,-z):hole.moveTo(x,-z));hole.closePath();shape.holes.push(hole)}
  const geo=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false});geo.rotateX(-Math.PI/2);return mesh(geo,m,0,y-h,0,name);
 }
 // A slim charcoal roof, oak soffit and open front replace the white shell.
 box(2.185,2.94,4.9,4.93,.25,10.36,charcoal,'Tenká strecha altánku',true);
 box(2.185,2.755,4.9,4.9,.11,10.32,wood,'Drevený podhľad',true);
 box(.015,1.35,4.9,.18,2.7,9.8,charcoal,'Zadná stena altánku',true);
 for(let z=.055;z<9.8;z+=.135)box(.125,1.35,z,.06,2.64,.072,wood);
 for(const a of p.posts)box(a.x,1.35,a.z,.14,2.7,.14,charcoal,'Nosný stĺp altánku',true);
 for(const z of [0,9.8]){
  for(let x=.18;x<p.screenDepth;x+=.16)box(x,1.35,z,.075,2.65,.11,wood,'Bočná drevená lamela');
  box(p.screenDepth/2,.055,z,p.screenDepth,.11,.13,charcoal);
 }
 for(const z of [2.4,7.4])box(4.18,2.685,z,.028,.025,4.25,warm,'Teplý pás pod strechou');
 // Outdoor kitchen with a real sink opening and a stainless barbecue.
 const cabinets=solid(p.counter,.47,.9,charcoal,'Vonkajšia kuchynská linka',true);
 const sink={x0:.33,x1:.87,z0:3.48,z1:4.12};
 subtractTopSurfaces(cabinets,[rectOutline(sink).map(([x,z])=>[x+s.x0,z+s.z0])]);
 top({...p.counter,x0:.12,x1:1.14,z0:.4,z1:4.7},.985,.065,stone,'Kamenná pracovná doska',[sink]);
 box(.25,1.42,2.55,.09,.85,4.4,stone,'Kamenná zástena za grilom');
 for(let z=.55;z<4.65;z+=.7){box(1.089,.48,z+.3,.022,.73,.64,wood);box(1.113,.73,z+.3,.028,.025,.37,steel)}
 solid(sink,.81,.03,steel,'Zapustený drez');
 for(const x of [sink.x0,sink.x1])box(x,.88,3.8,.025,.15,.66,steel);
 for(const z of [sink.z0,sink.z1])box(.6,.88,z,.54,.15,.025,steel);
 cylinder(.42,1.2,4.3,.024,.024,.44,steel);rod([.42,1.4,4.3],[.72,1.4,4.3],.024,steel);rod([.72,1.4,4.3],[.72,1.33,4.3],.024,steel);
 box(.66,1.075,2.1,.96,.2,1.3,steel,'Vstavaný gril',true);
 const lid=new T.Shape();lid.moveTo(-.45,0);lid.lineTo(.45,0);lid.quadraticCurveTo(.45,.34,.14,.38);lid.lineTo(-.33,.38);lid.quadraticCurveTo(-.45,.38,-.45,.23);lid.closePath();
 mesh(new T.ExtrudeGeometry(lid,{depth:1.24,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.016,bevelThickness:.016,curveSegments:10}),steel,.66,1.17,1.48,'Oblý kryt grilu');
 rod([1.17,1.32,1.62],[1.17,1.32,2.58],.027,charcoal);
 for(const z of [1.65,1.95,2.25,2.55]){const knob=cylinder(1.157,1.075,z,.045,.045,.035,charcoal);knob.rotation.z=Math.PI/2}
 // Extractor flue passes above the canopy, keeping the grill legible at a glance.
 box(.62,2.08,2.1,1.12,.1,1.64,charcoal,'Digestor nad grilom');
 const hood=new T.CylinderGeometry(.34,.8,.48,4);hood.rotateY(Math.PI/4);hood.scale(1,.98,1.35);mesh(hood,charcoal,.62,2.37,2.1,'Tvarovaný digestor');
 box(.62,2.94,2.1,.38,1.0,.55,charcoal,'Komín grilu');box(.62,3.48,2.1,.65,.07,.8,charcoal);
 for(const z of [2.92,4.55]){box(.64,1.015,z,.38,.018,.25,wood);cylinder(.65,1.12,z,.075,.06,.2,ceramic)}
 // Slatted bar, durable stone top, foot rail and four individual stools.
 solid(p.bar,.51,1.0,charcoal,'Barový pult',true);
 for(let z=p.bar.z0+.05;z<p.bar.z1;z+=.12)box(p.bar.x1+.025,.53,z,.055,.88,.065,wood);
 top({...p.bar,x0:2.52,x1:3.52,z0:.68,z1:4.72},1.085,.075,stone,'Kamenná doska baru');
 rod([3.61,.26,.88],[3.61,.26,4.52],.027,steel);
 for(const z of [1.5,3.8])rod([3.36,.26,z],[3.61,.26,z],.021,steel);
 for(const a of p.stools){
  for(const dx of [-.18,.18])for(const dz of [-.18,.18])rod([a.x+dx*1.18,0,a.z+dz*1.18],[a.x+dx,.74,a.z+dz],.024,charcoal);
  const seat=cylinder(a.x,.77,a.z,.255,.255,.065,wood,'Barová stolička');
  const cushion=cylinder(a.x,.817,a.z,.237,.237,.034,linen);cushion.castShadow=false;
  for(const dz of [-.18,.18])rod([a.x+.17,.74,a.z+dz],[a.x+.2,1.02,a.z+dz],.02,charcoal);
  box(a.x+.2,.97,a.z,.055,.21,.42,wood);rod([a.x-.2,.26,a.z-.2],[a.x+.2,.26,a.z-.2],.018,steel);
 }
 for(const z of [1.65,3.65]){
  rod([2.97,2.7,z],[2.97,2.15,z],.008,charcoal);
  const shade=mesh(new T.SphereGeometry(.19,24,12,0,Math.PI*2,0,Math.PI/2),charcoal.clone(),2.97,2.02,z,'Závesné svetlo nad barom');shade.material.side=T.DoubleSide;
  cylinder(2.97,2.017,z,.16,.16,.015,warm);
 }
 for(const z of [2.5,7.5]){const light=new T.PointLight(0xffd9a0,14,6.5,2);light.position.set(2.1,2.45,z);root.add(light)}
 // A communal oak table with upholstered benches seats six comfortably.
 top(p.table,.785,.075,wood,'Spoločný jedálenský stôl');
 for(const z of [6.52,8.58]){box(2.475,.37,z,.085,.7,.15,charcoal);box(2.475,.075,z,1.0,.09,.18,charcoal)}
 for(const r of p.benches){
  top(r,.455,.07,wood,'Lavica pri spoločnom stole');top({...r,x0:r.x0+.025,x1:r.x1-.025,z0:r.z0+.03,z1:r.z1-.03},.495,.04,linen,'Čalúnenie lavice');
  const x=(r.x0+r.x1)/2;for(const z of [r.z0+.3,r.z1-.3])box(x,.2,z,.32,.4,.085,charcoal);
  const back=x<2?r.x0:r.x1;box(back,.735,7.55,.075,.44,2.8,wood);
 }
 for(const z of [6.62,7.53,8.44])for(const x of [2.15,2.82]){cylinder(x,.803,z,.15,.15,.018,ceramic,'Prestretý stôl');cylinder(x,.872,z+.26,.035,.035,.14,ceramic)}
 cylinder(2.475,.84,7.55,.08,.09,.1,ceramic);
 const plants=createPlanting();
 for(const r of p.planters){
  solid(r,.29,.58,charcoal,'Kvetináč pri vstupe',true);solid({...r,x0:r.x0+.06,x1:r.x1-.06,z0:r.z0+.06,z1:r.z1-.06},.583,.025,soil,'Substrát');
  const x=(r.x0+r.x1)/2,z=(r.z0+r.z1)/2;plants.shrub(x,z,.6,.36);plants.tuft(x+.16,z+.16,.6,.48);
 }
 root.add(plants.finish());root.userData={occluders,seats:10,grill:true,bar:true,ceiling:p.ceiling+s.base};return root;
}

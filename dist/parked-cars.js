import * as T from 'three';
import {GLTFLoader} from './assets/loaders/GLTFLoader.js';
import {parkingBays} from './parking-layout.js';
import {ramp} from './project-geometry.js';
import {curvedParkingBays,curvedFloor} from './curved-parking-layout.js';

// A locally hosted, licensed glTF car, with shared geometry and three levels
// of detail. Body, glass, interior, brakes and wheels remain real 3D surfaces.
let templates;
export async function prepareCarAssets(){
 if(templates)return;
 const response=await fetch('assets/vehicles/grand-tourer.glb');
 if(!response.ok)throw Error('Vehicle model could not be loaded');
 const gltf=await new GLTFLoader().parseAsync(await response.arrayBuffer(),'');
 templates=gltf.scenes;
 if(templates.length!==3)throw Error('Missing vehicle detail levels');
}
const colors=[0xe7e8e4,0x30343a,0x173c53,0xb9c0c3,0x74332e,0xf0e7d5,0x49605c,0x847266];
function carMaterials(index){
 const cache=new Map(),brakes=[];
 const materialFor=original=>{
  if(cache.has(original.uuid))return cache.get(original.uuid);
  const m=original.clone(),name=m.name;
  if(name.startsWith('Paint 1')){m.color.setHex(colors[index%colors.length]);m.metalness=.58;m.roughness=.23;m.clearcoat=1;m.clearcoatRoughness=.09;m.normalMap=null;m.envMapIntensity=1.15}
  if(name.startsWith('Paint 2')){m.color.setHex(index%4===0?0x434a4d:0x171b1e);m.metalness=.55;m.roughness=.29;m.clearcoat=.65}
  if(name==='Glass'){m.transmission=0;m.transparent=true;m.opacity=.38;m.color.setHex(0x81949e);m.metalness=.12;m.roughness=.07;m.clearcoat=1;m.depthWrite=false;m.side=T.DoubleSide;m.userData.reflectionSurface=true}
  if(name.startsWith('Interior 3')){m.color.setHex(index%3===0?0xb7a18b:0x34383c);m.roughness=.65}
  if(name==='Rim2'){m.color.setHex(0xb4b9bd);m.metalness=.92;m.roughness=.25}
  if(name==='Brake'){m.color.setHex(index%3===1?0xb39650:0x6f2221);m.roughness=.35}
  if(name==='License'){m.map=null;m.color.setHex(0xe5e8e5);m.roughness=.5}
  if(name==='Headlight')m.emissiveIntensity=.7;
  if(name==='Brakelight'){m.emissiveIntensity=.22;brakes.push(m)}
  for(const texture of [m.map,m.normalMap,m.roughnessMap,m.metalnessMap,m.aoMap])if(texture){texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter}
  cache.set(original.uuid,m);return m;
 };
 return {materialFor,brakes};
}
function createCarVisual(index){
 const lod=new T.LOD(),rigs=[],materials=carMaterials(index);
 for(const [level,template] of templates.entries()){
  const model=template.clone(true);model.name='Detail auta '+level;
  model.traverse(o=>{if(!o.isMesh)return;o.material=materials.materialFor(o.material);o.castShadow=!o.material.transparent;o.receiveShadow=true});
  const wheels=[];
  for(const group of [...model.children[0].children])if(group.userData.vehiclePart&&group.userData.vehiclePart!=='body'){
   const spin=new T.Group();spin.name='Otáčanie pneumatiky';
   for(const child of [...group.children])if(!child.userData.caliper)spin.add(child);
   group.add(spin);wheels.push({steer:group,spin,front:group.userData.front,radius:group.userData.wheelRadius});
  }
  rigs.push(wheels);lod.addLevel(model,[0,14,38][level],.12);
 }
 // Explicit initial visibility also prevents all levels casting the first shadow.
 lod.levels.forEach((level,i)=>level.object.visible=i===0);
 let roll=0,steering=0;
 const update=(distance,turn,braking,dt)=>{
  roll-=distance/(rigs[0][0]?.radius||.34);steering=T.MathUtils.damp(steering,turn*.46,12,dt);
  for(const wheels of rigs)for(const wheel of wheels){wheel.spin.rotation.x=roll;wheel.steer.rotation.y=wheel.front?steering:0}
  for(const m of materials.brakes)m.emissiveIntensity=braking?1.8:.22;
 };
 return {lod,rigs,update};
}
export function buildParkedCars(){
 if(!templates)throw Error('Vehicle assets must load before creating parking');
 const cars=new T.Group();cars.name='Cars in covered parking';cars.userData.location='Recessed parking';
 const occupied=[...parkingBays,...curvedParkingBays.filter(b=>b.arc&&b.id%2===1)];
 for(const [index,bay] of occupied.entries()){
  const car=new T.Group(),visual=createCarVisual(index);car.name=`Parked car ${bay.id}`;
  car.position.set(bay.x,bay.s===undefined?ramp.bottom:curvedFloor(bay.s,ramp.bottom),bay.z);car.rotation.y=bay.angle??0;car.add(visual.lod);cars.add(car);
  car.userData={bay:bay.id,width:2.02,length:4.42,height:1.17,detailLevels:visual.lod,vehicleRigs:visual.rigs,updateVehicle:visual.update,model:'Car Concept · Eric Chadwick / DGG'};
 }
 return cars;
}

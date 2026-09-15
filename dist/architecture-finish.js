import * as T from 'three';
import {surface} from './surface-materials.js';
import {createPlanting} from './planting.js';
import {levels,ramp} from './project-geometry.js';
import {courtTerrainHeight} from './court-layout.js';
import {serviceHouse,serviceShed} from './site-layout.js';
import {wellnessBeds} from './wellness-layout.js';

export const balconyPlanters=[0,1].flatMap(f=>[-22,-12,12,22].map(x=>({x,z:-24.35,y:levels[f],width:1.8,depth:.38})));
export function architecturalBarrierAt(x,z,y){return balconyPlanters.some(p=>Math.abs(y-p.y)<.4&&Math.abs(x-p.x)<p.width/2+.16&&Math.abs(z-p.z)<p.depth/2+.16)}

export function buildArchitectureFinish(){
 const root=new T.Group();root.name='Detaily fasád a krajiny';
 const aluminum=new T.MeshStandardMaterial({color:0xaab0aa,metalness:.82,roughness:.3}),charcoal=new T.MeshStandardMaterial({color:0x424945,roughness:.77}),stone=surface('concrete'),wood=surface('wood');
 const box=(x,y,z,w,h,d,m=stone)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;root.add(o);return o};
 function tube(points,r=.04){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const o=new T.Mesh(new T.TubeGeometry(curve,24,r,10,false),aluminum);o.castShadow=true;o.receiveShadow=true;root.add(o);return o}
 // Slender rainwater details and brackets establish scale against plain facades.
 for(const [x,z,top,dx,dz] of [[-28.94,-21.3,6.16,-1,0],[28.94,-21.3,6.16,1,0],[-8.06,14.4,8.94,-1,0],[11.01,14.4,8.94,1,0]]){
  tube([[x+dx*.14,.15,z+dz*.14],[x+dx*.14,top-.42,z+dz*.14],[x,top-.12,z]],.045);
  for(let y=.6;y<top-.3;y+=1.55)box(x+dx*.045,y,z+dz*.045,dx?.24:.07,.035,dz?.24:.07,aluminum);
 }
 const plants=createPlanting();
 for(const p of balconyPlanters){
  box(p.x,p.y+.22,p.z,p.width,.44,p.depth,charcoal);
  box(p.x,p.y+.437,p.z,p.width-.08,.016,p.depth-.08,surface('soil'));
  for(let i=-1;i<=1;i++)plants.shrub(p.x+i*.55,p.z,p.y+.448,.25);
 }
 // Sheet-metal seams already belong to the service roof; add gutters, fascia
 // joints and a modest entry canopy without changing either footprint.
 const h=serviceHouse,s=serviceShed,doorZ=h.z0+(h.z1-h.z0)*.55;
 box(h.x1+.55,h.base+2.94,doorZ,1.1,.12,1.9,charcoal);
 box(h.x1+.55,h.base+2.87,doorZ,1.08,.02,1.87,wood);
 for(const z of [doorZ-.65,doorZ+.65])tube([[h.x1+.08,h.base+2.8,z],[h.x1+.82,h.base+2.92,z]],.023);
 for(const x of [h.x0-.27,h.x1+.27])tube([[x,h.base+h.eaves-.04,h.z0-.3],[x,h.base+h.eaves-.04,h.z1+.3]],.065);
 tube([[h.x0-.3,.1,h.z1],[h.x0-.3,h.base+h.eaves-.1,h.z1]],.048);
 box((s.x0+s.x1)/2,s.base+2.80,s.z0-.25,s.x1-s.x0+.55,.14,.09,charcoal);
 // Small flowering perennials sit inside the existing recessed wellness beds.
 const flowerGeo=new T.IcosahedronGeometry(1,1),flowerMat=new T.MeshStandardMaterial({color:0x9b7fad,roughness:.94});
 const flowerMatrices=[],dummy=new T.Object3D();
 for(const bed of wellnessBeds){const alongX=bed.x1-bed.x0>bed.z1-bed.z0,n=Math.floor((alongX?bed.x1-bed.x0:bed.z1-bed.z0)*2);
  for(let i=0;i<n;i++){const t=(i+.5)/n,x=alongX?bed.x0+(bed.x1-bed.x0)*t:(bed.x0+bed.x1)/2,z=alongX?(bed.z0+bed.z1)/2:bed.z0+(bed.z1-bed.z0)*t;plants.tuft(x,z,-.065,.32);
   for(let j=0;j<4;j++){const a=j*2.4+i;dummy.position.set(x+Math.sin(a)*.11,.20+.04*Math.sin(i),z+Math.cos(a)*.11);dummy.scale.set(.025,.09,.025);dummy.rotation.set(.12*Math.sin(i),a,.13*Math.cos(i));dummy.updateMatrix();flowerMatrices.push(dummy.matrix.clone())}
  }
 }
 const flowers=new T.InstancedMesh(flowerGeo,flowerMat,flowerMatrices.length);flowerMatrices.forEach((m,i)=>flowers.setMatrixAt(i,m));flowers.receiveShadow=true;flowers.computeBoundingSphere();root.add(flowers);
 // A layered woodland backdrop follows the forest shown on the site map.
 // Keep the road, plot boundary and existing playable routes clear.
 const forest=[];
 for(let i=0;i<24;i++)forest.push([-72-(i%3)*6,-43+i*5.7]);
 for(let i=0;i<21;i++)forest.push([-64+i*5.3,91+(i%3)*5.8]);
 for(let i=0;i<20;i++)forest.push([62+(i%3)*5.3,-38+i*6.4]);
 for(const [i,[x,z]] of forest.entries())plants.tree(x,z,courtTerrainHeight(x,z,ramp.bottom)??-.06,1.25+(i%5)*.17,true);
 root.add(plants.finish());root.userData={forestTrees:forest.length,planters:balconyPlanters.length};return root;
}

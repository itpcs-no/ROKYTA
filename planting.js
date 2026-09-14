import * as T from 'three';
import {surface} from './surface-materials.js';

export function createPlanting(){
 const group=new T.Group();group.name='Layered landscape planting';
 let seed=9137;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 const leaves=[],branches=[],grasses=[],dummy=new T.Object3D(),up=new T.Vector3(0,1,0);
 const leafGeo=new T.BufferGeometry();
 leafGeo.setAttribute('position',new T.Float32BufferAttribute([0,.02,0, 0,0,-1, .42,0,-.52, .5,0,.12, .28,0,.68, 0,0,1, -.28,0,.68, -.5,0,.12, -.42,0,-.52],3));
 leafGeo.setIndex([0,1,2,0,2,3,0,3,4,0,4,5,0,5,6,0,6,7,0,7,8,0,8,1]);leafGeo.computeVertexNormals();
 const branch=(a,b,r0,r1)=>{const direction=new T.Vector3().subVectors(b,a);dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,direction.clone().normalize());dummy.scale.set(r0,direction.length(),r0);dummy.updateMatrix();branches.push({matrix:dummy.matrix.clone(),ratio:r1/r0})};
 function leaf(x,y,z,size,tone){dummy.position.set(x,y,z);dummy.rotation.set(rnd()*Math.PI,(rnd()-.5)*6.28,(rnd()-.5)*2);dummy.scale.set(size*(.65+rnd()*.3),size,size);dummy.updateMatrix();leaves.push({matrix:dummy.matrix.clone(),color:new T.Color().setHSL(.21+rnd()*.065,.24+rnd()*.18,tone+rnd()*.09)})}
 function cluster(x,y,z,rx,ry,rz,count,tone,leafScale=1){
  for(let i=0;i<count;i++){const angle=rnd()*Math.PI*2,v=rnd()*2-1,rad=Math.cbrt(rnd()),ring=Math.sqrt(1-v*v);leaf(x+Math.cos(angle)*ring*rad*rx,y+v*rad*ry,z+Math.sin(angle)*ring*rad*rz,(.09+rnd()*.11)*leafScale,tone)}
 }
 function shrub(x,z,y=2.55,r=.45){
  branch(new T.Vector3(x,y,z),new T.Vector3(x+.03,y+r*.65,z),.035,.015);
  cluster(x,y+r*.62,z,r,r*.67,r,190,.16);
 }
 function tree(x,z,y=2.55,scale=1,distant=false){
  const trunkTop=new T.Vector3(x+.1*scale,y+3.2*scale,z+.08*scale);
  branch(new T.Vector3(x,y,z),trunkTop,.17*scale,.08*scale);
  for(let i=0;i<11;i++){
   const angle=i*2.399+(rnd()-.5)*.4,reach=(.85+rnd())*scale,cy=y+(2.8+rnd()*1.6)*scale;
   const end=new T.Vector3(x+Math.cos(angle)*reach,cy,z+Math.sin(angle)*reach);
   const origin=new T.Vector3(x+.04,y+(1.7+rnd()*1.25)*scale,z+.04);
   branch(origin,end,.05*scale,.014*scale);
   cluster(end.x,end.y,end.z,(.85+rnd()*.25)*scale,.7*scale,.85*scale,distant?95:330,.18,scale*(distant?1.8:1));
  }
 }
 function tuft(x,z,y=.02,size=.2){
  for(let i=0;i<10;i++){dummy.position.set(x+(rnd()-.5)*size,y,z+(rnd()-.5)*size);dummy.rotation.set((rnd()-.5)*.35,rnd()*6.28,(rnd()-.5)*.5);dummy.scale.set(.025+rnd()*.035,size*(.65+rnd()),1);dummy.updateMatrix();grasses.push(dummy.matrix.clone())}
 }
 function finish(){
  const foliage=new T.MeshStandardMaterial({color:0xffffff,roughness:.88,side:T.DoubleSide});foliage.name='Individual leaf surfaces';
  const crowns=new T.InstancedMesh(leafGeo,foliage,leaves.length);crowns.name='Instanced leaves';leaves.forEach((l,i)=>{crowns.setMatrixAt(i,l.matrix);crowns.setColorAt(i,l.color)});crowns.castShadow=true;crowns.receiveShadow=true;crowns.computeBoundingSphere();group.add(crowns);
  const branchGeo=new T.CylinderGeometry(.46,1,1,8);const trunks=new T.InstancedMesh(branchGeo,surface('bark'),branches.length);branches.forEach((b,i)=>trunks.setMatrixAt(i,b.matrix));trunks.castShadow=true;trunks.receiveShadow=true;trunks.computeBoundingSphere();group.add(trunks);
  if(grasses.length){const blade=new T.BufferGeometry();blade.setAttribute('position',new T.Float32BufferAttribute([-.5,0,0,.5,0,0,.18,.55,.07,0,1,.2],3));blade.setIndex([0,1,2,0,2,3]);blade.computeVertexNormals();const m=new T.MeshStandardMaterial({color:0x69764d,roughness:1,side:T.DoubleSide});const tufts=new T.InstancedMesh(blade,m,grasses.length);grasses.forEach((a,i)=>tufts.setMatrixAt(i,a));tufts.receiveShadow=true;tufts.computeBoundingSphere();group.add(tufts)}
  group.userData.leafCount=leaves.length;return group;
 }
 return {shrub,tree,tuft,finish};
}

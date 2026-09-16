import * as T from 'three';
import {surface} from './surface-materials.js';
import {curvedParking as p,curvedSamples,curvedFrame,curvedFloor,curvedLength,curvedBayCuts,curvedParkingBays,curvedBankHeight} from './curved-parking-layout.js';

export function buildCurvedParking(base,number){
 const root=new T.Group();root.name='Parkovanie v oblúku svahu';const occluders=[];
 const concrete=surface('concrete'),white=surface('plaster'),grass=surface('grass');
 const steel=new T.MeshStandardMaterial({color:0x414d50,metalness:.58,roughness:.4}),line=new T.MeshStandardMaterial({color:0xe7e5d7,roughness:.86});
 const lamp=new T.MeshStandardMaterial({color:0xffefcc,emissive:0xffdfab,emissiveIntensity:.6});
 const floor=s=>curvedFloor(s,base),ceiling=s=>floor(s)+p.clearance,roof=s=>ceiling(s)+p.roof+p.soil;
 function box(x,y,z,w,h,d,m=concrete,angle=0,name='',occlude=true){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.rotation.y=angle;o.castShadow=true;o.receiveShadow=true;o.name=name;root.add(o);if(occlude)occluders.push(o);return o}
 function ribbon(a,b,low,high,material,name,topMaterial=material){
  const points=[],tops=[],sides=[];
  for(const [i,s] of curvedSamples.entries()){
   const f=curvedFrame(s);for(const y of [low(s),high(s)])for(const d of [a,b])points.push(f.x+f.nx*d,y,f.z+f.nz*d);
   if(i){const v=(i-1)*4,n=i*4;tops.push(v+2,n+2,v+3,v+3,n+2,n+3);sides.push(v,v+1,n,v+1,n+1,n,v,n,v+2,v+2,n,n+2,v+1,v+3,n+1,v+3,n+3,n+1)}
  }
  const n=(curvedSamples.length-1)*4;sides.push(0,2,1,1,2,3,n,n+1,n+2,n+1,n+3,n+2);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));geo.setIndex([...tops,...sides]);geo.addGroup(0,tops.length,0);geo.addGroup(tops.length,sides.length,1);geo.computeVertexNormals();
  const o=new T.Mesh(geo,[topMaterial,material]);o.name=name;o.castShadow=true;o.receiveShadow=true;root.add(o);occluders.push(o);return o;
 }
 ribbon(0,p.depth,()=>-.12,floor,concrete,'Podlaha oblúkového parkovania');
 ribbon(-.1,p.depth+.1,ceiling,s=>ceiling(s)+p.roof,concrete,'Nosný strop oblúkového parkovania');
 ribbon(0,p.depth,s=>ceiling(s)+p.roof,roof,white,'Zelená strecha oblúkového parkovania',grass);
 ribbon(p.depth-.12,p.depth+.12,floor,ceiling,concrete,'Zadná oporná stena oblúkového parkovania');
 // The first end shares the existing row's wall; close only the far end.
 const end=curvedFrame(curvedLength);box(end.x+end.nx*p.depth/2,floor(curvedLength)+p.clearance/2,end.z+end.nz*p.depth/2,.24,p.clearance,p.depth,concrete,end.angle,'Koncová stena parkovania');
 for(const s of curvedBayCuts){const f=curvedFrame(s);box(f.x,floor(s)+p.clearance/2,f.z,.26,p.clearance,.26,white,f.angle,'Stĺp oblúkového parkovania');}
 for(const s of curvedBayCuts.slice(1,-1)){const f=curvedFrame(s);box(f.x+f.nx*3.3,floor(s)+.006,f.z+f.nz*3.3,.055,.01,6.1,line,f.angle,'Označenie parkovacieho miesta',false)}
 for(const bay of curvedParkingBays){
  const f=curvedFrame(bay.s),y=floor(bay.s);
  box(f.x+f.nx*6.7,y+.075,f.z+f.nz*6.7,1.8,.15,.22,concrete,f.angle,'Doraz pri parkovaní');
  box(f.x+f.nx*3.7,y+p.clearance-.045,f.z+f.nz*3.7,1.35,.08,.16,lamp,f.angle,'Osvetlenie parkovania',false);
  const plaque=new T.Group();plaque.position.set(f.x+f.nx*(p.depth-.15),y,f.z+f.nz*(p.depth-.15));plaque.rotation.y=f.angle;root.add(plaque);number(plaque,bay.id,0,1.9,0);
 }
 function rod(a,b,r=.023){const v=new T.Vector3(...a),w=new T.Vector3(...b),delta=w.clone().sub(v),m=new T.Mesh(new T.CylinderGeometry(r,r,delta.length(),8),steel);m.position.copy(v).add(w).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());m.castShadow=true;root.add(m)}
 const rail=[];for(let s=0;s<curvedLength;s+=.7)rail.push(s);rail.push(curvedLength);
 for(let i=1;i<rail.length;i++){const a=curvedFrame(rail[i-1]),b=curvedFrame(rail[i]);rod([a.x+a.nx*.18,roof(a.s)+1.02,a.z+a.nz*.18],[b.x+b.nx*.18,roof(b.s)+1.02,b.z+b.nz*.18],.02)}
 for(let s=0;s<=curvedLength;s+=1.35){const f=curvedFrame(s);box(f.x+f.nx*.18,roof(s)+.51,f.z+f.nz*.18,.035,1.02,.035,steel,f.angle,'Zábradlie zelenej strechy',false)}
 // A tapered retaining edge closes the final earth bank behind the service
 // building. It follows the same grass profile and stays outside the road.
 for(let z=p.terrainZ0;z<p.endZ;z+=.25){const dz=Math.min(.25,p.endZ-z),y=curvedBankHeight(p.cx-p.frontRadius,z+dz/2,base)??-.06,h=y+.06;if(h>.001)box(p.cx-p.frontRadius,(y-.06)/2,z+dz/2,.16,h,dz+.005,white,0,'Dobeh oporného múrika');}
 root.userData={occluders,bays:curvedParkingBays};return root;
}

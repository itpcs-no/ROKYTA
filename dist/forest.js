import * as T from 'three';
import {siteBoundary,inSitePolygon} from './site-layout.js';

// Mixed deciduous forest around the site, as on the 2007 aerial photographs:
// a dense belt on the slopes south, west and north, open meadow to the north-east.
// Two instanced meshes (trunks, crowns) keep several hundred trees cheap.
export function buildForest(){
 const root=new T.Group();root.name='Les okolo areálu';
 let seed=4021;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 const ring=siteBoundary.flatMap(p=>p.points);
 const segs=ring.slice(1).map((p,i)=>[ring[i],p]);
 const distance=(x,z)=>Math.min(...segs.map(([a,b])=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)}));
 const trees=[];
 for(let i=0;i<5200&&trees.length<760;i++){
  const x=-102+rnd()*204,z=-92+rnd()*184;
  if(inSitePolygon(x,z,ring))continue;
  const d=distance(x,z);if(d<7)continue;
  if(Math.abs(x-51.5)<7.5)continue;                 // public road
  if(x>58&&z<-20)continue;                           // north-east meadow
  const density=Math.min(1,(d-7)/14)*(.75+.25*Math.sin(x*.09)*Math.cos(z*.07));
  if(rnd()>density)continue;
  if(trees.some(t=>Math.hypot(t.x-x,t.z-z)<3.2))continue;
  trees.push({x,z,h:9+rnd()*9,r:2.6+rnd()*2.6,tone:rnd()});
 }
 const crownGeo=new T.IcosahedronGeometry(1,2),pos=crownGeo.attributes.position,v=new T.Vector3();
 for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i);const n=1+.12*Math.sin(v.x*5.1+v.y*3.7)+.09*Math.cos(v.z*6.3-v.y*2.2);pos.setXYZ(i,v.x*n,v.y*n*.85,v.z*n)}
 crownGeo.computeVertexNormals();
 const trunkGeo=new T.CylinderGeometry(.16,.26,1,6);trunkGeo.translate(0,.5,0);
 const crowns=new T.InstancedMesh(crownGeo,new T.MeshStandardMaterial({color:0xffffff,roughness:.95}),trees.length*2);
 const trunks=new T.InstancedMesh(trunkGeo,new T.MeshStandardMaterial({color:0x4b4237,roughness:1}),trees.length);
 const m=new T.Object3D(),c=new T.Color();let k=0;
 trees.forEach((t,i)=>{m.position.set(t.x,0,t.z);m.rotation.set(0,rnd()*6.28,0);m.scale.set(1,t.h*.55,1);m.updateMatrix();trunks.setMatrixAt(i,m.matrix);
  for(let j=0;j<2;j++){const ox=(rnd()-.5)*t.r*.7,oz=(rnd()-.5)*t.r*.7,s=t.r*(j?.78:1);m.position.set(t.x+ox,t.h*(j?.82:.62),t.z+oz);m.rotation.set(rnd(),rnd()*6.28,rnd());m.scale.set(s,s*1.05,s);m.updateMatrix();crowns.setMatrixAt(k,m.matrix);
   c.setHSL(.24+t.tone*.06,.38+t.tone*.15,.2+t.tone*.08+(j?.03:0));crowns.setColorAt(k,c);k++}});
 for(const o of [crowns,trunks]){o.castShadow=true;o.receiveShadow=true;o.instanceMatrix.needsUpdate=true;root.add(o)}
 crowns.instanceColor.needsUpdate=true;crowns.name='Koruny lesa';trunks.name='Kmene lesa';
 root.userData.count=trees.length;
 return root;
}

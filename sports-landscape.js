import * as T from 'three';
import {surface} from './surface-materials.js';
import {ramp} from './project-geometry.js';
import {courtSite,courtTerrainBounds,courtTerrainHeight,courtStairHeight} from './court-layout.js';
import {curvedParking,curvedOutline} from './curved-parking-layout.js';
import {subtractTopSurfaces} from './surface-geometry.js';
import {hillsideHomes,inRect} from './homes-layout.js';
import {buildHillsideHomes} from './hillside-homes.js';
import {hillsideParking,parkingBlockAt,courtFrontWalls} from './parking-layout.js';

export function buildSportsLandscape(){
 const root=new T.Group();root.name='Kopček a rodinné domy';
 const s=courtSite,st=s.stairs,level=s.level,base=ramp.bottom;
 const plaster=surface('plaster'),paving=surface('paving'),grass=surface('grass');
 const steel=new T.MeshStandardMaterial({color:0x304e43,metalness:.65,roughness:.48});
 const box=(g,x,y,z,w,h,d,m)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o};
 const tube=(a,b,r=.035,m=steel)=>{const dir=new T.Vector3().subVectors(b,a);const o=new T.Mesh(new T.CylinderGeometry(r,r,dir.length(),10),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());o.castShadow=true;root.add(o);return o};
 const v=(x,y,z)=>new T.Vector3(x,y,z);
 // One connected height-field. Extra columns along the stairs keep soil out of
 // the tread volume; all court slabs sit within the flat upper terrace.
 const xset=new Set();for(let x=s.x0;x<=s.x1;x++)xset.add(x);
 for(let x=-68;x<=-47.5;x+=.5)xset.add(x);xset.add(-63.5);
 for(const b of hillsideParking.blocks)for(const x of [b.x0-3.5,b.x0,b.x1,b.x1+3.5])xset.add(x);
 for(const h of hillsideHomes){xset.add(h.pool.x0);xset.add(h.pool.x1)}
 xset.add(st.x-st.width/2-.16);xset.add(st.x+st.width/2+.16);const xs=[...xset].sort((a,b)=>a-b);
 const zset=new Set();for(let z=s.z0;z<=s.z1;z++)zset.add(z);for(let z=courtTerrainBounds.z0;z<s.z0;z+=.5)zset.add(z);zset.add(hillsideParking.back);for(const h of hillsideHomes){zset.add(h.pool.z0);zset.add(h.pool.z1)}const zs=[...zset].sort((a,b)=>a-b);
 const points=[],indices=[];for(const z of zs)for(const x of xs)points.push(x,courtTerrainHeight(x,z,base)??-.06,z);
 for(let j=0;j<zs.length-1;j++)for(let i=0;i<xs.length-1;i++){if(hillsideHomes.some(h=>inRect((xs[i]+xs[i+1])/2,(zs[j]+zs[j+1])/2,h.pool)))continue;const a=j*xs.length+i,b=a+1,c=a+xs.length,d=c+1;indices.push(a,c,b,b,c,d)}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));geo.setIndex(indices);geo.computeVertexNormals();geo.userData.uvProjection='xz';
 const hill=new T.Mesh(geo,grass);hill.name='Continuous graded hill';hill.receiveShadow=true;hill.castShadow=true;root.add(hill);
 // The exact curved roof replaces the grid above the bays. Cut the adjacent
 // road too, including steep triangles, so no turf intrudes into the openings.
 subtractTopSurfaces(hill,[curvedOutline(curvedParking.depth,-5)],false,0);
 // The mound's front meets the existing road without taking over its surface.
 const skirt=[];for(let i=0;i<xs.length-1;i++){const x=xs[i],xx=xs[i+1];if(parkingBlockAt((x+xx)/2,s.z0))continue;const a=courtTerrainHeight(x,s.z0,base),b=courtTerrainHeight(xx,s.z0,base);skirt.push(x,-.06,s.z0,xx,b,s.z0,x,a,s.z0,x,-.06,s.z0,xx,-.06,s.z0,xx,b,s.z0)}
 const sg=new T.BufferGeometry();sg.setAttribute('position',new T.Float32BufferAttribute(skirt,3));sg.computeVertexNormals();const soil=new T.Mesh(sg,surface('soil'));root.add(soil);
 // Continuous solid stair profile rather than disconnected floating treads.
 function stairSolid(x,width,parapet=0){
  const p=new T.Shape(),step=(st.z1-st.z0)/st.count;p.moveTo(st.z0,-.06);p.lineTo(st.z0,base+(level-base)/st.count+parapet);
  for(let i=0;i<st.count;i++){const z=st.z0+(i+1)*step,y=base+(i+1)*(level-base)/st.count+parapet;p.lineTo(z,y);if(i<st.count-1)p.lineTo(z,y+(level-base)/st.count)}
  p.lineTo(st.z1,-.06);p.closePath();const g=new T.ExtrudeGeometry(p,{depth:width,bevelEnabled:false});g.rotateY(-Math.PI/2);const o=new T.Mesh(g,parapet?plaster:paving);o.position.x=x+width/2;o.castShadow=true;o.receiveShadow=true;o.name=parapet?'Stair side wall':'Solid stairs to family homes';root.add(o);
 }
 stairSolid(st.x,st.width);stairSolid(st.x-st.width/2-.08,.16,.22);stairSolid(st.x+st.width/2+.08,.16,.22);
 box(root,st.x,base-.11,(s.z0+st.z0)/2,st.width,.22,st.z0-s.z0,paving);
 box(root,st.x,level-.11,(st.z1+49.35)/2,st.width,.22,49.35-st.z1,paving);
 box(root,(s.link.x0+s.link.x1)/2,level-.08,(s.link.z0+s.link.z1)/2,s.link.x1-s.link.x0,.16,s.link.z1-s.link.z0,paving);
 for(const x of [st.x-st.width/2-.08,st.x+st.width/2+.08]){
  tube(v(x,base+1.02,st.z0),v(x,level+1.02,st.z1));
  for(let i=0;i<=6;i++){const z=st.z0+i*(st.z1-st.z0)/6,y=courtStairHeight(z,base);tube(v(x,y+.2,z),v(x,base+1.02+(z-st.z0)/(st.z1-st.z0)*(level-base),z),.024)}
 }
 for(const [a,b] of courtFrontWalls){
  const vertices=[],faces=[],n=Math.ceil((b-a)*2);
  for(let i=0;i<=n;i++){const x=a+(b-a)*i/n,top=Math.max(base+.64,courtTerrainHeight(x,s.z0,base)+.04);vertices.push(x,-.06,s.z0,x,top,s.z0,x,-.06,s.z0+.24,x,top,s.z0+.24);if(i){const k=(i-1)*4,q=i*4;faces.push(k,k+1,q,k+1,q+1,q,k+1,k+3,q+1,k+3,q+3,q+1,k+2,q+2,k+3,k+3,q+2,q+3)}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(faces);g.computeVertexNormals();const m=plaster.clone();m.side=T.DoubleSide;const wall=new T.Mesh(g,m);wall.name='Oporný múr s vjazdmi pod rodinné domy';wall.castShadow=true;wall.receiveShadow=true;root.add(wall);
 }
 const homes=buildHillsideHomes(base);root.add(homes);
 root.userData={estimatedFrom:'2007 aerial terrain with new family-house concept',courts:0,homes,level,stairs:st};return root;
}

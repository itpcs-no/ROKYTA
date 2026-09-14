import * as T from 'three';
import {surface} from './surface-materials.js';
import {ramp} from './project-geometry.js';
import {courtSite,courts,courtFences,courtNets,courtTerrainHeight,courtStairHeight} from './court-layout.js';
import {hillsideParking,parkingBlockAt,courtFrontWalls} from './parking-layout.js';

export function buildSportsLandscape(){
 const root=new T.Group();root.name='Kopček a kurty podľa fotografií 2007';
 const s=courtSite,st=s.stairs,level=s.level,base=ramp.bottom;
 const plaster=surface('plaster'),paving=surface('paving'),grass=surface('grass');
 const steel=new T.MeshStandardMaterial({color:0x304e43,metalness:.65,roughness:.48});
 const blue=surface('courtBlue'),red=surface('courtRed');
 const white=new T.MeshStandardMaterial({color:0xe6e1d7,roughness:.9});
 const box=(g,x,y,z,w,h,d,m)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o};
 const tube=(a,b,r=.035,m=steel)=>{const dir=new T.Vector3().subVectors(b,a);const o=new T.Mesh(new T.CylinderGeometry(r,r,dir.length(),10),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());o.castShadow=true;root.add(o);return o};
 const v=(x,y,z)=>new T.Vector3(x,y,z);
 // One connected height-field. Extra columns along the stairs keep soil out of
 // the tread volume; all court slabs sit within the flat upper terrace.
 const xset=new Set();for(let x=s.x0;x<=s.x1;x++)xset.add(x);
 for(const b of hillsideParking.blocks)for(const x of [b.x0-3.5,b.x0,b.x1,b.x1+3.5])xset.add(x);
 xset.add(st.x-st.width/2-.16);xset.add(st.x+st.width/2+.16);const xs=[...xset].sort((a,b)=>a-b);
 const zs=[];for(let z=s.z0;z<=s.z1;z++)zs.push(z);zs.push(hillsideParking.back);zs.sort((a,b)=>a-b);
 const points=[],indices=[];for(const z of zs)for(const x of xs)points.push(x,courtTerrainHeight(x,z,base),z);
 for(let j=0;j<zs.length-1;j++)for(let i=0;i<xs.length-1;i++){const a=j*xs.length+i,b=a+1,c=a+xs.length,d=c+1;indices.push(a,c,b,b,c,d)}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));geo.setIndex(indices);geo.computeVertexNormals();
 const hill=new T.Mesh(geo,grass);hill.name='Continuous graded hill';hill.receiveShadow=true;hill.castShadow=true;root.add(hill);
 // The mound's front meets the existing road without taking over its surface.
 const skirt=[];for(let i=0;i<xs.length-1;i++){const x=xs[i],xx=xs[i+1];if(parkingBlockAt((x+xx)/2,s.z0))continue;const a=courtTerrainHeight(x,s.z0,base),b=courtTerrainHeight(xx,s.z0,base);skirt.push(x,-.06,s.z0,xx,b,s.z0,x,a,s.z0,x,-.06,s.z0,xx,-.06,s.z0,xx,b,s.z0)}
 const sg=new T.BufferGeometry();sg.setAttribute('position',new T.Float32BufferAttribute(skirt,3));sg.computeVertexNormals();const soil=new T.Mesh(sg,surface('soil'));root.add(soil);
 // Continuous solid stair profile rather than disconnected floating treads.
 function stairSolid(x,width,parapet=0){
  const p=new T.Shape(),step=(st.z1-st.z0)/st.count;p.moveTo(st.z0,-.06);p.lineTo(st.z0,base+(level-base)/st.count+parapet);
  for(let i=0;i<st.count;i++){const z=st.z0+(i+1)*step,y=base+(i+1)*(level-base)/st.count+parapet;p.lineTo(z,y);if(i<st.count-1)p.lineTo(z,y+(level-base)/st.count)}
  p.lineTo(st.z1,-.06);p.closePath();const g=new T.ExtrudeGeometry(p,{depth:width,bevelEnabled:false});g.rotateY(-Math.PI/2);const o=new T.Mesh(g,parapet?plaster:paving);o.position.x=x+width/2;o.castShadow=true;o.receiveShadow=true;o.name=parapet?'Stair side wall':'Solid stairs to courts';root.add(o);
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
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(faces);g.computeVertexNormals();const m=plaster.clone();m.side=T.DoubleSide;const wall=new T.Mesh(g,m);wall.name='Oporný múr s vjazdmi pod kurty';wall.castShadow=true;wall.receiveShadow=true;root.add(wall);
 }
 // Open diamond mesh: it remains visually light and never casts a solid wall shadow.
 const pixels=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const on=Math.abs(x-y)<1.5||Math.abs(x+y-31)<1.5;const k=(y*32+x)*4;pixels[k]=pixels[k+1]=pixels[k+2]=on?255:0;pixels[k+3]=255}
 const meshMap=new T.DataTexture(pixels,32,32,T.RGBAFormat);meshMap.wrapS=meshMap.wrapT=T.RepeatWrapping;meshMap.magFilter=T.LinearFilter;meshMap.minFilter=T.LinearMipmapLinearFilter;meshMap.generateMipmaps=true;meshMap.needsUpdate=true;
 function meshMaterial(width,height,color,cell=.12){const map=meshMap.clone();map.repeat.set(width/cell,height/cell);map.needsUpdate=true;return new T.MeshBasicMaterial({color,alphaMap:map,transparent:true,opacity:.68,depthWrite:false,side:T.DoubleSide})}
 for(const f of courtFences){
  const [ax,az]=f.a,[bx,bz]=f.b,len=Math.hypot(bx-ax,bz-az),h=3.05;
  const fence=new T.Mesh(new T.PlaneGeometry(len,h),meshMaterial(len,h,0x355b49));fence.position.set((ax+bx)/2,level+h/2,(az+bz)/2);fence.rotation.y=-Math.atan2(bz-az,bx-ax);fence.name='Court wire fence';root.add(fence);
  tube(v(ax,level+h,az),v(bx,level+h,bz),.025);
  const count=Math.ceil(len/3);for(let i=0;i<=count;i++){const t=i/count,x=ax+(bx-ax)*t,z=az+(bz-az)*t;tube(v(x,level-.15,z),v(x,level+h+.06,z),.036)}
 }
 for(const [i,c] of courts.entries()){
  const slab=box(root,c.x,level-.12,c.z,c.length,.24,c.width,blue);slab.name=c.name;
  box(root,c.x,level-.006,c.z,c.playLength,.016,c.playWidth,red);
  const line=(x,z,w,d)=>{const o=box(root,x,level+.005,z,w,.008,d,white);o.castShadow=false};
  const a=c.x-c.playLength/2,b=c.x+c.playLength/2,za=c.z-c.playWidth/2,zb=c.z+c.playWidth/2;
  for(const x of [a,b])line(x,c.z,.06,c.playWidth+.06);for(const z of [za,zb])line(c.x,z,c.playLength+.06,.05);
  if(c.type==='tennis'){
   for(const z of [c.z-4.12,c.z+4.12])line(c.x,z,c.playLength,.05);
   for(const x of [c.x-6.4,c.x+6.4])line(x,c.z,.05,8.24);
   line(c.x,c.z,12.8,.05);for(const x of [a,b])line(x,c.z,.16,.05);
  }else{line(c.x,c.z,.05,c.playWidth);for(const x of [c.x-3,c.x+3])line(x,c.z,.05,c.playWidth)}
  const net=courtNets[i],length=net.b[1]-net.a[1],bottom=c.type==='tennis'?.12:1.35;
  const ng=new T.PlaneGeometry(length,net.height-bottom,32,1),pos=ng.attributes.position;
  for(let j=0;j<pos.count;j++){const fraction=pos.getX(j)/(length/2),sag=c.type==='tennis'?.065*(1-fraction*fraction):.04*(1-fraction*fraction);if(pos.getY(j)>0)pos.setY(j,pos.getY(j)-sag)}
  const n=new T.Mesh(ng,meshMaterial(length,net.height-bottom,0x202925,.065));n.rotation.y=-Math.PI/2;n.position.set(c.x,level+bottom+(net.height-bottom)/2,c.z);n.name='Playing net';root.add(n);
  const cord=[];for(let j=0;j<=32;j++){const t=j/32,sag=(c.type==='tennis'?.065:.04)*(1-(t*2-1)**2);cord.push(v(c.x,level+net.height-sag,net.a[1]+t*length))}
  const tape=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(cord),32,.013,5,false),white);root.add(tape);
  for(const [x,z] of [net.a,net.b])tube(v(x,level,z),v(x,level+net.height+.1,z),.042);
 }
 root.userData={estimatedFrom:'2007_0504o0148 / 0157 / 0159',courts:courts.length,level,stairs:st};return root;
}

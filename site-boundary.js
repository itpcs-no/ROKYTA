import * as T from 'three';
import {surface,glassMaterial} from './surface-materials.js';
import {createPlanting} from './planting.js';
import {ramp,exteriorHeight} from './project-geometry.js';
import {courtTerrainHeight} from './court-layout.js';
import {entrance,serviceHouse,serviceShed,servicePaving,siteRoads,siteShoulderHeight,boundarySegments} from './site-layout.js';

export function buildSiteBoundary(){
 const root=new T.Group();root.name='Príjazd, obvod areálu a vedľajšie objekty';
 const plaster=surface('plaster'),concrete=surface('concrete'),paving=surface('paving'),grass=surface('grass'),asphalt=surface('asphalt');
 const metal=new T.MeshStandardMaterial({color:0x6d7779,metalness:.68,roughness:.38});
 const dark=new T.MeshStandardMaterial({color:0x343d3d,metalness:.55,roughness:.4});
 const silver=new T.MeshStandardMaterial({color:0xb7bec0,metalness:.72,roughness:.34});
 const glass=glassMaterial();
 const box=(x,y,z,w,h,d,m=plaster,g=root)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=!m.transparent;o.receiveShadow=true;g.add(o);return o};
 function mesh(points,indices,material,name){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));geo.setIndex(indices);geo.computeVertexNormals();const m=new T.Mesh(geo,material);m.castShadow=true;m.receiveShadow=true;m.name=name;root.add(m);return m}
 function solidPolygon(poly,y,m,name){const shape=new T.Shape();poly.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:y+.12,bevelEnabled:false});geo.rotateX(-Math.PI/2);const o=new T.Mesh(geo,m);o.position.y=-.12;o.receiveShadow=true;o.castShadow=true;o.name=name;root.add(o)}
 // Continuous ribbons share the same sampled centreline as walking/driving heights.
 // The full-depth side faces close the fill down to the existing ground plane.
 for(const road of siteRoads(ramp.bottom)){
  const p=[],top=[],side=[],ps=road.points;
  ps.forEach((a,i)=>{const prev=ps[Math.max(0,i-1)],next=ps[Math.min(ps.length-1,i+1)],dx=next[0]-prev[0],dz=next[1]-prev[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
   for(const s of [-1,1])p.push(a[0]+s*nx*road.width/2,a[2],a[1]+s*nz*road.width/2);
   for(const s of [-1,1])p.push(a[0]+s*nx*road.width/2,-.12,a[1]+s*nz*road.width/2);
   if(i){const a=(i-1)*4,b=i*4;top.push(a,b,a+1,a+1,b,b+1);side.push(a,a+2,b,a+2,b+2,b,b+1,b+3,a+1,b+3,a+3,a+1)}
  });
  const surf=asphalt.clone();surf.side=T.DoubleSide;mesh(p,top,surf,road.name).userData.walkSurface=true;
  const fill=concrete.clone();fill.side=T.DoubleSide;side.push(0,1,2,1,3,2);const n=(ps.length-1)*4;side.push(n,n+2,n+1,n+1,n+2,n+3);mesh(p,side,fill,'Plné podložie cesty');
 }
 solidPolygon(servicePaving,.06,paving,'Spevnený dvor pri vedľajších objektoch');
 solidPolygon([[-48.6,-9.95],[-37,-9.95],[-37,-5.65],[-48.6,-5.65]],.06,paving,'Napojenie kobiek na obvodovú cestu');
 solidPolygon([[-37,-49],[-35,-49],[-35,-43.5],[-37,-43.5]],.06,paving,'Peší výstup z areálu');
 // Graded grass shoulders: no suspended asphalt sheets or exposed open undersides.
 const tp=[],ti=[];
 for(let x=-66;x<59;x+=.6)for(let z=-66;z<71;z+=.6){
  const v=[[x,z],[x+.6,z],[x+.6,z+.6],[x,z+.6]],ys=v.map(([x,z])=>siteShoulderHeight(x,z,ramp.bottom));
  if(ys.some(y=>y===null))continue;const n=tp.length/3;v.forEach(([x,z],i)=>tp.push(x,ys[i],z));ti.push(n,n+2,n+1,n,n+3,n+2);
 }
 mesh(tp,ti,grass,'Trávnaté svahy pri príjazde');
 // Wall bases follow terrain in short panels; overlapping footings prevent gaps.
 const terrain=(x,z)=>Math.max(-.06,courtTerrainHeight(x,z,ramp.bottom)??exteriorHeight(x,z)-.02);
 const bars=new Map();
 function bar(a,b,width,mat){const delta=new T.Vector3().subVectors(b,a),o=new T.Object3D();o.position.copy(a).add(b).multiplyScalar(.5);o.scale.set(width,delta.length(),width);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());o.updateMatrix();if(!bars.has(mat))bars.set(mat,[]);bars.get(mat).push(o.matrix.clone())}
 const plants=createPlanting();
 for(const seg of boundarySegments){
  const dx=seg.b[0]-seg.a[0],dz=seg.b[1]-seg.a[1],len=Math.hypot(dx,dz),count=Math.ceil(len/2.6);
  for(let i=0;i<count;i++){
   const ax=seg.a[0]+dx*i/count,az=seg.a[1]+dz*i/count,bx=seg.a[0]+dx*(i+1)/count,bz=seg.a[1]+dz*(i+1)/count;
   const ya=terrain(ax,az),yb=terrain(bx,bz),base=Math.min(ya,yb)-.18,top=Math.max(ya,yb)+(seg.type==='wall'?1.75:.52),cx=(ax+bx)/2,cz=(az+bz)/2;
   const wall=box(cx,(top+base)/2,cz,len/count+.025,top-base,.28,plaster);wall.rotation.y=-Math.atan2(dz,dx);
   const cap=box(cx,top+.035,cz,len/count+.04,.07,.36,concrete);cap.rotation.y=wall.rotation.y;
   if(seg.type==='fence'){
    const h=1.08;bar(new T.Vector3(ax,ya+.4,az),new T.Vector3(ax,ya+.55+h,az),.045,dark);
    for(const dy of [.68,1.53])bar(new T.Vector3(ax,ya+dy,az),new T.Vector3(bx,yb+dy,bz),.035,dark);
    const n=Math.ceil(len/count/.22);for(let k=1;k<=n;k++){const t=k/n;bar(new T.Vector3(ax+(bx-ax)*t,ya+(yb-ya)*t+.58,az+(bz-az)*t),new T.Vector3(ax+(bx-ax)*t,ya+(yb-ya)*t+1.53,az+(bz-az)*t),.018,dark)}
   }else if(i%3===0&&cz<20){plants.shrub(cx-.6,cz,terrain(cx-.6,cz),.6)}
  }
 }
 // Broad metal sliding gate, parked behind the side wall when open.
 box(43.85,(ramp.bottom-.12)/2,23.75,1.1,ramp.bottom+.12,7.5,concrete).name='Základ a koľajnica posuvnej brány';
 box(43.71,ramp.bottom+.012,27.05,.055,.024,13.8,metal);
 for(const z of [27.2,33.8]){box(entrance.x,ramp.bottom+1.07,z,.7,2.14,.66);box(entrance.x,ramp.bottom+2.18,z,.8,.1,.76,concrete)}
 const gate=new T.Group();gate.name='Posuvná vstupná brána';root.add(gate);gate.position.set(entrance.x-.29,ramp.bottom,entrance.z);
 box(0,1.04,0,.09,1.94,entrance.width,metal,gate);
 for(let z=-entrance.width/2+.12;z<entrance.width/2;z+=.19)box(.06,1.04,z,.045,1.86,.035,silver,gate);
 for(const y of [.1,1.98])box(0,y,0,.14,.08,entrance.width+.1,dark,gate);
 box(entrance.x-.45,ramp.bottom+.23,26.6,.4,.46,.38,dark);
 box(entrance.x+.37,ramp.bottom+1.25,27.2,.045,.33,.2,dark);
 // Detached white service building and its gently curved sheet-metal roof.
 const h=serviceHouse,cx=(h.x0+h.x1)/2,cz=(h.z0+h.z1)/2;
 const building=box(cx,h.base+h.eaves/2,cz,h.x1-h.x0,h.eaves,h.z1-h.z0);building.name='Vedľajší objekt osadený podľa situačnej mapy';
 box(cx,.13,cz,h.x1-h.x0+.12,.26,h.z1-h.z0+.12,concrete);
 for(const [i,fraction] of [.2,.55,.83].entries()){
  const z=h.z0+(h.z1-h.z0)*fraction,isDoor=i===1;
  const width=isDoor?1.15:1.35,bottom=isDoor?0:.95,height=isDoor?2.22:1.05;
  box(h.x1+.025,h.base+bottom+height/2,z,.07,height+.13,width+.14,dark);
  box(h.x1+.065,h.base+bottom+height/2,z,.025,height,width,isDoor?metal:glass);
  if(!isDoor)box(h.x1+.12,h.base+bottom-.04,z,.26,.08,width+.22,concrete);
 }
 function barrel(x0,x1,z0,z1,y,rise){
  const points=[],idx=[],n=28;
  for(let i=0;i<=n;i++){const t=i/n,x=x0+(x1-x0)*t,hy=y+rise*4*t*(1-t);points.push(x,hy,z0,x,hy,z1);if(i){const a=(i-1)*2;idx.push(a,a+2,a+1,a+1,a+2,a+3)}}
  const mat=silver.clone();mat.side=T.DoubleSide;mesh(points,idx,mat,'Oblá plechová strecha');
  for(const z of [z0,z1]){const p=[x0,y,z],ind=[];for(let i=1;i<=n;i++){const t=i/n;p.push(x0+(x1-x0)*t,y+rise*4*t*(1-t),z);if(i>1)ind.push(0,i-1,i)}mesh(p,ind,plaster.clone(),'Čelo oblúka strechy').material.side=T.DoubleSide}
  for(let z=z0;z<=z1;z+=.65){const vertices=[];for(let i=0;i<=n;i++){const t=i/n;vertices.push(new T.Vector3(x0+(x1-x0)*t,y+rise*4*t*(1-t)+.018,z))}const g=new T.BufferGeometry().setFromPoints(vertices);root.add(new T.Line(g,new T.LineBasicMaterial({color:0x8b9495})))}
  for(const x of [x0,x1])bar(new T.Vector3(x,y-.025,z0),new T.Vector3(x,y-.025,z1),.09,metal);
 }
 barrel(h.x0-.25,h.x1+.25,h.z0-.3,h.z1+.3,h.base+h.eaves,h.rise);
 for(const z of [h.z0+.1,h.z1-.1])bar(new T.Vector3(h.x0-.08,h.base,z),new T.Vector3(h.x0-.08,h.base+h.eaves,z),.09,metal);
 const s=serviceShed,sx=(s.x0+s.x1)/2,sz=(s.z0+s.z1)/2;
 box(s.x0,s.base+1.42,sz,.22,2.84,s.z1-s.z0);for(const z of [s.z0,s.z1])box(sx,s.base+1.42,z,s.x1-s.x0,2.84,.22);
 for(let i=0;i<=3;i++)box(s.x1,s.base+1.4,s.z0+(s.z1-s.z0)*i/3,.18,2.8,.18);
 box(sx,s.base+2.76,sz,s.x1-s.x0+.45,.18,s.z1-s.z0+.5,silver).name='Otvorený prístrešok pri vedľajšom objekte';
 for(const [x,z] of [[-62,-15],[-61,11],[-61,22],[40,-35],[39,-18],[-25,-40],[23,-38]])plants.tree(x,z,terrain(x,z),.72,true);
 root.add(plants.finish());
 for(const [mat,matrices] of bars){const o=new T.InstancedMesh(new T.BoxGeometry(1,1,1),mat,matrices.length);matrices.forEach((m,i)=>o.setMatrixAt(i,m));o.name='Kovové profily oplotenia a odkvapov';o.castShadow=true;o.receiveShadow=true;root.add(o)}
 const setGate=open=>{gate.position.z=entrance.z-(open?entrance.slide:0)};setGate(true);
 root.userData={setGate,gate,estimatedFromPhotos:true,ancillaryPlacementReference:'assets/site-map.png'};return root;
}

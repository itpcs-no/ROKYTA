import * as T from 'three';
import {surface,glassMaterial} from './surface-materials.js';
import {createPlanting} from './planting.js';
import {ramp,access,exteriorHeight,gardenPavedAreas} from './project-geometry.js';
import {courtTerrainHeight} from './court-layout.js';
import {northExit,northExitPath,entrances,secondaryAccess,entranceHeight,entrancePocket,closestRoad,serviceHouse,serviceShed,servicePaving,siteRoads,siteShoulderHeight,roadsideGarden,boundarySegments} from './site-layout.js';
import {homeRoads} from './homes-layout.js';
import {buildSocialPavilion} from './social-pavilion.js';
import {wellnessOutline,wellnessBeds} from './wellness-layout.js';
import {subtractTopSurfaces,roadOutline,roadEdges,rectOutline} from './surface-geometry.js';
import {gardenBankOutline} from './garden-bank-layout.js';

export function buildSiteBoundary(){
 const root=new T.Group();root.name='Príjazd, obvod areálu a vedľajšie objekty';
 const plaster=surface('plaster'),concrete=surface('concrete'),paving=surface('paving'),grass=surface('grass'),asphalt=surface('asphalt');
 const metal=new T.MeshStandardMaterial({color:0x6d7779,metalness:.68,roughness:.38});
 const dark=new T.MeshStandardMaterial({color:0x343d3d,metalness:.55,roughness:.4});
 const silver=new T.MeshStandardMaterial({color:0xb7bec0,metalness:.72,roughness:.34});
 const glass=glassMaterial();
 const box=(x,y,z,w,h,d,m=plaster,g=root)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=!m.transparent;o.receiveShadow=true;g.add(o);return o};
 function mesh(points,indices,material,name){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));geo.setIndex(indices);geo.computeVertexNormals();const m=new T.Mesh(geo,material);m.castShadow=true;m.receiveShadow=true;m.name=name;root.add(m);return m}
 function solidPolygon(poly,y,m,name){const shape=new T.Shape();poly.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:y+.12,bevelEnabled:false});geo.rotateX(-Math.PI/2);const o=new T.Mesh(geo,m);o.position.y=-.12;o.receiveShadow=true;o.castShadow=true;o.name=name;root.add(o);return o}
 const cellarLink=[[-48.6,-9.95],[-37,-9.95],[-37,-5.65],[-48.6,-5.65]];
 const roads=siteRoads(ramp.bottom),roadOutlines=roads.map(roadOutline);
 // Continuous ribbons share the same sampled centreline as walking/driving heights.
 // The full-depth side faces close the fill down to the existing ground plane.
 for(const [roadIndex,road] of roads.entries()){
  const p=[],top=[],side=[],ps=road.points,widthSteps=road.heightAt?10:1,stride=widthSteps+3;
  roadEdges(road).forEach((edges,i)=>{
   const [left,right]=edges;
   for(let j=0;j<=widthSteps;j++){const t=j/widthSteps,x=left[0]+(right[0]-left[0])*t,z=left[2]+(right[2]-left[2])*t;p.push(x,road.heightAt?road.heightAt(x,z):left[1],z)}
   for(const [x,y,z] of edges)p.push(x,-.12,z);
   if(i){const a=(i-1)*stride,b=i*stride,L=widthSteps+1,R=widthSteps+2;for(let j=0;j<widthSteps;j++)top.push(a+j,a+j+1,b+j,a+j+1,b+j+1,b+j);side.push(a,a+L,b,a+L,b+L,b,b+widthSteps,b+R,a+widthSteps,b+R,a+R,a+widthSteps)}
  });
  const surfaceMesh=mesh(p,top,asphalt,road.name);surfaceMesh.userData.walkSurface=true;surfaceMesh.geometry.userData.uvProjection='xz';
  subtractTopSurfaces(surfaceMesh,[servicePaving,cellarLink,...homeRoads(ramp.bottom).map(roadOutline),...roadOutlines.slice(0,roadIndex)]);
  const fill=concrete.clone();fill.side=T.DoubleSide;const L=widthSteps+1,R=widthSteps+2;side.push(0,widthSteps,L,widthSteps,R,L);const n=(ps.length-1)*stride;side.push(n,n+L,n+widthSteps,n+widthSteps,n+L,n+R);mesh(p,side,fill,'Plné podložie cesty');
 }
 solidPolygon(servicePaving,.06,paving,'Spevnený dvor pri vedľajších objektoch');
 subtractTopSurfaces(solidPolygon(cellarLink,.06,paving,'Napojenie kobiek na obvodovú cestu'),[servicePaving]);
 solidPolygon(northExitPath,.06,paving,'Peší výstup z areálu v osi budovy');
 {// Wicket gate: steel frame with vertical bars, matching the boundary metalwork.
  const gate=new T.Group();gate.name='Branka pešieho výstupu';root.add(gate);const w=northExit.width-.24;
  for(const sx of [-1,1])box(northExit.x+sx*(northExit.width/2-.06),1.05,northExit.z,.14,2.1,.14,dark,gate);
  box(northExit.x,1.92,northExit.z,w,.06,.05,dark,gate);box(northExit.x,.16,northExit.z,w,.06,.05,dark,gate);
  for(let x=-w/2+.09;x<w/2;x+=.12)box(northExit.x+x,1.04,northExit.z,.022,1.72,.022,dark,gate);
  box(northExit.x+w/2-.18,1.05,northExit.z+.05,.05,.12,.04,silver,gate);
 }
 // Graded grass shoulders: no suspended asphalt sheets or exposed open undersides.
 const g=roadsideGarden,tp=[],ti=[],grid=new Map();
 const xs=[...new Set([...Array.from({length:Math.ceil(125/.6)+1},(_,i)=>-66+i*.6),g.x0-g.blend,g.x0,g.x1,g.x1+g.blend,secondaryAccess.x-secondaryAccess.width/2,secondaryAccess.x+secondaryAccess.width/2])].sort((a,b)=>a-b);
 const zs=[...new Set([...Array.from({length:Math.ceil(137/.6)+1},(_,i)=>-66+i*.6),g.z0-g.blend,g.z0,g.z1])].sort((a,b)=>a-b);
 // Include the exact road edge in the grid so the fill ends at the asphalt,
 // rather than leaving the previous partial-cell gap along the whole verge.
 const vertex=(i,j)=>{const key=i*zs.length+j;if(grid.has(key))return grid.get(key);const x=xs[i],z=zs[j],y=siteShoulderHeight(x,z,ramp.bottom);const index=y===null?null:tp.length/3;if(index!==null)tp.push(x,y,z);grid.set(key,index);return index};
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){
  const corners=[vertex(i,j),vertex(i+1,j),vertex(i+1,j+1),vertex(i,j+1)];
  if(corners.some(v=>v===null))continue;const [a,b,c,d]=corners;ti.push(a,c,b,a,d,c);
 }
 const shoulders=mesh(tp,ti,grass,'Trávnaté svahy pri príjazde');shoulders.geometry.userData.uvProjection='xz';
 subtractTopSurfaces(shoulders,[wellnessOutline,...wellnessBeds.map(rectOutline),...gardenPavedAreas.map(rectOutline),rectOutline(access),rectOutline(ramp),gardenBankOutline,...roadOutlines,...entrances.map(entrancePocket).map(rectOutline)],false,0);
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
   }else if(i%3===0&&cz<20&&closestRoad(cx-.6,cz,roads[2]).distance>secondaryAccess.width/2+.7){plants.shrub(cx-.6,cz,terrain(cx-.6,cz),.6)}
  }
 }
 // Both entrances use the same six-metre sliding gate and independent leaves.
 // The northern leaf slides towards the main entrance, clear of the corner.
 const gates=entrances.map((g,i)=>{
  const level=entranceHeight(g,ramp.bottom),side=g.slideSign;
  const pocketBase=box(g.x-.15,(level-.12)/2,g.z+side*6.75,1.1,level+.12,7.5,concrete);pocketBase.name='Základ posuvnej brány';subtractTopSurfaces(pocketBase,roadOutlines);
  box(g.x-.29,level+.012,g.z+side*3.45,.055,.024,13.8,metal).name='Koľajnica posuvnej brány';
  for(const sign of [-1,1]){const z=g.z+sign*(g.width/2+.3);box(g.x,level+1.07,z,.7,2.14,.66);box(g.x,level+2.18,z,.8,.1,.76,concrete)}
  const leaf=new T.Group();leaf.name=i?'Druhá posuvná brána':'Posuvná vstupná brána';root.add(leaf);leaf.position.set(g.x-.29,level,g.z);
  box(0,1.04,0,.09,1.94,g.width,metal,leaf);
  for(let z=-g.width/2+.12;z<g.width/2;z+=.19)box(.06,1.04,z,.045,1.86,.035,silver,leaf);
  for(const y of [.1,1.98])box(0,y,0,.14,.08,g.width+.1,dark,leaf);
  box(g.x-.45,level+.23,g.z+side*3.9,.4,.46,.38,dark);
  box(g.x+.37,level+1.25,g.z+side*(g.width/2+.3),.045,.33,.2,dark);
  const setOpen=open=>{leaf.position.z=g.z+(open?side*g.slide:0)};setOpen(true);
  return {leaf,setOpen};
 });
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
 const pavilion=buildSocialPavilion();root.add(pavilion);
 for(const [x,z] of [[-62,-15],[-61,11],[-61,22],[34.5,-35],[34.5,-18],[-25,-40],[23,-38]])plants.tree(x,z,terrain(x,z),.72,true);
 root.add(plants.finish());
 for(const [mat,matrices] of bars){const o=new T.InstancedMesh(new T.BoxGeometry(1,1,1),mat,matrices.length);matrices.forEach((m,i)=>o.setMatrixAt(i,m));o.name='Kovové profily oplotenia a odkvapov';o.castShadow=true;o.receiveShadow=true;root.add(o)}
 root.userData={setGate:gates[0].setOpen,gate:gates[0].leaf,setSecondaryGate:gates[1].setOpen,secondaryGate:gates[1].leaf,pavilion,estimatedFromPhotos:true,ancillaryPlacementReference:'assets/site-map.png'};return root;
}

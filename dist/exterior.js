import * as T from 'three';
import {buildParkedCars} from './parked-cars.js';
import {surface,glassMaterial} from './surface-materials.js';
import {createPlanting} from './planting.js';
import {buildSportsLandscape} from './sports-landscape.js';
import {buildSiteBoundary} from './site-boundary.js';
import {buildParkingAndStorage} from './parking-storage.js';
import {buildPhotovoltaics} from './photovoltaics.js';
import {buildOutdoorWellness} from './outdoor-wellness.js';
import {buildArchitectureFinish} from './architecture-finish.js';
import {wellnessOutline,wellnessBeds} from './wellness-layout.js';
import {courtSite,courtTerrainHeight} from './court-layout.js';
import {subtractTopSurfaces,rectOutline} from './surface-geometry.js';
import {garage,ramp,levels,footprints,gardenStairs,gardenPaths,access} from './project-geometry.js';
// Visual reconstruction of the 1 August 2018 references, fitted to the PDF footprint.
// Facade opening rhythm and terrain are estimates, not measured survey geometry.
export function buildExterior(){
 const root=new T.Group();root.name='Exterior details and project terrain';const roofs=[],roofSurfaces=[];
 const material=(color,roughness=.85)=>new T.MeshStandardMaterial({color,roughness});
 const white=surface('plaster'),stone=surface('stone'),roof=surface('roof'),paving=surface('paving'),frame=material(0x31383b,.3),lawn=surface('grass'),earth=surface('concrete'),wood=surface('wood'),railglass=glassMaterial(true);frame.metalness=.7;
 const box=(g,x,y,z,w,h,d,m=white)=>{if(w<=0||h<=0||d<=0)throw Error('Nonpositive exterior dimensions');const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=!m.transparent;o.receiveShadow=true;g.add(o);return o};
 // Each elevation is assembled around actual openings, so glazing is not pasted on a solid wall.
 function facade(){} // The real PDF walls/windows are rendered by the shared floor groups.
 function rail(axis,fixed,a,b,y){const g=new T.Group();root.add(g);if(axis==='z'){g.rotation.y=-Math.PI/2;g.position.x=fixed}else g.position.z=fixed;box(g,(a+b)/2,y+.57,0,b-a,.8,.025,railglass);box(g,(a+b)/2,y+1.02,0,b-a,.035,.045,frame);const count=Math.ceil((b-a)/1.5);for(let i=0;i<=count;i++)box(g,a+(b-a)*i/count,y+.51,0,.035,1.02,.035,frame)}
 const coping=material(0xb6b8b3,.34);coping.metalness=.58;
 function cap(id,x0,x1,z0,z1,y){const start=root.children.length;const slab=box(root,(x0+x1)/2,y-.12,(z0+z1)/2,x1-x0,.42,z1-z0,roof);subtractTopSurfaces(slab,roofSurfaces.filter(r=>Math.abs(r.top-y-.09)<.001).map(rectOutline),true);for(const z of [z0,z1]){box(root,(x0+x1)/2,y+.2,z,x1-x0,.4,.18);box(root,(x0+x1)/2,y+.408,z,x1-x0+.08,.024,.23,coping)}for(const x of [x0,x1]){box(root,x,y+.2,(z0+z1)/2,.18,.4,z1-z0);box(root,x,y+.408,(z0+z1)/2,.23,.024,z1-z0+.08,coping)}roofs.push(...root.children.slice(start));roofSurfaces.push({id,x0,x1,z0,z1,top:y+.09})}
 function balcony(axis,fixed,a,b,y,depth=1.7,sign=1){const center=fixed+sign*depth/2;if(axis==='x'){box(root,(a+b)/2,y-.1,center,b-a,.2,depth);box(root,(a+b)/2,y+.13,fixed+sign*depth,b-a,.42,.16);rail('x',fixed+sign*depth,a,b,y+.26);rail('z',a,Math.min(fixed,fixed+sign*depth),Math.max(fixed,fixed+sign*depth),y+.26);rail('z',b,Math.min(fixed,fixed+sign*depth),Math.max(fixed,fixed+sign*depth),y+.26)}else{box(root,center,y-.1,(a+b)/2,depth,.2,b-a);box(root,fixed+sign*depth,y+.13,(a+b)/2,.16,.42,b-a);rail('z',fixed+sign*depth,a,b,y+.26);rail('x',a,Math.min(fixed,fixed+sign*depth),Math.max(fixed,fixed+sign*depth),y+.26);rail('x',b,Math.min(fixed,fixed+sign*depth),Math.max(fixed,fixed+sign*depth),y+.26)}}
 // Long southern elevation, continuous balconies and recessed third storey.
 const bays=[-25.5,-20.7,-15.9,-11.1,-6.3,-1.5,3.3,8.1,12.9,17.7,22.5,26.4];
 for(let f=0;f<3;f++){
  const y=levels[f],x0=f===2?-23.68:-28.85,x1=f===2?23.73:28.85,front=f===2?-20.87:-22.98,back=f===2?-12.08:-10.08;
  const centers=bays.filter(c=>c>x0+1.6&&c<x1-1.6);
  facade('x',front,x0,x1,y,2.78,centers.map(c=>[c,3.15,.08,2.23]),f===2?stone:white);
  // Dark piers and white horizontal fascias visible in the supplied front views.
  
  for(const [a,b] of [[x0,-4.78],[5.02,x1]]){const rear=centers.filter(c=>c>a+1.5&&c<b-1.5);facade('x',back,a,b,y,2.78,rear.map((c,i)=>[c,i%2?1.6:2.1,f===2?1.3:.15,f===2?.65:2.1]));if(f===1)rear.filter((c,i)=>i%2===0).forEach(c=>balcony('x',back,c-1.6,c+1.6,y,1.05))}
  for(const x of [x0,x1])facade('z',x,front,back,y,2.78,[[(front+back)/2,1.3,.9,1.15]]);
  
  if(f<2)balcony('x',front,x0,x1,y,1.8,-1);
 }
 cap('long-wing',-23.68,23.73,-20.87,-12.08,levels[3]);
 // A single U-shaped top deck joins both end terraces to the front balcony.
 // Rail only exposed edges; the two 3.05 m connections and facade doors stay clear.
 const deckOutline=[[-28.85,-23.92],[28.85,-23.92],[28.85,-10.08],[23.73,-10.08],[23.73,-20.87],[-23.68,-20.87],[-23.68,-10.08],[-28.85,-10.08]];
 const deckShape=new T.Shape();deckOutline.forEach(([x,z],i)=>i?deckShape.lineTo(x,-z):deckShape.moveTo(x,-z));deckShape.closePath();
 const deckGeo=new T.ExtrudeGeometry(deckShape,{depth:.24,bevelEnabled:false});deckGeo.rotateX(-Math.PI/2);const deck=new T.Mesh(deckGeo,paving);deck.position.y=levels[2]-.24;deck.castShadow=true;deck.receiveShadow=true;deck.name='Continuous balcony and end terraces';root.add(deck);
 const deckRails=[['x',-23.92,-28.85,28.85],['z',-28.85,-23.92,-10.08],['z',28.85,-23.92,-10.08],['x',-10.08,-28.85,-23.68],['x',-10.08,23.73,28.85],['z',-23.68,-12.08,-10.08],['z',23.73,-12.08,-10.08]];
 for(const [axis,fixed,a,b] of deckRails){rail(axis,fixed,a,b,levels[2]);if(axis==='x')box(root,(a+b)/2,levels[2]-.12,fixed,b-a,.24,.08,white);else box(root,fixed,levels[2]-.12,(a+b)/2,.08,.24,b-a,white)}
 // Connecting stair wing; fourth floor retained from the proposed drawings.
 for(let f=0;f<3;f++){const y=levels[f];for(const x of [-4.78,5.02])facade('z',x,-10.8,-1.4,y,2.78,[[-8,1.4,1.1,1.1],[-4.5,1.65,.12,2.2]]);}cap('connector',-4.81,4.91,-12.2,-1.35,levels[3]);
 for(const x of [-4.78,4.86])facade('z',x,-9.32,-1,levels[3],2.4,[],stone);for(const z of [-9.32,-1])facade('x',z,-4.78,4.86,levels[3],2.4,z===-9.32?[[.8,1,0,2.1]]:[],stone);cap('technical-floor',-4.82,4.89,-9.35,-.96,levels[3]+2.78);
 // Short garden wing: raised garden level, white lower facade, dark upper cladding.

 for(let f=1;f<3;f++){const y=levels[f],m=f===2?stone:white;
  facade('x',15.85,-8.1,10.3,y,2.78,[[-6,1.3,.2,2.1],[-2.7,1.6,.2,2.1],[1,1.2,.2,2.1],[4.7,1.6,.2,2.1],[8.3,1.1,.2,2.1]],m);
  facade('x',-1.4,-8.1,10.3,y,2.78,[[-6.3,1.3,.2,2.1],[7.9,1.5,.2,2.1]],m);
  for(const x of [-7.94,10.89]){facade('z',x,-1.4,15.85,y,2.78,[[.8,1.5,.1,2.25],[4.5,2.4,.1,2.25],[8.6,2.6,.1,2.25],[12.8,2.4,.1,2.25]],m);if(x<0){balcony('z',x,-1.42,16.01,y,1.4,-1);for(const z of [-1.4,3.1,7.7,12.3,15.85])box(root,x-1.27,y+(levels[f+1]-y)/2,z,.26,levels[f+1]-y,.28,white)}else for(const z of [4.5,10.9])balcony('z',x,z-1.5,z+1.5,y,1.1)}
  
 }cap('garden-wing',-7.94,10.89,-1.42,16.01,levels[3]);
 // D7 is on the side facing the ramp: 5500 x 3000, threshold +2.780.
 const gx=garage.x1,gz=(garage.doorZ0+garage.doorZ1)/2;
 const door=new T.Group();door.name='Garage D7';root.add(door);
 box(door,gx,garage.floor+garage.doorHeight/2,gz,.09,garage.doorHeight,5.5,frame);
 for(let y=garage.floor+.08;y<garage.floor+garage.doorHeight;y+=.15)box(door,gx+.06,y,gz,.025,.022,5.5,roof);
 for(const z of [garage.doorZ0-.07,garage.doorZ1+.07])box(root,gx+.025,garage.floor+1.54,z,.2,3.08,.14,white);
 box(root,gx+.025,garage.floor+3.08,gz,.2,.16,5.78,white);
 cap('garage',garage.x0,garage.x1,garage.z0,garage.z1,levels[2]);
 box(root,(garage.x1+ramp.x0)/2,garage.floor/2,(ramp.z0+ramp.z1)/2,ramp.x0-garage.x1,garage.floor,ramp.z1-ramp.z0,paving);
 // Ramp surface and solid supporting wedge; 6 degrees from plan, no suspended plane.
 const vertices=[ramp.x0,ramp.top,ramp.z0,ramp.x0,ramp.top,ramp.z1,ramp.x1,ramp.bottom,ramp.z1,ramp.x0,ramp.top,ramp.z0,ramp.x1,ramp.bottom,ramp.z1,ramp.x1,ramp.bottom,ramp.z0];
 for(const z of [ramp.z0,ramp.z1])vertices.push(ramp.x0,0,z,ramp.x1,0,z,ramp.x1,ramp.bottom,z,ramp.x0,0,z,ramp.x1,ramp.bottom,z,ramp.x0,ramp.top,z);
 const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(vertices,3));rg.computeVertexNormals();const rm=paving.clone();rm.side=T.DoubleSide;const rampMesh=new T.Mesh(rg,rm);rampMesh.receiveShadow=true;rampMesh.castShadow=true;root.add(rampMesh);
 const drive=box(root,(access.x0+access.x1)/2,access.level/2,(access.z0+access.z1)/2,access.x1-access.x0,access.level,access.z1-access.z0,paving);drive.name='Unobstructed garage approach';
 // Lower drive, two planted terraces, storage rooms beneath the old grass roof.
 const groundShape=new T.Shape();groundShape.moveTo(-700,700);groundShape.lineTo(700,700);groundShape.lineTo(700,-700);groundShape.lineTo(-700,-700);groundShape.closePath();
 // The graded hill replaces this part of the ground, including its outer edge.
 // Keeping the original plane below it produced coplanar grass triangles.
 for(const points of [rectOutline(courtSite),wellnessOutline,...wellnessBeds.map(rectOutline)]){const hole=new T.Path();points.forEach(([x,z],i)=>i?hole.lineTo(x,-z):hole.moveTo(x,-z));hole.closePath();groundShape.holes.push(hole)}
 const groundGeo=new T.ShapeGeometry(groundShape);groundGeo.rotateX(-Math.PI/2);groundGeo.userData.uvProjection='xz';const groundMesh=new T.Mesh(groundGeo,lawn);groundMesh.position.y=-.06;groundMesh.receiveShadow=true;groundMesh.name='Ground outside the graded hill';root.add(groundMesh);
 const lowerPath=box(root,0,-.01,-7.8,74,.14,4.3,paving);lowerPath.name='Lower garden walkway';
 subtractTopSurfaces(lowerPath,[rectOutline({x0:-35.5,x1:-10.5,z0:-8.8,z1:-.8})]);
 for(const side of [-1,1]){const x=side<0?-23:25;box(root,x,1.24,side<0?12.505:10.5,19,2.48,side<0?21.99:26,earth);box(root,x,2.51,10.5,19,.08,26,lawn);box(root,x,1.22,side<0?1.51:-2.5,19,2.48,.23,white);box(root,x,2.525,12.8,19,.1,1.5,paving);box(root,x,2.51,22.4,19,.13,4,paving)}
 box(root,-23,.0,-4.8,25,.12,8,paving).name='Cellar courtyard';const cellarRoof=box(root,-23,2.35,-1.6,25,.22,6.2,white);box(root,-23,2.49,-1.6,25,.08,6.2,lawn);const cellarBack=box(root,-23,1.1,1.4,25,2.3,.22,white);for(let x=-35.5;x<=-10.5;x+=3.125)box(root,x,1.1,-4.7,.25,2.3,.25,white);
 root.add(buildParkedCars());
 const parkingStorage=buildParkingAndStorage();parkingStorage.userData.occluders.push(cellarRoof,cellarBack);root.add(parkingStorage);
 // Flush drainage grating at the garage threshold; no new obstacle on the ramp.
 box(root,garage.x1+.22,garage.floor+.002,gz,.24,.006,5.48,frame);
 for(let z=garage.doorZ0+.07;z<garage.doorZ1;z+=.09)box(root,garage.x1+.22,garage.floor+.008,z,.23,.008,.023,coping);
 // Garden paths, retaining edges, stair links and planted borders.
 // One watertight stepped solid per flight, exactly meeting the landing.
 for(const f of gardenStairs.flights){
  const {z0,z1,bottom,top,count}=gardenStairs,width=f.x1-f.x0,run=(z1-z0)/count,rise=(top-bottom)/count;
  const profile=new T.Shape();profile.moveTo(z0,0);profile.lineTo(z0,bottom+rise);
  for(let i=0;i<count;i++){profile.lineTo(z0+(i+1)*run,bottom+(i+1)*rise);if(i<count-1)profile.lineTo(z0+(i+1)*run,bottom+(i+2)*rise)}
  profile.lineTo(z1,0);profile.closePath();const geo=new T.ExtrudeGeometry(profile,{depth:width,bevelEnabled:false,curveSegments:1});geo.rotateY(-Math.PI/2);const flight=new T.Mesh(geo,paving);flight.position.x=f.x1;flight.castShadow=true;flight.receiveShadow=true;flight.name='Continuous garden stairs';root.add(flight);
 }
 // The widened landing meets the garden paving directly, without a grass
 // slot between the stairs, the supported walkway and the terrace edge.
 for(const p of gardenPaths){
  const {top}=gardenStairs,x=(p.x0+p.x1)/2,z=(p.z0+p.z1)/2,width=p.x1-p.x0,length=p.z1-p.z0;
  box(root,x,(top-.18)/2,z,width,top-.18,length,earth);
  const path=box(root,x,top-.09,z,width,.18,length,paving);path.name='Ground-supported footpath';
 }
 for(const x of [-33,35]){box(root,x,1.3,10.6,.22,2.6,26,white)}
 const planting=createPlanting();
 for(let x=-32;x<34;x+=1.2){if(x<-11||x>13){planting.shrub(x,21);planting.shrub(x,-1.2);planting.tuft(x+.4,20.6,2.56,.16)}}
 for(const [x,z] of [[-29,16],[-18,17],[23,17],[31,10]]){planting.tree(x,z);for(let i=0;i<16;i++){const a=i*2.399;planting.tuft(x+Math.cos(a)*.55,z+Math.sin(a)*.55,2.55,.22)}}
 // Illustrative distant planting softens the horizon, outside the project plot.
 for(let i=0;i<40;i++){const a=i*2.399,r=90+(i%7)*11,x=Math.cos(a)*r,z=Math.sin(a)*r;planting.tree(x,z,courtTerrainHeight(x,z,ramp.bottom)??-.06,1+(i%4)*.18,true)}
 for(const [x,z] of [[-64,59],[-64,76],[-49,80],[-27,82],[-7,82],[16,79],[33,72],[36,53]])planting.tree(x,z,courtTerrainHeight(x,z,ramp.bottom)??-.06,.9,true);
 root.add(planting.finish());
 const landscape=buildSportsLandscape();root.add(landscape);
 const site=buildSiteBoundary();root.add(site);
 const wellness=buildOutdoorWellness();root.add(wellness);const architecturalFinish=buildArchitectureFinish();root.add(architecturalFinish);
 // Compact timber play structures visible in the landscape references.
 for(const x of [-24,26]){box(root,x,2.59,15,4.5,.09,4,roof);for(const dx of [-.75,.75])for(const dz of [-.6,.6])box(root,x+dx,3.65,15+dz,.12,2.1,.12,wood);box(root,x,4.55,15,1.8,.12,1.6,wood);for(let i=0;i<5;i++)box(root,x,2.9+i*.3,16-i*.15,1,.08,.15,wood)}

 const photovoltaics=buildPhotovoltaics(roofSurfaces);root.add(photovoltaics);roofs.push(photovoltaics);
 root.userData={reference:'PDF geometry with facade details',estimatedTerrain:true,roofs,roofSurfaces,photovoltaics,garageDoor:door,deckOutline,deckRails,site,parkingStorage,homes:landscape.userData.homes,wellness,architecturalFinish};return root;
}

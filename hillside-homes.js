import * as T from 'three';
import {surface,glassMaterial} from './surface-materials.js';
import {createPlanting} from './planting.js';
import {hillsideHomes,homesLevel,homeRoads} from './homes-layout.js';

export function buildHillsideHomes(roadBase){
 const root=new T.Group();root.name='Dva rodinné domy namiesto kurtov';
 const white=surface('plaster'),wood=surface('wood'),stone=surface('stone'),paving=surface('paving'),concrete=surface('concrete'),roofMaterial=surface('roof'),tile=surface('pool');
 const metal=new T.MeshStandardMaterial({color:0x38444b,metalness:.7,roughness:.32});
 const glass=glassMaterial(),railingGlass=glassMaterial(true),occluders=[],shutters=[],entryDoors=[];
 const box=(g,x,y,z,w,h,d,m=white,occlude=false)=>{
  if(Math.min(w,h,d)<=0)throw Error('Nonpositive house geometry');
  const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=!m.transparent;o.receiveShadow=true;g.add(o);if(occlude)occluders.push(o);return o;
 };
 function solidRoad(road){
  const p=[],idx=[],side=[],ps=road.points;
  ps.forEach((a,i)=>{const before=ps[Math.max(0,i-1)],after=ps[Math.min(ps.length-1,i+1)],dx=after[0]-before[0],dz=after[1]-before[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
   for(const sign of [-1,1])p.push(a[0]+sign*nx*road.width/2,a[2],a[1]+sign*nz*road.width/2);
   for(const sign of [-1,1])p.push(a[0]+sign*nx*road.width/2,-.12,a[1]+sign*nz*road.width/2);
   if(i){const a=(i-1)*4,b=i*4;idx.push(a,b,a+1,a+1,b,b+1);side.push(a,a+2,b,a+2,b+2,b,b+1,b+3,a+1,b+3,a+3,a+1)}
  });
  const n=(ps.length-1)*4;side.push(0,1,2,1,3,2,n,n+2,n+1,n+1,n+2,n+3);
  for(const [indices,mat,name] of [[idx,surface('asphalt'),road.name],[side,concrete,'Plné podložie príjazdu k domom']]){
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setIndex(indices);geometry.computeVertexNormals();
   const material=mat.clone();material.side=T.DoubleSide;const mesh=new T.Mesh(geometry,material);mesh.name=name;mesh.receiveShadow=true;mesh.castShadow=true;root.add(mesh);
  }
 }
 for(const road of homeRoads(roadBase))solidRoad(road);
 function slabWithPoolHole(g,rect,pool,y){
  const shape=new T.Shape();shape.moveTo(rect.x0,-rect.z0);shape.lineTo(rect.x1,-rect.z0);shape.lineTo(rect.x1,-rect.z1);shape.lineTo(rect.x0,-rect.z1);shape.closePath();
  if(pool){const hole=new T.Path();hole.moveTo(pool.x0,-pool.z0);hole.lineTo(pool.x1,-pool.z0);hole.lineTo(pool.x1,-pool.z1);hole.lineTo(pool.x0,-pool.z1);hole.closePath();shape.holes.push(hole)}
  const geometry=new T.ExtrudeGeometry(shape,{depth:.18,bevelEnabled:false});geometry.rotateX(-Math.PI/2);const mesh=new T.Mesh(geometry,paving);mesh.position.y=y-.18;mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;
 }
 function roof(g,x0,x1,z0,z1,y,slab=true){
  if(slab)box(g,(x0+x1)/2,y-.11,(z0+z1)/2,x1-x0+.36,.22,z1-z0+.36,white,true);
  box(g,(x0+x1)/2,y+.014,(z0+z1)/2,x1-x0-.12,.028,z1-z0-.12,roofMaterial);
  for(const z of [z0-.1,z1+.1]){box(g,(x0+x1)/2,y+.14,z,x1-x0+.36,.28,.16);box(g,(x0+x1)/2,y+.287,z,x1-x0+.4,.022,.22,metal)}
  for(const x of [x0-.1,x1+.1]){box(g,x,y+.14,(z0+z1)/2,.16,.28,z1-z0+.36);box(g,x,y+.287,(z0+z1)/2,.22,.022,z1-z0+.4,metal)}
 }
 function facade(g,axis,fixed,a,b,base,height,openings=[],wallMaterial=white){
  const along=(center,y,width,h,depth,m,occlude=true)=>axis==='x'?box(g,center,y,fixed,width,h,depth,m,occlude):box(g,fixed,y,center,depth,h,width,m,occlude);
  let cursor=a;
  for(const o of openings.toSorted((a,b)=>a.center-b.center)){
   const lo=o.center-o.width/2,hi=o.center+o.width/2;
   if(lo>cursor)along((cursor+lo)/2,base+height/2,lo-cursor,height,.2,wallMaterial);
   if(o.bottom>0)along(o.center,base+o.bottom/2,o.width,o.bottom,.2,wallMaterial);
   const head=height-o.bottom-o.height;if(head>0)along(o.center,base+o.bottom+o.height+head/2,o.width,head,.2,wallMaterial);
   for(const x of [lo+.025,hi-.025])along(x,base+o.bottom+o.height/2,.05,o.height,.25,metal);
   for(const y of [base+o.bottom+.024,base+o.bottom+o.height-.024])along(o.center,y,o.width,.048,.25,metal);
   if(o.kind!=='door'&&o.kind!=='garage'){
    along(o.center,base+o.bottom+o.height/2,o.width-.055,o.height-.055,.035,glass);
    if(o.width>2)along(o.center,base+o.bottom+o.height/2,.045,o.height,.11,metal);
   }
   cursor=hi;
  }
  if(cursor<b)along((cursor+b)/2,base+height/2,b-cursor,height,.2,wallMaterial);
 }
 const plants=createPlanting();
 for(const h of hillsideHomes){
  const group=new T.Group();group.name=h.name;group.userData={homeId:h.id,garageIntegrated:true};root.add(group);
  const y=h.base,g=h.garage,cx=(h.x0+h.x1)/2,cz=(h.z0+h.z1)/2,core=g.x0-h.x0,upper=y+3.2;
  box(group,cx,y-.13,cz,h.x1-h.x0+.3,.26,h.z1-h.z0+.3,paving).name='Súvislá základová doska domu a garáže';
  box(group,cx,upper-.11,cz,h.x1-h.x0+.36,.22,h.z1-h.z0+.36,white,true).name='Spoločný strop domu a vstavanej garáže';
  facade(group,'x',h.z0,h.x0,h.x1,y,2.98,[
   {center:h.entryX,width:1.3,bottom:0,height:2.38,kind:'door'},
   {center:h.x0+core*.68,width:Math.min(4.1,core*.4),bottom:.22,height:2.36},
   {center:(g.x0+h.x1)/2,width:2.35,bottom:.8,height:1.65}]);
  facade(group,'x',h.z1,h.x0,h.x1,y,2.98,[{center:h.x0+core*.47,width:3.6,bottom:.75,height:1.65},{center:g.doorX,width:h.garageDoorWidth,bottom:0,height:2.55,kind:'garage'}]);
  facade(group,'z',h.x0,h.z0,h.z1,y,2.98,[{center:cz,width:4.8,bottom:.22,height:2.36}]);
  facade(group,'z',h.x1,h.z0,h.z1,y,2.98,[{center:h.z0+1.85,width:2.05,bottom:.8,height:1.65},{center:h.z1-2.1,width:1.9,bottom:1.8,height:.65}]);
  // Garage is enclosed within the same ground-floor footprint and connected
  // through an internal opening, not placed as a detached accessory box.
  facade(group,'z',g.x0,g.z0,g.z1,y,2.98,[{center:g.doorZ,width:1.2,bottom:0,height:2.2,kind:'door'}]);
  facade(group,'x',g.z0,g.x0,g.x1,y,2.98,[]);
  const shutter=new T.Group();shutter.position.set(0,y,0);shutter.userData={base:y,height:2.55};shutter.name=`Garážová brána domu ${h.id}`;group.add(shutter);shutters.push(shutter);
  box(shutter,g.doorX,1.275,h.z1+.025,h.garageDoorWidth-.075,2.55,.07,metal,true);
  for(let a=.16;a<2.5;a+=.22)box(shutter,g.doorX,a,h.z1+.066,h.garageDoorWidth-.1,.014,.014,stone);
  const door=new T.Group();door.position.set(h.entryX-.61,y,h.z0);group.add(door);entryDoors.push(door);door.name=`Vstupné dvere domu ${h.id}`;
  box(door,.61,1.18,0,1.2,2.36,.065,wood,true);box(door,1.02,1.07,-.065,.035,.46,.045,metal);
  const internal=new T.Group();internal.position.set(g.x0,y,g.doorZ-.55);group.add(internal);internal.userData.internal=true;entryDoors.push(internal);
  box(internal,0,1.09,.55,.045,2.18,1.08,white,true);
  // Residential upper floor is set over the main body; the attached garage
  // remains under the continuous lower roof with the same facade finish.
  facade(group,'x',h.z0,h.x0,g.x0,upper,2.8,[{center:h.x0+core*.5,width:core*.69,bottom:.14,height:2.35}],wood);
  facade(group,'x',h.z1,h.x0,g.x0,upper,2.8,[{center:h.x0+core*.5,width:core*.59,bottom:.65,height:1.65}],white);
  for(const x of [h.x0,g.x0])facade(group,'z',x,h.z0,h.z1,upper,2.8,[{center:h.z0+2.8,width:2.1,bottom:.6,height:1.7},{center:h.z1-2.4,width:2.1,bottom:.6,height:1.7}],x===h.x0?white:stone);
  roof(group,h.x0,g.x0,h.z0,h.z1,upper+3.02);
  roof(group,g.x0,h.x1,h.z0,h.z1,upper,false);
  box(group,(h.x0+g.x0)/2,upper-.11,h.z0-.52,core+.35,.22,1.1,white,true);
  box(group,(h.x0+g.x0)/2,upper+.55,h.z0-1.02,core+.18,1.04,.028,railingGlass);
  box(group,(h.x0+g.x0)/2,upper+1.09,h.z0-1.02,core+.2,.045,.045,metal);
  for(const x of [h.x0-.09,g.x0+.09]){box(group,x,upper+.55,h.z0-.5,.03,1.04,1.05,railingGlass);box(group,x,upper+1.09,h.z0-.5,.045,.045,1.05,metal)}
  // The pools have actual holes in the terrace and terrain, tiled basins and
  // reflective water below the coping rather than rectangles on solid ground.
  const p=h.pool,d=h.poolDeck;
  const terrace={...h.terrace,x1:Math.min(h.terrace.x1,d.x0)};
  slabWithPoolHole(group,terrace,null,y).name='Terasa pred obývacou izbou';
  slabWithPoolHole(group,d,p,y).name='Terasa s otvorom pre bazén';
  const px=(p.x0+p.x1)/2,pz=(p.z0+p.z1)/2,pw=p.x1-p.x0,pd=p.z1-p.z0;
  box(group,px,p.bottom-.07,pz,pw+.25,.14,pd+.25,tile).name=`Dno bazéna domu ${h.id}`;
  for(const x of [p.x0-.07,p.x1+.07])box(group,x,(p.bottom+y)/2,pz,.14,y-p.bottom,pd+.28,tile);
  for(const z of [p.z0-.07,p.z1+.07])box(group,px,(p.bottom+y)/2,z,pw,y-p.bottom,.14,tile);
  for(const x of [p.x0-.13,p.x1+.13])box(group,x,y+.015,pz,.25,.03,pd+.5,white);
  for(const z of [p.z0-.13,p.z1+.13])box(group,px,y+.015,z,pw,.03,.25,white);
  const waterMaterial=new T.MeshPhysicalMaterial({color:0x399eaf,metalness:.12,roughness:.09,transparent:true,opacity:.63,clearcoat:1,clearcoatRoughness:.07,envMapIntensity:1.3,side:T.DoubleSide});
  const water=new T.Mesh(new T.PlaneGeometry(pw,pd),waterMaterial);water.rotation.x=-Math.PI/2;water.position.set(px,p.water,pz);water.name=`Voda bazéna domu ${h.id}`;group.add(water);
  for(const dx of [-.26,.26])box(group,px+dx,y-.19,p.z1-.14,.038,1.3,.038,metal);
  for(const ly of [y-.62,y-.32,y-.02])box(group,px,ly,p.z1-.14,.56,.035,.038,metal);
  const drive=h.drive;box(group,(drive.x0+drive.x1)/2,y-.12,(drive.z0+drive.z1)/2,drive.x1-drive.x0,.24,drive.z1-drive.z0,paving).name=`Príjazd ku garáži domu ${h.id}`;
  // Existing pedestrian landing branches to the two new front entrances.
  box(group,h.entryX,y-.08,(48.5+terrace.z0)/2,1.5,.16,terrace.z0-48.5,paving).name=`Chodník k domu ${h.id}`;
  for(const z of [h.z0+1.5,h.z0+4,h.z0+6.5])plants.shrub(h.x0-1.2,z,y-.04,.45);
  // A few terrace pieces establish domestic scale without obstructing access.
  for(let i=0;i<2;i++){
   const x=terrace.x0+2+i*1.1,z=terrace.z0+1.35;
   box(group,x,y+.27,z,.78,.12,1.85,wood);const back=box(group,x,y+.51,z+.63,.78,.09,.7,wood);back.rotation.x=-.58;
   for(const dz of [-.65,.65])box(group,x,y+.13,z+dz,.65,.26,.055,metal);
  }
  box(group,h.x0+1.1,y+1.55,h.z0-.125,.38,.3,.035,metal).name=`Označenie domu ${h.id}`;
 }
 root.add(plants.finish());
 const setDoors=open=>{
  shutters.forEach(shutter=>{shutter.scale.y=open?.045:1;shutter.position.y=shutter.userData.base+shutter.userData.height*(1-shutter.scale.y)});
  entryDoors.forEach(door=>{door.rotation.y=open?(door.userData.internal?-Math.PI/2:Math.PI/2):0});root.updateMatrixWorld(true);
 };
 setDoors(true);root.userData={homes:hillsideHomes,occluders,shutters,setDoors};return root;
}

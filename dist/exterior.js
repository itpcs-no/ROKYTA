import * as T from 'three';
import {buildParkedCars} from './parked-cars.js';
import {garage,ramp,pool} from './project-geometry.js';
// Visual reconstruction of the 1 August 2018 references, fitted to the PDF footprint.
// Facade opening rhythm and terrain are estimates, not measured survey geometry.
export function buildExterior(){
 const root=new T.Group();root.name='Exterior details and project terrain';const roofs=[];
 const material=(color,roughness=.85)=>new T.MeshStandardMaterial({color,roughness});
 const white=material(0xf0f0ec),stone=material(0x45494a),roof=material(0x30383d),paving=material(0xa2a6a3),frame=material(0x252e32,.4),lawn=material(0x638657),earth=material(0x7e8870),wood=material(0x785a40),leaf=material(0x3f6947),glass=new T.MeshStandardMaterial({color:0x74949f,roughness:.18,metalness:.32,transparent:true,opacity:.72}),railglass=new T.MeshStandardMaterial({color:0x98b4b9,transparent:true,opacity:.25,roughness:.2});
 const box=(g,x,y,z,w,h,d,m=white)=>{if(w<=0||h<=0||d<=0)throw Error('Nonpositive exterior dimensions');const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o};
 // Each elevation is assembled around actual openings, so glazing is not pasted on a solid wall.
 function facade(){} // The real PDF walls/windows are rendered by the shared floor groups.
 function rail(axis,fixed,a,b,y){const g=new T.Group();root.add(g);if(axis==='z'){g.rotation.y=-Math.PI/2;g.position.x=fixed}else g.position.z=fixed;box(g,(a+b)/2,y+.57,0,b-a,.8,.025,railglass);box(g,(a+b)/2,y+1.02,0,b-a,.035,.045,frame);for(let p=a;p<=b+.01;p+=Math.min(1.5,b-a))box(g,p,y+.51,0,.035,1.02,.035,frame)}
 function cap(x0,x1,z0,z1,y){const start=root.children.length;box(root,(x0+x1)/2,y-.12,(z0+z1)/2,x1-x0,.42,z1-z0,roof);for(const z of [z0,z1])box(root,(x0+x1)/2,y+.2,z,x1-x0,.4,.18);for(const x of [x0,x1])box(root,x,y+.2,(z0+z1)/2,.18,.4,z1-z0);roofs.push(...root.children.slice(start))}
 function balcony(axis,fixed,a,b,y,depth=1.7,sign=1){const center=fixed+sign*depth/2;if(axis==='x'){box(root,(a+b)/2,y-.1,center,b-a,.2,depth);box(root,(a+b)/2,y+.13,fixed+sign*depth,b-a,.42,.16);rail('x',fixed+sign*depth,a,b,y+.26);rail('z',a,Math.min(fixed,fixed+sign*depth),Math.max(fixed,fixed+sign*depth),y+.26);rail('z',b,Math.min(fixed,fixed+sign*depth),Math.max(fixed,fixed+sign*depth),y+.26)}else{box(root,center,y-.1,(a+b)/2,depth,.2,b-a);box(root,fixed+sign*depth,y+.13,(a+b)/2,.16,.42,b-a);rail('z',fixed+sign*depth,a,b,y+.26);rail('x',a,Math.min(fixed,fixed+sign*depth),Math.max(fixed,fixed+sign*depth),y+.26);rail('x',b,Math.min(fixed,fixed+sign*depth),Math.max(fixed,fixed+sign*depth),y+.26)}}
 // Long southern elevation, continuous balconies and recessed third storey.
 const bays=[-25.5,-20.7,-15.9,-11.1,-6.3,-1.5,3.3,8.1,12.9,17.7,22.5,26.4];
 for(let f=0;f<3;f++){
  const y=f*2.78,x0=f===2?-23.675:-28.825,x1=-x0,front=f===2?-20.85:-23,back=f===2?-12.1:-10.8;
  const centers=bays.filter(c=>c>x0+1.6&&c<x1-1.6);
  facade('x',front,x0,x1,y,2.78,centers.map(c=>[c,3.15,.08,2.23]),f===2?stone:white);
  // Dark piers and white horizontal fascias visible in the supplied front views.
  
  for(const [a,b] of [[x0,-4.78],[5.02,x1]]){const rear=centers.filter(c=>c>a+1.5&&c<b-1.5);facade('x',back,a,b,y,2.78,rear.map((c,i)=>[c,i%2?1.6:2.1,f===2?1.3:.15,f===2?.65:2.1]));if(f===1)rear.filter((c,i)=>i%2===0).forEach(c=>balcony('x',back,c-1.6,c+1.6,y,1.05))}
  for(const x of [x0,x1])facade('z',x,front,back,y,2.78,[[(front+back)/2,1.3,.9,1.15]]);
  
  balcony('x',front,x0,x1,y, f===2?3.05:1.8,-1);
 }
 cap(-23.675,23.675,-20.85,-12.1,8.34);
 for(const [x0,x1] of [[-28.825,-23.675],[23.675,28.825]]){box(root,(x0+x1)/2,5.56,-16.9,x1-x0,.18,12.2,paving);rail('z',x0,-23,-10.8,5.65);rail('z',x1,-23,-10.8,5.65);rail('x',-10.8,x0,x1,5.65)}
 // Connecting stair wing; fourth floor retained from the proposed drawings.
 for(let f=0;f<3;f++){const y=f*2.78;for(const x of [-4.78,5.02])facade('z',x,-10.8,-1.4,y,2.78,[[-8,1.4,1.1,1.1],[-4.5,1.65,.12,2.2]]);}cap(-4.78,5.02,-10.8,-1.4,8.34);
 for(const x of [-4.78,4.86])facade('z',x,-9.32,-1,8.34,2.4,[],stone);for(const z of [-9.32,-1])facade('x',z,-4.78,4.86,8.34,2.4,z===-9.32?[[.8,1,0,2.1]]:[],stone);cap(-4.78,4.86,-9.32,-1,10.74);
 // Short garden wing: raised garden level, white lower facade, dark upper cladding.

 for(let f=1;f<3;f++){const y=f*2.78,m=f===2?stone:white;
  facade('x',15.85,-8.1,10.3,y,2.78,[[-6,1.3,.2,2.1],[-2.7,1.6,.2,2.1],[1,1.2,.2,2.1],[4.7,1.6,.2,2.1],[8.3,1.1,.2,2.1]],m);
  facade('x',-1.4,-8.1,10.3,y,2.78,[[-6.3,1.3,.2,2.1],[7.9,1.5,.2,2.1]],m);
  for(const x of [-8.1,10.3]){facade('z',x,-1.4,15.85,y,2.78,[[.8,1.5,.1,2.25],[4.5,2.4,.1,2.25],[8.6,2.6,.1,2.25],[12.8,2.4,.1,2.25]],m);if(x<0){balcony('z',x,-1.4,15.85,y,1.3,-1);for(const z of [-1.4,3.1,7.7,12.3,15.85])box(root,x-1.2,y+1.3,z,.26,2.6,.28,white)}else for(const z of [4.5,10.9])balcony('z',x,z-1.5,z+1.5,y,1.1)}
  
 }cap(-8.1,10.3,-1.4,15.85,8.34);
 // D7 is on the side facing the ramp: 5500 x 3000, threshold +2.780.
 const gx=garage.x1,gz=(garage.doorZ0+garage.doorZ1)/2;
 const door=new T.Group();door.name='Garage D7';root.add(door);
 box(door,gx,garage.floor+garage.doorHeight/2,gz,.09,garage.doorHeight,5.5,frame);
 for(let y=garage.floor+.08;y<garage.floor+garage.doorHeight;y+=.15)box(door,gx+.06,y,gz,.025,.022,5.5,roof);
 for(const z of [garage.doorZ0-.07,garage.doorZ1+.07])box(root,gx+.025,garage.floor+1.54,z,.2,3.08,.14,white);
 box(root,gx+.025,garage.floor+3.08,gz,.2,.16,5.78,white);
 cap(garage.x0,garage.x1,garage.z0,garage.z1,6.0);
 box(root,(garage.x1+ramp.x0)/2,garage.floor-.11,(ramp.z0+ramp.z1)/2,ramp.x0-garage.x1,.22,ramp.z1-ramp.z0,paving);
 // Ramp surface and solid supporting wedge; 6 degrees from plan, no suspended plane.
 const vertices=[ramp.x0,ramp.top,ramp.z0,ramp.x0,ramp.top,ramp.z1,ramp.x1,ramp.bottom,ramp.z1,ramp.x0,ramp.top,ramp.z0,ramp.x1,ramp.bottom,ramp.z1,ramp.x1,ramp.bottom,ramp.z0];
 for(const z of [ramp.z0,ramp.z1])vertices.push(ramp.x0,0,z,ramp.x1,0,z,ramp.x1,ramp.bottom,z,ramp.x0,0,z,ramp.x1,ramp.bottom,z,ramp.x0,ramp.top,z);
 const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(vertices,3));rg.computeVertexNormals();const rm=paving.clone();rm.side=T.DoubleSide;const rampMesh=new T.Mesh(rg,rm);rampMesh.receiveShadow=true;rampMesh.castShadow=true;root.add(rampMesh);
 box(root,(ramp.x1+16)/2,ramp.bottom/2,(ramp.z0+ramp.z1)/2,16-ramp.x1,ramp.bottom,ramp.z1-ramp.z0,paving);
 box(root,13.4,ramp.bottom/2,26.5,5.2,ramp.bottom,5.85,paving);
 // Lower drive, two planted terraces, grass-roof parking below the western terrace.
 const groundShape=new T.Shape();groundShape.moveTo(-56,52);groundShape.lineTo(56,52);groundShape.lineTo(56,-52);groundShape.lineTo(-56,-52);groundShape.closePath();const hole=new T.Path();hole.moveTo(pool.x0,-pool.z0);hole.lineTo(pool.x1,-pool.z0);hole.lineTo(pool.x1,-pool.z1);hole.lineTo(pool.x0,-pool.z1);hole.closePath();groundShape.holes.push(hole);const groundGeo=new T.ShapeGeometry(groundShape);groundGeo.rotateX(-Math.PI/2);const groundMesh=new T.Mesh(groundGeo,lawn);groundMesh.position.y=-.06;groundMesh.receiveShadow=true;root.add(groundMesh);box(root,0,-.04,-7.8,74,.08,4.3,paving);box(root,0,ramp.bottom/2,30.5,95,ramp.bottom,5,paving);
 for(const side of [-1,1]){const x=side<0?-23:25;box(root,x,1.24,side<0?12.505:10.5,19,2.48,side<0?21.99:26,earth);box(root,x,2.51,10.5,19,.08,26,lawn);box(root,x,1.22,side<0?1.51:-2.5,19,2.48,.23,white);box(root,x,2.58,12.8,19,.1,1.5,paving);box(root,x,2.6,22.4,19,.13,4,paving)}
 box(root,-23,.0,-4.8,25,.12,8,paving);box(root,-23,2.35,-1.6,25,.22,6.2,white);box(root,-23,2.49,-1.6,25,.08,6.2,lawn);box(root,-23,1.1,1.4,25,2.3,.22,white);for(let x=-35.5;x<=-10.5;x+=3.125)box(root,x,1.1,-4.7,.25,2.3,.25,white);
 root.add(buildParkedCars());
 // Garden paths, retaining edges, stair links and planted borders.
 for(const x of [-10.3,12.5]){box(root,x,2.51,8.7,2.1,.13,23,paving);for(let i=0;i<16;i++)box(root,x,(i+1)*2.5/16/2,-7.6+i*.29,2.1,(i+1)*2.5/16,.29,paving)}
 for(const x of [-33,35]){box(root,x,1.3,10.6,.22,2.6,26,white)}
 function shrub(x,z,y=2.6,r=.45){const o=new T.Mesh(new T.IcosahedronGeometry(r,1),leaf);o.position.set(x,y+r*.7,z);o.scale.y=.75;root.add(o);o.castShadow=true}
 for(let x=-32;x<34;x+=1.2){if(x<-11||x>13){shrub(x,21);shrub(x,-1.2)}}
 for(const [x,z] of [[-29,16],[-18,17],[23,17],[31,10]]){box(root,x,4.05,z,.22,3,.22,wood);for(const [dx,dy,dz] of [[0,0,0],[-.8,-.3,.2],[.8,-.2,-.4]]){const o=new T.Mesh(new T.IcosahedronGeometry(1.7,1),leaf);o.position.set(x+dx,5.9+dy,z+dz);root.add(o);o.castShadow=true}}
 // Compact timber play structures visible in the landscape references.
 for(const x of [-24,26]){box(root,x,2.59,15,4.5,.09,4,roof);for(const dx of [-.75,.75])for(const dz of [-.6,.6])box(root,x+dx,3.65,15+dz,.12,2.1,.12,wood);box(root,x,4.55,15,1.8,.12,1.6,wood);for(let i=0;i<5;i++)box(root,x,2.9+i*.3,16-i*.15,1,.08,.15,wood)}

 root.userData={reference:'PDF geometry with facade details',estimatedTerrain:true,roofs,garageDoor:door};return root;
}

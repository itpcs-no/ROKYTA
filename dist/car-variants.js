import * as T from 'three';

// Generic, unbadged car body types that mix with the glTF grand tourer:
// city car, hatchback, saloon, estate, SUV and MPV. Profiles are side
// silhouettes (length along z, front at -z) extruded across the width with a
// rounded bevel. Same interface as the glTF cars: LOD, wheel rigs, update().
export const carKinds={
 city:{name:'Mestské auto',L:3.65,W:1.68,H:1.5,r:.3,wb:2.4,clear:.16,belt:.86,body:[[-.5,.2],[-.5,.75],[-.47,.86],[.38,.9],[.47,.78],[.5,.6],[.5,.2]],cabin:[[-.48,.86],[-.45,1.0],[-.4,1],[.02,1],[.3,.9],[.44,.88]]},
 hatch:{name:'Hatchback',L:4.15,W:1.79,H:1.46,r:.32,wb:2.62,clear:.15,belt:.86,body:[[-.5,.2],[-.5,.8],[-.46,.88],[.3,.92],[.47,.78],[.5,.6],[.5,.2]],cabin:[[-.47,.88],[-.43,.98],[-.36,1],[.05,1],[.28,.92]]},
 sedan:{name:'Sedan',L:4.72,W:1.83,H:1.44,r:.33,wb:2.84,clear:.14,belt:.8,body:[[-.5,.22],[-.5,.66],[-.45,.74],[-.3,.76],[.24,.8],[.46,.7],[.5,.55],[.5,.22]],cabin:[[-.32,.76],[-.18,.98],[-.08,1],[.08,1],[.24,.8]]},
 estate:{name:'Kombi',L:4.78,W:1.83,H:1.5,r:.33,wb:2.84,clear:.15,belt:.82,body:[[-.5,.22],[-.5,.75],[-.47,.82],[.26,.84],[.46,.72],[.5,.56],[.5,.22]],cabin:[[-.48,.82],[-.46,.97],[-.4,1],[.06,1],[.27,.84]]},
 suv:{name:'SUV',L:4.62,W:1.9,H:1.68,r:.37,wb:2.76,clear:.21,belt:.82,body:[[-.5,.2],[-.5,.8],[-.47,.84],[.3,.86],[.47,.76],[.5,.6],[.5,.2]],cabin:[[-.48,.84],[-.46,.98],[-.4,1],[.1,1],[.3,.86]]},
 mpv:{name:'Viacúčelové auto',L:4.95,W:1.94,H:1.84,r:.34,wb:3.0,clear:.17,belt:.8,body:[[-.5,.2],[-.5,.8],[-.48,.84],[.32,.84],[.48,.66],[.5,.5],[.5,.2]],cabin:[[-.49,.84],[-.48,.98],[-.44,1],[.18,1],[.34,.84]]}
};
// Re-proportion the sketches: hood and beltline at about two thirds of the
// height, a glasshouse of one third (taller for SUV and MPV).
for(const k of Object.values(carKinds)){
 const top=Math.max(...k.body.map(p=>p[1])),belt=k.belt,target=k===carKinds.suv?.62:k===carKinds.mpv?.56:.66;
 k.body=k.body.map(([u,v])=>[u,v<=.2?v:.2+(v-.2)*(target-.2)/(top-.2)]);
 k.cabin=k.cabin.map(([u,v])=>[u,target+(v-belt)*(1-target)/(1-belt)]);
 k.belt=target-.01;
}
export const carKindCycle=['gt','suv','hatch','estate','sedan','mpv','city','suv','gt','sedan','estate','hatch'];
const tireMat=new T.MeshStandardMaterial({color:0x1a1c1d,roughness:.85});
const rimMat=new T.MeshStandardMaterial({color:0xb3b8bb,metalness:.9,roughness:.25});
const trimMat=new T.MeshStandardMaterial({color:0x1f2325,roughness:.6});
const glassMat=new T.MeshPhysicalMaterial({color:0x1d2a30,metalness:.2,roughness:.06,clearcoat:1,transparent:true,opacity:.86});
const headMat=new T.MeshStandardMaterial({color:0xf3f5f6,emissive:0xfff6e0,emissiveIntensity:.5,roughness:.15});
const plateMat=new T.MeshStandardMaterial({color:0xe6e9e6,roughness:.5});
function extrude(points,k,width,bevel,material,arches=false){
 const s=new T.Shape();points.forEach(([u,v],i)=>{const x=u*k.L,y=v*k.H;i?s.lineTo(x,y):s.moveTo(x,y)});
 if(arches){
  // Bottom edge from the front bumper back to the rear, with wheel-arch cut-outs.
  const R=k.r+.07;for(const xc of [k.wb/2+.05,-(k.wb/2-.05)]){s.lineTo(xc+R,points[0][1]*k.H);s.lineTo(xc+R,k.r);for(let i=1;i<=12;i++){const t=i/12*Math.PI;s.lineTo(xc+Math.cos(t)*R,k.r+Math.sin(t)*R)}s.lineTo(xc-R,points[0][1]*k.H)}
 }
 s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth:width-2*bevel,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel*.9,bevelSegments:3,curveSegments:4});
 g.rotateY(Math.PI/2);g.translate(-(width-2*bevel)/2,0,0);
 const m=new T.Mesh(g,material);m.castShadow=true;m.receiveShadow=true;return m;
}
export function createGenericCar(kindName,color,index=0){
 const k=carKinds[kindName],car=new T.Group();car.name=k.name;
 const paint=new T.MeshPhysicalMaterial({color,metalness:.55,roughness:.28,clearcoat:1,clearcoatRoughness:.08});
 const body=extrude(k.body.slice(0,-1).concat([[.5,k.body.at(-1)[1]]]),k,k.W,.06,paint,true);body.position.y=k.clear*.2;car.add(body);
 const cabin=extrude(k.cabin.concat([[k.cabin.at(-1)[0],k.belt],[k.cabin[0][0],k.belt]]),k,k.W-.14,.06,glassMat);car.add(cabin);
 // Roof skin in body colour over the glazed cabin.
 const roofPts=k.cabin.filter(([,v])=>v>=.99);const r0=Math.min(...roofPts.map(p=>p[0])),r1=Math.max(...roofPts.map(p=>p[0]));
 const roof=new T.Mesh(new T.BoxGeometry(k.W-.18,.05,(r1-r0)*k.L+.05),paint);roof.position.set(0,k.H+.005,-(r0+r1)/2*k.L);roof.castShadow=true;car.add(roof);
 // Bumpers, lights, plates, mirrors.
 for(const sz of [-1,1]){const b=new T.Mesh(new T.BoxGeometry(k.W-.06,.14,.1),trimMat);b.position.set(0,.32,sz*(k.L/2-.02));car.add(b);
  const plate=new T.Mesh(new T.BoxGeometry(.52,.11,.012),plateMat);plate.position.set(0,.47,sz*(k.L/2+.036));car.add(plate)}
 const lightY=(k.body.find(p=>p[0]===.5&&p[1]>.3)?.[1]??.55)*k.H-.06;
 for(const sx of [-1,1]){const h=new T.Mesh(new T.BoxGeometry(.36,.08,.04),headMat);h.position.set(sx*(k.W/2-.26),lightY,-k.L/2-.005);car.add(h);
  const m=new T.Mesh(new T.BoxGeometry(.06,.1,.18),paint);m.position.set(sx*(k.W/2+.03),k.belt*k.H+.06,-(k.cabin.at(-1)[0])*k.L+.2);car.add(m)}
 const brakeMat=new T.MeshStandardMaterial({color:0x8a1712,emissive:0xff2a10,emissiveIntensity:.22,roughness:.3});
 for(const sx of [-1,1]){const t=new T.Mesh(new T.BoxGeometry(.34,.09,.04),brakeMat);t.position.set(sx*(k.W/2-.24),(k.belt-.05)*k.H,k.L/2+.005);car.add(t)}
 // Wheels with steer and spin groups.
 const wheels=[],front=-k.wb/2-.05,rear=k.wb/2-.05;
 for(const [z,isFront] of [[front,true],[rear,false]])for(const sx of [-1,1]){
  const steer=new T.Group();steer.position.set(sx*(k.W/2-.14),k.r,z);car.add(steer);const spin=new T.Group();steer.add(spin);
  const tire=new T.Mesh(new T.CylinderGeometry(k.r,k.r,.22,24),tireMat);tire.rotation.z=Math.PI/2;tire.castShadow=true;spin.add(tire);
  const rim=new T.Mesh(new T.CylinderGeometry(k.r*.66,k.r*.66,.225,20),rimMat);rim.rotation.z=Math.PI/2;spin.add(rim);
  for(let i=0;i<5;i++){const spoke=new T.Mesh(new T.BoxGeometry(.235,.05,k.r*1.1),rimMat);spoke.rotation.x=i*Math.PI/5;spin.add(spoke)}
  const arch=new T.Mesh(new T.CylinderGeometry(k.r+.06,k.r+.06,.2,20,1,true,0,Math.PI),trimMat);arch.rotation.z=Math.PI/2;arch.position.set(steer.position.x+sx*.02,k.r,z);arch.material.side=T.DoubleSide;car.add(arch);
  wheels.push({steer,spin,front:isFront,radius:k.r});
 }
 const lod=new T.LOD();lod.addLevel(car,0);
 let roll=0,steering=0;
 const update=(distance,turn,braking,dt)=>{roll-=distance/k.r;steering=T.MathUtils.damp(steering,turn*.46,12,dt);for(const w of wheels){w.spin.rotation.x=roll;w.steer.rotation.y=w.front?steering:0}brakeMat.emissiveIntensity=braking?1.8:.22};
 return {lod,rigs:[wheels],update,width:k.W+.12,length:k.L+.1,height:k.H,model:k.name};
}

import * as T from 'three';
export function createWalker(){
 const root=new T.Group();root.name='Brick-style walking figure';
 const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.43});const yellow=mat(0xffcd39),shirt=mat(0xd95624),blue=mat(0x245b87),black=mat(0x20272b);
 const part=(g,geo,m,x,y,z)=>{const p=new T.Mesh(geo,m);p.position.set(x,y,z);p.castShadow=true;p.receiveShadow=true;g.add(p);return p};
 const box=(g,m,x,y,z,w,h,d)=>part(g,new T.BoxGeometry(w,h,d),m,x,y,z);
 const torso=new T.Shape();torso.moveTo(-.16,.8);torso.lineTo(.16,.8);torso.lineTo(.215,1.24);torso.lineTo(-.215,1.24);torso.closePath();const body=part(root,new T.ExtrudeGeometry(torso,{depth:.24,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.014,bevelThickness:.014}),shirt,0,0,-.12);
 part(root,new T.CylinderGeometry(.085,.085,.09,16),yellow,0,1.29,0);
 part(root,new T.CylinderGeometry(.165,.165,.29,24),yellow,0,1.47,0);
 part(root,new T.CylinderGeometry(.075,.075,.065,16),yellow,0,1.647,0);
 for(const x of [-.06,.06])part(root,new T.SphereGeometry(.019,10,8),black,x,1.505,-.153);
 const smile=part(root,new T.TorusGeometry(.062,.008,6,16,Math.PI),black,0,1.45,-.164);smile.rotation.z=Math.PI;
 box(root,blue,0,.77,0,.34,.14,.25);
 const legs=[],arms=[];
 for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.1,.73,0);root.add(leg);box(leg,blue,0,-.28,0,.18,.53,.23);box(leg,blue,0,-.66,-.035,.18,.14,.3);legs.push(leg);
 const arm=new T.Group();arm.position.set(side*.26,1.18,0);root.add(arm);box(arm,shirt,0,-.175,0,.13,.36,.15);part(arm,new T.TorusGeometry(.055,.024,8,16,Math.PI*1.55),yellow,0,-.42,-.015);arms.push(arm)}
 // Bottom of feet is exactly y=0.
 return {root,animate(time,moving){const a=moving?Math.sin(time*9)*.45:0;legs[0].rotation.x=a;legs[1].rotation.x=-a;arms[0].rotation.x=-a*.7;arms[1].rotation.x=a*.7}};
}

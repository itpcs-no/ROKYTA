import * as T from 'three';
export function createWalker(){
 const root=new T.Group();root.name='Brick-style walking figure';
 const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.43});const yellow=mat(0xffcd39),shirt=mat(0xd95624),blue=mat(0x245b87),black=mat(0x20272b);
 const part=(g,geo,m,x,y,z)=>{const p=new T.Mesh(geo,m);p.position.set(x,y,z);p.castShadow=true;p.receiveShadow=true;g.add(p);return p};
 const box=(g,m,x,y,z,w,h,d)=>part(g,new T.BoxGeometry(w,h,d),m,x,y,z);
 const torso=new T.Shape();torso.moveTo(-.16,.8);torso.lineTo(.16,.8);torso.lineTo(.215,1.24);torso.lineTo(-.215,1.24);torso.closePath();const body=part(root,new T.ExtrudeGeometry(torso,{depth:.24,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.014,bevelThickness:.014}),shirt,0,0,-.12);
 part(root,new T.CylinderGeometry(.085,.085,.09,16),yellow,0,1.29,0);
 part(root,new T.CylinderGeometry(.165,.165,.32,32),yellow,0,1.47,0).name='Yellow minifigure head';
 part(root,new T.CylinderGeometry(.075,.075,.045,24),yellow,0,1.6525,0).name='Head stud';
 // Simple black features follow the yellow cylinder, with no photo texture.
 for(const side of [-1,1]){
  const x=side*.06,z=-Math.sqrt(.168*.168-x*x);
  const eye=part(root,new T.CircleGeometry(.019,24),black,x,1.515,z);
  eye.rotation.y=Math.atan2(x,z);eye.castShadow=false;eye.name=side<0?'Left eye':'Right eye';
 }
 const smilePoints=Array.from({length:25},(_,i)=>{const a=i*Math.PI/24,x=-.073*Math.cos(a);return new T.Vector3(x,1.455-.04*Math.sin(a),-Math.sqrt(.168*.168-x*x))});
 const smile=part(root,new T.TubeGeometry(new T.CatmullRomCurve3(smilePoints),32,.006,8,false),black,0,0,0);smile.castShadow=false;smile.name='Smile';
 box(root,blue,0,.77,0,.34,.14,.25);
 const legs=[],arms=[];
 for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.1,.73,0);root.add(leg);box(leg,blue,0,-.28,0,.18,.53,.23);box(leg,blue,0,-.66,-.035,.18,.14,.3);legs.push(leg);
 const arm=new T.Group();arm.position.set(side*.26,1.18,0);root.add(arm);box(arm,shirt,0,-.175,0,.13,.36,.15);part(arm,new T.TorusGeometry(.055,.024,8,16,Math.PI*1.55),yellow,0,-.42,-.015);arms.push(arm)}
 // Bottom of feet is exactly y=0.
 return {root,animate(time,moving){const a=moving?Math.sin(time*9)*.45:0;legs[0].rotation.x=a;legs[1].rotation.x=-a;arms[0].rotation.x=-a*.7;arms[1].rotation.x=a*.7}};
}

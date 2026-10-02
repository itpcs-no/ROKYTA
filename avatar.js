import * as T from 'three';

// Adult walker, 1.78 m, built from smooth capsules and lathe-turned shapes:
// jointed hips, knees, shoulders and elbows give a natural gait. Faces -z;
// the soles sit exactly at y=0.
export function createWalker(){
 const root=new T.Group();root.name='Postava chodca';
 const mat=(c,r=.7,extra={})=>new T.MeshStandardMaterial({color:c,roughness:r,...extra});
 const skin=mat(0xc99a7e,.55),hair=mat(0x3a2a20,.8),jacket=mat(0x2f4250,.75),shirt=mat(0xe9e6df,.85),jeans=mat(0x3c5576,.8),shoe=mat(0xf1f0ec,.5),sole=mat(0x5c5f61,.9),belt=mat(0x2a2522,.5),eye=mat(0x1d1d1d,.3);
 const add=(g,geo,m,x=0,y=0,z=0)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o};
 const capsule=(r,len)=>new T.CapsuleGeometry(r,len,6,14);
 const lathe=(profile,seg=28)=>new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),seg);
 const body=new T.Group();body.position.y=.98;root.add(body);
 // Pelvis and torso: lathe profile, slightly flattened front-to-back.
 const torso=add(body,lathe([[.0,-.08],[.165,-.07],[.175,0],[.168,.12],[.158,.24],[.175,.36],[.2,.46],[.19,.52],[.12,.56],[.0,.57]]),jacket);torso.scale.set(1,1,.62);
 add(body,new T.CylinderGeometry(.168,.17,.05,28),belt,0,-.035,0).scale.set(1,1,.64);
 const collar=add(body,new T.CylinderGeometry(.07,.085,.05,20),shirt,0,.56,0);collar.scale.set(1,1,.9);
 // Open jacket front reveals the shirt.
 const placket=add(body,new T.PlaneGeometry(.1,.42),shirt,0,.32,-.112);placket.rotation.y=Math.PI;placket.castShadow=false;
 // Neck and head.
 add(body,new T.CylinderGeometry(.052,.058,.11,16),skin,0,.62,0);
 const head=new T.Group();head.position.set(0,.70,0);body.add(head);
 const skull=add(head,new T.SphereGeometry(.1,28,20),skin);skull.scale.set(.86,1.08,.96);
 const jaw=add(head,new T.SphereGeometry(.072,20,14),skin,0,-.055,-.022);jaw.scale.set(1,.9,1);
 const hairCap=add(head,new T.SphereGeometry(.104,28,16,0,Math.PI*2,0,Math.PI*.52),hair,0,.012,.006);hairCap.scale.set(.88,1.1,1);
 add(head,new T.SphereGeometry(.03,10,8),hair,0,.02,.07).scale.set(2.6,1.9,1.2);
 for(const s of [-1,1]){add(head,new T.SphereGeometry(.024,12,10),skin,s*.087,-.005,.005).scale.set(.45,1,.8);
  add(head,new T.SphereGeometry(.0105,10,8),eye,s*.032,.012,-.09);add(head,new T.BoxGeometry(.03,.006,.008),hair,s*.032,.034,-.089)}
 const nose=add(head,new T.ConeGeometry(.014,.04,10),skin,0,-.012,-.1);nose.rotation.x=-Math.PI/2.4;
 add(head,new T.BoxGeometry(.034,.005,.006),mat(0x9b5d52,.6),0,-.05,-.088);
 // Arms: shoulder → elbow → hand.
 const arms=[];
 for(const s of [-1,1]){
  const shoulder=new T.Group();shoulder.position.set(s*.205,.48,0);body.add(shoulder);
  add(shoulder,new T.SphereGeometry(.052,16,12),jacket,0,-.01,0);
  add(shoulder,capsule(.047,.22),jacket,0,-.15,0);
  const elbow=new T.Group();elbow.position.y=-.29;shoulder.add(elbow);add(elbow,new T.SphereGeometry(.044,14,10),jacket);
  add(elbow,capsule(.04,.2),jacket,0,-.12,0);
  add(elbow,new T.CylinderGeometry(.034,.032,.05,14),skin,0,-.255,0);
  const hand=add(elbow,new T.SphereGeometry(.042,14,10),skin,0,-.3,-.005);hand.scale.set(.7,1.25,.95);
  shoulder.rotation.z=s*.035;arms.push({shoulder,elbow});
 }
 // Legs: hip → knee → ankle with sneakers.
 const legs=[];
 for(const s of [-1,1]){
  const hip=new T.Group();hip.position.set(s*.092,-.06,0);body.add(hip);
  add(hip,capsule(.076,.3),jeans,0,-.2,0);add(hip,new T.SphereGeometry(.08,16,12),jeans,0,-.02,0);
  const knee=new T.Group();knee.position.y=-.43;hip.add(knee);add(knee,new T.SphereGeometry(.064,16,12),jeans);
  add(knee,new T.CylinderGeometry(.062,.05,.36,16),jeans,0,-.19,0);
  const ankle=new T.Group();ankle.position.y=-.41;knee.add(ankle);
  const toe=add(ankle,capsule(.046,.17),shoe,0,-.03,-.055);toe.rotation.x=Math.PI/2;toe.scale.set(1.15,1,.85);
  add(ankle,new T.BoxGeometry(.1,.025,.27),sole,0,-.068,-.055);
  legs.push({hip,knee,ankle});
 }
 // Stand: hip y .98, legs .43+.45+.08 to the sole.
 let phase=0,lastTime=null,blend=0;
 return {root,animate(time,moving){
  const dt=lastTime===null?0:Math.min(.1,Math.max(0,time-lastTime));lastTime=time;
  blend=T.MathUtils.damp(blend,moving?1:0,8,dt);phase+=dt*(5.6*blend+.001);
  const w=blend,sw=Math.sin(phase),cw=Math.cos(phase);
  legs.forEach((l,i)=>{const p=i?-1:1,swing=sw*p;
   l.hip.rotation.x=-swing*.42*w;
   // Knee flexes in the swing phase (leg moving forward), nearly straight in stance.
   l.knee.rotation.x=-(Math.max(0,(-cw*p))*.75*w+.04);
   l.ankle.rotation.x=(swing>0?.15:-.1)*w*Math.abs(swing)-l.knee.rotation.x*.2;
  });
  arms.forEach((a,i)=>{const p=i?-1:1;a.shoulder.rotation.x=sw*p*.36*w;a.elbow.rotation.x=(.18+Math.max(0,sw*p)*.32)*w+.08});
  body.position.y=.98+Math.abs(cw)*.018*w-.012*w;
  body.rotation.y=sw*.06*w;body.rotation.x=-.03*w;
  head.rotation.y=-sw*.05*w;
 }};
}

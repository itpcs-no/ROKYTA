import * as T from 'three';

// A fully volumetric, articulated interpretation of the supplied single view.
// The original portrait is sampled through UVs; its pixels remain unchanged.
export function createMountedRider(){
 const root=new T.Group();root.name='Jazdec z fotografie na oslíkovi';
 const body=new T.Group();root.add(body);
 const material=(color,roughness=.85)=>new T.MeshStandardMaterial({color,roughness});
 const coat=material(0x795038),coatLight=material(0x906043),muzzle=material(0xb0a28a),hair=material(0x292922),hoofMaterial=material(0x302f2b);
 const skin=material(0xc79478),linen=material(0xd1ccbb),shoe=material(0x797c69),sole=material(0xc9c2aa),leather=material(0x423028),strap=material(0xb4a78a);
 const metal=material(0xb4a584,.36);metal.metalness=.72;
 const black=material(0x222c28,.32),eyeMaterial=material(0x0b1211,.16);
 const v=(x,y,z)=>new T.Vector3(x,y,z),unitY=v(0,1,0);
 function mesh(g,geometry,mat,p=v(0,0,0)){const o=new T.Mesh(geometry,mat);o.position.copy(p);o.castShadow=true;o.receiveShadow=true;g.add(o);return o}
 function ellipsoid(g,mat,x,y,z,sx,sy,sz){const o=mesh(g,new T.SphereGeometry(1,20,14),mat,v(x,y,z));o.scale.set(sx,sy,sz);return o}
 function segment(g,a,b,r,mat){const o=mesh(g,new T.CylinderGeometry(.83,1,1,12),mat);setSegment(o,a,b,r);return o}
 function setSegment(o,a,b,r){const delta=b.clone().sub(a);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(unitY,delta.clone().normalize());o.scale.set(r,delta.length(),r)}
 function cord(g,points,r,mat){return mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>v(...p))),Math.max(16,points.length*5),r,6,false),mat)}
 function texture(kind){
  const width=256,height=256,data=new Uint8Array(width*height*4),c=new T.Color();
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const u=x/width,w=y/height,grain=Math.sin(x*91.7+y*33.1)*.025;
   if(kind==='dye'){
    const dx=u-.48,dy=w-.37,r=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),hue=((angle/(Math.PI*2)+r*2.7)%1+1)%1;
    c.setHSL(hue,.82,.43+Math.sin(r*115+angle*6)*.09+grain,T.SRGBColorSpace);
   }else{
    const stripe=(u*7)%1,zig=Math.abs(((w*23)%1)-.5)*2,stitch=Math.abs(stripe-(.2+.6*zig))<.09;
    c.set(stitch?(Math.floor(u*7)%2?0x8d493c:0x467b72):stripe<.11?0xb89a64:0xcfc19a);c.multiplyScalar(.96+grain);
   }
   c.getRGB(c,T.SRGBColorSpace);const i=(y*width+x)*4;data[i]=Math.round(c.r*255);data[i+1]=Math.round(c.g*255);data[i+2]=Math.round(c.b*255);data[i+3]=255;
  }
  const t=new T.DataTexture(data,width,height);t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=true;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.wrapS=t.wrapT=T.RepeatWrapping;t.needsUpdate=true;return t;
 }
 const shirt=new T.MeshStandardMaterial({map:texture('dye'),roughness:.92});shirt.name='Dúhové batikované tričko';
 const vest=new T.MeshStandardMaterial({map:texture('vest'),roughness:.96,side:T.DoubleSide});vest.name='Béžová vyšívaná vesta';
 // Rounded body, shoulder and haunch volumes meet well above four separate legs.
 ellipsoid(body,coat,0,1.08,.08,.365,.40,.74);
 ellipsoid(body,coatLight,0,1.16,-.44,.30,.34,.36);
 ellipsoid(body,coat,0,1.08,.59,.33,.365,.37);
 const neck=ellipsoid(body,coatLight,0,1.36,-.68,.235,.43,.245);neck.rotation.x=-.57;
 const head=new T.Group();head.position.set(0,1.57,-1.01);body.add(head);
 const skull=ellipsoid(head,coat,0,-.015,-.04,.185,.30,.20);skull.rotation.x=-.40;
 const nose=ellipsoid(head,coatLight,0,-.19,-.25,.155,.245,.155);nose.rotation.x=-.64;
 const softNose=ellipsoid(head,muzzle,0,-.35,-.38,.158,.122,.153);softNose.rotation.x=-.35;
 for(const side of [-1,1]){
  ellipsoid(head,eyeMaterial,side*.169,.005,-.12,.017,.030,.039);
  ellipsoid(head,hoofMaterial,side*.088,-.335,-.5,.032,.027,.011);
  const ear=new T.Group();ear.position.set(side*.105,.215,.02);ear.rotation.z=side*-.19;head.add(ear);
  const outer=ellipsoid(ear,coat,0,.15,0,.067,.205,.048);outer.rotation.x=-.10;
  ellipsoid(ear,material(0x9f8273),0,.16,-.035,.036,.145,.014);
  ellipsoid(head,coatLight,side*.18,-.08,-.08,.018,.085,.09);
 }
 // Forelock and a short dark mane follow the neck instead of billboard hair.
 for(let i=0;i<15;i++){
  const z=-.61-i*.035,y=1.60+i*.018;
  const tuft=ellipsoid(body,hair,Math.sin(i*1.7)*.023,y,z,.065,.13,.055);tuft.rotation.x=-.5;
 }
 for(let i=0;i<7;i++){const tuft=ellipsoid(head,hair,(i-3)*.033,.17-(i%3)*.02,-.14,.030,.14,.045);tuft.rotation.x=-.32}
 const tail=new T.Group();tail.position.set(0,1.16,.81);body.add(tail);
 cord(tail,[[0,0,0],[.02,-.19,.17],[.04,-.48,.19],[.07,-.67,.17]],.030,coat);
 ellipsoid(tail,hair,.07,-.70,.17,.06,.17,.064);
 // Blanket, leather saddle, girth and stirrups.
 ellipsoid(body,strap,0,1.443,.10,.385,.054,.46);
 ellipsoid(body,leather,0,1.495,.08,.28,.052,.33);
 ellipsoid(body,leather,0,1.54,-.21,.26,.085,.063);
 ellipsoid(body,leather,0,1.55,.39,.285,.105,.07);
 cord(body,[[-.35,1.38,.08],[-.375,1.03,.08],[0,.74,.08],[.375,1.03,.08],[.35,1.38,.08]],.033,leather);
 for(const side of [-1,1]){
  cord(body,[[side*.28,1.50,-.09],[side*.40,1.20,-.12],[side*.47,.63,-.09]],.016,leather);
  const stirrup=mesh(body,new T.TorusGeometry(.075,.009,8,24),metal,v(side*.49,.51,-.08));stirrup.scale.set(1,1.30,1);stirrup.rotation.y=Math.PI/2;
 }
 // The reins meet the modelled hands; straps follow the head and muzzle.
 cord(head,[[-.17,.17,.04],[-.19,.02,-.07],[-.165,-.27,-.32],[0,-.23,-.48],[.165,-.27,-.32],[.19,.02,-.07],[.17,.17,.04]],.018,strap);
 cord(head,[[-.15,-.33,-.35],[0,-.37,-.22],[.15,-.33,-.35]],.018,strap);
 for(const side of [-1,1])cord(body,[[side*.17,1.29,-1.34],[side*.22,1.15,-.94],[side*.16,1.39,-.60],[side*.075,1.76,-.34]],.007,black);
 // Seated human with trousers, torso and bent arms, at life-size proportions.
 ellipsoid(body,linen,0,1.60,.11,.22,.115,.21);
 function garment(mat,offset=0,start=0,end=Math.PI*2){
  const rings=[[1.62,.17,.115],[1.70,.18,.12],[1.88,.205,.125],[2.06,.225,.12],[2.13,.195,.10],[2.16,.075,.066]],points=[],uv=[],idx=[],count=40;
  rings.forEach(([y,rx,rz],j)=>{for(let i=0;i<=count;i++){const a=start+(end-start)*i/count;points.push(Math.sin(a)*(rx+offset),y,-Math.cos(a)*(rz+offset)+.06);uv.push(i/count,(y-1.62)/.54);if(j&&i){const k=(j-1)*(count+1)+i-1,l=j*(count+1)+i-1;idx.push(k,l,k+1,k+1,l,l+1)}}});
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();return mesh(body,geo,mat);
 }
 garment(shirt).name='Tričko jazdca';garment(vest,.015,.60,Math.PI*2-.60).name='Otvorená vesta jazdca';
 for(const side of [-1,1]){
  const hip=v(side*.17,1.64,.11),knee=v(side*.49,1.13,-.23),ankle=v(side*.48,.60,.04);
  segment(body,hip,knee,.125,linen);ellipsoid(body,linen,knee.x,knee.y,knee.z,.111,.132,.12);segment(body,knee,ankle,.096,linen);
  ellipsoid(body,shoe,side*.49,.49,-.065,.09,.10,.17);ellipsoid(body,sole,side*.49,.416,-.07,.093,.025,.174);
  const shoulder=v(side*.245,2.075,.04),elbow=v(side*.315,1.83,-.095),wrist=v(side*.087,1.745,-.32);
  segment(body,shoulder,elbow,.085,shirt);ellipsoid(body,shirt,shoulder.x,shoulder.y,shoulder.z,.102,.11,.105);
  segment(body,elbow,wrist,.06,skin);ellipsoid(body,skin,elbow.x,elbow.y,elbow.z,.064,.065,.064);
  const hand=ellipsoid(body,skin,side*.072,1.745,-.345,.063,.045,.075);hand.rotation.y=side*.4;
  for(let i=0;i<4;i++)segment(body,v(side*(.037+i*.017),1.725,-.355),v(side*(.047+i*.016),1.72,-.403),.009,skin);
  for(let row=0;row<2;row++){
   const center=wrist.clone().lerp(elbow,.12+row*.08),axis=elbow.clone().sub(wrist).normalize();
   const ring=mesh(body,new T.TorusGeometry(.058,.008,6,20),row?material(0x5e8d86):black,center);ring.quaternion.setFromUnitVectors(v(0,0,1),axis);
  }
 }
 segment(body,v(0,2.135,.06),v(0,2.26,.045),.064,skin);
 const photo=new T.TextureLoader().load('assets/rider-reference.jpg');photo.colorSpace=T.SRGBColorSpace;
 const portraitMaterial=new T.MeshStandardMaterial({map:photo,roughness:.93});portraitMaterial.name='Tvár z dodanej fotografie';
 const faceGeometry=new T.SphereGeometry(1,48,32),p=faceGeometry.attributes.position,uv=faceGeometry.attributes.uv;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i)*.108,y=p.getY(i)*.155,z=p.getZ(i)*.105;
  const noseRelief=z<0?.020*Math.exp(-((x/.024)**2+((y+.004)/.040)**2)):0;
  p.setXYZ(i,x,y,z-noseRelief);uv.setXY(i,(391+x/.108*56)/720,1-(241-y/.155*80)/1280);
 }
 const bare=[],face=[];for(let i=0;i<faceGeometry.index.count;i+=3){const ids=[0,1,2].map(k=>faceGeometry.index.getX(i+k));const forward=ids.reduce((s,k)=>s+p.getZ(k),0)/3<-.040;(forward?face:bare).push(...ids)}
 faceGeometry.setIndex([...bare,...face]);faceGeometry.clearGroups();faceGeometry.addGroup(0,bare.length,0);faceGeometry.addGroup(bare.length,face.length,1);faceGeometry.computeVertexNormals();
 mesh(body,faceGeometry,[skin,portraitMaterial],v(0,2.38,.045)).name='Priestorová hlava jazdca s fotografickou tvárou';
 for(const side of [-1,1])ellipsoid(body,skin,side*.112,2.37,.046,.021,.038,.025);
 const headHair=material(0x4c4b42),silverHair=material(0x85847a);
 const cap=mesh(body,new T.SphereGeometry(1,24,14,0,Math.PI*2,0,1.12),headHair,v(0,2.39,.05));cap.scale.set(.113,.155,.109);
 for(let i=0;i<20;i++){const a=i*2.4,r=.07*Math.sqrt(i/20);const tuft=ellipsoid(body,i%4===0?silverHair:headHair,Math.cos(a)*r,2.53-r*.35,.05+Math.sin(a)*r,.027,.021,.036);tuft.rotation.y=a}
 for(const side of [-1,1]){
  const x=side*.047,y=2.423,z=-.053;
  const lens=mesh(body,new T.CircleGeometry(.032,28),black,v(x,y,z));lens.rotation.y=Math.PI;
  mesh(body,new T.TorusGeometry(.0335,.003,8,32),metal,v(x,y,z-.002));
  cord(body,[[x+side*.032,y,z],[side*.106,y,.008],[side*.115,y-.018,.070]],.0026,metal);
 }
 cord(body,[[-.014,2.425,-.055],[0,2.428,-.067],[.014,2.425,-.055]],.0025,metal);
 for(let i=0;i<2;i++){
  const bottom=1.80-i*.10;
  cord(body,[[-.065,2.18,.016],[-.11,2.01,-.069],[0,bottom,-.084],[.11,2.01,-.069],[.065,2.18,.016]],.004,black);
  const pendant=ellipsoid(body,strap,0,bottom-.022,-.09,.016,.040,.006);pendant.rotation.z=.22;
 }
 // Four two-bone legs: stance feet slide back with body travel; swing feet lift.
 const legs=[];
 for(const front of [true,false])for(const side of [-1,1]){
  const hip=v(side*.255,1.03,front?-.49:.56),upper=segment(root,hip,hip.clone().add(v(0,-.5,0)),front?.073:.091,coat),lower=segment(root,hip,hip.clone().add(v(0,-.5,0)),.039,coatLight);
  const joint=ellipsoid(root,coat,0,0,0,.053,.061,.053),foot=ellipsoid(root,hoofMaterial,0,.06,0,.064,.061,.088);
  legs.push({hip,upper,lower,joint,foot,front,side,phase:front?(side<0?0:.5):(side<0?.75:.25)});
 }
 let cycle=0;
 const api={root,height:2.60,eyeHeight:2.40,legs,body,
  animate(time,speed,dt=1/60,airborne=false,groundAt=null){
   const moving=speed>.02;cycle+=moving?dt*(speed>2.7?2.15:1.35):0;
   const bob=moving?Math.sin(cycle*Math.PI*4)*.013:Math.sin(time*1.7)*.003;body.position.y=bob;body.rotation.z=moving?Math.sin(cycle*Math.PI*2)*.009:0;tail.rotation.z=Math.sin(time*1.8)*.10;
   head.rotation.x=Math.sin(time*(moving?5:1.5))*(moving?.025:.008);
   for(const leg of legs){
    const phase=(cycle+leg.phase)%1,stance=.64,stride=Math.min(.65,speed/(speed>2.7?2.15:1.35));
    let travel=0,lift=0;if(moving){if(phase<stance)travel=-stride/2+stride*phase/stance;else{const swing=(phase-stance)/(1-stance);travel=stride/2-stride*swing;lift=Math.sin(swing*Math.PI)*.14}}
    const target=v(leg.side*.285,.125+lift,leg.hip.z+travel);
    if(groundAt&&!airborne){const sy=Math.sin(root.rotation.y),cy=Math.cos(root.rotation.y),wx=root.position.x+target.x*cy+target.z*sy,wz=root.position.z-target.x*sy+target.z*cy;target.y+=T.MathUtils.clamp(groundAt(wx,wz)-root.position.y,-.3,.3)}
    if(airborne){target.y+=.15;target.z+=leg.front?-.12:.1}
    const hip=leg.hip.clone();hip.y+=bob;const delta=target.clone().sub(hip),distance=Math.min(.999,Math.max(.12,delta.length())),direction=delta.normalize(),along=distance/2,bend=Math.sqrt(Math.max(0,.51**2-along**2));
    const sideways=v(0,-direction.z,direction.y).normalize().multiplyScalar(leg.front?1:-1),knee=hip.clone().addScaledVector(direction,along).addScaledVector(sideways,bend);
    setSegment(leg.upper,hip,knee,leg.front?.073:.091);setSegment(leg.lower,knee,target,.039);leg.joint.position.copy(knee);leg.foot.position.copy(target).add(v(0,-.064,-.018));
   }
  }
 };
 api.animate(0,0);root.userData={reference:'assets/rider-reference.jpg',singleViewApproximation:true,animatedQuadruped:true};return api;
}

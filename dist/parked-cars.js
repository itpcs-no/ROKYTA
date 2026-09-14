import * as T from 'three';
// Eight existing 3.125 m bays, between the columns of the green-roof carport.
export function buildParkedCars(){
 const cars=new T.Group();cars.name='Cars in covered parking';
 const rubber=new T.MeshStandardMaterial({color:0x202427,roughness:.92}),trim=new T.MeshStandardMaterial({color:0x30383b,roughness:.62}),rim=new T.MeshStandardMaterial({color:0xb4bcc0,metalness:.75,roughness:.28}),glass=new T.MeshStandardMaterial({color:0x294450,metalness:.32,roughness:.18}),headlight=new T.MeshStandardMaterial({color:0xeaf2ef,emissive:0xb7cbd0,emissiveIntensity:.2}),tail=new T.MeshStandardMaterial({color:0x941f22,roughness:.4});
 function box(g,x,y,z,w,h,d,m){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o}
 function quad(g,pts,m){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pts.flat(),3));geo.setIndex([0,1,2,0,2,3]);geo.computeVertexNormals();const o=new T.Mesh(geo,m);o.castShadow=true;o.receiveShadow=true;g.add(o)}
 const paints=[0xe7e8e5,0x555b60,0x272c31,0xd0d1ca,0x344853,0xf0f0e9,0x62696c,0x6f3530];
 for(let i=0;i<8;i++){
  const car=new T.Group();car.name=`Parked car ${i+1}`;car.position.set(-35.5+(i+.5)*3.125,.06,-1.65);cars.add(car);
  const paint=new T.MeshPhysicalMaterial({color:paints[i],metalness:.48,roughness:.24,clearcoat:1,clearcoatRoughness:.14,envMapIntensity:1.2,side:T.DoubleSide});
  box(car,0,.56,0,1.78,.35,4.28,trim);box(car,0,.78,0,1.84,.4,4.38,paint);
  box(car,0,1,-1.5,1.78,.1,1.22,paint);box(car,0,.99,1.68,1.76,.1,.87,paint);
  const windshield=glass.clone();windshield.side=T.DoubleSide;
  quad(car,[[-.83,.98,-1.04],[.83,.98,-1.04],[.7,1.51,-.43],[-.7,1.51,-.43]],windshield);
  quad(car,[[-.7,1.51,-.43],[.7,1.51,-.43],[.7,1.51,.72],[-.7,1.51,.72]],paint);
  quad(car,[[-.7,1.51,.72],[.7,1.51,.72],[.82,.98,1.29],[-.82,.98,1.29]],windshield);
  for(const side of [-1,1]){
   quad(car,[[side*.83,.98,-1.04],[side*.7,1.51,-.43],[side*.7,1.51,.72],[side*.82,.98,1.29]],windshield);
   box(car,side*.77,1.24,.16,.045,.53,.075,trim);
   box(car,side*.947,1.08,-.74,.17,.105,.24,paint);
   box(car,side*.926,.9,.52,.024,.026,.18,rim);
   for(const z of [-1.35,1.35]){
    const tire=new T.Mesh(new T.CylinderGeometry(.3,.3,.21,32),rubber);tire.rotation.z=Math.PI/2;tire.position.set(side*.88,.3,z);tire.castShadow=true;car.add(tire);
    const hub=new T.Mesh(new T.CylinderGeometry(.185,.185,.023,24),rim);hub.rotation.z=Math.PI/2;hub.position.set(side*1.0,.3,z);car.add(hub);
   }
   box(car,side*.61,.85,-2.205,.48,.135,.032,headlight);box(car,side*.66,.86,2.205,.35,.16,.032,tail);
  }
  box(car,0,.62,-2.208,.79,.13,.025,trim);box(car,0,.63,2.211,.31,.085,.025,rim);
  car.userData={bay:i+1,width:2.02,length:4.44,height:1.56};
 }
 return cars;
}

import * as T from 'three';

// Conceptual roof coverage, using the actual cap extents and finished levels.
// Terraces and planted roofs are not part of the building's roof-cap collection.
export const moduleSize={width:1.76,length:1.134,thickness:.035,tilt:Math.PI/18};
const edgeGap=.55,columnGap=.06,rowGap=.26,wallGap=.55,lowClearance=.16;

export function layoutPhotovoltaics(roofs){
 const {width,length,thickness,tilt}=moduleSize;
 const depth=length*Math.cos(tilt)+thickness*Math.sin(tilt),panels=[];
 for(const roof of roofs){
  const usableWidth=roof.x1-roof.x0-2*edgeGap,usableDepth=roof.z1-roof.z0-2*edgeGap;
  const columns=Math.floor((usableWidth+columnGap)/(width+columnGap));
  const rows=Math.floor((usableDepth+rowGap)/(depth+rowGap));
  const spanX=columns*width+(columns-1)*columnGap,spanZ=rows*depth+(rows-1)*rowGap;
  for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
   const x=(roof.x0+roof.x1-spanX+width)/2+column*(width+columnGap);
   const z=(roof.z0+roof.z1-spanZ+depth)/2+row*(depth+rowGap);
   const bounds={x0:x-width/2,x1:x+width/2,z0:z-depth/2,z1:z+depth/2};
   // Reject the whole module where an upper storey covers a lower roof.
   if(roofs.some(other=>other.top>roof.top+.3&&bounds.x1>other.x0-wallGap&&bounds.x0<other.x1+wallGap&&bounds.z1>other.z0-wallGap&&bounds.z0<other.z1+wallGap))continue;
   const y=roof.top+lowClearance+length*Math.sin(tilt)/2+thickness*Math.cos(tilt)/2;
   panels.push({roof:roof.id,x,y,z,roofTop:roof.top,bounds});
  }
 }
 return panels;
}

function siliconTexture(){
 const width=768,height=512,data=new Uint8Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const frameU=.0225/moduleSize.width,frameV=.0225/moduleSize.length;
  const u=(x/width-frameU)/(1-2*frameU),v=(y/height-frameV)/(1-2*frameV),cx=u*12,cy=v*6,fx=cx%1,fy=cy%1;
  const frame=u<0||u>1||v<0||v>1;
  const border=Math.min(fx,1-fx)<.012||Math.min(fy,1-fy)<.012;
  const corner=Math.min(fx,1-fx)+Math.min(fy,1-fy)<.045;
  const split=Math.abs(u-.5)<.003;
  const wire=Math.min((fx*5)%1,1-(fx*5)%1)<.024;
  const variation=1+.035*Math.sin(Math.floor(cx)*17+Math.floor(cy)*31);
  const color=frame?[102,116,123]:border||corner||split?[67,81,90]:wire?[37,57,70]:[17,33,48];
  const i=(y*width+x)*4;
  for(let k=0;k<3;k++)data[i+k]=Math.round(color[k]*variation);
  data[i+3]=255;
 }
 const map=new T.DataTexture(data,width,height,T.RGBAFormat);
 map.colorSpace=T.SRGBColorSpace;map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;
 return map;
}

export function buildPhotovoltaics(roofs){
 const root=new T.Group();root.name='Rooftop photovoltaics';
 const panels=layoutPhotovoltaics(roofs),{width,length,thickness,tilt}=moduleSize;
 root.userData={panels,count:panels.length,roofs:roofs.map(roof=>({...roof,count:panels.filter(p=>p.roof===roof.id).length}))};
 if(!panels.length)return root;
 const aluminum=new T.MeshStandardMaterial({color:0x66747b,metalness:.85,roughness:.32});
 const silicon=new T.MeshPhysicalMaterial({map:siliconTexture(),metalness:.2,roughness:.24,clearcoat:.8,clearcoatRoughness:.16,envMapIntensity:1.1});
 const steel=new T.MeshStandardMaterial({color:0x738087,metalness:.78,roughness:.43});
 const concrete=new T.MeshStandardMaterial({color:0x9a9d97,roughness:.94});
 // Silicon is the actual top face of the module. There is no aluminum face
 // one millimetre underneath it competing for the same depth-buffer value.
 const geometry=new T.BoxGeometry(width,thickness,length),top=[],shell=[];
 for(const group of geometry.groups)for(let i=group.start;i<group.start+group.count;i++)(group.materialIndex===2?top:shell).push(geometry.index.getX(i));
 geometry.setIndex([...shell,...top]);geometry.clearGroups();geometry.addGroup(0,shell.length,0);geometry.addGroup(shell.length,top.length,1);
 const body=new T.InstancedMesh(geometry,[aluminum,silicon],panels.length);silicon.name='Photovoltaic silicon cells';
 const hardware=new T.InstancedMesh(new T.BoxGeometry(1,1,1),steel,panels.length*6);
 const ballast=new T.InstancedMesh(new T.BoxGeometry(.24,.06,.34),concrete,panels.length*4);
 body.name='Photovoltaic aluminum frames';hardware.name='Photovoltaic mounting rails and legs';ballast.name='Photovoltaic roof ballast';
 const matrix=new T.Matrix4(),one=new T.Vector3(1,1,1),scale=new T.Vector3(),position=new T.Vector3();
 const rotation=new T.Quaternion().setFromEuler(new T.Euler(-tilt,0,0)),upright=new T.Quaternion();
 let hardwareIndex=0,ballastIndex=0;
 panels.forEach((panel,i)=>{
  const center=new T.Vector3(panel.x,panel.y,panel.z);
  body.setMatrixAt(i,matrix.compose(center,rotation,one));
  for(const localZ of [-length*.3,length*.3]){
   position.set(0,-thickness/2-.026,localZ).applyQuaternion(rotation).add(center);
   hardware.setMatrixAt(hardwareIndex++,matrix.compose(position,rotation,scale.set(width-.16,.052,.065)));
   const railBottom=position.y-.026*Math.cos(tilt),baseTop=panel.roofTop+.06;
   const supportZ=position.z;
   for(const localX of [-width*.33,width*.33]){
    position.set(panel.x+localX,panel.roofTop+.03,supportZ);
    ballast.setMatrixAt(ballastIndex++,matrix.compose(position,upright,one));
    // Upright feet touch both the ballast and the underside of each rail.
    position.y=(baseTop+railBottom)/2;
    hardware.setMatrixAt(hardwareIndex++,matrix.compose(position,upright,scale.set(.044,railBottom-baseTop,.044)));
   }
  }
 });
 for(const mesh of [body,hardware,ballast]){
  mesh.castShadow=true;mesh.receiveShadow=true;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();root.add(mesh);
 }
 return root;
}

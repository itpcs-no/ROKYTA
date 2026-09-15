import * as T from 'three';

// Metre-based textures: the same paving joint or plaster grain keeps its size
// on a small stair tread, a long balcony and the PDF-derived wall polygons.
const cache=new Map();
const fract=x=>x-Math.floor(x);
const hash=(x,y)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453);
function noise(x,y,period){
 const ix=Math.floor(x),iy=Math.floor(y),fx=fract(x),fy=fract(y),sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
 const h=(a,b)=>hash((a+period)%period,(b+period)%period);
 return T.MathUtils.lerp(T.MathUtils.lerp(h(ix,iy),h(ix+1,iy),sx),T.MathUtils.lerp(h(ix,iy+1),h(ix+1,iy+1),sx),sy);
}
const specifications={
 plaster:{color:[232,230,222],size:1,roughness:.86,bump:.0012},
 stone:{color:[68,73,74],size:3,roughness:.73,bump:.012},
 concrete:{color:[173,171,159],size:2,roughness:.9,bump:.007},
 paving:{color:[179,178,168],size:2.4,roughness:.84,bump:.01},
 asphalt:{color:[87,91,92],size:2,roughness:.95,bump:.012},
 courtBlue:{color:[58,121,127],size:2,roughness:.91,bump:.0015},
 courtRed:{color:[155,94,84],size:2,roughness:.9,bump:.0015},
 grass:{color:[101,119,68],size:5,roughness:1,bump:.045},
 soil:{color:[95,81,60],size:2,roughness:1,bump:.026},
 wood:{color:[153,115,77],size:1.2,roughness:.57,bump:.009},
 bark:{color:[99,85,65],size:.8,roughness:.95,bump:.025},
 roof:{color:[90,93,89],size:2,roughness:.96,bump:.018},
 pool:{color:[147,186,184],size:1.2,roughness:.36,bump:.005}
};
function buildTextures(kind){
 const spec=specifications[kind],size=512,albedo=new Uint8Array(size*size*4),bump=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size,n=hash(x,y),broad=noise(u*8,v*8,8),medium=noise(u*32,v*32,32);
  let variation=(n-.5)*.045+(broad-.5)*.055,height=n*.25+.35;
  if(kind==='grass'){
   const blades=hash(Math.floor(x/2),Math.floor(y/7));
   variation=(n-.5)*.2+(broad-.5)*.28+(medium-.5)*.13+(blades-.5)*.14;height=.25+blades*.5;
  }else if(kind==='paving'||kind==='pool'||kind==='stone'){
   const cells=kind==='pool'?8:4,rows=kind==='stone'?2:cells;
   const row=Math.floor(v*rows),xu=fract(u*cells+(kind==='stone'?row%2*.5:0)),yv=fract(v*rows);
   const edge=Math.min(xu,1-xu,yv,1-yv),joint=kind==='pool'?.018:.008;
   const tile=hash(Math.floor(u*cells+(kind==='stone'?row%2*.5:0)),row);
   variation+=(tile-.5)*.09;const grout=T.MathUtils.smoothstep(edge,joint,joint*2.1);
   variation-=.28*(1-grout);height=.25+.48*grout+n*.07;
  }else if(kind==='wood'||kind==='bark'){
   const grain=Math.sin(u*310+Math.sin(v*6.283)*2.5+medium*3);
   variation+=(grain*.035+(broad-.5)*.13)*(kind==='bark'?1.8:1);height=.45+grain*.2;
  }else if(kind==='roof'||kind==='asphalt'||kind==='soil'||kind.startsWith('court')){
   variation+=(n-.5)*.2+(medium-.5)*.07;height=n*.7+.15;
  }
  const i=(y*size+x)*4;
  for(let k=0;k<3;k++){albedo[i+k]=Math.max(0,Math.min(255,spec.color[k]*(1+variation)));bump[i+k]=Math.round(height*255)}
  albedo[i+3]=bump[i+3]=255;
 }
 const texture=(array,colorSpace)=>{const t=new T.DataTexture(array,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.repeat.set(1/spec.size,1/spec.size);t.colorSpace=colorSpace;t.needsUpdate=true;return t};
 return {map:texture(albedo,T.SRGBColorSpace),bumpMap:texture(bump,T.NoColorSpace)};
}
export function surface(kind){
 if(cache.has(kind))return cache.get(kind);
 const spec=specifications[kind];if(!spec)throw Error('Unknown surface '+kind);
 const m=new T.MeshStandardMaterial({...buildTextures(kind),roughness:spec.roughness,bumpScale:spec.bump});
 m.name=kind;m.userData.metreUV=true;
 if(kind==='grass'){
  // Broad colour variation prevents a visibly tiled carpet at building scale.
  m.onBeforeCompile=shader=>{
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vGrassWorld;').replace('#include <begin_vertex>','#include <begin_vertex>\nvGrassWorld=(modelMatrix*vec4(position,1.0)).xyz;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vGrassWorld;').replace('#include <color_fragment>','#include <color_fragment>\nfloat mottling=sin(vGrassWorld.x*.29+sin(vGrassWorld.z*.18))*sin(vGrassWorld.z*.37+cos(vGrassWorld.x*.21));\ndiffuseColor.rgb*=.94+.09*mottling;');
  };
  m.customProgramCacheKey=()=> 'rokyta-grass-1';
 }
 cache.set(kind,m);return m;
}
export function glassMaterial(railing=false){
 const m=new T.MeshPhysicalMaterial({color:railing?0xdde9e7:0xb4cbd1,metalness:.1,roughness:.095,transparent:true,opacity:railing?.21:.39,depthWrite:false,side:T.DoubleSide,clearcoat:1,clearcoatRoughness:.065,envMapIntensity:1.2});
 m.name=railing?'Balcony glass':'Window glass';return m;
}
export function finishSurfaces(root,renderer){
 const done=new WeakSet(),filtered=new WeakSet(),anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());root.traverse(mesh=>{
  if(!mesh.isMesh)return;const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  for(const m of mats)for(const texture of [m.map,m.bumpMap,m.normalMap,m.roughnessMap])if(texture&&!filtered.has(texture)){
   filtered.add(texture);texture.anisotropy=anisotropy;texture.needsUpdate=true;
  }
  if(!mats.some(m=>m.userData.metreUV)||done.has(mesh.geometry))return;
  done.add(mesh.geometry);const geo=mesh.geometry,p=geo.attributes.position,n=geo.attributes.normal;
  if(!p||!n)return;const uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){
   // Height fields keep one projection even where a steep slope changes its
   // dominant normal. Switching axes at individual vertices stretches triangles.
   if(geo.userData.uvProjection==='xz'){uv[i*2]=p.getX(i);uv[i*2+1]=p.getZ(i);continue}
   const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));
   uv[i*2]=nx>ny&&nx>nz?p.getZ(i):p.getX(i);uv[i*2+1]=ny>nx&&ny>nz?p.getZ(i):p.getY(i);
  }
  geo.setAttribute('uv',new T.BufferAttribute(uv,2));
 });
}

import * as T from 'three';

// Local, filtered environment captures supply the nearby garden and architecture
// to physical glass, water, photovoltaic coatings and car paint.
export function addSceneReflections(scene,renderer){
 if(!renderer.isWebGLRenderer)return {count:0};
 const transparent=[],reflectors=[],probes=[new T.Vector3(-8,3.5,-27.5),new T.Vector3(-42,2,-23),new T.Vector3(-20,8,51)];
 scene.traverse(mesh=>{if(!mesh.isMesh)return;const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  if(materials.some(m=>m.transparent&&m.opacity<.95)&&mesh.visible){transparent.push(mesh);mesh.visible=false}
  if(materials.some(m=>m.userData.reflectionSurface||(m.isMeshPhysicalMaterial&&m.metalness>.15)))reflectors.push(mesh);
 });
 const clipped=renderer.clippingPlanes;renderer.clippingPlanes=[];scene.updateMatrixWorld(true);
 const pmrem=new T.PMREMGenerator(renderer),textures=[];
 const type=renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType;
 try{
  for(const position of probes){
   const capture=new T.WebGLCubeRenderTarget(innerWidth<760?128:256,{type,generateMipmaps:false});capture.texture.colorSpace=T.LinearSRGBColorSpace;
   const camera=new T.CubeCamera(.15,1500,capture);camera.position.copy(position);camera.update(renderer,scene);
   textures.push(pmrem.fromCubemap(capture.texture).texture);capture.dispose();
  }
 }finally{transparent.forEach(mesh=>mesh.visible=true);renderer.clippingPlanes=clipped;pmrem.dispose()}
 const variants=new Map(),position=new T.Vector3();
 for(const mesh of reflectors){
  if(!mesh.geometry.boundingSphere)mesh.geometry.computeBoundingSphere();position.copy(mesh.geometry.boundingSphere.center).applyMatrix4(mesh.matrixWorld);
  const index=position.z>35?2:position.x<-29?1:0;
  const materialFor=m=>{if(!(m.userData.reflectionSurface||(m.isMeshPhysicalMaterial&&m.metalness>.15)))return m;
   const key=m.uuid+':'+index;if(!variants.has(key)){const clone=m.clone();clone.onBeforeCompile=m.onBeforeCompile;clone.customProgramCacheKey=m.customProgramCacheKey;clone.envMap=textures[index];clone.needsUpdate=true;variants.set(key,clone)}return variants.get(key);
  };
  mesh.material=Array.isArray(mesh.material)?mesh.material.map(materialFor):materialFor(mesh.material);
 }
 return {count:textures.length,textures};
}

import * as T from 'three';

// Batch only direct, static opaque meshes. Doors, characters, vehicles, glass and
// named floor slabs keep their individual geometry and interaction identities.
export function batchStaticMeshes(group,exclude=[]){
 const excluded=new Set(exclude),buckets=new Map(),sources=[];group.updateMatrixWorld(true);
 for(const mesh of [...group.children]){
  if(!mesh.isMesh||mesh.isInstancedMesh||!mesh.visible||excluded.has(mesh))continue;
  const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];if(materials.some(m=>m.transparent))continue;
  const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;if(!p||!n)continue;
  const matrix=mesh.matrix,normalMatrix=new T.Matrix3().getNormalMatrix(matrix),point=new T.Vector3(),normal=new T.Vector3();
  const ranges=g.groups.length?g.groups:[{start:0,count:g.index?.count??p.count,materialIndex:0}];
  for(const range of ranges){const material=materials[range.materialIndex]??materials[0],key=material.uuid+':'+mesh.castShadow+':'+mesh.receiveShadow;
   if(!buckets.has(key))buckets.set(key,{material,cast:mesh.castShadow,receive:mesh.receiveShadow,p:[],n:[],uv:[]});const bucket=buckets.get(key);
   for(let j=range.start;j<range.start+range.count;j++){const i=g.index?g.index.getX(j):j;point.fromBufferAttribute(p,i).applyMatrix4(matrix);normal.fromBufferAttribute(n,i).applyNormalMatrix(normalMatrix);bucket.p.push(...point.toArray());bucket.n.push(...normal.toArray());bucket.uv.push(uv?uv.getX(i):0,uv?uv.getY(i):0)}
  }
  sources.push(mesh);
 }
 if(sources.length<=buckets.size)return {before:sources.length,after:sources.length};
 for(const bucket of buckets.values()){const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(bucket.p,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(bucket.n,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(bucket.uv,2));geometry.computeBoundingSphere();const mesh=new T.Mesh(geometry,bucket.material);mesh.name='Zlúčené statické povrchy';mesh.castShadow=bucket.cast;mesh.receiveShadow=bucket.receive;group.add(mesh)}
 for(const mesh of sources){mesh.visible=false;mesh.userData.batchedForRendering=true}
 return {before:sources.length,after:buckets.size};
}

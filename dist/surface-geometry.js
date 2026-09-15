import * as T from 'three';

const area=points=>points.reduce((sum,a,i)=>{const b=points[(i+1)%points.length];return sum+a[0]*b[1]-b[0]*a[1]},0)/2;
const bounds=points=>({x0:Math.min(...points.map(p=>p[0])),x1:Math.max(...points.map(p=>p[0])),z0:Math.min(...points.map(p=>p[1])),z1:Math.max(...points.map(p=>p[1]))});
const overlaps=(a,b)=>a.x0<b.x1-1e-8&&a.x1>b.x0+1e-8&&a.z0<b.z1-1e-8&&a.z1>b.z0+1e-8;
export const rectOutline=r=>[[r.x0,r.z0],[r.x1,r.z0],[r.x1,r.z1],[r.x0,r.z1]];

export function roadEdges(road){
 return road.points.map((p,i)=>{
  const a=road.points[Math.max(0,i-1)],b=road.points[Math.min(road.points.length-1,i+1)];
  const [dx,dz]=i===road.points.length-1&&road.endDirection?road.endDirection:[b[0]-a[0],b[1]-a[1]],scale=road.width/2/Math.hypot(dx,dz);
  return [-1,1].map(sign=>[p[0]-sign*dz*scale,p[2],p[1]+sign*dx*scale]);
 });
}

// Exact footprint of the same ribbon that renders the road, including its ends.
export function roadOutline(road){
 const sides=[[],[]];roadEdges(road).forEach(edges=>edges.forEach(([x,y,z],i)=>sides[i].push([x,z])));
 const polygon=[...sides[0],...sides[1].reverse()];
 return polygon.filter((p,i)=>{const a=polygon[(i+polygon.length-1)%polygon.length],b=polygon[(i+1)%polygon.length];return Math.abs((p[0]-a[0])*(b[1]-p[1])-(p[1]-a[1])*(b[0]-p[0]))>1e-8});
}
function cutConvex(subject,mask){
 if(!overlaps(bounds(subject.map(p=>[p.x,p.z])),mask.bounds))return [subject];
 const outside=[];let inside=subject;
 for(let e=0;e<mask.points.length&&inside.length>=3;e++){
  const a=mask.points[e],b=mask.points[(e+1)%mask.points.length],left=[],right=[];
  const distance=p=>(b[0]-a[0])*(p.z-a[1])-(b[1]-a[1])*(p.x-a[0]);
  for(let i=0;i<inside.length;i++){
   const p=inside[i],q=inside[(i+1)%inside.length],dp=distance(p),dq=distance(q);
   (dp>=0?left:right).push(p);
   if((dp>=0)!==(dq>=0)){const cross=p.clone().lerp(q,dp/(dp-dq));left.push(cross);right.push(cross)}
  }
  if(right.length>=3)outside.push(right);inside=left;
 }
 return outside;
}

// Remove coverage instead of stacking surfaces or using a depth-test override.
// Bottoms and vertical supporting faces are retained, along with object identity.
export function subtractTopSurfaces(mesh,polygons,trimBottom=false){
 const masks=polygons.flatMap(polygon=>T.ShapeUtils.triangulateShape(polygon.map(([x,z])=>new T.Vector2(x,z)),[]).map(indices=>{
  const points=indices.map(i=>polygon[i]);if(area(points)<0)points.reverse();return {points,bounds:bounds(points)};
 }));
 if(!masks.length)return mesh;
 mesh.updateWorldMatrix(true,false);const inverse=mesh.matrixWorld.clone().invert(),old=mesh.geometry,p=old.attributes.position,index=old.index,vertices=[];
 const normal=new T.Vector3(),ab=new T.Vector3(),ac=new T.Vector3();let clipped=0;
 for(let i=0;i<(index?index.count:p.count);i+=3){
  const triangle=Array.from({length:3},(_,j)=>new T.Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld));
  normal.crossVectors(ab.subVectors(triangle[1],triangle[0]),ac.subVectors(triangle[2],triangle[0])).normalize();
  let pieces=[triangle];
  if(normal.y>.85||(trimBottom&&normal.y<-.85)){
   const originalBounds=bounds(triangle.map(p=>[p.x,p.z]));
   for(const mask of masks){if(overlaps(originalBounds,mask.bounds))pieces=pieces.flatMap(piece=>cutConvex(piece,mask));if(!pieces.length)break}
   if(pieces.length!==1||pieces[0]!==triangle)clipped++;
  }
  for(const piece of pieces)for(let j=1;j<piece.length-1;j++){
   const a=piece[0],b=piece[j],c=piece[j+1];
   if(ab.subVectors(b,a).cross(ac.subVectors(c,a)).lengthSq()<1e-14)continue;
   for(const v of [a,b,c])vertices.push(...v.clone().applyMatrix4(inverse).toArray());
  }
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.userData={...old.userData};geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();mesh.geometry=geometry;old.dispose();mesh.userData.trimmedTopTriangles=clipped;
 return mesh;
}

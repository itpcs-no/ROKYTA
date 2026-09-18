import * as T from 'three';

// Linear HDR image with contact shading and one output transform. Native
// resolution is the default; reduced-resolution modes are explicit choices.
export function renderPixelRatio(width,height,dpr,quality='ultra',maxDimension=16384){
 const native=Math.min(dpr||1,maxDimension/width,maxDimension/height);
 if(quality==='ultra')return native;
 const smooth=quality==='smooth',mobile=width<760,budget=smooth?1400000:4200000;
 return Math.min(native,smooth?1.2:mobile?1.5:2,Math.sqrt(budget/(width*height)));
}
export const qualityVertex=`varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`;
export const qualityFragment=`
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform vec2 resolution;
uniform mat4 projectionInverse;
uniform mat4 projection;
uniform float detail;
varying vec2 vUv;
vec3 positionAt(vec2 uv){float d=texture2D(tDepth,uv).r;vec4 p=projectionInverse*vec4(uv*2.0-1.0,d*2.0-1.0,1.0);return p.xyz/p.w;}
float contactShadow(vec2 uv){
 float depth=texture2D(tDepth,uv).r;if(depth>.999999)return 1.0;
 vec2 pixel=1.0/resolution;vec3 p=positionAt(uv);
 vec3 l=positionAt(uv-vec2(pixel.x,0.0)),r=positionAt(uv+vec2(pixel.x,0.0));
 vec3 b=positionAt(uv-vec2(0.0,pixel.y)),t=positionAt(uv+vec2(0.0,pixel.y));
 vec3 dx=abs(r.z-p.z)<abs(p.z-l.z)?r-p:p-l,dy=abs(t.z-p.z)<abs(p.z-b.z)?t-p:p-b;
 vec3 n=normalize(cross(dx,dy));
 float radius=clamp(1.15*projection[1][1]*resolution.y/max(-p.z,.2)*.5,2.0,48.0);
 // A fixed, denser kernel avoids per-pixel random grain crawling over plaster
 // and paving as the camera moves.
 float occ=0.0;
 for(int i=0;i<16;i++){
  float f=(float(i)+.5)/16.0,a=float(i)*2.39996323+.382;
  vec2 qUV=uv+vec2(cos(a),sin(a))*sqrt(f)*radius*pixel;
  if(qUV.x<0.0||qUV.x>1.0||qUV.y<0.0||qUV.y>1.0)continue;
  vec3 delta=positionAt(qUV)-p;float dist=length(delta);
  float horizon=max(dot(n,delta)/max(dist,.0001)-.10,0.0);
  occ+=horizon*(1.0-smoothstep(.25,1.5,dist))*smoothstep(.012,.06,dist);
 }
 return clamp(1.0-occ*.1425,.64,1.0);
}
void main(){
 vec3 color=texture2D(tColor,vUv).rgb;
 if(detail>.5)color*=contactShadow(vUv);
 vec2 centered=vUv-.5;float vignette=1.0-.075*dot(centered,centered);color*=vignette;
 gl_FragColor=vec4(color,1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

export function createRenderQuality(renderer){
 if(!renderer.isWebGLRenderer)return {render:(scene,camera)=>renderer.render(scene,camera),resize(){},setQuality(){}};
 let quality='ultra';
 function displaySize(){
  renderer.setPixelRatio(renderPixelRatio(innerWidth,innerHeight,devicePixelRatio,quality,renderer.capabilities.maxTextureSize));renderer.setSize(innerWidth,innerHeight);
 }
 const hdr=renderer.extensions.has('EXT_color_buffer_float');
 if(!hdr){displaySize();return {render:(scene,camera)=>renderer.render(scene,camera),resize:displaySize,setQuality(value){quality=value;displaySize()}}}
 const target=new T.WebGLRenderTarget(1,1,{type:hdr?T.HalfFloatType:T.UnsignedByteType,minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:true});
 target.texture.colorSpace=T.LinearSRGBColorSpace;target.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);target.depthTexture.minFilter=target.depthTexture.magFilter=T.NearestFilter;
 const detailSamples=Math.min(innerWidth<760?2:4,renderer.capabilities.maxSamples||0);
 target.samples=detailSamples;
 const uniforms={tColor:{value:target.texture},tDepth:{value:target.depthTexture},resolution:{value:new T.Vector2()},projectionInverse:{value:new T.Matrix4()},projection:{value:new T.Matrix4()},detail:{value:1}};
 const material=new T.ShaderMaterial({vertexShader:qualityVertex,fragmentShader:qualityFragment,uniforms,depthWrite:false,depthTest:false});
 const postScene=new T.Scene(),postCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);postScene.add(new T.Mesh(new T.PlaneGeometry(2,2),material));
 function resize(){displaySize();const size=renderer.getDrawingBufferSize(new T.Vector2());target.setSize(size.x,size.y);uniforms.resolution.value.copy(size)}
 function setQuality(value){quality=value;const detailed=value!=='smooth';uniforms.detail.value=detailed?1:0;const samples=detailed?detailSamples:0;if(target.samples!==samples){target.samples=samples;target.dispose()}resize()}
 resize();
 return {target,uniforms,resize,setQuality,render(scene,camera){
  uniforms.projectionInverse.value.copy(camera.projectionMatrixInverse);uniforms.projection.value.copy(camera.projectionMatrix);
  const output=renderer.getRenderTarget(),clipping=renderer.clippingPlanes;
  try{
   renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,camera);
   renderer.clippingPlanes=[];renderer.setRenderTarget(output);renderer.render(postScene,postCamera);
  }finally{renderer.clippingPlanes=clipping;renderer.setRenderTarget(output)}
 }};
}

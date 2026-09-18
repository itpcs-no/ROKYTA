import * as T from 'three';

// Linear HDR image with contact shading, restrained highlight bloom and output
// transform. One geometry pass; quality can be reduced on slower devices.
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
 vec2 px=1.0/resolution;vec3 color=texture2D(tColor,vUv).rgb;
 vec3 neighbours=(texture2D(tColor,vUv+vec2(px.x,0.0)).rgb+texture2D(tColor,vUv-vec2(px.x,0.0)).rgb+texture2D(tColor,vUv+vec2(0.0,px.y)).rgb+texture2D(tColor,vUv-vec2(0.0,px.y)).rgb)*.25;
 // Keep fine solar-cell lines and distant leaf edges calm, without sharpening
 // halos around the white facade.
 float edge=length(color-neighbours)/max(length(color),.2);
 color=mix(color,neighbours,smoothstep(.12,.6,edge)*.10);
 if(detail>.5)color*=contactShadow(vUv);
 vec3 bloom=vec3(0.0);
 for(int i=0;i<4;i++){float a=float(i)*1.5707963;vec2 off=vec2(cos(a),sin(a))*px*6.0;vec3 c=texture2D(tColor,vUv+off).rgb;bloom+=max(c-vec3(2.1),vec3(0.0));}
 color+=bloom*.008;
 vec2 centered=vUv-.5;float vignette=1.0-.075*dot(centered,centered);color*=vignette;
 gl_FragColor=vec4(color,1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

export function createRenderQuality(renderer){
 if(!renderer.isWebGLRenderer)return {render:(scene,camera)=>renderer.render(scene,camera),resize(){},setQuality(){}};
 const hdr=renderer.extensions.has('EXT_color_buffer_float');
 if(!hdr)return {render:(scene,camera)=>renderer.render(scene,camera),resize(){},setQuality(value){renderer.setPixelRatio(Math.min(devicePixelRatio,value==='smooth'?1:1.5));renderer.setSize(innerWidth,innerHeight)}};
 const target=new T.WebGLRenderTarget(1,1,{type:hdr?T.HalfFloatType:T.UnsignedByteType,minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:true});
 target.texture.colorSpace=T.LinearSRGBColorSpace;target.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);target.depthTexture.minFilter=target.depthTexture.magFilter=T.NearestFilter;
 const detailSamples=Math.min(innerWidth<760?2:4,renderer.capabilities.maxSamples||0);
 target.samples=detailSamples;
 const uniforms={tColor:{value:target.texture},tDepth:{value:target.depthTexture},resolution:{value:new T.Vector2()},projectionInverse:{value:new T.Matrix4()},projection:{value:new T.Matrix4()},detail:{value:1}};
 const material=new T.ShaderMaterial({vertexShader:qualityVertex,fragmentShader:qualityFragment,uniforms,depthWrite:false,depthTest:false});
 const postScene=new T.Scene(),postCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);postScene.add(new T.Mesh(new T.PlaneGeometry(2,2),material));
 let detailed=true;
 function resize(){const mobile=innerWidth<760,budget=detailed?2800000:1400000;const ratio=Math.min(devicePixelRatio,detailed?(mobile?1.5:2):1.2,Math.sqrt(budget/(innerWidth*innerHeight)));renderer.setPixelRatio(ratio);renderer.setSize(innerWidth,innerHeight);const size=renderer.getDrawingBufferSize(new T.Vector2());target.setSize(size.x,size.y);uniforms.resolution.value.copy(size)}
 function setQuality(value){detailed=value!=='smooth';uniforms.detail.value=detailed?1:0;const samples=detailed?detailSamples:0;if(target.samples!==samples){target.samples=samples;target.dispose()}resize()}
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

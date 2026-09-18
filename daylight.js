import * as T from 'three';
import {HDRLoader} from './assets/HDRLoader.js';

export function addDaylight(scene,renderer){
 renderer.toneMapping=T.AgXToneMapping;renderer.toneMappingExposure=1.0;
 renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 scene.fog=new T.FogExp2(0xd5dfe2,.00115);
 const sunDirection=new T.Vector3(-.85,.70,-.65).normalize();
 const sky=new T.Mesh(new T.SphereGeometry(1200,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{sunDirection:{value:sunDirection}},
  vertexShader:'varying vec3 vSky; void main(){vSky=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:`uniform vec3 sunDirection; varying vec3 vSky;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
  void main(){vec3 d=normalize(vSky);float h=max(d.y,0.);vec3 color=mix(vec3(.79,.79,.71),vec3(.22,.42,.67),pow(h,.42));
   vec2 p=d.xz/(max(d.y,.04)+.25)*2.5;float cloud=noise(p)*.55+noise(p*2.03)*.27+noise(p*4.1)*.13+noise(p*8.2)*.05;
   float veil=smoothstep(.49,.71,cloud)*smoothstep(.02,.25,h)*.75;color=mix(color,vec3(.91,.91,.86),veil);
   float s=max(dot(d,sunDirection),0.);color+=vec3(1.,.84,.62)*pow(s,64.)*.18+vec3(9.,7.8,5.8)*pow(s,5200.);
   color=mix(vec3(.20,.25,.15),color,smoothstep(-.08,.015,d.y));gl_FragColor=vec4(color,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`
 }));sky.name='Daylight sky';sky.frustumCulled=false;scene.add(sky);
 // A filtered environment lights the physical materials and supplies real
 // view-dependent reflections to the windows, railings, water and car paint.
 let fallbackEnvironment;
 if(renderer.isWebGLRenderer){
  const environmentScene=new T.Scene();const environmentSky=sky.clone();environmentSky.geometry=new T.SphereGeometry(250,32,16);environmentScene.add(environmentSky);
  const pmrem=new T.PMREMGenerator(renderer);const env=pmrem.fromScene(environmentScene,.04,.1,600);fallbackEnvironment=env;scene.environment=env.texture;scene.environmentIntensity=.68;pmrem.dispose();environmentSky.geometry.dispose();
 }
 scene.add(new T.HemisphereLight(0xe5eff7,0x777c54,.16));
 const sun=new T.DirectionalLight(0xffeedc,2.3);sun.position.copy(sunDirection).multiplyScalar(120);sun.target.position.set(0,0,-2);scene.add(sun,sun.target);sun.castShadow=true;
 const shadowSize=innerWidth<800?2048:4096;sun.shadow.mapSize.set(shadowSize,shadowSize);sun.shadow.bias=-.00004;sun.shadow.normalBias=.045;sun.shadow.radius=2.8;
 Object.assign(sun.shadow.camera,{left:-95,right:95,top:90,bottom:-80,near:.5,far:290});sun.shadow.camera.updateProjectionMatrix();
 // Load a photographic radiance map before taking the local reflection probes.
 // Keep the built-in sky as a complete fallback when the HDR asset is unavailable.
 const ready=renderer.isWebGLRenderer?new HDRLoader().loadAsync('assets/materials/photographic/kloofendal_overcast_puresky_2k.hdr').then(texture=>{
  texture.mapping=T.EquirectangularReflectionMapping;
  const pmrem=new T.PMREMGenerator(renderer);
  try{
   const environment=pmrem.fromEquirectangular(texture);
   scene.environment=environment.texture;scene.environmentIntensity=.82;
   scene.background=texture;scene.backgroundIntensity=.92;scene.backgroundBlurriness=.025;
   scene.backgroundRotation.y=.65;scene.environmentRotation.y=.65;
   sky.visible=false;fallbackEnvironment?.dispose();
   scene.userData.daylight={photographic:true,source:'Poly Haven · Kloofendal Overcast Pure Sky',environment};
   renderer.shadowMap.needsUpdate=true;return true;
  }finally{pmrem.dispose()}
 }).catch(error=>{console.warn('Photographic daylight unavailable; using the built-in sky.',error);return false}):Promise.resolve(false);
 return {sky,sun,ready};
}

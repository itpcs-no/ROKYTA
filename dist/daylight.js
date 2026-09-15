import * as T from 'three';

export function addDaylight(scene,renderer){
 renderer.toneMapping=T.AgXToneMapping;renderer.toneMappingExposure=1.12;
 renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 scene.fog=new T.FogExp2(0xcfd6d5,.00175);
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
 if(renderer.isWebGLRenderer){
  const environmentScene=new T.Scene();const environmentSky=sky.clone();environmentSky.geometry=new T.SphereGeometry(250,32,16);environmentScene.add(environmentSky);
  const pmrem=new T.PMREMGenerator(renderer);const env=pmrem.fromScene(environmentScene,.04,.1,600);scene.environment=env.texture;scene.environmentIntensity=.68;pmrem.dispose();environmentSky.geometry.dispose();
 }
 scene.add(new T.HemisphereLight(0xdce8f0,0x897b63,.40));
 const sun=new T.DirectionalLight(0xffe8cc,3.7);sun.position.copy(sunDirection).multiplyScalar(120);sun.target.position.set(0,0,-2);scene.add(sun,sun.target);sun.castShadow=true;
 const shadowSize=innerWidth<800?2048:4096;sun.shadow.mapSize.set(shadowSize,shadowSize);sun.shadow.bias=-.00004;sun.shadow.normalBias=.045;sun.shadow.radius=2.8;
 Object.assign(sun.shadow.camera,{left:-95,right:95,top:90,bottom:-80,near:.5,far:290});sun.shadow.camera.updateProjectionMatrix();
 return {sky,sun};
}

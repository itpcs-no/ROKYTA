import * as T from 'three';
import {surfaceTime} from './surface-materials.js';

export function makeWaterMaterial(spa=false){
 const material=new T.MeshPhysicalMaterial({color:spa?0x58aaab:0x328fa3,transparent:true,opacity:spa?.58:.46,depthWrite:false,roughness:spa?.16:.065,metalness:.06,clearcoat:1,clearcoatRoughness:.06,envMapIntensity:1.55,side:T.DoubleSide});
 material.name=spa?'Teplá voda vírivky':'Číra bazénová voda';material.userData.reflectionSurface=true;
 material.onBeforeCompile=shader=>{
  shader.uniforms.surfaceTime=surfaceTime;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vPoolWorld;').replace('#include <begin_vertex>','#include <begin_vertex>\nvPoolWorld=(modelMatrix*vec4(position,1.0)).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float surfaceTime;varying vec3 vPoolWorld;').replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec2 p=vPoolWorld.xz;float t=surfaceTime;
   vec3 ripple=vec3(sin(p.x*6.0+p.y*2.7+t*.8)*.04+sin(p.x*14.0-p.y*9.0-t*.55)*.018,0.0,cos(p.y*7.0-p.x*3.0+t*.7)*.035);
   normal=normalize(normal+mat3(viewMatrix)*ripple);
  `);
 };material.customProgramCacheKey=()=> 'rokyta-water-2';return material;
}

export function addPoolCaustics(material){
 material.onBeforeCompile=shader=>{
  shader.uniforms.surfaceTime=surfaceTime;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vCausticWorld;').replace('#include <begin_vertex>','#include <begin_vertex>\nvCausticWorld=(modelMatrix*vec4(position,1.0)).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float surfaceTime;varying vec3 vCausticWorld;').replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   vec2 p=vCausticWorld.xz*4.5;float t=surfaceTime*.45;
   float a=sin(p.x+sin(p.y*1.3+t)*1.6-t),b=sin(p.y+cos(p.x*1.2-t)*1.7+t);
   float shimmer=pow(max(0.0,1.0-abs(a+b)*2.1),7.0);
   totalEmissiveRadiance+=vec3(.12,.23,.22)*shimmer*.25;
  `);
 };material.customProgramCacheKey=()=> 'rokyta-pool-caustics-1';return material;
}

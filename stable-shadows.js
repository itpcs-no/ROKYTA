import * as T from 'three';

// Three r186's PCF kernel rotates with gl_FragCoord. Without temporal
// accumulation its five noisy samples crawl across flat facades as the camera
// moves. Keep this small tent filter fixed in light-space instead.
export const stablePCF = `
float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
 shadowCoord.xyz /= shadowCoord.w;
 shadowCoord.z += shadowBias;
 if (shadowCoord.x < 0.0 || shadowCoord.x > 1.0 || shadowCoord.y < 0.0 || shadowCoord.y > 1.0 || shadowCoord.z > 1.0) return 1.0;
 vec2 stepUV = vec2(shadowRadius * 0.5) / shadowMapSize;
 float shadow = 0.0;
 for (int y = -1; y <= 1; y++) {
  for (int x = -1; x <= 1; x++) {
   float weight = (x == 0 ? 2.0 : 1.0) * (y == 0 ? 2.0 : 1.0);
   shadow += weight * texture(shadowMap, vec3(shadowCoord.xy + vec2(float(x), float(y)) * stepUV, shadowCoord.z));
  }
 }
 return mix(1.0, shadow / 16.0, shadowIntensity);
}`;

let installed = false;
export function installStableShadows() {
 if (installed) return;
 const chunk = T.ShaderChunk.shadowmap_pars_fragment;
 const start = chunk.indexOf('float getShadow( sampler2DShadow');
 const end = chunk.indexOf('#elif defined( SHADOWMAP_TYPE_VSM )', start);
 if (start < 0 || end < 0) throw new Error('Unsupported shadow shader version');
 T.ShaderChunk.shadowmap_pars_fragment = chunk.slice(0, start) + stablePCF + '\n\t' + chunk.slice(end);
 installed = true;
}

// A static scene needs no new shadow map when only its camera moves. Moving
// characters/vehicles update at most 30 times a second, with a final update
// when they stop. Explicit door/floor/gate invalidations remain untouched.
export function createShadowUpdates(renderer) {
 let elapsed = 1, previous = '', dirty = false;
 return (dt, object, pose = 0) => {
  elapsed += dt;
  const signature = object ? [object.id,object.position.x,object.position.y,object.position.z,object.rotation.y,pose].join(':') : '';
  if (signature !== previous) {dirty = true; previous = signature;}
  if (renderer.shadowMap.needsUpdate) {elapsed = 0; dirty = false;}
  else if (dirty && elapsed >= 1 / 30) {renderer.shadowMap.needsUpdate = true; elapsed = 0; dirty = false;}
 };
}

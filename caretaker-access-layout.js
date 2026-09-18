// Regrade the previous garage approach as a single straight surface. Keep the
// site's established road level so the parking and gate elevations do not move.
export const roadLevel=2.78-(10.789956+1.398225)*Math.tan(6*Math.PI/180);
export const caretakerApproach={x0:-2.341267,x1:15.5,z0:15.878973,z1:24.4,top:2.78,bottom:roadLevel};
export const sideApproach={x0:15.5,x1:34.5,z0:20.4,z1:24.4,level:roadLevel};
export const gardenBlend={x0:15.5,x1:34.5,z0:18.4,z1:20.4,top:2.55,bottom:roadLevel};
const clamp=t=>Math.max(0,Math.min(1,t));
export function caretakerGardenHeight(z){return gardenBlend.top+(gardenBlend.bottom-gardenBlend.top)*clamp((z-gardenBlend.z0)/(gardenBlend.z1-gardenBlend.z0))}

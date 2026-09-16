// Coordinates traced from 01_1NP and 02_2NP NAVRHOVANY, scale 1:100.
import {courtWalkingHeight} from './court-layout.js';
import {sitePavedHeight,siteShoulderHeight} from './site-layout.js';
import {hillsideParking,parkingBlockAt,cellarAt,cellars} from './parking-layout.js';
import {homeWalkingHeight} from './homes-layout.js';
import {wellnessWalkingHeight} from './wellness-layout.js';
export const garage={x0:-13.091288,x1:-2.341267,z0:15.503966,z1:23.828992,floor:2.78,doorZ0:17.403992,doorZ1:22.903974,doorHeight:3};
export const ramp={x0:-1.398225,x1:10.789956,z0:15.878973,z1:23.578978,top:2.78,angle:6};
ramp.bottom=ramp.top-(ramp.x1-ramp.x0)*Math.tan(ramp.angle*Math.PI/180);
export function rampHeight(x){return ramp.top-Math.max(0,Math.min(ramp.x1-ramp.x0,x-ramp.x0))*Math.tan(ramp.angle*Math.PI/180)}
// Model coordination heights: upper levels inferred from the 2.950 m door openings
// plus lintel/slab allowance; only garage +2.780 is an explicit supplied elevation.
export const levels=[0,2.78,6.16,8.94];
export const slabThickness=.24;
export const footprints=[
 [[-28.85,-22.98,28.85,-10.08],[-4.81,-10.65,4.91,-1.35],[-7.94,-1.42,10.89,16.01],[garage.x0,garage.z0,garage.x1,garage.z1]],
 [[-28.85,-22.98,28.85,-10.08],[-4.81,-10.65,4.91,-1.35],[-7.94,-1.42,10.89,16.01],[garage.x0,garage.z0,garage.x1,garage.z1]],
 [[-23.68,-20.87,23.73,-12.08],[-4.81,-12.2,4.91,-1.35],[-7.94,-1.42,10.89,16.01]],
 [[-4.82,-9.35,4.89,-.96]]
];
// The eastern flight fills the former gap up to the raised garden at x=15.5.
// Keep the western flight clear of the existing cellar entrances.
export const gardenStairs={flights:[{x0:-11.35,x1:-9.25},{x0:11.45,x1:15.5}],z0:-7.745,z1:-2.8,bottom:.06,top:2.575,count:16};
// Garage access corridor: keep this volume free of raised pedestrian slabs.
export const access={x0:ramp.x1,x1:15.25,z0:ramp.z0,z1:28,level:ramp.bottom,pathEnd:13.575};
export const gardenPaths=[
 ...gardenStairs.flights.map(f=>({...f,z0:gardenStairs.z1,z1:access.pathEnd})),
 {x0:-13.5,x1:-11.35,z0:12.025,z1:access.pathEnd}
];
export function gardenStairHeight(z){
 const s=gardenStairs,step=Math.max(0,Math.min(s.count,Math.floor((z-s.z0)/(s.z1-s.z0)*s.count)+1));
 return s.bottom+step*(s.top-s.bottom)/s.count;
}
export function exteriorHeight(x,z,referenceHeight){
 let y=.05;
 const shoulder=siteShoulderHeight(x,z,ramp.bottom);if(shoulder!==null)y=shoulder;
 if(z>-2.5&&z<23.5&&((x>-32.5&&x<-13.5)||(x>15.5&&x<34.5)))y=2.58;
 if(z>=ramp.z0&&z<=ramp.z1&&x>=garage.x1&&x<=ramp.x1)y=rampHeight(x);
 if(z>=garage.z0&&z<=garage.z1&&x>=garage.x0&&x<garage.x1)y=garage.floor;
 if(x>=access.x0&&x<=access.x1&&z>=access.z0&&z<=access.z1)y=access.level;
 if(x>=-35.5&&x<=-10.5&&z>=-8.8&&z<=1.28)y=.06;
 const sportsHeight=courtWalkingHeight(x,z,ramp.bottom);if(sportsHeight!==null)y=sportsHeight;
 const road=sitePavedHeight(x,z,ramp.bottom);if(road!==null)y=road;
 // Stairs sit above the lower walkway: its broad footprint must not reset
 // the first treads to ground level and make the walker sink through them.
 if(z>=gardenStairs.z0&&z<gardenStairs.z1&&gardenStairs.flights.some(f=>x>=f.x0&&x<=f.x1))y=gardenStairHeight(z);
 if(gardenPaths.some(p=>x>=p.x0&&x<=p.x1&&z>=p.z0&&z<=p.z1))y=gardenStairs.top;
 // Distinguish the ground floor from the grass roof at the same x/z position.
 if(parkingBlockAt(x,z)&&(referenceHeight===undefined||referenceHeight<ramp.bottom+hillsideParking.clearance+.1))y=ramp.bottom;
 if(cellarAt(x,z))y=referenceHeight!==undefined&&referenceHeight>cellars.ceiling+.05?2.53:cellars.floor;
 const housing=homeWalkingHeight(x,z,ramp.bottom);if(housing!==null)y=housing;
 const wellness=wellnessWalkingHeight(x,z);if(wellness!==null)y=wellness;
 return y;
}

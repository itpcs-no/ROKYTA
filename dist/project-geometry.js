// Coordinates traced from 01_1NP and 02_2NP NAVRHOVANY, scale 1:100.
export const pool={x0:-17.838159,x1:-7.858253,z0:-18.826286,z1:-13.846263,bottom:-1.5,water:-.12};
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
export const gardenStairs={x:[-10.3,12.5],z0:-7.745,z1:-2.8,width:2.1,bottom:0,top:2.575,count:16};

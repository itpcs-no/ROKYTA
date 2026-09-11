// Coordinates traced from 01_1NP and 02_2NP NAVRHOVANY, scale 1:100.
export const pool={x0:-17.838159,x1:-7.858253,z0:-18.826286,z1:-13.846263,bottom:-1.5,water:-.12};
export const garage={x0:-13.091288,x1:-2.341267,z0:15.503966,z1:23.828992,floor:2.78,doorZ0:17.403992,doorZ1:22.903974,doorHeight:3};
export const ramp={x0:-1.398225,x1:10.789956,z0:15.878973,z1:23.578978,top:2.78,angle:6};
ramp.bottom=ramp.top-(ramp.x1-ramp.x0)*Math.tan(ramp.angle*Math.PI/180);
export function rampHeight(x){return ramp.top-Math.max(0,Math.min(ramp.x1-ramp.x0,x-ramp.x0))*Math.tan(ramp.angle*Math.PI/180)}

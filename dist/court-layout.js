// Landscape reconstruction from the three aerial photographs dated 2007.
// Positions, grading and the smaller court's markings are visual estimates.
// The proposed building's PDF geometry is intentionally not used as a 2007 survey.
export const courtSite={
 level:6.6,ground:6.56,x0:-73,x1:49,z0:33,z1:98,
 plateauX0:-58,plateauX1:29,plateauZ0:47,plateauZ1:73,
 stairs:{x:1,width:2,z0:34,z1:46,count:29},
 link:{x0:-41,x1:0,z0:47.2,z1:48.5}
};
export const courts=[
 {name:'Väčší tenisový kurt',x:1,z:58.5,length:36.6,width:18.3,playLength:23.8,playWidth:11,type:'tennis'},
 {name:'Menší športový kurt',x:-40,z:56,length:25,width:15,playLength:18,playWidth:9,type:'small'}
];
export const courtFences=courts.flatMap(c=>{
 const a=c.x-c.length/2,b=c.x+c.length/2,front=c.z-c.width/2,back=c.z+c.width/2;
 return [{a:[a,front],b:[c.x-.95,front]},{a:[c.x+.95,front],b:[b,front]},{a:[a,back],b:[b,back]},{a:[a,front],b:[a,back]},{a:[b,front],b:[b,back]}];
});
export const courtNets=courts.map(c=>({a:[c.x,c.z-c.playWidth/2-.65],b:[c.x,c.z+c.playWidth/2+.65],height:c.type==='tennis'?.96:2.25}));
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t)};
const inRect=(x,z,a,b,c,d)=>x>=a&&x<=c&&z>=b&&z<=d;
export function courtStairHeight(z,roadLevel){
 const s=courtSite.stairs;if(z<s.z0)return roadLevel;if(z>=s.z1)return courtSite.level;
 const t=clamp((z-s.z0)/(s.z1-s.z0));
 return roadLevel+(Math.floor(t*s.count)+1)*(courtSite.level-roadLevel)/s.count;
}
export function courtTerrainHeight(x,z,roadLevel){
 const s=courtSite;if(!inRect(x,z,s.x0,s.z0,s.x1,s.z1))return null;
 const across=smooth((x-s.x0)/(s.plateauX0-s.x0))*smooth((s.x1-x)/(s.x1-s.plateauX1));
 const rear=smooth((s.z1-z)/(s.z1-s.plateauZ1));
 const rise=clamp((z-s.z0)/(s.plateauZ0-s.z0));
 const road=x>=-47.5&&x<=47.5?roadLevel:-.06;
 let y=-.06+(s.ground+.06)*across*rear;
 if(z<s.plateauZ0)y=road*(1-rise)+y*rise;
 // Shallow irregularities belong to the slopes, not beneath the level courts.
 if(rise>0&&rise<1)y+=Math.sin(x*.23)*Math.sin(z*.31)*.13*Math.sin(rise*Math.PI);
 const st=s.stairs;
 if(Math.abs(x-st.x)<=st.width/2+.16&&z<=49.35){
  const linear=roadLevel+clamp((z-st.z0)/(st.z1-st.z0))*(s.level-roadLevel);
  y=Math.min(y,linear-.2);
 }
 return y;
}
export function courtWalkingHeight(x,z,roadLevel){
 let y=courtTerrainHeight(x,z,roadLevel);if(y===null)return null;
 const s=courtSite,st=s.stairs;
 if(Math.abs(x-st.x)<=st.width/2&&z>=s.z0&&z<=49.35)y=courtStairHeight(z,roadLevel);
 if(inRect(x,z,s.link.x0,s.link.z0,s.link.x1,s.link.z1))y=s.level;
 for(const c of courts)if(inRect(x,z,c.x-c.length/2,c.z-c.width/2,c.x+c.length/2,c.z+c.width/2))y=s.level;
 return y;
}
function nearSegment(x,z,s,r){
 const [ax,az]=s.a,[bx,bz]=s.b,dx=bx-ax,dz=bz-az,t=clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz));
 return Math.hypot(x-ax-t*dx,z-az-t*dz)<r;
}
export function courtBarrierAt(x,z){
 const st=courtSite.stairs;
 const sides=[{a:[st.x-st.width/2-.08,st.z0],b:[st.x-st.width/2-.08,st.z1]},{a:[st.x+st.width/2+.08,st.z0],b:[st.x+st.width/2+.08,st.z1]},
  {a:[-47.5,33.12],b:[st.x-1.3,33.12]},{a:[st.x+1.3,33.12],b:[29,33.12]}];
 return courtFences.some(s=>nearSegment(x,z,s,.22))||courtNets.some(s=>nearSegment(x,z,s,.2))||sides.some(s=>nearSegment(x,z,s,.18));
}

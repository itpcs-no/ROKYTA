import * as T from 'three';
// Vehicle rectangles include mirrors; checking both sets of axes also catches edge contacts.
function overlaps(a,b){
 const axes=[a.rotation.y,b.rotation.y].flatMap(t=>[[Math.cos(t),-Math.sin(t)],[Math.sin(t),Math.cos(t)]]);
 const corners=c=>[-1,1].flatMap(x=>[-1,1].map(z=>[c.position.x+x*1.05*Math.cos(c.rotation.y)+z*2.25*Math.sin(c.rotation.y),c.position.z-x*1.05*Math.sin(c.rotation.y)+z*2.25*Math.cos(c.rotation.y)]));
 const ca=corners(a),cb=corners(b);return axes.every(([x,z])=>{const pa=ca.map(p=>p[0]*x+p[1]*z),pb=cb.map(p=>p[0]*x+p[1]*z);return Math.max(...pa)>Math.min(...pb)&&Math.max(...pb)>Math.min(...pa)});
}
export function createDriving(cars,height,canMove){
 let active=null,speed=0;
 function allowed(x,z,angle){
  const y=height(x,z),probe={position:{x,z},rotation:{y:angle}};
  if(Math.abs(x)>48||Math.abs(z)>42)return false;
  // Sample the body perimeter and centre, not just its centre point.
  for(const u of [-1.05,0,1.05])for(const v of [-2.25,-1.1,0,1.1,2.25]){
   const px=x+u*Math.cos(angle)+v*Math.sin(angle),pz=z-u*Math.sin(angle)+v*Math.cos(angle);
   if((px>=-35.6&&px<=-10.4&&Math.abs(pz-1.4)<.3)||Array.from({length:9},(_,i)=>-35.5+i*3.125).some(post=>Math.abs(px-post)<.3&&Math.abs(pz+4.7)<.3)||!canMove(px,pz)||Math.abs(height(px,pz)-y)>.3)return false;
  }
  return !cars.children.some(c=>c!==active&&overlaps(probe,c));
 }
 return {get active(){return active},get speed(){return speed},
  nearest(p){return cars.children.filter(c=>Math.hypot(c.position.x-p.x,c.position.z-p.z)<4).sort((a,b)=>a.position.distanceTo(p)-b.position.distanceTo(p))[0]},
  enter(car){active=car;speed=0},leave(){active=null;speed=0},
  update(dt,throttle,steer,brake){if(!active)return;
   speed=T.MathUtils.clamp(speed+throttle*5*dt,-3,8);
   if(!throttle||brake)speed=T.MathUtils.damp(speed,0,brake?12:2,dt);
   const angle=active.rotation.y+steer*speed*.28*dt;
   const x=active.position.x-Math.sin(angle)*speed*dt,z=active.position.z-Math.cos(angle)*speed*dt;
   if(allowed(x,z,angle)&&Math.abs(height(x,z)-active.position.y)<.2){active.position.set(x,height(x,z),z);active.rotation.y=angle}else speed=0;
  }
 };
}

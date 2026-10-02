import * as T from 'three';

// Building services overlay (X-ray): drainage, cold and hot water, and the
// ventilation ducts of wet rooms. Wet fixtures from the furnished plans of all
// floors are grouped into stacks; each stack gets one shaft at the position
// that minimises the orthogonal branch length (weighted median, toilets count
// triple because of their DN110 branch). Branches longer than 6 m are marked:
// at 2 % fall they drop more than 12 cm and are the places to rearrange.
const WEIGHT={wc:3,bath:2,shower:2,vanity:1,kitchen:1,drain:1,sink:1};
const extraFixtures=[
 // Flat in the former pool hall (pool-apartment.js).
 {floor:0,type:'shower',x:-7.32,z:-20.65},{floor:0,type:'vanity',x:-5.24,z:-19.16},{floor:0,type:'wc',x:-5.46,z:-20.8},{floor:0,type:'kitchen',x:-5.21,z:-14.65},
 // Indoor wellness: two showers, steam-room drain, linear drain.
 {floor:0,type:'shower',x:-20.05,z:-18.25},{floor:0,type:'shower',x:-20.05,z:-17.2},{floor:0,type:'drain',x:-20.5,z:-20.2},{floor:0,type:'drain',x:-20.4,z:-16.6},
 // Cellar: WC, washbasin, bar sink.
 {floor:0,type:'wc',x:-6.95,z:-.5},{floor:0,type:'sink',x:-6.9,z:1.35},{floor:0,type:'sink',x:-4.6,z:6.85}
];
const median=(items,key)=>{const s=[...items].sort((a,b)=>a[key]-b[key]),total=s.reduce((a,i)=>a+i.w,0);let acc=0;for(const i of s){acc+=i.w;if(acc>=total/2)return i[key]}return s.at(-1)[key]};
export function planInstallations(data,furnishing){
 const fixtures=[];
 furnishing.floors.forEach((list,floor)=>{for(const o of list)if(WEIGHT[o.type])fixtures.push({floor,type:o.type,x:(o.x0+o.x1)/2,z:(o.z0+o.z1)/2})});
 fixtures.push(...extraFixtures);
 for(const f of fixtures)f.w=WEIGHT[f.type];
 // Single-linkage clustering in plan: fixtures within 2.6 m share a stack.
 const parent=fixtures.map((_,i)=>i),find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));
 for(let i=0;i<fixtures.length;i++)for(let j=i+1;j<fixtures.length;j++)if(Math.hypot(fixtures[i].x-fixtures[j].x,fixtures[i].z-fixtures[j].z)<2.6)parent[find(i)]=find(j);
 const groups=new Map();fixtures.forEach((f,i)=>{const r=find(i);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(f)});
 const stacks=[...groups.values()].map((items,id)=>({id,items,x:median(items,'x'),z:median(items,'z'),floors:[...new Set(items.map(f=>f.floor))].sort()}));
 const branches=[];
 for(const s of stacks)for(const f of s.items){const length=Math.abs(f.x-s.x)+Math.abs(f.z-s.z);branches.push({stack:s,fixture:f,length,long:length>6})}
 const sewer=branches.reduce((a,b)=>a+b.length,0);
 return {fixtures,stacks,branches,summary:{stacks:stacks.length,fixtures:fixtures.length,branchLength:sewer,longBranches:branches.filter(b=>b.long).length}};
}
export function buildInstallations(data,furnishing){
 const plan=planInstallations(data,furnishing),root=new T.Group();root.name='Inštalácie (röntgenový pohľad)';
 const mat=(color,opacity=.95)=>new T.MeshBasicMaterial({color,transparent:true,opacity,depthTest:false,depthWrite:false});
 const M={sewer:mat(0x7a5a3a),long:mat(0xff8a1f),cold:mat(0x2f7fe0),hot:mat(0xe0442f),vent:mat(0xb9c4c8,.55),shaft:mat(0xffffff,.13),main:mat(0x4b3523),meter:mat(0x2f7fe0)};
 const up=new T.Vector3(0,1,0);
 const pipe=(a,b,r,m)=>{const A=new T.Vector3(...a),B=new T.Vector3(...b),d=new T.Vector3().subVectors(B,A),len=d.length();if(len<.01)return;
  const o=new T.Mesh(new T.CylinderGeometry(r,r,len,8,1,true),m);o.position.copy(A).add(B).multiplyScalar(.5);o.quaternion.setFromUnitVectors(up,d.normalize());o.renderOrder=999;root.add(o)};
 const run=(points,r,m)=>{for(let i=1;i<points.length;i++)pipe(points[i-1],points[i],r,m)};
 const block=(x,y,z,sx,sy,sz,m)=>{const o=new T.Mesh(new T.BoxGeometry(sx,sy,sz),m);o.position.set(x,y,z);o.renderOrder=998;root.add(o)};
 const base=f=>data[f].base;
 // Below-slab collector along the south walkway of the long wing, out to the public sewer.
 const collectorZ=-9.2,collectorY=-.85,outlet=[51.5,collectorY-.4,collectorZ];
 const xs=plan.stacks.map(s=>s.x);run([[Math.min(...xs)-.5,collectorY,collectorZ],[outlet[0],outlet[1],outlet[2]]],.08,M.main);
 block(outlet[0],-.6,outlet[2],1,1.2,1,M.main);
 // Water meter well by the east gate road; main under the walkway to the technical room.
 const plant=[2.6,0,-8.4],distY=2.42;
 run([[46.5,-1.1,-8.6],[plant[0],-1.1,-8.6],[plant[0],distY,-8.6]],.035,M.cold);block(46.5,-.6,-8.6,1.2,1,1.2,M.meter);
 for(const s of plan.stacks){
  const low=Math.min(...s.floors),high=Math.max(...s.floors),top=base(high)+3.4;
  // Shaft outline, sewer stack with roof vent, cold/hot risers, extract duct.
  block(s.x,(base(low)+top)/2-.4,s.z,.55,top-base(low)+.8,.55,M.shaft);
  run([[s.x,collectorY,s.z],[s.x,top,s.z]],.055,M.sewer);
  run([[s.x,collectorY,s.z],[s.x,collectorY,collectorZ]],.055,M.sewer);
  for(const [dx,m] of [[.16,M.cold],[.24,M.hot]])run([[s.x+dx,base(low)+.3,s.z+.12],[s.x+dx,base(high)+.45,s.z+.12]],.022,m);
  block(s.x-.15,(base(low)+top)/2+.6,s.z-.15,.14,top-base(low)-1.2,.14,M.vent);
  // Water feed from the ground-floor distribution to the bottom of each riser.
  for(const [dx,m] of [[.16,M.cold],[.24,M.hot]])run([[plant[0]+dx,distY,plant[2]],[plant[0]+dx,distY,s.z+.12],[s.x+dx,distY,s.z+.12],[s.x+dx,base(low)+.3,s.z+.12]],.02,m);
 }
 for(const b of plan.branches){
  const {stack:s,fixture:f}=b,y=base(f.floor)+.07,wy=base(f.floor)+.42;
  run([[f.x,y,f.z],[s.x,y,f.z],[s.x,y,s.z]],f.type==='wc'?.055:.032,b.long?M.long:M.sewer);
  run([[f.x,wy,f.z],[s.x+.16,wy,f.z],[s.x+.16,wy,s.z+.12]],.016,M.cold);
  if(f.type!=='wc'&&f.type!=='drain')run([[f.x,wy+.08,f.z],[s.x+.24,wy+.08,f.z],[s.x+.24,wy+.08,s.z+.12]],.016,M.hot);
 }
 // Cigar-lounge extract and sauna/steam extract to their units.
 run([[7.6,2.4,4.2],[7.6,2.4,13.9],[9.35,2.4,13.9],[9.35,1.8,14.4]],.12,M.vent);
 run([[9.9,2.4,15.1],[9.9,base(2)+3.4,15.1]],.12,M.vent);
 run([[-22.6,2.35,-20.2],[-22.6,2.35,-16.4],[-20.3,2.35,-16.4]],.09,M.vent);
 root.userData={plan,summary:plan.summary};
 root.visible=false;return root;
}

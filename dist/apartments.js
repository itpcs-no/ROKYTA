import * as T from 'three';
import {outsideRectangle} from './caretaker-house.js';
import {surface} from './surface-materials.js';

// Apartment guide: list with areas and dimensions, colour-shaded units on the
// floor-plan map (click to select), and a tinted floor in the 3D model.
// Areas are net floor areas measured from the model's walls (assets/apartments.json).
const fmt=v=>v.toLocaleString('sk-SK',{minimumFractionDigits:1,maximumFractionDigits:1});
const FLOOR_NAME=['1. NP','2. NP','3. NP'];
export function buildApartmentGuide(scene,data,$,preloaded=null,groups=[]){
 const state={info:null,grid:[],selected:-1,floor:1,highlight:null};
 const map=$('map'),canvas=document.createElement('canvas');canvas.id='apmap';map.append(canvas);
 const card=document.createElement('div');card.id='apcard';card.hidden=true;map.parentElement.append(card);
 const list=$('apartmentList'),total=$('apartmentTotal');
 const currentFloor=()=>{const n=parseInt($('maptitle').textContent);return Number.isFinite(n)?n-1:1};
 function draw(){
  if(!state.info)return;const g=state.info.grid,f=state.floor,cells=state.grid[f];canvas.width=g.cols;canvas.height=g.rows;
  const ctx=canvas.getContext('2d'),img=ctx.createImageData(g.cols,g.rows),rgb=state.info.apartments.map(a=>[parseInt(a.color.slice(1,3),16),parseInt(a.color.slice(3,5),16),parseInt(a.color.slice(5,7),16)]);
  if(cells)for(let i=0;i<cells.length;i++){const v=cells[i];if(!v)continue;const c=rgb[v-1],sel=v-1===state.selected;img.data.set([c[0],c[1],c[2],sel?235:state.selected>=0?95:165],i*4)}
  ctx.putImageData(img,0,0);
 }
 function unpack(runs,n){const out=new Uint8Array(n);let k=0;for(let i=0;i<runs.length;i+=2){out.fill(runs[i],k,k+runs[i+1]);k+=runs[i+1]}return out}
 function cellsOf(index){const a=state.info.apartments[index],g=state.info.grid,cells=state.grid[a.floor],rows=[];
  for(let r=0;r<g.rows;r++){let start=-1;for(let c=0;c<=g.cols;c++){const on=c<g.cols&&cells[r*g.cols+c]===index+1;if(on&&start<0)start=c;if(!on&&start>=0){rows.push([r,start,c]);start=-1}}}return rows}
 function highlight3d(index){
  if(state.highlight){scene.remove(state.highlight);state.highlight.geometry.dispose();state.highlight=null}
  if(index<0)return;const a=state.info.apartments[index],g=state.info.grid,parts=[];
  for(const [r,c0,c1] of cellsOf(index)){const geo=new T.PlaneGeometry((c1-c0)*g.cell,g.cell);geo.rotateX(-Math.PI/2);geo.translate(g.x0+(c0+c1)/2*g.cell,0,g.z0+(r+.5)*g.cell);parts.push(geo)}
  if(!parts.length)return;
  const merged=mergeGeometries(parts);parts.forEach(p=>p.dispose());
  const mesh=new T.Mesh(merged,new T.MeshBasicMaterial({color:a.color,transparent:true,opacity:.55,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
  mesh.position.y=(data[a.floor]?.base??0)+(a.kind==='caretaker'||a.kind==='office'?0:0)+.045;mesh.renderOrder=5;mesh.name='Zvýraznený apartmán '+a.code;scene.add(mesh);state.highlight=mesh;
 }
 // Every unit gets a visibly tinted floor and a number label on its floor group.
 const tints=[];
 function addFloorTints(){
  state.info.apartments.forEach((a,i)=>{const g=state.info.grid,parts=[];
   for(const [r,c0,c1] of cellsOf(i)){const geo=new T.PlaneGeometry((c1-c0)*g.cell,g.cell);geo.rotateX(-Math.PI/2);geo.translate(g.x0+(c0+c1)/2*g.cell,0,g.z0+(r+.5)*g.cell);parts.push(geo)}
   if(!parts.length)return;const geo=mergeGeometries(parts);parts.forEach(p=>p.dispose());
   const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({color:a.color,roughness:.8,transparent:true,opacity:.62,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
   mesh.position.y=.04;mesh.renderOrder=4;mesh.name='Farebná podlaha '+a.code;mesh.receiveShadow=true;
   const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');
   if(x){x.fillStyle=a.color;x.beginPath();x.roundRect?.(8,8,240,112,26);x.fill();x.lineWidth=8;x.strokeStyle='#ffffff';x.stroke();x.fillStyle='#14202a';x.font='bold 74px system-ui,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(a.kind==='apartment'?a.code:a.code==='S'?'Správca':'Kanc.',128,68)}
   const label=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),depthTest:false,transparent:true}));label.scale.set(1.9,.95,1);label.position.set(a.label[0],1.6,a.label[1]);label.renderOrder=20;label.name='Číslo bytu '+a.code;
   const holder=new T.Group();holder.name='Označenie '+a.code;holder.add(mesh,label);
   (groups[a.floor]||scene).add(holder);if(!groups[a.floor])holder.position.y=data[a.floor]?.base??0;tints.push(holder);
  });
 }
 function showCard(index){
  if(index<0){card.hidden=true;return}
  const a=state.info.apartments[index];
  card.innerHTML=`<button class="apclose" aria-label="Zavrieť">×</button><div class="apswatch" style="background:${a.color}"></div><strong>${a.kind==='apartment'?'Apartmán ':''}${a.code==='S'||a.code==='K'?a.name:a.code}</strong><span>${FLOOR_NAME[a.floor]} · ${a.type}</span>
   <div class="apbig">${fmt(a.area)} m²</div><div class="apdims">vrátane priečok ${fmt(a.gross)} m²</div><div class="apdims">Rozmery ${fmt(a.width)} × ${fmt(a.depth)} m</div>
   <table>${a.rooms.map(r=>`<tr><td>${r.name}</td><td>${fmt(r.area)} m²</td></tr>`).join('')}</table>
   <button class="apwalk">Vstúpiť do apartmánu</button>`;
  card.hidden=false;
  card.querySelector('.apclose').onclick=()=>select(-1);
  card.querySelector('.apwalk').onclick=()=>{const b=a.bbox;$('floor').value=String(a.floor);$('floor').dispatchEvent(new Event('change'));
   const r=map.getBoundingClientRect(),g=state.info.grid,[rr,c0,c1]=cellsOf(index)[Math.floor(cellsOf(index).length/2)];
   walkTo?.(g.x0+(c0+c1)/2*g.cell,g.z0+(rr+.5)*g.cell)};
 }
 let walkTo=null;
 function select(index,{switchFloor=false}={}){
  state.selected=index;
  if(index>=0&&switchFloor){const f=state.info.apartments[index].floor;if(currentFloor()!==f){$('floor').value=String(f);$('floor').dispatchEvent(new Event('change'))}}
  state.floor=currentFloor();draw();highlight3d(index);showCard(index);
  for(const row of list.querySelectorAll('[data-index]'))row.classList.toggle('active',+row.dataset.index===index);
 }
 map.addEventListener('click',e=>{
  if(!state.info)return;e.stopImmediatePropagation();
  const r=map.getBoundingClientRect(),g=state.info.grid,c=Math.floor((e.clientX-r.left)/r.width*g.cols),rr=Math.floor((e.clientY-r.top)/r.height*g.rows);
  const v=state.grid[state.floor]?.[rr*g.cols+c]||0;map.classList.add('showunits');select(v-1);
 },true);
 new MutationObserver(()=>{state.floor=currentFloor();if(state.selected>=0&&state.info.apartments[state.selected].floor!==state.floor){state.selected=-1;showCard(-1);highlight3d(-1)}draw()}).observe($('maptitle'),{childList:true,characterData:true,subtree:true});
 (preloaded?Promise.resolve(preloaded):fetch('assets/apartments.json').then(r=>r.json())).then(info=>{
  state.info=info;const g=info.grid,n=g.cols*g.rows;state.grid=g.floors.map(runs=>unpack(runs,n));state.floor=currentFloor();draw();
  addFloorTints();
  const s=info.summary,care=info.apartments.filter(a=>a.kind!=='apartment');
  total.innerHTML=`<strong>${s.apartments} apartmánov · ${fmt(s.apartmentArea)} m²</strong> užívateľskej (čistej) plochy, ${fmt(s.apartmentGross)} m² vrátane priečok a polovice deliacich stien<br>${[0,1,2].map(f=>`${FLOOR_NAME[f]}: ${s.byFloor[f].count} · ${fmt(s.byFloor[f].area)} m²`).join(' · ')}<br>Byt správcu ${fmt(s.caretakerArea)} m² a kancelária ${fmt(s.officeArea)} m² zvlášť.`;
  list.innerHTML=[0,1,2].map(f=>`<div class="apfloor">${FLOOR_NAME[f]}</div>`+info.apartments.map((a,i)=>({a,i})).filter(({a})=>a.floor===f).map(({a,i})=>
   `<button class="aprow" data-index="${i}"><i style="background:${a.color}"></i><b>${a.kind==='apartment'?a.code:a.name}</b><span>${a.type}</span><span>${fmt(a.width)} × ${fmt(a.depth)} m</span><em>${fmt(a.area)} m²</em></button>`).join('')).join('');
  for(const row of list.querySelectorAll('[data-index]'))row.onclick=()=>{map.classList.add('showunits');select(+row.dataset.index,{switchFloor:true})};
 }).catch(err=>{console.warn('Apartmány sa nenačítali',err);total.textContent='Zoznam apartmánov sa nepodarilo načítať.'});
 return {select,setWalk(fn){walkTo=fn},setTints(on){for(const t of tints)t.visible=on}};
}
function mergeGeometries(list){
 let count=0;for(const g of list)count+=g.attributes.position.count;
 const pos=new Float32Array(count*3),idx=[];let o=0;
 for(const g of list){pos.set(g.attributes.position.array,o*3);for(const i of g.index.array)idx.push(i+o);o+=g.attributes.position.count}
 const m=new T.BufferGeometry();m.setAttribute('position',new T.BufferAttribute(pos,3));m.setIndex(idx);return m;
}

// 3.NP: the former storage cells (kobky) in the stem are now outside, so the
// block becomes studio 3.08 with a new window, shower room and kitchenette.
const rectP=(a,b,c,d)=>[[a,b],[c,b],[c,d],[a,d]];
export function applyStudio308(data){
 const d=data[2];
 for(const m of [{x0:-4.39,x1:.18,z0:-8.94,z1:-4.79},{x0:-4.39,x1:-1.7,z0:-4.95,z1:-1.37}])d.walls=d.walls.flatMap(p=>outsideRectangle(p,m));
 d.doors=d.doors.filter(p=>{const [x,z]=p.hinge;if(Math.abs(x+1.678)<.02&&Math.abs(z+4.6355)<.02){p.name='Apartmán 3.08 · vstup';return true}return !(x>-4.45&&x<.35&&z>-9.2&&z<-1.3)});
 d.walls.push(rectP(-3.23,-9.14,-2.53,-8.94),rectP(-1.92,-9.14,-1.22,-8.94),rectP(-.77,-9.14,-.07,-8.94));
 d.walls.push(rectP(-1.55,-4.93,.18,-4.79));
 // New window in the west facade.
 d.walls=d.walls.flatMap(p=>outsideRectangle(p,{x0:-4.8,x1:-4.35,z0:-8.3,z1:-6.5}));d.windows.push([-4.773,-8.3,.38,1.8]);
 const wall=(axis,f,a,b,gaps=[],t=.12)=>{let start=a;for(const [lo,hi] of [...gaps,[b,b]]){if(lo>start)d.walls.push(axis==='x'?rectP(start,f-t/2,lo,f+t/2):rectP(f-t/2,start,f+t/2,lo));start=hi}};
 wall('x',-3.65,-4.39,-2.45,[[-3.3,-2.62]]);wall('z',-2.45,-3.65,-1.37);
 d.doors.push({name:'Apartmán 3.08 · kúpeľňa',hinge:[-3.28,-3.65],closed:[-2.64,-3.65],open:[-3.28,-4.29],width:.64,height:2.1});
}
export function buildStudio308(){
 const g=new T.Group();g.name='Apartmán 3.08 (bývalé kobky)';const y=0;
 const white=new T.MeshStandardMaterial({color:0xf2f1ec,roughness:.3}),fabric=new T.MeshStandardMaterial({color:0x5e6f73,roughness:.95}),wood=surface('wood');
 const box=(name,x,yy,z,sx,sy,sz,m)=>{const o=new T.Mesh(new T.BoxGeometry(sx,sy,sz),m);o.position.set(x,y+yy,z);o.name=name;o.castShadow=true;o.receiveShadow=true;g.add(o)};
 box('Posteľ',-3.3,.25,-8.0,1.6,.5,2.0,white);box('Prikrývka',-3.3,.53,-7.85,1.6,.06,1.6,fabric);
 box('Pohovka',-.4,.4,-6.4,.8,.8,1.8,fabric);box('Stolík',-1.4,.38,-6.4,.6,.06,.9,wood);
 box('Kuchynská linka',-2.02,.45,-2.6,.6,.9,2.0,white);box('Pracovná doska',-2.02,.92,-2.6,.62,.04,2.0,wood);
 box('Jedálenský stolík',-3.4,.74,-4.4,.8,.05,.8,wood);
 box('Sprcha',-4.0,.03,-2.0,.8,.06,.8,white);box('WC',-3.0,.26,-1.75,.42,.52,.6,white);box('Umývadlo',-4.1,.85,-3.2,.45,.12,.36,white);
 return g;
}
// Mark the entrance door of every unit (from apartments.json) in the plan data.
export function markApartmentEntrances(data,info){
 for(const e of info.entrances||[]){const list=data[e.floor]?.doors||[];
  const d=list.find(p=>Math.hypot(p.hinge[0]-e.hinge[0],p.hinge[1]-e.hinge[1])<.03&&Math.hypot(p.closed[0]-e.closed[0],p.closed[1]-e.closed[1])<.03);
  if(d)d.entrance=e.code}
}

import * as T from 'three';

// Apartment guide: list with areas and dimensions, colour-shaded units on the
// floor-plan map (click to select), and a tinted floor in the 3D model.
// Areas are net floor areas measured from the model's walls (assets/apartments.json).
const fmt=v=>v.toLocaleString('sk-SK',{minimumFractionDigits:1,maximumFractionDigits:1});
const FLOOR_NAME=['1. NP','2. NP','3. NP'];
export function buildApartmentGuide(scene,data,$){
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
 function showCard(index){
  if(index<0){card.hidden=true;return}
  const a=state.info.apartments[index];
  card.innerHTML=`<button class="apclose" aria-label="Zavrieť">×</button><div class="apswatch" style="background:${a.color}"></div><strong>${a.kind==='apartment'?'Apartmán ':''}${a.code==='S'||a.code==='K'?a.name:a.code}</strong><span>${FLOOR_NAME[a.floor]} · ${a.type}</span>
   <div class="apbig">${fmt(a.area)} m²</div><div class="apdims">Rozmery ${fmt(a.width)} × ${fmt(a.depth)} m</div>
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
 fetch('assets/apartments.json').then(r=>r.json()).then(info=>{
  state.info=info;const g=info.grid,n=g.cols*g.rows;state.grid=g.floors.map(runs=>unpack(runs,n));state.floor=currentFloor();draw();
  const s=info.summary,care=info.apartments.filter(a=>a.kind!=='apartment');
  total.innerHTML=`<strong>${s.apartments} apartmánov · ${fmt(s.apartmentArea)} m²</strong> užívateľskej plochy<br>${[0,1,2].map(f=>`${FLOOR_NAME[f]}: ${s.byFloor[f].count} · ${fmt(s.byFloor[f].area)} m²`).join(' · ')}<br>Byt správcu ${fmt(s.caretakerArea)} m² a kancelária ${fmt(s.officeArea)} m² zvlášť.`;
  list.innerHTML=[0,1,2].map(f=>`<div class="apfloor">${FLOOR_NAME[f]}</div>`+info.apartments.map((a,i)=>({a,i})).filter(({a})=>a.floor===f).map(({a,i})=>
   `<button class="aprow" data-index="${i}"><i style="background:${a.color}"></i><b>${a.kind==='apartment'?a.code:a.name}</b><span>${a.type}</span><span>${fmt(a.width)} × ${fmt(a.depth)} m</span><em>${fmt(a.area)} m²</em></button>`).join('')).join('');
  for(const row of list.querySelectorAll('[data-index]'))row.onclick=()=>{map.classList.add('showunits');select(+row.dataset.index,{switchFloor:true})};
 }).catch(err=>{console.warn('Apartmány sa nenačítali',err);total.textContent='Zoznam apartmánov sa nepodarilo načítať.'});
 return {select,setWalk(fn){walkTo=fn}};
}
function mergeGeometries(list){
 let count=0;for(const g of list)count+=g.attributes.position.count;
 const pos=new Float32Array(count*3),idx=[];let o=0;
 for(const g of list){pos.set(g.attributes.position.array,o*3);for(const i of g.index.array)idx.push(i+o);o+=g.attributes.position.count}
 const m=new T.BufferGeometry();m.setAttribute('position',new T.BufferAttribute(pos,3));m.setIndex(idx);return m;
}

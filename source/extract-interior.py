"""Extract wall fills and swing-door geometry from user-supplied vector PDFs.
Run from workspace root. Scale: 1:100 (28.3464567 PDF points/metre).
Origins follow common building reference points; door arcs supply leaf width and swing.
"""
import fitz,json,math
from pathlib import Path
S=28.3464567
origins=[(91.4,181.4),(75.3,104.0),(107.8,138.0),(56.1,180.9)]
levels=[]
for n,(ox,oy) in enumerate(origins,1):
 p=fitz.open(next(Path('upload').glob(f'0{n}_*.pdf')))[0]
 ds=[d for d in p.get_drawings() if d['layer']=='Konstrukce - svislé nosné' and d['rect'].x1<1740]
 fills=[d for d in ds if d['fill']]
 def world(p):return [round((p[0]-ox)/S-28.825,5),round((p[1]-oy)/S-23,5)]
 def distance(pt,r):return math.hypot(max(r.x0-pt.x,0,pt.x-r.x1),max(r.y0-pt.y,0,pt.y-r.y1))
 walls=[];windows=[];doors=[];seen=set()
 lines={}
 for w in p.get_text('words'):
  key=(w[5],w[6]);lines.setdefault(key,[]).append(w)
 heights=[]
 for ws in lines.values():
  txt=''.join(w[4] for w in sorted(ws,key=lambda w:w[7])).replace(' ','')
  if txt in ['1970','2000','2100','2250','2300','2500','2950','2960']:
   heights.append((sum((w[0]+w[2])/2 for w in ws)/len(ws),sum((w[1]+w[3])/2 for w in ws)/len(ws),int(txt)/1000))
 for d in ds:
  for item in d['items']:
   if item[0]!='c':continue
   a,c1,c2,b=item[1:];dx=abs(a.x-b.x);dy=abs(a.y-b.y)
   if abs(dx-dy)>.2 or not 14<dx<45:continue
   # A quarter-circle Bezier, with orthogonal tangents, is the door swing symbol.
   if min(abs(c1.x-a.x),abs(c1.y-a.y))>.1:continue
   hinge=fitz.Point(a.x,b.y) if abs(c1.y-a.y)<.1 else fitz.Point(b.x,a.y)
   score=lambda pt:min((distance(pt,e['rect']) for e in fills if min(e['rect'].width,e['rect'].height)>1.9),default=999)
   sa,sb=score(a),score(b)
   if min(sa,sb)>4:continue
   closed,opened=(a,b) if sa<=sb else (b,a)
   key=tuple(round(v,1) for pt in [hinge,closed] for v in pt)
   if key in seen:continue
   seen.add(key);mid=(hinge+closed)*.5
   nearest=min(heights,key=lambda h:math.hypot(h[0]-mid.x,h[1]-mid.y),default=None)
   exact=nearest is not None and math.hypot(nearest[0]-mid.x,nearest[1]-mid.y)<30
   doors.append({'hinge':world(hinge),'closed':world(closed),'open':world(opened),'width':round(dx/S,4),'height':nearest[2] if exact else 1.97,'heightFromDimension':exact})
 for d in fills:
  r=d['rect'];thin=min(r.width,r.height);long=max(r.width,r.height)
  # Include the 75 mm partitions omitted by the earlier coarse threshold.
  if thin<1.95 or thin>16 or long<1.95:continue
  pts=[]
  for item in d['items']:
   if item[0]=='l':pts.append(world(item[1]))
   elif item[0]=='re':
    a=item[1];pts.extend(world(v) for v in [(a.x0,a.y0),(a.x1,a.y0),(a.x1,a.y1),(a.x0,a.y1)])
  if len(pts)<3:continue
  inner=[e for e in fills if e is not d and r.contains(e['rect']) and min(e['rect'].width,e['rect'].height)<1.95]
  if len(inner)>=2 and long>15:
   windows.append([*world((r.x0,r.y0)),round(r.width/S,5),round(r.height/S,5)])
  else:walls.append(pts)
 level={'walls':walls,'windows':windows,'doors':doors,'wallHeight':max(2.55,max((d['height'] for d in doors),default=1.97)+.2),'base':[0,2.78,5.56,8.34][n-1]};levels.append(level)
 # Geometry overlay: orange exact wall fills; blue closed door opening, green drawn swing leaf.
 overlay=fitz.open();page=overlay.new_page(width=p.rect.width,height=p.rect.height);page.show_pdf_page(page.rect,p.parent,0)
 def pdf(v):return fitz.Point((v[0]+28.825)*S+ox,(v[1]+23)*S+oy)
 for poly in walls:page.draw_polyline([pdf(v) for v in poly],color=None,fill=(1,.45,0),fill_opacity=.4,closePath=True)
 for door in doors:
  page.draw_line(pdf(door['hinge']),pdf(door['closed']),color=(0,.3,1),width=2)
  page.draw_line(pdf(door['hinge']),pdf(door['open']),color=(0,.65,.25),width=1.5)
 page.get_pixmap(matrix=fitz.Matrix(1,1),clip=fitz.Rect(ox,oy,ox+58*S,oy+47*S)).save(f'inspection/interior-check-{n}.png')
 print(n,'walls',len(walls),'doors',len(doors),'dimensioned heights',sum(d['heightFromDimension'] for d in doors))
Path('rokyta/dist/assets/model.json').write_text(json.dumps(levels,separators=(',',':')))

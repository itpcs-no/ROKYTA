"""Furniture traced on supplied plan1-3.png (1583 x 1328), registered 62 x 52 m.
Rectangles retain the drawn footprint. Unfurnished bedroom rectangles receive beds
inside their room; caretaker and former-pool conversions are handled separately.
"""
import json
from pathlib import Path
floors=[[],[],[],[]]
def add(f,t,a,b,c,d,side='n'):
 floors[f].append(dict(type=t,x0=round(a/1583*62-30.825,4),z0=round(b/1328*52-26,4),x1=round(c/1583*62-30.825,4),z1=round(d/1328*52-26,4),side=side,planBox=[a,b,c,d]))
def rows(f,t,rs):
 for r in rs:add(f,t,*r)
# 1NP: duplex living levels, central apartment and its original service rooms.
for shift in (0,202,404):
 for t,r in [('sofa',(921,140,941,205,'w')),('sofa',(941,187,977,206,'s')),('coffee',(947,153,969,173)),('kitchen',(1090,136,1106,238,'e')),('kitchen',(1037,243,1088,258,'s')),('dining',(933,274,994,291)),('wc',(916,301,934,323,'n')),('vanity',(943,300,971,313,'n')),('shower',(916,332,946,348)),('wardrobe',(1034,334,1104,349,'s'))]:
  a,b,c,d,*side=r;add(0,t,a+shift,b,c+shift,d,*side)
rows(0,'sofa',[(768,149,790,221,'w'),(790,147,825,165,'n'),(800,226,835,244,'s')])
rows(0,'coffee',[(812,182,837,208)])
rows(0,'kitchen',[(677,135,692,239,'w'),(704,194,740,210,'s')])
rows(0,'dining',[(812,260,891,279)])
rows(0,'wardrobe',[(726,118,740,187,'e'),(867,321,895,348,'e'),(839,405,886,420,'s'),(678,317,738,330,'n')])
rows(0,'bed',[(699,367,738,388,'e')])
rows(0,'shower',[(752,322,783,346),(795,369,826,398)])
rows(0,'vanity',[(752,373,767,390,'s'),(799,347,812,360,'w')])
rows(0,'wc',[(769,375,786,393,'s'),(804,315,822,335,'n')])
rows(0,'desk',[(678,434,714,450)])
# 2NP west: two residential groups adjoining preserved stair circulation.
rows(1,'bed',[(250,133,298,176,'e'),(91,120,137,173,'n'),(579,120,624,174,'n'),(590,309,635,363,'s')])
rows(1,'wardrobe',[(67,191,155,204,'s'),(192,121,207,202,'e'),(557,216,659,231,'n'),(557,238,659,251,'s')])
rows(1,'sofa',[(315,121,359,139,'n'),(312,140,330,183,'w'),(496,127,546,145,'n'),(530,146,548,184,'e')])
rows(1,'coffee',[(337,148,356,167),(496,156,517,176)])
rows(1,'kitchen',[(337,289,418,304,'s'),(429,202,443,277,'w'),(465,204,483,268,'e')])
rows(1,'dining',[(358,221,376,252),(525,219,542,247)])
rows(1,'bath',[(160,265,177,302),(529,326,548,370)])
rows(1,'vanity',[(205,252,220,297,'e'),(233,246,249,261,'n'),(484,328,499,351,'w')])
rows(1,'wc',[(226,284,244,302,'s'),(528,290,546,307,'n')])
rows(1,'shower',[(492,286,515,307)])
rows(1,'wardrobe',[(143,244,156,302,'w')])
# Three repeated eastern duplex bedroom levels. All three rooms per unit are furnished.
for s in (0,202,404):
 for t,r in [('bed',(919,131,966,177,'w')),('bed',(1050,130,1093,184,'n')),('bed',(934,284,981,337,'s')),('wardrobe',(1009,120,1025,197,'e')),('wardrobe',(1034,214,1103,230,'s')),('wardrobe',(1051,304,1103,320,'s')),('bath',(920,207,956,223)),('vanity',(960,208,975,228)),('vanity',(950,248,974,261)),('wc',(918,240,934,258,'s'))]:
  a,b,c,d,*side=r;add(1,t,a+s,b,c+s,d,*side)
# Central duplex bedrooms, separate studios, and kitchenette apartment.
rows(1,'bed',[(690,132,733,185,'n'),(847,133,889,186,'n'),(679,332,722,374,'w'),(829,326,851,370,'w')])
rows(1,'wardrobe',[(753,322,770,378,'e'),(872,321,899,337,'n'),(823,408,869,422,'s')])
rows(1,'bath',[(881,317-1-43,898,305)])
rows(1,'vanity',[(843,267,875,280),(803,357,824,371)])
rows(1,'wc',[(802,281,819,302,'s'),(778,321,795,340,'n'),(681,597,698,620,'s')])
rows(1,'shower',[(800,320,823,341),(718,598,742,623)])
rows(1,'sofa',[(682,443,750,461,'n')]);rows(1,'coffee',[(700,469,723,492)])
rows(1,'kitchen',[(816,442,830,524,'e')]);rows(1,'dining',[(770,496,786,522)])
rows(1,'wardrobe',[(716,584,746,599,'n')]);rows(1,'vanity',[(699,572,712,591,'e')])
# 2NP south wing, four apartments.
rows(1,'bed',[(620,645,662,692,'n'),(621,882,666,931,'n'),(882,951,906,1002,'n'),(982,1001,1024,1049,'s'),(974,757,1024,810,'s')])
rows(1,'wardrobe',[(605,642,622,686,'w'),(705,714,762,731,'s'),(766,644,785,713,'w'),(810,644,826,713,'e'),(600,945,615,969,'w'),(615,972,684,988,'s'),(836,949,874,965,'n'),(950,949,989,965,'n'),(911,753,928,822,'w'),(838,750,896,766,'n')])
rows(1,'sofa',[(610,773,684,792,'n'),(608,792,626,822,'w'),(980,649,1043,668,'n'),(1025,668,1043,698,'e'),(917,840,982,859,'n'),(963,859,982,890,'e')])
rows(1,'coffee',[(640,798,662,819),(958,676,980,698),(936,864,958,886)])
rows(1,'kitchen',[(802,783,818,863,'e'),(880,642,965,655,'n'),(880,657,895,708,'w'),(836,838,901,851,'n'),(870,875,885,918,'w')])
rows(1,'dining',[(701,792,720,814),(902,718,924,741),(1008,842,1030,875)])
rows(1,'bath',[(766,974,784,1009)])
rows(1,'shower',[(706,693,729,710),(888,800,907,823),(774,913,795,934)])
rows(1,'vanity',[(746,643,758,661),(836,807,858,820),(748,912,762,932),(749,883,762,902),(810,992,823,1012)])
rows(1,'wc',[(743,664,760,683,'s'),(861,805,879,823,'s'),(777,879,794,898,'n'),(765,944,783,963,'n')])
# 3NP north: west family apartment, central large apartment, east family apartment.
rows(2,'sofa',[(203,147,253,167,'n'),(202,168,220,210,'w'),(204,243,247,261,'n'),(779,152,841,172,'n'),(822,173,841,255,'e'),(1321,149,1370,168,'n'),(1353,170,1372,208,'e'),(1328,244,1371,263,'n')])
rows(2,'coffee',[(224,178,244,198),(769,196,791,217),(1300,171,1322,193)])
rows(2,'kitchen',[(193,264,209,324,'w'),(208,330,270,343,'s'),(657,287,716,299,'s'),(732,250,776,264,'n'),(716,278,732,299,'w'),(1369,266,1385,325,'e'),(1307,331,1369,344,'s')])
rows(2,'dining',[(292,246,307,285),(635,164,652,189),(1264,246,1280,284)])
rows(2,'bed',[(342,151,383,202,'n'),(440,151,480,202,'n'),(523,157,571,202,'w'),(916,157,960,209,'n'),(1081,153,1123,205,'n'),(1180,153,1222,205,'n')])
rows(2,'wardrobe',[(320,234,337,298,'w'),(381,222,409,236,'s'),(419,222,443,236,'s'),(499,232,514,288,'e'),(544,273,580,286,'s'),(523,293,582,307,'s'),(885,149,901,258,'w'),(905,286,998,299,'s'),(1062,235,1078,297,'w'),(1131,222,1158,236,'s'),(1168,222,1187,236,'s'),(1240,234,1254,298,'e')])
rows(2,'bath',[(421,247,440,278),(625,247,644,278),(1139,247,1157,278)])
rows(2,'vanity',[(391,291,411,303),(594,289,614,301),(1167,291,1187,303),(1007,157,1025,173)])
rows(2,'wc',[(390,243,407,262,'n'),(626,278,643,297,'s'),(1171,243,1188,262,'n'),(1035,147,1052,165,'n'),(749,310,766,328,'n')])
rows(2,'shower',[(1029,197,1051,218)]);rows(2,'vanity',[(716,306,736,320)])
rows(2,'wardrobe',[(718,373,776,387,'s'),(845,309,859,387,'e')])
# 3NP south wing, five apartments / studios.
rows(2,'bed',[(613,713,655,761,'s'),(620,884,666,935,'n'),(978,773,1017,821,'s'),(873,1001,915,1050,'w'),(981,1004,1022,1052,'e')])
rows(2,'sofa',[(647,644,664,685,'e'),(610,774,664,793,'n'),(609,794,626,824,'w'),(981,650,1044,668,'n'),(1026,669,1044,699,'e'),(917,840,981,859,'n'),(964,860,982,889,'e')])
rows(2,'coffee',[(620,658,640,678),(640,797,660,819),(958,676,980,698),(936,864,958,886)])
rows(2,'kitchen',[(701,642,715,707,'w'),(763,773,777,869,'e'),(880,642,965,656,'n'),(879,657,894,708,'w'),(836,838,902,851,'n'),(869,872,903,889,'s')])
rows(2,'dining',[(701,792,720,814),(902,718,924,741),(1009,842,1030,875)])
rows(2,'wardrobe',[(657,749,698,763,'s'),(700,744,774,760,'s'),(600,879,615,894,'n'),(753,938,768,994,'e'),(824,686,842,744,'w'),(916,753,931,777,'w'),(605,943,626,963,'w'),(687,1000,701,1054,'e'),(864,978,934,993,'n'),(952,980,966,1054,'e'),(1040,980,1054,1005,'e')])
rows(2,'bath',[(722,670,739,705),(869,753,908,770),(842,994,857,1036),(707,1040,742,1055)])
rows(2,'shower',[(756,643,774,664),(760,997,779,1017),(825,1040,852,1056)])
rows(2,'vanity',[(758,669,773,690),(836,807,855,819),(755,1035,772,1053),(790,1037,807,1054)])
rows(2,'wc',[(721,641,738,660,'n'),(886,806,902,824,'s'),(727,1008,744,1027,'n'),(792,1000,809,1019,'n')])
Path('rokyta/dist/assets/furniture-layout.json').write_text(json.dumps({'source':'Supplied proposed floor plans, registered to model; furniture footprints traced in plan image coordinates','floors':floors},ensure_ascii=False,separators=(',',':')))
print('Furniture records per floor:',[len(f) for f in floors])
# Additional enclosed bedrooms shown without a bed symbol.
rows(1,'bed',[(75,250,123,298,'s'),(612,1018,666,1054,'w')])
rows(2,'bed',[(613,1006,667,1047,'w')])
# Reconcile raster-traced edges with precise vector wall fills (at most 0.3 m).
# Keep original planBox for audit; never relocate an item to a different room.
model=json.load(open('rokyta/dist/assets/model.json'))
def area(p):return abs(sum(p[i][0]*p[(i+1)%len(p)][1]-p[(i+1)%len(p)][0]*p[i][1] for i in range(len(p)))/2) if len(p)>2 else 0
def clipped_area(p,r):
 for ax,v,sgn in [(0,r[0],1),(0,r[2],-1),(1,r[1],1),(1,r[3],-1)]:
  q=[]
  for i,a in enumerate(p):
   b=p[(i+1)%len(p)];da=(a[ax]-v)*sgn;db=(b[ax]-v)*sgn
   if da>=0:q.append(a)
   if (da>=0)!=(db>=0):
    t=da/(da-db);q.append([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])])
  p=q
 return area(p)
def intersects_segment(r,a,b,pad=.12):
 # Slab test against the expanded furniture footprint.
 r=[r[0]-pad,r[1]-pad,r[2]+pad,r[3]+pad];lo,hi=0.,1.
 for k in (0,1):
  delta=b[k]-a[k]
  if abs(delta)<1e-9:
   if not r[k]<=a[k]<=r[k+2]:return False
  else:
   u,v=sorted(((r[k]-a[k])/delta,(r[k+2]-a[k])/delta));lo=max(lo,u);hi=min(hi,v)
   if lo>hi:return False
 return True
corrections=[];unresolved=[]
for f,rs in enumerate(floors):
 walls=[(p,[min(v[0] for v in p),min(v[1] for v in p),max(v[0] for v in p),max(v[1] for v in p)]) for p in model[f]['walls']]
 for i,r in enumerate(rs):
  base=[r['x0'],r['z0'],r['x1'],r['z1']]
  near=[p for p,b in walls if b[2]>base[0]-.5 and b[0]<base[2]+.5 and b[3]>base[1]-.5 and b[1]<base[3]+.5]
  ds=[d for d in model[f]['doors'] if math.hypot(d['hinge'][0]-(base[0]+base[2])/2,d['hinge'][1]-(base[1]+base[3])/2)<max(base[2]-base[0],base[3]-base[1])+2] if False else model[f]['doors']
  def score(b):
   solid=[b[0]+.035,b[1]+.035,b[2]-.035,b[3]-.035]
   walls=sum(clipped_area(p,solid) for p in near)
   doors=sum(intersects_segment(solid,d['hinge'],d[end]) for d in ds for end in ['open','closed'])
   return walls,doors
  orig=score(base)
  if orig[0]<.0005 and not orig[1]:continue
  candidates=[]
  for inset in (0,.04,.08):
   for dx in (0,-.08,.08,-.16,.16,-.24,.24,-.30,.30):
    for dz in (0,-.08,.08,-.16,.16,-.24,.24,-.30,.30):
     b=[base[0]+dx+inset,base[1]+dz+inset,base[2]+dx-inset,base[3]+dz-inset]
     if min(b[2]-b[0],b[3]-b[1])<.32:continue
     w,d=score(b);cost=w*1000+d*100+abs(dx)+abs(dz)+inset*4
     candidates.append((cost,b,w,d))
  cost,b,w,d=min(candidates)
  for k,v in zip(['x0','z0','x1','z1'],b):r[k]=round(v,4)
  corrections.append([f,i,r['type'],orig,[round(w,4),d]])
  if w>.003 or d:unresolved.append([f,i,r['type'],r['planBox'],round(w,4),d])
print('Adjusted:',len(corrections),'Unresolved:',unresolved)
Path('rokyta/dist/assets/furniture-layout.json').write_text(json.dumps({'source':'Supplied proposed floor plans; vector wall/door clearances reconciled with raster-traced footprints','floors':floors},ensure_ascii=False,separators=(',',':')))
# Add chairs around the traced dining tables only when their footprint clears the
# vector walls, both door positions, and other furniture. Back faces away from table.
for f,rs in enumerate(floors):
 for table in list(rs):
  if table['type']!='dining':continue
  x=(table['x0']+table['x1'])/2;z=(table['z0']+table['z1'])/2;w=table['x1']-table['x0'];d=table['z1']-table['z0'];long=max(w,d);n=max(2,min(4,int(long/.55)))
  for i in range(n):
   along=(i-(n-1)/2)*min(.62,(long-.3)/max(1,n-1))
   for sign in [-1,1]:
    xx=x+along if w>=d else x+sign*(w/2+.28);zz=z+sign*(d/2+.28) if w>=d else z+along
    r=[xx-.22,zz-.22,xx+.22,zz+.22]
    if any(clipped_area(p,r)>.0005 for p in model[f]['walls']):continue
    if any(intersects_segment(r,a['hinge'],a[end],.1) for a in model[f]['doors'] for end in ['open','closed']):continue
    if any(min(r[2],a['x1'])>max(r[0],a['x0'])+.005 and min(r[3],a['z1'])>max(r[1],a['z0'])+.005 for a in rs):continue
    side=('n' if sign<0 else 's') if w>=d else ('w' if sign<0 else 'e')
    rs.append(dict(type='chair',x0=round(r[0],4),z0=round(r[1],4),x1=round(r[2],4),z1=round(r[3],4),side=side,planBox=None))
Path('rokyta/dist/assets/furniture-layout.json').write_text(json.dumps({'source':'Supplied proposed floor plans; wall and door clearances reconciled; original planBox retained','floors':floors},ensure_ascii=False,separators=(',',':')))
print('Final records:',[len(f) for f in floors])

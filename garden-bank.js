import * as T from 'three';
import {surface} from './surface-materials.js';
import {gardenBank as p,gardenBankRows,gardenBankWidth,gardenBankHeight,gardenBankBase} from './garden-bank-layout.js';

export function buildGardenBank(roadLevel){
 const points=[],indices=[],columns=29;
 for(const z of gardenBankRows){const width=gardenBankWidth(z);
  for(let i=0;i<columns;i++){
   const u=i/(columns-1),x=p.edgeX+width*u;
   // At the tip the cross-section closes to a single vertical edge beside
   // the existing end wall; no triangular retaining face closes the apron.
   const y=width<1e-8?p.top+(gardenBankBase(x,z,roadLevel)-p.top)*u:gardenBankHeight(x,z,roadLevel);
   points.push(x,y,z);
  }
 }
 for(let row=1;row<gardenBankRows.length;row++)for(let col=0;col<columns-1;col++){
  const a=(row-1)*columns+col,b=a+1,c=row*columns+col,d=c+1;indices.push(a,c,b,b,c,d);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.userData.uvProjection='xz';
 const bank=new T.Mesh(geometry,surface('grass'));bank.name='Trávnatý svah namiesto bočného múru';bank.castShadow=true;bank.receiveShadow=true;
 return bank;
}

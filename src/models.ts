import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FighterDef } from './data';
export const mat=(color:string|number,metal=.45,rough=.4)=>new T.MeshStandardMaterial({color,metalness:metal,roughness:rough});
const dark=mat('#20262d',.8), white=mat('#e2e3de',.2), chrome=mat('#7d8c95',.85,.25);
const glow=(c:string)=>new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:2});
export function mesh(g:T.BufferGeometry,m:T.Material,p:T.Object3D,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
export function box(p:T.Object3D,w:number,h:number,d:number,m:T.Material,x=0,y=0,z=0,r=.08){return mesh(new RoundedBoxGeometry(w,h,d,2,r),m,p,x,y,z);}
export function ball(p:T.Object3D,r:number,m:T.Material,x=0,y=0,z=0,s=[1,1,1]){const o=mesh(new T.SphereGeometry(r,24,16),m,p,x,y,z);o.scale.set(...s as [number,number,number]);return o;}
export function cyl(p:T.Object3D,r:number,h:number,m:T.Material,x=0,y=0,z=0){return mesh(new T.CylinderGeometry(r,r,h,16),m,p,x,y,z);}
export interface Robot {root:T.Group;body:T.Group;head:T.Group;arms:T.Group[];legs:T.Group[];eyes:T.Mesh[];rollers:T.Group;}
export function robot(def:FighterDef):Robot{
 const root=new T.Group(),body=new T.Group(),head=new T.Group(),rollers=new T.Group();root.add(body);body.add(head,rollers);
 const arms:T.Group[]=[],legs:T.Group[]=[],eyes:T.Mesh[]=[];const color=mat(def.color,.45,.33),black=mat('#0b1118',.6,.18);
 const limb=(x:number,y:number,len:number,thick:number,isArm:boolean,m:T.Material)=>{const g=new T.Group();g.position.set(x,y,0);body.add(g);ball(g,thick*1.15,chrome);cyl(g,thick*.52,len*.8,dark,0,-len*.45);box(g,thick*1.6,len*.45,thick*1.8,m,0,-len*.35);ball(g,thick,chrome,0,-len*.6);box(g,thick*1.7,len*.38,thick*1.8,m,0,-len*.83);if(isArm){ball(g,thick*1.25,m,0,-len);for(let j=0;j<3;j++)cyl(g,thick*.2,thick*1.4,dark,(j-1)*thick*.65,-len-thick*.8,.08);}else box(g,thick*2.3,thick*.8,thick*3.5,dark,0,-len,.13);(isArm?arms:legs).push(g);return g;};
 if(def.id==='voxxy'){
  ball(body,.53,color,0,1.05,0,[.82,1.25,.72]);box(body,.56,.64,.13,color,0,1.04,.4,.12);cyl(body,.13,.25,dark,0,1.63);
  head.position.y=1.95;ball(head,.64,color,0,0,0,[1.15,.78,.82]);ball(head,.49,black,0,.015,.32,[1.24,.75,.47]);
  for(const s of [-1,1]){ball(head,.14,color,s*.43,.43,0);const ear=cyl(head,.22,.12,white,s*.68,0);ear.rotation.z=Math.PI/2;ball(head,.09,glow('#ffab48'),s*.23,0,.55,[1,.55,.5]);limb(s*.43,1.45,1.1,.14,true,color);limb(s*.22,.48,.34,.1,false,color);}
  box(body,.18,.15,.025,white,0,1.35,.39);
 }else if(def.id==='droid'){
  box(body,.77,.77,.48,mat('#4e5b66'),0,1.99,0,.16);cyl(body,.17,.32,dark,0,1.48);ball(body,.3,chrome,0,1.24,0,[1,.65,.7]);
  for(const s of [-1,1]){limb(s*.52,2.3,1.32,.14,true,mat('#4e5b66'));limb(s*.24,1.2,1.12,.13,false,mat('#4e5b66'));cyl(body,.06,.57,chrome,s*.19,1.62,.17);}
  head.position.y=2.8;ball(head,.32,mat('#4e5b66'),0,0,0,[.95,1.12,.9]);box(head,.4,.18,.18,dark,0,-.19,.14);for(const s of [-1,1])eyes.push(ball(head,.055,glow('#ffdda0'),s*.14,0,.285));
  for(let i=0;i<4;i++)box(body,.17,.035,.02,chrome,.16,2.15-i*.08,.25);
 }else if(def.id==='biggy'){
  const armor=mat('#4b616e',.8,.57),belly=mat('#b9693a',.68,.6);
  ball(body,1.19,armor,0,1.59,0,[1,1.05,.88]);ball(body,.95,belly,0,1.49,.57,[1,1,.55]);head.position.y=2.73;ball(head,.86,armor,0,0,-.02,[1,.5,.9]);box(head,1.38,.13,.3,dark,0,-.17,.64,.03);
  for(const s of [-1,1]){ball(head,.095,chrome,s*.36,.12,.69);ball(head,.036,black,s*.36,.12,.77);limb(s*1.03,2.05,1.37,.23,true,armor);limb(s*.52,.51,.37,.22,false,armor);}
  cyl(head,.018,.7,chrome,.6,.55,0);ball(head,.045,glow('#fd9f47'),.6,.92,0);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;ball(body,.042,chrome,Math.cos(a)*.95,1.5+Math.sin(a)*.94,.86);}
  box(body,.035,1.55,.03,armor,0,1.5,1.08,.01);
 }else if(def.id==='richie'){
  cyl(body,.43,.33,white,0,.18);ball(body,.43,white,0,.33,0,[1,.6,1]);cyl(body,.15,.22,dark,0,.56);
  head.position.y=.88;ball(head,.48,white,0,0,0,[1.2,.72,.87]);
  for(const s of [-1,1]){ball(head,.187,dark,s*.245,.035,.32,[1,1,.55]);ball(head,.135,chrome,s*.245,.035,.395,[1,1,.25]);ball(head,.1,black,s*.245,.035,.423,[1,1,.25]);ball(head,.026,white,s*.22,.069,.45);const ant=cyl(head,.024,.35,white,s*.39,.38,-.08);ant.rotation.z=-s*.24;ball(head,.065,color,s*.43,.55,-.08);}
 }else{
  const pink=mat('#ed7735',.4,.4);box(body,.47,.37,.36,white,0,.55,0,.1);cyl(body,.095,.21,dark,0,.81);head.position.y=1.04;box(head,.59,.34,.43,white,0,0,.02,.09);box(head,.48,.065,.35,pink,0,-.12,.34,.02);ball(head,.145,dark,0,.005,.24,[1,1,.3]);ball(head,.09,pink,0,.005,.283,[1,1,.25]);ball(head,.055,black,0,.005,.305,[1,1,.2]);
  for(const s of [-1,1]){ball(head,.025,black,s*.21,.015,.24);limb(s*.24,.53,.39,.07,false,white);const wheel=cyl(rollers,.08,.11,mat('#e8bd45'),s*.25,.09,.13);wheel.rotation.z=Math.PI/2;}
  rollers.visible=false;
 }
 root.userData.id=def.id;return {root,body,head,arms,legs,eyes,rollers};
}
export interface Pose {time:number;speed:number;face:number;attack?:string;attackProgress:number;hurt:number;dead:boolean;block:boolean;crouch:boolean;air:boolean;overclock:boolean;roller:boolean;}
export function animateRobot(r:Robot,p:Pose){
 const id=r.root.userData.id,walk=Math.sin(p.time*(id==='biggy'?8:15))*Math.min(Math.abs(p.speed)/5,1),hit=Math.sin(Math.min(1,p.attackProgress)*Math.PI);
 r.root.rotation.y=T.MathUtils.lerp(r.root.rotation.y,p.face>0?.67:-.67,.18);
 r.body.position.y=p.dead?.12:Math.sin(p.time*2.7)*.018;
 r.body.rotation.z=T.MathUtils.lerp(r.body.rotation.z,p.dead?-p.face*1.35:p.hurt>0?-p.face*.24:id==='richie'&&p.air?-p.face*.3:walk*.035,.16);
 r.body.scale.y=T.MathUtils.lerp(r.body.scale.y,p.crouch?(id==='richie'?.35:.7):1,.25);
 r.head.rotation.z=id==='richie'?Math.sin(p.time*3)*.09:Math.sin(p.time*1.4)*.025;
 r.head.rotation.x=p.attack&&id==='richie'?hit*.8:0;
 r.arms.forEach((a,i)=>{a.rotation.x=walk*(i===0?1:-1)*.5;a.rotation.z=(i===0?1:-1)*.12;if(p.block)a.rotation.x=-1.15;if(p.attack){a.rotation.x=-hit*(p.attack==='heavy'?2.5:1.7);a.rotation.z=(i===0?1:-1)*hit*.5;}});
 r.legs.forEach((l,i)=>{l.rotation.x=walk*(i===0?1:-1)*.65;if(p.attack&&(p.attack==='low'||id==='microduck')&&i===0)l.rotation.x=-hit*1.7;});
 r.rollers.visible=id==='microduck'&&(p.roller||p.overclock);
 if(id==='microduck'&&Math.abs(p.speed)<.1&&!p.attack&&!p.dead&&Math.sin(p.time*.12)>.98)r.head.rotation.x=.4;
}

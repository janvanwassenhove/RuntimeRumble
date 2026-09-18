import * as T from 'three';
import { ARENAS } from './data';
import { box,ball,cyl,mat } from './models';
export function sign(text:string,w:number,h:number,color='#fc7948',bg='#101520'){
 const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const x=c.getContext('2d')!;x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);x.fillStyle=color;x.textAlign='center';x.textBaseline='middle';x.font=`900 ${Math.min(c.height*.48,1024/(text.length*.62))}px sans-serif`;x.fillText(text,512,c.height/2);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex}));
}
export class ArenaVisual {
 root=new T.Group();panel:T.Mesh;crowd:T.Group[]=[];cart=new T.Group();gate=new T.Group();lights:T.Mesh[]=[];lift:T.Mesh;hazardX=0;
 constructor(public index:number){
 const a=ARENAS[index],floor=mat('#333845',.55,.5),wall=mat('#171d29',.3,.6),steel=mat('#55606a',.8,.32),accent=new T.MeshStandardMaterial({color:a.color,emissive:a.color,emissiveIntensity:.9});
 box(this.root,25,.4,7,floor,0,-.23,0,.05);box(this.root,27,8,.4,wall,0,3.7,-5);
 for(let i=-12;i<=12;i+=2){box(this.root,.025,.01,7,steel,i,-.019,0,0);box(this.root,1.25,.06,.1,accent,i,.015,3.35,.02);}
 for(let i=-12;i<=12;i+=4){box(this.root,.22,8,.22,steel,i,3.8,-4.6);box(this.root,3,.08,.18,accent,i,6.6,-4.3);}
 const banner=sign(index===4?'DEVOXX / AFTER HOURS':'KINEPOLIS  /  DEVOXX',11,1.1,a.color);banner.position.set(0,5.8,-4.6);this.root.add(banner);
 const sub=sign('RUNTIME RUMBLE     •     NO SUPERVISION',8,.4,'#9ba6b8');sub.position.set(0,4.9,-4.58);this.root.add(sub);
 this.hazardX=index===1?9.5:index===2?-4:0;
 this.panel=box(this.root,3,.1,3,mat('#b97828'),this.hazardX,.03,0,.04);this.lift=box(this.root,3,.25,3,steel,this.hazardX,-.2,0);
 for(const z of [-1.55,1.55])for(let i=0;i<10;i++){const b=box(this.root,.18,.06,.14,accent,this.hazardX-1.35+i*.3,.1,z);this.lights.push(b);}
 const label=sign(a.hazard,3,.3,'#ffc46c');label.position.set(this.hazardX,.06,1.9);label.rotation.x=-Math.PI/2;this.root.add(label);
 if(index===0){for(let i=-1;i<=1;i++){const x=i*7;box(this.root,4,2,.4,mat(i%2?'#223d46':'#462928'),x,1.8,-4);box(this.root,4.5,.15,2,steel,x,3,-3.4);box(this.root,3.3,.8,.9,mat('#313846'),x,.4,-3.4);const s=sign(['NULLPOINTER DETECTOR','SHIP IT™','COFFEE AS A SERVICE'][i+1],3.6,.55);s.position.set(x,2.4,-3.72);this.root.add(s);for(let j=0;j<3;j++)cyl(this.root,.08,.2,mat('#e2d5bb'),x+j*.5-.5,.92,-2.99);}}
 if(index===1){for(let i=0;i<13;i++){box(this.root,7,.3,1,mat('#858993'),6,i*.28,-3-i*.55);box(this.root,.07,1,.1,steel,2.6,i*.28+.55,-3-i*.55);}const s=sign('↑  AUDITORIUMS  1—24',5,.7,'#f3f0db');s.position.set(-5,3.1,-4.55);this.root.add(s);for(let i=0;i<7;i++)box(this.root,1.1,.4,5,floor,12.7+i*.9,-.4-i*.4,0);}
 if(index===2){for(let i=-1;i<=1;i++){box(this.root,2.5,3.5,.3,mat('#795746'),i*7,1.75,-4.45);const s=sign(`SALLE ${i+8}`,2.5,.5,'#e3d9bc');s.position.set(i*7,3.9,-4.23);this.root.add(s);}this.gate.position.set(-4,0,-3);this.root.add(this.gate);for(let i=0;i<8;i++){const p=new T.Group();ball(p,.16,mat('#99775e'),0,1.4);box(p,.4,.7,.3,mat(i%2?'#737d9a':'#c07c49'),0,.94);p.position.x=(i%4)*.4;this.gate.add(p);}}
 if(index===3){for(let row=0;row<3;row++)for(let i=-10;i<=10;i+=1.25){box(this.root,.95,.8,.5,mat('#7b3145'),i,.75+row*.5,-2.4-row);box(this.root,.95,.18,.6,mat('#923a51'),i,.33+row*.5,-2.1-row);}const s=sign('PLEASE SILENCE YOUR ROBOTS',10,1.6,'#ede8d6');s.position.set(0,4,-4.6);this.root.add(s);}
 if(index===4){const screen=sign('DEVOXX',12,3.7,'#ff944d','#261925');screen.position.set(0,3.25,-4.4);this.root.add(screen);for(const side of [-1,1]){box(this.root,.35,7,.35,steel,side*9,3,-3);for(let i=0;i<6;i++){const l=box(this.root,.55,.2,.4,accent,side*9,i+1,-2.7);l.rotation.z=side*.2;}}}
 if(index===5){for(const side of [-1,1]){box(this.root,6,.16,1.4,steel,side*5,1.3,-3.6);for(let i=0;i<3;i++){const s=sign(['> TEST PASSED','> ROBOTS: AWAKE','> SUPERVISION: 0'][i],1.7,.9,'#76e4b7');s.position.set(side*5+i*1.8-1.8,2.1,-3.8);this.root.add(s);}}}
 // Shared movable physical prop, rendered here and simulated by Rapier in Game.
 box(this.cart,1.1,.12,.8,steel,0,.7);for(const x of [-.46,.46]){cyl(this.cart,.04,.75,steel,x,.4);for(const z of [-.3,.3])ball(this.cart,.13,mat('#181b20'),x,.13,z);}if(index===4){box(this.cart,1.5,1.1,.15,mat('#111822'),0,1.35);const s=sign('LIVE DEMO',1.4,.7);s.position.set(0,1.4,.09);this.cart.add(s);}else for(let i=0;i<3;i++)cyl(this.cart,.095,.25,mat('#e6d8b4'),(i-1)*.27,.88,0);this.root.add(this.cart);
 if(index!==3)for(let i=0;i<17;i++){const p=new T.Group(),x=-11+i*1.4;ball(p,.16,mat('#ac8169'),0,1.5);box(p,.36,.65,.3,mat(['#273749','#444764','#655944'][i%3]),0,1.02);for(const side of [-1,1])box(p,.12,.65,.13,mat('#161d27'),side*.1,.42);p.position.set(x,0,-2.9-Math.sin(i)*.4);this.crowd.push(p);this.root.add(p);}
 }
 update(time:number,state:string){const warning=state==='warning'||state==='armed',active=state==='active';this.lights.forEach(l=>l.visible=active||warning&&Math.sin(time*16)>0);(this.panel.material as T.MeshStandardMaterial).color.set(active?'#ff5522':warning?'#ffc75e':'#625238');this.panel.rotation.z=active&&this.index===0?-.4:0;this.lift.position.y=this.index===4&&active?.75:-.2;this.panel.position.y=this.index===4&&active?1:.03;this.crowd.forEach((p,i)=>{p.rotation.z=Math.sin(time*2+i)*.03;p.position.y=active?Math.abs(Math.sin(time*6+i))*.12:0;});if(this.index===2){this.gate.position.z=active?Math.min(2,-3+(time%1)*6):-3;this.gate.visible=warning||active;}}
 dispose(){this.root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();const m=o.material;if(m instanceof T.MeshBasicMaterial&&m.map)m.map.dispose();}});}
}

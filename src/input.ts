import { Controls, neutral } from './data';
export class Input {
 keys=new Set<string>();touch=new Set<string>();lastActivity=performance.now();paused:()=>void=()=>{};start:()=>void=()=>{};padPrevious:boolean[][]=[];menu: (direction:number,activate:boolean)=>void=()=>{};menuClock=0;
 constructor(){
  window.addEventListener('keydown',e=>{if((e.target as HTMLElement).matches('input,select,textarea'))return;this.lastActivity=performance.now();if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code)&&document.activeElement===document.body)e.preventDefault();this.keys.add(e.code);if(!e.repeat&&e.code==='Escape')this.paused();if(!e.repeat&&e.code==='Enter')this.start();});
  window.addEventListener('keyup',e=>this.keys.delete(e.code));window.addEventListener('blur',()=>this.clear());window.addEventListener('pointerdown',()=>this.lastActivity=performance.now());
 }
 clear(){this.keys.clear();this.touch.clear();}
 read(player:number,versus:boolean):Controls{
  const c=neutral(),k=this.keys,t=this.touch,yes=(code:string,action:string)=>k.has(code)||(player===0&&t.has(action));
  if(player===0){c.move=+yes('KeyD','right')-+yes('KeyA','left');c.jump=yes('KeyW','jump');c.crouch=yes('KeyS','crouch');c.block=yes('Space','block');c.light=yes('KeyJ','light');c.heavy=yes('KeyK','heavy');c.special=yes('KeyL','special');c.secondary=yes('KeyI','secondary');c.grab=yes('KeyU','grab');c.overclock=yes('KeyO','overclock');}
  else{c.move=+k.has('ArrowRight')-+k.has('ArrowLeft');c.jump=k.has('ArrowUp');c.crouch=k.has('ArrowDown');c.block=k.has('ShiftRight');c.light=k.has('Numpad1')||k.has('Digit1');c.heavy=k.has('Numpad2')||k.has('Digit2');c.special=k.has('Numpad3')||k.has('Digit3');c.grab=k.has('Numpad0')||k.has('Digit0');c.secondary=k.has('Numpad4')||k.has('Digit4');c.overclock=k.has('Numpad5')||k.has('Digit5');}
  const pads=Array.from(navigator.getGamepads?.()||[]).filter(Boolean) as Gamepad[];
  // One pad in versus belongs to P2, allowing keyboard + controller without setup.
  const pad=versus?(pads.length===1?(player===1?pads[0]:undefined):pads[player]):pads[player];
  if(pad){const b=(i:number)=>!!pad.buttons[i]?.pressed;let axis=pad.axes[0]||0;if(Math.abs(axis)<.2)axis=0;c.move=c.move||axis||(+b(15)-+b(14));c.crouch||=b(13);c.jump||=b(3)||b(12);c.light||=b(0);c.heavy||=b(1);c.special||=b(2);c.block||=b(4);c.grab||=b(5);c.secondary||=b(6);c.overclock||=b(7);if(Object.values(c).some(Boolean))this.lastActivity=performance.now();}
  return c;
 }
 pollMenus(){const pads=Array.from(navigator.getGamepads?.()||[]);pads.forEach((p,i)=>{if(!p)return;const prev=this.padPrevious[i]||[];if(p.buttons[9]?.pressed&&!prev[9]){this.lastActivity=performance.now();this.start();}const dir=p.buttons[13]?.pressed||p.buttons[15]?.pressed||p.axes[0]>.6||p.axes[1]>.6?1:p.buttons[12]?.pressed||p.buttons[14]?.pressed||p.axes[0]<-.6||p.axes[1]<-.6?-1:0;if(dir&&performance.now()-this.menuClock>220){this.menuClock=performance.now();this.menu(dir,false);}if(p.buttons[0]?.pressed&&!prev[0])this.menu(0,true);this.padPrevious[i]=p.buttons.map(b=>b.pressed);});}
}

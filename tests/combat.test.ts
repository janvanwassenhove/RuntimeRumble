import { describe,it,expect } from 'vitest';
import { ATTACKS,FIGHTERS,hazardPhase,knockback,matchup } from '../src/data';
describe('combat invariants',()=>{
 it('tiny fighters take much more knockback',()=>{expect(knockback(12,1,.48)).toBeGreaterThan(knockback(12,1,4.6)*3);});
 it('bracing absorbs three quarters of an impulse',()=>{expect(knockback(12,1,4,true)).toBe(knockback(12,1,4)*.25);});
 it('all attacks have punishable startup and recovery',()=>{for(const a of Object.values(ATTACKS)){expect(a.startup).toBeGreaterThan(0);expect(a.active).toBeGreaterThan(1/60);expect(a.recovery).toBeGreaterThan(.1);}});
 it('keeps distinct masses and scales',()=>{expect(new Set(FIGHTERS.map(f=>f.mass)).size).toBe(5);expect(FIGHTERS.find(f=>f.id==='biggy')!.height).toBeGreaterThan(FIGHTERS.find(f=>f.id==='microduck')!.height*2);});
 it.each([false,true])('telegraphs every hazard before activation (fast=%s)',fast=>{let previous='cooldown';let activations=0;for(let t=0;t<30;t+=.01){const state=hazardPhase(t,fast);if(state==='active'&&previous!=='active'){expect(previous).toBe('armed');activations++;}previous=state;}expect(activations).toBeGreaterThan(1);});
 it('recognises Pollen family disputes',()=>{expect(matchup('richie','microduck')).toBe('POLLEN FAMILY DISPUTE');expect(matchup('microduck','richie')).toBe('POLLEN FAMILY DISPUTE');});
});

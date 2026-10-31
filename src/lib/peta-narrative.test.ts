import {describe,expect,it} from 'vitest';
import {petaNarrative} from './peta-narrative';
import {petaSyntheticReport} from '@/test/fixtures/peta';

const result=(nets:number[])=>({...petaSyntheticReport.result,rows:petaSyntheticReport.result.rows.map((row,index)=>({...row,net:nets[index]}))});
describe('PETA reflective narrative, not a competence rating',()=>{
 it('describes the actual highest net dimension without changing scores',()=>{
  const before=JSON.stringify(petaSyntheticReport);expect(petaNarrative(petaSyntheticReport.result)).toContain('mengambil keputusan dan menggerakkan pekerjaan menuju hasil');
  expect(JSON.stringify(petaSyntheticReport)).toBe(before);
 });
 it.each([[1,4,-2,-3],[1,-2,4,-3],[1,-2,-3,4]])('uses the actual relative pattern %j',(...nets)=>{
  const value=petaNarrative(result(nets));
  expect(value).toContain(nets[1]===4?'bertukar gagasan':nets[2]===4?'menjaga dukungan':'memperhatikan ketelitian');
 });
 it('acknowledges a tie without forcing one personality type',()=>{
  expect(petaNarrative(result([4,4,-4,-4]))).toContain('selisih pilihan tertinggi yang sama');
  expect(petaNarrative(result([0,0,0,0]))).toContain('Tidak ada satu kecenderungan yang paling menonjol');
 });
 it('acknowledges close scores rather than overstating a dominant type',()=>{
  expect(petaNarrative(result([2,1,-1,-2]))).toContain('Selisih dengan kecenderungan berikutnya tipis');
 });
});

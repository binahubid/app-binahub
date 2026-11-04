import {chromium} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:4330',output='tmp/unslop-public';
const spin=JSON.parse(await readFile('src/test/fixtures/spin-definition.json','utf8'));
const definition={policyId:'local-fixture',consentVersion:'local-fixture',privacyVersion:'local-fixture',notice:'Contoh lokal',privacyNotice:'Informasi privasi contoh lokal.',competencies:[{code:'PE-02',name:'Self-Development',definition:'Contoh lokal'},{code:'PE-04',name:'Adaptability',definition:'Contoh lokal'},{code:'PE-06',name:'Pressure Management',definition:'Contoh lokal'}],selfReportItems:[],sjtItems:[],selfReportScale:[]};
await mkdir(output,{recursive:true});const browser=await chromium.launch({headless:true}),results=[];
try{for(const width of [1440,1024,768,390,320])for(const path of ['/diagnose','/discovery','/insight/individual','/insight/individual/packages']){
 const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'}),errors=[],writes=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>{
  const r=route.request(),u=new URL(r.url());
  if(r.method()!=='GET'){writes.push(r.method());return route.abort();}
  if(u.pathname.includes('/api/'))return route.fulfill({json:u.pathname.includes('/guest')?{success:true,definition}:{success:true,available:true,definition:spin}});
  if(u.origin!==origin)return route.abort();return route.continue();
 });
 await page.goto(origin+path,{waitUntil:'networkidle'});await page.locator('h1').first().waitFor();await page.evaluate(()=>document.fonts.ready);
 assert.deepEqual(errors,[],path);assert.deepEqual(writes,[],path);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${path} overflow ${width}`);
 if(path==='/insight/individual') {assert(await page.getByRole('button',{name:/Mulai diagnosis/}).isDisabled());if(width<640)assert(await page.getByRole('textbox',{name:'Alamat email',exact:true}).evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=16));}
 if(width===1440||width===390)await page.screenshot({path:`${output}/${path.replaceAll('/','_')}-${width}.png`});
 results.push({path,width,errors,writes});await page.close();
}}finally{await browser.close();await writeFile(`${output}/results.json`,JSON.stringify(results,null,2));}
console.log(`${results.length} public route/viewport checks passed; local build, synthetic availability/definitions; no submission or AI/email invoked.`);

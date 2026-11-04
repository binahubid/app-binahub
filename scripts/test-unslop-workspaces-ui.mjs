import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const phase=process.argv[2]||'after', output=`tmp/unslop-workspaces-${phase}`;
await mkdir(output,{recursive:true});
const cases=[['app-program','http://127.0.0.1:4318/unslop.html?route=/admin/programs'],['app-peta','http://127.0.0.1:4318/unslop.html?route=/admin/peta'],['app-sales','http://127.0.0.1:4318/unslop.html?route=/admin/acquisition'],['ams-admin','http://127.0.0.1:4322/'],['ams-associate','http://127.0.0.1:4322/?associate'],['ams-reviewer','http://127.0.0.1:4322/?reviewer']];
const browser=await chromium.launch({headless:true}),results=[];
try { for(const width of [1440,1024,768,390,320]) for(const [name,url] of cases) {
 const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'}),errors=[],writes=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{
  const r=route.request(),u=new URL(r.url());
  if(r.method()!=='GET'){writes.push(r.method());return route.abort();}
  if(u.pathname.startsWith('/api/'))return route.fulfill({json:{success:true,data:u.pathname.endsWith('/count')?{count:0}:[]}});
  if(!['http://127.0.0.1:4318','http://127.0.0.1:4322'].includes(u.origin))return route.abort();
  return route.continue();
 });
 await page.goto(url,{waitUntil:'networkidle'});await page.locator('h1').waitFor({timeout:15000});await page.evaluate(()=>document.fonts.ready);
 const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,unnamed:[...document.querySelectorAll('button')].filter(e=>e.getBoundingClientRect().width&&getComputedStyle(e).visibility!=='hidden'&&!e.textContent.trim()&&!e.getAttribute('aria-label')&&!e.title).map(e=>e.outerHTML.slice(0,150))}));
 if(width===1440||width===390)await page.screenshot({path:`${output}/${name}-${width}.png`});
 if(phase!=='before') {
  assert.deepEqual(errors,[],`${name} JS errors`);assert.equal(metrics.overflow,false,`${name} overflow ${width}`);assert.deepEqual(metrics.unnamed,[],`${name} unnamed buttons`);
  const main=page.locator('main');assert.equal(await main.count(),1);
  if(name.startsWith('app')) {
   const search=page.getByRole('searchbox',{name:'Cari program',exact:true});await search.fill('Kolaborasi');assert.equal(await page.getByRole('cell',{name:'Pengembangan Kepemimpinan',exact:true}).count(),0);
   await page.getByRole('textbox',{name:'Nama program',exact:true}).fill('Draf lokal');
   const font=await search.evaluate(e=>parseFloat(getComputedStyle(e).fontSize));assert(font>=(width<640?16:14));
   assert(await page.locator('th').first().evaluate(e=>getComputedStyle(e).textTransform==='none'&&parseFloat(getComputedStyle(e).fontSize)>=12));
   if(width<1024){const trigger=page.getByRole('button',{name:'Buka navigasi admin',exact:true});await trigger.click();await page.getByRole('dialog',{name:'Navigasi admin',exact:true}).waitFor();await page.keyboard.press('Escape');await page.getByRole('dialog',{name:'Navigasi admin',exact:true}).waitFor({state:'hidden'});assert(await trigger.evaluate(e=>e===document.activeElement));}
  } else {
   await page.getByRole('textbox',{name:'Cari associate',exact:true}).fill('Nadia');assert.equal(await page.getByRole('cell',{name:'Raka Contoh',exact:true}).count(),0);
   await page.getByRole('button',{name:/Perlu ditinjau 8/}).click();assert(await page.getByText('Under Review',{exact:true}).isVisible());assert.equal(await page.locator('.animate-ping').count(),0);
   if(name!=='ams-associate'&&width<1024){const trigger=page.getByRole('button',{name:'Buka navigasi admin',exact:true});await trigger.click();await page.getByRole('dialog',{name:'Navigasi admin',exact:true}).waitFor();await page.keyboard.press('Escape');await page.getByRole('dialog',{name:'Navigasi admin',exact:true}).waitFor({state:'hidden'});assert(await trigger.evaluate(e=>e===document.activeElement));}
   if(name==='ams-admin'){await page.getByRole('button',{name:'Notifikasi',exact:true}).click();const box=await page.getByRole('heading',{name:'Notifikasi',exact:true}).locator('..').locator('..').boundingBox();assert(box&&box.x>=0&&box.x+box.width<=width+1);await page.keyboard.press('Escape');}
  }
  assert.deepEqual(writes,[],`${name} attempted write`);
 }
 results.push({name,width,...metrics,errors});console.log(JSON.stringify({name,width,overflow:metrics.overflow,errors:errors.length}));await page.close();
} }finally{await browser.close();await writeFile(`${output}/results.json`,JSON.stringify(results,null,2));}
console.log(`${results.length} local fixture checks completed; no production backend, email or AI used.`);

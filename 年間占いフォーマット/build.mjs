import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { marked } = require('marked');
const { chromium } = require('playwright');
const signs = {
  aries:['牡羊座','#A95F72','牡羊座_透過.png'], taurus:['牡牛座','#9288A9','牡牛座_透過.png'],
  gemini:['双子座','#5F8B73','双子座_透過.png'], cancer:['蟹座','#668B9D','蟹座_透過.png'],
  leo:['獅子座','#A96F48','獅子座_透過.png'], virgo:['乙女座','#78814D','乙女座_透過.png'],
  libra:['天秤座','#4D76A4','天秤座_透過.png'], scorpio:['蠍座','#754BA1','蠍座_透過.png'],
  sagittarius:['射手座','#91713F','射手座_透過.png'], capricorn:['山羊座','#4B627D','山羊座_透過.png'],
  aquarius:['水瓶座','#47828A','水瓶座_透過.png'], pisces:['魚座','#5E72A3','魚座_透過.png']
};
const args=process.argv.slice(2);
const value=(key,fallback)=>{const i=args.indexOf(key);return i<0?fallback:args[i+1];};
const sign=value('--sign','taurus');
if(!signs[sign]) throw new Error(`Unknown zodiac sign: ${sign}`);
const input=path.resolve(here,value('--input','manuscript.md'));
const defaultOutput=path.join(here,'output','pdf',`${path.parse(input).name}.pdf`);
const output=path.resolve(here,value('--output',defaultOutput));
const portraitPositions=JSON.parse(await fs.readFile(path.join(here,'portrait-positions.json'),'utf8'));
const portraitPosition=portraitPositions[sign];
if(!portraitPosition) throw new Error(`Missing portrait position for sign: ${sign}`);
const source=await fs.readFile(input,'utf8');
const sourceSections={};
for(const m of source.matchAll(/<!--\s*page:\s*(p\d+)\s*-->([\s\S]*?)(?=<!--\s*page:|$)/g)) sourceSections[m[1]]=m[2].trim();
for(const page of ['p05','p06','p07','p08']) {
  if(!sourceSections[page]) throw new Error(`Missing required manuscript section: ${page}`);
}
let html=await fs.readFile(path.join(here,'template.html'),'utf8');
for(const page of ['p05','p06','p07']) {
  const match=sourceSections[page].match(/^\s*#{1,2}\s+(.+?)\s*#*\s*(?:\r?\n|$)/);
  if(!match) throw new Error(`${page} must start with a Markdown heading (for example: ## 個別の見出し)`);
  const title=marked.parseInline(match[1].trim());
  const body=marked.parse(sourceSections[page].slice(match[0].length).trim());
  html=html.replace(`<h1 data-page-title="${page}"></h1>`,`<h1>${title}</h1>`);
  html=html.replace(`<div class="reading-slot" data-page="${page}"></div>`,`<div class="reading-slot">${body}</div>`);
}
const tarotHeading=/^###\s+(1[0-2]|[1-9])月\s*$/gm;
const tarotMatches=[...sourceSections.p08.matchAll(tarotHeading)];
if(tarotMatches.length!==12) throw new Error('p08 must contain exactly twelve ### N月 sections (1月 through 12月).');
const tarotEntries=tarotMatches.map((match,index)=>{
  const month=Number(match[1]);
  if(month!==index+1) throw new Error('Tarot months must be listed once each in order from 1月 to 12月.');
  const start=match.index+match[0].length;
  const end=index+1<tarotMatches.length?tarotMatches[index+1].index:sourceSections.p08.length;
  const entry=sourceSections.p08.slice(start,end).trim();
  const image=entry.match(/^(!\[[^\]]*\]\([^\r\n]+\))\s*(?:\r?\n|$)/);
  if(!image) throw new Error(`${month}月 must start with a Tarot image Markdown line, such as ![カード](assets/tarot/01.png).`);
  const fortune=entry.slice(image[0].length).trim();
  if(!fortune) throw new Error(`${month}月 needs forecast text after its Tarot image.`);
  return `<article class="tarot-month"><h2>${month}月</h2><div class="tarot-month-content">${marked.parseInline(image[1])}<div class="tarot-copy">${marked.parse(fortune)}</div></div></article>`;
}).join('');
html=html.replace('<div class="reading-slot" data-page="p08"></div>',`<div class="reading-slot">${tarotEntries}</div>`);
const maidMessageImage=`assets/2027お言葉_${signs[sign][0]}.png`;
try {
  await fs.access(path.join(here,maidMessageImage));
} catch {
  throw new Error(`Missing maid message image: ${maidMessageImage}`);
}
html=html.replace('<div class="message-slot" data-page="p11"></div>',`<div class="message-slot"><img class="maid-message-image" src="${maidMessageImage}" alt="${signs[sign][0]}座メイドさんのお言葉"></div>`);
html=html.replaceAll('assets/牡牛座_透過.png',`assets/${signs[sign][2]}`);
const css=await fs.readFile(path.join(here,'styles.css'),'utf8');
const js=await fs.readFile(path.join(here,'book.js'),'utf8');
html=html.replace('<link rel="stylesheet" href="styles.css">',`<style>${css}</style>`).replace('<script src="book.js"></script>',`<script>${js}</script>`);
const buildDir=path.join(here,'.build');
await fs.mkdir(buildDir,{recursive:true});
await fs.writeFile(path.join(buildDir,'index.html'),html);
await fs.rm(path.join(buildDir,'assets'),{recursive:true,force:true});
await fs.cp(path.join(here,'assets'),path.join(buildDir,'assets'),{recursive:true});
await fs.mkdir(path.dirname(output),{recursive:true});
const executablePath=process.env.PDF_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser=await chromium.launch({headless:true,executablePath});
try {
  const page=await browser.newPage({viewport:{width:720,height:1024},deviceScaleFactor:1});
  await page.goto('file:///'+path.join(buildDir,'index.html').replaceAll('\\','/'),{waitUntil:'load'});
  await page.evaluate(({color,portrait})=>{
    const root=document.documentElement.style;
    root.setProperty('--cover-color',color);
    root.setProperty('--portrait-scale',String(portrait.scale));
    root.setProperty('--portrait-x',portrait.x);
    root.setProperty('--portrait-y',portrait.y);
  },{color:signs[sign][1],portrait:portraitPosition});
  await page.pdf({path:output,printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});
} finally { await browser.close(); }
console.log(`Wrote ${output}`);

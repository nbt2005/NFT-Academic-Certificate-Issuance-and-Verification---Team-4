// QA helper: npm install --prefix tmp/pdf-tools pdfjs-dist@4.10.38 @napi-rs/canvas@0.1.70
import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const require=createRequire(path.resolve('tmp/pdf-tools/package.json'));
const canvas=require('@napi-rs/canvas');
globalThis.DOMMatrix=canvas.DOMMatrix;globalThis.Path2D=canvas.Path2D;globalThis.ImageData=canvas.ImageData;
const pdfjs=await import(pathToFileURL(path.resolve('tmp/pdf-tools/node_modules/pdfjs-dist/legacy/build/pdf.mjs')).href);
const input=process.argv[2]||'docs/report.pdf';
const output=process.argv[3]||'tmp/report-pages';
const pdf=await pdfjs.getDocument({data:new Uint8Array(fs.readFileSync(input)),useSystemFonts:true,disableFontFace:true}).promise;
fs.mkdirSync(output,{recursive:true});
for(let i=1;i<=pdf.numPages;i++){
  const page=await pdf.getPage(i),viewport=page.getViewport({scale:1.4});
  const image=canvas.createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
  await page.render({canvasContext:image.getContext('2d'),viewport}).promise;
  fs.writeFileSync(`${output}/page-${i}.png`,image.toBuffer('image/png'));
  const text=await page.getTextContent();
  console.log(`Page ${i}: ${text.items.length} text runs`);
}
console.log(`Rendered ${pdf.numPages} pages`);

// Renderer for the headings, paragraphs, lists, tables and code used by this guide.
import { readFile, writeFile } from 'node:fs/promises';
import { renderInline as inline } from './runbook-inline.mjs';
// Las guías que la aplicación enlaza se publican junto a ella, no solo en el repositorio: quien
// abre ArenaPay desde Vercel no tiene delante el Markdown.
const documents = [
  { slug: 'runbook-pruebas-arenapay', source: 'docs/guias/runbook-pruebas-arenapay.md',
    title: 'ArenaPay · Runbook de pruebas desde cero', kicker: 'Guía de pruebas',
    lead: 'Preparación · Firmas · Competición · Evidencia',
    description: 'Guía paso a paso para preparar Freighter, probar ArenaPay y verificar depósitos y premios en Stellar Testnet.' },
  { slug: 'guia-freighter-testnet', source: 'docs/guias/fondear-freighter-testnet.md',
    title: 'ArenaPay · Preparar Freighter en Testnet', kicker: 'Preparar Freighter',
    lead: 'Seleccionar Testnet · Conseguir XLM de prueba · Conectar',
    description: 'Cómo poner Freighter en Stellar Testnet y conseguir XLM de prueba con Friendbot antes de usar ArenaPay.' },
];

for (const document of documents) {
const source = await readFile(document.source, 'utf8');
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const lines = source.split(/\r?\n/);
const blocks = [], toc = [];
let i = 0;
while (i < lines.length) {
  const line = lines[i];
  if (!line.trim()) { i++; continue; }
  const heading = line.match(/^(#{1,6}) (.+)$/);
  if (heading) {
    const level = heading[1].length, id = `seccion-${i + 1}`;
    blocks.push(`<h${level} id="${id}">${inline(heading[2])}</h${level}>`);
    if (level === 2) toc.push(`<li><a href="#${id}">${escape(heading[2])}</a></li>`);
    i++; continue;
  }
  if (line.startsWith('```')) {
    const code = []; i++;
    while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
    i++; blocks.push(`<pre><code>${escape(code.join('\n'))}</code></pre>`); continue;
  }
  if (line.startsWith('|')) {
    const rows = [];
    while (i < lines.length && lines[i].startsWith('|')) {
      const row = lines[i++];
      if (/^\|[\s:|\-]+\|$/.test(row)) continue;
      rows.push(row.slice(1, -1).split('|').map(s => s.trim()));
    }
    blocks.push(`<div class="table-wrap"><table><thead><tr>${rows.shift().map(s => `<th scope="col">${inline(s)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(s => `<td>${inline(s)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
    continue;
  }
  if (/^(- |\d+\. )/.test(line)) {
    const tag = line.startsWith('- ') ? 'ul' : 'ol', items = [];
    while (i < lines.length && /^(- |\d+\. )/.test(lines[i])) items.push(`<li>${inline(lines[i++].replace(/^(- |\d+\. )/, ''))}</li>`);
    blocks.push(`<${tag}>${items.join('')}</${tag}>`); continue;
  }
  const paragraph = [];
  while (i < lines.length && lines[i].trim() && !/^(#|\||```|- |\d+\. )/.test(lines[i])) paragraph.push(lines[i++]);
  if (!paragraph.length) throw new Error(`Unsupported Markdown at line ${i + 1}`);
  blocks.push(`<p>${inline(paragraph.join(' '))}</p>`);
}
const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${document.title}</title>
<meta name="description" content="${document.description}">
<style>
:root{color-scheme:light;font-family:system-ui,sans-serif;color:#182747;background:#f3f5fb;line-height:1.65}*{box-sizing:border-box}body{margin:0}a{color:#2437c7;text-underline-offset:3px}a:focus-visible{outline:3px solid #dd9b12;outline-offset:4px}.top{background:#182747;color:white;padding:28px max(24px,calc((100% - 1000px)/2))}.top a{color:white}.top p{margin:6px 0}.brand{font-size:1.4rem;font-weight:750}main{max-width:1000px;margin:32px auto;padding:40px;background:white;border:1px solid #dce2f0;border-radius:16px}h1{font-size:clamp(2rem,5vw,3rem);line-height:1.15}h2{margin-top:3rem;padding-top:1rem;border-top:2px solid #e0e5f4;line-height:1.3}h3{margin-top:2rem;line-height:1.35}h1,h2,h3{scroll-margin-top:20px}p,li,td{overflow-wrap:anywhere}li{margin:.45rem 0}nav{background:#f3f5fb;padding:20px 28px;border-radius:10px}nav ul{columns:2;list-style:none;padding:0}nav li{break-inside:avoid}.table-wrap{overflow-x:auto;margin:24px 0}table{border-collapse:collapse;width:100%;font-size:.95rem}th,td{padding:12px;border:1px solid #dce2f0;text-align:left;vertical-align:top}th{background:#edf0fc}tr:nth-child(even){background:#fafbfe}code{font-family:ui-monospace,monospace;font-size:.9em;background:#edf0f7;padding:2px 4px;border-radius:3px;overflow-wrap:anywhere}pre{background:#edf0f7;padding:18px;overflow-x:auto}pre code{padding:0}footer{margin-top:3rem;border-top:1px solid #dce2f0;padding-top:20px;font-size:.9rem}@media(max-width:650px){main{margin:0;padding:22px;border:0;border-radius:0}nav ul{columns:1}th,td{padding:8px}}@media print{body{background:white;font-size:10pt}.top{background:white;color:#182747;padding:0}.top a{color:#182747}main{margin:0;padding:0;border:0;max-width:none}nav ul{columns:2}h2,h3{break-after:avoid}tr,pre{break-inside:avoid}a{color:inherit}.table-wrap{overflow:visible}}
</style></head><body><header class="top"><div class="brand">ArenaPay / ${document.kicker}</div><p>${document.lead}</p><a href="${document.slug}.md" download>Descargar Markdown editable</a></header>
<main><nav aria-label="Índice del documento"><strong>Índice — elige un paso</strong><ul>${toc.join('')}</ul></nav>${blocks.join('\n')}<footer>Documento generado desde Markdown. Puedes imprimirlo con la opción Imprimir de tu navegador.</footer></main></body></html>`;
await writeFile(`docs/guias/${document.slug}.html`, html);
await writeFile(`src/apps/web/public/${document.slug}.html`, html);
await writeFile(`src/apps/web/public/${document.slug}.md`, source);
console.log(`${document.slug}: ${toc.length} secciones, Markdown y HTML listos para la web.`);
}

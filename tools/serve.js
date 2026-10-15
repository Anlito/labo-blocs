// Petit serveur local pour essayer Labo Blocs sur son ordinateur : npm start
// puis ouvrir http://localhost:8080 dans Chrome ou Firefox (redirigé vers site/index.html).
// Le dépôt entier est servi : le site charge ../noyau, ../interface et ../parcours.
// (Le site marche aussi en ouvrant directement site/index.html, sans serveur.)

const { createServer } = require('node:http');
const { readFile, stat } = require('node:fs/promises');
const { join, extname, normalize } = require('node:path');

const RACINE = join(__dirname, '..');
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.cur': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  let chemin = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (chemin === '/') {
    res.writeHead(302, { Location: '/site/index.html' });
    return res.end();
  }
  if (/^\/(node_modules|\.git)(\/|$)/.test(chemin)) return envoyer(res, 403, 'Interdit');
  chemin = normalize(join(RACINE, chemin));
  if (!chemin.startsWith(normalize(RACINE))) return envoyer(res, 403, 'Interdit');
  try {
    if ((await stat(chemin)).isDirectory()) chemin = join(chemin, 'index.html');
    const contenu = await readFile(chemin);
    // no-store : le navigateur ne garde pas de copie, on voit toujours la dernière version.
    res.writeHead(200, { 'Content-Type': TYPES[extname(chemin)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(contenu);
  } catch {
    envoyer(res, 404, 'Fichier introuvable');
  }
}).listen(PORT, () => console.log(`Site prêt : http://localhost:${PORT}  (Ctrl+C pour arrêter)`));

function envoyer(res, code, texte) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(texte);
}

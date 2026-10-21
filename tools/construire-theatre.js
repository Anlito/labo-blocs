// Publie l'intégration Théâtre depuis une seule source. Le dossier porte l'empreinte
// de ses fichiers : tous les imports d'une session utilisent la même révision.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
function fichiers(dir, prefix = '') {
  return fs.readdirSync(dir).sort().flatMap(n => {
    const p = path.join(dir,n), rel = prefix+n;
    return fs.statSync(p).isDirectory() ? fichiers(p, rel+'/') : [rel];
  });
}
function construireTheatre(out) {
  const source = path.join(__dirname,'../integrations/theatre');
  const liste = fichiers(source);
  const hash = createHash('sha256');
  for (const f of liste) hash.update(f).update('\0').update(fs.readFileSync(path.join(source,f)));
  const revision = hash.digest('hex').slice(0,20);
  const cible = path.join(out,'theatre');
  fs.mkdirSync(cible,{recursive:true});
  fs.cpSync(source,path.join(cible,revision),{recursive:true});
  fs.writeFileSync(path.join(cible,'manifest.json'),JSON.stringify({format:1,revision,entry:revision+'/index.js',fichiers:liste},null,2)+'\n');
  fs.copyFileSync(path.join(__dirname,'../integrations/theatre-charger.js'),path.join(cible,'charger.js'));
  return {revision,fichiers:liste};
}
module.exports = { construireTheatre };

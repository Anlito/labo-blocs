// Point d'entrée public chargé par Théâtre d'ombre avant le démarrage du projet.
const racine = new URL('./', import.meta.url);
const reponse = await fetch(new URL('manifest.json', racine), {cache:'no-store'});
if (!reponse.ok) throw new Error('La programmation du Théâtre est indisponible.');
const manifeste = await reponse.json();
if (manifeste.format !== 1 || !/^[a-f0-9]{20}$/.test(manifeste.revision) || manifeste.entry !== manifeste.revision+'/index.js') {
  throw new Error('La version de programmation est incompatible.');
}
function script(url) {
  return new Promise((resolve,reject) => {
    const s = document.createElement('script');
    const timer = setTimeout(() => { s.remove(); reject(new Error('Connexion à Labo Blocs trop lente.')); },15000);
    s.onload = () => { clearTimeout(timer); resolve(); };
    s.onerror = () => { clearTimeout(timer); s.remove(); reject(new Error('Bibliothèque de programmation indisponible.')); };
    s.src = url;
    document.head.append(s);
  });
}
for (const fichier of ['blockly_compressed.js','blocks_compressed.js','javascript_compressed.js','fr.js']) {
  await script(new URL('../blockly/'+fichier+'?v='+manifeste.revision, racine).href);
}
await script(new URL(manifeste.revision+'/vendor/js-interpreter.min.js',racine).href);
const integration = await import(new URL(manifeste.entry,racine).href);
if (typeof integration.setupProgramScreen !== 'function' || !globalThis.Interpreter || !globalThis.Blockly || !globalThis.javascript) {
  throw new Error('Le chargement de la programmation est incomplet.');
}
globalThis.LaboTheatre = Object.freeze({...integration, revision:manifeste.revision});

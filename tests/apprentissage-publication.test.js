const test=require('node:test'),assert=require('node:assert/strict');
const {lireTousLesParcours}=require('../tools/parcours-depot.js');
const {controlerPublication}=require('../noyau/edition.js');
const {controler,etiquettesPersonnages,preparer}=require('../noyau/parcours.js');
const S=require('../noyau/sauvegarde.js');
const parcours=()=>lireTousLesParcours().parcours.find(p=>p.id==='theatre-ombre');

test('le parcours éditable du Théâtre se publie sans bloc dans les deux entraînements IA',()=>{
 const p=parcours();
 // La version change à chaque publication depuis l'éditeur : on vérifie seulement qu'elle est bien formée
 // (une version figée ici bloquait la mise en ligne de Labo Blocs à chaque nouvelle publication du parcours).
 assert.match(p.versionParcours, /^\d+\.\d+\.\d+$/);
 assert.deepEqual(controlerPublication(p),[]);
 for(const e of p.exercices.slice(0,2)){
  assert.deepEqual(e.blocsAutorises,[]);
  assert.deepEqual(e.camera.etiquettes,[]);
  assert.equal(e.solutionReference,undefined);
 }
 // L'exception ne doit pas laisser publier un exercice de programmation sans palette.
 const e=p.exercices[2];e.blocsAutorises=[];
 assert(controlerPublication(p).some(m=>m.includes('aucun bloc')));
});

test('un entraînement IA reste soumis à des critères cohérents',()=>{
 const p=parcours(),e=p.exercices[0];
 delete e.camera;
 assert(controler(p).some(m=>m.includes('caméra')));
 e.camera={etiquettes:[]};e.apprentissage.photos=0;
 assert(controler(p).some(m=>m.includes('au moins une photo')));
});

test('Rien est réservé au fond vide et ne compte pas comme personnage',()=>{
 assert.deepEqual(etiquettesPersonnages(['Rien',' rien ','Loup','LOUP','Roi']),['Loup','Roi']);
 const p=preparer(parcours()),d=S.creerSauvegarde({eleves:[],classe:''},{parcours:p});
 S.relierParcours(d,p);
 const photos=Array.from({length:10},()=>({f:'AAAAAA==',v:''}));
 S.noterCamera(d,{etiquettes:['Rien','Loup'],exemples:{Rien:photos,Loup:photos}});
 assert.deepEqual(S.lireCamera(d).etiquettes,['Loup']);
 assert.equal(S.verifierApprentissage(d,p.exercices[1]).ok,false);
 assert.equal(S.lireCamera(d).exemples.Rien.length,10,'les photos du fond vide restent conservées');
});

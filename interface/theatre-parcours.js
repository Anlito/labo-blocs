// Le Théâtre utilise les écrans, l'éditeur, l'IA et la carte communs de Labo Blocs.
// L'hôte ne fournit que son fichier d'équipe et les actions de retour/enregistrement.
(function(global){
  'use strict';
  const A=global.LaboBlocs;
  function monterTheatre(hote,o){
    const paquet=A.preparer(o.parcours);
    const D=A.creerSauvegarde({eleves:[],classe:''},{parcours:paquet});
    const avant=[];
    const session={donnees:D,lecture:false,handle:null,
      surAvantEcriture:f=>avant.push(f),
      aEnregistrer(){o.modifie?.();majEtat();},
      enregistrer(){preparer();return o.enregistrer?.();},
      message:t=>o.message?.(t),majEtat:()=>majEtat()};
    let listeVisible=true;
    const e=A.monterExercice(hote,{session,paquet,projet:{id:'theatre-ombre',titre:paquet.titre,accent:'#2547D0'},media:o.media,
      retour:{texte:'Parcours',action(){if(listeVisible)o.retour();else parcours();}}});
    hote.insertAdjacentHTML('beforeend',A.GABARITS.parcours);
    const liste=hote.querySelector('.ecran-parcours'),exercice=hote.querySelector('.ecran-exercice');
    const bandeau=hote.querySelector('.bandeau');
    const bouton=bandeau.querySelector('.btn-vers-parcours');
    const grille=A.creerEcranParcours({session,paquet,ouvrirExercice:ouvrir});
    function equipe(){D.equipe={eleves:o.equipe?.()||[],classe:o.classe?.()||''};bandeau.querySelector('.equipe-texte').textContent='Équipe '+D.equipe.eleves.join(' · ')+(D.equipe.classe?' · '+D.equipe.classe:'');}
    function majEtat(){const el=hote.querySelector('.etat-enregistrement');if(el)el.textContent=o.nonEnregistre?.()?'À enregistrer':'';}
    function preparer(){avant.forEach(f=>f());equipe();return D.programmation;}
    function ouvrir(id){equipe();const ex=paquet.exercices.find(x=>x.id===id);if(!ex||!A.estDebloque(D,paquet,id))return session.message('Réussis le précédent pour ouvrir cet exercice.');liste.hidden=true;exercice.hidden=false;listeVisible=false;bouton.lastChild.textContent='Parcours';e.ouvrir(id);}
    function parcours(){e.quitter();listeVisible=true;exercice.hidden=true;liste.hidden=false;bouton.lastChild.textContent='Carnet';grille.dessiner();equipe();document.title=paquet.titre+' — Labo Blocs';}
    function charger(programmation){e.quitter();e.ecran.etat.exercice=null;D.programmation=programmation?JSON.parse(JSON.stringify(programmation)):undefined;A.relierParcours(D,paquet);parcours();}
    A.relierParcours(D,paquet);
    parcours();
    return {session,paquet,ecran:e.ecran,preparer,charger,parcours,ouvrir,
      quitter(){e.quitter();hote.hidden=true;},
      afficher(){hote.hidden=false;parcours();},
      final(){hote.hidden=false;ouvrir(paquet.exercices.at(-1).id);},
    };
  }
  A.monterTheatre=monterTheatre;
})(this);

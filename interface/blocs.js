// Blocs Blockly en français (libellés de Vittascience), thème de l'atelier du distributeur (décision du 14/10/2026 :
// même rendu pour tous les projets) et palette limitée aux blocs autorisés par l'exercice.
// Un bloc ne dépend jamais d'un projet : seule la liste des blocs proposés change.
(function (global) {
  'use strict';

  const A = global.LaboBlocs;

  // Familles de blocs : couleur pastel soutenu en aplat, texte foncé (maquette 3b).
  const COULEURS = {
    debut: '#86C595',
    lumiere: '#F7AE5E',
    decision: '#F7AE5E',
    bleu: '#78B5D6',
    valeur: '#BCDAEB',
    servo: '#E78AB3',
    variable: '#EC8780',
    extension: '#C3B1E1', // blocs d'une carte ou d'une extension (mBot, micro:bit…) : lilas, pictogramme puzzle
  };

  // Broches proposées dans les menus.
  // Toutes les broches numériques D2 à D13 pour les LED et les boutons : c'est à l'élève de lire la consigne
  // et de choisir la bonne (le bloc de la palette part toujours de D2, il ne donne pas la réponse).
  const BROCHES_NUMERIQUES = ['D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13'];
  const BROCHES_LED = BROCHES_NUMERIQUES;
  const BROCHES_BOUTON = BROCHES_NUMERIQUES;
  const BROCHES_SERVO = ['D5', 'D6'];
  const menu = (liste) => liste.map((b) => [b, b]);
  // Broches de la carte de l'exercice (A.carteCourante, réglée à l'ouverture de l'exercice) : D2…D13 pour l'Uno,
  // P0…P2 pour la micro:bit. Sans carte connue : celles de l'Uno.
  function brochesCarte(type) {
    const p = A.profil ? A.profil(A.carteCourante) : null;
    const liste = p && p.broches[type] && p.broches[type].length ? p.broches[type] : { led: BROCHES_LED, bouton: BROCHES_BOUTON, servo: BROCHES_SERVO, buzzer: BROCHES_NUMERIQUES }[type];
    return menu(liste);
  }
  // Pour une LED, on dit aussi ce que fait l'état : HAUT = allumée, BAS = éteinte.
  const HAUT_BAS_LED = [
    ['HAUT (1) : allumée', '1'],
    ['BAS (0) : éteinte', '0'],
  ];
  const HAUT_BAS = [
    ['HAUT (1)', '1'],
    ['BAS (0)', '0'],
  ];

  const image = (nom, alt) => ({ type: 'field_image', src: A.imageIcone(nom, '#1F2A30', 2.6), width: 22, height: 22, alt });

  const DEFINITIONS = [
    {
      type: 'demarrage',
      message0: 'Au démarrage %1 %2',
      args0: [{ type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }],
      style: 'debut',
      tooltip: 'Les blocs placés ici s’exécutent une seule fois, au démarrage de la carte.',
    },
    {
      type: 'boucle',
      message0: 'Répéter indéfiniment %1 %2',
      args0: [{ type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }],
      style: 'debut',
      tooltip: 'Les blocs placés ici recommencent sans fin, de haut en bas.',
    },
    {
      type: 'led_etat',
      message0: '%1 contrôler la LED à l’état %2 sur la broche %3',
      args0: [
        image('lumiere', 'LED'),
        { type: 'field_dropdown', name: 'ETAT', options: HAUT_BAS },
        { type: 'field_dropdown', name: 'BROCHE', options: menu(BROCHES_LED) },
      ],
      previousStatement: null,
      nextStatement: null,
      style: 'lumiere',
      tooltip: 'HAUT : la LED s’allume. BAS : elle s’éteint.',
    },
    {
      type: 'attendre',
      message0: 'attendre %1 seconde(s)',
      args0: [{ type: 'input_value', name: 'DUREE', check: 'Number' }],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      style: 'bleu',
      tooltip: 'La carte attend avant de passer au bloc suivant. On peut écrire 0.5 pour une demi-seconde.',
    },
    {
      type: 'bouton_etat',
      message0: '%1 état sur la broche %2',
      args0: [image('bouton', 'Module bouton'), { type: 'field_dropdown', name: 'BROCHE', options: menu(BROCHES_BOUTON) }],
      output: 'Boolean',
      style: 'valeur',
      tooltip: 'Donne HAUT (1) si le bouton est appuyé, BAS (0) sinon.',
    },
    {
      type: 'valeur_haut_bas',
      message0: '%1',
      args0: [{ type: 'field_dropdown', name: 'VALEUR', options: HAUT_BAS }],
      output: 'Boolean',
      style: 'valeur',
      tooltip: 'HAUT (1) ou BAS (0).',
    },
    {
      type: 'comparaison',
      message0: '%1 %2 %3',
      args0: [
        { type: 'input_value', name: 'A' },
        {
          type: 'field_dropdown',
          name: 'OP',
          options: [
            ['=', 'EQ'],
            ['≠', 'NEQ'],
            ['<', 'LT'],
            ['≤', 'LTE'],
            ['>', 'GT'],
            ['≥', 'GTE'],
          ],
        },
        { type: 'input_value', name: 'B' },
      ],
      inputsInline: true,
      output: 'Boolean',
      style: 'bleu',
      tooltip: '« = » : les deux valeurs sont égales. « ≠ » : elles sont différentes. « < » : plus petite, « > » : plus grande.',
    },
    {
      type: 'quand_bouton',
      message0: '%1 quand le bouton de la broche %2 est %3 %4 %5',
      args0: [
        image('bouton', 'Bouton'),
        { type: 'field_dropdown', name: 'BROCHE', options: menu(BROCHES_BOUTON) },
        { type: 'field_dropdown', name: 'FRONT', options: [['appuyé', 'appui'], ['relâché', 'relache']] },
        { type: 'input_dummy' },
        { type: 'input_statement', name: 'DO' },
      ],
      style: 'debut',
      tooltip: 'Les blocs placés ici s’exécutent à chaque appui (ou relâchement), en même temps que « Répéter indéfiniment ».',
    },
    {
      // Caméra et IA (jalon 6) : l'étiquette vient de l'exercice ouvert (menu A.optionsEtiquettes, 0 = rien).
      type: 'quand_camera',
      message0: '%1 quand la caméra %2 %3 %4 %5',
      args0: [
        image('camera', 'Caméra'),
        { type: 'field_dropdown', name: 'FRONT', options: [['reconnaît', 'voit'], ['ne reconnaît plus', 'plus']] },
        { type: 'field_dropdown', name: 'ETIQUETTE', options: () => A.optionsEtiquettes() },
        { type: 'input_dummy' },
        { type: 'input_statement', name: 'DO' },
      ],
      style: 'debut',
      tooltip: 'Les blocs placés ici s’exécutent une fois chaque fois que l’IA de la caméra se met à reconnaître (ou cesse de reconnaître) cette étiquette.',
    },
    {
      type: 'repeter_n',
      message0: 'répéter %1 fois %2 %3',
      args0: [{ type: 'input_value', name: 'FOIS', check: 'Number' }, { type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      style: 'decision',
      tooltip: 'Les blocs à l’intérieur s’exécutent ce nombre de fois, puis le programme continue.',
    },
    {
      type: 'tant_que',
      message0: 'tant que %1 répéter %2 %3',
      args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }, { type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      style: 'decision',
      tooltip: 'Tant que la condition est vraie, les blocs à l’intérieur recommencent.',
    },
    {
      type: 'repeter_jusqua',
      message0: 'répéter jusqu’à %1 %2 %3',
      args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }, { type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      style: 'decision',
      tooltip: 'Les blocs à l’intérieur recommencent jusqu’à ce que la condition devienne vraie.',
    },
    {
      type: 'operation',
      message0: '%1 %2 %3',
      args0: [
        { type: 'input_value', name: 'A', check: 'Number' },
        { type: 'field_dropdown', name: 'OP', options: [['+', 'ADD'], ['−', 'SUB'], ['×', 'MUL'], ['÷', 'DIV'], ['reste de ÷', 'MOD']] },
        { type: 'input_value', name: 'B', check: 'Number' },
      ],
      inputsInline: true,
      output: 'Number',
      style: 'bleu',
      tooltip: 'Un calcul avec deux nombres.',
    },
    {
      type: 'hasard',
      message0: 'nombre au hasard entre %1 et %2',
      args0: [
        { type: 'input_value', name: 'MIN', check: 'Number' },
        { type: 'input_value', name: 'MAX', check: 'Number' },
      ],
      inputsInline: true,
      output: 'Number',
      style: 'bleu',
      tooltip: 'Un nombre entier tiré au hasard, bornes comprises.',
    },
    {
      type: 'logique',
      message0: '%1 %2 %3',
      args0: [
        { type: 'input_value', name: 'A', check: 'Boolean' },
        { type: 'field_dropdown', name: 'OP', options: [['et', 'ET'], ['ou', 'OU']] },
        { type: 'input_value', name: 'B', check: 'Boolean' },
      ],
      inputsInline: true,
      output: 'Boolean',
      style: 'bleu',
      tooltip: '« et » : les deux conditions sont vraies. « ou » : au moins une est vraie.',
    },
    {
      type: 'non',
      message0: 'non %1',
      args0: [{ type: 'input_value', name: 'A', check: 'Boolean' }],
      output: 'Boolean',
      style: 'bleu',
      tooltip: 'Vrai si la condition est fausse.',
    },
    {
      type: 'ajouter_a',
      message0: 'ajouter à %1 la valeur %2',
      args0: [
        { type: 'field_dropdown', name: 'VAR', options: [['CHOIX', 'CHOIX']] },
        { type: 'input_value', name: 'VALEUR', check: 'Number' },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      style: 'variable',
      tooltip: 'Augmente la valeur rangée dans la boîte (ou la diminue avec un nombre négatif).',
    },
    {
      type: 'son',
      message0: '%1 jouer la note %2 Hz pendant %3 s sur la broche %4',
      args0: [
        image('son', 'Buzzer'),
        { type: 'input_value', name: 'FREQUENCE', check: 'Number' },
        { type: 'input_value', name: 'DUREE', check: 'Number' },
        { type: 'field_dropdown', name: 'BROCHE', options: menu(BROCHES_NUMERIQUES) },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      style: 'lumiere',
      tooltip: 'Le buzzer joue une note (440 Hz = la). Le programme continue sans attendre la fin de la note.',
    },
    {
      type: 'si_alors',
      message0: 'si %1 alors %2 %3',
      args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }, { type: 'input_dummy' }, { type: 'input_statement', name: 'ALORS' }],
      previousStatement: null,
      nextStatement: null,
      style: 'decision',
      tooltip: 'Si la condition est vraie, alors les blocs à l’intérieur s’exécutent.',
    },
    {
      type: 'si_sinon',
      message0: 'si %1 alors %2 %3',
      args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }, { type: 'input_dummy' }, { type: 'input_statement', name: 'ALORS' }],
      message1: 'sinon %1',
      args1: [{ type: 'input_statement', name: 'SINON' }],
      previousStatement: null,
      nextStatement: null,
      style: 'decision',
      tooltip: 'Si la condition est vraie, les blocs de « alors » s’exécutent. Sinon, ceux de « sinon ».',
    },
    {
      type: 'servo_angle',
      message0: '%1 contrôler l’angle à %2 ° sur la broche %3',
      args0: [
        image('moteur', 'Servomoteur'),
        { type: 'input_value', name: 'ANGLE', check: 'Number' },
        { type: 'field_dropdown', name: 'BROCHE', options: menu(BROCHES_SERVO) },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      style: 'servo',
      tooltip: 'Le servomoteur tourne jusqu’à l’angle choisi, entre 0° et 180°.',
    },
    {
      type: 'affecter',
      message0: 'affecter à %1 la valeur %2',
      args0: [
        { type: 'field_dropdown', name: 'VAR', options: [['CHOIX', 'CHOIX']] },
        { type: 'input_value', name: 'VALEUR', check: 'Number' },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      style: 'variable',
      tooltip: 'Range une valeur dans la variable choisie (une boîte qui garde un nombre).',
    },
    {
      type: 'variable',
      message0: '%1',
      args0: [{ type: 'field_label_serializable', name: 'VAR', text: 'CHOIX' }],
      output: 'Number',
      style: 'variable',
      tooltip: 'La valeur rangée dans la variable choisie.',
    },
    {
      type: 'nombre',
      message0: '%1',
      args0: [{ type: 'field_number', name: 'NUM', value: 0 }],
      output: 'Number',
      style: 'bleu',
      tooltip: 'Un nombre. Les nombres à virgule s’écrivent avec un point : 0.5',
    },
  ];

  // Blocs des cartes (mBot, micro:bit), décrits dans noyau/cartes.js.
  for (const [type, d] of Object.entries(A.BLOCS_CARTES || {})) {
    const args = [d.categorie === 'camera' ? image('camera', 'Caméra') : image('puzzle', 'Bloc de la carte')];
    let n = 1;
    const message = d.texte.replace(/%([A-Z]+)/g, (m, nom) => {
      n++;
      if (d.champs && nom in d.champs) {
        const c = d.champs[nom];
        if (c === 'etiquette') args.push({ type: 'field_dropdown', name: nom, options: () => A.optionsEtiquettes() });
        else args.push(Array.isArray(c) ? { type: 'field_dropdown', name: nom, options: c } : { type: 'field_input', name: nom, text: (d.defauts || {})[nom] || '' });
      } else args.push({ type: 'input_value', name: nom, check: 'Number' });
      return '%' + n;
    });
    const def = { type, message0: '%1 ' + message, args0: args, inputsInline: true, style: 'extension', tooltip: d.texte.replace(/%[A-Z]+/g, '…') };
    if (d.sorte === 'instruction') Object.assign(def, { previousStatement: null, nextStatement: null });
    else def.output = d.sorte === 'condition' ? 'Boolean' : 'Number';
    DEFINITIONS.push(def);
  }

  // Catégories de la palette, dans l'ordre. Chaque bloc a sa forme de départ dans la palette.
  const CATEGORIES = [
    { nom: 'Événements', cle: 'evenements', couleur: COULEURS.debut, blocs: ['quand_bouton'] },
    { nom: 'Lumière', cle: 'lumiere', couleur: COULEURS.lumiere, blocs: ['led_etat'] },
    { nom: 'Son', cle: 'son', couleur: COULEURS.lumiere, blocs: ['son'] },
    { nom: 'Temps', cle: 'temps', couleur: COULEURS.bleu, blocs: ['attendre'] },
    { nom: 'Bouton', cle: 'bouton', couleur: COULEURS.bleu, blocs: ['bouton_etat', 'valeur_haut_bas'] },
    { nom: 'Moteur', cle: 'moteur', couleur: COULEURS.servo, blocs: ['servo_angle'] },
    { nom: 'Décisions', cle: 'decisions', couleur: COULEURS.decision, blocs: ['si_alors', 'si_sinon', 'comparaison', 'logique', 'non'] },
    { nom: 'Boucles', cle: 'boucles', couleur: COULEURS.decision, blocs: ['repeter_n', 'tant_que', 'repeter_jusqua'] },
    { nom: 'Calculs', cle: 'calculs', couleur: COULEURS.bleu, blocs: ['operation', 'hasard'] },
    { nom: 'Variables', cle: 'variables', couleur: COULEURS.variable, blocs: ['affecter', 'ajouter_a', 'variable', 'nombre'] },
    // Une carte à la fois : la palette d'un exercice ne montre que les blocs autorisés.
    ...(A.CATEGORIES_CARTES || []).map((c) => ({ nom: c.nom, cle: c.cle, couleur: COULEURS.extension, icone: c.cle === 'camera' ? 'camera' : 'puzzle', carte: c.carte, blocs: c.cle === 'camera' ? ['quand_camera'].concat(c.blocs) : c.blocs })),
  ];

  const FORMES_PALETTE = {
    attendre: { inputs: { DUREE: { shadow: { type: 'nombre', fields: { NUM: 1 } } } } },
    servo_angle: { inputs: { ANGLE: { shadow: { type: 'nombre', fields: { NUM: 90 } } } } },
    affecter: { inputs: { VALEUR: { shadow: { type: 'nombre', fields: { NUM: 0 } } } } },
    led_etat: { fields: { ETAT: '1', BROCHE: 'D2' } },
    quand_bouton: { fields: { BROCHE: 'D2', FRONT: 'appui' } },
    quand_camera: { fields: { FRONT: 'voit', ETIQUETTE: '1' } },
    repeter_n: { inputs: { FOIS: { shadow: { type: 'nombre', fields: { NUM: 3 } } } } },
    ajouter_a: { inputs: { VALEUR: { shadow: { type: 'nombre', fields: { NUM: 1 } } } } },
    son: { fields: { BROCHE: 'D2' }, inputs: { FREQUENCE: { shadow: { type: 'nombre', fields: { NUM: 440 } } }, DUREE: { shadow: { type: 'nombre', fields: { NUM: 0.5 } } } } },
    operation: { inputs: { A: { shadow: { type: 'nombre', fields: { NUM: 1 } } }, B: { shadow: { type: 'nombre', fields: { NUM: 1 } } } } },
    // Case à droite pour taper une valeur (ex. distance < 20) ; on peut y glisser un autre bloc (HAUT / BAS, variable…).
    comparaison: { inputs: { B: { shadow: { type: 'nombre', fields: { NUM: 0 } } } } },
    hasard: { inputs: { MIN: { shadow: { type: 'nombre', fields: { NUM: 1 } } }, MAX: { shadow: { type: 'nombre', fields: { NUM: 6 } } } } },
  };
  for (const [type, d] of Object.entries(A.BLOCS_CARTES || {})) {
    if (!d.entrees) continue;
    FORMES_PALETTE[type] = { inputs: {} };
    for (const [nom, v] of Object.entries(d.entrees)) FORMES_PALETTE[type].inputs[nom] = { shadow: { type: 'nombre', fields: { NUM: v } } };
  }

  // Menu des étiquettes des blocs de la caméra : celles de l'exercice ouvert (réglées par interface/camera.js et
  // l'éditeur de parcours), 0 = « rien ».
  A.etiquettesCamera = ['Rien', 'Étiquette 1', 'Étiquette 2'];
  A.optionsEtiquettes = () => A.etiquettesCamera.map((nom, n) => [n ? nom : 'rien', String(n)]);

  const SORTE_BROCHE = { led_etat: 'led', quand_bouton: 'bouton', bouton_etat: 'bouton', son: 'buzzer', servo_angle: 'servo' };

  // Variables connues de l'éditeur en cours (celles de l'exercice, celles de la sauvegarde, celles créées) : les menus
  // des blocs de variables les proposent. Réglé par l'éditeur à chaque chargement (interface/editeur.js).
  A.variablesConnues = ['CHOIX'];
  const BLOCS_VARIABLE = ['affecter', 'ajouter_a', 'variable'];
  const optionsVariables = () => (A.variablesConnues.length ? A.variablesConnues.map((n) => [n, n]) : [['?', '?']]);

  // Palette d'un exercice : seulement ses blocs autorisés ; une catégorie vide n'apparaît pas.
  //   options : { variables (noms proposés), creerVariables (bouton « Créer une variable ») }
  function palette(blocsAutorises, composants, options) {
    const o = options || {};
    const variables = o.variables || A.variablesConnues;
    const autorises = new Set(blocsAutorises || []);
    // Les blocs de la palette ne donnent pas la broche de l'exercice : l'élève la choisit en lisant la consigne.
    void composants;
    const contenu = [];
    for (const cat of CATEGORIES) {
      // Blocs de variables : seulement s'il y a au moins une variable (sinon l'élève commence par en créer une).
      const blocs = cat.blocs.filter((t) => autorises.has(t) && (!BLOCS_VARIABLE.includes(t) || variables.length));
      const bouton = cat.cle === 'variables' && o.creerVariables;
      if (!blocs.length && !bouton) continue;
      contenu.push({
        kind: 'category',
        name: cat.nom,
        categorystyle: cat.cle,
        cssConfig: {
          container: 'blocklyToolboxCategoryContainer',
          row: 'blocklyToolboxCategory cat-ligne',
          icon: `cat-tuile cat-${cat.cle}`,
          label: 'blocklyToolboxCategoryLabel cat-libelle',
          selected: 'blocklyToolboxSelected cat-choisie',
        },
        contents: (bouton ? [{ kind: 'button', text: 'Créer une variable', callbackKey: 'creerVariable' }] : []).concat(blocs.map((type) => {
          const forme = JSON.parse(JSON.stringify(FORMES_PALETTE[type] || {}));
          // Variable de départ : la dernière créée (ou la première de l'exercice).
          if (BLOCS_VARIABLE.includes(type)) forme.fields = Object.assign({}, forme.fields, { VAR: variables[variables.length - 1] });
          // Broche de départ : la première de la carte (D2 sur l'Uno, P0 sur la micro:bit), jamais celle de l'exercice.
          const sorte = SORTE_BROCHE[type];
          if (sorte && forme.fields && forme.fields.BROCHE) {
            const liste = brochesDe(A.carteCourante, sorte);
            if (!liste.includes(forme.fields.BROCHE)) forme.fields.BROCHE = liste[0];
          }
          return Object.assign({ kind: 'block', type }, forme);
        })),
      });
    }
    return { kind: 'categoryToolbox', contents: contenu };
  }

  let defini = false;
  function definirBlocs(Blockly) {
    if (defini) return;
    defini = true;
    Blockly.common.defineBlocksWithJsonArray(DEFINITIONS);
    // Menu HAUT/BAS du bloc LED : « : allumée / : éteinte » pendant les premiers exercices seulement
    // (A.aideLed est réglé à l'ouverture de chaque exercice, voir parametres.js).
    const initLed = Blockly.Blocks.led_etat.init;
    Blockly.Blocks.led_etat.init = function () {
      initLed.call(this);
      const entree = this.getField('ETAT').getParentInput();
      const rang = entree.fieldRow.findIndex((f) => f.name === 'ETAT');
      entree.removeField('ETAT');
      entree.insertFieldAt(rang, new Blockly.FieldDropdown(() => (A.aideLed ? HAUT_BAS_LED : HAUT_BAS)), 'ETAT');
    };
    // Menus de variables : celles de l'exercice et celles créées par l'élève (le bloc « valeur » aussi).
    for (const type of BLOCS_VARIABLE) {
      const init = Blockly.Blocks[type].init;
      Blockly.Blocks[type].init = function () {
        init.call(this);
        const champ = this.getField('VAR');
        const entree = champ.getParentInput();
        const rang = entree.fieldRow.indexOf(champ);
        entree.removeField('VAR');
        entree.insertFieldAt(rang, new Blockly.FieldDropdown(optionsVariables), 'VAR');
      };
    }
    // Menus de broches selon la carte de l'exercice.
    for (const [type, sorte] of [['led_etat', 'led'], ['bouton_etat', 'bouton'], ['quand_bouton', 'bouton'], ['servo_angle', 'servo'], ['son', 'buzzer']]) {
      const init = Blockly.Blocks[type].init;
      Blockly.Blocks[type].init = function () {
        init.call(this);
        const champ = this.getField('BROCHE');
        if (!champ) return;
        const entree = champ.getParentInput();
        const rang = entree.fieldRow.indexOf(champ);
        entree.removeField('BROCHE');
        entree.insertFieldAt(rang, new Blockly.FieldDropdown(() => brochesCarte(sorte)), 'BROCHE');
      };
    }
    // Pastille « ? » sur « Au démarrage » et « Répéter indéfiniment » : un clic ouvre l'explication
    // des deux blocs (A.surAideChapeau est branché par l'écran d'exercice).
    const ICONE_AIDE =
      'data:image/svg+xml,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.5" fill="#FFFFFF" stroke="#1F2A30" stroke-width="2"/>' +
          '<text x="12" y="17" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="15" font-weight="800" fill="#1A6E8E">?</text></svg>',
      );
    for (const type of ['demarrage', 'boucle']) {
      const init = Blockly.Blocks[type].init;
      Blockly.Blocks[type].init = function () {
        init.call(this);
        const aide = new Blockly.FieldImage(ICONE_AIDE, 24, 24, 'Aide sur ce bloc', () => A.surAideChapeau && A.surAideChapeau(type));
        this.inputList[0].appendField(aide, 'AIDE');
      };
    }
    const style = (c) => ({ colourPrimary: c, colourSecondary: c, colourTertiary: assombrir(c) });
    const blockStyles = {};
    for (const [cle, c] of Object.entries(COULEURS)) blockStyles[cle] = style(c);
    blockStyles.debut.hat = 'cap';
    const categoryStyles = {};
    for (const cat of CATEGORIES) categoryStyles[cat.cle] = { colour: cat.couleur };
    A.themeBlockly = Blockly.Theme.defineTheme('atelier', {
      base: Blockly.Themes.Classic,
      blockStyles,
      categoryStyles,
      componentStyles: {
        workspaceBackgroundColour: '#F7FAFB',
        toolboxBackgroundColour: '#FAFBFC',
        toolboxForegroundColour: '#1F2A30',
        flyoutBackgroundColour: '#EAF0F3',
        flyoutForegroundColour: '#1F2A30',
        flyoutOpacity: 1,
        scrollbarColour: '#9AA8B0',
        insertionMarkerColour: '#1F2A30',
        insertionMarkerOpacity: 0.3,
      },
      fontStyle: { family: "'Segoe UI', system-ui, sans-serif", weight: '700', size: 12 },
      startHats: false,
    });
  }

  function assombrir(hex) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.round(v * 0.72);
    const r = f(n >> 16);
    const g = f((n >> 8) & 255);
    const b = f(n & 255);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  // Noms des blocs pour l'éditeur du professeur (cases « blocs proposés aux élèves »), dans les mots de la palette.
  const NOMS_BLOCS_BASE = {
    quand_bouton: 'quand le bouton est appuyé',
    quand_camera: 'quand la caméra reconnaît…',
    led_etat: 'contrôler la LED',
    son: 'jouer une note',
    attendre: 'attendre … seconde(s)',
    bouton_etat: 'état sur la broche (bouton)',
    valeur_haut_bas: 'HAUT / BAS',
    servo_angle: 'contrôler l’angle (servomoteur)',
    si_alors: 'si … alors',
    si_sinon: 'si … alors … sinon',
    comparaison: 'comparaison (=, ≠, <, >)',
    logique: 'et / ou',
    non: 'non',
    repeter_n: 'répéter … fois',
    tant_que: 'tant que … répéter',
    repeter_jusqua: 'répéter jusqu’à',
    operation: 'calcul (+, −, ×, ÷)',
    hasard: 'nombre au hasard',
    affecter: 'affecter une valeur à une variable',
    ajouter_a: 'ajouter à une variable',
    variable: 'valeur d’une variable',
    nombre: 'nombre',
  };
  const NOMS_BLOCS = Object.assign({}, NOMS_BLOCS_BASE);
  for (const [type, d] of Object.entries(A.BLOCS_CARTES || {})) NOMS_BLOCS[type] = d.texte.replace(/%[A-Z]+/g, '…').replace(/\s+/g, ' ');
  // Broches que proposent les menus des blocs, par sorte de composant et par carte (l'éditeur du professeur
  // propose les mêmes).
  const brochesDe = (carte, type) => {
    const p = A.profil ? A.profil(carte) : null;
    return p && p.broches[type] && p.broches[type].length ? p.broches[type] : { led: BROCHES_LED, bouton: BROCHES_BOUTON, servo: BROCHES_SERVO, buzzer: BROCHES_NUMERIQUES }[type];
  };
  const BROCHES_COMPOSANTS = { led: BROCHES_LED, bouton: BROCHES_BOUTON, servo: BROCHES_SERVO, buzzer: BROCHES_NUMERIQUES };

  Object.assign(A, { definirBlocs, palette, CATEGORIES, COULEURS_BLOCS: COULEURS, NOMS_BLOCS, BROCHES_COMPOSANTS, brochesDe });
})(this);

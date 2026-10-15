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
  };

  // Broches proposées dans les menus.
  // Toutes les broches numériques D2 à D13 pour les LED et les boutons : c'est à l'élève de lire la consigne
  // et de choisir la bonne (le bloc de la palette part toujours de D2, il ne donne pas la réponse).
  const BROCHES_NUMERIQUES = ['D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13'];
  const BROCHES_LED = BROCHES_NUMERIQUES;
  const BROCHES_BOUTON = BROCHES_NUMERIQUES;
  const BROCHES_SERVO = ['D5', 'D6'];
  const menu = (liste) => liste.map((b) => [b, b]);
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
      tooltip: 'Range une valeur dans la boîte CHOIX.',
    },
    {
      type: 'variable',
      message0: '%1',
      args0: [{ type: 'field_label_serializable', name: 'VAR', text: 'CHOIX' }],
      output: 'Number',
      style: 'variable',
      tooltip: 'La valeur rangée dans la boîte CHOIX.',
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
  ];

  const FORMES_PALETTE = {
    attendre: { inputs: { DUREE: { shadow: { type: 'nombre', fields: { NUM: 1 } } } } },
    servo_angle: { inputs: { ANGLE: { shadow: { type: 'nombre', fields: { NUM: 90 } } } } },
    affecter: { inputs: { VALEUR: { shadow: { type: 'nombre', fields: { NUM: 0 } } } } },
    led_etat: { fields: { ETAT: '1', BROCHE: 'D2' } },
    quand_bouton: { fields: { BROCHE: 'D2', FRONT: 'appui' } },
    repeter_n: { inputs: { FOIS: { shadow: { type: 'nombre', fields: { NUM: 3 } } } } },
    ajouter_a: { inputs: { VALEUR: { shadow: { type: 'nombre', fields: { NUM: 1 } } } } },
    son: { fields: { BROCHE: 'D2' }, inputs: { FREQUENCE: { shadow: { type: 'nombre', fields: { NUM: 440 } } }, DUREE: { shadow: { type: 'nombre', fields: { NUM: 0.5 } } } } },
    operation: { inputs: { A: { shadow: { type: 'nombre', fields: { NUM: 1 } } }, B: { shadow: { type: 'nombre', fields: { NUM: 1 } } } } },
    hasard: { inputs: { MIN: { shadow: { type: 'nombre', fields: { NUM: 1 } } }, MAX: { shadow: { type: 'nombre', fields: { NUM: 6 } } } } },
  };

  // Palette d'un exercice : seulement ses blocs autorisés ; une catégorie vide n'apparaît pas.
  function palette(blocsAutorises, composants) {
    const autorises = new Set(blocsAutorises || []);
    // Les blocs de la palette ne donnent pas la broche de l'exercice : l'élève la choisit en lisant la consigne.
    void composants;
    const contenu = [];
    for (const cat of CATEGORIES) {
      const blocs = cat.blocs.filter((t) => autorises.has(t));
      if (!blocs.length) continue;
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
        contents: blocs.map((type) => {
          const forme = JSON.parse(JSON.stringify(FORMES_PALETTE[type] || {}));
          return Object.assign({ kind: 'block', type }, forme);
        }),
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

  Object.assign(A, { definirBlocs, palette, CATEGORIES, COULEURS_BLOCS: COULEURS });
})(this);

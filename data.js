// Contenu pédagogique. Tout est en français, pensé pour un enfant de 6 ans qui ne lit pas encore.

export const DOMAINS = [
  { id: 'syllabes', name: 'Syllabes', emoji: '🔤', color: 'var(--blue)', dark: 'var(--blue-d)', intro: 'On recopie des mots avec des syllabes.' },
  { id: 'lettres',  name: 'Écrire',   emoji: '✏️', color: 'var(--pink)', dark: 'var(--pink-d)', intro: 'On trace les lettres avec le doigt.' },
  { id: 'lire',     name: 'Lire',     emoji: '📖', color: 'var(--teal)', dark: 'var(--teal-d)', intro: 'On écoute et on trouve la bonne lettre.' },
  { id: 'compter',  name: 'Compter',  emoji: '🔢', color: 'var(--yellow)', dark: 'var(--yellow-d)', intro: 'On compte des petites choses.' },
  { id: 'dessin',   name: 'Dessiner', emoji: '🎨', color: 'var(--purple)', dark: 'var(--purple-d)', intro: 'On dessine un personnage kawaii, étape par étape.' },
  { id: 'equilibre',name: 'Équilibre',emoji: '🧱', color: 'var(--orange)', dark: 'var(--orange-d)', intro: 'On empile des blocs. Quand faut-il s’arrêter ?' },
  { id: 'quiz',     name: 'Quiz',     emoji: '💡', color: 'var(--green)', dark: 'var(--green-d)', intro: 'Des questions rigolotes et des choses à découvrir.' },
];

// Syllabes simples (consonne + voyelle)
export const SYLLABLES = ['MA','PA','LA','TO','RI','BU','SO','NI','MI','LO','PI','TA','BA','DO','FA','VO','MU','RA','SI','NO','CA','LU','RO','TU'];

// Mots découpés en syllabes, avec une image. Niveau = nombre de syllabes.
export const WORDS = [
  { w: 'MAMAN', s: ['MA','MAN'], e: '👩' },
  { w: 'PAPA', s: ['PA','PA'], e: '👨' },
  { w: 'BÉBÉ', s: ['BÉ','BÉ'], e: '👶' },
  { w: 'CHAT', s: ['CHAT'], e: '🐱' },
  { w: 'LAPIN', s: ['LA','PIN'], e: '🐰' },
  { w: 'VÉLO', s: ['VÉ','LO'], e: '🚲' },
  { w: 'MOTO', s: ['MO','TO'], e: '🏍️' },
  { w: 'LUNE', s: ['LU','NE'], e: '🌙' },
  { w: 'PIZZA', s: ['PI','ZZA'], e: '🍕' },
  { w: 'ROBOT', s: ['RO','BOT'], e: '🤖' },
  { w: 'TOMATE', s: ['TO','MA','TE'], e: '🍅' },
  { w: 'BANANE', s: ['BA','NA','NE'], e: '🍌' },
  { w: 'PIRATE', s: ['PI','RA','TE'], e: '🏴‍☠️' },
  { w: 'SOLEIL', s: ['SO','LEIL'], e: '☀️' },
  { w: 'CANARD', s: ['CA','NARD'], e: '🦆' },
  { w: 'PANDA', s: ['PAN','DA'], e: '🐼' },
  { w: 'KOALA', s: ['KO','A','LA'], e: '🐨' },
  { w: 'TORTUE', s: ['TOR','TUE'], e: '🐢' },
  { w: 'FUSÉE', s: ['FU','SÉE'], e: '🚀' },
  { w: 'GÂTEAU', s: ['GÂ','TEAU'], e: '🎂' },
  { w: 'LICORNE', s: ['LI','COR','NE'], e: '🦄' },
  { w: 'DINOSAURE', s: ['DI','NO','SAU','RE'], e: '🦕' },
  { w: 'PAPILLON', s: ['PA','PIL','LON'], e: '🦋' },
  { w: 'CHOCOLAT', s: ['CHO','CO','LAT'], e: '🍫' },
];

// Lettres à tracer, par niveau (formes simples d'abord)
export const LETTERS = [
  ['L','I','T','O','C','V'],
  ['A','E','U','N','M','H'],
  ['P','B','D','R','S','J'],
  ['F','G','K','Q','W','X','Y','Z'],
  ['1','2','3','4','5','6','7','8','9','0'],
];

// Son d'une lettre pour "Lire" : on dit le son, pas le nom, autant que possible
export const LETTER_SOUNDS = {
  A: 'a', E: 'e', I: 'i', O: 'o', U: 'u', M: 'mmm', L: 'lll', S: 'sss', R: 'rrr', F: 'fff', V: 'vvv', N: 'nnn', P: 'p', T: 't', B: 'b', D: 'd', C: 'k', J: 'j', Z: 'zzz', CH: 'ch',
};

// Images pour compter
export const COUNT_ITEMS = ['🍎','🍓','⭐','🐥','🎈','🌸','🐟','🍪','🚗','🦋','🐞','🍄'];

// Quiz : la question est lue à voix haute, les réponses sont des images.
export const QUIZ = [
  { q: 'Quel animal fait miaou ?', a: ['🐱','🐶','🐮'], ok: 0 },
  { q: 'Quel animal fait meuh ?', a: ['🐷','🐮','🐔'], ok: 1 },
  { q: 'Lequel vole dans le ciel ?', a: ['🐟','🐢','🐦'], ok: 2 },
  { q: 'Lequel vit dans l’eau ?', a: ['🐠','🐰','🐴'], ok: 0 },
  { q: 'Que met-on quand il pleut ?', a: ['🕶️','☂️','🧢'], ok: 1 },
  { q: 'Qu’est-ce qui est chaud ?', a: ['🧊','🍦','🔥'], ok: 2 },
  { q: 'Qu’est-ce qui est froid ?', a: ['🧊','☀️','🍲'], ok: 0 },
  { q: 'Lequel est un fruit ?', a: ['🥕','🍌','🥦'], ok: 1 },
  { q: 'Lequel est un légume ?', a: ['🍇','🍓','🥕'], ok: 2 },
  { q: 'Avec quoi se brosse-t-on les dents ?', a: ['🪥','🍴','🖌️'], ok: 0 },
  { q: 'Lequel roule sur la route ?', a: ['⛵','🚗','✈️'], ok: 1 },
  { q: 'Qu’est-ce qui brille la nuit ?', a: ['☀️','🌈','🌙'], ok: 2 },
  { q: 'Lequel a un long cou ?', a: ['🦒','🐭','🐸'], ok: 0 },
  { q: 'Que fait-on avec un ballon ?', a: ['🛏️','⚽','📚'], ok: 1 },
  { q: 'Lequel est tout petit ?', a: ['🐘','🦏','🐜'], ok: 2 },
  { q: 'Que met-on aux pieds ?', a: ['👟','🧤','🎩'], ok: 0 },
  { q: 'Lequel sent bon ?', a: ['🧦','🌹','🗑️'], ok: 1 },
  { q: 'Qu’est-ce qu’on mange au petit-déjeuner ?', a: ['🪨','🧱','🥐'], ok: 2 },
  { q: 'Lequel est un bébé chien ?', a: ['🐶','🐱','🐣'], ok: 0 },
  { q: 'Où dort-on ?', a: ['🚿','🛏️','🚪'], ok: 1 },
  { q: 'Lequel fait de la musique ?', a: ['🥄','🧹','🎸'], ok: 2 },
  { q: 'Lequel a des rayures ?', a: ['🦓','🐻','🐷'], ok: 0 },
  { q: 'Quel animal saute très haut ?', a: ['🐌','🦘','🐢'], ok: 1 },
  { q: 'Que fait le soleil ?', a: ['❄️','🌧️','☀️'], ok: 2 },
];

// Curiosité : une petite découverte lue à voix haute, puis une question.
export const FACTS = [
  { t: 'La girafe a une langue bleue, presque noire !', e: '🦒', q: 'De quelle couleur est la langue de la girafe ?', a: ['🟦','🟥','🟩'], ok: 0 },
  { t: 'Les papillons goûtent avec leurs pattes.', e: '🦋', q: 'Avec quoi le papillon goûte-t-il ?', a: ['👅','🦶','👂'], ok: 1 },
  { t: 'Les pieuvres ont trois cœurs.', e: '🐙', q: 'Combien de cœurs a la pieuvre ?', a: ['1','2','3'], ok: 2 },
  { t: 'Le cœur de la crevette est dans sa tête.', e: '🦐', q: 'Où est le cœur de la crevette ?', a: ['🧠','🦶','🍑'], ok: 0 },
  { t: 'Les escargots peuvent dormir pendant trois ans.', e: '🐌', q: 'Que fait l’escargot très longtemps ?', a: ['🏃','😴','🍽️'], ok: 1 },
  { t: 'Les abeilles dansent pour dire où sont les fleurs.', e: '🐝', q: 'Comment l’abeille montre-t-elle les fleurs ?', a: ['📣','✍️','💃'], ok: 2 },
  { t: 'Un éléphant ne peut pas sauter.', e: '🐘', q: 'Que ne sait pas faire l’éléphant ?', a: ['🦘','🚶','🚿'], ok: 0 },
  { t: 'Les flamants roses sont roses parce qu’ils mangent des crevettes roses.', e: '🦩', q: 'Pourquoi le flamant est-il rose ?', a: ['🎨','🦐','☀️'], ok: 1 },
  { t: 'La Lune est très loin : il faudrait 3 jours en fusée pour y aller.', e: '🌙', q: 'Avec quoi va-t-on sur la Lune ?', a: ['🚲','🚗','🚀'], ok: 2 },
  { t: 'Les dauphins dorment avec un seul œil fermé.', e: '🐬', q: 'Combien d’yeux le dauphin ferme-t-il pour dormir ?', a: ['1','2','0'], ok: 0 },
  { t: 'Les carottes étaient violettes autrefois.', e: '🥕', q: 'De quelle couleur étaient les carottes avant ?', a: ['🟦','🟪','⬛'], ok: 1 },
  { t: 'Un arc-en-ciel apparaît quand il y a du soleil et de la pluie en même temps.', e: '🌈', q: 'Qu’est-ce qu’il faut pour un arc-en-ciel ?', a: ['❄️','🌙','🌦️'], ok: 2 },
  { t: 'Les manchots ne volent pas, mais ils nagent très vite.', e: '🐧', q: 'Que fait très bien le manchot ?', a: ['🏊','🪂','🧗'], ok: 0 },
  { t: 'Les chats passent presque toute la journée à dormir.', e: '🐱', q: 'Que fait le chat presque toute la journée ?', a: ['🎮','😴','📚'], ok: 1 },
];

// Dessin guidé : personnages kawaii étape par étape (viewBox 0 0 200 200)
export const DRAWINGS = [
  { name: 'Chat', emoji: '🐱', steps: [
    { say: 'Un grand rond pour la tête.', d: 'M100,60 a60,55 0 1,0 0.1,0 z' },
    { say: 'Deux petits triangles pour les oreilles.', d: 'M55,70 L45,25 L85,52 Z M145,70 L155,25 L115,52 Z' },
    { say: 'Deux petits points pour les yeux.', d: 'M78,105 a5,6 0 1,0 0.1,0 z M122,105 a5,6 0 1,0 0.1,0 z' },
    { say: 'Un petit nez et une bouche qui sourit.', d: 'M100,118 l-6,-6 h12 z M94,128 q6,6 12,0 M88,128 q6,6 12,0' },
    { say: 'Les moustaches !', d: 'M70,118 h-30 M70,126 h-30 M130,118 h30 M130,126 h30' },
  ]},
  { name: 'Lapin', emoji: '🐰', steps: [
    { say: 'Un rond pour la tête.', d: 'M100,80 a52,50 0 1,0 0.1,0 z' },
    { say: 'Deux longues oreilles.', d: 'M80,40 a14,36 0 1,0 0.1,0 z M120,40 a14,36 0 1,0 0.1,0 z' },
    { say: 'Les yeux.', d: 'M82,120 a5,6 0 1,0 0.1,0 z M118,120 a5,6 0 1,0 0.1,0 z' },
    { say: 'Un nez et deux grandes dents.', d: 'M100,134 l-5,-5 h10 z M94,142 h12 v8 h-12 z M100,142 v8' },
    { say: 'Des joues toutes roses.', d: 'M70,138 a7,5 0 1,0 0.1,0 z M130,138 a7,5 0 1,0 0.1,0 z' },
  ]},
  { name: 'Ourson', emoji: '🐻', steps: [
    { say: 'Un gros rond pour la tête.', d: 'M100,95 a58,55 0 1,0 0.1,0 z' },
    { say: 'Deux oreilles toutes rondes.', d: 'M60,55 a16,16 0 1,0 0.1,0 z M140,55 a16,16 0 1,0 0.1,0 z' },
    { say: 'Les yeux.', d: 'M80,100 a5,6 0 1,0 0.1,0 z M120,100 a5,6 0 1,0 0.1,0 z' },
    { say: 'Le museau avec un nez.', d: 'M100,118 a20,14 0 1,0 0.1,0 z M100,115 a6,4 0 1,0 0.1,0 z' },
    { say: 'Un sourire.', d: 'M90,128 q10,8 20,0' },
  ]},
  { name: 'Étoile', emoji: '⭐', steps: [
    { say: 'Une grande étoile.', d: 'M100,30 L118,80 L170,80 L128,110 L145,165 L100,132 L55,165 L72,110 L30,80 L82,80 Z' },
    { say: 'Les yeux.', d: 'M88,100 a5,6 0 1,0 0.1,0 z M112,100 a5,6 0 1,0 0.1,0 z' },
    { say: 'Un grand sourire.', d: 'M88,114 q12,12 24,0' },
    { say: 'Des joues roses.', d: 'M76,110 a6,4 0 1,0 0.1,0 z M124,110 a6,4 0 1,0 0.1,0 z' },
  ]},
];

export const ENCOURAGE = ['Bravo !', 'Super !', 'Génial !', 'Trop fort !', 'Youpi !', 'Magnifique !', 'Bien joué !'];
export const RETRY = ['Presque !', 'On réessaie ?', 'Pas grave, encore un essai !', 'Tu y es presque !'];

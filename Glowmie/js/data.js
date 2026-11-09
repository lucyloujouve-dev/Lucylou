/* GLOWMIE — données de démonstration (100 % fictives) */
window.GLOW_SEED = (function () {
  const DAY = 86400000;

  const products = [
    {
      id: 'fresh-start', name: 'Fresh Start', tagline: 'Gel nettoyant doux', category: 'nettoyants',
      shape: "tube", body: "#F8B6D4", cap: "#F6ADCE", ink: "#C8217A", packshot: "assets/packshots/fresh-start.png", pack: { sub: "Gel nettoyant|doux visage", badge: "Nettoie • Purifie • Apaise", claim: "À l'aloe vera|et aux céramides" }, photos: ["foamHands", "washFace"],
      price: 15, compareAt: null, isNew: false, featured: true, active: true,
      variants: [{ id: "fs-125", label: "125 ml", price: 15, stock: 84 }, { id: "fs-250", label: "250 ml", price: 24, stock: 37 }],
      description: "Un gel fraîcheur qui mousse tout doux pour démarrer la journée sans tiraillement. Il élimine impuretés et excès de sébum en respectant le confort de la peau.",
      ingredients: ["Aqua", "Céramides", "Aloe vera", "Glycérine végétale", "Extrait de fraise", 'Coco-glucoside', 'Panthénol'],
      tips: "Matin et soir, sur peau humide. Masse 30 secondes en petits cercles, rince à l'eau tiède.",
      needs: ['sensible', 'imperfections', 'hydratation'], step: 'nettoyer', time: ['matin', 'soir'],
      rating: 5
    },
    {
      id: 'glow-drops', name: 'Glow Drops', tagline: 'Sérum hydratant éclat', category: 'serums',
      shape: "serum", body: "#F7A9C8", cap: "#F7B9D3", ink: "#C8217A", packshot: "assets/packshots/glow-drops.png", pack: { sub: "Sérum éclat", badge: "Hydrate • Repulpe • Illumine", oz: "1.0 FL. OZ." }, photos: ["serumDrops", "dropperSkin"],
      price: 24, compareAt: null, isNew: true, featured: true, active: true,
      variants: [{ id: 'gd-30', label: '30 ml', price: 24, stock: 62 }, { id: 'gd-50', label: '50 ml', price: 34, stock: 18 }],
      description: "Notre sérum star : quelques gouttes d'eau rose à l'acide hyaluronique et à la niacinamide pour une peau rebondie, lumineuse et glowy toute la journée.",
      ingredients: ['Aqua', 'Acide hyaluronique', 'Niacinamide 4 %', 'Extrait de pivoine', 'Glycérine', 'Vitamine E'],
      tips: "3 à 4 gouttes après le nettoyant, avant la crème. Tapote du bout des doigts jusqu'à absorption.",
      needs: ['eclat', 'hydratation'], step: 'traiter', time: ['matin', 'soir'],
      rating: 5
    },
    {
      id: 'daily-cloud', name: 'Daily Cloud', tagline: 'Crème hydratante nuage', category: 'hydratants',
      shape: "jar", body: "#F9DEA2", cap: "#F5B4CF", ink: "#C8217A", packshot: "assets/packshots/daily-cloud.png", pack: { sub: "Crème hydratante visage", badge: "Nourrit • Adoucit • Protège", oz: "1.7 FL. OZ." }, photos: ["swatchGrey", "cheekCream"],
      price: 22, compareAt: null, isNew: false, featured: true, active: true,
      variants: [{ id: 'dc-50', label: '50 ml', price: 22, stock: 55 }],
      description: "Une texture fouettée ultra-légère qui fond comme un nuage. Elle hydrate, apaise et laisse un fini velouté, parfait sous le maquillage.",
      ingredients: ['Aqua', 'Beurre de karité', 'Squalane végétal', "Céramides", "Panthénol", "Extrait de camomille"],
      tips: "Une noisette matin et soir sur le visage et le cou, en dernière étape de ta routine.",
      needs: ['hydratation', 'sensible'], step: 'hydrater', time: ['matin', 'soir'],
      rating: 5
    },
    {
      id: 'glow-routine', name: 'The Glow Routine', tagline: 'Coffret découverte', category: 'coffrets',
      shape: "set", body: "#F9C6DA", cap: "#F9C6DA", ink: "#C8217A", photos: ["collection", "smileTouch"],
      price: 49, compareAt: 61, isNew: false, featured: true, active: true,
      variants: [{ id: 'gr-std', label: 'Coffret 3 produits', price: 49, stock: 24 }],
      description: "Le trio gagnant réuni dans une jolie boîte : Fresh Start, Glow Drops et Daily Cloud. Tout pour une routine complète, à offrir… ou à s'offrir.",
      ingredients: ['Fresh Start 100 ml', 'Glow Drops 30 ml', 'Daily Cloud 50 ml', 'Bandeau éponge Glowmie'],
      tips: "Nettoie avec Fresh Start, applique Glow Drops, termine avec Daily Cloud. Matin et soir.",
      needs: ['eclat', 'hydratation', 'sensible', 'imperfections'], step: 'coffret', time: ['matin', 'soir'],
      rating: 5
    },
    {
      id: 'melt-in', name: 'Melt In', tagline: 'Baume démaquillant fondant', category: 'nettoyants',
      shape: "jar", packshot: "assets/packshots/melt-in.png?v=hd2", body: "#DCC8F4", cap: "#D2BBF0", ink: "#C8217A", pack: { sub: "Baume démaquillant", badge: "Démaquille • Nourrit", claim: "À l'huile de framboise" }, photos: ["creamSwirl", "applyBright"],
      price: 19, compareAt: null, isNew: true, featured: false, active: true,
      variants: [{ id: "mi-100", label: "100 ml", price: 19, stock: 41 }],
      description: "Un baume à l'huile de jojoba et à la vitamine E qui se transforme en huile au contact de la peau puis en lait à l'eau. Il fait fondre maquillage et crème solaire en douceur.",
      ingredients: ['Huile de jojoba', 'Vitamine E', 'Cire de riz', 'Huile de tournesol', 'Polysorbate végétal'],
      tips: "Le soir, sur peau sèche. Masse, émulsionne avec un peu d'eau, puis rince. Enchaîne avec Fresh Start.",
      needs: ['sensible', 'hydratation'], step: 'demaquiller', time: ['soir'],
      rating: 5
    },
    {
      id: 'tone-glow', name: 'Tone & Glow', tagline: "Lotion tonique perfectrice", category: 'soins',
      shape: "tall", packshot: "assets/packshots/tone-glow.png?v=cut", body: "#F4C6E4", cap: "#ECB4DC", ink: "#C8217A", pack: { sub: "Lotion tonique|perfectrice", badge: "Affine • Lisse • Illumine", claim: "À l'acide lactique|et à l'eau de rose" }, photos: ["bubbles", "touchFace"],
      price: 17, compareAt: 20, isNew: false, featured: false, active: true,
      variants: [{ id: "tg-200", label: "200 ml", price: 17, stock: 33 }],
      description: "Une lotion légère aux acides de fruits doux qui affine le grain de peau et prépare à recevoir le sérum. Fini lisse et frais.",
      ingredients: ["Aqua", "Extrait de rose", "Niacinamide", "Acide lactique doux", "Glycérine", "Panthénol"],
      tips: "Le soir, sur un coton ou directement dans les mains, après le nettoyant. 2 à 3 fois par semaine pour commencer.",
      needs: ['imperfections', 'eclat'], step: 'tonifier', time: ['soir'],
      rating: 5
    },
    {
      id: 'sun-sunny', name: 'Sun Sunny', tagline: 'Fluide protecteur SPF 50', category: 'protection',
      shape: "tube", packshot: "assets/packshots/sun-sunny.png?v=hd2", body: "#FBE193", cap: "#F8D87A", ink: "#C8217A", pack: { sub: "Fluide protecteur|SPF 50", badge: "Protège • Hydrate", claim: "À la niacinamide|et à la vitamine E" }, photos: ["swatchButter", "smileGlow"],
      price: 21, compareAt: null, isNew: true, featured: false, active: true,
      variants: [{ id: 'ss-50', label: '50 ml', price: 21, stock: 12 }],
      description: "Le fluide solaire qui ne laisse ni trace blanche ni effet gras. Fini invisible, il se porte tous les jours, même en ville.",
      ingredients: ['Aqua', 'Filtres solaires', 'Niacinamide', 'Extrait de pastèque', 'Vitamine E'],
      tips: "Chaque matin en dernière étape, généreusement. Renouvelle en cas d'exposition prolongée.",
      needs: ['eclat', 'imperfections', 'sensible', 'hydratation'], step: 'proteger', time: ['matin'],
      rating: 5
    },
    {
      id: 'dew-me', name: 'Dew Me', tagline: "Baume à lèvres nourrissant", category: 'soins',
      shape: "gloss", packshot: "assets/packshots/dew-me.png?v=hd2", body: "#F2588C", cap: "#F2709D", ink: "#FFFFFF", pack: { sub: "Gloss baume" }, photos: ["texturePink", "headband"],
      price: 9, compareAt: null, isNew: false, featured: false, active: true,
      variants: [{ id: "dm-15", label: "15 ml", price: 9, stock: 120 }],
      description: "Un baume fondant au parfum gourmand qui nourrit les lèvres et laisse un voile rosé brillant.",
      ingredients: ['Beurre de karité', 'Huile de coco', 'Cire de candelilla', 'Huile de jojoba', 'Vitamine E'],
      tips: "Aussi souvent que tu veux, et en couche épaisse le soir comme masque de nuit.",
      needs: ['hydratation', 'sensible'], step: 'bonus', time: ['matin', 'soir'],
      rating: 5
    }
    ,
    {
      id: 'peel-party', name: 'Peel Party', tagline: 'Gommage doux visage', category: 'nettoyants',
      shape: 'tube', packshot: "assets/packshots/peel-party.png?v=hd2", body: '#D9C4F5', cap: '#CDB2F0', ink: '#C8217A', pack: { sub: 'Gommage doux|visage', badge: 'Lisse • Affine • Illumine', claim: 'Aux microbilles végétales|et à l’enzyme de papaye' }, photos: ['creamSwirl', 'applyBright'],
      price: 18, compareAt: null, isNew: true, featured: false, active: true,
      variants: [{ id: 'pp-75', label: '75 ml', price: 18, stock: 46 }],
      description: "Un gommage tout doux aux grains de jojoba et à l'extrait de myrtille. Il lisse le grain de peau et réveille l'éclat, sans jamais irriter.",
      ingredients: ['Aqua', 'Grains de jojoba', 'Extrait de myrtille', 'Glycérine', 'Aloe vera', 'Enzyme de papaye'],
      tips: "1 à 2 fois par semaine, sur peau humide. Masse en petits cercles en évitant le contour des yeux, puis rince.",
      needs: ['eclat', 'imperfections'], step: 'exfolier', time: ['soir'], rating: 5
    },
    {
      id: 'clear-crush', name: 'Clear Crush', tagline: 'Sérum anti-imperfections', category: 'serums',
      shape: 'serum', packshot: "assets/packshots/clear-crush.png?v=hd2", body: '#F8C3A6', cap: '#F6B396', ink: '#C8217A', pack: { sub: 'Sérum purifiant', badge: 'Purifie • Matifie • Apaise', claim: 'À l’acide salicylique|et au zinc' }, photos: ['bubbles', 'touchFace'],
      price: 22, compareAt: null, isNew: true, featured: false, active: true,
      variants: [{ id: 'cc-30', label: '30 ml', price: 22, stock: 38 }],
      description: "Le sérum qui calme les petites imperfections sans dessécher. 10 % de niacinamide pour resserrer les pores et unifier le teint, du zinc PCA pour réguler la brillance.",
      ingredients: ['Aqua', 'Niacinamide 10 %', 'Zinc PCA', 'Extrait de thé vert', 'Glycérine', 'Allantoïne'],
      tips: "Le soir, 2 à 3 gouttes sur les zones concernées ou tout le visage. Commence 3 soirs par semaine.",
      needs: ['imperfections'], step: 'traiter', time: ['soir'], rating: 5
    },
    {
      id: 'night-bloom', name: 'Night Bloom', tagline: 'Crème de nuit repulpante', category: 'hydratants',
      shape: 'jar', packshot: "assets/packshots/night-bloom.png?v=hd2", body: '#E9D3F6', cap: '#F3A9CB', ink: '#C8217A', pack: { sub: 'Crème de nuit', badge: 'Repulpe • Nourrit • Répare', claim: 'Au bakuchiol|et à la pivoine' }, photos: ['texturePink', 'smileTouch'],
      price: 26, compareAt: 30, isNew: true, featured: false, active: true,
      variants: [{ id: 'nb-50', label: '50 ml', price: 26, stock: 29 }],
      description: "Une crème riche et fondante qui travaille pendant que tu dors. Acide hyaluronique et collagène hydratent, lissent et raffermissent : réveil peau toute douce garanti.",
      ingredients: ["Aqua", "Acide hyaluronique", "Collagène végétal", "Beurre de karité", "Squalane", "Céramides"],
      tips: "Le soir, en dernière étape. Une noisette suffit, masse vers le haut jusqu’à absorption.",
      needs: ['hydratation', 'eclat'], step: 'nuit', time: ['soir'], rating: 5
    },
    {
      id: 'eye-love', name: 'Eye Love', tagline: 'Roll-on contour des yeux', category: 'soins',
      shape: 'gloss', packshot: "assets/packshots/eye-love.png?v=hd2", body: '#F7C9DE', cap: '#F2A5C6', ink: '#FFFFFF', pack: { sub: 'Roll-on regard' }, photos: ['underEye', 'cheekSmile'],
      price: 19, compareAt: null, isNew: false, featured: false, active: true,
      variants: [{ id: 'el-15', label: '15 ml', price: 19, stock: 52 }],
      description: "La bille fraîche qui réveille le regard en 10 secondes. Caféine et acide hyaluronique pour défroisser les petites mines du matin.",
      ingredients: ['Aqua', 'Caféine', 'Acide hyaluronique', 'Extrait de concombre', 'Panthénol'],
      tips: "Matin et soir, fais rouler la bille de l’intérieur vers l’extérieur sous l’œil, puis tapote.",
      needs: ['eclat', 'hydratation'], step: 'yeux', time: ['matin', 'soir'], rating: 5
    },
    {
      id: 'jelly-mist', name: 'Jelly Mist', tagline: 'Brume hydratante fraîcheur', category: 'soins',
      shape: 'tall', packshot: "assets/packshots/jelly-mist.png?v=hd2", body: '#CDEBDD', cap: '#F6B4D0', ink: '#C8217A', pack: { sub: 'Brume hydratante', badge: 'Rafraîchit • Hydrate', claim: 'À l’eau de pastèque|et à l’aloe vera' }, photos: ['foam', 'smileGlow'],
      price: 16, compareAt: null, isNew: false, featured: false, active: true,
      variants: [{ id: 'jm-100', label: '100 ml', price: 16, stock: 64 }],
      description: "Un nuage de fraîcheur à vaporiser à tout moment : sur peau nue, avant la crème ou par-dessus le maquillage pour le fixer.",
      ingredients: ["Eau de rose", "Aloe vera", "Glycérine", "Acide hyaluronique", "Eau de pastèque"],
      tips: "Vaporise à 20 cm du visage, yeux fermés. Parfait en pause dans la journée ou après le sport.",
      needs: ['hydratation', 'sensible'], step: 'bonus', time: ['matin', 'soir'], rating: 5
    },
    {
      id: 'mask-up', name: 'Mask Up', tagline: 'Masque argile rose purifiant', category: 'masques',
      shape: 'jar', packshot: "assets/packshots/mask-up.png?v=hd2", body: '#F7B8CF', cap: '#F7B8CF', ink: '#FFFFFF', pack: { sub: 'Masque purifiant', badge: 'Purifie • Resserre', claim: 'À l’argile rose' }, photos: ['swatchBeige', 'maskLaugh'],
      price: 20, compareAt: null, isNew: true, featured: false, active: true,
      variants: [{ id: 'mu-75', label: '75 ml', price: 20, stock: 33 }],
      description: "Un masque crémeux à l'argile rose et à l'extrait de citron qui purifie les pores en douceur et laisse la peau nette, fraîche et toute douce.",
      ingredients: ["Argile rose", "Extrait de citron", "Kaolin", "Aloe vera", "Glycérine", "Panthénol"],
      tips: "1 à 2 fois par semaine, en couche épaisse sur peau propre. Laisse poser 10 minutes, rince à l’eau tiède.",
      needs: ['imperfections', 'eclat'], step: 'masque', time: ['soir'], rating: 5
    }
  ];

  const categories = [
    { id: 'nettoyants', label: 'Nettoyants' },
    { id: 'serums', label: 'Sérums' },
    { id: 'hydratants', label: 'Hydratants' },
    { id: 'protection', label: 'Protection' },
    { id: 'soins', label: 'Soins ciblés' },
    { id: 'masques', label: 'Masques' },
    { id: 'coffrets', label: 'Coffrets' }
  ];

  const articles = [
    {
      id: 'routine-3-etapes', photo: "armDots", title: 'La routine en 3 étapes qui suffit (vraiment)', tag: 'Routine', minutes: 4, color: '#F5A9CB',
      excerpt: "Pas besoin de dix produits pour une jolie peau. Nettoyer, traiter, hydrater : on t'explique tout.",
      body: [
        "On a tendance à croire qu'une bonne routine doit être longue. En réalité, la régularité compte bien plus que le nombre de produits.",
        "Étape 1, nettoyer : un gel doux matin et soir enlève ce qui s'est déposé sur la peau sans la décaper.",
        "Étape 2, traiter : c'est le moment du sérum, la formule concentrée qui répond à ton envie du moment (éclat, confort, grain de peau).",
        "Étape 3, hydrater : une crème adaptée scelle le tout. Et le matin, on n'oublie pas la protection solaire.",
        "Le petit plus : écoute ta peau, avance doucement quand tu ajoutes un produit, et garde le plaisir au centre."
      ]
    },
    {
      id: 'mythes-skincare', photo: "underEye", title: '5 idées reçues sur le skincare', tag: 'Décryptage', minutes: 5, color: '#C9B5F2',
      excerpt: "« Les peaux grasses n'ont pas besoin de crème » … vraiment ? On démêle le vrai du faux.",
      body: [
        "Idée reçue n°1 : une peau qui brille n'a pas besoin d'hydratation. Faux : toutes les peaux ont besoin d'eau, il suffit de choisir une texture légère.",
        "Idée reçue n°2 : plus ça picote, plus ça agit. Faux : l'inconfort n'est jamais un bon signe.",
        "Idée reçue n°3 : le SPF, c'est seulement l'été. Faux : les UV sont là toute l'année.",
        "Idée reçue n°4 : il faut changer de produits souvent. Pas forcément : si ta routine te convient, garde-la !",
        "Idée reçue n°5 : le skincare doit être compliqué. Jamais chez Glowmie."
      ]
    },
    {
      id: 'glow-du-matin', photo: "cheekSmile", title: 'Le glow du matin en 5 minutes chrono', tag: 'Astuce', minutes: 3, color: '#F9E49A',
      excerpt: "Réveil difficile ? Voici notre mini-rituel express pour un teint frais avant les cours.",
      body: [
        "Minute 1 : un passage d'eau fraîche ou de Fresh Start pour réveiller la peau.",
        "Minute 2 : trois gouttes de Glow Drops tapotées du bout des doigts.",
        "Minute 3 : une noisette de Daily Cloud en lissant vers l'extérieur.",
        "Minute 4 : Sun Sunny, même s'il fait gris.",
        "Minute 5 : Dew Me sur les lèvres… et sourire au miroir, obligatoire."
      ]
    },
    {
      id: 'lire-une-etiquette', photo: "serumPink", title: 'Comment lire une liste d’ingrédients', tag: 'Décryptage', minutes: 6, color: '#FFDDEB',
      excerpt: "INCI, ordre des ingrédients, pourcentages : le guide simple pour comprendre tes produits.",
      body: [
        "La liste INCI est classée par ordre décroissant de concentration : le premier ingrédient est le plus présent.",
        "Sous 1 %, l'ordre devient libre : ne t'arrête pas à la position d'un actif pour juger son efficacité.",
        "Les noms latins désignent souvent des extraits de plantes, les noms anglais les ingrédients transformés.",
        "Chez Glowmie, chaque fiche produit détaille sa composition dans un langage simple.",
        "En cas de doute ou de réaction, demande conseil à un pharmacien ou à un dermatologue."
      ]
    }
  ];

  const promos = [
    { code: 'HELLOGLOW', type: 'percent', value: 10, active: true, label: '-10 % sur ta première commande' },
    { code: 'GLOWCLUB', type: 'percent', value: 15, active: true, label: '-15 % membres Glow Club' },
    { code: 'FREESHIP', type: 'shipping', value: 0, active: true, label: 'Livraison offerte' }
  ];

  const automations = [
    { id: 'welcome', name: 'Bienvenue', trigger: 'newsletter_signup', delayDays: 0, active: true, subject: 'Bienvenue dans la team Glowmie ✨', desc: "Email de bienvenue envoyé seulement si le consentement newsletter est valide." },
    { id: 'quiz', name: 'Résultat du quiz', trigger: 'quiz_completed', delayDays: 0, active: true, subject: 'Ta routine Glowmie personnalisée', desc: "Envoie le résultat du quiz et les produits recommandés (si consentement)." },
    { id: 'abandoned', name: 'Panier abandonné', trigger: 'checkout_abandoned', delayDays: 1, active: true, subject: 'Ton panier t’attend 💗', desc: "Un seul rappel 24 h après un panier abandonné, uniquement si la cliente a consenti aux emails." },
    { id: 'post7', name: 'Conseils J+7', trigger: 'order_placed', delayDays: 7, active: true, subject: 'Tes conseils d’utilisation', desc: "7 jours après l'achat : conseils pour bien utiliser les produits commandés." },
    { id: 'post45', name: 'Réapprovisionnement J+45', trigger: 'order_placed', delayDays: 45, active: true, subject: 'Bientôt à court ?', desc: "45 jours après l'achat : suggestion de réapprovisionnement." },
    { id: 'vip', name: 'Invitation VIP', trigger: 'second_order', delayDays: 0, active: true, subject: 'Bienvenue au Glow Club VIP 👑', desc: "À la deuxième commande : invitation au Glow Club VIP." }
  ];

  /* ---------- génération déterministe des clients / commandes ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const r = rng(20261031);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const firsts = ['Léa', 'Chloé', 'Manon', 'Inès', 'Camille', 'Jade', 'Lina', 'Zoé', 'Emma', 'Louise', 'Sarah', 'Maëlys', 'Clara', 'Anaïs', 'Yasmine', 'Lou', 'Nina', 'Romane', 'Eva', 'Juliette', 'Mila', 'Alice', 'Ambre', 'Lola', 'Rose', 'Sofia', 'Margaux', 'Océane', 'Lucas', 'Hugo', 'Noah', 'Théo', 'Nathan', 'Elisa', 'Aya', 'Imane', 'Capucine', 'Salomé', 'Agathe', 'Victoire'];
  const lasts = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'François', 'Martinez', 'Benali'];
  const cities = ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Lille', 'Nantes', 'Toulouse', 'Rennes', 'Nice', 'Strasbourg', 'Montpellier', 'Grenoble'];
  const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const now = Date.now();
  const customers = [], orders = [], events = [], logs = [], quizResults = [], visits = {};
  for (let d = 0; d < 180; d++) {
    const day = new Date(now - d * DAY).toISOString().slice(0, 10);
    visits[day] = 38 + Math.floor(r() * 30) + (d < 30 ? 12 : 0);
  }

  let orderNo = 1000;
  const statuses = ['livree', 'livree', 'livree', 'expediee', 'en_preparation', 'payee'];
  const NCUST = 150;
  for (let i = 0; i < NCUST; i++) {
    const fn = pick(firsts), ln = pick(lasts);
    const created = now - Math.floor(Math.pow(r(), 1.25) * 175 + 1) * DAY - Math.floor(r() * DAY);
    const c = {
      id: 'c' + (i + 1), firstName: fn, lastName: ln,
      email: strip(fn) + '.' + strip(ln) + (i % 7 === 0 ? i : '') + '@exemple.fr',
      phone: '06 ' + [0, 0, 0, 0].map(() => String(10 + Math.floor(r() * 89))).join(' '),
      city: pick(cities), birthYear: 1996 + Math.floor(r() * 12),
      createdAt: created, role: 'customer', pwd: null,
      consent: { newsletter: r() < 0.72, quiz: r() < 0.5, date: created },
      points: 0, notes: '', favorites: [], addresses: []
    };
    c.addresses.push({ label: 'Maison', line: (1 + Math.floor(r() * 120)) + ' rue des Lilas', zip: String(10000 + Math.floor(r() * 85000)), city: c.city });
    customers.push(c);
    events.push({ id: 'e' + events.length, type: 'account_created', customerId: c.id, at: created });
    if (c.consent.newsletter) {
      events.push({ id: 'e' + events.length, type: 'newsletter_signup', customerId: c.id, at: created + 60000 });
      logs.push({ id: 'l' + logs.length, automationId: 'welcome', customerId: c.id, at: created + 120000, status: 'envoye', opened: r() < 0.62, clicked: r() < 0.28 });
    }
    // nombre de commandes
    const roll = r();
    const n = roll < 0.22 ? 0 : roll < 0.55 ? 1 : roll < 0.78 ? 2 : roll < 0.92 ? 3 : 4 + Math.floor(r() * 3);
    let t = created + Math.floor(r() * 5) * DAY;
    for (let k = 0; k < n && t < now; k++) {
      const items = [];
      const nItems = 1 + Math.floor(r() * 2.6);
      const used = new Set();
      for (let j = 0; j < nItems; j++) {
        const p = r() < 0.32 ? products[Math.floor(r() * 4)] : pick(products);
        if (used.has(p.id)) continue; used.add(p.id);
        const v = pick(p.variants);
        items.push({ productId: p.id, variantId: v.id, name: p.name, variant: v.label, qty: r() < 0.85 ? 1 : 2, price: v.price });
      }
      const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
      const promo = r() < 0.18 ? 'HELLOGLOW' : null;
      const discount = promo ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
      const shipping = subtotal - discount >= 35 ? 0 : 4.9;
      const age = (now - t) / DAY;
      let status = age > 9 ? 'livree' : age > 4 ? pick(['expediee', 'livree']) : pick(statuses);
      if (r() < 0.035) status = 'annulee';
      const total = Math.round((subtotal - discount + shipping) * 100) / 100;
      const o = {
        id: 'o' + orderNo, number: 'GLW-' + orderNo, customerId: c.id, items, subtotal, discount, shipping, total, promo,
        status, createdAt: t,
        payment: { provider: 'stripe_test', status: status === 'annulee' ? 'rembourse' : 'reussi', last4: '4242', ref: 'pi_test_' + Math.floor(r() * 1e10).toString(36) },
        shippingInfo: { carrier: pick(['Colissimo', 'Mondial Relay']), tracking: status === 'expediee' || status === 'livree' ? 'FR' + Math.floor(r() * 1e9) : null, address: c.addresses[0] }
      };
      orderNo++;
      orders.push(o);
      if (status !== 'annulee') c.points += Math.round(total * 10);
      events.push({ id: 'e' + events.length, type: 'order_placed', customerId: c.id, at: t, data: { orderId: o.id } });
      if (c.consent.newsletter) {
        [['post7', 7], ['post45', 45]].forEach(([aid, dd]) => {
          const at = t + dd * DAY;
          logs.push({ id: 'l' + logs.length, automationId: aid, customerId: c.id, at, status: at < now ? 'envoye' : 'planifie', orderId: o.id, opened: at < now && r() < 0.55, clicked: at < now && r() < 0.22, converted: aid === 'post45' && at < now && r() < 0.14 });
        });
        if (k === 1) logs.push({ id: 'l' + logs.length, automationId: 'vip', customerId: c.id, at: t + 3600000, status: 'envoye', opened: r() < 0.7, clicked: r() < 0.35 });
      }
      t += Math.floor(18 + r() * 50) * DAY;
    }
    if (c.consent.quiz || r() < 0.2) {
      const qAt = created + Math.floor(r() * 3) * DAY;
      quizResults.push({ id: 'q' + quizResults.length, customerId: c.id, at: qAt, answers: { besoin: pick(['eclat', 'hydratation', 'sensible', 'imperfections']), routine: pick(['mini', 'complete']), budget: pick(['petit', 'moyen', 'plaisir']) }, products: ['glow-drops', 'daily-cloud'] });
      if (c.consent.newsletter) logs.push({ id: 'l' + logs.length, automationId: 'quiz', customerId: c.id, at: qAt + 60000, status: 'envoye', opened: r() < 0.68, clicked: r() < 0.4, converted: r() < 0.2 });
    }
    if (r() < 0.12) {
      const at = now - Math.floor(r() * 25) * DAY;
      events.push({ id: 'e' + events.length, type: 'checkout_abandoned', customerId: c.id, at });
      if (c.consent.newsletter) logs.push({ id: 'l' + logs.length, automationId: 'abandoned', customerId: c.id, at: at + DAY, status: at + DAY < now ? 'envoye' : 'planifie', opened: r() < 0.5, clicked: r() < 0.25, converted: r() < 0.18 });
    }
  }
  // quelques notes CRM
  customers[0].notes = 'Cliente très active sur Instagram, a tagué la marque 3 fois.';

  // compte cliente de démonstration (connexion possible) : la cliente fictive qui a le plus de commandes
  const demoHash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i); return 'h' + (h >>> 0).toString(16); };
  const demo = customers.slice().sort((a, b) => orders.filter((o) => o.customerId === b.id).length - orders.filter((o) => o.customerId === a.id).length)[0];
  Object.assign(demo, { firstName: 'Léa', lastName: 'Martin', email: 'lea@glowmie.fr', pwd: demoHash('glowmie2026'), city: 'Paris', notes: 'Compte de démonstration pour la présentation.', favorites: ['glow-drops', 'daily-cloud', 'night-bloom'] });
  demo.consent.newsletter = true; demo.consent.quiz = true;
  demo.addresses = [{ label: 'Maison', line: '12 rue des Lilas', zip: '75011', city: 'Paris' }];
  customers[3].notes = 'Peau sensible déclarée : privilégier Daily Cloud et Melt In.';

  // avis clients (tous 5 étoiles) : [auteur, texte, il y a N jours]
  const reviewSeed = {
    'fresh-start': [
      ['Lina', "Doux et frais, l'odeur de fraise est discrète. Top le matin pour se réveiller.", 13],
      ['Manon', "Enfin un nettoyant qui ne tiraille pas ! Ma peau est propre mais toujours confortable.", 22],
      ['Sarah', "Je l'utilise matin et soir depuis un mois, plus aucune sensation de peau sèche.", 35],
      ['Jade', "La mousse est super légère et le tube rose est trop mignon dans ma salle de bain.", 41],
      ['Inès', "Parfait pour ma peau sensible, aucune rougeur. Je rachète déjà le format 250 ml.", 58],
      ['Clara', "Il enlève bien les impuretés sans décaper. Mon chouchou du quotidien.", 72],
      ['Romane', "Texture gel fraîche, ça rince en deux secondes. Exactement ce que je cherchais.", 90]
    ],
    'glow-drops': [
      ['Inès', "Ma peau est toute rebondie, et la couleur rose du flacon est trop jolie sur ma coiffeuse.", 12],
      ['Camille', "Texture eau, absorbée en 2 secondes. Je rachète !", 30],
      ['Zoé', "Mon teint est beaucoup plus lumineux, même après mes nuits de révisions.", 18],
      ['Lou', "Trois gouttes le matin et j'ai un glow naturel toute la journée.", 26],
      ['Maëlys', "Je l'avais pris pour essayer, maintenant je ne peux plus m'en passer.", 44],
      ['Yasmine', "Ma peau boit littéralement ce sérum. Hydratée sans aucun effet collant.", 51],
      ['Eva', "La pipette est super pratique et le résultat se voit dès la première semaine.", 63],
      ['Alice', "Meilleur sérum que j'ai testé pour ce prix, et il sent bon en plus.", 80],
      ['Nina', "Il passe parfaitement sous le maquillage, mon fond de teint tient mieux.", 97],
      ['Ambre', "Ma peau a retrouvé de l'éclat en quelques jours. Coup de cœur absolu 💗", 120]
    ],
    'daily-cloud': [
      ['Jade', "Elle porte bien son nom, on dirait de la chantilly.", 8],
      ['Louise', "Ma peau sèche est enfin confortable toute la journée, même en hiver.", 19],
      ['Chloé', "Le pot jaune et rose est adorable et la crème fond instantanément.", 27],
      ['Margaux', "Hydratation au top sans effet gras. Parfaite sous le maquillage.", 39],
      ['Lola', "Je l'applique le soir, et le matin ma peau est toute douce. Un vrai nuage.", 55],
      ['Sofia', "Même ma peau sensible l'adore, aucune réaction. Je recommande les yeux fermés.", 68],
      ['Emma', "L'odeur est délicate et la texture fouettée est un vrai plaisir à appliquer.", 85],
      ['Anaïs', "Deuxième pot terminé, c'est devenu un indispensable de ma routine.", 110]
    ],
    'glow-routine': [
      ['Margaux', "Offert à ma sœur, elle a adoré la boîte !", 15],
      ['Agathe', "Parfait pour découvrir la marque, les trois produits vont super bien ensemble.", 28],
      ['Capucine', "Super rapport qualité-prix et la routine est simple à suivre.", 46],
      ['Victoire', "Je l'ai pris pour mon anniversaire, ma peau n'a jamais été aussi belle.", 61],
      ['Salomé', "Le packaging est trop beau, idéal en cadeau. Et les produits sont top.", 77],
      ['Rose', "Routine complète en 3 étapes, je gagne du temps le matin et ma peau rayonne.", 95]
    ],
    'melt-in': [
      ['Lou', "Il fait fondre tout mon maquillage, même le mascara, sans frotter.", 9],
      ['Elisa', "La transformation baume, huile puis lait est magique. Peau ultra douce après.", 24],
      ['Imane', "Je ne démaquille plus jamais autrement, c'est un vrai moment de détente.", 40],
      ['Mila', "Parfait pour enlever le SPF le soir, et ça sent la framboise.", 66],
      ['Juliette', "Aucun film gras après le rinçage, ma peau est nette et nourrie.", 88]
    ],
    'tone-glow': [
      ['Océane', "Mon grain de peau est beaucoup plus lisse en quelques semaines.", 14],
      ['Lucas', "Doux, ne pique pas du tout et mes pores sont moins visibles.", 33],
      ['Aya', "L'eau de rose sent divinement bon, j'adore ce petit geste le soir.", 49],
      ['Chloé', "Ma peau mixte est plus équilibrée, fini la zone T qui brille.", 74]
    ],
    'sun-sunny': [
      ['Zoé', "Enfin un SPF sans trace blanche, je le mets tous les matins.", 1],
      ['Hugo', "Fini invisible, même sur peau mate. Aucun effet gras, parfait pour la ville.", 17],
      ['Nina', "Il ne pique pas les yeux, même quand je fais du sport.", 31],
      ['Lina', "Texture ultra fluide qui passe super bien sous le maquillage.", 48],
      ['Camille', "Mon SPF préféré, léger et hydratant. Le tube jaune est trop joli !", 70],
      ['Emma', "J'ai passé tout l'été avec et ma peau est restée parfaite.", 103]
    ],
    'peel-party': [
      ['Clara', "Ma peau est toute lisse dès la première utilisation, et ça ne gratte pas du tout.", 5],
      ['Agathe', "Le petit gommage du dimanche soir, devenu mon rituel préféré.", 19],
      ['Mila', "Les microbilles sont super fines, parfait pour ma peau sensible.", 34],
      ['Sarah', "Mon teint est beaucoup plus lumineux, mon fond de teint s'applique mieux.", 52]
    ],
    'clear-crush': [
      ['Imane', "Mes petits boutons ont disparu en une semaine sans que ma peau sèche.", 7],
      ['Théo', "Enfin un sérum anti-imperfections qui ne pique pas. Ma peau est plus nette.", 23],
      ['Océane', "Ma zone T brille beaucoup moins, je l'adore.", 38],
      ['Lina', "Texture légère et flacon pêche trop mignon. Résultats visibles rapidement.", 57],
      ['Nathan', "Mes pores sont moins visibles, je recommande à 100 %.", 75]
    ],
    'night-bloom': [
      ['Juliette', "Je me réveille avec une peau repulpée et toute douce, c'est magique.", 4],
      ['Rose', "Riche mais pas grasse, et l'odeur de pivoine est divine.", 16],
      ['Eva', "Ma peau a l'air reposée même quand je dors peu.", 29],
      ['Capucine', "Le pot est sublime sur ma table de nuit. Et la crème est incroyable.", 44],
      ['Margaux', "Mon nouveau secret pour un teint frais le matin.", 61],
      ['Alice', "Une vraie crème cocooning, ma peau sèche l'adore.", 79]
    ],
    'eye-love': [
      ['Zoé', "La bille est super fraîche, parfait après une nuit de révisions !", 3],
      ['Lou', "Mes cernes sont moins marqués le matin, j'en suis fan.", 20],
      ['Aya', "Petit format pratique, je le glisse dans mon sac.", 36],
      ['Inès', "Effet bonne mine immédiat sous les yeux, je ne m'en passe plus.", 54]
    ],
    'jelly-mist': [
      ['Chloé', "Un vrai coup de frais en plein été, je la vaporise toute la journée.", 2],
      ['Hugo', "Parfaite après le sport, ma peau respire.", 18],
      ['Emma', "Elle fixe mon maquillage et sent la pastèque, trop bien.", 32],
      ['Salomé', "Hydratation instantanée, et le flacon vert et rose est adorable.", 47],
      ['Léa', "Je l'ai toujours sur mon bureau, c'est ma pause bien-être.", 66]
    ],
    'mask-up': [
      ['Anaïs', "Peau nette et douce en 10 minutes, mon moment spa du dimanche.", 6],
      ['Jade', "Il ne dessèche pas du tout contrairement aux autres masques à l'argile.", 25],
      ['Yasmine', "Mes pores sont resserrés et mon teint est plus uniforme.", 41],
      ['Victoire', "Couleur rose trop jolie et résultat bluffant. Je rachète !", 63]
    ],
    'dew-me': [
      ['Rose', "Mes lèvres sont toutes douces et le petit voile rosé est trop beau.", 6],
      ['Ambre', "Gourmand sans être collant, je l'ai toujours dans mon sac.", 21],
      ['Léa', "Le parfum fraise est irrésistible, et il hydrate vraiment.", 37],
      ['Juliette', "Je l'applique en couche épaisse le soir, au réveil mes lèvres sont parfaites.", 59],
      ['Noah', "Offert à ma copine, elle l'adore. Il est déjà presque fini !", 82]
    ]
  };
  let rn = 0;
  const reviews = [];
  Object.entries(reviewSeed).forEach(([productId, list]) => list.forEach(([author, text, days]) => reviews.push({ id: 'r' + (++rn), productId, author, rating: 5, text, status: 'publie', at: now - days * DAY })));
  reviews.push({ id: 'r' + (++rn), productId: 'sun-sunny', author: 'Maëlys', rating: 5, text: "Je viens de le recevoir et je l'adore déjà, fini invisible !", status: 'en_attente', at: now - 2 * DAY });

  const photos = {
    collection: { src: "assets/glowmie-collection.jpg", alt: "La collection Glowmie : Fresh Start, Glow Drops, Daily Cloud et gloss sur fond rose", pos: "50% 60%" },
    swatchBeige: { id: "1585945037805-5fd82c2e60b1", alt: "Trace de crème blanche sur fond beige" },
    swatchesFabric: { id: "1609097164673-7cfafb51b926", alt: "Swatches de crème sur un tissu" },
    serumDrops: { id: "1748543668687-624e058c367c", alt: "Gouttes de sérum transparentes" },
    swatchGrey: { id: "1608068811588-3a67006b7489", alt: "Trace de crème hydratante sur fond clair" },
    bubbles: { id: "1518842013791-b874be246c34", alt: "Bulles de lotion en gros plan" },
    cheekCream: { id: "1693004927824-f2623bbedc8b", alt: "Femme appliquant une noisette de crème sur la joue" },
    underEye: { id: "1660911582546-2897e25c3b26", alt: "Crème appliquée sous l'oeil" },
    smileTouch: { id: "1728727267814-792db55ce678", alt: "Femme souriante qui touche sa peau" },
    touchFace: { id: "1702312686957-572286d28e11", alt: "Femme qui applique un soin du bout des doigts" },
    cheekSmile: { id: "1693004923522-806dafe5a1a0", alt: "Point de crème sur la joue d'une femme souriante" },
    maskLaugh: { id: "1646457417455-77a66a9fcf34", alt: "Femme qui rit avec un soin sur le visage" },
    applyBright: { id: "1661346376364-706a9eac60ab", alt: "Femme appliquant une crème dans une salle de bain lumineuse" },
    washFace: { id: "1785464430188-bfa8c6b20ec1", alt: "Femme qui se nettoie le visage" },
    foamHands: { id: "1508759073847-9ca702cec7d2", alt: "Mousse nettoyante dans le creux des mains" },
    dropperSkin: { id: "1573461160327-b450ce3d8e7f", alt: "Pipette de sérum au-dessus de la peau" },
    serumPink: { id: "1741896135512-084b251887f7", alt: "Flacon de sérum sur fond rose" },
    smileGlow: { id: "1782931684641-39b88b348e1e", alt: "Femme souriante à la peau lumineuse" },
    texturePink: { id: "1581016327131-6cf17ab1f2c1", alt: "Texture fouettée rose" },
    creamSwirl: { id: "1648213649604-2a079932a773", alt: "Texture de crème onctueuse" },
    swatchButter: { id: "1632127579802-ff69469091a4", alt: "Trace de crème sur fond jaune" },
    armDots: { id: "1603401712778-ab0575182f12", alt: "Bras avec trois touches de crème" },
    headband: { id: "1609357912334-e96886c0212b", alt: "Jeune femme avec un bandeau, peau fraîche" }
  };

  return { version: 16, photos, products, categories, articles, promos, automations, customers, orders, events, logs, quizResults, visits, reviews };
})();

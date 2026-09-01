/**
 * Mpakalogatos Αθήνα — δεδομένα επίδειξης.
 *
 * Μοναδική πηγή αλήθειας για το prototype, δομημένη όπως θα τα επέστρεφε ένα
 * πραγματικό API, ώστε κανένα component να μην έχει hard-coded κείμενο ή τιμή.
 *
 * Ονόματα προϊόντων που δεν μεταφράζονται (burrata, gnocchi, tagliolini,
 * harissa, Negroni, Spritz, Vinsanto, Apple Pay) μένουν όπως γράφονται σε
 * πραγματικό ελληνικό κατάλογο.
 */

/** Η πλατφόρμα. Το Mpakalogatos είναι ο πελάτης — ο επισκέπτης βλέπει το εστιατόριο. */
export const platform = {
  name: 'KatinaBot',
  tagline: 'Ο ψηφιακός οικοδεσπότης του τραπεζιού',
};

export const restaurant = {
  id: 'mpakalogatos-athens',
  name: 'Mpakalogatos',
  city: 'Αθήνα',
  concept: 'Σύγχρονη μεσογειακή κουζίνα',
  currency: '€',
  wifi: { network: 'Mpakalogatos Guest', password: 'aegean2026' },
  hours: 'Κουζίνα έως 23:30 · Μπαρ έως 01:00',
  address: 'Ηρακλειδών 22, Θησείο',
  restroom: 'Μετά το μπαρ, κάτω από τη μικρή σκάλα στα αριστερά σας.',
  policies: {
    tableMove: 'Η αυλή συνήθως ανοίγει μετά τις 21:00 — τότε μπορούμε να σας μετακινήσουμε.',
    kids: 'Έχουμε παιδικά καρεκλάκια και μικρότερη μερίδα από οτιδήποτε του καταλόγου.',
    receipt: 'Στέλνουμε την απόδειξη μόλις ολοκληρωθεί η πληρωμή.',
  },
};

export const guest = {
  id: 'g-alex',
  name: 'Άλεξ',
  seatedAt: '20:12',
};

export const table = {
  id: 't-14',
  label: 'Τραπέζι 14',
  seats: 2,
  party: 2,
  section: 'Αυλή',
};

export const staff = {
  maria: { id: 's-maria', name: 'Μαρία', role: 'Ομάδα εστιατορίου', initials: 'Μ' },
  nikos: { id: 's-nikos', name: 'Νίκος', role: 'Sommelier', initials: 'Ν' },
  kitchen: { id: 's-kitchen', name: 'Κουζίνα', role: 'Πάσο', initials: 'Κ' },
};

/** Διατροφικό λεξιλόγιο. Το `tone` καθορίζει το στυλ του chip. */
export const tags = {
  gf: { id: 'gf', label: 'Χωρίς γλουτένη', short: 'Χωρίς γλουτένη', tone: 'diet' },
  v: { id: 'v', label: 'Χορτοφαγικό', short: 'Χορτοφαγικό', tone: 'diet' },
  vg: { id: 'vg', label: 'Vegan', short: 'Vegan', tone: 'diet' },
  nuts: { id: 'nuts', label: 'Περιέχει ξηρούς καρπούς', short: 'Ξηροί καρποί', tone: 'allergen' },
  dairy: { id: 'dairy', label: 'Περιέχει γαλακτοκομικά', short: 'Γαλακτοκομικά', tone: 'allergen' },
  shellfish: { id: 'shellfish', label: 'Οστρακοειδή', short: 'Οστρακοειδή', tone: 'allergen' },
  spicy: { id: 'spicy', label: 'Πικάντικο', short: 'Πικάντικο', tone: 'heat' },
};

export const categories = [
  { id: 'starters', name: 'Ορεκτικά', note: 'Για τη μέση του τραπεζιού', unit: 'πιάτα' },
  { id: 'salads', name: 'Σαλάτες', note: 'Δροσερές, με πολλά μυρωδικά', unit: 'πιάτα' },
  { id: 'mains', name: 'Κυρίως πιάτα', note: 'Από τα κάρβουνα', unit: 'πιάτα' },
  { id: 'pasta', name: 'Ζυμαρικά', note: 'Φρέσκα κάθε πρωί', unit: 'πιάτα' },
  { id: 'desserts', name: 'Επιδόρπια', note: 'Μικρά και δροσερά', unit: 'πιάτα' },
  { id: 'cocktails', name: 'Μπαρ', note: 'Κοκτέιλ, αναψυκτικά, νερό', unit: 'ποτά' },
  { id: 'wine', name: 'Κρασί', note: 'Κυρίως ελληνικά νησιά', unit: 'σε ποτήρι' },
];

/**
 * Το `art` οδηγεί την απεικόνιση του πιάτου — δεν υπάρχει φωτογραφία στο
 * prototype. base = τόνος της κεραμικής, blobs = [χρώμα, x%, y%, μέγεθος%].
 * Τα ποτά παίρνουν `vessel` αντί για πιάτο.
 */
export const menu = [
  {
    id: 'octopus', name: 'Χταπόδι στα κάρβουνα', category: 'starters', price: 18,
    description: 'Φάβα, κάπαρη, κρεμμύδι τουρσί, λαδολέμονο',
    tags: ['gf', 'shellfish'], spice: 0, prepMin: 12, available: true,
    badge: 'Το πιο δημοφιλές', share: true, pairs: ['assyrtiko'],
    image: '/dishes/octopus.jpg',
    art: { base: '#E8E2D6', blobs: [['#8E5B3C', 52, 44, 46], ['#D8B34A', 34, 62, 34], ['#6E7A4B', 68, 68, 22], ['#B23A48', 44, 32, 12]] },
  },
  {
    id: 'burrata', name: 'Burrata με ψητά σταφύλια', category: 'starters', price: 16,
    description: 'Παλαιωμένο βαλσάμικο, λάδι βασιλικού, φιστίκι Αιγίνης, προζυμένιο ψωμί',
    tags: ['v', 'nuts', 'dairy'], spice: 0, prepMin: 6, available: true,
    badge: 'Επιλογή του σεφ', share: true, pairs: ['malagousia'],
    image: '/dishes/burrata.jpg',
    art: { base: '#EFE9DC', blobs: [['#FBFAF6', 46, 46, 44], ['#5B2A44', 68, 62, 24], ['#4C6B3A', 34, 68, 20], ['#9C7B4A', 68, 34, 16]] },
  },
  {
    id: 'taramas', name: 'Ταραμοσαλάτα', category: 'starters', price: 12,
    description: 'Καπνιστό αυγοτάραχο, ελαιόλαδο, ζεστή λαγάνα',
    tags: ['dairy'], spice: 0, prepMin: 5, available: true,
    share: true, pairs: ['assyrtiko'],
    image: '/dishes/taramas.jpg',
    art: { base: '#F0E7DC', blobs: [['#F2C6BE', 50, 48, 46], ['#C9A227', 68, 66, 22], ['#7A6248', 32, 66, 20]] },
  },
  {
    id: 'peppers', name: 'Πιπεριές στη σχάρα', category: 'starters', price: 9,
    description: 'Θαλασσινό αλάτι, ρίγανη, λεμόνι',
    tags: ['vg', 'gf'], spice: 1, prepMin: 7, available: true,
    share: true, pairs: [],
    image: '/dishes/peppers.jpg',
    art: { base: '#E6E3D8', blobs: [['#4F6B33', 48, 50, 48], ['#2E4020', 64, 60, 26], ['#D8CFA8', 34, 62, 14]] },
  },
  {
    id: 'greens', name: 'Χόρτα με φέτα', category: 'salads', price: 13,
    description: 'Άγρια χόρτα, αγγούρι, άνηθος, πρόβεια φέτα, λαδολέμονο',
    tags: ['v', 'gf', 'dairy'], spice: 0, prepMin: 5, available: true,
    pairs: ['malagousia'],
    image: '/dishes/greens.jpg',
    art: { base: '#EDEBE0', blobs: [['#5E7A3C', 46, 50, 46], ['#FAF7EE', 66, 58, 24], ['#8FA85C', 38, 66, 20]] },
  },
  {
    id: 'tomato', name: 'Ντομάτα παλιάς ποικιλίας', category: 'salads', price: 14,
    description: 'Φύλλο κάπαρης, κρίθινο παξιμάδι, κρίταμο, παλαιωμένο ξίδι',
    tags: ['vg'], spice: 0, prepMin: 5, available: true,
    pairs: ['assyrtiko'],
    image: '/dishes/tomato.jpg',
    art: { base: '#EFE8DC', blobs: [['#B8332F', 48, 46, 46], ['#D9A03A', 66, 60, 26], ['#6E7A4B', 34, 66, 18]] },
  },
  {
    id: 'seabass', name: 'Λαβράκι ολόκληρο', category: 'mains', price: 26,
    description: 'Στα κάρβουνα, λαδολέμονο, φύλλα κάπαρης',
    tags: ['gf'], spice: 0, prepMin: 22, available: true,
    badge: 'Σήμα κατατεθέν', pairs: ['assyrtiko', 'malagousia'],
    image: '/dishes/seabass.jpg',
    art: { base: '#E9E5DA', blobs: [['#B9B4A4', 50, 46, 50], ['#D8C066', 68, 60, 22], ['#5E7A3C', 32, 62, 16]] },
  },
  {
    id: 'lamb', name: 'Αρνίσια σπάλα', category: 'mains', price: 29,
    description: 'Σιγομαγειρεμένη, καπνιστή μελιτζάνα, βουνίσια μυρωδικά',
    tags: ['gf'], spice: 0, prepMin: 18, available: true,
    pairs: ['xinomavro'],
    image: '/dishes/lamb.jpg',
    art: { base: '#E7E0D2', blobs: [['#7A3B22', 50, 48, 48], ['#3F3128', 66, 62, 26], ['#6E7A4B', 32, 64, 16]] },
  },
  {
    id: 'chicken', name: 'Κοτόπουλο στα κάρβουνα', category: 'mains', price: 21,
    description: 'Λεμόνι, θυμάρι, ψητό φρέσκο κρεμμύδι',
    tags: ['gf'], spice: 0, prepMin: 16, available: true,
    kidFriendly: true, pairs: ['malagousia'],
    image: '/dishes/chicken.jpg',
    art: { base: '#EDE6D8', blobs: [['#C08A3E', 50, 48, 48], ['#8FA85C', 68, 62, 20], ['#F0E4C0', 34, 62, 16]] },
  },
  {
    id: 'harissa-prawns', name: 'Γαρίδες με harissa', category: 'mains', price: 24,
    description: 'Rose harissa, ντομάτα, λεμόνι αλατισμένο',
    tags: ['gf', 'shellfish', 'spicy'], spice: 3, prepMin: 14, available: true,
    pairs: ['malagousia'],
    image: '/dishes/harissa-prawns.jpg',
    art: { base: '#EFE3D6', blobs: [['#C4442A', 50, 48, 48], ['#E8863C', 66, 60, 26], ['#D8CFA8', 32, 64, 16]] },
  },
  {
    id: 'orzo', name: 'Κριθαράκι με τρούφα', category: 'pasta', price: 22,
    description: 'Μαύρη τρούφα, παλαιωμένη γραβιέρα',
    tags: ['v', 'dairy'], spice: 0, prepMin: 14, available: true,
    modifiers: ['no-cheese'], pairs: ['xinomavro'],
    image: '/dishes/orzo.jpg',
    art: { base: '#EFE9DA', blobs: [['#CDB27E', 50, 48, 50], ['#3B3129', 64, 58, 22], ['#EDE6CE', 36, 62, 18]] },
  },
  {
    id: 'crab-pasta', name: 'Tagliolini με καβούρι', category: 'pasta', price: 25,
    description: 'Μπλε καβούρι, τσίλι, ξύσμα λεμονιού, αυγοτάραχο',
    tags: ['shellfish', 'spicy'], spice: 2, prepMin: 15, available: false,
    unavailableNote: 'Εξαντλήθηκε απόψε', pairs: ['assyrtiko'],
    image: '/dishes/crab-pasta.jpg',
    art: { base: '#EEE8DA', blobs: [['#E0BE72', 50, 48, 48], ['#C4442A', 66, 60, 18], ['#F2ECD8', 34, 62, 18]] },
  },
  {
    id: 'gnocchi', name: 'Gnocchi με ντομάτα', category: 'pasta', price: 19,
    description: 'Σιγομαγειρεμένη ντομάτα, βασιλικός, ελαιόλαδο — χωρίς τυρί',
    tags: ['vg'], spice: 0, prepMin: 12, available: true,
    kidFriendly: true, modifiers: ['extra-bread'], pairs: ['xinomavro'],
    image: '/dishes/gnocchi.jpg',
    art: { base: '#EFE6D8', blobs: [['#B8332F', 50, 48, 48], ['#4C6B3A', 68, 60, 20], ['#F5EEDC', 34, 62, 18]] },
  },
  {
    id: 'olive-cake', name: 'Κέικ ελαιολάδου', category: 'desserts', price: 10,
    description: 'Σιρόπι εσπεριδοειδών, στραγγιστό γιαούρτι, θυμαρίσιο μέλι',
    tags: ['v', 'dairy'], spice: 0, prepMin: 6, available: true,
    badge: 'Επιλογή του σεφ', pairs: ['vinsanto'],
    image: '/dishes/olive-cake.jpg',
    art: { base: '#F1EADA', blobs: [['#D9B25C', 50, 48, 46], ['#FBF7EC', 66, 60, 24], ['#C9A227', 34, 62, 16]] },
  },
  {
    id: 'chocolate', name: 'Κρέμα μαύρης σοκολάτας', category: 'desserts', price: 11,
    description: 'Θαλασσινό αλάτι, ελαιόλαδο, καβουρδισμένο αμύγδαλο',
    tags: ['v', 'nuts', 'dairy', 'gf'], spice: 0, prepMin: 4, available: true,
    pairs: ['vinsanto'],
    image: '/dishes/chocolate.jpg',
    art: { base: '#EDE4D6', blobs: [['#3A2A22', 50, 48, 46], ['#C9A227', 68, 62, 18], ['#EFE2C8', 32, 62, 16]] },
  },
  {
    id: 'granita', name: 'Γρανίτα μαστίχας', category: 'desserts', price: 8,
    description: 'Μαστίχα, λάιμ, παγωμένο πεπόνι',
    tags: ['vg', 'gf'], spice: 0, prepMin: 3, available: true,
    kidFriendly: true, pairs: [],
    art: { base: '#EDF0EA', blobs: [['#CFE0D2', 50, 48, 46], ['#8FA85C', 66, 60, 18], ['#F6D98C', 34, 62, 16]] },
  },
  {
    id: 'negroni', name: 'Negroni με φύλλο συκιάς', category: 'cocktails', price: 14,
    description: 'Gin με φύλλο συκιάς, γλυκό βερμούτ, bitter aperitivo',
    tags: ['vg', 'gf'], spice: 0, prepMin: 4, available: true,
    badge: 'Αγαπημένο του μπαρ', pairs: [],
    art: { vessel: 'rocks', base: '#E6DDD0', blobs: [['#8E1F2B', 50, 48, 44], ['#C9522F', 64, 58, 20], ['#E7C98A', 38, 60, 14]] },
  },
  {
    id: 'spritz', name: 'Spritz μαστίχας', category: 'cocktails', price: 12,
    description: 'Λικέρ μαστίχας, σόδα, φλούδα γκρέιπφρουτ',
    tags: ['vg', 'gf'], spice: 0, prepMin: 3, available: true,
    pairs: [],
    art: { vessel: 'wine', base: '#EDE9DC', blobs: [['#EBC96B', 50, 48, 44], ['#F2E6B8', 64, 58, 20], ['#8FA85C', 36, 62, 14]] },
  },
  {
    id: 'sparkling', name: 'Ανθρακούχο νερό', category: 'cocktails', price: 4,
    description: 'Παγωμένο, 750 ml', unit: 'φιάλη',
    tags: ['vg', 'gf'], spice: 0, prepMin: 1, available: true,
    pairs: [],
    art: { vessel: 'bottle', base: '#E8ECEC', blobs: [['#CFDDDC', 50, 48, 46], ['#F4F6F4', 64, 58, 22]] },
  },
  {
    id: 'lemonade', name: 'Λεμονάδα του σπιτιού', category: 'cocktails', price: 5,
    description: 'Φρεσκοστυμμένο λεμόνι, θυμάρι, νερό', unit: 'ποτήρι',
    tags: ['vg', 'gf'], spice: 0, prepMin: 2, available: true,
    kidFriendly: true, pairs: [],
    art: { vessel: 'highball', base: '#F2EFDC', blobs: [['#F0DE8A', 50, 48, 46], ['#8FA85C', 66, 60, 16]] },
  },
  {
    id: 'assyrtiko', name: 'Ασύρτικο, Σαντορίνη', category: 'wine', price: 11,
    description: 'Εσπεριδοειδή, αλμύρα, μεταλλικότητα — το λευκό του καταστήματος', unit: 'ποτήρι',
    tags: ['vg', 'gf'], spice: 0, prepMin: 2, available: true,
    badge: 'Ταιριάζει με ψάρι', pairs: ['seabass', 'octopus'],
    art: { vessel: 'wine', base: '#EFEAD8', blobs: [['#E7DC9A', 50, 48, 46], ['#F6F0D4', 64, 58, 22]] },
  },
  {
    id: 'malagousia', name: 'Μαλαγουζιά, Επανομή', category: 'wine', price: 10,
    description: 'Ροδάκινο, βασιλικός, απαλή οξύτητα', unit: 'ποτήρι',
    tags: ['vg', 'gf'], spice: 0, prepMin: 2, available: true,
    pairs: ['burrata', 'chicken'],
    art: { vessel: 'wine', base: '#F0EBD8', blobs: [['#EFD98E', 50, 48, 46], ['#F8F2DC', 64, 58, 22]] },
  },
  {
    id: 'xinomavro', name: 'Ξινόμαυρο, Νάουσα', category: 'wine', price: 12,
    description: 'Φύλλο ντομάτας, κόκκινα φρούτα, στιβαρές τανίνες', unit: 'ποτήρι',
    tags: ['vg', 'gf'], spice: 0, prepMin: 2, available: true,
    pairs: ['lamb', 'orzo'],
    art: { vessel: 'wine', base: '#E9DED6', blobs: [['#7E2233', 50, 48, 46], ['#B4544C', 64, 58, 22]] },
  },
  {
    id: 'vinsanto', name: 'Vinsanto, Σαντορίνη', category: 'wine', price: 9,
    description: 'Ξερό σύκο, καραμέλα — για το επιδόρπιο', unit: 'ποτήρι',
    tags: ['vg', 'gf'], spice: 0, prepMin: 2, available: true,
    pairs: ['olive-cake', 'chocolate'],
    art: { vessel: 'wine', base: '#EBDFCE', blobs: [['#A9702E', 50, 48, 46], ['#DFB877', 64, 58, 22]] },
  },
];

/** Αλλαγές που δέχεται πραγματικά η κουζίνα. */
export const modifiers = {
  'no-cheese': { id: 'no-cheese', label: 'Χωρίς τυρί', priceDelta: 0, note: 'Το ολοκληρώνουμε με ελαιόλαδο' },
  'extra-bread': { id: 'extra-bread', label: 'Έξτρα ψωμί', priceDelta: 2 },
};

/** Εξυπηρέτηση τραπεζιού — χωρίς δελτίο στην κουζίνα, χωρίς χρέωση. */
export const serviceItems = [
  { id: 'water', label: 'Κι άλλο νερό', ack: 'Έρχεται φρέσκια καράφα.' },
  { id: 'bread', label: 'Ψωμί', ack: 'Βγαίνει ζεστό ψωμί.' },
  { id: 'ice', label: 'Πάγος', ack: 'Έρχεται παγοδοχείο.' },
  { id: 'napkins', label: 'Χαρτοπετσέτες', ack: 'Έρχονται χαρτοπετσέτες.' },
  { id: 'cutlery', label: 'Καθαρά μαχαιροπίρουνα', ack: 'Έρχονται καθαρά μαχαιροπίρουνα.' },
  { id: 'childseat', label: 'Παιδικό κάθισμα', ack: 'Η Μαρία φέρνει παιδικό καρεκλάκι.' },
];

/** Οι λόγοι που ζητάμε πριν καλέσουμε πραγματικά κάποιον. */
export const waiterReasons = [
  { id: 'order', label: 'Θέλουμε να παραγγείλουμε' },
  { id: 'assist', label: 'Χρειαζόμαστε βοήθεια' },
  { id: 'missing', label: 'Λείπει κάτι' },
  { id: 'about-order', label: 'Ερώτηση για την παραγγελία' },
  { id: 'other', label: 'Κάτι άλλο' },
];

export const orderStages = [
  { id: 'received', label: 'Ελήφθη' },
  { id: 'preparing', label: 'Ετοιμάζεται' },
  { id: 'ready', label: 'Έτοιμο' },
  { id: 'served', label: 'Σερβιρίστηκε' },
];

export const feedbackTags = ['Φαγητό', 'Εξυπηρέτηση', 'Ατμόσφαιρα', 'Χρόνος αναμονής', 'Σχέση αξίας'];

export const tipPresets = [
  { id: 'none', label: 'Χωρίς', pct: 0 },
  { id: 'five', label: '5%', pct: 5 },
  { id: 'ten', label: '10%', pct: 10 },
];

export const paymentMethods = [
  { id: 'apple', label: 'Apple Pay', hint: 'Διπλό πάτημα στο πλαϊνό κουμπί' },
  { id: 'google', label: 'Google Pay', hint: 'Επιβεβαίωση στη συσκευή σας' },
  { id: 'card', label: 'Πιστωτική / χρεωστική κάρτα', hint: '•••• 4417 · Visa' },
];

/* ---------- lookups ---------- */
// Looked up live (not a cached snapshot) so `applyLiveMenu` below can swap
// the menu's contents in place — e.g. for real orders against the real
// KatinaBot backend — without every existing helper going stale.
export const getItem = (id) => menu.find((m) => m.id === id);
export const itemsIn = (categoryId) => menu.filter((m) => m.category === categoryId);
export const getCategory = (id) => categories.find((c) => c.id === id);

/**
 * Replaces the demo menu with real items from the KatinaBot backend
 * (`GET /menu`). Mutates `menu`/`categories` in place — since they're `const`
 * arrays, every existing import elsewhere in the app keeps working, it just
 * sees the new contents. Meant for "live mode" only (see App.jsx); the demo
 * scenarios reference fictional dish ids and will break if this runs while
 * one is active.
 */
export function applyLiveMenu(backendMenu) {
  const items = Object.entries(backendMenu || {}).map(([itemId, item]) => ({
    id: itemId,
    // GET /menu doesn't return a display name today (only price/description/
    // image/category/extras/stock, keyed by item_id) — falls back to the id,
    // title-cased. Worth adding a real `name` field to that endpoint later.
    name: itemId.charAt(0).toUpperCase() + itemId.slice(1),
    category: item.category || 'other',
    price: item.price,
    description: item.description || '',
    tags: [],
    spice: 0,
    prepMin: 8,
    available: item.stock === null || item.stock === undefined || item.stock > 0,
    badge: undefined,
    share: false,
    pairs: [],
    image: item.image || undefined,
    art: { base: '#EFE9DC', blobs: [['#8F6210', 50, 50, 40], ['#D9A75B', 65, 35, 20]] },
  }));

  menu.length = 0;
  menu.push(...items);

  const known = new Set(categories.map((c) => c.id));
  items.forEach((item) => {
    if (!known.has(item.category)) {
      known.add(item.category);
      categories.push({
        id: item.category,
        name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
        note: '',
        unit: 'πιάτα',
      });
    }
  });
}

/** Ελληνική μορφή: υποδιαστολή κόμμα, σύμβολο μετά τον αριθμό. */
export const money = (n) => {
  const v = Number(n);
  const decimals = Number.isInteger(v) ? 0 : 2;
  return `${v.toLocaleString('el-GR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${restaurant.currency}`;
};

export const money2 = (n) =>
  `${Number(n).toLocaleString('el-GR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${restaurant.currency}`;

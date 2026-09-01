import {
  menu, itemsIn, getItem, getCategory, restaurant, table,
  staff, serviceItems, money, tags as tagDefs,
} from '../data/restaurant.js';
import { uid } from './state.js';

/**
 * Ένας σκόπιμα μικρός μηχανισμός πρόθεσης πάνω στα πραγματικά δεδομένα.
 *
 * Δεν είναι LLM — αλλά κάθε απάντηση υπολογίζεται από τον κατάλογο, οπότε ο
 * βοηθός έχει πάντα δίκιο για τιμές, αλλεργιογόνα, ένταση και διαθεσιμότητα.
 * Αυτό είναι που κάνει την ελεύθερη πληκτρολόγηση πειστική σε παρουσίαση.
 *
 * Δέχεται και ελληνικά και αγγλικά — ο επισκέπτης δεν πρέπει να μαντεύει.
 */

/**
 * Τα ελληνικά γράφονται με ή χωρίς τόνους, και με τελικό σίγμα. Ισοπεδώνουμε
 * και τα δύο πριν από κάθε σύγκριση, ώστε «λαβράκι» και «λαβρακι» να ταιριάζουν.
 */
const norm = (s) => s
  .toLowerCase()
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/ς/g, 'σ')
  .replace(/[’']/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const has = (t, ...words) => words.some((w) => t.includes(norm(w)));

/* ---------- αναγνώριση πιάτων ---------- */

const RAW_ALIASES = {
  octopus: ['χταπόδι', 'χταποδάκι', 'octopus'],
  burrata: ['burrata', 'μπουράτα', 'σταφύλια', 'grapes'],
  taramas: ['ταραμοσαλάτα', 'ταραμά', 'ταραμάς', 'taramas'],
  peppers: ['πιπεριές', 'πιπεριά', 'peppers'],
  greens: ['χόρτα', 'χορταρικά', 'greens'],
  tomato: ['ντομάτα παλιάς', 'ντοματοσαλάτα', 'heirloom'],
  seabass: ['λαβράκι', 'ψάρι', 'sea bass', 'seabass'],
  lamb: ['αρνί', 'αρνίσια', 'σπάλα', 'lamb'],
  chicken: ['κοτόπουλο', 'κοτόπουλα', 'chicken'],
  'harissa-prawns': ['γαρίδες', 'γαρίδα', 'harissa', 'prawns', 'shrimp'],
  orzo: ['κριθαράκι', 'τρούφα', 'orzo', 'truffle'],
  'crab-pasta': ['καβούρι', 'tagliolini', 'crab'],
  gnocchi: ['gnocchi', 'νιόκι'],
  'olive-cake': ['κέικ ελαιολάδου', 'κέικ', 'olive oil cake'],
  chocolate: ['σοκολάτα', 'σοκολάτας', 'chocolate'],
  granita: ['γρανίτα', 'granita'],
  negroni: ['negroni', 'νεγκρόνι'],
  spritz: ['spritz', 'σπριτς'],
  sparkling: ['ανθρακούχ', 'σόδα', 'sparkling water', 'sparkling'],
  lemonade: ['λεμονάδα', 'lemonade'],
  assyrtiko: ['ασύρτικο', 'assyrtiko'],
  malagousia: ['μαλαγουζιά', 'malagousia'],
  xinomavro: ['ξινόμαυρο', 'xinomavro'],
  vinsanto: ['vinsanto', 'βινσάντο'],
};

/**
 * Built per lookup, not once at module load — so it stays correct after
 * `applyLiveMenu()` swaps in real items from the backend. Every current menu
 * item's own name is always a guaranteed alias (so a real item can always be
 * ordered by typing its name), plus whatever curated demo synonyms exist for
 * that id in RAW_ALIASES above.
 */
function buildAliases() {
  const map = {};
  menu.forEach((item) => {
    const list = [norm(item.name)];
    if (RAW_ALIASES[item.id]) list.push(...RAW_ALIASES[item.id].map(norm));
    map[item.id] = [...new Set(list)];
  });
  return map;
}

const RAW_NUMBERS = {
  ένα: 1, ένας: 1, μία: 1, μια: 1, ενα: 1,
  δύο: 2, δυο: 2, δυό: 2,
  τρία: 3, τρεις: 3,
  τέσσερα: 4, τέσσερις: 4,
  πέντε: 5, έξι: 6,
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
};
const NUMBERS = Object.fromEntries(
  Object.entries(RAW_NUMBERS).map(([w, n]) => [norm(w), n]),
);

/** Βρίσκει πιάτα μέσα σε ελεύθερο κείμενο, με ποσότητα όπου δηλώνεται. */
export function findItems(text) {
  const t = norm(text);
  const found = [];
  Object.entries(buildAliases()).forEach(([id, aliases]) => {
    for (const alias of aliases) {
      const at = t.indexOf(alias);
      if (at === -1) continue;
      const before = t.slice(Math.max(0, at - 20), at).trim().split(' ');
      let qty = 1;
      for (let i = before.length - 1; i >= Math.max(0, before.length - 3); i--) {
        const w = before[i];
        if (/^\d+$/.test(w)) { qty = Math.min(9, parseInt(w, 10)); break; }
        if (NUMBERS[w] !== undefined) { qty = NUMBERS[w]; break; }
      }
      found.push({ itemId: id, qty, at });
      break;
    }
  });
  return found.sort((a, b) => a.at - b.at).map(({ itemId, qty }) => ({ itemId, qty }));
}

const findCategory = (t) => {
  if (has(t, 'ορεκτικ', 'μεζέ', 'μεζεδ', 'starter')) return 'starters';
  if (has(t, 'σαλάτ', 'salad')) return 'salads';
  if (has(t, 'κυρίως', 'κύριο πιάτο', 'main')) return 'mains';
  if (has(t, 'ζυμαρικ', 'μακαρον', 'pasta')) return 'pasta';
  if (has(t, 'επιδόρπι', 'γλυκό', 'γλυκά', 'dessert')) return 'desserts';
  if (has(t, 'κοκτέιλ', 'ποτό', 'ποτά', 'μπαρ', 'αναψυκτικ', 'cocktail', 'drink')) return 'cocktails';
  if (has(t, 'κρασί', 'κρασιά', 'λευκό', 'κόκκινο', 'wine')) return 'wine';
  return null;
};

const available = (item) => item.available;

/** «το χταπόδι, η μπουράτα και το λαβράκι» */
const listNames = (ids) => {
  const names = ids.map((id) => getItem(id).name);
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} και ${names[names.length - 1]}`;
};

/* ---------- επαναχρησιμοποιήσιμα blocks ---------- */

export const actionsBlock = (options) => ({ type: 'actions', options });
export const askAction = (label, text, tone) => ({ label, act: 'ask', payload: { text }, tone });

const dietaryAnswer = (tagId) => {
  const matches = menu.filter(
    (m) => m.tags.includes(tagId) && available(m) && m.category !== 'wine' && m.category !== 'cocktails',
  );
  const label = tagDefs[tagId].label.toLowerCase();
  return {
    text: `Απόψε ${matches.length} πιάτα είναι ${label}, σε κάθε κατηγορία. Η κουζίνα τα ετοιμάζει ξεχωριστά, οπότε δεν υπάρχει θέμα επιμόλυνσης.`,
    blocks: [{
      type: 'items',
      ids: matches.map((m) => m.id),
      layout: 'list',
      label: `${tagDefs[tagId].label} · ${matches.length} πιάτα`,
    }],
  };
};

const avoidAnswer = (tagId) => {
  const label = tagDefs[tagId].label.toLowerCase().replace('περιέχει ', '');
  const safe = menu.filter(
    (m) => !m.tags.includes(tagId) && available(m) && ['starters', 'salads', 'mains', 'pasta'].includes(m.category),
  );
  const risky = menu.filter((m) => m.tags.includes(tagId));
  return {
    text: `${listNames(risky.map((r) => r.id))} περιέχουν ${label} — όλα τα υπόλοιπα του φαγητού είναι καθαρά. Ορίστε τι θα έτρωγα εγώ.`,
    blocks: [{
      type: 'items',
      ids: safe.slice(0, 6).map((m) => m.id),
      layout: 'carousel',
      label: `Χωρίς ${label}`,
    }],
  };
};

/* ---------- ο μηχανισμός ---------- */

/**
 * @returns {{text:string, blocks?:Array, pre?:Array, sheet?:object}}
 */
export function respond(raw, state) {
  const t = norm(raw);

  /* --- χαιρετισμοί --- */
  if (/^(γεια|καλησπερα|καλημερα|χαιρετ|hi|hey|hello)/.test(t) && t.length < 24) {
    return {
      text: `Καλησπέρα σας. Έχω μπροστά μου το ${table.label} — κατάλογος, παραγγελία, λογαριασμός, ή φωνάζω κάποιον από την ομάδα.`,
      blocks: [actionsBlock([
        askAction('Ο κατάλογος', 'Δείξε μου τον κατάλογο'),
        askAction('Πρότεινέ μου κάτι', 'Τι προτείνετε για δύο άτομα;'),
        askAction('Κάλεσε σερβιτόρο', 'Καλέστε τον σερβιτόρο'),
      ])],
    };
  }
  if (has(t, 'ευχαριστ', 'thank', 'thanks')) {
    return { text: 'Στη διάθεσή σας. Εδώ είμαι για ό,τι χρειαστείτε.' };
  }

  /* --- γνώση του καταστήματος --- */
  if (has(t, 'wifi', 'wi-fi', 'ίντερνετ', 'internet', 'κωδικό', 'κωδικος', 'συνθηματικ', 'password')) {
    return {
      text: 'Ορίστε — μόλις συνδεθείτε, σας κρατάει και στις επόμενες επισκέψεις.',
      blocks: [{
        type: 'info',
        title: 'Δίκτυο επισκεπτών',
        rows: [
          { label: 'Δίκτυο', value: restaurant.wifi.network, mono: true },
          { label: 'Κωδικός', value: restaurant.wifi.password, copy: true, mono: true },
        ],
      }],
    };
  }
  if (has(t, 'τουαλέτα', 'τουαλέτες', 'μπάνιο', 'wc', 'restroom', 'toilet')) {
    return { text: `${restaurant.restroom} Είναι περίπου είκοσι βήματα από το ${table.label}.` };
  }
  if (has(t, 'άλλο τραπέζι', 'αλλάξουμε τραπέζι', 'μετακινηθ', 'move table', 'another table')) {
    return {
      text: `${restaurant.policies.tableMove} Μπορώ να σας βάλω στη λίστα και η ${staff.maria.name} θα έρθει μόλις ελευθερωθεί τραπέζι στην αυλή.`,
      blocks: [actionsBlock([
        { label: 'Ναι, βάλτε μας στη λίστα', act: 'waiter-reason', payload: { reasonId: 'assist', reasonLabel: 'Αλλαγή τραπεζιού' }, tone: 'primary' },
        askAction('Μένουμε εδώ', 'Μένουμε εδώ, ευχαριστούμε'),
      ])],
    };
  }
  if (has(t, 'μένουμε εδώ')) {
    return { text: 'Κατάλαβα — μένουμε στο Τραπέζι 14.' };
  }
  if (has(t, 'απόδειξη', 'τιμολόγιο', 'receipt', 'invoice')) {
    return state.payment
      ? {
        text: `${restaurant.policies.receipt} Πού να τη στείλω;`,
        blocks: [{ type: 'receipt-email' }],
      }
      : {
        text: 'Στέλνω την απόδειξη μόλις κλείσει ο λογαριασμός. Να σας τον φέρω;',
        blocks: [actionsBlock([askAction('Ο λογαριασμός', 'Τι λέει ο λογαριασμός μας;', 'primary')])],
      };
  }
  if (has(t, 'μέχρι τι ώρα', 'κλείνετε', 'ωράριο', 'closing')) {
    return { text: `${restaurant.hours}. Καμία βιασύνη για το ${table.label}.` };
  }

  /* --- αιτήματα εξυπηρέτησης --- */
  const svc = serviceItems.find((s) => {
    // Χωρίς \b: στη JavaScript το \b ορίζεται πάνω στο [A-Za-z0-9_], οπότε
    // δίπλα σε ελληνικό γράμμα δεν ενεργοποιείται ποτέ.
    if (s.id === 'water') return /(νερο|νερα|καραφα|water)/.test(t) && !t.includes('ανθρακουχ');
    if (s.id === 'bread') return /(ψωμι|ψωμακ|bread)/.test(t);
    if (s.id === 'ice') return /(παγο|παγακ|ice)/.test(t);
    if (s.id === 'napkins') return /χαρτοπετσετ|napkin/.test(t);
    if (s.id === 'cutlery') return /μαχαιροπιρουν|πιρουν|μαχαιρ|κουταλ|cutlery/.test(t);
    if (s.id === 'childseat') return /παιδικο καθισμα|καρεκλακι|high ?chair/.test(t);
    return false;
  });
  if (svc && !has(t, 'βάλε', 'πρόσθεσε', 'παραγγ', 'add ', 'order ')) {
    const id = uid('svc');
    return {
      pre: [{ type: 'REQUEST_SERVICE', itemId: svc.id, id }],
      text: `Φυσικά — ${svc.ack.charAt(0).toLowerCase()}${svc.ack.slice(1)} Ενημέρωσα την ομάδα.`,
      blocks: [{ type: 'service', id }],
    };
  }
  if (has(t, 'τι άλλο μπορείτε να φέρετε', 'εξυπηρέτηση τραπεζιού')) {
    return {
      text: 'Οτιδήποτε από αυτά, χωρίς χρέωση και χωρίς να περάσει από την κουζίνα.',
      blocks: [{ type: 'service-menu' }],
    };
  }

  /* --- σερβιτόρος --- */
  if (has(t, 'σερβιτόρο', 'σερβιτόρα', 'να έρθει κάποιος', 'φωνάξτε', 'φώναξε', 'καλέστε', 'τη μαρία', 'call waiter')) {
    if (state.waiter?.status === 'active') {
      return {
        text: `Η ${staff.maria.name} έρχεται ήδη — ειδοποιήθηκε στις ${state.waiter.at}.`,
        blocks: [{ type: 'waiter', id: state.waiter.id }],
      };
    }
    return {
      text: 'Ευχαρίστως. Τι χρειάζεστε; Βοηθάει να το ξέρει πριν έρθει.',
      blocks: [{ type: 'waiter-reasons' }],
    };
  }

  /* --- λογαριασμός και πληρωμή --- */
  if (has(t, 'λογαριασμ', 'τι χρωστάμε', 'πόσο κάναμε', 'bill')) {
    if (!state.order.items.length) {
      return {
        text: 'Δεν έχει μπει τίποτα ακόμα — ο λογαριασμός σας είναι άδειος. Να σας δείξω τον κατάλογο;',
        blocks: [actionsBlock([askAction('Ο κατάλογος', 'Δείξε μου τον κατάλογο', 'primary')])],
      };
    }
    return { text: `Ορίστε το ${table.label} όπως είναι αυτή τη στιγμή.`, blocks: [{ type: 'bill' }] };
  }
  if (has(t, 'πληρωσ', 'πληρώσ', 'πληρωμή', 'να πληρώσουμε', 'pay')) {
    if (!state.order.items.length) return { text: 'Δεν υπάρχει κάτι για πληρωμή ακόμα.' };
    return {
      text: 'Όποτε είστε έτοιμοι.',
      blocks: [{ type: 'bill', compact: true }],
      sheet: { type: 'payment' },
    };
  }
  if (has(t, 'μοιράσ', 'να τον μοιράσουμε', 'χωριστά', 'split')) {
    if (!state.order.items.length) return { text: 'Δεν υπάρχει κάτι να μοιραστεί ακόμα.' };
    return {
      text: `${table.party} άτομα στο τραπέζι — μοιράστε τον όπως σας βολεύει.`,
      sheet: { type: 'split' },
    };
  }

  /* --- κατάσταση παραγγελίας --- */
  if (has(t, 'πού είναι το φαγητό', 'που ειναι το φαγητο', 'αργεί', 'αργει', 'πόση ώρα ακόμα', 'έτοιμο', 'ετοιμο', 'where is my food', 'order status')) {
    if (!state.order.items.length) {
      return {
        text: 'Δεν έχετε παραγγείλει ακόμα — δεν υπάρχει τίποτα στην κουζίνα.',
        blocks: [actionsBlock([askAction('Ο κατάλογος', 'Δείξε μου τον κατάλογο', 'primary')])],
      };
    }
    const eta = state.order.etaMin ?? 10;
    const stageText = {
      received: 'Η κουζίνα πήρε το δελτίο σας και ξεκινάει τώρα.',
      preparing: `Τα κυρίως πιάτα σας ετοιμάζονται. Η κουζίνα υπολογίζει περίπου ${eta}–${eta + 2} λεπτά.`,
      ready: 'Είναι στο πάσο — η Μαρία τα παίρνει τώρα.',
      served: 'Όλα όσα ήταν στο δελτίο σερβιρίστηκαν. Λείπει κάτι;',
    }[state.order.stage] ?? 'Η παραγγελία σας είναι στην κουζίνα.';
    return { text: stageText, blocks: [{ type: 'order-status' }] };
  }
  if (has(t, 'η παραγγελία μου', 'τι παραγγείλαμε', 'η παραγγελία μας')) {
    if (!state.order.items.length) return { text: 'Δεν έχετε παραγγείλει κάτι ακόμα.' };
    return {
      text: `Παραγγελία #${state.order.number}, στάλθηκε στις ${state.order.placedAt}.`,
      blocks: [{ type: 'order-status' }, { type: 'bill', compact: true }],
    };
  }

  /* --- διατροφική νοημοσύνη --- */
  if (has(t, 'γλουτέν', 'gluten', 'κοιλιοκάκη')) {
    if (has(t, 'δεν τρώω', 'δεν μπορώ', 'αποφεύγω', 'χωρίς')) {
      const r = dietaryAnswer('gf');
      return { ...r, text: `Το κράτησα — χωρίς γλουτένη για το τραπέζι. ${r.text}` };
    }
    return dietaryAnswer('gf');
  }
  if (has(t, 'vegan', 'βίγκαν')) return dietaryAnswer('vg');
  if (has(t, 'χορτοφαγ', 'χωρίς κρέας', 'vegetarian')) return dietaryAnswer('v');
  if (has(t, 'ξηρούς καρπούς', 'ξηροί καρποί', 'φιστίκι', 'αμύγδαλ', 'καρύδι', 'nut')) return avoidAnswer('nuts');
  if (has(t, 'γαλακτοκομικ', 'λακτόζη', 'χωρίς τυρί', 'τυρί', 'dairy', 'lactose')) {
    if (has(t, 'ζυμαρικ', 'κριθαράκι', 'pasta', 'orzo')) {
      return {
        text: 'Το κριθαράκι ολοκληρώνεται με παλαιωμένη γραβιέρα, αλλά η κουζίνα το φτιάχνει και χωρίς — με ελαιόλαδο, και μένει το ίδιο πλούσιο. Τα gnocchi δεν έχουν καθόλου τυρί εξαρχής.',
        blocks: [{ type: 'items', ids: ['orzo', 'gnocchi'], layout: 'carousel', label: 'Χωρίς τυρί' }],
      };
    }
    return avoidAnswer('dairy');
  }
  if (has(t, 'οστρακ', 'αλλεργ', 'allerg')) {
    if (has(t, 'οστρακ', 'γαρίδ', 'καβούρι', 'χταπόδι')) return avoidAnswer('shellfish');
    return {
      text: 'Πείτε μου τι πρέπει να αποφύγετε και φιλτράρω όλο τον κατάλογο — έχω γλουτένη, γαλακτοκομικά, ξηρούς καρπούς και οστρακοειδή ανά πιάτο.',
      blocks: [actionsBlock([
        askAction('Χωρίς γλουτένη', 'Τι είναι χωρίς γλουτένη;'),
        askAction('Χωρίς ξηρούς καρπούς', 'Τι περιέχει ξηρούς καρπούς;'),
        askAction('Χωρίς γαλακτοκομικά', 'Τι έχει γαλακτοκομικά;'),
        askAction('Χορτοφαγικά', 'Τι είναι χορτοφαγικό;'),
      ])],
    };
  }

  /* --- ένταση --- */
  if (has(t, 'καυτερ', 'πικάντικ', 'τσίλι', 'ήπιο', 'spicy', 'mild')) {
    const mains = itemsIn('mains').filter(available);
    const mildest = [...mains].sort((a, b) => a.spice - b.spice)[0];
    const spicy = menu.filter((m) => m.spice >= 2 && available(m));
    if (has(t, 'λιγότερο', 'πιο ήπιο', 'ήπιο', 'χωρίς κάψα', 'δεν τρώω καυτερά', 'όχι καυτερό', 'least', 'mild')) {
      return {
        text: `Το ${mildest.name.toLowerCase()} δεν έχει καθόλου κάψα — λεμόνι και μυρωδικά, τίποτε άλλο. Μόνο ${spicy.map((s) => s.name.toLowerCase()).join(' και ')} έχουν τσίλι.`,
        blocks: [{ type: 'items', ids: [mildest.id, 'lamb', 'chicken'], layout: 'carousel', label: 'Χωρίς κάψα' }],
      };
    }
    return {
      text: `Δύο πιάτα έχουν πραγματική κάψα: ${spicy.map((s) => s.name.toLowerCase()).join(' και ')}. Όλα τα υπόλοιπα είναι ήπια.`,
      blocks: [{ type: 'items', ids: spicy.map((s) => s.id), layout: 'carousel', label: 'Πικάντικα' }],
    };
  }

  /* --- τιμή --- */
  const priceCap = t.match(/(?:κατω απο|μεχρι|εωσ|under|less than|below)\s*[€e]?\s*(\d{1,3})/);
  if (priceCap) {
    const cap = parseInt(priceCap[1], 10);
    // Από το φθηνότερο, ώστε τα δύο που αναφέρω με το όνομά τους να είναι
    // και τα δύο πρώτα του carousel.
    const picks = menu
      .filter((m) => m.price <= cap && available(m) && !['wine', 'cocktails'].includes(m.category))
      .sort((a, b) => a.price - b.price);
    if (!picks.length) {
      const cheapest = [...menu].filter(available).sort((a, b) => a.price - b.price)[0];
      return { text: `Απόψε δεν υπάρχει κάτι κάτω από ${money(cap)} — το πιο κοντινό είναι ${cheapest.name.toLowerCase()} στα ${money(cheapest.price)}.` };
    }
    const [first, second] = picks;
    return {
      text: `${picks.length} πιάτα είναι ${money(cap)} ή λιγότερο. ${second ? `Εγώ θα έπαιρνα ${first.name.toLowerCase()} και ${second.name.toLowerCase()}.` : `Εγώ θα έπαιρνα ${first.name.toLowerCase()}.`}`,
      blocks: [{ type: 'items', ids: picks.map((m) => m.id), layout: 'carousel', label: `Έως ${money(cap)}` }],
    };
  }

  /* --- παιδιά --- */
  if (has(t, 'παιδί', 'παιδιά', 'παιδικ', 'μικρό', 'kid', 'child')) {
    const kid = menu.filter((m) => m.kidFriendly);
    return {
      text: `${restaurant.policies.kids} Αυτά τα τρία δεν γυρίζουν ποτέ πίσω στην κουζίνα.`,
      blocks: [{ type: 'items', ids: kid.map((m) => m.id), layout: 'carousel', label: 'Αρέσουν στα παιδιά' }],
    };
  }

  /* --- συνδυασμός κρασιού --- */
  if (has(t, 'κρασί', 'wine') && has(t, 'ταιριάζ', 'πάει', 'με το', 'με τη', 'pair', 'goes')) {
    const mentioned = findItems(t).filter((f) => getItem(f.itemId).category !== 'wine');
    const dish = mentioned[0] ? getItem(mentioned[0].itemId) : getItem('seabass');
    const pairIds = (dish.pairs || []).filter((p) => getItem(p)?.category === 'wine');
    const ids = pairIds.length ? pairIds : ['assyrtiko'];
    const why = {
      seabass: 'Ασύρτικο — η αλμύρα περνάει μέσα από το ψητό ψάρι και η οξύτητα κόβει το λαδολέμονο. Το ίδιο θα σας έλεγε και ο Νίκος.',
      lamb: 'Ξινόμαυρο. Φύλλο ντομάτας και στιβαρή τανίνη απέναντι σε σιγομαγειρεμένο αρνί — η κλασική απάντηση της Νάουσας.',
      orzo: 'Ξινόμαυρο — η τρούφα και η γραβιέρα θέλουν τανίνη, αλλιώς το πιάτο πλαταίνει.',
      octopus: 'Ασύρτικο. Κάρβουνο και μεταλλικό λευκό: γι’ αυτό υπάρχει λίστα Σαντορίνης.',
      burrata: 'Μαλαγουζιά — ροδάκινο και βασιλικός δίπλα στην κρέμα και στα ψητά σταφύλια.',
    }[dish.id] ?? 'Το Ασύρτικο είναι η ασφαλής και εξαιρετική απάντηση με σχεδόν ό,τι ψήνουμε.';
    return {
      text: `Με ${dish.name.toLowerCase()}: ${why}`,
      blocks: [{ type: 'items', ids, layout: 'carousel', label: 'Σε ποτήρι' }],
    };
  }

  /* --- τροποποιήσεις --- */
  if (has(t, 'χωρίς') && findItems(t).length) {
    const item = getItem(findItems(t)[0].itemId);
    return {
      text: `Ναι — το σημειώνω στο δελτίο. ${item.name} χωρίς αυτό δεν είναι κανένα πρόβλημα για την κουζίνα.`,
      blocks: [{ type: 'items', ids: [item.id], layout: 'carousel', label: 'Με αλλαγή' }],
    };
  }

  /* --- παραγγελία --- */
  const orderVerb = /(βαλε|βαλτε|προσθεσε|παραγγειλ|θελουμε|θελω|φερε|φερτε|να παρουμε|να παρω|μασ φερνετε|add |order )/.test(t);
  const items = findItems(t);
  if (orderVerb && items.length) {
    const okItems = items.filter((i) => available(getItem(i.itemId)));
    const sold = items.filter((i) => !available(getItem(i.itemId)));
    const id = uid('d');
    if (!okItems.length) {
      const s = getItem(sold[0].itemId);
      return { text: `${s.name} ${s.unavailableNote.toLowerCase()}, λυπάμαι. Είναι το μόνο που μας τελείωσε απόψε.` };
    }
    const soldNote = sold.length ? ` ${getItem(sold[0].itemId).name} εξαντλήθηκε απόψε, οπότε δεν το έβαλα.` : '';
    return {
      pre: [{ type: 'CREATE_DRAFT', id, items: okItems }],
      text: `${listNames(okItems.map((i) => i.itemId))} — έτοιμα όποτε πείτε.${soldNote}`,
      blocks: [{ type: 'draft', id }],
    };
  }

  /* --- προτάσεις --- */
  if (has(t, 'προτείν', 'πρότεινε', 'συστήν', 'τι είναι καλό', 'τι να πάρουμε', 'πεινάμε', 'recommend', 'suggest')) {
    const forTwo = has(t, 'δύο', 'δυο', 'μοιραστ', 'μας', 'two', 'share');
    if (forTwo || table.party === 2) {
      return {
        text: 'Αν θέλετε να μοιραστείτε, θα ξεκινούσα με το χταπόδι και τη burrata, και μετά λαβράκι για κυρίως — έρχεται ολόκληρο και χωρίζει εύκολα. Αν πεινάτε, βάλτε και το κριθαράκι στη μέση.',
        blocks: [
          { type: 'items', ids: ['octopus', 'burrata', 'seabass', 'orzo'], layout: 'carousel', label: 'Τραπέζι για δύο' },
          actionsBlock([
            {
              label: 'Και τα τέσσερα',
              act: 'draft',
              payload: { items: [{ itemId: 'octopus', qty: 1 }, { itemId: 'burrata', qty: 1 }, { itemId: 'seabass', qty: 1 }, { itemId: 'orzo', qty: 1 }] },
              tone: 'primary',
            },
            askAction('Μόνο τα δύο πρώτα', 'Βάλε το χταπόδι και τη burrata'),
            askAction('Κρασί με αυτά', 'Ποιο κρασί ταιριάζει με το λαβράκι;'),
          ]),
        ],
      };
    }
    return {
      text: 'Το λαβράκι, χωρίς δεύτερη σκέψη — ολόκληρο, στα κάρβουνα, με λαδολέμονο στο πάσο.',
      blocks: [{ type: 'items', ids: ['seabass', 'octopus'], layout: 'carousel', label: 'Επιλογές του σεφ' }],
    };
  }

  /* --- περιήγηση καταλόγου --- */
  const cat = findCategory(t);
  if (cat && has(t, 'δείξε', 'δείξτε', 'τι έχετε', 'έχετε', 'λίστα', 'κατάλογο', 'show', 'menu')) {
    const list = itemsIn(cat);
    const c = getCategory(cat);
    return {
      text: `${c.name} — ${c.note.toLowerCase()}.`,
      blocks: [{ type: 'items', ids: list.map((m) => m.id), layout: 'carousel', label: c.name }],
    };
  }
  if (has(t, 'κατάλογο', 'κατάλογος', 'μενού', 'menu')) {
    return {
      text: 'Ορίστε ο αποψινός κατάλογος. Είναι ζωντανός — ό,τι τελειώνει στην κουζίνα σβήνει κι από εδώ.',
      blocks: [{ type: 'categories' }],
    };
  }
  if (cat) {
    const list = itemsIn(cat);
    return {
      text: `${getCategory(cat).name}, λοιπόν.`,
      blocks: [{ type: 'items', ids: list.map((m) => m.id), layout: 'carousel', label: getCategory(cat).name }],
    };
  }

  /* --- σκέτη αναφορά πιάτου --- */
  if (items.length) {
    const item = getItem(items[0].itemId);
    return {
      text: `${item.name} — ${item.description.toLowerCase()}. ${money(item.price)}.${item.available ? '' : ` ${item.unavailableNote}.`}`,
      blocks: [{ type: 'items', ids: items.map((i) => i.itemId), layout: 'carousel' }],
    };
  }

  /* --- αξιολόγηση --- */
  if (has(t, 'αξιολόγ', 'σχόλιο', 'γνώμη', 'feedback', 'rate')) {
    return { text: 'Πώς σας φάνηκαν όλα απόψε;', blocks: [{ type: 'feedback' }] };
  }

  /* --- εφεδρική απάντηση: πάντα χρήσιμη, ποτέ γενικόλογη --- */
  return {
    text: `Δεν είμαι σίγουρος ότι το έπιασα. Μπορώ να αναλάβω τον κατάλογο, τα αλλεργιογόνα, την παραγγελία, τον λογαριασμό, ή να φέρω κάποιον στο ${table.label}.`,
    blocks: [actionsBlock([
      askAction('Ο κατάλογος', 'Δείξε μου τον κατάλογο'),
      askAction('Πρότεινέ μου κάτι', 'Τι προτείνετε για δύο άτομα;'),
      askAction('Κάλεσε σερβιτόρο', 'Καλέστε τον σερβιτόρο'),
    ])],
  };
}

/* ---------- προτάσεις πάνω από τον composer ---------- */

export function suggestionsFor(state) {
  const ask = (label, text) => ({ label, text });
  const waiterOut = state.waiter?.status === 'active';

  // Ποτέ δεν προτείνουμε κάτι που ήδη τρέχει — αν ο σερβιτόρος έχει κληθεί,
  // η κατάστασή του φαίνεται στην κεφαλίδα, δεν χρειάζεται δεύτερο κουμπί.
  const callWaiter = waiterOut
    ? ask('Κωδικός Wi-Fi', 'Ποιος είναι ο κωδικός του Wi-Fi;')
    : ask('Κάλεσε σερβιτόρο', 'Καλέστε τον σερβιτόρο');

  if (state.feedback?.submitted) {
    return [
      ask('Απόδειξη με email', 'Μπορείτε να μου στείλετε την απόδειξη;'),
      ask('Κωδικός Wi-Fi', 'Ποιος είναι ο κωδικός του Wi-Fi;'),
      ask('Πού είναι η τουαλέτα;', 'Πού είναι η τουαλέτα;'),
    ];
  }
  if (state.payment) {
    return [
      ask('Αξιολόγηση', 'Θέλω να αφήσω μια αξιολόγηση'),
      ask('Απόδειξη με email', 'Μπορείτε να μου στείλετε την απόδειξη;'),
      callWaiter,
    ];
  }
  if (state.order.stage === 'served') {
    return [
      ask('Επιδόρπια', 'Δείξε μου τα επιδόρπια'),
      ask('Μοίρασε τον λογαριασμό', 'Να μοιράσουμε τον λογαριασμό'),
      ask('Πληρωμή', 'Θέλουμε να πληρώσουμε'),
      callWaiter,
    ];
  }
  if (state.order.items.length) {
    return [
      ask('Πού είναι το φαγητό;', 'Πού είναι το φαγητό μας;'),
      ask('Κρασί', 'Δείξε μου τα κρασιά'),
      ask('Κι άλλο νερό', 'Μπορούμε να έχουμε κι άλλο νερό;'),
      ask('Ο λογαριασμός', 'Τι λέει ο λογαριασμός μας;'),
    ];
  }
  return [
    ask('Ο κατάλογος', 'Δείξε μου τον κατάλογο'),
    ask('Πρότεινέ μου δείπνο', 'Τι προτείνετε για δύο άτομα;'),
    ask('Χωρίς γλουτένη', 'Δεν τρώω γλουτένη. Τι μπορώ να φάω;'),
    callWaiter,
  ];
}

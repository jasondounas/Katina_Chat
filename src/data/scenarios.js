import { reducer, initialState } from '../engine/state.js';
import { actionsBlock, askAction } from '../engine/intents.js';
import { guest, table, staff } from './restaurant.js';

/**
 * Στιγμιότυπα παρουσίασης. Καθένα ξαναχτίζει μια πιστευτή συνεδρία μέχρι μια
 * συγκεκριμένη στιγμή, μέσα από τον ίδιο reducer που χρησιμοποιεί η εφαρμογή —
 * οπότε ένα φορτωμένο σενάριο δεν ξεχωρίζει από ένα που έφτιαξες με κλικ.
 */

const build = (id, fn) => {
  let s = { ...initialState, scenario: id };
  const api = {
    guest: (text) => { s = reducer(s, { type: 'PUSH', message: { role: 'guest', text } }); },
    ai: (text, blocks) => { s = reducer(s, { type: 'PUSH', message: { role: 'ai', text, blocks } }); },
    run: (action) => { s = reducer(s, action); },
    tick: (m = 1) => { s = reducer(s, { type: 'TICK', minutes: m }); },
  };
  fn(api);
  return s;
};

const welcomeTurn = (a) => {
  a.ai(
    `Καλώς ήρθατε στο Mpakalogatos, ${guest.name}. Είμαι εδώ για ό,τι χρειαστείτε στο ${table.label} — προτάσεις, παραγγελία, ποτά, τον λογαριασμό σας, ή να φωνάξω την ομάδα.`,
    [actionsBlock([
      askAction('Ο κατάλογος', 'Δείξε μου τον κατάλογο'),
      askAction('Πρότεινέ μου κάτι', 'Τι προτείνετε για δύο άτομα;'),
      askAction('Ποτά', 'Δείξε μου τα κρασιά'),
      askAction('Κάλεσε σερβιτόρο', 'Καλέστε τον σερβιτόρο'),
      askAction('Η παραγγελία μου', 'Η παραγγελία μου'),
    ])],
  );
};

const menuTurn = (a) => {
  a.tick(1);
  a.guest('Δείξε μου τον κατάλογο');
  a.ai('Ορίστε ο αποψινός κατάλογος. Είναι ζωντανός — ό,τι τελειώνει στην κουζίνα σβήνει κι από εδώ.', [{ type: 'categories' }]);
};

const recommendTurn = (a) => {
  a.tick(1);
  a.guest('Τι προτείνετε για δύο άτομα;');
  a.ai(
    'Αν θέλετε να μοιραστείτε, θα ξεκινούσα με το χταπόδι και τη burrata, και μετά λαβράκι για κυρίως — έρχεται ολόκληρο και χωρίζει εύκολα. Αν πεινάτε, βάλτε και το κριθαράκι στη μέση.',
    [
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
  );
};

/** Η παραγγελία που δίνει το τραπέζι των 100 € σε όλα τα σενάρια λογαριασμού. */
const seedFullOrder = (a, stage = 'served') => {
  a.run({
    type: 'SEED_ORDER',
    order: {
      number: 124,
      items: [
        { itemId: 'octopus', qty: 1 },
        { itemId: 'seabass', qty: 2 },
        { itemId: 'sparkling', qty: 2 },
        { itemId: 'assyrtiko', qty: 2 },
      ],
      stage,
      placedAt: '20:24',
      etaMin: 8,
    },
  });
};

export const scenarios = [
  {
    id: 'welcome', label: 'Υποδοχή', note: 'Σάρωσε το QR, τίποτα παραγγελμένο',
    state: build('welcome', (a) => { welcomeTurn(a); }),
  },
  {
    id: 'menu', label: 'Ο κατάλογος', note: 'Περιήγηση μέσα στη συνομιλία',
    state: build('menu', (a) => { welcomeTurn(a); menuTurn(a); }),
  },
  {
    id: 'recommend', label: 'Πρόταση AI', note: 'Αιτιολογημένος συνδυασμός για δύο',
    state: build('recommend', (a) => { welcomeTurn(a); recommendTurn(a); }),
  },
  {
    id: 'dietary', label: 'Διατροφικό φίλτρο', note: 'Χωρίς γλουτένη, ζωντανός υπολογισμός',
    state: build('dietary', (a) => {
      welcomeTurn(a);
      a.tick(2);
      a.guest('Δεν τρώω γλουτένη. Τι μπορώ να φάω;');
      a.ai(
        'Το κράτησα — χωρίς γλουτένη για το τραπέζι. Απόψε 9 πιάτα είναι χωρίς γλουτένη, σε κάθε κατηγορία. Η κουζίνα τα ετοιμάζει ξεχωριστά, οπότε δεν υπάρχει θέμα επιμόλυνσης.',
        [{ type: 'items', ids: ['octopus', 'peppers', 'greens', 'seabass', 'lamb', 'chicken', 'harissa-prawns', 'chocolate', 'granita'], layout: 'list', label: 'Χωρίς γλουτένη · 9 πιάτα' }],
      );
    }),
  },
  {
    id: 'order', label: 'Προσθήκη στην παραγγελία', note: 'Προσχέδιο σε αναμονή επιβεβαίωσης',
    state: build('order', (a) => {
      welcomeTurn(a);
      recommendTurn(a);
      a.tick(2);
      a.guest('Βάλε το χταπόδι και δύο ανθρακούχα νερά');
      a.run({ type: 'CREATE_DRAFT', id: 'd-demo', items: [{ itemId: 'octopus', qty: 1 }, { itemId: 'sparkling', qty: 2 }] });
      a.ai('Χταπόδι στα κάρβουνα και Ανθρακούχο νερό — έτοιμα όποτε πείτε.', [{ type: 'draft', id: 'd-demo' }]);
    }),
  },
  {
    id: 'waiter', label: 'Κλήση σερβιτόρου', note: 'Ο λόγος καταγράφηκε, η Μαρία ειδοποιήθηκε',
    state: build('waiter', (a) => {
      welcomeTurn(a);
      a.tick(3);
      a.guest('Καλέστε τον σερβιτόρο');
      a.ai('Ευχαρίστως. Τι χρειάζεστε; Βοηθάει να το ξέρει πριν έρθει.', [{ type: 'waiter-reasons' }]);
      a.tick(1);
      a.guest('Λείπει κάτι');
      a.run({ type: 'REQUEST_WAITER', id: 'w-demo', reasonId: 'missing', reasonLabel: 'Λείπει κάτι', staffId: staff.maria.id });
      a.ai(`Έγινε — η ${staff.maria.name} ειδοποιήθηκε και ξέρει για ποιο λόγο.`, [{ type: 'waiter', id: 'w-demo' }]);
    }),
  },
  {
    id: 'tracking', label: 'Πορεία παραγγελίας', note: 'Η κουζίνα στη μέση της υπηρεσίας',
    state: build('tracking', (a) => {
      welcomeTurn(a);
      seedFullOrder(a, 'preparing');
      a.tick(12);
      a.ai('Στάλθηκε στην κουζίνα. Παραγγελία #124 — κρατάω αυτή την κάρτα ενημερωμένη.', [{ type: 'order-status' }]);
      a.tick(6);
      a.guest('Πού είναι το φαγητό μας;');
      a.ai('Τα κυρίως πιάτα σας ετοιμάζονται. Η κουζίνα υπολογίζει περίπου 8–10 λεπτά.', [{ type: 'order-status' }]);
      a.tick(1);
      a.run({ type: 'REQUEST_SERVICE', id: 'svc-demo', itemId: 'water' });
      a.guest('Μπορούμε να έχουμε κι άλλο νερό;');
      a.ai('Φυσικά — έρχεται φρέσκια καράφα. Ενημέρωσα την ομάδα.', [{ type: 'service', id: 'svc-demo' }]);
    }),
  },
  {
    id: 'bill', label: 'Ο λογαριασμός', note: 'Όλα σερβιρισμένα',
    state: build('bill', (a) => {
      welcomeTurn(a);
      seedFullOrder(a, 'served');
      a.tick(48);
      a.guest('Τι λέει ο λογαριασμός μας;');
      a.ai('Ορίστε το Τραπέζι 14 όπως είναι αυτή τη στιγμή.', [{ type: 'bill' }]);
    }),
  },
  {
    id: 'split', label: 'Μοίρασμα', note: 'Δύο άτομα, ίσα μερίδια',
    state: build('split', (a) => {
      welcomeTurn(a);
      seedFullOrder(a, 'served');
      a.tick(50);
      a.guest('Μπορούμε να μοιράσουμε τον λογαριασμό;');
      a.ai('Δύο άτομα στο τραπέζι — μοιράστε τον όπως σας βολεύει.', [{ type: 'bill', compact: true }]);
      a.run({ type: 'OPEN_SHEET', sheet: 'split' });
    }),
  },
  {
    id: 'payment', label: 'Πληρωμή', note: 'Πληρωμένο με 10% φιλοδώρημα',
    state: build('payment', (a) => {
      welcomeTurn(a);
      seedFullOrder(a, 'served');
      a.tick(52);
      a.guest('Θέλουμε να πληρώσουμε');
      a.ai('Όποτε είστε έτοιμοι.', [{ type: 'bill', compact: true }]);
      a.tick(1);
      a.run({ type: 'PAY', payment: { method: 'apple', tipPct: 10, tip: 10, subtotal: 100, total: 110, mode: 'full' } });
      a.ai('Όλα εντάξει. Ευχαριστούμε που δειπνήσατε μαζί μας.', [{ type: 'receipt' }]);
    }),
  },
  {
    id: 'feedback', label: 'Αξιολόγηση', note: 'Μετά την πληρωμή, ανοιχτή βαθμολογία',
    state: build('feedback', (a) => {
      welcomeTurn(a);
      seedFullOrder(a, 'served');
      a.tick(52);
      a.run({ type: 'PAY', payment: { method: 'apple', tipPct: 10, tip: 10, subtotal: 100, total: 110, mode: 'full' } });
      a.ai('Όλα εντάξει. Ευχαριστούμε που δειπνήσατε μαζί μας.', [{ type: 'receipt' }]);
      a.tick(1);
      a.ai('Πώς σας φάνηκαν όλα απόψε;', [{ type: 'feedback' }]);
    }),
  },
];

export const scenarioById = (id) => scenarios.find((s) => s.id === id) ?? scenarios[0];

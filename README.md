# KatinaBot — AI host for the restaurant table

An interactive prototype of the **KatinaBot** conversational guest assistant, running
white-label for **Mpakalogatos Αθήνα** — a fictional contemporary Mediterranean restaurant.
The guest (Άλεξ) has scanned the QR code on Τραπέζι 14 and is talking to the house.

**The interface is in Greek.** Menu items keep the spelling a real Athens menu would
use: Greek where Greek is natural (Ασύρτικο, Ξινόμαυρο, Ταραμοσαλάτα, Λαβράκι), Latin
where the product name is the product (burrata, gnocchi, tagliolini, harissa, Negroni,
Spritz, Vinsanto, Apple Pay). Prices follow the el-GR convention — `18 €`, `110,00 €`.

KatinaBot is the platform; Mpakalogatos is the tenant. The guest never sees our brand except
as a single line at the top of the thread — the restaurant's identity is the one on
screen. The demo console outside the phone is the only place KatinaBot leads.

All data is fictional. No payment processor, no backend, no network calls.

## Run it

```bash
npm install
npm run dev
```

Open the printed URL. On desktop you get the presentation stage: the demo console on
the left, the phone in the middle. On a real phone the frame disappears and the guest
experience fills the viewport.

## The idea

Almost everything a guest needs can happen in one conversation — but not everything
should be *typed*. The prototype is a **hybrid conversational UI**: natural language
carries intent and explanation, native components carry structure and action.

| The guest types | They get |
| --- | --- |
| «Δείξε μου τον κατάλογο» | A category grid, browsed in-thread |
| «Τι προτείνετε για δύο άτομα;» | Reasoning, then the four dishes as cards |
| «Δεν τρώω γλουτένη» | The 9 compatible dishes, computed from the data |
| «Βάλε το χταπόδι και δύο ανθρακούχα νερά» | An editable order card, nothing sent yet |
| «Καλέστε τον σερβιτόρο» | *Why?* first — then Maria arrives already knowing |
| «Πού είναι το φαγητό μας;» | A live kitchen stepper with a real estimate |
| «Τι λέει ο λογαριασμός μας;» | An itemised bill with printed-receipt leaders |
| «Θέλουμε να πληρώσουμε» / «Μοίρασμα» | Bottom sheets for tip, method and shares |

The matcher normalises accents and final sigma before every comparison, so «λαβράκι»,
«λαβρακι» and «λαβράκια» all resolve to the same dish. English phrasings still work —
a guest should never have to guess the language. Note that JavaScript's `\b` is defined
over `[A-Za-z0-9_]` and never fires next to a Greek letter, so no word-boundary anchors
are used in the Greek patterns.

## Design direction — two rooms, one system

Every colour is a semantic token, so the product has two complete skins. **Day** is the
default; **Night** is one click away in the demo console.

- **Day — "Daylight."** Whitewashed limestone and plaster, deep olive-ink type, a
  bronze accent: `--screen #F7F6F2`, `--text #1A1714`, `--accent #8F6210`. Cooler and
  greyer on purpose than the cream-and-terracotta every Mediterranean brief defaults to.
- **Night — "Evening light."** The same room once service starts: `--screen #17130F`,
  `--text #EFE9E0`, lamplight `--accent #D9A75B`.
- **One accent carries hospitality.** A second, `--live` (teal), is reserved strictly
  for things happening right now — a cooking order, a request in flight — and is never
  used decoratively. It is the only colour that means "this is moving."
- Both accents clear 4.5:1 as text and 3:1 as graphics, in both themes.
- On day, a ceramic plate on a pale ground would vanish, so dish art sits in a warm
  tabletop well with a rim and a shadow. The tokens carry that; the components don't
  know which theme they're in.
- **Type — chosen for Greek, not adapted to it.** Instrument Serif, Newsreader and
  Instrument Sans ship *zero* Greek glyphs, so the original stack was replaced rather
  than patched:
  - **GFS Didot** — the venue's identity and totals. From the Greek Font Society, based
    on the Greek types Didot cut for Athens. The one face that could not have been
    chosen for any other city.
  - **Literata** — the assistant's voice. Upright, warm, contemporary at 16.5px.
    (EB Garamond was tried first; its Greek follows the sloped *grecs du roi*, so body
    copy read as italic — wrong for a product voice.)
  - **Commissioner** — labels, prices, controls, and the KatinaBot wordmark, so platform
    and venue never share a voice.
  - System mono — demo console only, so it cannot be mistaken for the product.
- **Uppercase is kept, with `lang="el"`** — browsers then strip the tonos correctly
  (ΤΟ ΤΡΑΠΕΖΙ ΣΑΣ), which is proper Greek. The one exception is the dietary chips: Greek
  caps at 8.5px are genuinely hard to read and too wide for a 176px card, so those run
  sentence case.
- **The signature move: the assistant has no chat bubble.** It speaks as typeset serif
  text on the surface, marked by a single accent dot. Only the guest gets an object — a
  pill that inverts the ground (dark on day, light on night). That inversion is what
  stops the screen reading as a chatbot, and it survives both themes.
- **Dish imagery is real photography, with a designed fallback.** `Plate.jsx` resolves
  in three steps: an `image` (real photo, 15 food items) → a `vessel` (drawn wine glass,
  tumbler, highball, bottle — a stock photo of a wine glass says nothing) → generated
  `blobs`. The fallback is not decoration: `<img onError>` drops to it, so a missing
  file can never show a broken image mid-pitch. One dessert (γρανίτα) is deliberately on
  the fallback because no free-licence photo read as granita at thumbnail size.
- Photos are **downloaded to `public/dishes/`, not hotlinked** — a live demo must not
  depend on someone else's CDN. Source is Wikimedia Commons under CC licences;
  attribution per dish is in `src/data/photo-credits.json`.

## State model

One reducer (`src/engine/state.js`) owns the table session:

```
phase      seated → ordered → dining → paid → closed   (derived, never set by hand)
messages   [{ id, role, text, blocks[], at }]
drafts     { id: { items[], status } }     pending order, editable until confirmed
order      { number, items[], stage, placedAt, etaMin }
services   [{ id, itemId, at, status }]    water, bread, cutlery…
waiter     { reasonId, staffId, at, status } | null
payment    { method, tip, total, mode, receiptEmail } | null
feedback   { stars, tags[], note, submitted } | null
sheet      { type, payload } | null
```

Messages carry typed **blocks**. Most blocks hold only an id and read live state at
render time, so a card rendered ten turns ago still tells the truth: cancel a waiter
request and the card greys out in place; the kitchen advances and every order card
moves with it.

`src/engine/intents.js` is a small matcher over the real menu data. It is not an LLM,
but every answer — prices, allergens, heat, stock, pairings — is computed from the
dataset, which is what makes free typing hold up in a demo.

## Component hierarchy

```
App
└ SessionProvider                      reducer + action API
  ├ DemoScenarioSwitcher               presenter console (desktop rail / mobile pill)
  └ MobileShell                        device frame, status bar, toast
    ├ RestaurantHeader                 identity + the live state rail
    ├ Conversation
    │ ├ UserMessage / AIMessage
    │ └ BlockRenderer                  the hybrid rule, in one place
    │   ├ MenuCategoryCard MenuItemCard MenuItemRow TagList Plate
    │   ├ QuickActions OrderSummaryCard OrderStatusCard
    │   ├ ServiceRequestCard WaiterCard BillCard ReceiptCard
    │   └ FeedbackCard InfoCard
    ├ ChatComposer                     contextual chips + input
    └ SheetHost → PaymentSheet SplitBillSheet CategorySheet ItemSheet
```

## Demo scenarios

The console seeds eleven moments — Welcome, Explore menu, AI recommendation, Dietary
filter, Add to order, Waiter request, Order tracking, Current bill, Split bill,
Payment, Feedback. Each is rebuilt through the same reducer the live app uses, so a
seeded state is indistinguishable from one you clicked into. **Live controls** below
them advance the kitchen, open the payment sheet, or re-ask for feedback mid-pitch, and
a `day` / `night` switch flips the theme without leaving the scenario.

## Product decisions worth pointing at

- **Calling a waiter asks why first.** The person who walks over already knows what
  it is about — that is the difference between a call button and a host.
- **Nothing reaches the kitchen without confirmation.** The order card is editable
  right up to the moment it is sent.
- **The interface is visibly stateful.** The header rail shows one thing, chosen by
  urgency: a paged waiter outranks a cooking order, which outranks a resting table.
  Tapping it asks the question that state implies.
- **Suggestions never repeat what is already in flight.** With a waiter en route, the
  "Call waiter" chip is replaced; after payment the chips lead with feedback and receipt.
- **No "view detailed bill".** The bill card is already itemised; a second screen
  showing the same rows would be a menu item, not a feature.

## Swapping the photography

The images that ship here are free-licence Commons photos: honest, but not the
lit-and-styled photography a real client would use. Two scripts do the work:

```bash
node tools/commons-candidates.mjs   # 6 candidates per dish → tools/cand/sheet.html
node tools/apply-picks.mjs          # copy the chosen index into public/dishes/
```

To use the client's own instead, drop files into `public/dishes/<item-id>.jpg` — the
`image` field in `src/data/restaurant.js` already points there and nothing else changes.

## Not included

Real payments, real ordering, persistence, authentication, i18n, and a genuine LLM.
The data layer is shaped the way an API would return it, so those are the seams.

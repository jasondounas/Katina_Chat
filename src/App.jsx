import { SessionProvider, useSession } from './engine/session.jsx';
import MobileShell from './components/MobileShell.jsx';
import RestaurantHeader from './components/RestaurantHeader.jsx';
import Conversation from './components/Conversation.jsx';
import ChatComposer from './components/ChatComposer.jsx';
import SheetHost from './components/SheetHost.jsx';
import DemoScenarioSwitcher from './components/DemoScenarioSwitcher.jsx';
import { restaurant, table, platform } from './data/restaurant.js';

// Same idea as customer.html: `?table=T-1` on the URL means "this is a real
// guest at a real table on the real backend," not the scripted demo.
const liveTableId = new URLSearchParams(window.location.search).get('table');

function LiveLoadingGate({ children }) {
  const { live, isLive } = useSession();
  if (isLive && !live.menuLoaded) {
    return <p className="stage__caption">Φόρτωση καταλόγου…</p>;
  }
  return children;
}

export default function App() {
  return (
    <SessionProvider liveTableId={liveTableId}>
      <div className="stage">
        {!liveTableId && <DemoScenarioSwitcher />}

        <main className="stage__main">
          {!liveTableId && (
            <section className="pitch">
              <div className="pitch__eyebrow">{platform.name} · διαδραστικό prototype</div>
              <h1 className="pitch__line">Όλο το τραπέζι, σε <em>μία συνομιλία.</em></h1>
              <p className="pitch__body">
                Ο επισκέπτης σαρώνει τον κωδικό στο {table.label} του {restaurant.name} {restaurant.city}.
                Χωρίς εφαρμογή, χωρίς κατάλογο σε PDF — ένας ψηφιακός οικοδεσπότης που
                ξέρει την κουζίνα, τα αλλεργιογόνα και τον λογαριασμό.
              </p>
              <p className="pitch__hint">
                Διαλέξτε σενάριο αριστερά, ή γράψτε μια πραγματική ερώτηση στη μπάρα.
                Κάθε απάντηση υπολογίζεται από τα δεδομένα του καταλόγου.
              </p>
            </section>
          )}

          <LiveLoadingGate>
            <MobileShell>
              <div className="app">
                <RestaurantHeader />
                <Conversation />
                <ChatComposer />
                <SheetHost />
              </div>
            </MobileShell>
          </LiveLoadingGate>

          {!liveTableId && (
            <p className="stage__caption">
              {platform.name} σε white-label για το {restaurant.name} {restaurant.city} · {table.label} · σάρωση QR στις 20:12
            </p>
          )}
        </main>
      </div>
    </SessionProvider>
  );
}

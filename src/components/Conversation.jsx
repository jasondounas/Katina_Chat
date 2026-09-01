import { useEffect, useRef } from 'react';
import { useSession } from '../engine/session.jsx';
import BlockRenderer, { isBleed } from './BlockRenderer.jsx';
import { restaurant, platform, table, guest } from '../data/restaurant.js';

export default function Conversation() {
  const { state } = useSession();
  const end = useRef(null);
  const scroller = useRef(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [state.messages.length, state.typing, state.scenario]);

  return (
    <div className="thread" ref={scroller}>
      <div className="thread__inner">
        <div className="origin">
          <span className="origin__rule" />
          <span className="origin__text">
            {table.label} · έναρξη {guest.seatedAt} · {platform.name}
          </span>
          <span className="origin__rule" />
        </div>

        {state.messages.map((m, i) => {
          const prev = state.messages[i - 1];
          // Μια κάρτα κλείνει την ομάδα: η επόμενη ατάκα είναι νέα σκέψη, όχι
          // συνέχεια, οπότε ξανακερδίζει το σημάδι.
          const opensGroup = !prev || prev.role !== 'ai' || prev.blocks?.length > 0;
          return m.role === 'guest'
            ? <UserMessage key={m.id} message={m} />
            : <AIMessage key={m.id} message={m} showMark={opensGroup} />;
        })}

        {state.typing && <Typing />}
        <div ref={end} style={{ height: 1 }} />
      </div>
    </div>
  );
}

/** Ο επισκέπτης είναι το μόνο αντικείμενο στη ροή — όλα τα άλλα είναι τυπογραφία. */
function UserMessage({ message }) {
  return (
    <div className="turn turn--guest">
      <div className="turn__pill">{message.text}</div>
    </div>
  );
}

function AIMessage({ message, showMark }) {
  return (
    <div className="turn turn--ai">
      {showMark && (
        <div className="turn__mark">
          <i />
          <span>{restaurant.name}</span>
        </div>
      )}

      {message.text && <p className="turn__voice">{message.text}</p>}

      {message.blocks?.length > 0 && (
        <div className="blocks">
          {message.blocks.map((b, i) => (
            <div key={`${b.type}-${i}`} className={isBleed(b) ? 'block--bleed' : undefined}>
              <BlockRenderer block={b} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Typing() {
  return (
    <div className="turn turn--ai">
      <div className="turn__mark">
        <i />
        <span>{restaurant.name}</span>
      </div>
      <div className="typing" aria-label="Συνθέτει απάντηση">
        <i /><i /><i />
      </div>
    </div>
  );
}

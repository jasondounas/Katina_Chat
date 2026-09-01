import { useState } from 'react';
import { useSession } from '../engine/session.jsx';
import { suggestionsFor } from '../engine/intents.js';
import { ArrowUp, Mic } from './Icons.jsx';

export default function ChatComposer() {
  const { state, api } = useSession();
  const [value, setValue] = useState('');
  const suggestions = suggestionsFor(state);

  const submit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    api.send(value);
    setValue('');
  };

  return (
    <div className="composer">
      <div className="chips">
        {suggestions.map((s, i) => (
          <button
            key={s.label}
            className="chip"
            style={{ animationDelay: `${i * 40}ms` }}
            onClick={() => api.send(s.text)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <form className="bar" onSubmit={submit}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ρωτήστε με οτιδήποτε…"
          aria-label="Ρωτήστε τον οικοδεσπότη του Mpakalogatos"
          enterKeyHint="send"
        />
        {value.trim() ? null : (
          <button type="button" className="iconbtn" onClick={() => api.toast('Η φωνή δεν είναι συνδεδεμένη σε αυτό το prototype')} aria-label="Μιλήστε αντί να γράψετε">
            <Mic width={17} height={17} />
          </button>
        )}
        <button type="submit" className="iconbtn iconbtn--send" disabled={!value.trim()} aria-label="Αποστολή">
          <ArrowUp width={17} height={17} />
        </button>
      </form>

      <div className="homebar" />
    </div>
  );
}

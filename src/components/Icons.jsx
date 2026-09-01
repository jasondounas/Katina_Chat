const base = {
  width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round',
};

export const ArrowUp = (p) => (
  <svg {...base} {...p}><path d="M8 13V3.5M8 3.5 4 7.5M8 3.5l4 4" /></svg>
);

export const Mic = (p) => (
  <svg {...base} {...p}>
    <rect x="6" y="2" width="4" height="7" rx="2" />
    <path d="M3.5 7.5a4.5 4.5 0 0 0 9 0M8 12v2" />
  </svg>
);

export const Check = (p) => (
  <svg {...base} {...p}><path d="M3 8.5 6.3 12 13 4.5" /></svg>
);

export const Chevron = (p) => (
  <svg {...base} {...p}><path d="M6 3.5 10.5 8 6 12.5" /></svg>
);

export const Close = (p) => (
  <svg {...base} {...p}><path d="M4 4l8 8M12 4l-8 8" /></svg>
);

export const Plus = (p) => (
  <svg {...base} {...p}><path d="M8 3.5v9M3.5 8h9" /></svg>
);

export const Minus = (p) => (
  <svg {...base} {...p}><path d="M3.5 8h9" /></svg>
);

export const Star = ({ filled, ...p }) => (
  <svg {...base} width="22" height="22" viewBox="0 0 22 22" fill={filled ? 'currentColor' : 'none'} {...p}>
    <path d="M11 2.6l2.5 5.2 5.6.8-4 4 .9 5.7L11 15.6l-5 2.7.9-5.7-4-4 5.6-.8z" />
  </svg>
);

export const Battery = () => (
  <svg width="24" height="12" viewBox="0 0 24 12" fill="none" aria-hidden="true">
    <rect x="0.5" y="0.5" width="19" height="11" rx="3" stroke="currentColor" strokeOpacity="0.5" />
    <rect x="2" y="2" width="15" height="8" rx="1.6" fill="currentColor" />
    <path d="M21 4.2v3.6a2 2 0 0 0 0-3.6z" fill="currentColor" fillOpacity="0.5" />
  </svg>
);

export const Signal = () => (
  <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor" aria-hidden="true">
    <rect x="0" y="8" width="3" height="4" rx="1" />
    <rect x="4.5" y="5.5" width="3" height="6.5" rx="1" />
    <rect x="9" y="3" width="3" height="9" rx="1" />
    <rect x="13.5" y="0.5" width="3" height="11.5" rx="1" fillOpacity="0.4" />
  </svg>
);

export const Wifi = () => (
  <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M1.4 4.2a10 10 0 0 1 13.2 0M3.8 6.9a6.4 6.4 0 0 1 8.4 0" />
    <circle cx="8" cy="9.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

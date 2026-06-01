/* icons.jsx — stroke icons that inherit currentColor. */

function Icon({ d, size = 24, sw = 2, fill = 'none', children, vb = 24, style }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill={fill}
         stroke={fill === 'none' ? 'currentColor' : 'none'} strokeWidth={sw}
         strokeLinecap="round" strokeLinejoin="round" style={style}>
      {d ? <path d={d} /> : children}
    </svg>
  );
}

const IconPlus     = (p) => <Icon {...p} d="M12 5v14M5 12h14" />;
const IconPlay     = (p) => <Icon {...p} fill="currentColor" d="M7 4.5v15l13-7.5z" />;
const IconPause    = (p) => <Icon {...p} fill="currentColor"><rect x="6" y="4.5" width="4" height="15" rx="1.2"/><rect x="14" y="4.5" width="4" height="15" rx="1.2"/></Icon>;
const IconNext     = (p) => <Icon {...p} fill="currentColor"><path d="M6 5l10 7-10 7z"/><rect x="17" y="5" width="2.6" height="14" rx="1"/></Icon>;
const IconPrev     = (p) => <Icon {...p} fill="currentColor"><path d="M18 5L8 12l10 7z"/><rect x="4.4" y="5" width="2.6" height="14" rx="1"/></Icon>;
const IconStop     = (p) => <Icon {...p} fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2.5"/></Icon>;
const IconClose    = (p) => <Icon {...p} d="M6 6l12 12M18 6L6 18" />;
const IconChevL    = (p) => <Icon {...p} d="M15 5l-7 7 7 7" />;
const IconChevR    = (p) => <Icon {...p} d="M9 5l7 7-7 7" />;
const IconTrash    = (p) => <Icon {...p}><path d="M4 7h16M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7M6 7l1 12.5A1.5 1.5 0 008.5 21h7a1.5 1.5 0 001.5-1.5L18 7"/></Icon>;
const IconGrip     = (p) => <Icon {...p} fill="currentColor" sw={0}><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></Icon>;
const IconRepeat   = (p) => <Icon {...p}><path d="M4 9a5 5 0 015-5h7M4 9l3-3M4 9l3 3"/><path d="M20 15a5 5 0 01-5 5H8M20 15l-3 3M20 15l-3-3"/></Icon>;
const IconReplay   = (p) => <Icon {...p} fill="currentColor" sw={0} d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />;
const IconGear     = (p) => <Icon {...p} fill="currentColor" sw={0} d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54A.484.484 0 0 0 13.45 2h-3.84c-.24 0-.44.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L1.74 8.47a.49.49 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.03.24.23.41.47.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" />;
const IconClock    = (p) => <Icon {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></Icon>;
const IconCheck    = (p) => <Icon {...p} d="M5 12.5l4.5 4.5L19 7" />;
const IconBolt     = (p) => <Icon {...p} fill="currentColor" sw={0} d="M13 2L4 14h6l-1 8 9-12h-6z" />;
const IconSound    = (p) => <Icon {...p}><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8 8 0 010 12"/></Icon>;
const IconEdit     = (p) => <Icon {...p}><path d="M4 20h4L18.5 9.5a2 2 0 000-2.8l-1.2-1.2a2 2 0 00-2.8 0L4 16v4z"/><path d="M13.5 6.5l4 4"/></Icon>;

Object.assign(window, {
  IconPlus, IconPlay, IconPause, IconNext, IconPrev, IconStop, IconClose,
  IconChevL, IconChevR, IconTrash, IconGrip, IconRepeat, IconReplay, IconGear, IconClock,
  IconCheck, IconBolt, IconSound, IconEdit,
});

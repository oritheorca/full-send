/* themes.js — three visual flavors for Interval Timer.
   Each theme provides CSS-variable tokens + JS meta (label colors, fonts,
   statusDark). Stage labels are color-coded: work = warm, rest = cool. */

(function () {
  // shared label intent: warmup / work / rest / cooldown / custom
  const THEMES = {
    sporty: {
      id: 'sporty',
      name: 'Pace',
      tagline: 'Sporty & energetic',
      statusDark: false,            // white status-bar glyphs (dark bg)
      fontUI: '"Saira", -apple-system, system-ui, sans-serif',
      fontDisplay: '"Saira Condensed", "Saira", sans-serif',
      displayWeight: 700,
      displayTracking: '0.01em',
      vars: {
        '--bg': '#0C0F14',
        '--surface': '#161B22',
        '--surface-2': '#1F262F',
        '--ink': '#FFFFFF',
        '--ink-muted': '#9AA4B2',
        '--ink-faint': '#5C6675',
        '--accent': '#D6FB3D',
        '--accent-ink': '#0C0F14',
        '--line': 'rgba(255,255,255,0.09)',
        '--line-strong': 'rgba(255,255,255,0.16)',
        '--radius-card': '22px',
        '--radius-inner': '15px',
        '--radius-pill': '999px',
        '--shadow-card': '0 1px 0 rgba(255,255,255,0.04)',
        '--shadow-float': '0 16px 40px rgba(0,0,0,0.5)',
      },
      labels: {
        warmup:   { color: '#FFB020', on: '#241700' },
        work:     { color: '#2FD86B', on: '#04230F' },
        rest:     { color: '#FF4D4D', on: '#FFFFFF' },
        cooldown: { color: '#3DA8FF', on: '#041629' },
        custom:   { color: '#D6FB3D', on: '#0C0F14' },
      },
    },

    poppy: {
      id: 'poppy',
      name: 'Bounce',
      tagline: 'Playful & poppy',
      statusDark: true,
      fontUI: '"Nunito", -apple-system, system-ui, sans-serif',
      fontDisplay: '"Fredoka", "Nunito", sans-serif',
      displayWeight: 600,
      displayTracking: '0',
      vars: {
        '--bg': '#FFF3E6',
        '--surface': '#FFFFFF',
        '--surface-2': '#FFE7D1',
        '--ink': '#2B2540',
        '--ink-muted': '#857E96',
        '--ink-faint': '#BBB4C6',
        '--accent': '#00C2A8',
        '--accent-ink': '#FFFFFF',
        '--line': 'rgba(43,37,64,0.08)',
        '--line-strong': 'rgba(43,37,64,0.14)',
        '--radius-card': '28px',
        '--radius-inner': '20px',
        '--radius-pill': '999px',
        '--shadow-card': '0 10px 24px rgba(123,92,80,0.12)',
        '--shadow-float': '0 18px 44px rgba(123,92,80,0.22)',
      },
      labels: {
        warmup:   { color: '#FFC23C', on: '#3A2700' },
        work:     { color: '#34D17F', on: '#053D20' },
        rest:     { color: '#FF5A52', on: '#FFFFFF' },
        cooldown: { color: '#8E7CFF', on: '#FFFFFF' },
        custom:   { color: '#00C2A8', on: '#FFFFFF' },
      },
    },

    minimal: {
      id: 'minimal',
      name: 'Mono',
      tagline: 'Premium minimal',
      statusDark: true,
      fontUI: '"Space Grotesk", -apple-system, system-ui, sans-serif',
      fontDisplay: '"Space Grotesk", -apple-system, sans-serif',
      displayWeight: 500,
      displayTracking: '-0.02em',
      vars: {
        '--bg': '#F6F5F2',
        '--surface': '#FFFFFF',
        '--surface-2': '#EEECE6',
        '--ink': '#16150F',
        '--ink-muted': '#6E6C63',
        '--ink-faint': '#A9A79D',
        '--accent': '#16150F',
        '--accent-ink': '#FFFFFF',
        '--line': 'rgba(22,21,15,0.10)',
        '--line-strong': 'rgba(22,21,15,0.18)',
        '--radius-card': '16px',
        '--radius-inner': '11px',
        '--radius-pill': '999px',
        '--shadow-card': '0 1px 2px rgba(22,21,15,0.05)',
        '--shadow-float': '0 16px 40px rgba(22,21,15,0.16)',
      },
      labels: {
        warmup:   { color: '#C9923E', on: '#FFFFFF' },
        work:     { color: '#3E9D5C', on: '#FFFFFF' },
        rest:     { color: '#C8432F', on: '#FFFFFF' },
        cooldown: { color: '#7E8A6B', on: '#FFFFFF' },
        custom:   { color: '#16150F', on: '#FFFFFF' },
      },
    },
  };

  // map a stage's label string to a label-intent key
  function labelIntent(label) {
    const l = (label || '').toLowerCase();
    if (l === 'warmup' || l === 'warm up') return 'warmup';
    if (l === 'work') return 'work';
    if (l === 'rest') return 'rest';
    if (l === 'cooldown' || l === 'cool down') return 'cooldown';
    return 'custom';
  }

  // color for a stage label within a theme
  function labelColor(theme, label) {
    return theme.labels[labelIntent(label)] || theme.labels.custom;
  }

  // color for a running segment ('work'|'rest'|'warmup'|'cooldown'|'custom')
  function segColor(theme, segType, label) {
    if (segType === 'rest') return theme.labels.rest;
    return labelColor(theme, label);
  }

  function styleVars(theme) {
    return { ...theme.vars };
  }

  window.IT_THEMES = THEMES;
  window.IT_themeList = ['sporty', 'poppy', 'minimal'];
  Object.assign(window, { labelIntent, labelColor, segColor, styleVars });
})();

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',   // toggled by adding/removing 'dark' class on <html>
  theme: {
    extend: {
      colors: {
        // ── Axilog brand ────────────────────────────────────────────
        'axilog-primary':        '#4A154B',
        'axilog-primary-dark':   '#3B1139',
        'axilog-primary-light':  '#7C3AED',
        'axilog-secondary':      '#00B388',
        'axilog-secondary-dark': '#009A74',
        'axilog-accent':         '#FF6B6B',
        'axilog-gray':           '#F5F5F5',
        'axilog-dark':           '#333333',

        // ── Dark mode surfaces ───────────────────────────────────────
        'dark-base':     '#0d1117',
        'dark-surface':  '#161b22',
        'dark-elevated': '#21262d',
        'dark-border':   '#30363d',
        'dark-text':     '#e6edf3',
        'dark-muted':    '#8b949e',

        // ── Network status ───────────────────────────────────────────
        'status-up':          '#22c55e',
        'status-degraded':    '#f59e0b',
        'status-down':        '#ef4444',
        'status-unknown':     '#6b7280',
        'status-maintenance': '#3b82f6',

        // ── Alarm severity ───────────────────────────────────────────
        'sev-critical': '#ef4444',
        'sev-major':    '#f97316',
        'sev-minor':    '#eab308',
        'sev-warning':  '#84cc16',
        'sev-cleared':  '#22c55e',
      },
      fontFamily: {
        'axilog': ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow-dash':  'flowDash 1.5s linear infinite',
      },
      keyframes: {
        flowDash: {
          '0%':   { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};

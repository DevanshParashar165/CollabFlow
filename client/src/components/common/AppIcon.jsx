const iconPaths = {
  grid: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z'],
  check: ['M9 12l2 2 4-4', 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  inbox: ['M4 4h16v12h-4l-2 3h-4l-2-3H4z', 'M4 12h5l2 2h2l2-2h5'],
  folder: ['M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z'],
  users: ['M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2', 'M9 11a4 4 0 100-8 4 4 0 000 8z', 'M22 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75'],
  settings: ['M12 8a4 4 0 100 8 4 4 0 000-8z', 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06-1.7 2.94-.08-.03a1.65 1.65 0 00-1.78.37l-.06.06h-3.4l-.02-.08a1.65 1.65 0 00-1.3-1.22l-.08-.02-1.7-2.94.06-.06A1.65 1.65 0 009.96 14l-.02-.08v-3.4l.08-.02a1.65 1.65 0 001.22-1.3l.02-.08 2.94-1.7.06.06a1.65 1.65 0 001.82.33l.06-.03 2.94 1.7-.03.08a1.65 1.65 0 00.37 1.78l.06.06v3.4z'],
  chevronDown: ['M6 9l6 6 6-6'],
  chevronRight: ['M9 18l6-6-6-6'],
  collapse: ['M15 18l-6-6 6-6'],
  expand: ['M9 18l6-6-6-6'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  close: ['M18 6L6 18', 'M6 6l12 12'],
  search: ['M11 19a8 8 0 100-16 8 8 0 000 16z', 'M21 21l-4.35-4.35'],
  logout: ['M10 17l5-5-5-5', 'M15 12H3', 'M12 3h6a2 2 0 012 2v14a2 2 0 01-2 2h-6'],
  briefcase: ['M3 7h18v13H3z', 'M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2', 'M3 12h18', 'M10 12v2h4v-2'],
  star: ['M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z'],
  more: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'],
};

export default function AppIcon({ name, className = 'h-5 w-5', strokeWidth = 1.8 }) {
  const paths = iconPaths[name];
  if (!paths) return null;

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((path) => <path key={path} d={path} />)}
    </svg>
  );
}

import type { ReactNode } from 'react';

function Icon({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const SearchIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
);
export const CartIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" />
    <circle cx="10" cy="20.5" r="1" />
    <circle cx="17" cy="20.5" r="1" />
  </Icon>
);
export const UserIcon = () => (
  <Icon>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
);
export const MenuIcon = () => (
  <Icon>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);
export const CloseIcon = () => (
  <Icon>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);
export const ArrowIcon = ({ size = 18 }: { size?: number }) => (
  <Icon size={size}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);
export const GridIcon = () => (
  <Icon size={24}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </Icon>
);
export const BoxIcon = () => (
  <Icon size={24}>
    <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
    <path d="m3 8 9 5 9-5M12 13v8" />
  </Icon>
);
export const BagIcon = () => (
  <Icon size={24}>
    <path d="M5 8h14l-1 12H6L5 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </Icon>
);
export const ClipboardIcon = () => (
  <Icon size={24}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4h6v3H9zM9 12h6M9 16h4" />
  </Icon>
);

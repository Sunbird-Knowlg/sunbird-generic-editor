/** Lightweight inline SVG icons (stroke = currentColor). */
import React from 'react';

type P = { size?: number; className?: string };
const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const UploadIcon: React.FC<P> = ({ size = 16, className }) => (
  <svg {...base(size)} className={className}>
    <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);
export const SaveIcon: React.FC<P> = ({ size = 13, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </svg>
);
export const CloseIcon: React.FC<P> = ({ size = 13, className }) => (
  <svg {...base(size)} className={className}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);
export const SendIcon: React.FC<P> = ({ size = 13, className }) => (
  <svg {...base(size)} className={className}><polyline points="22 2 11 13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
);
export const PencilIcon: React.FC<P> = ({ size = 12, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
export const ChevronDown: React.FC<P> = ({ size = 14, className }) => (
  <svg {...base(size)} className={className}><polyline points="6 9 12 15 18 9" /></svg>
);
export const LinkIcon: React.FC<P> = ({ size = 14, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
export const ImageIcon: React.FC<P> = ({ size = 16, className }) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
  </svg>
);
export const CheckIcon: React.FC<P> = ({ size = 15, className }) => (
  <svg {...base(size)} className={className}><polyline points="20 6 9 17 4 12" /></svg>
);
export const VideoIcon: React.FC<P> = ({ size = 16, className }) => (
  <svg {...base(size)} className={className}><rect x="2" y="2" width="20" height="20" rx="2" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
);
export const FileIcon: React.FC<P> = ({ size = 16, className }) => (
  <svg {...base(size)} className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
);
export const CommentIcon: React.FC<P> = ({ size = 16, className }) => (
  <svg {...base(size)} className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
);
export const SearchIcon: React.FC<P> = ({ size = 14, className }) => (
  <svg {...base(size)} className={className}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);
export const TrashIcon: React.FC<P> = ({ size = 14, className }) => (
  <svg {...base(size)} className={className}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
);
export const UsersIcon: React.FC<P> = ({ size = 13, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
export const UserPlusIcon: React.FC<P> = ({ size = 16, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);
export const HelpIcon: React.FC<P> = ({ size = 20, className }) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
export const AwardIcon: React.FC<P> = ({ size = 20, className }) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="8" r="7" /><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
  </svg>
);
export const ClipboardIcon: React.FC<P> = ({ size = 20, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);
export const BookIcon: React.FC<P> = ({ size = 17, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
/** Closed / bound textbook (spine on the left). */
export const BookClosedIcon: React.FC<P> = ({ size = 17, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
/**
 * Sunbird Spark mark — the "s" letterform plus the two brand dots, cropped from
 * the portal wordmark (sunbird-spark-portal/.../sunbird-logo.svg). Two-tone
 * orange palette (#bd4527 letter, #dc7727 dots) to match the portal brand.
 * viewBox is tightened around the "s" (x≈117–251) and the dots (cx≈437).
 */
export const SunbirdLogoIcon: React.FC<{ size?: number; className?: string }> = ({ size = 32, className }) => (
  <svg width={size} height={size} viewBox="110 245 360 300" fill="none" className={className} aria-label="Sunbird">
    <path fill="#bd4527" d="M116.83,453.56v-21.39h66.07c4.33,0,8.08-.95,11.24-2.85,3.16-1.89,5.55-4.37,7.18-7.44,1.62-3.07,2.44-6.32,2.44-9.75,0-3.25-.72-6.27-2.17-9.07-1.45-2.8-3.66-5.05-6.63-6.77-2.98-1.71-6.55-2.57-10.7-2.57h-27.89c-8.85,0-16.57-1.49-23.15-4.47-6.59-2.98-11.74-7.35-15.44-13.13-3.7-5.78-5.55-12.82-5.55-21.12,0-7.04,1.71-13.54,5.15-19.5,3.43-5.96,8.21-10.78,14.35-14.49,6.14-3.7,13.18-5.55,21.12-5.55h63.64v21.39h-61.2c-5.6,0-10.02,1.72-13.27,5.14-3.25,3.43-4.87,7.5-4.87,12.19s1.67,8.44,5.01,11.78c3.34,3.34,8.08,5.01,14.22,5.01h26.54c9.93,0,18.28,1.58,25.05,4.74,6.77,3.16,11.91,7.72,15.43,13.67,3.52,5.96,5.28,13.27,5.28,21.93,0,7.41-1.81,14.31-5.42,20.72-3.61,6.41-8.62,11.6-15.03,15.57-6.41,3.97-13.86,5.96-22.34,5.96h-69.05Z" />
    <circle fill="#dc7727" cx="437" cy="255.88" r="36" />
    <circle fill="#dc7727" cx="437" cy="505.98" r="36" />
  </svg>
);

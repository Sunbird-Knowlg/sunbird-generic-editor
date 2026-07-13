import React from 'react';
import { CloseIcon } from '../icons';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  titleIcon: React.ReactNode;
  title: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Localized label for the close button (falls back to English). */
  closeLabel?: string;
}

/** Slide-in drawer (right in LTR, left in RTL). Always mounted so the transform transition runs. */
const Drawer: React.FC<DrawerProps> = ({ open, onClose, titleIcon, title, footer, children, closeLabel = 'Close' }) => (
  <div className="ce-drawer" data-open={open} aria-hidden={!open}>
    <div className="ce-drawer-head">
      <div className="ce-drawer-title-row">
        <span className="ce-drawer-title-ic">{titleIcon}</span>
        <h3 className="ce-drawer-title">{title}</h3>
      </div>
      <button type="button" className="ce-icon-btn" onClick={onClose} aria-label={closeLabel}>
        <CloseIcon size={12} />
      </button>
    </div>
    <div className="ce-drawer-body">{children}</div>
    {footer && <div className="ce-drawer-foot">{footer}</div>}
  </div>
);

export default Drawer;

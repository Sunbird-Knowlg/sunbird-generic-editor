import React from 'react';
import { CloseIcon } from '../icons';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  titleIcon: React.ReactNode;
  title: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/** Slide-in right drawer. Always mounted so the transform transition runs. */
const Drawer: React.FC<DrawerProps> = ({ open, onClose, titleIcon, title, footer, children }) => (
  <div className="ce-drawer" data-open={open} aria-hidden={!open}>
    <div className="ce-drawer-head">
      <div className="ce-drawer-title-row">
        <span className="ce-drawer-title-ic">{titleIcon}</span>
        <h3 className="ce-drawer-title">{title}</h3>
      </div>
      <button type="button" className="ce-icon-btn" onClick={onClose} aria-label="Close">
        <CloseIcon size={12} />
      </button>
    </div>
    <div className="ce-drawer-body">{children}</div>
    {footer && <div className="ce-drawer-foot">{footer}</div>}
  </div>
);

export default Drawer;

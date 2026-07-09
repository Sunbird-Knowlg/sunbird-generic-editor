import React from 'react';
import type { ToastState } from '../useEditor';
import { CheckIcon, CloseIcon } from '../icons';

const Toast: React.FC<{ toast: ToastState | null }> = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className={`ce-toast${toast.kind === 'error' ? ' ce-toast--error' : ''}`} role="status">
      <span className="ce-toast-ic">{toast.kind === 'error' ? <CloseIcon size={15} /> : <CheckIcon size={15} />}</span>
      {toast.msg}
    </div>
  );
};

export default Toast;

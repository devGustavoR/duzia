'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Hide the default header (title + close button) */
  bare?: boolean;
  children: React.ReactNode;
}

/**
 * Bottom sheet for mobile. On >= md it renders as a centered dialog so the
 * same component works on desktop without a second layout.
 */
export function Sheet({ open, onClose, title, bare, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full md:max-w-lg max-h-[92vh] md:max-h-[88vh] overflow-y-auto overscroll-contain
                   bg-[#0b0b0d] border border-white/10 shadow-2xl
                   rounded-t-3xl md:rounded-2xl pb-safe
                   animate-sheet-up md:animate-fade-in"
      >
        {/* Drag handle (mobile only) */}
        <div className="md:hidden sticky top-0 z-10 flex justify-center pt-3 pb-2 bg-[#0b0b0d]">
          <span className="h-1.5 w-10 rounded-full bg-white/20" />
        </div>

        {!bare && (
          <div className="flex items-center justify-between px-5 pb-3 md:pt-5">
            <h2 className="text-base font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="p-2 -mr-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}

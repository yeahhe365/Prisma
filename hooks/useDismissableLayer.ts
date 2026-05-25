import { useEffect, type RefObject } from 'react';

type DismissableRef = RefObject<HTMLElement | null>;

export const useDismissableLayer = (
  refs: DismissableRef | DismissableRef[],
  isEnabled: boolean,
  onDismiss: () => void,
) => {
  useEffect(() => {
    if (!isEnabled) return;

    const dismissableRefs = Array.isArray(refs) ? refs : [refs];
    const containsTarget = (target: Node | null) =>
      Boolean(target && dismissableRefs.some((ref) => ref.current?.contains(target)));

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containsTarget(event.target as Node | null)) {
        onDismiss();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnabled, onDismiss, refs]);
};

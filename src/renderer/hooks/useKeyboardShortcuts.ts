import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface ShortcutHandlers {
  onBuild?: () => void;
  onStart?: () => void;
  onPackage?: () => void;
  onRefresh?: () => void;
}

export function useGlobalKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;

      if (isMod) {
        switch (e.key.toLowerCase()) {
          case 'o':
            e.preventDefault();
            navigate('/project');
            break;
          case ',':
            e.preventDefault();
            navigate('/settings');
            break;
          case '1':
            e.preventDefault();
            navigate('/');
            break;
          case '2':
            e.preventDefault();
            navigate('/project');
            break;
          case '3':
            e.preventDefault();
            navigate('/solutions');
            break;
          case '4':
            e.preventDefault();
            navigate('/designer');
            break;
          case '5':
            e.preventDefault();
            navigate('/gallery');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, location]);
}

export function useProjectKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;

      if (isMod) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            handlers.onBuild?.();
            break;
          case 'r':
            if (e.shiftKey) {
              e.preventDefault();
              handlers.onRefresh?.();
            }
            break;
          case 'enter':
            e.preventDefault();
            handlers.onStart?.();
            break;
          case 'p':
            if (e.shiftKey) {
              e.preventDefault();
              handlers.onPackage?.();
            }
            break;
        }
      }
    },
    [handlers]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

import { useEffect, useRef, useCallback, useState } from 'react';
import { useBuilderStore } from '@/stores/builder-store';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const AUTO_SAVE_DEBOUNCE_MS = 3000;
const BACKUP_KEY_PREFIX = 'cms-builder-backup-';

interface UseAutoSaveOptions {
    pageId: number;
    /** Whether auto-save is enabled. Defaults to true. */
    enabled?: boolean;
}

interface UseAutoSaveReturn {
    saveStatus: SaveStatus;
    lastSavedAt: Date | null;
    /** Force a manual save (bypasses debounce). */
    saveNow: () => Promise<void>;
}

/**
 * Debounced auto-save hook for the page builder.
 *
 * Watches the builder store's `blocks` for changes. When changes are detected
 * and the store is dirty, waits 3 seconds of inactivity, then sends a PATCH
 * request to persist the content. Shows save status indicator and falls back
 * to localStorage on failure.
 */
export function useAutoSave({ pageId, enabled = true }: UseAutoSaveOptions): UseAutoSaveReturn {
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef(true);

    // Clean up on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const performSave = useCallback(async () => {
        const state = useBuilderStore.getState();
        if (!state.isDirty) return;

        // Cancel any in-flight save
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        if (isMountedRef.current) {
            setSaveStatus('saving');
        }

        try {
            const csrfToken = document.querySelector<HTMLMetaElement>(
                'meta[name="csrf-token"]',
            )?.content;

            const response = await fetch(`/api/builder/pages/${pageId}/autosave`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ content: state.blocks }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                throw new Error(`Auto-save failed with status ${response.status}`);
            }

            if (isMountedRef.current) {
                setSaveStatus('saved');
                setLastSavedAt(new Date());

                // Clear dirty flag in the store
                useBuilderStore.setState({ isDirty: false });

                // Clear any existing localStorage backup on success
                localStorage.removeItem(`${BACKUP_KEY_PREFIX}${pageId}`);
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                // Request was aborted (e.g., new save started), not a real error
                return;
            }

            if (isMountedRef.current) {
                setSaveStatus('error');
            }

            // Save a localStorage backup so work is not lost
            try {
                const currentState = useBuilderStore.getState();
                localStorage.setItem(
                    `${BACKUP_KEY_PREFIX}${pageId}`,
                    JSON.stringify(currentState.blocks),
                );
            } catch {
                // localStorage may be full or unavailable; ignore silently
            }

            console.error('[AutoSave] Failed to auto-save:', error);
        }
    }, [pageId]);

    const saveNow = useCallback(async () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        await performSave();
    }, [performSave]);

    // Subscribe to store changes and debounce auto-save
    useEffect(() => {
        if (!enabled) return;

        const unsubscribe = useBuilderStore.subscribe((state, prevState) => {
            // Only trigger when blocks actually change and the store is dirty
            if (state.blocks !== prevState.blocks && state.isDirty) {
                // Clear any pending debounce timer
                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                }

                // Set a new debounce timer
                timerRef.current = setTimeout(() => {
                    performSave();
                }, AUTO_SAVE_DEBOUNCE_MS);
            }
        });

        return () => {
            unsubscribe();
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [enabled, performSave]);

    // On mount, check for a localStorage backup and offer recovery
    useEffect(() => {
        const backupKey = `${BACKUP_KEY_PREFIX}${pageId}`;
        const backup = localStorage.getItem(backupKey);

        if (backup) {
            try {
                const blocks = JSON.parse(backup);
                if (Array.isArray(blocks) && blocks.length > 0) {
                    const shouldRestore = window.confirm(
                        'Une sauvegarde locale a ete trouvee. Voulez-vous la restaurer ?',
                    );
                    if (shouldRestore) {
                        useBuilderStore.getState().setBlocks(blocks);
                        useBuilderStore.setState({ isDirty: true });
                    }
                }
                localStorage.removeItem(backupKey);
            } catch {
                localStorage.removeItem(backupKey);
            }
        }
    }, [pageId]);

    return { saveStatus, lastSavedAt, saveNow };
}

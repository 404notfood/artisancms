import { useState } from 'react';

export function usePreviewLink(entityUrl: string) {
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewExpiresAt, setPreviewExpiresAt] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);

    function handleGeneratePreview() {
        setPreviewLoading(true);
        fetch(entityUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''
                ),
            },
            credentials: 'same-origin',
        })
            .then((res) => res.json())
            .then((data) => {
                setPreviewUrl(data.url);
                setPreviewExpiresAt(data.expires_at);
                setShowPreviewModal(true);
            })
            .catch(() => {})
            .finally(() => setPreviewLoading(false));
    }

    return {
        showPreviewModal,
        setShowPreviewModal,
        previewUrl,
        previewExpiresAt,
        previewLoading,
        handleGeneratePreview,
    };
}

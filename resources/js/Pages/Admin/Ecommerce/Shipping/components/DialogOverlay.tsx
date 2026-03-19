interface DialogOverlayProps {
    children: React.ReactNode;
    onClose: () => void;
}

export default function DialogOverlay({ children, onClose }: DialogOverlayProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/40" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                {children}
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import type { BlockRendererProps } from '../block-registry';

function CartIcon({ className = 'w-6 h-6' }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
    );
}

export default function CartWidgetRenderer({ block, isEditing }: BlockRendererProps) {
    const style = (block.props.style as string) || 'icon';
    const showCount = block.props.showCount !== false;
    const showTotal = block.props.showTotal !== false;

    const [count, setCount] = useState(isEditing ? 3 : 0);
    const [total, setTotal] = useState(isEditing ? 89.97 : 0);
    const [currency] = useState('EUR');

    // Fetch cart data on mount (front only)
    useEffect(() => {
        if (isEditing) return;
        const fetchCart = async () => {
            try {
                const res = await fetch('/api/shop/cart');
                if (res.ok) {
                    const data = await res.json();
                    setCount(data.count || 0);
                    setTotal(data.total || 0);
                }
            } catch {
                // silently ignore
            }
        };
        fetchCart();
    }, [isEditing]);

    // Listen for cart updates
    useEffect(() => {
        if (isEditing) return;
        const handleUpdate = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.count !== undefined) setCount(detail.count);
            if (detail?.total !== undefined) setTotal(detail.total);
            // Re-fetch for accurate total
            fetch('/api/shop/cart').then(r => r.ok ? r.json() : null).then(d => {
                if (d) { setCount(d.count || 0); setTotal(d.total || 0); }
            }).catch(() => {});
        };
        window.addEventListener('cart:updated', handleUpdate);
        return () => window.removeEventListener('cart:updated', handleUpdate);
    }, [isEditing]);

    if (style === 'icon') {
        return (
            <a href="/cart" className="inline-flex items-center gap-2 no-underline">
                <div className="relative p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <CartIcon />
                    {showCount && count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[var(--color-primary,#2563eb)] text-white text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
                            {count > 99 ? '99+' : count}
                        </span>
                    )}
                </div>
                {showTotal && count > 0 && (
                    <span className="text-sm font-medium text-gray-700">
                        {total.toFixed(2)} {currency}
                    </span>
                )}
            </a>
        );
    }

    if (style === 'dropdown' || style === 'sidebar') {
        return (
            <div className={`${style === 'sidebar' ? 'w-80' : 'w-72'} bg-white rounded-xl shadow-xl border border-gray-100`}>
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <CartIcon />
                        <span className="font-semibold text-gray-900">Mon panier</span>
                    </div>
                    {showCount && (
                        <span className="bg-[var(--color-primary,#2563eb)]/10 text-[var(--color-primary,#2563eb)] text-xs font-semibold px-2 py-0.5 rounded-full">
                            {count} article{count !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <div className="p-4">
                    {count === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-6">Votre panier est vide</p>
                    ) : (
                        <p className="text-center text-gray-500 text-sm py-4">
                            {count} article{count !== 1 ? 's' : ''} dans votre panier
                        </p>
                    )}
                </div>
                <div className="border-t p-4">
                    {showTotal && count > 0 && (
                        <div className="flex justify-between mb-3 font-semibold text-gray-900">
                            <span>Total</span>
                            <span>{total.toFixed(2)} {currency}</span>
                        </div>
                    )}
                    <a
                        href="/cart"
                        className="block w-full bg-[var(--color-primary,#2563eb)] text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition-all text-sm text-center no-underline"
                    >
                        Voir le panier
                    </a>
                    {count > 0 && (
                        <a
                            href="/checkout"
                            className="block w-full mt-2 border border-[var(--color-primary,#2563eb)] text-[var(--color-primary,#2563eb)] py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-all text-sm text-center no-underline"
                        >
                            Commander
                        </a>
                    )}
                </div>
            </div>
        );
    }

    return null;
}

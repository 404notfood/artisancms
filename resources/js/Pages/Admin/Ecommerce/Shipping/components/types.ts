export interface ShippingMethodData {
    id: number;
    shipping_zone_id: number;
    name: string;
    type: 'flat' | 'free' | 'weight_based' | 'price_based';
    cost: number;
    min_order_amount: number | null;
    min_weight: number | null;
    max_weight: number | null;
    active: boolean;
    order: number;
}

export interface ShippingZoneData {
    id: number;
    name: string;
    countries: string[];
    is_default: boolean;
    methods: ShippingMethodData[];
}

export const SHIPPING_TYPES: Record<string, string> = {
    flat: 'Tarif fixe',
    free: 'Gratuit',
    weight_based: 'Base sur le poids',
    price_based: 'Base sur le prix',
};

export function formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
}

export interface TokenValue {
    [key: string]: string;
}

export interface DesignToken {
    id: number;
    name: string;
    slug: string;
    category: string;
    value: TokenValue;
    order: number;
}

export interface CategoryDef {
    key: string;
    label: string;
}

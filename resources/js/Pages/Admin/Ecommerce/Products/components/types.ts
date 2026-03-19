import type { ProductData, ProductCategoryData } from '@/types/cms';

export interface VariantFormData {
    id?: number;
    name: string;
    sku: string;
    price: number;
    stock: number;
    attributes: Record<string, string>;
}

export interface ProductFormData {
    name: string;
    slug: string;
    description: string;
    price: number;
    compare_price: string | number;
    sku: string;
    stock: number;
    status: string;
    featured_image: string;
    gallery: string[];
    category_id: string | number;
    variants: VariantFormData[];
}

export interface ProductFormErrors {
    name?: string;
    slug?: string;
    description?: string;
    price?: string;
    compare_price?: string;
    sku?: string;
    stock?: string;
    status?: string;
    featured_image?: string;
    gallery?: string;
    category_id?: string;
    [key: string]: string | undefined;
}

export interface ProductFormSectionProps {
    data: ProductFormData;
    setData: {
        (key: keyof ProductFormData, value: ProductFormData[keyof ProductFormData]): void;
        <K extends keyof ProductFormData>(callback: (prev: ProductFormData) => ProductFormData): void;
    };
    errors: ProductFormErrors;
}

export interface ProductOrganizationProps extends ProductFormSectionProps {
    categories: ProductCategoryData[];
}

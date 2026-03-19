import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import type { ProductCategoryData } from '@/types/cms';
import { ArrowLeft } from 'lucide-react';
import type { VariantFormData } from './components/types';
import ProductInfoSection from './components/ProductInfoSection';
import ProductPricingSection from './components/ProductPricingSection';
import ProductInventorySection from './components/ProductInventorySection';
import ProductImagesSection from './components/ProductImagesSection';
import ProductOrganizationSection from './components/ProductOrganizationSection';
import VariantsCardEditor from './components/VariantsCardEditor';

interface ProductsCreateProps {
    categories: ProductCategoryData[];
}

export default function ProductsCreate({ categories }: ProductsCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        description: '',
        price: 0,
        compare_price: '' as string | number,
        sku: '',
        stock: 0,
        status: 'draft' as string,
        featured_image: '',
        gallery: [] as string[],
        category_id: '' as string | number,
        variants: [] as VariantFormData[],
    });

    function generateSlug(title: string): string {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    function handleNameChange(value: string) {
        setData((prev) => ({
            ...prev,
            name: value,
            slug: prev.slug === '' || prev.slug === generateSlug(prev.name) ? generateSlug(value) : prev.slug,
        }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/shop/products');
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href="/admin/shop/products" className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">Ajouter un produit</h1>
                </div>
            }
        >
            <Head title="Nouveau produit" />

            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
                <ProductInfoSection data={data} setData={setData} errors={errors} onNameChange={handleNameChange} />
                <ProductPricingSection data={data} setData={setData} errors={errors} />
                <ProductInventorySection data={data} setData={setData} errors={errors} />
                <ProductImagesSection data={data} setData={setData} errors={errors} />
                <ProductOrganizationSection data={data} setData={setData} errors={errors} categories={categories} />
                <VariantsCardEditor
                    variants={data.variants}
                    onChange={(variants) => setData('variants', variants)}
                />

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Link
                        href="/admin/shop/products"
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {processing ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </AdminLayout>
    );
}

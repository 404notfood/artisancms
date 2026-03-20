import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router , usePage } from '@inertiajs/react';
import type { ProductData, ProductCategoryData, SharedProps } from '@/types/cms';
import StatusBadge from '@/Components/admin/status-badge';
import { ArrowLeft, Trash2 } from 'lucide-react';
import type { VariantFormData } from './components/types';
import ProductInfoSection from './components/ProductInfoSection';
import ProductPricingSection from './components/ProductPricingSection';
import ProductInventorySection from './components/ProductInventorySection';
import ProductImagesSection from './components/ProductImagesSection';
import ProductOrganizationSection from './components/ProductOrganizationSection';
import VariantsTableEditor from './components/VariantsTableEditor';

interface ProductsEditProps {
    product: ProductData;
    categories: ProductCategoryData[];
}

export default function ProductsEdit({ product, categories }: ProductsEditProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const { data, setData, put, processing, errors } = useForm({
        name: product.name,
        slug: product.slug,
        description: product.description ?? '',
        price: product.price,
        compare_price: product.compare_price ?? ('' as string | number),
        sku: product.sku ?? '',
        stock: product.stock,
        status: product.status,
        featured_image: product.featured_image ?? '',
        gallery: product.gallery ?? ([] as string[]),
        category_id: product.category_id ?? ('' as string | number),
        variants: (product.variants ?? []).map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku ?? '',
            price: v.price,
            stock: v.stock,
            attributes: v.attributes ?? {},
        })) as VariantFormData[],
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/shop/products/${product.id}`);
    }

    function handleDelete() {
        if (!confirm(`Supprimer le produit "${product.name}" ? Cette action est irreversible.`)) return;
        router.delete(`/admin/shop/products/${product.id}`);
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/${prefix}/shop/products`} className="text-gray-500 hover:text-gray-700">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h1 className="text-xl font-semibold text-gray-900">Modifier le produit</h1>
                        <StatusBadge status={product.status} />
                    </div>
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                    </button>
                </div>
            }
        >
            <Head title={`Modifier : ${product.name}`} />

            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
                <ProductInfoSection data={data} setData={setData} errors={errors} />
                <ProductPricingSection data={data} setData={setData} errors={errors} />
                <ProductInventorySection data={data} setData={setData} errors={errors} />
                <ProductImagesSection data={data} setData={setData} errors={errors} />
                <ProductOrganizationSection data={data} setData={setData} errors={errors} categories={categories} />
                <VariantsTableEditor
                    variants={data.variants}
                    onChange={(variants) => setData('variants', variants)}
                />

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Link
                        href={`/${prefix}/shop/products`}
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

import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import type { ContentTypeData } from '@/types/cms';
import ContentTypeForm from './ContentTypeForm';

interface ContentTypeEditProps {
    contentType: ContentTypeData;
}

export default function ContentTypeEdit({ contentType }: ContentTypeEditProps) {
    return (
        <AdminLayout
            header={<h1 className="text-xl font-semibold text-gray-900">Modifier : {contentType.name}</h1>}
        >
            <Head title={`Modifier : ${contentType.name}`} />
            <ContentTypeForm contentType={contentType} />
        </AdminLayout>
    );
}

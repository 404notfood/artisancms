import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import type { ContentTypeData } from '@/types/cms';
import ContentEntryForm from './ContentEntryForm';

interface ContentEntryCreateProps {
    contentType: ContentTypeData;
}

export default function ContentEntryCreate({ contentType }: ContentEntryCreateProps) {
    return (
        <AdminLayout
            header={
                <h1 className="text-xl font-semibold text-gray-900">
                    {contentType.icon && <span className="mr-2">{contentType.icon}</span>}
                    Ajouter : {contentType.name}
                </h1>
            }
        >
            <Head title={`Ajouter : ${contentType.name}`} />
            <ContentEntryForm contentType={contentType} />
        </AdminLayout>
    );
}

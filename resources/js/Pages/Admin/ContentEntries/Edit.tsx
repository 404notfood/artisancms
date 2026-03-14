import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import type { ContentTypeData, ContentEntryData } from '@/types/cms';
import ContentEntryForm from './ContentEntryForm';

interface ContentEntryEditProps {
    contentType: ContentTypeData;
    contentEntry: ContentEntryData;
}

export default function ContentEntryEdit({ contentType, contentEntry }: ContentEntryEditProps) {
    return (
        <AdminLayout
            header={
                <h1 className="text-xl font-semibold text-gray-900">
                    {contentType.icon && <span className="mr-2">{contentType.icon}</span>}
                    Modifier : {contentEntry.title}
                </h1>
            }
        >
            <Head title={`Modifier : ${contentEntry.title}`} />
            <ContentEntryForm contentType={contentType} contentEntry={contentEntry} />
        </AdminLayout>
    );
}

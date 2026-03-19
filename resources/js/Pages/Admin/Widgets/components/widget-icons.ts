import {
    LayoutGrid,
    Newspaper,
    FolderTree,
    Search,
    Type,
    Code,
    Calendar,
    Tags,
} from 'lucide-react';

const widgetIconMap: Record<string, typeof Newspaper> = {
    newspaper: Newspaper,
    'folder-tree': FolderTree,
    search: Search,
    type: Type,
    code: Code,
    calendar: Calendar,
    tags: Tags,
};

export function getWidgetIcon(iconName: string) {
    return widgetIconMap[iconName] || LayoutGrid;
}

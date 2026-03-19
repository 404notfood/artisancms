import { type ReactNode } from 'react';

export interface CommentItem {
    id: number;
    author_name: string;
    content: string;
    status: string;
    created_at: string;
    user?: { name: string } | null;
}

export interface MediaItem {
    id: number;
    filename: string;
    original_filename: string;
    mime_type: string;
    url: string;
    thumbnails: Record<string, string> | null;
}

export interface TopPage {
    path: string;
    total: number;
}

export interface DashboardProps {
    stats: {
        pages: number;
        posts: number;
        media: number;
        users: number;
    };
    recentPages: Array<{
        id: number;
        title: string;
        status: string;
        updated_at: string;
        author?: { name: string };
    }>;
    recentPosts: Array<{
        id: number;
        title: string;
        status: string;
        updated_at: string;
        author?: { name: string };
    }>;
    recentComments: CommentItem[];
    recentMedia: MediaItem[];
    contentStats: {
        published_pages: number;
        draft_pages: number;
        published_posts: number;
        draft_posts: number;
        pending_comments: number;
        total_comments: number;
    };
    analytics: {
        today_views: number;
        week_views: number;
        month_views: number;
        top_pages: TopPage[];
    };
    system: {
        cms_version: string;
        php_version: string;
        laravel_version: string;
        active_plugins: number;
        active_theme: string;
    };
}

export interface StatCardProps {
    label: string;
    value: number;
    icon: ReactNode;
    iconBg: string;
    iconColor: string;
    href?: string;
}

export const statusConfig: Record<string, { label: string; variant: string; className: string }> = {
    published: {
        label: 'Publie',
        variant: 'success',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    draft: {
        label: 'Brouillon',
        variant: 'warning',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    scheduled: {
        label: 'Planifie',
        variant: 'default',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    trash: {
        label: 'Corbeille',
        variant: 'destructive',
        className: 'bg-red-50 text-red-700 border-red-200',
    },
    pending: {
        label: 'En attente',
        variant: 'warning',
        className: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    approved: {
        label: 'Approuve',
        variant: 'success',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    spam: {
        label: 'Spam',
        variant: 'destructive',
        className: 'bg-red-50 text-red-700 border-red-200',
    },
};

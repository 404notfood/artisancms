import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import type { SharedProps } from '@/types/cms';
import { ChevronLeft, ChevronRight, FileText, Newspaper, Calendar } from 'lucide-react';

interface CalendarEntry {
    id: number;
    title: string;
    slug: string;
    type: 'page' | 'post';
    status: string;
    published_at: string;
    edit_url: string;
}

interface EditorialCalendarProps {
    entries: Record<string, CalendarEntry[]>;
    month: string; // 'YYYY-MM'
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const STATUS_COLORS: Record<string, string> = {
    published: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
    pending_review: 'bg-orange-100 text-orange-800 border-orange-200',
    approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const STATUS_LABELS: Record<string, string> = {
    published: 'Publie',
    draft: 'Brouillon',
    scheduled: 'Planifie',
    pending_review: 'En revue',
    approved: 'Approuve',
};

function getStatusColor(status: string): string {
    return STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600 border-gray-200';
}

function getStatusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
}

interface CalendarDay {
    date: string; // 'YYYY-MM-DD'
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    entries: CalendarEntry[];
}

function buildCalendarDays(month: string, entries: Record<string, CalendarEntry[]>): CalendarDay[] {
    const [year, mon] = month.split('-').map(Number);
    const firstDay = new Date(year, mon - 1, 1);
    const lastDay = new Date(year, mon, 0);

    // Monday-based: 0=Mon, 6=Sun
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const days: CalendarDay[] = [];

    // Previous month padding
    const prevMonthLast = new Date(year, mon - 1, 0);
    for (let i = startDow - 1; i >= 0; i--) {
        const d = prevMonthLast.getDate() - i;
        const dateStr = formatDateStr(prevMonthLast.getFullYear(), prevMonthLast.getMonth() + 1, d);
        days.push({ date: dateStr, day: d, isCurrentMonth: false, isToday: dateStr === todayStr, entries: entries[dateStr] ?? [] });
    }

    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
        const dateStr = formatDateStr(year, mon, d);
        days.push({ date: dateStr, day: d, isCurrentMonth: true, isToday: dateStr === todayStr, entries: entries[dateStr] ?? [] });
    }

    // Next month padding to fill 6 rows
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
        const nextMonth = mon === 12 ? 1 : mon + 1;
        const nextYear = mon === 12 ? year + 1 : year;
        const dateStr = formatDateStr(nextYear, nextMonth, d);
        days.push({ date: dateStr, day: d, isCurrentMonth: false, isToday: dateStr === todayStr, entries: entries[dateStr] ?? [] });
    }

    return days;
}

function formatDateStr(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getMonthLabel(month: string): string {
    const [year, mon] = month.split('-').map(Number);
    const date = new Date(year, mon - 1, 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function navigateMonth(month: string, delta: number): string {
    const [year, mon] = month.split('-').map(Number);
    const date = new Date(year, mon - 1 + delta, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function EntryBadge({ entry }: { entry: CalendarEntry }) {
    const TypeIcon = entry.type === 'post' ? Newspaper : FileText;
    return (
        <Link
            href={entry.edit_url}
            className={`group flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 ${getStatusColor(entry.status)}`}
            title={`${entry.title} (${getStatusLabel(entry.status)})`}
        >
            <TypeIcon className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[100px]">{entry.title}</span>
        </Link>
    );
}

function MobileList({ days, month }: { days: CalendarDay[]; month: string }) {
    const currentDays = days.filter((d) => d.isCurrentMonth && d.entries.length > 0);

    if (currentDays.length === 0) {
        return (
            <div className="py-12 text-center text-gray-500">
                <Calendar className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p>Aucun contenu pour {getMonthLabel(month)}</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-100">
            {currentDays.map((day) => (
                <div key={day.date} className={`px-4 py-3 ${day.isToday ? 'bg-indigo-50/50' : ''}`}>
                    <div className="mb-2 flex items-center gap-2">
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${day.isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'}`}>
                            {day.day}
                        </span>
                        <span className="text-xs text-gray-500">
                            {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'long' })}
                        </span>
                        <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            {day.entries.length}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1.5 pl-9">
                        {day.entries.map((entry) => (
                            <EntryBadge key={`${entry.type}-${entry.id}`} entry={entry} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function EditorialCalendarIndex({ entries, month }: EditorialCalendarProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';

    const days = useMemo(() => buildCalendarDays(month, entries), [month, entries]);

    const totalEntries = useMemo(
        () => Object.values(entries).reduce((sum, list) => sum + list.length, 0),
        [entries],
    );

    function goToMonth(delta: number) {
        const target = navigateMonth(month, delta);
        router.get(`/${prefix}/editorial-calendar`, { month: target }, { preserveState: true });
    }

    function goToToday() {
        const now = new Date();
        const target = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        router.get(`/${prefix}/editorial-calendar`, { month: target }, { preserveState: true });
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900">Calendrier editorial</h1>
                    <span className="text-sm text-gray-500">
                        {totalEntries} contenu{totalEntries > 1 ? 's' : ''} en {getMonthLabel(month)}
                    </span>
                </div>
            }
        >
            <Head title="Calendrier editorial" />

            <div className="rounded-lg border border-gray-200 bg-white">
                {/* Month navigation */}
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                    <button
                        onClick={() => goToMonth(-1)}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Precedent</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold capitalize text-gray-900">
                            {getMonthLabel(month)}
                        </h2>
                        <button
                            onClick={goToToday}
                            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Aujourd'hui
                        </button>
                    </div>

                    <button
                        onClick={() => goToMonth(1)}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <span className="hidden sm:inline">Suivant</span>
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                {/* Desktop: CSS Grid Calendar */}
                <div className="hidden md:block">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                        {DAY_LABELS.map((label) => (
                            <div key={label} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7">
                        {days.map((day, idx) => {
                            const isLastRow = idx >= days.length - 7;
                            const isLastCol = (idx + 1) % 7 === 0;
                            return (
                                <div
                                    key={day.date}
                                    className={`min-h-[110px] p-1.5 ${!isLastCol ? 'border-r border-gray-100' : ''} ${!isLastRow ? 'border-b border-gray-100' : ''} ${day.isToday ? 'bg-indigo-50/40' : ''} ${!day.isCurrentMonth ? 'bg-gray-50/50' : ''}`}
                                >
                                    <div className="mb-1 flex items-center justify-between">
                                        <span
                                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                                                day.isToday
                                                    ? 'bg-indigo-600 text-white'
                                                    : day.isCurrentMonth
                                                      ? 'text-gray-900'
                                                      : 'text-gray-400'
                                            }`}
                                        >
                                            {day.day}
                                        </span>
                                        {day.entries.length > 0 && (
                                            <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                                                {day.entries.length}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        {day.entries.slice(0, 3).map((entry) => (
                                            <EntryBadge key={`${entry.type}-${entry.id}`} entry={entry} />
                                        ))}
                                        {day.entries.length > 3 && (
                                            <span className="px-1.5 text-[10px] text-gray-500">
                                                +{day.entries.length - 3} de plus
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Mobile: chronological list */}
                <div className="md:hidden">
                    <MobileList days={days} month={month} />
                </div>
            </div>
        </AdminLayout>
    );
}

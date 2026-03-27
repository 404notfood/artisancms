import { useMemo } from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Progress } from '@/Components/ui/progress';
import { Badge } from '@/Components/ui/badge';

// ─── Types ───────────────────────────────────────────────────────────

type CheckSeverity = 'required' | 'recommended' | 'optional';

interface CheckResult {
    label: string;
    passed: boolean;
    severity: CheckSeverity;
    hint: string;
}

interface PrePublishChecklistProps {
    title: string;
    content: string;
    meta_title?: string;
    meta_description?: string;
    featured_image?: string;
    og_image?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
}

function countWords(text: string): number {
    const clean = stripHtml(text).replace(/\s+/g, ' ').trim();
    if (clean === '') return 0;
    return clean.split(' ').length;
}

// ─── Check functions ─────────────────────────────────────────────────

function runChecks(props: PrePublishChecklistProps): CheckResult[] {
    const {
        title,
        content,
        meta_title,
        meta_description,
        featured_image,
        og_image,
    } = props;

    const checks: CheckResult[] = [];

    // 1. Title (required)
    const hasTitle = title.trim().length > 0;
    checks.push({
        label: 'Titre renseigne',
        passed: hasTitle,
        severity: 'required',
        hint: hasTitle ? title : 'Le titre de la page est obligatoire',
    });

    // 2. Content not empty (required)
    const contentText = stripHtml(content);
    const hasContent = contentText.length > 0;
    checks.push({
        label: 'Contenu non vide',
        passed: hasContent,
        severity: 'required',
        hint: hasContent
            ? `${contentText.length} caracteres`
            : 'Ajoutez du contenu avant de publier',
    });

    // 3. Featured image (recommended)
    const hasFeaturedImage = !!featured_image && featured_image.trim().length > 0;
    checks.push({
        label: 'Image mise en avant',
        passed: hasFeaturedImage,
        severity: 'recommended',
        hint: hasFeaturedImage
            ? 'Image definie'
            : 'Ajoutez une image pour un meilleur partage social',
    });

    // 4. Meta title length (recommended)
    const metaTitleLen = (meta_title ?? '').trim().length;
    const metaTitleOk = metaTitleLen >= 30 && metaTitleLen <= 70;
    checks.push({
        label: 'Meta title (30-70 car.)',
        passed: metaTitleOk,
        severity: 'recommended',
        hint: metaTitleLen === 0
            ? 'Renseignez un meta title pour le SEO'
            : `${metaTitleLen} caracteres${metaTitleOk ? '' : ' — visez 30 a 70'}`,
    });

    // 5. Meta description length (recommended)
    const metaDescLen = (meta_description ?? '').trim().length;
    const metaDescOk = metaDescLen >= 120 && metaDescLen <= 160;
    checks.push({
        label: 'Meta description (120-160 car.)',
        passed: metaDescOk,
        severity: 'recommended',
        hint: metaDescLen === 0
            ? 'Renseignez une meta description pour le SEO'
            : `${metaDescLen} caracteres${metaDescOk ? '' : ' — visez 120 a 160'}`,
    });

    // 6. OG image (optional)
    const hasOgImage = !!og_image && og_image.trim().length > 0;
    checks.push({
        label: 'Image Open Graph',
        passed: hasOgImage,
        severity: 'optional',
        hint: hasOgImage
            ? 'Image OG definie'
            : 'Ajoutez une image OG pour un apercu social optimise',
    });

    // 7. Word count >= 300 (optional)
    const wordCount = countWords(content);
    const enoughWords = wordCount >= 300;
    checks.push({
        label: 'Minimum 300 mots',
        passed: enoughWords,
        severity: 'optional',
        hint: `${wordCount} mot${wordCount !== 1 ? 's' : ''}${enoughWords ? '' : ' — les contenus longs sont mieux references'}`,
    });

    return checks;
}

// ─── Sub-components ──────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<CheckSeverity, { label: string; variant: 'destructive' | 'warning' | 'secondary' }> = {
    required: { label: 'Requis', variant: 'destructive' },
    recommended: { label: 'Recommande', variant: 'warning' },
    optional: { label: 'Optionnel', variant: 'secondary' },
};

function CheckIcon({ passed, severity }: { passed: boolean; severity: CheckSeverity }) {
    if (passed) {
        return <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />;
    }
    if (severity === 'required') {
        return <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />;
    }
    if (severity === 'recommended') {
        return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
    }
    return <Info className="h-5 w-5 text-gray-400 shrink-0" />;
}

function CheckRow({ check }: { check: CheckResult }) {
    const config = SEVERITY_CONFIG[check.severity];

    return (
        <div className="flex items-start gap-3 py-2">
            <CheckIcon passed={check.passed} severity={check.severity} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">
                        {check.label}
                    </span>
                    {!check.passed && (
                        <Badge variant={config.variant} className="text-[10px] px-1.5 py-0">
                            {config.label}
                        </Badge>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{check.hint}</p>
            </div>
        </div>
    );
}

// ─── Main component ──────────────────────────────────────────────────

export default function PrePublishChecklist(props: PrePublishChecklistProps) {
    const checks = useMemo(() => runChecks(props), [
        props.title,
        props.content,
        props.meta_title,
        props.meta_description,
        props.featured_image,
        props.og_image,
    ]);

    const passed = checks.filter((c) => c.passed).length;
    const total = checks.length;
    const score = total > 0 ? Math.round((passed / total) * 100) : 0;

    const scoreColor =
        score === 100
            ? 'text-emerald-600'
            : score >= 60
              ? 'text-amber-600'
              : 'text-red-600';

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Checklist pre-publication</CardTitle>
                    <span className={`text-lg font-bold ${scoreColor}`}>{score}%</span>
                </div>
                <Progress value={score} className="mt-2" />
                <p className="text-xs text-gray-500 mt-1">
                    {passed}/{total} verifications passees
                </p>
            </CardHeader>
            <CardContent>
                <div className="divide-y divide-gray-100">
                    {checks.map((check) => (
                        <CheckRow key={check.label} check={check} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export type { PrePublishChecklistProps, CheckResult, CheckSeverity };

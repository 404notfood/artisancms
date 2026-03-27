import { Head } from '@inertiajs/react';

export interface SeoData {
    title?: string;
    meta_title_raw?: string;
    meta_description?: string;
    meta_robots?: string;
    canonical?: string;
    focus_keyword?: string;

    // Open Graph
    og_title?: string;
    og_description?: string;
    og_image?: string;
    og_type?: string;
    og_site_name?: string;
    og_url?: string;
    og_locale?: string;

    // Twitter Cards
    twitter_card?: string;
    twitter_title?: string;
    twitter_description?: string;
    twitter_image?: string;
    twitter_site?: string;

    // Article
    article_published_time?: string;
    article_modified_time?: string;
    article_author?: string;

    // Verification
    google_site_verification?: string;
    bing_site_verification?: string;

    // JSON-LD
    json_ld?: Record<string, unknown>[];
}

interface SeoHeadProps {
    seo: SeoData;
    fallbackTitle?: string;
    fallbackDescription?: string;
}

export default function SeoHead({ seo, fallbackTitle, fallbackDescription }: SeoHeadProps) {
    const title = seo.title || fallbackTitle || '';
    const description = seo.meta_description || fallbackDescription || '';

    return (
        <Head>
            {title && <title>{title}</title>}

            {/* Basic meta */}
            {description && <meta name="description" content={description} />}
            {seo.meta_robots && <meta name="robots" content={seo.meta_robots} />}
            {seo.canonical && <link rel="canonical" href={seo.canonical} />}

            {/* Open Graph */}
            {seo.og_title && <meta property="og:title" content={seo.og_title} />}
            {seo.og_description && <meta property="og:description" content={seo.og_description} />}
            {seo.og_image && <meta property="og:image" content={seo.og_image} />}
            {seo.og_type && <meta property="og:type" content={seo.og_type} />}
            {seo.og_site_name && <meta property="og:site_name" content={seo.og_site_name} />}
            {seo.og_url && <meta property="og:url" content={seo.og_url} />}
            {seo.og_locale && <meta property="og:locale" content={seo.og_locale} />}

            {/* Twitter Cards */}
            {seo.twitter_card && <meta name="twitter:card" content={seo.twitter_card} />}
            {seo.twitter_title && <meta name="twitter:title" content={seo.twitter_title} />}
            {seo.twitter_description && <meta name="twitter:description" content={seo.twitter_description} />}
            {seo.twitter_image && <meta name="twitter:image" content={seo.twitter_image} />}
            {seo.twitter_site && <meta name="twitter:site" content={seo.twitter_site} />}

            {/* Article meta (for blog posts) */}
            {seo.article_published_time && <meta property="article:published_time" content={seo.article_published_time} />}
            {seo.article_modified_time && <meta property="article:modified_time" content={seo.article_modified_time} />}
            {seo.article_author && <meta property="article:author" content={seo.article_author} />}

            {/* Site verification */}
            {seo.google_site_verification && <meta name="google-site-verification" content={seo.google_site_verification} />}
            {seo.bing_site_verification && <meta name="msvalidate.01" content={seo.bing_site_verification} />}

            {/* JSON-LD Structured Data */}
            {seo.json_ld && seo.json_ld.length > 0 && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(
                            seo.json_ld.length === 1 ? seo.json_ld[0] : seo.json_ld,
                        ),
                    }}
                />
            )}
        </Head>
    );
}

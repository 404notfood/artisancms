<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Menu;
use App\Models\MenuItem;
use App\Models\Page;
use Illuminate\Support\Str;

class LegalPageService
{
    /**
     * Create legal pages (mentions légales, privacy policy, cookie policy).
     *
     * @param int $userId ID of the user creating the pages
     * @param array{overwrite?: bool, add_to_footer_menu?: bool} $options
     * @return array{created: list<string>, skipped: list<string>}
     */
    public function createLegalPages(int $userId, array $options = []): array
    {
        $overwrite = $options['overwrite'] ?? false;
        $result = ['created' => [], 'skipped' => []];

        $legalPages = [
            'mentions-legales' => $this->generatePageData('mentions-legales'),
            'politique-de-confidentialite' => $this->generatePageData('politique-de-confidentialite'),
            'politique-de-cookies' => $this->generatePageData('politique-de-cookies'),
        ];

        foreach ($legalPages as $slug => $pageData) {
            $existing = Page::withTrashed()->where('slug', $slug)->first();

            if ($existing !== null && !$overwrite) {
                $result['skipped'][] = $slug;
                continue;
            }

            $attributes = [
                'title' => $pageData['title'],
                'slug' => $slug,
                'content' => $pageData['content'],
                'status' => 'published',
                'template' => 'default',
                'meta_title' => $pageData['title'],
                'meta_description' => $pageData['meta_description'],
                'order' => 0,
                'created_by' => $userId,
                'published_at' => now(),
            ];

            if ($existing !== null && $overwrite) {
                if ($existing->trashed()) {
                    $existing->restore();
                }
                $existing->update($attributes);
            } else {
                Page::create($attributes);
            }

            $result['created'][] = $slug;
        }

        if (($options['add_to_footer_menu'] ?? false) && !empty($result['created'])) {
            $this->addToFooterMenu($result['created']);
        }

        return $result;
    }

    /**
     * Add legal page links to the footer menu.
     *
     * @param list<string> $createdSlugs
     */
    public function addToFooterMenu(array $createdSlugs): void
    {
        $menu = Menu::where('location', 'footer')->first();

        if ($menu === null) {
            $menu = Menu::create([
                'name' => 'Footer',
                'slug' => 'footer',
                'location' => 'footer',
            ]);
        }

        $maxOrder = MenuItem::where('menu_id', $menu->id)->max('order') ?? 0;

        foreach ($createdSlugs as $slug) {
            $page = Page::where('slug', $slug)->first();

            if ($page === null) {
                continue;
            }

            // Skip if already linked in this menu
            $exists = MenuItem::where('menu_id', $menu->id)
                ->where('linkable_id', $page->id)
                ->where('linkable_type', Page::class)
                ->exists();

            if ($exists) {
                continue;
            }

            $maxOrder++;
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => null,
                'label' => $page->title,
                'type' => 'page',
                'url' => '/' . $page->slug,
                'linkable_id' => $page->id,
                'linkable_type' => Page::class,
                'target' => '_self',
                'order' => $maxOrder,
            ]);
        }
    }

    /**
     * Generate page data (title, content JSON, meta) for a legal page type.
     *
     * @param string $type One of: mentions-legales, politique-de-confidentialite, politique-de-cookies
     * @return array{title: string, content: array<string, mixed>, meta_description: string}
     */
    public function generatePageData(string $type): array
    {
        return match ($type) {
            'mentions-legales' => $this->buildMentionsLegales(),
            'politique-de-confidentialite' => $this->buildPolitiqueConfidentialite(),
            'politique-de-cookies' => $this->buildPolitiqueCookies(),
            default => throw new \InvalidArgumentException("Type de page légale inconnu : {$type}"),
        };
    }

    // -------------------------------------------------------
    // Page builders
    // -------------------------------------------------------

    private function buildMentionsLegales(): array
    {
        $sections = [
            ['Éditeur du site', "Ce site est édité par [NOM DE L'ENTREPRISE], [FORME JURIDIQUE] au capital de [MONTANT] €, immatriculée au RCS de [VILLE] sous le numéro [NUMÉRO SIRET].\n\nSiège social : [ADRESSE COMPLÈTE]\nTéléphone : [TÉLÉPHONE]\nEmail : [EMAIL]\nDirecteur de la publication : [NOM DU RESPONSABLE]"],
            ['Hébergeur', "Ce site est hébergé par [NOM DE L'HÉBERGEUR]\nAdresse : [ADRESSE DE L'HÉBERGEUR]\nTéléphone : [TÉLÉPHONE DE L'HÉBERGEUR]"],
            ['Propriété intellectuelle', "L'ensemble du contenu de ce site (textes, images, vidéos, logos, icônes, sons, logiciels, etc.) est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.\n\nToute reproduction, représentation, modification, publication, transmission, ou dénaturation, totale ou partielle, du site ou de son contenu, par quelque procédé que ce soit, et sur quelque support que ce soit est interdite sans l'autorisation écrite préalable de [NOM DE L'ENTREPRISE]."],
            ['Limitation de responsabilité', "[NOM DE L'ENTREPRISE] ne pourra être tenue responsable des dommages directs ou indirects causés au matériel de l'utilisateur lors de l'accès au site.\n\n[NOM DE L'ENTREPRISE] décline toute responsabilité quant à l'utilisation qui pourrait être faite des informations et contenus présents sur ce site."],
            ['Protection des données personnelles', "Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition aux données personnelles vous concernant.\n\nPour exercer ces droits, vous pouvez nous contacter à l'adresse : [EMAIL]\n\nPour plus d'informations, consultez notre Politique de Confidentialité."],
            ['Cookies', "Ce site utilise des cookies pour améliorer l'expérience utilisateur. Pour en savoir plus, consultez notre Politique de Cookies."],
            ['Droit applicable', "Les présentes mentions légales sont soumises au droit français. En cas de litige, et après tentative de recherche d'une solution amiable, compétence est attribuée aux tribunaux français."],
        ];

        return [
            'title' => 'Mentions Légales',
            'meta_description' => 'Mentions légales du site — éditeur, hébergeur, propriété intellectuelle, RGPD.',
            'content' => $this->buildBlockTree($sections),
        ];
    }

    private function buildPolitiqueConfidentialite(): array
    {
        $sections = [
            ['Introduction', "La présente politique de confidentialité décrit comment [NOM DE L'ENTREPRISE] collecte, utilise et protège les informations personnelles que vous nous fournissez lors de l'utilisation de notre site web.\n\nNous nous engageons à protéger votre vie privée conformément au Règlement Général sur la Protection des Données (RGPD)."],
            ['Responsable du traitement', "Le responsable du traitement des données est :\n[NOM DE L'ENTREPRISE]\n[ADRESSE COMPLÈTE]\nEmail : [EMAIL]\nTéléphone : [TÉLÉPHONE]"],
            ['Données collectées', "Nous pouvons collecter les données suivantes :\n\n• Données d'identification : nom, prénom, adresse email\n• Données de connexion : adresse IP, logs de connexion\n• Données de navigation : pages visitées, durée de visite\n• Données fournies via les formulaires de contact"],
            ['Finalités du traitement', "Vos données personnelles sont collectées pour les finalités suivantes :\n\n• Gestion des demandes de contact\n• Amélioration de nos services et de l'expérience utilisateur\n• Envoi de newsletters (avec votre consentement)\n• Respect de nos obligations légales\n• Statistiques de fréquentation anonymisées"],
            ['Base légale', "Le traitement de vos données repose sur :\n\n• Votre consentement (formulaires, newsletters)\n• L'exécution d'un contrat\n• Notre intérêt légitime (amélioration des services)\n• Le respect d'obligations légales"],
            ['Durée de conservation', "Vos données personnelles sont conservées pour une durée n'excédant pas celle nécessaire aux finalités pour lesquelles elles sont traitées :\n\n• Données de contact : 3 ans après le dernier contact\n• Données de navigation : 13 mois\n• Cookies : voir notre Politique de Cookies"],
            ['Vos droits', "Conformément au RGPD, vous disposez des droits suivants :\n\n• Droit d'accès à vos données personnelles\n• Droit de rectification des données inexactes\n• Droit à l'effacement (droit à l'oubli)\n• Droit à la limitation du traitement\n• Droit à la portabilité de vos données\n• Droit d'opposition au traitement\n\nPour exercer ces droits, contactez-nous à : [EMAIL]\n\nVous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr)."],
            ['Sécurité', "Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre la destruction accidentelle ou illicite, la perte, l'altération ou l'accès non autorisé."],
            ['Délégué à la protection des données', "Pour toute question relative à la protection de vos données personnelles, vous pouvez contacter notre DPO :\n\nEmail : [EMAIL DPO]\nAdresse : [ADRESSE]"],
        ];

        return [
            'title' => 'Politique de Confidentialité',
            'meta_description' => 'Politique de confidentialité — collecte, traitement et protection de vos données personnelles (RGPD).',
            'content' => $this->buildBlockTree($sections),
        ];
    }

    private function buildPolitiqueCookies(): array
    {
        $sections = [
            ['Qu\'est-ce qu\'un cookie ?', "Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette, smartphone) lors de la visite d'un site web. Il permet au site de mémoriser des informations sur votre visite, comme votre langue préférée ou d'autres paramètres."],
            ['Types de cookies utilisés', "Notre site utilise les types de cookies suivants :\n\n• **Cookies strictement nécessaires** : indispensables au fonctionnement du site (session, sécurité, préférences de cookies).\n• **Cookies de performance** : collectent des informations anonymes sur la façon dont les visiteurs utilisent le site.\n• **Cookies fonctionnels** : mémorisent vos choix (langue, région) pour personnaliser votre expérience.\n• **Cookies analytiques** : nous aident à comprendre comment les visiteurs interagissent avec le site via des statistiques anonymes."],
            ['Gestion des cookies', "Vous pouvez à tout moment choisir de désactiver les cookies. Votre navigateur peut également être paramétré pour vous signaler les cookies qui sont déposés et vous demander de les accepter ou non.\n\n• **Chrome** : Paramètres → Confidentialité et sécurité → Cookies\n• **Firefox** : Options → Vie privée et sécurité\n• **Safari** : Préférences → Confidentialité\n• **Edge** : Paramètres → Cookies et autorisations de site\n\nLa désactivation de certains cookies peut affecter votre expérience de navigation sur le site."],
            ['Durée de conservation', "Les cookies ont des durées de vie variables :\n\n• Cookies de session : supprimés à la fermeture du navigateur\n• Cookies persistants : conservés de 1 à 13 mois maximum\n• Cookies analytiques : 13 mois maximum"],
            ['Cookies tiers', "Notre site peut contenir des liens vers des sites tiers ou intégrer des contenus de services externes (vidéos, réseaux sociaux, etc.). Ces tiers peuvent déposer des cookies soumis à leurs propres politiques de confidentialité.\n\nNous vous invitons à consulter les politiques de ces tiers pour plus d'informations."],
            ['Mise à jour', "Cette politique de cookies peut être mise à jour périodiquement. La date de dernière mise à jour est indiquée en bas de cette page.\n\nDernière mise à jour : [DATE]"],
        ];

        return [
            'title' => 'Politique de Cookies',
            'meta_description' => 'Politique de cookies — types de cookies utilisés, gestion et durée de conservation.',
            'content' => $this->buildBlockTree($sections),
        ];
    }

    // -------------------------------------------------------
    // Helpers
    // -------------------------------------------------------

    /**
     * Convert plain text (with \n line breaks and **bold** markers) to HTML.
     */
    private function textToHtml(string $text): string
    {
        // Bold markers **…** → <strong>
        $text = preg_replace('/\*\*(.+?)\*\*/', '<strong>$1</strong>', $text) ?? $text;

        // Split into paragraphs by double newline
        $paragraphs = preg_split('/\n{2,}/', trim($text)) ?? [trim($text)];

        $html = '';
        foreach ($paragraphs as $paragraph) {
            $paragraph = trim($paragraph);
            if ($paragraph === '') {
                continue;
            }

            // If paragraph looks like a bullet list (lines starting with •)
            $lines = explode("\n", $paragraph);
            $isList = count($lines) > 1 && str_starts_with(ltrim($lines[0]), '•');

            if ($isList) {
                $html .= '<ul>';
                foreach ($lines as $line) {
                    $line = ltrim(ltrim($line), '•');
                    if ($line !== '') {
                        $html .= '<li>' . nl2br(trim($line)) . '</li>';
                    }
                }
                $html .= '</ul>';
            } else {
                // Single-newline line breaks within a paragraph
                $inner = implode('<br>', array_map('trim', $lines));
                $html .= '<p>' . $inner . '</p>';
            }
        }

        return $html;
    }

    // -------------------------------------------------------
    // Block tree builder
    // -------------------------------------------------------

    /**
     * Build a JSON block tree from section titles and texts.
     *
     * @param list<array{0: string, 1: string}> $sections
     * @return array{blocks: list<array<string, mixed>>}
     */
    private function buildBlockTree(array $sections): array
    {
        $children = [];

        foreach ($sections as $section) {
            $children[] = [
                'id' => Str::uuid()->toString(),
                'type' => 'heading',
                'props' => [
                    'text'  => $section[0],
                    'level' => 2,
                ],
                'children' => [],
            ];
            $children[] = [
                'id' => Str::uuid()->toString(),
                'type' => 'text',
                'props' => [
                    'content' => $this->textToHtml($section[1]),
                ],
                'children' => [],
            ];
        }

        return [
            'blocks' => [
                [
                    'id'    => Str::uuid()->toString(),
                    'type'  => 'section',
                    'props' => [
                        'paddingTop'    => 64,
                        'paddingBottom' => 80,
                        'paddingLeft'   => 24,
                        'paddingRight'  => 24,
                        'maxWidth'      => 800,
                        'centered'      => true,
                    ],
                    'children' => $children,
                ],
            ],
        ];
    }
}

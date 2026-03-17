import { useEffect } from 'react';
import type { TypographyConfig } from './constants/typography-presets';
import { loadGoogleFont } from './constants/fonts';

interface FontPreviewProps {
    config: TypographyConfig;
    headingColor?: string;
    textColor?: string;
}

export default function FontPreview({ config, headingColor = '#1e1b4b', textColor = '#374151' }: FontPreviewProps) {
    useEffect(() => {
        loadGoogleFont(config.headingFont);
        loadGoogleFont(config.bodyFont);
    }, [config.headingFont, config.bodyFont]);

    const headingFamily = `"${config.headingFont}", sans-serif`;
    const bodyFamily = `"${config.bodyFont}", sans-serif`;
    const s = config.scale;

    return (
        <div className="border rounded-lg p-5 bg-white space-y-3 overflow-hidden">
            <h1
                style={{
                    fontFamily: headingFamily,
                    color: headingColor,
                    fontSize: s.h1.fontSize,
                    fontWeight: s.h1.fontWeight,
                    lineHeight: s.h1.lineHeight,
                    letterSpacing: s.h1.letterSpacing,
                }}
            >
                Titre Principal
            </h1>
            <h2
                style={{
                    fontFamily: headingFamily,
                    color: headingColor,
                    fontSize: s.h2.fontSize,
                    fontWeight: s.h2.fontWeight,
                    lineHeight: s.h2.lineHeight,
                    letterSpacing: s.h2.letterSpacing,
                }}
            >
                Sous-titre de section
            </h2>
            <h3
                style={{
                    fontFamily: headingFamily,
                    color: headingColor,
                    fontSize: s.h3.fontSize,
                    fontWeight: s.h3.fontWeight,
                    lineHeight: s.h3.lineHeight,
                    letterSpacing: s.h3.letterSpacing,
                }}
            >
                Titre de paragraphe
            </h3>
            <p
                style={{
                    fontFamily: bodyFamily,
                    color: textColor,
                    fontSize: s.body.fontSize,
                    fontWeight: s.body.fontWeight,
                    lineHeight: s.body.lineHeight,
                    letterSpacing: s.body.letterSpacing,
                }}
            >
                Voici un exemple de paragraphe avec la police de corps selectionnee.
                Ce texte vous permet de visualiser le rendu final sur votre site.
            </p>
            <ul
                className="list-disc pl-5 space-y-1"
                style={{
                    fontFamily: bodyFamily,
                    color: textColor,
                    fontSize: s.body.fontSize,
                    fontWeight: s.body.fontWeight,
                    lineHeight: s.body.lineHeight,
                }}
            >
                <li>Premier element de la liste</li>
                <li>Deuxieme element avec du texte</li>
                <li>Troisieme element pour l'apercu</li>
            </ul>
        </div>
    );
}

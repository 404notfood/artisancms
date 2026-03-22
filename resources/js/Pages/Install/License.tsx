import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { ChevronRight, ChevronLeft, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';
import InstallLayout from './partials/InstallLayout';

const LICENSE_TEXT = `MIT License

Copyright (c) ${new Date().getFullYear()} ArtisanCMS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

TERMES ADDITIONNELS

En installant ArtisanCMS, vous acceptez les conditions suivantes :

1. UTILISATION — Vous pouvez utiliser ArtisanCMS pour des projets personnels
   et commerciaux sans restriction.

2. MODIFICATIONS — Vous êtes libre de modifier le code source pour l'adapter
   à vos besoins.

3. DISTRIBUTION — Vous pouvez redistribuer ArtisanCMS, modifié ou non, à
   condition d'inclure cette licence.

4. GARANTIE — ArtisanCMS est fourni "tel quel", sans garantie d'aucune sorte.

5. SUPPORT — Le support communautaire est disponible via GitHub. Le support
   commercial est disponible séparément.

6. PLUGINS & THÈMES — Les plugins et thèmes tiers sont soumis à leurs propres
   licences respectives.

7. DONNÉES — ArtisanCMS ne collecte aucune donnée personnelle. Les données
   de votre site restent sur votre serveur.`;

export default function License() {
    const [accepted, setAccepted] = useState(false);

    const handleContinue = () => {
        router.get(route('install.requirements'));
    };

    return (
        <InstallLayout step={2}>
            <Head title="Installation - Licence" />

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Header */}
                <div className="border-b border-slate-200 bg-slate-50 px-8 py-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                            <ScrollText className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                Accord de licence
                            </h1>
                            <p className="text-sm text-slate-500">
                                Veuillez lire et accepter les termes de la licence MIT avant de continuer.
                            </p>
                        </div>
                    </div>
                </div>

                {/* License text */}
                <div className="p-8">
                    <div className="mb-6 max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-6">
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 font-sans">
                            {LICENSE_TEXT}
                        </pre>
                    </div>

                    {/* Accept checkbox */}
                    <label
                        htmlFor="accept-license"
                        className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition-all duration-200',
                            accepted
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-200 hover:border-slate-300'
                        )}
                    >
                        <input
                            type="checkbox"
                            id="accept-license"
                            checked={accepted}
                            onChange={(e) => setAccepted(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className={cn(
                            'text-sm font-medium',
                            accepted ? 'text-indigo-700' : 'text-slate-700'
                        )}>
                            J'ai lu et j'accepte les termes de la licence
                        </span>
                    </label>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 bg-slate-50 px-8 py-4">
                    <div className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={() => router.get(route('install.welcome'))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Retour
                        </Button>
                        <Button
                            onClick={handleContinue}
                            disabled={!accepted}
                            size="lg"
                        >
                            Continuer
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </InstallLayout>
    );
}

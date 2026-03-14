<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContentType;
use App\Services\ContentTypeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContentTypeController extends Controller
{
    public function __construct(
        private readonly ContentTypeService $contentTypeService,
    ) {}

    /**
     * Display a list of all content types.
     */
    public function index(): Response
    {
        $contentTypes = $this->contentTypeService->getAll();

        return Inertia::render('Admin/ContentTypes/Index', [
            'contentTypes' => $contentTypes,
        ]);
    }

    /**
     * Show the form for creating a new content type.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/ContentTypes/Create');
    }

    /**
     * Store a newly created content type.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:content_types,slug'],
            'description' => ['nullable', 'string', 'max:1000'],
            'icon' => ['nullable', 'string', 'max:50'],
            'fields' => ['nullable', 'array'],
            'fields.*.name' => ['required', 'string', 'max:255'],
            'fields.*.slug' => ['required', 'string', 'max:255'],
            'fields.*.type' => ['required', 'string', 'in:text,textarea,number,email,url,date,datetime,select,checkbox,radio,file,image,color,wysiwyg'],
            'fields.*.required' => ['boolean'],
            'fields.*.placeholder' => ['nullable', 'string', 'max:255'],
            'fields.*.options' => ['nullable', 'array'],
            'fields.*.order' => ['integer'],
            'supports' => ['nullable', 'array'],
            'supports.*' => ['string', 'in:title,slug,featured_image,excerpt,content,taxonomies,revisions,comments'],
            'has_archive' => ['boolean'],
            'public' => ['boolean'],
            'menu_position' => ['integer', 'min:0'],
        ]);

        $this->contentTypeService->create($validated);

        return redirect()
            ->route('admin.content-types.index')
            ->with('success', 'Type de contenu cree avec succes.');
    }

    /**
     * Show the form for editing a content type.
     */
    public function edit(ContentType $contentType): Response
    {
        return Inertia::render('Admin/ContentTypes/Edit', [
            'contentType' => $contentType,
        ]);
    }

    /**
     * Update the specified content type.
     */
    public function update(Request $request, ContentType $contentType): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:content_types,slug,' . $contentType->id],
            'description' => ['nullable', 'string', 'max:1000'],
            'icon' => ['nullable', 'string', 'max:50'],
            'fields' => ['nullable', 'array'],
            'fields.*.name' => ['required', 'string', 'max:255'],
            'fields.*.slug' => ['required', 'string', 'max:255'],
            'fields.*.type' => ['required', 'string', 'in:text,textarea,number,email,url,date,datetime,select,checkbox,radio,file,image,color,wysiwyg'],
            'fields.*.required' => ['boolean'],
            'fields.*.placeholder' => ['nullable', 'string', 'max:255'],
            'fields.*.options' => ['nullable', 'array'],
            'fields.*.order' => ['integer'],
            'supports' => ['nullable', 'array'],
            'supports.*' => ['string', 'in:title,slug,featured_image,excerpt,content,taxonomies,revisions,comments'],
            'has_archive' => ['boolean'],
            'public' => ['boolean'],
            'menu_position' => ['integer', 'min:0'],
        ]);

        $this->contentTypeService->update($contentType, $validated);

        return redirect()
            ->route('admin.content-types.index')
            ->with('success', 'Type de contenu mis a jour.');
    }

    /**
     * Delete the specified content type.
     */
    public function destroy(ContentType $contentType): RedirectResponse
    {
        try {
            $this->contentTypeService->delete($contentType);

            return redirect()
                ->route('admin.content-types.index')
                ->with('success', 'Type de contenu supprime.');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', 'Impossible de supprimer ce type : des entrees existent encore.');
        }
    }
}

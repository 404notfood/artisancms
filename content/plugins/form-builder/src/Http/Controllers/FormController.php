<?php

declare(strict_types=1);

namespace FormBuilder\Http\Controllers;

use App\Http\Controllers\Controller;
use FormBuilder\Models\Form;
use FormBuilder\Services\FormService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class FormController extends Controller
{
    public function __construct(
        private readonly FormService $formService,
    ) {}

    /**
     * Display a listing of all forms.
     */
    public function index(): InertiaResponse
    {
        abort_unless(auth()->user()?->hasPermission('forms.read'), 403);
        $forms = $this->formService->getAll();

        return Inertia::render('Admin/Forms/Index', [
            'forms' => $forms,
        ]);
    }

    /**
     * Show the form creation page.
     */
    public function create(): InertiaResponse
    {
        abort_unless(auth()->user()?->hasPermission('forms.create'), 403);
        return Inertia::render('Admin/Forms/Create');
    }

    /**
     * Store a newly created form.
     */
    public function store(Request $request): RedirectResponse
    {
        abort_unless(auth()->user()?->hasPermission('forms.create'), 403);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'fields' => ['required', 'array', 'min:1'],
            'fields.*.id' => ['required', 'string'],
            'fields.*.type' => ['required', 'string'],
            'fields.*.label' => ['required', 'string', 'max:255'],
            'fields.*.name' => ['required', 'string', 'max:255'],
            'fields.*.required' => ['boolean'],
            'fields.*.order' => ['integer'],
            'settings' => ['nullable', 'array'],
            'notifications' => ['nullable', 'array'],
            'confirmation' => ['nullable', 'array'],
            'spam_protection' => ['nullable', 'array'],
            'is_active' => ['boolean'],
        ]);

        $validated['created_by'] = $request->user()->id;

        $form = $this->formService->create($validated);

        return redirect()
            ->route('admin.forms.edit', $form)
            ->with('success', __('cms.form_created'));
    }

    /**
     * Show the form editing page.
     */
    public function edit(Form $form): InertiaResponse
    {
        abort_unless(auth()->user()?->hasPermission('forms.update'), 403);
        $form->loadCount('submissions');

        return Inertia::render('Admin/Forms/Edit', [
            'form' => $form,
        ]);
    }

    /**
     * Update the specified form.
     */
    public function update(Request $request, Form $form): RedirectResponse
    {
        abort_unless(auth()->user()?->hasPermission('forms.update'), 403);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'fields' => ['required', 'array', 'min:1'],
            'fields.*.id' => ['required', 'string'],
            'fields.*.type' => ['required', 'string'],
            'fields.*.label' => ['required', 'string', 'max:255'],
            'fields.*.name' => ['required', 'string', 'max:255'],
            'fields.*.required' => ['boolean'],
            'fields.*.order' => ['integer'],
            'settings' => ['nullable', 'array'],
            'notifications' => ['nullable', 'array'],
            'confirmation' => ['nullable', 'array'],
            'spam_protection' => ['nullable', 'array'],
            'is_active' => ['boolean'],
        ]);

        $this->formService->update($form, $validated);

        return redirect()
            ->route('admin.forms.edit', $form)
            ->with('success', __('cms.form_updated'));
    }

    /**
     * Delete the specified form.
     */
    public function destroy(Form $form): RedirectResponse
    {
        abort_unless(auth()->user()?->hasPermission('forms.delete'), 403);
        $this->formService->delete($form);

        return redirect()
            ->route('admin.forms.index')
            ->with('success', __('cms.form_deleted'));
    }
}

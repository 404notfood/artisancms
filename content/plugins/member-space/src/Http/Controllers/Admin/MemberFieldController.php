<?php

declare(strict_types=1);

namespace MemberSpace\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use MemberSpace\Models\MemberCustomField;
use MemberSpace\Services\CustomFieldService;

class MemberFieldController extends Controller
{
    public function __construct(
        private readonly CustomFieldService $customFieldService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/MemberSpace/Fields/Index', [
            'fields' => MemberCustomField::ordered()->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'required|string|max:100|unique:member_custom_fields,slug|regex:/^[a-z0-9-]+$/',
            'type' => 'required|in:text,textarea,select,checkbox,radio,url,email,phone,date,number,file',
            'options' => 'nullable|array',
            'placeholder' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:255',
            'required' => 'boolean',
            'show_on_registration' => 'boolean',
            'show_on_profile' => 'boolean',
            'show_in_directory' => 'boolean',
            'admin_only' => 'boolean',
            'active' => 'boolean',
        ]);

        $this->customFieldService->createField($validated);

        return redirect()
            ->route('admin.member-space.fields.index')
            ->with('success', 'Champ cree avec succes.');
    }

    public function update(Request $request, MemberCustomField $field): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|in:text,textarea,select,checkbox,radio,url,email,phone,date,number,file',
            'options' => 'nullable|array',
            'placeholder' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:255',
            'required' => 'boolean',
            'show_on_registration' => 'boolean',
            'show_on_profile' => 'boolean',
            'show_in_directory' => 'boolean',
            'admin_only' => 'boolean',
            'active' => 'boolean',
        ]);

        $this->customFieldService->updateField($field, $validated);

        return redirect()
            ->route('admin.member-space.fields.index')
            ->with('success', 'Champ mis a jour.');
    }

    public function destroy(MemberCustomField $field): RedirectResponse
    {
        $this->customFieldService->deleteField($field);

        return redirect()
            ->route('admin.member-space.fields.index')
            ->with('success', 'Champ supprime.');
    }

    public function reorder(Request $request): RedirectResponse
    {
        $request->validate([
            'order' => 'required|array',
            'order.*' => 'integer|exists:member_custom_fields,id',
        ]);

        $this->customFieldService->reorder($request->input('order'));

        return redirect()->back()->with('success', 'Ordre mis a jour.');
    }
}

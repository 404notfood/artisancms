<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CustomFieldGroupRequest;
use App\Models\CustomField;
use App\Models\CustomFieldGroup;
use App\Services\CustomFieldService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomFieldController extends Controller
{
    public function __construct(
        private readonly CustomFieldService $customFieldService,
    ) {}

    /**
     * Display a list of all custom field groups.
     */
    public function index(): Response
    {
        $groups = $this->customFieldService->allGroups();

        return Inertia::render('Admin/CustomFields/Index', [
            'groups' => $groups,
        ]);
    }

    /**
     * Show the form for creating a new custom field group.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/CustomFields/Create', [
            'fieldTypes' => CustomField::availableTypes(),
        ]);
    }

    /**
     * Store a newly created custom field group.
     */
    public function store(CustomFieldGroupRequest $request): RedirectResponse
    {
        $this->customFieldService->createGroup($request->validated());

        return redirect()
            ->route('admin.custom-fields.index')
            ->with('success', __('cms.custom_fields.created'));
    }

    /**
     * Show the form for editing a custom field group.
     */
    public function edit(CustomFieldGroup $customField): Response
    {
        $customField->load('fields');

        return Inertia::render('Admin/CustomFields/Edit', [
            'group'      => $customField,
            'fieldTypes' => CustomField::availableTypes(),
        ]);
    }

    /**
     * Update the specified custom field group.
     */
    public function update(CustomFieldGroupRequest $request, CustomFieldGroup $customField): RedirectResponse
    {
        $this->customFieldService->updateGroup($customField, $request->validated());

        return redirect()
            ->back()
            ->with('success', __('cms.custom_fields.updated'));
    }

    /**
     * Delete the specified custom field group.
     */
    public function destroy(CustomFieldGroup $customField): RedirectResponse
    {
        $this->customFieldService->deleteGroup($customField);

        return redirect()
            ->route('admin.custom-fields.index')
            ->with('success', __('cms.custom_fields.deleted'));
    }

    /**
     * API endpoint: fetch custom field values for a specific entity.
     * Used by the page/post editor to load field values via AJAX.
     */
    public function apiValues(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'entity_type' => ['required', 'string', 'in:page,post'],
            'entity_id'   => ['required', 'integer'],
        ]);

        $result = $this->customFieldService->getFieldsAndValuesForEntity(
            $validated['entity_type'],
            (int) $validated['entity_id'],
        );

        return response()->json($result);
    }
}

<?php

declare(strict_types=1);

namespace FormBuilder\Services;

use FormBuilder\Models\Form;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class FormService
{
    /**
     * Get all forms with pagination.
     *
     * @return LengthAwarePaginator<Form>
     */
    public function getAll(int $perPage = 15): LengthAwarePaginator
    {
        return Form::query()
            ->withCount('submissions')
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * Create a new form.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): Form
    {
        $data['slug'] = $this->generateUniqueSlug($data['name']);

        return Form::create($data);
    }

    /**
     * Update an existing form.
     *
     * @param array<string, mixed> $data
     */
    public function update(Form $form, array $data): Form
    {
        if (isset($data['name']) && $data['name'] !== $form->name) {
            $data['slug'] = $this->generateUniqueSlug($data['name'], $form->id);
        }

        $form->update($data);

        return $form->refresh();
    }

    /**
     * Delete a form and all its submissions.
     */
    public function delete(Form $form): bool
    {
        return (bool) $form->delete();
    }

    /**
     * Find a form by its ID.
     */
    public function findById(int $id): ?Form
    {
        return Form::find($id);
    }

    /**
     * Find a form by its slug.
     */
    public function findBySlug(string $slug): ?Form
    {
        return Form::where('slug', $slug)->first();
    }

    /**
     * Generate a unique slug from the form name.
     */
    private function generateUniqueSlug(string $name, ?int $excludeId = null): string
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $counter = 1;

        while ($this->slugExists($slug, $excludeId)) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Check if a slug already exists.
     */
    private function slugExists(string $slug, ?int $excludeId = null): bool
    {
        $query = Form::where('slug', $slug);

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }
}

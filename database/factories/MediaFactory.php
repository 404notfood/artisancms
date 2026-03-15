<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Media;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Media>
 */
class MediaFactory extends Factory
{
    protected $model = Media::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $filename = Str::random(20) . '.jpg';

        return [
            'filename' => $filename,
            'original_filename' => fake()->word() . '.jpg',
            'path' => 'media/' . $filename,
            'disk' => 'public',
            'mime_type' => 'image/jpeg',
            'size' => fake()->numberBetween(1024, 5242880),
            'alt_text' => fake()->sentence(3),
            'title' => fake()->sentence(2),
            'caption' => fake()->sentence(),
            'metadata' => [
                'width' => 1920,
                'height' => 1080,
            ],
            'thumbnails' => [],
            'folder' => '/',
            'uploaded_by' => User::factory(),
        ];
    }

    /**
     * Set the media as a PDF document.
     */
    public function pdf(): static
    {
        $filename = Str::random(20) . '.pdf';

        return $this->state(fn (array $attributes) => [
            'filename' => $filename,
            'original_filename' => fake()->word() . '.pdf',
            'path' => 'media/' . $filename,
            'mime_type' => 'application/pdf',
            'metadata' => [],
        ]);
    }

    /**
     * Set a specific uploader.
     */
    public function uploadedBy(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'uploaded_by' => $user->id,
        ]);
    }
}

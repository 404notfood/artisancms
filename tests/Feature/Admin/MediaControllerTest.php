<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Media;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tests\Traits\CmsTestHelpers;

class MediaControllerTest extends TestCase
{
    use CmsTestHelpers, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_admin_can_view_media_index(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get('/admin/media');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Admin/Media/Index'));
    }

    public function test_admin_can_upload_file(): void
    {
        $admin = $this->createAdmin();
        $file = UploadedFile::fake()->image('photo.jpg', 200, 200);

        $response = $this->actingAs($admin)->postJson('/admin/media', [
            'file' => $file,
        ]);

        $response->assertCreated();
        $response->assertJsonStructure(['success', 'media']);
        $this->assertDatabaseHas('media', ['original_filename' => 'photo.jpg']);
    }

    public function test_admin_can_delete_media(): void
    {
        $admin = $this->createAdmin();
        $media = Media::factory()->create(['uploaded_by' => $admin->id]);

        $response = $this->actingAs($admin)->delete("/admin/media/{$media->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('media', ['id' => $media->id]);
    }

    public function test_admin_can_update_media_metadata(): void
    {
        $admin = $this->createAdmin();
        $media = Media::factory()->create(['uploaded_by' => $admin->id]);

        $response = $this->actingAs($admin)->put("/admin/media/{$media->id}", [
            'alt_text' => 'Updated alt text',
            'title' => 'Updated title',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('media', [
            'id' => $media->id,
            'alt_text' => 'Updated alt text',
        ]);
    }

    public function test_guest_cannot_access_media(): void
    {
        $response = $this->get('/admin/media');

        $response->assertRedirect('/login');
    }

    public function test_admin_can_view_media_details(): void
    {
        $admin = $this->createAdmin();
        $media = Media::factory()->create(['uploaded_by' => $admin->id]);

        $response = $this->actingAs($admin)->getJson("/admin/media/{$media->id}");

        $response->assertOk();
        $response->assertJsonStructure(['media']);
    }

    public function test_picker_paginates_images_beyond_first_forty_without_duplicates(): void
    {
        $admin = $this->createAdmin();
        Media::factory()->count(43)->create(['uploaded_by' => $admin->id]);
        Media::factory()->pdf()->create(['uploaded_by' => $admin->id]);

        $first = $this->actingAs($admin)->getJson('/admin/media?json=1&type=image&picker_page=1')
            ->assertOk()->assertJsonCount(40, 'data')->assertJsonPath('total', 43)->assertJsonPath('next_page', 2);
        $second = $this->getJson('/admin/media?json=1&type=image&picker_page=2')
            ->assertOk()->assertJsonCount(3, 'data')->assertJsonPath('next_page', null);

        $this->assertSame([], array_intersect(array_column($first->json('data'), 'id'), array_column($second->json('data'), 'id')));
    }

    public function test_picker_searches_original_filename_and_returns_gallery_metadata(): void
    {
        $admin = $this->createAdmin();
        $media = Media::factory()->create([
            'uploaded_by' => $admin->id, 'filename' => 'generated-unique.jpg', 'original_filename' => 'saint-malo-reportage.jpg',
            'alt_text' => 'Voiliers', 'caption' => 'Avant le départ', 'metadata' => ['width' => 1600, 'height' => 1200],
        ]);

        $this->actingAs($admin)->getJson('/admin/media?json=1&type=image&picker_page=1&search=saint-malo')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $media->id)
            ->assertJsonPath('data.0.alt', 'Voiliers')->assertJsonPath('data.0.caption', 'Avant le départ')
            ->assertJsonPath('data.0.width', 1600)->assertJsonPath('data.0.height', 1200);
    }

    public function test_picker_keeps_legacy_array_response_for_existing_consumers(): void
    {
        $admin = $this->createAdmin();
        Media::factory()->create(['uploaded_by' => $admin->id]);
        $this->actingAs($admin)->getJson('/admin/media?json=1&type=image')->assertOk()
            ->assertJsonCount(1)->assertJsonStructure([['id', 'url', 'alt', 'filename', 'thumbnail_url']]);
    }

    public function test_picker_rejects_invalid_page_number(): void
    {
        $this->actingAs($this->createAdmin())->getJson('/admin/media?json=1&picker_page=0')->assertUnprocessable();
    }
}

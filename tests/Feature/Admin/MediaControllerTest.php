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
}

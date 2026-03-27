<?php

declare(strict_types=1);

namespace App\Models;

use App\CMS\Traits\HasSiteScope;
use App\CMS\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Media extends Model
{
    use HasFactory, HasSiteScope, LogsActivity;

    /**
     * Attributs exclus du log d'activite.
     *
     * @var array<int, string>
     */
    protected array $activityExcluded = ['metadata', 'thumbnails', 'updated_at'];

    /**
     * Attributs de contexte toujours inclus dans le log.
     *
     * @var array<int, string>
     */
    protected array $activityContext = ['original_filename', 'mime_type'];

    /**
     * @var list<string>
     */
    protected $appends = ['url'];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'filename',
        'original_filename',
        'path',
        'disk',
        'mime_type',
        'size',
        'alt_text',
        'title',
        'caption',
        'metadata',
        'thumbnails',
        'folder',
        'uploaded_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'thumbnails' => 'array',
            'size' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Get the public URL of the media file.
     *
     * @return Attribute<string, never>
     */
    protected function url(): Attribute
    {
        return Attribute::make(
            get: fn (): string => Storage::disk($this->disk ?? 'public')->url($this->path),
        );
    }
}

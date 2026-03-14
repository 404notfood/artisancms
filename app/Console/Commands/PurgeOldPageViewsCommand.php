<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PurgeOldPageViewsCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'cms:analytics:purge {--days=90 : Days to keep}';

    /**
     * @var string
     */
    protected $description = 'Purge raw page view data older than specified days';

    public function handle(): int
    {
        $days = (int) $this->option('days');

        if ($days < 1) {
            $this->error(__('cms.analytics.invalid_days'));

            return self::FAILURE;
        }

        $cutoffDate = Carbon::today()->subDays($days)->toDateString();

        $this->info(__('cms.analytics.purging', ['date' => $cutoffDate]));

        $deleted = DB::table('cms_page_views')
            ->where('date', '<', $cutoffDate)
            ->delete();

        $this->info(__('cms.analytics.purged', ['count' => $deleted]));

        return self::SUCCESS;
    }
}

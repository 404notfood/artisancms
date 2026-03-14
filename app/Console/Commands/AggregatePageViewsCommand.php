<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\PageViewDaily;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AggregatePageViewsCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'cms:analytics:aggregate {--date= : Date to aggregate (default yesterday)}';

    /**
     * @var string
     */
    protected $description = 'Aggregate raw page views into daily summaries';

    public function handle(): int
    {
        $dateString = $this->option('date');

        if ($dateString !== null) {
            try {
                $date = Carbon::parse($dateString);
            } catch (\Exception) {
                $this->error(__('cms.analytics.invalid_date', ['date' => $dateString]));

                return self::FAILURE;
            }
        } else {
            $date = Carbon::yesterday();
        }

        $targetDate = $date->toDateString();

        $this->info(__('cms.analytics.aggregating', ['date' => $targetDate]));

        // Grouper les vues brutes par path + viewable_type + viewable_id pour la date cible
        $aggregated = DB::table('cms_page_views')
            ->where('date', $targetDate)
            ->select([
                'path',
                'viewable_type',
                'viewable_id',
                DB::raw('COUNT(*) as views_count'),
                DB::raw('COUNT(DISTINCT CONCAT(COALESCE(user_agent, \'\'), \'|\', COALESCE(country, \'\'), \'|\', COALESCE(device_type, \'\'))) as unique_visitors'),
            ])
            ->groupBy('path', 'viewable_type', 'viewable_id')
            ->get();

        if ($aggregated->isEmpty()) {
            $this->warn(__('cms.analytics.no_data', ['date' => $targetDate]));

            return self::SUCCESS;
        }

        $count = 0;

        foreach ($aggregated as $row) {
            PageViewDaily::updateOrCreate(
                [
                    'path' => $row->path,
                    'date' => $targetDate,
                ],
                [
                    'viewable_type'   => $row->viewable_type,
                    'viewable_id'     => $row->viewable_id,
                    'views_count'     => $row->views_count,
                    'unique_visitors' => $row->unique_visitors,
                ],
            );

            $count++;
        }

        $this->info(__('cms.analytics.aggregated', ['count' => $count, 'date' => $targetDate]));

        return self::SUCCESS;
    }
}

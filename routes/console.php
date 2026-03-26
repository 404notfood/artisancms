<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('cms:publish-scheduled')->everyMinute();
Schedule::command('cms:check-updates --notify')->dailyAt('03:00');
Schedule::command('cms:auto-update')->dailyAt('04:00');

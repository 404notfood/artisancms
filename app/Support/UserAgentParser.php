<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Lightweight user-agent parser shared by AnalyticsService and SessionTrackingService.
 */
final class UserAgentParser
{
    /**
     * Determine if a user-agent string belongs to a bot/crawler.
     */
    public static function isBot(string $userAgent): bool
    {
        if ($userAgent === '') {
            return true;
        }

        $botPatterns = [
            'bot', 'crawl', 'spider', 'slurp', 'mediapartners',
            'googlebot', 'bingbot', 'yandexbot', 'baiduspider',
            'facebookexternalhit', 'twitterbot', 'rogerbot', 'linkedinbot',
            'embedly', 'showyoubot', 'outbrain', 'pinterest', 'applebot',
            'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot', 'petalbot',
            'bytespider', 'headlesschrome', 'lighthouse', 'pagespeed',
            'gtmetrix', 'wget', 'curl', 'python-requests', 'go-http-client',
            'java/', 'nutch', 'scrapy', 'httpclient', 'okhttp',
        ];

        $lowerUa = mb_strtolower($userAgent);

        foreach ($botPatterns as $pattern) {
            if (str_contains($lowerUa, $pattern)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Detect the device type from a user-agent string.
     */
    public static function detectDeviceType(string $userAgent): string
    {
        $lowerUa = mb_strtolower($userAgent);

        // Tablets (check before mobile since some tablets contain "mobile")
        if (
            str_contains($lowerUa, 'ipad')
            || str_contains($lowerUa, 'tablet')
            || (str_contains($lowerUa, 'android') && !str_contains($lowerUa, 'mobile'))
            || str_contains($lowerUa, 'kindle')
            || str_contains($lowerUa, 'silk')
        ) {
            return 'tablet';
        }

        // Mobiles
        if (
            str_contains($lowerUa, 'mobile')
            || str_contains($lowerUa, 'iphone')
            || str_contains($lowerUa, 'ipod')
            || str_contains($lowerUa, 'android')
            || str_contains($lowerUa, 'blackberry')
            || str_contains($lowerUa, 'opera mini')
            || str_contains($lowerUa, 'opera mobi')
            || str_contains($lowerUa, 'windows phone')
        ) {
            return 'mobile';
        }

        return 'desktop';
    }

    /**
     * Detect the browser name from a user-agent string.
     */
    public static function detectBrowser(string $userAgent): string
    {
        $lowerUa = mb_strtolower($userAgent);

        // Order matters: check specific browsers before generic ones
        if (str_contains($lowerUa, 'edg/') || str_contains($lowerUa, 'edge/')) {
            return 'Edge';
        }
        if (str_contains($lowerUa, 'opr/') || str_contains($lowerUa, 'opera')) {
            return 'Opera';
        }
        if (str_contains($lowerUa, 'brave')) {
            return 'Brave';
        }
        if (str_contains($lowerUa, 'vivaldi')) {
            return 'Vivaldi';
        }
        if (str_contains($lowerUa, 'samsung')) {
            return 'Samsung Internet';
        }
        if (str_contains($lowerUa, 'ucbrowser')) {
            return 'UC Browser';
        }
        // Chrome must be checked after Edge, Opera, Brave, Vivaldi
        if (str_contains($lowerUa, 'chrome') || str_contains($lowerUa, 'crios')) {
            return 'Chrome';
        }
        // Safari must be checked after Chrome
        if (str_contains($lowerUa, 'safari') && !str_contains($lowerUa, 'chrome')) {
            return 'Safari';
        }
        if (str_contains($lowerUa, 'firefox') || str_contains($lowerUa, 'fxios')) {
            return 'Firefox';
        }
        if (str_contains($lowerUa, 'msie') || str_contains($lowerUa, 'trident')) {
            return 'Internet Explorer';
        }

        return 'Other';
    }

    /**
     * Detect the operating system from a user-agent string.
     */
    public static function detectOS(string $userAgent): string
    {
        if (str_contains($userAgent, 'Windows')) {
            return 'Windows';
        }
        if (str_contains($userAgent, 'Mac OS')) {
            return 'macOS';
        }
        if (str_contains($userAgent, 'Android')) {
            return 'Android';
        }
        if (str_contains($userAgent, 'iOS') || str_contains($userAgent, 'iPhone')) {
            return 'iOS';
        }
        if (str_contains($userAgent, 'Linux')) {
            return 'Linux';
        }

        return 'Other';
    }
}

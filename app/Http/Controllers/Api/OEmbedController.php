<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OEmbedService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OEmbedController extends Controller
{
    public function __invoke(Request $request, OEmbedService $service): JsonResponse
    {
        $url = trim((string) $request->input('url', ''));

        if ($url === '') {
            return response()->json(['error' => 'Missing url parameter.'], 422);
        }

        $data = $service->resolve($url);

        if ($data === null) {
            return response()->json([
                'error' => 'Unsupported provider or URL could not be resolved.',
                'supported' => $service->supportedProviders(),
            ], 404);
        }

        return response()->json($data);
    }
}

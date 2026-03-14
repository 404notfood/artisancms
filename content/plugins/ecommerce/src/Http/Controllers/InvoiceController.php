<?php

declare(strict_types=1);

namespace Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use Ecommerce\Models\Order;
use Ecommerce\Services\InvoiceService;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InvoiceController extends Controller
{
    public function __construct(
        private readonly InvoiceService $invoiceService,
    ) {}

    /**
     * Display the invoice as a printable HTML page.
     */
    public function show(Order $order): Response
    {
        $order->loadMissing(['items', 'user']);

        $html = $this->invoiceService->renderHtml($order);

        return new Response($html, 200, [
            'Content-Type' => 'text/html; charset=utf-8',
        ]);
    }

    /**
     * Generate and download the invoice as a PDF.
     */
    public function download(Order $order): StreamedResponse
    {
        $order->loadMissing(['items', 'user']);

        return $this->invoiceService->download($order);
    }
}

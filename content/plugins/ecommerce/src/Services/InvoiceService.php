<?php

declare(strict_types=1);

namespace Ecommerce\Services;

use Ecommerce\Models\Order;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InvoiceService
{
    /**
     * Generate invoice number for an order.
     */
    public function getInvoiceNumber(Order $order): string
    {
        return sprintf('FACT-%d-%05d', $order->created_at->year, $order->id);
    }

    /**
     * Generate invoice HTML and save as PDF to storage.
     * Uses DomPDF if available, otherwise saves as HTML.
     */
    public function generate(Order $order): string
    {
        $order->loadMissing(['items', 'user']);

        $invoiceNumber = $this->getInvoiceNumber($order);
        $html = $this->renderHtml($order, $invoiceNumber);

        $directory = 'invoices/' . $order->created_at->format('Y/m');
        $filename = $invoiceNumber . '.pdf';
        $path = $directory . '/' . $filename;

        if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            /** @var \Barryvdh\DomPDF\PDF $pdf */
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
            $pdf->setPaper('a4', 'portrait');

            Storage::disk('local')->put($path, $pdf->output());
        } else {
            // Fallback: save as HTML for browser print-to-PDF
            $path = $directory . '/' . $invoiceNumber . '.html';
            Storage::disk('local')->put($path, $html);
        }

        return $path;
    }

    /**
     * Get existing invoice path, or null if not generated yet.
     */
    public function getInvoicePath(Order $order): ?string
    {
        $invoiceNumber = $this->getInvoiceNumber($order);
        $directory = 'invoices/' . $order->created_at->format('Y/m');

        $pdfPath = $directory . '/' . $invoiceNumber . '.pdf';
        if (Storage::disk('local')->exists($pdfPath)) {
            return $pdfPath;
        }

        $htmlPath = $directory . '/' . $invoiceNumber . '.html';
        if (Storage::disk('local')->exists($htmlPath)) {
            return $htmlPath;
        }

        return null;
    }

    /**
     * Download the invoice for an order.
     * Generates the invoice if it does not exist yet.
     */
    public function download(Order $order): StreamedResponse
    {
        $path = $this->getInvoicePath($order);

        if ($path === null) {
            $path = $this->generate($order);
        }

        $invoiceNumber = $this->getInvoiceNumber($order);
        $extension = pathinfo($path, PATHINFO_EXTENSION);
        $downloadName = $invoiceNumber . '.' . $extension;

        $contentType = $extension === 'pdf'
            ? 'application/pdf'
            : 'text/html; charset=utf-8';

        return Storage::disk('local')->download($path, $downloadName, [
            'Content-Type' => $contentType,
        ]);
    }

    /**
     * Render the invoice HTML from the Blade template.
     */
    public function renderHtml(Order $order, ?string $invoiceNumber = null): string
    {
        $order->loadMissing(['items', 'user']);

        $invoiceNumber ??= $this->getInvoiceNumber($order);

        return View::make('ecommerce::invoice', [
            'order' => $order,
            'invoiceNumber' => $invoiceNumber,
            'companyName' => config('app.name', 'ArtisanCMS'),
            'companyAddress' => config('ecommerce.company_address', ''),
            'companyPhone' => config('ecommerce.company_phone', ''),
            'companyEmail' => config('ecommerce.company_email', config('mail.from.address', '')),
            'companySiret' => config('ecommerce.company_siret', ''),
            'companyTvaNumber' => config('ecommerce.company_tva_number', ''),
        ])->render();
    }
}

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture {{ $invoiceNumber }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: #333;
            background: #fff;
        }

        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }

        .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 20px;
        }

        .company-info h1 {
            font-size: 24px;
            color: #4f46e5;
            margin-bottom: 8px;
        }

        .company-info p {
            font-size: 12px;
            color: #666;
            line-height: 1.6;
        }

        .invoice-meta {
            text-align: right;
        }

        .invoice-meta h2 {
            font-size: 28px;
            color: #4f46e5;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 12px;
        }

        .invoice-meta table {
            margin-left: auto;
        }

        .invoice-meta td {
            padding: 2px 0;
            font-size: 13px;
        }

        .invoice-meta td:first-child {
            color: #666;
            padding-right: 12px;
        }

        .invoice-meta td:last-child {
            font-weight: 600;
            text-align: right;
        }

        .addresses {
            display: flex;
            justify-content: space-between;
            gap: 40px;
            margin-bottom: 40px;
        }

        .address-block {
            flex: 1;
        }

        .address-block h3 {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #999;
            margin-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 4px;
        }

        .address-block p {
            font-size: 13px;
            line-height: 1.6;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        .items-table thead th {
            background: #f9fafb;
            border-bottom: 2px solid #e5e7eb;
            padding: 10px 12px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #666;
        }

        .items-table thead th:nth-child(3),
        .items-table thead th:nth-child(4),
        .items-table thead th:nth-child(5) {
            text-align: right;
        }

        .items-table tbody td {
            padding: 10px 12px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 13px;
        }

        .items-table tbody td:nth-child(3),
        .items-table tbody td:nth-child(4),
        .items-table tbody td:nth-child(5) {
            text-align: right;
        }

        .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px;
        }

        .totals table {
            min-width: 280px;
        }

        .totals td {
            padding: 6px 0;
            font-size: 13px;
        }

        .totals td:first-child {
            color: #666;
            padding-right: 24px;
        }

        .totals td:last-child {
            text-align: right;
            font-weight: 500;
        }

        .totals tr.total-row td {
            border-top: 2px solid #4f46e5;
            padding-top: 10px;
            font-size: 16px;
            font-weight: 700;
            color: #4f46e5;
        }

        .payment-info {
            background: #f9fafb;
            border-radius: 8px;
            padding: 16px 20px;
            margin-bottom: 30px;
        }

        .payment-info h3 {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #999;
            margin-bottom: 8px;
        }

        .payment-info p {
            font-size: 13px;
        }

        .payment-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .payment-paid {
            background: #d1fae5;
            color: #065f46;
        }

        .payment-pending {
            background: #fef3c7;
            color: #92400e;
        }

        .payment-failed {
            background: #fee2e2;
            color: #991b1b;
        }

        .footer {
            text-align: center;
            font-size: 11px;
            color: #999;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            margin-top: 40px;
        }

        @media print {
            body {
                background: #fff;
            }

            .invoice-container {
                padding: 0;
                max-width: 100%;
            }

            .no-print {
                display: none !important;
            }

            @page {
                margin: 20mm;
                size: A4;
            }
        }

        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4f46e5;
            color: #fff;
            border: none;
            padding: 10px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            z-index: 1000;
        }

        .print-button:hover {
            background: #4338ca;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">Imprimer / PDF</button>

    <div class="invoice-container">
        <div class="invoice-header">
            <div class="company-info">
                <h1>{{ $companyName }}</h1>
                @if($companyAddress)
                    <p>{{ $companyAddress }}</p>
                @endif
                @if($companyPhone)
                    <p>Tel: {{ $companyPhone }}</p>
                @endif
                @if($companyEmail)
                    <p>{{ $companyEmail }}</p>
                @endif
                @if($companySiret)
                    <p>SIRET: {{ $companySiret }}</p>
                @endif
                @if($companyTvaNumber)
                    <p>N° TVA: {{ $companyTvaNumber }}</p>
                @endif
            </div>

            <div class="invoice-meta">
                <h2>Facture</h2>
                <table>
                    <tr>
                        <td>Numero:</td>
                        <td>{{ $invoiceNumber }}</td>
                    </tr>
                    <tr>
                        <td>Date:</td>
                        <td>{{ $order->created_at->format('d/m/Y') }}</td>
                    </tr>
                    <tr>
                        <td>Commande:</td>
                        <td>#{{ $order->id }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="addresses">
            @if($order->billing_address)
                <div class="address-block">
                    <h3>Adresse de facturation</h3>
                    <p>
                        <strong>{{ $order->billing_address['first_name'] ?? '' }} {{ $order->billing_address['last_name'] ?? '' }}</strong><br>
                        {{ $order->billing_address['address'] ?? '' }}<br>
                        @if(!empty($order->billing_address['address2']))
                            {{ $order->billing_address['address2'] }}<br>
                        @endif
                        {{ $order->billing_address['postal_code'] ?? '' }} {{ $order->billing_address['city'] ?? '' }}<br>
                        {{ $order->billing_address['country'] ?? '' }}
                        @if(!empty($order->billing_address['phone']))
                            <br>Tel: {{ $order->billing_address['phone'] }}
                        @endif
                    </p>
                </div>
            @endif

            @if($order->shipping_address)
                <div class="address-block">
                    <h3>Adresse de livraison</h3>
                    <p>
                        <strong>{{ $order->shipping_address['first_name'] ?? '' }} {{ $order->shipping_address['last_name'] ?? '' }}</strong><br>
                        {{ $order->shipping_address['address'] ?? '' }}<br>
                        @if(!empty($order->shipping_address['address2']))
                            {{ $order->shipping_address['address2'] }}<br>
                        @endif
                        {{ $order->shipping_address['postal_code'] ?? '' }} {{ $order->shipping_address['city'] ?? '' }}<br>
                        {{ $order->shipping_address['country'] ?? '' }}
                        @if(!empty($order->shipping_address['phone']))
                            <br>Tel: {{ $order->shipping_address['phone'] }}
                        @endif
                    </p>
                </div>
            @endif
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Produit</th>
                    <th>Prix unitaire</th>
                    <th>Quantite</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($order->items as $index => $item)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>{{ $item->name }}</td>
                        <td>{{ number_format($item->price, 2, ',', ' ') }} €</td>
                        <td>{{ $item->quantity }}</td>
                        <td>{{ number_format($item->total, 2, ',', ' ') }} €</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals">
            <table>
                <tr>
                    <td>Sous-total</td>
                    <td>{{ number_format($order->subtotal, 2, ',', ' ') }} €</td>
                </tr>
                <tr>
                    <td>Livraison</td>
                    <td>{{ number_format($order->shipping, 2, ',', ' ') }} €</td>
                </tr>
                <tr>
                    <td>TVA</td>
                    <td>{{ number_format($order->tax, 2, ',', ' ') }} €</td>
                </tr>
                <tr class="total-row">
                    <td>Total TTC</td>
                    <td>{{ number_format($order->total, 2, ',', ' ') }} €</td>
                </tr>
            </table>
        </div>

        <div class="payment-info">
            <h3>Informations de paiement</h3>
            <p>
                @if($order->payment_method)
                    <strong>Methode:</strong> {{ $order->payment_method }}<br>
                @endif
                <strong>Statut:</strong>
                @php
                    $paymentLabels = [
                        'paid' => 'Paye',
                        'pending' => 'En attente',
                        'failed' => 'Echoue',
                        'refunded' => 'Rembourse',
                    ];
                    $paymentClass = match($order->payment_status) {
                        'paid' => 'payment-paid',
                        'pending' => 'payment-pending',
                        default => 'payment-failed',
                    };
                @endphp
                <span class="payment-badge {{ $paymentClass }}">
                    {{ $paymentLabels[$order->payment_status] ?? $order->payment_status }}
                </span>
            </p>
        </div>

        <div class="footer">
            <p>{{ $companyName }} &mdash; Facture {{ $invoiceNumber }}</p>
            @if($companySiret)
                <p>SIRET: {{ $companySiret }}</p>
            @endif
            @if($companyTvaNumber)
                <p>N° TVA intracommunautaire: {{ $companyTvaNumber }}</p>
            @endif
        </div>
    </div>
</body>
</html>

<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Traits\NormalizesPhone;
use App\Models\Order;
use App\Services\MynaPayGateway;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PaymentController extends Controller
{
    use NormalizesPhone;

    public function __construct(private readonly MynaPayGateway $gateway) {}

    public function processOrangeMoney(Request $request): JsonResponse
    {
        $request->merge(['phone' => $this->normalizePhone($request->input('phone'))]);
        $validated = $request->validate([
            'phone' => ['required', 'regex:/^\d{8}$/'], 'amount' => ['nullable', 'integer', 'min:1'],
            'otp' => ['required', 'regex:/^\d{6}$/'], 'refNumber' => ['required', 'string', 'max:50'],
            'extTxnId' => ['required', 'string', 'max:80'],
        ]);

        $order = Order::where('reference', $validated['refNumber'])->first();
        if ($order) $amount = (int) $order->total_amount;
        elseif (isset($validated['amount'])) $amount = (int) $validated['amount'];
        else return $this->error('MISSING_AMOUNT', 'Montant requis lorsque la référence de commande est introuvable.', 422);

        $phone = (string) config('mynapay.country_code', '226') . $validated['phone'];
        if (config('mynapay.simulate', false)) {
            $transactionId = 'MYNA-SIM-' . strtoupper(bin2hex(random_bytes(6)));
            $this->storeProof($validated, $transactionId, $amount, $phone);
            return $this->success($transactionId, $amount, $phone, 'Simulation locale MynaPay active.');
        }
        if (blank(config('mynapay.api_key'))) return $this->error('MISCONFIGURED', 'MynaPay n’est pas configuré. Contactez l’administrateur.', 503);

        try {
            $response = $this->gateway->createOrangeCollection([
                'external_reference' => $validated['refNumber'], 'operator' => 'orange',
                'payer_phone' => $phone, 'amount' => $amount, 'fee_amount' => $order?->om_fees,
                'otp' => $validated['otp'], 'label' => 'Commande Mercury ' . $validated['refNumber'],
            ], $validated['extTxnId']);
        } catch (ConnectionException) {
            return $this->error('GATEWAY_UNREACHABLE', 'La passerelle MynaPay est temporairement indisponible.', 502);
        }
        if (! $response->successful()) return $this->gatewayError($response->status(), $response->json());
        return $this->handleResult($response->json(), $validated, $amount, $phone);
    }

    public function checkOrangeMoney(Request $request, string $collectionId): JsonResponse
    {
        $validated = $request->validate([
            'refNumber' => ['required', 'string', 'max:50'], 'extTxnId' => ['required', 'string', 'max:80'],
        ]);
        $pending = Cache::get($this->pendingKey($collectionId));
        if (! is_array($pending) || ($pending['reference_number'] ?? null) !== $validated['refNumber']
            || ($pending['ext_txn_id'] ?? null) !== $validated['extTxnId']) {
            return $this->error('COLLECTION_NOT_FOUND', 'Collecte introuvable ou expirée.', 404);
        }
        try {
            $response = $this->gateway->checkCollection($collectionId);
        } catch (ConnectionException) {
            return $this->error('GATEWAY_UNREACHABLE', 'La vérification MynaPay est temporairement indisponible.', 502);
        }
        if (! $response->successful()) return $this->gatewayError($response->status(), $response->json());
        return $this->handleResult($response->json(), $validated, (int) $pending['amount'], (string) $pending['phone'], $collectionId);
    }

    private function handleResult(array $data, array $validated, int $amount, string $phone, ?string $fallbackId = null): JsonResponse
    {
        $status = strtolower((string) ($data['status'] ?? 'pending'));
        $collectionId = (string) ($data['collection_id'] ?? $fallbackId ?? '');
        $message = (string) ($data['message'] ?? 'Collecte transmise à MynaPay.');
        if ($status === 'success') {
            $transactionId = (string) ($data['operator_ref'] ?? $collectionId);
            if ($transactionId === '') return $this->error('INVALID_GATEWAY_RESPONSE', 'Réponse MynaPay incomplète.', 502);
            $this->storeProof($validated, $transactionId, $amount, $phone);
            if ($collectionId !== '') Cache::forget($this->pendingKey($collectionId));
            return $this->success($transactionId, $amount, $phone, $message);
        }
        if ($status === 'pending' && $collectionId !== '') {
            Cache::put($this->pendingKey($collectionId), [
                'reference_number' => $validated['refNumber'], 'ext_txn_id' => $validated['extTxnId'],
                'amount' => $amount, 'phone' => $phone,
            ], now()->addMinutes(30));
            return response()->json(['status' => 'pending', 'collectionId' => $collectionId,
                'message' => $message, 'amount' => $amount, 'phone' => $phone], 202);
        }
        return $this->error('PAYMENT_FAILED', $message, 402);
    }

    private function storeProof(array $validated, string $transactionId, int $amount, string $phone): void
    {
        Cache::put('om_payment_confirmation:' . $validated['extTxnId'], [
            'trans_id' => $transactionId, 'reference_number' => $validated['refNumber'],
            'ext_txn_id' => $validated['extTxnId'], 'amount' => $amount, 'phone' => $phone,
            'validated_at' => now()->toIso8601String(),
        ], now()->addMinutes(30));
    }

    private function success(string $id, int $amount, string $phone, string $message): JsonResponse
    {
        return response()->json(['status' => 'success', 'transId' => $id, 'message' => $message,
            'amount' => $amount, 'phone' => $phone, 'date' => now()->format('Y-m-d H:i:s')]);
    }

    private function gatewayError(int $httpStatus, mixed $body): JsonResponse
    {
        $message = is_array($body) ? (string) ($body['message'] ?? $body['detail'] ?? 'Requête refusée par MynaPay.') : 'Requête refusée par MynaPay.';
        $status = in_array($httpStatus, [400, 401, 403, 409, 422, 429], true) ? $httpStatus : 502;
        return $this->error('MYNAPAY_' . $httpStatus, $message, $status);
    }

    private function error(string $code, string $message, int $status): JsonResponse
    {
        return response()->json(['status' => 'error', 'errorCode' => $code, 'message' => $message], $status);
    }

    private function pendingKey(string $id): string { return 'mynapay_collection:' . $id; }
}

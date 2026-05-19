<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Http\Traits\NormalizesPhone;

class PaymentController extends Controller
{
    use NormalizesPhone;
    public function processOrangeMoney(Request $request): JsonResponse
    {
        $request->merge([
            'phone' => $this->normalizePhone($request->input('phone')),
        ]);

        $validated = $request->validate([
            'phone'     => ['required', 'regex:/^\d{8}$/'],
            'amount'    => ['required', 'integer', 'min:1'],
            'otp'       => ['required', 'regex:/^\d{6}$/'],
            'refNumber' => ['required', 'string', 'max:50'],
            'extTxnId'  => ['required', 'string', 'max:50'],
        ]);

        $countryCode = config('orangemoney.country_code', '226');
        $customerMsisdn = $countryCode . $validated['phone'];

        if (config('orangemoney.simulate', false)) {
            usleep(200_000);

            $simulatedTransId = 'OM' . gmdate('ymd.Hi') . '.C' . str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);

            Cache::put($this->paymentCacheKey($validated['extTxnId']), [
                'trans_id' => $simulatedTransId,
                'reference_number' => $validated['refNumber'],
                'ext_txn_id' => $validated['extTxnId'],
                'amount' => (int) $validated['amount'],
                'phone' => $customerMsisdn,
                'validated_at' => now()->toIso8601String(),
            ], now()->addMinutes(30));

            return response()->json([
                'status'  => 'success',
                'transId' => $simulatedTransId,
                'message' => 'Simulation locale active. Configurez .env pour le mode live.',
                'amount'  => $validated['amount'],
                'phone'   => $customerMsisdn,
                'date'    => now()->format('Y-m-d H:i:s'),
            ]);
        }

        $endpoint = config('orangemoney.env') === 'prod'
            ? config('orangemoney.url_prod')
            : config('orangemoney.url_test');

        $xmlRequest = $this->buildXmlPayload([
            'customer_msisdn'  => $customerMsisdn,
            'merchant_msisdn'  => config('orangemoney.merchant_msisdn', ''),
            'api_username'     => config('orangemoney.api_username', ''),
            'api_password'     => config('orangemoney.api_password', ''),
            'amount'           => (string) $validated['amount'],
            'provider'         => config('orangemoney.provider', '101'),
            'provider2'        => config('orangemoney.provider2', '101'),
            'payid'            => config('orangemoney.payid', '12'),
            'payid2'           => config('orangemoney.payid2', '12'),
            'otp'              => $validated['otp'],
            'reference_number' => $validated['refNumber'],
            'ext_txn_id'       => $validated['extTxnId'],
        ]);

        $ch = curl_init($endpoint);
        if ($ch === false) {
            return response()->json([
                'status'    => 'error',
                'errorCode' => '500',
                'message'   => "Impossible d'initialiser cURL.",
            ], 500);
        }

        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/xml; charset=UTF-8'],
            CURLOPT_POSTFIELDS     => $xmlRequest,
            CURLOPT_CONNECTTIMEOUT => 15,
            CURLOPT_TIMEOUT        => 30,
        ]);

        $xmlResponse = curl_exec($ch);
        $curlErrno   = curl_errno($ch);
        $curlError   = curl_error($ch);
        $httpCode    = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($curlErrno !== 0 || $xmlResponse === false) {
            return response()->json([
                'status'    => 'error',
                'errorCode' => '90001',
                'message'   => 'Erreur reseau Orange Money: ' . ($curlError ?: 'unknown'),
            ], 502);
        }

        $responseData = $this->parseXmlResponse((string) $xmlResponse);
        $status  = (string) ($responseData['status'] ?? '');
        $message = (string) ($responseData['message'] ?? 'Transaction refusee.');
        $transId = (string) ($responseData['transID'] ?? $responseData['transId'] ?? '');

        $isSuccess = in_array($status, ['200', 'SUCCESS', '00'], true)
            || ($httpCode >= 200 && $httpCode < 300 && $transId !== '');

        if (! $isSuccess) {
            $errorCode = $status !== '' ? $status : (string) ($httpCode > 0 ? $httpCode : '90001');

            return response()->json([
                'status'    => 'error',
                'errorCode' => $errorCode,
                'message'   => $message,
            ], 400);
        }

        $resolvedTransId = $transId !== ''
            ? $transId
            : 'OM' . gmdate('ymd.Hi') . '.C' . str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);

        Cache::put($this->paymentCacheKey($validated['extTxnId']), [
            'trans_id' => $resolvedTransId,
            'reference_number' => $validated['refNumber'],
            'ext_txn_id' => $validated['extTxnId'],
            'amount' => (int) $validated['amount'],
            'phone' => $customerMsisdn,
            'validated_at' => now()->toIso8601String(),
        ], now()->addMinutes(30));

        return response()->json([
            'status'  => 'success',
            'transId' => $resolvedTransId,
            'message' => $message !== '' ? $message : 'Transaction validee.',
            'amount'  => $validated['amount'],
            'phone'   => $customerMsisdn,
            'date'    => now()->format('Y-m-d H:i:s'),
        ]);
    }

    private function paymentCacheKey(string $extTxnId): string
    {
        return 'om_payment_confirmation:' . $extTxnId;
    }

    private function buildXmlPayload(array $data): string
    {
        return sprintf(
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<COMMAND>\n  <TYPE>OMPREQ</TYPE>\n  <customer_msisdn>%s</customer_msisdn>\n  <merchant_msisdn>%s</merchant_msisdn>\n  <api_username>%s</api_username>\n  <api_password>%s</api_password>\n  <amount>%s</amount>\n  <PROVIDER>%s</PROVIDER>\n  <PROVIDER2>%s</PROVIDER2>\n  <PAYID>%s</PAYID>\n  <PAYID2>%s</PAYID2>\n  <otp>%s</otp>\n  <reference_number>%s</reference_number>\n  <ext_txn_id>%s</ext_txn_id>\n</COMMAND>",
            htmlspecialchars($data['customer_msisdn'], ENT_XML1),
            htmlspecialchars($data['merchant_msisdn'], ENT_XML1),
            htmlspecialchars($data['api_username'], ENT_XML1),
            htmlspecialchars($data['api_password'], ENT_XML1),
            htmlspecialchars($data['amount'], ENT_XML1),
            htmlspecialchars($data['provider'], ENT_XML1),
            htmlspecialchars($data['provider2'], ENT_XML1),
            htmlspecialchars($data['payid'], ENT_XML1),
            htmlspecialchars($data['payid2'], ENT_XML1),
            htmlspecialchars($data['otp'], ENT_XML1),
            htmlspecialchars($data['reference_number'], ENT_XML1),
            htmlspecialchars($data['ext_txn_id'], ENT_XML1)
        );
    }

    private function parseXmlResponse(string $xml): array
    {
        libxml_use_internal_errors(true);
        $doc = simplexml_load_string($xml);

        if ($doc === false) {
            return [];
        }

        $result = [];
        foreach (['status', 'message', 'transID', 'transId'] as $key) {
            if (isset($doc->{$key})) {
                $result[$key] = (string) $doc->{$key};
            }
        }

        return $result;
    }

}

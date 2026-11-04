import axios, { AxiosError } from "axios";
import { env } from "../../config/env";
import { createHash } from "node:crypto";
// ============================================================
// CONFIGURATION
// ============================================================

if (!env.VERIFY_ET_API_KEY) {
  throw new Error("VERIFY_ET_API_KEY is required");
}

if (!env.VERIFY_ET_API_URL) {
  throw new Error("VERIFY_ET_API_URL is required");
}

// Verify.ET waits for a result before returning.
// This implementation does not call any status/poll endpoint.
const VERIFY_WAIT_MS = 8_000;
const REQUEST_TIMEOUT_MS = VERIFY_WAIT_MS + 7_000;

// ============================================================
// TYPES
// ============================================================

export interface VerifyEtTransaction {
  bank?: string;
  status?: string;
  verified?: boolean;

  amount?: number | string;
  currency?: string;

  senderName?: string;
  senderAccount?: string;

  receiverName?: string;
  receiverAccount?: string;

  referenceNumber?: string;
  transactionNumber?: string;
  receiptNumber?: string;

  timestamp?: string;

  confirmationHistory?: {
    scope?: string;
    isFirstConfirmation?: boolean;
    confirmedBefore?: boolean;
    confirmationCount?: number;
  };

  settlementAccountMatch?: {
    matched?: boolean;
    matchType?: string;
    matchConfidence?: string;
    source?: string;
    bank?: string;
    receiverAccount?: string;
    matchedSettlementAccount?: string;
    candidateCount?: number;
    ambiguous?: boolean;
    reason?: string;
  };

  // Legacy/provider-specific fields.
  payerName?: string;
  payerTelebirrNo?: string;
  creditedPartyName?: string;
  creditedPartyAccountNo?: string;
  transactionStatus?: string;
  receiptNo?: string;
  paymentDate?: string;
  settledAmount?: number | string;
  totalPaidAmount?: number | string;
}

export interface VerifyEtResponse {
  success?: boolean;
  message?: string;

  data?: VerifyEtTransaction[];

  requestId?: string;

  verification?: {
    requestId?: string;
    bank?: string;
    processingStatus?: string;
    status?: string;
    verified?: boolean;
  };
}

export interface PaymentVerifyResult {
  valid: boolean;
  // Retryable means no reliable final verdict was received.
  retryable?: boolean;
  pending?: boolean;
  message: string;

  receiptNo?: string;
  referenceNumber?: string;

  payerName?: string;
  payerAccount?: string;

  creditedPartyName?: string;
  creditedPartyAccount?: string;

  settledAmount?: number;

  receiverMatched?: boolean;
}

// ============================================================
// ERROR TYPE
// ============================================================

export class VerifyEtError extends Error {
  status?: number;
  code?: string;
  retryAfterSeconds?: number;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      retryAfterSeconds?: number;
    } = {},
  ) {
    super(message);
    this.name = "VerifyEtError";
    this.status = options.status;
    this.code = options.code;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

// ============================================================
// HELPERS
// ============================================================

const normalizeName = (name: string = "") =>
  name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}*\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const namesMatch = (actualRaw: string, expectedRaw: string): boolean => {
  const actual = normalizeName(actualRaw);
  const expected = normalizeName(expectedRaw);

  if (!actual || !expected) return false;
  if (actual === expected) return true;

  const a = actual.split(" ");
  const e = expected.split(" ");

  const tokenMatches = (token: string, candidate: string) => {
    if (!token.includes("*")) {
      return token === candidate;
    }

    const pattern = new RegExp(
      "^" +
        token
          .split("*")
          .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join(".*") +
        "$",
    );

    return pattern.test(candidate);
  };

  const actualInExpected =
    a.length >= 2 && a.every((t) => e.some((c) => tokenMatches(t, c)));

  const expectedInActual =
    e.length >= 2 && e.every((t) => a.some((c) => tokenMatches(c, t)));

  return actualInExpected || expectedInActual;
};

const parseAmount = (
  amount: string | number | undefined | null,
): number | null => {
  if (amount === undefined || amount === null || amount === "") {
    return null;
  }

  if (typeof amount === "number") {
    return Number.isFinite(amount) ? amount : null;
  }

  const value = Number(amount.replace(/[^0-9.]/g, ""));

  return Number.isFinite(value) ? value : null;
};

/**
 * 251911223344 -> 911223344
 * +251911223344 -> 911223344
 * 0911223344 -> 911223344
 */
const toLocalPhone = (value: string = ""): string => {
  const v = value.replace(/[\s\-+]/g, "");

  if (v.startsWith("251")) return v.slice(3);
  if (v.startsWith("0")) return v.slice(1);

  return v;
};

const receiverMatchesLocally = (
  receiverAccount: string | undefined,
  expectedAccount: string,
): boolean => {
  if (!receiverAccount) return false;

  const receiver = toLocalPhone(receiverAccount);
  const expected = toLocalPhone(expectedAccount);

  if (!receiver || !expected || receiver.length !== expected.length) {
    return false;
  }

  for (let i = 0; i < receiver.length; i++) {
    if (receiver[i] === "*") continue;
    if (receiver[i] !== expected[i]) return false;
  }

  return true;
};

// ============================================================
// CALL VERIFY.ET - NO POLLING
// ============================================================

// ============================================================
// CALL VERIFY.ET - PAYLOAD-BASED IDEMPOTENCY
// ============================================================

export async function verifyPayment(
  reference: string,
  settlementAccount?: string,
  idempotencyKey?: string,
): Promise<VerifyEtResponse> {
  const requestPayload = {
    bank: "telebirr",
    transactionNumber: reference,
    ...(settlementAccount ? { settlementAccount } : {}),
  };

  const requestParams = {
    waitMs: VERIFY_WAIT_MS,
  };

  // ----------------------------------------------------------
  // GENERATE IDEMPOTENCY KEY
  // ----------------------------------------------------------

  const requestFingerprint = JSON.stringify({
    paymentOrderKey: idempotencyKey ?? "gebeta-payment",
    payload: requestPayload,
    params: requestParams,
  });

  const verifyIdempotencyKey = createHash("sha256")
    .update(requestFingerprint)
    .digest("hex");

  try {
    const response = await axios.post<VerifyEtResponse>(
      env.VERIFY_ET_API_URL,
      requestPayload,
      {
        params: requestParams,

        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.VERIFY_ET_API_KEY,
          "Idempotency-Key": verifyIdempotencyKey,
        },

        validateStatus: (status) => status >= 200 && status < 300,

        timeout: REQUEST_TIMEOUT_MS,
      },
    );

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<any>;

    const body = axiosError.response?.data;

    const status = axiosError.response?.status;

    const retryAfterHeader = axiosError.response?.headers?.["retry-after"];

    const retryAfterSeconds = retryAfterHeader
      ? Number(retryAfterHeader) || undefined
      : undefined;

    // Log technical details without exposing the provider's
    // raw error message or transaction information.
    console.error("Verify.ET request failed:", {
      status,
      code: body?.error?.code,
      axiosCode: axiosError.code,
    });

    if (
      status === 409 &&
      /idempotency.key.*already used/i.test(
        body?.error?.message || body?.message || "",
      )
    ) {
      throw new VerifyEtError(
        "Verification request conflict. Please retry using the same transaction reference.",
        {
          status: 503,
          code: "IDEMPOTENCY_CONFLICT",
        },
      );
    }

    throw new VerifyEtError(
      body?.error?.message ||
        body?.message ||
        "Unable to verify payment with Verify.ET",
      {
        status,
        code: body?.error?.code,
        retryAfterSeconds,
      },
    );
  }
}

// ============================================================
// VALIDATE VERIFY.ET RESPONSE
// ============================================================

export const paymentVerify = (
  result: VerifyEtResponse,
  expectedAmount: number,
  expectedAccountName: string,
  expectedSettlementAccount?: string,
): PaymentVerifyResult => {
  if (!result) {
    return {
      valid: false,
      retryable: true,
      message: "Payment verification failed. Please try again.",
    };
  }

  const processingStatus = result.verification?.processingStatus?.toLowerCase();

  const verificationStatus = result.verification?.status?.toLowerCase();

  // ----------------------------------------------------------
  // QUEUED / RUNNING
  // No polling. User can manually retry the same reference.
  // ----------------------------------------------------------

  if (
    processingStatus === "queued" ||
    processingStatus === "running" ||
    verificationStatus === "pending"
  ) {
    return {
      valid: false,
      retryable: true,
      message:
        "Your transaction is still being processed. Please wait a moment and submit the same transaction reference again.",
    };
  }

  // ----------------------------------------------------------
  // NOT FOUND / NO DATA
  // ----------------------------------------------------------

  if (
    verificationStatus === "not_found" ||
    (!result.data?.length && /not\s*found/i.test(result.message ?? ""))
  ) {
    return {
      valid: false,
      retryable: true,
      message: "Transaction was not found. Check the reference and try again.",
    };
  }

  const payment = result.data?.[0];

  if (!payment) {
    return {
      valid: false,
      retryable: true,
      message:
        result.message ||
        "Transaction could not be verified. Please try again.",
    };
  }

  // ----------------------------------------------------------
  // TRANSACTION STATUS
  // ----------------------------------------------------------

  const status = (
    payment.status ||
    payment.transactionStatus ||
    verificationStatus ||
    ""
  ).toLowerCase();

  const verified =
    payment.verified === true || result.verification?.verified === true;

  if (!verified && status !== "success" && status !== "completed") {
    // Explicit failure is a final verdict.
    if (
      status === "failed" ||
      status === "reversed" ||
      status === "cancelled"
    ) {
      return {
        valid: false,
        retryable: false,
        message: `Payment was not successful. Status: ${status}`,
      };
    }

    // Unknown/incomplete status is retryable.
    return {
      valid: false,
      retryable: true,
      message: "Transaction has not been confirmed yet. Please try again.",
    };
  }

  // ----------------------------------------------------------
  // CURRENCY
  // ----------------------------------------------------------

  if (payment.currency && payment.currency.toUpperCase() !== "ETB") {
    return {
      valid: false,
      retryable: false,
      message: `Unsupported currency ${payment.currency}. Only ETB is accepted.`,
    };
  }

  const payerName = payment.senderName || payment.payerName;

  const receiverName = payment.receiverName || payment.creditedPartyName;

  // ----------------------------------------------------------
  // AMOUNT
  // ----------------------------------------------------------

  const receivedAmount = parseAmount(
    payment.amount ?? payment.settledAmount ?? payment.totalPaidAmount,
  );

  if (receivedAmount === null) {
    return {
      valid: false,
      retryable: true,
      message: "Invalid payment amount returned by Verify.ET.",
    };
  }

  const normalizedReceived = Number(receivedAmount.toFixed(2));

  const normalizedExpected = Number(Number(expectedAmount).toFixed(2));

  if (normalizedReceived !== normalizedExpected) {
    return {
      valid: false,
      retryable: false,
      message: `Amount mismatch. Expected ${normalizedExpected} Birr but received ${normalizedReceived} Birr.`,
      settledAmount: normalizedReceived,
      payerName,
      creditedPartyName: receiverName,
    };
  }

  // ----------------------------------------------------------
  // RECEIVER ACCOUNT
  // ----------------------------------------------------------

  const match = payment.settlementAccountMatch;

  let accountMatched = false;

  if (match) {
    accountMatched = match.matched === true && match.ambiguous !== true;
  } else if (expectedSettlementAccount) {
    accountMatched = receiverMatchesLocally(
      payment.receiverAccount || payment.creditedPartyAccountNo,
      expectedSettlementAccount,
    );
  }

  if (expectedSettlementAccount && !accountMatched) {
    return {
      valid: false,
      retryable: false,
      message: "Payment was not made to the expected Telebirr account.",
      payerName,
      creditedPartyName: receiverName,
      settledAmount: normalizedReceived,
      receiverMatched: false,
    };
  }

  // ----------------------------------------------------------
  // RECEIVER NAME
  // ----------------------------------------------------------

  const exactAccountMatch = match?.reason === "receiver_account_exact_match";

  if (!exactAccountMatch) {
    if (!receiverName) {
      return {
        valid: false,
        retryable: true,
        message: "Receiver account name was not returned by Verify.ET.",
        payerName,
        settledAmount: normalizedReceived,
      };
    }

    if (!namesMatch(receiverName, expectedAccountName)) {
      return {
        valid: false,
        retryable: false,
        message: `Account holder mismatch. Expected "${expectedAccountName}" but payment was made to "${receiverName}".`,
        payerName,
        creditedPartyName: receiverName,
        settledAmount: normalizedReceived,
        receiverMatched: false,
      };
    }
  }

  // ----------------------------------------------------------
  // SUCCESS
  // ----------------------------------------------------------

  return {
    valid: true,
    retryable: false,
    message: "Payment verified successfully.",

    receiptNo:
      payment.receiptNumber ||
      payment.referenceNumber ||
      payment.transactionNumber ||
      payment.receiptNo,

    referenceNumber: payment.referenceNumber || payment.transactionNumber,

    payerName,

    payerAccount: payment.senderAccount || payment.payerTelebirrNo,

    creditedPartyName: receiverName,

    creditedPartyAccount:
      payment.receiverAccount || payment.creditedPartyAccountNo,

    settledAmount: normalizedReceived,
    receiverMatched: true,
  };
};

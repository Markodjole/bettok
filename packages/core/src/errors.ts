export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(available: number, required: number) {
    super(
      `Insufficient balance: ${available} available, ${required} required`,
      "INSUFFICIENT_BALANCE",
      400,
      { available, required }
    );
  }
}

export class BettingClosedError extends AppError {
  constructor(clipNodeId: string) {
    super(
      "Betting is closed for this clip",
      "BETTING_CLOSED",
      400,
      { clipNodeId }
    );
  }
}

export class MarketNotFoundError extends AppError {
  constructor(marketId: string) {
    super("Prediction market not found", "MARKET_NOT_FOUND", 404, {
      marketId,
    });
  }
}

export class DuplicateBetError extends AppError {
  constructor() {
    super(
      "You already have a bet on this side of the market",
      "DUPLICATE_BET",
      400
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class LlmValidationError extends AppError {
  constructor(purpose: string, errors: string[]) {
    super(
      `LLM output validation failed for ${purpose}`,
      "LLM_VALIDATION_ERROR",
      500,
      { purpose, errors }
    );
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toApiError(error: unknown) {
  if (isAppError(error)) {
    return {
      error: error.message,
      code: error.code,
      details: error.details,
    };
  }
  console.error("Unexpected error:", error);
  return {
    error: "An unexpected error occurred",
    code: "INTERNAL_ERROR",
  };
}

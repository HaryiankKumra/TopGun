/**
 * Utility function to safely extract error messages from various error types
 * Prevents "[object Object]" issues in error displays
 */
export const getErrorMessage = (error: unknown): string => {
  // If it's already a string, return it
  if (typeof error === "string") {
    return error;
  }

  // If it's an Error object, return the message
  if (error instanceof Error) {
    return error.message;
  }

  // If it's an object with message property
  if (error && typeof error === "object") {
    const errorObj = error as any;

    // Check for common error properties
    if (errorObj.message && typeof errorObj.message === "string") {
      return errorObj.message;
    }

    if (errorObj.details && typeof errorObj.details === "string") {
      return errorObj.details;
    }

    if (errorObj.error && typeof errorObj.error === "string") {
      return errorObj.error;
    }

    if (errorObj.description && typeof errorObj.description === "string") {
      return errorObj.description;
    }

    // For Supabase errors
    if (errorObj.hint && typeof errorObj.hint === "string") {
      return errorObj.hint;
    }

    // Try to safely stringify if it has useful properties
    try {
      const keys = Object.keys(errorObj);
      if (keys.length > 0) {
        return `Error: ${JSON.stringify(errorObj, null, 2)}`;
      }
    } catch {
      // Fall through to default
    }
  }

  // Default fallback message
  return "An unknown error occurred";
};

/**
 * Utility function for logging errors with proper formatting
 */
export const logError = (context: string, error: unknown): void => {
  const message = getErrorMessage(error);
  console.error(`❌ ${context}:`, error);
  console.error(`Error message: ${message}`);
};

/**
 * Utility function for creating user-friendly error messages
 */
export const createUserErrorMessage = (
  error: unknown,
  defaultMessage: string = "An error occurred",
): string => {
  const errorMessage = getErrorMessage(error);

  // If the error message is too technical or contains sensitive info, use default
  const technicalPatterns = [
    /connection\s+refused/i,
    /timeout/i,
    /network\s+error/i,
    /fetch\s+failed/i,
    /cors/i,
    /unauthorized/i,
    /forbidden/i,
    /internal\s+server\s+error/i,
  ];

  const isTechnical = technicalPatterns.some((pattern) =>
    pattern.test(errorMessage),
  );

  if (isTechnical) {
    return `${defaultMessage}. Please try again or contact support if the issue persists.`;
  }

  return errorMessage;
};

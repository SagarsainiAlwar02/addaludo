/**
 * apiResponse
 * Standardized success and error response helpers.
 * Every API response in this project must use one of these two functions.
 *
 * Success format:
 *   { success: true, message: "...", data: { ... } }
 *
 * Error format:
 *   { success: false, error: "...", code: "ERROR_CODE" }
 */

export const successResponse = (res, data = null, message = "", statusCode = 200) => {
  const response = { success: true };

  if (message) response.message = message;
  if (data !== undefined && data !== null) response.data = data;

  return res.status(statusCode).json(response);
};

export const errorResponse = (res, error = "Something went wrong", code = "INTERNAL_ERROR", statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error,
    code,
  });
};

/**
 * Common HTTP status code helpers built on top of success/error responses.
 */
export const createdResponse = (res, data, message = "Created successfully") =>
  successResponse(res, data, message, 201);

export const badRequestResponse = (res, error, code = "BAD_REQUEST") =>
  errorResponse(res, error, code, 400);

export const unauthorizedResponse = (res, error = "Unauthorized", code = "UNAUTHORIZED") =>
  errorResponse(res, error, code, 401);

export const forbiddenResponse = (res, error = "Forbidden", code = "FORBIDDEN") =>
  errorResponse(res, error, code, 403);

export const notFoundResponse = (res, error = "Not found", code = "NOT_FOUND") =>
  errorResponse(res, error, code, 404);

export const conflictResponse = (res, error, code = "CONFLICT") =>
  errorResponse(res, error, code, 409);

export const validationErrorResponse = (res, error, code = "VALIDATION_ERROR") =>
  errorResponse(res, error, code, 422);

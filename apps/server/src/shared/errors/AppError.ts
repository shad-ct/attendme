export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, code: string, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const Errors = {
  NOT_FOUND: (entity = 'Resource') =>
    new AppError(`${entity} not found.`, `${entity.toUpperCase().replace(' ', '_')}_NOT_FOUND`, 404),
  UNAUTHORIZED: () => new AppError('Authentication required.', 'UNAUTHORIZED', 401),
  FORBIDDEN: () => new AppError('You do not have permission to perform this action.', 'FORBIDDEN', 403),
  VALIDATION: (message: string) => new AppError(message, 'VALIDATION_ERROR', 422),
  CONFLICT: (message: string) => new AppError(message, 'CONFLICT', 409),
  INTERNAL: () => new AppError('An unexpected error occurred. Please try again.', 'INTERNAL_ERROR', 500),
};

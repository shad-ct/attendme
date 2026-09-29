import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ZodError } from 'zod';
import { config } from '../../config';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data.',
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  // Mongoose duplicate key
  if ((err as any)?.code === 11000) {
    const field = Object.keys((err as any).keyValue || {})[0] ?? 'field';
    res.status(409).json({
      error: { code: 'DUPLICATE_KEY', message: `A record with this ${field} already exists.` },
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: config.nodeEnv === 'development' ? String(err) : 'An unexpected error occurred.',
    },
  });
}

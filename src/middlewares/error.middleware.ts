import { Request, Response, NextFunction } from 'express';
import { AppError } from '../modules/tasks/services/comments.service';

/**
 * Global error handler — mount LAST in Express app.
 * Catches AppError (known operational errors) and unexpected errors.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Known operational error — safe to surface to client
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  // Unknown error — log fully, return generic 500
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    status: 'error',
    message: 'An unexpected error occurred',
  });
}
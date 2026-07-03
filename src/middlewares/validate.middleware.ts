import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';

/**
 * Validates req.body, req.params, and req.query against a Zod schema.
 * Returns 400 with structured field errors on failure.
 */
export function validate<T extends ZodType<any,any,any>>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors,
      });
      return;
    }

    const data=result.data;
    if (data && typeof data === 'object'){
        // Attach parsed + coerced values back onto req
        if (result.data.body)   req.body   = result.data.body;
        if (result.data.params) req.params = result.data.params as Record<string, string>;
        if (result.data.query)  req.query  = result.data.query as Record<string, string>;
    }



    next();
  };
}

function formatZodErrors(error: ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    // Drop the leading 'body.' / 'params.' / 'query.' prefix for cleaner output
    const field = issue.path.slice(1).join('.') || issue.path.join('.');
    if (!result[field]) result[field] = [];
    result[field].push(issue.message);
  }
  return result;
}
/**
 * Zod Schema Validation Middleware
 * Validates request body against provided schema
 */

import { Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

/**
 * Middleware factory: validates request body against Zod schema
 * @param schema - Zod validation schema
 * @returns Express middleware function
 */
export function validate(schema: ZodSchema) {
  return (req: any, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body)
      req.body = validated
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        })
        return
      }

      res.status(400).json({ error: 'Validation failed' })
    }
  }
}

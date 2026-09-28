import { validationResult } from 'express-validator';

/**
 * Minimal reusable validation pipeline (Phase 1 foundation).
 *
 * Usage:  router.post('/login', ...validate(loginRules), controller)
 *
 * Each rule chain is an express-validator chain. After the chains run,
 * the terminal middleware rejects the request with HTTP 400 and a safe,
 * client-facing message (no implementation details leaked).
 */
export function validate(chains) {
  return [
    ...chains,
    (req, res, next) => {
      const errors = validationResult(req);
      if (errors.isEmpty()) return next();
      const first = errors.array()[0] || {};
      return res.status(400).json({
        success: false,
        message: first.msg || 'Invalid request'
      });
    }
  ];
}

import express from 'express';
import { body } from 'express-validator';
import { registerUser, loginUser, getMe } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { loginRateLimit, registerRateLimit } from '../middleware/security.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = express.Router();

// No normalization on purpose: existing accounts keep working exactly as
// registered; validation only rejects malformed input with 400.
const registerRules = [
  body('name').isString().trim().isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('email').isString().isEmail()
    .withMessage('A valid email address is required'),
  body('password').isString().isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
];

const loginRules = [
  body('email').isString().isEmail()
    .withMessage('A valid email address is required'),
  body('password').isString().isLength({ min: 1, max: 128 })
    .withMessage('Password is required')
];

router.post('/register', registerRateLimit(), ...validate(registerRules), registerUser);
router.post('/login', loginRateLimit(), ...validate(loginRules), loginUser);
router.get('/me', protect, getMe);

export default router;

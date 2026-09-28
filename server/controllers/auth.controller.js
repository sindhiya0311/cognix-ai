import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return jwt.sign({ id }, secret, { expiresIn: '30d' });
};

// Anti-enumeration: when no user matches the submitted email we still perform
// a bcrypt comparison of equal cost, so response timing does not reveal
// whether an account exists.
let dummyHashPromise = null;
const timeComparableReject = async (password) => {
  dummyHashPromise = dummyHashPromise || bcrypt.hash('cognix-timing-equalizer', 10);
  const dummyHash = await dummyHashPromise;
  await bcrypt.compare(password, dummyHash);
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ name, email, passwordHash: password });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: { _id: user._id, name: user.name, email: user.email },
        token
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    let passwordMatches = false;
    if (user) {
      passwordMatches = await user.matchPassword(password);
    } else {
      await timeComparableReject(password);
    }

    if (user && passwordMatches) {
      const token = generateToken(user._id);
      res.json({
        success: true,
        data: {
          user: { _id: user._id, name: user.name, email: user.email },
          token
        },
        message: 'Login successful'
      });
    } else {
      // Identical response whether the account is missing or the password is
      // wrong — never reveal which one failed.
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

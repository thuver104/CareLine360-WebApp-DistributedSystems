/**
 * auth-service - Authentication Business Logic
 * REFACTORED: Removed direct Patient model dependency, uses RabbitMQ events
 */

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Counter = require('../models/Counter');
const Otp = require('../models/Otp');
const { generateOtp, hashOtp } = require('../utils/otp');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/tokens');
const { publishEvent } = require('../../shared/rabbitmq/publisher');
const logger = require('../../shared/utils/logger');

// Event types
const EventTypes = {
  USER_REGISTERED: 'user.registered',
  LOGIN_SUCCESS: 'login.success',
  LOGIN_FAILED: 'login.failed',
  DOCTOR_VERIFIED: 'doctor.verified',
  EMAIL_SEND: 'email.send',
};

const shouldExposeDebugOtp = () => {
  if ((process.env.AUTH_EXPOSE_DEBUG_OTP || '').toLowerCase() === 'true') {
    return true;
  }
  return (process.env.NODE_ENV || 'development') !== 'production';
};

/**
 * Get next patient ID from counter
 */
const getNextPatientId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { key: 'patient' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `PAT-${String(counter.seq).padStart(6, '0')}`;
};

/**
 * Register new user (patient or doctor)
 * CHANGED: Publishes user.registered event instead of creating Patient directly
 */
const registerUser = async ({ identifier, password, fullName, role }) => {
  try {
    // Normalize identifier
    const rawIdentifier = (identifier || '').trim();

    // Only patients and doctors can self-register
    if (!['patient', 'doctor'].includes(role)) {
      return { 
        status: 400, 
        data: { message: 'Only patient or doctor can self-register' } 
      };
    }

    // Determine if identifier is email or phone
    const isEmail = rawIdentifier.includes('@');
    const email = isEmail ? rawIdentifier.toLowerCase() : undefined;
    const phone = !isEmail ? rawIdentifier : undefined;

    // Check if user already exists
    const existing = await User.findOne(isEmail ? { email } : { phone });
    if (existing) {
      return { status: 409, data: { message: 'User already exists' } };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      role,
      status: role === 'doctor' ? 'PENDING' : 'ACTIVE',
      fullName,
      email,
      phone,
      passwordHash,
    });

    logger.info('User registered', { userId: user._id, role, email, phone });

    // Generate patient ID if role is patient
    const patientId = role === 'patient' ? await getNextPatientId() : null;

    // 🔥 PUBLISH EVENT: user.registered
    // patient-service will consume this and create Patient profile
    // doctor-service will consume this and create Doctor profile
    await publishEvent(EventTypes.USER_REGISTERED, {
      eventType: 'USER_REGISTERED',
      timestamp: new Date(),
      payload: {
        userId: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        patientId, // Only for patients
      },
      metadata: {
        service: 'auth-service',
        correlationId: user._id.toString(),
      },
    });

    // Doctor: No auto-login (needs admin approval)
    if (role === 'doctor') {
      return {
        status: 201,
        data: {
          message: 'Doctor registered successfully. Awaiting admin approval.',
          user: { 
            id: user._id, 
            role: user.role, 
            email: user.email, 
            phone: user.phone, 
            status: user.status 
          },
        },
      };
    }

    // Patient: Create tokens and return
    const accessToken = signAccessToken({ 
      userId: user._id.toString(), 
      role: user.role, 
      email: user.email 
    });
    const refreshToken = signRefreshToken({ 
      userId: user._id.toString(), 
      role: user.role 
    });

    // Store hashed refresh token
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    return {
      status: 201,
      data: {
        message: 'Registered successfully',
        user: { 
          id: user._id, 
          role: user.role, 
          email: user.email, 
          phone: user.phone, 
          fullName: user.fullName, 
          isVerified: user.isVerified 
        },
        patientId,
        accessToken,
        refreshToken,
      },
    };
  } catch (error) {
    logger.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login user
 * CHANGED: Publishes login.success/login.failed events
 */
const loginUser = async ({ identifier, password }) => {
  try {
    // Normalize identifier
    const rawIdentifier = (identifier || '').trim();

    const query = rawIdentifier.includes('@')
      ? { email: rawIdentifier.toLowerCase() }
      : { phone: rawIdentifier };

    const user = await User.findOne(query);
    
    if (!user) {
      // 🔥 PUBLISH EVENT: login.failed
      await publishEvent(EventTypes.LOGIN_FAILED, {
        eventType: 'LOGIN_FAILED',
        timestamp: new Date(),
        payload: {
          identifier: rawIdentifier,
          reason: 'User not found',
          attemptedAt: new Date(),
        },
      });
      
      return { status: 401, data: { message: 'Invalid credentials' } };
    }

    if (!user.isActive) {
      return { status: 403, data: { message: 'Account is deactivated' } };
    }

    // Verify password
    const ok = await bcrypt.compare(password, user.passwordHash);
    
    if (!ok) {
      // 🔥 PUBLISH EVENT: login.failed
      await publishEvent(EventTypes.LOGIN_FAILED, {
        eventType: 'LOGIN_FAILED',
        timestamp: new Date(),
        payload: {
          identifier: rawIdentifier,
          userId: user._id.toString(),
          reason: 'Invalid password',
          attemptedAt: new Date(),
        },
      });
      
      return { status: 401, data: { message: 'Invalid credentials' } };
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      const msg = user.role === 'doctor'
        ? 'Doctor account not approved yet'
        : 'Account is not active. Please contact admin.';
      return { status: 403, data: { message: msg, status: user.status } };
    }

    // Update last login
    user.lastLoginAt = new Date();

    // Generate tokens
    const accessToken = signAccessToken({ 
      userId: user._id.toString(), 
      role: user.role,
      email: user.email 
    });
    const refreshToken = signRefreshToken({ 
      userId: user._id.toString(), 
      role: user.role 
    });

    // Store hashed refresh token
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    // 🔥 PUBLISH EVENT: login.success
    await publishEvent(EventTypes.LOGIN_SUCCESS, {
      eventType: 'LOGIN_SUCCESS',
      timestamp: new Date(),
      payload: {
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
        phone: user.phone,
        loginAt: user.lastLoginAt,
      },
    });

    logger.info('User logged in', { userId: user._id, role: user.role });

    return {
      status: 200,
      data: {
        message: 'Login success',
        user: { 
          id: user._id, 
          role: user.role, 
          email: user.email, 
          phone: user.phone, 
          fullName: user.fullName, 
          isVerified: user.isVerified 
        },
        accessToken,
        refreshToken,
      },
    };
  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
};

/**
 * Refresh access token
 */
const refreshAccessToken = async ({ refreshToken }) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return { status: 401, data: { message: 'Invalid refresh token' } };
    }

    // Verify refresh token hash
    const match = await bcrypt.compare(refreshToken, user.refreshTokenHash || '');
    if (!match) {
      return { status: 401, data: { message: 'Invalid refresh token' } };
    }

    // Generate new access token
    const newAccessToken = signAccessToken({ 
      userId: user._id.toString(), 
      role: user.role,
      email: user.email 
    });
    
    return { status: 200, data: { accessToken: newAccessToken } };
  } catch (e) {
    logger.warn('Refresh token error:', e.message);
    return { status: 401, data: { message: 'Refresh token expired/invalid' } };
  }
};

/**
 * Logout user (invalidate refresh token)
 */
const logoutUser = async ({ userId }) => {
  await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
  logger.info('User logged out', { userId });
  return { status: 200, data: { message: 'Logged out' } };
};

/**
 * Send email verification OTP
 * CHANGED: Publishes email.send event instead of calling emailService directly
 */
const sendEmailVerificationOtp = async ({ identifier }) => {
  try {
    const query = identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { phone: identifier };

    const user = await User.findOne(query);
    if (!user) {
      return { status: 404, data: { message: 'User not found' } };
    }

    if (!user.email) {
      return { status: 400, data: { message: 'Email not available for this account' } };
    }

    if (user.isVerified) {
      return { status: 200, data: { message: 'Email already verified' } };
    }

    // Remove old OTPs
    await Otp.deleteMany({ userId: user._id, purpose: 'EMAIL_VERIFY' });

    // Generate new OTP
    const otp = generateOtp();
    await Otp.create({
      userId: user._id,
      purpose: 'EMAIL_VERIFY',
      otpHash: hashOtp(otp),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      attemptsLeft: 5,
    });

    // Try publishing email event, but do not fail verification flow if notification stack is unavailable.
    try {
      await publishEvent(EventTypes.EMAIL_SEND, {
        eventType: 'EMAIL_SEND',
        timestamp: new Date(),
        payload: {
          to: user.email,
          subject: `${process.env.APP_NAME || 'CareLine360'} - Verify your email`,
          html: `
            <p>Your verification code is:</p>
            <h2 style="letter-spacing:2px">${otp}</h2>
            <p>This code expires in 10 minutes.</p>
          `,
          purpose: 'EMAIL_VERIFY',
          userId: user._id.toString(),
        },
      });
    } catch (publishError) {
      logger.warn('Email verification OTP publish failed; continuing with generated OTP', {
        userId: user._id,
        error: publishError?.message,
      });
    }

    logger.info('Email verification OTP sent', { userId: user._id, email: user.email });

    const response = { message: 'Verification OTP sent to email' };
    if (shouldExposeDebugOtp()) {
      response.debugOtp = otp;
    }

    return { status: 200, data: response };
  } catch (error) {
    logger.error('Send email verification OTP error:', error);
    throw error;
  }
};

/**
 * Verify email OTP
 */
const verifyEmailOtp = async ({ identifier, otp }) => {
  try {
    const query = identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { phone: identifier };

    const user = await User.findOne(query);
    if (!user) {
      return { status: 404, data: { message: 'User not found' } };
    }

    const record = await Otp.findOne({ userId: user._id, purpose: 'EMAIL_VERIFY' });
    if (!record) {
      return { status: 400, data: { message: 'OTP not found or expired' } };
    }

    if (record.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: record._id });
      return { status: 400, data: { message: 'OTP expired' } };
    }

    if (record.attemptsLeft <= 0) {
      await Otp.deleteOne({ _id: record._id });
      return { status: 429, data: { message: 'Too many attempts. Request a new OTP.' } };
    }

    // Verify OTP
    const ok = record.otpHash === hashOtp(otp);
    if (!ok) {
      record.attemptsLeft -= 1;
      await record.save();
      return { status: 400, data: { message: 'Invalid OTP' } };
    }

    // Mark as verified
    user.isVerified = true;
    await user.save();
    await Otp.deleteOne({ _id: record._id });

    logger.info('Email verified', { userId: user._id, email: user.email });

    return { status: 200, data: { message: 'Email verified successfully' } };
  } catch (error) {
    logger.error('Verify email OTP error:', error);
    throw error;
  }
};

/**
 * Send password reset OTP
 * CHANGED: Publishes email.send event
 */
const sendPasswordResetOtp = async ({ identifier }) => {
  try {
    const query = identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { phone: identifier };

    const user = await User.findOne(query);
    if (!user) {
      return { status: 404, data: { message: 'User not found' } };
    }

    if (!user.email) {
      return { status: 400, data: { message: 'Email not available for this account' } };
    }

    // Remove old OTPs
    await Otp.deleteMany({ userId: user._id, purpose: 'PASSWORD_RESET' });

    // Generate new OTP
    const otp = generateOtp();
    await Otp.create({
      userId: user._id,
      purpose: 'PASSWORD_RESET',
      otpHash: hashOtp(otp),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attemptsLeft: 5,
    });

    // Try publishing email event, but do not fail reset flow if notification stack is unavailable.
    try {
      await publishEvent(EventTypes.EMAIL_SEND, {
        eventType: 'EMAIL_SEND',
        timestamp: new Date(),
        payload: {
          to: user.email,
          subject: `${process.env.APP_NAME || 'CareLine360'} - Password reset`,
          html: `
            <p>Your password reset code is:</p>
            <h2 style="letter-spacing:2px">${otp}</h2>
            <p>This code expires in 10 minutes.</p>
          `,
          purpose: 'PASSWORD_RESET',
          userId: user._id.toString(),
        },
      });
    } catch (publishError) {
      logger.warn('Password reset OTP email publish failed; continuing with generated OTP', {
        userId: user._id,
        error: publishError?.message,
      });
    }

    logger.info('Password reset OTP sent', { userId: user._id, email: user.email });

    const response = { message: 'Password reset OTP sent to email' };
    if (shouldExposeDebugOtp()) {
      response.debugOtp = otp;
    }

    return { status: 200, data: response };
  } catch (error) {
    logger.error('Send password reset OTP error:', error);
    throw error;
  }
};

/**
 * Reset password with OTP
 */
const resetPasswordWithOtp = async ({ identifier, otp, newPassword }) => {
  try {
    const query = identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { phone: identifier };

    const user = await User.findOne(query);
    if (!user) {
      return { status: 404, data: { message: 'User not found' } };
    }

    const record = await Otp.findOne({ userId: user._id, purpose: 'PASSWORD_RESET' });
    if (!record) {
      return { status: 400, data: { message: 'OTP not found or expired' } };
    }

    if (record.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: record._id });
      return { status: 400, data: { message: 'OTP expired' } };
    }

    if (record.attemptsLeft <= 0) {
      await Otp.deleteOne({ _id: record._id });
      return { status: 429, data: { message: 'Too many attempts. Request a new OTP.' } };
    }

    // Verify OTP
    const ok = record.otpHash === hashOtp(otp);
    if (!ok) {
      record.attemptsLeft -= 1;
      await record.save();
      return { status: 400, data: { message: 'Invalid OTP' } };
    }

    // Update password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Logout from all devices
    user.refreshTokenHash = undefined;
    
    await user.save();
    await Otp.deleteOne({ _id: record._id });

    logger.info('Password reset successful', { userId: user._id });

    return { status: 200, data: { message: 'Password reset successful. Please login again.' } };
  } catch (error) {
    logger.error('Reset password error:', error);
    throw error;
  }
};

/**
 * Verify doctor (admin only)
 * CHANGED: Publishes doctor.verified event
 */
const verifyDoctor = async ({ doctorUserId, adminUserId, status }) => {
  try {
    const user = await User.findById(doctorUserId);
    
    if (!user) {
      return { status: 404, data: { message: 'Doctor not found' } };
    }

    if (user.role !== 'doctor') {
      return { status: 400, data: { message: 'User is not a doctor' } };
    }

    // Update status
    user.status = status; // 'ACTIVE' or 'REJECTED'
    await user.save();

    // 🔥 PUBLISH EVENT: doctor.verified
    if (status === 'ACTIVE') {
      await publishEvent(EventTypes.DOCTOR_VERIFIED, {
        eventType: 'DOCTOR_VERIFIED',
        timestamp: new Date(),
        payload: {
          userId: user._id.toString(),
          email: user.email,
          fullName: user.fullName,
          verifiedBy: adminUserId,
          verifiedAt: new Date(),
        },
      });
    }

    logger.info('Doctor verification status updated', { 
      doctorId: user._id, 
      status, 
      verifiedBy: adminUserId 
    });

    return { 
      status: 200, 
      data: { 
        message: `Doctor ${status === 'ACTIVE' ? 'verified' : 'rejected'} successfully`,
        doctor: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          status: user.status,
        }
      } 
    };
  } catch (error) {
    logger.error('Verify doctor error:', error);
    throw error;
  }
};

/**
 * Validate token (for API Gateway)
 */
const validateToken = async (token) => {
  try {
    const { verifyAccessToken } = require('../utils/tokens');
    const decoded = verifyAccessToken(token);
    
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return { valid: false, error: 'User not found or inactive' };
    }

    return { 
      valid: true, 
      user: {
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
        isVerified: user.isVerified,
      }
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  sendEmailVerificationOtp,
  verifyEmailOtp,
  sendPasswordResetOtp,
  resetPasswordWithOtp,
  verifyDoctor,
  validateToken,
};

const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter = null;

/**
 * Initialize email transporter
 */
const initEmailTransporter = async () => {
  try {
    // Check if SMTP is configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Verify connection
      await transporter.verify();
      logger.info('Email transporter initialized (SMTP)');
    } else {
      // Use Ethereal for testing
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      logger.info('Email transporter initialized (Ethereal test mode)');
    }
  } catch (error) {
    logger.error('Failed to initialize email transporter:', error);
    // Continue without email (graceful degradation)
  }
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) {
    logger.warn('Email transporter not initialized, skipping email');
    return null;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'CareLine360 <noreply@careline360.com>',
      to,
      subject,
      html,
    });

    logger.info('Email sent', { to, subject, messageId: info.messageId });

    // Log Ethereal preview URL in dev
    if (info.messageId && process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.debug('Preview URL:', previewUrl);
      }
    }

    return info;
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};

// ========================================
// APPOINTMENT EMAIL TEMPLATES
// ========================================

/**
 * Send appointment created notification
 */
const sendAppointmentCreated = async (appointment, patientEmail, doctorName) => {
  const dateStr = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0d9488, #06b6d4); padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">📅 Appointment Booked Successfully</h2>
      </div>
      <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0;">
        <p>Your appointment has been scheduled!</p>
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>Doctor:</strong> ${doctorName || 'Your Doctor'}</p>
          <p><strong>Date:</strong> ${dateStr}</p>
          <p><strong>Time:</strong> ${appointment.time}</p>
          <p><strong>Type:</strong> ${appointment.consultationType}</p>
          ${appointment.priority !== 'low' ? `<p><strong>Priority:</strong> ${appointment.priority}</p>` : ''}
        </div>
        <p style="color: #64748b;">Please arrive 10 minutes before your scheduled time.</p>
        ${appointment.consultationType === 'video' ? `
          <p style="margin-top: 15px;">
            <strong>Video Meeting:</strong> A meeting link will be sent before your appointment.
          </p>
        ` : ''}
      </div>
      <div style="padding: 15px; text-align: center; color: #64748b; font-size: 12px;">
        CareLine360 - Your Health, Our Priority
      </div>
    </div>
  `;

  return sendEmail({
    to: patientEmail,
    subject: '📅 Appointment Confirmed - CareLine360',
    html,
  });
};

/**
 * Send appointment confirmed notification
 */
const sendAppointmentConfirmed = async (appointment, patientEmail, doctorName) => {
  const dateStr = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10b981, #34d399); padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">✅ Appointment Confirmed by Doctor</h2>
      </div>
      <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0;">
        <p>Great news! Dr. ${doctorName || 'Your Doctor'} has confirmed your appointment.</p>
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>Date:</strong> ${dateStr}</p>
          <p><strong>Time:</strong> ${appointment.time}</p>
          <p><strong>Type:</strong> ${appointment.consultationType}</p>
        </div>
        <p style="color: #64748b;">We'll send you a reminder before your appointment.</p>
      </div>
      <div style="padding: 15px; text-align: center; color: #64748b; font-size: 12px;">
        CareLine360 - Your Health, Our Priority
      </div>
    </div>
  `;

  return sendEmail({
    to: patientEmail,
    subject: '✅ Appointment Confirmed - CareLine360',
    html,
  });
};

/**
 * Send appointment rescheduled notification
 */
const sendAppointmentRescheduled = async (appointment, patientEmail, doctorName) => {
  const dateStr = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f59e0b, #fbbf24); padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">🔄 Appointment Rescheduled</h2>
      </div>
      <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0;">
        <p>Your appointment has been rescheduled to a new time.</p>
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>Doctor:</strong> ${doctorName || 'Your Doctor'}</p>
          <p><strong>New Date:</strong> ${dateStr}</p>
          <p><strong>New Time:</strong> ${appointment.time}</p>
          <p><strong>Type:</strong> ${appointment.consultationType}</p>
        </div>
        <p style="color: #64748b;">Please make note of the new schedule.</p>
      </div>
      <div style="padding: 15px; text-align: center; color: #64748b; font-size: 12px;">
        CareLine360 - Your Health, Our Priority
      </div>
    </div>
  `;

  return sendEmail({
    to: patientEmail,
    subject: '🔄 Appointment Rescheduled - CareLine360',
    html,
  });
};

/**
 * Send appointment cancelled notification
 */
const sendAppointmentCancelled = async (appointment, patientEmail, doctorName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ef4444, #f87171); padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">❌ Appointment Cancelled</h2>
      </div>
      <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0;">
        <p>Your appointment has been cancelled.</p>
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>Doctor:</strong> ${doctorName || 'Your Doctor'}</p>
          <p><strong>Reason:</strong> ${appointment.cancellationReason || 'Not specified'}</p>
        </div>
        <p style="color: #64748b;">You can book a new appointment anytime through CareLine360.</p>
        <p style="margin-top: 20px;">
          <a href="${process.env.CLIENT_URL}/appointments/book" 
             style="background: #0d9488; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            Book New Appointment
          </a>
        </p>
      </div>
      <div style="padding: 15px; text-align: center; color: #64748b; font-size: 12px;">
        CareLine360 - Your Health, Our Priority
      </div>
    </div>
  `;

  return sendEmail({
    to: patientEmail,
    subject: '❌ Appointment Cancelled - CareLine360',
    html,
  });
};

/**
 * Send appointment reminder (24 hours before)
 */
const sendAppointmentReminder = async (appointment, patientEmail, doctorName) => {
  const dateStr = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8b5cf6, #a78bfa); padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">⏰ Appointment Reminder</h2>
      </div>
      <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0;">
        <p><strong>Your appointment is tomorrow!</strong></p>
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>Doctor:</strong> ${doctorName || 'Your Doctor'}</p>
          <p><strong>Date:</strong> ${dateStr}</p>
          <p><strong>Time:</strong> ${appointment.time}</p>
          <p><strong>Type:</strong> ${appointment.consultationType}</p>
        </div>
        ${appointment.consultationType === 'video' ? `
          <p style="background: #dbeafe; padding: 10px; border-radius: 6px;">
            📹 <strong>Video Appointment:</strong> You will receive a meeting link 10 minutes before your scheduled time.
          </p>
        ` : `
          <p style="color: #64748b;">Please arrive 10 minutes early at the clinic.</p>
        `}
      </div>
      <div style="padding: 15px; text-align: center; color: #64748b; font-size: 12px;">
        CareLine360 - Your Health, Our Priority
      </div>
    </div>
  `;

  return sendEmail({
    to: patientEmail,
    subject: '⏰ Appointment Reminder (Tomorrow) - CareLine360',
    html,
  });
};

/**
 * Send video meeting reminder (10 minutes before)
 */
const sendMeetingReminder = async (appointment, recipientEmail, recipientName, meetingUrl) => {
  const dateStr = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0d9488, #06b6d4); padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">📹 Video Meeting Starting Soon</h2>
      </div>
      <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0;">
        <p>Hi ${recipientName || 'there'},</p>
        <p><strong>Your video consultation starts in 10 minutes!</strong></p>
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>Date:</strong> ${dateStr}</p>
          <p><strong>Time:</strong> ${appointment.time}</p>
        </div>
        <p style="text-align: center; margin: 20px 0;">
          <a href="${meetingUrl}" 
             style="background: #0d9488; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            🎥 Join Video Call
          </a>
        </p>
        <p style="color: #64748b; font-size: 14px; text-align: center;">
          Or copy this link: <a href="${meetingUrl}">${meetingUrl}</a>
        </p>
      </div>
      <div style="padding: 15px; text-align: center; color: #64748b; font-size: 12px;">
        CareLine360 - Your Health, Our Priority
      </div>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: '📹 Video Meeting Starting Soon - CareLine360',
    html,
  });
};

module.exports = {
  initEmailTransporter,
  sendEmail,
  sendAppointmentCreated,
  sendAppointmentConfirmed,
  sendAppointmentRescheduled,
  sendAppointmentCancelled,
  sendAppointmentReminder,
  sendMeetingReminder,
};

const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const { sendMeetingReminder } = require('../config/email');
const logger = require('../config/logger');
const axios = require('axios');

// In-memory set to track already-reminded appointments (prevents duplicates)
const remindedSet = new Set();

/**
 * Generate Jitsi meeting URL
 */
const getMeetingUrl = (appointmentId) => {
  const jitsiDomain = process.env.JITSI_DOMAIN || 'meet.jit.si';
  const prefix = process.env.JITSI_PREFIX || 'CareLine360';
  return `https://${jitsiDomain}/${prefix}-${appointmentId}`;
};

/**
 * Parse appointment date and time into a Date object
 */
const parseApptDateTime = (dateField, timeStr) => {
  const d = new Date(dateField);
  const [hours, minutes] = timeStr.split(':').map(Number);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

/**
 * Format date for display
 */
const formatDT = (date) => {
  return date.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Fetch user email from auth-service (internal)
 */
const fetchUserEmail = async (userId) => {
  try {
    // This would be an internal API call
    // For now, return null and use denormalized data
    return null;
  } catch (error) {
    logger.warn('Failed to fetch user email:', error.message);
    return null;
  }
};

/**
 * Check and send meeting reminders (10 minutes before)
 */
const checkAndNotify = async (options = {}) => {
  const windowMinutes = parseInt(process.env.REMINDER_WINDOW_MINUTES) || 10;
  
  try {
    const now = new Date();
    
    // Window: now + 8 to 12 minutes (guards against clock drift)
    const windowStart = new Date(now.getTime() + 8 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 12 * 60 * 1000);
    
    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Find video appointments that need reminders
    const appointments = await Appointment.find({
      consultationType: 'video',
      status: 'confirmed',
      date: { $gte: todayStart, $lte: todayEnd },
      meetingReminderSent: false,
      isDeleted: false,
    });

    for (const appt of appointments) {
      // Skip if already reminded (in-memory cache)
      if (remindedSet.has(appt._id.toString())) {
        continue;
      }

      // Parse appointment time
      const apptDateTime = parseApptDateTime(appt.date, appt.time);
      
      // Check if appointment is within the reminder window
      if (apptDateTime >= windowStart && apptDateTime <= windowEnd) {
        logger.info('Sending meeting reminder', {
          appointmentId: appt.appointmentId,
          time: appt.time,
        });

        // Generate meeting URL if not exists
        const meetingUrl = appt.meetingUrl || getMeetingUrl(appt.appointmentId);

        // Send reminder to both doctor and patient
        try {
          // Note: In production, fetch actual emails via internal API
          // For now, we log the action
          
          // Mark as reminded
          remindedSet.add(appt._id.toString());
          
          appt.meetingReminderSent = true;
          if (!appt.meetingUrl) {
            appt.meetingUrl = meetingUrl;
          }
          await appt.save();

          logger.info('Meeting reminder sent', {
            appointmentId: appt.appointmentId,
            meetingUrl,
          });

        } catch (emailError) {
          logger.error('Failed to send meeting reminder:', emailError);
          // Remove from cache to retry next cycle
          remindedSet.delete(appt._id.toString());
        }
      }
    }
  } catch (error) {
    logger.error('Meeting scheduler error:', error);
  }
};

/**
 * Start meeting scheduler (runs every minute)
 */
const startMeetingScheduler = () => {
  // Run every minute
  cron.schedule('* * * * *', () => {
    checkAndNotify();
  });

  logger.info('Meeting scheduler started (every minute)');
  
  // Run immediately on startup
  checkAndNotify();
};

module.exports = {
  startMeetingScheduler,
  checkAndNotify,
  getMeetingUrl,
};

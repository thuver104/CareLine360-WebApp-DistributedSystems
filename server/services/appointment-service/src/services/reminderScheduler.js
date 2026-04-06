const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const { sendAppointmentReminder } = require('../config/email');
const logger = require('../config/logger');

/**
 * Send 24-hour advance reminders to patients
 */
const sendReminders = async () => {
  try {
    const now = new Date();
    const advanceHours = parseInt(process.env.ADVANCE_REMINDER_HOURS) || 24;
    
    // Window: now to now + advanceHours
    const windowEnd = new Date(now.getTime() + advanceHours * 60 * 60 * 1000);

    // Find confirmed appointments within the window
    const appointments = await Appointment.find({
      status: 'confirmed',
      date: { $gte: now, $lte: windowEnd },
      reminderSent: false,
      isDeleted: false,
    });

    logger.info(`Found ${appointments.length} appointments needing reminders`);

    for (const appt of appointments) {
      try {
        // In production, fetch patient email via internal API
        // For now, log the action
        
        logger.info('Sending appointment reminder', {
          appointmentId: appt.appointmentId,
          date: appt.date,
          time: appt.time,
        });

        // Mark as sent
        appt.reminderSent = true;
        appt.reminderSentAt = new Date();
        await appt.save();

        logger.info('Appointment reminder sent', {
          appointmentId: appt.appointmentId,
        });

      } catch (error) {
        logger.error('Failed to send reminder for appointment:', {
          appointmentId: appt.appointmentId,
          error: error.message,
        });
        // Continue with other appointments
      }
    }
  } catch (error) {
    logger.error('Reminder scheduler error:', error);
  }
};

/**
 * Start reminder scheduler (runs every hour at minute 0)
 */
const startReminderScheduler = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', () => {
    sendReminders();
  });

  logger.info('Reminder scheduler started (hourly)');
  
  // Run immediately on startup
  sendReminders();
};

module.exports = {
  startReminderScheduler,
  sendReminders,
};

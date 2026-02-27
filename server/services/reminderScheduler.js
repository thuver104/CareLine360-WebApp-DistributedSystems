const cron = require("node-cron");
const Appointment = require("../models/Appointment");
const emailService = require("./emailService");

const sendReminders = async () => {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    const appointments = await Appointment.find({
      status: "confirmed",
      reminderSent: false,
      date: { $gte: now, $lte: in24Hours },
    }).populate("patient doctor");

    for (const appointment of appointments) {
      try {
        await emailService.sendAppointmentReminder(
          appointment,
          appointment.patient,
          appointment.doctor
        );
        appointment.reminderSent = true;
        await appointment.save();
        console.log(`Reminder sent for appointment ${appointment._id}`);
      } catch (err) {
        console.error(`Failed to send reminder for ${appointment._id}:`, err.message);
      }
    }

    if (appointments.length > 0) {
      console.log(`Sent ${appointments.length} appointment reminder(s)`);
    }
  } catch (err) {
    console.error("Reminder scheduler error:", err.message);
  }
};

const startReminderScheduler = () => {
  // Run every hour at minute 0
  cron.schedule("0 * * * *", sendReminders);
  console.log("Appointment reminder scheduler started (runs every hour)");
};

module.exports = { startReminderScheduler, sendReminders };

/**
 * meetingScheduler.js
 * Runs every minute and sends the doctor an email reminder
 * 10 minutes before any confirmed video-call appointment.
 *
 * Reminders that have already been sent are cached in memory so they
 * are not repeated during the same server session.
 */

const cron = require("node-cron");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const { sendEmail } = require("./emailService");

// In-memory set tracks which appointment IDs have already received a reminder
const remindedSet = new Set();

/**
 * Generate the Jitsi meeting URL for a given appointment ID.
 * The same URL is used by both doctor and patient.
 */
const getMeetingUrl = (appointmentId) =>
  `https://meet.jit.si/CareLine360-${appointmentId}`;

/**
 * Format a Date object → "HH:MM AM/PM, DD Mon YYYY"
 */
const formatDT = (date) =>
  date.toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/**
 * Parse appointment date (Date) + time string ("HH:MM") into a JS Date.
 */
const parseApptDateTime = (dateField, timeStr) => {
  const d = new Date(dateField);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm, 0, 0);
};

const checkAndNotify = async ({ verbose = false } = {}) => {
  try {
    const now = new Date();

    // Window: appointments whose start time is between now+8min and now+12min
    // (wider than 9-11 to guard against clock drift / cron jitter)
    const windowStart = new Date(now.getTime() + 8 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 12 * 60 * 1000);

    // Fetch today's confirmed video appointments for all doctors
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      consultationType: "video",
      status: { $in: ["confirmed", "pending"] },
      date: { $gte: todayStart, $lte: todayEnd },
    })
      .populate("doctor", "email")
      .populate("patient", "email fullName");

    if (verbose || appointments.length > 0) {
      console.log(
        `[MeetingScheduler] Found ${appointments.length} video appointment(s) today. Window: ${windowStart.toISOString()} → ${windowEnd.toISOString()}`,
      );
    }

    for (const appt of appointments) {
      // Skip already-reminded ones
      if (remindedSet.has(appt._id.toString())) {
        if (verbose)
          console.log(
            `[MeetingScheduler] Skipping ${appt._id} – already reminded`,
          );
        continue;
      }

      const apptDT = parseApptDateTime(appt.date, appt.time);
      if (verbose) {
        console.log(
          `[MeetingScheduler] Appt ${appt._id}: scheduled at ${apptDT.toISOString()}, window check: ${apptDT >= windowStart && apptDT <= windowEnd}`,
        );
      }

      // Check if this appointment falls in our 8-12 minute window
      if (apptDT < windowStart || apptDT > windowEnd) continue;

      // Mark as reminded immediately to avoid double-sending
      remindedSet.add(appt._id.toString());

      // Resolve doctor details
      const doctorUser = appt.doctor; // populated User doc (has .email)
      const doctorProfile = await Doctor.findOne({ userId: doctorUser._id });
      const doctorName =
        doctorProfile?.fullName || doctorUser?.email || "Doctor";
      const doctorEmail = doctorUser?.email;

      const patientProfile = await Patient.findOne({
        userId: appt.patient?._id,
      });
      const patientName =
        patientProfile?.fullName || appt.patient?.email || "Your patient";

      if (verbose) {
        console.log(
          `[MeetingScheduler] Sending to Dr. ${doctorName} <${doctorEmail}>, patient: ${patientName}`,
        );
      }
      const meetingUrl = getMeetingUrl(appt._id.toString());
      const apptTimeLabel = appt.time;

      if (!doctorEmail) continue;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8"/>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 0; }
            .wrapper { max-width: 600px; margin: 36px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #0d9488, #06b6d4); padding: 36px 32px 24px; color: white; }
            .header h1 { margin: 0 0 4px; font-size: 22px; font-weight: 700; }
            .header p { margin: 0; opacity: 0.85; font-size: 14px; }
            .body { padding: 32px; }
            .badge { display: inline-block; background: #fef3c7; color: #92400e; border-radius: 8px; padding: 4px 12px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
            .info-box { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 18px 20px; margin: 20px 0; }
            .info-row { display: flex; gap: 8px; margin-bottom: 8px; font-size: 14px; color: #374151; }
            .info-row:last-child { margin-bottom: 0; }
            .label { font-weight: 600; color: #0d9488; min-width: 90px; }
            .join-btn { display: inline-block; margin-top: 24px; padding: 14px 32px; background: linear-gradient(135deg, #0d9488, #06b6d4); color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; }
            .footer { padding: 20px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <h1>⏰ Meeting Reminder</h1>
              <p>CareLine360 Doctor Portal</p>
            </div>
            <div class="body">
              <div class="badge">⚡ Starts in ~10 minutes</div>
              <p style="font-size:15px;color:#111827;">Hello, <strong>Dr. ${doctorName}</strong></p>
              <p style="font-size:14px;color:#4b5563;">You have a video call appointment coming up very soon. Please be ready to join on time.</p>
              <div class="info-box">
                <div class="info-row"><span class="label">Patient</span><span>${patientName}</span></div>
                <div class="info-row"><span class="label">Date</span><span>${new Date(appt.date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span></div>
                <div class="info-row"><span class="label">Time</span><span>${apptTimeLabel}</span></div>
                <div class="info-row"><span class="label">Type</span><span>Video Call</span></div>
              </div>
              <p style="font-size:13px;color:#6b7280;">Click the button below to join from the app (you can only join within 10 minutes of the scheduled time):</p>
              <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/doctor/dashboard" class="join-btn">Open CareLine360 → Meetings</a>
              <p style="margin-top:16px;font-size:12px;color:#9ca3af;">Direct Jitsi link: <a href="${meetingUrl}" style="color:#0d9488;">${meetingUrl}</a></p>
            </div>
            <div class="footer">CareLine360 · Automated Reminder · Do not reply to this email</div>
          </div>
        </body>
        </html>
      `;

      try {
        await sendEmail({
          to: doctorEmail,
          subject: `⏰ Video Appointment Reminder – ${patientName} at ${apptTimeLabel}`,
          html,
        });
        console.log(
          `[MeetingScheduler] Reminder sent → Dr. ${doctorName} <${doctorEmail}> for appt ${appt._id}`,
        );
      } catch (emailErr) {
        console.error(
          `[MeetingScheduler] Failed to send email for appt ${appt._id}:`,
          emailErr.message,
        );
        // Remove from set so it retries on next tick
        remindedSet.delete(appt._id.toString());
      }
    }
  } catch (err) {
    console.error("[MeetingScheduler] Error during check:", err.message);
  }
};

/**
 * Start the scheduler. Call this once after the DB is connected.
 * Runs every minute: "* * * * *"
 */
const startMeetingScheduler = () => {
  cron.schedule("* * * * *", checkAndNotify);
  console.log(
    "[MeetingScheduler] Started – checking every minute for upcoming video appointments",
  );
};

module.exports = { startMeetingScheduler, getMeetingUrl, checkAndNotify };

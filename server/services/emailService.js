const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("Ethereal email account created:", testAccount.user);
  }

  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: '"CareLine360" <noreply@careline360.com>',
      to,
      subject,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("Email preview URL:", previewUrl);
    }

    return info;
  } catch (error) {
    console.error("Email send error:", error.message);
  }
};

const sendAppointmentCreated = async (appointment, patient, doctor) => {
  await sendEmail({
    to: patient.email,
    subject: "Appointment Booked - CareLine360",
    html: `
      <h2>Appointment Confirmed</h2>
      <p>Dear ${patient.name},</p>
      <p>Your appointment has been booked successfully.</p>
      <ul>
        <li><strong>Doctor:</strong> ${doctor.name}</li>
        <li><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${appointment.time}</li>
        <li><strong>Type:</strong> ${appointment.consultationType}</li>
        <li><strong>Priority:</strong> ${appointment.priority}</li>
      </ul>
      <p>Thank you for using CareLine360!</p>
    `,
  });
};

const sendAppointmentConfirmed = async (appointment, patient, doctor) => {
  await sendEmail({
    to: patient.email,
    subject: "Appointment Confirmed by Doctor - CareLine360",
    html: `
      <h2>Appointment Confirmed</h2>
      <p>Dear ${patient.name},</p>
      <p>Your appointment with ${doctor.name} has been confirmed.</p>
      <ul>
        <li><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${appointment.time}</li>
      </ul>
    `,
  });
};

const sendAppointmentRescheduled = async (appointment, patient, doctor) => {
  await sendEmail({
    to: patient.email,
    subject: "Appointment Rescheduled - CareLine360",
    html: `
      <h2>Appointment Rescheduled</h2>
      <p>Dear ${patient.name},</p>
      <p>Your appointment with ${doctor.name} has been rescheduled.</p>
      <ul>
        <li><strong>New Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</li>
        <li><strong>New Time:</strong> ${appointment.time}</li>
      </ul>
    `,
  });
};

const sendAppointmentCancelled = async (appointment, patient, doctor) => {
  await sendEmail({
    to: patient.email,
    subject: "Appointment Cancelled - CareLine360",
    html: `
      <h2>Appointment Cancelled</h2>
      <p>Dear ${patient.name},</p>
      <p>Your appointment with ${doctor.name} has been cancelled.</p>
      <p><strong>Reason:</strong> ${appointment.cancellationReason}</p>
    `,
  });
};

const sendAppointmentReminder = async (appointment, patient, doctor) => {
  await sendEmail({
    to: patient.email,
    subject: "Appointment Reminder - CareLine360",
    html: `
      <h2>Appointment Reminder</h2>
      <p>Dear ${patient.name},</p>
      <p>This is a reminder that you have an upcoming appointment.</p>
      <ul>
        <li><strong>Doctor:</strong> ${doctor.name}</li>
        <li><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${appointment.time}</li>
        <li><strong>Type:</strong> ${appointment.consultationType}</li>
      </ul>
      <p>Please make sure to be available on time. Thank you for using CareLine360!</p>
    `,
  });
};

module.exports = {
  sendEmail,
  sendAppointmentCreated,
  sendAppointmentConfirmed,
  sendAppointmentRescheduled,
  sendAppointmentCancelled,
  sendAppointmentReminder,
};

const https = require("https");
const querystring = require("querystring");

/**
 * Send an SMS via SMSLenz API
 * https://smslenz.lk/api/send-sms
 *
 * Required ENV vars:
 *   SMSLENZ_USER_ID   – User ID from your SMSLenz settings page
 *   SMSLENZ_API_KEY   – API key from your SMSLenz settings page
 *   SMSLENZ_SENDER_ID – Your approved Sender ID (use "SMSlenzDEMO" for testing, case-sensitive)
 */
const sendSMS = async ({ to, message }) => {
  const userId = process.env.SMSLENZ_USER_ID;
  const apiKey = process.env.SMSLENZ_API_KEY;
  const senderId = process.env.SMSLENZ_SENDER_ID || "SMSlenzDEMO";

  if (!userId || !apiKey) {
    console.error(
      "SMSLENZ_USER_ID or SMSLENZ_API_KEY not configured – SMS not sent",
    );
    return { success: false, error: "SMS not configured" };
  }

  if (!to) {
    console.error("No phone number provided – SMS not sent");
    return { success: false, error: "No phone number" };
  }

  // Normalize Sri Lankan numbers: ensure +94 prefix
  let phone = to.replace(/\s+/g, "");
  if (phone.startsWith("0")) {
    phone = "+94" + phone.slice(1);
  } else if (phone.startsWith("94") && !phone.startsWith("+")) {
    phone = "+" + phone;
  } else if (!phone.startsWith("+")) {
    phone = "+94" + phone;
  }

  // Truncate message to 1500 chars (SMSLenz limit)
  const smsMessage = message.slice(0, 1500);

  const payload = JSON.stringify({
    user_id: userId,
    api_key: apiKey,
    sender_id: senderId,
    contact: phone,
    message: smsMessage,
  });

  return new Promise((resolve) => {
    const options = {
      hostname: "smslenz.lk",
      path: "/api/send-sms",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const body = JSON.parse(data);
          if (body.success) {
            console.log(
              `SMS sent to ${phone} | campaign: ${body.data?.campaign_id} | balance: ${body.data?.sms_credit_balance}`,
            );
            resolve({ success: true, data: body.data });
          } else {
            console.error(`SMSLenz error:`, body.message || data);
            resolve({ success: false, error: body.message || data });
          }
        } catch {
          console.error("SMSLenz parse error:", data);
          resolve({ success: false, error: data });
        }
      });
    });

    req.on("error", (err) => {
      console.error("SMSLenz request error:", err.message);
      resolve({ success: false, error: err.message });
    });

    req.write(payload);
    req.end();
  });
};

/**
 * Send bulk SMS to multiple contacts
 * https://smslenz.lk/api/send-bulk-sms
 */
const sendBulkSMS = async ({ contacts, message }) => {
  const userId = process.env.SMSLENZ_USER_ID;
  const apiKey = process.env.SMSLENZ_API_KEY;
  const senderId = process.env.SMSLENZ_SENDER_ID || "SMSlenzDEMO";

  if (!userId || !apiKey) {
    console.error("SMSLENZ_USER_ID or SMSLENZ_API_KEY not configured");
    return { success: false, error: "SMS not configured" };
  }

  if (!contacts?.length) {
    return { success: false, error: "No contacts provided" };
  }

  // Normalize all numbers
  const normalized = contacts.map((n) => {
    let phone = n.replace(/\s+/g, "");
    if (phone.startsWith("0")) phone = "+94" + phone.slice(1);
    else if (phone.startsWith("94") && !phone.startsWith("+"))
      phone = "+" + phone;
    else if (!phone.startsWith("+")) phone = "+94" + phone;
    return phone;
  });

  const payload = JSON.stringify({
    user_id: userId,
    api_key: apiKey,
    sender_id: senderId,
    contacts: normalized,
    message: message.slice(0, 1500),
  });

  return new Promise((resolve) => {
    const options = {
      hostname: "smslenz.lk",
      path: "/api/send-bulk-sms",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const body = JSON.parse(data);
          if (body.success) {
            console.log(
              `Bulk SMS sent to ${normalized.length} contacts | balance: ${body.data?.sms_credit_balance}`,
            );
            resolve({ success: true, data: body.data });
          } else {
            console.error("SMSLenz bulk error:", body.message || data);
            resolve({ success: false, error: body.message || data });
          }
        } catch {
          resolve({ success: false, error: data });
        }
      });
    });

    req.on("error", (err) => resolve({ success: false, error: err.message }));
    req.write(payload);
    req.end();
  });
};

/**
 * Check SMSLenz account status & credit balance
 * https://smslenz.lk/api/account-status
 */
const getAccountStatus = async () => {
  const userId = process.env.SMSLENZ_USER_ID;
  const apiKey = process.env.SMSLENZ_API_KEY;

  if (!userId || !apiKey) {
    return { success: false, error: "SMS not configured" };
  }

  const qs = querystring.stringify({ user_id: userId, api_key: apiKey });

  return new Promise((resolve) => {
    const options = {
      hostname: "smslenz.lk",
      path: `/api/account-status?${qs}`,
      method: "GET",
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const body = JSON.parse(data);
          resolve(
            body.success
              ? { success: true, data: body.data }
              : { success: false, error: body.message },
          );
        } catch {
          resolve({ success: false, error: data });
        }
      });
    });

    req.on("error", (err) => resolve({ success: false, error: err.message }));
    req.end();
  });
};

module.exports = { sendSMS, sendBulkSMS, getAccountStatus };

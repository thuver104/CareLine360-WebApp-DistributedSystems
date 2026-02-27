const axios = require("axios");

const sendSMS = async ({ contact, message }) => {
    try {
        const userId = process.env.SMSLENZ_USER_ID;
        const apiKey = process.env.SMSLENZ_API_KEY;
        const senderId = process.env.SMSLENZ_SENDER_ID || "SMSlenzDEMO";

        if (!userId || !apiKey) {
            console.warn("SMSlenz configuration missing. Skipping SMS.");
            return;
        }

        // Format number to +94... if it starts with 0
        let formattedContact = contact;
        if (contact.startsWith("0")) {
            formattedContact = "+94" + contact.substring(1);
        } else if (!contact.startsWith("+")) {
            formattedContact = "+" + contact;
        }

        const response = await axios.post("https://smslenz.lk/api/send-sms", {
            user_id: userId,
            api_key: apiKey,
            sender_id: senderId,
            contact: formattedContact,
            message: message
        });

        console.log(`SMS sent to ${formattedContact}:`, response.data);
        return response.data;
    } catch (error) {
        console.error("SMSlenz API Error:", error.response?.data || error.message);
    }
};

module.exports = { sendSMS };

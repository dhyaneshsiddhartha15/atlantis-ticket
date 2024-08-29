const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const CryptoJS = require("crypto-js");

async function generatePaymentRequest(paymentData) {
  try {
    const environmentUrl = process.env.SKIPCASH_ENVIRONMENT.startsWith('https://')
      ? process.env.SKIPCASH_ENVIRONMENT
      : `https://${process.env.SKIPCASH_ENVIRONMENT}`;
    const url = `${environmentUrl}/api/v1/payments`;

    // Ensure Uid is a UUID if not provided
    if (!paymentData.Uid) {
      paymentData.Uid = uuidv4();
    }

    // Ensure all required fields are present
    const requiredFields = [
      'Uid', 'KeyId', 'Amount', 'FirstName', 'LastName', 'Phone', 'Email',
      'Street', 'City', 'State', 'Country', 'PostalCode', 'TransactionId', 'Custom1'
    ];
    
    requiredFields.forEach(field => {
      if (!paymentData[field]) {
        paymentData[field] = '';
      }
    });

    console.log("Payment Data:", JSON.stringify(paymentData, null, 2));

    const authorizationHeader = generateAuthorizationHeader(paymentData);
    console.log("Authorization Header:", authorizationHeader);

    const response = await axios.post(url, paymentData, {
      headers: {
        Authorization: authorizationHeader,
        "Content-Type": "application/json",
      },
    });

    console.log("Skip Cash Adding Payment", response.data);
    return response.data;
  } catch (error) {
    console.error("Error in generating payment request:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    }
    throw new Error("Failed to generate payment request.");
  }
}

function generateAuthorizationHeader(paymentData) {
  if (!process.env.SKIPCASH_SECRET_KEY) {
    throw new Error("SKIPCASH_SECRET_KEY is not defined in environment variables.");
  }

  const combinedData = [
    `Uid=${paymentData.Uid}`,
    `KeyId=${paymentData.KeyId}`,
    `Amount=${paymentData.Amount}`,
    `FirstName=${paymentData.FirstName}`,
    `TransactionId=${paymentData.TransactionId}`,
    `Custom1=${paymentData.Custom1}`
  ].join(',');

  console.log("Combined Data:", combinedData);

  const hash = CryptoJS.HmacSHA256(combinedData, process.env.SKIPCASH_SECRET_KEY);
  const hashInBase64 = CryptoJS.enc.Base64.stringify(hash);

  console.log("Generated Hash:", hashInBase64);

  return hashInBase64; 
}

module.exports = generatePaymentRequest;
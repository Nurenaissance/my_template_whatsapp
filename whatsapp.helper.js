const got = require("got");

/**
 * RESUMABLE UPLOAD - CREATE SESSION
 * https://developers.facebook.com/docs/graph-api/guides/upload#step-1--create-a-session
 */
exports.RUCreateSession = async (body) => {
    try {
        const response = await got.post(
            `${process.env.META_API_URI}/${process.env.META_APP_ID}/uploads`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
                    Accept: "*/*",
                },
                json: body,
                responseType: "json",
                throwHttpErrors: false,
            }
        );
        return response.body; // Returning JSON directly
    } catch (error) {
        console.error("Error in RUCreateSession:", error);
        throw error;
    }
};

/**
 * RESUMABLE UPLOAD - INITIATE UPLOAD
 * https://developers.facebook.com/docs/graph-api/guides/upload#step-2--initiate-upload
 */
exports.RUInitiateUpload = async (uploadSessionId, fileBuffer) => {
    try {
        const response = await got.post(
            `${process.env.META_API_URI}/${uploadSessionId}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
                    Accept: "*/*",
                },
                json: {
                    file_offset: 0 // Required for resumable uploads
                },
                body: fileBuffer,
                responseType: "json",
                throwHttpErrors: false,
            }
        );
        return response.body;
    } catch (error) {
        console.error("Error in RUInitiateUpload:", error);
        throw error;
    }
};

/**
 * CREATE TEMPLATE
 * https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates
 */
exports.createWABANOTemplates = async (body) => {
    try {
        const response = await got.post(
            `${process.env.META_API_URI}/${process.env.META_BUSINESS_ACC_ID}/message_templates`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
                    Accept: "*/*",
                },
                json: body,
                responseType: "json",
                throwHttpErrors: false,
            }
        );
        return response.body;
    } catch (error) {
        console.error("Error in createWABANOTemplates:", error);
        throw error;
    }
};

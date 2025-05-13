require('dotenv').config();

const config = {
    port: process.env.PORT || 3000,
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        modelName: process.env.GEMINI_MODEL_NAME || 'gemini-pro',
    },
};

if (!config.gemini.apiKey) {
    console.error('FATAL ERROR: GEMINI_API_KEY is not set.');
    process.exit(1); // Exit if critical config is missing
}

module.exports = config;

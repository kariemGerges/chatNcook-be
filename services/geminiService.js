// src/services/geminiService.js
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require('@google/generative-ai');
const config = require('../config');

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

// Optional: Configure safety settings if needed
// See https://ai.google.dev/docs/safety_setting_gemini
const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];

/**
 * Generates content using the configured Gemini model.
 * @param {string} prompt - The prompt to send to the AI.
 * @param {Array<Object>} [history] - Optional chat history. Each object should have 'role' ("user" or "model") and 'parts' (array of {text: "message"}).
 * @returns {Promise<string>} The generated text response.
 * @throws {Error} If the API call fails or returns no content.
 */
async function generateContent(prompt, history = []) {
    try {
        const model = genAI.getGenerativeModel({
            model: config.gemini.modelName,
            // safetySettings, // Uncomment if you defined safetySettings
            // generationConfig: { // Optional generation config
            //   temperature: 0.7,
            //   topK: 1,
            //   topP: 1,
            //   maxOutputTokens: 2048,
            // },
        });

        let chat;
        if (history && history.length > 0) {
            chat = model.startChat({ history });
        }

        const result =
            history && history.length > 0
                ? await chat.sendMessage(prompt)
                : await model.generateContent(prompt);

        const response = result.response;

        if (
            !response ||
            !response.candidates ||
            response.candidates.length === 0 ||
            !response.candidates[0].content
        ) {
            console.warn(
                'Gemini API returned an empty or unexpected response structure:',
                response
            );
            // Check for safety feedback if content is missing
            if (
                response &&
                response.promptFeedback &&
                response.promptFeedback.blockReason
            ) {
                throw new Error(
                    `Content generation blocked due to: ${
                        response.promptFeedback.blockReason
                    }. Details: ${response.promptFeedback.safetyRatings
                        .map((r) => `${r.category}: ${r.probability}`)
                        .join(', ')}`
                );
            }
            throw new Error('Gemini API returned no content.');
        }

        return response.candidates[0].content.parts
            .map((part) => part.text)
            .join('');
    } catch (error) {
        console.error('Error calling Gemini API:', error.message);
        // More specific error handling can be added here based on error types from the SDK
        if (error.message.includes('API key not valid')) {
            throw new Error(
                'Invalid Gemini API Key. Please check your configuration.'
            );
        }
        throw error; // Re-throw the error to be handled by the route
    }
}

/**
 * Generates content as a stream using the configured Gemini model.
 * Useful for long responses or chat-like interfaces.
 * @param {string} prompt - The prompt to send to the AI.
 * @param {Array<Object>} [history] - Optional chat history.
 * @returns {Promise<AsyncIterable<string>>} An async iterable yielding text chunks.
 * @throws {Error} If the API call fails.
 */
async function generateContentStream(prompt, history = []) {
    try {
        const model = genAI.getGenerativeModel({
            model: config.gemini.modelName,
            // safetySettings,
        });

        let chat;
        if (history && history.length > 0) {
            chat = model.startChat({ history });
        }

        const result =
            history && history.length > 0
                ? await chat.sendMessageStream(prompt)
                : await model.generateContentStream(prompt);

        // Transform the stream to yield only text parts
        async function* textStream() {
            for await (const chunk of result.stream) {
                if (
                    chunk.candidates &&
                    chunk.candidates.length > 0 &&
                    chunk.candidates[0].content
                ) {
                    yield chunk.candidates[0].content.parts
                        .map((part) => part.text)
                        .join('');
                } else if (
                    chunk.promptFeedback &&
                    chunk.promptFeedback.blockReason
                ) {
                    // Handle blocked content in stream
                    throw new Error(
                        `Content generation blocked in stream due to: ${chunk.promptFeedback.blockReason}.`
                    );
                }
            }
        }
        return textStream();
    } catch (error) {
        console.error('Error calling Gemini API (stream):', error.message);
        throw error;
    }
}

module.exports = {
    generateContent,
    generateContentStream,
};

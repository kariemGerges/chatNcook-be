// src/routes/aiRoutes.js
const express = require('express');
const geminiService = require('../services/geminiService');
const router = express.Router();

// POST /api/ai/generate
router.post('/generate', async (req, res) => {
    const { prompt, history } = req.body; // history is optional

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({
            error: 'Prompt is required and must be a non-empty string.',
        });
    }

    // Basic validation for history (if provided)
    if (history) {
        if (!Array.isArray(history)) {
            return res
                .status(400)
                .json({ error: 'History must be an array if provided.' });
        }
        for (const item of history) {
            if (
                typeof item !== 'object' ||
                !item.role ||
                !item.parts ||
                !Array.isArray(item.parts)
            ) {
                return res.status(400).json({
                    error: 'Invalid history item format. Expected {role: string, parts: [{text: string}]}',
                });
            }
            if (!['user', 'model'].includes(item.role)) {
                return res.status(400).json({
                    error: "History item role must be 'user' or 'model'.",
                });
            }
            if (item.parts.some((part) => typeof part.text !== 'string')) {
                return res.status(400).json({
                    error: "History item parts must contain objects with a 'text' string.",
                });
            }
        }
    }

    try {
        const responseText = await geminiService.generateContent(
            prompt,
            history
        );
        res.json({ response: responseText });
    } catch (error) {
        console.error('Error in /api/ai/generate route:', error);
        // Customize error messages based on the error type
        if (error.message.includes('API key not valid')) {
            res.status(500).json({
                error: 'AI service configuration error. Please contact support.',
            });
        } else if (error.message.includes('Content generation blocked')) {
            res.status(400).json({ error: error.message }); // Send specific block reason
        } else {
            res.status(500).json({
                error: 'Failed to generate content from AI service.',
            });
        }
    }
});

// POST /api/ai/generate-stream
router.post('/generate-stream', async (req, res) => {
    const { prompt, history } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({
            error: 'Prompt is required and must be a non-empty string.',
        });
    }
    // Basic history validation (can be more robust)
    if (history) {
        if (!Array.isArray(history)) {
            return res.status(400).json({ error: 'History must be an array.' });
        }
        for (const item of history) {
            if (
                typeof item !== 'object' ||
                !item.role ||
                !Array.isArray(item.parts) ||
                item.parts.some(
                    (part) => typeof part.text !== 'string' || !part.text.trim()
                )
            ) {
                return res.status(400).json({
                    error: "Invalid history format. Each item must be { role: 'user' | 'model', parts: [{ text: string }] }",
                });
            }
        }
    }

    try {
        res.setHeader('Content-Type', 'text/plain'); // Or 'application/json-stream' or 'text/event-stream'
        res.setHeader('Transfer-Encoding', 'chunked');

        const stream = await geminiService.generateContentStream(
            prompt,
            history
        );
        for await (const chunk of stream) {
            res.write(chunk); // Send each chunk as it arrives
        }
        res.end(); // End the response when the stream is finished
    } catch (error) {
        console.error('Error in /api/ai/generate-stream route:', error);
        // Important: If headers are already sent, you can't send a JSON error response.
        // You might have already started streaming. Log the error and close the connection.
        if (!res.headersSent) {
            if (error.message.includes('Content generation blocked')) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({
                    error: 'Failed to generate streaming content.',
                });
            }
        } else {
            console.error(
                'Headers already sent, could not send JSON error for streaming failure.'
            );
            res.end(); // Just end the response. The client might receive partial data.
        }
    }
});

module.exports = router;

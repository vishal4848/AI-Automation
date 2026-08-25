const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get('/', (req, res) => {
    res.send('AI Automation API Server is running');
});

// Mock AI Media Generation Endpoint
app.post('/api/ai/generate', async (req, res) => {
    const { prompt, type } = req.body;
    console.log(`Received request to generate ${type} for prompt: "${prompt}"`);

    // Simulated API delay
    setTimeout(() => {
        if (type === 'image') {
            res.json({
                success: true,
                mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop'
            });
        } else {
            res.json({
                success: true,
                mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
            });
        }
    }, 1500);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
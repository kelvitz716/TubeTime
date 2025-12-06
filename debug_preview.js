import client from './frontend/src/api/client.js';
import axios from 'axios';

// Mock client since we can't use the frontend one directly in node easily without polyfills
const api = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true // We need to handle auth if protected, but preview might be protected
});

// We need to login first to get a session? 
// The /videos/preview endpoint is protected by isAuthenticated middleware.
// So we need to login via axios first.

async function run() {
    try {
        // 1. Login
        console.log("Logging in...");
        await api.post('/auth/login', { username: 'testuser', password: 'test123' });
        console.log("Logged in.");

        // 2. Check the reported video
        const url = 'https://www.youtube.com/watch?v=Mg2n7xw0WUc';
        console.log(`Checking preview for: ${url}`);
        const res = await api.post('/videos/preview', { url });

        console.log("Preview Response Chapters:");
        console.log(JSON.stringify(res.data.chapters, null, 2));

        if (res.data.chapters.length > 0) {
            console.log("FAIL: Chapters found (likely fallback).");
        } else {
            console.log("SUCCESS: No chapters found.");
        }

    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
}

run();

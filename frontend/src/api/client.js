import axios from 'axios';

const client = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized (e.g., redirect to login)
            // For now, we just reject the promise and let the UI handle it
        }
        return Promise.reject(error);
    }
);

export default client;

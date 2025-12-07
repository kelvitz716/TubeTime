import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: true, // Bind to all interfaces
        port: 8080, // Match docker-compose port
        watch: {
            usePolling: true,
        },
        proxy: {
            '/api': {
                target: process.env.VITE_API_URL || 'http://localhost:3000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
            },
        },
    },
})

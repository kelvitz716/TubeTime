/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },
            colors: {
                primary: 'var(--color-primary)',
                'primary-dark': 'var(--color-primary-dark)',
                background: 'var(--color-background)',
                surface: 'var(--color-surface)',
                'surface-elevated': 'var(--color-surface-elevated)',
                'text-primary': 'var(--color-text-primary)',
                'text-secondary': 'var(--color-text-secondary)',
                success: 'var(--color-success)',
                watched: 'var(--color-watched)',
            },
            borderRadius: {
                DEFAULT: 'var(--border-radius)',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                popIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out forwards',
                'slide-up': 'slideUp 0.4s ease-out forwards',
                'pop-in': 'popIn 0.2s ease-out forwards',
            },
        },
    },
    plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                kkj: {
                    blue: '#0A2647',
                    gold: '#FFD700',
                    white: '#FFFFFF',
                    lightBlue: '#144272',
                    accent: '#2C74B3'
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
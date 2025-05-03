/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#ffeef0',
                    100: '#ffd9df',
                    200: '#ffb3c0',
                    300: '#ff8da0',
                    400: '#ff6780',
                    500: '#ff4060',
                    600: '#e41a3f', // Color rojo de La Hipotecaria
                    700: '#B71234', // Color rojo principal de La Hipotecaria
                    800: '#951029',
                    900: '#730c20',
                    950: '#4c0815',
                },
                secondary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                    950: '#082f49',
                },
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            },
        },
    },
    plugins: [require('@tailwindcss/forms')],
}
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
        // Используем CSS-переменные из tokens.css
        colors: {
            primary: {
            dark: 'var(--color-primary-dark)',
            DEFAULT: 'var(--color-primary-dark)',
            },
            secondary: {
            dark: 'var(--color-secondary-dark)',
            DEFAULT: 'var(--color-secondary-dark)',
            },
            accent: {
            gold: 'var(--color-accent-gold)',
            bronze: 'var(--color-accent-bronze)',
            DEFAULT: 'var(--color-accent-gold)',
            },
            text: {
            primary: 'var(--color-text-primary)',
            secondary: 'var(--color-text-secondary)',
            muted: 'var(--color-text-muted)',
            dark: 'var(--color-text-dark)',
            darker: 'var(--color-text-darker)',
            },
        },
        fontFamily: {
            primary: 'var(--font-primary)',
            display: 'var(--font-display)',
        },
        spacing: {
            'xs': 'var(--spacing-xs)',
            'sm': 'var(--spacing-sm)',
            'md': 'var(--spacing-md)',
            'lg': 'var(--spacing-lg)',
            'xl': 'var(--spacing-xl)',
            '2xl': 'var(--spacing-2xl)',
        },
        borderRadius: {
            'sm': 'var(--radius-sm)',
            'md': 'var(--radius-md)',
            'lg': 'var(--radius-lg)',
            'xl': 'var(--radius-xl)',
        },
        transitionDuration: {
            'fast': '200ms',
            'base': '300ms',
            'slow': '400ms',
        },
        },
    },
    plugins: [],
}

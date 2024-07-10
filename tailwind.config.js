const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./node_modules/flowbite/**/*.js",
        './_includes/**/*.html',
        './_layouts/**/*.html',
        './_drafts/**/*.md',
        './_posts/*.md',
        './*.md',
        './*.html',
        './about/*.html',
    ],
    darkMode: 'media',
    theme: {
        colors: {
            transparent: 'transparent',
            current: 'currentColor',
            brand: colors.teal,
            primary: colors.orange
        },
    },
    plugins: [require("flowbite-typography"), require("flowbite/plugin")],
};

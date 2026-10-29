const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./node_modules/flowbite/**/*.js",
        "./_includes/**/*.html",
        "./_layouts/**/*.html",
        "./_drafts/**/*.md",
        "./_posts/*.md",
        "./*.md",
        "./*.html",
        "./about/*.html",
    ],
    darkMode: "media",
    theme: {
        colors: {
            transparent: "transparent",
            current: "currentColor",
            primary: colors.orange,
        },
        extend: {
            typography: ({ theme }) => ({
                DEFAULT: {
                    css: {
                        '--tw-format-invert-body': theme('colors.gray[300]'),
                    },
                },
            }),
        },
    },
    plugins: [require("flowbite-typography"), require("flowbite/plugin")],
};

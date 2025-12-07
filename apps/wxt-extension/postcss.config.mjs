export default {
  plugins: {
    tailwindcss: {},
    "postcss-rem-to-pixel": {
      rootValue: 16, // 1rem = 16px
      propList: ["*"], // Convert rem in all properties
      selectorBlackList: [], // No exclusions
    },
    autoprefixer: {},
  },
};

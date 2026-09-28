import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { process: "readonly", console: "readonly", fetch: "readonly", AbortSignal: "readonly", URLSearchParams: "readonly", setTimeout: "readonly" }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "warn"
    }
  }
];

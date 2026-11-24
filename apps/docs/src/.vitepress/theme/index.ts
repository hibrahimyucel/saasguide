// .vitepress/theme/index.ts
import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import DynamicSnippets from "../components/DynamicSnippets.vue";
import "./custom.css"; // CSS dosyanızı burada içe aktarıyoruz

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("DynamicSnippet", DynamicSnippets);
  },
} satisfies Theme;

// .vitepress/theme/index.ts
import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import DynamicSnippets from "../components/DynamicSnippets.vue";
import { initAndGetSnippetVars } from "../components/dynamic-snippet-defaults.ts";
import "./custom.css"; // CSS dosyanızı burada içe aktarıyoruz

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("DynamicSnippet", DynamicSnippets);

    if (typeof window !== "undefined") {
      initAndGetSnippetVars();
    }
  },
} satisfies Theme;

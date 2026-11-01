// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import './custom.css' // CSS dosyanızı burada içe aktarıyoruz

export default {
  extends: DefaultTheme,
  // İleride özel Vue bileşenleri eklemek isterseniz burayı kullanabilirsiniz
  enhanceApp({ app }) {}
}


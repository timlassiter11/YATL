import { defineConfig } from 'vitepress'
import { version } from '../../package.json';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "YATL",
  description: "Yet Another Table Library",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' },
      { text: `v${version}`, link: 'https://github.com/timlassiter11/YATL/releases/latest'}
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/timlassiter11/YATL' }
    ]
  },
  vite: {
    server: {
      host: '127.0.0.1'
    }
  }
})

import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'llm-cache',
  description: 'Cache LLM responses with exact and semantic matching',
  base: '/llm-cache/',

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/quickstart' },
      { text: 'API', link: '/api' },
      { text: 'GitHub', link: 'https://github.com/yar-solodovnikov/llm-cache' },
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Quick Start', link: '/guide/quickstart' },
        ],
      },
      {
        text: 'Storage',
        items: [
          { text: 'Storage Backends', link: '/guide/storage' },
        ],
      },
      {
        text: 'Semantic Caching',
        items: [
          { text: 'Semantic Cache', link: '/guide/semantic' },
        ],
      },
      {
        text: 'Integrations',
        items: [
          { text: 'Express / Hono / NestJS', link: '/guide/integrations' },
          { text: 'CLI', link: '/guide/cli' },
        ],
      },
      { text: 'API Reference', link: '/api' },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yar-solodovnikov/llm-cache' },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Released under the MIT License.',
    },
  },
})

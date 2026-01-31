import DefaultTheme from 'vitepress/theme';

export default {
  ...DefaultTheme,
  async enhanceApp({ app }) {
    // ⚠️ CRITICAL: Only import the component on the client (browser).
    // Web Components will crash the Server-Side Rendering (SSR) build 
    // because 'window' and 'HTMLElement' don't exist in Node.js.
    if (!import.meta.env.SSR) {
      // Import directly from source for Hot Module Reloading (HMR)!
      await import('../../../src/yatl-table'); 
    }
  }
};
import { ContextRoot } from '@lit/context';

// See https://github.com/lit/lit/tree/main/packages/context#late-upgraded-context-providers
const root = new ContextRoot();
root.attach(document.documentElement);

export default root;

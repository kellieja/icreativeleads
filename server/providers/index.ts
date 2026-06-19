import type { Provider } from '../types';
import { demoProvider } from './demo';
import { dnbProvider } from './dnb';
import { apolloProvider } from './apollo';
import { exploriumProvider } from './explorium';

export const PROVIDERS: Provider[] = [demoProvider, exploriumProvider, apolloProvider, dnbProvider];

const BY_KEY = new Map(PROVIDERS.map((p) => [p.key, p]));

export function getProvider(key?: string): Provider {
  return BY_KEY.get(key ?? 'demo') ?? demoProvider;
}

/** Lightweight provider metadata for the UI (no secrets). */
export function providerMeta() {
  return PROVIDERS.map((p) => ({
    key: p.key,
    label: p.label,
    description: p.description,
    configured: p.isConfigured(),
    configHint: p.configHint,
  }));
}

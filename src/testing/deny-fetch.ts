import { afterEach } from "vitest";

export function installDenyFetch(): void {
  let denied: string[] = [];

  const deny = (input: URL | RequestInfo): Promise<Response> => {
    const url = input instanceof Request ? input.url : String(input);
    denied.push(url);
    return Promise.reject(new Error(`fetch denied in tests: stub the route for ${url}`));
  };

  globalThis.fetch = Object.assign(deny, { preconnect: () => {} });

  afterEach(() => {
    const urls = denied;
    denied = [];
    if (urls.length > 0) throw new Error(`unstubbed fetch: ${[...new Set(urls)].join(", ")}`);
  });
}

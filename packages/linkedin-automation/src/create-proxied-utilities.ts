import { detectDomVersion } from "./dom/detect";

export function createProxiedUtilities<T extends object>(v1: T, v2: T): T {
  // Intercept any method or property access
  const handler: ProxyHandler<T> = {
    get(_target, prop, receiver) {
      const version = detectDomVersion();
      const impl = version === "dom-v2" ? v2 : v1;
      const value = Reflect.get(impl, prop, receiver);

      // If it's a function, bind it so `this` is correct
      return typeof value === "function" ? value.bind(impl) : value;
    },
  };

  // Return a proxy that dynamically picks the implementation
  return new Proxy({} as T, handler);
}

const INSTALLED = Symbol.for("glasshome.happyDomFidelity");
const RECORDED = Symbol.for("glasshome.shadowRoots");

type Recorder = { [RECORDED]?: WeakMap<Element, ShadowRoot> };

function getterOf(proto: object, name: string): (event: Event) => unknown {
  const get: unknown = Reflect.getOwnPropertyDescriptor(proto, name)?.get;
  if (typeof get !== "function") throw new Error(`happy-dom's Event has no ${name} getter`);
  return (event) => Reflect.apply(get, event, []);
}

function rootsAround(target: unknown): ShadowRoot[] {
  const roots: ShadowRoot[] = [];
  for (
    let root = target instanceof Node ? target.getRootNode() : undefined;
    root instanceof ShadowRoot;
    root = root.host.getRootNode()
  ) {
    roots.push(root);
  }
  return roots;
}

function retarget(target: unknown, viewer: unknown): unknown {
  const viewerRoots = rootsAround(viewer);
  let node = target;
  while (node instanceof Node) {
    const root = node.getRootNode();
    if (!(root instanceof ShadowRoot) || viewerRoots.includes(root)) return node;
    node = root.host;
  }
  return node;
}

function hiddenFrom(node: unknown, viewer: unknown): boolean {
  const viewerRoots = rootsAround(viewer);
  return rootsAround(node).some((root) => root.mode === "closed" && !viewerRoots.includes(root));
}

function dispatchFlag(): (event: Event) => boolean {
  const symbol = Object.getOwnPropertySymbols(new Event("probe")).find(
    (key) => key.description === "dispatching",
  );
  if (!symbol) throw new Error("happy-dom's Event has no dispatching flag");
  return (event) => Reflect.get(event, symbol) === true;
}

function installEventRetargeting(): void {
  const proto = Event.prototype;
  const composedPath = Reflect.get(proto, "composedPath") as (this: Event) => EventTarget[];
  const rawTarget = getterOf(proto, "target");
  // Solid redefines `currentTarget` on the events it delegates; the listener's own is on the prototype.
  const rawCurrentTarget = getterOf(proto, "currentTarget");
  const dispatching = dispatchFlag();

  proto.composedPath = function (this: Event): EventTarget[] {
    if (!dispatching(this)) return [];
    const path = composedPath.call(this);
    const viewer = rawCurrentTarget(this);
    // happy-dom builds its dispatch path from this before the first listener runs.
    if (!viewer) return path;
    return path.filter((node) => !hiddenFrom(node, viewer));
  };

  Object.defineProperty(proto, "target", {
    configurable: true,
    get(this: Event) {
      const target = rawTarget(this);
      const viewer = rawCurrentTarget(this);
      if (viewer) return retarget(target, viewer);
      if (dispatching(this)) return target;
      if (!this.composed && rootsAround(target).length > 0) return null;
      return retarget(target, null);
    },
  });
}

function installShadowRecorder(): void {
  const recorded = new WeakMap<Element, ShadowRoot>();
  (Element.prototype as Recorder)[RECORDED] = recorded;
  const attach = Reflect.get(Element.prototype, "attachShadow") as (
    this: Element,
    init: ShadowRootInit,
  ) => ShadowRoot;
  Element.prototype.attachShadow = function (this: Element, init: ShadowRootInit) {
    const root = attach.call(this, init);
    recorded.set(this, root);
    return root;
  };
}

export function installHappyDomFidelity(): void {
  // A shared-module suite runs every file's setup against the same window.
  const marked = Event.prototype as { [INSTALLED]?: true };
  if (marked[INSTALLED]) return;
  marked[INSTALLED] = true;
  installEventRetargeting();
  installShadowRecorder();
}

export function shadowOf(host: Element | null | undefined): ShadowRoot | undefined {
  const recorded = (Element.prototype as Recorder)[RECORDED];
  if (!recorded) throw new Error("shadowOf needs installHappyDomFidelity() in the suite's setup");
  return host ? recorded.get(host) : undefined;
}

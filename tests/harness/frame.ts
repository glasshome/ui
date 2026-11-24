export const nextFrame = () => new Promise<void>((done) => requestAnimationFrame(() => done()));

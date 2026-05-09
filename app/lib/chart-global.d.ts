// Chart.js is loaded from CDN; declare its constructor on window
interface Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Chart: new (canvas: HTMLCanvasElement, config: Record<string, unknown>) => { destroy(): void };
}

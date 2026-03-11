import { type Component, type JSX, type ParentComponent, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const HOUSE_PATH =
  "M 50,15 L 38,25 Q 35,27 32,30 L 22,38 Q 20,40 20,43 L 20,85 Q 20,90 25,90 L 75,90 Q 80,90 80,85 L 80,43 Q 80,40 78,38 L 68,30 Q 65,27 62,25 L 50,15 Z";

const ElegantShape: Component<{
  class?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  blur?: number;
  colorVar?: string;
  opacityStart?: number;
  opacityEnd?: number;
  strokeOpacity?: number;
}> = (props) => {
  const [local] = splitProps(props, [
    "class",
    "delay",
    "width",
    "height",
    "rotate",
    "blur",
    "colorVar",
    "opacityStart",
    "opacityEnd",
    "strokeOpacity",
  ]);

  const delay = () => local.delay ?? 0;
  const width = () => local.width ?? 400;
  const height = () => local.height ?? 100;
  const rotate = () => local.rotate ?? 0;
  const blurVal = () => local.blur ?? 2;
  const colorVar = () => local.colorVar || "var(--primary)";
  const opacityStart = () => local.opacityStart ?? 0.25;
  const opacityEnd = () => local.opacityEnd ?? 0.05;
  const strokeOpacity = () => local.strokeOpacity ?? 0.3;

  const gradientId = () => `house-gradient-${delay()}-${width()}-${height()}-${rotate()}`;
  const filterId = () => `house-blur-${delay()}-${width()}-${height()}-${rotate()}`;

  const directions = [
    { x: 0, y: -40 },
    { x: 0, y: 40 },
    { x: -50, y: 0 },
    { x: 50, y: 0 },
    { x: -35, y: -35 },
    { x: 35, y: -35 },
    { x: -35, y: 35 },
    { x: 35, y: 35 },
  ];

  const directionIndex = () => Math.floor((delay() * 13.37) % directions.length);
  const direction = () => directions[directionIndex()]!;
  const initialRotate = () =>
    rotate() + (direction().x > 0 ? 8 : direction().x < 0 ? -8 : direction().y > 0 ? 10 : -10);
  const floatDuration = () => 18 + delay() * 4;

  return (
    <div
      class={cn("geometric-shape-entrance absolute", local.class)}
      style={
        {
          "--entrance-x": `${direction().x}px`,
          "--entrance-y": `${direction().y}px`,
          "--entrance-rotate": `${initialRotate()}deg`,
          "--final-rotate": `${rotate()}deg`,
          "--entrance-delay": `${delay()}s`,
          "--float-duration": `${floatDuration()}s`,
          "--base-rotate": `${rotate()}deg`,
        } as JSX.CSSProperties
      }
    >
      <div
        class="geometric-shape-float relative"
        style={{
          width: `${width()}px`,
          height: `${height()}px`,
        }}
      >
        <svg
          aria-hidden="true"
          width={width()}
          height={height()}
          viewBox="0 0 100 100"
          class="absolute inset-0"
          style={
            {
              "--shape-color": colorVar(),
            } as JSX.CSSProperties
          }
        >
          <defs>
            <linearGradient id={gradientId()} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop
                offset="0%"
                style={
                  {
                    "stop-color": `oklch(from var(--shape-color) l c h / ${opacityStart()})`,
                  } as JSX.CSSProperties
                }
              />
              <stop
                offset="100%"
                style={
                  {
                    "stop-color": `oklch(from var(--shape-color) l c h / ${opacityEnd()})`,
                  } as JSX.CSSProperties
                }
              />
            </linearGradient>
            <filter id={filterId()}>
              <feGaussianBlur in="SourceGraphic" stdDeviation={blurVal()} />
            </filter>
          </defs>

          <path
            d={HOUSE_PATH}
            fill={`url(#${gradientId()})`}
            style={
              {
                stroke: `oklch(from var(--shape-color) l c h / ${strokeOpacity()})`,
              } as JSX.CSSProperties
            }
            stroke-width="2"
            filter={`url(#${filterId()})`}
          />
        </svg>
      </div>
    </div>
  );
};

const GeometricBackground: ParentComponent<{ class?: string }> = (props) => {
  const [local] = splitProps(props, ["class", "children"]);
  return (
    <>
      <div
        class={cn(
          "fixed inset-0 h-screen w-full overflow-hidden bg-background dark:bg-[#0a0a14]",
          local.class,
        )}
      >
        <div class="absolute inset-0 overflow-hidden">
          <ElegantShape
            delay={1.2}
            width={600}
            height={140}
            rotate={12}
            blur={1.5}
            colorVar="var(--primary)"
            opacityStart={0.28}
            opacityEnd={0.06}
            strokeOpacity={0.35}
            class="top-[10%] left-[-20%] md:top-[20%] md:left-[-5%]"
          />

          <ElegantShape
            delay={0.4}
            width={500}
            height={120}
            rotate={-15}
            blur={2.5}
            colorVar="var(--chart-1)"
            opacityStart={0.3}
            opacityEnd={0.08}
            strokeOpacity={0.4}
            class="top-[65%] right-[-15%] md:top-[75%] md:right-[0%]"
          />

          <ElegantShape
            delay={2.0}
            width={300}
            height={80}
            rotate={-8}
            blur={2}
            colorVar="var(--accent)"
            opacityStart={0.35}
            opacityEnd={0.1}
            strokeOpacity={0.45}
            class="bottom-[2%] left-[-5%] md:bottom-[10%] md:left-[10%]"
          />

          <ElegantShape
            delay={1.6}
            width={200}
            height={60}
            rotate={20}
            blur={3}
            colorVar="var(--chart-3)"
            opacityStart={0.22}
            opacityEnd={0.04}
            strokeOpacity={0.28}
            class="top-[8%] right-[5%] hidden sm:block md:top-[15%] md:right-[20%]"
          />

          <ElegantShape
            delay={0.8}
            width={150}
            height={40}
            rotate={-25}
            blur={1.5}
            colorVar="var(--secondary)"
            opacityStart={0.25}
            opacityEnd={0.05}
            strokeOpacity={0.32}
            class="top-[3%] left-[10%] hidden sm:block md:top-[10%] md:left-[25%]"
          />

          <ElegantShape
            delay={0.1}
            width={350}
            height={90}
            rotate={18}
            blur={2.2}
            colorVar="var(--chart-2)"
            opacityStart={0.32}
            opacityEnd={0.07}
            strokeOpacity={0.38}
            class="right-[15%] bottom-[18%] md:right-[35%] md:bottom-[25%]"
          />
        </div>

        <div class="pointer-events-none absolute inset-0 bg-gradient-to-tl from-primary/20 via-transparent to-accent/40" />
      </div>
      {local.children && <div class="relative z-10">{local.children}</div>}
    </>
  );
};

export { GeometricBackground, ElegantShape };

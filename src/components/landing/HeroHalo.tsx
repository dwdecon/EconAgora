/**
 * Visual lock for the landing-page halo.
 *
 * This component reproduces the approved hero halo rendering exactly.
 * Do not change its geometry, filters, gradients, timings, masks, wrapper
 * transforms, or blend behavior unless the user explicitly asks to modify
 * the halo/background effect itself.
 */
const RING_RADIUS = 360;
const RING_CENTER_Y = 324 + RING_RADIUS * 0.1;
const RING_PATH = `M 190 ${RING_CENTER_Y} A ${RING_RADIUS} ${RING_RADIUS} 0 1 0 810 ${RING_CENTER_Y}`;

export default function HeroHalo() {
  return (
    <>
      <div
        className="absolute top-[-10%] left-[-10%] h-[35vh] w-[50vw] max-w-[800px] pointer-events-none z-0 opacity-60 mix-blend-screen blur-[120px] md:blur-[160px] animate-[pulse_8s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(circle at center, #FF0055 0%, transparent 70%)",
        }}
      />

      <div
        className="absolute top-[-10%] right-[-10%] h-[35vh] w-[50vw] max-w-[800px] pointer-events-none z-0 opacity-60 mix-blend-screen blur-[120px] md:blur-[160px] animate-[pulse_8s_ease-in-out_infinite_4s]"
        style={{
          background:
            "radial-gradient(circle at center, #FF4D00 0%, transparent 70%)",
        }}
      />

      <div className="absolute top-0 left-1/2 h-[220vw] w-[220vw] max-w-none -translate-x-1/2 -translate-y-[49%] pointer-events-none z-0 md:h-[1800px] md:w-[1800px]">
        <div
          className="h-full w-full"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, transparent 20%, black 45%, black 100%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, transparent 20%, black 45%, black 100%)",
          }}
        >
          <svg
            viewBox="0 0 1000 1000"
            className="h-full w-full opacity-[0.95] mix-blend-screen"
          >
            <defs>
              <filter id="outer-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="24" result="blur" />
              </filter>
              <filter id="middle-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="16" result="blur" />
              </filter>
              <filter id="inner-core" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
              </filter>

              <linearGradient
                id="ring-gradient"
                x1="100"
                y1="100"
                x2="900"
                y2="900"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%">
                  <animate
                    attributeName="stop-color"
                    values="#FF0055; #FF4D00; #FF0055"
                    dur="8s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="33%">
                  <animate
                    attributeName="stop-color"
                    values="#7000FF; #FF0055; #7000FF"
                    dur="8s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="66%">
                  <animate
                    attributeName="stop-color"
                    values="#FF4D00; #7000FF; #FF4D00"
                    dur="8s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="100%">
                  <animate
                    attributeName="stop-color"
                    values="#FF0055; #FF4D00; #FF0055"
                    dur="8s"
                    repeatCount="indefinite"
                  />
                </stop>

                <animateTransform
                  attributeName="gradientTransform"
                  type="rotate"
                  from="0 500 500"
                  to="360 500 500"
                  dur="12s"
                  repeatCount="indefinite"
                />
              </linearGradient>
            </defs>

            <path
              d={RING_PATH}
              fill="none"
              stroke="url(#ring-gradient)"
              strokeWidth="96"
              strokeLinecap="round"
              filter="url(#outer-glow)"
              opacity="0.8"
            />

            <path
              d={RING_PATH}
              fill="none"
              stroke="url(#ring-gradient)"
              strokeWidth="42"
              strokeLinecap="round"
              filter="url(#middle-glow)"
              opacity="0.9"
            />

            <path
              d={RING_PATH}
              fill="none"
              stroke="url(#ring-gradient)"
              strokeWidth="16"
              strokeLinecap="round"
              filter="url(#inner-core)"
              opacity="1"
            />
          </svg>
        </div>
      </div>
    </>
  );
}

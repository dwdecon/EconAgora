import { useId } from "react";

type BlogIllustrationVariant =
  | "reviewFlow"
  | "replicationStack"
  | "auditCompass"
  | "copilotLayers"
  | "memoryArchive";

type BlogCoverIllustrationProps = {
  variant: BlogIllustrationVariant;
  accentColor: string;
  compact?: boolean;
};

type IllustrationIds = {
  panel: string;
  line: string;
  shadow: string;
};

type IllustrationPalette = {
  accent: string;
  accentSoft: string;
  ink: string;
  paper: string;
};

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((chunk) => chunk + chunk)
          .join("")
      : normalized;

  const value = Number.parseInt(full, 16);

  if (Number.isNaN(value)) {
    return `rgba(59, 41, 29, ${alpha})`;
  }

  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function buildPalette(accentColor: string): IllustrationPalette {
  return {
    accent: accentColor,
    accentSoft: hexToRgba(accentColor, 0.18),
    ink: "rgba(42, 31, 24, 0.58)",
    paper: "rgba(255, 250, 242, 0.66)",
  };
}

function SharedDefs({
  ids,
  palette,
}: {
  ids: IllustrationIds;
  palette: IllustrationPalette;
}) {
  return (
    <defs>
      <linearGradient id={ids.panel} x1="56" y1="42" x2="248" y2="176" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.52" />
        <stop offset="100%" stopColor={palette.accent} stopOpacity="0.1" />
      </linearGradient>

      <linearGradient id={ids.line} x1="78" y1="66" x2="244" y2="156" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor={palette.accent} stopOpacity="0.92" />
        <stop offset="100%" stopColor="#3A2B22" stopOpacity="0.54" />
      </linearGradient>

      <filter id={ids.shadow} x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#2B1E17" floodOpacity="0.08" />
      </filter>
    </defs>
  );
}

function ReviewFlowIllustration({
  ids,
  palette,
}: {
  ids: IllustrationIds;
  palette: IllustrationPalette;
}) {
  return (
    <>
      <g filter={`url(#${ids.shadow})`}>
        <rect
          x="82"
          y="58"
          width="92"
          height="118"
          rx="18"
          fill={`url(#${ids.panel})`}
        />
        <rect
          x="154"
          y="82"
          width="78"
          height="58"
          rx="16"
          fill={palette.paper}
        />
      </g>
      <path
        d="M108 92h40M108 108h48M108 124h28"
        stroke={palette.ink}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M148 122c18-2 30-10 40-24 10-12 24-18 42-18"
        fill="none"
        stroke={`url(#${ids.line})`}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="146" cy="122" r="5.5" fill={palette.accent} fillOpacity="0.9" />
      <circle cx="190" cy="96" r="5.5" fill={palette.accent} fillOpacity="0.75" />
      <circle cx="232" cy="98" r="5.5" fill={palette.accent} fillOpacity="0.62" />
    </>
  );
}

function ReplicationStackIllustration({
  ids,
  palette,
}: {
  ids: IllustrationIds;
  palette: IllustrationPalette;
}) {
  return (
    <>
      <g filter={`url(#${ids.shadow})`}>
        <rect x="82" y="68" width="110" height="26" rx="13" fill={`url(#${ids.panel})`} />
        <rect x="92" y="102" width="126" height="26" rx="13" fill={`url(#${ids.panel})`} />
        <rect x="102" y="136" width="92" height="26" rx="13" fill={`url(#${ids.panel})`} />
      </g>
      <path
        d="M114 81h44M124 115h60M132 149h42"
        stroke={palette.ink}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="232" cy="104" r="20" fill={palette.accentSoft} />
      <circle cx="232" cy="104" r="13" fill="none" stroke={palette.accent} strokeWidth="2.4" />
      <path
        d="M226 104l4 4 8-10"
        fill="none"
        stroke={palette.accent}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

function AuditCompassIllustration({
  ids,
  palette,
}: {
  ids: IllustrationIds;
  palette: IllustrationPalette;
}) {
  return (
    <>
      <g filter={`url(#${ids.shadow})`}>
        <rect x="78" y="64" width="104" height="92" rx="20" fill={`url(#${ids.panel})`} />
      </g>
      <path
        d="M100 136V90M100 136h60"
        fill="none"
        stroke={palette.ink}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M110 126l16-12 16-8 18-18"
        fill="none"
        stroke={`url(#${ids.line})`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="214" cy="104" r="28" fill="none" stroke={palette.accent} strokeWidth="2.4" />
      <path
        d="M214 84v40M194 104h40"
        fill="none"
        stroke={palette.ink}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M232 122l16 16"
        fill="none"
        stroke={palette.ink}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </>
  );
}

function CopilotLayersIllustration({
  ids,
  palette,
}: {
  ids: IllustrationIds;
  palette: IllustrationPalette;
}) {
  return (
    <>
      <g filter={`url(#${ids.shadow})`}>
        <rect x="64" y="62" width="188" height="28" rx="14" fill={`url(#${ids.panel})`} />
        <rect x="88" y="102" width="140" height="28" rx="14" fill={`url(#${ids.panel})`} />
        <rect x="112" y="142" width="92" height="26" rx="13" fill={`url(#${ids.panel})`} />
      </g>
      <path
        d="M158 90v12M158 130v12"
        fill="none"
        stroke={`url(#${ids.line})`}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="158" cy="96" r="5" fill={palette.accent} />
      <circle cx="158" cy="136" r="5" fill={palette.accent} fillOpacity="0.72" />
    </>
  );
}

function MemoryArchiveIllustration({
  ids,
  palette,
}: {
  ids: IllustrationIds;
  palette: IllustrationPalette;
}) {
  return (
    <>
      <g filter={`url(#${ids.shadow})`}>
        <rect x="66" y="142" width="188" height="16" rx="8" fill={palette.paper} />
        <rect x="78" y="96" width="42" height="46" rx="12" fill={`url(#${ids.panel})`} />
        <rect x="132" y="78" width="50" height="64" rx="12" fill={`url(#${ids.panel})`} />
        <rect x="194" y="102" width="40" height="40" rx="12" fill={`url(#${ids.panel})`} />
      </g>
      <path
        d="M92 78c20-18 42-26 66-26 24 0 46 8 66 24"
        fill="none"
        stroke={`url(#${ids.line})`}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="92" cy="78" r="5.5" fill={palette.accent} fillOpacity="0.7" />
      <circle cx="158" cy="52" r="5.5" fill={palette.accent} />
      <circle cx="224" cy="76" r="5.5" fill={palette.accent} fillOpacity="0.7" />
    </>
  );
}

function renderIllustration(
  variant: BlogIllustrationVariant,
  ids: IllustrationIds,
  palette: IllustrationPalette,
) {
  switch (variant) {
    case "reviewFlow":
      return <ReviewFlowIllustration ids={ids} palette={palette} />;
    case "replicationStack":
      return <ReplicationStackIllustration ids={ids} palette={palette} />;
    case "auditCompass":
      return <AuditCompassIllustration ids={ids} palette={palette} />;
    case "copilotLayers":
      return <CopilotLayersIllustration ids={ids} palette={palette} />;
    case "memoryArchive":
      return <MemoryArchiveIllustration ids={ids} palette={palette} />;
    default:
      return null;
  }
}

export default function BlogCoverIllustration({
  variant,
  accentColor,
  compact = false,
}: BlogCoverIllustrationProps) {
  const uid = useId().replace(/:/g, "");
  const ids: IllustrationIds = {
    panel: `${uid}-panel`,
    line: `${uid}-line`,
    shadow: `${uid}-shadow`,
  };
  const palette = buildPalette(accentColor);

  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-center justify-center ${
        compact ? "scale-[0.96]" : "scale-100"
      }`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 320 220"
        className="h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <SharedDefs ids={ids} palette={palette} />
        {renderIllustration(variant, ids, palette)}
      </svg>
    </div>
  );
}

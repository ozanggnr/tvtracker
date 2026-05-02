"use client";
export function Starfield() {
  return (
    <div className="starfield" aria-hidden="true">
      {/* Additional SVG stars for richer effect */}
      <svg
        className="absolute inset-0 w-full h-full opacity-40"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="nebula1" cx="20%" cy="30%" r="40%">
            <stop offset="0%" stopColor="#1a0533" stopOpacity="0.8" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nebula2" cx="80%" cy="70%" r="35%">
            <stop offset="0%" stopColor="#001a33" stopOpacity="0.6" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nebula3" cx="50%" cy="10%" r="30%">
            <stop offset="0%" stopColor="#0d1b0d" stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#nebula1)" />
        <rect width="100%" height="100%" fill="url(#nebula2)" />
        <rect width="100%" height="100%" fill="url(#nebula3)" />
      </svg>
    </div>
  );
}

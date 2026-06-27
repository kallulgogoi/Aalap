const LowLatencySVG = () => (
  <svg viewBox="0 0 200 200" className="w-full max-w-sm">
    <circle cx="100" cy="100" r="80" fill="rgba(99, 102, 241, 0.05)" />

    {/* Lightning bolt */}
    <path
      d="M100 30 L70 100 L95 100 L85 170 L130 90 L105 90 L115 30Z"
      fill="#fbbf24"
      stroke="#f59e0b"
      strokeWidth="2"
    />

    {/* Speed rings */}
    <circle
      cx="100"
      cy="100"
      r="50"
      fill="none"
      stroke="#818cf8"
      strokeWidth="1.5"
      opacity="0.3"
    >
      <animate
        attributeName="r"
        values="40;60;40"
        dur="2s"
        repeatCount="indefinite"
      />
      <animate
        attributeName="opacity"
        values="0.5;0.1;0.5"
        dur="2s"
        repeatCount="indefinite"
      />
    </circle>
    <circle
      cx="100"
      cy="100"
      r="65"
      fill="none"
      stroke="#818cf8"
      strokeWidth="1.5"
      opacity="0.2"
    >
      <animate
        attributeName="r"
        values="55;75;55"
        dur="2s"
        repeatCount="indefinite"
        begin="0.5s"
      />
      <animate
        attributeName="opacity"
        values="0.4;0.1;0.4"
        dur="2s"
        repeatCount="indefinite"
        begin="0.5s"
      />
    </circle>

    {/* Small dots */}
    <circle cx="140" cy="60" r="3" fill="#818cf8" opacity="0.6">
      <animate
        attributeName="opacity"
        values="0.2;1;0.2"
        dur="1s"
        repeatCount="indefinite"
      />
    </circle>
    <circle cx="60" cy="140" r="3" fill="#818cf8" opacity="0.6">
      <animate
        attributeName="opacity"
        values="0.2;1;0.2"
        dur="1s"
        repeatCount="indefinite"
        begin="0.3s"
      />
    </circle>
  </svg>
);
export default LowLatencySVG;

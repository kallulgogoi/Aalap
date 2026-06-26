const MessageSentSVG = () => (
  <svg viewBox="0 0 200 200" className="w-full max-w-sm">
    <circle cx="100" cy="100" r="80" fill="rgba(99, 102, 241, 0.05)" />

    {/* Envelope */}
    <rect
      x="40"
      y="70"
      width="120"
      height="70"
      rx="12"
      fill="#1f2937"
      stroke="#374151"
      strokeWidth="2"
    />
    <path
      d="M40 70 L100 110 L160 70"
      fill="none"
      stroke="#818cf8"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M40 140 L70 110"
      fill="none"
      stroke="#374151"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M160 140 L130 110"
      fill="none"
      stroke="#374151"
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Checkmark */}
    <g transform="translate(130, 130)">
      <circle cx="20" cy="20" r="18" fill="#34d399" opacity="0.2" />
      <path
        d="M12 20 L18 26 L28 14"
        stroke="#34d399"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <animate
          attributeName="stroke-dasharray"
          values="0 20;20 20"
          dur="0.5s"
          fill="freeze"
        />
      </path>
    </g>
  </svg>
);
export default MessageSentSVG;

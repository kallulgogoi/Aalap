const ChatBubblesSVG = () => (
  <svg viewBox="0 0 200 200" className="w-full max-w-sm">
    <circle cx="100" cy="100" r="90" fill="rgba(99, 102, 241, 0.05)" />
    <circle cx="100" cy="100" r="70" fill="rgba(99, 102, 241, 0.08)" />

    {/* Chat bubble 1 */}
    <g transform="translate(30, 40)">
      <rect
        x="0"
        y="0"
        width="120"
        height="60"
        rx="16"
        fill="#1f2937"
        stroke="#374151"
        strokeWidth="1.5"
      />
      <path
        d="M15 60 L25 75 L35 60"
        fill="#1f2937"
        stroke="#374151"
        strokeWidth="1.5"
      />
      <circle cx="20" cy="30" r="8" fill="#818cf8" />
      <rect x="35" y="26" width="70" height="8" rx="4" fill="#4b5563" />
      <rect x="35" y="40" width="50" height="8" rx="4" fill="#4b5563" />
    </g>

    {/* Chat bubble 2 */}
    <g transform="translate(50, 110)">
      <rect
        x="0"
        y="0"
        width="100"
        height="50"
        rx="16"
        fill="#1f2937"
        stroke="#374151"
        strokeWidth="1.5"
      />
      <path
        d="M85 50 L75 65 L65 50"
        fill="#1f2937"
        stroke="#374151"
        strokeWidth="1.5"
      />
      <circle cx="20" cy="25" r="8" fill="#34d399" />
      <rect x="35" y="21" width="50" height="8" rx="4" fill="#4b5563" />
      <rect x="35" y="35" width="40" height="8" rx="4" fill="#4b5563" />
    </g>

    {/* Sending animation */}
    <g transform="translate(110, 30)">
      <circle cx="15" cy="15" r="12" fill="#818cf8" opacity="0.2" />
      <path
        d="M10 15 L20 15 M15 10 L15 20"
        stroke="#818cf8"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <animate
          attributeName="opacity"
          values="0.3;1;0.3"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </path>
    </g>
  </svg>
);
export default ChatBubblesSVG;

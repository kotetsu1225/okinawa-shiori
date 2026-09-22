// A small ink-and-paper hot spring vignette, drawn with native SVG.
export function Onsen() {
  return (
    <svg className="onsen-illustration" viewBox="0 0 180 156" aria-hidden="true" focusable="false">
      <circle cx="105" cy="72" r="57" fill="#E7DDC7" />
      <path d="M20 94 59 51 92 87 118 60 164 99" fill="#B9C5B0" />
      <path d="m62 98 35-51 41 52" fill="#8EA58A" />
      <ellipse cx="100" cy="119" rx="73" ry="27" fill="#B5A184" />
      <ellipse cx="100" cy="115" rx="65" ry="23" fill="#D1C1A3" />
      <ellipse cx="100" cy="113" rx="53" ry="16" fill="#789D92" />
      <path d="M59 110c18-9 60-10 84 0M76 120c13 3 32 3 46-1" fill="none" stroke="#E8E9D9" strokeWidth="2" strokeLinecap="round" />
      <g fill="none" stroke="#FFFDF5" strokeWidth="4" strokeLinecap="round" className="onsen-steam">
        <path d="M83 94c-15-15 12-19-1-36" />
        <path d="M104 90c-16-17 14-24-1-43" />
        <path d="M124 93c-13-14 11-18 0-33" />
      </g>
      <g fill="#67765D">
        <path d="M30 97C12 84 19 66 31 73c12 8 3 15-1 24Z" />
        <path d="M31 96c-2-25 15-27 18-17 4 11-11 18-18 17Z" />
      </g>
      <path d="m30 109 1-29" fill="none" stroke="#687256" strokeWidth="2" />
      <ellipse cx="35" cy="123" rx="16" ry="9" fill="#908E76" />
      <ellipse cx="155" cy="120" rx="14" ry="8" fill="#A59C82" />
      <ellipse cx="142" cy="136" rx="16" ry="7" fill="#958B71" />
      <ellipse cx="57" cy="139" rx="15" ry="7" fill="#A59C82" />
    </svg>
  );
}

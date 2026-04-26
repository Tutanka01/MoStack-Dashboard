type Tone = {
  ring: string;
  text: string;
  bg: string;
  dot: string;
};

const styles: Record<string, Tone> = {
  UP:        { ring: 'border-[#07683C]/45', text: 'text-[#07683C]', bg: 'bg-[#07683C]/8',  dot: 'bg-[#07683C]' },
  ENABLED:   { ring: 'border-[#07683C]/45', text: 'text-[#07683C]', bg: 'bg-[#07683C]/8',  dot: 'bg-[#07683C]' },
  ACTIVE:    { ring: 'border-[#07683C]/45', text: 'text-[#07683C]', bg: 'bg-[#07683C]/8',  dot: 'bg-[#07683C]' },
  AVAILABLE: { ring: 'border-[#07683C]/45', text: 'text-[#07683C]', bg: 'bg-[#07683C]/8',  dot: 'bg-[#07683C]' },
  TRUE:      { ring: 'border-[#07683C]/45', text: 'text-[#07683C]', bg: 'bg-[#07683C]/8',  dot: 'bg-[#07683C]' },
  'IN-USE':  { ring: 'border-[#1535C7]/45', text: 'text-[#1535C7]', bg: 'bg-[#1535C7]/8',  dot: 'bg-[#1535C7]' },
  ATTACHED:  { ring: 'border-[#1535C7]/45', text: 'text-[#1535C7]', bg: 'bg-[#1535C7]/8',  dot: 'bg-[#1535C7]' },
  DOWN:      { ring: 'border-[#DD2A1C]/45', text: 'text-[#DD2A1C]', bg: 'bg-[#DD2A1C]/8',  dot: 'bg-[#DD2A1C]' },
  ERROR:     { ring: 'border-[#DD2A1C]/45', text: 'text-[#DD2A1C]', bg: 'bg-[#DD2A1C]/8',  dot: 'bg-[#DD2A1C]' },
  FALSE:     { ring: 'border-[#DD2A1C]/45', text: 'text-[#DD2A1C]', bg: 'bg-[#DD2A1C]/8',  dot: 'bg-[#DD2A1C]' },
  WARNING:   { ring: 'border-[#B36B00]/45', text: 'text-[#B36B00]', bg: 'bg-[#B36B00]/8',  dot: 'bg-[#B36B00]' },
  PENDING:   { ring: 'border-[#B36B00]/45', text: 'text-[#B36B00]', bg: 'bg-[#B36B00]/8',  dot: 'bg-[#B36B00]' },
  DISABLED:  { ring: 'border-[#11100D]/30', text: 'text-[#6F6A5F]', bg: 'bg-[#11100D]/4',  dot: 'bg-[#6F6A5F]' },
  UNKNOWN:   { ring: 'border-[#11100D]/30', text: 'text-[#6F6A5F]', bg: 'bg-[#11100D]/4',  dot: 'bg-[#6F6A5F]' }
};

export function StatusBadge({ value }: { value?: string | boolean | null }) {
  const label = typeof value === 'boolean'
    ? (value ? 'UP' : 'DOWN')
    : (value || 'UNKNOWN').toString().toUpperCase();
  const tone = styles[label] || styles.UNKNOWN;
  return (
    <span className={`inline-flex items-center gap-1.5 border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] ${tone.ring} ${tone.bg} ${tone.text}`}>
      <span className={`h-1 w-1 ${tone.dot}`} />
      {label}
    </span>
  );
}

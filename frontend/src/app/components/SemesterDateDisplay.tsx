import { parseSemesterEntries } from '../lib/studienkollegs';

interface Props {
  raw?: string | null;
  context?: string | null;
  fallback?: string;
  className?: string;
}

export default function SemesterDateDisplay({
  raw,
  context,
  fallback = '—',
  className = '',
}: Props) {
  const entries = parseSemesterEntries(raw, context);

  if (entries.length === 0) {
    return <span className={`text-[#9A9890] ${className}`}>{fallback}</span>;
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {entries.map((item, index) => (
        <div key={index} className="flex items-baseline gap-1.5">
          {item.prefix !== 'Ghi chú' && (
            <span className="font-semibold text-[11px] tracking-wider text-[#4A4944] uppercase shrink-0">
              {item.prefix}:
            </span>
          )}
          <span
            className={
              item.prefix === 'Ghi chú'
                ? 'text-xs text-[#5A5955]'
                : 'font-mono text-xs text-[#111111]'
            }
          >
            {item.text}
          </span>
        </div>
      ))}
    </div>
  );
}

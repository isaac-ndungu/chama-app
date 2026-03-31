export default function ProgressBar({ value = 0, color = 'green', label, sublabel, showPercent = true }) {
  const pct = Math.min(Math.max(value, 0), 100);

  const colors = {
    green:  'bg-[#2A7A4B]',
    amber:  'bg-[#B8650A]',
    red:    'bg-[#C0392B]',
    blue:   'bg-[#1A3E8C]',
  };

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5 text-[12px] text-[#6B6560]">
          {label && <span>{label}</span>}
          {showPercent && (
            <span className="font-bold text-[#1C1814]">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div className="h-2 bg-[#F8F6F3] rounded-full border border-[#E8E4DF] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors[color] || colors.green}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {sublabel && (
        <div className="text-[11px] text-[#9E9690] mt-1">{sublabel}</div>
      )}
    </div>
  );
}
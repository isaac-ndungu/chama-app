export default function StatCard({ label, value, sub, trend, trendType = 'neutral', valueColor }) {
    const trendColors = {
        up: 'text-[#2A7A4B]',
        down: 'text-[#B8650A]',
        bad: 'text-[#C0392B]',
        neutral: 'text-[#9E9690]',
    };

    return (
        <div className="bg-white border border-[#E8E4DF] rounded-[10px] px-6 py-4">
            <div className="text-[10px] font-bold tracking-widest uppercase text-[#9E9690] mb-2">
                {label}
            </div>
            <div
                className={`font-serif text-[26px] leading-none mb-1.5 ${valueColor || 'text-[#1C1814]'
                    }`}
            >
                {value}
            </div>
            {sub && (
                <div className="text-[11px] text-[#9E9690]">{sub}</div>
            )}
            {trend && (
                <div className={`text-[11px] font-semibold mt-1.5 flex items-center gap-1 ${trendColors[trendType]}`}>
                    {trend}
                </div>
            )}
        </div>
    );
}
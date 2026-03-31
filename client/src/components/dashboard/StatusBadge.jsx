const STYLES = {
  verified:             'bg-[#EAF5EE] text-[#2A7A4B]',
  paid:                 'bg-[#EAF5EE] text-[#2A7A4B]',
  pending:              'bg-[#FEF3E2] text-[#B8650A]',
  pending_verification: 'bg-[#FEF3E2] text-[#B8650A]',
  overdue:              'bg-[#FFF0EF] text-[#C0392B]',
  disputed:             'bg-[#FFF0EF] text-[#C0392B]',
  active:               'bg-[#F0F4FF] text-[#1A3E8C]',
  partial:              'bg-[#F0F4FF] text-[#1A3E8C]',
  settled:              'bg-[#EAF5EE] text-[#2A7A4B]',
  defaulted:            'bg-[#FFF0EF] text-[#C0392B]',
};

const DOT_COLORS = {
  verified:             'bg-[#2A7A4B]',
  paid:                 'bg-[#2A7A4B]',
  pending:              'bg-[#B8650A]',
  pending_verification: 'bg-[#B8650A]',
  overdue:              'bg-[#C0392B]',
  disputed:             'bg-[#C0392B]',
  active:               'bg-[#1A3E8C]',
  partial:              'bg-[#1A3E8C]',
  settled:              'bg-[#2A7A4B]',
  defaulted:            'bg-[#C0392B]',
};

const LABELS = {
  verified:             'Verified',
  paid:                 'Paid',
  pending:              'Pending',
  pending_verification: 'Pending',
  overdue:              'Overdue',
  disputed:             'Disputed',
  active:               'Active',
  partial:              'Partial',
  settled:              'Settled',
  defaulted:            'Defaulted',
};

export default function StatusBadge({ status }) {
  const key = status?.toLowerCase().replace(' ', '_') || 'pending';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${STYLES[key] || STYLES.pending}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLORS[key] || DOT_COLORS.pending}`} />
      {LABELS[key] || status}
    </span>
  );
}
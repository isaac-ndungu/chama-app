export default function RoleBadge({ role }) {
  const styles = {
    chairman:  'bg-[#FEF3E2] text-[#7A4D08]',
    treasurer: 'bg-[#EEF2FF] text-[#1A3E8C]',
    member:    'bg-[#F8F6F3] text-[#6B6560] border border-[#E8E4DF]',
  };
  const labels = {
    chairman: 'Chairman',
    treasurer: 'Treasurer',
    member: 'Member',
  };
  return (
    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${styles[role] || styles.member}`}>
      {labels[role] || role}
    </span>
  );
}
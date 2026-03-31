const BG = ['bg-[#FEF3E2]', 'bg-[#EEF2FF]', 'bg-[#EAF5EE]', 'bg-[#FFF0EF]'];
const TEXT = ['text-[#7A4D08]', 'text-[#1A3E8C]', 'text-[#2A7A4B]', 'text-[#C0392B]'];

function colorIndex(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % BG.length;
}

export default function MemberAvatar({ name, size = 'md' }) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  const idx = colorIndex(name);
  const sizes = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-[34px] h-[34px] text-[11px]',
    lg: 'w-11 h-11 text-sm',
  };
  return (
    <div className={`${sizes[size]} rounded-full ${BG[idx]} ${TEXT[idx]} border border-[#E8E4DF] flex items-center justify-center font-bold shrink-0`}>
      {initials}
    </div>
  );
}
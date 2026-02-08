type CalloutType = 'info' | 'success' | 'warning' | 'danger';

const styles: Record<CalloutType, { border: string; bg: string; title: string; text: string; icon: string }> = {
  info: {
    border: 'border-blue-500',
    bg: 'bg-blue-50',
    title: 'text-blue-700',
    text: 'text-blue-800',
    icon: 'ℹ️',
  },
  success: {
    border: 'border-emerald-500',
    bg: 'bg-emerald-50',
    title: 'text-emerald-700',
    text: 'text-emerald-800',
    icon: '✅',
  },
  warning: {
    border: 'border-amber-500',
    bg: 'bg-amber-50',
    title: 'text-amber-700',
    text: 'text-amber-800',
    icon: '⚠️',
  },
  danger: {
    border: 'border-red-500',
    bg: 'bg-red-50',
    title: 'text-red-700',
    text: 'text-red-800',
    icon: '⛔',
  },
};

export function Callout({
  type = 'info',
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}) {
  const style = styles[type] ?? styles.info;
  return (
    <div className={`my-4 border-l-4 ${style.border} ${style.bg} p-4 rounded-lg`}>
      <strong className={`block ${style.title}`}>
        {style.icon} {title ?? 'Nota'}
      </strong>
      <div className={`${style.text}`}>{children}</div>
    </div>
  );
}

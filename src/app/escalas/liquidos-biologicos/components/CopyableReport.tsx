import InformeCopiable from '@/components/InformeCopiable';

export default function CopyableReport({ reportText }: { reportText: string }) {
  return <InformeCopiable texto={reportText} />;
}

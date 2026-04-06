import "../../styles/escalas.css";
import ScaleMetaPortal from '@/components/ScaleMetaPortal';

export default function EscalasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ScaleMetaPortal />
      {children}
    </>
  );
}

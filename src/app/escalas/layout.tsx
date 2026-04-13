import "../../styles/escalas.css";
import ScaleMetaPortal from '@/components/ScaleMetaPortal';
import ScaleDirectoryLink from '@/components/ScaleDirectoryLink';

export default function EscalasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ScaleMetaPortal />
      <ScaleDirectoryLink />
      {children}
    </>
  );
}

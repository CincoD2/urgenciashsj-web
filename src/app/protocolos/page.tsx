import ResourceAccessInfo from '@/components/ResourceAccessInfo';
import ProtocolosTabla from '@/components/ProtocolosTabla';

export default function ProtocolosPage() {
  return (
    <div className="space-y-6">
      <ProtocolosTabla sheetId="1bUcPfoqz28dDCJQtDPX-KO2b25u8pqypIkj1bJ9TsQs" gid="0" accessInfo={<ResourceAccessInfo />} />
    </div>
  );
}

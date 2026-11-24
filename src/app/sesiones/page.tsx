import ResourceAccessInfo from '@/components/ResourceAccessInfo';
import SesionesTabla from '@/components/SesionesTabla';

export default function SesionesPage() {
  return (
    <div className="space-y-6">
      <SesionesTabla sheetId="1ej7zO2m93Fw1WxYZNRgzmiQhKWGIXkYV86p9ZDoDez8" gid="0" accessInfo={<ResourceAccessInfo />} />
    </div>
  );
}

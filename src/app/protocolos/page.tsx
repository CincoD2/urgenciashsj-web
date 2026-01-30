import ProtocolosTabla from '@/components/ProtocolosTabla';

export default function ProtocolosPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Protocolos</h1>
      <p className="text-slate-600">
        La mayoría de los enlaces de esta página refieren a sitios ubicados en la <b>intranet</b>,
        por lo que sólo es posible su acceso desde la misma (solo usuarios con acceso a la{' '}
        <a
          href="http://10.192.176.110/aulavirtual/course/view.php?id=43"
          className="underline decoration-[#dfe9eb] underline-offset-4 hover:text-[#3d7684]"
        >
          carpeta de intranet de Urgencias
        </a>{' '}
        y{' '}
        <a
          href="https://vvd17cloud.cs.san.gva.es/index.php/s/HssCWC6MNQHB3IY?path=%2F3.-%20PROTOCOLOS%20Y%20APLICACIONES%2FPROTOCOLOS%20E%20INSTRUCCIONES%20DE%20TRABAJO"
          className="underline decoration-[#dfe9eb] underline-offset-4 hover:text-[#3d7684]"
        >
          OwnCloud del Departamento
        </a>
        ).
      </p>
      <ProtocolosTabla sheetId="1bUcPfoqz28dDCJQtDPX-KO2b25u8pqypIkj1bJ9TsQs" gid="0" />
    </div>
  );
}

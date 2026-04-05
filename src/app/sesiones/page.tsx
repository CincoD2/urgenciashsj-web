import { InternalSiteIcon, IntranetIcon } from '@/components/LinkIndicators';
import SesionesTabla from '@/components/SesionesTabla';

export default function SesionesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sesiones</h1>
      <p className="text-slate-600">
        La mayoría de los enlaces de esta página refieren a sitios ubicados en la <b>intranet</b>.
        En la columna <b>Link</b>, el icono{' '}
        <span
          className="mx-1 inline-flex align-text-bottom text-[#6b7f83]"
          aria-label="información"
        >
          <IntranetIcon />
        </span>
        indica que el recurso es accesible solo desde la <b>intranet</b> por lo que sólo es posible
        su acceso desde la misma (solo usuarios con acceso a la{' '}
        <a
          href="http://10.192.176.110/aulavirtual/course/view.php?id=43"
          className="underline decoration-[#dfe9eb] underline-offset-4 hover:text-[#3d7684]"
        >
          carpeta de intranet de Urgencias
        </a>
        {''}y{''}
        <a
          href="https://vvd17cloud.cs.san.gva.es/index.php/s/HssCWC6MNQHB3IY?path=%2F3.-%20PROTOCOLOS%20Y%20APLICACIONES%2FPROTOCOLOS%20E%20INSTRUCCIONES%20DE%20TRABAJO"
          className="underline decoration-[#dfe9eb] underline-offset-4 hover:text-[#3d7684]"
        >
          OwnCloud del Departamento
        </a>
        ). El icono{' '}
        <span className="mx-1 inline-flex align-text-bottom text-[#6b7f83]" aria-label="casa">
          <InternalSiteIcon />
        </span>
        indica que el contenido está <b>dentro de esta web</b>, y el icono 🔗 indica un{' '}
        <b>enlace externo</b> al que se puede acceder con el usuario gva.
      </p>
      <SesionesTabla sheetId="1ej7zO2m93Fw1WxYZNRgzmiQhKWGIXkYV86p9ZDoDez8" gid="0" />
    </div>
  );
}

"use client"
// @ts-nocheck

import { useMemo, useState } from 'react';
import InformeCopiable from '@/components/InformeCopiable';

type Oxigeno = {
  id: string;
  label: string;
  valor: number;
};

const OXIGENO: Oxigeno[] = [
  { id: '21', label: 'Sin O₂', valor: 21 },
  { id: '24', label: 'GN 1 lpm', valor: 24 },
  { id: '28', label: 'GN 2 lpm', valor: 28 },
  { id: '32', label: 'GN 3 lpm', valor: 32 },
  { id: '36', label: 'GN 4 lpm', valor: 36 },
  { id: '40', label: 'GN 5 lpm', valor: 40 },
  { id: '30', label: 'VMK 30%', valor: 30 },
  { id: '35', label: 'VMK 35%', valor: 35 },
  { id: '40b', label: 'VMK 40%', valor: 40 },
  { id: '50', label: 'VMK reservorio', valor: 50 }
];

function getGravedad(ratio: number) {
  if (ratio > 0 && ratio <= 100) {
    return { texto: 'SDRA grave (mortalidad 45%)', color: 'rojo' };
  }
  if (ratio > 100 && ratio <= 200) {
    return { texto: 'SDRA moderado (mortalidad 32%)', color: 'naranja' };
  }
  if (ratio > 200 && ratio <= 300) {
    return { texto: 'SDRA leve (mortalidad 27%)', color: 'amarillo' };
  }
  return { texto: 'Adecuada PaFi', color: 'verde' };
}

type CalculoOk = {
  ratio: number;
  texto: string;
  color: string;
};

type CalculoError = { error: string };

export default function Pafi() {
  const [po2, setPo2] = useState('');
  const [fio2, setFio2] = useState('');
  const [oxigeno, setOxigeno] = useState<Oxigeno>(OXIGENO[0]);

  const calculo = useMemo<CalculoOk | CalculoError | null>(() => {
    const pO2 = parseFloat(po2);
    const FiO2 = parseFloat(fio2);
    if (!pO2 || !FiO2) return null;
    if (pO2 < 10 || FiO2 < 21 || FiO2 > 100) {
      return { error: 'Revisa valores de pO2 y/o FiO2 (21%-100%)' };
    }
    const ratio = Math.round((pO2 / FiO2) * 100);
    const gravedad = getGravedad(ratio);
    return { ratio, ...gravedad };
  }, [po2, fio2]);

  const textoInforme = useMemo(() => {
    if (!calculo || 'error' in calculo) return null;
    return `PaFi
- pO2: ${po2} mmHg
- FiO2: ${fio2} %

PaFi: ${calculo.ratio} mmHg
${calculo.texto}`;
  }, [calculo, po2, fio2]);

  const reset = () => {
    setPo2('');
    setFio2('');
    setOxigeno(OXIGENO[0]);
  };

  return (
    <main className="escala-wrapper space-y-6" style={{ padding: 24 }}>
      <h1 className="text-2xl font-semibold">PaFi</h1>
      <div className="inputs-grid">
        <div className="input-group">
          <label>pO2</label>
          <div className="input-con-unidad">
            <input type="number" min="0" value={po2} onChange={(e) => setPo2(e.target.value)} />
            <span className="input-unidad">mmHg</span>
          </div>
        </div>

        <div className="input-group">
          <label>FiO2</label>
          <div className="input-con-unidad">
            <input type="number" min="21" max="100" value={fio2} onChange={(e) => setFio2(e.target.value)} />
            <span className="input-unidad">%</span>
          </div>
        </div>

        <div className="input-group input-group-full">
          <label>Oxígeno suplementario</label>
          <div className="selector-botones selector-botones-oxigeno">
            {OXIGENO.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`selector-btn ${oxigeno.id === o.id ? 'activo' : ''}`}
                onClick={() => {
                  setOxigeno(o);
                  setFio2(String(o.valor));
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className="reset-btn" onClick={reset}>
        Borrar datos
      </button>

      {calculo && 'error' in calculo && (
        <div className="resultado rojo">
          <div className="puntos-total">{calculo.error}</div>
        </div>
      )}

      {calculo && !('error' in calculo) && (
        <div className={`resultado ${calculo.color}`}>
          <div className="puntos-total">{calculo.ratio} mmHg</div>
          <div className="interpretacion">{calculo.texto}</div>
        </div>
      )}

      {textoInforme && <InformeCopiable texto={textoInforme} />}
    </main>
  );
}

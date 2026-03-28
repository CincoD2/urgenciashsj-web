'use client';
// @ts-nocheck

import { useState } from 'react';
import InformeCopiable from '@/components/InformeCopiable';

type Sexo = 'mujer' | 'varon';

type BebidaOption = {
  id: string;
  bebida: string;
  emoji: string;
  graduacion: number;
  graduacionLabel: string;
  recipientes: Array<{ id: string; label: string; emoji: string; ml: number }>;
};

type BebidaInput = {
  id: number;
  bebidaId: string;
  unidades: string;
  recipienteId: string;
  grados: string;
};

type CalculoError = {
  error: string;
};

type CalculoDesglose = {
  nombre: string;
  unidadesNum: number;
  recipienteLabel: string;
  mlNum: number;
  gradosNum: number;
  gramos: number;
  ube: number;
};

type CalculoExito = {
  color: string;
  label: string;
  pesoNum: number;
  totalGramos: number;
  totalUbe: number;
  calorias: number;
  alcoholemia: number;
  totalMililitros: number;
  desglose: CalculoDesglose[];
};

const GRADUACIONES: BebidaOption[] = [
  {
    id: 'otro',
    bebida: 'Otro',
    emoji: '🧪',
    graduacion: 0,
    graduacionLabel: 'manual',
    recipientes: [
      { id: 'chupito', label: 'Chupito (30 ml)', emoji: '🥃', ml: 30 },
      { id: 'copa', label: 'Copa (50 ml)', emoji: '🍸', ml: 50 },
      { id: 'vaso', label: 'Vaso (100 ml)', emoji: '🥛', ml: 100 },
      { id: 'lata', label: 'Lata (330 ml)', emoji: '🥫', ml: 330 },
      { id: 'botellin', label: 'Botellín (250 ml)', emoji: '🍾', ml: 250 },
      { id: 'tercio', label: 'Tercio (333 ml)', emoji: '🍾', ml: 333 },
      { id: 'jarra', label: 'Jarra (500 ml)', emoji: '🍺', ml: 500 },
      { id: 'botella-vino', label: 'Botella (750 ml)', emoji: '🍾', ml: 750 },
      { id: 'botella-litro', label: 'Botella (1000 ml)', emoji: '🍾', ml: 1000 },
    ],
  },
  {
    id: 'cerveza',
    bebida: 'Cerveza',
    emoji: '🍺',
    graduacion: 5,
    graduacionLabel: '5º',
    recipientes: [
      { id: 'cana', label: 'Caña (200 ml)', emoji: '🍺', ml: 200 },
      { id: 'botellin', label: 'Botellín (250 ml)', emoji: '🍾', ml: 250 },
      { id: 'lata', label: 'Lata (330 ml)', emoji: '🥫', ml: 330 },
      { id: 'tercio', label: 'Tercio (333 ml)', emoji: '🍾', ml: 333 },
      { id: 'jarra', label: 'Jarra (500 ml)', emoji: '🍺', ml: 500 },
    ],
  },
  {
    id: 'vino-blanco',
    bebida: 'Vino blanco',
    emoji: '🍷',
    graduacion: 12.5,
    graduacionLabel: '12.5º',
    recipientes: [
      { id: 'copa', label: 'Copa (100 ml)', emoji: '🍷', ml: 100 },
      { id: 'vaso', label: 'Vaso (150 ml)', emoji: '🥛', ml: 150 },
      { id: 'botella', label: 'Botella (750 ml)', emoji: '🍾', ml: 750 },
      { id: 'brick', label: 'Brick (1 L)', emoji: '🧃', ml: 1000 },
    ],
  },
  {
    id: 'vino-tinto',
    bebida: 'Vino tinto',
    emoji: '🍷',
    graduacion: 13.5,
    graduacionLabel: '13.5º',
    recipientes: [
      { id: 'copa', label: 'Copa (100 ml)', emoji: '🍷', ml: 100 },
      { id: 'vaso', label: 'Vaso (150 ml)', emoji: '🥛', ml: 150 },
      { id: 'botella', label: 'Botella (750 ml)', emoji: '🍾', ml: 750 },
      { id: 'brick', label: 'Brick (1 L)', emoji: '🧃', ml: 1000 },
    ],
  },
  {
    id: 'vermut',
    bebida: 'Vermut',
    emoji: '🍸',
    graduacion: 15,
    graduacionLabel: '15º',
    recipientes: [
      { id: 'copa', label: 'Copa (50 ml)', emoji: '🍸', ml: 50 },
      { id: 'vaso', label: 'Vermut (100 ml)', emoji: '🥛', ml: 100 },
      { id: 'botella', label: 'Botella (1000 ml)', emoji: '🍾', ml: 1000 },
    ],
  },
  {
    id: 'baileys',
    bebida: 'Baileys',
    emoji: '🥃',
    graduacion: 17,
    graduacionLabel: '17º',
    recipientes: [
      { id: 'copa', label: 'Copa (50 ml)', emoji: '🥃', ml: 50 },
      { id: 'vaso', label: 'Vaso (100 ml)', emoji: '🥛', ml: 100 },
      { id: 'botella', label: 'Botella (700 ml)', emoji: '🍾', ml: 700 },
    ],
  },
  {
    id: 'pacharan',
    bebida: 'Pacharan',
    emoji: '🥃',
    graduacion: 25,
    graduacionLabel: '25º',
    recipientes: [
      { id: 'chupito', label: 'Chupito (30 ml)', emoji: '🥃', ml: 30 },
      { id: 'copa', label: 'Copa (50 ml)', emoji: '🍸', ml: 50 },
      { id: 'botella', label: 'Botella (700 ml)', emoji: '🍾', ml: 700 },
    ],
  },
  {
    id: 'brandy',
    bebida: 'Brandy',
    emoji: '🥃',
    graduacion: 36,
    graduacionLabel: '36º',
    recipientes: [
      { id: 'carajillo', label: 'Carajillo (25 ml)', emoji: '☕', ml: 25 },
      { id: 'copa', label: 'Copa (50 ml)', emoji: '🥃', ml: 50 },
      { id: 'combinado', label: 'Combinado (50 ml)', emoji: '🍹', ml: 50 },
    ],
  },
  {
    id: 'ron-blanco',
    bebida: 'Ron blanco',
    emoji: '🥃',
    graduacion: 37,
    graduacionLabel: '37º',
    recipientes: [
      { id: 'carajillo', label: 'Carajillo (25 ml)', emoji: '☕', ml: 25 },
      { id: 'copa', label: 'Copa (50 ml)', emoji: '🥃', ml: 50 },
      { id: 'combinado', label: 'Combinado (50 ml)', emoji: '🍹', ml: 50 },
    ],
  },
  {
    id: 'ginebra-rosa',
    bebida: 'Ginebra rosa',
    emoji: '🍸',
    graduacion: 37.5,
    graduacionLabel: '37.5º',
    recipientes: [
      { id: 'copa', label: 'Copa (50 ml)', emoji: '🍸', ml: 50 },
      { id: 'combinado', label: 'Combinado (50 ml)', emoji: '🍹', ml: 50 },
    ],
  },
  {
    id: 'tequila',
    bebida: 'Tequila',
    emoji: '🥃',
    graduacion: 38,
    graduacionLabel: '38º',
    recipientes: [
      { id: 'chupito', label: 'Chupito (30 ml)', emoji: '🥃', ml: 30 },
      { id: 'copa', label: 'Copa (50 ml)', emoji: '🍸', ml: 50 },
      { id: 'combinado', label: 'Combinado (50 ml)', emoji: '🍹', ml: 50 },
    ],
  },
  {
    id: 'ron-negro',
    bebida: 'Ron negro',
    emoji: '🥃',
    graduacion: 40,
    graduacionLabel: '40º',
    recipientes: [
      { id: 'carajillo', label: 'Carajillo (25 ml)', emoji: '☕', ml: 25 },
      { id: 'copa', label: 'Copa (50 ml)', emoji: '🥃', ml: 50 },
      { id: 'combinado', label: 'Combinado (50 ml)', emoji: '🍹', ml: 50 },
    ],
  },
  {
    id: 'vodka',
    bebida: 'Vodka',
    emoji: '🥃',
    graduacion: 40,
    graduacionLabel: '40º',
    recipientes: [
      { id: 'chupito', label: 'Chupito (30 ml)', emoji: '🥃', ml: 30 },
      { id: 'copa', label: 'Copa (50 ml)', emoji: '🍸', ml: 50 },
      { id: 'combinado', label: 'Combinado (50 ml)', emoji: '🍹', ml: 50 },
    ],
  },
  {
    id: 'wisky',
    bebida: 'Wisky',
    emoji: '🥃',
    graduacion: 45,
    graduacionLabel: '45º',
    recipientes: [
      { id: 'carajillo', label: 'Carajillo (25 ml)', emoji: '☕', ml: 25 },
      { id: 'copa', label: 'Copa (50 ml)', emoji: '🥃', ml: 50 },
      { id: 'combinado', label: 'Combinado (50 ml)', emoji: '🍹', ml: 50 },
    ],
  },
  {
    id: 'ginebra-blanca',
    bebida: 'Ginebra blanca',
    emoji: '🍸',
    graduacion: 47.3,
    graduacionLabel: '47.3º',
    recipientes: [
      { id: 'copa', label: 'Copa (50 ml)', emoji: '🍸', ml: 50 },
      { id: 'combinado', label: 'Combinado (50 ml)', emoji: '🍹', ml: 50 },
    ],
  },
  {
    id: 'absenta',
    bebida: 'Absenta',
    emoji: '🥃',
    graduacion: 70,
    graduacionLabel: '70º',
    recipientes: [
      { id: 'chupito', label: 'Chupito (30 ml)', emoji: '🥃', ml: 30 },
      { id: 'copa', label: 'Copa (50 ml)', emoji: '🍸', ml: 50 },
    ],
  },
];

const UBE_POR_COPAS = [
  {
    bebida: 'Vino',
    lineas: [
      { volumen: '1 vaso (100 ml)', ube: '1' },
      { volumen: '1 litro', ube: '10' },
    ],
  },
  {
    bebida: 'Cerveza',
    lineas: [
      { volumen: '1 caña', ube: '1' },
      { volumen: '1 litro', ube: '5' },
    ],
  },
  {
    bebida: 'Copas',
    lineas: [
      { volumen: '1 carajillo (25 cc)', ube: '1' },
      { volumen: '1 copa (50 cc)', ube: '2' },
      { volumen: '1 combinado (50 cc)', ube: '2' },
    ],
  },
  {
    bebida: 'Generosos (jerez, vermut...)',
    lineas: [
      { volumen: '1 copa (50 cc)', ube: '1' },
      { volumen: '1 vermut (100 cc)', ube: '2' },
      { volumen: '1 litro', ube: '20' },
    ],
  },
];

const EMPTY_BEBIDA: BebidaInput = {
  id: 1,
  bebidaId: '',
  unidades: '1',
  recipienteId: '',
  grados: '',
};

function parseNumber(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

function getRiesgo(ube: number, sexo: Sexo) {
  if (sexo === 'mujer') {
    if (ube >= 4) return { color: 'rojo', label: 'Riesgo alto según UBE/día' };
    if (ube >= 2) return { color: 'amarillo', label: 'Riesgo medio según UBE/día' };
    return { color: 'verde', label: 'Riesgo bajo según UBE/día' };
  }

  if (ube >= 6) return { color: 'rojo', label: 'Riesgo alto según UBE/día' };
  if (ube >= 4) return { color: 'amarillo', label: 'Riesgo medio según UBE/día' };
  return { color: 'verde', label: 'Riesgo bajo según UBE/día' };
}

function isCalculoExito(calculo: CalculoError | CalculoExito | null): calculo is CalculoExito {
  return calculo !== null && !('error' in calculo);
}

function normalizeBebidaInput(
  fila: Partial<BebidaInput> & Record<string, unknown>,
  fallbackId: number
): BebidaInput {
  return {
    id: typeof fila.id === 'number' ? fila.id : fallbackId,
    bebidaId: typeof fila.bebidaId === 'string' ? fila.bebidaId : '',
    unidades:
      typeof fila.unidades === 'string'
        ? fila.unidades
        : typeof fila.mililitros === 'string' && fila.mililitros.trim()
          ? '1'
          : '1',
    recipienteId: typeof fila.recipienteId === 'string' ? fila.recipienteId : '',
    grados: typeof fila.grados === 'string' ? fila.grados : '',
  };
}

export default function UbePage() {
  const [sexo, setSexo] = useState<Sexo>('varon');
  const [peso, setPeso] = useState('70');
  const [bebidas, setBebidas] = useState<BebidaInput[]>([{ ...EMPTY_BEBIDA }]);

  const calculo = (() => {
    const pesoNum = parseNumber(peso);
    const bebidasNormalizadas = bebidas.map((fila, index) => normalizeBebidaInput(fila, index + 1));
    const filasActivas = bebidasNormalizadas.filter(
      (fila) => fila.unidades.trim() || fila.grados.trim() || fila.bebidaId || fila.recipienteId
    );

    if (!peso.trim() && filasActivas.length === 0) return null;

    if (pesoNum === null || pesoNum <= 0) {
      return { error: 'Introduce un peso válido en kg para calcular la alcoholemia.' };
    }

    if (filasActivas.length === 0) {
      return { error: 'Añade al menos una bebida para calcular el total diario.' };
    }

    const desglose = [];
    let totalGramos = 0;
    let totalMililitros = 0;

    for (const fila of filasActivas) {
      const unidadesNum = parseNumber(fila.unidades);
      const gradosNum = parseNumber(fila.grados);
      const preset = GRADUACIONES.find((item) => item.id === fila.bebidaId);
      const recipiente = preset?.recipientes.find((item) => item.id === fila.recipienteId);
      const nombre = preset?.bebida ?? 'Bebida';

      if (unidadesNum === null || unidadesNum < 1 || !Number.isInteger(unidadesNum)) {
        return {
          error: `Las unidades diarias de "${nombre}" deben ser un entero mayor o igual a 1.`,
        };
      }

      if (!recipiente) {
        return { error: `Selecciona un recipiente válido para "${nombre}".` };
      }

      if (gradosNum === null || gradosNum < 0.5 || gradosNum > 100) {
        return { error: `La graduación de "${nombre}" debe estar entre 0,5º y 100º.` };
      }

      const mlNum = unidadesNum * recipiente.ml;

      const gramos = Math.round((mlNum * gradosNum * 0.785) / 100);

      desglose.push({
        nombre,
        unidadesNum,
        recipienteLabel: recipiente.label,
        mlNum,
        gradosNum,
        gramos,
        ube: gramos / 10,
      });

      totalGramos += gramos;
      totalMililitros += mlNum;
    }

    const totalUbe = totalGramos / 10;
    const calorias = totalGramos * 7;
    const constante = sexo === 'mujer' ? 0.55 : 0.68;
    const alcoholemia = (totalGramos / pesoNum) * constante;
    const riesgo = getRiesgo(totalUbe, sexo);

    return {
      pesoNum,
      totalGramos,
      totalUbe,
      calorias,
      alcoholemia,
      totalMililitros,
      desglose,
      ...riesgo,
    };
  })();

  const textoInforme = (() => {
    if (!isCalculoExito(calculo)) return null;

    const bebidasTexto = calculo.desglose
      .map(
        (fila) =>
          `- ${fila.nombre}: ${fila.unidadesNum} x ${fila.recipienteLabel} = ${formatNumber(fila.mlNum, 1)} ml a ${formatNumber(fila.gradosNum, 1)}º = ${fila.gramos} g (${formatNumber(fila.ube, 2)} UBE)`
      )
      .join('\n');

    return `Cálculo de las Unidades de Bebida Estándar
- Sexo: ${sexo === 'mujer' ? 'Mujer' : 'Varón'}
- Peso: ${formatNumber(calculo.pesoNum, 1)} kg

Bebidas registradas:
${bebidasTexto}

Resultado total diario:
- Volumen total: ${formatNumber(calculo.totalMililitros, 1)} ml
- Alcohol ingerido: ${calculo.totalGramos} g
- UBE: ${formatNumber(calculo.totalUbe, 2)}
- Alcoholemia estimada: ${formatNumber(calculo.alcoholemia, 2)} g/L
- Calorías: ${calculo.calorias} kcal
- Riesgo orientativo: ${calculo.label}`;
  })();

  const addBebida = () => {
    setBebidas((current) => [
      ...current,
      {
        ...EMPTY_BEBIDA,
        id: current.length === 0 ? 1 : Math.max(...current.map((fila) => fila.id)) + 1,
      },
    ]);
  };

  const updateBebida = (id: number, field: keyof BebidaInput, value: string) => {
    setBebidas((current) =>
      current.map((fila, index) => {
        const normalizada = normalizeBebidaInput(fila, index + 1);
        if (normalizada.id !== id) return normalizada;

        if (field === 'bebidaId') {
          const selected = GRADUACIONES.find((item) => item.id === value);
          return {
            ...normalizada,
            bebidaId: value,
            unidades: normalizada.unidades || '1',
            recipienteId: selected?.recipientes[0]?.id ?? '',
            grados:
              selected && selected.id !== 'otro' ? String(selected.graduacion) : normalizada.grados,
          };
        }

        return { ...normalizada, [field]: value };
      })
    );
  };

  const removeBebida = (id: number) => {
    setBebidas((current) =>
      current.length === 1 ? [{ ...EMPTY_BEBIDA }] : current.filter((fila) => fila.id !== id)
    );
  };

  const reset = () => {
    setSexo('varon');
    setPeso('70');
    setBebidas([{ ...EMPTY_BEBIDA }]);
  };

  return (
    <main className="escala-wrapper space-y-6" style={{ padding: 24 }}>
      <h1 className="text-2xl font-semibold">Cálculo de las Unidades de Bebida Estándar (UBE)</h1>

      <section className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="inputs-grid">
            <div className="input-group">
              <label>Sexo</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSexo('mujer')}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    sexo === 'mujer'
                      ? 'border-[#5a7f8a] bg-[#eaf3f5] text-[#2b5d68]'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Mujer
                </button>
                <button
                  type="button"
                  onClick={() => setSexo('varon')}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    sexo === 'varon'
                      ? 'border-[#5a7f8a] bg-[#eaf3f5] text-[#2b5d68]'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Hombre
                </button>
              </div>
            </div>

            <div className="input-group">
              <label>Peso</label>
              <div className="input-con-unidad">
                <input
                  type="number"
                  min="30"
                  step="2"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                />
                <span className="input-unidad">kg</span>
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full bg-white text-sm">
              <thead className="bg-slate-50 text-left text-slate-700">
                <tr>
                  <th className="px-2 py-2 font-semibold">#</th>
                  <th className="px-2 py-2 font-semibold">Tipo</th>
                  <th className="px-2 py-2 font-semibold">Unidades/día</th>
                  <th className="px-2 py-2 font-semibold">Recipiente</th>
                  <th className="px-2 py-2 font-semibold">Graduación</th>
                  <th className="px-2 py-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {bebidas.map((fila, index) => {
                  const bebidaSeleccionada = GRADUACIONES.find((item) => item.id === fila.bebidaId);
                  const recipientes = bebidaSeleccionada?.recipientes ?? [];

                  return (
                    <tr key={fila.id} className="border-t border-slate-100 align-top">
                      <td className="w-8 px-2 py-2 font-semibold text-slate-600">{index + 1}</td>
                      <td className="px-2 py-2">
                        <select
                          value={fila.bebidaId}
                          onChange={(e) => updateBebida(fila.id, 'bebidaId', e.target.value)}
                          className="w-full min-w-[150px]"
                        >
                          <option value="">Selecciona bebida</option>
                          {GRADUACIONES.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.emoji} {item.bebida} ({item.graduacionLabel})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <div className="input-con-unidad w-[84px]">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={fila.unidades}
                            onChange={(e) => updateBebida(fila.id, 'unidades', e.target.value)}
                            placeholder="1"
                            className="h-8 text-center"
                          />
                          <span className="input-unidad">uds</span>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={fila.recipienteId}
                          onChange={(e) => updateBebida(fila.id, 'recipienteId', e.target.value)}
                          disabled={!fila.bebidaId}
                          className="w-full min-w-[150px]"
                        >
                          <option value="">Selecciona recipiente</option>
                          {recipientes.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.emoji} {item.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <div className="input-con-unidad w-[82px]">
                          <input
                            type="number"
                            min="0.5"
                            max="100"
                            step="0.1"
                            value={fila.grados}
                            onChange={(e) => updateBebida(fila.id, 'grados', e.target.value)}
                            placeholder="Ej. 5"
                            className="h-8 text-center"
                          />
                          <span className="input-unidad">º</span>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={addBebida}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-sm transition hover:border-[#5a7f8a] hover:bg-[#eaf3f5]"
                            title="Añadir fila"
                          >
                            ➕
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBebida(fila.id)}
                            disabled={bebidas.length === 1}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-sm transition enabled:hover:border-rose-200 enabled:hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Eliminar fila"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button className="reset-btn mt-5" onClick={reset}>
            Borrar datos
          </button>

          {calculo?.error && (
            <div className="resultado rojo mt-4">
              <div className="puntos-total">{calculo.error}</div>
            </div>
          )}

          {calculo && !calculo.error && (
            <div className={`resultado ${calculo.color} mt-4`}>
              <div className="puntos-total">{formatNumber(calculo.totalUbe, 2)} UBE</div>
              <div className="interpretacion">
                {calculo.totalGramos} g de alcohol | {formatNumber(calculo.alcoholemia, 2)} g/L |{' '}
                {calculo.calorias} kcal
              </div>
              <div className="interpretacion">{calculo.label}</div>
            </div>
          )}
        </div>

        {textoInforme && <InformeCopiable texto={textoInforme} />}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <details className="rounded-2xl border border-slate-200 bg-white shadow-sm" open>
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">
            Graduación alcohólica según bebida
          </summary>
          <div className="border-t border-slate-100 px-4 py-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="py-2 font-semibold">Bebida</th>
                  <th className="py-2 font-semibold">Graduación</th>
                </tr>
              </thead>
              <tbody>
                {GRADUACIONES.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="py-2">{item.bebida}</td>
                    <td className="py-2">{item.graduacionLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-slate-500">
              Graduación expresada como % de etanol en 100 ml.
            </p>
          </div>
        </details>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-4 py-3 text-sm font-semibold text-slate-800">UBE por copas</div>
          <div className="border-t border-slate-100 px-4 py-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="py-2 font-semibold">Bebida</th>
                  <th className="py-2 font-semibold">Volumen</th>
                  <th className="py-2 font-semibold">UBE</th>
                </tr>
              </thead>
              <tbody>
                {UBE_POR_COPAS.map((grupo) =>
                  grupo.lineas.map((linea, index) => (
                    <tr
                      key={`${grupo.bebida}-${linea.volumen}`}
                      className={index === 0 ? 'border-t border-slate-100' : ''}
                    >
                      <td className="py-2 align-top">{index === 0 ? grupo.bebida : ''}</td>
                      <td className="py-2">{linea.volumen}</td>
                      <td className="py-2">{linea.ube}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
          <p className="font-semibold text-slate-800">Fórmulas usadas</p>
          <p className="mt-2">Alcohol (g) = ml x graduación x 0,785 / 100</p>
          <p>Alcoholemia estimada = (gramos de alcohol / peso en kg) x constante</p>
          <p>Constante en mujeres = 0,55</p>
          <p>Constante en varones = 0,68</p>
          <p>Calorías = gramos de alcohol x 7</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          <p className="font-semibold text-slate-800">Riesgo orientativo</p>
          <p className="mt-2">Bajo riesgo: &lt; 2 UBE/día en mujeres, &lt; 4 UBE/día en varones.</p>
          <p>Riesgo medio: 2-4 UBE/día en mujeres, 4-6 UBE/día en varones.</p>
          <p>Riesgo alto: ≥ 4 UBE/día en mujeres, ≥ 6 UBE/día en varones.</p>
        </div>
      </section>
    </main>
  );
}

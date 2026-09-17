'use client';

import { useMemo, useState } from 'react';

import CollapsiblePanel from '@/components/CollapsiblePanel';

type Resident = { id: number | string; name: string; year: 1 | 2 | 3 | 4; trauma: boolean };
type Pairing = { resident: string; adjunto: string };
type ResidentKind = 'Adjunto' | 'R1' | 'R1 Trauma' | 'R2' | 'R3' | 'R4';

const inputClass =
  'w-full rounded-lg border border-[#cbdcdf] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#3d7684] focus:ring-2 focus:ring-[#3d7684]/15';
const primaryButton =
  'rounded-lg bg-[#1f4c57] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2b6572] disabled:cursor-not-allowed disabled:opacity-45';

function lines(value: string) {
  return value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function joinNames(names: string[]) {
  const uppercaseNames = names.map((name) => name.toUpperCase());
  if (uppercaseNames.length <= 1) return uppercaseNames[0] ?? '';
  if (uppercaseNames.length === 2) return uppercaseNames.join(' y ');
  return `${uppercaseNames.slice(0, -1).join(', ')} y ${uppercaseNames[uppercaseNames.length - 1]}`;
}

function localDate(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

function formatDateTime(value: Date) {
  return value.toLocaleString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(minutes: number) {
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  if (!rest) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

function changeTime(value: string, amount: number) {
  const [hours, minutes] = value.split(':').map(Number);
  const total = (hours * 60 + minutes + amount + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function TimeStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0 text-sm font-semibold text-slate-700">
      {label}
      <span className="mt-1 flex h-10 w-full min-w-0 max-w-full items-stretch overflow-hidden rounded-lg border border-[#cbdcdf] bg-white focus-within:border-[#3d7684] focus-within:ring-2 focus-within:ring-[#3d7684]/15">
        <input
          type="time"
          step={900}
          className="h-full w-full min-w-0 flex-1 border-0 bg-transparent px-3 py-0 text-sm text-slate-800 outline-none"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="flex w-9 flex-col border-l border-[#dfe9eb]">
          <button
            type="button"
            className="flex-1 border-b border-[#dfe9eb] text-xs leading-none text-[#1f4c57] hover:bg-[#edf6f7]"
            onClick={() => onChange(changeTime(value, 15))}
            aria-label={`Avanzar ${label.toLowerCase()} 15 minutos`}
          >
            ▲
          </button>
          <button
            type="button"
            className="flex-1 text-xs leading-none text-[#1f4c57] hover:bg-[#edf6f7]"
            onClick={() => onChange(changeTime(value, -15))}
            aria-label={`Retroceder ${label.toLowerCase()} 15 minutos`}
          >
            ▼
          </button>
        </span>
      </span>
    </label>
  );
}

export default function GuardiaClient() {
  const today = new Date().toISOString().slice(0, 10);
  const [residentsText, setResidentsText] = useState('');
  const [adjuntosText, setAdjuntosText] = useState('');
  const [pairings, setPairings] = useState<Pairing[] | null>(null);
  const [nightDate, setNightDate] = useState(today);
  const [nightStart, setNightStart] = useState('00:00');
  const [nightEnd, setNightEnd] = useState('08:00');
  const [periods, setPeriods] = useState(2);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: number; kind: ResidentKind }>>([
    { id: 1, kind: 'Adjunto' },
    { id: 2, kind: 'Adjunto' },
    { id: 3, kind: 'Adjunto' },
    { id: 4, kind: 'Adjunto' },
    { id: 5, kind: 'R2' },
    { id: 6, kind: 'R1' },
    { id: 7, kind: 'R1' },
    { id: 8, kind: 'R1' },
  ]);

  const canPair = lines(residentsText).length > 0 && lines(adjuntosText).length > 0;

  const groupedPairings = useMemo(() => {
    if (!pairings) return null;
    const groups: Array<{ adjunto: string; residents: string[] }> = [];
    pairings.forEach(({ resident, adjunto }) => {
      if (adjunto === 'Palomita') {
        groups.push({ adjunto, residents: [resident] });
        return;
      }
      const group = groups.find((item) => item.adjunto === adjunto);
      if (group) group.residents.push(resident);
      else groups.push({ adjunto, residents: [resident] });
    });
    return groups;
  }, [pairings]);

  const createPairings = () => {
    const residentNames = shuffle(lines(residentsText));
    const adjuntos = shuffle(lines(adjuntosText));
    const difference = residentNames.length - adjuntos.length;
    const result: Pairing[] = [];

    if (difference === 1) {
      // Solo en este caso queda una persona sin adjunto fijo: es la Palomita.
      residentNames.slice(0, adjuntos.length).forEach((resident, index) => {
        result.push({ resident, adjunto: adjuntos[index] });
      });
      result.push({ resident: residentNames[residentNames.length - 1], adjunto: 'Palomita' });
    } else if (difference >= 2) {
      // Si sobran dos o más residentes, se reparten entre los adjuntos.
      residentNames.forEach((resident, index) => {
        result.push({ resident, adjunto: adjuntos[index % adjuntos.length] });
      });
    } else {
      // Si hay tantos o menos residentes que adjuntos, cada uno recibe como
      // máximo un residente y los adjuntos sobrantes quedan libres.
      residentNames.forEach((resident, index) => {
        result.push({ resident, adjunto: adjuntos[index] });
      });
    }
    setPairings(result);
  };

  const splitResult = useMemo(() => {
    if (!nightDate || !nightStart || !nightEnd) return null;

    const start = localDate(nightDate, nightStart);
    let end = localDate(nightDate, nightEnd);
    if (end <= start) {
      end = new Date(end);
      end.setDate(end.getDate() + 1);
    }
    const count = Math.max(2, Math.min(8, periods));
    const duration = (end.getTime() - start.getTime()) / count;
    const startOffset = start.getTimezoneOffset();
    const endOffset = end.getTimezoneOffset();
    const offsetDifference = endOffset - startOffset;

    return {
      changes: Array.from(
        { length: count - 1 },
        (_, index) => new Date(start.getTime() + duration * (index + 1))
      ),
      restMinutes: duration / 60000,
      timeChange:
        offsetDifference === 0
          ? null
          : {
              direction: offsetDifference > 0 ? 'atrasa' : 'adelanta',
              hours: Math.abs(offsetDifference) / 60,
            },
    };
  }, [nightDate, nightStart, nightEnd, periods]);

  const shiftResult = useMemo(() => {
    const first: Resident[] = [];
    const second: Resident[] = [];
    if (!teamMembers.length) return null;

    const count = (kind: ResidentKind) =>
      teamMembers.filter((member) => member.kind === kind).length;
    const adjuntoCount = count('Adjunto');
    const r1Count = count('R1');
    const r1TraumaCount = count('R1 Trauma');
    const r2Count = count('R2');
    const r3Count = count('R3');
    const r4Count = count('R4');
    const seniorResidents: Resident[] = [];
    let id = 0;
    const addGroup = (count: number, name: string, year: 1 | 2 | 3 | 4, trauma = false) => {
      for (let index = 0; index < count; index += 1) {
        seniorResidents.push({ id: `${name}-${id++}`, name, year, trauma });
      }
    };

    addGroup(adjuntoCount, 'Adjunto', 4);
    addGroup(r4Count, 'R4', 4);
    addGroup(r3Count, 'R3', 3);
    addGroup(r2Count, 'R2', 2);

    // Los residentes mayores se ordenan de mayor a menor y se alternan.
    seniorResidents.forEach((resident, index) => {
      (index % 2 === 0 ? first : second).push(resident);
    });

    const total = seniorResidents.length + r1Count + r1TraumaCount;
    const targetFirst = Math.ceil(total / 2);
    const totalR1 = r1Count + r1TraumaCount;
    const onlyTraumaWithSenior = totalR1 === 1 && r1TraumaCount === 1 && seniorResidents.length > 0;
    const firstR1Count = onlyTraumaWithSenior
      ? 0
      : Math.max(0, Math.min(totalR1, targetFirst - first.length));

    // El R1 Trauma pertenece al bloque R1. Solo se fuerza al primer turno
    // cuando hay más R1 o cuando no existen residentes mayores por encima.
    const r1Residents: Resident[] = [];
    for (let index = 0; index < r1TraumaCount; index += 1) {
      r1Residents.push({ id: `R1-Trauma-${index}`, name: 'R1 Trauma', year: 1, trauma: true });
    }
    const normalR1 = Array.from({ length: r1Count }, (_, index) => ({
      id: `R1-${index}`,
      name: 'R1',
      year: 1 as const,
      trauma: false,
    }));
    const orderedR1 = [...r1Residents.filter((resident) => resident.trauma), ...normalR1];
    const firstR1 = orderedR1.slice(0, firstR1Count);
    const secondR1 = orderedR1.slice(firstR1Count);
    if (onlyTraumaWithSenior) {
      second.push(...secondR1);
    } else {
      first.push(...firstR1);
      second.push(...secondR1);
    }
    return { first, second };
  }, [teamMembers]);

  const addTeamMember = (kind: ResidentKind) => {
    setTeamMembers((current) => [...current, { id: Date.now() + Math.random(), kind }]);
  };

  const removeTeamMember = (id: number) => {
    setTeamMembers((current) => current.filter((member) => member.id !== id));
  };

  const handleResidentDragStart = (event: React.DragEvent, kind: ResidentKind) => {
    event.dataTransfer.setData('text/plain', kind);
    event.dataTransfer.effectAllowed = 'copy';
  };

  const handleTeamDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const kind = event.dataTransfer.getData('text/plain') as ResidentKind;
    if (['Adjunto', 'R1', 'R1 Trauma', 'R2', 'R3', 'R4'].includes(kind)) addTeamMember(kind);
  };

  return (
    <div className="prevent-ios-zoom min-w-0 space-y-6 overflow-x-hidden">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8aa0a6]">
          Servicio de Urgencias
        </p>
        <h1 className="text-3xl font-semibold text-[#1f4c57]">Herramientas para la guardia</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Organización rápida de equipos y descansos durante la guardia. Los resultados son
          orientativos y deben ajustarse a la organización del servicio.
        </p>
      </header>

      <div className="space-y-6">
        <CollapsiblePanel title="Asignación Nivel 1 residentes–adjuntos">
          <div className="mb-5">
            <p className="mt-1 text-sm text-slate-600">
              Se barajan ambos grupos y se asigna cada residente a un adjunto. Los que excedan el
              número de adjuntos quedan como Palomita.
            </p>
          </div>
          <div className="mx-auto grid min-w-0 max-w-2xl gap-3 sm:grid-cols-2">
            <label className="block min-w-0 text-sm font-semibold text-slate-700">
              Residentes
              <textarea
                className={`${inputClass} mt-1 min-h-32`}
                placeholder="Un nombre por línea"
                value={residentsText}
                onChange={(event) => setResidentsText(event.target.value)}
              />
            </label>
            <label className="block min-w-0 text-sm font-semibold text-slate-700">
              Adjuntos
              <textarea
                className={`${inputClass} mt-1 min-h-32`}
                placeholder="Un nombre por línea"
                value={adjuntosText}
                onChange={(event) => setAdjuntosText(event.target.value)}
              />
            </label>
          </div>
          <button
            type="button"
            className={`${primaryButton} mx-auto mt-4 block`}
            disabled={!canPair}
            onClick={createPairings}
          >
            REPARTE!
          </button>
          {groupedPairings ? (
            <div className="mx-auto mt-5 max-w-xl overflow-hidden rounded-xl border border-[#dfe9eb]">
              {groupedPairings.map((group, index) => (
                <div
                  key={`${group.adjunto}-${index}`}
                  className="flex items-center justify-center gap-2 border-b border-[#edf2f3] px-3 py-2.5 text-center text-sm last:border-b-0"
                >
                  {group.adjunto === 'Palomita' ? (
                    <span className="font-semibold text-slate-800">
                      {group.residents[0].toUpperCase()}
                    </span>
                  ) : (
                    <span className="font-semibold text-slate-800">
                      {joinNames(group.residents)}
                    </span>
                  )}
                  {group.adjunto === 'Palomita' ? (
                    <span className="rounded-full bg-[#fff1df] px-2 py-1 text-xs font-semibold text-[#955d1e]">
                      ★ Palomita
                    </span>
                  ) : (
                    <span className="text-[#2b6572]">
                      {group.residents.length === 1 ? 'estará' : 'estarán'} con{' '}
                      <strong className="uppercase">{group.adjunto}</strong>
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </CollapsiblePanel>

        <CollapsiblePanel title="Hora de partir">
          <div className="mb-5">
            <p className="mt-1 text-sm text-slate-600">
              Divide el periodo nocturno en partes iguales. La fecha permite calcular correctamente
              los cambios de hora (verano/invierno).
            </p>
          </div>
          <div className="mx-auto grid min-w-0 max-w-2xl gap-3 sm:grid-cols-2">
            <label className="block min-w-0 text-sm font-semibold text-slate-700">
              Fecha de inicio
              <input
                type="date"
                className={`${inputClass} mt-1`}
                value={nightDate}
                onChange={(event) => setNightDate(event.target.value)}
              />
            </label>
            <label className="block min-w-0 text-sm font-semibold text-slate-700">
              Número de periodos
              <input
                type="number"
                min={2}
                max={8}
                className={`${inputClass} mt-1`}
                value={periods}
                onChange={(event) => setPeriods(Number(event.target.value) || 2)}
              />
            </label>
            <TimeStepper label="Comienza a las" value={nightStart} onChange={setNightStart} />
            <TimeStepper label="Termina a las" value={nightEnd} onChange={setNightEnd} />
          </div>
          {splitResult ? (
            <div className="mt-5 rounded-xl bg-[#edf6f7] p-4">
              <p className="text-sm font-semibold text-[#1f4c57]">Hora de cambio</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {splitResult.changes.map((date) => (
                  <span
                    key={date.toISOString()}
                    className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-[#2b6572]"
                  >
                    {formatDateTime(date)}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm font-semibold text-[#1f4c57]">
                Descansa cada turno: {formatDuration(splitResult.restMinutes)}
              </p>
              {splitResult.timeChange ? (
                <p className="mt-2 rounded-lg border border-[#e8c98c] bg-[#fff8e8] px-3 py-2 text-sm font-semibold text-[#805b1d]">
                  Cambio horario detectado: el reloj {splitResult.timeChange.direction}{' '}
                  {formatDuration(splitResult.timeChange.hours * 60)}.
                </p>
              ) : null}
              <p className="mt-3 text-xs text-slate-600">
                Se ha considerado que una hora final igual o anterior a la inicial corresponde al
                día siguiente.
              </p>
            </div>
          ) : null}
        </CollapsiblePanel>
      </div>

      <CollapsiblePanel title="Reparto nocturno">
        <div className="mb-5">
          <p className="mt-1 text-sm text-slate-600">
            Haz doble clic o arrastra una persona al equipo. El reparto es una sugerencia.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 rounded-xl bg-[#f5f9fa] p-3">
          {(['Adjunto', 'R1', 'R1 Trauma', 'R2', 'R3', 'R4'] as ResidentKind[]).map((kind) => (
            <button
              key={kind}
              type="button"
              draggable
              onDragStart={(event) => handleResidentDragStart(event, kind)}
              onDoubleClick={() => addTeamMember(kind)}
              className="group flex min-w-[76px] flex-col items-center gap-1 rounded-xl border border-[#dfe9eb] bg-white px-3 py-2 text-[#1f4c57] shadow-sm hover:border-[#3d7684] hover:bg-[#edf6f7]"
              title="Doble clic o arrastra al equipo"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e7f0f2] text-[#2b6572] transition group-hover:bg-[#cfe4e7]"
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                  <circle cx="12" cy="7" r="3.5" />
                  <path d="M5.5 20c.4-4 2.5-6 6.5-6s6.1 2 6.5 6z" />
                </svg>
              </span>
              <span className="text-xs font-bold">{kind}</span>
            </button>
          ))}
        </div>
        <div
          className="mt-4 min-h-28 rounded-xl border-2 border-dashed border-[#b9d0d4] bg-[#fbfdfd] p-4 transition hover:border-[#3d7684] hover:bg-[#f5fbfb]"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleTeamDrop}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-[#1f4c57]">Equipo de guardia</h3>
            <span className="rounded-full bg-[#edf6f7] px-2.5 py-1 text-xs font-semibold text-[#2b6572]">
              {teamMembers.length}
            </span>
          </div>
          {teamMembers.length ? (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {teamMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('resident-id', String(member.id));
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                  onClick={() => removeTeamMember(member.id)}
                  className="rounded-full border border-[#cbdcdf] bg-white px-3 py-1.5 text-sm font-semibold text-[#1f4c57] shadow-sm hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                  title="Pulsa o arrastra fuera para quitar"
                >
                  {member.kind} <span className="ml-1 text-slate-400">×</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Arrastra aquí las personas o haz doble clic en una categoría.
            </p>
          )}
        </div>
        {shiftResult ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ShiftCard title="Primer turno" residents={shiftResult.first} />
            <ShiftCard title="Segundo turno" residents={shiftResult.second} />
          </div>
        ) : null}
      </CollapsiblePanel>
    </div>
  );
}

function ShiftCard({ title, residents }: { title: string; residents: Resident[] }) {
  const tagClass = (resident: Resident) => {
    if (resident.name === 'Adjunto') return 'border-[#b9d9df] bg-[#e5f4f6] text-[#245b66]';
    if (resident.trauma) return 'border-[#f0c88f] bg-[#fff1dc] text-[#875719]';
    if (resident.name === 'R1') return 'border-[#cbdcf2] bg-[#edf4fc] text-[#315b87]';
    if (resident.name === 'R2') return 'border-[#c9e2d1] bg-[#edf8f0] text-[#326443]';
    if (resident.name === 'R3') return 'border-[#d9cfee] bg-[#f3effb] text-[#5a4780]';
    return 'border-[#d7d9de] bg-[#f1f3f5] text-[#4c5663]';
  };

  return (
    <div className="rounded-xl border border-[#dfe9eb] bg-[#f8fbfb] p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#1f4c57]">{title}</h3>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-500">
          {residents.length}
        </span>
      </div>
      {residents.length ? (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {residents.map((resident) => (
            <span
              key={resident.id}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${tagClass(resident)}`}
            >
              {resident.name}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Sin residentes</p>
      )}
    </div>
  );
}

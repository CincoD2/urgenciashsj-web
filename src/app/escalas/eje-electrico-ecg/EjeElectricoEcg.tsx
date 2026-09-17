'use client';

import { useState, type PointerEvent } from 'react';

type AxisCategory = 'normal' | 'izquierda' | 'derecha' | 'extremo';

const LEADS = [
  { name: 'I', angle: 0 },
  { name: 'II', angle: 60 },
  { name: 'III', angle: 120 },
  { name: 'aVR', angle: -150 },
  { name: 'aVL', angle: -30 },
  { name: 'aVF', angle: 90 },
];

const AXIS_SNAP_POINTS = [-180, -150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180];
const AXIS_SNAP_TOLERANCE = 4;

const CATEGORY_LABELS: Record<AxisCategory, string> = {
  normal: 'Eje normal',
  izquierda: 'Desviación izquierda',
  derecha: 'Desviación derecha',
  extremo: 'Eje extremo',
};

function classifyAxis(axis: number): AxisCategory {
  if (axis >= -30 && axis <= 90) return 'normal';
  if (axis < -30 && axis >= -90) return 'izquierda';
  if (axis > 90 && axis <= 180) return 'derecha';
  return 'extremo';
}

function axisDescription(category: AxisCategory) {
  return {
    normal: 'Entre −30° y +90°. El QRS suele ser positivo en I y aVF.',
    izquierda: 'Entre −30° y −90°. El QRS suele ser positivo en I y negativo en aVF.',
    derecha: 'Entre +90° y +180°. El QRS suele ser negativo en I y positivo en aVF.',
    extremo: 'Entre −90° y ±180°. El QRS suele ser negativo en I y aVF.',
  }[category];
}

function projection(axis: number, leadAngle: number) {
  return Math.cos(((axis - leadAngle) * Math.PI) / 180);
}

function snapAxis(value: number) {
  const closest = AXIS_SNAP_POINTS.reduce((best, point) =>
    Math.abs(point - value) < Math.abs(best - value) ? point : best,
  );
  return Math.abs(closest - value) <= AXIS_SNAP_TOLERANCE ? closest : value;
}

function formatAxis(value: number) {
  return value > 0 ? `+${value}°` : `${value}°`;
}

function degreeLabel(value: number) {
  if (Math.abs(value) === 180) return '±180°';
  if (value > 0) return `+${value}°`;
  return value < 0 ? `−${Math.abs(value)}°` : '0°';
}

function ecgPath(amplitude: number) {
  const base = 50;
  const rHeight = 5 + ((amplitude + 1) / 2) * 28;
  const sDepth = 5 + ((1 - amplitude) / 2) * 28;
  const positiveWaveSign = -1;
  const beat = (offset: number, first = false) => [
    `${first ? 'M' : 'L'} ${offset} ${base}`,
    `L ${offset + 26} ${base}`,
    `C ${offset + 29} ${base} ${offset + 31} ${base + positiveWaveSign * 8} ${offset + 35} ${base + positiveWaveSign * 8}`,
    `C ${offset + 42} ${base + positiveWaveSign * 8} ${offset + 44} ${base} ${offset + 48} ${base}`,
    `L ${offset + 51} ${base}`,
    `L ${offset + 58} ${base}`,
    `L ${offset + 63} ${base - rHeight}`,
    `L ${offset + 69} ${base + sDepth}`,
    `L ${offset + 76} ${base}`,
    `L ${offset + 82} ${base}`,
    `C ${offset + 88} ${base} ${offset + 91} ${base + positiveWaveSign * 18} ${offset + 98} ${base + positiveWaveSign * 18}`,
    `C ${offset + 105} ${base + positiveWaveSign * 18} ${offset + 108} ${base} ${offset + 116} ${base}`,
    `L ${offset + 165} ${base}`,
  ].join(' ');
  return `${beat(0, true)} ${beat(175)} ${beat(350)} ${beat(525)} L 705 ${base}`;
}

function pointForAngle(angle: number, radius: number, center = 210) {
  const radians = (angle * Math.PI) / 180;
  const round = (value: number) => Math.round(value * 10000) / 10000;
  return {
    x: round(center + Math.cos(radians) * radius),
    y: round(center + Math.sin(radians) * radius),
  };
}

function randomAxis(exclude?: number) {
  let next = Math.round(Math.random() * 360 - 180);
  while (exclude !== undefined && next === exclude) next = Math.round(Math.random() * 360 - 180);
  return next;
}

export default function EjeElectricoEcg() {
  const [axis, setAxis] = useState(45);
  const [mode, setMode] = useState<'explorar' | 'quiz'>('explorar');
  const [quizAxis, setQuizAxis] = useState(() => randomAxis());
  const [quizAnswer, setQuizAnswer] = useState<AxisCategory | null>(null);
  const [quizResult, setQuizResult] = useState<'correcto' | 'incorrecto' | 'pasapalabra' | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [draggingAxis, setDraggingAxis] = useState(false);
  const [showQuizCircle, setShowQuizCircle] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [finishNotice, setFinishNotice] = useState('');
  const [restartConfirm, setRestartConfirm] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);

  const quizCategory = classifyAxis(quizAxis);

  function startQuiz() {
    setMode('quiz');
    setQuizAxis(randomAxis());
    setQuizAnswer(null);
    setQuizResult(null);
    setScore({ correct: 0, total: 0 });
    setShowQuizCircle(false);
    setQuizFinished(false);
    setFinishNotice('');
    setRestartConfirm(false);
    setExitConfirm(false);
  }

  function answerQuiz(answer: AxisCategory) {
    if (quizResult) return;
    setQuizAnswer(answer);
    const correct = answer === quizCategory;
    setQuizResult(correct ? 'correcto' : 'incorrecto');
    setShowQuizCircle(false);
    setFinishNotice('');
    setScore((current) => ({ correct: current.correct + (correct ? 1 : 0), total: current.total + 1 }));
  }

  function passQuiz() {
    setQuizAnswer(null);
    setQuizResult('pasapalabra');
    setShowQuizCircle(false);
    setFinishNotice('');
    setRestartConfirm(false);
    setExitConfirm(false);
    setScore((current) => ({ ...current, total: current.total + 1 }));
  }

  function nextQuestion() {
    setQuizAxis(randomAxis(quizAxis));
    setQuizAnswer(null);
    setQuizResult(null);
    setShowQuizCircle(false);
    setFinishNotice('');
    setRestartConfirm(false);
  }

  function restartQuiz() {
    setMode('quiz');
    setScore({ correct: 0, total: 0 });
    setQuizAxis(randomAxis());
    setQuizAnswer(null);
    setQuizResult(null);
    setShowQuizCircle(false);
    setQuizFinished(false);
    setFinishNotice('');
    setRestartConfirm(false);
    setExitConfirm(false);
  }

  function requestRestart() {
    setRestartConfirm(true);
    setShowQuizCircle(false);
  }

  function continueQuiz() {
    setQuizFinished(false);
    setQuizAxis(randomAxis(quizAxis));
    setQuizAnswer(null);
    setQuizResult(null);
    setRestartConfirm(false);
  }

  function handleExploreClick() {
    if (mode === 'quiz' && !quizFinished && score.total > 0) {
      setExitConfirm(true);
      return;
    }
    setMode('explorar');
  }

  function exitPractice() {
    setMode('explorar');
    setScore({ correct: 0, total: 0 });
    setQuizAnswer(null);
    setQuizResult(null);
    setQuizFinished(false);
    setRestartConfirm(false);
    setExitConfirm(false);
  }

  function finishQuiz() {
    if (score.total < 10) {
      setFinishNotice('Para ponerte a prueba necesitas contestar al menos 10 preguntas');
      return;
    }
    setQuizFinished(true);
    setFinishNotice('');
  }

  function quizVerdict() {
    const percentage = (score.correct / score.total) * 100;
    if (percentage === 100) return 'Eres cardiólogo cum laude';
    if (percentage >= 80) return 'Puedes pasar planta sin nadie que te supervise';
    if (percentage >= 60) return 'R1 fijo';
    if (percentage >= 50) return 'Para el MIR te sobra';
    if (percentage >= 25) return 'Dale una vuelta a la teoría que acertaste al azar';
    return 'En el eje del mal';
  }

  const shownAxis = mode === 'quiz' ? quizAxis : axis;
  const shownCategory = classifyAxis(shownAxis);
  const quizPercentage = score.total ? Math.round((score.correct / score.total) * 100) : 0;

  function setAxisFromPointer(event: PointerEvent<SVGCircleElement>) {
    const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!bounds) return;

    const x = event.clientX - (bounds.left + bounds.width / 2);
    const y = event.clientY - (bounds.top + bounds.height / 2);
    let nextAxis = Math.round((Math.atan2(y, x) * 180) / Math.PI);
    if (nextAxis > 180) nextAxis -= 360;
    if (nextAxis < -180) nextAxis += 360;
    setAxis(snapAxis(nextAxis));
  }

  return (
    <main className="escala-wrapper eje-page space-y-6" style={{ padding: 24 }}>
      <div className="eje-heading">
        <div>
          <p className="eje-kicker">Herramienta de aprendizaje</p>
          <h1 className="text-2xl font-semibold text-slate-900">Eje eléctrico del ECG</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Explora la relación entre el eje del QRS y las derivaciones bipolares, o practica con casos rápidos.
          </p>
        </div>
        <div className="eje-tabs" aria-label="Modo de la herramienta">
          <button className={mode === 'explorar' ? 'activo' : ''} onClick={handleExploreClick} type="button">Explorar</button>
          <button className={mode === 'quiz' ? 'activo' : ''} onClick={startQuiz} type="button">Practicar</button>
        </div>
      </div>

      <section className="eje-card">
        {mode === 'explorar' && <div className="eje-toolbar">
          <div>
            <span className="eje-label">Eje seleccionado</span>
            <strong className="eje-axis-value">{shownAxis > 0 ? '+' : ''}{shownAxis}°</strong>
          </div>
          <span className={`eje-badge eje-badge-${shownCategory}`}>{CATEGORY_LABELS[shownCategory]}</span>
        </div>}

        <div className={`eje-visual-grid${mode === 'quiz' ? ' eje-visual-grid-quiz' : ''}`}>
          {mode === 'explorar' ? <div className="eje-circle-wrap">
            <svg className="eje-circle" viewBox="-20 -20 460 460" role="img" aria-label={`Círculo del eje eléctrico: ${shownAxis} grados`}>
              <defs>
                <marker id="eje-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#3d7684" /></marker>
              </defs>
              <circle cx="210" cy="210" r="184" fill="#f8fafc" stroke="#cfe2e6" strokeWidth="2" />
              <path className={`eje-sector eje-sector-izquierda ${shownCategory === 'izquierda' ? 'activo' : ''}`} d="M210 210 L210 26 A184 184 0 0 1 369 118 Z" fill="#e8f2f4" />
              <path className={`eje-sector eje-sector-normal ${shownCategory === 'normal' ? 'activo' : ''}`} d="M210 210 L369 118 A184 184 0 0 1 210 394 Z" fill="#d9ece9" />
              <path className={`eje-sector eje-sector-derecha ${shownCategory === 'derecha' ? 'activo' : ''}`} d="M210 210 L210 394 A184 184 0 0 1 26 210 Z" fill="#fff4dc" />
              <path className={`eje-sector eje-sector-extremo ${shownCategory === 'extremo' ? 'activo' : ''}`} d="M210 210 L26 210 A184 184 0 0 1 210 26 Z" fill="#f3e9ee" />
              <line x1="210" y1="26" x2="210" y2="394" stroke="#73858b" strokeWidth="1" />
              <line x1="26" y1="210" x2="394" y2="210" stroke="#73858b" strokeWidth="1" />
              {AXIS_SNAP_POINTS.filter((point) => point !== -180).map((point) => {
                const inner = pointForAngle(point, 184);
                const outer = pointForAngle(point, 193);
                const labelPoint = pointForAngle(point, 220);
                const horizontal = Math.cos((point * Math.PI) / 180);
                const textAnchor = horizontal > 0.45 ? 'end' : horizontal < -0.45 ? 'start' : 'middle';
                return <g key={`degree-${point}`}><line className="eje-degree-tick" x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} /><text className="eje-degree-label" x={labelPoint.x} y={labelPoint.y} textAnchor={textAnchor} dominantBaseline="middle">{degreeLabel(point)}</text></g>;
              })}
              {LEADS.map((lead) => {
                const point = pointForAngle(lead.angle, 174);
                const labelPoint = pointForAngle(lead.angle, 191);
                return <g key={lead.name}><line x1="210" y1="210" x2={point.x} y2={point.y} stroke="#111827" strokeWidth="1" markerEnd="url(#eje-arrow)" /><text x={labelPoint.x} y={labelPoint.y} textAnchor="middle" dominantBaseline="middle" className="eje-lead-label">{lead.name}</text></g>;
              })}
              <line x1="210" y1="210" x2={pointForAngle(shownAxis, 164).x} y2={pointForAngle(shownAxis, 164).y} stroke="#3d7684" strokeWidth="4" strokeLinecap="round" markerEnd="url(#eje-arrow)" />
              <circle
                className={`eje-axis-handle${draggingAxis ? ' arrastrando' : ''}`}
                cx={pointForAngle(shownAxis, 164).x}
                cy={pointForAngle(shownAxis, 164).y}
                r="12"
                fill="transparent"
                pointerEvents={mode === 'explorar' ? 'auto' : 'none'}
                role="slider"
                aria-label="Mover eje eléctrico"
                aria-valuemin={-180}
                aria-valuemax={180}
                aria-valuenow={shownAxis}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setDraggingAxis(true);
                  setAxisFromPointer(event);
                }}
                onPointerMove={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) setAxisFromPointer(event);
                }}
                onPointerUp={(event) => {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                  setDraggingAxis(false);
                }}
                onPointerCancel={() => setDraggingAxis(false)}
              />
              <circle cx="210" cy="210" r="4" fill="#3d7684" />
            </svg>
          </div> : <div className="eje-quiz-panel">
            {restartConfirm ? <div className="eje-quiz-restart-confirm">
              <p className="eje-quiz-kicker">Reiniciar práctica</p>
              <h2>¿Quieres empezar de nuevo?</h2>
              <p>Se perderá la puntuación actual y se generará un nuevo caso.</p>
              <div className="eje-confirm-actions"><button className="eje-action-secondary" type="button" onClick={() => setRestartConfirm(false)}>Volver</button><button className="eje-action-primary" type="button" onClick={restartQuiz}>Reiniciar</button></div>
            </div> : quizFinished ? <div className="eje-quiz-finished">
              <p className="eje-quiz-kicker">Resultado final</p>
              <h2>{score.correct}/{score.total} aciertos · {quizPercentage}%</h2>
              <p className="eje-quiz-verdict">{quizVerdict()}</p>
              <div className="eje-result-actions"><button className="eje-quiz-restart-main" type="button" onClick={requestRestart}>Reiniciar</button><button className="eje-action-secondary" type="button" onClick={continueQuiz}>Continuar</button></div>
            </div> : <>
              <div className="eje-quiz-panel-header"><p className="eje-quiz-kicker">Caso de práctica</p><span className="eje-quiz-score">Puntuación <strong>{score.correct}/{score.total}</strong></span></div>
              <h2>¿Qué tipo de eje representa este ECG?</h2>
              <p>Observa la polaridad del QRS en las derivaciones bipolares y elige la opción más adecuada.</p>
              <div className="eje-answer-grid">
                {(Object.keys(CATEGORY_LABELS) as AxisCategory[]).map((answer) => <button key={answer} type="button" className={`${quizAnswer === answer ? 'seleccionado ' : ''}${quizResult && answer === quizCategory ? 'respuesta-correcta' : ''}`} onClick={() => answerQuiz(answer)}>{CATEGORY_LABELS[answer]}</button>)}
                <button type="button" className="eje-pass-option" onClick={passQuiz} disabled={Boolean(quizResult)}>Pasapalabra</button>
              </div>
              {quizResult && <div className={`eje-feedback ${quizResult}`}><strong>{quizResult === 'correcto' ? 'Correcto' : quizResult === 'pasapalabra' ? 'Pasapalabra' : 'No exactamente'}</strong><span>La respuesta es: {CATEGORY_LABELS[quizCategory]}. {axisDescription(quizCategory)}</span><button className="eje-link-button" type="button" onClick={() => setShowQuizCircle(true)}>Mostrar círculo correcto</button></div>}
              {finishNotice && <p className="eje-finish-notice">{finishNotice}</p>}
              <div className="eje-quiz-footer"><div className="eje-quiz-actions"><div className="eje-quiz-actions-left"><button className="eje-action-secondary" type="button" onClick={requestRestart} disabled={score.total === 0}>Reiniciar</button><button className="eje-action-quiet" type="button" onClick={finishQuiz}>Terminar</button></div><button className="eje-action-primary" type="button" onClick={nextQuestion} disabled={!quizResult}>Siguiente caso</button></div></div>
            </>}
          </div>}

          <div className="eje-ecg-panel">
            <div className="eje-ecg-title">Derivaciones bipolares</div>
            <div className="eje-ecg-paper">
              {LEADS.map((lead) => {
                const value = projection(shownAxis, lead.angle);
                return <div className="eje-lead-row" key={lead.name}><span>{lead.name}</span><svg viewBox="0 0 705 100" preserveAspectRatio="none" aria-label={`Derivación ${lead.name}`}><path d={ecgPath(value)} /></svg></div>;
              })}
            </div>
          </div>
        </div>

        {mode === 'quiz' && quizResult && showQuizCircle && <div className="eje-quiz-modal" role="dialog" aria-modal="true" aria-label="Círculo con el eje correcto" onClick={() => setShowQuizCircle(false)}>
          <div className="eje-quiz-modal-dialog" onClick={(event) => event.stopPropagation()}>
            <div className="eje-quiz-overlay-header"><strong>Eje correcto</strong><button type="button" onClick={() => setShowQuizCircle(false)} aria-label="Cerrar círculo">×</button></div>
          <svg viewBox="-20 -20 460 460" role="img" aria-label={`Eje correcto: ${quizAxis} grados`}>
            <defs><marker id="eje-overlay-arrow" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#3d7684" /></marker></defs>
            <circle cx="210" cy="210" r="184" fill="#f8fafc" stroke="#cfe2e6" strokeWidth="2" />
            <path d="M210 210 L210 26 A184 184 0 0 1 369 118 Z" fill="#e8f2f4" />
            <path d="M210 210 L369 118 A184 184 0 0 1 210 394 Z" fill="#d9ece9" />
            <path d="M210 210 L210 394 A184 184 0 0 1 26 210 Z" fill="#fff4dc" />
            <path d="M210 210 L26 210 A184 184 0 0 1 210 26 Z" fill="#f3e9ee" />
            <line x1="210" y1="210" x2={pointForAngle(quizAxis, 164).x} y2={pointForAngle(quizAxis, 164).y} stroke="#3d7684" strokeWidth="4" strokeLinecap="round" markerEnd="url(#eje-overlay-arrow)" />
            <circle cx="210" cy="210" r="4" fill="#3d7684" />
            <text x={pointForAngle(quizAxis, 218).x} y={pointForAngle(quizAxis, 218).y} textAnchor="middle" dominantBaseline="middle" className="eje-overlay-axis-text">{formatAxis(quizAxis)}</text>
          </svg>
          </div>
        </div>}

        {mode === 'explorar' ? (
          <div className="eje-slider-block">
            <div className="eje-slider-labels"><span>−180°</span><span>0°</span><span>+180°</span></div>
            <input aria-label="Seleccionar eje eléctrico" list="eje-axis-ticks" type="range" min="-180" max="180" step="1" value={axis} onChange={(event) => setAxis(snapAxis(Number(event.target.value)))} />
            <datalist id="eje-axis-ticks">{AXIS_SNAP_POINTS.map((point) => <option key={point} value={point} label={formatAxis(point)} />)}</datalist>
            <div className="eje-slider-ticks" aria-hidden="true">{AXIS_SNAP_POINTS.map((point) => <span key={point}>{formatAxis(point)}</span>)}</div>
          </div>
        ) : null}
      </section>

      <section className="eje-info-grid">
        <div className="eje-info-card"><span className="eje-info-number">01</span><div><h2>Cuadrantes</h2><p>I y aVF orientan rápidamente: positivo/positivo suele indicar un eje normal.</p></div></div>
        <div className="eje-info-card"><span className="eje-info-number">02</span><div><h2>Derivación isodifásica</h2><p>La derivación más equilibrada ayuda a localizar el eje perpendicular a ella.</p></div></div>
        <div className="eje-info-card"><span className="eje-info-number">03</span><div><h2>Interpretación</h2><p>Usa el resultado como apoyo educativo y confirma siempre el ECG completo.</p></div></div>
      </section>

      <p className="eje-disclaimer">Herramienta educativa. La clasificación del eje debe integrarse con el resto del ECG, la clínica y el contexto del paciente.</p>

      {exitConfirm && <div className="eje-practice-exit-modal" role="dialog" aria-modal="true" aria-label="Salir del modo Práctica" onClick={() => setExitConfirm(false)}>
        <div className="eje-practice-exit-dialog" onClick={(event) => event.stopPropagation()}>
          <p className="eje-quiz-kicker">Salir del modo Práctica</p>
          <h2>Si sales del modo Práctica se reiniciará la puntuación. ¿Estás seguro?</h2>
          <div className="eje-confirm-actions"><button className="eje-action-secondary" type="button" onClick={exitPractice}>Salir</button><button className="eje-action-primary" type="button" onClick={() => setExitConfirm(false)}>Continuar</button></div>
        </div>
      </div>}
    </main>
  );
}

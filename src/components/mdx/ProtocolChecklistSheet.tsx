'use client';

import type { ReactNode } from 'react';
import { useRef, useState } from 'react';

type ChecklistItem = {
  text: ReactNode;
  checked?: boolean;
};

type ChecklistSection = {
  title: string;
  items: ChecklistItem[];
  tone?: 'default' | 'warning' | 'success';
};

type ProcedureMedication = {
  drug: ReactNode;
  dose: ReactNode;
  onset: ReactNode;
};

type InfoCard = {
  title: string;
  body: ReactNode;
};

const SHEET_CSS = `
  .pcs-sheet {
    margin: 1.5rem 0;
    border: 1px solid #d7e5e8;
    border-radius: 30px;
    padding: 1.25rem;
    background:
      radial-gradient(circle at top right, rgba(61, 118, 132, 0.12), transparent 28%),
      linear-gradient(180deg, #f8fbfc 0%, #eef5f7 100%);
    box-shadow: 0 22px 52px rgba(61, 118, 132, 0.12);
    color: #0f172a;
  }

  .pcs-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .pcs-eyebrow {
    margin-bottom: 0.5rem;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #3d7684;
  }

  .pcs-title {
    margin: 0;
    font-size: 1.9rem;
    line-height: 1.05;
    font-weight: 800;
    color: #2b5d68;
  }

  .pcs-subtitle {
    max-width: 58rem;
    margin: 0.75rem 0 0;
    font-size: 0.98rem;
    line-height: 1.65;
    color: #47636a;
  }

  .pcs-toolbar {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.6rem;
    flex-shrink: 0;
  }

  .pcs-print-button {
    border: 0;
    border-radius: 999px;
    background: linear-gradient(135deg, #3d7684 0%, #2b5d68 100%);
    padding: 0.8rem 1rem;
    font-size: 0.86rem;
    font-weight: 800;
    color: #ffffff;
    cursor: pointer;
    box-shadow: 0 12px 24px rgba(61, 118, 132, 0.22);
    transition:
      transform 150ms ease,
      box-shadow 150ms ease,
      filter 150ms ease;
  }

  .pcs-print-button:hover {
    transform: translateY(-1px);
    filter: saturate(1.05);
    box-shadow: 0 16px 28px rgba(61, 118, 132, 0.28);
  }

  .pcs-print-help {
    max-width: 16rem;
    font-size: 0.75rem;
    line-height: 1.45;
    text-align: right;
    color: #5c757c;
  }

  .pcs-grid,
  .pcs-foot {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .pcs-grid--three .pcs-card--tall {
    grid-row: span 2;
  }

  .pcs-grid--three .pcs-card--right {
    grid-column: 2;
  }

  .pcs-card,
  .pcs-procedure,
  .pcs-meds {
    border: 1px solid rgba(61, 118, 132, 0.12);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 14px 32px rgba(61, 118, 132, 0.08);
    break-inside: avoid;
  }

  .pcs-card {
    overflow: hidden;
  }

  .pcs-card[data-tone='warning'] .pcs-card-head {
    background: linear-gradient(135deg, #fff6e8 0%, #feedd5 100%);
  }

  .pcs-card[data-tone='success'] .pcs-card-head {
    background: linear-gradient(135deg, #edf8f3 0%, #dff1e8 100%);
  }

  .pcs-card-head {
    padding: 0.95rem 1rem 0.8rem;
    background: linear-gradient(135deg, #f4fafb 0%, #e7f1f3 100%);
    border-bottom: 1px solid rgba(61, 118, 132, 0.1);
  }

  .pcs-card-title {
    margin: 0;
    font-size: 1.02rem;
    line-height: 1.3;
    font-weight: 800;
    color: #2b5d68;
  }

  .pcs-card-body {
    padding: 0.6rem 1rem 0.95rem;
  }

  .pcs-item {
    display: flex;
    gap: 0.8rem;
    align-items: flex-start;
    padding: 0.72rem 0;
    border-top: 1px solid rgba(148, 163, 184, 0.16);
  }

  .pcs-item:first-child {
    border-top: 0;
  }

  .pcs-toggle {
    appearance: none;
    border: 0;
    background: transparent;
    padding: 0;
    margin: 0;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .pcs-check {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 0.38rem;
    border: 1.5px solid #b8cdd3;
    background: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: transparent;
    font-size: 0.88rem;
    font-weight: 800;
    line-height: 1;
    transition:
      background-color 150ms ease,
      border-color 150ms ease,
      color 150ms ease,
      box-shadow 150ms ease,
      transform 150ms ease;
  }

  .pcs-toggle:hover .pcs-check {
    border-color: #3d7684;
    box-shadow: 0 0 0 4px rgba(61, 118, 132, 0.1);
  }

  .pcs-toggle[data-checked='true'] .pcs-check {
    border-color: #2f8b6f;
    background: #2f8b6f;
    color: #ffffff;
  }

  .pcs-item-text {
    flex: 1;
    font-size: 0.94rem;
    line-height: 1.55;
    color: #334155;
  }

  .pcs-procedure {
    margin-top: 1rem;
    overflow: hidden;
  }

  .pcs-procedure-head,
  .pcs-meds-head {
    padding: 1rem 1.15rem 0.9rem;
    border-bottom: 1px solid rgba(61, 118, 132, 0.1);
  }

  .pcs-procedure-head {
    background: linear-gradient(135deg, #f3fafb 0%, #e6f1f4 100%);
  }

  .pcs-procedure-title,
  .pcs-meds-title {
    margin: 0;
    font-size: 1.08rem;
    line-height: 1.3;
    font-weight: 800;
    color: #2b5d68;
  }

  .pcs-procedure-body {
    padding: 1rem 1.15rem 1.15rem;
  }

  .pcs-procedure-list {
    margin: 0;
    padding-left: 1.4rem;
    list-style: decimal;
  }

  .pcs-procedure-list li {
    margin: 0 0 0.52rem;
    padding-left: 0.3rem;
    line-height: 1.52;
    color: #334155;
  }

  .pcs-procedure-list li::marker {
    font-weight: 800;
    color: #2b5d68;
  }

  .pcs-meds {
    max-width: 50rem;
    margin: 1rem auto 0;
    overflow: hidden;
  }

  .pcs-meds + .pcs-foot {
    margin-top: 1.5rem;
  }

  .pcs-meds-head {
    background: linear-gradient(135deg, #3d7684 0%, #2b5d68 100%);
  }

  .pcs-meds-title {
    color: #ffffff;
    text-align: center;
  }

  .pcs-table {
    width: 100%;
    border-collapse: collapse;
  }

  .pcs-table th,
  .pcs-table td {
    padding: 0.82rem 1rem;
    text-align: left;
    border-top: 1px solid rgba(61, 118, 132, 0.12);
    font-size: 0.93rem;
  }

  .pcs-table th {
    background: #e6eff2;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #2b5d68;
    text-transform: uppercase;
  }

  .pcs-table td:first-child {
    background: #f3f7f8;
    font-weight: 800;
    color: #2b5d68;
  }

  .pcs-note {
    padding: 1rem 1.1rem;
  }

  .pcs-note-title {
    margin: 0 0 0.45rem;
    font-size: 1rem;
    font-weight: 800;
    color: #2b5d68;
  }

  .pcs-note-body {
    font-size: 0.94rem;
    line-height: 1.58;
    color: #334155;
  }

  @media (max-width: 900px) {
    .pcs-header {
      flex-direction: column;
    }

    .pcs-toolbar {
      width: 100%;
      align-items: stretch;
    }

    .pcs-print-help {
      max-width: none;
      text-align: left;
    }

    .pcs-grid,
    .pcs-foot {
      grid-template-columns: 1fr;
    }

    .pcs-grid--three .pcs-card--tall,
    .pcs-grid--three .pcs-card--right {
      grid-column: auto;
      grid-row: auto;
    }

    .pcs-title {
      font-size: 1.5rem;
    }
  }

  @media print {
    @page {
      size: A4;
      margin: 12mm;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
    }

    .pcs-sheet,
    .pcs-sheet * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .pcs-sheet {
      margin: 0;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: #ffffff;
      box-shadow: none;
    }

    .pcs-toolbar {
      display: none !important;
    }

    .pcs-header {
      margin-bottom: 0.6rem;
    }

    .pcs-eyebrow {
      font-size: 0.62rem;
    }

    .pcs-title {
      font-size: 1.38rem;
    }

    .pcs-subtitle {
      margin-top: 0.4rem;
      font-size: 0.82rem;
      line-height: 1.4;
      max-width: none;
    }

    .pcs-grid,
    .pcs-foot {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.5rem;
    }

    .pcs-grid--three .pcs-card--tall {
      grid-row: span 2;
    }

    .pcs-grid--three .pcs-card--right {
      grid-column: 2;
    }

    .pcs-card,
    .pcs-procedure,
    .pcs-meds {
      border: 1px solid #c9d9de;
      border-radius: 16px;
      box-shadow: none;
      break-inside: avoid-page;
      page-break-inside: avoid;
    }

    .pcs-card-head,
    .pcs-procedure-head,
    .pcs-meds-head {
      padding: 0.65rem 0.8rem;
    }

    .pcs-card-title,
    .pcs-procedure-title,
    .pcs-meds-title,
    .pcs-note-title {
      font-size: 0.9rem;
    }

    .pcs-card-body,
    .pcs-procedure-body,
    .pcs-note {
      padding: 0.55rem 0.8rem 0.7rem;
    }

    .pcs-item {
      gap: 0.5rem;
      padding: 0.34rem 0;
    }

    .pcs-check {
      width: 0.95rem;
      height: 0.95rem;
      border-radius: 0.24rem;
      font-size: 0.7rem;
    }

    .pcs-item-text,
    .pcs-note-body,
    .pcs-procedure-list li,
    .pcs-table th,
    .pcs-table td {
      font-size: 0.72rem;
      line-height: 1.28;
    }

    .pcs-table th,
    .pcs-table td {
      padding: 0.45rem 0.6rem;
    }

    .pcs-meds {
      max-width: none;
      margin-top: 0.5rem;
    }

    .pcs-meds + .pcs-foot {
      margin-top: 0.7rem;
    }
  }
`;

export function ProtocolChecklistSheet({
  title,
  subtitle,
  badge = 'Checklist clínico imprimible',
  sections,
  procedureTitle,
  procedureSteps,
  medicationsTitle,
  medications,
  notes = [],
}: {
  title: string;
  subtitle?: ReactNode;
  badge?: string;
  sections: ChecklistSection[];
  procedureTitle: string;
  procedureSteps: ReactNode[];
  medicationsTitle?: string;
  medications?: ProcedureMedication[];
  notes?: InfoCard[];
}) {
  const [checkedItems, setCheckedItems] = useState(() =>
    sections.map((section) => section.items.map((item) => Boolean(item.checked)))
  );
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const toggleItem = (sectionIndex: number, itemIndex: number) => {
    setCheckedItems((prev) =>
      prev.map((section, currentSectionIndex) =>
        currentSectionIndex === sectionIndex
          ? section.map((isChecked, currentItemIndex) =>
              currentItemIndex === itemIndex ? !isChecked : isChecked
            )
          : section
      )
    );
  };

  const handlePrint = () => {
    if (!sheetRef.current) return;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    iframe.srcdoc = `<!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${title}</title>
          <style>${SHEET_CSS}</style>
        </head>
        <body>
          ${sheetRef.current.outerHTML}
        </body>
      </html>`;

    const cleanup = () => {
      window.setTimeout(() => {
        iframe.remove();
      }, 300);
    };

    iframe.onload = () => {
      const printWindow = iframe.contentWindow;
      const printDocument = iframe.contentDocument;

      if (!printWindow || !printDocument) {
        cleanup();
        return;
      }

      const triggerPrint = () => {
        printWindow.focus();
        printWindow.print();
      };

      printWindow.addEventListener('afterprint', cleanup, { once: true });

      if ('fonts' in printDocument) {
        printDocument.fonts.ready.then(() => {
          window.setTimeout(triggerPrint, 150);
        });
      } else {
        window.setTimeout(triggerPrint, 200);
      }
    };

    document.body.appendChild(iframe);
  };

  const gridClassName = `pcs-grid${sections.length === 3 ? ' pcs-grid--three' : ''}`;

  return (
    <>
      <style>{SHEET_CSS}</style>
      <div ref={sheetRef} className="pcs-sheet not-prose">
        <div className="pcs-header">
          <div>
            <div className="pcs-eyebrow">{badge}</div>
            <h3 className="pcs-title">{title}</h3>
            {subtitle ? <p className="pcs-subtitle">{subtitle}</p> : null}
          </div>

          <div className="pcs-toolbar">
            <button type="button" className="pcs-print-button" onClick={handlePrint}>
              Imprimir / Guardar PDF
            </button>
          </div>
        </div>

        <div className={gridClassName}>
          {sections.map((section, sectionIndex) => (
            <section
              key={section.title}
              className={`pcs-card${
                sections.length === 3 && sectionIndex === 0
                  ? ' pcs-card--tall'
                  : sections.length === 3 && sectionIndex === 2
                    ? ' pcs-card--right'
                    : ''
              }`}
              data-tone={section.tone ?? 'default'}
            >
              <div className="pcs-card-head">
                <h4 className="pcs-card-title">{section.title}</h4>
              </div>

              <div className="pcs-card-body">
                {section.items.map((item, itemIndex) => {
                  const isChecked = checkedItems[sectionIndex]?.[itemIndex] ?? false;

                  return (
                    <div className="pcs-item" key={`${section.title}-${itemIndex}`}>
                      <button
                        type="button"
                        className="pcs-toggle"
                        data-checked={isChecked}
                        aria-pressed={isChecked}
                        aria-label={`Marcar elemento ${itemIndex + 1} de ${section.title}`}
                        onClick={() => toggleItem(sectionIndex, itemIndex)}
                      >
                        <span className="pcs-check" aria-hidden>
                          ✓
                        </span>
                      </button>
                      <div className="pcs-item-text">{item.text}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <section className="pcs-procedure">
          <div className="pcs-procedure-head">
            <h4 className="pcs-procedure-title">{procedureTitle}</h4>
          </div>

          <div className="pcs-procedure-body">
            <ol className="pcs-procedure-list">
              {procedureSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        </section>

        {medicationsTitle && medications?.length ? (
          <section className="pcs-meds">
            <div className="pcs-meds-head">
              <h4 className="pcs-meds-title">{medicationsTitle}</h4>
            </div>

            <table className="pcs-table">
              <thead>
                <tr>
                  <th>Fármaco</th>
                  <th>Dosis</th>
                  <th>Inicio de acción</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((medication, index) => (
                  <tr key={index}>
                    <td>{medication.drug}</td>
                    <td>{medication.dose}</td>
                    <td>{medication.onset}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {notes.length ? (
          <div className="pcs-foot">
            {notes.map((note) => (
              <section key={note.title} className="pcs-card">
                <div className="pcs-note">
                  <h4 className="pcs-note-title">{note.title}</h4>
                  <div className="pcs-note-body">{note.body}</div>
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}

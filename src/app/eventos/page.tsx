const calendarEmbed =
  "https://www.google.com/calendar/embed?color=%233b78e7&color=%23b90e28&src=0mg852tsvqgekgud1j3g2ud4rk@group.calendar.google.com&src=nis98jae2c55ge2bjnlilqpf0ps1jel3@import.calendar.google.com&mode=AGENDA";

export default function EventosPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Eventos</h1>
      <div className="overflow-hidden rounded-md border border-[#dfe9eb]">
        <iframe title="Calendario de eventos" src={calendarEmbed} className="h-[600px] w-full" />
      </div>
    </div>
  );
}

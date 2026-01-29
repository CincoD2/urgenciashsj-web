const calendarEmbed =
  "https://www.google.com/calendar/embed?color=%23b90e28&color=%23f691b2&src=0mg852tsvqgekgud1j3g2ud4rk@group.calendar.google.com&src=6d41e36m9j14i3c1ovrvum1qdihm4d36@import.calendar.google.com&mode=AGENDA";

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

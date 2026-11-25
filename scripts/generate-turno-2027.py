"""Generate six iCalendar files from the agreed 42-day rota, including holidays.
Run: python3 scripts/generate-turno-2027.py
The PDF was separately reviewed and uses the same assignments.
"""
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo
from collections import Counter

START, END = date(2027, 1, 11), date(2027, 12, 23)
SEQUENCE = 'N L L T M D N L L T M M N L L T M M TN L L T M M TN L L L D M TN L L L L M TN L L T L D'.split()
HOLIDAYS = {(1,1),(1,6),(3,19),(3,25),(3,26),(3,29),(4,8),(5,1),(6,23),(6,24),(10,9),(10,12),(11,1),(12,6),(12,8),(12,25),(12,31)}
HOURS = {'M': (8, 0, 15, 0), 'T': (15, 0, 22, 0), 'D': (8, 0, 22, 0), 'N': (20, 0, 23, 59), 'TN': (15, 0, 23, 59)}
NAMES = {'M':'Mañana', 'T':'Tarde', 'D':'Día', 'N':'Noche', 'TN':'Tarde-Noche'}
ZONE = ZoneInfo('Europe/Madrid')
OUT = Path(__file__).resolve().parents[1] / 'public/horarios/2027'

def base(d):
    return [SEQUENCE[((d-START).days - 7*g) % 42] for g in range(6)]

def shifts(d):
    b = base(d)
    if (d.month, d.day) not in HOLIDAYS or d.weekday() > 4:
        return b
    if d == date(2027, 3, 25):
        day, night = shifts(d+timedelta(days=1)).index('N'), b.index('TN')
    elif d.weekday() == 0:
        day, night = b.index('D'), b.index('N')
    elif d.weekday() == 4:
        day, night = base(d+timedelta(days=1)).index('N'), b.index('TN')
    else:
        day, night = b.index('T'), b.index('TN')
    assert day != night
    return ['D' if g == day else 'N' if g == night else 'L' for g in range(6)]

def utc(d, h, m):
    return datetime.combine(d, time(h,m), ZONE).astimezone(timezone.utc).strftime('%Y%m%dT%H%M%SZ')

def fold(line):
    # RFC 5545: at most 75 UTF-8 octets per physical line.
    parts, current = [], ''
    for ch in line:
        if len((current+ch).encode()) > 75:
            parts.append(current)
            current = ' '
        current += ch
    return '\r\n'.join(parts+[current])

def generate():
    assert len(SEQUENCE) == 42
    days = [START+timedelta(days=n) for n in range((END-START).days+1)]
    assert len(days) == 347
    for d in days:
        for g in range(1,6):
            assert base(d)[g] == base(d-timedelta(days=7))[g-1]
        if d.weekday()>4 or (d.month,d.day) in HOLIDAYS:
            assert Counter(shifts(d)) == Counter({'D':1,'N':1,'L':4})
    assert shifts(date(2027,3,25)) == ['L','N','D','L','L','L']
    assert shifts(date(2027,3,26)) == ['L','L','N','D','L','L']
    assert utc(date(2027,3,27),8,0).endswith('T070000Z')
    assert utc(date(2027,3,28),8,0).endswith('T060000Z')
    assert utc(date(2027,10,30),8,0).endswith('T060000Z')
    assert utc(date(2027,10,31),8,0).endswith('T070000Z')
    OUT.mkdir(parents=True, exist_ok=True)
    for g in range(6):
        lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//UrgenciasHSJ//Turno rodado 2027//ES','CALSCALE:GREGORIAN',f'X-WR-CALNAME:Urgencias 2027 - Grupo {g+1}','X-WR-TIMEZONE:Europe/Madrid']
        count=0
        for d in days:
            s=shifts(d)[g]
            if s=='L': continue
            h,m,eh,em=HOURS[s]
            lines += ['BEGIN:VEVENT',f'UID:urgenciashsj-2027-g{g+1}-{d:%Y%m%d}@urgenciashsj.es','DTSTAMP:20261125T120000Z',f'DTSTART:{utc(d,h,m)}',f'DTEND:{utc(d,eh,em)}',f'SUMMARY:{s} - {NAMES[s]} - Grupo {g+1}','END:VEVENT']
            count+=1
        lines += ['END:VCALENDAR']
        data='\r\n'.join(map(fold,lines))+'\r\n'
        assert data.count('BEGIN:VEVENT') == count
        assert all(len(line.encode()) <=75 for line in data.split('\r\n'))
        (OUT/f'urgencias-2027-grupo-{g+1}.ics').write_bytes(data.encode())
        print(f'Grupo {g+1}: {count} eventos')

if __name__=='__main__': generate()

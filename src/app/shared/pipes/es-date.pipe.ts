import { Pipe, PipeTransform } from '@angular/core';

const MONTHS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

@Pipe({ name: 'esDate', standalone: true })
export class EsDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, showTime = false): string {
    if (!value) return '';
    const d = new Date(value as string);
    if (isNaN(d.getTime())) return '';
    const day   = String(d.getDate()).padStart(2, '0');
    const month = MONTHS[d.getMonth()];
    const year  = d.getFullYear();
    if (!showTime) return `${day}/${month}/${year}`;
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hh}:${mm}`;
  }
}

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'sessionTime', standalone: true })
export class SessionTimePipe implements PipeTransform {
  transform(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}

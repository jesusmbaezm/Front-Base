import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="paginator">
      <div class="paginator__left">
        <span class="label">Filas:</span>
        <select class="size-select" [(ngModel)]="pageSize" (change)="onPageSizeChange()">
          <option *ngFor="let opt of pageSizeOptions" [value]="opt">{{ opt }}</option>
        </select>
        <span class="range-label">{{ rangeLabel }}</span>
      </div>

      <div class="paginator__right">
        <button class="nav-btn" (click)="goTo(currentPage - 1)" [disabled]="currentPage === 1">
          <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
            <path d="M7 2L4 6l3 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <ng-container *ngFor="let p of pageWindow">
          <span *ngIf="p === -1" class="ellipsis">···</span>
          <button *ngIf="p !== -1"
            class="page-btn"
            [class.active]="p === currentPage"
            (click)="goTo(p)">
            {{ p }}
          </button>
        </ng-container>

        <button class="nav-btn" (click)="goTo(currentPage + 1)" [disabled]="currentPage === totalPages">
          <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
            <path d="M3 2l3 4-3 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .paginator {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 16px;
      padding: 10px 20px;
      border-top: 1px solid #E5E7EB;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .paginator__left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .paginator__right {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .label, .range-label {
      font-size: 12px;
      color: #6B7280;
      white-space: nowrap;
    }

    .size-select {
      height: 30px;
      padding: 0 30px 0 10px;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      font-size: 12px;
      font-family: 'Inter', system-ui, sans-serif;
      font-weight: 500;
      color: #1A1F36;
      background: #F7F9FC url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E") no-repeat right 8px center;
      appearance: none;
      cursor: pointer;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;

      &:hover {
        border-color: #9CA3AF;
      }

      &:focus {
        border-color: #2F4499;
        box-shadow: 0 0 0 3px rgba(47, 68, 153, 0.1);
      }
    }

    .page-btn {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: none;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      background: transparent;
      color: #6B7280;
      transition: background 0.15s, color 0.15s;

      &:hover:not(.active) {
        background: #F3F4F6;
        color: #1A1F36;
      }

      &.active {
        background: #2F4499;
        color: #fff;
        font-weight: 600;
      }
    }

    .ellipsis {
      font-size: 13px;
      color: #D1D5DB;
      padding: 0 4px;
      user-select: none;
    }

    .nav-btn {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 1px solid #E5E7EB;
      background: #fff;
      color: #1A1F36;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s;

      &:hover:not(:disabled) {
        background: #F3F4F6;
      }

      &:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
    }
  `],
})
export class AppPaginatorComponent implements OnChanges {
  @Input() totalItems: number = 0;
  @Input() pageSize: number = 10;
  @Input() pageSizeOptions: number[] = [10, 25, 50];
  @Input() currentPage: number = 1;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  pageWindow: number[] = [];

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  get rangeLabel(): string {
    if (this.totalItems === 0) return '0 registros';
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalItems);
    return `${start}–${end} de ${this.totalItems} registros`;
  }

  ngOnChanges(): void {
    this.pageWindow = this.buildWindow();
  }

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.pageChange.emit(page);
  }

  onPageSizeChange(): void {
    this.pageSizeChange.emit(Number(this.pageSize));
    this.pageChange.emit(1);
  }

  private buildWindow(): number[] {
    const total = this.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const cur = this.currentPage;
    const half = 2;
    let start = Math.max(1, cur - half);
    let end = Math.min(total, cur + half);

    if (cur <= half + 1) { start = 1; end = 5; }
    if (cur >= total - half) { start = total - 4; end = total; }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);

    if (start > 1) pages.unshift(-1);
    if (end < total) { pages.push(-1); pages.push(total); }

    return pages;
  }
}

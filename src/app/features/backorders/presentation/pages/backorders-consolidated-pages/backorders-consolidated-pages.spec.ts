import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackordersConsolidatedPages } from './backorders-consolidated-pages';

describe('BackordersConsolidatedPages', () => {
  let component: BackordersConsolidatedPages;
  let fixture: ComponentFixture<BackordersConsolidatedPages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackordersConsolidatedPages]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackordersConsolidatedPages);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

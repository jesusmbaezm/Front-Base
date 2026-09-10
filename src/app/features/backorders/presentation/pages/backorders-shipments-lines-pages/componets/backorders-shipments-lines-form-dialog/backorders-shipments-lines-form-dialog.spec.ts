import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackordersShipmentsLinesFormDialog } from './backorders-shipments-lines-form-dialog';

describe('BackordersShipmentsLinesFormDialog', () => {
  let component: BackordersShipmentsLinesFormDialog;
  let fixture: ComponentFixture<BackordersShipmentsLinesFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackordersShipmentsLinesFormDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackordersShipmentsLinesFormDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

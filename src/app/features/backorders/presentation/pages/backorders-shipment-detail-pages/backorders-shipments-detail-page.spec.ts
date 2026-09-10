import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackordersShipmentsFormDialog } from './backorders-shipments-form-dialog';

describe('BackordersShipmentsFormDialog', () => {
  let component: BackordersShipmentsFormDialog;
  let fixture: ComponentFixture<BackordersShipmentsFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackordersShipmentsFormDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackordersShipmentsFormDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

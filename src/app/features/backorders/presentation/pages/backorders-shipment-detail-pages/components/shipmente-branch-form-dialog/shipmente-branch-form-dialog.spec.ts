import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipmenteBranchFormDialog } from './shipmente-branch-form-dialog';

describe('ShipmenteBranchFormDialog', () => {
  let component: ShipmenteBranchFormDialog;
  let fixture: ComponentFixture<ShipmenteBranchFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShipmenteBranchFormDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShipmenteBranchFormDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

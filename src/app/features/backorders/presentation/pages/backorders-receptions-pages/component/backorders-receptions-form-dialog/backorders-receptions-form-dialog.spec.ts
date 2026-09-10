import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackordersReceptionsFormDialog } from './backorders-receptions-form-dialog';

describe('BackordersReceptionsFormDialog', () => {
  let component: BackordersReceptionsFormDialog;
  let fixture: ComponentFixture<BackordersReceptionsFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackordersReceptionsFormDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackordersReceptionsFormDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

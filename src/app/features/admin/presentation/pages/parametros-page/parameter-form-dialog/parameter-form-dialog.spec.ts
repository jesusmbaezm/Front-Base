import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParameterFormDialog } from './parameter-form-dialog';

describe('ParameterFormDialog', () => {
  let component: ParameterFormDialog;
  let fixture: ComponentFixture<ParameterFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParameterFormDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParameterFormDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

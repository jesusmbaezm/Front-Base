import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParametrosPage } from './parametros-page';

describe('ParametrosPage', () => {
  let component: ParametrosPage;
  let fixture: ComponentFixture<ParametrosPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParametrosPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParametrosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

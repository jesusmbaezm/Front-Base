import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginDetails } from './login-details';

describe('LoginDetails', () => {
  let component: LoginDetails;
  let fixture: ComponentFixture<LoginDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionTimeoutDialog } from './session-timeout-dialog';

describe('SessionTimeoutDialog', () => {
  let component: SessionTimeoutDialog;
  let fixture: ComponentFixture<SessionTimeoutDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionTimeoutDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionTimeoutDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

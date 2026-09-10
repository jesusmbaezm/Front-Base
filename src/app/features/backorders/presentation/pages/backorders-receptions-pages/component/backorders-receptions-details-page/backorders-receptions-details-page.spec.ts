import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackordersReceptionsDetailsPage } from './backorders-receptions-details-page';

describe('BackordersReceptionsDetailsPage', () => {
  let component: BackordersReceptionsDetailsPage;
  let fixture: ComponentFixture<BackordersReceptionsDetailsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackordersReceptionsDetailsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackordersReceptionsDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

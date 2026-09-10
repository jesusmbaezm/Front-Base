import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackordersShipmentsConsultDetailsPage } from './backorders-shipments-consult-details-page';

describe('BackordersShipmentsConsultDetailsPage', () => {
  let component: BackordersShipmentsConsultDetailsPage;
  let fixture: ComponentFixture<BackordersShipmentsConsultDetailsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackordersShipmentsConsultDetailsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackordersShipmentsConsultDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

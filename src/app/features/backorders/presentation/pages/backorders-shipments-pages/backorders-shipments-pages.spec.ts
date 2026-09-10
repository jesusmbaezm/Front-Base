import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackordersShipmentsPages } from './backorders-shipments-pages';

describe('BackordersShipmentsPages', () => {
  let component: BackordersShipmentsPages;
  let fixture: ComponentFixture<BackordersShipmentsPages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackordersShipmentsPages]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackordersShipmentsPages);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackordersShipmentsLinesPages } from './backorders-shipments-lines-pages';

describe('BackordersShipmentsLinesPages', () => {
  let component: BackordersShipmentsLinesPages;
  let fixture: ComponentFixture<BackordersShipmentsLinesPages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackordersShipmentsLinesPages]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackordersShipmentsLinesPages);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

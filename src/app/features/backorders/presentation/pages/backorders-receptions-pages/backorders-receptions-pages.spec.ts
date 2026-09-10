import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackordersReceptionsPages } from './backorders-receptions-pages';

describe('BackordersReceptionsPages', () => {
  let component: BackordersReceptionsPages;
  let fixture: ComponentFixture<BackordersReceptionsPages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackordersReceptionsPages]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackordersReceptionsPages);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

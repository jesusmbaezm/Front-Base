import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackordersBranchPages } from './backorders-branch-pages';

describe('BackordersBranchPages', () => {
  let component: BackordersBranchPages;
  let fixture: ComponentFixture<BackordersBranchPages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackordersBranchPages]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackordersBranchPages);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

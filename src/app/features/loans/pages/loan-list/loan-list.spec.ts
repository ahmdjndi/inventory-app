import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoanList } from './loan-list';

describe('LoanList', () => {
  let component: LoanList;
  let fixture: ComponentFixture<LoanList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoanList],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LoanList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

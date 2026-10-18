
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoanCart } from './loan-cart';

describe('LoanCart', () => {
  let component: LoanCart;
  let fixture: ComponentFixture<LoanCart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoanCart],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LoanCart);
    component = fixture.componentInstance;
    fixture.detectChanges();

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

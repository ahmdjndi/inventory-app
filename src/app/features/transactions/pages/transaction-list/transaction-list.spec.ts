import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TransactionList } from './transaction-list';

describe('TransactionList', () => {
  let component: TransactionList;
  let fixture: ComponentFixture<TransactionList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionList],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

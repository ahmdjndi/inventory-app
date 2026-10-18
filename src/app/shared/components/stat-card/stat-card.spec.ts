
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatCard } from './stat-card';

describe('StatCard', () => {
  let component: StatCard;
  let fixture: ComponentFixture<StatCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCard],
    }).compileComponents();

    fixture = TestBed.createComponent(StatCard);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('label', 'Total Barang');
    fixture.componentRef.setInput('value', 0);

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

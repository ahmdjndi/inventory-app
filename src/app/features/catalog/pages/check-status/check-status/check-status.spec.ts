import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckStatus } from './check-status';

describe('CheckStatus', () => {
  let component: CheckStatus;
  let fixture: ComponentFixture<CheckStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckStatus],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckStatus);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

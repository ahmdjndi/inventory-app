import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ComingSoon } from './coming-soon';

describe('ComingSoon', () => {
  let component: ComingSoon;
  let fixture: ComponentFixture<ComingSoon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComingSoon],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ComingSoon);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

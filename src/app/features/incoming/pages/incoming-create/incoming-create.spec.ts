import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IncomingCreate } from './incoming-create';

describe('IncomingCreate', () => {
  let component: IncomingCreate;
  let fixture: ComponentFixture<IncomingCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncomingCreate],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(IncomingCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

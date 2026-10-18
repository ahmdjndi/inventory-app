import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OutgoingCreate } from './outgoing-create';

describe('OutgoingCreate', () => {
  let component: OutgoingCreate;
  let fixture: ComponentFixture<OutgoingCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutgoingCreate],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(OutgoingCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

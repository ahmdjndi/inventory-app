import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LocationCreate } from './location-create';

describe('LocationCreate', () => {
  let component: LocationCreate;
  let fixture: ComponentFixture<LocationCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationCreate],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LocationEdit } from './location-edit';

describe('LocationEdit', () => {
  let component: LocationEdit;
  let fixture: ComponentFixture<LocationEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationEdit],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

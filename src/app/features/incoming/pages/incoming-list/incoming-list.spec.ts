import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IncomingList } from './incoming-list';

describe('IncomingList', () => {
  let component: IncomingList;
  let fixture: ComponentFixture<IncomingList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncomingList],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(IncomingList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OutgoingList } from './outgoing-list';

describe('OutgoingList', () => {
  let component: OutgoingList;
  let fixture: ComponentFixture<OutgoingList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutgoingList],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(OutgoingList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

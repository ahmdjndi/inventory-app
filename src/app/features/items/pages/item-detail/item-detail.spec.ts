import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ItemDetail } from './item-detail';

describe('ItemDetail', () => {
  let component: ItemDetail;
  let fixture: ComponentFixture<ItemDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemDetail],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

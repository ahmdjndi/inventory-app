import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ItemList } from './item-list';

describe('ItemList', () => {
  let component: ItemList;
  let fixture: ComponentFixture<ItemList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemList],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

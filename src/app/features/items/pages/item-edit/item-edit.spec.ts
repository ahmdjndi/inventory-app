import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ItemEdit } from './item-edit';

describe('ItemEdit', () => {
  let component: ItemEdit;
  let fixture: ComponentFixture<ItemEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemEdit],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

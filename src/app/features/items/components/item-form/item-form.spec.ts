import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ItemForm } from './item-form';

describe('ItemForm', () => {
  let component: ItemForm;
  let fixture: ComponentFixture<ItemForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemForm],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

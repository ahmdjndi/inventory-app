import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CatalogDetail } from './catalog-detail';

describe('CatalogDetail', () => {
  let component: CatalogDetail;
  let fixture: ComponentFixture<CatalogDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogDetail],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

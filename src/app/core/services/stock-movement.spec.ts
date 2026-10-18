import { TestBed } from '@angular/core/testing';
import { StockMovementService } from './stock-movement.service';

describe('StockMovementService', () => {
  let service: StockMovementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StockMovementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

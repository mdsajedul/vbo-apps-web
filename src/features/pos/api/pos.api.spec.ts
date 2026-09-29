import { posApi } from './pos.api';
import { apiClient } from '@/shared/api/client';

jest.mock('@/shared/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('posApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should open shift', async () => {
    const mockShift = { id: 's1', branch_id: 'b1', starting_cash: 5000, status: 'OPEN' };
    (apiClient.post as jest.Mock).mockResolvedValue({ data: mockShift });

    const result = await posApi.openShift({ branch_id: 'b1', starting_cash: 5000 });

    expect(apiClient.post).toHaveBeenCalledWith('/pos/shift/open', {
      branch_id: 'b1',
      starting_cash: 5000,
    });
    expect(result).toEqual(mockShift);
  });

  it('should close shift', async () => {
    const mockShift = { id: 's1', actual_cash: 5500, status: 'CLOSED' };
    (apiClient.post as jest.Mock).mockResolvedValue({ data: mockShift });

    const result = await posApi.closeShift('s1', { actual_cash: 5500, notes: 'Balanced' });

    expect(apiClient.post).toHaveBeenCalledWith('/pos/shift/s1/close', {
      actual_cash: 5500,
      notes: 'Balanced',
    });
    expect(result.status).toBe('CLOSED');
  });

  it('should get current shift scoped by branch', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { id: 's1', status: 'OPEN' } });

    const result = await posApi.getCurrentShift('b1');

    expect(apiClient.get).toHaveBeenCalledWith('/pos/shift/current', {
      params: { branch_id: 'b1' },
    });
    expect(result?.status).toBe('OPEN');
  });

  it('should execute checkout transaction', async () => {
    const payload: any = {
      branch_id: 'b1',
      payment_method: 'CASH',
      amount_paid: 1000,
      total_amount: 1000,
      items: [
        { product_id: 'p1', name: 'Item', quantity: 1, unit_price: 1000, total_price: 1000 },
      ],
    };
    const mockResponse = { sale_id: 'sale_1', invoice_number: 'INV-1001', total_amount: 1000 };
    (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

    const result = await posApi.checkout(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/pos/checkout', payload);
    expect(result.invoice_number).toBe('INV-1001');
  });
});

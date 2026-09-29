import { productsApi } from './products.api';
import { apiClient } from '@/shared/api/client';

jest.mock('@/shared/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('productsApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch product list with filters', async () => {
    const mockProducts = [{ id: 'p1', name: 'Product 1', sku: 'SKU1', retail_price: 100, is_active: true }];
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockProducts });

    const result = await productsApi.getAll({ category_id: 'cat-1', search: 'shoe' });

    expect(apiClient.get).toHaveBeenCalledWith('/products', {
      params: { category_id: 'cat-1', search: 'shoe' },
    });
    expect(result).toEqual(mockProducts);
  });

  it('should fetch single product by id', async () => {
    const mockProduct = { id: 'p1', name: 'Product 1', sku: 'SKU1', retail_price: 100, is_active: true };
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockProduct });

    const result = await productsApi.getOne('p1');

    expect(apiClient.get).toHaveBeenCalledWith('/products/p1');
    expect(result).toEqual(mockProduct);
  });

  it('should create product', async () => {
    const newProd = { name: 'New Item', sku: 'NEW-01', retail_price: 250 };
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: 'p2', ...newProd } });

    const result = await productsApi.create(newProd as any);

    expect(apiClient.post).toHaveBeenCalledWith('/products', newProd);
    expect(result.id).toBe('p2');
  });

  it('should update product', async () => {
    (apiClient.patch as jest.Mock).mockResolvedValue({ data: { id: 'p1', retail_price: 300 } });

    const result = await productsApi.update('p1', { retail_price: 300 });

    expect(apiClient.patch).toHaveBeenCalledWith('/products/p1', { retail_price: 300 });
    expect(result.retail_price).toBe(300);
  });

  it('should archive product', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

    const result = await productsApi.archive('p1');

    expect(apiClient.delete).toHaveBeenCalledWith('/products/p1');
    expect(result.success).toBe(true);
  });
});

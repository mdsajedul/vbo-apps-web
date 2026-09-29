import { apiClient } from './client';
import { useAuthStore } from '@/lib/auth-store';
import { useBranchStore } from '@/lib/branch-store';

describe('apiClient', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
    useBranchStore.setState({ selectedBranchId: 'ALL' });
  });

  it('should have standard default configurations', () => {
    expect(apiClient.defaults.withCredentials).toBe(true);
    expect(apiClient.defaults.timeout).toBe(30000);
  });

  it('should attach headers via request interceptor when auth, branch, and tenant exist', async () => {
    useAuthStore.setState({
      token: 'jwt-access-token',
      user: {
        id: 'u1',
        email: 'test@vbo.com',
        full_name: 'Test',
        tenant_id: 'ten-999',
        roles: [],
      },
    });
    useBranchStore.setState({ selectedBranchId: 'branch-55' });

    // Run request interceptor
    const config: any = { headers: {} };
    // Find request interceptor handler
    const handlers = (apiClient.interceptors.request as any).handlers;
    let modifiedConfig = config;
    for (const handler of handlers) {
      if (handler?.fulfilled) {
        modifiedConfig = await handler.fulfilled(modifiedConfig);
      }
    }

    expect(modifiedConfig.headers['Authorization']).toBe('Bearer jwt-access-token');
    expect(modifiedConfig.headers['x-branch-id']).toBe('branch-55');
    expect(modifiedConfig.headers['x-tenant-id']).toBe('ten-999');
    expect(modifiedConfig.headers['x-request-id']).toBeDefined();
  });
});

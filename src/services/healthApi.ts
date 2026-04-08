import { api, ApiResponse } from './api';

export interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
  database: string;
}

export const healthApi = {
  async checkHealth(): Promise<ApiResponse<HealthStatus>> {
    const response = await api.get('/health');
    return response.data;
  },
};
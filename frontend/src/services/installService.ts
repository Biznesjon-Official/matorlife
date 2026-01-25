import axios from 'axios';
import API_CONFIG from '@/config/api.config';
import { DeviceFingerprint } from '@/lib/deviceFingerprint';

const API_URL = API_CONFIG.BASE_URL;

export interface InstallCheckResponse {
  success: boolean;
  canInstall: boolean;
  installCount: number;
  remainingInstalls: number;
  isBlocked?: boolean;
  message: string;
  lastInstallDate?: string;
}

export interface InstallRecordResponse {
  success: boolean;
  message: string;
  installCount: number;
  remainingInstalls: number;
  isBlocked: boolean;
}

export class InstallService {
  /**
   * Check if current device can install the app
   */
  static async checkInstallEligibility(): Promise<InstallCheckResponse> {
    try {
      const deviceInfo = DeviceFingerprint.collectDeviceInfo();
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${API_URL}/install/check`,
        { deviceInfo },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  /**
   * Record app installation
   */
  static async recordInstallation(): Promise<InstallRecordResponse> {
    try {
      const deviceInfo = DeviceFingerprint.collectDeviceInfo();
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${API_URL}/install/record`,
        { deviceInfo },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  /**
   * Get install history
   */
  static async getInstallHistory() {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get(`${API_URL}/install/history`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }
}

// frontend/src/services/logService.js
import api from './interceptor';

/**
 * Log Service - Handles all log-related API calls using the interceptor
 */
class LogService {
  /**
   * Get logs with filters and pagination
   */
  async getLogs(filters, offset = 0) {
    try {
      const params = {
        level: filters.level || 'all',
        type: filters.type || 'all',
        limit: filters.limit || 100,
        search: filters.search || '',
        offset: offset,
        showHttp: filters.showHttp || 'true',        // ← Changed default to true
        showOptions: filters.showOptions || 'false',
        showDatabase: filters.showDatabase || 'true', // ← Changed default to true
        actionOnly: filters.actionOnly || 'false'     // ← Changed default to false
      };

      const response = await api.get('/admin/logs', { params });
      return response.data;
    } catch (error) {
      console.error('LogService.getLogs error:', error);
      throw error;
    }
  }

  /**
   * Get log statistics
   */
  async getLogStats() {
    try {
      const response = await api.get('/admin/logs/stats');
      return response.data;
    } catch (error) {
      console.error('LogService.getLogStats error:', error);
      throw error;
    }
  }

  /**
   * Clear all logs (admin only)
   */
  async clearLogs() {
    try {
      const response = await api.delete('/admin/logs');
      return response.data;
    } catch (error) {
      console.error('LogService.clearLogs error:', error);
      throw error;
    }
  }

  // ==========================================================================
  // NEW: SYSTEM HEALTH METHODS
  // ==========================================================================

  /**
   * 🏥 Get basic system health (public)
   * No authentication required
   */
  async getSystemHealth() {
    try {
      const response = await api.get('/admin/logs/health');
      return response.data;
    } catch (error) {
      console.error('LogService.getSystemHealth error:', error);
      throw error;
    }
  }

  /**
   * 📊 Get detailed system health (admin only)
   * Requires admin authentication
   */
  async getDetailedSystemHealth() {
    try {
      const response = await api.get('/admin/logs/health/detailed');
      return response.data;
    } catch (error) {
      console.error('LogService.getDetailedSystemHealth error:', error);
      throw error;
    }
  }

  /**
   * 📈 Get health check history
   * @param {number} hours - Number of hours to look back (default: 24)
   * @param {number} limit - Maximum number of records (default: 100)
   */
  async getHealthHistory(hours = 24, limit = 100) {
    try {
      const response = await api.get('/admin/logs/health/history', {
        params: { hours, limit }
      });
      return response.data;
    } catch (error) {
      console.error('LogService.getHealthHistory error:', error);
      throw error;
    }
  }

  /**
   * 🎯 Get health status with color coding for UI
   * Helper method that adds status color based on memory usage
   */
  async getHealthStatus() {
    try {
      const health = await this.getSystemHealth();
      
      // Parse memory to determine status
      const heapUsed = parseInt(health.memory?.heapUsed || '0');
      const heapTotal = parseInt(health.memory?.heapTotal || '1');
      const usagePercent = (heapUsed / heapTotal) * 100;
      
      let status = 'healthy';
      let color = '#28a745'; // green
      let message = 'System is healthy';
      
      if (usagePercent > 90) {
        status = 'critical';
        color = '#dc3545'; // red
        message = 'Critical memory usage!';
      } else if (usagePercent > 70) {
        status = 'warning';
        color = '#ffc107'; // yellow
        message = 'High memory usage';
      }
      
      return {
        ...health,
        status,
        color,
        message,
        usagePercent: Math.round(usagePercent)
      };
    } catch (error) {
      console.error('LogService.getHealthStatus error:', error);
      return {
        status: 'error',
        color: '#6c757d',
        message: 'Could not fetch health data',
        error: error.message
      };
    }
  }

  /**
   * 🔍 Check if any system alerts are needed
   * Returns warnings if memory is high or other issues
   */
  async checkAlerts() {
    try {
      const health = await this.getDetailedSystemHealth();
      const alerts = [];
      
      // Check memory
      const heapUsed = parseInt(health.memory?.heapUsed || '0');
      const heapTotal = parseInt(health.memory?.heapTotal || '1');
      const memoryPercent = (heapUsed / heapTotal) * 100;
      
      if (memoryPercent > 90) {
        alerts.push({
          level: 'critical',
          type: 'memory',
          message: `Critical memory usage: ${Math.round(memoryPercent)}%`,
          timestamp: new Date().toISOString()
        });
      } else if (memoryPercent > 70) {
        alerts.push({
          level: 'warning',
          type: 'memory',
          message: `High memory usage: ${Math.round(memoryPercent)}%`,
          timestamp: new Date().toISOString()
        });
      }
      
      // Check CPU load if available
      if (health.system?.loadAverage) {
        const loadAvg = health.system.loadAverage[0];
        const cpuCount = health.system.cpus?.count || 1;
        
        if (loadAvg > cpuCount * 2) {
          alerts.push({
            level: 'critical',
            type: 'cpu',
            message: `Critical CPU load: ${loadAvg.toFixed(2)}`,
            timestamp: new Date().toISOString()
          });
        } else if (loadAvg > cpuCount) {
          alerts.push({
            level: 'warning',
            type: 'cpu',
            message: `High CPU load: ${loadAvg.toFixed(2)}`,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Check uptime
      const uptimeHours = parseInt(health.uptime || '0');
      if (uptimeHours > 720) { // 30 days
        alerts.push({
          level: 'info',
          type: 'uptime',
          message: `Server running for ${Math.round(uptimeHours / 24)} days. Consider restarting.`,
          timestamp: new Date().toISOString()
        });
      }
      
      return alerts;
    } catch (error) {
      console.error('LogService.checkAlerts error:', error);
      return [];
    }
  }
}

// Create and export a singleton instance
const logService = new LogService();
export default logService;
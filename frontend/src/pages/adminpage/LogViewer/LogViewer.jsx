// pages/admin/LogViewer.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LogViewer.css';
import Header from '../../../components/shared/header/Header';
import logService from '../../../services/logService';

const LogViewer = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' or 'health'
  
  // Logs state
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filters, setFilters] = useState({
    level: 'all',
    type: 'all',
    limit: 100,
    search: '',
    showHttp: 'true',
    showDatabase: 'true',
    actionOnly: 'false'
  });
  const [pagination, setPagination] = useState({
    total: 0,
    offset: 0,
    hasMore: false
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [error, setError] = useState(null);

  // Health state
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 🔥 NEW: Clear logs confirmation modal state
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/');
      return;
    }
    
    if (activeTab === 'logs') {
      fetchLogs();
      fetchStats();
    } else {
      fetchHealth();
    }
  }, [activeTab]);

  // Auto-refresh health data
  useEffect(() => {
    let interval;
    if (activeTab === 'health' && autoRefresh) {
      interval = setInterval(fetchHealth, 30000);
    }
    return () => clearInterval(interval);
  }, [activeTab, autoRefresh]);

  // ==================== LOGS FUNCTIONS ====================

  const fetchLogs = async (offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await logService.getLogs(filters, offset);
      setLogs(data.logs || []);
      setPagination(data.pagination || { total: 0, offset: 0, hasMore: false });
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError(error.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await logService.getLogStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        total: 0,
        byLevel: { error: 0, warn: 0, info: 0, debug: 0 },
        lastHour: 0,
        last24Hours: 0,
        responseTimeAvg: '0ms',
        topEndpoints: [],
        slowRequests: []
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const applyFilters = () => {
    fetchLogs(0);
    fetchStats();
  };

  const clearFilters = () => {
    setFilters({
      level: 'all',
      type: 'all',
      limit: 100,
      search: '',
      showHttp: 'true',
      showDatabase: 'true',
      actionOnly: 'false'
    });
    setTimeout(() => {
      fetchLogs(0);
      fetchStats();
    }, 0);
  };

  // ==================== HEALTH FUNCTIONS ====================

  const fetchHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const data = await logService.getHealthStatus();
      setHealth(data);
    } catch (error) {
      console.error('Error fetching health:', error);
      setHealthError(error.message);
    } finally {
      setHealthLoading(false);
    }
  };

  // 🔥 UPDATED: Open clear logs confirmation modal
  const handleClearLogsClick = () => {
    setShowClearModal(true);
  };

  // 🔥 NEW: Actually clear logs when confirmed
  const handleConfirmClearLogs = async () => {
    setIsClearing(true);
    try {
      await logService.clearLogs();
      fetchLogs(0);
      fetchStats();
      setShowClearModal(false);
    } catch (error) {
      console.error('Error clearing logs:', error);
      setError('Failed to clear logs');
    } finally {
      setIsClearing(false);
    }
  };

  // ==================== LOG DISPLAY HELPERS ====================

  const getLogLevelClass = (level) => {
    switch(level) {
      case 'error': return 'log-error';
      case 'warn': return 'log-warn';
      case 'info': return 'log-info';
      default: return 'log-debug';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  const getLogIcon = (type) => {
    const icons = {
      'http_request': '🌐',
      'user_action': '👤',
      'article_created': '📝',
      'article_updated': '✏️',
      'article_deleted': '🗑️',
      'article_publish_toggled': '📢',
      'login_attempt': '🔑',
      'login_success': '✅',
      'login_failed': '❌',
      'database_query': '🗄️',
      'error': '🚨',
      'slow_request': '🐢',
      'system_health': '🏥'
    };
    return icons[type] || '📋';
  };

  const getLevelCount = (level) => {
    return stats?.byLevel?.[level] || 0;
  };

  return (
    <div className="log-viewer-wrapper">
      <Header />
      <div className="log-viewer-layout">
        <main className="log-viewer-content">
          {/* Header with Tabs */}
          <div className="log-header-section">
            <div className="log-tabs">
              <button 
                className={`log-tab ${activeTab === 'logs' ? 'active' : ''}`}
                onClick={() => setActiveTab('logs')}
              >
                📋 Log Viewer
              </button>
              <button 
                className={`log-tab ${activeTab === 'health' ? 'active' : ''}`}
                onClick={() => setActiveTab('health')}
              >
                🏥 System Health
              </button>
            </div>
            <p className="log-subtitle">
              {activeTab === 'logs' 
                ? 'Real-time application monitoring and debugging'
                : 'Server health metrics and performance monitoring'}
            </p>
            {activeTab === 'logs' && (
              <button onClick={handleClearLogsClick} className="log-clear-all-btn">
                🗑️ Clear All Logs
              </button>
            )}
          </div>

          {/* Error Display */}
          {error && activeTab === 'logs' && (
            <div className="log-error-message">
              <span className="log-error-icon">⚠️</span>
              <span>{error}</span>
              <button onClick={() => { fetchLogs(); fetchStats(); }} className="log-retry-btn">
                Retry
              </button>
            </div>
          )}

          {healthError && activeTab === 'health' && (
            <div className="log-error-message">
              <span className="log-error-icon">⚠️</span>
              <span>{healthError}</span>
              <button onClick={fetchHealth} className="log-retry-btn">
                Retry
              </button>
            </div>
          )}

          {/* LOGS TAB CONTENT */}
          {activeTab === 'logs' && (
            <>
              {/* Stats Cards */}
              {statsLoading ? (
                <div className="log-stats-loading">Loading statistics...</div>
              ) : stats && (
                <div className="log-stats-grid">
                  <div className="log-stat-card total">
                    <h3>Total Logs</h3>
                    <p className="log-stat-number">{stats.total?.toLocaleString() || 0}</p>
                  </div>
                  <div className="log-stat-card errors">
                    <h3>Errors (24h)</h3>
                    <p className="log-stat-number">{getLevelCount('error')}</p>
                  </div>
                  <div className="log-stat-card warnings">
                    <h3>Warnings</h3>
                    <p className="log-stat-number">{getLevelCount('warn')}</p>
                  </div>
                  <div className="log-stat-card info">
                    <h3>Info</h3>
                    <p className="log-stat-number">{getLevelCount('info')}</p>
                  </div>
                  <div className="log-stat-card response-time">
                    <h3>Avg Response</h3>
                    <p className="log-stat-number">{stats.responseTimeAvg || '0ms'}</p>
                  </div>
                  <div className="log-stat-card last-hour">
                    <h3>Last Hour</h3>
                    <p className="log-stat-number">{stats.lastHour || 0}</p>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="log-filters-section">
                <select 
                  name="level" 
                  value={filters.level} 
                  onChange={handleFilterChange}
                >
                  <option value="all">All Levels</option>
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>

                <select 
                  name="type" 
                  value={filters.type} 
                  onChange={handleFilterChange}
                >
                  <option value="all">All Types</option>
                  <option value="http_request">HTTP Requests</option>
                  <option value="user_action">User Actions</option>
                  <option value="article_created">Article Created</option>
                  <option value="article_updated">Article Updated</option>
                  <option value="article_deleted">Article Deleted</option>
                  <option value="login_attempt">Login Attempts</option>
                  <option value="error">Errors</option>
                  <option value="slow_request">Slow Requests</option>
                </select>

                <select 
                  name="limit" 
                  value={filters.limit} 
                  onChange={handleFilterChange}
                >
                  <option value="50">50 logs</option>
                  <option value="100">100 logs</option>
                  <option value="200">200 logs</option>
                  <option value="500">500 logs</option>
                </select>

                <input
                  type="text"
                  name="search"
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={handleFilterChange}
                />

                <button onClick={applyFilters} className="log-apply-btn">
                  Apply Filters
                </button>
                <button onClick={clearFilters} className="log-clear-btn">
                  Clear
                </button>
              </div>

              {/* Logs Table */}
              {loading ? (
                <div className="log-loading-state">
                  <div className="log-spinner"></div>
                  <p>Loading logs...</p>
                </div>
              ) : (
                <>
                  <div className="log-table-container">
                    <table className="log-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Level</th>
                          <th>Type</th>
                          <th>User</th>
                          <th>Action/Message</th>
                          <th>Duration</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.length > 0 ? (
                          logs.map((log, index) => {
                            const message = log.message || log;
                            const type = message.type || log.type || 'unknown';
                            const level = log.level || 'info';
                            
                            return (
                              <tr key={index} className={getLogLevelClass(level)}>
                                <td>{formatTimestamp(log.timestamp)}</td>
                                <td>
                                  <span className={`log-level-badge ${level}`}>
                                    {level}
                                  </span>
                                </td>
                                <td>
                                  <span className="log-type-icon">
                                    {getLogIcon(type)} {type}
                                  </span>
                                </td>
                                <td>{message.userId || log.userId || '—'}</td>
                                <td className="log-action-cell">
                                  {message.action || message.message || message.url || '—'}
                                </td>
                                <td>{message.duration || log.duration || '—'}</td>
                                <td>
                                  <button 
                                    className="log-view-details-btn"
                                    onClick={() => setSelectedLog(log)}
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="7" className="log-no-logs">
                              <div className="log-no-logs-content">
                                <span className="log-no-logs-icon">🔍</span>
                                <p>No logs found matching your filters</p>
                                <button onClick={clearFilters} className="log-clear-filters-btn">
                                  Clear Filters
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {pagination.total > 0 && (
                    <div className="log-pagination">
                      <button
                        onClick={() => fetchLogs(pagination.offset - filters.limit)}
                        disabled={pagination.offset === 0}
                        className="log-pagination-btn"
                      >
                        ← Previous
                      </button>
                      <span className="log-page-info">
                        Showing {pagination.offset + 1} - {Math.min(pagination.offset + logs.length, pagination.total)} of {pagination.total}
                      </span>
                      <button
                        onClick={() => fetchLogs(pagination.offset + filters.limit)}
                        disabled={!pagination.hasMore}
                        className="log-pagination-btn"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Top Endpoints */}
              {stats && stats.topEndpoints && stats.topEndpoints.length > 0 && (
                <div className="log-endpoints-card">
                  <h3>📊 Top Endpoints</h3>
                  <div className="log-endpoints-list">
                    {stats.topEndpoints.map((item, i) => (
                      <div key={i} className="log-endpoint-item">
                        <span className="log-endpoint-path">{item.url || 'unknown'}</span>
                        <span className="log-endpoint-count">{item.count} requests</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Slow Requests */}
              {stats && (
                <div className="log-slow-requests-card">
                  <h3>🐢 Slow Requests {'>'}1s</h3>
                  {stats.slowRequests && stats.slowRequests.length > 0 ? (
                    <div className="log-slow-requests-list">
                      {stats.slowRequests.map((req, i) => (
                        <div key={i} className="log-slow-request-item">
                          <div className="log-slow-request-info">
                            <span className="log-slow-method">{req.method || 'GET'}</span>
                            <span className="log-slow-url">{req.url || 'unknown'}</span>
                          </div>
                          <div className="log-slow-request-meta">
                            <span className="log-slow-duration badge-warning">{req.duration}</span>
                            <span className="log-slow-time">
                              {req.timestamp ? new Date(req.timestamp).toLocaleTimeString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="log-no-data">✨ No slow requests detected - everything is running smoothly!</p>
                  )}
                  
                  {/* Response Time Stats */}
                  <div className="log-response-time-stats">
                    <div className="log-stat-item">
                      <span className="log-stat-label">Average Response Time:</span>
                      <span className="log-stat-value">{stats.responseTimeAvg || '0ms'}</span>
                    </div>
                    <div className="log-stat-item">
                      <span className="log-stat-label">Total Requests (24h):</span>
                      <span className="log-stat-value">{stats.last24Hours || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* HEALTH TAB CONTENT */}
          {activeTab === 'health' && (
            <div className="log-health-container">
              <div className="log-health-header">
                <h2>🏥 System Health Monitor</h2>
                <div className="log-health-controls">
                  <label className="log-auto-refresh">
                    <input 
                      type="checkbox" 
                      checked={autoRefresh} 
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                    Auto-refresh (30s)
                  </label>
                  <button 
                    onClick={fetchHealth} 
                    className="log-refresh-btn"
                    disabled={healthLoading}
                  >
                    🔄 {healthLoading ? 'Refreshing...' : 'Refresh Now'}
                  </button>
                </div>
              </div>

              {healthLoading ? (
                <div className="log-loading-state">
                  <div className="log-spinner"></div>
                  <p>Loading health data...</p>
                </div>
              ) : health ? (
                <div className="log-health-grid">
                  {/* Status Card */}
                  <div className="log-health-card" style={{ borderLeftColor: health.color }}>
                    <div className="log-health-card-header">
                      <span className="log-health-icon">
                        {health.status === 'critical' ? '🔴' : 
                         health.status === 'warning' ? '🟡' : '🟢'}
                      </span>
                      <h3>System Status</h3>
                    </div>
                    <div className="log-health-value" style={{ color: health.color }}>
                      {health.status.toUpperCase()}
                    </div>
                    {health.message && (
                      <div className="log-health-message" style={{ backgroundColor: health.color + '20' }}>
                        {health.message}
                      </div>
                    )}
                  </div>

                  {/* Uptime Card */}
                  <div className="log-health-card">
                    <div className="log-health-card-header">
                      <span className="log-health-icon">⏱️</span>
                      <h3>Uptime</h3>
                    </div>
                    <div className="log-health-value">{health.uptime}</div>
                    <div className="log-health-details">
                      <span>Last restart: {new Date(Date.now() - (parseInt(health.uptime) * 60 * 1000)).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Memory Card */}
                  <div className="log-health-card">
                    <div className="log-health-card-header">
                      <span className="log-health-icon">💾</span>
                      <h3>Memory Usage</h3>
                    </div>
                    <div className="log-health-memory-grid">
                      <div className="log-health-memory-item">
                        <span className="log-health-label">RSS</span>
                        <span className="log-health-value">{health.memory?.rss}</span>
                      </div>
                      <div className="log-health-memory-item">
                        <span className="log-health-label">Heap Used</span>
                        <span className="log-health-value">{health.memory?.heapUsed}</span>
                      </div>
                      <div className="log-health-memory-item">
                        <span className="log-health-label">Heap Total</span>
                        <span className="log-health-value">{health.memory?.heapTotal}</span>
                      </div>
                      <div className="log-health-memory-item">
                        <span className="log-health-label">External</span>
                        <span className="log-health-value">{health.memory?.external}</span>
                      </div>
                    </div>
                    
                    {/* Memory Progress Bar */}
                    <div className="log-health-progress">
                      <div 
                        className="log-health-progress-bar"
                        style={{ 
                          width: `${health.usagePercent || 0}%`,
                          backgroundColor: health.color
                        }}
                      ></div>
                    </div>
                    <div className="log-health-progress-label">
                      {health.usagePercent || 0}% of heap used
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="log-health-footer">
                    Last updated: {new Date(health.timestamp).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="log-no-data">No health data available</div>
              )}
            </div>
          )}

          {/* 🔥 NEW: Clear Logs Confirmation Modal */}
          {showClearModal && (
            <div className="log-modal-overlay" onClick={() => !isClearing && setShowClearModal(false)}>
              <div className="log-modal-content log-confirm-modal" onClick={e => e.stopPropagation()}>
                <div className="log-modal-header">
                  <h3>🗑️ Clear All Logs</h3>
                  <button 
                    className="log-close-btn" 
                    onClick={() => !isClearing && setShowClearModal(false)}
                    disabled={isClearing}
                  >
                    ×
                  </button>
                </div>
                <div className="log-modal-body">
                  <div className="log-confirm-icon">⚠️</div>
                  <p className="log-confirm-title">Are you absolutely sure?</p>
                  <p className="log-confirm-message">
                    This action will permanently delete <strong>ALL log files</strong> from the server.
                    This cannot be undone.
                  </p>
                  <div className="log-confirm-warning">
                    <strong>Warning:</strong> You will lose all historical log data.
                  </div>
                </div>
                <div className="log-modal-actions">
                  <button 
                    className="log-btn-secondary"
                    onClick={() => setShowClearModal(false)}
                    disabled={isClearing}
                  >
                    Cancel
                  </button>
                  <button 
                    className="log-btn-danger"
                    onClick={handleConfirmClearLogs}
                    disabled={isClearing}
                  >
                    {isClearing ? (
                      <>
                        <span className="log-spinner-small"></span>
                        Clearing...
                      </>
                    ) : (
                      'Yes, Clear All Logs'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Log Details Modal */}
          {selectedLog && (
            <div className="log-modal-overlay" onClick={() => setSelectedLog(null)}>
              <div className="log-modal-content" onClick={e => e.stopPropagation()}>
                <div className="log-modal-header">
                  <h3>Log Details</h3>
                  <button className="log-close-btn" onClick={() => setSelectedLog(null)}>×</button>
                </div>
                <div className="log-modal-body">
                  <div className="log-metadata">
                    <span className={`log-metadata-level ${selectedLog.level}`}>
                      Level: {selectedLog.level}
                    </span>
                    <span className="log-metadata-time">
                      Time: {formatTimestamp(selectedLog.timestamp)}
                    </span>
                  </div>
                  <pre className="log-details-pre">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default LogViewer;
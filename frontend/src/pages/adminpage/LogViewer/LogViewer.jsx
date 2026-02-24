// pages/admin/LogViewer.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/shared/header/Header';
import './LogViewer.css';

const LogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filters, setFilters] = useState({
    level: 'all',
    type: 'all',
    limit: 100,
    search: ''
  });
  const [pagination, setPagination] = useState({
    total: 0,
    offset: 0,
    hasMore: false
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    // Check if user is admin - redirect to home instead of alert
    if (userRole !== 'admin') {
      navigate('/');
      return;
    }
    
    fetchLogs();
    fetchStats();
  }, []);

  const fetchLogs = async (offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        offset
      }).toString();
      
      const response = await fetch(`http://localhost:5000/api/admin/logs?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.status}`);
      }
      
      const data = await response.json();
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
      const response = await fetch('http://localhost:5000/api/admin/logs/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default stats on error
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
      search: ''
    });
    setTimeout(() => {
      fetchLogs(0);
      fetchStats();
    }, 0);
  };

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
      'slow_request': '🐢'
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
          <div className="log-header-section">
            <h1>System Logs</h1>
            <p>Real-time application monitoring and debugging</p>
          </div>

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

          {/* Error Display */}
          {error && (
            <div className="log-error-message">
              <span className="log-error-icon">⚠️</span>
              <span>{error}</span>
              <button onClick={() => { fetchLogs(); fetchStats(); }} className="log-retry-btn">
                Retry
              </button>
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
          {stats && stats.slowRequests && stats.slowRequests.length > 0 && (
            <div className="log-slow-requests-card">
              <h3>🐢 Slow Requests {'>'}1s</h3>
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

          {/* No Slow Requests Message */}
          {stats && stats.slowRequests && stats.slowRequests.length === 0 && (
            <div className="log-slow-requests-card">
              <h3>🐢 Slow Requests {'>'}1s</h3>
              <p className="log-no-data">✨ No slow requests detected - everything is running smoothly!</p>
              
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
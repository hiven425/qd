import { useState, useEffect } from 'react';
import { api } from './api';
import './App.css';

function App() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [runs, setRuns] = useState([]);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const response = await api.getSites();
      setSites(response.data);
    } catch (error) {
      alert('加载站点失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async (id) => {
    try {
      await api.runSite(id);
      alert('执行成功！');
      loadSites();
    } catch (error) {
      alert('执行失败: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除此站点？')) return;
    try {
      await api.deleteSite(id);
      loadSites();
    } catch (error) {
      alert('删除失败: ' + error.message);
    }
  };

  const handlePause = async (id) => {
    try {
      await api.pauseSite(id);
      loadSites();
    } catch (error) {
      alert('暂停失败: ' + error.message);
    }
  };

  const handleResume = async (id) => {
    try {
      await api.resumeSite(id);
      loadSites();
    } catch (error) {
      alert('恢复失败: ' + error.message);
    }
  };

  const handleViewRuns = async (site) => {
    try {
      const response = await api.getSiteRuns(site.id);
      setRuns(response.data);
      setSelectedSite(site);
    } catch (error) {
      alert('加载执行历史失败: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'SUCCESS': { text: '成功', class: 'status-success' },
      'FAILED': { text: '失败', class: 'status-failed' },
      'RUNNING': { text: '运行中', class: 'status-running' },
      'SKIPPED': { text: '跳过', class: 'status-skipped' },
      'AUTH_FAILED': { text: '认证失败', class: 'status-auth-failed' },
    };
    const badge = statusMap[status] || { text: status, class: '' };
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div className="app">
      <header className="header">
        <h1>CheckinHub 管理后台</h1>
        <button onClick={() => { setShowForm(true); setEditingSite(null); }} className="btn-primary">
          + 新增站点
        </button>
      </header>

      {showForm && (
        <SiteForm
          site={editingSite}
          onClose={() => { setShowForm(false); setEditingSite(null); }}
          onSave={() => { setShowForm(false); setEditingSite(null); loadSites(); }}
        />
      )}

      {selectedSite && (
        <RunHistory
          site={selectedSite}
          runs={runs}
          onClose={() => { setSelectedSite(null); setRuns([]); }}
        />
      )}

      <div className="sites-table">
        <table>
          <thead>
            <tr>
              <th>站点名称</th>
              <th>状态</th>
              <th>上次执行</th>
              <th>下次执行</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sites.map(site => (
              <tr key={site.id}>
                <td>
                  <strong>{site.name}</strong>
                  {site.paused && <span className="badge-paused">已暂停</span>}
                </td>
                <td>{site.last_run_status ? getStatusBadge(site.last_run_status) : '-'}</td>
                <td>{site.last_run_at ? new Date(site.last_run_at).toLocaleString() : '-'}</td>
                <td>{site.next_run_at ? new Date(site.next_run_at).toLocaleString() : '-'}</td>
                <td className="actions">
                  <button onClick={() => handleRun(site.id)} className="btn-sm">立即执行</button>
                  <button onClick={() => handleViewRuns(site)} className="btn-sm">历史</button>
                  <button onClick={() => { setEditingSite(site); setShowForm(true); }} className="btn-sm">编辑</button>
                  {site.paused ? (
                    <button onClick={() => handleResume(site.id)} className="btn-sm">恢复</button>
                  ) : (
                    <button onClick={() => handlePause(site.id)} className="btn-sm">暂停</button>
                  )}
                  <button onClick={() => handleDelete(site.id)} className="btn-sm btn-danger">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SiteForm({ site, onClose, onSave }) {
  const [formData, setFormData] = useState(site || {
    name: '',
    enabled: true,
    auth: { type: 'bearer', token: '' },
    flow: [],
    schedule: { type: 'dailyAfter', hour: 8, minute: 5 },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (site) {
        await api.updateSite(site.id, formData);
      } else {
        await api.createSite(formData);
      }
      onSave();
    } catch (error) {
      alert('保存失败: ' + error.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{site ? '编辑站点' : '新增站点'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>站点名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Bearer Token</label>
            <input
              type="text"
              value={formData.auth?.token || ''}
              onChange={e => setFormData({ ...formData, auth: { ...formData.auth, token: e.target.value } })}
            />
          </div>
          <div className="form-group">
            <label>Flow 配置 (JSON)</label>
            <textarea
              rows="10"
              value={JSON.stringify(formData.flow, null, 2)}
              onChange={e => {
                try {
                  setFormData({ ...formData, flow: JSON.parse(e.target.value) });
                } catch {}
              }}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">保存</button>
            <button type="button" onClick={onClose} className="btn-secondary">取消</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RunHistory({ site, runs, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={e => e.stopPropagation()}>
        <h2>{site.name} - 执行历史</h2>
        <table>
          <thead>
            <tr>
              <th>执行时间</th>
              <th>状态</th>
              <th>摘要</th>
            </tr>
          </thead>
          <tbody>
            {runs.map(run => (
              <tr key={run.id}>
                <td>{new Date(run.started_at).toLocaleString()}</td>
                <td>
                  <span className={`status-badge status-${run.status.toLowerCase()}`}>
                    {run.status}
                  </span>
                </td>
                <td>{run.summary || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="form-actions">
          <button onClick={onClose} className="btn-secondary">关闭</button>
        </div>
      </div>
    </div>
  );
}

export default App;

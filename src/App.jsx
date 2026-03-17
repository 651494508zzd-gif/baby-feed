import { useState, useEffect } from 'react';
import './App.css';
import { getRecords, saveRecord, deleteRecord, getTodayRecords, getWeekRecords } from './services/storageService';
import { parseVoiceInput, getTypeName, getTypeIcon } from './services/voiceParser';
import { generateWeeklyReport } from './services/reportService';

function App() {
  const [records, setRecords] = useState([]);
  const [inputText, setInputText] = useState('');
  const [parsedRecord, setParsedRecord] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    const data = getRecords();
    data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setRecords(data);
  };

  const handleParse = () => {
    if (!inputText.trim()) return;
    const parsed = parseVoiceInput(inputText);
    if (parsed) {
      setParsedRecord(parsed);
    } else {
      alert('无法解析，请尝试输入如：宝宝13:00喝奶180ml');
    }
  };

  const handleSave = () => {
    if (parsedRecord) {
      saveRecord(parsedRecord);
      setParsedRecord(null);
      setInputText('');
      loadRecords();
    }
  };

  const handleDelete = (id) => {
    deleteRecord(id);
    loadRecords();
  };

  const handleGenerateReport = () => {
    const weekRecords = getWeekRecords();
    const reportData = generateWeeklyReport(weekRecords);
    setReport(reportData);
    setShowReport(true);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'report') {
      handleGenerateReport();
    }
  };

  const todayRecords = getTodayRecords();
  const todayMilk = todayRecords.filter(r => r.type === 'milk').reduce((sum, r) => sum + r.amount, 0);
  const todaySolid = todayRecords.filter(r => r.type === 'solid').reduce((sum, r) => sum + r.amount, 0);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return '今天';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return '昨天';
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>宝宝喂养记录</h1>
          <p className="header-subtitle">记录每一次成长</p>
        </div>
      </header>

      <main className="main">
        {activeTab === 'home' && (
          <div className="tab-content">
            <div className="input-section">
              <h2>Quick Record</h2>
              <div className="input-group">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="宝宝13:00喝奶180ml"
                  onKeyPress={(e) => e.key === 'Enter' && handleParse()}
                />
                <button className="btn-primary" onClick={handleParse}>
                  解析
                </button>
              </div>
              <p className="hint">支持：时间 + 喝奶/辅食 + 数量</p>
            </div>

            {parsedRecord && (
              <div className="confirm-section">
                <h3>确认记录</h3>
                <div className="confirm-card">
                  <div className="confirm-icon">{getTypeIcon(parsedRecord.type)}</div>
                  <div className="confirm-info">
                    <p><strong>{getTypeName(parsedRecord.type)}</strong></p>
                    <p>时间：{formatTime(parsedRecord.timestamp)}</p>
                    <p>数量：{parsedRecord.amount}{parsedRecord.unit}</p>
                  </div>
                </div>
                <div className="confirm-actions">
                  <button className="btn-secondary" onClick={() => setParsedRecord(null)}>取消</button>
                  <button className="btn-primary" onClick={handleSave}>保存</button>
                </div>
              </div>
            )}

            <div className="today-summary">
              <h2>今日摘要</h2>
              <div className="summary-cards">
                <div className="summary-card milk">
                  <span className="icon">🍼</span>
                  <span className="value">{todayMilk}</span>
                  <span className="unit">ml</span>
                </div>
                <div className="summary-card solid">
                  <span className="icon">🍚</span>
                  <span className="value">{todaySolid}</span>
                  <span className="unit">g</span>
                </div>
              </div>
              <p className="summary-hint">今日共 {todayRecords.length} 条记录</p>
            </div>

            {records.length > 0 && (
              <div className="recent-records">
                <h3>最近记录</h3>
                <div className="record-list">
                  {records.slice(0, 5).map(record => (
                    <div key={record.id} className="record-item">
                      <span className="record-icon">{getTypeIcon(record.type)}</span>
                      <span className="record-info">
                        <strong>{getTypeName(record.type)}</strong>
                        <span>{record.amount}{record.unit}</span>
                      </span>
                      <span className="record-time">
                        {formatDate(record.timestamp)} {formatTime(record.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="tab-content">
            <h2>历史记录</h2>
            {records.length === 0 ? (
              <div className="empty-state">
                <span>📝</span>
                <p>暂无记录，快去记录吧！</p>
              </div>
            ) : (
              <div className="record-list">
                {records.map(record => (
                  <div key={record.id} className="record-item">
                    <span className="record-icon">{getTypeIcon(record.type)}</span>
                    <div className="record-info">
                      <strong>{getTypeName(record.type)}</strong>
                      <span>{record.amount}{record.unit}</span>
                    </div>
                    <div className="record-right">
                      <span className="record-time">
                        {formatDate(record.timestamp)} {formatTime(record.timestamp)}
                      </span>
                      <button className="btn-delete" onClick={() => handleDelete(record.id)}>
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'report' && (
          <div className="tab-content">
            <h2>本周周报</h2>
            {showReport && report ? (
              <div className="report-content">
                <div className="report-summary">
                  <div className="report-card">
                    <h3>🍼 奶量统计</h3>
                    <p>本周总量：<strong>{report.totalMilk}</strong> ml</p>
                    <p>日均：<strong>{report.avgMilkPerDay}</strong> ml/天</p>
                  </div>
                  <div className="report-card">
                    <h3>🍚 辅食统计</h3>
                    <p>本周总量：<strong>{report.totalSolid}</strong> g</p>
                    <p>日均：<strong>{report.avgSolidPerDay}</strong> g/天</p>
                  </div>
                </div>
                <div className="report-records">
                  <p>本周共记录 <strong>{report.totalRecords}</strong> 次</p>
                </div>
                <div className="report-suggestions">
                  <h3>📋 喂养建议</h3>
                  <ul>
                    {report.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <span>📊</span>
                <p>点击生成周报</p>
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => handleTabChange('home')}
        >
          <span>🏠</span>
          <span>首页</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => handleTabChange('history')}
        >
          <span>📋</span>
          <span>记录</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => handleTabChange('report')}
        >
          <span>📊</span>
          <span>周报</span>
        </button>
      </nav>
    </div>
  );
}

export default App;

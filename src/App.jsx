import { useState, useEffect, useRef } from 'react';
import './App.css';
import { getRecords, saveRecord, deleteRecord, getTodayRecords, getWeekRecords } from './services/storageService';
import { parseVoiceInput, getTypeName, getDisplayName } from './services/voiceParser';
import { generateWeeklyReport } from './services/reportService';
import { VoiceRecognition, isSpeechRecognitionSupported } from './services/voiceRecognition';
import { Baby, UtensilsCrossed, Mic, X, Home, List, BarChart3, Clock, TrendingUp, Lightbulb, FileText, Plus } from 'lucide-react';

function App() {
  const [records, setRecords] = useState([]);
  const [inputText, setInputText] = useState('');
  const [parsedRecord, setParsedRecord] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const voiceRecognitionRef = useRef(null);

  useEffect(() => {
    loadRecords();
    if (isSpeechRecognitionSupported()) {
      voiceRecognitionRef.current = new VoiceRecognition();
    }
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

  const handleVoiceInput = () => {
    if (!isSpeechRecognitionSupported()) {
      alert('您的浏览器不支持语音识别功能，请使用 Chrome 或 Safari 浏览器');
      return;
    }

    if (isListening) {
      voiceRecognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setInterimTranscript('');

    voiceRecognitionRef.current?.start(
      (final, interim) => {
        if (interim) {
          setInterimTranscript(interim);
        }
        if (final) {
          setInputText(final);
          setInterimTranscript('');
        }
      },
      () => {
        setIsListening(false);
        setInterimTranscript('');
        if (inputText.trim()) {
          setTimeout(() => handleParse(), 300);
        }
      },
      (error) => {
        setIsListening(false);
        setInterimTranscript('');
        console.error('语音识别错误:', error);
      }
    );
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

  const getWeekRange = (date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const groupRecordsByWeek = (records) => {
    const groups = {};
    records.forEach(record => {
      const date = new Date(record.timestamp);
      const { start, end } = getWeekRange(date);
      const key = `${start.getTime()}-${end.getTime()}`;
      if (!groups[key]) {
        groups[key] = { start, end, records: [] };
      }
      groups[key].records.push(record);
    });
    return Object.values(groups).sort((a, b) => b.start - a.start);
  };

  const formatWeekRange = (start, end) => {
    const options = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('zh-CN', options)} - ${end.toLocaleDateString('zh-CN', options)}`;
  };

  const getTypeIcon = (type) => {
    return type === 'milk'
      ? <Baby size={28} strokeWidth={1.5} />
      : <UtensilsCrossed size={28} strokeWidth={1.5} />;
  };

  const getTypeName = (type) => {
    return type === 'milk' ? '喝奶' : '辅食';
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>宝宝喂养记录</h1>
          <p className="header-subtitle">记录每一次成长</p>
        </div>
        <div className="header-decoration"></div>
      </header>

      <main className="main">
        {activeTab === 'home' && (
          <div className="tab-content">
            {/* Bento Grid Layout */}
            <div className="bento-grid">
              {/* Input Card - Large */}
              <div className="bento-card input-card">
                <div className="card-label">
                  <Plus size={14} />
                  <span>Quick Record</span>
                </div>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={interimTranscript || inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isListening ? "正在聆听..." : "宝宝13:00喝奶180ml"}
                    onKeyPress={(e) => e.key === 'Enter' && handleParse()}
                    disabled={isListening}
                  />
                  <div className="input-actions">
                    <button
                      className={`btn-icon ${isListening ? 'listening' : ''}`}
                      onClick={handleVoiceInput}
                    >
                      <Mic size={20} strokeWidth={1.5} />
                    </button>
                    <button className="btn-primary" onClick={handleParse}>
                      解析
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bento-card stats-card">
                <div className="card-label">
                  <TrendingUp size={14} />
                  <span>今日</span>
                </div>
                <div className="stats-numbers">
                  <div className="stat-item">
                    <span className="stat-value">{todayMilk}</span>
                    <span className="stat-unit">ml</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <span className="stat-value">{todaySolid}</span>
                    <span className="stat-unit">g</span>
                  </div>
                </div>
                <p className="stats-hint">{todayRecords.length} 条记录</p>
              </div>

              {/* Milk Card */}
              <div className="bento-card milk-card">
                <div className="card-icon milk">
                  <Baby size={32} strokeWidth={1.5} />
                </div>
                <div className="card-content">
                  <span className="card-value">{todayMilk}</span>
                  <span className="card-unit">ml</span>
                </div>
                <span className="card-label-bottom">奶量</span>
              </div>

              {/* Solid Card */}
              <div className="bento-card solid-card">
                <div className="card-icon solid">
                  <UtensilsCrossed size={32} strokeWidth={1.5} />
                </div>
                <div className="card-content">
                  <span className="card-value">{todaySolid}</span>
                  <span className="card-unit">g</span>
                </div>
                <span className="card-label-bottom">辅食</span>
              </div>
            </div>

            {/* Confirm Section */}
            {parsedRecord && (
              <div className="confirm-section">
                <div className="confirm-header">
                  <h3>确认记录</h3>
                  <button className="btn-close" onClick={() => setParsedRecord(null)}>
                    <X size={18} strokeWidth={2} />
                  </button>
                </div>
                <div className="confirm-body">
                  <div className="confirm-icon">
                    {getTypeIcon(parsedRecord.type)}
                  </div>
                  <div className="confirm-info">
                    <p className="confirm-type">
                      {getTypeName(parsedRecord.type)}
                      {parsedRecord.foodName && <span className="food-name">{parsedRecord.foodName}</span>}
                    </p>
                    <div className="confirm-details">
                      <span><Clock size={12} /> {formatTime(parsedRecord.timestamp)}</span>
                      <span>{parsedRecord.amount}{parsedRecord.unit}</span>
                    </div>
                  </div>
                </div>
                <div className="confirm-actions">
                  <button className="btn-secondary" onClick={() => setParsedRecord(null)}>取消</button>
                  <button className="btn-primary" onClick={handleSave}>保存</button>
                </div>
              </div>
            )}

            {/* Recent Records */}
            {records.length > 0 && (
              <div className="recent-section">
                <h2>最近记录</h2>
                <div className="record-list">
                  {records.slice(0, 5).map(record => (
                    <div key={record.id} className="record-item">
                      <div className="record-icon-wrap">
                        {getTypeIcon(record.type)}
                      </div>
                      <div className="record-content">
                        <strong>{getTypeName(record.type)}{record.foodName ? ` (${record.foodName})` : ''}</strong>
                        <span>{record.amount}{record.unit}</span>
                      </div>
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
                <FileText size={48} strokeWidth={1} />
                <p>暂无记录，快去记录吧！</p>
              </div>
            ) : (
              <div className="week-groups">
                {groupRecordsByWeek(records).map(group => (
                  <div key={`${group.start.getTime()}-${group.end.getTime()}`} className="week-group">
                    <div className="week-header">
                      <span className="week-range">{group.start.getFullYear()}年 {formatWeekRange(group.start, group.end)}</span>
                      <span className="week-count">{group.records.length} 条</span>
                    </div>
                    <div className="timeline">
                      {group.records
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                        .map(record => (
                          <div key={record.id} className="timeline-item">
                            <div className="timeline-time">
                              <span className="timeline-date">{formatDate(record.timestamp)}</span>
                              <span className="timeline-clock">{formatTime(record.timestamp)}</span>
                            </div>
                            <div className="timeline-marker">
                              <span className="timeline-dot"></span>
                              <span className="timeline-line"></span>
                            </div>
                            <div className="timeline-content">
                              <div className="record-card-mini">
                                <div className="record-icon-wrap small">
                                  {getTypeIcon(record.type)}
                                </div>
                                <div className="record-details">
                                  <strong>{getTypeName(record.type)}{record.foodName ? ` (${record.foodName})` : ''}</strong>
                                  <span className="record-amount">{record.amount}{record.unit}</span>
                                </div>
                                <button className="btn-delete-small" onClick={() => handleDelete(record.id)}>
                                  <X size={14} strokeWidth={2} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
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
                <div className="bento-grid report-grid">
                  <div className="bento-card report-card milk">
                    <div className="report-icon">
                      <Baby size={24} strokeWidth={1.5} />
                    </div>
                    <h4>奶量统计</h4>
                    <div className="report-value">{report.totalMilk}</div>
                    <span className="report-unit">ml 本周总量</span>
                    <div className="report-avg">日均 {report.avgMilkPerDay} ml</div>
                  </div>
                  <div className="bento-card report-card solid">
                    <div className="report-icon">
                      <UtensilsCrossed size={24} strokeWidth={1.5} />
                    </div>
                    <h4>辅食统计</h4>
                    <div className="report-value">{report.totalSolid}</div>
                    <span className="report-unit">g 本周总量</span>
                    <div className="report-avg">日均 {report.avgSolidPerDay} g</div>
                  </div>
                </div>
                <div className="report-total">
                  <span>本周共记录</span>
                  <strong>{report.totalRecords}</strong>
                  <span>次</span>
                </div>
                <div className="report-suggestions">
                  <h3><Lightbulb size={18} strokeWidth={1.5} /> 喂养建议</h3>
                  <ul>
                    {report.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <BarChart3 size={48} strokeWidth={1} />
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
          <Home size={22} strokeWidth={1.5} />
          <span>首页</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => handleTabChange('history')}
        >
          <List size={22} strokeWidth={1.5} />
          <span>记录</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => handleTabChange('report')}
        >
          <BarChart3 size={22} strokeWidth={1.5} />
          <span>周报</span>
        </button>
      </nav>
    </div>
  );
}

export default App;

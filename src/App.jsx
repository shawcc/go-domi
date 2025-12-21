import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Settings, Plus, CheckCircle, XCircle, Volume2, Gamepad2, 
  Rocket, Zap, Loader2, Activity, BrainCircuit, History, ListTodo, 
  Clock, Gem, Hexagon, Octagon, Triangle, 
  Siren, Sparkles, Mic, Library, Calendar, FileUp, FileDown, Trash2,
  Radar, Flame, Moon, Volume1, Users, ThumbsUp, Image as ImageIcon, Languages, Headphones, ImageOff, Wand2, Search, Calculator, Lock,
  Puzzle, BookOpen, Star, Gift, Sliders, LogOut, User, Cloud, WifiOff, RefreshCw, Download, Palette, Upload, Server, Link, AlertTriangle, Signal, Globe
} from 'lucide-react';

// ==========================================
// --- 0. 基础配置 ---
// ==========================================

// ⚠️ 生产环境配置: 
const SERVER_IP = 'http://43.143.74.76:3000'; 
const BACKEND_HOST = '43.143.74.76:3000';

const GlobalStyles = () => (
  <style>{`
    html, body, #root { margin: 0; padding: 0; width: 100%; height: 100%; max-width: none !important; overflow-x: hidden; font-family: system-ui, -apple-system, sans-serif; background-color: #0f172a; }
    ::-webkit-scrollbar { width: 0px; background: transparent; }
    
    @keyframes shine { 0% { transform: translateX(-100%) rotate(45deg); } 100% { transform: translateX(200%) rotate(45deg); } }
    .shiny-card { position: relative; overflow: hidden; }
    .shiny-card::after { content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to right, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%); transform: translateX(-100%) rotate(45deg); animation: shine 3s infinite; }
    
    @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
    .scan-line { background: linear-gradient(to bottom, transparent, rgba(239, 68, 68, 0.5), transparent); animation: scan 3s linear infinite; }
    .hazard-stripes { background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239, 68, 68, 0.1) 10px, rgba(239, 68, 68, 0.1) 20px); background-size: 50px 50px; }
    
    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `}</style>
);

// --- 核心工具：智能 URL 处理 ---
// forceDirect: 强制使用 SERVER_IP (用于调试)
const getApiEndpoint = (path, forceDirect = false) => {
  // 1. 本地调试 (localhost): 直连 IP
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
     return SERVER_IP ? `${SERVER_IP}${path}` : path;
  }
  // 2. 强制直连模式 (仅用于诊断)
  if (forceDirect) {
     return `${SERVER_IP}${path}`;
  }
  // 3. 线上生产 (Vercel): 强制使用相对路径，依赖 vercel.json 转发
  return path;
};

const proxifyUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url; 
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) return url;
  if (url.includes(BACKEND_HOST)) {
    try { return new URL(url).pathname; } catch (e) { return url; }
  }
  return url;
};

// ==========================================
// --- 1. 基础组件 ---
// ==========================================

const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
    <div className="animate-bounce text-6xl mb-4">🚀</div>
    <h1 className="text-2xl font-bold animate-pulse">正在连接宇宙基地...</h1>
    <p className="text-slate-400 mt-2">系统初始化中</p>
  </div>
);

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
        <h2 className="text-xl font-bold mb-2 text-red-400">基地系统遭遇干扰</h2>
        <p className="text-xs text-slate-500 mb-6 max-w-xs break-all bg-slate-800 p-2 rounded">{this.state.error?.toString()}</p>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="bg-red-600 px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 mx-auto">
           <RefreshCw size={18}/> 重置系统 (清除缓存)
        </button>
      </div>
    );
    return this.props.children; 
  }
}

// ==========================================
// --- 2. 数据引擎与 API ---
// ==========================================
const STORAGE_KEY = 'go_domi_data_v17_robust'; 
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

const DEFAULT_USER_DATA = {
  user: { 
    name: '多米', level: 1, xp: 0, coins: 0, theme: 'cosmic', streak: 1, fragments: 0, 
    pushStartHour: 19, pushEndHour: 21, dailyLimit: 10,
    themeConfig: {
      mascot: '/assets/images/mascot.png',
      background: '/assets/images/bg_cosmic.jpg',
      assistantName: '小雨点'
    },
    taskProbabilities: { english: 50, sport: 30, life: 20 }
  },
  tasks: [],
  library: [],
  collection: { puzzlePieces: [], unlockedCards: [] }
};

const sanitizeData = (incomingData) => {
  if (!incomingData) return DEFAULT_USER_DATA;
  return {
    user: { ...DEFAULT_USER_DATA.user, ...incomingData.user, themeConfig: { ...DEFAULT_USER_DATA.user.themeConfig, ...incomingData.user?.themeConfig } },
    tasks: Array.isArray(incomingData.tasks) ? incomingData.tasks : [],
    library: Array.isArray(incomingData.library) ? incomingData.library : [],
    collection: { ...DEFAULT_USER_DATA.collection, ...incomingData.collection }
  };
};

const LocalDB = {
  get: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return sanitizeData(raw ? JSON.parse(raw) : null);
    } catch { return DEFAULT_USER_DATA; }
  },
  save: (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('local-db-change'));
  },
  export: () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return alert("没有本地数据");
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `domi_backup.json`; a.click();
  },
  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('go_domi_session');
  }
};

const CloudAPI = {
  login: async (username, forceDirect = false) => {
    const endpoint = getApiEndpoint('/api/login', forceDirect);
    
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 8000); 
      
      console.log(`[CloudAPI] Connecting to: ${endpoint}`);
      const res = await fetch(endpoint, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }), 
        signal: controller.signal
      });
      
      if (res.ok) {
        const result = await res.json();
        const safeData = sanitizeData(result.data);
        return { uid: username, token: result.token, initialData: safeData, mode: 'cloud' };
      } else {
        if (res.status === 404 && !forceDirect) {
             throw new Error("404: 代理失败 (缺少 vercel.json 或路径错误)");
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (e) { 
      console.warn("Cloud login failed:", e);
      let warning = `连接失败 (${e.message})。已切换至离线模式。`;
      if (e.message.includes('Failed to fetch') && window.location.protocol === 'https:' && forceDirect) {
          warning = '安全拦截: HTTPS 无法直连 HTTP IP。请关闭“强制直连”并检查 vercel.json。';
      }
      return { uid: username, token: 'offline', initialData: LocalDB.get(), mode: 'offline', warning }; 
    }
  },
  fetchData: async (username) => {
     const endpoint = getApiEndpoint('/api/login');
     try {
       const res = await fetch(endpoint, {
         method: 'POST', headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ username })
       });
       if (res.ok) {
          const result = await res.json();
          const safeData = sanitizeData(result.data);
          LocalDB.save(safeData); 
          return safeData;
       }
     } catch (e) {}
     return LocalDB.get();
  },
  sync: async (username, data, mode) => {
    LocalDB.save(data);
    const endpoint = getApiEndpoint('/api/sync');
    if (mode === 'cloud' || mode === 'force') {
      try { await fetch(endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ username, data }) }); } catch (e) { console.error("Sync failed", e); }
    }
  },
  upload: async (file) => {
    const endpoint = getApiEndpoint('/api/upload');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(endpoint, { method: 'POST', body: formData });
      if (res.ok) {
        const result = await res.json();
        return result.url; 
      }
    } catch (e) { console.warn("Upload failed", e); }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }
};

// ==========================================
// --- 3. 资源配置 ---
// ==========================================
const PUZZLE_CONFIG = { totalPieces: 9, image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80" };
const SYSTEM_DICTIONARY = {
  'cat': { cn: '猫', img: '/assets/images/cat.jpg' }, 'dog': { cn: '狗', img: '/assets/images/dog.jpg' }, 
  'apple': { cn: '苹果', img: '/assets/images/apple.jpg' }, 'banana': { cn: '香蕉', img: '/assets/images/banana.jpg' }, 
  'head': { cn: '头', img: '/assets/images/head.jpg' }, 
};

const enrichWordTask = (wordInput) => {
  const word = wordInput.trim();
  const lowerWord = word.toLowerCase();
  const preset = SYSTEM_DICTIONARY[lowerWord];
  const translation = preset ? preset.cn : ''; 
  const imageUrl = (preset && preset.img) ? preset.img : `https://image.pollinations.ai/prompt/cute cartoon ${word} minimalist vector illustration for children education, white background?width=400&height=300&nologo=true&seed=${Math.random()}`;
  const audioUrl = `/assets/audio/${lowerWord}.mp3`;
  return { word, translation, image: imageUrl, audio: audioUrl };
};

const THEMES = {
  cosmic: {
    id: 'cosmic', name: '宇宙护卫队', bg: 'bg-slate-900', text: 'text-slate-100', card: 'bg-slate-800',
    primary: 'bg-blue-600 hover:bg-blue-500', accent: 'text-yellow-400',
    mascot: '/assets/images/mascot.png', backgroundImage: '/assets/images/bg_cosmic.jpg', 
    assistant: '小雨点', currency: '能量石'
  }
};

const CRYSTAL_STAGES = [
  { minLevel: 1, name: '原初晶核', icon: Hexagon, color: 'text-blue-300', scale: 1, message: "能量..." },
  { minLevel: 3, name: '觉醒晶簇', icon: Triangle, color: 'text-purple-400', scale: 1.2, message: "苏醒..." },
  { minLevel: 6, name: '辉光棱镜', icon: Octagon, color: 'text-pink-400', scale: 1.4, message: "充能！" },
  { minLevel: 9, name: '永恒之心', icon: Gem, color: 'text-yellow-300', scale: 1.6, message: "无敌！" },
];

const REVIEW_INTERVALS = [0, 1, 2, 4, 7, 15, 30]; 
const MAX_DAILY_TASKS = 10; 

// --- Utilities ---
const getBeijingTime = () => { const now = new Date(); return new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + 8 * 3600000); };
const isBeijingActiveWindow = (start, end) => { const h = getBeijingTime().getHours(); return h >= start && h < end; };
const getNextBeijingScheduleTime = () => { const t = getBeijingTime(); t.setHours(19,0,0,0); if(Date.now() >= t.getTime()) t.setDate(t.getDate()+1); return t.getTime(); };
const formatTime = (ts) => new Date(ts).toLocaleString('zh-CN', {month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'});

const speak = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN'; u.rate = 1.0; 
  const zh = window.speechSynthesis.getVoices().find(v => v.lang.includes('zh'));
  if (zh) u.voice = zh;
  window.speechSynthesis.speak(u);
};
const speakEnglish = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = 0.9;
  window.speechSynthesis.speak(u);
};
const playTaskAudio = (text, audioUrl) => {
  if (audioUrl) {
    const safeUrl = proxifyUrl(audioUrl);
    const audio = new Audio(safeUrl);
    audio.play().catch(() => speakEnglish(text));
  } else speakEnglish(text);
};
const playSystemSound = (type) => {
   const sounds = {
     alert: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
     success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
     patrol: 'https://assets.mixkit.co/active_storage/sfx/2044/2044-preview.mp3',
     levelup: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'
   };
   const a = new Audio(sounds[type]); a.volume = 0.4; a.play().catch(()=>{});
};

// ==========================================
// --- 4. 界面组件 ---
// ==========================================

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [useDirect, setUseDirect] = useState(false); // 调试：强制直连

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const session = await CloudAPI.login(username.trim(), useDirect);
      if (session.warning) setErrorMsg(session.warning);
      // 延迟跳转，确保用户看到错误提示
      if (session.mode === 'offline') {
        setTimeout(() => onLogin(session), 2500);
      } else {
        onLogin(session);
      }
    } catch(e) { 
      setErrorMsg(e.message);
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-slate-900 flex flex-col landscape:flex-row items-center justify-center text-white p-6 z-50">
      <div className="relative z-10 w-full max-w-sm bg-slate-800/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-2xl">
        <div className="flex justify-center mb-6"><div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50 animate-bounce"><Rocket size={40} className="text-white" /></div></div>
        <h1 className="text-2xl font-black text-center mb-2">多米宇宙基地</h1>
        <p className="text-slate-400 text-center text-sm mb-8">云端同步版 V17.5 (完整功能)</p>
        
        {SERVER_IP && (
            <div className="mb-4 text-xs bg-blue-900/40 text-blue-200 p-2 rounded border border-blue-500/30 flex items-center justify-between">
                <span className="flex gap-2"><Server size={14}/> {SERVER_IP}</span>
                {/* 隐藏开关：强制 HTTP 直连 (调试用) */}
                <button onClick={()=>setUseDirect(!useDirect)} className={`text-[10px] px-1 rounded ${useDirect?'bg-red-500 text-white':'text-slate-500'}`}>
                   {useDirect ? '强制直连' : '代理模式'}
                </button>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
           <div className="relative">
             <User className="absolute left-3 top-3.5 text-slate-400" size={20} />
             <input 
               type="text" 
               className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
               placeholder="请输入特工代号"
               value={username}
               onChange={e => setUsername(e.target.value)}
             />
           </div>
           <button 
             type="submit" 
             disabled={loading}
             className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2"
           >
             {loading ? <Loader2 className="animate-spin"/> : "连接基地"}
           </button>
        </form>

        {errorMsg && (
           <div className="mt-4 p-3 bg-red-900/50 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-start gap-2 animate-in slide-in-from-top-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
           </div>
        )}
        
        <div className="mt-6 text-center text-xs text-slate-500">
           <button onClick={LocalDB.export} className="text-blue-400 hover:underline">导出本地数据备份</button>
        </div>
      </div>
    </div>
  );
};

const DynamicBackground = ({ themeId, customBg }) => {
  const [bgError, setBgError] = useState(false);
  const safeBg = proxifyUrl(customBg);
  useEffect(() => { setBgError(false); }, [customBg]);
  if (customBg && !bgError) return (<div className="absolute inset-0 z-0"><img src={safeBg} className="w-full h-full object-cover" onError={() => setBgError(true)} /><div className="absolute inset-0 bg-black/40"></div></div>);
  return (<div className="absolute inset-0 overflow-hidden pointer-events-none z-0"><div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black"></div>{[...Array(20)].map((_, i)=><div key={i} className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{left:`${Math.random()*100}%`, top:`${Math.random()*100}%`}}></div>)}</div>);
};

const GrowingCrystal = ({ level, xp, onClick }) => {
  const currentStage = [...CRYSTAL_STAGES].reverse().find(stage => level >= stage.minLevel) || CRYSTAL_STAGES[0];
  const Icon = currentStage.icon;
  const [isPoked, setIsPoked] = useState(false);
  const handlePoke = () => { setIsPoked(true); speak(currentStage.message); if(onClick) onClick(); setTimeout(() => setIsPoked(false), 500); };
  return (<div className="flex-1 flex flex-col items-center justify-center relative py-12 cursor-pointer group w-full" onClick={handlePoke}><div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-80 h-80 border border-blue-500/10 rounded-full animate-[spin-slow_20s_linear_infinite]"><div className="absolute top-0 left-1/2 w-2 h-2 bg-blue-400 rounded-full shadow-lg shadow-blue-400"></div></div></div><div className={`absolute w-64 h-64 rounded-full blur-[80px] opacity-40 animate-pulse-slow transition-colors duration-1000 ${currentStage.color.replace('text-', 'bg-')}`}></div><div className={`relative transition-all duration-300 ease-out ${isPoked ? 'scale-110 rotate-3' : ''}`} style={{ transform: isPoked ? undefined : `scale(1.2)` }}><div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse"></div><Icon size={120} strokeWidth={1} className={`${currentStage.color} drop-shadow-[0_0_30px_rgba(255,255,255,0.6)] filter`} /></div><div className="mt-12 text-center z-10 pointer-events-none"><div className="text-blue-200 text-xs font-bold tracking-[0.2em] uppercase mb-1">当前形态</div><h2 className={`text-3xl font-black text-white drop-shadow-lg ${currentStage.color}`}>{currentStage.name}</h2></div></div>);
};

const TaskPopup = ({ tasks, currentTheme, onCompleteTask, onPlayFlashcard, processingTasks, userProfile }) => {
  const task = tasks[0]; 
  const isProcessing = processingTasks.has(task.id);
  const isEnglish = task.type === 'english';
  const rawImage = isEnglish ? task.flashcardData?.image : (task.image || task.flashcardData?.image);
  const taskImage = proxifyUrl(rawImage);
  const displayTitle = isEnglish ? "英语挑战" : task.title;
  const assistantName = userProfile?.themeConfig?.assistantName || "小雨点";

  useEffect(() => { const t = setTimeout(() => { playSystemSound('alert'); const intro = isEnglish ? "英语挑战！" : "紧急任务！"; const content = isEnglish ? "请完成一个单词练习" : task.title; setTimeout(() => speak(`${intro} ${content}`), 1000); }, 300); return () => clearTimeout(t); }, [task]);
  return (<div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"><div className="absolute inset-0 overflow-hidden pointer-events-none"><div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-900/20 to-transparent animate-[scan_3s_linear_infinite] transform -translate-y-full scan-line"></div><div className="absolute inset-0 hazard-stripes"></div></div><div className="w-full max-w-lg bg-slate-800 rounded-3xl border-4 border-red-500 shadow-2xl relative overflow-hidden"><div className="bg-red-500 text-white p-4 flex items-center justify-center gap-3 animate-pulse"><Siren size={24} /> <h2 className="text-xl font-black">紧急任务</h2></div><div className="p-8 flex flex-col items-center text-center"><div className="mb-6 w-48 h-48 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border-2 border-white/20 shadow-lg group">{taskImage ? <img src={taskImage} className="w-full h-full object-cover transform transition-transform group-hover:scale-110" onError={(e)=>{e.target.style.display='none'}} /> : <div className="text-6xl animate-bounce">{isEnglish?"A":"⚔️"}</div>}</div><div className="space-y-2 mb-8"><div className="flex items-center justify-center gap-2 text-blue-300 text-xs font-bold uppercase animate-pulse">来自 {assistantName} 的信号...</div><h1 className="text-3xl font-bold text-white">{displayTitle}</h1><div className="inline-flex items-center gap-2 bg-yellow-400/20 text-yellow-400 px-4 py-1 rounded-full border border-yellow-400/30 mt-2"><Zap size={18} fill="currentColor"/><span className="font-bold text-lg">奖励 {task.reward}</span></div></div><div className="w-full">{isEnglish ? <button onClick={()=>onPlayFlashcard(task)} disabled={isProcessing} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-2xl font-black text-xl">开始挑战</button> : <button onClick={()=>onCompleteTask(task)} disabled={isProcessing} className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-black text-xl">确认完成</button>}</div></div></div></div>);
};

const KidDashboard = ({ userProfile, tasks, onCompleteTask, onPlayFlashcard, toggleParentMode, processingTasks, hiddenTaskIds, onStartPatrol, isPatrolling, isPlaying, onOpenCollection, connectionMode, onForceSync }) => {
  const currentTheme = THEMES.cosmic;
  const mascotImg = proxifyUrl(userProfile.themeConfig?.mascot || currentTheme.mascot);
  const bgImg = proxifyUrl(userProfile.themeConfig?.background || currentTheme.backgroundImage);
  const progressPercent = Math.min((userProfile.xp / (userProfile.level*100)) * 100, 100);

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} flex flex-col relative`}>
      <DynamicBackground themeId="cosmic" customBg={bgImg} />
      {isPatrolling && <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60"><div className="w-[300px] h-[300px] border-4 border-green-500 rounded-full animate-ping"></div><div className="mt-8 text-green-400 font-mono text-2xl font-black animate-pulse">SCANNING...</div></div>}
      <div onClick={onForceSync} className={`w-full py-1 text-center text-[10px] font-bold cursor-pointer transition-colors ${connectionMode === 'cloud' ? 'bg-green-600 text-white' : 'bg-red-600 text-white animate-pulse'}`}>{connectionMode === 'cloud' ? '🟢 基地在线' : `🔴 ${connectionMode === 'offline' ? '离线模式' : '连接异常'} (点击重试)`}</div>
      <div className="w-full p-4 flex justify-between items-center bg-black/20 backdrop-blur-md z-10"><div className="flex items-center gap-3"><div className="w-14 h-14 bg-white/10 rounded-full overflow-hidden"><img src={mascotImg} className="w-full h-full object-cover" onError={(e)=>{e.target.style.display='none';e.target.nextSibling.style.display='block'}}/><Rocket className="text-yellow-400 hidden" size={32}/></div><div><div className="font-bold">多米队长</div><div className="text-xs opacity-70">Lv.{userProfile.level}</div></div></div><div className="flex gap-3"><div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full"><Zap size={14} className="text-yellow-400"/><span className="font-bold text-yellow-400">{userProfile.coins}</span></div><button onClick={toggleParentMode}><Settings size={20}/></button></div></div>
      <div className="flex-1 relative z-10 flex flex-col"><div className="px-6 mt-4"><div className="w-full bg-black/40 h-3 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{width: `${progressPercent}%`}}></div></div></div><GrowingCrystal level={userProfile.level} xp={userProfile.xp} onClick={() => speak(currentTheme.currency)} /><div className="fixed bottom-6 w-full flex justify-center gap-6 items-end pb-4 pointer-events-none"><button onClick={()=>onOpenCollection('puzzle')} className="pointer-events-auto w-16 h-16 bg-slate-800/80 rounded-full flex items-center justify-center border-2 border-slate-600"><Puzzle className="text-yellow-400"/></button><button onClick={onStartPatrol} disabled={isPatrolling} className="pointer-events-auto w-24 h-24 bg-blue-600 rounded-full flex flex-col items-center justify-center border-4 border-blue-400 shadow-xl mb-2"><Radar className="text-white w-10 h-10"/><span className="text-[10px] font-black uppercase mt-1">巡逻</span></button><button onClick={()=>onOpenCollection('cards')} className="pointer-events-auto w-16 h-16 bg-slate-800/80 rounded-full flex items-center justify-center border-2 border-slate-600"><BookOpen className="text-blue-400"/></button></div></div>
      {tasks.length > 0 && !isPlaying && <TaskPopup userProfile={userProfile} tasks={tasks} currentTheme={currentTheme} onCompleteTask={onCompleteTask} onPlayFlashcard={onPlayFlashcard} processingTasks={processingTasks} />}
    </div>
  );
};

const ParentDashboard = ({ userProfile, tasks, libraryItems, onAddTask, onClose, onDeleteTask, onUpdateProfile, onManageLibrary, onDataChange, sessionUid, onForceSync }) => {
    const [activeTab, setActiveTab] = useState('library'); 
    const [saveStatus, setSaveStatus] = useState(''); 
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskType, setNewTaskType] = useState('generic');
    const [newTaskReward, setNewTaskReward] = useState(20);
    const [flashcardWord, setFlashcardWord] = useState('');
    const [flashcardTrans, setFlashcardTrans] = useState('');
    const [flashcardImg, setFlashcardImg] = useState('');
    const [flashcardAudio, setFlashcardAudio] = useState('');
    const [batchWords, setBatchWords] = useState('');
    const [uploading, setUploading] = useState(false);
    const [pushStart, setPushStart] = useState(userProfile.pushStartHour || 19);
    const [pushEnd, setPushEnd] = useState(userProfile.pushEndHour || 21);
    const [dailyLimit, setDailyLimit] = useState(userProfile.dailyLimit || 10);
    const [taskProbabilities, setTaskProbabilities] = useState(userProfile.taskProbabilities || { english: 50, sport: 30, life: 20 });
    const [themeMascot, setThemeMascot] = useState(userProfile.themeConfig?.mascot || '');
    const [themeBg, setThemeBg] = useState(userProfile.themeConfig?.background || '');
    const [assistantName, setAssistantName] = useState(userProfile.themeConfig?.assistantName || '');
    const mascotInputRef = useRef(null); const bgInputRef = useRef(null);
    const safeTasks = Array.isArray(tasks) ? tasks : []; const safeLibrary = Array.isArray(libraryItems) ? libraryItems : [];
    const pendingTasks = safeTasks.filter(t => t.status === 'pending'); const completedTasks = safeTasks.filter(t => t.status === 'completed');
    const upcomingTasks = safeLibrary.filter(item => item.nextReview && item.nextReview > Date.now()).sort((a,b) => a.nextReview - b.nextReview);
    const refresh = () => { if(onDataChange) onDataChange(); };
    const handleUpload = async (e, type) => { const file = e.target.files[0]; if(!file)return; setUploading(true); try { const url = await CloudAPI.upload(file); if (type === 'mascot') setThemeMascot(url); if (type === 'bg') setThemeBg(url); alert("上传成功!"); } catch (err) { alert(err.message); } finally { setUploading(false); } };
    const handleSaveTheme = () => { onUpdateProfile({ themeConfig: { mascot: themeMascot, background: themeBg, assistantName: assistantName } }); setSaveStatus('theme'); setTimeout(() => setSaveStatus(''), 2000); alert("✅ 主题已更新！"); };
    const handlePush = (e) => { e.preventDefault(); onAddTask({ title: newTaskTitle, type: newTaskType, reward: parseInt(newTaskReward), image: newTaskType==='generic'?flashcardImg:undefined, flashcardData: newTaskType === 'english' ? { word: flashcardWord, translation: flashcardTrans, image: flashcardImg, audio: flashcardAudio } : null }); setNewTaskTitle(''); setFlashcardWord(''); setFlashcardTrans(''); setFlashcardImg(''); setFlashcardAudio(''); alert('已推送'); refresh(); };
    const handleAddToLibrary = (e) => { e.preventDefault(); onManageLibrary('add', { title: newTaskTitle, type: newTaskType, reward: parseInt(newTaskReward), image: newTaskType==='generic'?flashcardImg:undefined, flashcardData: newTaskType === 'english' ? { word: flashcardWord, translation: flashcardTrans, image: flashcardImg, audio: flashcardAudio } : null, memoryLevel: 0, nextReview: getNextBeijingScheduleTime(parseInt(pushStart)) }); setNewTaskTitle(''); setFlashcardWord(''); setFlashcardTrans(''); setFlashcardImg(''); setFlashcardAudio(''); alert('已添加到库'); refresh(); };
    const handleBatchAddWords = () => { if (!batchWords.trim()) return; const words = batchWords.split(/[,，\n]/).map(w => w.trim()).filter(w => w); const batchTime = getNextBeijingScheduleTime(parseInt(pushStart)); let count = 0; words.forEach(word => { const enrichedData = enrichWordTask(word); onManageLibrary('add', { title: `练习单词: ${enrichedData.word}`, type: 'english', reward: 20, flashcardData: enrichedData, memoryLevel: 0, nextReview: batchTime }); count++; }); alert(`成功生成 ${count} 个任务！`); setBatchWords(''); refresh(); };
    const handleSaveConfig = () => { onUpdateProfile({ taskProbabilities, pushStartHour: parseInt(pushStart), pushEndHour: parseInt(pushEnd), dailyLimit: parseInt(dailyLimit) }); alert("保存成功"); };
    const handleExport = () => { const BOM = "\uFEFF"; const rows = safeLibrary.map(item => `${(item.title||"").replace(/,/g,"，")},${item.type||"generic"},${item.reward||10},${item.flashcardData?.word||""}`); const blob = new Blob([BOM + "标题,类型,奖励,单词\n" + rows.join("\n")], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = "tasks.csv"; document.body.appendChild(link); link.click(); link.remove(); };
    const handleBackup = () => { const data = LocalDB.get(); const blob = new Blob([JSON.stringify(data)], {type:'application/json'}); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `backup_${Date.now()}.json`; document.body.appendChild(link); link.click(); link.remove(); };
    const handleRestore = (e) => { const file = e.target.files[0]; if(!file)return; const reader = new FileReader(); reader.onload = (ev) => { try { LocalDB.restore(JSON.parse(ev.target.result)); } catch { alert("文件错误"); } }; reader.readAsText(file); };
    const handleLogout = () => { if(confirm("确定要退出登录吗？")) window.location.reload(); };

    return (<div className="fixed inset-0 bg-slate-100 z-50 p-4 overflow-y-auto">
      <div className="flex justify-between mb-4"><h2 className="font-bold text-slate-800">家长后台</h2><button onClick={onClose}><XCircle/></button></div>
      <div className="flex gap-2 mb-4 overflow-x-auto">{['library','theme','config','plan','monitor'].map(t=><button key={t} onClick={()=>setActiveTab(t)} className={`px-4 py-2 rounded-lg font-bold capitalize whitespace-nowrap ${activeTab===t?'bg-blue-600 text-white':'bg-white text-slate-600'}`}>{t}</button>)}</div>
      {activeTab==='library' && <div className="space-y-6"><div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100"><h3 className="font-bold mb-2 flex items-center gap-2 text-blue-800"><Wand2 size={16}/> 智能批量添加</h3><textarea className="w-full border p-2 rounded mb-2 text-sm" value={batchWords} onChange={e=>setBatchWords(e.target.value)} placeholder="输入单词，逗号分隔 (如: apple, banana)"/><button onClick={handleBatchAddWords} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">一键生成</button></div><div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-slate-300"><h3 className="font-bold mb-4">手动添加任务</h3><div className="flex gap-2 mb-3"><button onClick={()=>setNewTaskType('generic')} className={`flex-1 py-2 border rounded-lg text-sm font-bold ${newTaskType==='generic'?'bg-slate-200 border-slate-400':''}`}>通用任务</button><button onClick={()=>setNewTaskType('english')} className={`flex-1 py-2 border rounded-lg text-sm font-bold ${newTaskType==='english'?'bg-purple-100 border-purple-400 text-purple-700':''}`}>英语任务</button></div><div className="space-y-3"><div className="flex gap-2"><input className="flex-1 border p-2 rounded" value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} placeholder="任务名称 (必填)" /><input className="w-20 border p-2 rounded" type="number" value={newTaskReward} onChange={e=>setNewTaskReward(e.target.value)} placeholder="奖励" /></div>{newTaskType === 'english' && <div className="bg-purple-50 p-3 rounded border border-purple-100 space-y-2"><div className="flex gap-2"><input className="flex-1 border p-2 rounded text-sm" placeholder="英文单词" value={flashcardWord} onChange={e=>setFlashcardWord(e.target.value)} /><input className="flex-1 border p-2 rounded text-sm" placeholder="中文释义" value={flashcardTrans} onChange={e=>setFlashcardTrans(e.target.value)} /></div><input className="w-full border p-2 rounded text-sm" placeholder="图片 URL" value={flashcardImg} onChange={e=>setFlashcardImg(e.target.value)} /><input className="w-full border p-2 rounded text-sm" placeholder="发音 URL" value={flashcardAudio} onChange={e=>setFlashcardAudio(e.target.value)} /></div>}{newTaskType === 'generic' && <input className="w-full border p-2 rounded text-sm" placeholder="图片 URL (选填)" value={flashcardImg} onChange={e=>setFlashcardImg(e.target.value)} />}<div className="flex gap-2"><button onClick={handleAddToLibrary} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg font-bold">加入计划库</button><button onClick={handlePush} className="flex-1 bg-slate-800 text-white py-3 rounded-lg font-bold">立即推送</button></div></div></div><div className="bg-white p-4 rounded-xl shadow-sm"><div className="flex justify-between items-center mb-4"><h3 className="font-bold">任务库 ({safeLibrary.length})</h3><div className="flex gap-2"><button onClick={handleExport} className="text-xs text-blue-600">导出CSV</button></div></div><div className="space-y-2 max-h-[300px] overflow-y-auto">{safeLibrary.map(i=>(<div key={i.id} className="flex justify-between border-b p-2 items-center"><div><div className="font-bold text-sm">{i.title}</div><div className="text-xs text-slate-400">Lv.{i.memoryLevel}</div></div><button onClick={()=>onManageLibrary('del',i.id)} className="text-red-400 p-2"><Trash2 size={16}/></button></div>))}</div></div></div>}
      {activeTab==='theme' && <div className="bg-white p-4 rounded shadow space-y-4"><h3 className="font-bold flex items-center gap-2"><Palette size={18}/> 主题定制 (支持上传)</h3><div className="space-y-4"><div><label className="text-xs text-slate-500 block mb-1">队长头像</label><div className="flex gap-2"><input className="border flex-1 p-2 rounded text-sm" value={themeMascot} onChange={e=>setThemeMascot(e.target.value)} placeholder="输入URL 或 上传"/><button disabled={uploading} onClick={()=>mascotInputRef.current.click()} className="bg-slate-200 px-3 rounded"><Upload size={16}/></button></div><input type="file" ref={mascotInputRef} className="hidden" accept="image/*" onChange={(e)=>handleUpload(e,'mascot')}/>{themeMascot && <img src={proxifyUrl(themeMascot)} className="w-10 h-10 mt-2 rounded object-cover"/>}</div><div><label className="text-xs text-slate-500 block mb-1">背景图片</label><div className="flex gap-2"><input className="border flex-1 p-2 rounded text-sm" value={themeBg} onChange={e=>setThemeBg(e.target.value)} placeholder="输入URL 或 上传"/><button disabled={uploading} onClick={()=>bgInputRef.current.click()} className="bg-slate-200 px-3 rounded"><Upload size={16}/></button></div><input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={(e)=>handleUpload(e,'bg')}/>{themeBg && <img src={proxifyUrl(themeBg)} className="w-20 h-10 mt-2 rounded object-cover"/>}</div><div><label className="text-xs text-slate-500">助手名字</label><input className="border w-full p-2 rounded" value={assistantName} onChange={e=>setAssistantName(e.target.value)} placeholder="小雨点"/></div></div><button onClick={handleSaveTheme} className={`w-full py-3 rounded font-bold transition-all ${saveStatus==='theme' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>{saveStatus==='theme' ? '✅ 已保存' : '应用主题'}</button></div>}
      {activeTab==='config' && <div className="bg-white p-4 rounded shadow space-y-6"><h3 className="font-bold flex items-center gap-2"><Sliders size={18}/> 调度配置</h3><div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-slate-500">开始时间</label><input className="border w-full p-2 rounded" type="number" value={pushStart} onChange={e=>setPushStart(e.target.value)}/></div><div><label className="text-xs text-slate-500">结束时间</label><input className="border w-full p-2 rounded" type="number" value={pushEnd} onChange={e=>setPushEnd(e.target.value)}/></div><div className="col-span-2"><label className="text-xs text-slate-500">每日上限</label><input className="border w-full p-2 rounded" type="number" value={dailyLimit} onChange={e=>setDailyLimit(e.target.value)}/></div></div><div className="border-t pt-4"><label className="text-xs text-slate-500 block mb-2">随机任务概率</label>{['english','sport','life'].map(type=>(<div key={type} className="flex items-center gap-2 mb-2"><span className="text-xs w-12 capitalize">{type}</span><input type="range" className="flex-1" min="0" max="100" value={taskProbabilities[type]} onChange={e=>setTaskProbabilities(p=>({...p,[type]:parseInt(e.target.value)}))}/><span className="text-xs w-8">{taskProbabilities[type]}%</span></div>))}</div><button onClick={handleSaveConfig} className="bg-slate-800 text-white w-full py-3 rounded font-bold">保存配置</button><div className="border-t pt-4 grid grid-cols-2 gap-3"><button onClick={handleBackup} className="p-3 bg-slate-100 rounded text-xs font-bold">备份数据</button><button onClick={()=>fileInputRef.current.click()} className="p-3 bg-slate-100 rounded text-xs font-bold">恢复数据</button><input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleRestore}/></div><div className="pt-4 border-t flex justify-between"><button onClick={onForceSync} className="text-blue-600 text-xs flex gap-1"><Cloud size={14}/> 强制覆盖云端数据</button><button onClick={handleLogout} className="text-red-500 text-xs">退出</button></div></div>}
      {activeTab==='plan' && <div className="bg-white p-4 rounded"><h3 className="font-bold mb-2">待推送队列</h3>{libraryItems.filter(i=>i.nextReview<=Date.now()).length===0?<p className="text-slate-400 text-sm">无到期任务</p>:libraryItems.filter(i=>i.nextReview<=Date.now()).map(i=><div key={i.id} className="p-2 border-b text-sm">{i.title}</div>)}</div>}
      {activeTab==='monitor' && <div className="bg-white p-4 rounded"><h3 className="font-bold mb-2">实时待办</h3>{pendingTasks.map(t=><div key={t.id} className="p-2 border-b flex justify-between items-center"><span className="text-sm">{t.title}</span><button onClick={()=>onDeleteTask(t.id)} className="text-red-500 text-xs border px-2 py-1 rounded">撤回</button></div>)}</div>}
      {activeTab==='history' && <div className="bg-white p-4 rounded"><h3 className="font-bold mb-2">完成记录</h3>{completedTasks.map(t=><div key={t.id} className="p-2 border-b text-sm flex justify-between"><span>{t.title}</span><span className="text-green-600">{formatTime(t.completedAt)}</span></div>)}</div>}
    </div>);
};

const FlashcardGame = ({ task, onClose, onComplete }) => {
    const [step, setStep] = useState('learning'); 
    const [mathQ, setMathQ] = useState({ a: 0, b: 0 }); 
    const [mathAns, setMathAns] = useState('');
    const word = task.flashcardData?.word || "Apple";
    const imageUrl = proxifyUrl(task.flashcardData?.image);
    useEffect(() => { if(step==='learning') setTimeout(()=>playTaskAudio(word, task.flashcardData?.audio), 500); }, [step]);
    const checkMath = () => { if(parseInt(mathAns)===mathQ.a*mathQ.b){ setStep('success'); speak("太棒了！"); setTimeout(()=>onComplete(task),2000); } else alert("算错啦"); };
    
    // 生成乘法题
    const generateMath = () => {
      const a = Math.floor(Math.random() * 7) + 3; 
      const b = Math.floor(Math.random() * 7) + 3;
      setMathQ({ a, b });
      setMathAns('');
    };

    const handleGoTeach = () => {
       setStep('challenge');
       generateMath();
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
        <div className="bg-white text-slate-900 w-full max-w-md landscape:max-w-4xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col landscape:flex-row max-h-[90vh]">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full z-10"><XCircle /></button>
            <div className="w-full h-64 landscape:w-1/2 landscape:h-full bg-slate-100 flex items-center justify-center overflow-hidden"><img src={imageUrl} className="w-full h-full object-cover" onError={(e)=>{e.target.style.display='none'}}/></div>
            <div className="p-8 text-center flex-1 overflow-y-auto landscape:w-1/2 landscape:flex landscape:flex-col landscape:justify-center">
            {step==='success' ? <div className="py-8"><Trophy size={80} className="mx-auto text-yellow-400"/><h2 className="text-3xl font-bold">挑战成功</h2></div> : <>
                <h1 className="text-6xl font-bold text-blue-600 mb-4">{word}</h1>
                <button onClick={()=>playTaskAudio(word, task.flashcardData?.audio)} className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full mb-8"><Headphones size={20}/> 听发音</button>
                {step==='learning' ? <button onClick={handleGoTeach} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-xl">教爷爷奶奶</button> : <div className="bg-slate-50 p-4 rounded-xl"><div className="flex justify-between items-center mb-2"><span className="text-xl font-mono font-bold">{mathQ.a} x {mathQ.b} = ?</span><input type="number" className="w-20 border rounded p-2 text-center" value={mathAns} onChange={e=>setMathAns(e.target.value)}/></div><button onClick={checkMath} className="w-full bg-green-500 text-white py-2 rounded font-bold">家长确认</button></div>}
            </>}
            </div>
        </div>
        </div>
    );
};

const RewardModal = ({ rewards, onClose }) => (<div onClick={onClose} className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/95"><div className="bg-slate-800 border-4 border-yellow-400 p-8 rounded-3xl text-center"><h2 className="text-3xl text-white font-black mb-4">任务完成!</h2><div className="text-yellow-400 text-xl font-bold mb-8">+{rewards.coins} 能量石</div><button className="bg-yellow-500 w-full py-4 rounded-xl font-bold">开心收下</button></div></div>);
const CollectionModal = ({collection, onClose}) => (<div className="fixed inset-0 z-50 bg-slate-900 text-white"><div className="p-4 flex justify-between border-b border-slate-700"><h2 className="font-bold">收藏馆</h2><button onClick={onClose}><XCircle/></button></div><div className="p-8 text-center text-slate-500">拼图与卡片展示区</div></div>);

// ==========================================
// --- 主程序 ---
// ==========================================
export default function App() {
  const [session, setSession] = useState(null);
  const [data, setData] = useState(null);
  const [isParentMode, setIsParentMode] = useState(false);
  const [activeFlashcardTask, setActiveFlashcardTask] = useState(null);
  const [isPatrolling, setIsPatrolling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCollection, setShowCollection] = useState(false);
  const [rewardData, setRewardData] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('go_domi_session');
    if (saved) {
       const s = JSON.parse(saved);
       setSession(s);
       CloudAPI.fetchData(s.uid).then(d => { setData(d); setLoading(false); });
    } else { setLoading(false); }
  }, []);

  const handleLogin = async (s) => {
    localStorage.setItem('go_domi_session', JSON.stringify(s));
    setSession(s); 
    setData(s.initialData); 
  };

  const persist = (newData) => { setData(newData); CloudAPI.sync(session.uid, newData, session.mode); };
  
  const handleForceSync = async () => {
    if(!session) return;
    if(confirm("确定要将当前设备的本地数据覆盖到云端吗？")) {
       await CloudAPI.sync(session.uid, data, 'force'); // 强制云端同步
       alert("已强制同步到云端！");
    }
  };

  const handleComplete = (task) => {
    const newData = { ...data };
    const t = newData.tasks.find(x => x.id === task.id);
    if(t) { t.status = 'completed'; t.completedAt = Date.now(); }
    newData.user.coins += task.reward; newData.user.xp += task.reward;
    persist(newData);
    setActiveFlashcardTask(null);
    setRewardData({ coins: task.reward, xp: task.reward });
  };

  const handleStartPatrol = () => {
    setIsPatrolling(true); speak("雷达启动");
    setTimeout(() => {
      const newData = { ...data };
      const candidate = newData.library.find(i => !newData.tasks.find(t=>t.libraryId===i.id && t.status==='pending'));
      if(candidate) newData.tasks.push({...candidate, id: generateId(), status:'pending', createdAt: Date.now(), libraryId: candidate.id});
      else { const w = enrichWordTask('random'); newData.tasks.push({id:generateId(), title:`练习:${w.word}`, type:'english', reward:15, flashcardData:w, status:'pending', createdAt:Date.now()}); }
      persist(newData); setIsPatrolling(false); speak("发现任务");
    }, 2000);
  };

  const handleManageLibrary = (act, item) => { const newData={...data}; if(act==='add') newData.library.push({...item, id:generateId()}); else newData.library=newData.library.filter(i=>i.id!==item); persist(newData); };
  const handleAddTask = (item) => { const newData={...data}; newData.tasks.push({...item, id:generateId(), status:'pending'}); persist(newData); };
  const handleDeleteTask = (id) => { const newData={...data}; newData.tasks=newData.tasks.filter(t=>t.id!==id); persist(newData); };
  const handleUpdateProfile = (u) => { const newData={...data}; newData.user={...newData.user,...u}; persist(newData); };
  const handleLogout = () => { if(confirm("确定要退出登录吗？")){ localStorage.removeItem('go_domi_session'); window.location.reload(); }};

  if (loading) return <LoadingScreen />;
  if (!session) return <LoginScreen onLogin={handleLogin} />;
  
  if (!data || !data.user) return <LoadingScreen />;

  return (
    <div className="font-sans antialiased select-none text-slate-900">
      <ErrorBoundary>
        <GlobalStyles />
        <KidDashboard 
          userProfile={data.user} tasks={data.tasks.filter(t=>t.status==='pending')} 
          onCompleteTask={handleComplete} onPlayFlashcard={setActiveFlashcardTask} 
          toggleParentMode={() => setIsParentMode(true)} 
          processingTasks={new Set()} hiddenTaskIds={new Set()} 
          onStartPatrol={handleStartPatrol} isPatrolling={isPatrolling} isPlaying={!!activeFlashcardTask} 
          onOpenCollection={() => setShowCollection(true)}
          connectionMode={session.mode} // 传递连接状态
          onForceSync={handleForceSync}
        />
        {isParentMode && <ParentDashboard userProfile={data.user} tasks={data.tasks} libraryItems={data.library} onAddTask={handleAddTask} onDeleteTask={handleDeleteTask} onUpdateProfile={handleUpdateProfile} onManageLibrary={handleManageLibrary} onClose={() => setIsParentMode(false)} onDataChange={() => setData(LocalDB.get())} sessionUid={session.uid} onForceSync={handleForceSync}/>}
        {activeFlashcardTask && <FlashcardGame task={activeFlashcardTask} onClose={() => setActiveFlashcardTask(null)} onComplete={handleComplete} />}
        {rewardData && <RewardModal rewards={rewardData} onClose={() => setRewardData(null)} />}
        {showCollection && <CollectionModal collection={data.collection || {}} onClose={() => setShowCollection(false)} />}
      </ErrorBoundary>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Settings, Plus, CheckCircle, XCircle, Volume2, Gamepad2, 
  Rocket, Zap, Loader2, Activity, BrainCircuit, History, ListTodo, 
  Clock, Gem, Hexagon, Octagon, Triangle, 
  Siren, Sparkles, Mic, Library, Calendar, FileUp, FileDown, Trash2,
  Radar, Flame, Moon, Volume1, Users, ThumbsUp, Image as ImageIcon, Languages, Headphones, ImageOff, Wand2, Search, Calculator, Lock,
  Puzzle, BookOpen, Star, Gift, Sliders, LogOut, User, Cloud, WifiOff, RefreshCw, Download, Palette, Upload, Server, Link, AlertTriangle, Signal, Globe, Info, Play, RotateCw, Bell, Layers, Edit3, PlusCircle, MinusCircle, Book, X, FileText
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
    @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

    @keyframes shooting-star {
      0% { transform: translateX(0) translateY(0) rotate(45deg); opacity: 1; }
      100% { transform: translateX(-500px) translateY(500px) rotate(45deg); opacity: 0; }
    }
    .shooting-star {
      position: absolute;
      width: 4px; height: 4px;
      background: white; border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(255,255,255,0.1), 0 0 0 8px rgba(255,255,255,0.1), 0 0 20px rgba(255,255,255,1);
      animation: shooting-star 5s linear infinite;
    }
    .shooting-star::before {
      content: ''; position: absolute; top: 50%; transform: translateY(-50%); right: 0; width: 200px; height: 1px;
      background: linear-gradient(to right, transparent, rgba(255,255,255,0.8));
    }
  `}</style>
);

// --- 核心工具：智能 URL 处理 ---
const getApiEndpoint = (path, forceDirect = false) => {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
     return SERVER_IP ? `${SERVER_IP}${path}` : path;
  }
  if (forceDirect) return `${SERVER_IP}${path}`;
  return path;
};

const proxifyUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) return url; 
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
  <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center text-white p-4 z-[100]">
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
// --- 2. 数据引擎 ---
// ==========================================
const STORAGE_KEY = 'go_domi_data_v24_mega_library'; 
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

const CRYSTAL_STAGES = [
  { minLevel: 1, name: '原初晶核', icon: Hexagon, color: 'text-blue-300', scale: 1, message: "能量..." },
  { minLevel: 3, name: '觉醒晶簇', icon: Triangle, color: 'text-purple-400', scale: 1.2, message: "苏醒..." },
  { minLevel: 6, name: '辉光棱镜', icon: Octagon, color: 'text-pink-400', scale: 1.4, message: "充能！" },
  { minLevel: 9, name: '永恒之心', icon: Gem, color: 'text-yellow-300', scale: 1.6, message: "无敌！" },
];

const DEFAULT_USER_DATA = {
  user: { 
    name: '多米', level: 1, xp: 0, coins: 0, theme: 'cosmic', streak: 1, fragments: 0, 
    pushStartHour: 19, pushEndHour: 21, dailyLimit: 10,
    themeConfig: {
      mascot: '/assets/images/mascot.png',
      background: '/assets/images/bg_cosmic.jpg',
      assistantName: '小雨点'
    },
    taskProbabilities: { english: 50, sport: 30, life: 20 },
    levelStages: CRYSTAL_STAGES, 
    nudge: 0
  },
  tasks: [],
  library: [],
  collection: { puzzlePieces: [], unlockedCards: [] }
};

const sanitizeData = (incomingData) => {
  if (!incomingData) return DEFAULT_USER_DATA;
  const safeUser = incomingData.user || {};
  return {
    user: { 
        ...DEFAULT_USER_DATA.user, 
        ...safeUser, 
        themeConfig: { ...DEFAULT_USER_DATA.user.themeConfig, ...(safeUser.themeConfig || {}) },
        taskProbabilities: { ...DEFAULT_USER_DATA.user.taskProbabilities, ...(safeUser.taskProbabilities || {}) },
        levelStages: Array.isArray(safeUser.levelStages) ? safeUser.levelStages : CRYSTAL_STAGES
    },
    tasks: Array.isArray(incomingData.tasks) ? incomingData.tasks : [],
    library: Array.isArray(incomingData.library) ? incomingData.library : [],
    collection: { ...DEFAULT_USER_DATA.collection, ...(incomingData.collection || {}) }
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
  restore: (fullData) => {
    if (!fullData || !fullData.user) { alert("无效的存档文件"); return; }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullData));
    window.dispatchEvent(new Event('local-db-change'));
    window.location.reload(); 
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
      const res = await fetch(endpoint, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }), 
        signal: controller.signal
      });
      if (res.ok) {
        const result = await res.json();
        return { uid: username, token: result.token, initialData: sanitizeData(result.data), mode: 'cloud' };
      } else {
        if (res.status === 404 && !forceDirect) throw new Error("404: 代理失败");
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (e) { 
      let warning = `连接失败 (${e.message})。已切换至离线模式。`;
      if (e.message.includes('Failed to fetch') && window.location.protocol === 'https:' && forceDirect) warning = '安全拦截: HTTPS 无法直连 HTTP IP。';
      return { uid: username, token: 'offline', initialData: LocalDB.get(), mode: 'offline', warning, debugInfo: endpoint }; 
    }
  },
  fetchData: async (username) => {
     try {
       const res = await fetch(getApiEndpoint('/api/login'), {
         method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username })
       });
       if (res.ok) {
          const result = await res.json();
          const safeData = sanitizeData(result.data);
          LocalDB.save(safeData); 
          return safeData;
       }
     } catch (e) {}
     return null;
  },
  sync: async (username, data, mode) => {
    LocalDB.save(data);
    if (mode === 'cloud' || mode === 'force') {
      try { await fetch(getApiEndpoint('/api/sync'), { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ username, data }) }); } catch (e) { console.error("Sync failed", e); }
    }
  },
  upload: async (file) => {
    try {
      const formData = new FormData(); formData.append('file', file);
      const res = await fetch(getApiEndpoint('/api/upload'), { method: 'POST', body: formData });
      if (res.ok) { const result = await res.json(); return result.url; }
    } catch (e) { console.warn("Upload failed", e); }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }
};

// ==========================================
// --- 3. 资源与常量 ---
// ==========================================
const PUZZLE_CONFIG = { totalPieces: 9, image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80" };

// 🌟 精选词库：稳定的 Unsplash 图片链接
const SYSTEM_DICTIONARY = {
  'cat': { cn: '猫', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80' },
  'dog': { cn: '狗', img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&q=80' },
  'elephant': { cn: '大象', img: 'https://images.unsplash.com/photo-1557050543-4d5f490d49cd?w=400&q=80' },
  'lion': { cn: '狮子', img: 'https://images.unsplash.com/photo-1546182990-dced71b4827f?w=400&q=80' },
  'bird': { cn: '鸟', img: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400&q=80' },
  'fish': { cn: '鱼', img: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=400&q=80' },
  'apple': { cn: '苹果', img: 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=400&q=80' },
  'banana': { cn: '香蕉', img: 'https://images.unsplash.com/photo-1571771896338-a3d481609fcd?w=400&q=80' },
  'orange': { cn: '橙子', img: 'https://images.unsplash.com/photo-1582979512210-99b6a5338509?w=400&q=80' },
  'ice cream': { cn: '冰淇淋', img: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80' },
  'flower': { cn: '花', img: 'https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?w=400&q=80' },
  'tree': { cn: '树', img: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400&q=80' },
  'car': { cn: '汽车', img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80' },
  'bus': { cn: '公交车', img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&q=80' },
  'airplane': { cn: '飞机', img: 'https://images.unsplash.com/photo-1559087867-ce4c91325525?w=400&q=80' },
  'head': { cn: '头', img: 'https://images.unsplash.com/photo-1531123414780-f74242c2b052?w=400&q=80' },
  'hand': { cn: '手', img: 'https://images.unsplash.com/photo-1466695108335-44674aa2058b?w=400&q=80' },
};

// 🌟 海量预置词库 + 智能图片生成器 (Seed保证一致性)
const getImgUrl = (keyword) => {
    let hash = 0;
    for (let i = 0; i < keyword.length; i++) {
        hash = keyword.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seed = Math.abs(hash);
    return `https://image.pollinations.ai/prompt/cute cartoon ${keyword} minimalist vector illustration for children education, white background?width=400&height=300&nologo=true&seed=${seed}`;
};

const enrichWordTask = (wordInput) => {
  const word = wordInput.trim();
  const lowerWord = word.toLowerCase();
  
  // 1. 查找精品库
  if (SYSTEM_DICTIONARY[lowerWord]) {
      return { 
          word, 
          translation: SYSTEM_DICTIONARY[lowerWord].cn, 
          image: SYSTEM_DICTIONARY[lowerWord].img, 
          audio: '' 
      };
  }

  // 2. 自动生成图片 (带缓存Seed)
  const imageUrl = getImgUrl(word);
  return { word, translation: '', image: imageUrl, audio: '' };
};

const THEMES = {
  cosmic: {
    id: 'cosmic', name: '宇宙护卫队', bg: 'bg-slate-900', text: 'text-slate-100', card: 'bg-slate-800',
    primary: 'bg-blue-600 hover:bg-blue-500', accent: 'text-yellow-400',
    mascot: '/assets/images/mascot.png', backgroundImage: '/assets/images/bg_cosmic.jpg', 
    assistant: '小雨点', currency: '能量石'
  },
  pokemon: {
    id: 'pokemon', name: '宝可梦大师', bg: 'bg-yellow-100', text: 'text-slate-800', card: 'bg-white/90 border-2 border-yellow-400 shadow-xl',
    primary: 'bg-red-500 hover:bg-red-600', accent: 'text-yellow-600',
    mascot: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png', 
    backgroundImage: 'https://images.unsplash.com/photo-1605979255249-1377d3b3f953?q=80&w=1080', 
    assistant: '洛托姆', currency: '精灵球'
  }
};

const POKEMON_STAGES = [
  { minLevel: 1, name: '小毒虫', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/13.png', scale: 0.8, message: "我要进化！" }, 
  { minLevel: 4, name: '铁壳蛹', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/14.png', scale: 1.0, message: "正在变硬..." }, 
  { minLevel: 8, name: '大针蜂', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/15.png', scale: 1.2, message: "毒针攻击！" }, 
  { minLevel: 12, name: '超级大针蜂', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10090.png', scale: 1.4, message: "嗡嗡嗡！" } 
];

const STAGE_ICONS = [Hexagon, Triangle, Octagon, Gem];
const REVIEW_INTERVALS = [0, 1, 2, 4, 7, 15, 30]; 
const MAX_DAILY_TASKS = 10; 

// --- Utilities ---
const getBeijingTime = () => { const now = new Date(); return new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + 8 * 3600000); };
const isBeijingActiveWindow = (start, end) => { const h = getBeijingTime().getHours(); return h >= start && h < end; };

const getScheduledTimeDisplay = (pushStart, itemNextReview) => {
   const now = Date.now();
   const todayPushStart = new Date();
   todayPushStart.setHours(pushStart, 0, 0, 0);
   if (!itemNextReview) return "未计划";
   if (itemNextReview > now) {
      return new Date(itemNextReview).toLocaleString('zh-CN', {month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'});
   }
   return "✅ 队列中 (随时可发)";
};

const getNextBeijingScheduleTime = (startHour = 19) => { const t = getBeijingTime(); t.setHours(startHour - 8,0,0,0); if(Date.now() >= t.getTime()) t.setDate(t.getDate()+1); return t.getTime(); };
const formatTime = (ts) => new Date(ts).toLocaleString('zh-CN', {month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'});

// 核心 TTS 修复
const speak = (text, lang = 'zh-CN') => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  
  if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => speak(text, lang);
      return;
  }
  
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = lang === 'en-US' ? 0.8 : 1.0;
  
  const voices = window.speechSynthesis.getVoices();
  const bestVoice = voices.find(v => v.lang.includes(lang.replace('_', '-')) && (v.name.includes('Google') || v.name.includes('Microsoft'))) || voices.find(v => v.lang.includes(lang.replace('_', '-')));
  if(bestVoice) u.voice = bestVoice;
  
  window.speechSynthesis.speak(u);
};

const playTaskAudio = (text, audioUrl) => {
  speak(text, 'en-US'); 
};

const playSystemSound = (type) => {
   const sounds = {
     alert: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
     success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
     patrol: 'https://assets.mixkit.co/active_storage/sfx/2044/2044-preview.mp3',
     levelup: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
     nudge: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'
   };
   const a = new Audio(sounds[type]); a.volume = 0.5; a.play().catch(()=>{});
};

// ==========================================
// --- 4. 界面组件 ---
// ==========================================

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [useDirect, setUseDirect] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); if (!username.trim()) return; setLoading(true); setErrorMsg('');
    try {
      const session = await CloudAPI.login(username.trim(), useDirect);
      if (session.warning) setErrorMsg(session.warning);
      if (session.mode === 'offline') setTimeout(() => onLogin(session), 2500); else onLogin(session);
    } catch(e) { setErrorMsg(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-slate-900 flex flex-col landscape:flex-row items-center justify-center text-white p-6 z-[200]">
      <div className="relative z-10 w-full max-w-sm bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-2xl">
        <div className="flex justify-center mb-6"><div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50 animate-bounce"><Rocket size={40} className="text-white" /></div></div>
        <h1 className="text-2xl font-black text-center mb-2">多米宇宙基地</h1>
        <p className="text-slate-400 text-center text-sm mb-8">云端同步版 V24.0 (Anki导入)</p>
        {SERVER_IP && (<div className="mb-4 text-xs bg-blue-900/40 text-blue-200 p-2 rounded border border-blue-500/30 flex items-center justify-between"><span className="flex gap-2"><Server size={14}/> {SERVER_IP}</span><button onClick={()=>setUseDirect(!useDirect)} className={`text-[10px] px-1 rounded ${useDirect?'bg-red-500 text-white':'text-slate-500'}`}>{useDirect ? '强制直连' : '代理模式'}</button></div>)}
        <form onSubmit={handleSubmit} className="space-y-4"><div className="relative"><User className="absolute left-3 top-3.5 text-slate-400" size={20} /><input type="text" className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-400" placeholder="特工代号" value={username} onChange={e => setUsername(e.target.value)} /></div><button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2">{loading ? <Loader2 className="animate-spin"/> : "连接基地"}</button></form>
        {errorMsg && <div className="mt-4 p-3 bg-red-900/50 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-start gap-2"><AlertTriangle size={16} className="shrink-0 mt-0.5" /><span>{errorMsg}</span></div>}
        <div className="mt-6 text-center text-xs text-slate-500"><button onClick={LocalDB.export} className="text-blue-400 hover:underline">导出本地数据备份</button></div>
      </div>
    </div>
  );
};

const DynamicBackground = ({ themeId, customBg }) => {
  const [bgError, setBgError] = useState(false);
  const safeBg = proxifyUrl(customBg);
  useEffect(() => { setBgError(false); }, [customBg]);
  
  if (customBg && !bgError) return (<div className="absolute inset-0 z-0"><img src={safeBg} className="w-full h-full object-cover opacity-80" onError={() => setBgError(true)} /><div className="absolute inset-0 bg-black/30"></div></div>);
  if (themeId === 'cosmic') return (<div className="absolute inset-0 overflow-hidden pointer-events-none z-0"><div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black"></div>{[...Array(20)].map((_, i)=><div key={i} className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{left:`${Math.random()*100}%`, top:`${Math.random()*100}%`}}></div>)}<div className="absolute top-10 right-10 shooting-star"></div></div>);
  return (<div className="absolute inset-0 z-0 bg-gradient-to-br from-yellow-50 to-orange-100"></div>);
};

const MainCharacter = ({ themeId, level, onClick, userProfile }) => {
  const [isPoked, setIsPoked] = useState(false);
  const handlePoke = () => { setIsPoked(true); if(onClick) onClick(); setTimeout(() => setIsPoked(false), 500); };
  
  const stages = (userProfile?.levelStages && userProfile.levelStages.length > 0) 
                 ? userProfile.levelStages 
                 : (themeId === 'pokemon' ? POKEMON_STAGES : CRYSTAL_STAGES);

  const currentStage = [...stages].reverse().find(s => level >= s.minLevel) || stages[0];
  const stageIndex = stages.indexOf(currentStage);
  
  const Icon = STAGE_ICONS[stageIndex % STAGE_ICONS.length] || Hexagon;
  const stageImage = currentStage.image ? proxifyUrl(currentStage.image) : null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative py-12 cursor-pointer group w-full" onClick={() => { handlePoke(); speak(currentStage.message); }}>
        <div className={`relative transition-all duration-300 ease-out ${isPoked ? 'scale-110 -rotate-3' : 'animate-[bounce-slow_3s_infinite]'} drop-shadow-2xl`}>
            {stageImage ? (
                <img src={stageImage} className="w-64 h-64 object-contain filter drop-shadow-lg" alt={currentStage.name} />
            ) : (
                <>
                  <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse"></div>
                  <Icon size={120} strokeWidth={1} className={`${currentStage.color || 'text-blue-400'} drop-shadow-[0_0_30px_rgba(255,255,255,0.6)] filter`} />
                </>
            )}
        </div>
        <div className="mt-8 text-center">
            <div className={`inline-block px-4 py-1 rounded-full font-bold shadow-sm border ${themeId==='pokemon' ? 'bg-white/80 text-slate-800 border-yellow-400' : 'text-blue-200 border-blue-500/30 bg-blue-900/40'}`}>
                Lv.{level} {currentStage.name}
            </div>
        </div>
    </div>
  );
};

const TaskPopup = ({ tasks, currentTheme, onCompleteTask, onPlayFlashcard, processingTasks, userProfile }) => {
  const task = tasks[0]; 
  const isProcessing = processingTasks.has(task.id);
  const isEnglish = task.type === 'english';
  const taskImage = proxifyUrl(isEnglish ? task.flashcardData?.image : (task.image || task.flashcardData?.image));
  const assistantName = userProfile?.themeConfig?.assistantName || currentTheme.assistant;
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => { const t = setTimeout(() => { playSystemSound('alert'); const intro = isEnglish ? "英语挑战！" : "紧急任务！"; const content = isEnglish ? "请完成一个单词练习" : task.title; setTimeout(() => speak(`${intro} ${content}`), 1000); }, 300); return () => clearTimeout(t); }, [task]);
  
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
       <div className={`w-full max-w-sm ${currentTheme.card} rounded-3xl overflow-hidden shadow-2xl relative flex flex-col`}>
          <div className={`${currentTheme.primary} text-white p-3 flex items-center justify-center gap-2 animate-pulse`}><Siren size={20} /> <h2 className="text-lg font-black">紧急任务</h2></div>
          <div className="p-6 flex flex-col items-center text-center">
            <div className="mb-4 w-48 h-48 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200 shadow-inner relative">
                {!imgLoaded && taskImage && <div className="absolute inset-0 flex items-center justify-center bg-slate-200"><Loader2 className="animate-spin text-slate-400"/></div>}
                {taskImage ? <img src={taskImage} className="w-full h-full object-cover transform transition-transform group-hover:scale-110" onLoad={() => setImgLoaded(true)} onError={(e)=>{e.target.style.display='none'; setImgLoaded(true);}} /> : <div className="text-6xl animate-bounce">{isEnglish?"A":"⚔️"}</div>}
            </div>
            
            {isEnglish && (
                <button onClick={() => speak(task.flashcardData.word, 'en-US')} className="absolute top-16 right-6 bg-white p-2 rounded-full shadow-md text-blue-600 hover:scale-110 transition-transform">
                    <Volume2 size={24} />
                </button>
            )}

            <div className="space-y-1 mb-6">
               <div className="text-xs font-bold uppercase opacity-60">来自 {assistantName} 的信号</div>
               <h1 className={`text-2xl font-black ${currentTheme.text === 'text-slate-100' ? 'text-white' : 'text-slate-800'}`}>{task.title}</h1>
               <div className="inline-flex items-center gap-1 bg-yellow-400/20 text-yellow-600 px-3 py-0.5 rounded-full mt-2 font-bold text-sm"><Zap size={14} fill="currentColor"/> +{task.reward}</div>
            </div>
            <div className="w-full">
              {isEnglish ? <button onClick={()=>onPlayFlashcard(task)} disabled={isProcessing} className={`w-full ${currentTheme.primary} text-white py-3 rounded-xl font-bold text-lg shadow-lg active:scale-95`}>开始挑战</button> : <button onClick={()=>onCompleteTask(task)} disabled={isProcessing} className={`w-full ${currentTheme.primary} text-white py-3 rounded-xl font-bold text-lg shadow-lg active:scale-95`}>确认完成</button>}
            </div>
          </div>
       </div>
    </div>
  );
};

const KidDashboard = ({ userProfile, tasks, onCompleteTask, onPlayFlashcard, toggleParentMode, processingTasks, hiddenTaskIds, onStartPatrol, isPatrolling, isPlaying, onOpenCollection, connectionMode, onForceSync, onLogout }) => {
  const themeId = userProfile.theme || 'cosmic';
  const currentTheme = THEMES[themeId] || THEMES.cosmic;
  const mascotImg = proxifyUrl(userProfile.themeConfig?.mascot || currentTheme.mascot);
  const bgImg = proxifyUrl(userProfile.themeConfig?.background || currentTheme.backgroundImage);
  const progressPercent = Math.min((userProfile.xp / (userProfile.level*100)) * 100, 100);
  const headerBgClass = themeId === 'pokemon' ? 'bg-white/60 text-slate-800' : 'bg-black/20 text-white';

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} flex flex-col relative`}>
      <DynamicBackground themeId={themeId} customBg={bgImg} />
      {isPatrolling && <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60"><div className="w-[300px] h-[300px] border-4 border-green-500 rounded-full animate-ping"></div><div className="mt-8 text-green-400 font-mono text-2xl font-black animate-pulse">SCANNING...</div></div>}
      <div onClick={onForceSync} className={`w-full py-1 text-center text-[10px] font-bold cursor-pointer transition-colors ${connectionMode === 'cloud' ? 'bg-green-600 text-white' : 'bg-red-600 text-white animate-pulse'}`}>{connectionMode === 'cloud' ? '🟢 基地在线' : `🔴 ${connectionMode === 'offline' ? '离线模式' : '连接异常'} (点击重试)`}</div>
      <div className={`w-full p-4 flex justify-between items-center backdrop-blur-md z-10 ${headerBgClass}`}>
         <div className="flex items-center gap-3">
            <button onClick={onLogout} className="opacity-50 hover:opacity-100"><LogOut size={16}/></button>
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/50 bg-white"><img src={mascotImg} className="w-full h-full object-cover" onError={(e)=>{e.target.style.display='none';e.target.nextSibling.style.display='block'}}/><Rocket className="text-yellow-400 hidden" size={32}/></div><div><div className="font-bold leading-tight">多米队长</div><div className="text-xs opacity-70 font-mono">Lv.{userProfile.level}</div></div>
         </div>
         <div className="flex gap-2">
            <div className="flex items-center gap-1 bg-black/10 px-3 py-1 rounded-full border border-black/5"><Zap size={14} className="text-yellow-500 fill-yellow-500"/><span className="font-bold">{userProfile.coins}</span></div>
            <button onClick={toggleParentMode} className="p-1"><Settings size={20}/></button>
         </div>
      </div>
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center pb-24">
         <div className="w-64 h-3 bg-black/10 rounded-full overflow-hidden mb-4 border border-black/5"><div className="h-full bg-blue-500 transition-all duration-1000" style={{width: `${progressPercent}%`}}></div></div>
         <MainCharacter themeId={themeId} level={userProfile.level} xp={userProfile.xp} onClick={() => speak(currentTheme.currency)} userProfile={userProfile} />
         <div className="fixed bottom-8 w-full flex justify-center gap-8 items-end pointer-events-none">
            <button onClick={()=>onOpenCollection('puzzle')} className="pointer-events-auto flex flex-col items-center gap-1 group"><div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg border-2 border-slate-100 group-active:scale-95 transition-all"><Puzzle className="text-yellow-500" size={24}/></div><span className="text-[10px] font-bold opacity-80 bg-black/20 px-2 rounded text-white">图鉴</span></button>
            <button onClick={onStartPatrol} disabled={isPatrolling} className="pointer-events-auto flex flex-col items-center gap-1 group -translate-y-4"><div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl border-4 border-white transition-all ${isPatrolling ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-500'} group-active:scale-95`}><Radar className={`text-white w-8 h-8 ${isPatrolling?'animate-spin':''}`}/></div><span className="text-xs font-black uppercase tracking-widest bg-blue-600 text-white px-3 py-0.5 rounded-full shadow-lg">巡逻</span></button>
            <button onClick={()=>onOpenCollection('cards')} className="pointer-events-auto flex flex-col items-center gap-1 group"><div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg border-2 border-slate-100 group-active:scale-95 transition-all"><BookOpen className="text-blue-500" size={24}/></div><span className="text-[10px] font-bold opacity-80 bg-black/20 px-2 rounded text-white">卡片</span></button>
         </div>
      </div>
      {tasks.length > 0 && !isPlaying && <TaskPopup tasks={tasks} currentTheme={currentTheme} onCompleteTask={onCompleteTask} onPlayFlashcard={onPlayFlashcard} processingTasks={processingTasks} userProfile={userProfile} />}
    </div>
  );
};

const LibraryItemEditor = ({ item, onSave, onCancel }) => {
    const [title, setTitle] = useState(item.title || '');
    const [word, setWord] = useState(item.flashcardData?.word || '');
    const [trans, setTrans] = useState(item.flashcardData?.translation || '');
    const [imgUrl, setImgUrl] = useState(item.image || item.flashcardData?.image || '');
    
    // 预览图逻辑
    const previewUrl = proxifyUrl(imgUrl);
    
    const handleSave = () => {
        const updatedItem = {
            ...item,
            title: word ? `练习单词: ${word}` : title,
            image: !word ? imgUrl : undefined,
            flashcardData: word ? { ...item.flashcardData, word, translation: trans, image: imgUrl } : null
        };
        onSave(updatedItem);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-xl p-4 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">编辑任务</h3>
                    <button onClick={onCancel}><X size={20}/></button>
                </div>
                
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <div className="w-20 h-20 bg-slate-100 rounded flex items-center justify-center overflow-hidden border shrink-0">
                            {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <span className="text-xs text-slate-400">无图</span>}
                        </div>
                        <div className="flex-1 space-y-2">
                            <input className="w-full border p-2 rounded text-sm" value={word} onChange={e=>setWord(e.target.value)} placeholder="单词 (如 Apple)" />
                            <input className="w-full border p-2 rounded text-sm" value={title} onChange={e=>setTitle(e.target.value)} placeholder="任务标题" />
                        </div>
                    </div>
                    
                    {word && <input className="w-full border p-2 rounded text-sm" value={trans} onChange={e=>setTrans(e.target.value)} placeholder="中文释义" />}
                    
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">图片链接 (URL)</label>
                        <input className="w-full border p-2 rounded text-xs font-mono" value={imgUrl} onChange={e=>setImgUrl(e.target.value)} placeholder="粘贴图片地址..." />
                    </div>

                    <div className="flex gap-2 pt-2">
                        {word && <button onClick={()=>speak(word, 'en-US')} className="flex-1 bg-blue-100 text-blue-700 py-2 rounded font-bold text-sm flex items-center justify-center gap-1"><Volume2 size={14}/> 试听发音</button>}
                        <button onClick={handleSave} className="flex-1 bg-green-600 text-white py-2 rounded font-bold text-sm">保存修改</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ParentDashboard = ({ userProfile, tasks, libraryItems, onAddTask, onClose, onDeleteTask, onUpdateProfile, onManageLibrary, onDataChange, sessionUid, onForceSync, onPromoteTask, onNudgeKid }) => {
    const [activeTab, setActiveTab] = useState('library'); 
    const [saveStatus, setSaveStatus] = useState(''); 
    const [editingItem, setEditingItem] = useState(null); 
    const [importInputRef] = useState(useRef(null)); // Ref for file input

    // Config states
    const [pushStart, setPushStart] = useState(userProfile.pushStartHour || 19);
    const [pushEnd, setPushEnd] = useState(userProfile.pushEndHour || 21);
    const [dailyLimit, setDailyLimit] = useState(userProfile.dailyLimit || 10);
    const [taskProbabilities, setTaskProbabilities] = useState(userProfile.taskProbabilities || { english: 50, sport: 30, life: 20 });
    
    // Theme States
    const [themeId, setThemeId] = useState(userProfile.theme || 'cosmic');
    const [themeMascot, setThemeMascot] = useState(userProfile.themeConfig?.mascot || '');
    const [themeBg, setThemeBg] = useState(userProfile.themeConfig?.background || '');
    const [assistantName, setAssistantName] = useState(userProfile.themeConfig?.assistantName || '');
    
    // Level Config States
    const getInitialStages = () => {
        if (userProfile.levelStages && userProfile.levelStages.length > 0) return userProfile.levelStages;
        return userProfile.theme === 'pokemon' ? POKEMON_STAGES : CRYSTAL_STAGES;
    };
    const [levelStages, setLevelStages] = useState(getInitialStages());

    // Add Task States
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskType, setNewTaskType] = useState('generic');
    const [newTaskReward, setNewTaskReward] = useState(20);
    const [newTaskCycle, setNewTaskCycle] = useState('ebbinghaus');
    const [flashcardWord, setFlashcardWord] = useState('');
    const [flashcardTrans, setFlashcardTrans] = useState('');
    const [flashcardImg, setFlashcardImg] = useState('');
    const [flashcardAudio, setFlashcardAudio] = useState('');
    const [batchWords, setBatchWords] = useState('');
    const [uploading, setUploading] = useState(false);

    const mascotInputRef = useRef(null);
    const bgInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const stageInputRefs = useRef([]);

    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const safeLibrary = Array.isArray(libraryItems) ? libraryItems : [];
    const sortedLibrary = [...safeLibrary].sort((a,b) => a.nextReview - b.nextReview);
    const isPending = (libId) => safeTasks.some(t => t.libraryId === libId && t.status === 'pending');
    const pendingTasks = safeTasks.filter(t => t.status === 'pending');
    const completedTasks = safeTasks.filter(t => t.status === 'completed');

    const refresh = () => { if(onDataChange) onDataChange(); };

    // Update state when profile changes (e.g. cloud sync)
    useEffect(() => {
        if(userProfile) {
            setPushStart(userProfile.pushStartHour || 19);
            setPushEnd(userProfile.pushEndHour || 21);
            setDailyLimit(userProfile.dailyLimit || 10);
            setTaskProbabilities(userProfile.taskProbabilities || { english: 50, sport: 30, life: 20 });
            setThemeId(userProfile.theme || 'cosmic');
            if(userProfile.themeConfig) {
                setThemeMascot(userProfile.themeConfig.mascot || '');
                setThemeBg(userProfile.themeConfig.background || '');
                setAssistantName(userProfile.themeConfig.assistantName || '');
            }
            if(userProfile.levelStages && userProfile.levelStages.length > 0) {
                setLevelStages(userProfile.levelStages);
            }
        }
    }, [userProfile]);

    const handleUpload = async (e, type, idx) => {
       const file = e.target.files[0];
       if(!file) return;
       setUploading(true);
       try {
         const url = await CloudAPI.upload(file);
         if (type === 'mascot') setThemeMascot(url);
         else if (type === 'bg') setThemeBg(url);
         else if (type === 'stage' && idx !== undefined) {
             const newStages = [...levelStages];
             newStages[idx].image = url; 
             setLevelStages(newStages);
         }
         alert("上传成功!");
       } catch (err) { alert("服务器上传失败，使用本地预览模式"); } finally { setUploading(false); }
    };

    const handleThemeChange = (newTheme) => {
        setThemeId(newTheme);
        if (confirm("是否同时将等级形态重置为该主题默认配置？(自定义形态将被覆盖)")) {
            setLevelStages(newTheme === 'pokemon' ? POKEMON_STAGES : CRYSTAL_STAGES);
        }
    };

    const handleSaveTheme = () => {
      try {
        onUpdateProfile({ 
          theme: themeId,
          themeConfig: { mascot: themeMascot, background: themeBg, assistantName: assistantName },
          levelStages: levelStages
        });
        setSaveStatus('theme');
        setTimeout(() => setSaveStatus(''), 2000);
        alert("✅ 主题与形态配置已更新！");
      } catch (e) { console.error(e); alert("保存失败"); }
    };
    
    const updateStage = (idx, field, value) => {
        const newStages = [...levelStages];
        newStages[idx][field] = value;
        setLevelStages(newStages);
    };
    const addStage = () => {
        const lastStage = levelStages[levelStages.length-1];
        setLevelStages([...levelStages, { minLevel: (lastStage?.minLevel || 0) + 5, name: '新形态', message: "进化！", image: '' }]);
    };
    const removeStage = (idx) => {
        if(levelStages.length <= 1) return alert("至少保留一个阶段");
        const newStages = levelStages.filter((_, i) => i !== idx);
        setLevelStages(newStages);
    };
    
    // CSV Import Logic
    const handleImportCSV = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target.result;
            const lines = text.split(/\r?\n/);
            let count = 0;
            
            lines.forEach(line => {
                const parts = line.split(/[,;\t]/).map(p => p.trim()).filter(p => p);
                if (parts.length > 0) {
                    const word = parts[0];
                    const translation = parts.length > 1 ? parts[1] : '';
                    
                    // Simple validation: ignore if it looks like a header or empty
                    if (word && word.length > 1 && word.toLowerCase() !== 'word') {
                        const enrichedData = enrichWordTask(word);
                        // If CSV provides translation, override system one
                        if (translation) enrichedData.translation = translation;
                        
                        onManageLibrary('add', { 
                            title: `练习单词: ${enrichedData.word}`, 
                            type: 'english', 
                            reward: 20, 
                            flashcardData: enrichedData, 
                            memoryLevel: 0, 
                            nextReview: Date.now(), 
                            cycleMode: 'ebbinghaus' 
                        });
                        count++;
                    }
                }
            });
            alert(`成功导入 ${count} 个单词！`);
            refresh();
            e.target.value = ''; // Reset input
        };
        reader.readAsText(file);
    };

    const constructTaskData = () => ({
        title: newTaskType === 'english' ? `练习单词: ${flashcardWord}` : newTaskTitle,
        type: newTaskType,
        reward: parseInt(newTaskReward),
        image: newTaskType==='generic'?flashcardImg:undefined,
        flashcardData: newTaskType === 'english' ? { word: flashcardWord, translation: flashcardTrans, image: flashcardImg, audio: flashcardAudio } : null,
        cycleMode: newTaskCycle
    });

    const handlePush = (e) => { e.preventDefault(); onAddTask(constructTaskData()); alert('已推送'); refresh(); };
    const handleAddToLibrary = (e) => { e.preventDefault(); onManageLibrary('add', { ...constructTaskData(), memoryLevel: 0, nextReview: Date.now() }); alert('已入库'); refresh(); };
    const handleBatchAddWords = () => { if (!batchWords.trim()) return; const words = batchWords.split(/[,，\n]/).map(w => w.trim()).filter(w => w); let count = 0; words.forEach(word => { const enrichedData = enrichWordTask(word); onManageLibrary('add', { title: `练习单词: ${enrichedData.word}`, type: 'english', reward: 20, flashcardData: enrichedData, memoryLevel: 0, nextReview: Date.now(), cycleMode: 'ebbinghaus' }); count++; }); alert(`成功生成 ${count} 个！`); setBatchWords(''); refresh(); };
    const handleSaveConfig = () => { 
        onUpdateProfile({ 
            taskProbabilities, 
            pushStartHour: parseInt(pushStart), 
            pushEndHour: parseInt(pushEnd), 
            dailyLimit: parseInt(dailyLimit), 
            levelStages: levelStages 
        }); 
        alert("配置已保存 (含进化形态)"); 
    };
    
    const handlePromote = (libraryItem) => { onPromoteTask(libraryItem); alert("已插队推送！"); refresh(); };
    const handleExport = () => { const BOM = "\uFEFF"; const rows = sortedLibrary.map(item => `${(item.title||"").replace(/,/g,"，")},${item.type},${item.cycleMode||'ebbinghaus'}`); const blob = new Blob([BOM + "标题,类型,循环模式\n" + rows.join("\n")], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = "tasks.csv"; document.body.appendChild(link); link.click(); link.remove(); };
    const handleBackup = () => { const data = LocalDB.get(); const blob = new Blob([JSON.stringify(data)], {type:'application/json'}); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `backup_${Date.now()}.json`; document.body.appendChild(link); link.click(); link.remove(); };
    const handleRestore = (e) => { const file = e.target.files[0]; if(!file)return; const reader = new FileReader(); reader.onload = (ev) => { try { LocalDB.restore(JSON.parse(ev.target.result)); } catch { alert("文件错误"); } }; reader.readAsText(file); };
    
    const handleLogout = () => { if(confirm("确定要退出登录吗？")) window.location.reload(); };
    const safeProbs = taskProbabilities || { english: 50, sport: 30, life: 20 };

    return (<div className="fixed inset-0 bg-slate-100 z-50 p-4 overflow-y-auto">
      <div className="flex justify-between mb-4"><h2 className="font-bold text-slate-800">家长后台</h2><button onClick={onClose}><XCircle/></button></div>
      <div className="flex gap-2 mb-4 overflow-x-auto">{['plan','library','monitor','theme','config'].map(t=><button key={t} onClick={()=>setActiveTab(t)} className={`px-4 py-2 rounded-lg font-bold capitalize whitespace-nowrap ${activeTab===t?'bg-blue-600 text-white':'bg-white text-slate-600'}`}>{t}</button>)}</div>
      
      {/* ✏️ 任务库编辑弹窗 */}
      {editingItem && <LibraryItemEditor item={editingItem} onCancel={()=>setEditingItem(null)} onSave={(updated)=>{onManageLibrary('update', updated); setEditingItem(null); refresh();}} />}

      {activeTab==='plan' && <div className="bg-white p-4 rounded shadow">
         <h3 className="font-bold mb-2">任务队列 ({sortedLibrary.length})</h3>
         {sortedLibrary.length===0?<p className="text-slate-400 text-sm">无任务</p>:sortedLibrary.map(i=>{
            const pending = isPending(i.id);
            return (
            <div key={i.id} className="p-3 border-b flex justify-between items-center hover:bg-slate-50">
               <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                     {i.title}
                     {pending && <span className="bg-blue-100 text-blue-700 text-[10px] px-1 rounded">进行中</span>}
                     {i.cycleMode === 'daily' && <span className="bg-orange-100 text-orange-700 text-[10px] px-1 rounded flex items-center gap-1"><RotateCw size={10}/> 每日</span>}
                  </div>
                  <div className="text-[10px] text-slate-400">计划: {getScheduledTimeDisplay(pushStart, i.nextReview)}</div>
               </div>
               <div className="flex gap-2">
                   <button onClick={() => setEditingItem(i)} className="p-2 text-slate-400 hover:text-blue-500"><Edit3 size={16}/></button>
                   <button onClick={() => handlePromote(i)} disabled={pending} className={`px-3 py-1 rounded text-xs font-bold border ${pending ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-green-100 text-green-700 border-green-200'}`}>{pending ? '已在列表' : '立即推送'}</button>
               </div>
            </div>
         )})}
      </div>}

      {activeTab==='library' && <div className="space-y-6">
         
         <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
             <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold flex items-center gap-2 text-blue-800"><Wand2 size={16}/> 智能批量添加</h3>
                {/* 📂 CSV 导入按钮 */}
                <button onClick={()=>importInputRef.current.click()} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200 flex items-center gap-1">
                    <FileText size={12}/> 导入 Anki/CSV
                </button>
                <input type="file" ref={importInputRef} className="hidden" accept=".csv,.txt" onChange={handleImportCSV}/>
             </div>
             <textarea className="w-full border p-2 rounded mb-2 text-sm" value={batchWords} onChange={e=>setBatchWords(e.target.value)} placeholder="输入单词，逗号分隔 (如: apple, banana)"/>
             <button onClick={handleBatchAddWords} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">一键生成</button>
         </div>

         <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-slate-300">
           <h3 className="font-bold mb-4">手动添加任务</h3>
           <div className="flex gap-2 mb-3"><button onClick={()=>setNewTaskType('generic')} className={`flex-1 py-2 border rounded-lg text-sm font-bold ${newTaskType==='generic'?'bg-slate-200 border-slate-400':''}`}>通用任务</button><button onClick={()=>setNewTaskType('english')} className={`flex-1 py-2 border rounded-lg text-sm font-bold ${newTaskType==='english'?'bg-purple-100 border-purple-400 text-purple-700':''}`}>英语任务</button></div>
           <div className="space-y-3">
             <div className="flex gap-2"><input className="flex-1 border p-2 rounded" value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} placeholder="任务名称 (必填)" /><input className="w-20 border p-2 rounded" type="number" value={newTaskReward} onChange={e=>setNewTaskReward(e.target.value)} placeholder="奖励" /></div>
             
             <div className="flex items-center gap-4 text-sm text-slate-600 bg-slate-50 p-2 rounded">
                <span className="font-bold">循环模式:</span>
                <label className="flex items-center gap-1"><input type="radio" name="cycle" checked={newTaskCycle==='ebbinghaus'} onChange={()=>setNewTaskCycle('ebbinghaus')}/> 艾宾浩斯</label>
                <label className="flex items-center gap-1"><input type="radio" name="cycle" checked={newTaskCycle==='daily'} onChange={()=>setNewTaskCycle('daily')}/> 每日打卡</label>
             </div>

             {newTaskType === 'english' && <div className="bg-purple-50 p-3 rounded border border-purple-100 space-y-2"><div className="flex gap-2"><input className="flex-1 border p-2 rounded text-sm" placeholder="英文单词" value={flashcardWord} onChange={e=>setFlashcardWord(e.target.value)} /><input className="flex-1 border p-2 rounded text-sm" placeholder="中文释义" value={flashcardTrans} onChange={e=>setFlashcardTrans(e.target.value)} /></div><input className="w-full border p-2 rounded text-sm" placeholder="图片 URL" value={flashcardImg} onChange={e=>setFlashcardImg(e.target.value)} /><input className="w-full border p-2 rounded text-sm" placeholder="发音 URL" value={flashcardAudio} onChange={e=>setFlashcardAudio(e.target.value)} /></div>}
             {newTaskType === 'generic' && <input className="w-full border p-2 rounded text-sm" placeholder="图片 URL (选填)" value={flashcardImg} onChange={e=>setFlashcardImg(e.target.value)} />}
             <div className="flex gap-2"><button onClick={handleAddToLibrary} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg font-bold">加入计划库</button><button onClick={handlePush} className="flex-1 bg-slate-800 text-white py-3 rounded-lg font-bold">立即推送</button></div>
           </div>
         </div>
         <div className="bg-white p-4 rounded-xl shadow-sm"><div className="flex justify-between items-center mb-4"><h3 className="font-bold">任务库管理 ({sortedLibrary.length})</h3><div className="flex gap-2"><button onClick={handleExport} className="text-xs text-blue-600">导出CSV</button></div></div><div className="space-y-2 max-h-[300px] overflow-y-auto">{sortedLibrary.map(i=>(<div key={i.id} className="flex justify-between border-b p-2 items-center"><div><div className="font-bold text-sm">{i.title}</div><div className="text-xs text-slate-400">Lv.{i.memoryLevel}</div></div><div className="flex gap-2"><button onClick={()=>setEditingItem(i)} className="text-slate-400 hover:text-blue-500"><Edit3 size={16}/></button><button onClick={()=>onManageLibrary('del',i.id)} className="text-red-400"><Trash2 size={16}/></button></div></div>))}</div></div>
      </div>}

      {activeTab==='theme' && <div className="bg-white p-4 rounded shadow space-y-4">
        <h3 className="font-bold flex items-center gap-2"><Palette size={18}/> 主题定制</h3>
        
        {/* 主题选择器 */}
        <div className="p-3 bg-slate-50 rounded border">
            <label className="text-sm font-bold mb-2 block">界面风格</label>
            <div className="flex gap-2">
                <button onClick={()=>handleThemeChange('cosmic')} className={`flex-1 py-2 rounded border text-sm font-bold ${themeId==='cosmic'?'bg-blue-600 text-white':'bg-white'}`}>宇宙护卫队</button>
                <button onClick={()=>handleThemeChange('pokemon')} className={`flex-1 py-2 rounded border text-sm font-bold ${themeId==='pokemon'?'bg-yellow-400 text-black border-yellow-500':'bg-white'}`}>宝可梦大师</button>
            </div>
        </div>

        {/* 🔮 新增：形态进化配置 */}
        <div className="border-b pb-4 mb-4">
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-slate-500 font-bold">🔮 进化阶段 (支持上传图片)</label>
                <button onClick={addStage} className="text-blue-600 text-xs flex gap-1"><PlusCircle size={14}/> 添加阶段</button>
            </div>
            {levelStages.map((stage, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-center bg-slate-50 p-2 rounded">
                    <span className="text-[10px] w-8 text-slate-400">Lv.{stage.minLevel}</span>
                    <input 
                        type="number" 
                        className="w-12 border p-1 rounded text-xs text-center" 
                        value={stage.minLevel}
                        disabled={idx === 0} 
                        onChange={(e) => updateStage(idx, 'minLevel', e.target.value)}
                    />
                    <input 
                        className="flex-1 border p-1 rounded text-xs" 
                        value={stage.name}
                        onChange={(e) => updateStage(idx, 'name', e.target.value)}
                        placeholder="阶段名称"
                    />
                    {/* 图片配置行：输入框 + 上传按钮 */}
                    <div className="relative flex items-center gap-1">
                        <input 
                            className="w-20 border p-1 rounded text-[10px] text-slate-500" 
                            value={stage.image || ''}
                            onChange={(e) => updateStage(idx, 'image', e.target.value)}
                            placeholder="图片URL"
                        />
                        <button className={`p-1 rounded hover:bg-slate-200 ${stage.image ? 'bg-green-100 text-green-600' : 'bg-slate-100'}`} onClick={() => stageInputRefs.current[idx].click()}>
                           <Upload size={14}/>
                        </button>
                        <input 
                            type="file" 
                            className="hidden" 
                            ref={el => stageInputRefs.current[idx] = el} 
                            onChange={(e) => handleUpload(e, 'stage', idx)}
                        />
                         {/* 缩略图预览 */}
                        {stage.image && <img src={proxifyUrl(stage.image)} className="w-6 h-6 object-cover rounded border" alt="preview"/>}
                    </div>
                    {/* 删除按钮 */}
                    {idx > 0 && <button onClick={() => removeStage(idx)} className="text-red-400"><MinusCircle size={14}/></button>}
                </div>
            ))}
        </div>

        <div className="space-y-4">
           <div><label className="text-xs text-slate-500 block mb-1">队长头像</label><div className="flex gap-2"><input className="border flex-1 p-2 rounded text-sm" value={themeMascot} onChange={e=>setThemeMascot(e.target.value)} placeholder="输入URL 或 上传"/><button disabled={uploading} onClick={()=>mascotInputRef.current.click()} className="bg-slate-200 px-3 rounded"><Upload size={16}/></button></div><input type="file" ref={mascotInputRef} className="hidden" accept="image/*" onChange={(e)=>handleUpload(e,'mascot')}/>{themeMascot && <img src={proxifyUrl(themeMascot)} className="w-10 h-10 mt-2 rounded object-cover"/>}</div>
           <div><label className="text-xs text-slate-500 block mb-1">背景图片</label><div className="flex gap-2"><input className="border flex-1 p-2 rounded text-sm" value={themeBg} onChange={e=>setThemeBg(e.target.value)} placeholder="输入URL 或 上传"/><button disabled={uploading} onClick={()=>bgInputRef.current.click()} className="bg-slate-200 px-3 rounded"><Upload size={16}/></button></div><input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={(e)=>handleUpload(e,'bg')}/>{themeBg && <img src={proxifyUrl(themeBg)} className="w-20 h-10 mt-2 rounded object-cover"/>}</div>
           <div><label className="text-xs text-slate-500">助手名字</label><input className="border w-full p-2 rounded" value={assistantName} onChange={e=>setAssistantName(e.target.value)} placeholder="小雨点"/></div>
        </div>
        <button onClick={handleSaveTheme} className={`w-full py-3 rounded font-bold transition-all ${saveStatus==='theme' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
          {saveStatus==='theme' ? '✅ 保存所有设置' : '保存设置'}
        </button>
      </div>}

      {activeTab==='config' && <div className="bg-white p-4 rounded shadow space-y-6">
        <h3 className="font-bold flex items-center gap-2"><Sliders size={18}/> 调度配置</h3>
        <div className="grid grid-cols-2 gap-4">
           <div><label className="text-xs text-slate-500">开始时间</label><input className="border w-full p-2 rounded" type="number" value={pushStart} onChange={e=>setPushStart(e.target.value)}/></div>
           <div><label className="text-xs text-slate-500">结束时间</label><input className="border w-full p-2 rounded" type="number" value={pushEnd} onChange={e=>setPushEnd(e.target.value)}/></div>
           <div className="col-span-2"><label className="text-xs text-slate-500">每日上限</label><input className="border w-full p-2 rounded" type="number" value={dailyLimit} onChange={e=>setDailyLimit(e.target.value)}/></div>
        </div>
        <div className="border-t pt-4"><label className="text-xs text-slate-500 block mb-2">随机任务概率</label>{['english','sport','life'].map(type=>(<div key={type} className="flex items-center gap-2 mb-2"><span className="text-xs w-12 capitalize">{type}</span><input type="range" className="flex-1" min="0" max="100" value={safeProbs[type]||30} onChange={e=>setTaskProbabilities(p=>({...p,[type]:parseInt(e.target.value)}))}/><span className="text-xs w-8">{safeProbs[type]}%</span></div>))}</div>
        <button onClick={handleSaveConfig} className="bg-slate-800 text-white w-full py-3 rounded font-bold">保存配置</button>
        <div className="border-t pt-4 grid grid-cols-2 gap-3"><button onClick={handleBackup} className="p-3 bg-slate-100 rounded text-xs font-bold">备份数据</button><button onClick={()=>fileInputRef.current.click()} className="p-3 bg-slate-100 rounded text-xs font-bold">恢复数据</button><input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleRestore}/></div>
        <div className="pt-4 border-t flex justify-between"><button onClick={onForceSync} className="text-blue-600 text-xs flex gap-1"><Cloud size={14}/> 强制覆盖云端数据</button><button onClick={handleLogout} className="text-red-500 text-xs">退出</button></div></div>}
      
      {activeTab==='monitor' && <div className="bg-white p-4 rounded"><h3 className="font-bold mb-4">进行中任务 ({pendingTasks.length})</h3>{pendingTasks.length === 0 ? <p className="text-slate-400">孩子当前空闲</p> : pendingTasks.map(t=><div key={t.id} className="p-3 border-b flex justify-between items-center"><span className="text-sm font-bold">{t.title}</span><div className="flex gap-2"><button onClick={onNudgeKid} className="text-blue-500 text-xs border border-blue-200 px-2 py-1 rounded flex items-center gap-1"><Bell size={12}/> 提醒</button><button onClick={()=>onDeleteTask(t.id)} className="text-red-500 text-xs border border-red-200 px-2 py-1 rounded">撤回</button></div></div>)}</div>}
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

  const handleLogout = () => {
    if(confirm("确定要退出登录吗？")) {
       LocalDB.clear(); 
       window.location.reload(); 
    }
  };

  const persist = (newData) => { setData(newData); CloudAPI.sync(session.uid, newData, session.mode); };
  
  const handleForceSync = async () => {
    if(!session) return;
    if(confirm("确定要将当前设备的本地数据覆盖到云端吗？")) {
       await CloudAPI.sync(session.uid, data, 'force'); // 强制云端同步
       alert("已强制同步到云端！");
    }
  };
  
  // 自动心跳同步 (5秒一次) + 提醒音效
  useEffect(() => {
    if (!session || session.mode !== 'cloud') return;
    const interval = setInterval(async () => {
       const cloudData = await CloudAPI.fetchData(session.uid);
       if (cloudData?.user?.nudge && cloudData.user.nudge !== data?.user?.nudge) {
           console.log("Nudge received!");
           playSystemSound('nudge'); 
           alert("🔔 家长发来提醒：快去完成任务吧！");
       }
       if (cloudData && JSON.stringify(cloudData.tasks) !== JSON.stringify(data.tasks)) {
           console.log("Syncing new tasks...");
           setData(prev => ({ ...prev, tasks: cloudData.tasks })); 
           playSystemSound('patrol');
       }
    }, 5000); 
    return () => clearInterval(interval);
  }, [session, data]);

  const handleNudgeKid = () => {
     const newData = { ...data };
     newData.user.nudge = Date.now();
     persist(newData);
     alert("已发送提醒！孩子设备将播放提示音。");
  };

  const handleComplete = (task) => {
    const newData = { ...data };
    const t = newData.tasks.find(x => x.id === task.id);
    if(t) { t.status = 'completed'; t.completedAt = Date.now(); }
    
    // 1. 结算奖励
    newData.user.coins += task.reward; 
    newData.user.xp += task.reward;
    
    // 2. 升级逻辑 (Level Up Logic)
    // 规则：当前等级 N，升级需要 N * 100 经验。经验溢出部分带入下一级。
    let xpNeeded = newData.user.level * 100;
    let isLevelUp = false;
    
    // 使用 while 循环支持一次升多级（处理积压经验）
    while (newData.user.xp >= xpNeeded) {
       newData.user.xp -= xpNeeded;
       newData.user.level += 1;
       xpNeeded = newData.user.level * 100;
       isLevelUp = true;
    }
    
    if (isLevelUp) {
        playSystemSound('levelup');
        // 可以加个简单的 alert 或者 speak
        setTimeout(() => speak(`恭喜升级到 ${newData.user.level} 级！`), 500);
    }
    
    // 循环任务逻辑
    if (task.cycleMode === 'daily' && task.libraryId) {
       const libItem = newData.library.find(i => i.id === task.libraryId);
       if (libItem) {
          const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
          const originalHour = libItem.nextReview ? new Date(libItem.nextReview).getHours() : 19;
          tomorrow.setHours(originalHour, 0, 0, 0);
          libItem.nextReview = tomorrow.getTime();
       }
    } else if (task.libraryId) {
        const item = newData.library.find(i => i.id === task.libraryId);
        if (item) {
           const lv = item.memoryLevel || 0; const nextLv = Math.min(lv + 1, 6);
           const nextDate = new Date(); nextDate.setDate(nextDate.getDate() + REVIEW_INTERVALS[nextLv]); nextDate.setHours(19,0,0,0);
           item.memoryLevel = nextLv; item.nextReview = nextDate.getTime();
        }
    }
    persist(newData);
    setActiveFlashcardTask(null);
    setRewardData({ coins: task.reward, xp: task.reward });
  };

  const handleStartPatrol = () => {
    setIsPatrolling(true); speak("雷达启动");
    setTimeout(() => {
      const newData = { ...data };
      const now = Date.now();
      const candidate = newData.library.find(i => i.nextReview <= now && !newData.tasks.find(t=>t.libraryId===i.id && t.status==='pending'));
      
      if(candidate) {
          newData.tasks.push({...candidate, id: generateId(), status:'pending', createdAt: Date.now(), libraryId: candidate.id});
          speak("发现计划任务！");
      } else { 
          const w = enrichWordTask('random'); 
          newData.tasks.push({id:generateId(), title:`练习:${w.word}`, type:'english', reward:15, flashcardData:w, status:'pending', createdAt:Date.now()}); 
          speak("发现随机任务！");
      }
      persist(newData); setIsPatrolling(false);
    }, 2000);
  };

  const handleManageLibrary = (act, item) => { const newData={...data}; if(act==='add') newData.library.push({...item, id:generateId()}); else if (act === 'del') newData.library = newData.library.filter(i=>i.id!==item); else if (act === 'update') { const idx = newData.library.findIndex(i => i.id === item.id); if (idx !== -1) newData.library[idx] = item; } persist(newData); };
  const handleAddTask = (item) => { const newData={...data}; newData.tasks.push({...item, id:generateId(), status:'pending'}); persist(newData); };
  const handleDeleteTask = (id) => { const newData={...data}; newData.tasks=newData.tasks.filter(t=>t.id!==id); persist(newData); };
  const handleUpdateProfile = (u) => { const newData={...data}; newData.user={...newData.user,...u}; persist(newData); };
  // 核心修复：提升状态
  const handlePromoteTask = (libraryItem) => {
    const newData = { ...data };
    const existing = newData.tasks.find(t => t.libraryId === libraryItem.id && t.status === 'pending');
    if (!existing) {
       const newTask = {
          ...libraryItem,
          id: generateId(),
          status: 'pending',
          createdAt: Date.now(),
          libraryId: libraryItem.id,
          source: 'manual_promote'
       };
       newData.tasks.unshift(newTask);
       persist(newData);
    }
  };

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
          connectionMode={session.mode}
          onForceSync={handleForceSync}
          onLogout={handleLogout}
        />
        {isParentMode && <ParentDashboard userProfile={data.user} tasks={data.tasks} libraryItems={data.library} onAddTask={handleAddTask} onDeleteTask={handleDeleteTask} onUpdateProfile={handleUpdateProfile} onManageLibrary={handleManageLibrary} onClose={() => setIsParentMode(false)} onDataChange={() => setData(LocalDB.get())} sessionUid={session.uid} onForceSync={handleForceSync} onPromoteTask={handlePromoteTask} onNudgeKid={handleNudgeKid} />}
        {activeFlashcardTask && <FlashcardGame task={activeFlashcardTask} onClose={() => setActiveFlashcardTask(null)} onComplete={handleComplete} />}
        {rewardData && <RewardModal rewards={rewardData} onClose={() => setRewardData(null)} />}
        {showCollection && <CollectionModal collection={data.collection || {}} onClose={() => setShowCollection(false)} />}
      </ErrorBoundary>
    </div>
  );
}
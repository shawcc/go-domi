import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Settings, Plus, CheckCircle, XCircle, Volume2, Gamepad2, 
  Rocket, Zap, Loader2, Activity, BrainCircuit, History, ListTodo, 
  Clock, Gem, Hexagon, Octagon, Triangle, Circle, Square, Lock, 
  Siren, Sparkles, Mic, Library, Calendar, FileUp, FileDown, Trash2,
  Radar, Flame, Moon, Sun, BatteryCharging, Volume1
} from 'lucide-react';

// ==========================================
// --- 核心引擎：本地数据库 (LocalStorage) ---
// ==========================================
const STORAGE_KEY = 'go_domi_local_v2';

// 模拟数据库操作
const LocalDB = {
  get: () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        user: { name: '多米', level: 1, xp: 0, coins: 0, theme: 'cosmic', streak: 1 },
        tasks: [],
        library: []
      };
    } catch (e) {
      return { user: {}, tasks: [], library: [] };
    }
  },
  save: (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('local-db-change'));
  },
  update: (callback) => {
    const data = LocalDB.get();
    const newData = callback(data);
    LocalDB.save(newData);
  },
  restore: (fullData) => {
    if (!fullData || !fullData.user) throw new Error("无效的存档文件");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullData));
    window.dispatchEvent(new Event('local-db-change'));
    window.location.reload(); 
  }
};

// ==========================================
// --- 配置与常量 ---
// ==========================================

const THEMES = {
  cosmic: {
    id: 'cosmic', name: '宇宙护卫队', bg: 'bg-slate-900', text: 'text-slate-100', card: 'bg-slate-800',
    primary: 'bg-blue-600 hover:bg-blue-500', accent: 'text-yellow-400',
    mascot: 'https://gd-hbimg.huaban.com/4993952d0ec6bbfe2a6e60d0c6df92f5cae85f7b890594-7wKvP6_fw1200webp', 
    assistant: '小雨点', currency: '能量石'
  },
  forest: {
    id: 'forest', name: '魔法森林', bg: 'bg-green-900', text: 'text-green-50', card: 'bg-green-800',
    primary: 'bg-emerald-600 hover:bg-emerald-500', accent: 'text-amber-300',
    mascot: '🦁', assistant: '猫头鹰博士', currency: '金橡果'
  }
};

const CRYSTAL_STAGES = [
  { minLevel: 1, name: '原初晶核', icon: Hexagon, color: 'text-blue-300', scale: 1, message: "我需要能量..." },
  { minLevel: 3, name: '觉醒晶簇', icon: Triangle, color: 'text-purple-400', scale: 1.2, message: "正在苏醒中..." },
  { minLevel: 6, name: '辉光棱镜', icon: Octagon, color: 'text-pink-400', scale: 1.4, message: "光芒越来越强了！" },
  { minLevel: 9, name: '永恒之心', icon: Gem, color: 'text-yellow-300', scale: 1.6, message: "我是无敌的！" },
];

const REVIEW_INTERVALS = [0, 1, 2, 4, 7, 15, 30]; 
const MAX_DAILY_TASKS = 10; 

// --- Timezone Helpers ---
const getBeijingTime = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const beijingOffset = 8 * 60 * 60 * 1000;
  return new Date(utc + beijingOffset);
};

const isBeijingActiveWindow = () => {
  const bj = getBeijingTime();
  const h = bj.getHours();
  // 19:00 - 21:00 (不包含21点)
  return h >= 19 && h < 21; 
};

const getNextBeijingScheduleTime = () => {
  const now = new Date();
  const utcNow = now.getTime() + (now.getTimezoneOffset() * 60000);
  const today11UTC = new Date(utcNow);
  today11UTC.setUTCHours(11, 0, 0, 0); 
  if (utcNow >= today11UTC.getTime()) {
    today11UTC.setDate(today11UTC.getDate() + 1);
  }
  return today11UTC.getTime();
};

// --- Utilities ---
const speak = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN'; 
  utterance.rate = 1.0; 
  utterance.pitch = 1.0; 
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find(v => v.lang.includes('zh'));
  if (zhVoice) utterance.voice = zhVoice;
  utterance.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') console.error("TTS Error:", e); };
  window.speechSynthesis.speak(utterance);
};

const speakEnglish = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find(v => v.lang.includes('en'));
  if (enVoice) utterance.voice = enVoice;
  window.speechSynthesis.speak(utterance);
};

// 浏览器通知请求
const requestNotificationPermission = () => {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }
};

// 发送本地通知
const sendLocalNotification = (title, body) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: '/vite.svg' });
  }
};

const formatTime = (ts) => new Date(ts).toLocaleString('zh-CN', {month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'});
const formatDate = (ts) => new Date(ts).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });

const TASK_TEMPLATES = {
  english: [{title:"练习单词: Apple",reward:20,type:'english',flashcardData:{word:'Apple'}},{title:"练习单词: Cat",reward:20,type:'english',flashcardData:{word:'Cat'}}],
  sport: [{title:"原地高抬腿 20 次",reward:15,type:'generic'},{title:"开合跳 15 次",reward:15,type:'generic'}],
  life: [{title:"喝一杯温水",reward:5,type:'generic'},{title:"整理自己的玩具",reward:25,type:'generic'}]
};

// --- Error Boundary ---
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("App Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">系统遇到了一点小问题，请刷新页面</div>;
    return this.props.children; 
  }
}

// --- Components ---
const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
    <div className="animate-bounce text-6xl mb-4">🚀</div>
    <h1 className="text-2xl font-bold animate-pulse">正在连接宇宙基地...</h1>
    <p className="text-slate-400 mt-2">本地离线版加载中</p>
  </div>
);

const DynamicBackground = ({ themeId }) => {
  if (themeId === 'forest') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-green-900 to-green-950"></div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-yellow-300 rounded-full blur-[1px] animate-float"
               style={{left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, animationDelay: `${Math.random()*5}s`, animationDuration: `${5+Math.random()*5}s`, opacity: 0.7}}></div>
        ))}
      </div>
    );
  }
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black"></div>
      {[...Array(30)].map((_, i) => (
        <div key={i} className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse"
             style={{left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, animationDelay: `${Math.random()*3}s`, opacity: Math.random()}}></div>
      ))}
    </div>
  );
};

const GrowingCrystal = ({ level, xp }) => {
  const currentStage = [...CRYSTAL_STAGES].reverse().find(stage => level >= stage.minLevel) || CRYSTAL_STAGES[0];
  const Icon = currentStage.icon;
  const growthScale = 1 + (xp / 100) * 0.2; 
  const [isPoked, setIsPoked] = useState(false);
  const [bubbleText, setBubbleText] = useState("");

  const handlePoke = () => {
    setIsPoked(true);
    const texts = ["多米加油！", "我需要更多能量石！", "再做一个任务吧！", "好痒呀~", currentStage.message];
    const text = texts[Math.floor(Math.random() * texts.length)];
    setBubbleText(text);
    speak(text);
    setTimeout(() => { setIsPoked(false); setBubbleText(""); }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative py-12 cursor-pointer group" onClick={handlePoke}>
       {bubbleText && (
         <div className="absolute top-4 bg-white text-slate-800 px-4 py-2 rounded-xl rounded-bl-none shadow-lg animate-in zoom-in slide-in-from-bottom-2 z-20 font-bold border-2 border-blue-400">
           {bubbleText}
         </div>
       )}
       <div className={`absolute w-64 h-64 rounded-full blur-[80px] opacity-40 animate-pulse-slow transition-colors duration-1000 ${currentStage.color.replace('text-', 'bg-')}`}></div>
       <div className={`relative transition-all duration-300 ease-out ${isPoked ? 'scale-110 rotate-3' : ''}`} style={{ transform: isPoked ? undefined : `scale(${currentStage.scale * growthScale})` }}>
          <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse"></div>
          <Icon size={120} strokeWidth={1} className={`${currentStage.color} drop-shadow-[0_0_30px_rgba(255,255,255,0.6)] filter group-hover:drop-shadow-[0_0_50px_rgba(255,255,255,0.9)] transition-all`} />
          {xp > 80 && <Sparkles className="absolute -top-4 -right-4 text-yellow-300 animate-bounce" size={32} />}
       </div>
       <div className="mt-12 text-center z-10 pointer-events-none">
          <div className="text-blue-200 text-xs font-bold tracking-[0.2em] uppercase mb-1">当前形态</div>
          <h2 className={`text-3xl font-black text-white drop-shadow-lg ${currentStage.color}`}>{currentStage.name}</h2>
       </div>
    </div>
  );
};

const TaskPopup = ({ tasks, currentTheme, onCompleteTask, onPlayFlashcard, processingTasks }) => {
  const task = tasks[0]; 
  const isProcessing = processingTasks.has(task.id);

  // 1. 尝试自动播放
  useEffect(() => {
    const timer = setTimeout(() => {
        const intro = task.type === 'english' ? "英语挑战时间！" : "小雨点紧急报告！";
        speak(`${intro} ${task.title}。请完成任务！`);
    }, 500);
    return () => clearTimeout(timer);
  }, [task.id, task.title, task.type]);

  const handleManualSpeak = () => {
    const intro = task.type === 'english' ? "英语挑战时间！" : "小雨点紧急报告！";
    speak(`${intro} ${task.title}。请完成任务！`, true); 
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
       <div className={`w-full max-w-lg ${currentTheme.card} rounded-3xl border-4 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.6)] overflow-hidden relative animate-in zoom-in-95 duration-300`}>
          <div className="bg-red-500 text-white p-4 flex items-center justify-center gap-3 animate-pulse">
            <Siren size={28} className="animate-bounce" />
            <h2 className="text-xl font-black uppercase tracking-wider">紧急任务警报</h2>
            <Siren size={28} className="animate-bounce" />
          </div>
          <div className="p-8 flex flex-col items-center text-center">
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"></div>
              {task.type === 'english' ? <div className="w-24 h-24 bg-purple-500 rounded-full flex items-center justify-center text-5xl relative z-10 border-4 border-white/20 shadow-xl">A</div> : <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-5xl relative z-10 border-4 border-white/20 shadow-xl">⚔️</div>}
            </div>
            <div className="space-y-2 mb-8">
               <div className="text-blue-300 font-bold uppercase tracking-widest text-xs">{task.category || task.type}</div>
               <h1 className="text-3xl font-bold text-white leading-tight flex flex-col items-center gap-2">
                 {task.title}
                 <button onClick={handleManualSpeak} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors animate-pulse" title="播放语音"><Volume1 size={24} /></button>
               </h1>
               <div className="inline-flex items-center gap-2 bg-yellow-400/20 text-yellow-400 px-4 py-1 rounded-full border border-yellow-400/30 mt-2">
                  <Zap size={18} fill="currentColor" />
                  <span className="font-bold text-lg">奖励 {task.reward}</span>
               </div>
            </div>
            <div className="w-full">
              {task.type === 'english' ? (
                <button onClick={() => onPlayFlashcard(task)} disabled={isProcessing} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-2xl font-black text-xl shadow-lg shadow-purple-900/50 flex items-center justify-center gap-3 active:scale-95 transition-all">{isProcessing ? <Loader2 className="animate-spin" size={24} /> : <Gamepad2 size={24} />} 开始挑战</button>
              ) : (
                <button onClick={() => onCompleteTask(task)} disabled={isProcessing} className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-black text-xl shadow-lg shadow-green-900/50 flex items-center justify-center gap-3 active:scale-95 transition-all">{isProcessing ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle size={24} />} 确认完成</button>
              )}
            </div>
            {tasks.length > 1 && (
               <div className="mt-4 text-slate-400 text-xs">
                 还有 {tasks.length - 1} 个任务在排队...
               </div>
            )}
          </div>
       </div>
    </div>
  );
};

const KidDashboard = ({ userProfile, tasks, onCompleteTask, onPlayFlashcard, toggleParentMode, processingTasks, hiddenTaskIds, onStartPatrol, isPatrolling, isPlaying }) => {
  const currentTheme = THEMES[userProfile.theme || 'cosmic'];
  const displayTasks = tasks.filter(t => t.status === 'pending' && !hiddenTaskIds.has(t.id));
  const nextLevelXp = userProfile.level * 100;
  const progressPercent = Math.min((userProfile.xp / nextLevelXp) * 100, 100);
  const isImgMascot = currentTheme.mascot.startsWith('http');
  const streakDays = userProfile.streak || 3;

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} transition-colors duration-500 relative overflow-hidden flex flex-col`}>
      <DynamicBackground themeId={currentTheme.id} />
      {isPatrolling && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
           <div className="relative w-[300px] h-[300px]">
              <div className="absolute inset-0 border-4 border-green-500/50 rounded-full bg-green-900/20 shadow-[0_0_50px_rgba(34,197,94,0.3)]"></div>
              <div className="absolute inset-0 border border-green-500/30 rounded-full scale-50"></div>
              <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-green-500/30"></div>
              <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-green-500/30"></div>
              <div className="absolute top-1/2 left-1/2 w-[150px] h-[150px] bg-gradient-to-r from-transparent to-green-500/50 origin-top-left animate-[spin_2s_linear_infinite] rounded-br-full"></div>
              <div className="absolute top-[30%] left-[60%] w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
           </div>
           <div className="mt-8 text-green-400 font-mono text-2xl font-black tracking-widest animate-pulse">SCANNING SECTOR...</div>
        </div>
      )}
      <div className="p-4 flex justify-between items-center bg-black/20 backdrop-blur-md z-10 shadow-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]">
            {isImgMascot ? <img src={currentTheme.mascot} alt="mascot" className="w-full h-full object-cover" /> : <span className="text-3xl">{currentTheme.mascot}</span>}
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">多米队长</h2>
            <div className="flex items-center gap-2">
               <span className="text-xs text-white/70 bg-white/10 px-2 py-0.5 rounded">Lv.{userProfile.level}</span>
               <div className="flex items-center gap-1 text-orange-400 text-xs font-bold animate-pulse"><Flame size={12} fill="currentColor" /> {streakDays}天连胜</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
            <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-yellow-400">{userProfile.coins}</span>
          </div>
          <button onClick={toggleParentMode} className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full text-sm font-bold text-white/70 hover:bg-white/20 hover:text-white transition-all active:scale-95"><Settings size={16} /></button>
        </div>
      </div>
      <div className="px-6 mt-2 mb-4 z-10">
        <div className="flex justify-between text-xs text-blue-300 font-bold mb-1">
           <span>能量水平</span><span>{userProfile.xp} / {nextLevelXp}</span>
        </div>
        <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/10 relative shadow-inner">
          <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-white transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>
      <GrowingCrystal level={userProfile.level} xp={userProfile.xp} />
      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20 pointer-events-none">
         <button onClick={onStartPatrol} disabled={isPatrolling} className={`pointer-events-auto group relative transition-all active:scale-95 ${isPatrolling ? 'opacity-0 scale-50' : 'opacity-100'}`}>
           <div className="absolute -inset-4 bg-blue-500/30 rounded-full blur-xl group-hover:bg-blue-400/50 transition-all duration-500"></div>
           <div className="relative flex flex-col items-center justify-center w-24 h-24 rounded-full bg-gradient-to-b from-slate-700 to-slate-900 border-4 border-slate-600 shadow-[0_10px_20px_rgba(0,0,0,0.5)] group-hover:border-blue-400 group-hover:scale-105 transition-all">
              <Radar className="w-10 h-10 text-blue-400 group-hover:text-white transition-colors" />
              <span className="text-[10px] font-black text-blue-200 uppercase mt-1 tracking-wider">巡逻</span>
           </div>
         </button>
      </div>
      {displayTasks.length > 0 && !isPlaying && (
         <TaskPopup tasks={displayTasks} currentTheme={currentTheme} onCompleteTask={onCompleteTask} onPlayFlashcard={onPlayFlashcard} processingTasks={processingTasks} />
      )}
    </div>
  );
};

const ParentDashboard = ({ userProfile, tasks, libraryItems, onAddTask, onClose, onDeleteTask, onUpdateProfile, onManageLibrary }) => {
  const [activeTab, setActiveTab] = useState('library'); 
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('generic');
  const [newTaskReward, setNewTaskReward] = useState(20);
  const [flashcardWord, setFlashcardWord] = useState('');
  const [textImport, setTextImport] = useState(''); 
  const [taskProbabilities, setTaskProbabilities] = useState(userProfile.taskProbabilities || { english: 50, sport: 30, life: 20 });
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const upcomingTasks = libraryItems.filter(item => item.nextReview && item.nextReview > Date.now()).sort((a,b) => a.nextReview - b.nextReview);
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const fileInputRef = useRef(null);

  const handlePush = (e) => { e.preventDefault(); onAddTask({ title: newTaskTitle, type: newTaskType, reward: parseInt(newTaskReward), flashcardData: newTaskType === 'english' ? { word: flashcardWord } : null }); setNewTaskTitle(''); setFlashcardWord(''); alert('任务已直接推送给多米！'); };
  const handleAddToLibrary = (e) => { e.preventDefault(); onManageLibrary('add', { title: newTaskTitle, type: newTaskType, reward: parseInt(newTaskReward), flashcardData: newTaskType === 'english' ? { word: flashcardWord } : null, memoryLevel: 0, nextReview: getNextBeijingScheduleTime() }); setNewTaskTitle(''); setFlashcardWord(''); alert('已添加到任务库，系统将在下次黄金时段（19:00-21:00）按节奏推送。'); };
  const handleProbChange = (type, value) => { const newVal = parseInt(value); setTaskProbabilities(prev => ({ ...prev, [type]: newVal })); };
  const saveProbabilities = () => { onUpdateProfile({ taskProbabilities }); alert("任务编排配置已保存！"); };
  const handleExport = () => {
    const BOM = "\uFEFF"; 
    const headers = "任务标题,类型(generic/english),奖励分值,英语单词(选填)";
    const rows = libraryItems.map(item => `${(item.title||"").replace(/,/g,"，")},${item.type||"generic"},${item.reward||10},${item.flashcardData?.word||""}`);
    const blob = new Blob([BOM + headers + "\n" + rows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = "tasks.csv"; document.body.appendChild(link); link.click(); link.remove();
  };
  const handleImport = () => {
    try {
      const rows = textImport.trim().split('\n');
      if (rows.length < 1) return;
      let count = 0;
      const startIdx = rows[0].includes("任务标题") ? 1 : 0;
      const batchTime = getNextBeijingScheduleTime(); 
      for (let i = startIdx; i < rows.length; i++) {
        const parts = rows[i].split(',');
        if (parts.length < 1) continue;
        const title = parts[0]?.trim();
        if (!title) continue;
        const typeRaw = parts[1]?.trim().toLowerCase();
        const type = (typeRaw === 'english' || typeRaw === '英语') ? 'english' : 'generic';
        onManageLibrary('add', { title, type, reward: parseInt(parts[2]?.trim()) || 10, flashcardData: (type === 'english' && parts[3]?.trim()) ? { word: parts[3].trim() } : null, memoryLevel: 0, nextReview: batchTime });
        count++;
      }
      alert(`成功导入 ${count} 个任务！`); setTextImport('');
    } catch (e) { alert("导入失败，请检查格式"); }
  };
  const handleSystemBackup = () => {
    const fullData = LocalDB.get();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `go_domi_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  const handleSystemRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (confirm("确定要覆盖当前所有数据吗？此操作不可撤销。")) {
          LocalDB.restore(parsed);
        }
      } catch (err) { alert("存档文件损坏或格式错误！"); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-100 text-slate-900 z-50 overflow-y-auto animate-in slide-in-from-bottom">
      <div className="bg-white shadow-sm p-4 sticky top-0 flex justify-between items-center z-10">
        <h2 className="text-xl font-bold text-slate-800">指挥中心 (家长端)</h2>
        <button onClick={onClose} className="p-2 bg-slate-200 rounded-full hover:bg-slate-300 transition-colors"><XCircle size={24} /></button>
      </div>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex gap-2 mb-6 bg-slate-200 p-1 rounded-xl overflow-x-auto">
          {['library','plan','monitor','history','config'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[90px] py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 transition-all capitalize ${activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{tab}</button>
          ))}
        </div>
        {activeTab === 'library' && (
          <div className="space-y-6 animate-in fade-in">
            <section className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-purple-500">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Plus size={18}/> 添加新任务</h3>
              <form className="space-y-4">
                <div className="flex gap-2">
                    <button type="button" onClick={() => setNewTaskType('generic')} className={`flex-1 py-2 rounded-lg border text-sm font-bold ${newTaskType === 'generic' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500'}`}>通用任务</button>
                    <button type="button" onClick={() => setNewTaskType('english')} className={`flex-1 py-2 rounded-lg border text-sm font-bold ${newTaskType === 'english' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'border-slate-200 text-slate-500'}`}>英语单词</button>
                </div>
                <div className="flex gap-2">
                  <input required type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="任务名称" className="flex-1 p-3 border border-slate-300 rounded-xl" />
                  {newTaskType === 'english' && <input type="text" value={flashcardWord} onChange={(e) => setFlashcardWord(e.target.value)} placeholder="Apple" className="w-1/3 p-3 border border-slate-300 rounded-xl font-mono" />}
                </div>
                <div className="flex gap-2"><button onClick={handleAddToLibrary} className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold">添加到计划库</button><button onClick={handlePush} className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold">直接推送</button></div>
              </form>
            </section>
            <section className="bg-white p-6 rounded-2xl shadow-sm">
               <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg flex items-center gap-2"><Library size={18}/> 任务库</h3><button onClick={handleExport} className="p-2 text-blue-600 bg-blue-50 rounded-lg text-xs font-bold"><FileDown size={16}/> 导出CSV</button></div>
               <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <textarea className="w-full p-2 text-xs font-mono border rounded mb-2 h-16" placeholder="批量导入: 标题,类型,奖励,单词" value={textImport} onChange={e => setTextImport(e.target.value)}></textarea>
                  <button onClick={handleImport} className="text-xs bg-white border px-3 py-1 rounded hover:bg-slate-100 flex items-center gap-1"><FileUp size={12}/> 导入</button>
               </div>
               <div className="space-y-2 max-h-[300px] overflow-y-auto">{libraryItems.map(item => (<div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100"><div><div className="font-bold text-slate-700">{item.title}</div><div className="text-xs text-slate-400">Lv.{item.memoryLevel}</div></div><button onClick={() => onManageLibrary('delete', item.id)} className="text-red-400 p-2"><Trash2 size={18}/></button></div>))}</div>
            </section>
          </div>
        )}
        {activeTab === 'plan' && (
          <div className="space-y-6 animate-in fade-in">
             <section className="bg-white p-6 rounded-2xl shadow-sm">
               <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Calendar size={18}/> 智能学习计划表</h3>
               <p className="text-sm text-slate-500 mb-4 bg-yellow-50 p-2 rounded text-yellow-700 border border-yellow-200 flex items-center gap-2"><Moon size={16}/> 北京时间 19:00 - 21:00 自动推送</p>
               <div className="relative border-l-2 border-purple-200 ml-3 space-y-6">
                 {upcomingTasks.length === 0 ? <p className="ml-4 text-slate-400">暂无待复习计划</p> : upcomingTasks.map((item, idx) => (
                   <div key={item.id} className="ml-6 relative">
                      <div className="absolute -left-[31px] w-4 h-4 bg-purple-500 rounded-full border-4 border-white shadow-sm"></div>
                      <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                         <div className="flex justify-between items-start"><span className="font-bold text-purple-900">{item.title}</span><span className="text-xs font-mono bg-white px-2 py-1 rounded text-purple-600 border border-purple-200">{formatTime(item.nextReview)}</span></div>
                         <div className="text-xs text-purple-400 mt-1">Lv.{item.memoryLevel}</div>
                      </div>
                   </div>
                 ))}
               </div>
             </section>
          </div>
        )}
        {activeTab === 'monitor' && (
          <div className="space-y-6 animate-in fade-in">
            <section className="bg-white p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ListTodo size={18}/> 实时任务监控</h3>
              {pendingTasks.length === 0 ? <p className="text-slate-400 text-center py-4">无待办任务</p> : (
                <div className="space-y-2">{pendingTasks.map(task => (<div key={task.id} className="flex justify-between items-center p-3 bg-white border border-red-100 rounded-lg shadow-sm"><div><div className="font-bold text-slate-700">{task.title}</div><div className="text-xs text-red-400 flex items-center gap-1"><Clock size={10}/> {formatTime(task.createdAt)}</div></div><button onClick={() => onDeleteTask(task.id)} className="text-red-400 p-2"><XCircle size={20} /></button></div>))}</div>
              )}
            </section>
          </div>
        )}
        {activeTab === 'history' && (
          <div className="animate-in fade-in space-y-4">
             <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg flex items-center gap-2"><History size={18}/> 历史记录</h3><span className="text-sm text-slate-400">共 {completedTasks.length} 个</span></div>
                {completedTasks.length === 0 ? <div className="text-center py-12 text-slate-400"><History size={48} className="mx-auto mb-4 opacity-20"/><p>暂无历史</p></div> : (
                  <div className="divide-y divide-slate-100">{completedTasks.map(task => (<div key={task.id} className="py-4 flex justify-between items-start"><div className="flex-1"><div className="font-bold text-slate-700">{task.title}</div><div className="text-xs text-slate-400 mt-1">完成: {formatTime(task.completedAt)}</div></div><button onClick={() => onDeleteTask(task.id)} className="text-slate-300 hover:text-red-400 p-2"><XCircle size={16} /></button></div>))}</div>
                )}
             </div>
          </div>
        )}
        {activeTab === 'config' && (
            <div className="space-y-6 animate-in fade-in">
            <section className="bg-white p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><BrainCircuit size={18}/> 巡逻生成概率</h3>
              <div className="space-y-4">
                {['english', 'sport', 'life'].map(type => (<div key={type}><div className="flex justify-between mb-1 capitalize"><label className="text-sm font-bold text-slate-700">{type}</label><span className="text-sm font-bold text-purple-600">{taskProbabilities[type] || 0}%</span></div><input type="range" min="0" max="100" step="10" value={taskProbabilities[type] || 0} onChange={(e) => handleProbChange(type, e.target.value)} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"/></div>))}
                <button onClick={saveProbabilities} className="w-full py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200">保存设置</button>
              </div>
            </section>
            <section className="bg-white p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Settings size={18}/> 基础设置</h3>
              <div className="space-y-4">
                 <div className="pt-4 border-t">
                    <label className="block text-sm text-slate-500 mb-2">系统工具</label>
                    <button onClick={() => speak('你好呀，我是小雨点！测试声音是否正常。', true)} className="w-full py-3 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-200 font-bold border border-blue-200 shadow-sm"><Volume1 size={20}/> 🔊 点击测试语音</button>
                 </div>
                 {/* Backup/Restore Area */}
                 <div className="pt-4 border-t">
                    <label className="block text-sm text-slate-500 mb-2">数据保险箱 (防丢失)</label>
                    <div className="grid grid-cols-2 gap-3">
                       <button onClick={handleSystemBackup} className="p-3 bg-slate-100 rounded-lg flex flex-col items-center gap-1 text-xs font-bold text-slate-700 hover:bg-slate-200"><FileDown size={20}/> 备份存档</button>
                       <button onClick={() => fileInputRef.current.click()} className="p-3 bg-slate-100 rounded-lg flex flex-col items-center gap-1 text-xs font-bold text-slate-700 hover:bg-slate-200"><FileUp size={20}/> 恢复存档</button>
                       <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleSystemRestore}/>
                    </div>
                 </div>
              </div>
            </section>
            </div>
        )}
      </div>
    </div>
  );
};

const FlashcardGame = ({ task, onClose, onComplete }) => {
  const [step, setStep] = useState('learning'); 
  const [isListening, setIsListening] = useState(false);
  const [supportSpeech, setSupportSpeech] = useState(false);
  const word = task.flashcardData?.word || "Apple";
  const recognitionRef = useRef(null);

  useEffect(() => {
    const hasSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setSupportSpeech(hasSpeech);
    if (hasSpeech) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        if (transcript.toLowerCase().includes(word.toLowerCase())) handleTestPass();
        else speak("好像不对哦，再读一遍 " + word);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
    return () => { if (recognitionRef.current) recognitionRef.current.abort(); };
  }, []);

  const startListening = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (recognitionRef.current) { try { recognitionRef.current.start(); setIsListening(true); } catch (e) { setIsListening(false); } } else { handleTestPass(); }
  };
  const handleTestPass = () => { setStep('success'); speak("读得太棒了！"); setTimeout(() => onComplete(task), 1500); };
  useEffect(() => { if (step === 'learning') setTimeout(() => speakEnglish(word), 500); }, [step, word]);

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white text-slate-900 w-full max-w-md md:max-w-lg rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors z-10"><XCircle /></button>
        <div className="p-8 text-center space-y-6">
           {step === 'success' ? (
             <div className="animate-bounce py-8"><Trophy size={80} className="mx-auto text-yellow-400 mb-4" /><h2 className="text-3xl font-bold text-slate-800">挑战成功!</h2></div>
           ) : (
             <>
               <div className="text-sm uppercase tracking-widest text-slate-400 font-bold">英语训练</div>
               <div className="py-10 bg-blue-50 rounded-2xl border-2 border-blue-100 relative overflow-hidden">
                 <h1 className="text-6xl font-bold text-blue-600 mb-4 relative z-10">{word}</h1>
                 <button onClick={() => speakEnglish(word)} className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700 font-bold relative z-10 bg-white/50 px-4 py-2 rounded-full"><Volume2 size={24} /> 再次朗读</button>
               </div>
               {step === 'learning' ? (
                 <button onClick={() => setStep('testing')} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-xl hover:bg-blue-500 transition-colors active:scale-95 shadow-lg shadow-blue-200">我记住了，开始挑战！</button>
               ) : (
                 <div className="space-y-4">
                   <p className="text-lg font-bold text-slate-700">{isListening ? "正在听..." : "点击话筒，大声读出来！"}</p>
                   {supportSpeech ? (
                     <div className="flex justify-center">
                       <button type="button" onClick={startListening} disabled={isListening} className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 animate-pulse shadow-red-300' : 'bg-blue-500 hover:bg-blue-400 shadow-blue-300'} text-white shadow-xl border-4 border-white`}>
                          {isListening ? <Activity size={40} /> : <Mic size={40} />}
                       </button>
                     </div>
                   ) : <div className="p-4 bg-red-50 text-red-500 text-sm rounded-lg">您的设备暂不支持语音识别</div>}
                   <button type="button" onClick={handleTestPass} className="w-full mt-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-xl flex items-center justify-center gap-2"><CheckCircle size={18} /> 我读完了 (直接完成)</button>
                 </div>
               )}
             </>
           )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({ name: '多米', level: 1, xp: 0, coins: 0, theme: 'cosmic' });
  const [tasks, setTasks] = useState([]);
  const [libraryItems, setLibraryItems] = useState([]);
  const [isParentMode, setIsParentMode] = useState(false);
  const [activeFlashcardTask, setActiveFlashcardTask] = useState(null);
  const [processingTasks, setProcessingTasks] = useState(new Set());
  const [hiddenTaskIds, setHiddenTaskIds] = useState(new Set());
  const [isPatrolling, setIsPatrolling] = useState(false);

  useEffect(() => {
    // 预热语音列表
    if (window.speechSynthesis) window.speechSynthesis.getVoices();
    const handleDataChange = () => {
      const db = LocalDB.get();
      setUserProfile(p => ({ ...p, ...db.user }));
      const t = Object.values(db.tasks||{}).sort((a,b)=>b.createdAt-a.createdAt);
      setTasks(t);
      const l = Object.values(db.library||{}).sort((a,b)=>a.nextReview-b.nextReview);
      setLibraryItems(l);
    };
    window.addEventListener('local-db-change', handleDataChange);
    // Initial Load
    handleDataChange();
    setLoading(false);
    
    // Check Notification Permission
    requestNotificationPermission();

    return () => window.removeEventListener('local-db-change', handleDataChange);
  }, []);

  // Scheduler logic
  useEffect(() => {
    const checkAndSchedule = async () => {
      // 1. Time Check: 19:00 - 21:00
      if (!isBeijingActiveWindow()) return; 

      // 2. Rhythm Check: Only 1 pending task at a time
      const activeTasksCount = tasks.filter(t => t.status === 'pending').length;
      if (activeTasksCount >= 1) return;

      // 3. Daily Limit Check
      const todayCount = tasks.filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString()).length;
      if (todayCount >= MAX_DAILY_TASKS) return;

      // 4. Find due task
      const now = Date.now();
      const dueItem = libraryItems.find(item => item.nextReview <= now);
      const activeLibIds = new Set(tasks.filter(t => t.status === 'pending' && t.libraryId).map(t => t.libraryId));
      
      if (dueItem && !activeLibIds.has(dueItem.id)) {
         LocalDB.update(d => {
           // Push to tasks
           const newTask = {
             id: Date.now(),
             title: dueItem.title, type: dueItem.type, reward: dueItem.reward, flashcardData: dueItem.flashcardData,
             libraryId: dueItem.id, status: 'pending', createdAt: Date.now()
           };
           d.tasks.push(newTask);
           return d;
         });
         
         // Trigger Notification & Sound
         sendLocalNotification("新任务到达！", dueItem.title);
         speak("叮咚！任务时间到！");
      }
    };
    const interval = setInterval(checkAndSchedule, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [tasks, libraryItems]);

  const handleAddTask = (d) => {
    LocalDB.update(data => {
      data.tasks.push({ ...d, id: Date.now(), status: 'pending', createdAt: Date.now() });
      return data;
    });
  };
  
  const handleManageLibrary = (act, d) => {
    LocalDB.update(data => {
      if(act==='add') data.library.push({ ...d, id: Date.now(), createdAt: Date.now() });
      else data.library = data.library.filter(i => i.id !== d);
      return data;
    });
  };
  
  const handleDeleteTask = (id) => {
    LocalDB.update(data => {
      data.tasks = data.tasks.filter(t => t.id !== id);
      return data;
    });
  };
  
  const handleUpdateProfile = (d) => {
    LocalDB.update(data => {
      data.user = { ...data.user, ...d };
      return data;
    });
  };
  
  const handleStartPatrol = () => {
    setIsPatrolling(true);
    speak("雷达启动！");
    setTimeout(() => {
       const activeLibIds = new Set(tasks.filter(t => t.status === 'pending' && t.libraryId).map(t => t.libraryId));
       // Find any library item not currently active
       const candidate = libraryItems.find(i => !activeLibIds.has(i.id));
       
       if (candidate) {
          handleAddTask({ 
            title: candidate.title, type: candidate.type, reward: candidate.reward, flashcardData: candidate.flashcardData,
            libraryId: candidate.id, source: 'patrol' 
          });
          speak("发现计划任务！");
       } else {
          // Random generic if empty
          handleAddTask({ title: "整理书桌", reward: 10, type: 'generic', source: 'patrol' });
          speak("发现随机任务！");
       }
       setIsPatrolling(false);
    }, 3000);
  };

  const handleCompleteTask = (task) => {
    if (processingTasks.has(task.id)) return;
    setProcessingTasks(prev => new Set(prev).add(task.id));
    setHiddenTaskIds(prev => new Set(prev).add(task.id));
    if (activeFlashcardTask?.id === task.id) setActiveFlashcardTask(null);
    
    setTimeout(() => {
      LocalDB.update(d => {
         const t = d.tasks.find(x => x.id === task.id);
         if (t) { t.status = 'completed'; t.completedAt = Date.now(); }
         
         d.user.xp += task.reward;
         d.user.coins += task.reward;
         
         if (d.user.xp >= d.user.level * 100) {
           d.user.level += 1;
           d.user.xp = 0;
           setTimeout(() => speak("恭喜升级！"), 1500);
         }

         if (task.libraryId) {
            const libItem = d.library.find(i => i.id === task.libraryId);
            if (libItem) {
               const lv = libItem.memoryLevel || 0;
               const nextLv = Math.min(lv + 1, REVIEW_INTERVALS.length - 1);
               const nextDate = new Date();
               nextDate.setDate(nextDate.getDate() + REVIEW_INTERVALS[nextLv]);
               // Reset time to 19:00 of that day
               nextDate.setHours(19, 0, 0, 0);
               
               libItem.memoryLevel = nextLv;
               libItem.nextReview = nextDate.getTime();
            }
         }
         return d;
      });
      speak("任务完成！");
      setProcessingTasks(prev => { const next = new Set(prev); next.delete(task.id); return next; });
    }, 500);
  };

  if (loading) return <LoadingScreen />;

  const pendingTasks = tasks.filter(t => t.status === 'pending');

  return (
    <div className="font-sans antialiased select-none">
      <ErrorBoundary>
        <KidDashboard userProfile={userProfile} tasks={tasks} onCompleteTask={handleCompleteTask} onPlayFlashcard={(task) => setActiveFlashcardTask(task)} toggleParentMode={() => setIsParentMode(true)} processingTasks={processingTasks} hiddenTaskIds={hiddenTaskIds} onStartPatrol={handleStartPatrol} isPatrolling={isPatrolling} isPlaying={!!activeFlashcardTask} />
        {isParentMode && <ParentDashboard userProfile={userProfile} tasks={tasks} libraryItems={libraryItems} onAddTask={handleAddTask} onDeleteTask={handleDeleteTask} onUpdateProfile={handleUpdateProfile} onManageLibrary={handleManageLibrary} onClose={() => setIsParentMode(false)} />}
        {activeFlashcardTask && <FlashcardGame task={activeFlashcardTask} onClose={() => setActiveFlashcardTask(null)} onComplete={handleCompleteTask} />}
      </ErrorBoundary>
    </div>
  );
}
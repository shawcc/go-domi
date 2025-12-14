import React, { useState, useEffect, useRef } from 'react';
// 纯本地版，无 Firebase 依赖
import { 
  Trophy, Settings, Plus, CheckCircle, XCircle, Volume2, Gamepad2, 
  Rocket, Zap, Loader2, Activity, BrainCircuit, History, ListTodo, 
  Clock, Gem, Hexagon, Octagon, Triangle, 
  Siren, Sparkles, Mic, Library, Calendar, FileUp, FileDown, Trash2,
  Radar, Flame, Moon, Volume1, Users, ThumbsUp, Image as ImageIcon, Languages, Headphones, ImageOff, Wand2, Search, Calculator, Lock,
  Puzzle, BookOpen, Star, Gift, Sliders
} from 'lucide-react';

// ==========================================
// --- 0. 全局样式修复 (含动画定义) ---
// ==========================================
const GlobalStyles = () => (
  <style>{`
    html, body, #root { margin: 0; padding: 0; width: 100%; height: 100%; max-width: none !important; overflow-x: hidden; font-family: system-ui, -apple-system, sans-serif; }
    ::-webkit-scrollbar { width: 0px; background: transparent; }
    
    /* 卡片光效 */
    @keyframes shine {
      0% { transform: translateX(-100%) rotate(45deg); }
      100% { transform: translateX(200%) rotate(45deg); }
    }
    .shiny-card { position: relative; overflow: hidden; }
    .shiny-card::after {
      content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(to right, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
      transform: translateX(-100%) rotate(45deg);
      animation: shine 3s infinite;
    }

    /* 警报条纹移动 */
    @keyframes move-stripes {
      0% { background-position: 0 0; }
      100% { background-position: 50px 50px; }
    }
    .hazard-stripes {
      background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239, 68, 68, 0.1) 10px, rgba(239, 68, 68, 0.1) 20px);
      background-size: 50px 50px;
      animation: move-stripes 2s linear infinite;
    }
    
    /* 红色扫描线 */
    @keyframes scan {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(100%); }
    }
    .scan-line {
      background: linear-gradient(to bottom, transparent, rgba(239, 68, 68, 0.5), transparent);
      animation: scan 3s linear infinite;
    }

    /* 流星划过 */
    @keyframes shooting-star {
      0% { transform: translateX(0) translateY(0) rotate(45deg); opacity: 1; }
      100% { transform: translateX(-500px) translateY(500px) rotate(45deg); opacity: 0; }
    }
    .shooting-star {
      position: absolute;
      width: 4px;
      height: 4px;
      background: white;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(255,255,255,0.1), 0 0 0 8px rgba(255,255,255,0.1), 0 0 20px rgba(255,255,255,1);
      animation: shooting-star 5s linear infinite;
    }
    .shooting-star::before {
      content: '';
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      right: 0;
      width: 200px;
      height: 1px;
      background: linear-gradient(to right, transparent, rgba(255,255,255,0.8));
    }
  `}</style>
);

// ==========================================
// --- 1. 核心引擎：本地数据库 (LocalStorage) ---
// ==========================================
const STORAGE_KEY = 'go_domi_local_v11_fix_assets';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

const LocalDB = {
  get: () => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return {
        user: { 
          name: '多米', level: 1, xp: 0, coins: 0, theme: 'cosmic', streak: 1, 
          fragments: 0, 
          pushStartHour: 19, pushEndHour: 21, dailyLimit: 10,
          ...data?.user 
        },
        tasks: Array.isArray(data?.tasks) ? data.tasks : [],
        library: Array.isArray(data?.library) ? data.library : [],
        collection: {
          puzzlePieces: [], 
          unlockedCards: [], 
          ...data?.collection
        }
      };
    } catch (e) {
      return { 
        user: { name: '多米', level: 1, xp: 0, coins: 0, theme: 'cosmic', streak: 1, fragments: 0, pushStartHour: 19, pushEndHour: 21, dailyLimit: 10 }, 
        tasks: [], library: [], collection: { puzzlePieces: [], unlockedCards: [] } 
      };
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
    if (!fullData || !fullData.user) { alert("无效的存档文件"); return; }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullData));
    window.dispatchEvent(new Event('local-db-change'));
    window.location.reload(); 
  }
};

// ==========================================
// --- 2. 智能资源与音效引擎 ---
// ==========================================

// 系统音效配置
const SOUND_EFFECTS = {
  alert: { local: '/assets/audio/alert.mp3', fallback: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  success: { local: '/assets/audio/success.mp3', fallback: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' },
  patrol: { local: '/assets/audio/patrol.mp3', fallback: 'https://assets.mixkit.co/active_storage/sfx/2044/2044-preview.mp3' },
  levelup: { local: '/assets/audio/levelup.mp3', fallback: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3' }
};

const playSystemSound = (type) => {
  const config = SOUND_EFFECTS[type];
  if (!config) return;
  const audio = new Audio(config.local);
  audio.play().catch(() => {
    const fallbackAudio = new Audio(config.fallback);
    fallbackAudio.volume = 0.4; 
    fallbackAudio.play().catch(() => {});
  });
};

const PUZZLE_CONFIG = {
  totalPieces: 9, 
  image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80", 
};

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

// ==========================================
// --- 3. 配置与常量 ---
// ==========================================
const THEMES = {
  cosmic: {
    id: 'cosmic', name: '宇宙护卫队', bg: 'bg-slate-900', text: 'text-slate-100', card: 'bg-slate-800',
    primary: 'bg-blue-600 hover:bg-blue-500', accent: 'text-yellow-400',
    mascot: '/assets/images/mascot.png', backgroundImage: '/assets/images/bg_cosmic.jpg', 
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

// --- Utilities ---
const getBeijingTime = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + 8 * 3600000);
};

const isBeijingActiveWindow = (startHour, endHour) => {
  const h = getBeijingTime().getHours();
  return h >= startHour && h < endHour; 
};

const getNextBeijingScheduleTime = () => {
  const now = new Date();
  const utcNow = now.getTime() + (now.getTimezoneOffset() * 60000);
  const today11UTC = new Date(utcNow);
  today11UTC.setUTCHours(11, 0, 0, 0); 
  if (utcNow >= today11UTC.getTime()) { today11UTC.setDate(today11UTC.getDate() + 1); }
  return today11UTC.getTime();
};

const speak = (text, isTest = false) => {
  if (!window.speechSynthesis) { if (isTest) alert("浏览器不支持语音"); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN'; u.rate = 1.0; 
  const voices = window.speechSynthesis.getVoices();
  const zh = voices.find(v => v.lang.includes('zh'));
  if (zh) u.voice = zh;
  u.onerror = (e) => { if(isTest) console.error(e); };
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
    const audio = new Audio(audioUrl);
    audio.play().catch(e => { console.warn(`Fallback TTS`, e); speakEnglish(text); });
  } else { speakEnglish(text); }
};

const formatTime = (ts) => new Date(ts).toLocaleString('zh-CN', {month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'});

// ==========================================
// --- 4. 错误边界 ---
// ==========================================
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) return <div className="p-8 text-center text-white">系统错误，请刷新重试</div>;
    return this.props.children; 
  }
}

// ==========================================
// --- 5. 子组件 ---
// ==========================================

const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
    <div className="animate-bounce text-6xl mb-4">🚀</div>
    <h1 className="text-2xl font-bold animate-pulse">正在连接宇宙基地...</h1>
    <p className="text-slate-400 mt-2">系统初始化中</p>
  </div>
);

const DynamicBackground = ({ themeId, customBg }) => {
  const [bgError, setBgError] = useState(false);
  if (customBg && !bgError) {
    return (
      <div className="absolute inset-0 z-0">
        <img src={customBg} alt="background" className="w-full h-full object-cover" onError={() => setBgError(true)} />
        <div className="absolute inset-0 bg-black/40"></div>
        {/* 叠加流星效果 */}
        <div className="absolute top-10 right-10 shooting-star"></div>
        <div className="absolute top-1/3 left-20 shooting-star" style={{animationDelay: '3s'}}></div>
      </div>
    );
  }
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black"></div>
      {[...Array(30)].map((_, i) => (
        <div key={i} className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse"
             style={{left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, animationDelay: `${Math.random()*3}s`, opacity: Math.random()}}></div>
      ))}
      <div className="absolute top-10 right-10 shooting-star"></div>
    </div>
  );
};

const RewardModal = ({ rewards, onClose }) => {
  useEffect(() => {
    playSystemSound('success');
    speak("任务完成！获得奖励！");
  }, []);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in zoom-in duration-300">
      <div className="bg-slate-800 border-4 border-yellow-400 p-8 rounded-3xl text-center max-w-sm w-full relative overflow-hidden shadow-[0_0_80px_rgba(250,204,21,0.6)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-yellow-500/20 to-transparent animate-pulse pointer-events-none"></div>
        <h2 className="text-3xl font-black text-white mb-6 italic relative z-10 drop-shadow-lg">MISSION COMPLETE</h2>
        <div className="space-y-4 relative z-10">
          <div className="flex items-center justify-center gap-3 text-yellow-300 text-2xl font-bold"><Zap size={32} className="fill-yellow-300" /> +{rewards.coins} 能量石</div>
          <div className="flex items-center justify-center gap-3 text-blue-300 text-2xl font-bold"><Star size={32} className="fill-blue-300" /> +{rewards.xp} 经验值</div>
          {rewards.fragment && (<div className="bg-purple-900/50 p-3 rounded-xl border border-purple-500/50 flex items-center gap-3 animate-bounce"><div className="p-2 bg-purple-600 rounded-full"><Gem size={24} className="text-white" /></div><div className="text-left"><div className="text-xs text-purple-300 font-bold uppercase">稀有掉落</div><div className="text-white font-bold">获得陨石碎片!</div></div></div>)}
          {rewards.puzzlePiece !== undefined && (<div className="bg-green-900/50 p-3 rounded-xl border border-green-500/50 flex items-center gap-3 animate-pulse"><div className="p-2 bg-green-600 rounded-full"><Puzzle size={24} className="text-white" /></div><div className="text-left"><div className="text-xs text-green-300 font-bold uppercase">收集进度</div><div className="text-white font-bold">获得新拼图碎片!</div></div></div>)}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="mt-8 w-full py-5 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-2xl rounded-2xl shadow-xl active:scale-95 transition-transform relative z-50 cursor-pointer">收入囊中</button>
      </div>
    </div>
  );
};

const CollectionModal = ({ collection, onClose, initialTab = 'puzzle' }) => {
  const [tab, setTab] = useState(initialTab);
  const { puzzlePieces = [], unlockedCards = [] } = collection;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col animate-in slide-in-from-bottom">
       <div className="p-4 flex justify-between items-center bg-slate-800 border-b border-slate-700">
         <h2 className="text-xl font-bold flex items-center gap-2"><Library /> 收藏馆</h2>
         <button onClick={onClose} className="p-2 bg-slate-700 rounded-full"><XCircle /></button>
       </div>
       <div className="flex p-2 gap-2 bg-slate-800">
          <button onClick={() => setTab('puzzle')} className={`flex-1 py-2 rounded-lg font-bold ${tab==='puzzle' ? 'bg-blue-600' : 'bg-slate-700 text-slate-400'}`}>神秘拼图</button>
          <button onClick={() => setTab('cards')} className={`flex-1 py-2 rounded-lg font-bold ${tab==='cards' ? 'bg-purple-600' : 'bg-slate-700 text-slate-400'}`}>单词图鉴 ({unlockedCards.length})</button>
       </div>
       <div className="flex-1 overflow-y-auto p-4">
          {tab === 'puzzle' && (
             <div className="flex flex-col items-center">
                <div className="text-center mb-4 text-slate-400 text-sm">完成任务随机掉落碎片，集齐解锁神秘飞船！</div>
                <div className="grid grid-cols-3 gap-1 bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-2xl" style={{ width: '300px', height: '300px' }}>
                   {[...Array(9)].map((_, i) => {
                      const isUnlocked = puzzlePieces.includes(i);
                      return (
                        <div key={i} className="relative bg-slate-900 overflow-hidden flex items-center justify-center border border-white/5">
                           {isUnlocked ? (
                              <div className="w-full h-full bg-cover" style={{ backgroundImage: `url(${PUZZLE_CONFIG.image})`, backgroundPosition: `${(i % 3) * 50}% ${Math.floor(i / 3) * 50}%`, backgroundSize: '300% 300%' }} />
                           ) : (<Lock className="text-slate-700" size={24} />)}
                        </div>
                      );
                   })}
                </div>
                <div className="mt-6 text-blue-400 font-mono font-bold">进度: {puzzlePieces.length} / 9</div>
             </div>
          )}
          {tab === 'cards' && (
             <div className="grid grid-cols-2 gap-4">
                {unlockedCards.map((card, idx) => (
                   <div key={idx} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col items-center shiny-card">
                      <div className="text-2xl font-black text-white mb-1">{card.word}</div>
                      <div className="text-xs text-slate-400">{card.cn}</div>
                   </div>
                ))}
                {unlockedCards.length === 0 && <div className="col-span-2 text-center text-slate-500 py-10">还没有学会单词哦，加油！</div>}
             </div>
          )}
       </div>
    </div>
  );
};

const GrowingCrystal = ({ level, xp, onClick }) => {
  const currentStage = [...CRYSTAL_STAGES].reverse().find(stage => level >= stage.minLevel) || CRYSTAL_STAGES[0];
  const Icon = currentStage.icon;
  const growthScale = 1 + (xp / 100) * 0.2; 
  const [isPoked, setIsPoked] = useState(false);

  const handlePoke = () => {
    setIsPoked(true);
    speak(currentStage.message);
    if(onClick) onClick();
    setTimeout(() => setIsPoked(false), 500);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative py-12 cursor-pointer group w-full" onClick={handlePoke}>
       <div className={`absolute w-64 h-64 rounded-full blur-[80px] opacity-40 animate-pulse-slow transition-colors duration-1000 ${currentStage.color.replace('text-', 'bg-')}`}></div>
       <div className={`relative transition-all duration-300 ease-out ${isPoked ? 'scale-110 rotate-3' : ''}`} style={{ transform: isPoked ? undefined : `scale(${currentStage.scale * growthScale})` }}>
          <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse"></div>
          <Icon size={120} strokeWidth={1} className={`${currentStage.color} drop-shadow-[0_0_30px_rgba(255,255,255,0.6)] filter`} />
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
  const isEnglish = task.type === 'english';
  // 提取图片
  const taskImage = isEnglish ? task.flashcardData?.image : (task.image || task.flashcardData?.image);
  const displayTitle = isEnglish ? "英语挑战" : task.title;

  useEffect(() => {
    const timer = setTimeout(() => {
        playSystemSound('alert'); // 播放警报音效
        const intro = isEnglish ? "英语挑战时间！" : "紧急任务！";
        const content = isEnglish ? "请完成一个单词练习" : task.title;
        setTimeout(() => speak(`${intro} ${content}`), 1000);
    }, 300);
    return () => clearTimeout(timer);
  }, [task.id, task.title, task.type]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
       
       {/* 背景特效：红色警戒 */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-900/20 to-transparent animate-[scan_3s_linear_infinite] transform -translate-y-full scan-line"></div>
          <div className="absolute inset-0 hazard-stripes"></div>
       </div>

       <div className={`w-full max-w-lg ${currentTheme.card} rounded-3xl border-4 border-red-500 shadow-[0_0_80px_rgba(239,68,68,0.6)] overflow-hidden relative animate-in zoom-in-95 duration-300`}>
          <div className="bg-red-500 text-white p-4 flex items-center justify-center gap-3 animate-pulse">
            <Siren size={28} className="animate-bounce" />
            <h2 className="text-xl font-black uppercase tracking-wider">紧急任务警报</h2>
            <Siren size={28} className="animate-bounce" />
          </div>
          <div className="p-8 flex flex-col items-center text-center">
            
            {/* 任务展示区：优先图片，无图则显示图标 */}
            <div className="mb-6 relative w-48 h-48 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center overflow-hidden shadow-lg group">
                {taskImage ? (
                  <img src={taskImage} alt="Task Icon" className="w-full h-full object-cover transform transition-transform group-hover:scale-110" onError={(e) => {e.target.style.display='none'}} />
                ) : (
                  <div className="text-6xl animate-bounce">{isEnglish ? "A" : "⚔️"}</div>
                )}
            </div>

            <div className="space-y-2 mb-8">
               <div className="flex items-center justify-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-widest animate-pulse">
                   来自 {currentTheme.assistant} 的信号...
               </div>
               <h1 className="text-3xl font-bold text-white leading-tight flex flex-col items-center gap-2">
                 {displayTitle}
               </h1>
               <div className="inline-flex items-center gap-2 bg-yellow-400/20 text-yellow-400 px-4 py-1 rounded-full border border-yellow-400/30 mt-2">
                  <Zap size={18} fill="currentColor" />
                  <span className="font-bold text-lg">奖励 {task.reward}</span>
               </div>
            </div>
            <div className="w-full">
              {isEnglish ? (
                <button onClick={() => onPlayFlashcard(task)} disabled={isProcessing} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-2xl font-black text-xl shadow-lg shadow-purple-900/50 flex items-center justify-center gap-3 active:scale-95 transition-all">{isProcessing ? <Loader2 className="animate-spin" size={24} /> : <Gamepad2 size={24} />} 开始挑战</button>
              ) : (
                <button onClick={() => onCompleteTask(task)} disabled={isProcessing} className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-black text-xl shadow-lg shadow-green-900/50 flex items-center justify-center gap-3 active:scale-95 transition-all">{isProcessing ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle size={24} />} 确认完成</button>
              )}
            </div>
          </div>
       </div>
    </div>
  );
};

const KidDashboard = ({ userProfile, tasks, onCompleteTask, onPlayFlashcard, toggleParentMode, processingTasks, hiddenTaskIds, onStartPatrol, isPatrolling, isPlaying, onOpenCollection }) => {
  const currentTheme = THEMES[userProfile.theme || 'cosmic'];
  const displayTasks = tasks.filter(t => t.status === 'pending' && !hiddenTaskIds.has(t.id));
  const nextLevelXp = userProfile.level * 100;
  const progressPercent = Math.min((userProfile.xp / nextLevelXp) * 100, 100);
  const isImgMascot = currentTheme.mascot.startsWith('/');
  const streakDays = userProfile.streak || 1;

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} transition-colors duration-500 relative overflow-hidden flex flex-col`}>
      <DynamicBackground themeId={currentTheme.id} customBg={currentTheme.backgroundImage} />
      
      {isPatrolling && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
           <div className="relative w-[300px] h-[300px]"><div className="absolute inset-0 border-4 border-green-500/50 rounded-full bg-green-900/20 shadow-[0_0_50px_rgba(34,197,94,0.3)] animate-ping"></div><div className="absolute inset-0 border border-green-500/30 rounded-full scale-50"></div><div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-green-500/30"></div><div className="absolute left-0 right-0 top-1/2 h-[1px] bg-green-500/30"></div><div className="absolute top-1/2 left-1/2 w-[150px] h-[150px] bg-gradient-to-r from-transparent to-green-500/50 origin-top-left animate-[spin_2s_linear_infinite] rounded-br-full"></div></div><div className="mt-8 text-green-400 font-mono text-2xl font-black tracking-widest animate-pulse">SCANNING SECTOR...</div>
        </div>
      )}

      {/* Header */}
      <div className="w-full relative z-10 p-4 flex justify-between items-center bg-black/20 backdrop-blur-md shadow-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]">
            {!isImgMascot ? <Rocket className="text-yellow-400" size={32} /> : <img src={currentTheme.mascot} alt="mascot" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />}
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">多米队长</h2>
            <div className="flex items-center gap-2">
               <span className="text-xs text-white/70 bg-white/10 px-2 py-0.5 rounded">Lv.{userProfile.level}</span>
               <div className="flex items-center gap-1 text-orange-400 text-xs font-bold animate-pulse"><Flame size={12} fill="currentColor" /> {streakDays}天连胜</div>
               <div className="flex items-center gap-1 text-purple-300 text-xs font-bold border border-purple-500/30 px-2 py-0.5 rounded bg-purple-900/30">
                  <Gem size={10} /> {userProfile.fragments || 0}
               </div>
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

      {/* Main Content */}
      <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col relative z-10">
        <div className="px-6 mt-4 mb-4">
          <div className="flex justify-between text-xs text-blue-300 font-bold mb-1">
             <span>能量水平</span><span>{userProfile.xp} / {nextLevelXp}</span>
          </div>
          <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/10 relative shadow-inner">
            <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-white transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        <GrowingCrystal level={userProfile.level} xp={userProfile.xp} />

        {/* Control Dock */}
        <div className="fixed bottom-6 left-0 right-0 flex justify-center items-end gap-6 z-40 px-6 pointer-events-none">
           {/* Left: Puzzle */}
           <button onClick={() => onOpenCollection('puzzle')} className="pointer-events-auto w-16 h-16 rounded-full bg-slate-800/80 border-2 border-slate-600 flex items-center justify-center shadow-lg backdrop-blur-md active:scale-95 transition-all hover:border-yellow-400 mb-2">
             <Puzzle className="text-yellow-400" size={28} />
             <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold border border-white text-white">
               {userProfile.collection?.puzzlePieces?.length || 0}
             </div>
           </button>

           {/* Center: Patrol */}
           <button onClick={onStartPatrol} disabled={isPatrolling} className={`pointer-events-auto group relative transition-all active:scale-95 ${isPatrolling ? 'opacity-80 scale-95' : 'hover:scale-105'}`}>
             <div className="w-24 h-24 rounded-full bg-gradient-to-b from-blue-600 to-blue-800 border-4 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.6)] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4),_transparent)]"></div>
                <Radar className={`w-10 h-10 text-white ${isPatrolling ? 'animate-spin' : ''}`} />
                <span className="text-[10px] font-black text-blue-100 uppercase mt-1 tracking-wider relative z-10">巡逻</span>
             </div>
           </button>

           {/* Right: Book */}
           <button onClick={() => onOpenCollection('cards')} className="pointer-events-auto w-16 h-16 rounded-full bg-slate-800/80 border-2 border-slate-600 flex items-center justify-center shadow-lg backdrop-blur-md active:scale-95 transition-all hover:border-blue-400 mb-2">
             <BookOpen className="text-blue-400" size={28} />
             <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full text-[10px] flex items-center justify-center font-bold border border-white text-white">
               {userProfile.collection?.unlockedCards?.length || 0}
             </div>
           </button>
        </div>
      </div>

      {/* Task Popup */}
      {displayTasks.length > 0 && !isPlaying && (
         <TaskPopup tasks={displayTasks} currentTheme={currentTheme} onCompleteTask={onCompleteTask} onPlayFlashcard={onPlayFlashcard} processingTasks={processingTasks} />
      )}
    </div>
  );
};

const ParentDashboard = ({ userProfile, tasks, libraryItems, onAddTask, onClose, onDeleteTask, onUpdateProfile, onManageLibrary, onDataChange }) => {
  const [activeTab, setActiveTab] = useState('library'); 
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('generic');
  const [newTaskReward, setNewTaskReward] = useState(20);
  const [flashcardWord, setFlashcardWord] = useState('');
  const [flashcardTrans, setFlashcardTrans] = useState('');
  const [flashcardImg, setFlashcardImg] = useState('');
  const [flashcardAudio, setFlashcardAudio] = useState('');
  const [batchWords, setBatchWords] = useState(''); 
  const [textImport, setTextImport] = useState(''); 
  const [taskProbabilities, setTaskProbabilities] = useState(userProfile.taskProbabilities || { english: 50, sport: 30, life: 20 });
  const [pushStart, setPushStart] = useState(userProfile.pushStartHour || 19);
  const [pushEnd, setPushEnd] = useState(userProfile.pushEndHour || 21);
  const [dailyLimit, setDailyLimit] = useState(userProfile.dailyLimit || 10);
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const upcomingTasks = libraryItems.filter(item => item.nextReview && item.nextReview > Date.now()).sort((a,b) => a.nextReview - b.nextReview);
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const fileInputRef = useRef(null);

  const refresh = () => { if(onDataChange) onDataChange(); };
  const handleSaveConfig = () => { onUpdateProfile({ taskProbabilities, pushStartHour: parseInt(pushStart), pushEndHour: parseInt(pushEnd), dailyLimit: parseInt(dailyLimit) }); alert("配置已保存！"); };
  const handlePush = (e) => { e.preventDefault(); onAddTask({ title: newTaskTitle, type: newTaskType, reward: parseInt(newTaskReward), flashcardData: newTaskType === 'english' ? { word: flashcardWord, translation: flashcardTrans, image: flashcardImg, audio: flashcardAudio } : (newTaskType === 'generic' ? { image: flashcardImg } : null) }); setNewTaskTitle(''); setFlashcardWord(''); setFlashcardTrans(''); setFlashcardImg(''); setFlashcardAudio(''); alert('任务已直接推送给多米！'); refresh(); };
  const handleAddToLibrary = (e) => { e.preventDefault(); onManageLibrary('add', { title: newTaskTitle, type: newTaskType, reward: parseInt(newTaskReward), flashcardData: newTaskType === 'english' ? { word: flashcardWord, translation: flashcardTrans, image: flashcardImg, audio: flashcardAudio } : (newTaskType === 'generic' ? { image: flashcardImg } : null), memoryLevel: 0, nextReview: getNextBeijingScheduleTime(parseInt(pushStart)) }); setNewTaskTitle(''); setFlashcardWord(''); setFlashcardTrans(''); setFlashcardImg(''); setFlashcardAudio(''); alert('已添加到任务库'); refresh(); };
  
  const handleBatchAddWords = () => {
    if (!batchWords.trim()) return;
    const words = batchWords.split(/[,，\n]/).map(w => w.trim()).filter(w => w);
    const batchTime = getNextBeijingScheduleTime(parseInt(pushStart));
    let count = 0;
    words.forEach(word => {
      const enrichedData = enrichWordTask(word);
      onManageLibrary('add', {
        title: `练习单词: ${enrichedData.word}`,
        type: 'english',
        reward: 20,
        flashcardData: enrichedData,
        memoryLevel: 0,
        nextReview: batchTime
      });
      count++;
    });
    alert(`成功生成 ${count} 个任务！`); setBatchWords(''); refresh();
  };

  const handleProbChange = (type, value) => { const newVal = parseInt(value); setTaskProbabilities(prev => ({ ...prev, [type]: newVal })); };
  const saveProbabilities = () => { onUpdateProfile({ taskProbabilities }); alert("已保存！"); };
  const handleExport = () => { const BOM = "\uFEFF"; const rows = libraryItems.map(item => `${(item.title||"").replace(/,/g,"，")},${item.type||"generic"},${item.reward||10},${item.flashcardData?.word||""}`); const blob = new Blob([BOM + "标题,类型,奖励,单词\n" + rows.join("\n")], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = "tasks.csv"; document.body.appendChild(link); link.click(); link.remove(); };
  const handleImport = () => { try { const rows = textImport.trim().split('\n'); let count = 0; const batchTime = getNextBeijingScheduleTime(parseInt(pushStart)); for (let i = 0; i < rows.length; i++) { const parts = rows[i].split(','); if (parts.length < 2) continue; const title = parts[0]?.trim(); if (!title) continue; const typeRaw = parts[1]?.trim().toLowerCase(); const type = (typeRaw.includes('eng')) ? 'english' : 'generic'; onManageLibrary('add', { title, type, reward: parseInt(parts[2]?.trim())||10, flashcardData: (type === 'english' && parts[3]?.trim()) ? { word: parts[3].trim() } : null, memoryLevel: 0, nextReview: batchTime }); count++; } alert(`导入 ${count} 个`); setTextImport(''); refresh(); } catch (e) { alert("格式错误"); } };
  const handleBackup = () => { const data = LocalDB.get(); const blob = new Blob([JSON.stringify(data)], {type:'application/json'}); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `backup_${Date.now()}.json`; document.body.appendChild(link); link.click(); link.remove(); };
  const handleRestore = (e) => { const file = e.target.files[0]; if(!file)return; const reader = new FileReader(); reader.onload = (ev) => { try { LocalDB.restore(JSON.parse(ev.target.result)); } catch { alert("文件错误"); } }; reader.readAsText(file); };

  return (
    <div className="fixed inset-0 bg-slate-100 text-slate-900 z-50 overflow-y-auto animate-in slide-in-from-bottom">
       <div className="bg-white shadow-sm p-4 sticky top-0 flex justify-between items-center z-10"><h2 className="text-xl font-bold text-slate-800">家长后台</h2><button onClick={onClose} className="p-2 bg-slate-200 rounded-full"><XCircle size={24} /></button></div>
       <div className="max-w-4xl mx-auto p-4 md:p-8">
         <div className="flex gap-2 mb-6 bg-slate-200 p-1 rounded-xl overflow-x-auto">{['library','plan','monitor','history','config'].map(t=>(<button key={t} onClick={()=>setActiveTab(t)} className={`flex-1 min-w-[80px] py-2 rounded-lg font-bold text-sm capitalize ${activeTab===t?'bg-white shadow text-blue-600':'text-slate-500'}`}>{t}</button>))}</div>
         {activeTab === 'library' && (
           <div className="space-y-6">
             <section className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl shadow-sm border border-blue-100"><h3 className="font-bold mb-4 flex items-center gap-2 text-blue-800"><Wand2 size={18}/> 智能批量添加 (AI)</h3><p className="text-xs text-slate-500 mb-2">输入单词（用逗号或换行分隔），系统将自动生成卡通图片、匹配发音和中文。</p><textarea className="w-full p-3 border rounded-xl text-sm h-24 mb-3 focus:ring-2 focus:ring-blue-300 outline-none" placeholder="例如: lion, pizza, guitar" value={batchWords} onChange={e => setBatchWords(e.target.value)}></textarea><button onClick={handleBatchAddWords} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">一键生成任务并入库</button></section>
             <section className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-slate-300"><h3 className="font-bold mb-4">手动精细添加</h3><div className="space-y-4"><div className="flex gap-2"><button onClick={()=>setNewTaskType('generic')} className={`flex-1 py-2 border rounded ${newTaskType==='generic'?'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500'}`}>通用</button><button onClick={()=>setNewTaskType('english')} className={`flex-1 py-2 border rounded ${newTaskType==='english'?'bg-purple-50 border-purple-500 text-purple-700' : 'border-slate-200 text-slate-500'}`}>英语</button></div><div className="flex gap-2"><input className="flex-1 p-2 border rounded" placeholder="任务名称 (必填)" value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} /><input className="w-20 p-2 border rounded" type="number" placeholder="奖励" value={newTaskReward} onChange={e=>setNewTaskReward(e.target.value)} /></div>
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                 {newTaskType === 'english' && <div className="flex gap-2"><input className="flex-1 p-2 border rounded" placeholder="英文单词 (Word)" value={flashcardWord} onChange={e=>setFlashcardWord(e.target.value)} /><input className="flex-1 p-2 border rounded" placeholder="中文释义 (Translation)" value={flashcardTrans} onChange={e=>setFlashcardTrans(e.target.value)} /></div>}
                 <input className="w-full p-2 border rounded text-xs" placeholder="图片链接 (Image URL) - 支持本地 /assets/images/xxx.jpg" value={flashcardImg} onChange={e=>setFlashcardImg(e.target.value)} />
                 {newTaskType === 'english' && <input className="w-full p-2 border rounded text-xs" placeholder="发音链接 (Audio URL) - 支持本地 /assets/audio/xxx.mp3" value={flashcardAudio} onChange={e=>setFlashcardAudio(e.target.value)} />}
               </div>
               <div className="flex gap-2"><button onClick={handleAddToLibrary} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded font-bold">入库</button><button onClick={handlePush} className="flex-1 bg-slate-800 text-white py-3 rounded font-bold">推送</button></div></div></section>
             <section className="bg-white p-6 rounded-2xl shadow-sm"><div className="flex justify-between mb-4 items-center"><h3 className="font-bold">库列表 ({libraryItems.length})</h3><div className="flex gap-2"><button onClick={handleExport} className="text-xs text-blue-600"><FileDown size={14}/> 导出CSV</button></div></div><div className="space-y-2 max-h-[300px] overflow-y-auto">{libraryItems.map(i=>(<div key={i.id} className="flex justify-between p-2 border-b"><div><span className="font-bold">{i.title}</span> <span className="text-xs text-slate-400">Lv.{i.memoryLevel}</span></div><button onClick={()=>onManageLibrary('delete',i.id)} className="text-red-400"><Trash2 size={16}/></button></div>))}</div></section>
           </div>
         )}
         {activeTab === 'plan' && <div className="bg-white p-6 rounded-2xl shadow-sm"><h3 className="font-bold mb-4"><Moon size={16} className="inline mr-2"/>待推送队列</h3><div className="mb-4 text-xs text-slate-500 bg-slate-50 p-2 rounded">调度引擎状态：{isBeijingActiveWindow(parseInt(pushStart), parseInt(pushEnd)) ? `运行中 (${pushStart}:00-${pushEnd}:00)` : `休眠中 (下次 ${pushStart}:00 启动)`} | 今日已发: {tasks.filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString()).length}/{dailyLimit}</div>{upcomingTasks.length===0?<p className="text-slate-400">无计划</p>:upcomingTasks.map(i=>(<div key={i.id} className="p-2 border-b flex justify-between"><span>{i.title}</span><span className="text-xs bg-purple-100 px-2 rounded">Lv.{i.memoryLevel}</span></div>))}</div>}
         {activeTab === 'monitor' && <div className="bg-white p-6 rounded-2xl shadow-sm"><h3 className="font-bold mb-4">实时待办</h3>{pendingTasks.map(t=>(<div key={t.id} className="flex justify-between p-2 border-b"><span>{t.title}</span><button onClick={()=>onDeleteTask(t.id)} className="text-red-400"><XCircle size={16}/></button></div>))}</div>}
         {activeTab === 'history' && <div className="bg-white p-6 rounded-2xl shadow-sm"><h3 className="font-bold mb-4">完成记录</h3>{completedTasks.map(t=>(<div key={t.id} className="flex justify-between p-2 border-b text-sm"><span className="text-slate-700">{t.title}</span><span className="text-green-600">{formatTime(t.completedAt)}</span></div>))}</div>}
         {activeTab === 'config' && (
            <div className="space-y-6">
              <section className="bg-white p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Sliders size={18}/> 调度配置</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><label className="text-xs text-slate-500">推送开始</label><input type="number" className="w-full p-2 border rounded" value={pushStart} onChange={e=>setPushStart(e.target.value)} /></div>
                  <div><label className="text-xs text-slate-500">推送结束</label><input type="number" className="w-full p-2 border rounded" value={pushEnd} onChange={e=>setPushEnd(e.target.value)} /></div>
                  <div className="col-span-2"><label className="text-xs text-slate-500">每日最大任务量</label><input type="number" className="w-full p-2 border rounded" value={dailyLimit} onChange={e=>setDailyLimit(e.target.value)} /></div>
                </div>
                <div className="border-t pt-4">
                  <label className="text-xs text-slate-500 mb-2 block">随机生成概率 (当任务库空时)</label>
                  {['english', 'sport', 'life'].map(type => (
                    <div key={type} className="flex items-center gap-2 mb-2"><span className="text-xs w-16 capitalize">{type}</span><input type="range" className="flex-1" min="0" max="100" value={taskProbabilities[type]} onChange={e => setTaskProbabilities(p => ({...p, [type]: parseInt(e.target.value)}))} /><span className="text-xs w-8">{taskProbabilities[type]}%</span></div>
                  ))}
                </div>
                <button onClick={handleSaveConfig} className="w-full mt-4 py-2 bg-slate-800 text-white rounded font-bold">保存配置</button>
              </section>
              <section className="bg-white p-6 rounded-2xl shadow-sm"><h3 className="font-bold mb-4">数据备份</h3><div className="grid grid-cols-2 gap-3"><button onClick={handleBackup} className="p-3 bg-slate-100 rounded text-xs font-bold flex items-center justify-center gap-2"><FileDown size={16}/> 备份</button><button onClick={()=>fileInputRef.current.click()} className="p-3 bg-slate-100 rounded text-xs font-bold flex items-center justify-center gap-2"><FileUp size={16}/> 恢复</button><input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleRestore}/></div></section>
            </div>
         )}
       </div>
    </div>
  );
};

// --- 重构：社交验证版游戏模块 (图文模式 + 乘法验证) ---
const FlashcardGame = ({ task, onClose, onComplete }) => {
  const [step, setStep] = useState('learning'); 
  const [imageError, setImageError] = useState(false);
  const [showTrans, setShowTrans] = useState(false);
  const [mathQ, setMathQ] = useState({ a: 0, b: 0 }); 
  const [mathAns, setMathAns] = useState('');

  const word = task.flashcardData?.word || "Apple";
  const translation = task.flashcardData?.translation || "";
  const imageUrl = task.flashcardData?.image || "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80"; 
  const audioUrl = task.flashcardData?.audio || "";
  
  const playWord = () => { playTaskAudio(word, audioUrl); };

  useEffect(() => { if (step === 'learning') setTimeout(playWord, 500); }, [step, word]);

  // 生成乘法题
  const generateMath = () => {
    const a = Math.floor(Math.random() * 7) + 3; 
    const b = Math.floor(Math.random() * 7) + 3;
    setMathQ({ a, b });
    setMathAns('');
  };

  // 验证乘法
  const checkMath = () => {
    if (parseInt(mathAns) === mathQ.a * mathQ.b) {
       setStep('success');
       playSystemSound('success');
       speak("太棒了！任务完成！");
       setTimeout(() => onComplete(task), 2000);
    } else {
       alert("算错了哦，请家长再算算~");
       setMathAns('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white text-slate-900 w-full max-w-md md:max-w-lg rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors z-10"><XCircle /></button>
        
        {/* 图片区域 */}
        <div className="w-full h-64 bg-slate-100 relative flex items-center justify-center overflow-hidden">
           {imageError ? (
             <div className="flex flex-col items-center justify-center w-full h-full bg-slate-200">
                <img 
                  src={`https://source.unsplash.com/400x300/?${word}`} 
                  alt={word} 
                  className="w-full h-full object-cover opacity-80"
                  onError={(e) => { e.target.style.display='none'; }} 
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="bg-black/50 text-white px-2 py-1 rounded text-xs">本地图片未找到</span>
                </div>
             </div>
           ) : (
             <img 
               src={imageUrl} 
               alt={word} 
               className="w-full h-full object-cover" 
               onError={() => setImageError(true)}
             />
           )}
           <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <div className="text-white font-bold text-lg opacity-80 flex items-center gap-2"><ImageIcon size={16}/> 英语卡片</div>
           </div>
        </div>

        <div className="p-8 text-center space-y-6 overflow-y-auto flex-1">
           {step === 'success' ? (
             <div className="animate-bounce py-8"><Trophy size={80} className="mx-auto text-yellow-400 mb-4" /><h2 className="text-3xl font-bold text-slate-800">挑战成功!</h2><p className="text-slate-500 mt-2">家长已确认</p></div>
           ) : (
             <>
               <div className="space-y-2">
                 <h1 className="text-6xl font-bold text-blue-600 tracking-tight">{word}</h1>
                 {/* 中文翻译：默认隐藏，点击显示 */}
                 {translation ? (
                   <div onClick={() => setShowTrans(!showTrans)} className="cursor-pointer p-2 rounded hover:bg-slate-50 transition-colors">
                      {showTrans ? (
                         <span className="text-2xl text-slate-600 font-bold">{translation}</span>
                      ) : (
                         <span className="text-sm text-slate-400 flex items-center justify-center gap-1"><Languages size={14}/> 点击看中文</span>
                      )}
                   </div>
                 ) : (
                   <div className="text-sm text-slate-300">暂无中文释义</div>
                 )}
               </div>

               {/* 播放按钮 */}
               <button onClick={playWord} className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700 font-bold bg-blue-50 px-6 py-3 rounded-full border border-blue-100 shadow-sm active:scale-95 transition-all">
                  {audioUrl ? <Headphones size={24} /> : <Volume2 size={24} />} 
                  {audioUrl ? "播放原声" : "听发音"}
               </button>

               <div className="border-t border-slate-100 pt-6 mt-6">
                 {step === 'learning' ? (
                   <button 
                     onClick={() => {
                       setStep('challenge');
                       generateMath();
                     }}
                     className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-xl hover:bg-blue-500 transition-colors active:scale-95 shadow-lg shadow-blue-200"
                   >
                     我去教爷爷奶奶
                   </button>
                 ) : (
                   <div className="space-y-4 animate-in fade-in">
                     <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200 text-yellow-800 text-left">
                        <div className="flex items-center gap-2 font-bold text-lg mb-1"><Users size={20} /> 任务目标</div>
                        <p className="text-sm opacity-90">请教会爷爷奶奶读这个单词，并请他们完成下方验证。</p>
                     </div>
                     
                     {/* 极简乘法验证区域 */}
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between gap-2">
                           <span className="font-mono font-black text-xl text-slate-700">{mathQ.a} × {mathQ.b} = </span>
                           <input 
                             type="number" 
                             className="w-20 p-2 text-center text-xl font-bold border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                             value={mathAns}
                             onChange={(e) => setMathAns(e.target.value)}
                           />
                           <button 
                             onClick={checkMath}
                             disabled={!mathAns}
                             className={`px-4 py-2 rounded-lg font-bold text-white transition-all whitespace-nowrap ${mathAns ? 'bg-green-600 hover:bg-green-700 shadow-lg' : 'bg-slate-300'}`}
                           >
                             确认
                           </button>
                        </div>
                        <div className="text-[10px] text-slate-400 text-right mt-1">* 家长验证区</div>
                     </div>
                     
                     <button onClick={() => setStep('learning')} className="text-sm text-slate-400 underline">还没学会？回去再看看</button>
                   </div>
                 )}
               </div>
             </>
           )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [data, setData] = useState(LocalDB.get());
  const [isParentMode, setIsParentMode] = useState(false);
  const [activeFlashcardTask, setActiveFlashcardTask] = useState(null);
  const [isPatrolling, setIsPatrolling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCollection, setShowCollection] = useState(false);
  const [rewardData, setRewardData] = useState(null);

  // 初始化
  useEffect(() => {
    if (window.speechSynthesis) window.speechSynthesis.getVoices();
    const handleChange = () => setData(LocalDB.get());
    window.addEventListener('local-db-change', handleChange);
    setTimeout(() => setLoading(false), 500);
    return () => window.removeEventListener('local-db-change', handleChange);
  }, []);

  // 调度器
  useEffect(() => {
    const scheduler = setInterval(() => {
      const now = Date.now();
      const currentTasks = data.tasks.filter(t => t.status === 'pending');
      
      const { pushStartHour, pushEndHour, dailyLimit } = data.user;
      
      if (!isBeijingActiveWindow(pushStartHour, pushEndHour)) return; 
      if (currentTasks.length > 0) return; 

      const todayCount = data.tasks.filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString()).length;
      if (todayCount >= dailyLimit) return;

      const dueItem = data.library.sort((a,b)=>a.nextReview-b.nextReview).find(i => i.nextReview <= now);
      const activeLibIds = new Set(currentTasks.map(t => t.libraryId));
      
      if (dueItem && !activeLibIds.has(dueItem.id)) {
        LocalDB.update(d => {
           d.tasks.push({
             id: generateId(), 
             title: dueItem.title, type: dueItem.type, reward: dueItem.reward, flashcardData: dueItem.flashcardData,
             libraryId: dueItem.id, status: 'pending', createdAt: Date.now()
           });
           return d;
        });
        playSystemSound('alert');
        speak("叮咚！任务时间到！");
      }
    }, 10000); 
    return () => clearInterval(scheduler);
  }, [data]);

  const handleAddTask = (d) => LocalDB.update(s => { 
    if (!Array.isArray(s.tasks)) s.tasks = [];
    s.tasks.push({ ...d, id: generateId(), status: 'pending', createdAt: Date.now() }); 
    return s; 
  });
  
  const handleManageLibrary = (act, d) => LocalDB.update(s => { 
    if (!Array.isArray(s.library)) s.library = [];
    if(act==='add') s.library.push({...d, id: generateId(), createdAt: Date.now()}); 
    else s.library = s.library.filter(i=>i.id!==d); 
    return s; 
  });
  
  const handleDeleteTask = (id) => LocalDB.update(s => { s.tasks = s.tasks.filter(t=>t.id!==id); return s; });
  
  const handleUpdateProfile = (d) => LocalDB.update(s => { s.user = { ...s.user, ...d }; return s; });

  const handleStartPatrol = () => {
    setIsPatrolling(true); 
    playSystemSound('patrol');
    speak("雷达启动！");
    setTimeout(() => {
       const activeLibIds = new Set(data.tasks.filter(t => t.status === 'pending').map(t => t.libraryId));
       // 1. Sort by nextReview (Plan Priority)
       const sortedLibrary = [...data.library].sort((a, b) => a.nextReview - b.nextReview);
       // 2. Find first non-active
       const candidate = sortedLibrary.find(i => !activeLibIds.has(i.id)); 
       
       LocalDB.update(d => {
         if (candidate) {
           d.tasks.push({ ...candidate, id: generateId(), status: 'pending', createdAt: Date.now(), libraryId: candidate.id, source: 'patrol' });
           playSystemSound('alert');
           speak("发现计划任务！");
         } else {
           // Fallback random
           const dictKeys = Object.keys(SYSTEM_DICTIONARY);
           const randomKey = dictKeys[Math.floor(Math.random() * dictKeys.length)];
           const enriched = enrichWordTask(randomKey);
           
           d.tasks.push({
              id: generateId(),
              title: `练习单词: ${enriched.word}`,
              type: 'english',
              reward: 15,
              flashcardData: enriched,
              status: 'pending',
              createdAt: Date.now(),
              source: 'patrol_random'
           });
           playSystemSound('alert');
           speak("发现随机单词！");
         }
         return d;
       });
       setIsPatrolling(false);
    }, 3000);
  };

  const handleComplete = (task) => {
    let earnedRewards = { coins: task.reward, xp: task.reward };
    const roll = Math.random();
    if (roll < 0.2) earnedRewards.fragment = 1; 
    if (roll < 0.1 && task.type === 'english') earnedRewards.puzzlePiece = true; 
    
    LocalDB.update(d => {
       const t = d.tasks.find(x => x.id === task.id);
       if (t) { t.status = 'completed'; t.completedAt = Date.now(); }
       d.user.xp += task.reward; d.user.coins += task.reward;
       if (earnedRewards.fragment) d.user.fragments = (d.user.fragments || 0) + 1;
       
       if (task.type === 'english' && task.flashcardData) {
          const word = task.flashcardData.word;
          const exists = d.collection?.unlockedCards?.find(c => c.word === word);
          if (!exists) {
            if (!d.collection) d.collection = { unlockedCards: [], puzzlePieces: [] };
            d.collection.unlockedCards.push({ word, cn: task.flashcardData.translation });
          }
       }
       if (earnedRewards.puzzlePiece) {
          if (!d.collection) d.collection = { puzzlePieces: [] };
          if (!d.collection.puzzlePieces) d.collection.puzzlePieces = [];
          const allPieces = [0,1,2,3,4,5,6,7,8];
          const owned = d.collection.puzzlePieces;
          const missing = allPieces.filter(p => !owned.includes(p));
          if (missing.length > 0) {
             const newPiece = missing[Math.floor(Math.random() * missing.length)];
             d.collection.puzzlePieces.push(newPiece);
             earnedRewards.puzzlePieceIndex = newPiece;
          } else {
             earnedRewards.puzzlePiece = false; 
          }
       }
       
       if (task.libraryId) {
          const item = d.library.find(i => i.id === task.libraryId);
          if (item) {
             const lv = item.memoryLevel || 0; const nextLv = Math.min(lv + 1, 6);
             const nextDate = new Date(); nextDate.setDate(nextDate.getDate() + REVIEW_INTERVALS[nextLv]); nextDate.setHours(data.user.pushStartHour || 19,0,0,0);
             item.memoryLevel = nextLv; item.nextReview = nextDate.getTime();
          }
       }
       return d;
    });

    if (activeFlashcardTask?.id === task.id) setActiveFlashcardTask(null);
    setRewardData(earnedRewards);
  };

  if (loading) return <LoadingScreen />;

  const pendingTasks = (data.tasks || []).filter(t => t.status === 'pending');

  return (
    <div className="font-sans antialiased select-none text-slate-900">
      <ErrorBoundary>
        <GlobalStyles />
        <KidDashboard 
          userProfile={data.user} tasks={pendingTasks} 
          onCompleteTask={handleComplete} onPlayFlashcard={setActiveFlashcardTask} 
          toggleParentMode={() => setIsParentMode(true)} 
          processingTasks={new Set()} hiddenTaskIds={new Set()} 
          onStartPatrol={handleStartPatrol} isPatrolling={isPatrolling} isPlaying={!!activeFlashcardTask} 
          onOpenCollection={() => setShowCollection(true)}
        />
        {isParentMode && <ParentDashboard userProfile={data.user} tasks={data.tasks} libraryItems={data.library} onAddTask={handleAddTask} onDeleteTask={handleDeleteTask} onUpdateProfile={handleUpdateProfile} onManageLibrary={handleManageLibrary} onClose={() => setIsParentMode(false)} onDataChange={() => setData(LocalDB.get())} />}
        {activeFlashcardTask && <FlashcardGame task={activeFlashcardTask} onClose={() => setActiveFlashcardTask(null)} onComplete={handleComplete} />}
        {rewardData && <RewardModal rewards={rewardData} onClose={() => setRewardData(null)} />}
        {showCollection && <CollectionModal collection={data.collection || {}} onClose={() => setShowCollection(false)} />}
      </ErrorBoundary>
    </div>
  );
}
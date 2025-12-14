import React, { useState, useEffect, useRef } from 'react';
// 纯本地版，无 Firebase 依赖
import { 
  Trophy, Settings, Plus, CheckCircle, XCircle, Volume2, Gamepad2, 
  Rocket, Zap, Loader2, Activity, BrainCircuit, History, ListTodo, 
  Clock, Gem, Hexagon, Octagon, Triangle, 
  Siren, Sparkles, Mic, Library, Calendar, FileUp, FileDown, Trash2,
  Radar, Flame, Moon, Volume1, Users, ThumbsUp, Image as ImageIcon, Languages, Headphones, ImageOff, Wand2, Search, Calculator, Lock
} from 'lucide-react';

// ==========================================
// --- 0. 全局样式 ---
// ==========================================
const GlobalStyles = () => (
  <style>{`
    html, body, #root { margin: 0; padding: 0; width: 100%; height: 100%; max-width: none !important; overflow-x: hidden; font-family: system-ui, -apple-system, sans-serif; }
    ::-webkit-scrollbar { width: 0px; background: transparent; }
    
    /* 警示条纹动画 */
    @keyframes move-stripes {
      0% { background-position: 0 0; }
      100% { background-position: 50px 50px; }
    }
  `}</style>
);

// ==========================================
// --- 1. 核心引擎：本地数据库 (LocalStorage) ---
// ==========================================
const STORAGE_KEY = 'go_domi_local_v8_final';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

const LocalDB = {
  get: () => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return {
        user: { name: '多米', level: 1, xp: 0, coins: 0, theme: 'cosmic', streak: 1, ...data?.user },
        tasks: Array.isArray(data?.tasks) ? data.tasks : [],
        library: Array.isArray(data?.library) ? data.library : []
      };
    } catch (e) {
      return { user: { name: '多米', level: 1, xp: 0, coins: 0, theme: 'cosmic', streak: 1 }, tasks: [], library: [] };
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
// --- 2. 智能资源匹配引擎 ---
// ==========================================
const SYSTEM_DICTIONARY = {
  // Animals
  'cat': { cn: '猫', img: '/assets/images/cat.jpg' }, 'dog': { cn: '狗', img: '/assets/images/dog.jpg' }, 
  'pig': { cn: '猪', img: '/assets/images/pig.jpg' }, 'duck': { cn: '鸭子', img: '/assets/images/duck.jpg' },
  'lion': { cn: '狮子', img: '/assets/images/lion.jpg' }, 'tiger': { cn: '老虎', img: '/assets/images/tiger.jpg' }, 
  'bear': { cn: '熊', img: '/assets/images/bear.jpg' }, 'rabbit': { cn: '兔子', img: '/assets/images/rabbit.jpg' },
  'monkey': { cn: '猴子', img: '/assets/images/monkey.jpg' }, 'panda': { cn: '熊猫', img: '/assets/images/panda.jpg' }, 
  'bird': { cn: '鸟', img: '/assets/images/bird.jpg' }, 'fish': { cn: '鱼', img: '/assets/images/fish.jpg' },
  'elephant': { cn: '大象', img: '/assets/images/elephant.jpg' }, 'zebra': { cn: '斑马', img: '/assets/images/zebra.jpg' }, 
  'giraffe': { cn: '长颈鹿', img: '/assets/images/giraffe.jpg' }, 'mouse': { cn: '老鼠' }, 'horse': { cn: '马' },
  'cow': { cn: '奶牛' }, 'sheep': { cn: '绵羊' }, 'chicken': { cn: '鸡' }, 'fox': { cn: '狐狸' }, 'wolf': { cn: '狼' },
  'apple': { cn: '苹果', img: '/assets/images/apple.jpg' }, 'banana': { cn: '香蕉', img: '/assets/images/banana.jpg' }, 
  'orange': { cn: '橙子', img: '/assets/images/orange.jpg' }, 'grape': { cn: '葡萄', img: '/assets/images/grape.jpg' },
  'egg': { cn: '鸡蛋', img: '/assets/images/egg.jpg' }, 'milk': { cn: '牛奶', img: '/assets/images/milk.jpg' }, 
  'rice': { cn: '米饭', img: '/assets/images/rice.jpg' }, 'cake': { cn: '蛋糕', img: '/assets/images/cake.jpg' },
  'ice cream': { cn: '冰淇淋', img: '/assets/images/icecream.jpg' }, 'juice': { cn: '果汁', img: '/assets/images/juice.jpg' }, 
  'water': { cn: '水', img: '/assets/images/water.jpg' }, 'bread': { cn: '面包' }, 'candy': { cn: '糖果' },
  'pear': { cn: '梨' }, 'peach': { cn: '桃子' }, 'tomato': { cn: '西红柿' }, 'potato': { cn: '土豆' },
  'sun': { cn: '太阳', img: '/assets/images/sun.jpg' }, 'moon': { cn: '月亮', img: '/assets/images/moon.jpg' }, 
  'star': { cn: '星星', img: '/assets/images/star.jpg' }, 'flower': { cn: '花', img: '/assets/images/flower.jpg' },
  'tree': { cn: '树', img: '/assets/images/tree.jpg' }, 'book': { cn: '书', img: '/assets/images/book.jpg' }, 
  'pen': { cn: '笔', img: '/assets/images/pen.jpg' }, 'bag': { cn: '书包', img: '/assets/images/bag.jpg' },
  'car': { cn: '汽车', img: '/assets/images/car.jpg' }, 'bus': { cn: '公交车', img: '/assets/images/bus.jpg' }, 
  'train': { cn: '火车', img: '/assets/images/train.jpg' }, 'plane': { cn: '飞机', img: '/assets/images/plane.jpg' }, 
  'rocket': { cn: '火箭', img: '/assets/images/rocket.jpg' }, 'ball': { cn: '球', img: '/assets/images/ball.jpg' }, 
  'doll': { cn: '洋娃娃', img: '/assets/images/doll.jpg' }, 'bed': { cn: '床' }, 'chair': { cn: '椅子' },
  'table': { cn: '桌子' }, 'door': { cn: '门' }, 'window': { cn: '窗户' },
  'red': { cn: '红色', img: '/assets/images/red.jpg' }, 'blue': { cn: '蓝色', img: '/assets/images/blue.jpg' }, 
  'green': { cn: '绿色', img: '/assets/images/green.jpg' }, 'yellow': { cn: '黄色', img: '/assets/images/yellow.jpg' }, 
  'black': { cn: '黑色' }, 'white': { cn: '白色' },
  'father': { cn: '爸爸', img: '/assets/images/father.jpg' }, 'mother': { cn: '妈妈', img: '/assets/images/mother.jpg' }, 
  'brother': { cn: '哥哥/弟弟', img: '/assets/images/brother.jpg' }, 'sister': { cn: '姐姐/妹妹', img: '/assets/images/sister.jpg' },
  'grandfather': { cn: '爷爷/外公' }, 'grandmother': { cn: '奶奶/外婆' },
  'head': { cn: '头' }, 'eye': { cn: '眼睛' }, 'ear': { cn: '耳朵' }, 'nose': { cn: '鼻子' }, 'mouth': { cn: '嘴巴' }, 'hand': { cn: '手' }, 'foot': { cn: '脚' }
};

const enrichWordTask = (wordInput) => {
  const word = wordInput.trim();
  const lowerWord = word.toLowerCase();
  
  const preset = SYSTEM_DICTIONARY[lowerWord];
  const translation = preset ? preset.cn : ''; 
  
  const imageUrl = preset ? preset.img : `https://image.pollinations.ai/prompt/cute cartoon ${word} minimalist vector illustration for children education, white background?width=400&height=300&nologo=true&seed=${Math.random()}`;
  const audioUrl = `/assets/audio/${lowerWord}.mp3`;

  return {
    word: word, 
    translation: translation,
    image: imageUrl,
    audio: audioUrl 
  };
};

// ==========================================
// --- 3. 配置与常量 ---
// ==========================================
const THEMES = {
  cosmic: {
    id: 'cosmic', 
    name: '宇宙护卫队', 
    bg: 'bg-slate-900', 
    text: 'text-slate-100', 
    card: 'bg-slate-800',
    primary: 'bg-blue-600 hover:bg-blue-500', 
    accent: 'text-yellow-400',
    mascot: '/assets/images/mascot.png', 
    backgroundImage: '/assets/images/bg_cosmic.jpg', 
    assistant: '小雨点', 
    currency: '能量石'
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

// --- 3. 工具函数 ---

const getBeijingTime = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + 8 * 3600000);
};

const isBeijingActiveWindow = () => {
  const h = getBeijingTime().getHours();
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

const speak = (text, isTest = false) => {
  if (!window.speechSynthesis) {
    if (isTest) alert("浏览器不支持语音");
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN'; 
  u.rate = 1.0; 
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
  u.lang = 'en-US';
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
};

const playTaskAudio = (text, audioUrl) => {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(e => {
      console.warn(`Local audio play failed, fallback to TTS.`);
      speakEnglish(text);
    });
  } else {
    speakEnglish(text);
  }
};

const formatTime = (ts) => new Date(ts).toLocaleString('zh-CN', {month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'});
const formatDate = (ts) => new Date(ts).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });

const TASK_TEMPLATES = {
  sport: [
    { title: "原地高抬腿 20 次", reward: 15, type: 'generic' },
  ],
  life: [
    { title: "喝一杯温水", reward: 5, type: 'generic' },
  ]
};

// ==========================================
// --- 4. 错误边界 ---
// ==========================================
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
        <h2 className="text-xl font-bold mb-2">系统启动失败</h2>
        <p className="text-slate-400 mb-4 text-xs font-mono bg-black/30 p-2 rounded">{this.state.error?.toString()}</p>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="bg-red-600 px-6 py-2 rounded-full font-bold">重置数据并修复</button>
      </div>
    );
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
        <div className="absolute inset-0 bg-black/30"></div>
      </div>
    );
  }
  if (themeId === 'forest') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-green-900 to-green-950"></div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-yellow-300 rounded-full blur-[1px] animate-float"
               style={{left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, animationDelay: `${Math.random()*5}s`, animationDuration: `${5+Math.random()*5}s`, opacity: 0.7}}></div>
        ))}
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
    <div className="flex-1 flex flex-col items-center justify-center relative py-12 cursor-pointer group w-full" onClick={handlePoke}>
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
  const isEnglish = task.type === 'english';
  const displayTitle = isEnglish ? "英语挑战" : task.title;

  useEffect(() => {
    const timer = setTimeout(() => {
        const intro = isEnglish ? "英语挑战时间！" : "紧急任务！";
        const content = isEnglish ? "请完成一个单词练习" : task.title;
        speak(`${intro} ${content}`);
    }, 500);
    return () => clearTimeout(timer);
  }, [task.id, task.title, task.type]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
       
       {/* 升级后的背景特效：红色警戒扫描线 */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-900/20 to-transparent animate-[scan_3s_linear_infinite] transform -translate-y-full"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239, 68, 68, 0.1) 10px, rgba(239, 68, 68, 0.1) 20px)'
          }}></div>
       </div>

       <div className={`w-full max-w-lg ${currentTheme.card} rounded-3xl border-4 border-red-500 shadow-[0_0_80px_rgba(239,68,68,0.6)] overflow-hidden relative animate-in zoom-in-95 duration-300`}>
          <div className="bg-red-500 text-white p-4 flex items-center justify-center gap-3 animate-pulse">
            <Siren size={28} className="animate-bounce" />
            <h2 className="text-xl font-black uppercase tracking-wider">紧急任务警报</h2>
            <Siren size={28} className="animate-bounce" />
          </div>
          <div className="p-8 flex flex-col items-center text-center">
            
            {/* IP 主角头像 */}
            <div className="mb-6 relative group">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full group-hover:bg-blue-400/30 transition-all"></div>
              <div className="w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center relative z-10 border-4 border-blue-400/50 shadow-[0_0_30px_rgba(59,130,246,0.5)] overflow-hidden">
                 <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.2),_transparent)]"></div>
                 {/* 优先显示主角图片 */}
                 {(currentTheme.mascot && (currentTheme.mascot.startsWith('/') || currentTheme.mascot.startsWith('http'))) ? (
                    <img 
                      src={currentTheme.mascot} 
                      alt="Commander" 
                      className="w-full h-full object-cover transform scale-110"
                      onError={(e) => { e.target.style.display='none'; }} 
                    />
                 ) : null}
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
                    {isEnglish ? <span className="text-5xl">A</span> : <span className="text-5xl">🚀</span>}
                 </div>
              </div>
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

const KidDashboard = ({ userProfile, tasks, onCompleteTask, onPlayFlashcard, toggleParentMode, processingTasks, hiddenTaskIds, onStartPatrol, isPatrolling, isPlaying }) => {
  const currentTheme = THEMES[userProfile.theme || 'cosmic'];
  const displayTasks = tasks.filter(t => t.status === 'pending' && !hiddenTaskIds.has(t.id));
  const nextLevelXp = userProfile.level * 100;
  const progressPercent = Math.min((userProfile.xp / nextLevelXp) * 100, 100);
  const isImgMascot = currentTheme.mascot.startsWith('/') || currentTheme.mascot.startsWith('http');
  const streakDays = userProfile.streak || 1;

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} transition-colors duration-500 relative overflow-hidden flex flex-col`}>
      <DynamicBackground themeId={currentTheme.id} customBg={currentTheme.backgroundImage} />
      
      {/* 巡逻动画 */}
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

        <div className="w-full flex justify-center pb-8 pt-4">
           <button onClick={onStartPatrol} disabled={isPatrolling} className={`pointer-events-auto group relative transition-all active:scale-95 ${isPatrolling ? 'opacity-0 scale-50' : 'opacity-100'}`}>
             <div className="absolute -inset-4 bg-blue-500/30 rounded-full blur-xl group-hover:bg-blue-400/50 transition-all duration-500"></div>
             <div className="relative flex flex-col items-center justify-center w-24 h-24 rounded-full bg-gradient-to-b from-slate-700 to-slate-900 border-4 border-slate-600 shadow-[0_10px_20px_rgba(0,0,0,0.5)] group-hover:border-blue-400 group-hover:scale-105 transition-all">
                <Radar className="w-10 h-10 text-blue-400 group-hover:text-white transition-colors" />
                <span className="text-[10px] font-black text-blue-200 uppercase mt-1 tracking-wider">巡逻</span>
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

const ParentDashboard = ({ userProfile, tasks, libraryItems, onAddTask, onClose, onDeleteTask, onUpdateProfile, onManageLibrary }) => {
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
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const upcomingTasks = libraryItems.filter(item => item.nextReview && item.nextReview > Date.now()).sort((a,b) => a.nextReview - b.nextReview);
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const fileInputRef = useRef(null);

  const handlePush = (e) => { 
    e.preventDefault(); 
    onAddTask({ 
      title: newTaskTitle, type: newTaskType, reward: parseInt(newTaskReward), 
      flashcardData: newTaskType === 'english' ? { word: flashcardWord, translation: flashcardTrans, image: flashcardImg, audio: flashcardAudio } : null 
    }); 
    setNewTaskTitle(''); setFlashcardWord(''); setFlashcardTrans(''); setFlashcardImg(''); setFlashcardAudio('');
    alert('任务已直接推送给多米！'); 
  };

  const handleAddToLibrary = (e) => { 
    e.preventDefault(); 
    onManageLibrary('add', { 
      title: newTaskTitle, type: newTaskType, reward: parseInt(newTaskReward), 
      flashcardData: newTaskType === 'english' ? { word: flashcardWord, translation: flashcardTrans, image: flashcardImg, audio: flashcardAudio } : null, 
      memoryLevel: 0, nextReview: getNextBeijingScheduleTime() 
    }); 
    setNewTaskTitle(''); setFlashcardWord(''); setFlashcardTrans(''); setFlashcardImg(''); setFlashcardAudio('');
    alert('已添加到任务库，系统将在下次黄金时段（19:00-21:00）按节奏推送。'); 
  };

  // 智能批量添加
  const handleBatchAddWords = () => {
    if (!batchWords.trim()) return;
    const words = batchWords.split(/[,，\n]/).map(w => w.trim()).filter(w => w);
    const batchTime = getNextBeijingScheduleTime();
    
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
    alert(`成功智能生成并添加了 ${count} 个单词任务！`);
    setBatchWords('');
  };

  const handleProbChange = (type, value) => { const newVal = parseInt(value); setTaskProbabilities(prev => ({ ...prev, [type]: newVal })); };
  const saveProbabilities = () => { onUpdateProfile({ taskProbabilities }); alert("任务编排配置已保存！"); };
  const handleExport = () => {
    const BOM = "\uFEFF"; 
    const headers = "任务标题,类型,奖励,单词,中文翻译,图片URL,音频URL";
    const rows = libraryItems.map(item => {
        const d = item.flashcardData || {};
        return `${(item.title||"").replace(/,/g,"，")},${item.type||"generic"},${item.reward||10},${d.word||""},${d.translation||""},${d.image||""},${d.audio||""}`;
    });
    const blob = new Blob([BOM + headers + "\n" + rows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = "tasks.csv"; document.body.appendChild(link); link.click(); link.remove();
  };
  const handleImport = () => {
    try {
      const rows = textImport.trim().split('\n'); let count = 0; const batchTime = getNextBeijingScheduleTime(); 
      for (let i = 0; i < rows.length; i++) {
        const parts = rows[i].split(','); 
        if (parts.length < 2) continue;
        const title = parts[0]?.trim(); if (!title || title.includes("标题")) continue;
        
        const typeRaw = parts[1]?.trim().toLowerCase(); 
        const type = (typeRaw === 'english' || typeRaw === '英语') ? 'english' : 'generic';
        const reward = parseInt(parts[2]?.trim()) || 10;
        
        const word = parts[3]?.trim();
        const translation = parts[4]?.trim();
        const image = parts[5]?.trim();
        const audio = parts[6]?.trim();
        
        const flashcardData = (type === 'english' && word) ? { word, translation, image, audio } : null;

        onManageLibrary('add', { title, type, reward, flashcardData, memoryLevel: 0, nextReview: batchTime }); count++;
      }
      alert(`成功导入 ${count} 个任务！`); setTextImport('');
    } catch (e) { alert("导入失败，请检查格式"); }
  };
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
             <section className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-slate-300"><h3 className="font-bold mb-4">手动精细添加</h3><div className="space-y-4"><div className="flex gap-2"><button onClick={()=>setNewTaskType('generic')} className={`flex-1 py-2 border rounded ${newTaskType==='generic'?'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500'}`}>通用</button><button onClick={()=>setNewTaskType('english')} className={`flex-1 py-2 border rounded ${newTaskType==='english'?'bg-purple-50 border-purple-500 text-purple-700' : 'border-slate-200 text-slate-500'}`}>英语</button></div><div className="flex gap-2"><input className="flex-1 p-2 border rounded" placeholder="任务名称 (必填)" value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} /><input className="w-20 p-2 border rounded" type="number" placeholder="奖励" value={newTaskReward} onChange={e=>setNewTaskReward(e.target.value)} /></div>{newTaskType === 'english' && (<div className="bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-3"><div className="flex gap-2"><input className="flex-1 p-2 border rounded" placeholder="英文单词 (Word)" value={flashcardWord} onChange={e=>setFlashcardWord(e.target.value)} /><input className="flex-1 p-2 border rounded" placeholder="中文释义 (Translation)" value={flashcardTrans} onChange={e=>setFlashcardTrans(e.target.value)} /></div><input className="w-full p-2 border rounded text-xs" placeholder="图片链接 (选填，支持 /assets/images/xxx.jpg)" value={flashcardImg} onChange={e=>setFlashcardImg(e.target.value)} /><input className="w-full p-2 border rounded text-xs" placeholder="发音链接 (选填，支持 /assets/audio/xxx.mp3)" value={flashcardAudio} onChange={e=>setFlashcardAudio(e.target.value)} /></div>)}<div className="flex gap-2"><button onClick={handleAddToLibrary} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded font-bold">入库</button><button onClick={handlePush} className="flex-1 bg-slate-800 text-white py-3 rounded font-bold">推送</button></div></div></section>
             <section className="bg-white p-6 rounded-2xl shadow-sm"><div className="flex justify-between mb-4 items-center"><h3 className="font-bold">库列表 ({libraryItems.length})</h3><div className="flex gap-2"><button onClick={handleExport} className="text-xs text-blue-600"><FileDown size={14}/> 导出CSV</button></div></div><div className="space-y-2 max-h-[300px] overflow-y-auto">{libraryItems.map(i=>(<div key={i.id} className="flex justify-between p-2 border-b"><div><span className="font-bold">{i.title}</span> <span className="text-xs text-slate-400">Lv.{i.memoryLevel}</span></div><button onClick={()=>onManageLibrary('delete',i.id)} className="text-red-400"><Trash2 size={16}/></button></div>))}</div></section>
           </div>
         )}
         {activeTab === 'plan' && <div className="bg-white p-6 rounded-2xl shadow-sm"><h3 className="font-bold mb-4"><Moon size={16} className="inline mr-2"/>今晚待推送</h3><div className="mb-4 text-xs text-slate-500 bg-slate-50 p-2 rounded">调度引擎状态：{isBeijingActiveWindow() ? '运行中 (19:00-21:00)' : '休眠中'} | 今日已发: {tasks.filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString()).length}/{MAX_DAILY_TASKS}</div>{upcomingTasks.length===0?<p className="text-slate-400">无计划</p>:upcomingTasks.map(i=>(<div key={i.id} className="p-2 border-b flex justify-between"><span>{i.title}</span><span className="text-xs bg-purple-100 px-2 rounded">Lv.{i.memoryLevel}</span></div>))}</div>}
         {activeTab === 'monitor' && <div className="bg-white p-6 rounded-2xl shadow-sm"><h3 className="font-bold mb-4">实时待办</h3>{pendingTasks.map(t=>(<div key={t.id} className="flex justify-between p-2 border-b"><span>{t.title}</span><button onClick={()=>onDeleteTask(t.id)} className="text-red-400"><XCircle size={16}/></button></div>))}</div>}
         {activeTab === 'history' && <div className="bg-white p-6 rounded-2xl shadow-sm"><h3 className="font-bold mb-4">完成记录</h3>{completedTasks.map(t=>(<div key={t.id} className="flex justify-between p-2 border-b text-sm"><span className="text-slate-700">{t.title}</span><span className="text-green-600">{formatTime(t.completedAt)}</span></div>))}</div>}
         {activeTab === 'config' && (
            <div className="space-y-6">
              <section className="bg-white p-6 rounded-2xl shadow-sm"><h3 className="font-bold mb-4">数据备份</h3><div className="grid grid-cols-2 gap-3"><button onClick={handleBackup} className="p-3 bg-slate-100 rounded text-xs font-bold flex items-center justify-center gap-2"><FileDown size={16}/> 备份</button><button onClick={()=>fileInputRef.current.click()} className="p-3 bg-slate-100 rounded text-xs font-bold flex items-center justify-center gap-2"><FileUp size={16}/> 恢复</button><input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleRestore}/></div></section>
              <section className="bg-white p-6 rounded-2xl shadow-sm"><h3 className="font-bold mb-4">工具</h3><button onClick={()=>speak("测试语音正常", true)} className="w-full py-3 bg-slate-100 text-slate-700 rounded font-bold">🔊 测试语音</button></section>
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

  // 生成乘法题：3-9 之间的乘法
  const generateMath = () => {
    const a = Math.floor(Math.random() * 7) + 3; 
    const b = Math.floor(Math.random() * 7) + 3;
    setMathQ({ a, b });
    setMathAns('');
  };

  // 点击“我去教爷爷奶奶” -> 直接进入验证模式
  const handleGoTeach = () => {
    setStep('challenge');
    generateMath();
  };

  // 验证乘法
  const checkMath = () => {
    if (parseInt(mathAns) === mathQ.a * mathQ.b) {
       setStep('success');
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
                   <button onClick={handleGoTeach} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-xl hover:bg-blue-500 transition-colors active:scale-95 shadow-lg shadow-blue-200">我去教爷爷奶奶</button>
                 ) : (
                   <div className="space-y-4 animate-in fade-in">
                     <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200 text-yellow-800 text-left">
                        <div className="flex items-center gap-2 font-bold text-lg mb-1"><Users size={20} /> 任务目标</div>
                        <p className="text-sm opacity-90">请找到家长，教他/她读出这个单词，并请求家长完成下方验证。</p>
                     </div>
                     
                     {/* 极简乘法验证区域：直接显示在卡片下方 */}
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
      
      if (!isBeijingActiveWindow()) return; 
      if (currentTasks.length > 0) return; 

      const todayCount = data.tasks.filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString()).length;
      if (todayCount >= MAX_DAILY_TASKS) return;

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
    setIsPatrolling(true); speak("雷达启动！");
    setTimeout(() => {
       const activeLibIds = new Set(data.tasks.filter(t => t.status === 'pending').map(t => t.libraryId));
       // 1. Sort by nextReview (Plan Priority)
       const sortedLibrary = [...data.library].sort((a, b) => a.nextReview - b.nextReview);
       // 2. Find first non-active
       const candidate = sortedLibrary.find(i => !activeLibIds.has(i.id)); 
       
       LocalDB.update(d => {
         if (candidate) {
           d.tasks.push({ ...candidate, id: generateId(), status: 'pending', createdAt: Date.now(), libraryId: candidate.id, source: 'patrol' });
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
           speak("发现随机单词！");
         }
         return d;
       });
       setIsPatrolling(false);
    }, 3000);
  };

  const handleComplete = (task) => {
    LocalDB.update(d => {
       const t = d.tasks.find(x => x.id === task.id);
       if (t) { t.status = 'completed'; t.completedAt = Date.now(); }
       d.user.xp += task.reward; d.user.coins += task.reward;
       if (d.user.xp >= d.user.level * 100) { d.user.level += 1; d.user.xp = 0; setTimeout(() => speak("恭喜升级！"), 1000); }
       if (task.libraryId) {
          const item = d.library.find(i => i.id === task.libraryId);
          if (item) {
             const lv = item.memoryLevel || 0; const nextLv = Math.min(lv + 1, 6);
             const nextDate = new Date(); nextDate.setDate(nextDate.getDate() + REVIEW_INTERVALS[nextLv]); nextDate.setHours(19,0,0,0);
             item.memoryLevel = nextLv; item.nextReview = nextDate.getTime();
          }
       }
       return d;
    });
    if (activeFlashcardTask?.id === task.id) setActiveFlashcardTask(null);
    speak("任务完成！");
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
        />
        {isParentMode && <ParentDashboard userProfile={data.user} tasks={data.tasks} libraryItems={data.library} onAddTask={handleAddTask} onDeleteTask={handleDeleteTask} onUpdateProfile={handleUpdateProfile} onManageLibrary={handleManageLibrary} onClose={() => setIsParentMode(false)} />}
        {activeFlashcardTask && <FlashcardGame task={activeFlashcardTask} onClose={() => setActiveFlashcardTask(null)} onComplete={handleComplete} />}
      </ErrorBoundary>
    </div>
  );
}
import React, { useState, useEffect, useMemo } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  numberToSpanish, 
  numberToArmenian, 
  numberToRussian,
  timeToSpanish,
  timeToArmenian,
  timeToRussian
} from './spanish-helper';
import { 
  Clock, 
  Award, 
  RotateCcw, 
  BookOpen, 
  Check, 
  X, 
  ChevronRight, 
  Languages, 
  Shuffle, 
  Dices, 
  Volume2, 
  Hash, 
  Sparkles,
  HelpCircle,
  GraduationCap
} from 'lucide-react';

// Interfaces
interface CardStats {
  answered: number;
  correct: number;
  incorrect: number;
  history: {
    number: number;
    correct: boolean;
    timestamp: number;
  }[];
}

interface ClockStats {
  answered: number;
  correct: number;
  incorrect: number;
}

export default function App() {
  // Navigation: 'numbers' | 'clock' | 'grammar'
  const [activeTab, setActiveTab] = useState<'numbers' | 'clock' | 'grammar'>('numbers');
  
  // Interface Translation Language: 'am' | 'ru'
  const [uiLang, setUiLang] = useState<'am' | 'ru'>('am');

  // --- STATS SYSTEM & PERSISTENCE ---
  const [numStats, setNumStats] = useState<CardStats>(() => {
    try {
      const saved = localStorage.getItem('es_num_stats_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return { answered: 0, correct: 0, incorrect: 0, history: [] };
  });

  const [clockStats, setClockStats] = useState<ClockStats>(() => {
    try {
      const saved = localStorage.getItem('es_clock_stats_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return { answered: 0, correct: 0, incorrect: 0 };
  });

  useEffect(() => {
    localStorage.setItem('es_num_stats_v1', JSON.stringify(numStats));
  }, [numStats]);

  useEffect(() => {
    localStorage.setItem('es_clock_stats_v1', JSON.stringify(clockStats));
  }, [clockStats]);

  // --- NUMBERS GAME STATE ---
  // DIFFICULTY/LEVEL SECTIONS
  // 1: 1-100, 2: 100-1000, 3: 1000-10000, 4: 10000-100000, 5: 100000-1000000, 6: Any (1-1000000)
  const [diffLevel, setDiffLevel] = useState<number>(6); 
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(1); // 1 to 200
  const [currentNumber, setCurrentNumber] = useState<number>(512);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [quizInput, setQuizInput] = useState<string>('');
  const [showInputResult, setShowInputResult] = useState<boolean>(false);
  const [isInputCorrect, setIsInputCorrect] = useState<boolean>(false);

  // Quick sound synthesis (Speech API) in Spanish
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const speakSpanish = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.85;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("La síntesis de voz no está soportada en este navegador.");
    }
  };

  // Generate unique pseudo-random numbers sequence for the session of 200 cards
  const generateRandomForLevel = (level: number) => {
    let min = 1;
    let max = 1000000;
    
    switch (level) {
      case 1: min = 1; max = 100; break;
      case 2: min = 100; max = 1000; break;
      case 3: min = 1000; max = 10000; break;
      case 4: min = 10000; max = 100000; break;
      case 5: min = 100000; max = 1000000; break;
      case 6: default: min = 1; max = 1000000; break;
    }
    
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const nextNumberCard = () => {
    setIsFlipped(false);
    setQuizInput('');
    setShowInputResult(false);
    
    // Choose next random number
    const nextNum = generateRandomForLevel(diffLevel);
    setCurrentNumber(nextNum);
    
    // Increment index up to 200 then restart count
    setCurrentCardIndex(prev => prev >= 200 ? 1 : prev + 1);
  };

  // Reset progress for active level session
  const restartNumbersSession = () => {
    setCurrentCardIndex(1);
    setIsFlipped(false);
    setQuizInput('');
    setShowInputResult(false);
    setCurrentNumber(generateRandomForLevel(diffLevel));
  };

  // When user level changes, generate new sequence
  useEffect(() => {
    setCurrentNumber(generateRandomForLevel(diffLevel));
    setIsFlipped(false);
    setQuizInput('');
    setShowInputResult(false);
  }, [diffLevel]);

  // Handle Score feedback
  const handleScoreResult = (isCorrect: boolean) => {
    setNumStats(prev => {
      const nextHistory = [
        { number: currentNumber, correct: isCorrect, timestamp: Date.now() },
        ...prev.history.slice(0, 99) // keep last 100 items
      ];
      return {
        answered: prev.answered + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (isCorrect ? 0 : 1),
        history: nextHistory
      };
    });
    nextNumberCard();
  };

  // Manual text challenge submit on card
  const submitQuizAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizInput.trim()) return;
    
    const correctSpanText = numberToSpanish(currentNumber).toLowerCase().replace(/\s+/g, ' ').trim();
    const userSpanText = quizInput.toLowerCase().replace(/\s+/g, ' ').trim();
    
    const isMatched = correctSpanText === userSpanText;
    setIsInputCorrect(isMatched);
    setShowInputResult(true);
    setIsFlipped(true);
    
    // Auto voice output
    speakSpanish(numberToSpanish(currentNumber));
  };


  // --- CLOCK GAME & PLAYGROUND STATE ---
  // Standard clock states
  const [clockMode, setClockMode] = useState<'playground' | 'quiz'>('playground');
  const [clockHour, setClockHour] = useState<number>(10);
  const [clockMinute, setClockMinute] = useState<number>(15);

  // Clock Quiz Subsystem
  const [quizClockHour, setQuizClockHour] = useState<number>(3);
  const [quizClockMinute, setQuizClockMinute] = useState<number>(45);
  const [clockQuizFlipped, setClockQuizFlipped] = useState<boolean>(false);
  const [selectedUserHourOption, setSelectedUserHourOption] = useState<string>('');
  const [showClockQuizFeedback, setShowClockQuizFeedback] = useState<boolean>(false);
  const [clockQuizStreak, setClockQuizStreak] = useState<number>(0);

  // Generate fresh options for the clocks quiz
  const clockQuizOptions = useMemo(() => {
    const correctAns = timeToSpanish(quizClockHour, quizClockMinute);
    const options = new Set<string>();
    options.add(correctAns);
    
    // Add 3 fake options
    while (options.size < 4) {
      const randH = Math.floor(Math.random() * 12) + 1;
      const randM = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55][Math.floor(Math.random() * 12)];
      options.add(timeToSpanish(randH, randM));
    }
    return Array.from(options).sort(() => Math.random() - 0.5);
  }, [quizClockHour, quizClockMinute]);

  const generateNewClockQuiz = () => {
    const randomHour = Math.floor(Math.random() * 12) + 1;
    // pick standard five-minute division for standard clean readings
    const randomMinute = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55][Math.floor(Math.random() * 12)];
    setQuizClockHour(randomHour);
    setQuizClockMinute(randomMinute);
    setClockQuizFlipped(false);
    setSelectedUserHourOption('');
    setShowClockQuizFeedback(false);
  };

  const handleClockQuizOptionSubmit = (option: string) => {
    if (showClockQuizFeedback) return;
    setSelectedUserHourOption(option);
    setShowClockQuizFeedback(true);
    const isCorrect = option === timeToSpanish(quizClockHour, quizClockMinute);
    
    setClockStats(prev => ({
      answered: prev.answered + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));

    if (isCorrect) {
      setClockQuizStreak(prev => prev + 1);
    } else {
      setClockQuizStreak(0);
    }
  };


  // --- Armenian / Russian Strings for dictionary ---
  const textStrings = {
    am: {
      appName: "Իսպաներենի Ակադեմիա",
      numbersGame: "Թվերի Խաղ",
      clockGame: "Ժամ և Ժամանակ",
      grammarTitle: "Քերականություն և Կանոններ",
      stats: "Վիճակագրություն",
      welcomeBanner: "Սովորեք իսպաներեն թվերն ու ժամերը հեշտությամբ",
      level: "Մակարդակ",
      level1: "1 - 100 (Հեշտ)",
      level2: "100 - 1,000 (Միջին)",
      level3: "1,000 - 10,000 (Բարդ)",
      level4: "10,000 - 100,000 (Մասնագիտական)",
      level5: "100,000 - 1,000,000 (Փորձագետ)",
      level6: "Ազատ (1 - 1,000,000)",
      questionTitle: "Ինչպե՞ս է հնչում այս թիվը իսպաներեն.",
      revealHint: "Սեղմեք քարտի վրա՝ պատասխանը բացելու համար",
      spanishLabel: "Իսպաներեն",
      armenianLabel: "Հայերեն",
      russianLabel: "Ռուսերեն",
      correctButton: "Ճիշտ էր 👍",
      incorrectButton: "Սխալ էր 👎",
      skip: "Բաց թողնել",
      next: "Հաջորդը",
      score: "Հաշիվ",
      successRate: "Ճշգրտություն",
      resetProgress: "Զրոյացնել վիճակագրությունը",
      writeAnswerPlaceholder: "Գրեք պատասխանը իսպաներեն (փորձեք ինքնուրույն)...",
      checkAnswer: "Ստուգել",
      historyTitle: "Վերջին Թվերը",
      learnClockTitle: "Ժամացույցի Անկյուն",
      interactiveClock: "Ֆիզիկական Ինտերակտիվ Ժամացույց",
      dragSliders: "Քաշեք սլայդերները՝ ժամանակը փոխելու համար",
      hours: "Ժամեր",
      minutes: "Րոպեներ",
      quickSet: "Արագ ժամեր",
      clockQuizTitle: "Ժամացույցի Գուշակման Խաղ",
      whatsTheTime: "Ինչպե՞ս կասեք այս ժամը իսպաներեն.",
      streak: "Շարք",
      correctStreak: "Անընդմեջ ճիշտ պատասխաններ",
      congrats: "Հիանալի է:",
      wrong: "Սխալ է, ճիշտ պատասխանն է՝",
      grammarExplain: "Արագ Քերականական Կանոններ",
      rule1Title: "1. Mil (Հազար) կանոնը",
      rule1Text: "Իսպաներենում «mil» (հազար) բառը երբեք չի հոգնակիանում: Օրինակ՝ 2.000 = dos mil (ոչ թե dos miles):",
      rule2Title: "2. «y» (և) շաղկապի կիրառումը",
      rule2Text: "«y» շաղկապը դրվում է ՄԻԱՅՆ տասնավորների և միավորների միջև (օրինակ՝ 31 = treinta y uno, բայց 135 = ciento treinta y cinco, ոչ թե ciento y treinta y cinco):",
      rule3Title: "3. Ժամի հոդերը և բայերը",
      rule3Text: "Ժամը 1-ի համար օգտագործում ենք «Es la una» (եզակի), իսկ մնացած բոլոր ժամերի համար սկսում ենք «Son las» արտահայտությամբ: Օրինակ՝ 1:00 = Es la una, 5:00 = Son las cinco:",
      rule4Title: "4. «menos» (պակաս) կանոնը",
      rule4Text: "Երբ րոպեները 30-ից անցնում են, իսպանախոսները վերցնում են հաջորդ ժամը և հանում մնացած րոպեները «menos» բառով: Օրինակ՝ 4:40 = Son las cinco menos veinte (հինգից քսան պակաս):"
    },
    ru: {
      appName: "Академия Испанского",
      numbersGame: "Игра в Числа",
      clockGame: "Часы и Время",
      grammarTitle: "Грамматика и Правила",
      stats: "Статистика",
      welcomeBanner: "Изучайте испанские числа и время интерактивно",
      level: "Уровень сложности",
      level1: "1 - 100 (Легкий)",
      level2: "100 - 1 000 (Средний)",
      level3: "1 000 - 10 000 (Сложный)",
      level4: "10 000 - 100 000 (Профессиональный)",
      level5: "100 000 - 1 000 000 (Эксперт)",
      level6: "Любой диапазон (1 - 1 000 000)",
      questionTitle: "Как сказать по-испански число?",
      revealHint: "Кликните по карточке, чтобы открыть перевод",
      spanishLabel: "Испанский",
      armenianLabel: "Армянский",
      russianLabel: "Русский",
      correctButton: "Угадал 👍",
      incorrectButton: "Ошибся 👎",
      skip: "Пропустить",
      next: "Дальше",
      score: "Счет",
      successRate: "Точность",
      resetProgress: "Сбросить статистику",
      writeAnswerPlaceholder: "Напишите ответ по-испански (для самопроверки)...",
      checkAnswer: "Проверить",
      historyTitle: "История чисел",
      learnClockTitle: "Освоение Времени",
      interactiveClock: "Физическая модель часов",
      dragSliders: "Передвигайте ползунки, чтобы изменить время",
      hours: "Часы",
      minutes: "Минуты",
      quickSet: "Быстрые кнопки",
      clockQuizTitle: "Викторина по Часам",
      whatsTheTime: "Который час на испанском?",
      streak: "Серия побед",
      correctStreak: "Верных ответов подряд",
      congrats: "Отлично!",
      wrong: "Неверно, правильный ответ:",
      grammarExplain: "Быстрая грамматика испаноязычных часов и чисел",
      rule1Title: "1. Правило слова Mil (тысяча)",
      rule1Text: "В испанском языке слово «mil» никогда не ставится во множественное число для конкретных числительных. Примеры: 2 000 = dos mil, а не dos miles.",
      rule2Title: "2. Союз «y» (и)",
      rule2Text: "Союз «y» пишется ИСКЛЮЧИТЕЛЬНО между десятками и единицами. Например: 31 = treinta y uno; но 135 = ciento treinta y cinco.",
      rule3Title: "3. Глаголы для времени (Es / Son)",
      rule3Text: "Для часа 1 используется единственное число: «Es la una». Для всех остальных часов применяется «Son las». Например: 1:00 = Es la una, 5:00 = Son las cinco.",
      rule4Title: "4. Вычитание минут после половины (menos)",
      rule4Text: "Если минутная стрелка перевалила за 30, то называют следующий час и вычитают минуты словом «menos». Пример: 4:40 = Son las cinco menos veinte."
    }
  };

  const t = textStrings[uiLang];

  return (
    <div id="es_academy_root" className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 transition-colors duration-300">
      
      {/* --- TOP HEADER & NAVIGATION --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 sm:px-8 h-18 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <span className="font-extrabold text-lg tracking-tight text-white">ES</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
              {t.appName}
              <span className="text-xs font-normal bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100 hidden sm:inline-block">
                AM 🇦🇲 ➜ ES 🇪🇸
              </span>
            </h1>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 md:gap-4 overflow-x-auto">
          <nav className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
            <button 
              id="nav_numbers_tab"
              onClick={() => setActiveTab('numbers')}
              className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
                activeTab === 'numbers' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Hash className="w-4 h-4 text-indigo-500" />
              <span>{t.numbersGame}</span>
            </button>
            <button 
              id="nav_clock_tab"
              onClick={() => setActiveTab('clock')}
              className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
                activeTab === 'clock' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>{t.clockGame}</span>
            </button>
            <button 
              id="nav_grammar_tab"
              onClick={() => setActiveTab('grammar')}
              className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
                activeTab === 'grammar' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>{t.grammarTitle}</span>
            </button>
          </nav>

          {/* Lang Selector Toggle */}
          <div className="flex border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-slate-50">
            <button
              onClick={() => setUiLang('am')}
              className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1 ${
                uiLang === 'am' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Armenian UI"
            >
              <span>🇦🇲</span>
              <span className="hidden sm:inline">Հայ</span>
            </button>
            <button
              onClick={() => setUiLang('ru')}
              className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1 ${
                uiLang === 'ru' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Russian UI"
            >
              <span>🇷🇺</span>
              <span className="hidden sm:inline">Рус</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN PAGE CONTENT CONTAINER --- */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Banner */}
        <div id="welcome_banner" className="bg-radial from-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-indigo-500 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                Sleek v2.0
              </span>
              <span className="text-amber-400 text-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                200 interactive flashcards & customized clocks
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
              {t.welcomeBanner}
            </h2>
            <p className="text-slate-300 text-sm">
              {uiLang === 'am' 
                ? "Բարելավեք իսպաներենի ձեր իմացությունը՝ խաղալով նիշերի 200 մեծ քարտերով և փորձարկելով իրական ժամացույցի մոդելով:"
                : "Оттачивайте навыки устного счета и понимания времени на слух с нашими уникальными тренажерами."
              }
            </p>
          </div>

          <div className="flex gap-4 items-center self-stretch sm:self-auto shrink-0 z-10">
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl text-center flex-1 sm:flex-initial">
              <div className="text-2xl font-bold font-mono text-emerald-300">
                {activeTab === 'numbers' ? numStats.correct : clockStats.correct}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-300 font-medium">{t.score}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl text-center flex-1 sm:flex-initial">
              <div className="text-2xl font-bold font-mono text-indigo-200">
                {activeTab === 'numbers' 
                  ? ((numStats.answered ? Math.round((numStats.correct / numStats.answered) * 100) : 0) + '%')
                  : ((clockStats.answered ? Math.round((clockStats.correct / clockStats.answered) * 100) : 0) + '%')
                }
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-300 font-medium">{t.successRate}</div>
            </div>
            <button 
              onClick={() => {
                if(activeTab === 'numbers') {
                  setNumStats({ answered: 0, correct: 0, incorrect: 0, history: [] });
                } else {
                  setClockStats({ answered: 0, correct: 0, incorrect: 0 });
                }
              }}
              title={t.resetProgress}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-300 hover:text-white transition-all self-stretch flex items-center justify-center shrink-0"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* --- NUMBERS TAB SENSITIVE CONTENT --- */}
        {activeTab === 'numbers' && (
          <div id="numbers_tab_view" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle Column (Numbers card) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Range difficulty selector */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-3 block">
                  {t.level}:
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { id: 1, label: t.level1 },
                    { id: 2, label: t.level2 },
                    { id: 3, label: t.level3 },
                    { id: 4, label: t.level4 },
                    { id: 5, label: t.level5 },
                    { id: 6, label: t.level6 },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => setDiffLevel(lvl.id)}
                      className={`px-3 py-2.5 text-left rounded-xl text-xs font-bold transition-all border ${
                        diffLevel === lvl.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${diffLevel === lvl.id ? 'bg-white' : 'bg-indigo-400'}`} />
                        <span>{lvl.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Card View */}
              <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-slate-200 flex flex-col items-center justify-between min-h-[420px] relative overflow-hidden">
                <div className="absolute top-6 left-8 flex items-center gap-2">
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-md text-[11px] font-bold uppercase tracking-wider">
                    {t.level} {diffLevel}
                  </span>
                </div>
                <div className="absolute top-6 right-8 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-xs font-extrabold font-mono shadow-xs">
                  Tarjeta {currentCardIndex} / 200
                </div>

                {/* Animated Interactive Flippable Card */}
                <div className="w-full flex-1 flex flex-col items-center justify-center py-6 mt-6 max-w-xl">
                  
                  <div className="text-center mb-4">
                    <h3 className="text-slate-400 font-bold text-sm sm:text-base tracking-wide uppercase mb-1">
                      {t.questionTitle}
                    </h3>
                  </div>

                  {/* Card surface container */}
                  <div 
                    onClick={() => setIsFlipped(prev => !prev)}
                    className="w-full min-h-[160px] bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-3xl p-6 sm:p-8 text-center cursor-pointer flex flex-col justify-center items-center transition-all relative group"
                  >
                    {!isFlipped ? (
                      <div className="space-y-4">
                        {/* Huge Digit */}
                        <div className="text-5xl sm:text-6xl font-black text-indigo-950 tracking-tight select-none">
                          {currentNumber.toLocaleString()}
                        </div>
                        
                        {/* Play sound shortcut */}
                        <div className="text-xs text-slate-400 font-bold tracking-tight bg-white border border-slate-200 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-xs group-hover:text-indigo-600 transition-colors">
                          <span>{t.revealHint}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-5 w-full"
                      >
                        {/* Spanish Output (Large) */}
                        <div>
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-1">
                            {t.spanishLabel} 🇪🇸
                          </span>
                          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 italic tracking-tight underline decoration-indigo-200 decoration-wavy">
                             "{numberToSpanish(currentNumber)}"
                          </p>
                        </div>

                        <div className="border-t border-slate-200 my-2 pt-3 grid grid-cols-2 gap-4">
                          {/* Armenian translations */}
                          <div className="text-left border-r border-slate-200 pr-2">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block mb-0.5">
                              {t.armenianLabel} 🇦🇲
                            </span>
                            <p className="text-sm font-semibold text-slate-700 leading-snug">
                              {numberToArmenian(currentNumber)}
                            </p>
                          </div>

                          {/* Russian Translation */}
                          <div className="text-left pl-2">
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block mb-0.5">
                              {t.russianLabel} 🇷🇺
                            </span>
                            <p className="text-sm font-semibold text-slate-700 leading-snug">
                              {numberToRussian(currentNumber)}
                            </p>
                          </div>
                        </div>

                        {/* Pronunciation block */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakSpanish(numberToSpanish(currentNumber));
                          }}
                          className={`mt-2 px-4 py-2 border rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all ${
                            isSpeaking 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                          }`}
                        >
                          <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
                          <span>{isSpeaking ? 'Escuchando...' : 'Escuchar (Прослушать)'}</span>
                        </button>
                      </motion.div>
                    )}
                  </div>

                  {/* Written Answer Check Block */}
                  <form onSubmit={submitQuizAnswer} className="w-full mt-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex gap-2">
                    <input
                      type="text"
                      id="answer_text_input"
                      value={quizInput}
                      onChange={(e) => setQuizInput(e.target.value)}
                      placeholder={t.writeAnswerPlaceholder}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 transition"
                    >
                      {t.checkAnswer}
                    </button>
                  </form>

                  {showInputResult && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`w-full mt-3 p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                        isInputCorrect 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      {isInputCorrect ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>¡Excelente! Correcto. / Ճիշտ է։</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Casi... Mira la respuesta completa arriba. / Ուշադիր եղեք:</span>
                        </>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Score Controls */}
                <div className="w-full border-t border-slate-100 pt-6 mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => handleScoreResult(false)}
                      className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      {t.incorrectButton}
                    </button>
                    <button 
                      onClick={() => handleScoreResult(true)}
                      className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-100 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      {t.correctButton}
                    </button>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={nextNumberCard}
                      className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 text-xs transition-all"
                    >
                      {t.skip}
                    </button>
                    <button 
                      onClick={restartNumbersSession}
                      className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 text-xs transition-all flex items-center justify-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{uiLang === 'am' ? 'Վերսկսել' : 'Сбросить 200'}</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column (Instructions & Quick Grammar Sidebar) */}
            <div className="flex flex-col gap-6">
              
              {/* Score breakdown bar */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="text-slate-900 font-bold text-sm tracking-tight mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-500" />
                  <span>{uiLang === 'am' ? 'Քո Վիճակագրությունը' : 'Ваша статистика'}</span>
                </h3>
                
                <div className="space-y-4 text-xs font-medium">
                  <div>
                    <div className="flex justify-between text-slate-500 mb-1">
                      <span>{uiLang === 'am' ? 'Անցած քարտեր' : 'Пройдено карточек'}:</span>
                      <span className="font-bold text-slate-900">{numStats.answered}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all" 
                        style={{ width: `${Math.min(100, (numStats.answered / 200) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-right text-[10px] text-slate-400 mt-1">
                      {numStats.answered} / 200
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-emerald-50 p-3 rounded-2xl text-center">
                      <div className="text-emerald-700 font-bold text-lg">{numStats.correct}</div>
                      <div className="text-[10px] text-emerald-600 uppercase font-bold">{uiLang === 'am' ? 'Ճիշտ' : 'Верно'}</div>
                    </div>

                    <div className="bg-rose-50 p-3 rounded-2xl text-center">
                      <div className="text-rose-700 font-bold text-lg">{numStats.incorrect}</div>
                      <div className="text-[10px] text-rose-600 uppercase font-bold">{uiLang === 'am' ? 'Սխալ' : 'Неверно'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grammar Tips Box */}
              <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-5 h-5 text-amber-500" />
                  <h3 className="text-slate-900 font-extrabold text-sm">{t.grammarExplain}</h3>
                </div>

                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center shrink-0">
                      <span className="text-indigo-600 text-xs font-mono font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{t.rule1Title}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{t.rule1Text}</p>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center shrink-0">
                      <span className="text-indigo-600 text-xs font-mono font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{t.rule2Title}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{t.rule2Text}</p>
                    </div>
                  </li>
                </ul>

                <button 
                  onClick={() => setActiveTab('grammar')}
                  className="w-full mt-5 py-2.5 border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl font-bold text-xs transition-colors"
                >
                  {uiLang === 'am' ? 'Ավելի շատ կանոններ' : 'Читать все правила'}
                </button>
              </div>

              {/* History column list */}
              {numStats.history.length > 0 && (
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-3 block">
                    {t.historyTitle}:
                  </h3>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {numStats.history.slice(0, 10).map((hist, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-xl">
                        <span className="font-bold text-slate-800">{hist.number.toLocaleString()}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 italic">"{numberToSpanish(hist.number).slice(0, 20)}..."</span>
                          {hist.correct ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* --- CLOCK AND TIME TAB --- */}
        {activeTab === 'clock' && (
          <div id="clock_tab_view" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Clock column: containing analog interactive clock and computation */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Mode toggle */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 flex gap-2 self-start shadow-xs">
                <button
                  onClick={() => setClockMode('playground')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    clockMode === 'playground' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  ⚙️ {t.interactiveClock}
                </button>
                <button
                  onClick={() => {
                    setClockMode('quiz');
                    generateNewClockQuiz();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    clockMode === 'quiz' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🏆 {t.clockQuizTitle}
                </button>
              </div>

              {/* Playground Screen */}
              {clockMode === 'playground' ? (
                <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-md grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  
                  {/* Left Side: SVG Analog Clock representation */}
                  <div className="flex flex-col items-center">
                    <h4 className="text-slate-400 font-extrabold text-xs uppercase tracking-widest mb-4">
                      {t.learnClockTitle}
                    </h4>

                    {/* Analog Clock Face */}
                    <div className="relative w-56 h-56 rounded-full border-8 border-slate-800 bg-slate-900 shadow-2xl flex items-center justify-center p-4">
                      
                      {/* Brand name */}
                      <div className="absolute top-12 text-[9px] text-slate-500 tracking-wider font-semibold font-mono uppercase text-center">
                        Reloj Español
                      </div>

                      {/* Hour numbers */}
                      <span className="absolute top-2 text-xs font-bold text-slate-300">12</span>
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300">3</span>
                      <span className="absolute bottom-2 text-xs font-bold text-slate-300">6</span>
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300">9</span>
                      
                      {/* Hour ticks helper markers */}
                      <span className="absolute right-1/4 top-7 text-[8px] text-slate-500">1</span>
                      <span className="absolute right-7 top-1/4 text-[8px] text-slate-500">2</span>
                      <span className="absolute right-7 bottom-1/4 text-[8px] text-slate-500">4</span>
                      <span className="absolute right-1/4 bottom-7 text-[8px] text-slate-500">5</span>
                      <span className="absolute left-1/4 bottom-7 text-[8px] text-slate-500">7</span>
                      <span className="absolute left-7 bottom-1/4 text-[8px] text-slate-500">8</span>
                      <span className="absolute left-7 top-1/4 text-[8px] text-slate-500">10</span>
                      <span className="absolute left-1/4 top-7 text-[8px] text-slate-500">11</span>

                      {/* Center Pin */}
                      <div className="w-4.5 h-4.5 bg-indigo-500 rounded-full z-30 shadow-md border-2 border-white"></div>
                      
                      {/* Minute Hand (longer, thinner) */}
                      <div 
                        className="absolute w-1 h-20 bg-emerald-400 rounded-full origin-bottom z-20 transition-transform duration-300 ease-out"
                        style={{ 
                          bottom: '50%', 
                          transform: `rotate(${clockMinute * 6}deg)` 
                        }}
                      />

                      {/* Hour Hand (shorter, thicker) */}
                      <div 
                        className="absolute w-1.5 h-14 bg-white rounded-full origin-bottom z-10 transition-transform duration-300 ease-out"
                        style={{ 
                          bottom: '50%',
                          transform: `rotate(${(clockHour * 30) + (clockMinute * 0.5)}deg)` 
                        }}
                      />

                      {/* Accent highlight rings */}
                      <div className="absolute inset-0 border border-slate-800 rounded-full pointer-events-none"></div>
                    </div>

                    {/* Numeric clock readout */}
                    <div className="mt-5 text-center">
                      <span className="font-mono text-3xl font-extrabold bg-slate-900 border border-slate-700 text-teal-400 px-4 py-1.5 rounded-2xl shadow-inner inline-block tracking-widest">
                        {String(clockHour).padStart(2, '0')}:{String(clockMinute).padStart(2, '0')}
                      </span>
                    </div>

                  </div>

                  {/* Right Side: Translation readouts and sliders / handles */}
                  <div className="flex flex-col justify-center space-y-6">
                    
                    {/* Live Translation box */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <div className="space-y-4">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">
                            {t.spanishLabel} 🇪🇸
                          </span>
                          <p className="text-xl font-bold text-indigo-700 italic">
                            "{timeToSpanish(clockHour, clockMinute)}"
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">
                            {t.armenianLabel} 🇦🇲
                          </span>
                          <p className="text-sm font-semibold text-slate-700">
                            {timeToArmenian(clockHour, clockMinute)}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">
                            {t.russianLabel} 🇷🇺
                          </span>
                          <p className="text-sm font-semibold text-slate-700">
                            {timeToRussian(clockHour, clockMinute)}
                          </p>
                        </div>
                      </div>

                      {/* Voice Pronunciation */}
                      <button
                        onClick={() => speakSpanish(timeToSpanish(clockHour, clockMinute))}
                        className="w-full mt-4 py-2 border border-indigo-200 text-indigo-700 bg-white hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <Volume2 className="w-4 h-4 text-indigo-600" />
                        <span>Escuchar Pronunciación</span>
                      </button>
                    </div>

                    {/* Interactive controls */}
                    <div className="space-y-4">
                      <h4 className="text-slate-800 text-xs font-bold">{t.dragSliders}:</h4>
                      
                      {/* Hours Slider */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                          <span>{t.hours}:</span>
                          <span className="font-bold text-slate-900">{clockHour}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="12"
                          value={clockHour}
                          onChange={(e) => setClockHour(parseInt(e.target.value))}
                          className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Minutes Slider */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                          <span>{t.minutes}:</span>
                          <span className="font-bold text-slate-900">{clockMinute}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="59"
                          step="5"
                          value={clockMinute}
                          onChange={(e) => setClockMinute(parseInt(e.target.value))}
                          className="w-full accent-emerald-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Preset Hot buttons */}
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">{t.quickSet}:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: '01:00', h: 1, m: 0 },
                            { label: '04:15', h: 4, m: 15 },
                            { label: '08:30', h: 8, m: 30 },
                            { label: '10:45', h: 10, m: 45 },
                            { label: '12:00', h: 12, m: 0 },
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setClockHour(preset.h);
                                setClockMinute(preset.m);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold rounded-md text-slate-700 transition"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              ) : (
                /* Clock Quiz Game Card Mode */
                <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-md flex flex-col items-center">
                  
                  <div className="flex items-center justify-between w-full mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs">
                        {t.clockQuizTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-bold">{t.streak}:</span>
                      <span className="px-2.5 py-0.5 bg-emerald-500 text-white font-extrabold text-xs rounded-full shadow-xs animate-bounce">
                        {clockQuizStreak} 🔥
                      </span>
                    </div>
                  </div>

                  {/* Analog Question Clock face */}
                  <div className="relative w-44 h-44 rounded-full border-8 border-slate-800 bg-slate-900 shadow-lg flex items-center justify-center p-3 mb-6">
                    <span className="absolute top-1 text-[10px] font-bold text-slate-400">12</span>
                    <span className="absolute right-1 text-[10px] font-bold text-slate-400">3</span>
                    <span className="absolute bottom-1 text-[10px] font-bold text-slate-400">6</span>
                    <span className="absolute left-1 text-[10px] font-bold text-slate-400">9</span>
                    
                    {/* Hands of the quiz question clock */}
                    <div className="w-3.5 h-3.5 bg-indigo-500 rounded-full z-30"></div>
                    <div 
                      className="absolute w-1 h-14 bg-emerald-400 rounded-full origin-bottom"
                      style={{ bottom: '50%', transform: `rotate(${quizClockMinute * 6}deg)` }}
                    />
                    <div 
                      className="absolute w-1.5 h-10 bg-white rounded-full origin-bottom"
                      style={{ bottom: '50%', transform: `rotate(${(quizClockHour * 30) + (quizClockMinute * 0.5)}deg)` }}
                    />
                  </div>

                  <h3 className="text-center font-bold text-slate-800 text-base mb-6">
                    {t.whatsTheTime} <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md text-indigo-600">{String(quizClockHour).padStart(2, '0')}:{String(quizClockMinute).padStart(2, '0')}</span>
                  </h3>

                  {/* Option Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg mb-6">
                    {clockQuizOptions.map((opt, idx) => {
                      const isOptionSelected = selectedUserHourOption === opt;
                      const correctPhrase = timeToSpanish(quizClockHour, quizClockMinute);
                      const isCorrectUrl = opt === correctPhrase;

                      let btnStyle = 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800';
                      if (showClockQuizFeedback) {
                        if (isCorrectUrl) {
                          btnStyle = 'border-emerald-500 bg-emerald-500 text-white shadow-md font-extrabold';
                        } else if (isOptionSelected) {
                          btnStyle = 'border-rose-500 bg-rose-500 text-white shadow-md font-extrabold';
                        } else {
                          btnStyle = 'border-slate-100 bg-slate-50 text-slate-400 pointer-events-none';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          id={`clock_quiz_opt_${idx}`}
                          disabled={showClockQuizFeedback}
                          onClick={() => handleClockQuizOptionSubmit(opt)}
                          className={`p-4 border-2 rounded-2xl text-xs font-bold text-left transition-all ${btnStyle}`}
                        >
                          <div className="flex justify-between items-center">
                            <span>"{opt}"</span>
                            {showClockQuizFeedback && isCorrectUrl && <Check className="w-4 h-4 text-white" />}
                            {showClockQuizFeedback && isOptionSelected && !isCorrectUrl && <X className="w-4 h-4 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Quiz feedbacks / Reveals translations */}
                  {showClockQuizFeedback && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full max-w-lg bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 mb-6"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${selectedUserHourOption === timeToSpanish(quizClockHour, quizClockMinute) ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <h4 className="text-xs font-extrabold uppercase text-slate-500">
                          {selectedUserHourOption === timeToSpanish(quizClockHour, quizClockMinute) ? t.congrats : t.wrong}
                        </h4>
                      </div>

                      <div className="space-y-1 text-slate-700 text-xs">
                        <p className="font-bold text-indigo-700 text-sm">🇪🇸 "{timeToSpanish(quizClockHour, quizClockMinute)}"</p>
                        <p>🇦🇲 {timeToArmenian(quizClockHour, quizClockMinute)}</p>
                        <p>🇷🇺 {timeToRussian(quizClockHour, quizClockMinute)}</p>
                      </div>

                      <button
                        onClick={() => speakSpanish(timeToSpanish(quizClockHour, quizClockMinute))}
                        className="py-1 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-bold text-[10px] inline-flex items-center gap-1"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Escuchar</span>
                      </button>
                    </motion.div>
                  )}

                  {/* Next Quiz Button */}
                  <button
                    onClick={generateNewClockQuiz}
                    className="px-12 py-3 bg-indigo-600 text-white font-extrabold rounded-2xl text-xs hover:scale-105 transition shadow-lg shadow-indigo-100 flex items-center gap-1.5"
                  >
                    <span>{t.next}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                </div>
              )}

            </div>

            {/* Right sidebar details: containing Clock stats scoreboard and Gramática box */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Score breakdown metrics */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-xs">
                <h3 className="text-slate-900 font-bold mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>{uiLang === 'am' ? 'Ժամերի Վիճակագրություն' : 'Статистика времени'}</span>
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">{uiLang === 'am' ? 'Պատասխաններ' : 'Всего ответов'}:</span>
                    <span className="font-bold text-slate-900">{clockStats.answered}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-3 bg-emerald-50 rounded-xl">
                      <p className="text-emerald-700 font-bold text-lg">{clockStats.correct}</p>
                      <p className="text-[10px] text-emerald-600 uppercase font-bold">{uiLang === 'am' ? 'Ճիշտ' : 'Верно'}</p>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-xl">
                      <p className="text-rose-700 font-bold text-lg">{clockStats.incorrect}</p>
                      <p className="text-[10px] text-rose-600 uppercase font-bold">{uiLang === 'am' ? 'Սխալ' : 'Неверно'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grammar Tips Box 2 */}
              <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-5 h-5 text-amber-500" />
                  <h3 className="text-slate-900 font-extrabold text-sm">{t.grammarExplain} 🕒</h3>
                </div>

                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center shrink-0">
                      <span className="text-indigo-600 text-xs font-mono font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{t.rule3Title}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{t.rule3Text}</p>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center shrink-0">
                      <span className="text-indigo-600 text-xs font-mono font-bold">4</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{t.rule4Title}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{t.rule4Text}</p>
                    </div>
                  </li>
                </ul>
              </div>

            </div>

          </div>
        )}

        {/* --- FULL GRAMMAR AND RESOURCE TAB --- */}
        {activeTab === 'grammar' && (
          <div id="grammar_full_view" className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-md">
            
            <div className="flex items-center gap-3 border-b border-slate-200 pb-6 mb-8">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shadow-xs">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{t.grammarExplain}</h2>
                <p className="text-xs text-slate-500">
                  {uiLang === 'am' 
                    ? "Քերականական ամբողջական ուղեցույց՝ իսպաներեն թվերն ու ժամերը սահուն կիրառելու համար" 
                    : "Полное грамматическое руководство для свободного использования испанских чисел и времени"
                  }
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Numbers grammar segment */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-indigo-900 border-b border-indigo-50 pb-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-md">🔢</span>
                  <span>{uiLang === 'am' ? 'Թվեր և Չափումներ' : 'Числительные в испанском'}</span>
                </h3>

                <div className="space-y-4 text-xs leading-relaxed text-slate-600">
                  
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <h4 className="font-bold text-slate-900 mb-1">{t.rule1Title}</h4>
                    <p>{t.rule1Text}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <h4 className="font-bold text-slate-900 mb-1">{t.rule2Title}</h4>
                    <p>{t.rule2Text}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <h4 className="font-bold text-slate-900 mb-1">
                      {uiLang === 'am' ? '3. Տասնավորների յուրահատկությունները' : '3. Особенности названий десятков'}
                    </h4>
                    <p>
                      {uiLang === 'am'
                        ? "16-ից 29 թվերը իսպաներենում գրվում են միասին՝ dieciséis (16), veintidós (22), veinticinco (25): 31-ից սկսած թվերը գրվում են առանձին՝ treinta y uno (31), cuarenta y dos (42):"
                        : "Числа от 16 до 29 пишутся слитно: dieciséis (16), veintidós (22), veinticinco (25). Начиная с 31, числа пишутся раздельно: treinta y uno (31), cuarenta y dos (42)."}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <h4 className="font-bold text-slate-900 mb-1">
                      {uiLang === 'am' ? '4. Cien թե Ciento?' : '4. Cien или Ciento?'}
                    </h4>
                    <p>
                      {uiLang === 'am'
                        ? "Ճիշտ 100-ի համար օգտագործվում է «cien»: Հաջորդող թվերի համար օգտագործվում է «ciento»: Օրինակ՝ 100 = cien; 105 = ciento cinco: 200, 300, 400 և այլն, գրվում են՝ doscientos, trescientos, cuatrocientos:"
                        : "Ровно 100 — это всегда «cien». Любое число больше ста начинается как «ciento». Примеры: 100 = cien, 105 = ciento cinco. Сотни согласуются в роде: doscientos/doscientas."}
                    </p>
                  </div>

                </div>

              </div>

              {/* Time grammar segment */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-emerald-900 border-b border-emerald-50 pb-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-md">🕒</span>
                  <span>{uiLang === 'am' ? 'Ժամացույց և Ժամանակ' : 'Испанские часы'}</span>
                </h3>

                <div className="space-y-4 text-xs leading-relaxed text-slate-600">
                  
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <h4 className="font-bold text-slate-900 mb-1">{t.rule3Title}</h4>
                    <p>{t.rule3Text}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <h4 className="font-bold text-slate-900 mb-1">{t.rule4Title}</h4>
                    <p>{t.rule4Text}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <h4 className="font-bold text-slate-900 mb-1">
                      {uiLang === 'am' ? '5. Կես և Քառորդ ժամեր' : '5. Половина и четверть'}
                    </h4>
                    <p>
                      {uiLang === 'am'
                        ? "15 րոպեն «cuarto» է, իսկ 30 րոպեն՝ «media»: Օրինակ՝ 2:15 = Son las dos y cuarto, 5:30 = Son las cinco y media:"
                        : "15 минут заменяется словом «cuarto» (четверть), а 30 минут — «media» (половина). Примеры: 2:15 = Son las dos y cuarto, 5:30 = Son las cinco y media."}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <h4 className="font-bold text-slate-900 mb-1">
                      {uiLang === 'am' ? '6. «En punto» (Ուղիղ)' : '6. Ровное время en punto'}
                    </h4>
                    <p>
                      {uiLang === 'am'
                        ? "«En punto» նշանակում է ուղիղ, առանց րոպեների: Օրինակ՝ 8:00 = Son las ocho en punto:"
                        : "Выражение «en punto» используется для обозначения ровного часа. Пример: 8:00 = Son las ocho en punto."}
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* --- FOOTER PROGRESS SLIDER BAR --- */}
      <footer className="mt-auto shrink-0 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            {uiLang === 'am' 
              ? "© 2026 Իսպաներենի Ակադեմիա: Ստեղծված է «Sleek Interface» ոճով` առանց լրացուցիչ թղթապանակների:"
              : "© 2026 Академия Испанского: дизайн в стиле «Sleek Interface» без папок."
            }
          </p>
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-600">
              {uiLang === 'am' ? 'Հանձնարարված առաջադրանք՝ 200 քարտ' : 'Целевой норматив: 200 карточек'}
            </span>
            <div className="w-24 bg-slate-100 h-2.5 rounded-full overflow-hidden inline-block border border-slate-200 shadow-inner">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all" 
                style={{ width: `${Math.min(100, ((numStats.correct + clockStats.correct) / 20) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

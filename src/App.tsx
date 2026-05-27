import { useState, useEffect } from 'react';
import { 
  AudioLines, 
  History, 
  ChevronLeft, 
  BookOpen, 
  Sparkles, 
  Play, 
  VolumeX, 
  Check, 
  RotateCcw, 
  BookMarked,
  Volume2,
  Mic,
  Languages,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Minimize,
  Eye,
  EyeOff,
  Link,
  Flame,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EXERCISES } from './data';
import { Exercise, WordAnnotation, TextAnnotationState, PracticeRecord, ToneType } from './types';
import AudioPlayerControl from './components/AudioPlayerControl';
import AudioVisualizer from './components/AudioVisualizer';

type ScreenType = 
  | 'START' 
  | 'HISTORY' 
  | 'LEVELS' 
  | 'EXERCISES' 
  | 'PRACTICE_PLAY' 
  | 'ANNOTATE_VIEW' 
  | 'MODE_CHOOSE' 
  | 'RECORDING_SHOW' 
  | 'RECORDING_HIDE' 
  | 'EVALUATION';

export default function App() {
  // Screens navigation state
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('START');
  
  // App states
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'intermediate' | 'advanced' | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [playCount, setPlayCount] = useState<number>(0);
  const [isPlayerPlaying, setIsPlayerPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Visited exercises page F tracker (P.S. logic)
  const [visitedFPageExercises, setVisitedFPageExercises] = useState<string[]>([]);

  // Page E Annotation State
  const [activeTool, setActiveTool] = useState<'up' | 'down' | 'weak' | 'link' | 'translate' | null>(null);
  const [annotationState, setAnnotationState] = useState<TextAnnotationState>({ words: [], links: [] });

  // Word translation cache to prevent multiple fetches of same word
  const [translatingIndices, setTranslatingIndices] = useState<Record<number, boolean>>({});

  // Recording variables
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingCompleted, setRecordingCompleted] = useState<boolean>(false);

  // Evaluation & practice records
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<PracticeRecord | null>(null);
  const [historyRecords, setHistoryRecords] = useState<PracticeRecord[]>([]);

  // Load history and visited exercises on startup
  useEffect(() => {
    // 1. Visited exercises state for bypassing Flow to F
    const savedVisited = localStorage.getItem('shadow_visited_f_exercises');
    if (savedVisited) {
      try {
        setVisitedFPageExercises(JSON.parse(savedVisited));
      } catch (e) {
        console.error(e);
      }
    }

    // 2. History records
    const savedHistory = localStorage.getItem('shadow_practice_history');
    if (savedHistory) {
      try {
        setHistoryRecords(JSON.parse(savedHistory));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Setup some starter mock data
      const sampleHistory: PracticeRecord[] = [
        {
          id: 'h1',
          date: '2026-05-25',
          level: '初级',
          title: 'Greeting a Friend (问候朋友)',
          grade: 'A',
          scores: {
            intonation: 'A',
            rhythm: 'B',
            pronunciation: 'S'
          }
        },
        {
          id: 'h2',
          date: '2026-05-26',
          level: '中级',
          title: 'Daily Routine (日常生活)',
          grade: 'S',
          scores: {
            intonation: 'S',
            rhythm: 'S',
            pronunciation: 'A'
          }
        }
      ];
      setHistoryRecords(sampleHistory);
      localStorage.setItem('shadow_practice_history', JSON.stringify(sampleHistory));
    }
  }, []);

  // Sync Visited F Exercises to local storage when changed
  const markExerciseAsVisitedF = (exerciseId: string) => {
    if (!visitedFPageExercises.includes(exerciseId)) {
      const updated = [...visitedFPageExercises, exerciseId];
      setVisitedFPageExercises(updated);
      localStorage.setItem('shadow_visited_f_exercises', JSON.stringify(updated));
    }
  };

  // Helper helper to format single date
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm: string | number = today.getMonth() + 1;
    let dd: string | number = today.getDate();
    if (mm < 10) mm = '0' + mm;
    if (dd < 10) dd = '0' + dd;
    return `${yyyy}-${mm}-${dd}`;
  };

  // Click on level selector options screen B-1
  const selectLevel = (level: 'beginner' | 'intermediate' | 'advanced') => {
    setSelectedLevel(level);
    setCurrentScreen('EXERCISES');
  };

  // Click on a individual exercise screen C
  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    
    // Initialize standard annotation arrays based on exercise text split
    const wordsArray = exercise.text.split(/\s+/).map((word, index) => {
      // Clean punctuation for query translation but keep word clean layout
      return {
        wordIndex: index,
        word: word,
        tone: null as ToneType,
        isWeak: false,
        isTranslated: false,
        translation: ''
      };
    });

    setAnnotationState({
      words: wordsArray,
      links: []
    });

    // Reset player limits and timing helpers
    setPlayCount(0);
    setIsPlayerPlaying(false);
    setCurrentTime(0);
    setRecordingCompleted(false);
    setIsRecording(false);
    setActiveTool(null);

    // P.S. Rule: check if entered F page before, if yes, skip straight to F!
    if (visitedFPageExercises.includes(exercise.id)) {
      setCurrentScreen('MODE_CHOOSE');
    } else {
      setCurrentScreen('PRACTICE_PLAY');
    }
  };

  // Completion triggers during Screen D listening
  const handlePlaybackFinished = () => {
    setPlayCount((prev) => {
      const next = Math.min(3, prev + 1);
      return next;
    });
  };

  const handleListenAgain = () => {
    setCurrentTime(0);
    setIsPlayerPlaying(true);
  };

  // Click words in Page E Annotation
  const handleWordClick = async (index: number) => {
    if (!activeTool) return;

    // Translate tool is separate and asynchronous
    if (activeTool === 'translate') {
      const target = annotationState.words[index];
      if (target.isTranslated) {
        // Toggle back to English
        setAnnotationState((prev) => {
          const wordsCopy = prev.words.map((w, idx) => {
            if (idx === index) {
              return { ...w, isTranslated: false };
            }
            return w;
          });
          return { ...prev, words: wordsCopy };
        });
      } else {
        // Check if cached definition exists
        if (target.translation) {
          setAnnotationState((prev) => {
            const wordsCopy = prev.words.map((w, idx) => {
              if (idx === index) {
                return { ...w, isTranslated: true };
              }
              return w;
            });
            return { ...prev, words: wordsCopy };
          });
        } else {
          // Fetch from translation endpoint
          setTranslatingIndices((prev) => ({ ...prev, [index]: true }));
          try {
            const response = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ word: target.word })
            });
            const data = await response.json();
            setAnnotationState((prev) => {
              const wordsCopy = prev.words.map((w, idx) => {
                if (idx === index) {
                  return { ...w, translation: data.translation || w.word, isTranslated: true };
                }
                return w;
              });
              return { ...prev, words: wordsCopy };
            });
          } catch (e) {
            console.error('Translation error:', e);
          } finally {
            setTranslatingIndices((prev) => ({ ...prev, [index]: false }));
          }
        }
      }
      return;
    }

    // For non-translate functional tools (up, down, weak, link)
    setAnnotationState((prev) => {
      const wordsCopy = prev.words.map((w, idx) => {
        if (idx === index) {
          const updated = { ...w };
          if (activeTool === 'up') {
            // Toggle rising tone
            updated.tone = updated.tone === 'up' ? null : 'up';
          } else if (activeTool === 'down') {
            // Toggle falling tone
            updated.tone = updated.tone === 'down' ? null : 'down';
          } else if (activeTool === 'weak') {
            // Toggle weak stress
            updated.isWeak = !updated.isWeak;
          }
          return updated;
        }
        return w;
      });

      let linksCopy = [...prev.links];
      if (activeTool === 'link') {
        // Draw bridge from index to index + 1
        if (index < prev.words.length - 1) {
          const linkIndex = linksCopy.indexOf(index);
          if (linkIndex >= 0) {
            linksCopy = linksCopy.filter((linkIdx) => linkIdx !== index);
          } else {
            linksCopy = [...linksCopy, index];
          }
        }
      }

      return {
        words: wordsCopy,
        links: linksCopy
      };
    });
  };

  // Start shadowing, triggers bypass tracking and unlocks screen F
  const handleStartShadowing = () => {
    if (selectedExercise) {
      markExerciseAsVisitedF(selectedExercise.id);
    }
    // Stop any ongoing voice listening audio
    setIsPlayerPlaying(false);
    setCurrentScreen('MODE_CHOOSE');
  };

  // G-1 & G-2 Recording Actions
  const handleToggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingCompleted(false);
    } else {
      setIsRecording(false);
      setRecordingCompleted(true);
    }
  };

  // Evaluation trigger in G-1 or G-2 (clicks 对号)
  const handleProceedToEvaluation = async () => {
    if (!selectedExercise) return;
    setIsEvaluating(true);
    setCurrentScreen('EVALUATION');

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedExercise.text,
          level: selectedExercise.level,
          levelLabel: selectedExercise.levelLabel
        })
      });
      const data = await response.json();

      const newEvalRecord: PracticeRecord = {
        id: 'eval_' + Date.now(),
        date: getTodayDateString(),
        level: selectedExercise.levelLabel,
        title: selectedExercise.title,
        grade: data.grade || 'A',
        scores: data.scores || {
          intonation: 'A',
          rhythm: 'B',
          pronunciation: 'A'
        }
      };

      setCurrentEvaluation(newEvalRecord);

      // Save to local storage history
      const updatedHistory = [newEvalRecord, ...historyRecords];
      setHistoryRecords(updatedHistory);
      localStorage.setItem('shadow_practice_history', JSON.stringify(updatedHistory));
    } catch (err) {
      console.error('AI evaluation failed, applying fallback schema.', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Return to screen F
  const handlePracticeAgain = () => {
    setRecordingCompleted(false);
    setIsRecording(false);
    setCurrentScreen('MODE_CHOOSE');
  };

  // Clear history function
  const handleClearHistory = () => {
    setHistoryRecords([]);
    localStorage.removeItem('shadow_practice_history');
  };

  return (
    <div id="app-container" className="min-h-screen bg-[#FAF8F5] text-[#3C3026] flex flex-col font-sans select-none antialiased">
      
      {/* Dynamic Navigation Header */}
      <header className="sticky top-0 bg-white border-b-2 border-[#E3DCD1] z-20 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          {currentScreen !== 'START' && (
            <button
              id="global-back-btn"
              onClick={() => {
                // Return hierarchies correctly based on current screens
                if (currentScreen === 'HISTORY' || currentScreen === 'LEVELS') {
                  setCurrentScreen('START');
                } else if (currentScreen === 'EXERCISES') {
                  setCurrentScreen('LEVELS');
                } else if (currentScreen === 'PRACTICE_PLAY') {
                  setIsPlayerPlaying(false);
                  setCurrentScreen('EXERCISES');
                } else if (currentScreen === 'ANNOTATE_VIEW') {
                  setIsPlayerPlaying(false);
                  setCurrentScreen('PRACTICE_PLAY');
                } else if (currentScreen === 'MODE_CHOOSE') {
                  setIsPlayerPlaying(false);
                  setCurrentScreen('EXERCISES');
                } else if (currentScreen === 'RECORDING_SHOW' || currentScreen === 'RECORDING_HIDE') {
                  setCurrentScreen('MODE_CHOOSE');
                } else if (currentScreen === 'EVALUATION') {
                  setCurrentScreen('MODE_CHOOSE');
                }
              }}
              type="button"
              className="p-1 rounded-full hover:bg-[#F3EFE9] text-[#7A6A53] transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <div className="flex items-center space-x-1.5 pl-1">
            <AudioLines className="w-7 h-7 text-[#58CC02] stroke-[2.5]" />
            <span className="font-bold text-lg md:text-xl tracking-tight text-[#3C3026]">
              跟读精练 <span className="text-xs px-2 py-0.5 rounded-full bg-[#E5F9D5] text-[#46A302] ml-0.5 border border-[#C6F0A2] font-semibold">AI 评测</span>
            </span>
          </div>
        </div>

        {/* Display completed exercises counters */}
        <div className="flex items-center space-x-3 text-xs md:text-sm">
          <div className="flex items-center bg-[#FFF1D6] text-[#E08200] px-2.5 py-1 rounded-full font-bold border border-[#FFD99D]">
            <Flame className="w-4 h-4 mr-1 fill-[#FF9600] text-[#FF9600]" />
            {visitedFPageExercises.length} 练习完成
          </div>
        </div>
      </header>

      {/* Main Core Container */}
      <main className="flex-grow flex flex-col max-w-lg w-full mx-auto px-4 py-6 justify-center">
        <AnimatePresence mode="wait">
          
          {/* A. START SCREEN */}
          {currentScreen === 'START' && (
            <motion.div
              key="start-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center justify-center text-center space-y-8 py-4"
            >
              {/* Duolingo style logo and artwork */}
              <div id="art-mascot" className="relative flex justify-center items-center py-4">
                <span 
                  className="text-[108px] select-none leading-none inline-block"
                  style={{ filter: 'grayscale(100%) sepia(100%) hue-rotate(42deg) saturate(450%) brightness(85%)' }}
                >
                  🗣️
                </span>
              </div>

              <div>
                <h1 className="text-xl font-black md:text-2xl text-[#3C3026] tracking-tight">
                  PRACTICE MAKES PROGRESS 🏆
                </h1>
              </div>

              {/* Vertical action buttons */}
              <div className="w-full max-w-xs flex flex-col space-y-4">
                <button
                  id="go-start-btn"
                  onClick={() => setCurrentScreen('LEVELS')}
                  type="button"
                  className="w-full py-4 px-6 bg-[#58CC02] text-white border-b-4 border-[#3C8E00] hover:bg-[#46A302] font-black uppercase text-base rounded-2xl active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center space-x-2 shadow-md"
                >
                  <Sparkles className="w-5 h-5 fill-white" />
                  <span>开始跟读</span>
                </button>

                <button
                  id="go-history-btn"
                  onClick={() => setCurrentScreen('HISTORY')}
                  type="button"
                  className="w-full py-4 px-6 bg-white text-[#7A6A53] border-b-4 border-[#E3DCD1] hover:bg-[#F3EFE9] border-2 border-[#E3DCD1] font-black uppercase text-base rounded-2xl active:border-b-2 active:translate-y-0.5 transition-all flex items-center justify-center space-x-2"
                >
                  <History className="w-5 h-5" />
                  <span>历史记录</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* B-2. HISTORY记录 SCREEN */}
          {currentScreen === 'HISTORY' && (
            <motion.div
              key="history-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col space-y-6 w-full"
            >
              <div className="flex items-center justify-between border-b-2 border-[#E3DCD1] pb-3">
                <h2 className="text-xl font-black text-[#3C3026] flex items-center gap-1.5">
                  <BookMarked className="w-5 h-5 text-[#FF9600]" /> 练习历史
                </h2>
                {historyRecords.length > 0 && (
                  <button
                    id="clear-history-btn"
                    onClick={handleClearHistory}
                    type="button"
                    className="text-xs text-[#AF9F8D] hover:text-[#7A6A53] font-bold border border-[#E3DCD1] rounded-full px-2.5 py-1 bg-white"
                  >
                    清空记录
                  </button>
                )}
              </div>

              {/* History Table-Like Items List */}
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {historyRecords.length === 0 ? (
                  <div className="text-center py-12 bg-white border-2 border-dashed border-[#E3DCD1] rounded-2xl p-6">
                    <span className="text-3xl">☕</span>
                    <p className="text-[#AF9F8D] font-bold mt-2">暂无跟读历史记录</p>
                    <p className="text-xs text-[#AF9F8D] mt-1">快去选择一个练习大显身手吧！</p>
                  </div>
                ) : (
                  historyRecords.map((record) => (
                    <div 
                      key={record.id}
                      className="bg-white border-2 border-[#E3DCD1] p-3.5 rounded-2xl flex items-center justify-between hover:border-[#FF9600] transition-colors shadow-sm"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-[10px] font-mono font-bold text-[#AF9F8D] uppercase tracking-wider">
                          {record.date} · {record.level}
                        </span>
                        <h4 className="font-bold text-sm text-[#3C3026] truncate mt-0.5">
                          {record.title}
                        </h4>
                        
                        {/* Detail breakout */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-[#FAF8F5] border border-[#E3DCD1] text-[#7A6A53] px-1 py-0.5 rounded">
                            语调:{record.scores?.intonation || 'A'}
                          </span>
                          <span className="text-[10px] bg-[#FAF8F5] border border-[#E3DCD1] text-[#7A6A53] px-1 py-0.5 rounded">
                            节奏:{record.scores?.rhythm || 'B'}
                          </span>
                          <span className="text-[10px] bg-[#FAF8F5] border border-[#E3DCD1] text-[#7A6A53] px-1 py-0.5 rounded">
                            发音:{record.scores?.pronunciation || 'S'}
                          </span>
                        </div>
                      </div>

                      {/* Duolingo style rating Badge */}
                      <div className="flex-shrink-0 flex items-center justify-center">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg shadow-sm border-2 ${
                          record.grade === 'S' 
                            ? 'bg-[#E5F9D5] text-[#46A302] border-[#58CC02]'
                            : record.grade === 'A'
                            ? 'bg-[#EBF3FF] text-[#1CB0F6] border-[#1CB0F6]'
                            : record.grade === 'B'
                            ? 'bg-[#FFF1D6] text-[#FF9600] border-[#FF9600]'
                            : 'bg-red-50 text-red-500 border-red-400'
                        }`}>
                          {record.grade}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="text-center pt-2">
                <button
                  id="history-back-btn"
                  onClick={() => setCurrentScreen('START')}
                  type="button"
                  className="w-full py-3 bg-[#FAF8F5] text-[#7A6A53] border-2 border-[#E3DCD1] hover:bg-[#F3EFE9] font-black uppercase text-sm rounded-xl"
                >
                  返回首页
                </button>
              </div>
            </motion.div>
          )}

          {/* B-1. LEVEL选择 SCREEN */}
          {currentScreen === 'LEVELS' && (
            <motion.div
              key="levels-screen"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col space-y-6 w-full text-center"
            >
              <div>
                <h2 className="text-xl font-black text-[#3C3026]">
                  请选择您的跟读级别
                </h2>
              </div>

              {/* Three Vertical Level options */}
              <div className="flex flex-col space-y-4 max-w-xs mx-auto w-full">
                <button
                  id="level-beginner-btn"
                  onClick={() => selectLevel('beginner')}
                  type="button"
                  className="py-4 px-6 bg-[#E5F9D5] text-[#46A302] border-2 border-[#C6F0A2] border-b-4 rounded-2xl active:border-b-2 hover:bg-[#D9F4C2] font-black tracking-wide text-base transition-all text-left flex items-center justify-between"
                >
                  <span className="flex items-center space-x-2">
                    <span className="text-xl">🌟</span>
                    <span className="font-extrabold text-lg">初级</span>
                  </span>
                  <span className="text-xs bg-[#58CC02] text-white px-2 py-0.5 rounded-full font-bold">
                    简单
                  </span>
                </button>

                <button
                  id="level-intermediate-btn"
                  onClick={() => selectLevel('intermediate')}
                  type="button"
                  className="py-4 px-6 bg-[#EBF3FF] text-[#1899D6] border-2 border-[#C0E1FF] border-b-4 rounded-2xl active:border-b-2 hover:bg-[#D4EAFF] font-black tracking-wide text-base transition-all text-left flex items-center justify-between"
                >
                  <span className="flex items-center space-x-2">
                    <span className="text-xl">🚀</span>
                    <span className="font-extrabold text-lg">中级</span>
                  </span>
                  <span className="text-xs bg-[#1CB0F6] text-white px-2 py-0.5 rounded-full font-bold">
                    进阶
                  </span>
                </button>

                <button
                  id="level-advanced-btn"
                  onClick={() => selectLevel('advanced')}
                  type="button"
                  className="py-4 px-6 bg-[#FFF1D6] text-[#E08200] border-2 border-[#FFD99D] border-b-4 rounded-2xl active:border-b-2 hover:bg-[#FFEBC4] font-black tracking-wide text-base transition-all text-left flex items-center justify-between"
                >
                  <span className="flex items-center space-x-2">
                    <span className="text-xl">🔥</span>
                    <span className="font-extrabold text-lg">高级</span>
                  </span>
                  <span className="text-xs bg-[#FF9600] text-white px-2 py-0.5 rounded-full font-bold">
                    挑战
                  </span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  id="level-back-btn"
                  onClick={() => setCurrentScreen('START')}
                  type="button"
                  className="max-w-xs w-full py-3 bg-[#FAF8F5] text-[#7A6A53] border-2 border-[#E3DCD1] hover:bg-[#F3EFE9] font-black uppercase text-sm rounded-xl mx-auto block"
                >
                  返回首页
                </button>
              </div>
            </motion.div>
          )}

          {/* C. EXERCISES列表 SCREEN */}
          {currentScreen === 'EXERCISES' && (
            <motion.div
              key="exercises-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col space-y-6 w-full"
            >
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#A2988E] bg-[#E3DCD1] px-2 py-0.5 rounded-md">
                  当前：{selectedLevel === 'beginner' ? '初级' : selectedLevel === 'intermediate' ? '中级' : '高级'}
                </span>
                <h2 className="text-xl font-black text-[#3C3026] mt-2">
                  选择一个跟读练习
                </h2>
              </div>

              {/* Exercises Stack */}
              <div className="space-y-3">
                {EXERCISES.filter(ex => ex.level === selectedLevel).map((item) => {
                  const hasVisitedBefore = visitedFPageExercises.includes(item.id);
                  return (
                    <button
                      id={`exercise-item-${item.id}`}
                      key={item.id}
                      onClick={() => handleSelectExercise(item)}
                      type="button"
                      className="w-full bg-white text-left p-4 rounded-2xl border-2 border-[#E3DCD1] border-b-4 hover:border-[#58CC02] active:translate-y-0.5 active:border-b-2 flex items-center justify-between transition-all"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <h3 className="font-bold text-[#3C3026] text-base truncate">
                          {item.title}
                        </h3>
                        <span className="text-xs text-[#AF9F8D] font-mono mt-0.5">
                          练习时长：{item.durationString}
                        </span>
                      </div>

                      {/* Display status icon indicator */}
                      <div className="flex-shrink-0 flex items-center">
                        {hasVisitedBefore ? (
                          <span className="text-xs flex items-center space-x-1.5 px-2.5 py-1 bg-[#E5F9D5] text-[#46A302] border border-[#C6F0A2] rounded-full font-black">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>直接跟读</span>
                          </span>
                        ) : (
                          <span className="text-xs flex items-center space-x-1 py-1 px-2.5 bg-[#FAF8F5] text-[#7A6A53] border border-[#E3DCD1] rounded-full font-bold">
                            <span>开始精听</span>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  id="ex-back-btn"
                  onClick={() => setCurrentScreen('LEVELS')}
                  type="button"
                  className="w-full py-3 bg-[#FAF8F5] text-[#7A6A53] border-2 border-[#E3DCD1] hover:bg-[#F3EFE9] font-black uppercase text-sm rounded-xl"
                >
                  更换难易级别
                </button>
              </div>
            </motion.div>
          )}

          {/* D. AUDIO LISTENING SCREEN */}
          {currentScreen === 'PRACTICE_PLAY' && selectedExercise && (
            <motion.div
              key="practice-play-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center justify-center space-y-6 w-full text-center"
            >
              <div className="w-full">
                <span className="text-xs font-bold text-[#E08200] bg-[#FFF1D6] border border-[#FFD99D] px-2.5 py-1 rounded-full">
                  第一步：精听训练
                </span>
                <h3 className="text-lg font-black text-[#3C3026] mt-4">
                  {selectedExercise.title}
                </h3>
                <p className="text-xs text-[#7A6A53] mt-1 pr-4 pl-4 leading-relaxed">
                  仔细聆听单词发音与句子轻重读。<b>已完整播放：{playCount} / 3 遍</b>
                </p>
              </div>

              {/* Progress Tracker Cards visually counting Duolingo progress dots */}
              <div className="flex items-center space-x-3 py-1 bg-white border border-[#E3DCD1] p-3 rounded-full">
                {[1, 2, 3].map((num) => {
                  const stateColor = playCount >= num 
                    ? 'bg-[#58CC02] border-[#46A302]' 
                    : (isPlayerPlaying && playCount === num - 1) 
                    ? 'bg-yellow-400 border-yellow-500 animate-pulse'
                    : 'bg-[#E3DCD1] border-[#AF9F8D]';
                  return (
                    <div 
                      key={num} 
                      className={`w-7 h-7 rounded-full border-2 text-white text-[11px] flex items-center justify-center font-black ${stateColor}`}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>

              {/* Interactive Player Control */}
              <AudioPlayerControl
                idPrefix="d-screen"
                text={selectedExercise.text}
                durationSeconds={selectedExercise.durationSeconds}
                isPlaying={isPlayerPlaying}
                onPlayStateChange={setIsPlayerPlaying}
                onComplete={handlePlaybackFinished}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
              />

              {/* Bottom dynamic buttons based on exact logic conditions specified by the user */}
              <div className="w-full max-w-sm flex flex-col space-y-3 pt-4">
                {playCount === 1 && (
                  <button
                    id="listen-again-btn"
                    onClick={handleListenAgain}
                    type="button"
                    className="w-full py-3.5 bg-white text-[#58CC02] border-2 border-[#58CC02] border-b-4 rounded-xl hover:bg-[#E5F9D5] font-black uppercase text-sm active:translate-y-0.5 active:border-b-2"
                  >
                    再听一遍
                  </button>
                )}

                {playCount === 2 && (
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button
                      id="listen-again-btn-2"
                      onClick={handleListenAgain}
                      type="button"
                      className="py-3.5 bg-white text-[#58CC02] border-2 border-[#58CC02] border-b-4 rounded-xl hover:bg-[#E5F9D5] font-black uppercase text-sm active:translate-y-0.5 active:border-b-2"
                    >
                      再听一遍
                    </button>
                    <button
                      id="view-text-btn-2"
                      onClick={() => {
                        setIsPlayerPlaying(false);
                        setCurrentScreen('ANNOTATE_VIEW');
                      }}
                      type="button"
                      className="py-3.5 bg-[#58CC02] text-white border-b-4 border-[#3C8E00] hover:bg-[#46A302] font-black uppercase text-sm rounded-xl active:border-b-0 active:translate-y-1 transition-all"
                    >
                      查看文本
                    </button>
                  </div>
                )}

                {playCount >= 3 && (
                  <button
                    id="view-text-btn-3"
                    onClick={() => {
                      setIsPlayerPlaying(false);
                      setCurrentScreen('ANNOTATE_VIEW');
                    }}
                    type="button"
                    className="w-full py-4 bg-[#58CC02] text-white border-b-4 border-[#3C8E00] hover:bg-[#46A302] font-black uppercase text-sm rounded-xl active:border-b-0 active:translate-y-1 transition-all"
                  >
                    查看文本
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* E. VIEW TEXT & ANNOTATE SCREEN */}
          {currentScreen === 'ANNOTATE_VIEW' && selectedExercise && (
            <motion.div
              key="annotate-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full w-full space-y-5"
            >
              {/* Top description */}
              <div className="border-b-2 border-[#E3DCD1] pb-2">
                <span className="text-xs font-bold text-[#1899D6] bg-[#EBF3FF] border border-[#C0E1FF] px-2.5 py-1 rounded-full">
                  第二步：句子声调及连读分析标注
                </span>
              </div>

              {/* 3/4 Clickable Words Container Workspace */}
              <div className="bg-white border-2 border-[#E3DCD1] rounded-3xl p-6 shadow-inner min-h-[160px] flex items-center justify-center relative">
                <div className="flex flex-wrap gap-x-3 gap-y-6 text-lg md:text-xl font-medium tracking-normal text-[#3C3026] relative leading-loose">
                  {annotationState.words.map((row, i) => {
                    const isTranslating = translatingIndices[i];
                    const isLinkedToNext = annotationState.links.includes(i);

                    // Tone symbol layout markup
                    let toneSuffix = null;
                    if (row.tone === 'up') {
                      toneSuffix = <span className="text-red-500 font-black text-xs select-none">↗</span>;
                    } else if (row.tone === 'down') {
                      toneSuffix = <span className="text-[#58CC02] font-black text-xs select-none">↘</span>;
                    }

                    return (
                      <div 
                        key={i}
                        onClick={() => handleWordClick(i)}
                        className="relative flex items-center select-none"
                      >
                        {/* Word bounding button block to prevent overlapping shifts */}
                        <div 
                          className={`cursor-pointer transition-all duration-100 px-1 py-0.5 rounded ${
                            activeTool 
                              ? 'hover:bg-[#FAF8F5] border border-transparent hover:border-[#E3DCD1]' 
                              : ''
                          } ${
                            row.isTranslated 
                              ? 'bg-[#EBF3FF] text-[#1CB0F6] border border-[#C0E1FF] text-xs font-bold px-1.5' 
                              : ''
                          } ${
                            row.isWeak 
                              ? 'text-xs opacity-60 scale-90' 
                              : ''
                          }`}
                        >
                          {isTranslating ? (
                            <span className="animate-pulse">···</span>
                          ) : row.isTranslated ? (
                            row.translation
                          ) : (
                            row.word
                          )}
                        </div>

                        {/* Tone symbol placement after the English word */}
                        {!row.isTranslated && toneSuffix}

                        {/* Curve link smile bridging under next spacing (pure SVG arc connector layout) */}
                        {isLinkedToNext && (
                          <div className="absolute left-1/2 right-[-50%] bottom-[-10px] h-3 overflow-visible pointer-events-none z-10 w-full flex justify-center">
                            <svg className="w-8 h-4 overflow-visible" viewBox="0 0 100 50">
                              <path 
                                d="M 0 0 Q 50 45, 100 0" 
                                fill="none" 
                                stroke="#FF9600" 
                                strokeWidth="8" 
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5 Annotation Functional Buttons aligned Left to Right */}
              <div className="flex flex-col space-y-2.5">
                <div className="grid grid-cols-5 gap-1 md:gap-2">
                  <button
                    id="tool-up-btn"
                    onClick={() => setActiveTool(activeTool === 'up' ? null : 'up')}
                    type="button"
                    className={`py-2 px-0.5 sm:px-1 rounded-xl font-bold text-[10px] sm:text-xs flex flex-col items-center justify-center border-b-4 transition-all ${
                      activeTool === 'up'
                        ? 'bg-red-500 text-white border-red-700 mt-1 border-b-0'
                        : 'bg-white text-red-500 border-red-200 border-2 border-b-4 hover:bg-red-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 mb-0.5" />
                    <span>升调 ↗</span>
                  </button>

                  <button
                    id="tool-down-btn"
                    onClick={() => setActiveTool(activeTool === 'down' ? null : 'down')}
                    type="button"
                    className={`py-2 px-0.5 sm:px-1 rounded-xl font-bold text-[10px] sm:text-xs flex flex-col items-center justify-center border-b-4 transition-all ${
                      activeTool === 'down'
                        ? 'bg-[#58CC02] text-white border-[#3C8E00] mt-1 border-b-0 text-amber-500'
                        : 'bg-white text-[#58CC02] border-[#EBFCD9] border-2 border-b-4 hover:bg-green-50'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4 mb-0.5" />
                    <span>降调 ↘</span>
                  </button>

                  <button
                    id="tool-weak-btn"
                    onClick={() => setActiveTool(activeTool === 'weak' ? null : 'weak')}
                    type="button"
                    className={`py-2 px-0.5 sm:px-1 rounded-xl font-bold text-[10px] sm:text-xs flex flex-col items-center justify-center border-b-4 transition-all ${
                      activeTool === 'weak'
                        ? 'bg-[#7A6A53] text-white border-[#5C4D3E] mt-1 border-b-0'
                        : 'bg-white text-[#7A6A53] border-gray-200 border-2 border-b-4 hover:bg-gray-50'
                    }`}
                  >
                    <Minimize className="w-4 h-4 mb-0.5" />
                    <span>弱读</span>
                  </button>

                  <button
                    id="tool-link-btn"
                    onClick={() => setActiveTool(activeTool === 'link' ? null : 'link')}
                    type="button"
                    className={`py-2 px-0.5 sm:px-1 rounded-xl font-bold text-[10px] sm:text-xs flex flex-col items-center justify-center border-b-4 transition-all ${
                      activeTool === 'link'
                        ? 'bg-[#FF9600] text-white border-[#C97700] mt-1 border-b-0'
                        : 'bg-white text-[#FF9600] border-orange-100 border-2 border-b-4 hover:bg-orange-50'
                    }`}
                  >
                    <Link className="w-4 h-4 mb-0.5" />
                    <span>连读 ⁀</span>
                  </button>

                  <button
                    id="tool-translate-btn"
                    onClick={() => setActiveTool(activeTool === 'translate' ? null : 'translate')}
                    type="button"
                    className={`py-2 px-0.5 sm:px-1 rounded-xl font-bold text-[10px] sm:text-xs flex flex-col items-center justify-center border-b-4 transition-all ${
                      activeTool === 'translate'
                        ? 'bg-[#1CB0F6] text-white border-[#0092D1] mt-1 border-b-0'
                        : 'bg-white text-[#1CB0F6] border-blue-100 border-2 border-b-4 hover:bg-blue-50'
                    }`}
                  >
                    <Languages className="w-4 h-4 mb-0.5" />
                    <span>释义</span>
                  </button>
                </div>

                {/* Annotation active tool helper description statement */}
                <div className="text-[11px] text-[#A2988E] bg-[#FAF8F5] p-2 rounded-xl text-center font-bold border border-[#E3DCD1]">
                  {activeTool === 'up' && '👉 已启用【升调 ↗】：现在点击上方任何单词，末尾会插入红色上升符号。'}
                  {activeTool === 'down' && '👉 已启用【降调 ↘】：现在点击上方任何单词，末尾会插入绿色下降符号。'}
                  {activeTool === 'weak' && '👉 已启用【弱读】：现在点击任何单词，其字体会变小1号表示弱化发音。'}
                  {activeTool === 'link' && '👉 已启用【连读 ⁀】：点击一个英文字，会在该字与下个字之间生成一段桥梁弧线。'}
                  {activeTool === 'translate' && '👉 已启用【中英文释义 】：点击单词自动请求 AI 翻译，再次点击即变回英文。'}
                  {!activeTool && '💡 请先点击上方5个彩色按钮中的一个以选择工具，然后点击顶部单词开始画记标注。'}
                </div>
              </div>

              {/* Bottom control play bar / forwarder buttons */}
              <div className="pt-2 flex flex-col items-center space-y-4">
                <AudioPlayerControl
                  idPrefix="e-screen"
                  text={selectedExercise.text}
                  durationSeconds={selectedExercise.durationSeconds}
                  isPlaying={isPlayerPlaying}
                  onPlayStateChange={setIsPlayerPlaying}
                  onComplete={() => setIsPlayerPlaying(false)}
                  currentTime={currentTime}
                  setCurrentTime={setCurrentTime}
                />

                <button
                  id="go-shadowing-btn"
                  onClick={handleStartShadowing}
                  type="button"
                  className="w-full py-4 bg-[#58CC02] text-white border-b-4 border-[#3C8E00] hover:bg-[#46A302] font-black uppercase text-base rounded-2xl active:border-b-0 active:translate-y-1 transition-all"
                >
                  开始跟读
                </button>
              </div>
            </motion.div>
          )}

          {/* F. CODE SHADOWING / PRACTICE SELECTION SCREEN */}
          {currentScreen === 'MODE_CHOOSE' && selectedExercise && (
            <motion.div
              key="mode-choose-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center justify-center space-y-8 py-4 w-full"
            >
              <div className="text-center">
                <span className="text-xs font-black uppercase tracking-wider text-[#FF9600] bg-[#FFF1D6] px-2.5 py-1 rounded-full border border-[#FFD99D]">
                  第三步：跟读实练模式
                </span>
                <h3 className="text-lg font-black text-[#3C3026] mt-4">
                  请选择您的跟读跟练模式
                </h3>
              </div>

              {/* Vertical buttons */}
              <div className="w-full max-w-xs flex flex-col space-y-4">
                <button
                  id="choice-show-text-btn"
                  onClick={() => setCurrentScreen('RECORDING_SHOW')}
                  type="button"
                  className="w-full py-5 px-6 bg-[#58CC02] text-white border-b-4 border-[#3C8E00] hover:bg-[#46A302] font-black text-base rounded-2xl active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center space-x-2"
                >
                  <Eye className="w-5 h-5 fill-white" />
                  <span>显示文本跟读</span>
                </button>

                <button
                  id="choice-hide-text-btn"
                  onClick={() => setCurrentScreen('RECORDING_HIDE')}
                  type="button"
                  className="w-full py-5 px-6 bg-white text-[#46A302] border-[#58CC02] border-2 border-b-4 hover:bg-[#E5F9D5] font-black text-base rounded-2xl active:border-b-2 active:translate-y-0.5 transition-all flex items-center justify-center space-x-2"
                >
                  <EyeOff className="w-5 h-5" />
                  <span>隐藏文本跟读</span>
                </button>
              </div>

              {/* Re-annotate back button on bottom left styled within the workspace */}
              <div className="w-full text-center pt-8">
                <button
                  id="re-annotate-btn"
                  onClick={() => setCurrentScreen('ANNOTATE_VIEW')}
                  type="button"
                  className="py-3 px-6 bg-white text-[#7A6A53] border-2 border-[#E3DCD1] hover:bg-[#F3EFE9] rounded-xl font-bold text-xs"
                >
                  重新标注文本
                </button>
              </div>
            </motion.div>
          )}

          {/* G-1. "显示文本" PRACTICING SCREEN */}
          {currentScreen === 'RECORDING_SHOW' && selectedExercise && (
            <motion.div
              key="recording-show-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col space-y-6 w-full items-center"
            >
              <div className="w-full text-center">
                <span className="text-xs font-bold text-[#58CC02] bg-[#E5F9D5] px-2.5 py-1 rounded-full border border-[#C6F0A2]">
                  显示文本跟读模式
                </span>
              </div>

              {/* Top 3/4 Area holds annotated text - Cannot edit here */}
              <div className="w-full bg-white border-2 border-[#E3DCD1] p-6 rounded-3xl relative min-h-[160px] flex items-center justify-center">
                <div className="flex flex-wrap gap-x-3 gap-y-6 text-lg md:text-xl font-medium tracking-normal text-[#3C3026] leading-loose">
                  {annotationState.words.map((row, i) => {
                    const isLinkedToNext = annotationState.links.includes(i);

                    // Tone Suffix indicators
                    let toneSuffix = null;
                    if (row.tone === 'up') {
                      toneSuffix = <span className="text-red-500 font-black text-xs">↗</span>;
                    } else if (row.tone === 'down') {
                      toneSuffix = <span className="text-[#58CC02] font-black text-xs">↘</span>;
                    }

                    return (
                      <div key={i} className="relative flex items-center">
                        <div className={`px-1 py-0.5 rounded ${
                          row.isTranslated 
                            ? 'bg-[#EBF3FF] text-[#1CB0F6] border border-[#C0E1FF] text-xs font-bold px-1.5' 
                            : ''
                        } ${
                          row.isWeak 
                            ? 'text-xs opacity-60 scale-90' 
                            : ''
                        }`}>
                          {row.isTranslated ? row.translation : row.word}
                        </div>

                        {!row.isTranslated && toneSuffix}

                        {/* Bridge arc overlay */}
                        {isLinkedToNext && (
                          <div className="absolute left-1/2 right-[-50%] bottom-[-10px] h-3 overflow-visible pointer-events-none z-10 w-full flex justify-center">
                            <svg className="w-8 h-4 overflow-visible" viewBox="0 0 100 50">
                              <path 
                                d="M 0 0 Q 50 45, 100 0" 
                                fill="none" 
                                stroke="#FF9600" 
                                strokeWidth="8" 
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Volume Oscilloscope and waveform directly directly above bottom mic option */}
              <div className="w-full flex flex-col items-center">
                <span className="text-[10px] font-bold text-[#AF9F8D] uppercase tracking-wider mb-1">
                  {isRecording ? '录音中 · 实时分贝波动' : '准备就绪 · 点击开始录制'}
                </span>
                
                <AudioVisualizer isRecording={isRecording} />
              </div>

              {/* Mic action buttons */}
              <div className="flex flex-col items-center space-y-4 pt-2">
                {!recordingCompleted ? (
                  <button
                    id="g1-mic-btn"
                    onClick={handleToggleRecording}
                    type="button"
                    className={`p-6 rounded-full border-b-4 transition-all ${
                      isRecording 
                        ? 'bg-red-500 border-red-700 hover:bg-red-650 rotate-90 scale-105 rounded-2xl active:border-b-0 active:translate-y-1' 
                        : 'bg-[#58CC02] border-[#3C8E00] hover:bg-[#46A302] active:border-b-0 active:translate-y-1'
                    }`}
                  >
                    {isRecording ? (
                      <div className="w-6 h-6 bg-white rounded-sm animate-pulse" />
                    ) : (
                      <Mic className="w-7 h-7 text-white fill-white" />
                    )}
                  </button>
                ) : (
                  <button
                    id="g1-check-btn"
                    onClick={handleProceedToEvaluation}
                    type="button"
                    className="p-6 rounded-full bg-[#1CB0F6] border-b-4 border-[#1085BC] hover:bg-[#18A0E0] active:border-b-0 active:translate-y-1 text-white flex items-center justify-center transition-all"
                    title="递交评测"
                  >
                    <Check className="w-9 h-9 stroke-[3]" />
                  </button>
                )}

                <div className="text-center">
                  <span className="text-xs text-[#AF9F8D] font-bold block">
                    {isRecording ? '正在监听语音... 再次点击将存储声带音调' : recordingCompleted ? '' : '点击绿色麦克风开录'}
                  </span>
                </div>
              </div>

              {/* Floating cancel return F button */}
              <button
                id="g1-redo-btn"
                onClick={() => {
                  setRecordingCompleted(false);
                  setIsRecording(false);
                  setCurrentScreen('MODE_CHOOSE');
                }}
                type="button"
                className="text-xs text-[#AF9F8D] font-bold hover:text-[#7A6A53] pt-4"
              >
                重选录音模式
              </button>
            </motion.div>
          )}

          {/* G-2. "隐藏文本" PRACTICING SCREEN */}
          {currentScreen === 'RECORDING_HIDE' && selectedExercise && (
            <motion.div
              key="recording-hide-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col space-y-8 w-full items-center text-center justify-center py-4"
            >
              <div>
                <span className="text-xs font-bold text-[#FF9600] bg-[#FFF1D6] px-2.5 py-1 rounded-full border border-[#FFD99D]">
                  盲听隐藏文本跟读模式
                </span>
              </div>

              {/* Dynamic waveform in the CENTER of page */}
              <div className="w-full py-6 flex flex-col items-center">
                {isRecording && (
                  <span className="text-xs font-bold text-[#A2988E] uppercase tracking-wider mb-2">
                    ⚠️ 影子接收中...
                  </span>
                )}
                <AudioVisualizer isRecording={isRecording} />
              </div>

              {/* Bottom mic and complete triggers */}
              <div className="flex flex-col items-center space-y-4">
                {!recordingCompleted ? (
                  <button
                    id="g2-mic-btn"
                    onClick={handleToggleRecording}
                    type="button"
                    className={`p-6 rounded-full border-b-4 transition-all ${
                      isRecording 
                        ? 'bg-red-500 border-red-700 hover:bg-red-650 rounded-2xl active:border-b-0 active:translate-y-1' 
                        : 'bg-[#58CC02] border-[#3C8E00] hover:bg-[#46A302] active:border-b-0 active:translate-y-1'
                    }`}
                  >
                    {isRecording ? (
                      <div className="w-6 h-6 bg-white rounded-sm animate-pulse" />
                    ) : (
                      <Mic className="w-7 h-7 text-white fill-white" />
                    )}
                  </button>
                ) : (
                  <button
                    id="g2-check-btn"
                    onClick={handleProceedToEvaluation}
                    type="button"
                    className="p-6 rounded-full bg-[#1CB0F6] border-b-4 border-[#1085BC] hover:bg-[#18A0E0] active:border-b-0 active:translate-y-1 text-white flex items-center justify-center transition-all"
                    title="递交评测"
                  >
                    <Check className="w-9 h-9 stroke-[3]" />
                  </button>
                )}

                <div className="text-center">
                  <span className="text-xs text-[#AF9F8D] font-bold block">
                    {isRecording ? '正在录音... 再次点击按钮完成' : recordingCompleted ? '🎉 盲听录制完成！点击蓝色对号评分！' : '点击绿色麦克风开录'}
                  </span>
                </div>
              </div>

              {/* Return link */}
              <button
                id="g2-back-btn"
                onClick={() => {
                  setRecordingCompleted(false);
                  setIsRecording(false);
                  setCurrentScreen('MODE_CHOOSE');
                }}
                type="button"
                className="text-xs text-[#AF9F8D] font-bold hover:text-[#7A6A53] pt-2"
              >
                重选模式
              </button>
            </motion.div>
          )}

          {/* H. EVALUATION 测评结果 SCREEN */}
          {currentScreen === 'EVALUATION' && selectedExercise && (
            <motion.div
              key="evaluation-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col space-y-6 w-full"
            >
              <div className="text-center border-b-2 border-[#E3DCD1] pb-3">
                <span className="text-xs font-bold text-[#46A302] bg-[#E5F9D5] px-2.5 py-1 rounded-full">
                  AI 智能语音测评结果反馈
                </span>
                <p className="text-xs text-[#7A6A53] mt-2 truncate max-w-xs mx-auto">
                  针对 “{selectedExercise.title}”
                </p>
              </div>

              {/* Loading State or Score layout display */}
              {isEvaluating ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-white p-6 border-2 border-[#E3DCD1] rounded-3xl">
                  {/* Glowing spinner animations */}
                  <div className="w-14 h-14 border-4 border-[#E3DCD1] border-t-[#58CC02] rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="font-bold text-[#3C3026]">AI 正在多维度评估您的语调、节奏...</p>
                    <p className="text-xs text-[#AF9F8D] mt-1">大约需要 2-3 秒，请稍候</p>
                  </div>
                </div>
              ) : (
                currentEvaluation && (
                  <div className="space-y-6">
                    {/* Upper overall score placard */}
                    <div className="bg-white border-2 border-[#E3DCD1] p-6 rounded-3xl shadow-sm text-center flex flex-col items-center justify-center space-y-2 relative overflow-hidden">
                      <p className="text-xs font-bold text-[#AF9F8D] uppercase tracking-wider">
                        综合发音评级
                      </p>
                      
                      <div className={`w-24 h-24 rounded-2xl flex items-center justify-center font-black text-5xl shadow-md border-3 transition-transform hover:scale-105 duration-250 ${
                        currentEvaluation.grade === 'S' 
                          ? 'bg-[#E5F9D5] text-[#46A302] border-[#58CC02]'
                          : currentEvaluation.grade === 'A'
                          ? 'bg-[#EBF3FF] text-[#1CB0F6] border-[#1CB0F6]'
                          : 'bg-[#FFF1D6] text-[#FF9600] border-[#FF9600]'
                      }`}>
                        {currentEvaluation.grade}
                      </div>

                      <p className="text-xs font-black text-[#5C4D3E] mt-3">
                        {currentEvaluation.grade === 'S' && '🏆 天籁之音！您的精细声调和长弱读掌握得炉火纯青。'}
                        {currentEvaluation.grade === 'A' && '✨ 优秀非凡！节奏比对高度一致，仅有微弱重音偏差。'}
                        {currentEvaluation.grade === 'B' && '👍 表现好棒！有些连读的处理可以稍微圆滑连贯一点。'}
                        {currentEvaluation.grade === 'C' && '💪 练习使您更棒！可以回到 D 页面多重复几遍。'}
                      </p>
                    </div>

                    {/* Bottom breakdown breakout cards holding individual scores */}
                    <div className="bg-white border-2 border-[#E3DCD1] p-5 rounded-3xl space-y-4 shadow-sm">
                      <h4 className="font-bold text-[#3C3026] text-xs uppercase tracking-wider text-center border-b border-gray-100 pb-2">
                        单项评估得分维度
                      </h4>
                      
                      {/* Grid lists */}
                      <div className="space-y-3">
                        {/* Row 1 */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#7A6A53] flex items-center gap-1">
                            🎵 <b className="font-black text-[#3C3026]">语调</b>
                          </span>
                          <span className={`px-3 py-1 text-xs font-black rounded-full border ${
                            currentEvaluation.scores.intonation === 'S'
                              ? 'bg-[#E5F9D5] text-[#46A302] border-[#C6F0A2]'
                              : currentEvaluation.scores.intonation === 'A'
                              ? 'bg-[#EBF3FF] text-[#1CB0F6] border-[#C0E1FF]'
                              : 'bg-[#FFF1D6] text-[#E08200] border-[#FFD99D]'
                          }`}>
                            评级：{currentEvaluation.scores.intonation}
                          </span>
                        </div>

                        {/* Row 2 */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#7A6A53] flex items-center gap-1">
                            🥁 <b className="font-black text-[#3C3026]">节奏</b>
                          </span>
                          <span className={`px-3 py-1 text-xs font-black rounded-full border ${
                            currentEvaluation.scores.rhythm === 'S'
                              ? 'bg-[#E5F9D5] text-[#46A302] border-[#C6F0A2]'
                              : currentEvaluation.scores.rhythm === 'A'
                              ? 'bg-[#EBF3FF] text-[#1CB0F6] border-[#C0E1FF]'
                              : 'bg-[#FFF1D6] text-[#E08200] border-[#FFD99D]'
                          }`}>
                            评级：{currentEvaluation.scores.rhythm}
                          </span>
                        </div>

                        {/* Row 3 */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#7A6A53] flex items-center gap-1">
                            🗣️ <b className="font-black text-[#3C3026]">发音</b>
                          </span>
                          <span className={`px-3 py-1 text-xs font-black rounded-full border ${
                            currentEvaluation.scores.pronunciation === 'S'
                              ? 'bg-[#E5F9D5] text-[#46A302] border-[#C6F0A2]'
                              : currentEvaluation.scores.pronunciation === 'A'
                              ? 'bg-[#EBF3FF] text-[#1CB0F6] border-[#C0E1FF]'
                              : 'bg-[#FFF1D6] text-[#E08200] border-[#FFD99D]'
                          }`}>
                            评级：{currentEvaluation.scores.pronunciation}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Return Action button */}
                    <div className="pt-2">
                      <button
                        id="redo-practice-btn"
                        onClick={handlePracticeAgain}
                        type="button"
                        className="w-full py-4 bg-[#58CC02] text-white border-b-4 border-[#3C8E00] hover:bg-[#46A302] font-black uppercase text-base rounded-2xl active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center space-x-2 shadow-sm"
                      >
                        <RotateCcw className="w-5 h-5 text-white stroke-[2.5]" />
                        <span>再练一遍</span>
                      </button>
                    </div>
                  </div>
                )
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>


    </div>
  );
}

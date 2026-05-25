import { useState, useEffect } from 'react';
import { Level, LevelDetails, Message, AttachedFile } from './types';
import { LevelSelector } from './components/LevelSelector';
import { ChatMessageList } from './components/ChatMessageList';
import { ChatInputArea } from './components/ChatInputArea';
import { RotateCcw, Sparkles, BookOpen, AlertCircle, HelpCircle } from 'lucide-react';

const LEVELS_CONFIG: Record<Level, LevelDetails> = {
  biennio: {
    id: 'biennio',
    label: 'Biennio',
    emoji: '🟢',
    tag: '[🟢 BIENNIO]',
    badge: '14-16 ANNI',
    description: 'Primo approccio al concetto: linguaggio accessibile, analogie pratiche, zero tecnicismi.',
    accentColor: 'emerald',
    bgClass: 'bg-emerald-50/40 border-emerald-500/80',
    borderClass: 'border-emerald-500',
    textClass: 'text-emerald-700',
    focusRingClass: 'focus-within:ring-emerald-100 focus-within:border-emerald-500',
  },
  triennio: {
    id: 'triennio',
    label: 'Triennio',
    emoji: '🟡',
    tag: '[🟡 TRIENNIO]',
    badge: '16-18 ANNI',
    description: 'Uso della terminologia disciplinare corretta, connessioni logiche ed esempi contestualizzati.',
    accentColor: 'amber',
    bgClass: 'bg-amber-50/40 border-amber-500/80',
    borderClass: 'border-amber-500',
    textClass: 'text-amber-700',
    focusRingClass: 'focus-within:ring-amber-100 focus-within:border-amber-500',
  },
  maturita: {
    id: 'maturita',
    label: 'Maturità',
    emoji: '🔴',
    tag: '[🔴 MATURITÀ]',
    badge: 'QUINTO ANNO',
    description: 'Verso lesame di stato: terminologia specialistica, autori, teorie e collegamenti interdisciplinari.',
    accentColor: 'rose',
    bgClass: 'bg-rose-50/40 border-rose-500/80',
    borderClass: 'border-rose-500',
    textClass: 'text-rose-700',
    focusRingClass: 'focus-within:ring-rose-100 focus-within:border-rose-500',
  },
};

// Suggerimenti di argomenti didattici basati sul livello selezionato
const LEVEL_SUGGESTIONS: Record<Level, string[]> = {
  biennio: [
    "Spiegami come funziona la fotosintesi clorofilliana 🌿",
    "Perché gli atomi formano dei legami tra loro? ⚛️",
    "Chi erano i patrizi e i plebei nell'antica Roma? 🏛️",
    "Che cos'è esattamente il teorema di Pitagora? 📐"
  ],
  triennio: [
    "Spiegami il concetto di 'limite' in matematica 📊",
    "Il significato di 'Carpe Diem' in Orazio 📖",
    "Come funziona la selezione naturale di Darwin? 🧬",
    "Le cause principali che hanno scatenato la Prima Guerra Mondiale ⚔️"
  ],
  maturita: [
    "Spiegami la teoria della relatività ristretta di Einstein ricollegandola a filosofia 🌌",
    "La crisi delle certezze d'inizio Novecento e Pirandello 🎭",
    "Il concetto di infinito in Leopardi messo a confronto con la matematica 🏔️",
    "Come funziona il meccanismo economico del debito pubblico? 💶"
  ],
};

export default function App() {
  const [activeLevel, setActiveLevel] = useState<Level>('biennio');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);

  // Carichiamo la cronologia dei messaggi da localStorage all'avvio
  useEffect(() => {
    const savedMessages = localStorage.getItem('spiegalivelli_chat');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Impossibile caricare i messaggi salvati:", e);
      }
    }
  }, []);

  // Salviamo la cronologia nei localStorage ad ogni modifica dei messaggi
  const saveMessages = (updatedMessages: Message[]) => {
    setMessages(updatedMessages);
    localStorage.setItem('spiegalivelli_chat', JSON.stringify(updatedMessages));
  };

  // Funzione per ripulire la chat
  const handleNewConversation = () => {
    saveMessages([]);
    setErrorHeader(null);
  };

  // Invio del messaggio all'API
  const handleSendMessage = async (text: string, file: AttachedFile | null) => {
    if (isLoading) return;
    setErrorHeader(null);

    // 1. Creiamo il messaggio per la chat dell'utente (senza prepend visivo, per pulizia)
    const userMsgId = Date.now().toString();
    const newUserMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text: text,
      timestamp: new Date().toISOString(),
      level: activeLevel,
      file: file || undefined,
    };

    const updatedMessages = [...messages, newUserMsg];
    saveMessages(updatedMessages);
    setIsLoading(true);

    try {
      // 2. Prepariamo l'array di messaggi da mandare al backend.
      // Ciascun messaggio dell'utente deve avere il tag '[🟢 BIENNIO]', ecc. in testa come richiesto.
      const messagesForAPI = updatedMessages.map((msg) => {
        if (msg.sender === 'user') {
          const config = LEVELS_CONFIG[msg.level || 'biennio'];
          const tag = config.tag;
          // Se per qualche motivo ha già il tag, evitiamo di raddoppiarlo
          const cleanText = msg.text.startsWith('[') && msg.text.includes(']')
            ? msg.text
            : `${tag} ${msg.text}`;

          return {
            ...msg,
            text: cleanText,
          };
        }
        return msg;
      });

      // 3. Chiamata fetch all'API Serverless di Vercel locale/remota
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesForAPI,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Impossibile ottenere una spiegazione dall'AI.");
      }

      const data = await response.json();

      // 4. Aggiungiamo la spiegazione dell'AI alla chat
      const aiMsgId = (Date.now() + 1).toString();
      const newAiMsg: Message = {
        id: aiMsgId,
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toISOString(),
        level: activeLevel,
      };

      saveMessages([...updatedMessages, newAiMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorHeader(err.message || "Qualcosa è andato storto nella connessione con il tutor virtuale.");
    } finally {
      setIsLoading(false);
    }
  };

  // Funzione per inviare rapidamente un suggerimento cliccato
  const handleSuggestionClick = (suggestionText: string) => {
    handleSendMessage(suggestionText, null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      {/* Header Bar */}
      <header className="sticky top-0 z-10 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/85 py-5 px-4 md:px-8">
        <div className="max-w-4xl mx-auto flex items-end justify-between">
          <div>
            <h1 id="app-title" className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 flex items-center gap-1.5 leading-none">
              <span className="text-amber-500 italic">Spiega</span>Livelli
            </h1>
            <p id="app-caption" className="text-xs md:text-sm text-slate-500 font-medium mt-1">
              Scegli il livello della classe e scrivi il concetto da spiegare
            </p>
          </div>

          {/* Nuova conversazione button (visibile solo se ci sono messaggi) */}
          {messages.length > 0 ? (
            <button
              id="new-chat-btn"
              onClick={handleNewConversation}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 shadow-xs hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-2"
              title="Azzera la chat e ricomincia"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Nuova conversazione</span>
            </button>
          ) : (
            <div className="hidden md:block">
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-full uppercase border border-indigo-100 tracking-wider">
                Didattica 3.5
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Pane */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* Banner di Accoglienza e Informazioni in stile Bento pulito */}
        {messages.length === 0 && (
          <div id="intro-banner" className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/55 shadow-xs flex flex-col md:flex-row gap-6 items-start md:items-center animate-fade-in">
            <div className="flex-1 space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800 italic">
                <Sparkles className="w-3.5 h-3.5" /> Tutor Digitale
              </span>
              <h2 id="main-headline" className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight leading-snug">
                Un assistente personale calibrato per gli studenti delle superiori
              </h2>
              <p id="main-subheadline" className="text-sm text-slate-500 leading-relaxed font-medium">
                Pianificato per interpretare il livello scolastico delle spiegazioni. Carica schemi, mappe mentali o chiedi chiarimenti teorici: adatterò subito linguaggio e metafore didattiche!
              </p>
            </div>
          </div>
        )}

        {/* Level Selectors */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
            Seleziona la fascia scolastica
          </label>
          <LevelSelector
            activeLevel={activeLevel}
            onLevelChange={setActiveLevel}
            levelsConfig={LEVELS_CONFIG}
          />
        </div>

        {/* Error Notification Alert */}
        {errorHeader && (
          <div id="error-alert" className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3 shadow-xs animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Errore di comunicazione</p>
              <p className="text-xs text-red-600 mt-0.5">{errorHeader}</p>
            </div>
          </div>
        )}

        {/* Conversational Screen (Chat Messages Area) */}
        <div className="flex flex-col flex-1 bg-white rounded-3xl border border-slate-100/95 shadow-sm p-4 md:p-6 gap-6 relative">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full animate-ping ${
                activeLevel === 'biennio' ? 'bg-emerald-500' : activeLevel === 'triennio' ? 'bg-amber-500' : 'bg-rose-500'
              }`} />
              <h3 className="text-sm font-bold text-slate-700">
                Studio in corso • Livello {LEVELS_CONFIG[activeLevel].label}
              </h3>
            </div>
            
            {/* Legend button */}
            <div className="text-slate-400 hover:text-slate-600 transition-colors cursor-help flex items-center gap-1.5" title="Regola: Spiego il concetto, non risolvo direttamente esercizi!">
              <HelpCircle className="w-4 h-4" />
              <span className="text-[10px] uppercase font-bold hidden sm:inline tracking-wider">Metodo Didattico</span>
            </div>
          </div>

          <ChatMessageList
            messages={messages}
            isLoading={isLoading}
            activeLevel={activeLevel}
            levelsConfig={LEVELS_CONFIG}
          />

          {/* Suggested Quick Prompts (visibili solo se non stiamo pensando e ci sono pochi/zero messaggi) */}
          {!isLoading && messages.length < 4 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                Prova a chiedere:
              </span>
              <div className="flex flex-wrap gap-2">
                {LEVEL_SUGGESTIONS[activeLevel].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl px-3.5 py-2 text-slate-600 hover:text-slate-900 transition-all text-left cursor-pointer shadow-3xs"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ChatInputArea
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            activeLevel={activeLevel}
            levelsConfig={LEVELS_CONFIG}
          />
        </div>
      </main>

      {/* Standardized professional academic footer */}
      <footer className="w-full bg-slate-100 border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto space-y-1">
          <p>© 2026 SpiegaLivelli — Assistente Didattico Scolastico.</p>
          <p>Sviluppato per spiegare concetti, formule e teorie favorendo lapprendimento guidato (non risolve compiti per casa).</p>
        </div>
      </footer>
    </div>
  );
}

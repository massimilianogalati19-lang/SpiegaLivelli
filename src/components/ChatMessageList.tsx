import React, { useEffect, useRef } from 'react';
import { Message, Level, LevelDetails } from '../types';
import { FileText, ImageIcon, User, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  activeLevel: Level;
  levelsConfig: Record<Level, LevelDetails>;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isLoading,
  activeLevel,
  levelsConfig,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automatico all'ultimo messaggio
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Formatta le dimensioni in KB o MB
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Funzione per ripulire il tag di livello dall'AI e ricavare il livello per lo styling
  const parseAIResponse = (text: string): { cleanText: string; detectedLevel?: Level } => {
    if (text.startsWith('[🟢 BIENNIO]')) {
      return { cleanText: text.replace('[🟢 BIENNIO]', '').trim(), detectedLevel: 'biennio' };
    }
    if (text.startsWith('[🟡 TRIENNIO]')) {
      return { cleanText: text.replace('[🟡 TRIENNIO]', '').trim(), detectedLevel: 'triennio' };
    }
    if (text.startsWith('[🔴 MATURITÀ]')) {
      return { cleanText: text.replace('[🔴 MATURITÀ]', '').trim(), detectedLevel: 'maturita' };
    }
    return { cleanText: text };
  };

  return (
    <div
      id="chat-messages-container"
      className="flex-1 w-full bg-slate-50/50 rounded-2xl border border-slate-100 p-4 md:p-6 overflow-y-auto space-y-6 max-h-[500px] min-h-[350px] scrollbar-thin scrollbar-thumb-slate-200"
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
            <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h4 id="no-messages-title" className="text-base font-bold text-slate-700">La lavagna è vuota!</h4>
            <p id="no-messages-subtitle" className="text-sm text-slate-500">
              Scegli un livello scolastico sopra, scrivi un argomento o concetto e premi Invia per ricevere la spiegazione ideale.
            </p>
          </div>
        </div>
      ) : (
        messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const { cleanText, detectedLevel } = isUser
            ? { cleanText: msg.text }
            : parseAIResponse(msg.text);

          // Determiniamo la configurazione di stile in base al livello rilevato nel testo o a quello corrente
          const levelOfMessage = detectedLevel || msg.level || activeLevel;
          const config = levelsConfig[levelOfMessage];

          return (
            <div
              key={msg.id}
              id={`msg-${msg.id}`}
              className={`flex gap-3 md:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar dell'Assistente */}
              {!isUser && (
                <div
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                    levelOfMessage === 'biennio'
                      ? 'bg-emerald-500'
                      : levelOfMessage === 'triennio'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
              )}

              {/* Corpo del messaggio */}
              <div className={`flex flex-col max-w-[85%] md:max-w-[75%] space-y-1.5`}>
                {/* Nome mittente e livello se assistente */}
                <div className={`flex items-center gap-2 text-xs font-semibold text-slate-500 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {isUser ? (
                    <span>Studente</span>
                  ) : (
                    <>
                      <span>SpiegaLivelli</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-sm text-[10px] uppercase font-bold tracking-wider ${
                          levelOfMessage === 'biennio'
                            ? 'bg-emerald-100 text-emerald-800'
                            : levelOfMessage === 'triennio'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {config.label}
                      </span>
                    </>
                  )}
                  <span className="text-slate-400 font-normal">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`p-4 md:p-5 rounded-2xl text-sm md:text-base leading-relaxed ${
                    isUser
                      ? 'bg-slate-100 text-slate-800 rounded-tr-none border border-slate-200/60'
                      : levelOfMessage === 'biennio'
                      ? 'bg-emerald-50/70 border border-emerald-100/80 text-emerald-950 rounded-tl-none shadow-xs'
                      : levelOfMessage === 'triennio'
                      ? 'bg-amber-50 border border-amber-100 text-amber-950 rounded-tl-none shadow-xs'
                      : 'bg-rose-50/70 border border-rose-100/80 text-rose-950 rounded-tl-none shadow-xs'
                  }`}
                >
                  {/* File allegato nel messaggio */}
                  {msg.file && (
                    <div className="mb-3 p-3 rounded-xl bg-slate-100/80 text-slate-700 flex items-center gap-3 border border-slate-200">
                      {msg.file.type.startsWith('image/') ? (
                        <div className="relative rounded-lg overflow-hidden border border-slate-200 max-w-sm max-h-48">
                          <img
                            src={msg.file.base64}
                            alt={msg.file.name}
                            className="object-cover max-h-48"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 w-full">
                          <div className="p-2 rounded-lg bg-rose-100 text-rose-600 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate text-slate-800">
                              {msg.file.name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              PDF • {formatFileSize(msg.file.size)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Testo del messaggio */}
                  {isUser ? (
                    <div className="whitespace-pre-wrap">
                      {msg.level && (
                        <span className={`font-bold mr-1.5 uppercase tracking-wider text-xs ${
                          msg.level === 'biennio' ? 'text-emerald-600' : msg.level === 'triennio' ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {levelsConfig[msg.level].tag}{' '}
                        </span>
                      )}
                      {cleanText}
                    </div>
                  ) : (() => {
                    let mainText = cleanText;
                    let suffixText = "";
                    const suffixMarker = "— Vuoi salire di livello?";
                    const markerIndex = cleanText.indexOf(suffixMarker);

                    if (markerIndex !== -1) {
                      mainText = cleanText.substring(0, markerIndex).trim();
                      suffixText = cleanText.substring(markerIndex).trim();
                    }

                    return (
                      <div className="space-y-3">
                        <div className="markdown-body prose max-w-none text-slate-800 prose-slate prose-headings:font-bold prose-headings:text-slate-900 prose-p:leading-relaxed prose-a:text-indigo-600">
                          <Markdown>{mainText}</Markdown>
                        </div>
                        {suffixText && (
                          <>
                            <div className={`h-px my-2 ${
                              levelOfMessage === 'biennio' ? 'bg-emerald-200/50' : levelOfMessage === 'triennio' ? 'bg-amber-200/60' : 'bg-rose-200/50'
                            }`} />
                            <p className={`text-xs font-semibold italic ${
                              levelOfMessage === 'biennio' ? 'text-emerald-700/80' : levelOfMessage === 'triennio' ? 'text-amber-700/90' : 'text-rose-700/80'
                            }`}>
                              {suffixText}
                            </p>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Avatar dell'utente */}
              {isUser && (
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 shadow-xs">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Indicatore di caricamento AI */}
      {isLoading && (
        <div id="ai-loading-indicator" className="flex gap-3 md:gap-4 justify-start">
          <div
            className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs animate-bounce ${
              activeLevel === 'biennio'
                ? 'bg-emerald-500'
                : activeLevel === 'triennio'
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col space-y-1.5 w-[70%]">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>SpiegaLivelli sta scrivendo...</span>
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-xs space-y-2">
              <div className={`h-4 rounded-sm animate-pulse w-full ${
                activeLevel === 'biennio' ? 'bg-emerald-100' : activeLevel === 'triennio' ? 'bg-amber-100' : 'bg-rose-100'
              }`} />
              <div className={`h-4 rounded-sm animate-pulse w-[85%] ${
                activeLevel === 'biennio' ? 'bg-emerald-100' : activeLevel === 'triennio' ? 'bg-amber-100' : 'bg-rose-100'
              }`} />
              <div className={`h-4 rounded-sm animate-pulse w-[60%] ${
                activeLevel === 'biennio' ? 'bg-emerald-100' : activeLevel === 'triennio' ? 'bg-amber-100' : 'bg-rose-100'
              }`} />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

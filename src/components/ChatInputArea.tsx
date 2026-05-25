import React, { useRef, useState } from 'react';
import { Level, LevelDetails, AttachedFile } from '../types';
import { Paperclip, Send, X, FileText, Image, Upload } from 'lucide-react';

interface ChatInputAreaProps {
  onSendMessage: (text: string, file: AttachedFile | null) => void;
  isLoading: boolean;
  activeLevel: Level;
  levelsConfig: Record<Level, LevelDetails>;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  onSendMessage,
  isLoading,
  activeLevel,
  levelsConfig,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = levelsConfig[activeLevel];

  // Gestione dell'invio del messaggio
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;
    if (isLoading) return;

    onSendMessage(inputText, attachedFile);
    setInputText('');
    setAttachedFile(null);
  };

  // Funzione per convertire un file HTML5 in AttachedFile (Base64)
  const processFile = (file: File) => {
    // Accettiamo solo PDF e Immagini
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
      alert("Formato file non supportato. Carica solo immagini (PNG, JPEG, ecc.) o documenti PDF.");
      return;
    }

    // Limite dimensione a 4MB per caricamenti sicuri
    if (file.size > 4 * 1024 * 1024) {
      alert("Il file supera il limite consentito di 4 MB. Carica un file più piccolo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachedFile({
          name: file.name,
          type: file.type,
          size: file.size,
          base64: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Apertura della selezione manuale
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  // Selezione file da input HTML
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Resettiamo il valore dell'input per permettere lo stesso file in seguito
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Gestione Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Rimozione del file in bozza
  const handleRemoveAttachment = () => {
    setAttachedFile(null);
  };

  // Colore del bordo in base al livello attivo con effetto anello Bento dedicato
  const getBorderColorClass = () => {
    switch (activeLevel) {
      case 'biennio':
        return 'focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10';
      case 'triennio':
        return 'focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10';
      case 'maturita':
        return 'focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/10';
    }
  };

  const getButtonBgClass = () => {
    if (!inputText.trim() && !attachedFile) {
      return 'bg-slate-200 text-slate-400 cursor-not-allowed';
    }
    switch (activeLevel) {
      case 'biennio':
        return 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 hover:bg-emerald-600 hover:scale-105 active:scale-95 cursor-pointer';
      case 'triennio':
        return 'bg-amber-500 text-white shadow-md shadow-amber-500/25 hover:bg-amber-600 hover:scale-105 active:scale-95 cursor-pointer';
      case 'maturita':
        return 'bg-rose-500 text-white shadow-md shadow-rose-500/25 hover:bg-rose-600 hover:scale-105 active:scale-95 cursor-pointer';
    }
  };

  return (
    <div id="chat-input-container" className="w-full relative">
      {/* File input nascosto */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,application/pdf"
        className="hidden"
      />

      <form
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col w-full rounded-3xl border-2 bg-white transition-all duration-300 shadow-sm hover:shadow-md ${
          isDragging
            ? 'border-dashed border-indigo-500 bg-indigo-50/20'
            : 'border-slate-200'
        } ${getBorderColorClass()}`}
      >
        {/* Overlay durante il Drag */}
        {isDragging && (
          <div className="absolute inset-0 bg-slate-900/10 rounded-3xl flex items-center justify-center gap-2 pointer-events-none text-slate-600 font-medium z-10">
            <Upload className="w-5 h-5 text-indigo-500 animate-bounce" />
            <span>Trascina il file qui per allegarlo</span>
          </div>
        )}

        {/* Riga di visualizzazione allegato se presente */}
        {attachedFile && (
          <div className="flex items-center gap-3 p-3 mx-3 mt-3 rounded-2xl bg-slate-50 border border-slate-100 select-none animate-fade-in">
            <div className={`p-2 rounded-xl shrink-0 ${
              attachedFile.type.startsWith('image/') ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'
            }`}>
              {attachedFile.type.startsWith('image/') ? (
                <Image className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate mb-0.5">
                {attachedFile.name}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                {(attachedFile.size / (1024)).toFixed(1)} KB
              </p>
            </div>

            <button
              type="button"
              onClick={handleRemoveAttachment}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Rimuovi allegato"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input area principale */}
        <div className="flex items-center gap-2 px-3.5 py-2.5">
          {/* File Attachment Button a sinistra */}
          <button
            type="button"
            onClick={handleAttachmentClick}
            disabled={isLoading}
            className={`p-3 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-500 hover:text-slate-700 transition-all duration-200 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Allega immagine o PDF"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Area di testo principale */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder="Che concetto vuoi che ti spieghi?"
            className="flex-1 py-2 px-2 text-slate-800 placeholder-slate-400 text-sm md:text-base border-none focus:outline-hidden disabled:opacity-50 font-medium"
          />

          {/* Pulsante di invio della chat a destra */}
          <button
            type="submit"
            disabled={isLoading || (!inputText.trim() && !attachedFile)}
            className={`w-11 h-11 rounded-2xl transition-all duration-200 shrink-0 font-medium flex items-center justify-center ${getButtonBgClass()}`}
            title="Invia"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
      <div className="mt-2 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
        <span>Supporta Drag & Drop o pulsante graffetta per allegare Immagini e PDF (max 4MB).</span>
      </div>
    </div>
  );
};

import { GoogleGenAI } from "@google/genai";

// Inizializziamo in modo pigro (lazy) per evitare crash all'avvio se la chiave manca,
// come consigliato dalle linee guida.
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("La chiave API di Gemini (GEMINI_API_KEY) non è configurata nell'ambiente.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const SYSTEM_PROMPT = `Sei SpiegaLivelli, un assistente didattico per la scuola superiore italiana. Spieghi qualsiasi concetto disciplinare calibrando linguaggio e profondità sul livello della classe.

I TRE LIVELLI:
🟢 BIENNIO — Primo biennio (14-16 anni). Primo approccio: linguaggio accessibile, analogie con la vita quotidiana, zero tecnicismi (o spiegati subito), frasi brevi. Focus sul "cosa è" e sul "perché esiste".
Inizia sempre la risposta con [🟢 BIENNIO].

🟡 TRIENNIO — Triennio (16-18 anni). Conosce le basi: terminologia disciplinare corretta, connessioni con concetti già studiati, esempi contestualizzati alla materia.
Inizia sempre con [🟡 TRIENNIO].

🔴 MATURITÀ — Quinto anno, verso l'esame di stato. Terminologia specialistica completa, riferimenti ad autori e teorie, sfumature, casi particolari, collegamenti interdisciplinari.
Inizia sempre con [🔴 MATURITÀ].

Il livello attivo è indicato tra parentesi quadre all'inizio del messaggio. Rispettalo sempre.

DOCUMENTI E IMMAGINI:
Se l'utente allega un PDF o un'immagine:
- Analizza il contenuto
- Identifica i concetti principali
- Se l'utente ha indicato un concetto specifico, spiegalo al livello attivo
- Se non specifica, chiedi quale concetto approfondire

Dopo ogni spiegazione aggiungi su riga separata:
"— Vuoi salire di livello? Hai domande su quello che ho detto?"

REGOLA FONDAMENTALE: non risolvere mai esercizi specifici. Spiega il concetto sottostante. Sii sempre incoraggiante.`;

export default async function handler(req: any, res: any) {
  // Gestione opzioni pre-volo CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Metodo ${req.method} non supportato.` }));
    return;
  }

  try {
    const { messages } = req.body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Il corpo della richiesta deve contenere un array 'messages' non vuoto." }));
      return;
    }

    const ai = getAiClient();

    // Mappiamo i messaggi della chat sul formato "contents" di decifrazione di Gemini
    const contents = messages.map((msg: any) => {
      const parts: any[] = [];

      if (msg.file) {
        let base64Data = msg.file.base64;
        const match = base64Data.match(/^data:(.*);base64,(.*)$/);
        if (match) {
          base64Data = match[2];
        }

        parts.push({
          inlineData: {
            mimeType: msg.file.type || 'image/jpeg',
            data: base64Data,
          },
        });
      }

      // Se non c'è testo ma c'è un file, forniamo un placeholder per la parte testuale
      parts.push({
        text: msg.text || "Analizza questo file allegato.",
      });

      return {
        role: msg.sender === 'user' ? 'user' : 'model',
        parts,
      };
    });

    // Effettuiamo la chiamata a Gemini 3.5-flash
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "Non ho ricevuto risposta dal server dell'intelligenza artificiale.";

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ reply: replyText }));
  } catch (error: any) {
    console.error("Errore nell'endpoint api/explain:", error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message || "Errore interno durante la generazione del contenuto." }));
  }
}

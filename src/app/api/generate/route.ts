import { NextResponse } from "next/server"; // Utilities per rispondere nelle route App Router
import axios from "axios"; // HTTP client per chiamare le API di Figma
import { generateStories } from "../../lib/ai"; // Helper che invoca il modello AI (OpenAI/Ollama)

type FigmaNode = {
  type?: string; // Tipo del nodo Figma (FRAME, COMPONENT, ...)
  name?: string; // Nome del nodo (usato come etichetta schermata)
  children?: FigmaNode[]; // Figli del nodo per la visita ricorsiva
  id?: string; // Identificatore del nodo (usato per richiedere immagini)
};

function extractFileKey(figmaUrl: string): string | null {
  // Estrae il file key da URL Figma
  try {
    const url = new URL(figmaUrl); // Parsea l'URL in modo sicuro
    const parts = url.pathname.split("/").filter(Boolean); // Segmenta il path
    // Formati attesi: /file/<key>/..., /design/<key>/..., /proto/<key>/...
    if (parts.length >= 2) {
      const marker = parts[0]; // Primo segmento (file/design/proto)
      const key = parts[1]; // Secondo segmento: il file key
      if (["file", "design", "proto"].includes(marker) && key) return key; // Restituisce il key valido
    }
    // Fallback: regex semplice sul path completo
    const match = figmaUrl.match(/\/file\/([A-Za-z0-9]+)\//);
    if (match && match[1]) return match[1]; // Se trova un match, restituisce il key
  } catch {
    // Ignora errori di parse dell'URL
  }
  return null; // Nessun key trovato
}

export async function POST(request: Request) {
  // Handler POST per /api/generate
  try {
    const body = await request.json(); // Legge il JSON dal body
    const figmaUrl: string | undefined = body?.figmaUrl; // Estrae l'URL Figma inviato dal client

    if (!figmaUrl || typeof figmaUrl !== "string") {
      // Valida input
      return NextResponse.json(
        { error: "Figma URL mancante o non valido" }, // Errore per input assente/errato
        { status: 400 }
      );
    }

    // 1. Estraggo il file key dall’URL
    const fileKey = extractFileKey(figmaUrl); // Ottiene il file key da analizzare
    if (!fileKey) {
      // Se non è stato possibile estrarlo
      return NextResponse.json(
        { error: "Figma URL non valido" }, // Risponde con 400
        { status: 400 }
      );
    }

    // 2. Chiamata API a Figma
    if (!process.env.FIGMA_TOKEN) {
      // Verifica che il token Figma sia presente
      return NextResponse.json(
        { error: "FIGMA_TOKEN non configurato nel server" }, // Errore di configurazione
        { status: 500 }
      );
    }
    const figmaRes = await axios.get(
      `https://api.figma.com/v1/files/${fileKey}`, // Endpoint Figma per il file
      {
        headers: { "X-Figma-Token": process.env.FIGMA_TOKEN || "" }, // Autenticazione con PAT
      }
    );

    const document: FigmaNode = figmaRes.data.document as FigmaNode; // Documento Figma (root)

    // 3. Walk ricorsivo per raccogliere i frame/schermate
    const screens: string[] = []; // Array dei nomi delle schermate

    function walk(node: FigmaNode) {
      // Visita DFS dei nodi
      if (
        node.type === "FRAME" || // Considera i frame come schermate
        node.type === "COMPONENT" || // Considera i componenti singoli
        node.type === "COMPONENT_SET" // E i set di componenti (varianti)
      ) {
        if (node.name) screens.push(node.name); // Colleziona il nome della schermata
      }
      if (node.children) {
        // Se ha figli, visita ricorsivamente
        node.children.forEach(walk);
      }
    }

    walk(document); // Avvia la visita dal nodo root

    // 4. Raccolta immagini dei frame principali (limite a 3 per sicurezza)
    const frameIds: string[] = [];
    function collectFrameIds(node: FigmaNode) {
      if (frameIds.length >= 3) return;
      if (node.type === "FRAME" && node.id) frameIds.push(node.id);
      if (node.children) node.children.forEach(collectFrameIds);
    }
    collectFrameIds(document);

    let imageDataUrls: string[] = [];
    if (frameIds.length > 0) {
      const idsParam = encodeURIComponent(frameIds.join(","));
      const imagesResp = await fetch(
        `https://api.figma.com/v1/images/${fileKey}?ids=${idsParam}&format=png`,
        { headers: { "X-Figma-Token": process.env.FIGMA_TOKEN as string } }
      );
      const imagesJson = await imagesResp.json();
      const urls: string[] = frameIds
        .map((id) => imagesJson.images?.[id])
        .filter(Boolean);
      // Fetch ogni immagine e codifica base64 (limitata alle prime 3)
      const buffers = await Promise.all(
        urls.slice(0, 3).map((u) => fetch(u).then((r) => r.arrayBuffer()))
      );
      imageDataUrls = buffers.map(
        (buf) => `data:image/png;base64,${Buffer.from(buf).toString("base64")}`
      );
    }

    // 5. Prompt per AI (stringa multi-linea per istruire il modello)
    const prompt = `
Sei un Product Manager e devi generare user stories per queste schermate di un'app:
${screens.join("\n")}

Formato:
- As a [tipo di utente], I want [goal], so that [benefit]
Acceptance criteria in Gherkin (Given/When/Then).
    `;

    const stories = await generateStories(prompt, imageDataUrls); // Invoca il modello AI (con immagini se disponibili)

    return NextResponse.json({ stories, screens }); // Risponde al client con stories e schermate
  } catch (err: unknown) {
    // Mappatura errori per feedback più chiaro
    if (axios.isAxiosError(err)) {
      // Errori provenienti da chiamate HTTP
      const status = err.response?.status; // Status HTTP se presente
      const detail =
        (err.response?.data && JSON.stringify(err.response.data)) || // Dettaglio della risposta
        err.message; // Messaggio generico
      if (status) {
        // Se c'è uno status, ritorna lo stesso al client
        console.error("Figma API error", status, detail); // Log di debug server
        return NextResponse.json(
          { error: `Figma API error (${status})` }, // Messaggio sintetico
          { status }
        );
      }
      if (err.code === "ECONNREFUSED") {
        // Connessione rifiutata (es. Ollama non attivo)
        console.error("AI provider non raggiungibile (Ollama?)"); // Log di debug
        return NextResponse.json(
          {
            error:
              "AI provider non raggiungibile. Avvia Ollama su 11434 o imposta AI_PROVIDER=openai",
          },
          { status: 502 }
        );
      }
    }
    const message = err instanceof Error ? err.message : String(err); // Normalizza il messaggio d'errore
    console.error(message); // Log generico
    return NextResponse.json({ error: "Errore interno" }, { status: 500 }); // Fallback 500
  }
}

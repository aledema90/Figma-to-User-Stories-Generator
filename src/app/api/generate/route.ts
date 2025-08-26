import { NextResponse } from "next/server";
import axios from "axios";
import { generateStories } from "../../lib/ai";

type FigmaNode = {
  type?: string;
  name?: string;
  children?: FigmaNode[];
};

function extractFileKey(figmaUrl: string): string | null {
  try {
    const url = new URL(figmaUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    // Expected forms: /file/<key>/..., /design/<key>/..., /proto/<key>/...
    if (parts.length >= 2) {
      const marker = parts[0];
      const key = parts[1];
      if (["file", "design", "proto"].includes(marker) && key) return key;
    }
    // Fallback simple regex
    const match = figmaUrl.match(/\/file\/([A-Za-z0-9]+)\//);
    if (match && match[1]) return match[1];
  } catch {
    // ignore URL parse errors
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const figmaUrl: string | undefined = body?.figmaUrl;

    if (!figmaUrl || typeof figmaUrl !== "string") {
      return NextResponse.json(
        { error: "Figma URL mancante o non valido" },
        { status: 400 }
      );
    }

    // 1. Estraggo il file key dall’URL
    const fileKey = extractFileKey(figmaUrl);
    if (!fileKey) {
      return NextResponse.json(
        { error: "Figma URL non valido" },
        { status: 400 }
      );
    }

    // 2. Chiamata API a Figma
    if (!process.env.FIGMA_TOKEN) {
      return NextResponse.json(
        { error: "FIGMA_TOKEN non configurato nel server" },
        { status: 500 }
      );
    }
    const figmaRes = await axios.get(
      `https://api.figma.com/v1/files/${fileKey}`,
      {
        headers: { "X-Figma-Token": process.env.FIGMA_TOKEN || "" },
      }
    );

    const document: FigmaNode = figmaRes.data.document as FigmaNode;

    // 3. Walk ricorsivo per raccogliere i frame/schermate
    const screens: string[] = [];

    function walk(node: FigmaNode) {
      if (
        node.type === "FRAME" ||
        node.type === "COMPONENT" ||
        node.type === "COMPONENT_SET"
      ) {
        if (node.name) screens.push(node.name);
      }
      if (node.children) {
        node.children.forEach(walk);
      }
    }

    walk(document);

    // 4. Prompt per AI
    const prompt = `
Sei un Product Manager e devi generare user stories per queste schermate di un'app:
${screens.join("\n")}

Formato:
- As a [tipo di utente], I want [goal], so that [benefit]
Acceptance criteria in Gherkin (Given/When/Then).
    `;

    const stories = await generateStories(prompt);

    return NextResponse.json({ stories, screens });
  } catch (err: unknown) {
    // Error mapping for better feedback
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const detail =
        (err.response?.data && JSON.stringify(err.response.data)) ||
        err.message;
      if (status) {
        console.error("Figma API error", status, detail);
        return NextResponse.json(
          { error: `Figma API error (${status})` },
          { status }
        );
      }
      if (err.code === "ECONNREFUSED") {
        console.error("AI provider non raggiungibile (Ollama?)");
        return NextResponse.json(
          {
            error:
              "AI provider non raggiungibile. Avvia Ollama su 11434 o imposta AI_PROVIDER=openai",
          },
          { status: 502 }
        );
      }
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

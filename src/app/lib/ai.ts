import axios from "axios";
import OpenAI from "openai";

const aiProvider = process.env.AI_PROVIDER || "ollama";

export async function generateStories(prompt: string): Promise<string> {
  if (aiProvider === "openai") {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    return completion.choices[0].message?.content || "Nessuna story generata.";
  }

  // Default: Ollama (richiede stream: false per avere la risposta completa)
  const response = await axios.post("http://localhost:11434/api/generate", {
    model: process.env.OLLAMA_MODEL || "llama3",
    prompt: prompt,
    stream: false,
  });

  const text: string | undefined = response?.data?.response;
  return (text && text.trim()) || "Nessuna story generata.";
}

"use client";
import { useState } from "react";

export default function Home() {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [stories, setStories] = useState<string>("");
  const [screens, setScreens] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

  async function handleGenerate() {
    setError("");
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ figmaUrl }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data?.error || "Errore nella generazione");
      setStories("");
      setScreens([]);
      return;
    }
    setStories(data.stories);
    setScreens(data.screens || []);
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Figma to Stories</h1>
      <input
        type="text"
        value={figmaUrl}
        onChange={(e) => setFigmaUrl(e.target.value)}
        placeholder="Paste your Figma URL"
        style={{ width: "400px", marginRight: "10px" }}
      />
      <button onClick={handleGenerate}>Generate</button>
      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      {stories && !error && (
        <div style={{ marginTop: 20 }}>
          <h2>Schermate trovate:</h2>
          <ul>
            {screens.map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>

          <h2>User Stories generate:</h2>
          <pre style={{ background: "#eee", padding: 20 }}>{stories}</pre>
        </div>
      )}
    </main>
  );
}

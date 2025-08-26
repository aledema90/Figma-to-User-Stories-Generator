"use client"; // Rende questo file un Client Component
import { useState } from "react"; // Importa l'hook di stato di React

export default function Home() {
  // Componente principale della pagina
  const [figmaUrl, setFigmaUrl] = useState(""); // Stato per l'URL Figma inserito
  const [stories, setStories] = useState<string>(""); // Stato per il testo delle user stories generate
  const [screens, setScreens] = useState<string[]>([]); // Stato per la lista di schermate trovate
  const [error, setError] = useState<string>(""); // Stato per il messaggio di errore da mostrare

  async function handleGenerate() {
    // Gestisce il click su "Generate"
    setError(""); // Pulisce eventuali errori precedenti
    const response = await fetch("/api/generate", {
      // Chiama l'endpoint server-side
      method: "POST", // Metodo HTTP
      headers: { "Content-Type": "application/json" }, // Payload in JSON
      body: JSON.stringify({ figmaUrl }), // Invia l'URL Figma al server
    });
    console.log("/api/generate status:", response.status); // Logga lo status HTTP
    const data = await response.json(); // Parsea la risposta JSON
    console.log("AI responded:", Boolean(data?.stories)); // True se il modello ha risposto
    if (!response.ok) {
      // Se status non è 2xx
      if (response.status === 400) {
        // Gestione specifica per 400
        setError(
          data?.error ||
            "URL Figma non valido. Usa un link del tipo: https://www.figma.com/file/<FILE_KEY>/..."
        );
      } else {
        setError(data?.error || "Errore nella generazione"); // Messaggio generico
      }
      setStories(""); // Svuota storie
      setScreens([]); // Svuota schermate
      return; // Interrompe il flusso
    }
    setStories(data.stories); // Salva le user stories generate
    setScreens(data.screens || []); // Salva la lista delle schermate
  }

  return (
    // Render del componente
    <main style={{ padding: 40 }}>
      {" "}
      {/* Contenitore principale con padding */}
      <h1>Figma to Stories</h1> {/* Titolo della pagina */}
      <input
        type="text"
        value={figmaUrl}
        onChange={(e) => setFigmaUrl(e.target.value)}
        placeholder="Paste your Figma URL"
        style={{ width: "400px", marginRight: "10px" }}
      />{" "}
      {/* Campo di input per incollare l'URL Figma */}
      <button onClick={handleGenerate}>Generate</button>{" "}
      {/* Avvia la generazione */}
      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}{" "}
      {/* Messaggio di errore */}
      {stories && !error && (
        <div style={{ marginTop: 20 }}>
          {" "}
          {/* Contenitore dei risultati */}
          <h2>Schermate trovate:</h2> {/* Intestazione lista schermate */}
          <ul>
            {screens.map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>{" "}
          {/* Lista delle schermate */}
          <h2>User Stories generate:</h2> {/* Intestazione user stories */}
          <pre style={{ background: "#eee", padding: 20 }}>{stories}</pre>{" "}
          {/* Testo delle stories */}
        </div>
      )}
    </main>
  );
}

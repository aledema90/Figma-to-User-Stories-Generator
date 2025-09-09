"use client";

import { useState } from "react";
import { Upload, ExternalLink, CheckCircle } from "lucide-react";
import { FigmaFrame, AnalysisSession } from "../lib/types.ts";

interface FigmaImporterProps {
  onFramesImported: (frames: FigmaFrame[], fileId: string) => void;
  selectedFrames: FigmaFrame[];
  onFrameSelectionChange: (frames: FigmaFrame[]) => void;
  currentSession: AnalysisSession | null;
}

export default function FigmaImporter({
  onFramesImported,
  selectedFrames,
  onFrameSelectionChange,
  currentSession,
}: FigmaImporterProps) {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const extractFileId = (url: string): string | null => {
    const match = url.match(/figma\.com\/file\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const handleImport = async () => {
    const fileId = extractFileId(figmaUrl);
    if (!fileId) {
      setError("Please enter a valid Figma file URL");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/figma", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        throw new Error("Failed to import frames");
      }

      const frames: FigmaFrame[] = await response.json();
      onFramesImported(frames, fileId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import frames");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFrameToggle = (frame: FigmaFrame) => {
    const isSelected = selectedFrames.some((f) => f.id === frame.id);
    if (isSelected) {
      onFrameSelectionChange(selectedFrames.filter((f) => f.id !== frame.id));
    } else {
      onFrameSelectionChange([...selectedFrames, frame]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Import Section */}
      <div className="card">
        <h2 className="text-xl font-semibold text-warm-gray-900 mb-4">
          Import Figma Frames
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-warm-gray-700 mb-2">
              Figma File URL
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={figmaUrl}
                onChange={(e) => setFigmaUrl(e.target.value)}
                placeholder="https://www.figma.com/file/..."
                className="flex-1 px-3 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-transparent"
              />
              <button
                onClick={handleImport}
                disabled={isLoading || !figmaUrl}
                className="btn-primary flex items-center space-x-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                <span>Import</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-warm-red-50 border border-warm-red-200 rounded-lg">
              <p className="text-warm-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

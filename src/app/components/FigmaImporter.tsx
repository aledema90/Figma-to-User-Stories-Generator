"use client";

import { useState } from "react";
import { Upload, ExternalLink, CheckCircle } from "lucide-react";
import { FigmaFrame, AnalysisSession } from "../lib/types";

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
    // Support both /file/ and /design/ URLs
    const fileMatch = url.match(/figma\.com\/file\/([a-zA-Z0-9]+)/);
    const designMatch = url.match(/figma\.com\/design\/([a-zA-Z0-9]+)/);

    return fileMatch ? fileMatch[1] : designMatch ? designMatch[1] : null;
  };

  const extractNodeId = (url: string): string | null => {
    // Extract node-id from URL parameters
    const nodeMatch = url.match(/node-id=([^&]+)/);
    return nodeMatch ? decodeURIComponent(nodeMatch[1]) : null;
  };

  const handleImport = async () => {
    const fileId = extractFileId(figmaUrl);
    const nodeId = extractNodeId(figmaUrl);

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
        body: JSON.stringify({ fileId, nodeId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to import frames");
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
                placeholder="https://www.figma.com/file/... or https://www.figma.com/design/... (supports specific frames too!)"
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

          {figmaUrl && (
            <div className="p-3 bg-warm-blue-50 border border-warm-blue-200 rounded-lg">
              <p className="text-warm-blue-700 text-sm">
                {extractNodeId(figmaUrl)
                  ? `🎯 Specific frame detected: ${extractNodeId(
                      figmaUrl
                    )} (will fallback to full file if frame not found)`
                  : "📁 Full file will be imported"}
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-warm-red-50 border border-warm-red-200 rounded-lg">
              <p className="text-warm-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Frame Selection Section */}
      {currentSession && currentSession.frames.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-warm-gray-900 mb-4">
            Select Frames to Analyze
          </h2>

          <div className="space-y-3">
            {currentSession.frames.map((frame) => {
              const isSelected = selectedFrames.some((f) => f.id === frame.id);
              return (
                <div
                  key={frame.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? "border-warm-500 bg-warm-50"
                      : "border-warm-200 hover:border-warm-300"
                  }`}
                  onClick={() => handleFrameToggle(frame)}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? "border-warm-500 bg-warm-500"
                          : "border-warm-300"
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle size={12} className="text-white" />
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-medium text-warm-gray-900">
                        {frame.name}
                      </h3>
                      <p className="text-sm text-warm-gray-500">
                        {frame.metadata.width} × {frame.metadata.height}px •{" "}
                        {frame.metadata.type}
                        {frame.fileSize && (
                          <span className="ml-2">
                            • {(frame.fileSize / 1024 / 1024).toFixed(1)} MB
                          </span>
                        )}
                      </p>
                    </div>

                    {frame.imageUrl && (
                      <div className="w-20 h-14 bg-warm-100 rounded border overflow-hidden">
                        <img
                          src={frame.imageUrl}
                          alt={frame.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-warm-blue-50 border border-warm-blue-200 rounded-lg">
            <p className="text-warm-blue-700 text-sm">
              {selectedFrames.length === 0
                ? "Select frames above to generate user stories"
                : `${selectedFrames.length} frame${
                    selectedFrames.length > 1 ? "s" : ""
                  } selected`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

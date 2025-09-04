// src/app/page.tsx
"use client";

import { useState } from "react";
import FigmaImporter from "./components/FigmaImporter";
import UserStoryGenerator from "./components/UserStoryGenerator";
import { FigmaFrame, UserStory, AnalysisSession } from "./lib/types";

export default function Home() {
  const [currentSession, setCurrentSession] = useState<AnalysisSession | null>(
    null
  );
  const [selectedFrames, setSelectedFrames] = useState<FigmaFrame[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFramesImported = (frames: FigmaFrame[], fileId: string) => {
    const newSession: AnalysisSession = {
      id: `session-${Date.now()}`,
      figmaFileId: fileId,
      frames,
      userStories: [],
      createdAt: new Date(),
    };

    setCurrentSession(newSession);
    setSelectedFrames([]);
  };

  const handleStoriesGenerated = (stories: UserStory[]) => {
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        userStories: stories,
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-warm-gray-900 mb-4">
          Transform Figma Designs into User Stories
        </h1>
        <p className="text-xl text-warm-gray-600 max-w-2xl mx-auto">
          Upload your Figma frames and let AI generate comprehensive user
          stories for your product backlog. Perfect for PMs who want to move
          fast.
        </p>
      </div>

      {/* Main Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Import */}
        <div className="space-y-6">
          <FigmaImporter
            onFramesImported={handleFramesImported}
            selectedFrames={selectedFrames}
            onFrameSelectionChange={setSelectedFrames}
            currentSession={currentSession}
          />
        </div>

        {/* Right Column: Generate & Results */}
        <div className="space-y-6">
          {currentSession && (
            <UserStoryGenerator
              session={currentSession}
              selectedFrames={selectedFrames}
              onStoriesGenerated={handleStoriesGenerated}
              isAnalyzing={isAnalyzing}
              onAnalyzingChange={setIsAnalyzing}
            />
          )}
        </div>
      </div>

      {/* Results Summary */}
      {currentSession &&
        currentSession.userStories &&
        currentSession.userStories.length > 0 && (
          <div className="mt-12">
            <div className="bg-white rounded-xl shadow-sm border border-warm-200 p-6">
              <h3 className="text-lg font-semibold text-warm-gray-900 mb-4">
                Analysis Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="bg-warm-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-warm-600">
                    {currentSession.frames.length}
                  </div>
                  <div className="text-sm text-warm-gray-600">
                    Frames Analyzed
                  </div>
                </div>
                <div className="bg-warm-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-warm-600">
                    {currentSession?.userStories?.length ?? 0}
                  </div>
                  <div className="text-sm text-warm-gray-600">
                    Stories Generated
                  </div>
                </div>
                <div className="bg-warm-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-warm-600">
                    {currentSession?.userStories?.filter(
                      (s) => s.priority === "High"
                    )?.length ?? 0}
                  </div>
                  <div className="text-sm text-warm-gray-600">
                    High Priority
                  </div>
                </div>
                <div className="bg-warm-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-warm-600">
                    {currentSession?.userStories?.reduce(
                      (sum, s) => sum + (s.storyPoints ?? 0),
                      0
                    ) ?? 0}
                  </div>
                  <div className="text-sm text-warm-gray-600">
                    Total Story Points
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

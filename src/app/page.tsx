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
    </div>
  );
}

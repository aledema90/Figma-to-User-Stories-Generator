import { useState } from 'react';
import { AnalysisSession, FigmaFrame, UserStory } from '../lib/types';

interface UserStoryGeneratorProps {
  session: AnalysisSession;
  selectedFrames: FigmaFrame[];
  onStoriesGenerated: (stories: UserStory[]) => void;
  isAnalyzing: boolean;
  onAnalyzingChange: (analyzing: boolean) => void;
}

export default function UserStoryGenerator({
  session,
  selectedFrames,
  onStoriesGenerated,
  isAnalyzing,
  onAnalyzingChange
}: UserStoryGeneratorProps) {
  const [error, setError] = useState<string | null>(null);

  const handleGenerateStories = async () => {
    if (selectedFrames.length === 0) {
      setError('Please select at least one frame to analyze');
      return;
    }

    try {
      onAnalyzingChange(true);
      setError(null);

      const response = await fetch('/api/ollama', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frames: selectedFrames,
          fileId: session.figmaFileId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate user stories');
      }

      const stories: UserStory[] = await response.json();
      onStoriesGenerated(stories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      onAnalyzingChange(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-warm-gray-900">
          Generate User Stories
        </h2>
        <button
          onClick={handleGenerateStories}
          disabled={isAnalyzing || selectedFrames.length === 0}
          className={`px-4 py-2 rounded-md text-white ${
            isAnalyzing || selectedFrames.length === 0
              ? 'bg-warm-gray-400 cursor-not-allowed'
              : 'bg-warm-gray-800 hover:bg-warm-gray-900'
          }`}
        >
          {isAnalyzing ? 'Analyzing...' : 'Generate Stories'}
        </button>
      </div>

      {error && (
        <div className="text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-warm-gray-50 rounded-md p-4">
        <h3 className="text-sm font-medium text-warm-gray-700 mb-2">
          Selected Frames
        </h3>
        {selectedFrames.length === 0 ? (
          <p className="text-warm-gray-500">
            Select frames from the left panel to generate user stories
          </p>
        ) : (
          <ul className="space-y-1">
            {selectedFrames.map((frame) => (
              <li
                key={frame.id}
                className="text-sm text-warm-gray-600"
              >
                {frame.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

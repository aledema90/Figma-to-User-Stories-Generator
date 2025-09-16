export interface FigmaFrame {
  id: string;
  name: string;
  imageUrl: string;
  fileSize?: number; // Size in bytes
  metadata: {
    width: number;
    height: number;
    type: string;
  };
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  priority: "High" | "Medium" | "Low";
  storyPoints: number;
  persona: string;
  category: string;
}

export interface AnalysisSession {
  id: string;
  figmaFileId: string;
  frames: FigmaFrame[];
  userStories: UserStory[];
  createdAt: Date;
  context?: string;
}

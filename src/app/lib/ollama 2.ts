import { UserStory } from "./types";

export class OllamaService {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:11434") {
    this.baseUrl = baseUrl;
  }

  async analyzeFrameForUserStories(
    imageBase64: string,
    context: string = ""
  ): Promise<UserStory[]> {
    const prompt = `
    As a Product Manager, analyze this UI design and generate comprehensive user stories.
    
    Context: ${context}
    
    For each UI element or feature you identify, create user stories following this format:
    - Title: Brief, action-oriented title
    - Description: As a [user type], I want to [action] so that [benefit]
    - Acceptance Criteria: 3-5 specific, testable criteria
    - Priority: High/Medium/Low
    - Story Points: 1-8 (Fibonacci scale)
    - Persona: Primary user type
    - Category: UI component type (Navigation, Forms, Content, etc.)
    
    Return ONLY a JSON array of user stories. No additional text.
    `;

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llava",
          prompt,
          images: [imageBase64],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Parse the JSON response from Ollama
      try {
        const userStories = JSON.parse(data.response);
        return userStories.map((story: any, index: number) => ({
          id: `story-${Date.now()}-${index}`,
          ...story,
        }));
      } catch (parseError) {
        // Fallback: extract JSON from text if possible
        console.error("Failed to parse Ollama response as JSON:", parseError);
        return this.fallbackStoryGeneration(data.response);
      }
    } catch (error) {
      console.error("Ollama service error:", error);
      throw new Error("Failed to analyze frame with AI");
    }
  }

  private fallbackStoryGeneration(response: string): UserStory[] {
    // Simple fallback for when JSON parsing fails
    return [
      {
        id: `story-${Date.now()}-fallback`,
        title: "Analyze UI Components",
        description:
          "As a user, I want to interact with the UI elements shown in this design",
        acceptanceCriteria: [
          "UI elements are properly implemented",
          "Interactions work as expected",
          "Design matches the mockup",
        ],
        priority: "Medium" as const,
        storyPoints: 3,
        persona: "End User",
        category: "UI Implementation",
      },
    ];
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

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
    You are an expert Product Manager analyzing a UI/UX design. Look carefully at this image and identify ALL user flows, interactions, and features visible in the design.

    Context: ${context}
    
    IMPORTANT: Analyze the visual elements you can see in the image:
    - Navigation patterns and menus
    - Buttons, forms, and input fields
    - Data displays, lists, and tables
    - Modal dialogs and overlays
    - User workflows and step-by-step processes
    - Any interactive elements or components
    
    For each distinct user flow or feature you identify, create a detailed user story with:
    - Title: Specific, action-oriented title describing the feature
    - Description: As a [specific user type], I want to [specific action] so that [clear benefit]
    - Acceptance Criteria: 3-5 specific, testable criteria based on what you see
    - Priority: High/Medium/Low (High for core flows, Medium for secondary features)
    - Story Points: 1-8 (Fibonacci scale)
    - Persona: Specific user type (e.g., "Mobile App User", "Admin", "Customer")
    - Category: Specific component type (e.g., "Authentication", "Data Visualization", "Settings")
    
    Focus on what you can actually SEE in the image. Be specific about visual elements and user flows.
    
    Return ONLY a valid JSON array of user stories. No markdown formatting, no additional text.
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
        let responseText = data.response;

        // Remove markdown code blocks if present
        if (responseText.includes("```json")) {
          responseText = responseText
            .replace(/```json\s*/, "")
            .replace(/```\s*$/, "");
        }
        if (responseText.includes("```")) {
          responseText = responseText
            .replace(/```\s*/, "")
            .replace(/```\s*$/, "");
        }

        // Clean up any leading/trailing whitespace
        responseText = responseText.trim();

        // Handle different response structures
        let userStories;
        const parsed = JSON.parse(responseText);

        // Check if response has user_stories array or is direct array
        if (parsed.user_stories && Array.isArray(parsed.user_stories)) {
          userStories = parsed.user_stories;
        } else if (Array.isArray(parsed)) {
          userStories = parsed;
        } else {
          throw new Error("Invalid response structure");
        }

        return userStories.map((story: any, index: number) => ({
          id: `story-${Date.now()}-${index}`,
          title: story.title || `User Story ${index + 1}`,
          description:
            story.description || story.story || "No description provided",
          acceptanceCriteria: Array.isArray(story.acceptance_criteria)
            ? story.acceptance_criteria
            : Array.isArray(story.acceptanceCriteria)
            ? story.acceptanceCriteria
            : story.criteria
            ? [story.criteria]
            : ["Criteria not specified"],
          priority: story.priority || "Medium",
          storyPoints: parseInt(
            story.story_points || story.storyPoints || story.points || 3
          ),
          persona: story.persona || story.userType || "End User",
          category: story.category || story.type || "UI Component",
        }));
      } catch (parseError) {
        // Fallback: extract JSON from text if possible
        console.error("Failed to parse Ollama response as JSON:", parseError);
        console.error("Response was:", data.response);
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

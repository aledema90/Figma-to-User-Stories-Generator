// src/app/api/ollama/route.ts
import { NextRequest, NextResponse } from "next/server";
import { OllamaService } from "../../lib/ollama";

export async function POST(req: NextRequest) {
  try {
    const { frames, context } = await req.json();

    if (!frames || frames.length === 0) {
      return NextResponse.json(
        { error: "Frames are required" },
        { status: 400 }
      );
    }

    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const ollamaService = new OllamaService(ollamaUrl);

    // Check if Ollama is healthy
    const isHealthy = await ollamaService.isHealthy();
    if (!isHealthy) {
      return NextResponse.json(
        {
          error:
            "Ollama service is not available. Make sure it's running locally.",
        },
        { status: 503 }
      );
    }

    const allStories = [];

    // Process each frame
    for (const frame of frames) {
      try {
        console.log(
          `Processing frame: ${frame.name}, Image URL: ${frame.imageUrl}`
        );

        // Convert image URL to base64
        const imageResponse = await fetch(frame.imageUrl);
        if (!imageResponse.ok) {
          console.warn(
            `Failed to fetch image for frame ${frame.name}: ${imageResponse.status}`
          );
          continue;
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString("base64");

        console.log(
          `Image converted to base64, size: ${base64Image.length} characters`
        );

        const frameContext = `Frame: ${frame.name} (${frame.metadata.width}x${frame.metadata.height}) - ${frame.metadata.type}`;
        const stories = await ollamaService.analyzeFrameForUserStories(
          base64Image,
          frameContext
        );

        console.log(
          `Generated ${stories.length} stories for frame ${frame.name}`
        );
        allStories.push(...stories);
      } catch (frameError) {
        console.error(`Error processing frame ${frame.name}:`, frameError);
        // Continue with other frames even if one fails
      }
    }

    if (allStories.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate any user stories" },
        { status: 500 }
      );
    }

    return NextResponse.json(allStories);
  } catch (error) {
    console.error("Ollama API error:", error);
    return NextResponse.json(
      { error: "Failed to generate user stories" },
      { status: 500 }
    );
  }
}

// Check Ollama health endpoint
export async function GET() {
  try {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const ollamaService = new OllamaService(ollamaUrl);
    const isHealthy = await ollamaService.isHealthy();

    return NextResponse.json({
      healthy: isHealthy,
      url: ollamaUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        healthy: false,
        error: "Failed to check Ollama status",
      },
      { status: 500 }
    );
  }
}

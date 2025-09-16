// src/app/api/figma/route.ts
import { NextRequest, NextResponse } from "next/server";
import { FigmaService } from "../../lib/figma";

export async function POST(req: NextRequest) {
  try {
    const { fileId, nodeId } = await req.json();

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    const figmaToken = process.env.FIGMA_ACCESS_TOKEN;
    if (!figmaToken) {
      return NextResponse.json(
        {
          error:
            "Figma access token not configured. Please add FIGMA_ACCESS_TOKEN to your .env.local file",
          details:
            "Create a .env.local file in your project root with: FIGMA_ACCESS_TOKEN=your_token_here",
        },
        { status: 500 }
      );
    }

    const figmaService = new FigmaService(figmaToken);

    // If nodeId is provided, try to get that specific frame first
    if (nodeId) {
      try {
        console.log(`Attempting to get specific frame: ${nodeId}`);
        const frames = await figmaService.getSpecificFrame(fileId, nodeId);
        console.log(`Successfully got specific frame`);
        return NextResponse.json(frames);
      } catch (error) {
        console.warn(`Failed to get specific frame ${nodeId}:`, error);
        console.log(`Falling back to full file import`);
        // Fallback to full file import if specific frame fails
      }
    }

    // Get all frames from the file (with limits for large files)
    const frames = await figmaService.getFileFrames(fileId);
    return NextResponse.json(frames);
  } catch (error) {
    console.error("Figma API error:", error);

    // Provide more specific error messages
    let errorMessage = "Failed to fetch frames from Figma";
    if (error instanceof Error) {
      if (error.message.includes("401")) {
        errorMessage = "Invalid Figma access token. Please check your token.";
      } else if (error.message.includes("403")) {
        errorMessage =
          "Access denied. Make sure you have access to this Figma file.";
      } else if (error.message.includes("404")) {
        errorMessage = "Figma file not found. Please check the file ID.";
      } else if (error.message.includes("Cannot create a string longer")) {
        errorMessage =
          "The Figma file is too large to process. Please try with a smaller file or fewer frames.";
      } else if (error.message.includes("Response too large")) {
        errorMessage = error.message;
      } else {
        errorMessage = `Figma API error: ${error.message}`;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

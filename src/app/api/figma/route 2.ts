// src/app/api/figma/route.ts
import { NextRequest, NextResponse } from "next/server";
import { FigmaService } from "../../lib/figma";

export async function POST(req: NextRequest) {
  try {
    const { fileId } = await req.json();

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    const figmaToken = process.env.FIGMA_ACCESS_TOKEN;
    if (!figmaToken) {
      return NextResponse.json(
        { error: "Figma access token not configured" },
        { status: 500 }
      );
    }

    const figmaService = new FigmaService(figmaToken);
    const frames = await figmaService.getFileFrames(fileId);

    return NextResponse.json(frames);
  } catch (error) {
    console.error("Figma API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch frames from Figma" },
      { status: 500 }
    );
  }
}

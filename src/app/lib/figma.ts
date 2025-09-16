import { FigmaFrame } from "./types";

export class FigmaService {
  private apiKey: string;
  private baseUrl = "https://api.figma.com/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(
    endpoint: string,
    options: { streaming?: boolean } = {}
  ) {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          "X-Figma-Token": this.apiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Figma API error: ${response.statusText}`);
      }

      // Check content length before parsing
      const contentLength = response.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
        throw new Error(
          "Response too large. Please try with a smaller Figma file or fewer frames."
        );
      }

      if (options.streaming) {
        // For large responses, we'll handle them differently
        return response;
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          "Request timeout. The Figma file may be too large or the API is slow to respond."
        );
      }
      throw error;
    }
  }

  async getFile(fileId: string) {
    return this.makeRequest(`/files/${fileId}`);
  }

  async getFileMetadata(fileId: string) {
    // First, try to get just the file metadata to check size
    try {
      const response = await this.makeRequest(`/files/${fileId}`, {
        streaming: true,
      });
      const contentLength = response.headers.get("content-length");

      if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
        // 10MB warning
        console.warn(
          `Large file detected: ${Math.round(
            parseInt(contentLength) / 1024 / 1024
          )}MB`
        );
      }

      // If it's too large, we'll use a different strategy
      if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
        throw new Error("File too large to process safely");
      }

      // Now parse the response
      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes("File too large")) {
        throw error;
      }
      // Fallback to regular request for smaller files
      return this.makeRequest(`/files/${fileId}`);
    }
  }

  async getFileFrames(
    fileId: string,
    maxFrames: number = 50
  ): Promise<FigmaFrame[]> {
    try {
      // First check file size and get metadata safely
      const file = await this.getFileMetadata(fileId);
      const frames = this.extractFrames(file.document);

      // Limit the number of frames to prevent large responses
      const limitedFrames = frames.slice(0, maxFrames);

      if (frames.length > maxFrames) {
        console.warn(
          `File contains ${frames.length} frames, limiting to ${maxFrames}`
        );
      }

      // Get images for each frame in batches to avoid overwhelming the API
      const frameImages = await this.getFrameImagesInBatches(
        fileId,
        limitedFrames.map((f) => f.id)
      );

      return limitedFrames.map((frame) => ({
        ...frame,
        imageUrl: frameImages[frame.id] || "",
      }));
    } catch (error) {
      if (error instanceof Error && error.message.includes("File too large")) {
        // For very large files, try to get just frame names without images
        return this.getFileFramesWithoutImages(fileId, maxFrames);
      }
      throw error;
    }
  }

  async getFileFramesWithoutImages(
    fileId: string,
    maxFrames: number = 50
  ): Promise<FigmaFrame[]> {
    // Alternative method for very large files - get only frame metadata
    const file = await this.getFile(fileId);
    const frames = this.extractFrames(file.document);

    // Limit the number of frames
    const limitedFrames = frames.slice(0, maxFrames);

    // Return frames without images
    return limitedFrames.map((frame) => ({
      ...frame,
      imageUrl: "", // No images for large files
    }));
  }

  async getSpecificFrame(
    fileId: string,
    nodeId: string
  ): Promise<FigmaFrame[]> {
    // Get a specific frame/node from the file
    try {
      console.log(`Requesting specific node: ${nodeId} from file: ${fileId}`);
      const response = await this.makeRequest(
        `/files/${fileId}/nodes?ids=${nodeId}`
      );

      console.log(`API Response for node ${nodeId}:`, {
        hasNodes: !!response.nodes,
        nodeKeys: response.nodes ? Object.keys(response.nodes) : [],
        targetNode: response.nodes ? response.nodes[nodeId] : null,
      });

      if (!response.nodes || !response.nodes[nodeId]) {
        // Try with different node-id formats
        const alternativeNodeId = nodeId.replace(/-/g, ":");
        console.log(`Trying alternative format: ${alternativeNodeId}`);

        const altResponse = await this.makeRequest(
          `/files/${fileId}/nodes?ids=${alternativeNodeId}`
        );
        if (altResponse.nodes && altResponse.nodes[alternativeNodeId]) {
          console.log(
            `Found node with alternative format: ${alternativeNodeId}`
          );
          const node = altResponse.nodes[alternativeNodeId].document;
          return [await this.createFrameFromNode(node, fileId)];
        }

        throw new Error(
          `Frame with ID ${nodeId} not found. Available nodes: ${
            response.nodes ? Object.keys(response.nodes).join(", ") : "none"
          }`
        );
      }

      const node = response.nodes[nodeId].document;
      return [await this.createFrameFromNode(node, fileId)];
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        throw error;
      }
      // Fallback to regular file processing if specific frame fails
      throw new Error(
        `Failed to get specific frame: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async createFrameFromNode(
    node: any,
    fileId: string
  ): Promise<FigmaFrame> {
    const frame: FigmaFrame = {
      id: node.id,
      name: node.name,
      imageUrl: "",
      metadata: {
        width: node.absoluteBoundingBox?.width || 0,
        height: node.absoluteBoundingBox?.height || 0,
        type: node.type,
      },
    };

    // Get image for this specific frame and calculate size
    try {
      const frameImages = await this.getFrameImages(fileId, [frame.id]);
      frame.imageUrl = frameImages[frame.id] || "";

      // Calculate file size if image URL exists
      if (frame.imageUrl) {
        try {
          const response = await fetch(frame.imageUrl, { method: "HEAD" });
          const contentLength = response.headers.get("content-length");
          if (contentLength) {
            frame.fileSize = parseInt(contentLength);
          }
        } catch (sizeError) {
          console.warn("Failed to get image size:", sizeError);
        }
      }
    } catch (imageError) {
      console.warn("Failed to get frame image:", imageError);
      // Continue without image
    }

    return frame;
  }

  private extractFrames(node: any, frames: FigmaFrame[] = []): FigmaFrame[] {
    if (node.type === "FRAME") {
      frames.push({
        id: node.id,
        name: node.name,
        imageUrl: "",
        metadata: {
          width: node.absoluteBoundingBox?.width || 0,
          height: node.absoluteBoundingBox?.height || 0,
          type: node.type,
        },
      });
    }

    if (node.children) {
      node.children.forEach((child: any) => this.extractFrames(child, frames));
    }

    return frames;
  }

  async getFrameImages(
    fileId: string,
    frameIds: string[]
  ): Promise<Record<string, string>> {
    const response = await this.makeRequest(
      `/images/${fileId}?ids=${frameIds.join(",")}&format=png&scale=2`
    );
    return response.images;
  }

  private async getFrameImagesInBatches(
    fileId: string,
    frameIds: string[],
    batchSize: number = 10
  ): Promise<Record<string, string>> {
    const allImages: Record<string, string> = {};

    // Process frames in batches to avoid overwhelming the API
    for (let i = 0; i < frameIds.length; i += batchSize) {
      const batch = frameIds.slice(i, i + batchSize);
      try {
        const batchImages = await this.getFrameImages(fileId, batch);
        Object.assign(allImages, batchImages);
      } catch (error) {
        console.warn(
          `Failed to get images for batch ${i / batchSize + 1}:`,
          error
        );
        // Continue with other batches even if one fails
      }
    }

    return allImages;
  }
}

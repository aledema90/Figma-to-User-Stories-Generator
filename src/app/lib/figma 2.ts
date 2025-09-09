export class FigmaService {
  private apiKey: string;
  private baseUrl = "https://api.figma.com/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        "X-Figma-Token": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getFile(fileId: string) {
    return this.makeRequest(`/files/${fileId}`);
  }

  async getFileFrames(fileId: string): Promise<FigmaFrame[]> {
    const file = await this.getFile(fileId);
    const frames = this.extractFrames(file.document);

    // Get images for each frame
    const frameImages = await this.getFrameImages(
      fileId,
      frames.map((f) => f.id)
    );

    return frames.map((frame) => ({
      ...frame,
      imageUrl: frameImages[frame.id] || "",
    }));
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
}

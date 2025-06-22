import type { Document } from "@langchain/core/documents";
import { PrismaVectorStore } from "@langchain/community/vectorstores/prisma";

import type { HookViralVideo } from "@sassy/db";
import type { ColorPalette } from "@sassy/gemini-video";
import { db, Prisma } from "@sassy/db";

import { createGoogleEmbeddings } from "./embeddings";

export interface VideoSearchResult {
  id: string;
  title: string;
  description: string | null;
  s3Url: string;
  views: number;
  likes: number;
  comments: number;
  durationSeconds: number;
  colorPalette?: ColorPalette | null;
  similarity?: number;
}

export class VideoVectorStore {
  private vectorStore: PrismaVectorStore<
    HookViralVideo,
    "HookViralVideo",
    any,
    any
  >;
  private embeddings: ReturnType<typeof createGoogleEmbeddings>;

  constructor() {
    this.embeddings = createGoogleEmbeddings();

    this.vectorStore = PrismaVectorStore.withModel<HookViralVideo>(db).create(
      this.embeddings,
      {
        prisma: Prisma,
        tableName: "HookViralVideo",
        vectorColumnName: "viralInfoEmbedding",
        columns: {
          id: PrismaVectorStore.IdColumn,
          description: PrismaVectorStore.ContentColumn,
          title: true,
          s3Url: true,
          views: true,
          likes: true,
          comments: true,
          durationSeconds: true,
        },
      },
    );
  }

  /**
   * Create direct color vector from color palette
   * Fixed size vector: 768 dimensions (padded to match existing column)
   * First 16 dimensions: 4 colors × 4 values (r, g, b, percentage)
   * Remaining 752 dimensions: zeros (padding)
   */
  private createDirectColorVector(colorPalette: ColorPalette): number[] {
    // Initialize 768-dimension vector with zeros to match existing column
    const vector = new Array(768).fill(0);

    // Take up to 4 most dominant colors and fill first 16 dimensions
    const colorsToProcess = colorPalette.slice(0, 4);

    colorsToProcess.forEach((color, index) => {
      const baseIndex = index * 4;

      // Normalize RGB values from 0-255 to 0-1 scale
      vector[baseIndex] = color.red / 255;
      vector[baseIndex + 1] = color.green / 255;
      vector[baseIndex + 2] = color.blue / 255;

      // Percentage is already in 0-1 scale
      vector[baseIndex + 3] = color.percentage;
    });

    // Remaining 752 dimensions stay as zeros (padding)
    return vector;
  }

  /**
   * Store color palette embedding in database
   */
  private async storeColorPaletteEmbedding(
    videoId: string,
    embedding: number[],
  ): Promise<void> {
    await db.$executeRaw`
      UPDATE "HookViralVideo" 
      SET "colorPaletteEmbedding" = ${`[${embedding.join(",")}]`}::vector
      WHERE id = ${videoId}
    `;
  }

  /**
   * Add a video with automatic embedding generation for both text and color
   */
  async addVideoWithEmbedding(video: {
    id: string;
    description: string | null;
    hookInfo?: string | null | undefined;
    title: string;
    s3Url: string;
    views: number;
    likes: number;
    comments: number;
    durationSeconds: number;
    colorPalette?: ColorPalette | null;
  }): Promise<void> {
    // Debug logging for colorPalette
    console.log(`🔍 DEBUG - Color palette type: ${typeof video.colorPalette}`);
    console.log(`🔍 DEBUG - Color palette value:`, video.colorPalette);
    console.log(
      `🔍 DEBUG - Color palette length: ${video.colorPalette?.length}`,
    );

    // Generate text embedding if content exists
    const hasContent =
      (video.description && video.description.trim()) || video.hookInfo?.trim();

    if (hasContent) {
      // Combine description and hookInfo for search embedding
      const searchContent = [video.description?.trim(), video.hookInfo?.trim()]
        .filter(Boolean)
        .join(" ");

      // Create a video object with the combined content for embedding
      const videoForEmbedding = {
        ...video,
        description: searchContent,
      } as HookViralVideo;

      // Add the video record with text embedding generation handled by LangChain
      await this.vectorStore.addModels([videoForEmbedding]);
      console.log(`✅ Text vector embedding generated and saved`);
    } else {
      console.log(
        `ℹ️ No description or hook info available, skipping text vector embedding`,
      );
    }

    // Generate direct color vector if color palette exists
    if (video.colorPalette && video.colorPalette.length > 0) {
      try {
        console.log(`🎨 Generating direct color vector embedding...`);

        const colorVector = this.createDirectColorVector(video.colorPalette);
        await this.storeColorPaletteEmbedding(video.id, colorVector);

        console.log(
          `✅ Direct color vector embedding generated and saved (${colorVector.length} dimensions)`,
        );
      } catch (error) {
        console.warn(`⚠️ Failed to generate color vector embedding:`, error);
        throw error;
      }
    } else {
      console.log(
        `ℹ️ No color palette available, skipping color vector embedding`,
      );
      console.log(
        `🔍 DEBUG - Condition check failed: colorPalette=${!!video.colorPalette}, length=${video.colorPalette?.length}`,
      );
    }
  }

  /**
   * Find similar videos based on text query only
   */
  async findSimilarVideosByText(
    queryText: string,
    limit = 3,
  ): Promise<VideoSearchResult[]> {
    const results = await this.vectorStore.similaritySearch(queryText, limit);
    return results.map((doc) => this.mapDocumentToVideoResult(doc));
  }

  /**
   * Find similar videos based on color palette only
   */
  async findSimilarVideosByColor(
    colorPalette: ColorPalette,
    limit = 3,
  ): Promise<VideoSearchResult[]> {
    const colorVector = this.createDirectColorVector(colorPalette);

    const results = await db.$queryRaw<
      {
        id: string;
        title: string;
        description: string | null;
        s3Url: string;
        views: number;
        likes: number;
        comments: number;
        durationSeconds: number;
        colorPalette: any;
        similarity: number;
      }[]
    >`
      SELECT 
        id, title, description, "s3Url", views, likes, comments, "durationSeconds", "colorPalette",
        1 - ("colorPaletteEmbedding" <=> ${`[${colorVector.join(",")}]`}::vector) as similarity
      FROM "HookViralVideo"
      WHERE "colorPaletteEmbedding" IS NOT NULL
      ORDER BY "colorPaletteEmbedding" <=> ${`[${colorVector.join(",")}]`}::vector
      LIMIT ${limit}
    `;

    return results.map((result) => ({
      id: result.id,
      title: result.title,
      description: result.description,
      s3Url: result.s3Url,
      views: result.views,
      likes: result.likes,
      comments: result.comments,
      durationSeconds: result.durationSeconds,
      colorPalette: result.colorPalette,
      similarity: result.similarity,
    }));
  }

  /**
   * Find similar videos by color palette within a specific set of video IDs
   */
  async findSimilarVideosByColorWithinSet(
    colorPalette: ColorPalette,
    videoIds: string[],
    limit = 3,
  ): Promise<VideoSearchResult[]> {
    if (videoIds.length === 0) {
      return [];
    }

    const colorVector = this.createDirectColorVector(colorPalette);

    const results = await db.$queryRaw<
      {
        id: string;
        title: string;
        description: string | null;
        s3Url: string;
        views: number;
        likes: number;
        comments: number;
        durationSeconds: number;
        colorPalette: any;
        similarity: number;
      }[]
    >`
      SELECT 
        id, title, description, "s3Url", views, likes, comments, "durationSeconds", "colorPalette",
        1 - ("colorPaletteEmbedding" <=> ${`[${colorVector.join(",")}]`}::vector) as similarity
      FROM "HookViralVideo"
      WHERE "colorPaletteEmbedding" IS NOT NULL
        AND id = ANY(${videoIds})
      ORDER BY "colorPaletteEmbedding" <=> ${`[${colorVector.join(",")}]`}::vector
      LIMIT ${limit}
    `;

    return results.map((result) => ({
      id: result.id,
      title: result.title,
      description: result.description,
      s3Url: result.s3Url,
      views: result.views,
      likes: result.likes,
      comments: result.comments,
      durationSeconds: result.durationSeconds,
      colorPalette: result.colorPalette,
      similarity: result.similarity,
    }));
  }

  /**
   * Sequential search: First by text, then by color within results
   * This is the preferred approach for topic-first workflow
   */
  async findSimilarVideosSequential(params: {
    textQuery: string;
    colorPalette: ColorPalette;
    textResultLimit?: number;
    finalLimit?: number;
  }): Promise<VideoSearchResult[]> {
    const {
      textQuery,
      colorPalette,
      textResultLimit = 100,
      finalLimit = 10,
    } = params;

    console.log(
      `🔍 Stage 1: Finding ${textResultLimit} videos by topic similarity...`,
    );

    // Stage 1: Get topic-relevant videos
    const textResults = await this.findSimilarVideosByText(
      textQuery,
      textResultLimit,
    );

    if (textResults.length === 0) {
      console.log(`ℹ️ No videos found for text query: "${textQuery}"`);
      return [];
    }

    console.log(
      `🎨 Stage 2: Finding ${finalLimit} videos by color similarity within topic matches...`,
    );

    // Stage 2: Apply color matching within the text results
    const videoIds = textResults.map((v) => v.id);
    const finalResults = await this.findSimilarVideosByColorWithinSet(
      colorPalette,
      videoIds,
      finalLimit,
    );

    console.log(
      `✅ Sequential search completed: ${finalResults.length} final results`,
    );
    return finalResults;
  }

  /**
   * Find similar videos with similarity scores (legacy method, text only)
   */
  async findSimilarVideosWithScore(
    queryText: string,
    limit = 3,
  ): Promise<VideoSearchResult[]> {
    const results = await this.vectorStore.similaritySearchWithScore(
      queryText,
      limit,
    );

    return results.map(([doc, score]) => ({
      ...this.mapDocumentToVideoResult(doc),
      similarity: score,
    }));
  }

  /**
   * Legacy method: Find similar videos based on text query (for backward compatibility)
   */
  async findSimilarVideos(
    queryText: string,
    limit = 3,
  ): Promise<VideoSearchResult[]> {
    return this.findSimilarVideosByText(queryText, limit);
  }

  /**
   * Map LangChain document to VideoSearchResult
   */
  private mapDocumentToVideoResult(doc: Document): VideoSearchResult {
    return {
      id: doc.metadata.id,
      title: doc.metadata.title,
      description: doc.pageContent,
      s3Url: doc.metadata.s3Url,
      views: doc.metadata.views,
      likes: doc.metadata.likes,
      comments: doc.metadata.comments,
      durationSeconds: doc.metadata.durationSeconds,
    };
  }
}

export { PrismaVectorStore };

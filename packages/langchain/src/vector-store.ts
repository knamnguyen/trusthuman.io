import type { Document } from "@langchain/core/documents";
import { PrismaVectorStore } from "@langchain/community/vectorstores/prisma";

import type { SampleVideo } from "@sassy/db";
import { db, Prisma } from "@sassy/db";

import { createGoogleEmbeddings } from "./embeddings.js";

export interface VideoSearchResult {
  id: string;
  title: string;
  description: string | null;
  s3Url: string;
  views: number;
  likes: number;
  comments: number;
  durationSeconds: number;
  similarity?: number;
}

export class VideoVectorStore {
  private vectorStore: PrismaVectorStore<SampleVideo, "SampleVideo", any, any>;

  constructor() {
    const embeddings = createGoogleEmbeddings();

    this.vectorStore = PrismaVectorStore.withModel<SampleVideo>(db).create(
      embeddings,
      {
        prisma: Prisma,
        tableName: "SampleVideo",
        vectorColumnName: "searchEmbedding",
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
   * Add a video with automatic embedding generation
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
  }): Promise<void> {
    // Combine description and hookInfo for search embedding
    const searchContent = [video.description?.trim(), video.hookInfo?.trim()]
      .filter(Boolean)
      .join(" ");

    if (!searchContent) {
      console.warn(
        `Video ${video.id} has no description or hook info, skipping embedding generation`,
      );
      return;
    }

    // Create a video object with the combined content for embedding
    const videoForEmbedding = {
      ...video,
      description: searchContent,
    } as SampleVideo;

    // Add the video record with embedding generation handled by LangChain
    await this.vectorStore.addModels([videoForEmbedding]);
  }

  /**
   * Find similar videos based on text query
   */
  async findSimilarVideos(
    queryText: string,
    limit = 3,
  ): Promise<VideoSearchResult[]> {
    const results = await this.vectorStore.similaritySearch(queryText, limit);

    return results.map((doc) => this.mapDocumentToVideoResult(doc));
  }

  /**
   * Find similar videos with similarity scores
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

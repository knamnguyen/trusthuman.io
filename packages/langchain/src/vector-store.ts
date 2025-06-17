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
        vectorColumnName: "descriptionEmbedding",
        columns: {
          id: PrismaVectorStore.IdColumn,
          description: PrismaVectorStore.ContentColumn,
          title: "title",
          s3Url: "s3Url",
          views: "views",
          likes: "likes",
          comments: "comments",
          durationSeconds: "durationSeconds",
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
    title: string;
    s3Url: string;
    views: number;
    likes: number;
    comments: number;
    durationSeconds: number;
  }): Promise<void> {
    if (!video.description) {
      console.warn(
        `Video ${video.id} has no description, skipping embedding generation`,
      );
      return;
    }

    // Add the video record with embedding generation handled by LangChain
    await this.vectorStore.addModels([video as SampleVideo]);
  }

  /**
   * Find similar videos based on text query
   */
  async findSimilarVideos(
    queryText: string,
    limit: number = 3,
  ): Promise<VideoSearchResult[]> {
    const results = await this.vectorStore.similaritySearch(queryText, limit);

    return results.map((doc) => this.mapDocumentToVideoResult(doc));
  }

  /**
   * Find similar videos with similarity scores
   */
  async findSimilarVideosWithScore(
    queryText: string,
    limit: number = 3,
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

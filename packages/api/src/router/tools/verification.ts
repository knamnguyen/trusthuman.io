import {
  DetectFacesCommand,
  RekognitionClient,
} from "@aws-sdk/client-rekognition";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../../trpc";

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION || "us-west-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const verificationRouter = () =>
  createTRPCRouter({
    analyzePhoto: publicProcedure
      .input(
        z.object({
          photoBase64: z.string(),
          userId: z.string().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const buffer = Buffer.from(input.photoBase64, "base64");

        const response = await rekognition.send(
          new DetectFacesCommand({
            Image: { Bytes: buffer },
            Attributes: ["DEFAULT"],
          }),
        );

        const faces = response.FaceDetails ?? [];
        const faceCount = faces.length;
        const confidence = faces[0]?.Confidence ?? 0;
        const verified = faceCount === 1 && confidence >= 90;

        await ctx.db.humanVerification.create({
          data: {
            userId: input.userId ?? null,
            verified,
            confidence,
            faceCount,
            rawResponse: response as any,
            actionType: "linkedin_comment",
          },
        });

        const boundingBox = faces[0]?.BoundingBox
          ? {
              width: faces[0].BoundingBox.Width ?? 0,
              height: faces[0].BoundingBox.Height ?? 0,
              left: faces[0].BoundingBox.Left ?? 0,
              top: faces[0].BoundingBox.Top ?? 0,
            }
          : null;

        return { verified, confidence, faceCount, boundingBox };
      }),
  });

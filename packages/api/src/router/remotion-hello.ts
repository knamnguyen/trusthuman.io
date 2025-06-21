import type { AwsRegion } from "@remotion/lambda/client";
import {
  getFunctions,
  getRenderProgress,
  getSites,
  renderMediaOnLambda,
} from "@remotion/lambda/client";
import { z } from "zod";

import { RemotionService } from "@sassy/remotion";

import { createTRPCRouter, publicProcedure } from "../trpc";

// Type-safe AWS region with fallback
const REGION = (process.env.REMOTION_AWS_REGION || "us-west-2") as AwsRegion;

const RenderVideoInputSchema = z.object({
  text: z.string().min(1).max(200).optional(),
});

const RenderProgressInputSchema = z.object({
  renderId: z.string(),
  bucketName: z.string(),
});

export const remotionHelloRouter = createTRPCRouter({
  renderVideoHello: publicProcedure
    .input(RenderVideoInputSchema)
    .mutation(async ({ input }) => {
      // Get deployed functions
      const functions = await getFunctions({
        region: REGION,
        compatibleOnly: true,
      });

      if (functions.length === 0) {
        throw new Error(
          "No Remotion Lambda functions found. Please deploy a function first.",
        );
      }

      const functionName = functions[0]?.functionName;
      if (!functionName) {
        throw new Error("Function name is undefined");
      }

      // Get deployed sites
      const sites = await getSites({
        region: REGION,
      });

      const demoSite = sites.sites.find((site) => site.id === "viralcut-demo");
      if (!demoSite) {
        throw new Error(
          "ViralCut demo site not found. Please deploy the site first using 'pnpm remotion:sites:create'.",
        );
      }

      // Render video on Lambda
      const { renderId, bucketName } = await renderMediaOnLambda({
        region: REGION,
        functionName,
        serveUrl: demoSite.serveUrl,
        composition: "HelloWorld",
        inputProps: {
          text: input.text || "Hello World!",
        },
        codec: "h264",
        imageFormat: "jpeg",
        maxRetries: 1,
        framesPerLambda: 20,
        privacy: "public",
      });

      console.log("render video started successfully");

      return {
        success: true,
        renderId,
        bucketName,
        message: "Video rendering started successfully",
      };
    }),

  getRenderProgress: publicProcedure
    .input(RenderProgressInputSchema)
    .query(async ({ input }) => {
      // Get deployed functions
      const functions = await getFunctions({
        region: REGION,
        compatibleOnly: true,
      });

      if (functions.length === 0) {
        throw new Error("No Remotion Lambda functions found.");
      }

      const functionName = functions[0]?.functionName;
      if (!functionName) {
        throw new Error("Function name is undefined");
      }

      const progress = await getRenderProgress({
        renderId: input.renderId,
        bucketName: input.bucketName,
        functionName,
        region: REGION,
      });

      return {
        done: progress.done,
        progress: progress.overallProgress,
        outputFile: progress.outputFile,
        outputBucket: progress.outBucket,
        costs: progress.costs,
        errors: progress.errors,
        fatalErrorEncountered: progress.fatalErrorEncountered,
      };
    }),

  getStatus: publicProcedure.query(async () => {
    // Check if functions are deployed
    const functions = await getFunctions({
      region: REGION,
      compatibleOnly: true,
    });

    // Check if sites are deployed
    const sites = await getSites({
      region: REGION,
    });

    const demoSite = sites.sites.find((site) => site.id === "viralcut-demo");

    return {
      functionsDeployed: functions.length > 0,
      functionNames: functions.map((f) => f.functionName),
      siteDeployed: !!demoSite,
      siteUrl: demoSite?.serveUrl,
      region: REGION,
      ready: functions.length > 0 && !!demoSite,
    };
  }),
});

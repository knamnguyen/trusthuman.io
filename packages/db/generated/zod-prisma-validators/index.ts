import { z } from 'zod';
import { Prisma } from '../node';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = Prisma.JsonValue | null | 'JsonNull' | 'DbNull' | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.DbNull;
  if (v === 'JsonNull') return Prisma.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.function(z.tuple([]), z.any()) }),
    z.record(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const PostScalarFieldEnumSchema = z.enum(['id','title','content','createdAt','updatedAt']);

export const UserScalarFieldEnumSchema = z.enum(['id','firstName','lastName','username','primaryEmailAddress','imageUrl','clerkUserProperties','stripeCustomerId','accessType','stripeUserProperties','createdAt','updatedAt']);

export const DemoVideoScalarFieldEnumSchema = z.enum(['id','s3Url','productInfo','colorPalette','durationSeconds','createdAt','updatedAt']);

export const SampleVideoScalarFieldEnumSchema = z.enum(['id','webpageUrl','s3Url','colorPalette','hookEndTimestamp','hookCutConfidence','hookCutUrl','hookInfo','title','description','views','comments','likes','durationSeconds','createdAt','updatedAt']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const NullableJsonNullValueInputSchema = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const JsonNullValueFilterSchema = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.JsonNull : value === 'AnyNull' ? Prisma.AnyNull : value);

export const NullsOrderSchema = z.enum(['first','last']);

export const AccessTypeSchema = z.enum(['TRIAL','FREE','LIFETIME','MONTHLY','YEARLY']);

export type AccessTypeType = `${z.infer<typeof AccessTypeSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// POST SCHEMA
/////////////////////////////////////////

export const PostSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Post = z.infer<typeof PostSchema>

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  accessType: AccessTypeSchema,
  id: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  username: z.string().nullable(),
  primaryEmailAddress: z.string().nullable(),
  imageUrl: z.string().nullable(),
  clerkUserProperties: JsonValueSchema.nullable(),
  stripeCustomerId: z.string().nullable(),
  stripeUserProperties: JsonValueSchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// DEMO VIDEO SCHEMA
/////////////////////////////////////////

export const DemoVideoSchema = z.object({
  id: z.string().cuid(),
  s3Url: z.string(),
  productInfo: z.string().nullable(),
  colorPalette: z.string(),
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type DemoVideo = z.infer<typeof DemoVideoSchema>

/////////////////////////////////////////
// SAMPLE VIDEO SCHEMA
/////////////////////////////////////////

export const SampleVideoSchema = z.object({
  id: z.string().cuid(),
  webpageUrl: z.string(),
  s3Url: z.string(),
  colorPalette: z.string().nullable(),
  hookEndTimestamp: z.string(),
  hookCutConfidence: z.string().nullable(),
  hookCutUrl: z.string().nullable(),
  hookInfo: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  views: z.number().int(),
  comments: z.number().int(),
  likes: z.number().int(),
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type SampleVideo = z.infer<typeof SampleVideoSchema>

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// POST
//------------------------------------------------------

export const PostSelectSchema: z.ZodType<Prisma.PostSelect> = z.object({
  id: z.boolean().optional(),
  title: z.boolean().optional(),
  content: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()

// USER
//------------------------------------------------------

export const UserSelectSchema: z.ZodType<Prisma.UserSelect> = z.object({
  id: z.boolean().optional(),
  firstName: z.boolean().optional(),
  lastName: z.boolean().optional(),
  username: z.boolean().optional(),
  primaryEmailAddress: z.boolean().optional(),
  imageUrl: z.boolean().optional(),
  clerkUserProperties: z.boolean().optional(),
  stripeCustomerId: z.boolean().optional(),
  accessType: z.boolean().optional(),
  stripeUserProperties: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()

// DEMO VIDEO
//------------------------------------------------------

export const DemoVideoSelectSchema: z.ZodType<Prisma.DemoVideoSelect> = z.object({
  id: z.boolean().optional(),
  s3Url: z.boolean().optional(),
  productInfo: z.boolean().optional(),
  colorPalette: z.boolean().optional(),
  durationSeconds: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()

// SAMPLE VIDEO
//------------------------------------------------------

export const SampleVideoSelectSchema: z.ZodType<Prisma.SampleVideoSelect> = z.object({
  id: z.boolean().optional(),
  webpageUrl: z.boolean().optional(),
  s3Url: z.boolean().optional(),
  colorPalette: z.boolean().optional(),
  hookEndTimestamp: z.boolean().optional(),
  hookCutConfidence: z.boolean().optional(),
  hookCutUrl: z.boolean().optional(),
  hookInfo: z.boolean().optional(),
  title: z.boolean().optional(),
  description: z.boolean().optional(),
  views: z.boolean().optional(),
  comments: z.boolean().optional(),
  likes: z.boolean().optional(),
  durationSeconds: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()


/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const PostWhereInputSchema: z.ZodType<Prisma.PostWhereInput> = z.object({
  AND: z.union([ z.lazy(() => PostWhereInputSchema),z.lazy(() => PostWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PostWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PostWhereInputSchema),z.lazy(() => PostWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  content: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const PostOrderByWithRelationInputSchema: z.ZodType<Prisma.PostOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PostWhereUniqueInputSchema: z.ZodType<Prisma.PostWhereUniqueInput> = z.object({
  id: z.string().uuid()
})
.and(z.object({
  id: z.string().uuid().optional(),
  AND: z.union([ z.lazy(() => PostWhereInputSchema),z.lazy(() => PostWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PostWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PostWhereInputSchema),z.lazy(() => PostWhereInputSchema).array() ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  content: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict());

export const PostOrderByWithAggregationInputSchema: z.ZodType<Prisma.PostOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => PostCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => PostMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => PostMinOrderByAggregateInputSchema).optional()
}).strict();

export const PostScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PostScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => PostScalarWhereWithAggregatesInputSchema),z.lazy(() => PostScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => PostScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PostScalarWhereWithAggregatesInputSchema),z.lazy(() => PostScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  title: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  content: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const UserWhereInputSchema: z.ZodType<Prisma.UserWhereInput> = z.object({
  AND: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  firstName: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  lastName: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  username: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  primaryEmailAddress: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  imageUrl: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  clerkUserProperties: z.lazy(() => JsonNullableFilterSchema).optional(),
  stripeCustomerId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  accessType: z.union([ z.lazy(() => EnumAccessTypeFilterSchema),z.lazy(() => AccessTypeSchema) ]).optional(),
  stripeUserProperties: z.lazy(() => JsonNullableFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const UserOrderByWithRelationInputSchema: z.ZodType<Prisma.UserOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastName: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  username: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  primaryEmailAddress: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  imageUrl: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  clerkUserProperties: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  stripeCustomerId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  accessType: z.lazy(() => SortOrderSchema).optional(),
  stripeUserProperties: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserWhereUniqueInputSchema: z.ZodType<Prisma.UserWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    username: z.string(),
    primaryEmailAddress: z.string(),
    stripeCustomerId: z.string()
  }),
  z.object({
    id: z.string(),
    username: z.string(),
    primaryEmailAddress: z.string(),
  }),
  z.object({
    id: z.string(),
    username: z.string(),
    stripeCustomerId: z.string(),
  }),
  z.object({
    id: z.string(),
    username: z.string(),
  }),
  z.object({
    id: z.string(),
    primaryEmailAddress: z.string(),
    stripeCustomerId: z.string(),
  }),
  z.object({
    id: z.string(),
    primaryEmailAddress: z.string(),
  }),
  z.object({
    id: z.string(),
    stripeCustomerId: z.string(),
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    username: z.string(),
    primaryEmailAddress: z.string(),
    stripeCustomerId: z.string(),
  }),
  z.object({
    username: z.string(),
    primaryEmailAddress: z.string(),
  }),
  z.object({
    username: z.string(),
    stripeCustomerId: z.string(),
  }),
  z.object({
    username: z.string(),
  }),
  z.object({
    primaryEmailAddress: z.string(),
    stripeCustomerId: z.string(),
  }),
  z.object({
    primaryEmailAddress: z.string(),
  }),
  z.object({
    stripeCustomerId: z.string(),
  }),
])
.and(z.object({
  id: z.string().optional(),
  username: z.string().optional(),
  primaryEmailAddress: z.string().optional(),
  stripeCustomerId: z.string().optional(),
  AND: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  firstName: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  lastName: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  imageUrl: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  clerkUserProperties: z.lazy(() => JsonNullableFilterSchema).optional(),
  accessType: z.union([ z.lazy(() => EnumAccessTypeFilterSchema),z.lazy(() => AccessTypeSchema) ]).optional(),
  stripeUserProperties: z.lazy(() => JsonNullableFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict());

export const UserOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastName: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  username: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  primaryEmailAddress: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  imageUrl: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  clerkUserProperties: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  stripeCustomerId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  accessType: z.lazy(() => SortOrderSchema).optional(),
  stripeUserProperties: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => UserCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => UserMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => UserMinOrderByAggregateInputSchema).optional()
}).strict();

export const UserScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema),z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema),z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  firstName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  lastName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  username: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  primaryEmailAddress: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  imageUrl: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  clerkUserProperties: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  stripeCustomerId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  accessType: z.union([ z.lazy(() => EnumAccessTypeWithAggregatesFilterSchema),z.lazy(() => AccessTypeSchema) ]).optional(),
  stripeUserProperties: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const DemoVideoWhereInputSchema: z.ZodType<Prisma.DemoVideoWhereInput> = z.object({
  AND: z.union([ z.lazy(() => DemoVideoWhereInputSchema),z.lazy(() => DemoVideoWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => DemoVideoWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DemoVideoWhereInputSchema),z.lazy(() => DemoVideoWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  s3Url: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  productInfo: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  colorPalette: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  durationSeconds: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const DemoVideoOrderByWithRelationInputSchema: z.ZodType<Prisma.DemoVideoOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
  productInfo: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  colorPalette: z.lazy(() => SortOrderSchema).optional(),
  durationSeconds: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DemoVideoWhereUniqueInputSchema: z.ZodType<Prisma.DemoVideoWhereUniqueInput> = z.object({
  id: z.string().cuid()
})
.and(z.object({
  id: z.string().cuid().optional(),
  AND: z.union([ z.lazy(() => DemoVideoWhereInputSchema),z.lazy(() => DemoVideoWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => DemoVideoWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DemoVideoWhereInputSchema),z.lazy(() => DemoVideoWhereInputSchema).array() ]).optional(),
  s3Url: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  productInfo: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  colorPalette: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  durationSeconds: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict());

export const DemoVideoOrderByWithAggregationInputSchema: z.ZodType<Prisma.DemoVideoOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
  productInfo: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  colorPalette: z.lazy(() => SortOrderSchema).optional(),
  durationSeconds: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => DemoVideoCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => DemoVideoAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => DemoVideoMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => DemoVideoMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => DemoVideoSumOrderByAggregateInputSchema).optional()
}).strict();

export const DemoVideoScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.DemoVideoScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => DemoVideoScalarWhereWithAggregatesInputSchema),z.lazy(() => DemoVideoScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => DemoVideoScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DemoVideoScalarWhereWithAggregatesInputSchema),z.lazy(() => DemoVideoScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  s3Url: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  productInfo: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  colorPalette: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  durationSeconds: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const SampleVideoWhereInputSchema: z.ZodType<Prisma.SampleVideoWhereInput> = z.object({
  AND: z.union([ z.lazy(() => SampleVideoWhereInputSchema),z.lazy(() => SampleVideoWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SampleVideoWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SampleVideoWhereInputSchema),z.lazy(() => SampleVideoWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  webpageUrl: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  s3Url: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  colorPalette: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  hookEndTimestamp: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  hookCutConfidence: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  hookCutUrl: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  hookInfo: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  title: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  views: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  comments: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  likes: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  durationSeconds: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const SampleVideoOrderByWithRelationInputSchema: z.ZodType<Prisma.SampleVideoOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  webpageUrl: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
  colorPalette: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  hookEndTimestamp: z.lazy(() => SortOrderSchema).optional(),
  hookCutConfidence: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  hookCutUrl: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  hookInfo: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  views: z.lazy(() => SortOrderSchema).optional(),
  comments: z.lazy(() => SortOrderSchema).optional(),
  likes: z.lazy(() => SortOrderSchema).optional(),
  durationSeconds: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const SampleVideoWhereUniqueInputSchema: z.ZodType<Prisma.SampleVideoWhereUniqueInput> = z.union([
  z.object({
    id: z.string().cuid(),
    webpageUrl: z.string()
  }),
  z.object({
    id: z.string().cuid(),
  }),
  z.object({
    webpageUrl: z.string(),
  }),
])
.and(z.object({
  id: z.string().cuid().optional(),
  webpageUrl: z.string().optional(),
  AND: z.union([ z.lazy(() => SampleVideoWhereInputSchema),z.lazy(() => SampleVideoWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SampleVideoWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SampleVideoWhereInputSchema),z.lazy(() => SampleVideoWhereInputSchema).array() ]).optional(),
  s3Url: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  colorPalette: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  hookEndTimestamp: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  hookCutConfidence: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  hookCutUrl: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  hookInfo: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  title: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  views: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  comments: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  likes: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  durationSeconds: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict());

export const SampleVideoOrderByWithAggregationInputSchema: z.ZodType<Prisma.SampleVideoOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  webpageUrl: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
  colorPalette: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  hookEndTimestamp: z.lazy(() => SortOrderSchema).optional(),
  hookCutConfidence: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  hookCutUrl: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  hookInfo: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  views: z.lazy(() => SortOrderSchema).optional(),
  comments: z.lazy(() => SortOrderSchema).optional(),
  likes: z.lazy(() => SortOrderSchema).optional(),
  durationSeconds: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => SampleVideoCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => SampleVideoAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => SampleVideoMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => SampleVideoMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => SampleVideoSumOrderByAggregateInputSchema).optional()
}).strict();

export const SampleVideoScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.SampleVideoScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => SampleVideoScalarWhereWithAggregatesInputSchema),z.lazy(() => SampleVideoScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => SampleVideoScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SampleVideoScalarWhereWithAggregatesInputSchema),z.lazy(() => SampleVideoScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  webpageUrl: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  s3Url: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  colorPalette: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  hookEndTimestamp: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  hookCutConfidence: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  hookCutUrl: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  hookInfo: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  title: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  views: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  comments: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  likes: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  durationSeconds: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const PostCreateInputSchema: z.ZodType<Prisma.PostCreateInput> = z.object({
  id: z.string().uuid().optional(),
  title: z.string(),
  content: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const PostUncheckedCreateInputSchema: z.ZodType<Prisma.PostUncheckedCreateInput> = z.object({
  id: z.string().uuid().optional(),
  title: z.string(),
  content: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const PostUpdateInputSchema: z.ZodType<Prisma.PostUpdateInput> = z.object({
  id: z.union([ z.string().uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PostUncheckedUpdateInputSchema: z.ZodType<Prisma.PostUncheckedUpdateInput> = z.object({
  id: z.union([ z.string().uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PostCreateManyInputSchema: z.ZodType<Prisma.PostCreateManyInput> = z.object({
  id: z.string().uuid().optional(),
  title: z.string(),
  content: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const PostUpdateManyMutationInputSchema: z.ZodType<Prisma.PostUpdateManyMutationInput> = z.object({
  id: z.union([ z.string().uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PostUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string().uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserCreateInputSchema: z.ZodType<Prisma.UserCreateInput> = z.object({
  id: z.string(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  primaryEmailAddress: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  clerkUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  stripeCustomerId: z.string().optional().nullable(),
  accessType: z.lazy(() => AccessTypeSchema).optional(),
  stripeUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const UserUncheckedCreateInputSchema: z.ZodType<Prisma.UserUncheckedCreateInput> = z.object({
  id: z.string(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  primaryEmailAddress: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  clerkUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  stripeCustomerId: z.string().optional().nullable(),
  accessType: z.lazy(() => AccessTypeSchema).optional(),
  stripeUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const UserUpdateInputSchema: z.ZodType<Prisma.UserUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  primaryEmailAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  imageUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clerkUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  stripeCustomerId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessType: z.union([ z.lazy(() => AccessTypeSchema),z.lazy(() => EnumAccessTypeFieldUpdateOperationsInputSchema) ]).optional(),
  stripeUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserUncheckedUpdateInputSchema: z.ZodType<Prisma.UserUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  primaryEmailAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  imageUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clerkUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  stripeCustomerId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessType: z.union([ z.lazy(() => AccessTypeSchema),z.lazy(() => EnumAccessTypeFieldUpdateOperationsInputSchema) ]).optional(),
  stripeUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserCreateManyInputSchema: z.ZodType<Prisma.UserCreateManyInput> = z.object({
  id: z.string(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  primaryEmailAddress: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  clerkUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  stripeCustomerId: z.string().optional().nullable(),
  accessType: z.lazy(() => AccessTypeSchema).optional(),
  stripeUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const UserUpdateManyMutationInputSchema: z.ZodType<Prisma.UserUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  primaryEmailAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  imageUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clerkUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  stripeCustomerId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessType: z.union([ z.lazy(() => AccessTypeSchema),z.lazy(() => EnumAccessTypeFieldUpdateOperationsInputSchema) ]).optional(),
  stripeUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  primaryEmailAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  imageUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clerkUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  stripeCustomerId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessType: z.union([ z.lazy(() => AccessTypeSchema),z.lazy(() => EnumAccessTypeFieldUpdateOperationsInputSchema) ]).optional(),
  stripeUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const DemoVideoCreateInputSchema: z.ZodType<Prisma.DemoVideoCreateInput> = z.object({
  id: z.string().cuid().optional(),
  s3Url: z.string(),
  productInfo: z.string().optional().nullable(),
  colorPalette: z.string(),
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const DemoVideoUncheckedCreateInputSchema: z.ZodType<Prisma.DemoVideoUncheckedCreateInput> = z.object({
  id: z.string().cuid().optional(),
  s3Url: z.string(),
  productInfo: z.string().optional().nullable(),
  colorPalette: z.string(),
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const DemoVideoUpdateInputSchema: z.ZodType<Prisma.DemoVideoUpdateInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  s3Url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  colorPalette: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const DemoVideoUncheckedUpdateInputSchema: z.ZodType<Prisma.DemoVideoUncheckedUpdateInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  s3Url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  colorPalette: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const DemoVideoCreateManyInputSchema: z.ZodType<Prisma.DemoVideoCreateManyInput> = z.object({
  id: z.string().cuid().optional(),
  s3Url: z.string(),
  productInfo: z.string().optional().nullable(),
  colorPalette: z.string(),
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const DemoVideoUpdateManyMutationInputSchema: z.ZodType<Prisma.DemoVideoUpdateManyMutationInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  s3Url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  colorPalette: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const DemoVideoUncheckedUpdateManyInputSchema: z.ZodType<Prisma.DemoVideoUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  s3Url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  colorPalette: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const SampleVideoCreateInputSchema: z.ZodType<Prisma.SampleVideoCreateInput> = z.object({
  id: z.string().cuid().optional(),
  webpageUrl: z.string(),
  s3Url: z.string(),
  colorPalette: z.string().optional().nullable(),
  hookEndTimestamp: z.string(),
  hookCutConfidence: z.string().optional().nullable(),
  hookCutUrl: z.string().optional().nullable(),
  hookInfo: z.string().optional().nullable(),
  title: z.string(),
  description: z.string().optional().nullable(),
  views: z.number().int().optional(),
  comments: z.number().int().optional(),
  likes: z.number().int().optional(),
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const SampleVideoUncheckedCreateInputSchema: z.ZodType<Prisma.SampleVideoUncheckedCreateInput> = z.object({
  id: z.string().cuid().optional(),
  webpageUrl: z.string(),
  s3Url: z.string(),
  colorPalette: z.string().optional().nullable(),
  hookEndTimestamp: z.string(),
  hookCutConfidence: z.string().optional().nullable(),
  hookCutUrl: z.string().optional().nullable(),
  hookInfo: z.string().optional().nullable(),
  title: z.string(),
  description: z.string().optional().nullable(),
  views: z.number().int().optional(),
  comments: z.number().int().optional(),
  likes: z.number().int().optional(),
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const SampleVideoUpdateInputSchema: z.ZodType<Prisma.SampleVideoUpdateInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  webpageUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  s3Url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  colorPalette: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  hookEndTimestamp: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hookCutConfidence: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  hookCutUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  hookInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  views: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  comments: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  likes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const SampleVideoUncheckedUpdateInputSchema: z.ZodType<Prisma.SampleVideoUncheckedUpdateInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  webpageUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  s3Url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  colorPalette: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  hookEndTimestamp: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hookCutConfidence: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  hookCutUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  hookInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  views: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  comments: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  likes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const SampleVideoCreateManyInputSchema: z.ZodType<Prisma.SampleVideoCreateManyInput> = z.object({
  id: z.string().cuid().optional(),
  webpageUrl: z.string(),
  s3Url: z.string(),
  colorPalette: z.string().optional().nullable(),
  hookEndTimestamp: z.string(),
  hookCutConfidence: z.string().optional().nullable(),
  hookCutUrl: z.string().optional().nullable(),
  hookInfo: z.string().optional().nullable(),
  title: z.string(),
  description: z.string().optional().nullable(),
  views: z.number().int().optional(),
  comments: z.number().int().optional(),
  likes: z.number().int().optional(),
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const SampleVideoUpdateManyMutationInputSchema: z.ZodType<Prisma.SampleVideoUpdateManyMutationInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  webpageUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  s3Url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  colorPalette: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  hookEndTimestamp: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hookCutConfidence: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  hookCutUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  hookInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  views: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  comments: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  likes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const SampleVideoUncheckedUpdateManyInputSchema: z.ZodType<Prisma.SampleVideoUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  webpageUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  s3Url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  colorPalette: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  hookEndTimestamp: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hookCutConfidence: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  hookCutUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  hookInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  views: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  comments: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  likes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const StringFilterSchema: z.ZodType<Prisma.StringFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
}).strict();

export const DateTimeFilterSchema: z.ZodType<Prisma.DateTimeFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
}).strict();

export const PostCountOrderByAggregateInputSchema: z.ZodType<Prisma.PostCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PostMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PostMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PostMinOrderByAggregateInputSchema: z.ZodType<Prisma.PostMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const StringWithAggregatesFilterSchema: z.ZodType<Prisma.StringWithAggregatesFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional()
}).strict();

export const DateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional()
}).strict();

export const StringNullableFilterSchema: z.ZodType<Prisma.StringNullableFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const JsonNullableFilterSchema: z.ZodType<Prisma.JsonNullableFilter> = z.object({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional()
}).strict();

export const EnumAccessTypeFilterSchema: z.ZodType<Prisma.EnumAccessTypeFilter> = z.object({
  equals: z.lazy(() => AccessTypeSchema).optional(),
  in: z.lazy(() => AccessTypeSchema).array().optional(),
  notIn: z.lazy(() => AccessTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => AccessTypeSchema),z.lazy(() => NestedEnumAccessTypeFilterSchema) ]).optional(),
}).strict();

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> = z.object({
  sort: z.lazy(() => SortOrderSchema),
  nulls: z.lazy(() => NullsOrderSchema).optional()
}).strict();

export const UserCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.lazy(() => SortOrderSchema).optional(),
  lastName: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  primaryEmailAddress: z.lazy(() => SortOrderSchema).optional(),
  imageUrl: z.lazy(() => SortOrderSchema).optional(),
  clerkUserProperties: z.lazy(() => SortOrderSchema).optional(),
  stripeCustomerId: z.lazy(() => SortOrderSchema).optional(),
  accessType: z.lazy(() => SortOrderSchema).optional(),
  stripeUserProperties: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.lazy(() => SortOrderSchema).optional(),
  lastName: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  primaryEmailAddress: z.lazy(() => SortOrderSchema).optional(),
  imageUrl: z.lazy(() => SortOrderSchema).optional(),
  stripeCustomerId: z.lazy(() => SortOrderSchema).optional(),
  accessType: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.lazy(() => SortOrderSchema).optional(),
  lastName: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  primaryEmailAddress: z.lazy(() => SortOrderSchema).optional(),
  imageUrl: z.lazy(() => SortOrderSchema).optional(),
  stripeCustomerId: z.lazy(() => SortOrderSchema).optional(),
  accessType: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const StringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.StringNullableWithAggregatesFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional()
}).strict();

export const JsonNullableWithAggregatesFilterSchema: z.ZodType<Prisma.JsonNullableWithAggregatesFilter> = z.object({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedJsonNullableFilterSchema).optional()
}).strict();

export const EnumAccessTypeWithAggregatesFilterSchema: z.ZodType<Prisma.EnumAccessTypeWithAggregatesFilter> = z.object({
  equals: z.lazy(() => AccessTypeSchema).optional(),
  in: z.lazy(() => AccessTypeSchema).array().optional(),
  notIn: z.lazy(() => AccessTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => AccessTypeSchema),z.lazy(() => NestedEnumAccessTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumAccessTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumAccessTypeFilterSchema).optional()
}).strict();

export const IntFilterSchema: z.ZodType<Prisma.IntFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
}).strict();

export const DemoVideoCountOrderByAggregateInputSchema: z.ZodType<Prisma.DemoVideoCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
  productInfo: z.lazy(() => SortOrderSchema).optional(),
  colorPalette: z.lazy(() => SortOrderSchema).optional(),
  durationSeconds: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DemoVideoAvgOrderByAggregateInputSchema: z.ZodType<Prisma.DemoVideoAvgOrderByAggregateInput> = z.object({
  durationSeconds: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DemoVideoMaxOrderByAggregateInputSchema: z.ZodType<Prisma.DemoVideoMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
  productInfo: z.lazy(() => SortOrderSchema).optional(),
  colorPalette: z.lazy(() => SortOrderSchema).optional(),
  durationSeconds: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DemoVideoMinOrderByAggregateInputSchema: z.ZodType<Prisma.DemoVideoMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
  productInfo: z.lazy(() => SortOrderSchema).optional(),
  colorPalette: z.lazy(() => SortOrderSchema).optional(),
  durationSeconds: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DemoVideoSumOrderByAggregateInputSchema: z.ZodType<Prisma.DemoVideoSumOrderByAggregateInput> = z.object({
  durationSeconds: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const IntWithAggregatesFilterSchema: z.ZodType<Prisma.IntWithAggregatesFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional()
}).strict();

export const SampleVideoCountOrderByAggregateInputSchema: z.ZodType<Prisma.SampleVideoCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  webpageUrl: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
  colorPalette: z.lazy(() => SortOrderSchema).optional(),
  hookEndTimestamp: z.lazy(() => SortOrderSchema).optional(),
  hookCutConfidence: z.lazy(() => SortOrderSchema).optional(),
  hookCutUrl: z.lazy(() => SortOrderSchema).optional(),
  hookInfo: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  views: z.lazy(() => SortOrderSchema).optional(),
  comments: z.lazy(() => SortOrderSchema).optional(),
  likes: z.lazy(() => SortOrderSchema).optional(),
  durationSeconds: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const SampleVideoAvgOrderByAggregateInputSchema: z.ZodType<Prisma.SampleVideoAvgOrderByAggregateInput> = z.object({
  views: z.lazy(() => SortOrderSchema).optional(),
  comments: z.lazy(() => SortOrderSchema).optional(),
  likes: z.lazy(() => SortOrderSchema).optional(),
  durationSeconds: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const SampleVideoMaxOrderByAggregateInputSchema: z.ZodType<Prisma.SampleVideoMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  webpageUrl: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
  colorPalette: z.lazy(() => SortOrderSchema).optional(),
  hookEndTimestamp: z.lazy(() => SortOrderSchema).optional(),
  hookCutConfidence: z.lazy(() => SortOrderSchema).optional(),
  hookCutUrl: z.lazy(() => SortOrderSchema).optional(),
  hookInfo: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  views: z.lazy(() => SortOrderSchema).optional(),
  comments: z.lazy(() => SortOrderSchema).optional(),
  likes: z.lazy(() => SortOrderSchema).optional(),
  durationSeconds: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const SampleVideoMinOrderByAggregateInputSchema: z.ZodType<Prisma.SampleVideoMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  webpageUrl: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
  colorPalette: z.lazy(() => SortOrderSchema).optional(),
  hookEndTimestamp: z.lazy(() => SortOrderSchema).optional(),
  hookCutConfidence: z.lazy(() => SortOrderSchema).optional(),
  hookCutUrl: z.lazy(() => SortOrderSchema).optional(),
  hookInfo: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  views: z.lazy(() => SortOrderSchema).optional(),
  comments: z.lazy(() => SortOrderSchema).optional(),
  likes: z.lazy(() => SortOrderSchema).optional(),
  durationSeconds: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const SampleVideoSumOrderByAggregateInputSchema: z.ZodType<Prisma.SampleVideoSumOrderByAggregateInput> = z.object({
  views: z.lazy(() => SortOrderSchema).optional(),
  comments: z.lazy(() => SortOrderSchema).optional(),
  likes: z.lazy(() => SortOrderSchema).optional(),
  durationSeconds: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> = z.object({
  set: z.string().optional()
}).strict();

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> = z.object({
  set: z.coerce.date().optional()
}).strict();

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> = z.object({
  set: z.string().optional().nullable()
}).strict();

export const EnumAccessTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumAccessTypeFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => AccessTypeSchema).optional()
}).strict();

export const IntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.IntFieldUpdateOperationsInput> = z.object({
  set: z.number().optional(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional()
}).strict();

export const NestedStringFilterSchema: z.ZodType<Prisma.NestedStringFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
}).strict();

export const NestedDateTimeFilterSchema: z.ZodType<Prisma.NestedDateTimeFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
}).strict();

export const NestedStringWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringWithAggregatesFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional()
}).strict();

export const NestedIntFilterSchema: z.ZodType<Prisma.NestedIntFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
}).strict();

export const NestedDateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional()
}).strict();

export const NestedStringNullableFilterSchema: z.ZodType<Prisma.NestedStringNullableFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedEnumAccessTypeFilterSchema: z.ZodType<Prisma.NestedEnumAccessTypeFilter> = z.object({
  equals: z.lazy(() => AccessTypeSchema).optional(),
  in: z.lazy(() => AccessTypeSchema).array().optional(),
  notIn: z.lazy(() => AccessTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => AccessTypeSchema),z.lazy(() => NestedEnumAccessTypeFilterSchema) ]).optional(),
}).strict();

export const NestedStringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringNullableWithAggregatesFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional()
}).strict();

export const NestedIntNullableFilterSchema: z.ZodType<Prisma.NestedIntNullableFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedJsonNullableFilterSchema: z.ZodType<Prisma.NestedJsonNullableFilter> = z.object({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional()
}).strict();

export const NestedEnumAccessTypeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumAccessTypeWithAggregatesFilter> = z.object({
  equals: z.lazy(() => AccessTypeSchema).optional(),
  in: z.lazy(() => AccessTypeSchema).array().optional(),
  notIn: z.lazy(() => AccessTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => AccessTypeSchema),z.lazy(() => NestedEnumAccessTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumAccessTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumAccessTypeFilterSchema).optional()
}).strict();

export const NestedIntWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntWithAggregatesFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional()
}).strict();

export const NestedFloatFilterSchema: z.ZodType<Prisma.NestedFloatFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatFilterSchema) ]).optional(),
}).strict();

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const PostFindFirstArgsSchema: z.ZodType<Prisma.PostFindFirstArgs> = z.object({
  select: PostSelectSchema.optional(),
  where: PostWhereInputSchema.optional(),
  orderBy: z.union([ PostOrderByWithRelationInputSchema.array(),PostOrderByWithRelationInputSchema ]).optional(),
  cursor: PostWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PostScalarFieldEnumSchema,PostScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const PostFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PostFindFirstOrThrowArgs> = z.object({
  select: PostSelectSchema.optional(),
  where: PostWhereInputSchema.optional(),
  orderBy: z.union([ PostOrderByWithRelationInputSchema.array(),PostOrderByWithRelationInputSchema ]).optional(),
  cursor: PostWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PostScalarFieldEnumSchema,PostScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const PostFindManyArgsSchema: z.ZodType<Prisma.PostFindManyArgs> = z.object({
  select: PostSelectSchema.optional(),
  where: PostWhereInputSchema.optional(),
  orderBy: z.union([ PostOrderByWithRelationInputSchema.array(),PostOrderByWithRelationInputSchema ]).optional(),
  cursor: PostWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PostScalarFieldEnumSchema,PostScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const PostAggregateArgsSchema: z.ZodType<Prisma.PostAggregateArgs> = z.object({
  where: PostWhereInputSchema.optional(),
  orderBy: z.union([ PostOrderByWithRelationInputSchema.array(),PostOrderByWithRelationInputSchema ]).optional(),
  cursor: PostWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const PostGroupByArgsSchema: z.ZodType<Prisma.PostGroupByArgs> = z.object({
  where: PostWhereInputSchema.optional(),
  orderBy: z.union([ PostOrderByWithAggregationInputSchema.array(),PostOrderByWithAggregationInputSchema ]).optional(),
  by: PostScalarFieldEnumSchema.array(),
  having: PostScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const PostFindUniqueArgsSchema: z.ZodType<Prisma.PostFindUniqueArgs> = z.object({
  select: PostSelectSchema.optional(),
  where: PostWhereUniqueInputSchema,
}).strict() ;

export const PostFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PostFindUniqueOrThrowArgs> = z.object({
  select: PostSelectSchema.optional(),
  where: PostWhereUniqueInputSchema,
}).strict() ;

export const UserFindFirstArgsSchema: z.ZodType<Prisma.UserFindFirstArgs> = z.object({
  select: UserSelectSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema,UserScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const UserFindFirstOrThrowArgsSchema: z.ZodType<Prisma.UserFindFirstOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema,UserScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const UserFindManyArgsSchema: z.ZodType<Prisma.UserFindManyArgs> = z.object({
  select: UserSelectSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema,UserScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const UserAggregateArgsSchema: z.ZodType<Prisma.UserAggregateArgs> = z.object({
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const UserGroupByArgsSchema: z.ZodType<Prisma.UserGroupByArgs> = z.object({
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithAggregationInputSchema.array(),UserOrderByWithAggregationInputSchema ]).optional(),
  by: UserScalarFieldEnumSchema.array(),
  having: UserScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const UserFindUniqueArgsSchema: z.ZodType<Prisma.UserFindUniqueArgs> = z.object({
  select: UserSelectSchema.optional(),
  where: UserWhereUniqueInputSchema,
}).strict() ;

export const UserFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserFindUniqueOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  where: UserWhereUniqueInputSchema,
}).strict() ;

export const DemoVideoFindFirstArgsSchema: z.ZodType<Prisma.DemoVideoFindFirstArgs> = z.object({
  select: DemoVideoSelectSchema.optional(),
  where: DemoVideoWhereInputSchema.optional(),
  orderBy: z.union([ DemoVideoOrderByWithRelationInputSchema.array(),DemoVideoOrderByWithRelationInputSchema ]).optional(),
  cursor: DemoVideoWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ DemoVideoScalarFieldEnumSchema,DemoVideoScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const DemoVideoFindFirstOrThrowArgsSchema: z.ZodType<Prisma.DemoVideoFindFirstOrThrowArgs> = z.object({
  select: DemoVideoSelectSchema.optional(),
  where: DemoVideoWhereInputSchema.optional(),
  orderBy: z.union([ DemoVideoOrderByWithRelationInputSchema.array(),DemoVideoOrderByWithRelationInputSchema ]).optional(),
  cursor: DemoVideoWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ DemoVideoScalarFieldEnumSchema,DemoVideoScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const DemoVideoFindManyArgsSchema: z.ZodType<Prisma.DemoVideoFindManyArgs> = z.object({
  select: DemoVideoSelectSchema.optional(),
  where: DemoVideoWhereInputSchema.optional(),
  orderBy: z.union([ DemoVideoOrderByWithRelationInputSchema.array(),DemoVideoOrderByWithRelationInputSchema ]).optional(),
  cursor: DemoVideoWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ DemoVideoScalarFieldEnumSchema,DemoVideoScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const DemoVideoAggregateArgsSchema: z.ZodType<Prisma.DemoVideoAggregateArgs> = z.object({
  where: DemoVideoWhereInputSchema.optional(),
  orderBy: z.union([ DemoVideoOrderByWithRelationInputSchema.array(),DemoVideoOrderByWithRelationInputSchema ]).optional(),
  cursor: DemoVideoWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const DemoVideoGroupByArgsSchema: z.ZodType<Prisma.DemoVideoGroupByArgs> = z.object({
  where: DemoVideoWhereInputSchema.optional(),
  orderBy: z.union([ DemoVideoOrderByWithAggregationInputSchema.array(),DemoVideoOrderByWithAggregationInputSchema ]).optional(),
  by: DemoVideoScalarFieldEnumSchema.array(),
  having: DemoVideoScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const DemoVideoFindUniqueArgsSchema: z.ZodType<Prisma.DemoVideoFindUniqueArgs> = z.object({
  select: DemoVideoSelectSchema.optional(),
  where: DemoVideoWhereUniqueInputSchema,
}).strict() ;

export const DemoVideoFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.DemoVideoFindUniqueOrThrowArgs> = z.object({
  select: DemoVideoSelectSchema.optional(),
  where: DemoVideoWhereUniqueInputSchema,
}).strict() ;

export const SampleVideoFindFirstArgsSchema: z.ZodType<Prisma.SampleVideoFindFirstArgs> = z.object({
  select: SampleVideoSelectSchema.optional(),
  where: SampleVideoWhereInputSchema.optional(),
  orderBy: z.union([ SampleVideoOrderByWithRelationInputSchema.array(),SampleVideoOrderByWithRelationInputSchema ]).optional(),
  cursor: SampleVideoWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SampleVideoScalarFieldEnumSchema,SampleVideoScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const SampleVideoFindFirstOrThrowArgsSchema: z.ZodType<Prisma.SampleVideoFindFirstOrThrowArgs> = z.object({
  select: SampleVideoSelectSchema.optional(),
  where: SampleVideoWhereInputSchema.optional(),
  orderBy: z.union([ SampleVideoOrderByWithRelationInputSchema.array(),SampleVideoOrderByWithRelationInputSchema ]).optional(),
  cursor: SampleVideoWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SampleVideoScalarFieldEnumSchema,SampleVideoScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const SampleVideoFindManyArgsSchema: z.ZodType<Prisma.SampleVideoFindManyArgs> = z.object({
  select: SampleVideoSelectSchema.optional(),
  where: SampleVideoWhereInputSchema.optional(),
  orderBy: z.union([ SampleVideoOrderByWithRelationInputSchema.array(),SampleVideoOrderByWithRelationInputSchema ]).optional(),
  cursor: SampleVideoWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SampleVideoScalarFieldEnumSchema,SampleVideoScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const SampleVideoAggregateArgsSchema: z.ZodType<Prisma.SampleVideoAggregateArgs> = z.object({
  where: SampleVideoWhereInputSchema.optional(),
  orderBy: z.union([ SampleVideoOrderByWithRelationInputSchema.array(),SampleVideoOrderByWithRelationInputSchema ]).optional(),
  cursor: SampleVideoWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const SampleVideoGroupByArgsSchema: z.ZodType<Prisma.SampleVideoGroupByArgs> = z.object({
  where: SampleVideoWhereInputSchema.optional(),
  orderBy: z.union([ SampleVideoOrderByWithAggregationInputSchema.array(),SampleVideoOrderByWithAggregationInputSchema ]).optional(),
  by: SampleVideoScalarFieldEnumSchema.array(),
  having: SampleVideoScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const SampleVideoFindUniqueArgsSchema: z.ZodType<Prisma.SampleVideoFindUniqueArgs> = z.object({
  select: SampleVideoSelectSchema.optional(),
  where: SampleVideoWhereUniqueInputSchema,
}).strict() ;

export const SampleVideoFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.SampleVideoFindUniqueOrThrowArgs> = z.object({
  select: SampleVideoSelectSchema.optional(),
  where: SampleVideoWhereUniqueInputSchema,
}).strict() ;

export const PostCreateArgsSchema: z.ZodType<Prisma.PostCreateArgs> = z.object({
  select: PostSelectSchema.optional(),
  data: z.union([ PostCreateInputSchema,PostUncheckedCreateInputSchema ]),
}).strict() ;

export const PostUpsertArgsSchema: z.ZodType<Prisma.PostUpsertArgs> = z.object({
  select: PostSelectSchema.optional(),
  where: PostWhereUniqueInputSchema,
  create: z.union([ PostCreateInputSchema,PostUncheckedCreateInputSchema ]),
  update: z.union([ PostUpdateInputSchema,PostUncheckedUpdateInputSchema ]),
}).strict() ;

export const PostCreateManyArgsSchema: z.ZodType<Prisma.PostCreateManyArgs> = z.object({
  data: z.union([ PostCreateManyInputSchema,PostCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const PostCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PostCreateManyAndReturnArgs> = z.object({
  data: z.union([ PostCreateManyInputSchema,PostCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const PostDeleteArgsSchema: z.ZodType<Prisma.PostDeleteArgs> = z.object({
  select: PostSelectSchema.optional(),
  where: PostWhereUniqueInputSchema,
}).strict() ;

export const PostUpdateArgsSchema: z.ZodType<Prisma.PostUpdateArgs> = z.object({
  select: PostSelectSchema.optional(),
  data: z.union([ PostUpdateInputSchema,PostUncheckedUpdateInputSchema ]),
  where: PostWhereUniqueInputSchema,
}).strict() ;

export const PostUpdateManyArgsSchema: z.ZodType<Prisma.PostUpdateManyArgs> = z.object({
  data: z.union([ PostUpdateManyMutationInputSchema,PostUncheckedUpdateManyInputSchema ]),
  where: PostWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const PostUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PostUpdateManyAndReturnArgs> = z.object({
  data: z.union([ PostUpdateManyMutationInputSchema,PostUncheckedUpdateManyInputSchema ]),
  where: PostWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const PostDeleteManyArgsSchema: z.ZodType<Prisma.PostDeleteManyArgs> = z.object({
  where: PostWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const UserCreateArgsSchema: z.ZodType<Prisma.UserCreateArgs> = z.object({
  select: UserSelectSchema.optional(),
  data: z.union([ UserCreateInputSchema,UserUncheckedCreateInputSchema ]),
}).strict() ;

export const UserUpsertArgsSchema: z.ZodType<Prisma.UserUpsertArgs> = z.object({
  select: UserSelectSchema.optional(),
  where: UserWhereUniqueInputSchema,
  create: z.union([ UserCreateInputSchema,UserUncheckedCreateInputSchema ]),
  update: z.union([ UserUpdateInputSchema,UserUncheckedUpdateInputSchema ]),
}).strict() ;

export const UserCreateManyArgsSchema: z.ZodType<Prisma.UserCreateManyArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema,UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const UserCreateManyAndReturnArgsSchema: z.ZodType<Prisma.UserCreateManyAndReturnArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema,UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const UserDeleteArgsSchema: z.ZodType<Prisma.UserDeleteArgs> = z.object({
  select: UserSelectSchema.optional(),
  where: UserWhereUniqueInputSchema,
}).strict() ;

export const UserUpdateArgsSchema: z.ZodType<Prisma.UserUpdateArgs> = z.object({
  select: UserSelectSchema.optional(),
  data: z.union([ UserUpdateInputSchema,UserUncheckedUpdateInputSchema ]),
  where: UserWhereUniqueInputSchema,
}).strict() ;

export const UserUpdateManyArgsSchema: z.ZodType<Prisma.UserUpdateManyArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema,UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const UserUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.UserUpdateManyAndReturnArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema,UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const UserDeleteManyArgsSchema: z.ZodType<Prisma.UserDeleteManyArgs> = z.object({
  where: UserWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const DemoVideoCreateArgsSchema: z.ZodType<Prisma.DemoVideoCreateArgs> = z.object({
  select: DemoVideoSelectSchema.optional(),
  data: z.union([ DemoVideoCreateInputSchema,DemoVideoUncheckedCreateInputSchema ]),
}).strict() ;

export const DemoVideoUpsertArgsSchema: z.ZodType<Prisma.DemoVideoUpsertArgs> = z.object({
  select: DemoVideoSelectSchema.optional(),
  where: DemoVideoWhereUniqueInputSchema,
  create: z.union([ DemoVideoCreateInputSchema,DemoVideoUncheckedCreateInputSchema ]),
  update: z.union([ DemoVideoUpdateInputSchema,DemoVideoUncheckedUpdateInputSchema ]),
}).strict() ;

export const DemoVideoCreateManyArgsSchema: z.ZodType<Prisma.DemoVideoCreateManyArgs> = z.object({
  data: z.union([ DemoVideoCreateManyInputSchema,DemoVideoCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const DemoVideoCreateManyAndReturnArgsSchema: z.ZodType<Prisma.DemoVideoCreateManyAndReturnArgs> = z.object({
  data: z.union([ DemoVideoCreateManyInputSchema,DemoVideoCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const DemoVideoDeleteArgsSchema: z.ZodType<Prisma.DemoVideoDeleteArgs> = z.object({
  select: DemoVideoSelectSchema.optional(),
  where: DemoVideoWhereUniqueInputSchema,
}).strict() ;

export const DemoVideoUpdateArgsSchema: z.ZodType<Prisma.DemoVideoUpdateArgs> = z.object({
  select: DemoVideoSelectSchema.optional(),
  data: z.union([ DemoVideoUpdateInputSchema,DemoVideoUncheckedUpdateInputSchema ]),
  where: DemoVideoWhereUniqueInputSchema,
}).strict() ;

export const DemoVideoUpdateManyArgsSchema: z.ZodType<Prisma.DemoVideoUpdateManyArgs> = z.object({
  data: z.union([ DemoVideoUpdateManyMutationInputSchema,DemoVideoUncheckedUpdateManyInputSchema ]),
  where: DemoVideoWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const DemoVideoUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.DemoVideoUpdateManyAndReturnArgs> = z.object({
  data: z.union([ DemoVideoUpdateManyMutationInputSchema,DemoVideoUncheckedUpdateManyInputSchema ]),
  where: DemoVideoWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const DemoVideoDeleteManyArgsSchema: z.ZodType<Prisma.DemoVideoDeleteManyArgs> = z.object({
  where: DemoVideoWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const SampleVideoCreateArgsSchema: z.ZodType<Prisma.SampleVideoCreateArgs> = z.object({
  select: SampleVideoSelectSchema.optional(),
  data: z.union([ SampleVideoCreateInputSchema,SampleVideoUncheckedCreateInputSchema ]),
}).strict() ;

export const SampleVideoUpsertArgsSchema: z.ZodType<Prisma.SampleVideoUpsertArgs> = z.object({
  select: SampleVideoSelectSchema.optional(),
  where: SampleVideoWhereUniqueInputSchema,
  create: z.union([ SampleVideoCreateInputSchema,SampleVideoUncheckedCreateInputSchema ]),
  update: z.union([ SampleVideoUpdateInputSchema,SampleVideoUncheckedUpdateInputSchema ]),
}).strict() ;

export const SampleVideoCreateManyArgsSchema: z.ZodType<Prisma.SampleVideoCreateManyArgs> = z.object({
  data: z.union([ SampleVideoCreateManyInputSchema,SampleVideoCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const SampleVideoCreateManyAndReturnArgsSchema: z.ZodType<Prisma.SampleVideoCreateManyAndReturnArgs> = z.object({
  data: z.union([ SampleVideoCreateManyInputSchema,SampleVideoCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const SampleVideoDeleteArgsSchema: z.ZodType<Prisma.SampleVideoDeleteArgs> = z.object({
  select: SampleVideoSelectSchema.optional(),
  where: SampleVideoWhereUniqueInputSchema,
}).strict() ;

export const SampleVideoUpdateArgsSchema: z.ZodType<Prisma.SampleVideoUpdateArgs> = z.object({
  select: SampleVideoSelectSchema.optional(),
  data: z.union([ SampleVideoUpdateInputSchema,SampleVideoUncheckedUpdateInputSchema ]),
  where: SampleVideoWhereUniqueInputSchema,
}).strict() ;

export const SampleVideoUpdateManyArgsSchema: z.ZodType<Prisma.SampleVideoUpdateManyArgs> = z.object({
  data: z.union([ SampleVideoUpdateManyMutationInputSchema,SampleVideoUncheckedUpdateManyInputSchema ]),
  where: SampleVideoWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const SampleVideoUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.SampleVideoUpdateManyAndReturnArgs> = z.object({
  data: z.union([ SampleVideoUpdateManyMutationInputSchema,SampleVideoUncheckedUpdateManyInputSchema ]),
  where: SampleVideoWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const SampleVideoDeleteManyArgsSchema: z.ZodType<Prisma.SampleVideoDeleteManyArgs> = z.object({
  where: SampleVideoWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;
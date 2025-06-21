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

export const DemoVideoScalarFieldEnumSchema = z.enum(['id','s3Url','durationSeconds','createdAt','updatedAt']);

export const ShortDemoScalarFieldEnumSchema = z.enum(['id','demoVideoId','durationSeconds','createdAt','updatedAt','demoCutUrl','productInfo','segments','colorPalette']);

export const HookViralVideoScalarFieldEnumSchema = z.enum(['id','webpageUrl','s3Url','hookEndTimestamp','hookCutConfidence','hookCutUrl','hookInfo','title','description','views','comments','likes','durationSeconds','createdAt','updatedAt','colorPalette']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const NullableJsonNullValueInputSchema = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const JsonNullValueInputSchema = z.enum(['JsonNull',]).transform((value) => (value === 'JsonNull' ? Prisma.JsonNull : value));

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
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type DemoVideo = z.infer<typeof DemoVideoSchema>

/////////////////////////////////////////
// SHORT DEMO SCHEMA
/////////////////////////////////////////

export const ShortDemoSchema = z.object({
  id: z.string().cuid(),
  demoVideoId: z.string(),
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  demoCutUrl: z.string(),
  productInfo: z.string().nullable(),
  segments: JsonValueSchema,
  colorPalette: JsonValueSchema.nullable(),
})

export type ShortDemo = z.infer<typeof ShortDemoSchema>

/////////////////////////////////////////
// HOOK VIRAL VIDEO SCHEMA
/////////////////////////////////////////

export const HookViralVideoSchema = z.object({
  id: z.string().cuid(),
  webpageUrl: z.string(),
  s3Url: z.string(),
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
  colorPalette: JsonValueSchema.nullable(),
})

export type HookViralVideo = z.infer<typeof HookViralVideoSchema>

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

export const DemoVideoIncludeSchema: z.ZodType<Prisma.DemoVideoInclude> = z.object({
  shortDemos: z.union([z.boolean(),z.lazy(() => ShortDemoFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => DemoVideoCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const DemoVideoArgsSchema: z.ZodType<Prisma.DemoVideoDefaultArgs> = z.object({
  select: z.lazy(() => DemoVideoSelectSchema).optional(),
  include: z.lazy(() => DemoVideoIncludeSchema).optional(),
}).strict();

export const DemoVideoCountOutputTypeArgsSchema: z.ZodType<Prisma.DemoVideoCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => DemoVideoCountOutputTypeSelectSchema).nullish(),
}).strict();

export const DemoVideoCountOutputTypeSelectSchema: z.ZodType<Prisma.DemoVideoCountOutputTypeSelect> = z.object({
  shortDemos: z.boolean().optional(),
}).strict();

export const DemoVideoSelectSchema: z.ZodType<Prisma.DemoVideoSelect> = z.object({
  id: z.boolean().optional(),
  s3Url: z.boolean().optional(),
  durationSeconds: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  shortDemos: z.union([z.boolean(),z.lazy(() => ShortDemoFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => DemoVideoCountOutputTypeArgsSchema)]).optional(),
}).strict()

// SHORT DEMO
//------------------------------------------------------

export const ShortDemoIncludeSchema: z.ZodType<Prisma.ShortDemoInclude> = z.object({
  demoVideo: z.union([z.boolean(),z.lazy(() => DemoVideoArgsSchema)]).optional(),
}).strict()

export const ShortDemoArgsSchema: z.ZodType<Prisma.ShortDemoDefaultArgs> = z.object({
  select: z.lazy(() => ShortDemoSelectSchema).optional(),
  include: z.lazy(() => ShortDemoIncludeSchema).optional(),
}).strict();

export const ShortDemoSelectSchema: z.ZodType<Prisma.ShortDemoSelect> = z.object({
  id: z.boolean().optional(),
  demoVideoId: z.boolean().optional(),
  durationSeconds: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  demoCutUrl: z.boolean().optional(),
  productInfo: z.boolean().optional(),
  segments: z.boolean().optional(),
  colorPalette: z.boolean().optional(),
  demoVideo: z.union([z.boolean(),z.lazy(() => DemoVideoArgsSchema)]).optional(),
}).strict()

// HOOK VIRAL VIDEO
//------------------------------------------------------

export const HookViralVideoSelectSchema: z.ZodType<Prisma.HookViralVideoSelect> = z.object({
  id: z.boolean().optional(),
  webpageUrl: z.boolean().optional(),
  s3Url: z.boolean().optional(),
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
  colorPalette: z.boolean().optional(),
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
  durationSeconds: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  shortDemos: z.lazy(() => ShortDemoListRelationFilterSchema).optional()
}).strict();

export const DemoVideoOrderByWithRelationInputSchema: z.ZodType<Prisma.DemoVideoOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
  durationSeconds: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  shortDemos: z.lazy(() => ShortDemoOrderByRelationAggregateInputSchema).optional()
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
  durationSeconds: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  shortDemos: z.lazy(() => ShortDemoListRelationFilterSchema).optional()
}).strict());

export const DemoVideoOrderByWithAggregationInputSchema: z.ZodType<Prisma.DemoVideoOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
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
  durationSeconds: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const ShortDemoWhereInputSchema: z.ZodType<Prisma.ShortDemoWhereInput> = z.object({
  AND: z.union([ z.lazy(() => ShortDemoWhereInputSchema),z.lazy(() => ShortDemoWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ShortDemoWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ShortDemoWhereInputSchema),z.lazy(() => ShortDemoWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  demoVideoId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  durationSeconds: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  demoCutUrl: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  productInfo: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  segments: z.lazy(() => JsonFilterSchema).optional(),
  colorPalette: z.lazy(() => JsonNullableFilterSchema).optional(),
  demoVideo: z.union([ z.lazy(() => DemoVideoScalarRelationFilterSchema),z.lazy(() => DemoVideoWhereInputSchema) ]).optional(),
}).strict();

export const ShortDemoOrderByWithRelationInputSchema: z.ZodType<Prisma.ShortDemoOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  demoVideoId: z.lazy(() => SortOrderSchema).optional(),
  durationSeconds: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  demoCutUrl: z.lazy(() => SortOrderSchema).optional(),
  productInfo: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  segments: z.lazy(() => SortOrderSchema).optional(),
  colorPalette: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  demoVideo: z.lazy(() => DemoVideoOrderByWithRelationInputSchema).optional()
}).strict();

export const ShortDemoWhereUniqueInputSchema: z.ZodType<Prisma.ShortDemoWhereUniqueInput> = z.object({
  id: z.string().cuid()
})
.and(z.object({
  id: z.string().cuid().optional(),
  AND: z.union([ z.lazy(() => ShortDemoWhereInputSchema),z.lazy(() => ShortDemoWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ShortDemoWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ShortDemoWhereInputSchema),z.lazy(() => ShortDemoWhereInputSchema).array() ]).optional(),
  demoVideoId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  durationSeconds: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  demoCutUrl: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  productInfo: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  segments: z.lazy(() => JsonFilterSchema).optional(),
  colorPalette: z.lazy(() => JsonNullableFilterSchema).optional(),
  demoVideo: z.union([ z.lazy(() => DemoVideoScalarRelationFilterSchema),z.lazy(() => DemoVideoWhereInputSchema) ]).optional(),
}).strict());

export const ShortDemoOrderByWithAggregationInputSchema: z.ZodType<Prisma.ShortDemoOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  demoVideoId: z.lazy(() => SortOrderSchema).optional(),
  durationSeconds: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  demoCutUrl: z.lazy(() => SortOrderSchema).optional(),
  productInfo: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  segments: z.lazy(() => SortOrderSchema).optional(),
  colorPalette: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => ShortDemoCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => ShortDemoAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => ShortDemoMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => ShortDemoMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => ShortDemoSumOrderByAggregateInputSchema).optional()
}).strict();

export const ShortDemoScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.ShortDemoScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => ShortDemoScalarWhereWithAggregatesInputSchema),z.lazy(() => ShortDemoScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => ShortDemoScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ShortDemoScalarWhereWithAggregatesInputSchema),z.lazy(() => ShortDemoScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  demoVideoId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  durationSeconds: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  demoCutUrl: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  productInfo: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  segments: z.lazy(() => JsonWithAggregatesFilterSchema).optional(),
  colorPalette: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional()
}).strict();

export const HookViralVideoWhereInputSchema: z.ZodType<Prisma.HookViralVideoWhereInput> = z.object({
  AND: z.union([ z.lazy(() => HookViralVideoWhereInputSchema),z.lazy(() => HookViralVideoWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => HookViralVideoWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => HookViralVideoWhereInputSchema),z.lazy(() => HookViralVideoWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  webpageUrl: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  s3Url: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
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
  colorPalette: z.lazy(() => JsonNullableFilterSchema).optional()
}).strict();

export const HookViralVideoOrderByWithRelationInputSchema: z.ZodType<Prisma.HookViralVideoOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  webpageUrl: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
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
  colorPalette: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
}).strict();

export const HookViralVideoWhereUniqueInputSchema: z.ZodType<Prisma.HookViralVideoWhereUniqueInput> = z.union([
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
  AND: z.union([ z.lazy(() => HookViralVideoWhereInputSchema),z.lazy(() => HookViralVideoWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => HookViralVideoWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => HookViralVideoWhereInputSchema),z.lazy(() => HookViralVideoWhereInputSchema).array() ]).optional(),
  s3Url: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
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
  colorPalette: z.lazy(() => JsonNullableFilterSchema).optional()
}).strict());

export const HookViralVideoOrderByWithAggregationInputSchema: z.ZodType<Prisma.HookViralVideoOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  webpageUrl: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
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
  colorPalette: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => HookViralVideoCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => HookViralVideoAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => HookViralVideoMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => HookViralVideoMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => HookViralVideoSumOrderByAggregateInputSchema).optional()
}).strict();

export const HookViralVideoScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.HookViralVideoScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => HookViralVideoScalarWhereWithAggregatesInputSchema),z.lazy(() => HookViralVideoScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => HookViralVideoScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => HookViralVideoScalarWhereWithAggregatesInputSchema),z.lazy(() => HookViralVideoScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  webpageUrl: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  s3Url: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
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
  colorPalette: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional()
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
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  shortDemos: z.lazy(() => ShortDemoCreateNestedManyWithoutDemoVideoInputSchema).optional()
}).strict();

export const DemoVideoUncheckedCreateInputSchema: z.ZodType<Prisma.DemoVideoUncheckedCreateInput> = z.object({
  id: z.string().cuid().optional(),
  s3Url: z.string(),
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  shortDemos: z.lazy(() => ShortDemoUncheckedCreateNestedManyWithoutDemoVideoInputSchema).optional()
}).strict();

export const DemoVideoUpdateInputSchema: z.ZodType<Prisma.DemoVideoUpdateInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  s3Url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  shortDemos: z.lazy(() => ShortDemoUpdateManyWithoutDemoVideoNestedInputSchema).optional()
}).strict();

export const DemoVideoUncheckedUpdateInputSchema: z.ZodType<Prisma.DemoVideoUncheckedUpdateInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  s3Url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  shortDemos: z.lazy(() => ShortDemoUncheckedUpdateManyWithoutDemoVideoNestedInputSchema).optional()
}).strict();

export const DemoVideoCreateManyInputSchema: z.ZodType<Prisma.DemoVideoCreateManyInput> = z.object({
  id: z.string().cuid().optional(),
  s3Url: z.string(),
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const DemoVideoUpdateManyMutationInputSchema: z.ZodType<Prisma.DemoVideoUpdateManyMutationInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  s3Url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const DemoVideoUncheckedUpdateManyInputSchema: z.ZodType<Prisma.DemoVideoUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  s3Url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const ShortDemoCreateInputSchema: z.ZodType<Prisma.ShortDemoCreateInput> = z.object({
  id: z.string().cuid().optional(),
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  demoCutUrl: z.string(),
  productInfo: z.string().optional().nullable(),
  segments: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]),
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  demoVideo: z.lazy(() => DemoVideoCreateNestedOneWithoutShortDemosInputSchema)
}).strict();

export const ShortDemoUncheckedCreateInputSchema: z.ZodType<Prisma.ShortDemoUncheckedCreateInput> = z.object({
  id: z.string().cuid().optional(),
  demoVideoId: z.string(),
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  demoCutUrl: z.string(),
  productInfo: z.string().optional().nullable(),
  segments: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]),
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const ShortDemoUpdateInputSchema: z.ZodType<Prisma.ShortDemoUpdateInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  demoCutUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  segments: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  demoVideo: z.lazy(() => DemoVideoUpdateOneRequiredWithoutShortDemosNestedInputSchema).optional()
}).strict();

export const ShortDemoUncheckedUpdateInputSchema: z.ZodType<Prisma.ShortDemoUncheckedUpdateInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  demoVideoId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  demoCutUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  segments: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const ShortDemoCreateManyInputSchema: z.ZodType<Prisma.ShortDemoCreateManyInput> = z.object({
  id: z.string().cuid().optional(),
  demoVideoId: z.string(),
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  demoCutUrl: z.string(),
  productInfo: z.string().optional().nullable(),
  segments: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]),
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const ShortDemoUpdateManyMutationInputSchema: z.ZodType<Prisma.ShortDemoUpdateManyMutationInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  demoCutUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  segments: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const ShortDemoUncheckedUpdateManyInputSchema: z.ZodType<Prisma.ShortDemoUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  demoVideoId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  demoCutUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  segments: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const HookViralVideoCreateInputSchema: z.ZodType<Prisma.HookViralVideoCreateInput> = z.object({
  id: z.string().cuid().optional(),
  webpageUrl: z.string(),
  s3Url: z.string(),
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
  updatedAt: z.coerce.date().optional(),
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const HookViralVideoUncheckedCreateInputSchema: z.ZodType<Prisma.HookViralVideoUncheckedCreateInput> = z.object({
  id: z.string().cuid().optional(),
  webpageUrl: z.string(),
  s3Url: z.string(),
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
  updatedAt: z.coerce.date().optional(),
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const HookViralVideoUpdateInputSchema: z.ZodType<Prisma.HookViralVideoUpdateInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  webpageUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  s3Url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
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
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const HookViralVideoUncheckedUpdateInputSchema: z.ZodType<Prisma.HookViralVideoUncheckedUpdateInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  webpageUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  s3Url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
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
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const HookViralVideoCreateManyInputSchema: z.ZodType<Prisma.HookViralVideoCreateManyInput> = z.object({
  id: z.string().cuid().optional(),
  webpageUrl: z.string(),
  s3Url: z.string(),
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
  updatedAt: z.coerce.date().optional(),
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const HookViralVideoUpdateManyMutationInputSchema: z.ZodType<Prisma.HookViralVideoUpdateManyMutationInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  webpageUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  s3Url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
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
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const HookViralVideoUncheckedUpdateManyInputSchema: z.ZodType<Prisma.HookViralVideoUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  webpageUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  s3Url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
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
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
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

export const ShortDemoListRelationFilterSchema: z.ZodType<Prisma.ShortDemoListRelationFilter> = z.object({
  every: z.lazy(() => ShortDemoWhereInputSchema).optional(),
  some: z.lazy(() => ShortDemoWhereInputSchema).optional(),
  none: z.lazy(() => ShortDemoWhereInputSchema).optional()
}).strict();

export const ShortDemoOrderByRelationAggregateInputSchema: z.ZodType<Prisma.ShortDemoOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DemoVideoCountOrderByAggregateInputSchema: z.ZodType<Prisma.DemoVideoCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
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
  durationSeconds: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DemoVideoMinOrderByAggregateInputSchema: z.ZodType<Prisma.DemoVideoMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
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

export const JsonFilterSchema: z.ZodType<Prisma.JsonFilter> = z.object({
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

export const DemoVideoScalarRelationFilterSchema: z.ZodType<Prisma.DemoVideoScalarRelationFilter> = z.object({
  is: z.lazy(() => DemoVideoWhereInputSchema).optional(),
  isNot: z.lazy(() => DemoVideoWhereInputSchema).optional()
}).strict();

export const ShortDemoCountOrderByAggregateInputSchema: z.ZodType<Prisma.ShortDemoCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  demoVideoId: z.lazy(() => SortOrderSchema).optional(),
  durationSeconds: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  demoCutUrl: z.lazy(() => SortOrderSchema).optional(),
  productInfo: z.lazy(() => SortOrderSchema).optional(),
  segments: z.lazy(() => SortOrderSchema).optional(),
  colorPalette: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ShortDemoAvgOrderByAggregateInputSchema: z.ZodType<Prisma.ShortDemoAvgOrderByAggregateInput> = z.object({
  durationSeconds: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ShortDemoMaxOrderByAggregateInputSchema: z.ZodType<Prisma.ShortDemoMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  demoVideoId: z.lazy(() => SortOrderSchema).optional(),
  durationSeconds: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  demoCutUrl: z.lazy(() => SortOrderSchema).optional(),
  productInfo: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ShortDemoMinOrderByAggregateInputSchema: z.ZodType<Prisma.ShortDemoMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  demoVideoId: z.lazy(() => SortOrderSchema).optional(),
  durationSeconds: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  demoCutUrl: z.lazy(() => SortOrderSchema).optional(),
  productInfo: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ShortDemoSumOrderByAggregateInputSchema: z.ZodType<Prisma.ShortDemoSumOrderByAggregateInput> = z.object({
  durationSeconds: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const JsonWithAggregatesFilterSchema: z.ZodType<Prisma.JsonWithAggregatesFilter> = z.object({
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
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedJsonFilterSchema).optional(),
  _max: z.lazy(() => NestedJsonFilterSchema).optional()
}).strict();

export const HookViralVideoCountOrderByAggregateInputSchema: z.ZodType<Prisma.HookViralVideoCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  webpageUrl: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
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
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  colorPalette: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const HookViralVideoAvgOrderByAggregateInputSchema: z.ZodType<Prisma.HookViralVideoAvgOrderByAggregateInput> = z.object({
  views: z.lazy(() => SortOrderSchema).optional(),
  comments: z.lazy(() => SortOrderSchema).optional(),
  likes: z.lazy(() => SortOrderSchema).optional(),
  durationSeconds: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const HookViralVideoMaxOrderByAggregateInputSchema: z.ZodType<Prisma.HookViralVideoMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  webpageUrl: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
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

export const HookViralVideoMinOrderByAggregateInputSchema: z.ZodType<Prisma.HookViralVideoMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  webpageUrl: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
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

export const HookViralVideoSumOrderByAggregateInputSchema: z.ZodType<Prisma.HookViralVideoSumOrderByAggregateInput> = z.object({
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

export const ShortDemoCreateNestedManyWithoutDemoVideoInputSchema: z.ZodType<Prisma.ShortDemoCreateNestedManyWithoutDemoVideoInput> = z.object({
  create: z.union([ z.lazy(() => ShortDemoCreateWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoCreateWithoutDemoVideoInputSchema).array(),z.lazy(() => ShortDemoUncheckedCreateWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoUncheckedCreateWithoutDemoVideoInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ShortDemoCreateOrConnectWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoCreateOrConnectWithoutDemoVideoInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ShortDemoCreateManyDemoVideoInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ShortDemoWhereUniqueInputSchema),z.lazy(() => ShortDemoWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const ShortDemoUncheckedCreateNestedManyWithoutDemoVideoInputSchema: z.ZodType<Prisma.ShortDemoUncheckedCreateNestedManyWithoutDemoVideoInput> = z.object({
  create: z.union([ z.lazy(() => ShortDemoCreateWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoCreateWithoutDemoVideoInputSchema).array(),z.lazy(() => ShortDemoUncheckedCreateWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoUncheckedCreateWithoutDemoVideoInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ShortDemoCreateOrConnectWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoCreateOrConnectWithoutDemoVideoInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ShortDemoCreateManyDemoVideoInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ShortDemoWhereUniqueInputSchema),z.lazy(() => ShortDemoWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const IntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.IntFieldUpdateOperationsInput> = z.object({
  set: z.number().optional(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional()
}).strict();

export const ShortDemoUpdateManyWithoutDemoVideoNestedInputSchema: z.ZodType<Prisma.ShortDemoUpdateManyWithoutDemoVideoNestedInput> = z.object({
  create: z.union([ z.lazy(() => ShortDemoCreateWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoCreateWithoutDemoVideoInputSchema).array(),z.lazy(() => ShortDemoUncheckedCreateWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoUncheckedCreateWithoutDemoVideoInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ShortDemoCreateOrConnectWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoCreateOrConnectWithoutDemoVideoInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ShortDemoUpsertWithWhereUniqueWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoUpsertWithWhereUniqueWithoutDemoVideoInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ShortDemoCreateManyDemoVideoInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ShortDemoWhereUniqueInputSchema),z.lazy(() => ShortDemoWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ShortDemoWhereUniqueInputSchema),z.lazy(() => ShortDemoWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ShortDemoWhereUniqueInputSchema),z.lazy(() => ShortDemoWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ShortDemoWhereUniqueInputSchema),z.lazy(() => ShortDemoWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ShortDemoUpdateWithWhereUniqueWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoUpdateWithWhereUniqueWithoutDemoVideoInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ShortDemoUpdateManyWithWhereWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoUpdateManyWithWhereWithoutDemoVideoInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ShortDemoScalarWhereInputSchema),z.lazy(() => ShortDemoScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const ShortDemoUncheckedUpdateManyWithoutDemoVideoNestedInputSchema: z.ZodType<Prisma.ShortDemoUncheckedUpdateManyWithoutDemoVideoNestedInput> = z.object({
  create: z.union([ z.lazy(() => ShortDemoCreateWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoCreateWithoutDemoVideoInputSchema).array(),z.lazy(() => ShortDemoUncheckedCreateWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoUncheckedCreateWithoutDemoVideoInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ShortDemoCreateOrConnectWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoCreateOrConnectWithoutDemoVideoInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ShortDemoUpsertWithWhereUniqueWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoUpsertWithWhereUniqueWithoutDemoVideoInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ShortDemoCreateManyDemoVideoInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ShortDemoWhereUniqueInputSchema),z.lazy(() => ShortDemoWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ShortDemoWhereUniqueInputSchema),z.lazy(() => ShortDemoWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ShortDemoWhereUniqueInputSchema),z.lazy(() => ShortDemoWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ShortDemoWhereUniqueInputSchema),z.lazy(() => ShortDemoWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ShortDemoUpdateWithWhereUniqueWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoUpdateWithWhereUniqueWithoutDemoVideoInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ShortDemoUpdateManyWithWhereWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoUpdateManyWithWhereWithoutDemoVideoInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ShortDemoScalarWhereInputSchema),z.lazy(() => ShortDemoScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const DemoVideoCreateNestedOneWithoutShortDemosInputSchema: z.ZodType<Prisma.DemoVideoCreateNestedOneWithoutShortDemosInput> = z.object({
  create: z.union([ z.lazy(() => DemoVideoCreateWithoutShortDemosInputSchema),z.lazy(() => DemoVideoUncheckedCreateWithoutShortDemosInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => DemoVideoCreateOrConnectWithoutShortDemosInputSchema).optional(),
  connect: z.lazy(() => DemoVideoWhereUniqueInputSchema).optional()
}).strict();

export const DemoVideoUpdateOneRequiredWithoutShortDemosNestedInputSchema: z.ZodType<Prisma.DemoVideoUpdateOneRequiredWithoutShortDemosNestedInput> = z.object({
  create: z.union([ z.lazy(() => DemoVideoCreateWithoutShortDemosInputSchema),z.lazy(() => DemoVideoUncheckedCreateWithoutShortDemosInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => DemoVideoCreateOrConnectWithoutShortDemosInputSchema).optional(),
  upsert: z.lazy(() => DemoVideoUpsertWithoutShortDemosInputSchema).optional(),
  connect: z.lazy(() => DemoVideoWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => DemoVideoUpdateToOneWithWhereWithoutShortDemosInputSchema),z.lazy(() => DemoVideoUpdateWithoutShortDemosInputSchema),z.lazy(() => DemoVideoUncheckedUpdateWithoutShortDemosInputSchema) ]).optional(),
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

export const NestedJsonFilterSchema: z.ZodType<Prisma.NestedJsonFilter> = z.object({
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

export const ShortDemoCreateWithoutDemoVideoInputSchema: z.ZodType<Prisma.ShortDemoCreateWithoutDemoVideoInput> = z.object({
  id: z.string().cuid().optional(),
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  demoCutUrl: z.string(),
  productInfo: z.string().optional().nullable(),
  segments: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]),
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const ShortDemoUncheckedCreateWithoutDemoVideoInputSchema: z.ZodType<Prisma.ShortDemoUncheckedCreateWithoutDemoVideoInput> = z.object({
  id: z.string().cuid().optional(),
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  demoCutUrl: z.string(),
  productInfo: z.string().optional().nullable(),
  segments: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]),
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const ShortDemoCreateOrConnectWithoutDemoVideoInputSchema: z.ZodType<Prisma.ShortDemoCreateOrConnectWithoutDemoVideoInput> = z.object({
  where: z.lazy(() => ShortDemoWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ShortDemoCreateWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoUncheckedCreateWithoutDemoVideoInputSchema) ]),
}).strict();

export const ShortDemoCreateManyDemoVideoInputEnvelopeSchema: z.ZodType<Prisma.ShortDemoCreateManyDemoVideoInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => ShortDemoCreateManyDemoVideoInputSchema),z.lazy(() => ShortDemoCreateManyDemoVideoInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const ShortDemoUpsertWithWhereUniqueWithoutDemoVideoInputSchema: z.ZodType<Prisma.ShortDemoUpsertWithWhereUniqueWithoutDemoVideoInput> = z.object({
  where: z.lazy(() => ShortDemoWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ShortDemoUpdateWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoUncheckedUpdateWithoutDemoVideoInputSchema) ]),
  create: z.union([ z.lazy(() => ShortDemoCreateWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoUncheckedCreateWithoutDemoVideoInputSchema) ]),
}).strict();

export const ShortDemoUpdateWithWhereUniqueWithoutDemoVideoInputSchema: z.ZodType<Prisma.ShortDemoUpdateWithWhereUniqueWithoutDemoVideoInput> = z.object({
  where: z.lazy(() => ShortDemoWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ShortDemoUpdateWithoutDemoVideoInputSchema),z.lazy(() => ShortDemoUncheckedUpdateWithoutDemoVideoInputSchema) ]),
}).strict();

export const ShortDemoUpdateManyWithWhereWithoutDemoVideoInputSchema: z.ZodType<Prisma.ShortDemoUpdateManyWithWhereWithoutDemoVideoInput> = z.object({
  where: z.lazy(() => ShortDemoScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ShortDemoUpdateManyMutationInputSchema),z.lazy(() => ShortDemoUncheckedUpdateManyWithoutDemoVideoInputSchema) ]),
}).strict();

export const ShortDemoScalarWhereInputSchema: z.ZodType<Prisma.ShortDemoScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => ShortDemoScalarWhereInputSchema),z.lazy(() => ShortDemoScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ShortDemoScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ShortDemoScalarWhereInputSchema),z.lazy(() => ShortDemoScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  demoVideoId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  durationSeconds: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  demoCutUrl: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  productInfo: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  segments: z.lazy(() => JsonFilterSchema).optional(),
  colorPalette: z.lazy(() => JsonNullableFilterSchema).optional()
}).strict();

export const DemoVideoCreateWithoutShortDemosInputSchema: z.ZodType<Prisma.DemoVideoCreateWithoutShortDemosInput> = z.object({
  id: z.string().cuid().optional(),
  s3Url: z.string(),
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const DemoVideoUncheckedCreateWithoutShortDemosInputSchema: z.ZodType<Prisma.DemoVideoUncheckedCreateWithoutShortDemosInput> = z.object({
  id: z.string().cuid().optional(),
  s3Url: z.string(),
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const DemoVideoCreateOrConnectWithoutShortDemosInputSchema: z.ZodType<Prisma.DemoVideoCreateOrConnectWithoutShortDemosInput> = z.object({
  where: z.lazy(() => DemoVideoWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => DemoVideoCreateWithoutShortDemosInputSchema),z.lazy(() => DemoVideoUncheckedCreateWithoutShortDemosInputSchema) ]),
}).strict();

export const DemoVideoUpsertWithoutShortDemosInputSchema: z.ZodType<Prisma.DemoVideoUpsertWithoutShortDemosInput> = z.object({
  update: z.union([ z.lazy(() => DemoVideoUpdateWithoutShortDemosInputSchema),z.lazy(() => DemoVideoUncheckedUpdateWithoutShortDemosInputSchema) ]),
  create: z.union([ z.lazy(() => DemoVideoCreateWithoutShortDemosInputSchema),z.lazy(() => DemoVideoUncheckedCreateWithoutShortDemosInputSchema) ]),
  where: z.lazy(() => DemoVideoWhereInputSchema).optional()
}).strict();

export const DemoVideoUpdateToOneWithWhereWithoutShortDemosInputSchema: z.ZodType<Prisma.DemoVideoUpdateToOneWithWhereWithoutShortDemosInput> = z.object({
  where: z.lazy(() => DemoVideoWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => DemoVideoUpdateWithoutShortDemosInputSchema),z.lazy(() => DemoVideoUncheckedUpdateWithoutShortDemosInputSchema) ]),
}).strict();

export const DemoVideoUpdateWithoutShortDemosInputSchema: z.ZodType<Prisma.DemoVideoUpdateWithoutShortDemosInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  s3Url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const DemoVideoUncheckedUpdateWithoutShortDemosInputSchema: z.ZodType<Prisma.DemoVideoUncheckedUpdateWithoutShortDemosInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  s3Url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const ShortDemoCreateManyDemoVideoInputSchema: z.ZodType<Prisma.ShortDemoCreateManyDemoVideoInput> = z.object({
  id: z.string().cuid().optional(),
  durationSeconds: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  demoCutUrl: z.string(),
  productInfo: z.string().optional().nullable(),
  segments: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]),
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const ShortDemoUpdateWithoutDemoVideoInputSchema: z.ZodType<Prisma.ShortDemoUpdateWithoutDemoVideoInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  demoCutUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  segments: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const ShortDemoUncheckedUpdateWithoutDemoVideoInputSchema: z.ZodType<Prisma.ShortDemoUncheckedUpdateWithoutDemoVideoInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  demoCutUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  segments: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const ShortDemoUncheckedUpdateManyWithoutDemoVideoInputSchema: z.ZodType<Prisma.ShortDemoUncheckedUpdateManyWithoutDemoVideoInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  durationSeconds: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  demoCutUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productInfo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  segments: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  colorPalette: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
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
  include: DemoVideoIncludeSchema.optional(),
  where: DemoVideoWhereInputSchema.optional(),
  orderBy: z.union([ DemoVideoOrderByWithRelationInputSchema.array(),DemoVideoOrderByWithRelationInputSchema ]).optional(),
  cursor: DemoVideoWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ DemoVideoScalarFieldEnumSchema,DemoVideoScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const DemoVideoFindFirstOrThrowArgsSchema: z.ZodType<Prisma.DemoVideoFindFirstOrThrowArgs> = z.object({
  select: DemoVideoSelectSchema.optional(),
  include: DemoVideoIncludeSchema.optional(),
  where: DemoVideoWhereInputSchema.optional(),
  orderBy: z.union([ DemoVideoOrderByWithRelationInputSchema.array(),DemoVideoOrderByWithRelationInputSchema ]).optional(),
  cursor: DemoVideoWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ DemoVideoScalarFieldEnumSchema,DemoVideoScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const DemoVideoFindManyArgsSchema: z.ZodType<Prisma.DemoVideoFindManyArgs> = z.object({
  select: DemoVideoSelectSchema.optional(),
  include: DemoVideoIncludeSchema.optional(),
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
  include: DemoVideoIncludeSchema.optional(),
  where: DemoVideoWhereUniqueInputSchema,
}).strict() ;

export const DemoVideoFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.DemoVideoFindUniqueOrThrowArgs> = z.object({
  select: DemoVideoSelectSchema.optional(),
  include: DemoVideoIncludeSchema.optional(),
  where: DemoVideoWhereUniqueInputSchema,
}).strict() ;

export const ShortDemoFindFirstArgsSchema: z.ZodType<Prisma.ShortDemoFindFirstArgs> = z.object({
  select: ShortDemoSelectSchema.optional(),
  include: ShortDemoIncludeSchema.optional(),
  where: ShortDemoWhereInputSchema.optional(),
  orderBy: z.union([ ShortDemoOrderByWithRelationInputSchema.array(),ShortDemoOrderByWithRelationInputSchema ]).optional(),
  cursor: ShortDemoWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ShortDemoScalarFieldEnumSchema,ShortDemoScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const ShortDemoFindFirstOrThrowArgsSchema: z.ZodType<Prisma.ShortDemoFindFirstOrThrowArgs> = z.object({
  select: ShortDemoSelectSchema.optional(),
  include: ShortDemoIncludeSchema.optional(),
  where: ShortDemoWhereInputSchema.optional(),
  orderBy: z.union([ ShortDemoOrderByWithRelationInputSchema.array(),ShortDemoOrderByWithRelationInputSchema ]).optional(),
  cursor: ShortDemoWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ShortDemoScalarFieldEnumSchema,ShortDemoScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const ShortDemoFindManyArgsSchema: z.ZodType<Prisma.ShortDemoFindManyArgs> = z.object({
  select: ShortDemoSelectSchema.optional(),
  include: ShortDemoIncludeSchema.optional(),
  where: ShortDemoWhereInputSchema.optional(),
  orderBy: z.union([ ShortDemoOrderByWithRelationInputSchema.array(),ShortDemoOrderByWithRelationInputSchema ]).optional(),
  cursor: ShortDemoWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ShortDemoScalarFieldEnumSchema,ShortDemoScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const ShortDemoAggregateArgsSchema: z.ZodType<Prisma.ShortDemoAggregateArgs> = z.object({
  where: ShortDemoWhereInputSchema.optional(),
  orderBy: z.union([ ShortDemoOrderByWithRelationInputSchema.array(),ShortDemoOrderByWithRelationInputSchema ]).optional(),
  cursor: ShortDemoWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const ShortDemoGroupByArgsSchema: z.ZodType<Prisma.ShortDemoGroupByArgs> = z.object({
  where: ShortDemoWhereInputSchema.optional(),
  orderBy: z.union([ ShortDemoOrderByWithAggregationInputSchema.array(),ShortDemoOrderByWithAggregationInputSchema ]).optional(),
  by: ShortDemoScalarFieldEnumSchema.array(),
  having: ShortDemoScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const ShortDemoFindUniqueArgsSchema: z.ZodType<Prisma.ShortDemoFindUniqueArgs> = z.object({
  select: ShortDemoSelectSchema.optional(),
  include: ShortDemoIncludeSchema.optional(),
  where: ShortDemoWhereUniqueInputSchema,
}).strict() ;

export const ShortDemoFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.ShortDemoFindUniqueOrThrowArgs> = z.object({
  select: ShortDemoSelectSchema.optional(),
  include: ShortDemoIncludeSchema.optional(),
  where: ShortDemoWhereUniqueInputSchema,
}).strict() ;

export const HookViralVideoFindFirstArgsSchema: z.ZodType<Prisma.HookViralVideoFindFirstArgs> = z.object({
  select: HookViralVideoSelectSchema.optional(),
  where: HookViralVideoWhereInputSchema.optional(),
  orderBy: z.union([ HookViralVideoOrderByWithRelationInputSchema.array(),HookViralVideoOrderByWithRelationInputSchema ]).optional(),
  cursor: HookViralVideoWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ HookViralVideoScalarFieldEnumSchema,HookViralVideoScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const HookViralVideoFindFirstOrThrowArgsSchema: z.ZodType<Prisma.HookViralVideoFindFirstOrThrowArgs> = z.object({
  select: HookViralVideoSelectSchema.optional(),
  where: HookViralVideoWhereInputSchema.optional(),
  orderBy: z.union([ HookViralVideoOrderByWithRelationInputSchema.array(),HookViralVideoOrderByWithRelationInputSchema ]).optional(),
  cursor: HookViralVideoWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ HookViralVideoScalarFieldEnumSchema,HookViralVideoScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const HookViralVideoFindManyArgsSchema: z.ZodType<Prisma.HookViralVideoFindManyArgs> = z.object({
  select: HookViralVideoSelectSchema.optional(),
  where: HookViralVideoWhereInputSchema.optional(),
  orderBy: z.union([ HookViralVideoOrderByWithRelationInputSchema.array(),HookViralVideoOrderByWithRelationInputSchema ]).optional(),
  cursor: HookViralVideoWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ HookViralVideoScalarFieldEnumSchema,HookViralVideoScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const HookViralVideoAggregateArgsSchema: z.ZodType<Prisma.HookViralVideoAggregateArgs> = z.object({
  where: HookViralVideoWhereInputSchema.optional(),
  orderBy: z.union([ HookViralVideoOrderByWithRelationInputSchema.array(),HookViralVideoOrderByWithRelationInputSchema ]).optional(),
  cursor: HookViralVideoWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const HookViralVideoGroupByArgsSchema: z.ZodType<Prisma.HookViralVideoGroupByArgs> = z.object({
  where: HookViralVideoWhereInputSchema.optional(),
  orderBy: z.union([ HookViralVideoOrderByWithAggregationInputSchema.array(),HookViralVideoOrderByWithAggregationInputSchema ]).optional(),
  by: HookViralVideoScalarFieldEnumSchema.array(),
  having: HookViralVideoScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const HookViralVideoFindUniqueArgsSchema: z.ZodType<Prisma.HookViralVideoFindUniqueArgs> = z.object({
  select: HookViralVideoSelectSchema.optional(),
  where: HookViralVideoWhereUniqueInputSchema,
}).strict() ;

export const HookViralVideoFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.HookViralVideoFindUniqueOrThrowArgs> = z.object({
  select: HookViralVideoSelectSchema.optional(),
  where: HookViralVideoWhereUniqueInputSchema,
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
  include: DemoVideoIncludeSchema.optional(),
  data: z.union([ DemoVideoCreateInputSchema,DemoVideoUncheckedCreateInputSchema ]),
}).strict() ;

export const DemoVideoUpsertArgsSchema: z.ZodType<Prisma.DemoVideoUpsertArgs> = z.object({
  select: DemoVideoSelectSchema.optional(),
  include: DemoVideoIncludeSchema.optional(),
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
  include: DemoVideoIncludeSchema.optional(),
  where: DemoVideoWhereUniqueInputSchema,
}).strict() ;

export const DemoVideoUpdateArgsSchema: z.ZodType<Prisma.DemoVideoUpdateArgs> = z.object({
  select: DemoVideoSelectSchema.optional(),
  include: DemoVideoIncludeSchema.optional(),
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

export const ShortDemoCreateArgsSchema: z.ZodType<Prisma.ShortDemoCreateArgs> = z.object({
  select: ShortDemoSelectSchema.optional(),
  include: ShortDemoIncludeSchema.optional(),
  data: z.union([ ShortDemoCreateInputSchema,ShortDemoUncheckedCreateInputSchema ]),
}).strict() ;

export const ShortDemoUpsertArgsSchema: z.ZodType<Prisma.ShortDemoUpsertArgs> = z.object({
  select: ShortDemoSelectSchema.optional(),
  include: ShortDemoIncludeSchema.optional(),
  where: ShortDemoWhereUniqueInputSchema,
  create: z.union([ ShortDemoCreateInputSchema,ShortDemoUncheckedCreateInputSchema ]),
  update: z.union([ ShortDemoUpdateInputSchema,ShortDemoUncheckedUpdateInputSchema ]),
}).strict() ;

export const ShortDemoCreateManyArgsSchema: z.ZodType<Prisma.ShortDemoCreateManyArgs> = z.object({
  data: z.union([ ShortDemoCreateManyInputSchema,ShortDemoCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const ShortDemoCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ShortDemoCreateManyAndReturnArgs> = z.object({
  data: z.union([ ShortDemoCreateManyInputSchema,ShortDemoCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const ShortDemoDeleteArgsSchema: z.ZodType<Prisma.ShortDemoDeleteArgs> = z.object({
  select: ShortDemoSelectSchema.optional(),
  include: ShortDemoIncludeSchema.optional(),
  where: ShortDemoWhereUniqueInputSchema,
}).strict() ;

export const ShortDemoUpdateArgsSchema: z.ZodType<Prisma.ShortDemoUpdateArgs> = z.object({
  select: ShortDemoSelectSchema.optional(),
  include: ShortDemoIncludeSchema.optional(),
  data: z.union([ ShortDemoUpdateInputSchema,ShortDemoUncheckedUpdateInputSchema ]),
  where: ShortDemoWhereUniqueInputSchema,
}).strict() ;

export const ShortDemoUpdateManyArgsSchema: z.ZodType<Prisma.ShortDemoUpdateManyArgs> = z.object({
  data: z.union([ ShortDemoUpdateManyMutationInputSchema,ShortDemoUncheckedUpdateManyInputSchema ]),
  where: ShortDemoWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const ShortDemoUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.ShortDemoUpdateManyAndReturnArgs> = z.object({
  data: z.union([ ShortDemoUpdateManyMutationInputSchema,ShortDemoUncheckedUpdateManyInputSchema ]),
  where: ShortDemoWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const ShortDemoDeleteManyArgsSchema: z.ZodType<Prisma.ShortDemoDeleteManyArgs> = z.object({
  where: ShortDemoWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const HookViralVideoCreateArgsSchema: z.ZodType<Prisma.HookViralVideoCreateArgs> = z.object({
  select: HookViralVideoSelectSchema.optional(),
  data: z.union([ HookViralVideoCreateInputSchema,HookViralVideoUncheckedCreateInputSchema ]),
}).strict() ;

export const HookViralVideoUpsertArgsSchema: z.ZodType<Prisma.HookViralVideoUpsertArgs> = z.object({
  select: HookViralVideoSelectSchema.optional(),
  where: HookViralVideoWhereUniqueInputSchema,
  create: z.union([ HookViralVideoCreateInputSchema,HookViralVideoUncheckedCreateInputSchema ]),
  update: z.union([ HookViralVideoUpdateInputSchema,HookViralVideoUncheckedUpdateInputSchema ]),
}).strict() ;

export const HookViralVideoCreateManyArgsSchema: z.ZodType<Prisma.HookViralVideoCreateManyArgs> = z.object({
  data: z.union([ HookViralVideoCreateManyInputSchema,HookViralVideoCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const HookViralVideoCreateManyAndReturnArgsSchema: z.ZodType<Prisma.HookViralVideoCreateManyAndReturnArgs> = z.object({
  data: z.union([ HookViralVideoCreateManyInputSchema,HookViralVideoCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const HookViralVideoDeleteArgsSchema: z.ZodType<Prisma.HookViralVideoDeleteArgs> = z.object({
  select: HookViralVideoSelectSchema.optional(),
  where: HookViralVideoWhereUniqueInputSchema,
}).strict() ;

export const HookViralVideoUpdateArgsSchema: z.ZodType<Prisma.HookViralVideoUpdateArgs> = z.object({
  select: HookViralVideoSelectSchema.optional(),
  data: z.union([ HookViralVideoUpdateInputSchema,HookViralVideoUncheckedUpdateInputSchema ]),
  where: HookViralVideoWhereUniqueInputSchema,
}).strict() ;

export const HookViralVideoUpdateManyArgsSchema: z.ZodType<Prisma.HookViralVideoUpdateManyArgs> = z.object({
  data: z.union([ HookViralVideoUpdateManyMutationInputSchema,HookViralVideoUncheckedUpdateManyInputSchema ]),
  where: HookViralVideoWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const HookViralVideoUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.HookViralVideoUpdateManyAndReturnArgs> = z.object({
  data: z.union([ HookViralVideoUpdateManyMutationInputSchema,HookViralVideoUncheckedUpdateManyInputSchema ]),
  where: HookViralVideoWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const HookViralVideoDeleteManyArgsSchema: z.ZodType<Prisma.HookViralVideoDeleteManyArgs> = z.object({
  where: HookViralVideoWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;
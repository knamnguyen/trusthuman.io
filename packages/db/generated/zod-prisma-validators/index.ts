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

export const UserScalarFieldEnumSchema = z.enum(['id','firstName','lastName','username','primaryEmailAddress','imageUrl','clerkUserProperties','stripeCustomerId','accessType','stripeUserProperties','dailyAIcomments','createdAt','updatedAt']);

export const ProfileImportRunScalarFieldEnumSchema = z.enum(['id','userId','urls','status','urlsSucceeded','urlsFailed','createdAt','updatedAt']);

export const LinkedInProfileScalarFieldEnumSchema = z.enum(['id','linkedinUrl','fullName','headline','urn','profilePic','firstName','lastName','connections','followers','email','mobileNumber','jobTitle','companyName','companyIndustry','companyWebsite','companyLinkedin','companyFoundedIn','companySize','currentJobDuration','currentJobDurationInYrs','topSkillsByEndorsements','addressCountryOnly','addressWithCountry','addressWithoutCountry','profilePicHighQuality','about','publicIdentifier','openConnection','experiences','updates','skills','profilePicAllDimensions','educations','licenseAndCertificates','honorsAndAwards','languages','volunteerAndAwards','verifications','promos','highlights','projects','publications','patents','courses','testScores','organizations','volunteerCauses','interests','recommendations','createdAt','updatedAt']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const NullableJsonNullValueInputSchema = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const JsonNullValueFilterSchema = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.JsonNull : value === 'AnyNull' ? Prisma.AnyNull : value);

export const NullsOrderSchema = z.enum(['first','last']);

export const AccessTypeSchema = z.enum(['FREE','WEEKLY','MONTHLY','YEARLY']);

export type AccessTypeType = `${z.infer<typeof AccessTypeSchema>}`

export const ImportStatusSchema = z.enum(['NOT_STARTED','RUNNING','FINISHED']);

export type ImportStatusType = `${z.infer<typeof ImportStatusSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  accessType: AccessTypeSchema,
  id: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  username: z.string().nullable(),
  primaryEmailAddress: z.string(),
  imageUrl: z.string().nullable(),
  clerkUserProperties: JsonValueSchema.nullable(),
  stripeCustomerId: z.string().nullable(),
  stripeUserProperties: JsonValueSchema.nullable(),
  dailyAIcomments: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// PROFILE IMPORT RUN SCHEMA
/////////////////////////////////////////

export const ProfileImportRunSchema = z.object({
  status: ImportStatusSchema,
  id: z.string().uuid(),
  userId: z.string(),
  urls: z.string().array(),
  urlsSucceeded: z.string().array(),
  urlsFailed: z.string().array(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type ProfileImportRun = z.infer<typeof ProfileImportRunSchema>

/////////////////////////////////////////
// LINKED IN PROFILE SCHEMA
/////////////////////////////////////////

export const LinkedInProfileSchema = z.object({
  id: z.string().uuid(),
  linkedinUrl: z.string(),
  fullName: z.string(),
  headline: z.string(),
  urn: z.string(),
  profilePic: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  connections: z.number().int().nullable(),
  followers: z.number().int().nullable(),
  email: z.string().nullable(),
  mobileNumber: z.string().nullable(),
  jobTitle: z.string().nullable(),
  companyName: z.string().nullable(),
  companyIndustry: z.string().nullable(),
  companyWebsite: z.string().nullable(),
  companyLinkedin: z.string().nullable(),
  companyFoundedIn: z.number().int().nullable(),
  companySize: z.string().nullable(),
  currentJobDuration: z.string().nullable(),
  currentJobDurationInYrs: z.number().nullable(),
  topSkillsByEndorsements: z.string().nullable(),
  addressCountryOnly: z.string().nullable(),
  addressWithCountry: z.string().nullable(),
  addressWithoutCountry: z.string().nullable(),
  profilePicHighQuality: z.string().nullable(),
  about: z.string().nullable(),
  publicIdentifier: z.string().nullable(),
  openConnection: z.boolean().nullable(),
  experiences: JsonValueSchema.nullable(),
  updates: JsonValueSchema.nullable(),
  skills: JsonValueSchema.nullable(),
  profilePicAllDimensions: JsonValueSchema.nullable(),
  educations: JsonValueSchema.nullable(),
  licenseAndCertificates: JsonValueSchema.nullable(),
  honorsAndAwards: JsonValueSchema.nullable(),
  languages: JsonValueSchema.nullable(),
  volunteerAndAwards: JsonValueSchema.nullable(),
  verifications: JsonValueSchema.nullable(),
  promos: JsonValueSchema.nullable(),
  highlights: JsonValueSchema.nullable(),
  projects: JsonValueSchema.nullable(),
  publications: JsonValueSchema.nullable(),
  patents: JsonValueSchema.nullable(),
  courses: JsonValueSchema.nullable(),
  testScores: JsonValueSchema.nullable(),
  organizations: JsonValueSchema.nullable(),
  volunteerCauses: JsonValueSchema.nullable(),
  interests: JsonValueSchema.nullable(),
  recommendations: JsonValueSchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type LinkedInProfile = z.infer<typeof LinkedInProfileSchema>

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// USER
//------------------------------------------------------

export const UserIncludeSchema: z.ZodType<Prisma.UserInclude> = z.object({
  profileImportRuns: z.union([z.boolean(),z.lazy(() => ProfileImportRunFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const UserArgsSchema: z.ZodType<Prisma.UserDefaultArgs> = z.object({
  select: z.lazy(() => UserSelectSchema).optional(),
  include: z.lazy(() => UserIncludeSchema).optional(),
}).strict();

export const UserCountOutputTypeArgsSchema: z.ZodType<Prisma.UserCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => UserCountOutputTypeSelectSchema).nullish(),
}).strict();

export const UserCountOutputTypeSelectSchema: z.ZodType<Prisma.UserCountOutputTypeSelect> = z.object({
  profileImportRuns: z.boolean().optional(),
}).strict();

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
  dailyAIcomments: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  profileImportRuns: z.union([z.boolean(),z.lazy(() => ProfileImportRunFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict()

// PROFILE IMPORT RUN
//------------------------------------------------------

export const ProfileImportRunIncludeSchema: z.ZodType<Prisma.ProfileImportRunInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

export const ProfileImportRunArgsSchema: z.ZodType<Prisma.ProfileImportRunDefaultArgs> = z.object({
  select: z.lazy(() => ProfileImportRunSelectSchema).optional(),
  include: z.lazy(() => ProfileImportRunIncludeSchema).optional(),
}).strict();

export const ProfileImportRunSelectSchema: z.ZodType<Prisma.ProfileImportRunSelect> = z.object({
  id: z.boolean().optional(),
  userId: z.boolean().optional(),
  urls: z.boolean().optional(),
  status: z.boolean().optional(),
  urlsSucceeded: z.boolean().optional(),
  urlsFailed: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

// LINKED IN PROFILE
//------------------------------------------------------

export const LinkedInProfileSelectSchema: z.ZodType<Prisma.LinkedInProfileSelect> = z.object({
  id: z.boolean().optional(),
  linkedinUrl: z.boolean().optional(),
  fullName: z.boolean().optional(),
  headline: z.boolean().optional(),
  urn: z.boolean().optional(),
  profilePic: z.boolean().optional(),
  firstName: z.boolean().optional(),
  lastName: z.boolean().optional(),
  connections: z.boolean().optional(),
  followers: z.boolean().optional(),
  email: z.boolean().optional(),
  mobileNumber: z.boolean().optional(),
  jobTitle: z.boolean().optional(),
  companyName: z.boolean().optional(),
  companyIndustry: z.boolean().optional(),
  companyWebsite: z.boolean().optional(),
  companyLinkedin: z.boolean().optional(),
  companyFoundedIn: z.boolean().optional(),
  companySize: z.boolean().optional(),
  currentJobDuration: z.boolean().optional(),
  currentJobDurationInYrs: z.boolean().optional(),
  topSkillsByEndorsements: z.boolean().optional(),
  addressCountryOnly: z.boolean().optional(),
  addressWithCountry: z.boolean().optional(),
  addressWithoutCountry: z.boolean().optional(),
  profilePicHighQuality: z.boolean().optional(),
  about: z.boolean().optional(),
  publicIdentifier: z.boolean().optional(),
  openConnection: z.boolean().optional(),
  experiences: z.boolean().optional(),
  updates: z.boolean().optional(),
  skills: z.boolean().optional(),
  profilePicAllDimensions: z.boolean().optional(),
  educations: z.boolean().optional(),
  licenseAndCertificates: z.boolean().optional(),
  honorsAndAwards: z.boolean().optional(),
  languages: z.boolean().optional(),
  volunteerAndAwards: z.boolean().optional(),
  verifications: z.boolean().optional(),
  promos: z.boolean().optional(),
  highlights: z.boolean().optional(),
  projects: z.boolean().optional(),
  publications: z.boolean().optional(),
  patents: z.boolean().optional(),
  courses: z.boolean().optional(),
  testScores: z.boolean().optional(),
  organizations: z.boolean().optional(),
  volunteerCauses: z.boolean().optional(),
  interests: z.boolean().optional(),
  recommendations: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()


/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const UserWhereInputSchema: z.ZodType<Prisma.UserWhereInput> = z.object({
  AND: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  firstName: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  lastName: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  username: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  primaryEmailAddress: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  imageUrl: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  clerkUserProperties: z.lazy(() => JsonNullableFilterSchema).optional(),
  stripeCustomerId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  accessType: z.union([ z.lazy(() => EnumAccessTypeFilterSchema),z.lazy(() => AccessTypeSchema) ]).optional(),
  stripeUserProperties: z.lazy(() => JsonNullableFilterSchema).optional(),
  dailyAIcomments: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  profileImportRuns: z.lazy(() => ProfileImportRunListRelationFilterSchema).optional()
}).strict();

export const UserOrderByWithRelationInputSchema: z.ZodType<Prisma.UserOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastName: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  username: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  primaryEmailAddress: z.lazy(() => SortOrderSchema).optional(),
  imageUrl: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  clerkUserProperties: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  stripeCustomerId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  accessType: z.lazy(() => SortOrderSchema).optional(),
  stripeUserProperties: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  dailyAIcomments: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  profileImportRuns: z.lazy(() => ProfileImportRunOrderByRelationAggregateInputSchema).optional()
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
  dailyAIcomments: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  profileImportRuns: z.lazy(() => ProfileImportRunListRelationFilterSchema).optional()
}).strict());

export const UserOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastName: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  username: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  primaryEmailAddress: z.lazy(() => SortOrderSchema).optional(),
  imageUrl: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  clerkUserProperties: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  stripeCustomerId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  accessType: z.lazy(() => SortOrderSchema).optional(),
  stripeUserProperties: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  dailyAIcomments: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => UserCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => UserAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => UserMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => UserMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => UserSumOrderByAggregateInputSchema).optional()
}).strict();

export const UserScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema),z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema),z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  firstName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  lastName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  username: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  primaryEmailAddress: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  imageUrl: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  clerkUserProperties: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  stripeCustomerId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  accessType: z.union([ z.lazy(() => EnumAccessTypeWithAggregatesFilterSchema),z.lazy(() => AccessTypeSchema) ]).optional(),
  stripeUserProperties: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  dailyAIcomments: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const ProfileImportRunWhereInputSchema: z.ZodType<Prisma.ProfileImportRunWhereInput> = z.object({
  AND: z.union([ z.lazy(() => ProfileImportRunWhereInputSchema),z.lazy(() => ProfileImportRunWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProfileImportRunWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProfileImportRunWhereInputSchema),z.lazy(() => ProfileImportRunWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  urls: z.lazy(() => StringNullableListFilterSchema).optional(),
  status: z.union([ z.lazy(() => EnumImportStatusFilterSchema),z.lazy(() => ImportStatusSchema) ]).optional(),
  urlsSucceeded: z.lazy(() => StringNullableListFilterSchema).optional(),
  urlsFailed: z.lazy(() => StringNullableListFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
}).strict();

export const ProfileImportRunOrderByWithRelationInputSchema: z.ZodType<Prisma.ProfileImportRunOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  urls: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  urlsSucceeded: z.lazy(() => SortOrderSchema).optional(),
  urlsFailed: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional()
}).strict();

export const ProfileImportRunWhereUniqueInputSchema: z.ZodType<Prisma.ProfileImportRunWhereUniqueInput> = z.object({
  id: z.string().uuid()
})
.and(z.object({
  id: z.string().uuid().optional(),
  AND: z.union([ z.lazy(() => ProfileImportRunWhereInputSchema),z.lazy(() => ProfileImportRunWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProfileImportRunWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProfileImportRunWhereInputSchema),z.lazy(() => ProfileImportRunWhereInputSchema).array() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  urls: z.lazy(() => StringNullableListFilterSchema).optional(),
  status: z.union([ z.lazy(() => EnumImportStatusFilterSchema),z.lazy(() => ImportStatusSchema) ]).optional(),
  urlsSucceeded: z.lazy(() => StringNullableListFilterSchema).optional(),
  urlsFailed: z.lazy(() => StringNullableListFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
}).strict());

export const ProfileImportRunOrderByWithAggregationInputSchema: z.ZodType<Prisma.ProfileImportRunOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  urls: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  urlsSucceeded: z.lazy(() => SortOrderSchema).optional(),
  urlsFailed: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => ProfileImportRunCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => ProfileImportRunMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => ProfileImportRunMinOrderByAggregateInputSchema).optional()
}).strict();

export const ProfileImportRunScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.ProfileImportRunScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => ProfileImportRunScalarWhereWithAggregatesInputSchema),z.lazy(() => ProfileImportRunScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProfileImportRunScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProfileImportRunScalarWhereWithAggregatesInputSchema),z.lazy(() => ProfileImportRunScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  urls: z.lazy(() => StringNullableListFilterSchema).optional(),
  status: z.union([ z.lazy(() => EnumImportStatusWithAggregatesFilterSchema),z.lazy(() => ImportStatusSchema) ]).optional(),
  urlsSucceeded: z.lazy(() => StringNullableListFilterSchema).optional(),
  urlsFailed: z.lazy(() => StringNullableListFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const LinkedInProfileWhereInputSchema: z.ZodType<Prisma.LinkedInProfileWhereInput> = z.object({
  AND: z.union([ z.lazy(() => LinkedInProfileWhereInputSchema),z.lazy(() => LinkedInProfileWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => LinkedInProfileWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => LinkedInProfileWhereInputSchema),z.lazy(() => LinkedInProfileWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  linkedinUrl: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  fullName: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  headline: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  urn: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  profilePic: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  firstName: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  lastName: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  connections: z.union([ z.lazy(() => IntNullableFilterSchema),z.number() ]).optional().nullable(),
  followers: z.union([ z.lazy(() => IntNullableFilterSchema),z.number() ]).optional().nullable(),
  email: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  mobileNumber: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  jobTitle: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  companyName: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  companyIndustry: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  companyWebsite: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  companyLinkedin: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  companyFoundedIn: z.union([ z.lazy(() => IntNullableFilterSchema),z.number() ]).optional().nullable(),
  companySize: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  currentJobDuration: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  currentJobDurationInYrs: z.union([ z.lazy(() => FloatNullableFilterSchema),z.number() ]).optional().nullable(),
  topSkillsByEndorsements: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  addressCountryOnly: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  addressWithCountry: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  addressWithoutCountry: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  profilePicHighQuality: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  about: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  publicIdentifier: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  openConnection: z.union([ z.lazy(() => BoolNullableFilterSchema),z.boolean() ]).optional().nullable(),
  experiences: z.lazy(() => JsonNullableFilterSchema).optional(),
  updates: z.lazy(() => JsonNullableFilterSchema).optional(),
  skills: z.lazy(() => JsonNullableFilterSchema).optional(),
  profilePicAllDimensions: z.lazy(() => JsonNullableFilterSchema).optional(),
  educations: z.lazy(() => JsonNullableFilterSchema).optional(),
  licenseAndCertificates: z.lazy(() => JsonNullableFilterSchema).optional(),
  honorsAndAwards: z.lazy(() => JsonNullableFilterSchema).optional(),
  languages: z.lazy(() => JsonNullableFilterSchema).optional(),
  volunteerAndAwards: z.lazy(() => JsonNullableFilterSchema).optional(),
  verifications: z.lazy(() => JsonNullableFilterSchema).optional(),
  promos: z.lazy(() => JsonNullableFilterSchema).optional(),
  highlights: z.lazy(() => JsonNullableFilterSchema).optional(),
  projects: z.lazy(() => JsonNullableFilterSchema).optional(),
  publications: z.lazy(() => JsonNullableFilterSchema).optional(),
  patents: z.lazy(() => JsonNullableFilterSchema).optional(),
  courses: z.lazy(() => JsonNullableFilterSchema).optional(),
  testScores: z.lazy(() => JsonNullableFilterSchema).optional(),
  organizations: z.lazy(() => JsonNullableFilterSchema).optional(),
  volunteerCauses: z.lazy(() => JsonNullableFilterSchema).optional(),
  interests: z.lazy(() => JsonNullableFilterSchema).optional(),
  recommendations: z.lazy(() => JsonNullableFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const LinkedInProfileOrderByWithRelationInputSchema: z.ZodType<Prisma.LinkedInProfileOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  linkedinUrl: z.lazy(() => SortOrderSchema).optional(),
  fullName: z.lazy(() => SortOrderSchema).optional(),
  headline: z.lazy(() => SortOrderSchema).optional(),
  urn: z.lazy(() => SortOrderSchema).optional(),
  profilePic: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastName: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  connections: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  followers: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  email: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  mobileNumber: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  jobTitle: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  companyName: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  companyIndustry: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  companyWebsite: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  companyLinkedin: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  companyFoundedIn: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  companySize: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  currentJobDuration: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  currentJobDurationInYrs: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  topSkillsByEndorsements: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  addressCountryOnly: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  addressWithCountry: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  addressWithoutCountry: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  profilePicHighQuality: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  about: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  publicIdentifier: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  openConnection: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  experiences: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  updates: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  skills: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  profilePicAllDimensions: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  educations: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  licenseAndCertificates: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  honorsAndAwards: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  languages: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  volunteerAndAwards: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  verifications: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  promos: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  highlights: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  projects: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  publications: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  patents: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  courses: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  testScores: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  organizations: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  volunteerCauses: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  interests: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  recommendations: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const LinkedInProfileWhereUniqueInputSchema: z.ZodType<Prisma.LinkedInProfileWhereUniqueInput> = z.union([
  z.object({
    id: z.string().uuid(),
    urn: z.string()
  }),
  z.object({
    id: z.string().uuid(),
  }),
  z.object({
    urn: z.string(),
  }),
])
.and(z.object({
  id: z.string().uuid().optional(),
  urn: z.string().optional(),
  AND: z.union([ z.lazy(() => LinkedInProfileWhereInputSchema),z.lazy(() => LinkedInProfileWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => LinkedInProfileWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => LinkedInProfileWhereInputSchema),z.lazy(() => LinkedInProfileWhereInputSchema).array() ]).optional(),
  linkedinUrl: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  fullName: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  headline: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  profilePic: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  firstName: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  lastName: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  connections: z.union([ z.lazy(() => IntNullableFilterSchema),z.number().int() ]).optional().nullable(),
  followers: z.union([ z.lazy(() => IntNullableFilterSchema),z.number().int() ]).optional().nullable(),
  email: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  mobileNumber: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  jobTitle: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  companyName: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  companyIndustry: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  companyWebsite: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  companyLinkedin: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  companyFoundedIn: z.union([ z.lazy(() => IntNullableFilterSchema),z.number().int() ]).optional().nullable(),
  companySize: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  currentJobDuration: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  currentJobDurationInYrs: z.union([ z.lazy(() => FloatNullableFilterSchema),z.number() ]).optional().nullable(),
  topSkillsByEndorsements: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  addressCountryOnly: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  addressWithCountry: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  addressWithoutCountry: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  profilePicHighQuality: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  about: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  publicIdentifier: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  openConnection: z.union([ z.lazy(() => BoolNullableFilterSchema),z.boolean() ]).optional().nullable(),
  experiences: z.lazy(() => JsonNullableFilterSchema).optional(),
  updates: z.lazy(() => JsonNullableFilterSchema).optional(),
  skills: z.lazy(() => JsonNullableFilterSchema).optional(),
  profilePicAllDimensions: z.lazy(() => JsonNullableFilterSchema).optional(),
  educations: z.lazy(() => JsonNullableFilterSchema).optional(),
  licenseAndCertificates: z.lazy(() => JsonNullableFilterSchema).optional(),
  honorsAndAwards: z.lazy(() => JsonNullableFilterSchema).optional(),
  languages: z.lazy(() => JsonNullableFilterSchema).optional(),
  volunteerAndAwards: z.lazy(() => JsonNullableFilterSchema).optional(),
  verifications: z.lazy(() => JsonNullableFilterSchema).optional(),
  promos: z.lazy(() => JsonNullableFilterSchema).optional(),
  highlights: z.lazy(() => JsonNullableFilterSchema).optional(),
  projects: z.lazy(() => JsonNullableFilterSchema).optional(),
  publications: z.lazy(() => JsonNullableFilterSchema).optional(),
  patents: z.lazy(() => JsonNullableFilterSchema).optional(),
  courses: z.lazy(() => JsonNullableFilterSchema).optional(),
  testScores: z.lazy(() => JsonNullableFilterSchema).optional(),
  organizations: z.lazy(() => JsonNullableFilterSchema).optional(),
  volunteerCauses: z.lazy(() => JsonNullableFilterSchema).optional(),
  interests: z.lazy(() => JsonNullableFilterSchema).optional(),
  recommendations: z.lazy(() => JsonNullableFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict());

export const LinkedInProfileOrderByWithAggregationInputSchema: z.ZodType<Prisma.LinkedInProfileOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  linkedinUrl: z.lazy(() => SortOrderSchema).optional(),
  fullName: z.lazy(() => SortOrderSchema).optional(),
  headline: z.lazy(() => SortOrderSchema).optional(),
  urn: z.lazy(() => SortOrderSchema).optional(),
  profilePic: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastName: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  connections: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  followers: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  email: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  mobileNumber: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  jobTitle: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  companyName: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  companyIndustry: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  companyWebsite: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  companyLinkedin: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  companyFoundedIn: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  companySize: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  currentJobDuration: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  currentJobDurationInYrs: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  topSkillsByEndorsements: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  addressCountryOnly: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  addressWithCountry: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  addressWithoutCountry: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  profilePicHighQuality: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  about: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  publicIdentifier: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  openConnection: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  experiences: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  updates: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  skills: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  profilePicAllDimensions: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  educations: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  licenseAndCertificates: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  honorsAndAwards: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  languages: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  volunteerAndAwards: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  verifications: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  promos: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  highlights: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  projects: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  publications: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  patents: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  courses: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  testScores: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  organizations: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  volunteerCauses: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  interests: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  recommendations: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => LinkedInProfileCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => LinkedInProfileAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => LinkedInProfileMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => LinkedInProfileMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => LinkedInProfileSumOrderByAggregateInputSchema).optional()
}).strict();

export const LinkedInProfileScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.LinkedInProfileScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => LinkedInProfileScalarWhereWithAggregatesInputSchema),z.lazy(() => LinkedInProfileScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => LinkedInProfileScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => LinkedInProfileScalarWhereWithAggregatesInputSchema),z.lazy(() => LinkedInProfileScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  linkedinUrl: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  fullName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  headline: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  urn: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  profilePic: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  firstName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  lastName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  connections: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema),z.number() ]).optional().nullable(),
  followers: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema),z.number() ]).optional().nullable(),
  email: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  mobileNumber: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  jobTitle: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  companyName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  companyIndustry: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  companyWebsite: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  companyLinkedin: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  companyFoundedIn: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema),z.number() ]).optional().nullable(),
  companySize: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  currentJobDuration: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  currentJobDurationInYrs: z.union([ z.lazy(() => FloatNullableWithAggregatesFilterSchema),z.number() ]).optional().nullable(),
  topSkillsByEndorsements: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  addressCountryOnly: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  addressWithCountry: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  addressWithoutCountry: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  profilePicHighQuality: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  about: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  publicIdentifier: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  openConnection: z.union([ z.lazy(() => BoolNullableWithAggregatesFilterSchema),z.boolean() ]).optional().nullable(),
  experiences: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  updates: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  skills: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  profilePicAllDimensions: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  educations: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  licenseAndCertificates: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  honorsAndAwards: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  languages: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  volunteerAndAwards: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  verifications: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  promos: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  highlights: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  projects: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  publications: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  patents: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  courses: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  testScores: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  organizations: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  volunteerCauses: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  interests: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  recommendations: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const UserCreateInputSchema: z.ZodType<Prisma.UserCreateInput> = z.object({
  id: z.string(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  primaryEmailAddress: z.string(),
  imageUrl: z.string().optional().nullable(),
  clerkUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  stripeCustomerId: z.string().optional().nullable(),
  accessType: z.lazy(() => AccessTypeSchema).optional(),
  stripeUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  dailyAIcomments: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  profileImportRuns: z.lazy(() => ProfileImportRunCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUncheckedCreateInputSchema: z.ZodType<Prisma.UserUncheckedCreateInput> = z.object({
  id: z.string(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  primaryEmailAddress: z.string(),
  imageUrl: z.string().optional().nullable(),
  clerkUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  stripeCustomerId: z.string().optional().nullable(),
  accessType: z.lazy(() => AccessTypeSchema).optional(),
  stripeUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  dailyAIcomments: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  profileImportRuns: z.lazy(() => ProfileImportRunUncheckedCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUpdateInputSchema: z.ZodType<Prisma.UserUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  primaryEmailAddress: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  imageUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clerkUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  stripeCustomerId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessType: z.union([ z.lazy(() => AccessTypeSchema),z.lazy(() => EnumAccessTypeFieldUpdateOperationsInputSchema) ]).optional(),
  stripeUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  dailyAIcomments: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  profileImportRuns: z.lazy(() => ProfileImportRunUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateInputSchema: z.ZodType<Prisma.UserUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  primaryEmailAddress: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  imageUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clerkUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  stripeCustomerId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessType: z.union([ z.lazy(() => AccessTypeSchema),z.lazy(() => EnumAccessTypeFieldUpdateOperationsInputSchema) ]).optional(),
  stripeUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  dailyAIcomments: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  profileImportRuns: z.lazy(() => ProfileImportRunUncheckedUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserCreateManyInputSchema: z.ZodType<Prisma.UserCreateManyInput> = z.object({
  id: z.string(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  primaryEmailAddress: z.string(),
  imageUrl: z.string().optional().nullable(),
  clerkUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  stripeCustomerId: z.string().optional().nullable(),
  accessType: z.lazy(() => AccessTypeSchema).optional(),
  stripeUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  dailyAIcomments: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const UserUpdateManyMutationInputSchema: z.ZodType<Prisma.UserUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  primaryEmailAddress: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  imageUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clerkUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  stripeCustomerId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessType: z.union([ z.lazy(() => AccessTypeSchema),z.lazy(() => EnumAccessTypeFieldUpdateOperationsInputSchema) ]).optional(),
  stripeUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  dailyAIcomments: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  primaryEmailAddress: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  imageUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clerkUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  stripeCustomerId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessType: z.union([ z.lazy(() => AccessTypeSchema),z.lazy(() => EnumAccessTypeFieldUpdateOperationsInputSchema) ]).optional(),
  stripeUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  dailyAIcomments: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const ProfileImportRunCreateInputSchema: z.ZodType<Prisma.ProfileImportRunCreateInput> = z.object({
  id: z.string().uuid().optional(),
  urls: z.union([ z.lazy(() => ProfileImportRunCreateurlsInputSchema),z.string().array() ]).optional(),
  status: z.lazy(() => ImportStatusSchema).optional(),
  urlsSucceeded: z.union([ z.lazy(() => ProfileImportRunCreateurlsSucceededInputSchema),z.string().array() ]).optional(),
  urlsFailed: z.union([ z.lazy(() => ProfileImportRunCreateurlsFailedInputSchema),z.string().array() ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutProfileImportRunsInputSchema)
}).strict();

export const ProfileImportRunUncheckedCreateInputSchema: z.ZodType<Prisma.ProfileImportRunUncheckedCreateInput> = z.object({
  id: z.string().uuid().optional(),
  userId: z.string(),
  urls: z.union([ z.lazy(() => ProfileImportRunCreateurlsInputSchema),z.string().array() ]).optional(),
  status: z.lazy(() => ImportStatusSchema).optional(),
  urlsSucceeded: z.union([ z.lazy(() => ProfileImportRunCreateurlsSucceededInputSchema),z.string().array() ]).optional(),
  urlsFailed: z.union([ z.lazy(() => ProfileImportRunCreateurlsFailedInputSchema),z.string().array() ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const ProfileImportRunUpdateInputSchema: z.ZodType<Prisma.ProfileImportRunUpdateInput> = z.object({
  id: z.union([ z.string().uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urls: z.union([ z.lazy(() => ProfileImportRunUpdateurlsInputSchema),z.string().array() ]).optional(),
  status: z.union([ z.lazy(() => ImportStatusSchema),z.lazy(() => EnumImportStatusFieldUpdateOperationsInputSchema) ]).optional(),
  urlsSucceeded: z.union([ z.lazy(() => ProfileImportRunUpdateurlsSucceededInputSchema),z.string().array() ]).optional(),
  urlsFailed: z.union([ z.lazy(() => ProfileImportRunUpdateurlsFailedInputSchema),z.string().array() ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutProfileImportRunsNestedInputSchema).optional()
}).strict();

export const ProfileImportRunUncheckedUpdateInputSchema: z.ZodType<Prisma.ProfileImportRunUncheckedUpdateInput> = z.object({
  id: z.union([ z.string().uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urls: z.union([ z.lazy(() => ProfileImportRunUpdateurlsInputSchema),z.string().array() ]).optional(),
  status: z.union([ z.lazy(() => ImportStatusSchema),z.lazy(() => EnumImportStatusFieldUpdateOperationsInputSchema) ]).optional(),
  urlsSucceeded: z.union([ z.lazy(() => ProfileImportRunUpdateurlsSucceededInputSchema),z.string().array() ]).optional(),
  urlsFailed: z.union([ z.lazy(() => ProfileImportRunUpdateurlsFailedInputSchema),z.string().array() ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const ProfileImportRunCreateManyInputSchema: z.ZodType<Prisma.ProfileImportRunCreateManyInput> = z.object({
  id: z.string().uuid().optional(),
  userId: z.string(),
  urls: z.union([ z.lazy(() => ProfileImportRunCreateurlsInputSchema),z.string().array() ]).optional(),
  status: z.lazy(() => ImportStatusSchema).optional(),
  urlsSucceeded: z.union([ z.lazy(() => ProfileImportRunCreateurlsSucceededInputSchema),z.string().array() ]).optional(),
  urlsFailed: z.union([ z.lazy(() => ProfileImportRunCreateurlsFailedInputSchema),z.string().array() ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const ProfileImportRunUpdateManyMutationInputSchema: z.ZodType<Prisma.ProfileImportRunUpdateManyMutationInput> = z.object({
  id: z.union([ z.string().uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urls: z.union([ z.lazy(() => ProfileImportRunUpdateurlsInputSchema),z.string().array() ]).optional(),
  status: z.union([ z.lazy(() => ImportStatusSchema),z.lazy(() => EnumImportStatusFieldUpdateOperationsInputSchema) ]).optional(),
  urlsSucceeded: z.union([ z.lazy(() => ProfileImportRunUpdateurlsSucceededInputSchema),z.string().array() ]).optional(),
  urlsFailed: z.union([ z.lazy(() => ProfileImportRunUpdateurlsFailedInputSchema),z.string().array() ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const ProfileImportRunUncheckedUpdateManyInputSchema: z.ZodType<Prisma.ProfileImportRunUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string().uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urls: z.union([ z.lazy(() => ProfileImportRunUpdateurlsInputSchema),z.string().array() ]).optional(),
  status: z.union([ z.lazy(() => ImportStatusSchema),z.lazy(() => EnumImportStatusFieldUpdateOperationsInputSchema) ]).optional(),
  urlsSucceeded: z.union([ z.lazy(() => ProfileImportRunUpdateurlsSucceededInputSchema),z.string().array() ]).optional(),
  urlsFailed: z.union([ z.lazy(() => ProfileImportRunUpdateurlsFailedInputSchema),z.string().array() ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const LinkedInProfileCreateInputSchema: z.ZodType<Prisma.LinkedInProfileCreateInput> = z.object({
  id: z.string().uuid().optional(),
  linkedinUrl: z.string(),
  fullName: z.string(),
  headline: z.string(),
  urn: z.string(),
  profilePic: z.string(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  connections: z.number().int().optional().nullable(),
  followers: z.number().int().optional().nullable(),
  email: z.string().optional().nullable(),
  mobileNumber: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  companyIndustry: z.string().optional().nullable(),
  companyWebsite: z.string().optional().nullable(),
  companyLinkedin: z.string().optional().nullable(),
  companyFoundedIn: z.number().int().optional().nullable(),
  companySize: z.string().optional().nullable(),
  currentJobDuration: z.string().optional().nullable(),
  currentJobDurationInYrs: z.number().optional().nullable(),
  topSkillsByEndorsements: z.string().optional().nullable(),
  addressCountryOnly: z.string().optional().nullable(),
  addressWithCountry: z.string().optional().nullable(),
  addressWithoutCountry: z.string().optional().nullable(),
  profilePicHighQuality: z.string().optional().nullable(),
  about: z.string().optional().nullable(),
  publicIdentifier: z.string().optional().nullable(),
  openConnection: z.boolean().optional().nullable(),
  experiences: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  updates: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  skills: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  profilePicAllDimensions: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  educations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  licenseAndCertificates: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  honorsAndAwards: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  languages: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  volunteerAndAwards: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  verifications: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  promos: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  highlights: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  projects: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  publications: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  patents: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  courses: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  testScores: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  organizations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  volunteerCauses: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  interests: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  recommendations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const LinkedInProfileUncheckedCreateInputSchema: z.ZodType<Prisma.LinkedInProfileUncheckedCreateInput> = z.object({
  id: z.string().uuid().optional(),
  linkedinUrl: z.string(),
  fullName: z.string(),
  headline: z.string(),
  urn: z.string(),
  profilePic: z.string(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  connections: z.number().int().optional().nullable(),
  followers: z.number().int().optional().nullable(),
  email: z.string().optional().nullable(),
  mobileNumber: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  companyIndustry: z.string().optional().nullable(),
  companyWebsite: z.string().optional().nullable(),
  companyLinkedin: z.string().optional().nullable(),
  companyFoundedIn: z.number().int().optional().nullable(),
  companySize: z.string().optional().nullable(),
  currentJobDuration: z.string().optional().nullable(),
  currentJobDurationInYrs: z.number().optional().nullable(),
  topSkillsByEndorsements: z.string().optional().nullable(),
  addressCountryOnly: z.string().optional().nullable(),
  addressWithCountry: z.string().optional().nullable(),
  addressWithoutCountry: z.string().optional().nullable(),
  profilePicHighQuality: z.string().optional().nullable(),
  about: z.string().optional().nullable(),
  publicIdentifier: z.string().optional().nullable(),
  openConnection: z.boolean().optional().nullable(),
  experiences: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  updates: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  skills: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  profilePicAllDimensions: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  educations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  licenseAndCertificates: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  honorsAndAwards: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  languages: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  volunteerAndAwards: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  verifications: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  promos: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  highlights: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  projects: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  publications: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  patents: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  courses: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  testScores: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  organizations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  volunteerCauses: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  interests: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  recommendations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const LinkedInProfileUpdateInputSchema: z.ZodType<Prisma.LinkedInProfileUpdateInput> = z.object({
  id: z.union([ z.string().uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  linkedinUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  headline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urn: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profilePic: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  connections: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  followers: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  mobileNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  jobTitle: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companyName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companyIndustry: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companyWebsite: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companyLinkedin: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companyFoundedIn: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companySize: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currentJobDuration: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currentJobDurationInYrs: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  topSkillsByEndorsements: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  addressCountryOnly: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  addressWithCountry: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  addressWithoutCountry: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profilePicHighQuality: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  about: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  publicIdentifier: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  openConnection: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  experiences: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  updates: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  skills: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  profilePicAllDimensions: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  educations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  licenseAndCertificates: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  honorsAndAwards: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  languages: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  volunteerAndAwards: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  verifications: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  promos: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  highlights: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  projects: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  publications: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  patents: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  courses: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  testScores: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  organizations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  volunteerCauses: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  interests: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  recommendations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const LinkedInProfileUncheckedUpdateInputSchema: z.ZodType<Prisma.LinkedInProfileUncheckedUpdateInput> = z.object({
  id: z.union([ z.string().uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  linkedinUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  headline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urn: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profilePic: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  connections: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  followers: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  mobileNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  jobTitle: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companyName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companyIndustry: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companyWebsite: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companyLinkedin: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companyFoundedIn: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companySize: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currentJobDuration: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currentJobDurationInYrs: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  topSkillsByEndorsements: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  addressCountryOnly: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  addressWithCountry: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  addressWithoutCountry: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profilePicHighQuality: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  about: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  publicIdentifier: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  openConnection: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  experiences: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  updates: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  skills: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  profilePicAllDimensions: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  educations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  licenseAndCertificates: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  honorsAndAwards: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  languages: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  volunteerAndAwards: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  verifications: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  promos: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  highlights: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  projects: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  publications: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  patents: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  courses: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  testScores: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  organizations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  volunteerCauses: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  interests: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  recommendations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const LinkedInProfileCreateManyInputSchema: z.ZodType<Prisma.LinkedInProfileCreateManyInput> = z.object({
  id: z.string().uuid().optional(),
  linkedinUrl: z.string(),
  fullName: z.string(),
  headline: z.string(),
  urn: z.string(),
  profilePic: z.string(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  connections: z.number().int().optional().nullable(),
  followers: z.number().int().optional().nullable(),
  email: z.string().optional().nullable(),
  mobileNumber: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  companyIndustry: z.string().optional().nullable(),
  companyWebsite: z.string().optional().nullable(),
  companyLinkedin: z.string().optional().nullable(),
  companyFoundedIn: z.number().int().optional().nullable(),
  companySize: z.string().optional().nullable(),
  currentJobDuration: z.string().optional().nullable(),
  currentJobDurationInYrs: z.number().optional().nullable(),
  topSkillsByEndorsements: z.string().optional().nullable(),
  addressCountryOnly: z.string().optional().nullable(),
  addressWithCountry: z.string().optional().nullable(),
  addressWithoutCountry: z.string().optional().nullable(),
  profilePicHighQuality: z.string().optional().nullable(),
  about: z.string().optional().nullable(),
  publicIdentifier: z.string().optional().nullable(),
  openConnection: z.boolean().optional().nullable(),
  experiences: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  updates: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  skills: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  profilePicAllDimensions: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  educations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  licenseAndCertificates: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  honorsAndAwards: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  languages: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  volunteerAndAwards: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  verifications: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  promos: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  highlights: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  projects: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  publications: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  patents: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  courses: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  testScores: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  organizations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  volunteerCauses: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  interests: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  recommendations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const LinkedInProfileUpdateManyMutationInputSchema: z.ZodType<Prisma.LinkedInProfileUpdateManyMutationInput> = z.object({
  id: z.union([ z.string().uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  linkedinUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  headline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urn: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profilePic: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  connections: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  followers: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  mobileNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  jobTitle: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companyName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companyIndustry: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companyWebsite: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companyLinkedin: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companyFoundedIn: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companySize: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currentJobDuration: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currentJobDurationInYrs: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  topSkillsByEndorsements: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  addressCountryOnly: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  addressWithCountry: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  addressWithoutCountry: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profilePicHighQuality: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  about: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  publicIdentifier: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  openConnection: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  experiences: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  updates: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  skills: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  profilePicAllDimensions: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  educations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  licenseAndCertificates: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  honorsAndAwards: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  languages: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  volunteerAndAwards: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  verifications: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  promos: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  highlights: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  projects: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  publications: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  patents: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  courses: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  testScores: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  organizations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  volunteerCauses: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  interests: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  recommendations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const LinkedInProfileUncheckedUpdateManyInputSchema: z.ZodType<Prisma.LinkedInProfileUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string().uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  linkedinUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  headline: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urn: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profilePic: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  connections: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  followers: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  mobileNumber: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  jobTitle: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companyName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companyIndustry: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companyWebsite: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companyLinkedin: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companyFoundedIn: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  companySize: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currentJobDuration: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currentJobDurationInYrs: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  topSkillsByEndorsements: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  addressCountryOnly: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  addressWithCountry: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  addressWithoutCountry: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profilePicHighQuality: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  about: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  publicIdentifier: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  openConnection: z.union([ z.boolean(),z.lazy(() => NullableBoolFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  experiences: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  updates: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  skills: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  profilePicAllDimensions: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  educations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  licenseAndCertificates: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  honorsAndAwards: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  languages: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  volunteerAndAwards: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  verifications: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  promos: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  highlights: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  projects: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  publications: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  patents: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  courses: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  testScores: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  organizations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  volunteerCauses: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  interests: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  recommendations: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
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

export const ProfileImportRunListRelationFilterSchema: z.ZodType<Prisma.ProfileImportRunListRelationFilter> = z.object({
  every: z.lazy(() => ProfileImportRunWhereInputSchema).optional(),
  some: z.lazy(() => ProfileImportRunWhereInputSchema).optional(),
  none: z.lazy(() => ProfileImportRunWhereInputSchema).optional()
}).strict();

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> = z.object({
  sort: z.lazy(() => SortOrderSchema),
  nulls: z.lazy(() => NullsOrderSchema).optional()
}).strict();

export const ProfileImportRunOrderByRelationAggregateInputSchema: z.ZodType<Prisma.ProfileImportRunOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
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
  dailyAIcomments: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserAvgOrderByAggregateInputSchema: z.ZodType<Prisma.UserAvgOrderByAggregateInput> = z.object({
  dailyAIcomments: z.lazy(() => SortOrderSchema).optional()
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
  dailyAIcomments: z.lazy(() => SortOrderSchema).optional(),
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
  dailyAIcomments: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserSumOrderByAggregateInputSchema: z.ZodType<Prisma.UserSumOrderByAggregateInput> = z.object({
  dailyAIcomments: z.lazy(() => SortOrderSchema).optional()
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

export const StringNullableListFilterSchema: z.ZodType<Prisma.StringNullableListFilter> = z.object({
  equals: z.string().array().optional().nullable(),
  has: z.string().optional().nullable(),
  hasEvery: z.string().array().optional(),
  hasSome: z.string().array().optional(),
  isEmpty: z.boolean().optional()
}).strict();

export const EnumImportStatusFilterSchema: z.ZodType<Prisma.EnumImportStatusFilter> = z.object({
  equals: z.lazy(() => ImportStatusSchema).optional(),
  in: z.lazy(() => ImportStatusSchema).array().optional(),
  notIn: z.lazy(() => ImportStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => ImportStatusSchema),z.lazy(() => NestedEnumImportStatusFilterSchema) ]).optional(),
}).strict();

export const UserScalarRelationFilterSchema: z.ZodType<Prisma.UserScalarRelationFilter> = z.object({
  is: z.lazy(() => UserWhereInputSchema).optional(),
  isNot: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const ProfileImportRunCountOrderByAggregateInputSchema: z.ZodType<Prisma.ProfileImportRunCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  urls: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  urlsSucceeded: z.lazy(() => SortOrderSchema).optional(),
  urlsFailed: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ProfileImportRunMaxOrderByAggregateInputSchema: z.ZodType<Prisma.ProfileImportRunMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ProfileImportRunMinOrderByAggregateInputSchema: z.ZodType<Prisma.ProfileImportRunMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const EnumImportStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumImportStatusWithAggregatesFilter> = z.object({
  equals: z.lazy(() => ImportStatusSchema).optional(),
  in: z.lazy(() => ImportStatusSchema).array().optional(),
  notIn: z.lazy(() => ImportStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => ImportStatusSchema),z.lazy(() => NestedEnumImportStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumImportStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumImportStatusFilterSchema).optional()
}).strict();

export const IntNullableFilterSchema: z.ZodType<Prisma.IntNullableFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const FloatNullableFilterSchema: z.ZodType<Prisma.FloatNullableFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const BoolNullableFilterSchema: z.ZodType<Prisma.BoolNullableFilter> = z.object({
  equals: z.boolean().optional().nullable(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const LinkedInProfileCountOrderByAggregateInputSchema: z.ZodType<Prisma.LinkedInProfileCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  linkedinUrl: z.lazy(() => SortOrderSchema).optional(),
  fullName: z.lazy(() => SortOrderSchema).optional(),
  headline: z.lazy(() => SortOrderSchema).optional(),
  urn: z.lazy(() => SortOrderSchema).optional(),
  profilePic: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.lazy(() => SortOrderSchema).optional(),
  lastName: z.lazy(() => SortOrderSchema).optional(),
  connections: z.lazy(() => SortOrderSchema).optional(),
  followers: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  mobileNumber: z.lazy(() => SortOrderSchema).optional(),
  jobTitle: z.lazy(() => SortOrderSchema).optional(),
  companyName: z.lazy(() => SortOrderSchema).optional(),
  companyIndustry: z.lazy(() => SortOrderSchema).optional(),
  companyWebsite: z.lazy(() => SortOrderSchema).optional(),
  companyLinkedin: z.lazy(() => SortOrderSchema).optional(),
  companyFoundedIn: z.lazy(() => SortOrderSchema).optional(),
  companySize: z.lazy(() => SortOrderSchema).optional(),
  currentJobDuration: z.lazy(() => SortOrderSchema).optional(),
  currentJobDurationInYrs: z.lazy(() => SortOrderSchema).optional(),
  topSkillsByEndorsements: z.lazy(() => SortOrderSchema).optional(),
  addressCountryOnly: z.lazy(() => SortOrderSchema).optional(),
  addressWithCountry: z.lazy(() => SortOrderSchema).optional(),
  addressWithoutCountry: z.lazy(() => SortOrderSchema).optional(),
  profilePicHighQuality: z.lazy(() => SortOrderSchema).optional(),
  about: z.lazy(() => SortOrderSchema).optional(),
  publicIdentifier: z.lazy(() => SortOrderSchema).optional(),
  openConnection: z.lazy(() => SortOrderSchema).optional(),
  experiences: z.lazy(() => SortOrderSchema).optional(),
  updates: z.lazy(() => SortOrderSchema).optional(),
  skills: z.lazy(() => SortOrderSchema).optional(),
  profilePicAllDimensions: z.lazy(() => SortOrderSchema).optional(),
  educations: z.lazy(() => SortOrderSchema).optional(),
  licenseAndCertificates: z.lazy(() => SortOrderSchema).optional(),
  honorsAndAwards: z.lazy(() => SortOrderSchema).optional(),
  languages: z.lazy(() => SortOrderSchema).optional(),
  volunteerAndAwards: z.lazy(() => SortOrderSchema).optional(),
  verifications: z.lazy(() => SortOrderSchema).optional(),
  promos: z.lazy(() => SortOrderSchema).optional(),
  highlights: z.lazy(() => SortOrderSchema).optional(),
  projects: z.lazy(() => SortOrderSchema).optional(),
  publications: z.lazy(() => SortOrderSchema).optional(),
  patents: z.lazy(() => SortOrderSchema).optional(),
  courses: z.lazy(() => SortOrderSchema).optional(),
  testScores: z.lazy(() => SortOrderSchema).optional(),
  organizations: z.lazy(() => SortOrderSchema).optional(),
  volunteerCauses: z.lazy(() => SortOrderSchema).optional(),
  interests: z.lazy(() => SortOrderSchema).optional(),
  recommendations: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const LinkedInProfileAvgOrderByAggregateInputSchema: z.ZodType<Prisma.LinkedInProfileAvgOrderByAggregateInput> = z.object({
  connections: z.lazy(() => SortOrderSchema).optional(),
  followers: z.lazy(() => SortOrderSchema).optional(),
  companyFoundedIn: z.lazy(() => SortOrderSchema).optional(),
  currentJobDurationInYrs: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const LinkedInProfileMaxOrderByAggregateInputSchema: z.ZodType<Prisma.LinkedInProfileMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  linkedinUrl: z.lazy(() => SortOrderSchema).optional(),
  fullName: z.lazy(() => SortOrderSchema).optional(),
  headline: z.lazy(() => SortOrderSchema).optional(),
  urn: z.lazy(() => SortOrderSchema).optional(),
  profilePic: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.lazy(() => SortOrderSchema).optional(),
  lastName: z.lazy(() => SortOrderSchema).optional(),
  connections: z.lazy(() => SortOrderSchema).optional(),
  followers: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  mobileNumber: z.lazy(() => SortOrderSchema).optional(),
  jobTitle: z.lazy(() => SortOrderSchema).optional(),
  companyName: z.lazy(() => SortOrderSchema).optional(),
  companyIndustry: z.lazy(() => SortOrderSchema).optional(),
  companyWebsite: z.lazy(() => SortOrderSchema).optional(),
  companyLinkedin: z.lazy(() => SortOrderSchema).optional(),
  companyFoundedIn: z.lazy(() => SortOrderSchema).optional(),
  companySize: z.lazy(() => SortOrderSchema).optional(),
  currentJobDuration: z.lazy(() => SortOrderSchema).optional(),
  currentJobDurationInYrs: z.lazy(() => SortOrderSchema).optional(),
  topSkillsByEndorsements: z.lazy(() => SortOrderSchema).optional(),
  addressCountryOnly: z.lazy(() => SortOrderSchema).optional(),
  addressWithCountry: z.lazy(() => SortOrderSchema).optional(),
  addressWithoutCountry: z.lazy(() => SortOrderSchema).optional(),
  profilePicHighQuality: z.lazy(() => SortOrderSchema).optional(),
  about: z.lazy(() => SortOrderSchema).optional(),
  publicIdentifier: z.lazy(() => SortOrderSchema).optional(),
  openConnection: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const LinkedInProfileMinOrderByAggregateInputSchema: z.ZodType<Prisma.LinkedInProfileMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  linkedinUrl: z.lazy(() => SortOrderSchema).optional(),
  fullName: z.lazy(() => SortOrderSchema).optional(),
  headline: z.lazy(() => SortOrderSchema).optional(),
  urn: z.lazy(() => SortOrderSchema).optional(),
  profilePic: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.lazy(() => SortOrderSchema).optional(),
  lastName: z.lazy(() => SortOrderSchema).optional(),
  connections: z.lazy(() => SortOrderSchema).optional(),
  followers: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  mobileNumber: z.lazy(() => SortOrderSchema).optional(),
  jobTitle: z.lazy(() => SortOrderSchema).optional(),
  companyName: z.lazy(() => SortOrderSchema).optional(),
  companyIndustry: z.lazy(() => SortOrderSchema).optional(),
  companyWebsite: z.lazy(() => SortOrderSchema).optional(),
  companyLinkedin: z.lazy(() => SortOrderSchema).optional(),
  companyFoundedIn: z.lazy(() => SortOrderSchema).optional(),
  companySize: z.lazy(() => SortOrderSchema).optional(),
  currentJobDuration: z.lazy(() => SortOrderSchema).optional(),
  currentJobDurationInYrs: z.lazy(() => SortOrderSchema).optional(),
  topSkillsByEndorsements: z.lazy(() => SortOrderSchema).optional(),
  addressCountryOnly: z.lazy(() => SortOrderSchema).optional(),
  addressWithCountry: z.lazy(() => SortOrderSchema).optional(),
  addressWithoutCountry: z.lazy(() => SortOrderSchema).optional(),
  profilePicHighQuality: z.lazy(() => SortOrderSchema).optional(),
  about: z.lazy(() => SortOrderSchema).optional(),
  publicIdentifier: z.lazy(() => SortOrderSchema).optional(),
  openConnection: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const LinkedInProfileSumOrderByAggregateInputSchema: z.ZodType<Prisma.LinkedInProfileSumOrderByAggregateInput> = z.object({
  connections: z.lazy(() => SortOrderSchema).optional(),
  followers: z.lazy(() => SortOrderSchema).optional(),
  companyFoundedIn: z.lazy(() => SortOrderSchema).optional(),
  currentJobDurationInYrs: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const IntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.IntNullableWithAggregatesFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedIntNullableFilterSchema).optional()
}).strict();

export const FloatNullableWithAggregatesFilterSchema: z.ZodType<Prisma.FloatNullableWithAggregatesFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedFloatNullableFilterSchema).optional()
}).strict();

export const BoolNullableWithAggregatesFilterSchema: z.ZodType<Prisma.BoolNullableWithAggregatesFilter> = z.object({
  equals: z.boolean().optional().nullable(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolNullableFilterSchema).optional()
}).strict();

export const ProfileImportRunCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.ProfileImportRunCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => ProfileImportRunCreateWithoutUserInputSchema),z.lazy(() => ProfileImportRunCreateWithoutUserInputSchema).array(),z.lazy(() => ProfileImportRunUncheckedCreateWithoutUserInputSchema),z.lazy(() => ProfileImportRunUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ProfileImportRunCreateOrConnectWithoutUserInputSchema),z.lazy(() => ProfileImportRunCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ProfileImportRunCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ProfileImportRunWhereUniqueInputSchema),z.lazy(() => ProfileImportRunWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const ProfileImportRunUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.ProfileImportRunUncheckedCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => ProfileImportRunCreateWithoutUserInputSchema),z.lazy(() => ProfileImportRunCreateWithoutUserInputSchema).array(),z.lazy(() => ProfileImportRunUncheckedCreateWithoutUserInputSchema),z.lazy(() => ProfileImportRunUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ProfileImportRunCreateOrConnectWithoutUserInputSchema),z.lazy(() => ProfileImportRunCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ProfileImportRunCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ProfileImportRunWhereUniqueInputSchema),z.lazy(() => ProfileImportRunWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> = z.object({
  set: z.string().optional()
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

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> = z.object({
  set: z.coerce.date().optional()
}).strict();

export const ProfileImportRunUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.ProfileImportRunUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => ProfileImportRunCreateWithoutUserInputSchema),z.lazy(() => ProfileImportRunCreateWithoutUserInputSchema).array(),z.lazy(() => ProfileImportRunUncheckedCreateWithoutUserInputSchema),z.lazy(() => ProfileImportRunUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ProfileImportRunCreateOrConnectWithoutUserInputSchema),z.lazy(() => ProfileImportRunCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ProfileImportRunUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => ProfileImportRunUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ProfileImportRunCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ProfileImportRunWhereUniqueInputSchema),z.lazy(() => ProfileImportRunWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ProfileImportRunWhereUniqueInputSchema),z.lazy(() => ProfileImportRunWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ProfileImportRunWhereUniqueInputSchema),z.lazy(() => ProfileImportRunWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ProfileImportRunWhereUniqueInputSchema),z.lazy(() => ProfileImportRunWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ProfileImportRunUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => ProfileImportRunUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ProfileImportRunUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => ProfileImportRunUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ProfileImportRunScalarWhereInputSchema),z.lazy(() => ProfileImportRunScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const ProfileImportRunUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.ProfileImportRunUncheckedUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => ProfileImportRunCreateWithoutUserInputSchema),z.lazy(() => ProfileImportRunCreateWithoutUserInputSchema).array(),z.lazy(() => ProfileImportRunUncheckedCreateWithoutUserInputSchema),z.lazy(() => ProfileImportRunUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ProfileImportRunCreateOrConnectWithoutUserInputSchema),z.lazy(() => ProfileImportRunCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ProfileImportRunUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => ProfileImportRunUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ProfileImportRunCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ProfileImportRunWhereUniqueInputSchema),z.lazy(() => ProfileImportRunWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ProfileImportRunWhereUniqueInputSchema),z.lazy(() => ProfileImportRunWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ProfileImportRunWhereUniqueInputSchema),z.lazy(() => ProfileImportRunWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ProfileImportRunWhereUniqueInputSchema),z.lazy(() => ProfileImportRunWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ProfileImportRunUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => ProfileImportRunUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ProfileImportRunUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => ProfileImportRunUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ProfileImportRunScalarWhereInputSchema),z.lazy(() => ProfileImportRunScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const ProfileImportRunCreateurlsInputSchema: z.ZodType<Prisma.ProfileImportRunCreateurlsInput> = z.object({
  set: z.string().array()
}).strict();

export const ProfileImportRunCreateurlsSucceededInputSchema: z.ZodType<Prisma.ProfileImportRunCreateurlsSucceededInput> = z.object({
  set: z.string().array()
}).strict();

export const ProfileImportRunCreateurlsFailedInputSchema: z.ZodType<Prisma.ProfileImportRunCreateurlsFailedInput> = z.object({
  set: z.string().array()
}).strict();

export const UserCreateNestedOneWithoutProfileImportRunsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutProfileImportRunsInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutProfileImportRunsInputSchema),z.lazy(() => UserUncheckedCreateWithoutProfileImportRunsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutProfileImportRunsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export const ProfileImportRunUpdateurlsInputSchema: z.ZodType<Prisma.ProfileImportRunUpdateurlsInput> = z.object({
  set: z.string().array().optional(),
  push: z.union([ z.string(),z.string().array() ]).optional(),
}).strict();

export const EnumImportStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumImportStatusFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => ImportStatusSchema).optional()
}).strict();

export const ProfileImportRunUpdateurlsSucceededInputSchema: z.ZodType<Prisma.ProfileImportRunUpdateurlsSucceededInput> = z.object({
  set: z.string().array().optional(),
  push: z.union([ z.string(),z.string().array() ]).optional(),
}).strict();

export const ProfileImportRunUpdateurlsFailedInputSchema: z.ZodType<Prisma.ProfileImportRunUpdateurlsFailedInput> = z.object({
  set: z.string().array().optional(),
  push: z.union([ z.string(),z.string().array() ]).optional(),
}).strict();

export const UserUpdateOneRequiredWithoutProfileImportRunsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutProfileImportRunsNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutProfileImportRunsInputSchema),z.lazy(() => UserUncheckedCreateWithoutProfileImportRunsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutProfileImportRunsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutProfileImportRunsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutProfileImportRunsInputSchema),z.lazy(() => UserUpdateWithoutProfileImportRunsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutProfileImportRunsInputSchema) ]).optional(),
}).strict();

export const NullableIntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableIntFieldUpdateOperationsInput> = z.object({
  set: z.number().optional().nullable(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional()
}).strict();

export const NullableFloatFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableFloatFieldUpdateOperationsInput> = z.object({
  set: z.number().optional().nullable(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional()
}).strict();

export const NullableBoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableBoolFieldUpdateOperationsInput> = z.object({
  set: z.boolean().optional().nullable()
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

export const NestedEnumImportStatusFilterSchema: z.ZodType<Prisma.NestedEnumImportStatusFilter> = z.object({
  equals: z.lazy(() => ImportStatusSchema).optional(),
  in: z.lazy(() => ImportStatusSchema).array().optional(),
  notIn: z.lazy(() => ImportStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => ImportStatusSchema),z.lazy(() => NestedEnumImportStatusFilterSchema) ]).optional(),
}).strict();

export const NestedEnumImportStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumImportStatusWithAggregatesFilter> = z.object({
  equals: z.lazy(() => ImportStatusSchema).optional(),
  in: z.lazy(() => ImportStatusSchema).array().optional(),
  notIn: z.lazy(() => ImportStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => ImportStatusSchema),z.lazy(() => NestedEnumImportStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumImportStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumImportStatusFilterSchema).optional()
}).strict();

export const NestedFloatNullableFilterSchema: z.ZodType<Prisma.NestedFloatNullableFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedBoolNullableFilterSchema: z.ZodType<Prisma.NestedBoolNullableFilter> = z.object({
  equals: z.boolean().optional().nullable(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedIntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntNullableWithAggregatesFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedIntNullableFilterSchema).optional()
}).strict();

export const NestedFloatNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedFloatNullableWithAggregatesFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedFloatNullableFilterSchema).optional()
}).strict();

export const NestedBoolNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolNullableWithAggregatesFilter> = z.object({
  equals: z.boolean().optional().nullable(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolNullableFilterSchema).optional()
}).strict();

export const ProfileImportRunCreateWithoutUserInputSchema: z.ZodType<Prisma.ProfileImportRunCreateWithoutUserInput> = z.object({
  id: z.string().uuid().optional(),
  urls: z.union([ z.lazy(() => ProfileImportRunCreateurlsInputSchema),z.string().array() ]).optional(),
  status: z.lazy(() => ImportStatusSchema).optional(),
  urlsSucceeded: z.union([ z.lazy(() => ProfileImportRunCreateurlsSucceededInputSchema),z.string().array() ]).optional(),
  urlsFailed: z.union([ z.lazy(() => ProfileImportRunCreateurlsFailedInputSchema),z.string().array() ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const ProfileImportRunUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.ProfileImportRunUncheckedCreateWithoutUserInput> = z.object({
  id: z.string().uuid().optional(),
  urls: z.union([ z.lazy(() => ProfileImportRunCreateurlsInputSchema),z.string().array() ]).optional(),
  status: z.lazy(() => ImportStatusSchema).optional(),
  urlsSucceeded: z.union([ z.lazy(() => ProfileImportRunCreateurlsSucceededInputSchema),z.string().array() ]).optional(),
  urlsFailed: z.union([ z.lazy(() => ProfileImportRunCreateurlsFailedInputSchema),z.string().array() ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const ProfileImportRunCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.ProfileImportRunCreateOrConnectWithoutUserInput> = z.object({
  where: z.lazy(() => ProfileImportRunWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ProfileImportRunCreateWithoutUserInputSchema),z.lazy(() => ProfileImportRunUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export const ProfileImportRunCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.ProfileImportRunCreateManyUserInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => ProfileImportRunCreateManyUserInputSchema),z.lazy(() => ProfileImportRunCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const ProfileImportRunUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.ProfileImportRunUpsertWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => ProfileImportRunWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ProfileImportRunUpdateWithoutUserInputSchema),z.lazy(() => ProfileImportRunUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => ProfileImportRunCreateWithoutUserInputSchema),z.lazy(() => ProfileImportRunUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export const ProfileImportRunUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.ProfileImportRunUpdateWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => ProfileImportRunWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ProfileImportRunUpdateWithoutUserInputSchema),z.lazy(() => ProfileImportRunUncheckedUpdateWithoutUserInputSchema) ]),
}).strict();

export const ProfileImportRunUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.ProfileImportRunUpdateManyWithWhereWithoutUserInput> = z.object({
  where: z.lazy(() => ProfileImportRunScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ProfileImportRunUpdateManyMutationInputSchema),z.lazy(() => ProfileImportRunUncheckedUpdateManyWithoutUserInputSchema) ]),
}).strict();

export const ProfileImportRunScalarWhereInputSchema: z.ZodType<Prisma.ProfileImportRunScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => ProfileImportRunScalarWhereInputSchema),z.lazy(() => ProfileImportRunScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProfileImportRunScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProfileImportRunScalarWhereInputSchema),z.lazy(() => ProfileImportRunScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  urls: z.lazy(() => StringNullableListFilterSchema).optional(),
  status: z.union([ z.lazy(() => EnumImportStatusFilterSchema),z.lazy(() => ImportStatusSchema) ]).optional(),
  urlsSucceeded: z.lazy(() => StringNullableListFilterSchema).optional(),
  urlsFailed: z.lazy(() => StringNullableListFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const UserCreateWithoutProfileImportRunsInputSchema: z.ZodType<Prisma.UserCreateWithoutProfileImportRunsInput> = z.object({
  id: z.string(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  primaryEmailAddress: z.string(),
  imageUrl: z.string().optional().nullable(),
  clerkUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  stripeCustomerId: z.string().optional().nullable(),
  accessType: z.lazy(() => AccessTypeSchema).optional(),
  stripeUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  dailyAIcomments: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const UserUncheckedCreateWithoutProfileImportRunsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutProfileImportRunsInput> = z.object({
  id: z.string(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  primaryEmailAddress: z.string(),
  imageUrl: z.string().optional().nullable(),
  clerkUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  stripeCustomerId: z.string().optional().nullable(),
  accessType: z.lazy(() => AccessTypeSchema).optional(),
  stripeUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  dailyAIcomments: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const UserCreateOrConnectWithoutProfileImportRunsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutProfileImportRunsInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutProfileImportRunsInputSchema),z.lazy(() => UserUncheckedCreateWithoutProfileImportRunsInputSchema) ]),
}).strict();

export const UserUpsertWithoutProfileImportRunsInputSchema: z.ZodType<Prisma.UserUpsertWithoutProfileImportRunsInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutProfileImportRunsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutProfileImportRunsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutProfileImportRunsInputSchema),z.lazy(() => UserUncheckedCreateWithoutProfileImportRunsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const UserUpdateToOneWithWhereWithoutProfileImportRunsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutProfileImportRunsInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutProfileImportRunsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutProfileImportRunsInputSchema) ]),
}).strict();

export const UserUpdateWithoutProfileImportRunsInputSchema: z.ZodType<Prisma.UserUpdateWithoutProfileImportRunsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  primaryEmailAddress: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  imageUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clerkUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  stripeCustomerId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessType: z.union([ z.lazy(() => AccessTypeSchema),z.lazy(() => EnumAccessTypeFieldUpdateOperationsInputSchema) ]).optional(),
  stripeUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  dailyAIcomments: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserUncheckedUpdateWithoutProfileImportRunsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutProfileImportRunsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  firstName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  primaryEmailAddress: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  imageUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clerkUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  stripeCustomerId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessType: z.union([ z.lazy(() => AccessTypeSchema),z.lazy(() => EnumAccessTypeFieldUpdateOperationsInputSchema) ]).optional(),
  stripeUserProperties: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  dailyAIcomments: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const ProfileImportRunCreateManyUserInputSchema: z.ZodType<Prisma.ProfileImportRunCreateManyUserInput> = z.object({
  id: z.string().uuid().optional(),
  urls: z.union([ z.lazy(() => ProfileImportRunCreateurlsInputSchema),z.string().array() ]).optional(),
  status: z.lazy(() => ImportStatusSchema).optional(),
  urlsSucceeded: z.union([ z.lazy(() => ProfileImportRunCreateurlsSucceededInputSchema),z.string().array() ]).optional(),
  urlsFailed: z.union([ z.lazy(() => ProfileImportRunCreateurlsFailedInputSchema),z.string().array() ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const ProfileImportRunUpdateWithoutUserInputSchema: z.ZodType<Prisma.ProfileImportRunUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string().uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urls: z.union([ z.lazy(() => ProfileImportRunUpdateurlsInputSchema),z.string().array() ]).optional(),
  status: z.union([ z.lazy(() => ImportStatusSchema),z.lazy(() => EnumImportStatusFieldUpdateOperationsInputSchema) ]).optional(),
  urlsSucceeded: z.union([ z.lazy(() => ProfileImportRunUpdateurlsSucceededInputSchema),z.string().array() ]).optional(),
  urlsFailed: z.union([ z.lazy(() => ProfileImportRunUpdateurlsFailedInputSchema),z.string().array() ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const ProfileImportRunUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.ProfileImportRunUncheckedUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string().uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urls: z.union([ z.lazy(() => ProfileImportRunUpdateurlsInputSchema),z.string().array() ]).optional(),
  status: z.union([ z.lazy(() => ImportStatusSchema),z.lazy(() => EnumImportStatusFieldUpdateOperationsInputSchema) ]).optional(),
  urlsSucceeded: z.union([ z.lazy(() => ProfileImportRunUpdateurlsSucceededInputSchema),z.string().array() ]).optional(),
  urlsFailed: z.union([ z.lazy(() => ProfileImportRunUpdateurlsFailedInputSchema),z.string().array() ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const ProfileImportRunUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.ProfileImportRunUncheckedUpdateManyWithoutUserInput> = z.object({
  id: z.union([ z.string().uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  urls: z.union([ z.lazy(() => ProfileImportRunUpdateurlsInputSchema),z.string().array() ]).optional(),
  status: z.union([ z.lazy(() => ImportStatusSchema),z.lazy(() => EnumImportStatusFieldUpdateOperationsInputSchema) ]).optional(),
  urlsSucceeded: z.union([ z.lazy(() => ProfileImportRunUpdateurlsSucceededInputSchema),z.string().array() ]).optional(),
  urlsFailed: z.union([ z.lazy(() => ProfileImportRunUpdateurlsFailedInputSchema),z.string().array() ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const UserFindFirstArgsSchema: z.ZodType<Prisma.UserFindFirstArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema,UserScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const UserFindFirstOrThrowArgsSchema: z.ZodType<Prisma.UserFindFirstOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema,UserScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const UserFindManyArgsSchema: z.ZodType<Prisma.UserFindManyArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
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
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema,
}).strict() ;

export const UserFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserFindUniqueOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema,
}).strict() ;

export const ProfileImportRunFindFirstArgsSchema: z.ZodType<Prisma.ProfileImportRunFindFirstArgs> = z.object({
  select: ProfileImportRunSelectSchema.optional(),
  include: ProfileImportRunIncludeSchema.optional(),
  where: ProfileImportRunWhereInputSchema.optional(),
  orderBy: z.union([ ProfileImportRunOrderByWithRelationInputSchema.array(),ProfileImportRunOrderByWithRelationInputSchema ]).optional(),
  cursor: ProfileImportRunWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ProfileImportRunScalarFieldEnumSchema,ProfileImportRunScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const ProfileImportRunFindFirstOrThrowArgsSchema: z.ZodType<Prisma.ProfileImportRunFindFirstOrThrowArgs> = z.object({
  select: ProfileImportRunSelectSchema.optional(),
  include: ProfileImportRunIncludeSchema.optional(),
  where: ProfileImportRunWhereInputSchema.optional(),
  orderBy: z.union([ ProfileImportRunOrderByWithRelationInputSchema.array(),ProfileImportRunOrderByWithRelationInputSchema ]).optional(),
  cursor: ProfileImportRunWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ProfileImportRunScalarFieldEnumSchema,ProfileImportRunScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const ProfileImportRunFindManyArgsSchema: z.ZodType<Prisma.ProfileImportRunFindManyArgs> = z.object({
  select: ProfileImportRunSelectSchema.optional(),
  include: ProfileImportRunIncludeSchema.optional(),
  where: ProfileImportRunWhereInputSchema.optional(),
  orderBy: z.union([ ProfileImportRunOrderByWithRelationInputSchema.array(),ProfileImportRunOrderByWithRelationInputSchema ]).optional(),
  cursor: ProfileImportRunWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ProfileImportRunScalarFieldEnumSchema,ProfileImportRunScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const ProfileImportRunAggregateArgsSchema: z.ZodType<Prisma.ProfileImportRunAggregateArgs> = z.object({
  where: ProfileImportRunWhereInputSchema.optional(),
  orderBy: z.union([ ProfileImportRunOrderByWithRelationInputSchema.array(),ProfileImportRunOrderByWithRelationInputSchema ]).optional(),
  cursor: ProfileImportRunWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const ProfileImportRunGroupByArgsSchema: z.ZodType<Prisma.ProfileImportRunGroupByArgs> = z.object({
  where: ProfileImportRunWhereInputSchema.optional(),
  orderBy: z.union([ ProfileImportRunOrderByWithAggregationInputSchema.array(),ProfileImportRunOrderByWithAggregationInputSchema ]).optional(),
  by: ProfileImportRunScalarFieldEnumSchema.array(),
  having: ProfileImportRunScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const ProfileImportRunFindUniqueArgsSchema: z.ZodType<Prisma.ProfileImportRunFindUniqueArgs> = z.object({
  select: ProfileImportRunSelectSchema.optional(),
  include: ProfileImportRunIncludeSchema.optional(),
  where: ProfileImportRunWhereUniqueInputSchema,
}).strict() ;

export const ProfileImportRunFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.ProfileImportRunFindUniqueOrThrowArgs> = z.object({
  select: ProfileImportRunSelectSchema.optional(),
  include: ProfileImportRunIncludeSchema.optional(),
  where: ProfileImportRunWhereUniqueInputSchema,
}).strict() ;

export const LinkedInProfileFindFirstArgsSchema: z.ZodType<Prisma.LinkedInProfileFindFirstArgs> = z.object({
  select: LinkedInProfileSelectSchema.optional(),
  where: LinkedInProfileWhereInputSchema.optional(),
  orderBy: z.union([ LinkedInProfileOrderByWithRelationInputSchema.array(),LinkedInProfileOrderByWithRelationInputSchema ]).optional(),
  cursor: LinkedInProfileWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ LinkedInProfileScalarFieldEnumSchema,LinkedInProfileScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const LinkedInProfileFindFirstOrThrowArgsSchema: z.ZodType<Prisma.LinkedInProfileFindFirstOrThrowArgs> = z.object({
  select: LinkedInProfileSelectSchema.optional(),
  where: LinkedInProfileWhereInputSchema.optional(),
  orderBy: z.union([ LinkedInProfileOrderByWithRelationInputSchema.array(),LinkedInProfileOrderByWithRelationInputSchema ]).optional(),
  cursor: LinkedInProfileWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ LinkedInProfileScalarFieldEnumSchema,LinkedInProfileScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const LinkedInProfileFindManyArgsSchema: z.ZodType<Prisma.LinkedInProfileFindManyArgs> = z.object({
  select: LinkedInProfileSelectSchema.optional(),
  where: LinkedInProfileWhereInputSchema.optional(),
  orderBy: z.union([ LinkedInProfileOrderByWithRelationInputSchema.array(),LinkedInProfileOrderByWithRelationInputSchema ]).optional(),
  cursor: LinkedInProfileWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ LinkedInProfileScalarFieldEnumSchema,LinkedInProfileScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const LinkedInProfileAggregateArgsSchema: z.ZodType<Prisma.LinkedInProfileAggregateArgs> = z.object({
  where: LinkedInProfileWhereInputSchema.optional(),
  orderBy: z.union([ LinkedInProfileOrderByWithRelationInputSchema.array(),LinkedInProfileOrderByWithRelationInputSchema ]).optional(),
  cursor: LinkedInProfileWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const LinkedInProfileGroupByArgsSchema: z.ZodType<Prisma.LinkedInProfileGroupByArgs> = z.object({
  where: LinkedInProfileWhereInputSchema.optional(),
  orderBy: z.union([ LinkedInProfileOrderByWithAggregationInputSchema.array(),LinkedInProfileOrderByWithAggregationInputSchema ]).optional(),
  by: LinkedInProfileScalarFieldEnumSchema.array(),
  having: LinkedInProfileScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const LinkedInProfileFindUniqueArgsSchema: z.ZodType<Prisma.LinkedInProfileFindUniqueArgs> = z.object({
  select: LinkedInProfileSelectSchema.optional(),
  where: LinkedInProfileWhereUniqueInputSchema,
}).strict() ;

export const LinkedInProfileFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.LinkedInProfileFindUniqueOrThrowArgs> = z.object({
  select: LinkedInProfileSelectSchema.optional(),
  where: LinkedInProfileWhereUniqueInputSchema,
}).strict() ;

export const UserCreateArgsSchema: z.ZodType<Prisma.UserCreateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserCreateInputSchema,UserUncheckedCreateInputSchema ]),
}).strict() ;

export const UserUpsertArgsSchema: z.ZodType<Prisma.UserUpsertArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
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
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema,
}).strict() ;

export const UserUpdateArgsSchema: z.ZodType<Prisma.UserUpdateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
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

export const ProfileImportRunCreateArgsSchema: z.ZodType<Prisma.ProfileImportRunCreateArgs> = z.object({
  select: ProfileImportRunSelectSchema.optional(),
  include: ProfileImportRunIncludeSchema.optional(),
  data: z.union([ ProfileImportRunCreateInputSchema,ProfileImportRunUncheckedCreateInputSchema ]),
}).strict() ;

export const ProfileImportRunUpsertArgsSchema: z.ZodType<Prisma.ProfileImportRunUpsertArgs> = z.object({
  select: ProfileImportRunSelectSchema.optional(),
  include: ProfileImportRunIncludeSchema.optional(),
  where: ProfileImportRunWhereUniqueInputSchema,
  create: z.union([ ProfileImportRunCreateInputSchema,ProfileImportRunUncheckedCreateInputSchema ]),
  update: z.union([ ProfileImportRunUpdateInputSchema,ProfileImportRunUncheckedUpdateInputSchema ]),
}).strict() ;

export const ProfileImportRunCreateManyArgsSchema: z.ZodType<Prisma.ProfileImportRunCreateManyArgs> = z.object({
  data: z.union([ ProfileImportRunCreateManyInputSchema,ProfileImportRunCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const ProfileImportRunCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ProfileImportRunCreateManyAndReturnArgs> = z.object({
  data: z.union([ ProfileImportRunCreateManyInputSchema,ProfileImportRunCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const ProfileImportRunDeleteArgsSchema: z.ZodType<Prisma.ProfileImportRunDeleteArgs> = z.object({
  select: ProfileImportRunSelectSchema.optional(),
  include: ProfileImportRunIncludeSchema.optional(),
  where: ProfileImportRunWhereUniqueInputSchema,
}).strict() ;

export const ProfileImportRunUpdateArgsSchema: z.ZodType<Prisma.ProfileImportRunUpdateArgs> = z.object({
  select: ProfileImportRunSelectSchema.optional(),
  include: ProfileImportRunIncludeSchema.optional(),
  data: z.union([ ProfileImportRunUpdateInputSchema,ProfileImportRunUncheckedUpdateInputSchema ]),
  where: ProfileImportRunWhereUniqueInputSchema,
}).strict() ;

export const ProfileImportRunUpdateManyArgsSchema: z.ZodType<Prisma.ProfileImportRunUpdateManyArgs> = z.object({
  data: z.union([ ProfileImportRunUpdateManyMutationInputSchema,ProfileImportRunUncheckedUpdateManyInputSchema ]),
  where: ProfileImportRunWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const ProfileImportRunUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.ProfileImportRunUpdateManyAndReturnArgs> = z.object({
  data: z.union([ ProfileImportRunUpdateManyMutationInputSchema,ProfileImportRunUncheckedUpdateManyInputSchema ]),
  where: ProfileImportRunWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const ProfileImportRunDeleteManyArgsSchema: z.ZodType<Prisma.ProfileImportRunDeleteManyArgs> = z.object({
  where: ProfileImportRunWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const LinkedInProfileCreateArgsSchema: z.ZodType<Prisma.LinkedInProfileCreateArgs> = z.object({
  select: LinkedInProfileSelectSchema.optional(),
  data: z.union([ LinkedInProfileCreateInputSchema,LinkedInProfileUncheckedCreateInputSchema ]),
}).strict() ;

export const LinkedInProfileUpsertArgsSchema: z.ZodType<Prisma.LinkedInProfileUpsertArgs> = z.object({
  select: LinkedInProfileSelectSchema.optional(),
  where: LinkedInProfileWhereUniqueInputSchema,
  create: z.union([ LinkedInProfileCreateInputSchema,LinkedInProfileUncheckedCreateInputSchema ]),
  update: z.union([ LinkedInProfileUpdateInputSchema,LinkedInProfileUncheckedUpdateInputSchema ]),
}).strict() ;

export const LinkedInProfileCreateManyArgsSchema: z.ZodType<Prisma.LinkedInProfileCreateManyArgs> = z.object({
  data: z.union([ LinkedInProfileCreateManyInputSchema,LinkedInProfileCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const LinkedInProfileCreateManyAndReturnArgsSchema: z.ZodType<Prisma.LinkedInProfileCreateManyAndReturnArgs> = z.object({
  data: z.union([ LinkedInProfileCreateManyInputSchema,LinkedInProfileCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const LinkedInProfileDeleteArgsSchema: z.ZodType<Prisma.LinkedInProfileDeleteArgs> = z.object({
  select: LinkedInProfileSelectSchema.optional(),
  where: LinkedInProfileWhereUniqueInputSchema,
}).strict() ;

export const LinkedInProfileUpdateArgsSchema: z.ZodType<Prisma.LinkedInProfileUpdateArgs> = z.object({
  select: LinkedInProfileSelectSchema.optional(),
  data: z.union([ LinkedInProfileUpdateInputSchema,LinkedInProfileUncheckedUpdateInputSchema ]),
  where: LinkedInProfileWhereUniqueInputSchema,
}).strict() ;

export const LinkedInProfileUpdateManyArgsSchema: z.ZodType<Prisma.LinkedInProfileUpdateManyArgs> = z.object({
  data: z.union([ LinkedInProfileUpdateManyMutationInputSchema,LinkedInProfileUncheckedUpdateManyInputSchema ]),
  where: LinkedInProfileWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const LinkedInProfileUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.LinkedInProfileUpdateManyAndReturnArgs> = z.object({
  data: z.union([ LinkedInProfileUpdateManyMutationInputSchema,LinkedInProfileUncheckedUpdateManyInputSchema ]),
  where: LinkedInProfileWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const LinkedInProfileDeleteManyArgsSchema: z.ZodType<Prisma.LinkedInProfileDeleteManyArgs> = z.object({
  where: LinkedInProfileWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;
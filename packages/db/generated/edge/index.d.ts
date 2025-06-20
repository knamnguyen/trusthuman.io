
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Post
 * 
 */
export type Post = $Result.DefaultSelection<Prisma.$PostPayload>
/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model DemoVideo
 * 
 */
export type DemoVideo = $Result.DefaultSelection<Prisma.$DemoVideoPayload>
/**
 * Model SampleVideo
 * 
 */
export type SampleVideo = $Result.DefaultSelection<Prisma.$SampleVideoPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const AccessType: {
  TRIAL: 'TRIAL',
  FREE: 'FREE',
  LIFETIME: 'LIFETIME',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY'
};

export type AccessType = (typeof AccessType)[keyof typeof AccessType]

}

export type AccessType = $Enums.AccessType

export const AccessType: typeof $Enums.AccessType

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Posts
 * const posts = await prisma.post.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Posts
   * const posts = await prisma.post.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.post`: Exposes CRUD operations for the **Post** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Posts
    * const posts = await prisma.post.findMany()
    * ```
    */
  get post(): Prisma.PostDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.demoVideo`: Exposes CRUD operations for the **DemoVideo** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more DemoVideos
    * const demoVideos = await prisma.demoVideo.findMany()
    * ```
    */
  get demoVideo(): Prisma.DemoVideoDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.sampleVideo`: Exposes CRUD operations for the **SampleVideo** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SampleVideos
    * const sampleVideos = await prisma.sampleVideo.findMany()
    * ```
    */
  get sampleVideo(): Prisma.SampleVideoDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.8.2
   * Query Engine version: 2060c79ba17c6bb9f5823312b6f6b7f4a845738e
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Post: 'Post',
    User: 'User',
    DemoVideo: 'DemoVideo',
    SampleVideo: 'SampleVideo'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "post" | "user" | "demoVideo" | "sampleVideo"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Post: {
        payload: Prisma.$PostPayload<ExtArgs>
        fields: Prisma.PostFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PostFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PostFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          findFirst: {
            args: Prisma.PostFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PostFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          findMany: {
            args: Prisma.PostFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>[]
          }
          create: {
            args: Prisma.PostCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          createMany: {
            args: Prisma.PostCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PostCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>[]
          }
          delete: {
            args: Prisma.PostDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          update: {
            args: Prisma.PostUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          deleteMany: {
            args: Prisma.PostDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PostUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PostUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>[]
          }
          upsert: {
            args: Prisma.PostUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          aggregate: {
            args: Prisma.PostAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePost>
          }
          groupBy: {
            args: Prisma.PostGroupByArgs<ExtArgs>
            result: $Utils.Optional<PostGroupByOutputType>[]
          }
          count: {
            args: Prisma.PostCountArgs<ExtArgs>
            result: $Utils.Optional<PostCountAggregateOutputType> | number
          }
        }
      }
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      DemoVideo: {
        payload: Prisma.$DemoVideoPayload<ExtArgs>
        fields: Prisma.DemoVideoFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DemoVideoFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DemoVideoPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DemoVideoFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DemoVideoPayload>
          }
          findFirst: {
            args: Prisma.DemoVideoFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DemoVideoPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DemoVideoFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DemoVideoPayload>
          }
          findMany: {
            args: Prisma.DemoVideoFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DemoVideoPayload>[]
          }
          create: {
            args: Prisma.DemoVideoCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DemoVideoPayload>
          }
          createMany: {
            args: Prisma.DemoVideoCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DemoVideoCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DemoVideoPayload>[]
          }
          delete: {
            args: Prisma.DemoVideoDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DemoVideoPayload>
          }
          update: {
            args: Prisma.DemoVideoUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DemoVideoPayload>
          }
          deleteMany: {
            args: Prisma.DemoVideoDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DemoVideoUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.DemoVideoUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DemoVideoPayload>[]
          }
          upsert: {
            args: Prisma.DemoVideoUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DemoVideoPayload>
          }
          aggregate: {
            args: Prisma.DemoVideoAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDemoVideo>
          }
          groupBy: {
            args: Prisma.DemoVideoGroupByArgs<ExtArgs>
            result: $Utils.Optional<DemoVideoGroupByOutputType>[]
          }
          count: {
            args: Prisma.DemoVideoCountArgs<ExtArgs>
            result: $Utils.Optional<DemoVideoCountAggregateOutputType> | number
          }
        }
      }
      SampleVideo: {
        payload: Prisma.$SampleVideoPayload<ExtArgs>
        fields: Prisma.SampleVideoFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SampleVideoFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SampleVideoPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SampleVideoFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SampleVideoPayload>
          }
          findFirst: {
            args: Prisma.SampleVideoFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SampleVideoPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SampleVideoFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SampleVideoPayload>
          }
          findMany: {
            args: Prisma.SampleVideoFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SampleVideoPayload>[]
          }
          create: {
            args: Prisma.SampleVideoCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SampleVideoPayload>
          }
          createMany: {
            args: Prisma.SampleVideoCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SampleVideoCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SampleVideoPayload>[]
          }
          delete: {
            args: Prisma.SampleVideoDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SampleVideoPayload>
          }
          update: {
            args: Prisma.SampleVideoUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SampleVideoPayload>
          }
          deleteMany: {
            args: Prisma.SampleVideoDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SampleVideoUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SampleVideoUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SampleVideoPayload>[]
          }
          upsert: {
            args: Prisma.SampleVideoUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SampleVideoPayload>
          }
          aggregate: {
            args: Prisma.SampleVideoAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSampleVideo>
          }
          groupBy: {
            args: Prisma.SampleVideoGroupByArgs<ExtArgs>
            result: $Utils.Optional<SampleVideoGroupByOutputType>[]
          }
          count: {
            args: Prisma.SampleVideoCountArgs<ExtArgs>
            result: $Utils.Optional<SampleVideoCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    post?: PostOmit
    user?: UserOmit
    demoVideo?: DemoVideoOmit
    sampleVideo?: SampleVideoOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model Post
   */

  export type AggregatePost = {
    _count: PostCountAggregateOutputType | null
    _min: PostMinAggregateOutputType | null
    _max: PostMaxAggregateOutputType | null
  }

  export type PostMinAggregateOutputType = {
    id: string | null
    title: string | null
    content: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PostMaxAggregateOutputType = {
    id: string | null
    title: string | null
    content: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PostCountAggregateOutputType = {
    id: number
    title: number
    content: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PostMinAggregateInputType = {
    id?: true
    title?: true
    content?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PostMaxAggregateInputType = {
    id?: true
    title?: true
    content?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PostCountAggregateInputType = {
    id?: true
    title?: true
    content?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PostAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Post to aggregate.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Posts
    **/
    _count?: true | PostCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PostMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PostMaxAggregateInputType
  }

  export type GetPostAggregateType<T extends PostAggregateArgs> = {
        [P in keyof T & keyof AggregatePost]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePost[P]>
      : GetScalarType<T[P], AggregatePost[P]>
  }




  export type PostGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PostWhereInput
    orderBy?: PostOrderByWithAggregationInput | PostOrderByWithAggregationInput[]
    by: PostScalarFieldEnum[] | PostScalarFieldEnum
    having?: PostScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PostCountAggregateInputType | true
    _min?: PostMinAggregateInputType
    _max?: PostMaxAggregateInputType
  }

  export type PostGroupByOutputType = {
    id: string
    title: string
    content: string
    createdAt: Date
    updatedAt: Date
    _count: PostCountAggregateOutputType | null
    _min: PostMinAggregateOutputType | null
    _max: PostMaxAggregateOutputType | null
  }

  type GetPostGroupByPayload<T extends PostGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PostGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PostGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PostGroupByOutputType[P]>
            : GetScalarType<T[P], PostGroupByOutputType[P]>
        }
      >
    >


  export type PostSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    content?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["post"]>

  export type PostSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    content?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["post"]>

  export type PostSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    content?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["post"]>

  export type PostSelectScalar = {
    id?: boolean
    title?: boolean
    content?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PostOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "content" | "createdAt" | "updatedAt", ExtArgs["result"]["post"]>

  export type $PostPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Post"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      content: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["post"]>
    composites: {}
  }

  type PostGetPayload<S extends boolean | null | undefined | PostDefaultArgs> = $Result.GetResult<Prisma.$PostPayload, S>

  type PostCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PostFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PostCountAggregateInputType | true
    }

  export interface PostDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Post'], meta: { name: 'Post' } }
    /**
     * Find zero or one Post that matches the filter.
     * @param {PostFindUniqueArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PostFindUniqueArgs>(args: SelectSubset<T, PostFindUniqueArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Post that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PostFindUniqueOrThrowArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PostFindUniqueOrThrowArgs>(args: SelectSubset<T, PostFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Post that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindFirstArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PostFindFirstArgs>(args?: SelectSubset<T, PostFindFirstArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Post that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindFirstOrThrowArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PostFindFirstOrThrowArgs>(args?: SelectSubset<T, PostFindFirstOrThrowArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Posts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Posts
     * const posts = await prisma.post.findMany()
     * 
     * // Get first 10 Posts
     * const posts = await prisma.post.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const postWithIdOnly = await prisma.post.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PostFindManyArgs>(args?: SelectSubset<T, PostFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Post.
     * @param {PostCreateArgs} args - Arguments to create a Post.
     * @example
     * // Create one Post
     * const Post = await prisma.post.create({
     *   data: {
     *     // ... data to create a Post
     *   }
     * })
     * 
     */
    create<T extends PostCreateArgs>(args: SelectSubset<T, PostCreateArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Posts.
     * @param {PostCreateManyArgs} args - Arguments to create many Posts.
     * @example
     * // Create many Posts
     * const post = await prisma.post.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PostCreateManyArgs>(args?: SelectSubset<T, PostCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Posts and returns the data saved in the database.
     * @param {PostCreateManyAndReturnArgs} args - Arguments to create many Posts.
     * @example
     * // Create many Posts
     * const post = await prisma.post.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Posts and only return the `id`
     * const postWithIdOnly = await prisma.post.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PostCreateManyAndReturnArgs>(args?: SelectSubset<T, PostCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Post.
     * @param {PostDeleteArgs} args - Arguments to delete one Post.
     * @example
     * // Delete one Post
     * const Post = await prisma.post.delete({
     *   where: {
     *     // ... filter to delete one Post
     *   }
     * })
     * 
     */
    delete<T extends PostDeleteArgs>(args: SelectSubset<T, PostDeleteArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Post.
     * @param {PostUpdateArgs} args - Arguments to update one Post.
     * @example
     * // Update one Post
     * const post = await prisma.post.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PostUpdateArgs>(args: SelectSubset<T, PostUpdateArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Posts.
     * @param {PostDeleteManyArgs} args - Arguments to filter Posts to delete.
     * @example
     * // Delete a few Posts
     * const { count } = await prisma.post.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PostDeleteManyArgs>(args?: SelectSubset<T, PostDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Posts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Posts
     * const post = await prisma.post.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PostUpdateManyArgs>(args: SelectSubset<T, PostUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Posts and returns the data updated in the database.
     * @param {PostUpdateManyAndReturnArgs} args - Arguments to update many Posts.
     * @example
     * // Update many Posts
     * const post = await prisma.post.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Posts and only return the `id`
     * const postWithIdOnly = await prisma.post.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PostUpdateManyAndReturnArgs>(args: SelectSubset<T, PostUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Post.
     * @param {PostUpsertArgs} args - Arguments to update or create a Post.
     * @example
     * // Update or create a Post
     * const post = await prisma.post.upsert({
     *   create: {
     *     // ... data to create a Post
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Post we want to update
     *   }
     * })
     */
    upsert<T extends PostUpsertArgs>(args: SelectSubset<T, PostUpsertArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Posts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostCountArgs} args - Arguments to filter Posts to count.
     * @example
     * // Count the number of Posts
     * const count = await prisma.post.count({
     *   where: {
     *     // ... the filter for the Posts we want to count
     *   }
     * })
    **/
    count<T extends PostCountArgs>(
      args?: Subset<T, PostCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PostCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Post.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PostAggregateArgs>(args: Subset<T, PostAggregateArgs>): Prisma.PrismaPromise<GetPostAggregateType<T>>

    /**
     * Group by Post.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PostGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PostGroupByArgs['orderBy'] }
        : { orderBy?: PostGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PostGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPostGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Post model
   */
  readonly fields: PostFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Post.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PostClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Post model
   */
  interface PostFieldRefs {
    readonly id: FieldRef<"Post", 'String'>
    readonly title: FieldRef<"Post", 'String'>
    readonly content: FieldRef<"Post", 'String'>
    readonly createdAt: FieldRef<"Post", 'DateTime'>
    readonly updatedAt: FieldRef<"Post", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Post findUnique
   */
  export type PostFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post findUniqueOrThrow
   */
  export type PostFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post findFirst
   */
  export type PostFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Posts.
     */
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * Post findFirstOrThrow
   */
  export type PostFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Posts.
     */
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * Post findMany
   */
  export type PostFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Filter, which Posts to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * Post create
   */
  export type PostCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * The data needed to create a Post.
     */
    data: XOR<PostCreateInput, PostUncheckedCreateInput>
  }

  /**
   * Post createMany
   */
  export type PostCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Posts.
     */
    data: PostCreateManyInput | PostCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Post createManyAndReturn
   */
  export type PostCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * The data used to create many Posts.
     */
    data: PostCreateManyInput | PostCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Post update
   */
  export type PostUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * The data needed to update a Post.
     */
    data: XOR<PostUpdateInput, PostUncheckedUpdateInput>
    /**
     * Choose, which Post to update.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post updateMany
   */
  export type PostUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Posts.
     */
    data: XOR<PostUpdateManyMutationInput, PostUncheckedUpdateManyInput>
    /**
     * Filter which Posts to update
     */
    where?: PostWhereInput
    /**
     * Limit how many Posts to update.
     */
    limit?: number
  }

  /**
   * Post updateManyAndReturn
   */
  export type PostUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * The data used to update Posts.
     */
    data: XOR<PostUpdateManyMutationInput, PostUncheckedUpdateManyInput>
    /**
     * Filter which Posts to update
     */
    where?: PostWhereInput
    /**
     * Limit how many Posts to update.
     */
    limit?: number
  }

  /**
   * Post upsert
   */
  export type PostUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * The filter to search for the Post to update in case it exists.
     */
    where: PostWhereUniqueInput
    /**
     * In case the Post found by the `where` argument doesn't exist, create a new Post with this data.
     */
    create: XOR<PostCreateInput, PostUncheckedCreateInput>
    /**
     * In case the Post was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PostUpdateInput, PostUncheckedUpdateInput>
  }

  /**
   * Post delete
   */
  export type PostDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Filter which Post to delete.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post deleteMany
   */
  export type PostDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Posts to delete
     */
    where?: PostWhereInput
    /**
     * Limit how many Posts to delete.
     */
    limit?: number
  }

  /**
   * Post without action
   */
  export type PostDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
  }


  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    firstName: string | null
    lastName: string | null
    username: string | null
    primaryEmailAddress: string | null
    imageUrl: string | null
    stripeCustomerId: string | null
    accessType: $Enums.AccessType | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    firstName: string | null
    lastName: string | null
    username: string | null
    primaryEmailAddress: string | null
    imageUrl: string | null
    stripeCustomerId: string | null
    accessType: $Enums.AccessType | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    firstName: number
    lastName: number
    username: number
    primaryEmailAddress: number
    imageUrl: number
    clerkUserProperties: number
    stripeCustomerId: number
    accessType: number
    stripeUserProperties: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    firstName?: true
    lastName?: true
    username?: true
    primaryEmailAddress?: true
    imageUrl?: true
    stripeCustomerId?: true
    accessType?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    firstName?: true
    lastName?: true
    username?: true
    primaryEmailAddress?: true
    imageUrl?: true
    stripeCustomerId?: true
    accessType?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    firstName?: true
    lastName?: true
    username?: true
    primaryEmailAddress?: true
    imageUrl?: true
    clerkUserProperties?: true
    stripeCustomerId?: true
    accessType?: true
    stripeUserProperties?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    firstName: string | null
    lastName: string | null
    username: string | null
    primaryEmailAddress: string | null
    imageUrl: string | null
    clerkUserProperties: JsonValue | null
    stripeCustomerId: string | null
    accessType: $Enums.AccessType
    stripeUserProperties: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    firstName?: boolean
    lastName?: boolean
    username?: boolean
    primaryEmailAddress?: boolean
    imageUrl?: boolean
    clerkUserProperties?: boolean
    stripeCustomerId?: boolean
    accessType?: boolean
    stripeUserProperties?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    firstName?: boolean
    lastName?: boolean
    username?: boolean
    primaryEmailAddress?: boolean
    imageUrl?: boolean
    clerkUserProperties?: boolean
    stripeCustomerId?: boolean
    accessType?: boolean
    stripeUserProperties?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    firstName?: boolean
    lastName?: boolean
    username?: boolean
    primaryEmailAddress?: boolean
    imageUrl?: boolean
    clerkUserProperties?: boolean
    stripeCustomerId?: boolean
    accessType?: boolean
    stripeUserProperties?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    firstName?: boolean
    lastName?: boolean
    username?: boolean
    primaryEmailAddress?: boolean
    imageUrl?: boolean
    clerkUserProperties?: boolean
    stripeCustomerId?: boolean
    accessType?: boolean
    stripeUserProperties?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "firstName" | "lastName" | "username" | "primaryEmailAddress" | "imageUrl" | "clerkUserProperties" | "stripeCustomerId" | "accessType" | "stripeUserProperties" | "createdAt" | "updatedAt", ExtArgs["result"]["user"]>

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      firstName: string | null
      lastName: string | null
      username: string | null
      primaryEmailAddress: string | null
      imageUrl: string | null
      clerkUserProperties: Prisma.JsonValue | null
      stripeCustomerId: string | null
      accessType: $Enums.AccessType
      stripeUserProperties: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly firstName: FieldRef<"User", 'String'>
    readonly lastName: FieldRef<"User", 'String'>
    readonly username: FieldRef<"User", 'String'>
    readonly primaryEmailAddress: FieldRef<"User", 'String'>
    readonly imageUrl: FieldRef<"User", 'String'>
    readonly clerkUserProperties: FieldRef<"User", 'Json'>
    readonly stripeCustomerId: FieldRef<"User", 'String'>
    readonly accessType: FieldRef<"User", 'AccessType'>
    readonly stripeUserProperties: FieldRef<"User", 'Json'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
  }


  /**
   * Model DemoVideo
   */

  export type AggregateDemoVideo = {
    _count: DemoVideoCountAggregateOutputType | null
    _avg: DemoVideoAvgAggregateOutputType | null
    _sum: DemoVideoSumAggregateOutputType | null
    _min: DemoVideoMinAggregateOutputType | null
    _max: DemoVideoMaxAggregateOutputType | null
  }

  export type DemoVideoAvgAggregateOutputType = {
    durationSeconds: number | null
  }

  export type DemoVideoSumAggregateOutputType = {
    durationSeconds: number | null
  }

  export type DemoVideoMinAggregateOutputType = {
    id: string | null
    s3Url: string | null
    productInfo: string | null
    colorPalette: string | null
    durationSeconds: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DemoVideoMaxAggregateOutputType = {
    id: string | null
    s3Url: string | null
    productInfo: string | null
    colorPalette: string | null
    durationSeconds: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DemoVideoCountAggregateOutputType = {
    id: number
    s3Url: number
    productInfo: number
    colorPalette: number
    durationSeconds: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type DemoVideoAvgAggregateInputType = {
    durationSeconds?: true
  }

  export type DemoVideoSumAggregateInputType = {
    durationSeconds?: true
  }

  export type DemoVideoMinAggregateInputType = {
    id?: true
    s3Url?: true
    productInfo?: true
    colorPalette?: true
    durationSeconds?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DemoVideoMaxAggregateInputType = {
    id?: true
    s3Url?: true
    productInfo?: true
    colorPalette?: true
    durationSeconds?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DemoVideoCountAggregateInputType = {
    id?: true
    s3Url?: true
    productInfo?: true
    colorPalette?: true
    durationSeconds?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type DemoVideoAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DemoVideo to aggregate.
     */
    where?: DemoVideoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DemoVideos to fetch.
     */
    orderBy?: DemoVideoOrderByWithRelationInput | DemoVideoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DemoVideoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DemoVideos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DemoVideos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned DemoVideos
    **/
    _count?: true | DemoVideoCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: DemoVideoAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: DemoVideoSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DemoVideoMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DemoVideoMaxAggregateInputType
  }

  export type GetDemoVideoAggregateType<T extends DemoVideoAggregateArgs> = {
        [P in keyof T & keyof AggregateDemoVideo]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDemoVideo[P]>
      : GetScalarType<T[P], AggregateDemoVideo[P]>
  }




  export type DemoVideoGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DemoVideoWhereInput
    orderBy?: DemoVideoOrderByWithAggregationInput | DemoVideoOrderByWithAggregationInput[]
    by: DemoVideoScalarFieldEnum[] | DemoVideoScalarFieldEnum
    having?: DemoVideoScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DemoVideoCountAggregateInputType | true
    _avg?: DemoVideoAvgAggregateInputType
    _sum?: DemoVideoSumAggregateInputType
    _min?: DemoVideoMinAggregateInputType
    _max?: DemoVideoMaxAggregateInputType
  }

  export type DemoVideoGroupByOutputType = {
    id: string
    s3Url: string
    productInfo: string | null
    colorPalette: string
    durationSeconds: number
    createdAt: Date
    updatedAt: Date
    _count: DemoVideoCountAggregateOutputType | null
    _avg: DemoVideoAvgAggregateOutputType | null
    _sum: DemoVideoSumAggregateOutputType | null
    _min: DemoVideoMinAggregateOutputType | null
    _max: DemoVideoMaxAggregateOutputType | null
  }

  type GetDemoVideoGroupByPayload<T extends DemoVideoGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DemoVideoGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DemoVideoGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DemoVideoGroupByOutputType[P]>
            : GetScalarType<T[P], DemoVideoGroupByOutputType[P]>
        }
      >
    >


  export type DemoVideoSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    s3Url?: boolean
    productInfo?: boolean
    colorPalette?: boolean
    durationSeconds?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["demoVideo"]>

  export type DemoVideoSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    s3Url?: boolean
    productInfo?: boolean
    colorPalette?: boolean
    durationSeconds?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["demoVideo"]>

  export type DemoVideoSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    s3Url?: boolean
    productInfo?: boolean
    colorPalette?: boolean
    durationSeconds?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["demoVideo"]>

  export type DemoVideoSelectScalar = {
    id?: boolean
    s3Url?: boolean
    productInfo?: boolean
    colorPalette?: boolean
    durationSeconds?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type DemoVideoOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "s3Url" | "productInfo" | "colorPalette" | "durationSeconds" | "createdAt" | "updatedAt", ExtArgs["result"]["demoVideo"]>

  export type $DemoVideoPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "DemoVideo"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      s3Url: string
      productInfo: string | null
      colorPalette: string
      durationSeconds: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["demoVideo"]>
    composites: {}
  }

  type DemoVideoGetPayload<S extends boolean | null | undefined | DemoVideoDefaultArgs> = $Result.GetResult<Prisma.$DemoVideoPayload, S>

  type DemoVideoCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<DemoVideoFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: DemoVideoCountAggregateInputType | true
    }

  export interface DemoVideoDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['DemoVideo'], meta: { name: 'DemoVideo' } }
    /**
     * Find zero or one DemoVideo that matches the filter.
     * @param {DemoVideoFindUniqueArgs} args - Arguments to find a DemoVideo
     * @example
     * // Get one DemoVideo
     * const demoVideo = await prisma.demoVideo.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DemoVideoFindUniqueArgs>(args: SelectSubset<T, DemoVideoFindUniqueArgs<ExtArgs>>): Prisma__DemoVideoClient<$Result.GetResult<Prisma.$DemoVideoPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one DemoVideo that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {DemoVideoFindUniqueOrThrowArgs} args - Arguments to find a DemoVideo
     * @example
     * // Get one DemoVideo
     * const demoVideo = await prisma.demoVideo.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DemoVideoFindUniqueOrThrowArgs>(args: SelectSubset<T, DemoVideoFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DemoVideoClient<$Result.GetResult<Prisma.$DemoVideoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first DemoVideo that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DemoVideoFindFirstArgs} args - Arguments to find a DemoVideo
     * @example
     * // Get one DemoVideo
     * const demoVideo = await prisma.demoVideo.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DemoVideoFindFirstArgs>(args?: SelectSubset<T, DemoVideoFindFirstArgs<ExtArgs>>): Prisma__DemoVideoClient<$Result.GetResult<Prisma.$DemoVideoPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first DemoVideo that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DemoVideoFindFirstOrThrowArgs} args - Arguments to find a DemoVideo
     * @example
     * // Get one DemoVideo
     * const demoVideo = await prisma.demoVideo.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DemoVideoFindFirstOrThrowArgs>(args?: SelectSubset<T, DemoVideoFindFirstOrThrowArgs<ExtArgs>>): Prisma__DemoVideoClient<$Result.GetResult<Prisma.$DemoVideoPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more DemoVideos that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DemoVideoFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all DemoVideos
     * const demoVideos = await prisma.demoVideo.findMany()
     * 
     * // Get first 10 DemoVideos
     * const demoVideos = await prisma.demoVideo.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const demoVideoWithIdOnly = await prisma.demoVideo.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DemoVideoFindManyArgs>(args?: SelectSubset<T, DemoVideoFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DemoVideoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a DemoVideo.
     * @param {DemoVideoCreateArgs} args - Arguments to create a DemoVideo.
     * @example
     * // Create one DemoVideo
     * const DemoVideo = await prisma.demoVideo.create({
     *   data: {
     *     // ... data to create a DemoVideo
     *   }
     * })
     * 
     */
    create<T extends DemoVideoCreateArgs>(args: SelectSubset<T, DemoVideoCreateArgs<ExtArgs>>): Prisma__DemoVideoClient<$Result.GetResult<Prisma.$DemoVideoPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many DemoVideos.
     * @param {DemoVideoCreateManyArgs} args - Arguments to create many DemoVideos.
     * @example
     * // Create many DemoVideos
     * const demoVideo = await prisma.demoVideo.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DemoVideoCreateManyArgs>(args?: SelectSubset<T, DemoVideoCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many DemoVideos and returns the data saved in the database.
     * @param {DemoVideoCreateManyAndReturnArgs} args - Arguments to create many DemoVideos.
     * @example
     * // Create many DemoVideos
     * const demoVideo = await prisma.demoVideo.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many DemoVideos and only return the `id`
     * const demoVideoWithIdOnly = await prisma.demoVideo.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DemoVideoCreateManyAndReturnArgs>(args?: SelectSubset<T, DemoVideoCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DemoVideoPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a DemoVideo.
     * @param {DemoVideoDeleteArgs} args - Arguments to delete one DemoVideo.
     * @example
     * // Delete one DemoVideo
     * const DemoVideo = await prisma.demoVideo.delete({
     *   where: {
     *     // ... filter to delete one DemoVideo
     *   }
     * })
     * 
     */
    delete<T extends DemoVideoDeleteArgs>(args: SelectSubset<T, DemoVideoDeleteArgs<ExtArgs>>): Prisma__DemoVideoClient<$Result.GetResult<Prisma.$DemoVideoPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one DemoVideo.
     * @param {DemoVideoUpdateArgs} args - Arguments to update one DemoVideo.
     * @example
     * // Update one DemoVideo
     * const demoVideo = await prisma.demoVideo.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DemoVideoUpdateArgs>(args: SelectSubset<T, DemoVideoUpdateArgs<ExtArgs>>): Prisma__DemoVideoClient<$Result.GetResult<Prisma.$DemoVideoPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more DemoVideos.
     * @param {DemoVideoDeleteManyArgs} args - Arguments to filter DemoVideos to delete.
     * @example
     * // Delete a few DemoVideos
     * const { count } = await prisma.demoVideo.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DemoVideoDeleteManyArgs>(args?: SelectSubset<T, DemoVideoDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DemoVideos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DemoVideoUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many DemoVideos
     * const demoVideo = await prisma.demoVideo.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DemoVideoUpdateManyArgs>(args: SelectSubset<T, DemoVideoUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DemoVideos and returns the data updated in the database.
     * @param {DemoVideoUpdateManyAndReturnArgs} args - Arguments to update many DemoVideos.
     * @example
     * // Update many DemoVideos
     * const demoVideo = await prisma.demoVideo.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more DemoVideos and only return the `id`
     * const demoVideoWithIdOnly = await prisma.demoVideo.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends DemoVideoUpdateManyAndReturnArgs>(args: SelectSubset<T, DemoVideoUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DemoVideoPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one DemoVideo.
     * @param {DemoVideoUpsertArgs} args - Arguments to update or create a DemoVideo.
     * @example
     * // Update or create a DemoVideo
     * const demoVideo = await prisma.demoVideo.upsert({
     *   create: {
     *     // ... data to create a DemoVideo
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the DemoVideo we want to update
     *   }
     * })
     */
    upsert<T extends DemoVideoUpsertArgs>(args: SelectSubset<T, DemoVideoUpsertArgs<ExtArgs>>): Prisma__DemoVideoClient<$Result.GetResult<Prisma.$DemoVideoPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of DemoVideos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DemoVideoCountArgs} args - Arguments to filter DemoVideos to count.
     * @example
     * // Count the number of DemoVideos
     * const count = await prisma.demoVideo.count({
     *   where: {
     *     // ... the filter for the DemoVideos we want to count
     *   }
     * })
    **/
    count<T extends DemoVideoCountArgs>(
      args?: Subset<T, DemoVideoCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DemoVideoCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a DemoVideo.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DemoVideoAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DemoVideoAggregateArgs>(args: Subset<T, DemoVideoAggregateArgs>): Prisma.PrismaPromise<GetDemoVideoAggregateType<T>>

    /**
     * Group by DemoVideo.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DemoVideoGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DemoVideoGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DemoVideoGroupByArgs['orderBy'] }
        : { orderBy?: DemoVideoGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DemoVideoGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDemoVideoGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the DemoVideo model
   */
  readonly fields: DemoVideoFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for DemoVideo.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DemoVideoClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the DemoVideo model
   */
  interface DemoVideoFieldRefs {
    readonly id: FieldRef<"DemoVideo", 'String'>
    readonly s3Url: FieldRef<"DemoVideo", 'String'>
    readonly productInfo: FieldRef<"DemoVideo", 'String'>
    readonly colorPalette: FieldRef<"DemoVideo", 'String'>
    readonly durationSeconds: FieldRef<"DemoVideo", 'Int'>
    readonly createdAt: FieldRef<"DemoVideo", 'DateTime'>
    readonly updatedAt: FieldRef<"DemoVideo", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * DemoVideo findUnique
   */
  export type DemoVideoFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DemoVideo
     */
    select?: DemoVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DemoVideo
     */
    omit?: DemoVideoOmit<ExtArgs> | null
    /**
     * Filter, which DemoVideo to fetch.
     */
    where: DemoVideoWhereUniqueInput
  }

  /**
   * DemoVideo findUniqueOrThrow
   */
  export type DemoVideoFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DemoVideo
     */
    select?: DemoVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DemoVideo
     */
    omit?: DemoVideoOmit<ExtArgs> | null
    /**
     * Filter, which DemoVideo to fetch.
     */
    where: DemoVideoWhereUniqueInput
  }

  /**
   * DemoVideo findFirst
   */
  export type DemoVideoFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DemoVideo
     */
    select?: DemoVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DemoVideo
     */
    omit?: DemoVideoOmit<ExtArgs> | null
    /**
     * Filter, which DemoVideo to fetch.
     */
    where?: DemoVideoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DemoVideos to fetch.
     */
    orderBy?: DemoVideoOrderByWithRelationInput | DemoVideoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DemoVideos.
     */
    cursor?: DemoVideoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DemoVideos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DemoVideos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DemoVideos.
     */
    distinct?: DemoVideoScalarFieldEnum | DemoVideoScalarFieldEnum[]
  }

  /**
   * DemoVideo findFirstOrThrow
   */
  export type DemoVideoFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DemoVideo
     */
    select?: DemoVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DemoVideo
     */
    omit?: DemoVideoOmit<ExtArgs> | null
    /**
     * Filter, which DemoVideo to fetch.
     */
    where?: DemoVideoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DemoVideos to fetch.
     */
    orderBy?: DemoVideoOrderByWithRelationInput | DemoVideoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DemoVideos.
     */
    cursor?: DemoVideoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DemoVideos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DemoVideos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DemoVideos.
     */
    distinct?: DemoVideoScalarFieldEnum | DemoVideoScalarFieldEnum[]
  }

  /**
   * DemoVideo findMany
   */
  export type DemoVideoFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DemoVideo
     */
    select?: DemoVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DemoVideo
     */
    omit?: DemoVideoOmit<ExtArgs> | null
    /**
     * Filter, which DemoVideos to fetch.
     */
    where?: DemoVideoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DemoVideos to fetch.
     */
    orderBy?: DemoVideoOrderByWithRelationInput | DemoVideoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing DemoVideos.
     */
    cursor?: DemoVideoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DemoVideos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DemoVideos.
     */
    skip?: number
    distinct?: DemoVideoScalarFieldEnum | DemoVideoScalarFieldEnum[]
  }

  /**
   * DemoVideo create
   */
  export type DemoVideoCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DemoVideo
     */
    select?: DemoVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DemoVideo
     */
    omit?: DemoVideoOmit<ExtArgs> | null
    /**
     * The data needed to create a DemoVideo.
     */
    data: XOR<DemoVideoCreateInput, DemoVideoUncheckedCreateInput>
  }

  /**
   * DemoVideo createMany
   */
  export type DemoVideoCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many DemoVideos.
     */
    data: DemoVideoCreateManyInput | DemoVideoCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * DemoVideo createManyAndReturn
   */
  export type DemoVideoCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DemoVideo
     */
    select?: DemoVideoSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the DemoVideo
     */
    omit?: DemoVideoOmit<ExtArgs> | null
    /**
     * The data used to create many DemoVideos.
     */
    data: DemoVideoCreateManyInput | DemoVideoCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * DemoVideo update
   */
  export type DemoVideoUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DemoVideo
     */
    select?: DemoVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DemoVideo
     */
    omit?: DemoVideoOmit<ExtArgs> | null
    /**
     * The data needed to update a DemoVideo.
     */
    data: XOR<DemoVideoUpdateInput, DemoVideoUncheckedUpdateInput>
    /**
     * Choose, which DemoVideo to update.
     */
    where: DemoVideoWhereUniqueInput
  }

  /**
   * DemoVideo updateMany
   */
  export type DemoVideoUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update DemoVideos.
     */
    data: XOR<DemoVideoUpdateManyMutationInput, DemoVideoUncheckedUpdateManyInput>
    /**
     * Filter which DemoVideos to update
     */
    where?: DemoVideoWhereInput
    /**
     * Limit how many DemoVideos to update.
     */
    limit?: number
  }

  /**
   * DemoVideo updateManyAndReturn
   */
  export type DemoVideoUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DemoVideo
     */
    select?: DemoVideoSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the DemoVideo
     */
    omit?: DemoVideoOmit<ExtArgs> | null
    /**
     * The data used to update DemoVideos.
     */
    data: XOR<DemoVideoUpdateManyMutationInput, DemoVideoUncheckedUpdateManyInput>
    /**
     * Filter which DemoVideos to update
     */
    where?: DemoVideoWhereInput
    /**
     * Limit how many DemoVideos to update.
     */
    limit?: number
  }

  /**
   * DemoVideo upsert
   */
  export type DemoVideoUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DemoVideo
     */
    select?: DemoVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DemoVideo
     */
    omit?: DemoVideoOmit<ExtArgs> | null
    /**
     * The filter to search for the DemoVideo to update in case it exists.
     */
    where: DemoVideoWhereUniqueInput
    /**
     * In case the DemoVideo found by the `where` argument doesn't exist, create a new DemoVideo with this data.
     */
    create: XOR<DemoVideoCreateInput, DemoVideoUncheckedCreateInput>
    /**
     * In case the DemoVideo was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DemoVideoUpdateInput, DemoVideoUncheckedUpdateInput>
  }

  /**
   * DemoVideo delete
   */
  export type DemoVideoDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DemoVideo
     */
    select?: DemoVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DemoVideo
     */
    omit?: DemoVideoOmit<ExtArgs> | null
    /**
     * Filter which DemoVideo to delete.
     */
    where: DemoVideoWhereUniqueInput
  }

  /**
   * DemoVideo deleteMany
   */
  export type DemoVideoDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DemoVideos to delete
     */
    where?: DemoVideoWhereInput
    /**
     * Limit how many DemoVideos to delete.
     */
    limit?: number
  }

  /**
   * DemoVideo without action
   */
  export type DemoVideoDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DemoVideo
     */
    select?: DemoVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DemoVideo
     */
    omit?: DemoVideoOmit<ExtArgs> | null
  }


  /**
   * Model SampleVideo
   */

  export type AggregateSampleVideo = {
    _count: SampleVideoCountAggregateOutputType | null
    _avg: SampleVideoAvgAggregateOutputType | null
    _sum: SampleVideoSumAggregateOutputType | null
    _min: SampleVideoMinAggregateOutputType | null
    _max: SampleVideoMaxAggregateOutputType | null
  }

  export type SampleVideoAvgAggregateOutputType = {
    views: number | null
    comments: number | null
    likes: number | null
    durationSeconds: number | null
  }

  export type SampleVideoSumAggregateOutputType = {
    views: number | null
    comments: number | null
    likes: number | null
    durationSeconds: number | null
  }

  export type SampleVideoMinAggregateOutputType = {
    id: string | null
    webpageUrl: string | null
    s3Url: string | null
    colorPalette: string | null
    hookEndTimestamp: string | null
    hookCutConfidence: string | null
    hookCutUrl: string | null
    hookInfo: string | null
    title: string | null
    description: string | null
    views: number | null
    comments: number | null
    likes: number | null
    durationSeconds: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SampleVideoMaxAggregateOutputType = {
    id: string | null
    webpageUrl: string | null
    s3Url: string | null
    colorPalette: string | null
    hookEndTimestamp: string | null
    hookCutConfidence: string | null
    hookCutUrl: string | null
    hookInfo: string | null
    title: string | null
    description: string | null
    views: number | null
    comments: number | null
    likes: number | null
    durationSeconds: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SampleVideoCountAggregateOutputType = {
    id: number
    webpageUrl: number
    s3Url: number
    colorPalette: number
    hookEndTimestamp: number
    hookCutConfidence: number
    hookCutUrl: number
    hookInfo: number
    title: number
    description: number
    views: number
    comments: number
    likes: number
    durationSeconds: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SampleVideoAvgAggregateInputType = {
    views?: true
    comments?: true
    likes?: true
    durationSeconds?: true
  }

  export type SampleVideoSumAggregateInputType = {
    views?: true
    comments?: true
    likes?: true
    durationSeconds?: true
  }

  export type SampleVideoMinAggregateInputType = {
    id?: true
    webpageUrl?: true
    s3Url?: true
    colorPalette?: true
    hookEndTimestamp?: true
    hookCutConfidence?: true
    hookCutUrl?: true
    hookInfo?: true
    title?: true
    description?: true
    views?: true
    comments?: true
    likes?: true
    durationSeconds?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SampleVideoMaxAggregateInputType = {
    id?: true
    webpageUrl?: true
    s3Url?: true
    colorPalette?: true
    hookEndTimestamp?: true
    hookCutConfidence?: true
    hookCutUrl?: true
    hookInfo?: true
    title?: true
    description?: true
    views?: true
    comments?: true
    likes?: true
    durationSeconds?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SampleVideoCountAggregateInputType = {
    id?: true
    webpageUrl?: true
    s3Url?: true
    colorPalette?: true
    hookEndTimestamp?: true
    hookCutConfidence?: true
    hookCutUrl?: true
    hookInfo?: true
    title?: true
    description?: true
    views?: true
    comments?: true
    likes?: true
    durationSeconds?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SampleVideoAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SampleVideo to aggregate.
     */
    where?: SampleVideoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SampleVideos to fetch.
     */
    orderBy?: SampleVideoOrderByWithRelationInput | SampleVideoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SampleVideoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SampleVideos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SampleVideos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SampleVideos
    **/
    _count?: true | SampleVideoCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SampleVideoAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SampleVideoSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SampleVideoMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SampleVideoMaxAggregateInputType
  }

  export type GetSampleVideoAggregateType<T extends SampleVideoAggregateArgs> = {
        [P in keyof T & keyof AggregateSampleVideo]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSampleVideo[P]>
      : GetScalarType<T[P], AggregateSampleVideo[P]>
  }




  export type SampleVideoGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SampleVideoWhereInput
    orderBy?: SampleVideoOrderByWithAggregationInput | SampleVideoOrderByWithAggregationInput[]
    by: SampleVideoScalarFieldEnum[] | SampleVideoScalarFieldEnum
    having?: SampleVideoScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SampleVideoCountAggregateInputType | true
    _avg?: SampleVideoAvgAggregateInputType
    _sum?: SampleVideoSumAggregateInputType
    _min?: SampleVideoMinAggregateInputType
    _max?: SampleVideoMaxAggregateInputType
  }

  export type SampleVideoGroupByOutputType = {
    id: string
    webpageUrl: string
    s3Url: string
    colorPalette: string | null
    hookEndTimestamp: string
    hookCutConfidence: string | null
    hookCutUrl: string | null
    hookInfo: string | null
    title: string
    description: string | null
    views: number
    comments: number
    likes: number
    durationSeconds: number
    createdAt: Date
    updatedAt: Date
    _count: SampleVideoCountAggregateOutputType | null
    _avg: SampleVideoAvgAggregateOutputType | null
    _sum: SampleVideoSumAggregateOutputType | null
    _min: SampleVideoMinAggregateOutputType | null
    _max: SampleVideoMaxAggregateOutputType | null
  }

  type GetSampleVideoGroupByPayload<T extends SampleVideoGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SampleVideoGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SampleVideoGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SampleVideoGroupByOutputType[P]>
            : GetScalarType<T[P], SampleVideoGroupByOutputType[P]>
        }
      >
    >


  export type SampleVideoSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    webpageUrl?: boolean
    s3Url?: boolean
    colorPalette?: boolean
    hookEndTimestamp?: boolean
    hookCutConfidence?: boolean
    hookCutUrl?: boolean
    hookInfo?: boolean
    title?: boolean
    description?: boolean
    views?: boolean
    comments?: boolean
    likes?: boolean
    durationSeconds?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["sampleVideo"]>

  export type SampleVideoSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    webpageUrl?: boolean
    s3Url?: boolean
    colorPalette?: boolean
    hookEndTimestamp?: boolean
    hookCutConfidence?: boolean
    hookCutUrl?: boolean
    hookInfo?: boolean
    title?: boolean
    description?: boolean
    views?: boolean
    comments?: boolean
    likes?: boolean
    durationSeconds?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["sampleVideo"]>

  export type SampleVideoSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    webpageUrl?: boolean
    s3Url?: boolean
    colorPalette?: boolean
    hookEndTimestamp?: boolean
    hookCutConfidence?: boolean
    hookCutUrl?: boolean
    hookInfo?: boolean
    title?: boolean
    description?: boolean
    views?: boolean
    comments?: boolean
    likes?: boolean
    durationSeconds?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["sampleVideo"]>

  export type SampleVideoSelectScalar = {
    id?: boolean
    webpageUrl?: boolean
    s3Url?: boolean
    colorPalette?: boolean
    hookEndTimestamp?: boolean
    hookCutConfidence?: boolean
    hookCutUrl?: boolean
    hookInfo?: boolean
    title?: boolean
    description?: boolean
    views?: boolean
    comments?: boolean
    likes?: boolean
    durationSeconds?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SampleVideoOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "webpageUrl" | "s3Url" | "colorPalette" | "hookEndTimestamp" | "hookCutConfidence" | "hookCutUrl" | "hookInfo" | "title" | "description" | "views" | "comments" | "likes" | "durationSeconds" | "createdAt" | "updatedAt", ExtArgs["result"]["sampleVideo"]>

  export type $SampleVideoPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SampleVideo"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      webpageUrl: string
      s3Url: string
      colorPalette: string | null
      hookEndTimestamp: string
      hookCutConfidence: string | null
      hookCutUrl: string | null
      hookInfo: string | null
      title: string
      description: string | null
      views: number
      comments: number
      likes: number
      durationSeconds: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["sampleVideo"]>
    composites: {}
  }

  type SampleVideoGetPayload<S extends boolean | null | undefined | SampleVideoDefaultArgs> = $Result.GetResult<Prisma.$SampleVideoPayload, S>

  type SampleVideoCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SampleVideoFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SampleVideoCountAggregateInputType | true
    }

  export interface SampleVideoDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SampleVideo'], meta: { name: 'SampleVideo' } }
    /**
     * Find zero or one SampleVideo that matches the filter.
     * @param {SampleVideoFindUniqueArgs} args - Arguments to find a SampleVideo
     * @example
     * // Get one SampleVideo
     * const sampleVideo = await prisma.sampleVideo.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SampleVideoFindUniqueArgs>(args: SelectSubset<T, SampleVideoFindUniqueArgs<ExtArgs>>): Prisma__SampleVideoClient<$Result.GetResult<Prisma.$SampleVideoPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SampleVideo that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SampleVideoFindUniqueOrThrowArgs} args - Arguments to find a SampleVideo
     * @example
     * // Get one SampleVideo
     * const sampleVideo = await prisma.sampleVideo.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SampleVideoFindUniqueOrThrowArgs>(args: SelectSubset<T, SampleVideoFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SampleVideoClient<$Result.GetResult<Prisma.$SampleVideoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SampleVideo that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SampleVideoFindFirstArgs} args - Arguments to find a SampleVideo
     * @example
     * // Get one SampleVideo
     * const sampleVideo = await prisma.sampleVideo.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SampleVideoFindFirstArgs>(args?: SelectSubset<T, SampleVideoFindFirstArgs<ExtArgs>>): Prisma__SampleVideoClient<$Result.GetResult<Prisma.$SampleVideoPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SampleVideo that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SampleVideoFindFirstOrThrowArgs} args - Arguments to find a SampleVideo
     * @example
     * // Get one SampleVideo
     * const sampleVideo = await prisma.sampleVideo.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SampleVideoFindFirstOrThrowArgs>(args?: SelectSubset<T, SampleVideoFindFirstOrThrowArgs<ExtArgs>>): Prisma__SampleVideoClient<$Result.GetResult<Prisma.$SampleVideoPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SampleVideos that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SampleVideoFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SampleVideos
     * const sampleVideos = await prisma.sampleVideo.findMany()
     * 
     * // Get first 10 SampleVideos
     * const sampleVideos = await prisma.sampleVideo.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const sampleVideoWithIdOnly = await prisma.sampleVideo.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SampleVideoFindManyArgs>(args?: SelectSubset<T, SampleVideoFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SampleVideoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SampleVideo.
     * @param {SampleVideoCreateArgs} args - Arguments to create a SampleVideo.
     * @example
     * // Create one SampleVideo
     * const SampleVideo = await prisma.sampleVideo.create({
     *   data: {
     *     // ... data to create a SampleVideo
     *   }
     * })
     * 
     */
    create<T extends SampleVideoCreateArgs>(args: SelectSubset<T, SampleVideoCreateArgs<ExtArgs>>): Prisma__SampleVideoClient<$Result.GetResult<Prisma.$SampleVideoPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SampleVideos.
     * @param {SampleVideoCreateManyArgs} args - Arguments to create many SampleVideos.
     * @example
     * // Create many SampleVideos
     * const sampleVideo = await prisma.sampleVideo.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SampleVideoCreateManyArgs>(args?: SelectSubset<T, SampleVideoCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SampleVideos and returns the data saved in the database.
     * @param {SampleVideoCreateManyAndReturnArgs} args - Arguments to create many SampleVideos.
     * @example
     * // Create many SampleVideos
     * const sampleVideo = await prisma.sampleVideo.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SampleVideos and only return the `id`
     * const sampleVideoWithIdOnly = await prisma.sampleVideo.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SampleVideoCreateManyAndReturnArgs>(args?: SelectSubset<T, SampleVideoCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SampleVideoPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SampleVideo.
     * @param {SampleVideoDeleteArgs} args - Arguments to delete one SampleVideo.
     * @example
     * // Delete one SampleVideo
     * const SampleVideo = await prisma.sampleVideo.delete({
     *   where: {
     *     // ... filter to delete one SampleVideo
     *   }
     * })
     * 
     */
    delete<T extends SampleVideoDeleteArgs>(args: SelectSubset<T, SampleVideoDeleteArgs<ExtArgs>>): Prisma__SampleVideoClient<$Result.GetResult<Prisma.$SampleVideoPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SampleVideo.
     * @param {SampleVideoUpdateArgs} args - Arguments to update one SampleVideo.
     * @example
     * // Update one SampleVideo
     * const sampleVideo = await prisma.sampleVideo.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SampleVideoUpdateArgs>(args: SelectSubset<T, SampleVideoUpdateArgs<ExtArgs>>): Prisma__SampleVideoClient<$Result.GetResult<Prisma.$SampleVideoPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SampleVideos.
     * @param {SampleVideoDeleteManyArgs} args - Arguments to filter SampleVideos to delete.
     * @example
     * // Delete a few SampleVideos
     * const { count } = await prisma.sampleVideo.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SampleVideoDeleteManyArgs>(args?: SelectSubset<T, SampleVideoDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SampleVideos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SampleVideoUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SampleVideos
     * const sampleVideo = await prisma.sampleVideo.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SampleVideoUpdateManyArgs>(args: SelectSubset<T, SampleVideoUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SampleVideos and returns the data updated in the database.
     * @param {SampleVideoUpdateManyAndReturnArgs} args - Arguments to update many SampleVideos.
     * @example
     * // Update many SampleVideos
     * const sampleVideo = await prisma.sampleVideo.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SampleVideos and only return the `id`
     * const sampleVideoWithIdOnly = await prisma.sampleVideo.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SampleVideoUpdateManyAndReturnArgs>(args: SelectSubset<T, SampleVideoUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SampleVideoPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SampleVideo.
     * @param {SampleVideoUpsertArgs} args - Arguments to update or create a SampleVideo.
     * @example
     * // Update or create a SampleVideo
     * const sampleVideo = await prisma.sampleVideo.upsert({
     *   create: {
     *     // ... data to create a SampleVideo
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SampleVideo we want to update
     *   }
     * })
     */
    upsert<T extends SampleVideoUpsertArgs>(args: SelectSubset<T, SampleVideoUpsertArgs<ExtArgs>>): Prisma__SampleVideoClient<$Result.GetResult<Prisma.$SampleVideoPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SampleVideos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SampleVideoCountArgs} args - Arguments to filter SampleVideos to count.
     * @example
     * // Count the number of SampleVideos
     * const count = await prisma.sampleVideo.count({
     *   where: {
     *     // ... the filter for the SampleVideos we want to count
     *   }
     * })
    **/
    count<T extends SampleVideoCountArgs>(
      args?: Subset<T, SampleVideoCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SampleVideoCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SampleVideo.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SampleVideoAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SampleVideoAggregateArgs>(args: Subset<T, SampleVideoAggregateArgs>): Prisma.PrismaPromise<GetSampleVideoAggregateType<T>>

    /**
     * Group by SampleVideo.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SampleVideoGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SampleVideoGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SampleVideoGroupByArgs['orderBy'] }
        : { orderBy?: SampleVideoGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SampleVideoGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSampleVideoGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SampleVideo model
   */
  readonly fields: SampleVideoFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SampleVideo.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SampleVideoClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SampleVideo model
   */
  interface SampleVideoFieldRefs {
    readonly id: FieldRef<"SampleVideo", 'String'>
    readonly webpageUrl: FieldRef<"SampleVideo", 'String'>
    readonly s3Url: FieldRef<"SampleVideo", 'String'>
    readonly colorPalette: FieldRef<"SampleVideo", 'String'>
    readonly hookEndTimestamp: FieldRef<"SampleVideo", 'String'>
    readonly hookCutConfidence: FieldRef<"SampleVideo", 'String'>
    readonly hookCutUrl: FieldRef<"SampleVideo", 'String'>
    readonly hookInfo: FieldRef<"SampleVideo", 'String'>
    readonly title: FieldRef<"SampleVideo", 'String'>
    readonly description: FieldRef<"SampleVideo", 'String'>
    readonly views: FieldRef<"SampleVideo", 'Int'>
    readonly comments: FieldRef<"SampleVideo", 'Int'>
    readonly likes: FieldRef<"SampleVideo", 'Int'>
    readonly durationSeconds: FieldRef<"SampleVideo", 'Int'>
    readonly createdAt: FieldRef<"SampleVideo", 'DateTime'>
    readonly updatedAt: FieldRef<"SampleVideo", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SampleVideo findUnique
   */
  export type SampleVideoFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SampleVideo
     */
    select?: SampleVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SampleVideo
     */
    omit?: SampleVideoOmit<ExtArgs> | null
    /**
     * Filter, which SampleVideo to fetch.
     */
    where: SampleVideoWhereUniqueInput
  }

  /**
   * SampleVideo findUniqueOrThrow
   */
  export type SampleVideoFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SampleVideo
     */
    select?: SampleVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SampleVideo
     */
    omit?: SampleVideoOmit<ExtArgs> | null
    /**
     * Filter, which SampleVideo to fetch.
     */
    where: SampleVideoWhereUniqueInput
  }

  /**
   * SampleVideo findFirst
   */
  export type SampleVideoFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SampleVideo
     */
    select?: SampleVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SampleVideo
     */
    omit?: SampleVideoOmit<ExtArgs> | null
    /**
     * Filter, which SampleVideo to fetch.
     */
    where?: SampleVideoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SampleVideos to fetch.
     */
    orderBy?: SampleVideoOrderByWithRelationInput | SampleVideoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SampleVideos.
     */
    cursor?: SampleVideoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SampleVideos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SampleVideos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SampleVideos.
     */
    distinct?: SampleVideoScalarFieldEnum | SampleVideoScalarFieldEnum[]
  }

  /**
   * SampleVideo findFirstOrThrow
   */
  export type SampleVideoFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SampleVideo
     */
    select?: SampleVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SampleVideo
     */
    omit?: SampleVideoOmit<ExtArgs> | null
    /**
     * Filter, which SampleVideo to fetch.
     */
    where?: SampleVideoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SampleVideos to fetch.
     */
    orderBy?: SampleVideoOrderByWithRelationInput | SampleVideoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SampleVideos.
     */
    cursor?: SampleVideoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SampleVideos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SampleVideos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SampleVideos.
     */
    distinct?: SampleVideoScalarFieldEnum | SampleVideoScalarFieldEnum[]
  }

  /**
   * SampleVideo findMany
   */
  export type SampleVideoFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SampleVideo
     */
    select?: SampleVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SampleVideo
     */
    omit?: SampleVideoOmit<ExtArgs> | null
    /**
     * Filter, which SampleVideos to fetch.
     */
    where?: SampleVideoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SampleVideos to fetch.
     */
    orderBy?: SampleVideoOrderByWithRelationInput | SampleVideoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SampleVideos.
     */
    cursor?: SampleVideoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SampleVideos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SampleVideos.
     */
    skip?: number
    distinct?: SampleVideoScalarFieldEnum | SampleVideoScalarFieldEnum[]
  }

  /**
   * SampleVideo create
   */
  export type SampleVideoCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SampleVideo
     */
    select?: SampleVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SampleVideo
     */
    omit?: SampleVideoOmit<ExtArgs> | null
    /**
     * The data needed to create a SampleVideo.
     */
    data: XOR<SampleVideoCreateInput, SampleVideoUncheckedCreateInput>
  }

  /**
   * SampleVideo createMany
   */
  export type SampleVideoCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SampleVideos.
     */
    data: SampleVideoCreateManyInput | SampleVideoCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SampleVideo createManyAndReturn
   */
  export type SampleVideoCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SampleVideo
     */
    select?: SampleVideoSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SampleVideo
     */
    omit?: SampleVideoOmit<ExtArgs> | null
    /**
     * The data used to create many SampleVideos.
     */
    data: SampleVideoCreateManyInput | SampleVideoCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SampleVideo update
   */
  export type SampleVideoUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SampleVideo
     */
    select?: SampleVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SampleVideo
     */
    omit?: SampleVideoOmit<ExtArgs> | null
    /**
     * The data needed to update a SampleVideo.
     */
    data: XOR<SampleVideoUpdateInput, SampleVideoUncheckedUpdateInput>
    /**
     * Choose, which SampleVideo to update.
     */
    where: SampleVideoWhereUniqueInput
  }

  /**
   * SampleVideo updateMany
   */
  export type SampleVideoUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SampleVideos.
     */
    data: XOR<SampleVideoUpdateManyMutationInput, SampleVideoUncheckedUpdateManyInput>
    /**
     * Filter which SampleVideos to update
     */
    where?: SampleVideoWhereInput
    /**
     * Limit how many SampleVideos to update.
     */
    limit?: number
  }

  /**
   * SampleVideo updateManyAndReturn
   */
  export type SampleVideoUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SampleVideo
     */
    select?: SampleVideoSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SampleVideo
     */
    omit?: SampleVideoOmit<ExtArgs> | null
    /**
     * The data used to update SampleVideos.
     */
    data: XOR<SampleVideoUpdateManyMutationInput, SampleVideoUncheckedUpdateManyInput>
    /**
     * Filter which SampleVideos to update
     */
    where?: SampleVideoWhereInput
    /**
     * Limit how many SampleVideos to update.
     */
    limit?: number
  }

  /**
   * SampleVideo upsert
   */
  export type SampleVideoUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SampleVideo
     */
    select?: SampleVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SampleVideo
     */
    omit?: SampleVideoOmit<ExtArgs> | null
    /**
     * The filter to search for the SampleVideo to update in case it exists.
     */
    where: SampleVideoWhereUniqueInput
    /**
     * In case the SampleVideo found by the `where` argument doesn't exist, create a new SampleVideo with this data.
     */
    create: XOR<SampleVideoCreateInput, SampleVideoUncheckedCreateInput>
    /**
     * In case the SampleVideo was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SampleVideoUpdateInput, SampleVideoUncheckedUpdateInput>
  }

  /**
   * SampleVideo delete
   */
  export type SampleVideoDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SampleVideo
     */
    select?: SampleVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SampleVideo
     */
    omit?: SampleVideoOmit<ExtArgs> | null
    /**
     * Filter which SampleVideo to delete.
     */
    where: SampleVideoWhereUniqueInput
  }

  /**
   * SampleVideo deleteMany
   */
  export type SampleVideoDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SampleVideos to delete
     */
    where?: SampleVideoWhereInput
    /**
     * Limit how many SampleVideos to delete.
     */
    limit?: number
  }

  /**
   * SampleVideo without action
   */
  export type SampleVideoDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SampleVideo
     */
    select?: SampleVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SampleVideo
     */
    omit?: SampleVideoOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const PostScalarFieldEnum: {
    id: 'id',
    title: 'title',
    content: 'content',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PostScalarFieldEnum = (typeof PostScalarFieldEnum)[keyof typeof PostScalarFieldEnum]


  export const UserScalarFieldEnum: {
    id: 'id',
    firstName: 'firstName',
    lastName: 'lastName',
    username: 'username',
    primaryEmailAddress: 'primaryEmailAddress',
    imageUrl: 'imageUrl',
    clerkUserProperties: 'clerkUserProperties',
    stripeCustomerId: 'stripeCustomerId',
    accessType: 'accessType',
    stripeUserProperties: 'stripeUserProperties',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const DemoVideoScalarFieldEnum: {
    id: 'id',
    s3Url: 's3Url',
    productInfo: 'productInfo',
    colorPalette: 'colorPalette',
    durationSeconds: 'durationSeconds',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type DemoVideoScalarFieldEnum = (typeof DemoVideoScalarFieldEnum)[keyof typeof DemoVideoScalarFieldEnum]


  export const SampleVideoScalarFieldEnum: {
    id: 'id',
    webpageUrl: 'webpageUrl',
    s3Url: 's3Url',
    colorPalette: 'colorPalette',
    hookEndTimestamp: 'hookEndTimestamp',
    hookCutConfidence: 'hookCutConfidence',
    hookCutUrl: 'hookCutUrl',
    hookInfo: 'hookInfo',
    title: 'title',
    description: 'description',
    views: 'views',
    comments: 'comments',
    likes: 'likes',
    durationSeconds: 'durationSeconds',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SampleVideoScalarFieldEnum = (typeof SampleVideoScalarFieldEnum)[keyof typeof SampleVideoScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'AccessType'
   */
  export type EnumAccessTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AccessType'>
    


  /**
   * Reference to a field of type 'AccessType[]'
   */
  export type ListEnumAccessTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AccessType[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type PostWhereInput = {
    AND?: PostWhereInput | PostWhereInput[]
    OR?: PostWhereInput[]
    NOT?: PostWhereInput | PostWhereInput[]
    id?: StringFilter<"Post"> | string
    title?: StringFilter<"Post"> | string
    content?: StringFilter<"Post"> | string
    createdAt?: DateTimeFilter<"Post"> | Date | string
    updatedAt?: DateTimeFilter<"Post"> | Date | string
  }

  export type PostOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PostWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PostWhereInput | PostWhereInput[]
    OR?: PostWhereInput[]
    NOT?: PostWhereInput | PostWhereInput[]
    title?: StringFilter<"Post"> | string
    content?: StringFilter<"Post"> | string
    createdAt?: DateTimeFilter<"Post"> | Date | string
    updatedAt?: DateTimeFilter<"Post"> | Date | string
  }, "id">

  export type PostOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PostCountOrderByAggregateInput
    _max?: PostMaxOrderByAggregateInput
    _min?: PostMinOrderByAggregateInput
  }

  export type PostScalarWhereWithAggregatesInput = {
    AND?: PostScalarWhereWithAggregatesInput | PostScalarWhereWithAggregatesInput[]
    OR?: PostScalarWhereWithAggregatesInput[]
    NOT?: PostScalarWhereWithAggregatesInput | PostScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Post"> | string
    title?: StringWithAggregatesFilter<"Post"> | string
    content?: StringWithAggregatesFilter<"Post"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Post"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Post"> | Date | string
  }

  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    firstName?: StringNullableFilter<"User"> | string | null
    lastName?: StringNullableFilter<"User"> | string | null
    username?: StringNullableFilter<"User"> | string | null
    primaryEmailAddress?: StringNullableFilter<"User"> | string | null
    imageUrl?: StringNullableFilter<"User"> | string | null
    clerkUserProperties?: JsonNullableFilter<"User">
    stripeCustomerId?: StringNullableFilter<"User"> | string | null
    accessType?: EnumAccessTypeFilter<"User"> | $Enums.AccessType
    stripeUserProperties?: JsonNullableFilter<"User">
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    firstName?: SortOrderInput | SortOrder
    lastName?: SortOrderInput | SortOrder
    username?: SortOrderInput | SortOrder
    primaryEmailAddress?: SortOrderInput | SortOrder
    imageUrl?: SortOrderInput | SortOrder
    clerkUserProperties?: SortOrderInput | SortOrder
    stripeCustomerId?: SortOrderInput | SortOrder
    accessType?: SortOrder
    stripeUserProperties?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    username?: string
    primaryEmailAddress?: string
    stripeCustomerId?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    firstName?: StringNullableFilter<"User"> | string | null
    lastName?: StringNullableFilter<"User"> | string | null
    imageUrl?: StringNullableFilter<"User"> | string | null
    clerkUserProperties?: JsonNullableFilter<"User">
    accessType?: EnumAccessTypeFilter<"User"> | $Enums.AccessType
    stripeUserProperties?: JsonNullableFilter<"User">
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
  }, "id" | "username" | "primaryEmailAddress" | "stripeCustomerId">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    firstName?: SortOrderInput | SortOrder
    lastName?: SortOrderInput | SortOrder
    username?: SortOrderInput | SortOrder
    primaryEmailAddress?: SortOrderInput | SortOrder
    imageUrl?: SortOrderInput | SortOrder
    clerkUserProperties?: SortOrderInput | SortOrder
    stripeCustomerId?: SortOrderInput | SortOrder
    accessType?: SortOrder
    stripeUserProperties?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    firstName?: StringNullableWithAggregatesFilter<"User"> | string | null
    lastName?: StringNullableWithAggregatesFilter<"User"> | string | null
    username?: StringNullableWithAggregatesFilter<"User"> | string | null
    primaryEmailAddress?: StringNullableWithAggregatesFilter<"User"> | string | null
    imageUrl?: StringNullableWithAggregatesFilter<"User"> | string | null
    clerkUserProperties?: JsonNullableWithAggregatesFilter<"User">
    stripeCustomerId?: StringNullableWithAggregatesFilter<"User"> | string | null
    accessType?: EnumAccessTypeWithAggregatesFilter<"User"> | $Enums.AccessType
    stripeUserProperties?: JsonNullableWithAggregatesFilter<"User">
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type DemoVideoWhereInput = {
    AND?: DemoVideoWhereInput | DemoVideoWhereInput[]
    OR?: DemoVideoWhereInput[]
    NOT?: DemoVideoWhereInput | DemoVideoWhereInput[]
    id?: StringFilter<"DemoVideo"> | string
    s3Url?: StringFilter<"DemoVideo"> | string
    productInfo?: StringNullableFilter<"DemoVideo"> | string | null
    colorPalette?: StringFilter<"DemoVideo"> | string
    durationSeconds?: IntFilter<"DemoVideo"> | number
    createdAt?: DateTimeFilter<"DemoVideo"> | Date | string
    updatedAt?: DateTimeFilter<"DemoVideo"> | Date | string
  }

  export type DemoVideoOrderByWithRelationInput = {
    id?: SortOrder
    s3Url?: SortOrder
    productInfo?: SortOrderInput | SortOrder
    colorPalette?: SortOrder
    durationSeconds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DemoVideoWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: DemoVideoWhereInput | DemoVideoWhereInput[]
    OR?: DemoVideoWhereInput[]
    NOT?: DemoVideoWhereInput | DemoVideoWhereInput[]
    s3Url?: StringFilter<"DemoVideo"> | string
    productInfo?: StringNullableFilter<"DemoVideo"> | string | null
    colorPalette?: StringFilter<"DemoVideo"> | string
    durationSeconds?: IntFilter<"DemoVideo"> | number
    createdAt?: DateTimeFilter<"DemoVideo"> | Date | string
    updatedAt?: DateTimeFilter<"DemoVideo"> | Date | string
  }, "id">

  export type DemoVideoOrderByWithAggregationInput = {
    id?: SortOrder
    s3Url?: SortOrder
    productInfo?: SortOrderInput | SortOrder
    colorPalette?: SortOrder
    durationSeconds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: DemoVideoCountOrderByAggregateInput
    _avg?: DemoVideoAvgOrderByAggregateInput
    _max?: DemoVideoMaxOrderByAggregateInput
    _min?: DemoVideoMinOrderByAggregateInput
    _sum?: DemoVideoSumOrderByAggregateInput
  }

  export type DemoVideoScalarWhereWithAggregatesInput = {
    AND?: DemoVideoScalarWhereWithAggregatesInput | DemoVideoScalarWhereWithAggregatesInput[]
    OR?: DemoVideoScalarWhereWithAggregatesInput[]
    NOT?: DemoVideoScalarWhereWithAggregatesInput | DemoVideoScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"DemoVideo"> | string
    s3Url?: StringWithAggregatesFilter<"DemoVideo"> | string
    productInfo?: StringNullableWithAggregatesFilter<"DemoVideo"> | string | null
    colorPalette?: StringWithAggregatesFilter<"DemoVideo"> | string
    durationSeconds?: IntWithAggregatesFilter<"DemoVideo"> | number
    createdAt?: DateTimeWithAggregatesFilter<"DemoVideo"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"DemoVideo"> | Date | string
  }

  export type SampleVideoWhereInput = {
    AND?: SampleVideoWhereInput | SampleVideoWhereInput[]
    OR?: SampleVideoWhereInput[]
    NOT?: SampleVideoWhereInput | SampleVideoWhereInput[]
    id?: StringFilter<"SampleVideo"> | string
    webpageUrl?: StringFilter<"SampleVideo"> | string
    s3Url?: StringFilter<"SampleVideo"> | string
    colorPalette?: StringNullableFilter<"SampleVideo"> | string | null
    hookEndTimestamp?: StringFilter<"SampleVideo"> | string
    hookCutConfidence?: StringNullableFilter<"SampleVideo"> | string | null
    hookCutUrl?: StringNullableFilter<"SampleVideo"> | string | null
    hookInfo?: StringNullableFilter<"SampleVideo"> | string | null
    title?: StringFilter<"SampleVideo"> | string
    description?: StringNullableFilter<"SampleVideo"> | string | null
    views?: IntFilter<"SampleVideo"> | number
    comments?: IntFilter<"SampleVideo"> | number
    likes?: IntFilter<"SampleVideo"> | number
    durationSeconds?: IntFilter<"SampleVideo"> | number
    createdAt?: DateTimeFilter<"SampleVideo"> | Date | string
    updatedAt?: DateTimeFilter<"SampleVideo"> | Date | string
  }

  export type SampleVideoOrderByWithRelationInput = {
    id?: SortOrder
    webpageUrl?: SortOrder
    s3Url?: SortOrder
    colorPalette?: SortOrderInput | SortOrder
    hookEndTimestamp?: SortOrder
    hookCutConfidence?: SortOrderInput | SortOrder
    hookCutUrl?: SortOrderInput | SortOrder
    hookInfo?: SortOrderInput | SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    views?: SortOrder
    comments?: SortOrder
    likes?: SortOrder
    durationSeconds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SampleVideoWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    webpageUrl?: string
    AND?: SampleVideoWhereInput | SampleVideoWhereInput[]
    OR?: SampleVideoWhereInput[]
    NOT?: SampleVideoWhereInput | SampleVideoWhereInput[]
    s3Url?: StringFilter<"SampleVideo"> | string
    colorPalette?: StringNullableFilter<"SampleVideo"> | string | null
    hookEndTimestamp?: StringFilter<"SampleVideo"> | string
    hookCutConfidence?: StringNullableFilter<"SampleVideo"> | string | null
    hookCutUrl?: StringNullableFilter<"SampleVideo"> | string | null
    hookInfo?: StringNullableFilter<"SampleVideo"> | string | null
    title?: StringFilter<"SampleVideo"> | string
    description?: StringNullableFilter<"SampleVideo"> | string | null
    views?: IntFilter<"SampleVideo"> | number
    comments?: IntFilter<"SampleVideo"> | number
    likes?: IntFilter<"SampleVideo"> | number
    durationSeconds?: IntFilter<"SampleVideo"> | number
    createdAt?: DateTimeFilter<"SampleVideo"> | Date | string
    updatedAt?: DateTimeFilter<"SampleVideo"> | Date | string
  }, "id" | "webpageUrl">

  export type SampleVideoOrderByWithAggregationInput = {
    id?: SortOrder
    webpageUrl?: SortOrder
    s3Url?: SortOrder
    colorPalette?: SortOrderInput | SortOrder
    hookEndTimestamp?: SortOrder
    hookCutConfidence?: SortOrderInput | SortOrder
    hookCutUrl?: SortOrderInput | SortOrder
    hookInfo?: SortOrderInput | SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    views?: SortOrder
    comments?: SortOrder
    likes?: SortOrder
    durationSeconds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SampleVideoCountOrderByAggregateInput
    _avg?: SampleVideoAvgOrderByAggregateInput
    _max?: SampleVideoMaxOrderByAggregateInput
    _min?: SampleVideoMinOrderByAggregateInput
    _sum?: SampleVideoSumOrderByAggregateInput
  }

  export type SampleVideoScalarWhereWithAggregatesInput = {
    AND?: SampleVideoScalarWhereWithAggregatesInput | SampleVideoScalarWhereWithAggregatesInput[]
    OR?: SampleVideoScalarWhereWithAggregatesInput[]
    NOT?: SampleVideoScalarWhereWithAggregatesInput | SampleVideoScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SampleVideo"> | string
    webpageUrl?: StringWithAggregatesFilter<"SampleVideo"> | string
    s3Url?: StringWithAggregatesFilter<"SampleVideo"> | string
    colorPalette?: StringNullableWithAggregatesFilter<"SampleVideo"> | string | null
    hookEndTimestamp?: StringWithAggregatesFilter<"SampleVideo"> | string
    hookCutConfidence?: StringNullableWithAggregatesFilter<"SampleVideo"> | string | null
    hookCutUrl?: StringNullableWithAggregatesFilter<"SampleVideo"> | string | null
    hookInfo?: StringNullableWithAggregatesFilter<"SampleVideo"> | string | null
    title?: StringWithAggregatesFilter<"SampleVideo"> | string
    description?: StringNullableWithAggregatesFilter<"SampleVideo"> | string | null
    views?: IntWithAggregatesFilter<"SampleVideo"> | number
    comments?: IntWithAggregatesFilter<"SampleVideo"> | number
    likes?: IntWithAggregatesFilter<"SampleVideo"> | number
    durationSeconds?: IntWithAggregatesFilter<"SampleVideo"> | number
    createdAt?: DateTimeWithAggregatesFilter<"SampleVideo"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SampleVideo"> | Date | string
  }

  export type PostCreateInput = {
    id?: string
    title: string
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PostUncheckedCreateInput = {
    id?: string
    title: string
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PostUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostCreateManyInput = {
    id?: string
    title: string
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PostUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateInput = {
    id: string
    firstName?: string | null
    lastName?: string | null
    username?: string | null
    primaryEmailAddress?: string | null
    imageUrl?: string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: string | null
    accessType?: $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUncheckedCreateInput = {
    id: string
    firstName?: string | null
    lastName?: string | null
    username?: string | null
    primaryEmailAddress?: string | null
    imageUrl?: string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: string | null
    accessType?: $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    username?: NullableStringFieldUpdateOperationsInput | string | null
    primaryEmailAddress?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: NullableStringFieldUpdateOperationsInput | string | null
    accessType?: EnumAccessTypeFieldUpdateOperationsInput | $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    username?: NullableStringFieldUpdateOperationsInput | string | null
    primaryEmailAddress?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: NullableStringFieldUpdateOperationsInput | string | null
    accessType?: EnumAccessTypeFieldUpdateOperationsInput | $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateManyInput = {
    id: string
    firstName?: string | null
    lastName?: string | null
    username?: string | null
    primaryEmailAddress?: string | null
    imageUrl?: string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: string | null
    accessType?: $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    username?: NullableStringFieldUpdateOperationsInput | string | null
    primaryEmailAddress?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: NullableStringFieldUpdateOperationsInput | string | null
    accessType?: EnumAccessTypeFieldUpdateOperationsInput | $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    username?: NullableStringFieldUpdateOperationsInput | string | null
    primaryEmailAddress?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: NullableStringFieldUpdateOperationsInput | string | null
    accessType?: EnumAccessTypeFieldUpdateOperationsInput | $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DemoVideoCreateInput = {
    id?: string
    s3Url: string
    productInfo?: string | null
    colorPalette: string
    durationSeconds: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DemoVideoUncheckedCreateInput = {
    id?: string
    s3Url: string
    productInfo?: string | null
    colorPalette: string
    durationSeconds: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DemoVideoUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    productInfo?: NullableStringFieldUpdateOperationsInput | string | null
    colorPalette?: StringFieldUpdateOperationsInput | string
    durationSeconds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DemoVideoUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    productInfo?: NullableStringFieldUpdateOperationsInput | string | null
    colorPalette?: StringFieldUpdateOperationsInput | string
    durationSeconds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DemoVideoCreateManyInput = {
    id?: string
    s3Url: string
    productInfo?: string | null
    colorPalette: string
    durationSeconds: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DemoVideoUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    productInfo?: NullableStringFieldUpdateOperationsInput | string | null
    colorPalette?: StringFieldUpdateOperationsInput | string
    durationSeconds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DemoVideoUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    productInfo?: NullableStringFieldUpdateOperationsInput | string | null
    colorPalette?: StringFieldUpdateOperationsInput | string
    durationSeconds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SampleVideoCreateInput = {
    id?: string
    webpageUrl: string
    s3Url: string
    colorPalette?: string | null
    hookEndTimestamp: string
    hookCutConfidence?: string | null
    hookCutUrl?: string | null
    hookInfo?: string | null
    title: string
    description?: string | null
    views?: number
    comments?: number
    likes?: number
    durationSeconds: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SampleVideoUncheckedCreateInput = {
    id?: string
    webpageUrl: string
    s3Url: string
    colorPalette?: string | null
    hookEndTimestamp: string
    hookCutConfidence?: string | null
    hookCutUrl?: string | null
    hookInfo?: string | null
    title: string
    description?: string | null
    views?: number
    comments?: number
    likes?: number
    durationSeconds: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SampleVideoUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    webpageUrl?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    colorPalette?: NullableStringFieldUpdateOperationsInput | string | null
    hookEndTimestamp?: StringFieldUpdateOperationsInput | string
    hookCutConfidence?: NullableStringFieldUpdateOperationsInput | string | null
    hookCutUrl?: NullableStringFieldUpdateOperationsInput | string | null
    hookInfo?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    views?: IntFieldUpdateOperationsInput | number
    comments?: IntFieldUpdateOperationsInput | number
    likes?: IntFieldUpdateOperationsInput | number
    durationSeconds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SampleVideoUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    webpageUrl?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    colorPalette?: NullableStringFieldUpdateOperationsInput | string | null
    hookEndTimestamp?: StringFieldUpdateOperationsInput | string
    hookCutConfidence?: NullableStringFieldUpdateOperationsInput | string | null
    hookCutUrl?: NullableStringFieldUpdateOperationsInput | string | null
    hookInfo?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    views?: IntFieldUpdateOperationsInput | number
    comments?: IntFieldUpdateOperationsInput | number
    likes?: IntFieldUpdateOperationsInput | number
    durationSeconds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SampleVideoCreateManyInput = {
    id?: string
    webpageUrl: string
    s3Url: string
    colorPalette?: string | null
    hookEndTimestamp: string
    hookCutConfidence?: string | null
    hookCutUrl?: string | null
    hookInfo?: string | null
    title: string
    description?: string | null
    views?: number
    comments?: number
    likes?: number
    durationSeconds: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SampleVideoUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    webpageUrl?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    colorPalette?: NullableStringFieldUpdateOperationsInput | string | null
    hookEndTimestamp?: StringFieldUpdateOperationsInput | string
    hookCutConfidence?: NullableStringFieldUpdateOperationsInput | string | null
    hookCutUrl?: NullableStringFieldUpdateOperationsInput | string | null
    hookInfo?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    views?: IntFieldUpdateOperationsInput | number
    comments?: IntFieldUpdateOperationsInput | number
    likes?: IntFieldUpdateOperationsInput | number
    durationSeconds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SampleVideoUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    webpageUrl?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    colorPalette?: NullableStringFieldUpdateOperationsInput | string | null
    hookEndTimestamp?: StringFieldUpdateOperationsInput | string
    hookCutConfidence?: NullableStringFieldUpdateOperationsInput | string | null
    hookCutUrl?: NullableStringFieldUpdateOperationsInput | string | null
    hookInfo?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    views?: IntFieldUpdateOperationsInput | number
    comments?: IntFieldUpdateOperationsInput | number
    likes?: IntFieldUpdateOperationsInput | number
    durationSeconds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type PostCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PostMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PostMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type EnumAccessTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.AccessType | EnumAccessTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AccessType[] | ListEnumAccessTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AccessType[] | ListEnumAccessTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAccessTypeFilter<$PrismaModel> | $Enums.AccessType
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    username?: SortOrder
    primaryEmailAddress?: SortOrder
    imageUrl?: SortOrder
    clerkUserProperties?: SortOrder
    stripeCustomerId?: SortOrder
    accessType?: SortOrder
    stripeUserProperties?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    username?: SortOrder
    primaryEmailAddress?: SortOrder
    imageUrl?: SortOrder
    stripeCustomerId?: SortOrder
    accessType?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    username?: SortOrder
    primaryEmailAddress?: SortOrder
    imageUrl?: SortOrder
    stripeCustomerId?: SortOrder
    accessType?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type EnumAccessTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AccessType | EnumAccessTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AccessType[] | ListEnumAccessTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AccessType[] | ListEnumAccessTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAccessTypeWithAggregatesFilter<$PrismaModel> | $Enums.AccessType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAccessTypeFilter<$PrismaModel>
    _max?: NestedEnumAccessTypeFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DemoVideoCountOrderByAggregateInput = {
    id?: SortOrder
    s3Url?: SortOrder
    productInfo?: SortOrder
    colorPalette?: SortOrder
    durationSeconds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DemoVideoAvgOrderByAggregateInput = {
    durationSeconds?: SortOrder
  }

  export type DemoVideoMaxOrderByAggregateInput = {
    id?: SortOrder
    s3Url?: SortOrder
    productInfo?: SortOrder
    colorPalette?: SortOrder
    durationSeconds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DemoVideoMinOrderByAggregateInput = {
    id?: SortOrder
    s3Url?: SortOrder
    productInfo?: SortOrder
    colorPalette?: SortOrder
    durationSeconds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DemoVideoSumOrderByAggregateInput = {
    durationSeconds?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type SampleVideoCountOrderByAggregateInput = {
    id?: SortOrder
    webpageUrl?: SortOrder
    s3Url?: SortOrder
    colorPalette?: SortOrder
    hookEndTimestamp?: SortOrder
    hookCutConfidence?: SortOrder
    hookCutUrl?: SortOrder
    hookInfo?: SortOrder
    title?: SortOrder
    description?: SortOrder
    views?: SortOrder
    comments?: SortOrder
    likes?: SortOrder
    durationSeconds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SampleVideoAvgOrderByAggregateInput = {
    views?: SortOrder
    comments?: SortOrder
    likes?: SortOrder
    durationSeconds?: SortOrder
  }

  export type SampleVideoMaxOrderByAggregateInput = {
    id?: SortOrder
    webpageUrl?: SortOrder
    s3Url?: SortOrder
    colorPalette?: SortOrder
    hookEndTimestamp?: SortOrder
    hookCutConfidence?: SortOrder
    hookCutUrl?: SortOrder
    hookInfo?: SortOrder
    title?: SortOrder
    description?: SortOrder
    views?: SortOrder
    comments?: SortOrder
    likes?: SortOrder
    durationSeconds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SampleVideoMinOrderByAggregateInput = {
    id?: SortOrder
    webpageUrl?: SortOrder
    s3Url?: SortOrder
    colorPalette?: SortOrder
    hookEndTimestamp?: SortOrder
    hookCutConfidence?: SortOrder
    hookCutUrl?: SortOrder
    hookInfo?: SortOrder
    title?: SortOrder
    description?: SortOrder
    views?: SortOrder
    comments?: SortOrder
    likes?: SortOrder
    durationSeconds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SampleVideoSumOrderByAggregateInput = {
    views?: SortOrder
    comments?: SortOrder
    likes?: SortOrder
    durationSeconds?: SortOrder
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumAccessTypeFieldUpdateOperationsInput = {
    set?: $Enums.AccessType
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumAccessTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.AccessType | EnumAccessTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AccessType[] | ListEnumAccessTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AccessType[] | ListEnumAccessTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAccessTypeFilter<$PrismaModel> | $Enums.AccessType
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedEnumAccessTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AccessType | EnumAccessTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AccessType[] | ListEnumAccessTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AccessType[] | ListEnumAccessTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAccessTypeWithAggregatesFilter<$PrismaModel> | $Enums.AccessType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAccessTypeFilter<$PrismaModel>
    _max?: NestedEnumAccessTypeFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}
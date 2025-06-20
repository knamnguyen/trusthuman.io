
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
 * Model ShortDemo
 * 
 */
export type ShortDemo = $Result.DefaultSelection<Prisma.$ShortDemoPayload>
/**
 * Model HookViralVideo
 * 
 */
export type HookViralVideo = $Result.DefaultSelection<Prisma.$HookViralVideoPayload>

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
   * `prisma.shortDemo`: Exposes CRUD operations for the **ShortDemo** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ShortDemos
    * const shortDemos = await prisma.shortDemo.findMany()
    * ```
    */
  get shortDemo(): Prisma.ShortDemoDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.hookViralVideo`: Exposes CRUD operations for the **HookViralVideo** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more HookViralVideos
    * const hookViralVideos = await prisma.hookViralVideo.findMany()
    * ```
    */
  get hookViralVideo(): Prisma.HookViralVideoDelegate<ExtArgs, ClientOptions>;
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
    ShortDemo: 'ShortDemo',
    HookViralVideo: 'HookViralVideo'
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
      modelProps: "post" | "user" | "demoVideo" | "shortDemo" | "hookViralVideo"
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
      ShortDemo: {
        payload: Prisma.$ShortDemoPayload<ExtArgs>
        fields: Prisma.ShortDemoFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ShortDemoFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortDemoPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ShortDemoFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortDemoPayload>
          }
          findFirst: {
            args: Prisma.ShortDemoFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortDemoPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ShortDemoFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortDemoPayload>
          }
          findMany: {
            args: Prisma.ShortDemoFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortDemoPayload>[]
          }
          create: {
            args: Prisma.ShortDemoCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortDemoPayload>
          }
          createMany: {
            args: Prisma.ShortDemoCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ShortDemoCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortDemoPayload>[]
          }
          delete: {
            args: Prisma.ShortDemoDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortDemoPayload>
          }
          update: {
            args: Prisma.ShortDemoUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortDemoPayload>
          }
          deleteMany: {
            args: Prisma.ShortDemoDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ShortDemoUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ShortDemoUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortDemoPayload>[]
          }
          upsert: {
            args: Prisma.ShortDemoUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortDemoPayload>
          }
          aggregate: {
            args: Prisma.ShortDemoAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateShortDemo>
          }
          groupBy: {
            args: Prisma.ShortDemoGroupByArgs<ExtArgs>
            result: $Utils.Optional<ShortDemoGroupByOutputType>[]
          }
          count: {
            args: Prisma.ShortDemoCountArgs<ExtArgs>
            result: $Utils.Optional<ShortDemoCountAggregateOutputType> | number
          }
        }
      }
      HookViralVideo: {
        payload: Prisma.$HookViralVideoPayload<ExtArgs>
        fields: Prisma.HookViralVideoFieldRefs
        operations: {
          findUnique: {
            args: Prisma.HookViralVideoFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HookViralVideoPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.HookViralVideoFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HookViralVideoPayload>
          }
          findFirst: {
            args: Prisma.HookViralVideoFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HookViralVideoPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.HookViralVideoFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HookViralVideoPayload>
          }
          findMany: {
            args: Prisma.HookViralVideoFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HookViralVideoPayload>[]
          }
          create: {
            args: Prisma.HookViralVideoCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HookViralVideoPayload>
          }
          createMany: {
            args: Prisma.HookViralVideoCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.HookViralVideoCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HookViralVideoPayload>[]
          }
          delete: {
            args: Prisma.HookViralVideoDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HookViralVideoPayload>
          }
          update: {
            args: Prisma.HookViralVideoUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HookViralVideoPayload>
          }
          deleteMany: {
            args: Prisma.HookViralVideoDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.HookViralVideoUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.HookViralVideoUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HookViralVideoPayload>[]
          }
          upsert: {
            args: Prisma.HookViralVideoUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HookViralVideoPayload>
          }
          aggregate: {
            args: Prisma.HookViralVideoAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateHookViralVideo>
          }
          groupBy: {
            args: Prisma.HookViralVideoGroupByArgs<ExtArgs>
            result: $Utils.Optional<HookViralVideoGroupByOutputType>[]
          }
          count: {
            args: Prisma.HookViralVideoCountArgs<ExtArgs>
            result: $Utils.Optional<HookViralVideoCountAggregateOutputType> | number
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
    shortDemo?: ShortDemoOmit
    hookViralVideo?: HookViralVideoOmit
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
   * Count Type DemoVideoCountOutputType
   */

  export type DemoVideoCountOutputType = {
    shortDemos: number
  }

  export type DemoVideoCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shortDemos?: boolean | DemoVideoCountOutputTypeCountShortDemosArgs
  }

  // Custom InputTypes
  /**
   * DemoVideoCountOutputType without action
   */
  export type DemoVideoCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DemoVideoCountOutputType
     */
    select?: DemoVideoCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * DemoVideoCountOutputType without action
   */
  export type DemoVideoCountOutputTypeCountShortDemosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ShortDemoWhereInput
  }


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
    durationSeconds: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DemoVideoMaxAggregateOutputType = {
    id: string | null
    s3Url: string | null
    productInfo: string | null
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
    durationSeconds?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DemoVideoMaxAggregateInputType = {
    id?: true
    s3Url?: true
    productInfo?: true
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
    colorPalette: JsonValue | null
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
    shortDemos?: boolean | DemoVideo$shortDemosArgs<ExtArgs>
    _count?: boolean | DemoVideoCountOutputTypeDefaultArgs<ExtArgs>
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
  export type DemoVideoInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shortDemos?: boolean | DemoVideo$shortDemosArgs<ExtArgs>
    _count?: boolean | DemoVideoCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type DemoVideoIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type DemoVideoIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $DemoVideoPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "DemoVideo"
    objects: {
      shortDemos: Prisma.$ShortDemoPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      s3Url: string
      productInfo: string | null
      colorPalette: Prisma.JsonValue | null
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
    shortDemos<T extends DemoVideo$shortDemosArgs<ExtArgs> = {}>(args?: Subset<T, DemoVideo$shortDemosArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ShortDemoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
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
    readonly colorPalette: FieldRef<"DemoVideo", 'Json'>
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
     * Choose, which related nodes to fetch as well
     */
    include?: DemoVideoInclude<ExtArgs> | null
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
     * Choose, which related nodes to fetch as well
     */
    include?: DemoVideoInclude<ExtArgs> | null
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
     * Choose, which related nodes to fetch as well
     */
    include?: DemoVideoInclude<ExtArgs> | null
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
     * Choose, which related nodes to fetch as well
     */
    include?: DemoVideoInclude<ExtArgs> | null
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
     * Choose, which related nodes to fetch as well
     */
    include?: DemoVideoInclude<ExtArgs> | null
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
     * Choose, which related nodes to fetch as well
     */
    include?: DemoVideoInclude<ExtArgs> | null
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
     * Choose, which related nodes to fetch as well
     */
    include?: DemoVideoInclude<ExtArgs> | null
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
     * Choose, which related nodes to fetch as well
     */
    include?: DemoVideoInclude<ExtArgs> | null
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
     * Choose, which related nodes to fetch as well
     */
    include?: DemoVideoInclude<ExtArgs> | null
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
   * DemoVideo.shortDemos
   */
  export type DemoVideo$shortDemosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortDemo
     */
    select?: ShortDemoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortDemo
     */
    omit?: ShortDemoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortDemoInclude<ExtArgs> | null
    where?: ShortDemoWhereInput
    orderBy?: ShortDemoOrderByWithRelationInput | ShortDemoOrderByWithRelationInput[]
    cursor?: ShortDemoWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ShortDemoScalarFieldEnum | ShortDemoScalarFieldEnum[]
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
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DemoVideoInclude<ExtArgs> | null
  }


  /**
   * Model ShortDemo
   */

  export type AggregateShortDemo = {
    _count: ShortDemoCountAggregateOutputType | null
    _avg: ShortDemoAvgAggregateOutputType | null
    _sum: ShortDemoSumAggregateOutputType | null
    _min: ShortDemoMinAggregateOutputType | null
    _max: ShortDemoMaxAggregateOutputType | null
  }

  export type ShortDemoAvgAggregateOutputType = {
    durationSeconds: number | null
  }

  export type ShortDemoSumAggregateOutputType = {
    durationSeconds: number | null
  }

  export type ShortDemoMinAggregateOutputType = {
    id: string | null
    demoVideoId: string | null
    s3Url: string | null
    durationSeconds: number | null
    colorPalette: string | null
    shortDemoInfo: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ShortDemoMaxAggregateOutputType = {
    id: string | null
    demoVideoId: string | null
    s3Url: string | null
    durationSeconds: number | null
    colorPalette: string | null
    shortDemoInfo: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ShortDemoCountAggregateOutputType = {
    id: number
    demoVideoId: number
    s3Url: number
    durationSeconds: number
    colorPalette: number
    shortDemoInfo: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ShortDemoAvgAggregateInputType = {
    durationSeconds?: true
  }

  export type ShortDemoSumAggregateInputType = {
    durationSeconds?: true
  }

  export type ShortDemoMinAggregateInputType = {
    id?: true
    demoVideoId?: true
    s3Url?: true
    durationSeconds?: true
    colorPalette?: true
    shortDemoInfo?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ShortDemoMaxAggregateInputType = {
    id?: true
    demoVideoId?: true
    s3Url?: true
    durationSeconds?: true
    colorPalette?: true
    shortDemoInfo?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ShortDemoCountAggregateInputType = {
    id?: true
    demoVideoId?: true
    s3Url?: true
    durationSeconds?: true
    colorPalette?: true
    shortDemoInfo?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ShortDemoAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ShortDemo to aggregate.
     */
    where?: ShortDemoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ShortDemos to fetch.
     */
    orderBy?: ShortDemoOrderByWithRelationInput | ShortDemoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ShortDemoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ShortDemos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ShortDemos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ShortDemos
    **/
    _count?: true | ShortDemoCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ShortDemoAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ShortDemoSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ShortDemoMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ShortDemoMaxAggregateInputType
  }

  export type GetShortDemoAggregateType<T extends ShortDemoAggregateArgs> = {
        [P in keyof T & keyof AggregateShortDemo]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateShortDemo[P]>
      : GetScalarType<T[P], AggregateShortDemo[P]>
  }




  export type ShortDemoGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ShortDemoWhereInput
    orderBy?: ShortDemoOrderByWithAggregationInput | ShortDemoOrderByWithAggregationInput[]
    by: ShortDemoScalarFieldEnum[] | ShortDemoScalarFieldEnum
    having?: ShortDemoScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ShortDemoCountAggregateInputType | true
    _avg?: ShortDemoAvgAggregateInputType
    _sum?: ShortDemoSumAggregateInputType
    _min?: ShortDemoMinAggregateInputType
    _max?: ShortDemoMaxAggregateInputType
  }

  export type ShortDemoGroupByOutputType = {
    id: string
    demoVideoId: string
    s3Url: string
    durationSeconds: number
    colorPalette: string | null
    shortDemoInfo: string | null
    createdAt: Date
    updatedAt: Date
    _count: ShortDemoCountAggregateOutputType | null
    _avg: ShortDemoAvgAggregateOutputType | null
    _sum: ShortDemoSumAggregateOutputType | null
    _min: ShortDemoMinAggregateOutputType | null
    _max: ShortDemoMaxAggregateOutputType | null
  }

  type GetShortDemoGroupByPayload<T extends ShortDemoGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ShortDemoGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ShortDemoGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ShortDemoGroupByOutputType[P]>
            : GetScalarType<T[P], ShortDemoGroupByOutputType[P]>
        }
      >
    >


  export type ShortDemoSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    demoVideoId?: boolean
    s3Url?: boolean
    durationSeconds?: boolean
    colorPalette?: boolean
    shortDemoInfo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    demoVideo?: boolean | DemoVideoDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["shortDemo"]>

  export type ShortDemoSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    demoVideoId?: boolean
    s3Url?: boolean
    durationSeconds?: boolean
    colorPalette?: boolean
    shortDemoInfo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    demoVideo?: boolean | DemoVideoDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["shortDemo"]>

  export type ShortDemoSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    demoVideoId?: boolean
    s3Url?: boolean
    durationSeconds?: boolean
    colorPalette?: boolean
    shortDemoInfo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    demoVideo?: boolean | DemoVideoDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["shortDemo"]>

  export type ShortDemoSelectScalar = {
    id?: boolean
    demoVideoId?: boolean
    s3Url?: boolean
    durationSeconds?: boolean
    colorPalette?: boolean
    shortDemoInfo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ShortDemoOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "demoVideoId" | "s3Url" | "durationSeconds" | "colorPalette" | "shortDemoInfo" | "createdAt" | "updatedAt", ExtArgs["result"]["shortDemo"]>
  export type ShortDemoInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    demoVideo?: boolean | DemoVideoDefaultArgs<ExtArgs>
  }
  export type ShortDemoIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    demoVideo?: boolean | DemoVideoDefaultArgs<ExtArgs>
  }
  export type ShortDemoIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    demoVideo?: boolean | DemoVideoDefaultArgs<ExtArgs>
  }

  export type $ShortDemoPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ShortDemo"
    objects: {
      demoVideo: Prisma.$DemoVideoPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      demoVideoId: string
      s3Url: string
      durationSeconds: number
      colorPalette: string | null
      shortDemoInfo: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["shortDemo"]>
    composites: {}
  }

  type ShortDemoGetPayload<S extends boolean | null | undefined | ShortDemoDefaultArgs> = $Result.GetResult<Prisma.$ShortDemoPayload, S>

  type ShortDemoCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ShortDemoFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ShortDemoCountAggregateInputType | true
    }

  export interface ShortDemoDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ShortDemo'], meta: { name: 'ShortDemo' } }
    /**
     * Find zero or one ShortDemo that matches the filter.
     * @param {ShortDemoFindUniqueArgs} args - Arguments to find a ShortDemo
     * @example
     * // Get one ShortDemo
     * const shortDemo = await prisma.shortDemo.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ShortDemoFindUniqueArgs>(args: SelectSubset<T, ShortDemoFindUniqueArgs<ExtArgs>>): Prisma__ShortDemoClient<$Result.GetResult<Prisma.$ShortDemoPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ShortDemo that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ShortDemoFindUniqueOrThrowArgs} args - Arguments to find a ShortDemo
     * @example
     * // Get one ShortDemo
     * const shortDemo = await prisma.shortDemo.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ShortDemoFindUniqueOrThrowArgs>(args: SelectSubset<T, ShortDemoFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ShortDemoClient<$Result.GetResult<Prisma.$ShortDemoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ShortDemo that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortDemoFindFirstArgs} args - Arguments to find a ShortDemo
     * @example
     * // Get one ShortDemo
     * const shortDemo = await prisma.shortDemo.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ShortDemoFindFirstArgs>(args?: SelectSubset<T, ShortDemoFindFirstArgs<ExtArgs>>): Prisma__ShortDemoClient<$Result.GetResult<Prisma.$ShortDemoPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ShortDemo that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortDemoFindFirstOrThrowArgs} args - Arguments to find a ShortDemo
     * @example
     * // Get one ShortDemo
     * const shortDemo = await prisma.shortDemo.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ShortDemoFindFirstOrThrowArgs>(args?: SelectSubset<T, ShortDemoFindFirstOrThrowArgs<ExtArgs>>): Prisma__ShortDemoClient<$Result.GetResult<Prisma.$ShortDemoPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ShortDemos that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortDemoFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ShortDemos
     * const shortDemos = await prisma.shortDemo.findMany()
     * 
     * // Get first 10 ShortDemos
     * const shortDemos = await prisma.shortDemo.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const shortDemoWithIdOnly = await prisma.shortDemo.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ShortDemoFindManyArgs>(args?: SelectSubset<T, ShortDemoFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ShortDemoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ShortDemo.
     * @param {ShortDemoCreateArgs} args - Arguments to create a ShortDemo.
     * @example
     * // Create one ShortDemo
     * const ShortDemo = await prisma.shortDemo.create({
     *   data: {
     *     // ... data to create a ShortDemo
     *   }
     * })
     * 
     */
    create<T extends ShortDemoCreateArgs>(args: SelectSubset<T, ShortDemoCreateArgs<ExtArgs>>): Prisma__ShortDemoClient<$Result.GetResult<Prisma.$ShortDemoPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ShortDemos.
     * @param {ShortDemoCreateManyArgs} args - Arguments to create many ShortDemos.
     * @example
     * // Create many ShortDemos
     * const shortDemo = await prisma.shortDemo.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ShortDemoCreateManyArgs>(args?: SelectSubset<T, ShortDemoCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ShortDemos and returns the data saved in the database.
     * @param {ShortDemoCreateManyAndReturnArgs} args - Arguments to create many ShortDemos.
     * @example
     * // Create many ShortDemos
     * const shortDemo = await prisma.shortDemo.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ShortDemos and only return the `id`
     * const shortDemoWithIdOnly = await prisma.shortDemo.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ShortDemoCreateManyAndReturnArgs>(args?: SelectSubset<T, ShortDemoCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ShortDemoPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ShortDemo.
     * @param {ShortDemoDeleteArgs} args - Arguments to delete one ShortDemo.
     * @example
     * // Delete one ShortDemo
     * const ShortDemo = await prisma.shortDemo.delete({
     *   where: {
     *     // ... filter to delete one ShortDemo
     *   }
     * })
     * 
     */
    delete<T extends ShortDemoDeleteArgs>(args: SelectSubset<T, ShortDemoDeleteArgs<ExtArgs>>): Prisma__ShortDemoClient<$Result.GetResult<Prisma.$ShortDemoPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ShortDemo.
     * @param {ShortDemoUpdateArgs} args - Arguments to update one ShortDemo.
     * @example
     * // Update one ShortDemo
     * const shortDemo = await prisma.shortDemo.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ShortDemoUpdateArgs>(args: SelectSubset<T, ShortDemoUpdateArgs<ExtArgs>>): Prisma__ShortDemoClient<$Result.GetResult<Prisma.$ShortDemoPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ShortDemos.
     * @param {ShortDemoDeleteManyArgs} args - Arguments to filter ShortDemos to delete.
     * @example
     * // Delete a few ShortDemos
     * const { count } = await prisma.shortDemo.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ShortDemoDeleteManyArgs>(args?: SelectSubset<T, ShortDemoDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ShortDemos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortDemoUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ShortDemos
     * const shortDemo = await prisma.shortDemo.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ShortDemoUpdateManyArgs>(args: SelectSubset<T, ShortDemoUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ShortDemos and returns the data updated in the database.
     * @param {ShortDemoUpdateManyAndReturnArgs} args - Arguments to update many ShortDemos.
     * @example
     * // Update many ShortDemos
     * const shortDemo = await prisma.shortDemo.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ShortDemos and only return the `id`
     * const shortDemoWithIdOnly = await prisma.shortDemo.updateManyAndReturn({
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
    updateManyAndReturn<T extends ShortDemoUpdateManyAndReturnArgs>(args: SelectSubset<T, ShortDemoUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ShortDemoPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ShortDemo.
     * @param {ShortDemoUpsertArgs} args - Arguments to update or create a ShortDemo.
     * @example
     * // Update or create a ShortDemo
     * const shortDemo = await prisma.shortDemo.upsert({
     *   create: {
     *     // ... data to create a ShortDemo
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ShortDemo we want to update
     *   }
     * })
     */
    upsert<T extends ShortDemoUpsertArgs>(args: SelectSubset<T, ShortDemoUpsertArgs<ExtArgs>>): Prisma__ShortDemoClient<$Result.GetResult<Prisma.$ShortDemoPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ShortDemos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortDemoCountArgs} args - Arguments to filter ShortDemos to count.
     * @example
     * // Count the number of ShortDemos
     * const count = await prisma.shortDemo.count({
     *   where: {
     *     // ... the filter for the ShortDemos we want to count
     *   }
     * })
    **/
    count<T extends ShortDemoCountArgs>(
      args?: Subset<T, ShortDemoCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ShortDemoCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ShortDemo.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortDemoAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ShortDemoAggregateArgs>(args: Subset<T, ShortDemoAggregateArgs>): Prisma.PrismaPromise<GetShortDemoAggregateType<T>>

    /**
     * Group by ShortDemo.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortDemoGroupByArgs} args - Group by arguments.
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
      T extends ShortDemoGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ShortDemoGroupByArgs['orderBy'] }
        : { orderBy?: ShortDemoGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ShortDemoGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetShortDemoGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ShortDemo model
   */
  readonly fields: ShortDemoFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ShortDemo.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ShortDemoClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    demoVideo<T extends DemoVideoDefaultArgs<ExtArgs> = {}>(args?: Subset<T, DemoVideoDefaultArgs<ExtArgs>>): Prisma__DemoVideoClient<$Result.GetResult<Prisma.$DemoVideoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
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
   * Fields of the ShortDemo model
   */
  interface ShortDemoFieldRefs {
    readonly id: FieldRef<"ShortDemo", 'String'>
    readonly demoVideoId: FieldRef<"ShortDemo", 'String'>
    readonly s3Url: FieldRef<"ShortDemo", 'String'>
    readonly durationSeconds: FieldRef<"ShortDemo", 'Int'>
    readonly colorPalette: FieldRef<"ShortDemo", 'String'>
    readonly shortDemoInfo: FieldRef<"ShortDemo", 'String'>
    readonly createdAt: FieldRef<"ShortDemo", 'DateTime'>
    readonly updatedAt: FieldRef<"ShortDemo", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ShortDemo findUnique
   */
  export type ShortDemoFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortDemo
     */
    select?: ShortDemoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortDemo
     */
    omit?: ShortDemoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortDemoInclude<ExtArgs> | null
    /**
     * Filter, which ShortDemo to fetch.
     */
    where: ShortDemoWhereUniqueInput
  }

  /**
   * ShortDemo findUniqueOrThrow
   */
  export type ShortDemoFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortDemo
     */
    select?: ShortDemoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortDemo
     */
    omit?: ShortDemoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortDemoInclude<ExtArgs> | null
    /**
     * Filter, which ShortDemo to fetch.
     */
    where: ShortDemoWhereUniqueInput
  }

  /**
   * ShortDemo findFirst
   */
  export type ShortDemoFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortDemo
     */
    select?: ShortDemoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortDemo
     */
    omit?: ShortDemoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortDemoInclude<ExtArgs> | null
    /**
     * Filter, which ShortDemo to fetch.
     */
    where?: ShortDemoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ShortDemos to fetch.
     */
    orderBy?: ShortDemoOrderByWithRelationInput | ShortDemoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ShortDemos.
     */
    cursor?: ShortDemoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ShortDemos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ShortDemos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ShortDemos.
     */
    distinct?: ShortDemoScalarFieldEnum | ShortDemoScalarFieldEnum[]
  }

  /**
   * ShortDemo findFirstOrThrow
   */
  export type ShortDemoFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortDemo
     */
    select?: ShortDemoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortDemo
     */
    omit?: ShortDemoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortDemoInclude<ExtArgs> | null
    /**
     * Filter, which ShortDemo to fetch.
     */
    where?: ShortDemoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ShortDemos to fetch.
     */
    orderBy?: ShortDemoOrderByWithRelationInput | ShortDemoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ShortDemos.
     */
    cursor?: ShortDemoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ShortDemos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ShortDemos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ShortDemos.
     */
    distinct?: ShortDemoScalarFieldEnum | ShortDemoScalarFieldEnum[]
  }

  /**
   * ShortDemo findMany
   */
  export type ShortDemoFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortDemo
     */
    select?: ShortDemoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortDemo
     */
    omit?: ShortDemoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortDemoInclude<ExtArgs> | null
    /**
     * Filter, which ShortDemos to fetch.
     */
    where?: ShortDemoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ShortDemos to fetch.
     */
    orderBy?: ShortDemoOrderByWithRelationInput | ShortDemoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ShortDemos.
     */
    cursor?: ShortDemoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ShortDemos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ShortDemos.
     */
    skip?: number
    distinct?: ShortDemoScalarFieldEnum | ShortDemoScalarFieldEnum[]
  }

  /**
   * ShortDemo create
   */
  export type ShortDemoCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortDemo
     */
    select?: ShortDemoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortDemo
     */
    omit?: ShortDemoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortDemoInclude<ExtArgs> | null
    /**
     * The data needed to create a ShortDemo.
     */
    data: XOR<ShortDemoCreateInput, ShortDemoUncheckedCreateInput>
  }

  /**
   * ShortDemo createMany
   */
  export type ShortDemoCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ShortDemos.
     */
    data: ShortDemoCreateManyInput | ShortDemoCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ShortDemo createManyAndReturn
   */
  export type ShortDemoCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortDemo
     */
    select?: ShortDemoSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ShortDemo
     */
    omit?: ShortDemoOmit<ExtArgs> | null
    /**
     * The data used to create many ShortDemos.
     */
    data: ShortDemoCreateManyInput | ShortDemoCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortDemoIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ShortDemo update
   */
  export type ShortDemoUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortDemo
     */
    select?: ShortDemoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortDemo
     */
    omit?: ShortDemoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortDemoInclude<ExtArgs> | null
    /**
     * The data needed to update a ShortDemo.
     */
    data: XOR<ShortDemoUpdateInput, ShortDemoUncheckedUpdateInput>
    /**
     * Choose, which ShortDemo to update.
     */
    where: ShortDemoWhereUniqueInput
  }

  /**
   * ShortDemo updateMany
   */
  export type ShortDemoUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ShortDemos.
     */
    data: XOR<ShortDemoUpdateManyMutationInput, ShortDemoUncheckedUpdateManyInput>
    /**
     * Filter which ShortDemos to update
     */
    where?: ShortDemoWhereInput
    /**
     * Limit how many ShortDemos to update.
     */
    limit?: number
  }

  /**
   * ShortDemo updateManyAndReturn
   */
  export type ShortDemoUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortDemo
     */
    select?: ShortDemoSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ShortDemo
     */
    omit?: ShortDemoOmit<ExtArgs> | null
    /**
     * The data used to update ShortDemos.
     */
    data: XOR<ShortDemoUpdateManyMutationInput, ShortDemoUncheckedUpdateManyInput>
    /**
     * Filter which ShortDemos to update
     */
    where?: ShortDemoWhereInput
    /**
     * Limit how many ShortDemos to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortDemoIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ShortDemo upsert
   */
  export type ShortDemoUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortDemo
     */
    select?: ShortDemoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortDemo
     */
    omit?: ShortDemoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortDemoInclude<ExtArgs> | null
    /**
     * The filter to search for the ShortDemo to update in case it exists.
     */
    where: ShortDemoWhereUniqueInput
    /**
     * In case the ShortDemo found by the `where` argument doesn't exist, create a new ShortDemo with this data.
     */
    create: XOR<ShortDemoCreateInput, ShortDemoUncheckedCreateInput>
    /**
     * In case the ShortDemo was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ShortDemoUpdateInput, ShortDemoUncheckedUpdateInput>
  }

  /**
   * ShortDemo delete
   */
  export type ShortDemoDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortDemo
     */
    select?: ShortDemoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortDemo
     */
    omit?: ShortDemoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortDemoInclude<ExtArgs> | null
    /**
     * Filter which ShortDemo to delete.
     */
    where: ShortDemoWhereUniqueInput
  }

  /**
   * ShortDemo deleteMany
   */
  export type ShortDemoDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ShortDemos to delete
     */
    where?: ShortDemoWhereInput
    /**
     * Limit how many ShortDemos to delete.
     */
    limit?: number
  }

  /**
   * ShortDemo without action
   */
  export type ShortDemoDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortDemo
     */
    select?: ShortDemoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortDemo
     */
    omit?: ShortDemoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortDemoInclude<ExtArgs> | null
  }


  /**
   * Model HookViralVideo
   */

  export type AggregateHookViralVideo = {
    _count: HookViralVideoCountAggregateOutputType | null
    _avg: HookViralVideoAvgAggregateOutputType | null
    _sum: HookViralVideoSumAggregateOutputType | null
    _min: HookViralVideoMinAggregateOutputType | null
    _max: HookViralVideoMaxAggregateOutputType | null
  }

  export type HookViralVideoAvgAggregateOutputType = {
    views: number | null
    comments: number | null
    likes: number | null
    durationSeconds: number | null
  }

  export type HookViralVideoSumAggregateOutputType = {
    views: number | null
    comments: number | null
    likes: number | null
    durationSeconds: number | null
  }

  export type HookViralVideoMinAggregateOutputType = {
    id: string | null
    webpageUrl: string | null
    s3Url: string | null
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

  export type HookViralVideoMaxAggregateOutputType = {
    id: string | null
    webpageUrl: string | null
    s3Url: string | null
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

  export type HookViralVideoCountAggregateOutputType = {
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


  export type HookViralVideoAvgAggregateInputType = {
    views?: true
    comments?: true
    likes?: true
    durationSeconds?: true
  }

  export type HookViralVideoSumAggregateInputType = {
    views?: true
    comments?: true
    likes?: true
    durationSeconds?: true
  }

  export type HookViralVideoMinAggregateInputType = {
    id?: true
    webpageUrl?: true
    s3Url?: true
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

  export type HookViralVideoMaxAggregateInputType = {
    id?: true
    webpageUrl?: true
    s3Url?: true
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

  export type HookViralVideoCountAggregateInputType = {
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

  export type HookViralVideoAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which HookViralVideo to aggregate.
     */
    where?: HookViralVideoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HookViralVideos to fetch.
     */
    orderBy?: HookViralVideoOrderByWithRelationInput | HookViralVideoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: HookViralVideoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HookViralVideos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HookViralVideos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned HookViralVideos
    **/
    _count?: true | HookViralVideoCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: HookViralVideoAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: HookViralVideoSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: HookViralVideoMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: HookViralVideoMaxAggregateInputType
  }

  export type GetHookViralVideoAggregateType<T extends HookViralVideoAggregateArgs> = {
        [P in keyof T & keyof AggregateHookViralVideo]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateHookViralVideo[P]>
      : GetScalarType<T[P], AggregateHookViralVideo[P]>
  }




  export type HookViralVideoGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: HookViralVideoWhereInput
    orderBy?: HookViralVideoOrderByWithAggregationInput | HookViralVideoOrderByWithAggregationInput[]
    by: HookViralVideoScalarFieldEnum[] | HookViralVideoScalarFieldEnum
    having?: HookViralVideoScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: HookViralVideoCountAggregateInputType | true
    _avg?: HookViralVideoAvgAggregateInputType
    _sum?: HookViralVideoSumAggregateInputType
    _min?: HookViralVideoMinAggregateInputType
    _max?: HookViralVideoMaxAggregateInputType
  }

  export type HookViralVideoGroupByOutputType = {
    id: string
    webpageUrl: string
    s3Url: string
    colorPalette: JsonValue | null
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
    _count: HookViralVideoCountAggregateOutputType | null
    _avg: HookViralVideoAvgAggregateOutputType | null
    _sum: HookViralVideoSumAggregateOutputType | null
    _min: HookViralVideoMinAggregateOutputType | null
    _max: HookViralVideoMaxAggregateOutputType | null
  }

  type GetHookViralVideoGroupByPayload<T extends HookViralVideoGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<HookViralVideoGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof HookViralVideoGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], HookViralVideoGroupByOutputType[P]>
            : GetScalarType<T[P], HookViralVideoGroupByOutputType[P]>
        }
      >
    >


  export type HookViralVideoSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
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
  }, ExtArgs["result"]["hookViralVideo"]>

  export type HookViralVideoSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
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
  }, ExtArgs["result"]["hookViralVideo"]>

  export type HookViralVideoSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
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
  }, ExtArgs["result"]["hookViralVideo"]>

  export type HookViralVideoSelectScalar = {
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

  export type HookViralVideoOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "webpageUrl" | "s3Url" | "colorPalette" | "hookEndTimestamp" | "hookCutConfidence" | "hookCutUrl" | "hookInfo" | "title" | "description" | "views" | "comments" | "likes" | "durationSeconds" | "createdAt" | "updatedAt", ExtArgs["result"]["hookViralVideo"]>

  export type $HookViralVideoPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "HookViralVideo"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      webpageUrl: string
      s3Url: string
      colorPalette: Prisma.JsonValue | null
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
    }, ExtArgs["result"]["hookViralVideo"]>
    composites: {}
  }

  type HookViralVideoGetPayload<S extends boolean | null | undefined | HookViralVideoDefaultArgs> = $Result.GetResult<Prisma.$HookViralVideoPayload, S>

  type HookViralVideoCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<HookViralVideoFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: HookViralVideoCountAggregateInputType | true
    }

  export interface HookViralVideoDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['HookViralVideo'], meta: { name: 'HookViralVideo' } }
    /**
     * Find zero or one HookViralVideo that matches the filter.
     * @param {HookViralVideoFindUniqueArgs} args - Arguments to find a HookViralVideo
     * @example
     * // Get one HookViralVideo
     * const hookViralVideo = await prisma.hookViralVideo.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends HookViralVideoFindUniqueArgs>(args: SelectSubset<T, HookViralVideoFindUniqueArgs<ExtArgs>>): Prisma__HookViralVideoClient<$Result.GetResult<Prisma.$HookViralVideoPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one HookViralVideo that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {HookViralVideoFindUniqueOrThrowArgs} args - Arguments to find a HookViralVideo
     * @example
     * // Get one HookViralVideo
     * const hookViralVideo = await prisma.hookViralVideo.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends HookViralVideoFindUniqueOrThrowArgs>(args: SelectSubset<T, HookViralVideoFindUniqueOrThrowArgs<ExtArgs>>): Prisma__HookViralVideoClient<$Result.GetResult<Prisma.$HookViralVideoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first HookViralVideo that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HookViralVideoFindFirstArgs} args - Arguments to find a HookViralVideo
     * @example
     * // Get one HookViralVideo
     * const hookViralVideo = await prisma.hookViralVideo.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends HookViralVideoFindFirstArgs>(args?: SelectSubset<T, HookViralVideoFindFirstArgs<ExtArgs>>): Prisma__HookViralVideoClient<$Result.GetResult<Prisma.$HookViralVideoPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first HookViralVideo that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HookViralVideoFindFirstOrThrowArgs} args - Arguments to find a HookViralVideo
     * @example
     * // Get one HookViralVideo
     * const hookViralVideo = await prisma.hookViralVideo.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends HookViralVideoFindFirstOrThrowArgs>(args?: SelectSubset<T, HookViralVideoFindFirstOrThrowArgs<ExtArgs>>): Prisma__HookViralVideoClient<$Result.GetResult<Prisma.$HookViralVideoPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more HookViralVideos that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HookViralVideoFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all HookViralVideos
     * const hookViralVideos = await prisma.hookViralVideo.findMany()
     * 
     * // Get first 10 HookViralVideos
     * const hookViralVideos = await prisma.hookViralVideo.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const hookViralVideoWithIdOnly = await prisma.hookViralVideo.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends HookViralVideoFindManyArgs>(args?: SelectSubset<T, HookViralVideoFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HookViralVideoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a HookViralVideo.
     * @param {HookViralVideoCreateArgs} args - Arguments to create a HookViralVideo.
     * @example
     * // Create one HookViralVideo
     * const HookViralVideo = await prisma.hookViralVideo.create({
     *   data: {
     *     // ... data to create a HookViralVideo
     *   }
     * })
     * 
     */
    create<T extends HookViralVideoCreateArgs>(args: SelectSubset<T, HookViralVideoCreateArgs<ExtArgs>>): Prisma__HookViralVideoClient<$Result.GetResult<Prisma.$HookViralVideoPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many HookViralVideos.
     * @param {HookViralVideoCreateManyArgs} args - Arguments to create many HookViralVideos.
     * @example
     * // Create many HookViralVideos
     * const hookViralVideo = await prisma.hookViralVideo.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends HookViralVideoCreateManyArgs>(args?: SelectSubset<T, HookViralVideoCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many HookViralVideos and returns the data saved in the database.
     * @param {HookViralVideoCreateManyAndReturnArgs} args - Arguments to create many HookViralVideos.
     * @example
     * // Create many HookViralVideos
     * const hookViralVideo = await prisma.hookViralVideo.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many HookViralVideos and only return the `id`
     * const hookViralVideoWithIdOnly = await prisma.hookViralVideo.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends HookViralVideoCreateManyAndReturnArgs>(args?: SelectSubset<T, HookViralVideoCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HookViralVideoPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a HookViralVideo.
     * @param {HookViralVideoDeleteArgs} args - Arguments to delete one HookViralVideo.
     * @example
     * // Delete one HookViralVideo
     * const HookViralVideo = await prisma.hookViralVideo.delete({
     *   where: {
     *     // ... filter to delete one HookViralVideo
     *   }
     * })
     * 
     */
    delete<T extends HookViralVideoDeleteArgs>(args: SelectSubset<T, HookViralVideoDeleteArgs<ExtArgs>>): Prisma__HookViralVideoClient<$Result.GetResult<Prisma.$HookViralVideoPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one HookViralVideo.
     * @param {HookViralVideoUpdateArgs} args - Arguments to update one HookViralVideo.
     * @example
     * // Update one HookViralVideo
     * const hookViralVideo = await prisma.hookViralVideo.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends HookViralVideoUpdateArgs>(args: SelectSubset<T, HookViralVideoUpdateArgs<ExtArgs>>): Prisma__HookViralVideoClient<$Result.GetResult<Prisma.$HookViralVideoPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more HookViralVideos.
     * @param {HookViralVideoDeleteManyArgs} args - Arguments to filter HookViralVideos to delete.
     * @example
     * // Delete a few HookViralVideos
     * const { count } = await prisma.hookViralVideo.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends HookViralVideoDeleteManyArgs>(args?: SelectSubset<T, HookViralVideoDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more HookViralVideos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HookViralVideoUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many HookViralVideos
     * const hookViralVideo = await prisma.hookViralVideo.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends HookViralVideoUpdateManyArgs>(args: SelectSubset<T, HookViralVideoUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more HookViralVideos and returns the data updated in the database.
     * @param {HookViralVideoUpdateManyAndReturnArgs} args - Arguments to update many HookViralVideos.
     * @example
     * // Update many HookViralVideos
     * const hookViralVideo = await prisma.hookViralVideo.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more HookViralVideos and only return the `id`
     * const hookViralVideoWithIdOnly = await prisma.hookViralVideo.updateManyAndReturn({
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
    updateManyAndReturn<T extends HookViralVideoUpdateManyAndReturnArgs>(args: SelectSubset<T, HookViralVideoUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HookViralVideoPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one HookViralVideo.
     * @param {HookViralVideoUpsertArgs} args - Arguments to update or create a HookViralVideo.
     * @example
     * // Update or create a HookViralVideo
     * const hookViralVideo = await prisma.hookViralVideo.upsert({
     *   create: {
     *     // ... data to create a HookViralVideo
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the HookViralVideo we want to update
     *   }
     * })
     */
    upsert<T extends HookViralVideoUpsertArgs>(args: SelectSubset<T, HookViralVideoUpsertArgs<ExtArgs>>): Prisma__HookViralVideoClient<$Result.GetResult<Prisma.$HookViralVideoPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of HookViralVideos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HookViralVideoCountArgs} args - Arguments to filter HookViralVideos to count.
     * @example
     * // Count the number of HookViralVideos
     * const count = await prisma.hookViralVideo.count({
     *   where: {
     *     // ... the filter for the HookViralVideos we want to count
     *   }
     * })
    **/
    count<T extends HookViralVideoCountArgs>(
      args?: Subset<T, HookViralVideoCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], HookViralVideoCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a HookViralVideo.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HookViralVideoAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends HookViralVideoAggregateArgs>(args: Subset<T, HookViralVideoAggregateArgs>): Prisma.PrismaPromise<GetHookViralVideoAggregateType<T>>

    /**
     * Group by HookViralVideo.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HookViralVideoGroupByArgs} args - Group by arguments.
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
      T extends HookViralVideoGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: HookViralVideoGroupByArgs['orderBy'] }
        : { orderBy?: HookViralVideoGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, HookViralVideoGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetHookViralVideoGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the HookViralVideo model
   */
  readonly fields: HookViralVideoFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for HookViralVideo.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__HookViralVideoClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the HookViralVideo model
   */
  interface HookViralVideoFieldRefs {
    readonly id: FieldRef<"HookViralVideo", 'String'>
    readonly webpageUrl: FieldRef<"HookViralVideo", 'String'>
    readonly s3Url: FieldRef<"HookViralVideo", 'String'>
    readonly colorPalette: FieldRef<"HookViralVideo", 'Json'>
    readonly hookEndTimestamp: FieldRef<"HookViralVideo", 'String'>
    readonly hookCutConfidence: FieldRef<"HookViralVideo", 'String'>
    readonly hookCutUrl: FieldRef<"HookViralVideo", 'String'>
    readonly hookInfo: FieldRef<"HookViralVideo", 'String'>
    readonly title: FieldRef<"HookViralVideo", 'String'>
    readonly description: FieldRef<"HookViralVideo", 'String'>
    readonly views: FieldRef<"HookViralVideo", 'Int'>
    readonly comments: FieldRef<"HookViralVideo", 'Int'>
    readonly likes: FieldRef<"HookViralVideo", 'Int'>
    readonly durationSeconds: FieldRef<"HookViralVideo", 'Int'>
    readonly createdAt: FieldRef<"HookViralVideo", 'DateTime'>
    readonly updatedAt: FieldRef<"HookViralVideo", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * HookViralVideo findUnique
   */
  export type HookViralVideoFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HookViralVideo
     */
    select?: HookViralVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HookViralVideo
     */
    omit?: HookViralVideoOmit<ExtArgs> | null
    /**
     * Filter, which HookViralVideo to fetch.
     */
    where: HookViralVideoWhereUniqueInput
  }

  /**
   * HookViralVideo findUniqueOrThrow
   */
  export type HookViralVideoFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HookViralVideo
     */
    select?: HookViralVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HookViralVideo
     */
    omit?: HookViralVideoOmit<ExtArgs> | null
    /**
     * Filter, which HookViralVideo to fetch.
     */
    where: HookViralVideoWhereUniqueInput
  }

  /**
   * HookViralVideo findFirst
   */
  export type HookViralVideoFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HookViralVideo
     */
    select?: HookViralVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HookViralVideo
     */
    omit?: HookViralVideoOmit<ExtArgs> | null
    /**
     * Filter, which HookViralVideo to fetch.
     */
    where?: HookViralVideoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HookViralVideos to fetch.
     */
    orderBy?: HookViralVideoOrderByWithRelationInput | HookViralVideoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for HookViralVideos.
     */
    cursor?: HookViralVideoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HookViralVideos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HookViralVideos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of HookViralVideos.
     */
    distinct?: HookViralVideoScalarFieldEnum | HookViralVideoScalarFieldEnum[]
  }

  /**
   * HookViralVideo findFirstOrThrow
   */
  export type HookViralVideoFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HookViralVideo
     */
    select?: HookViralVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HookViralVideo
     */
    omit?: HookViralVideoOmit<ExtArgs> | null
    /**
     * Filter, which HookViralVideo to fetch.
     */
    where?: HookViralVideoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HookViralVideos to fetch.
     */
    orderBy?: HookViralVideoOrderByWithRelationInput | HookViralVideoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for HookViralVideos.
     */
    cursor?: HookViralVideoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HookViralVideos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HookViralVideos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of HookViralVideos.
     */
    distinct?: HookViralVideoScalarFieldEnum | HookViralVideoScalarFieldEnum[]
  }

  /**
   * HookViralVideo findMany
   */
  export type HookViralVideoFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HookViralVideo
     */
    select?: HookViralVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HookViralVideo
     */
    omit?: HookViralVideoOmit<ExtArgs> | null
    /**
     * Filter, which HookViralVideos to fetch.
     */
    where?: HookViralVideoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HookViralVideos to fetch.
     */
    orderBy?: HookViralVideoOrderByWithRelationInput | HookViralVideoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing HookViralVideos.
     */
    cursor?: HookViralVideoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HookViralVideos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HookViralVideos.
     */
    skip?: number
    distinct?: HookViralVideoScalarFieldEnum | HookViralVideoScalarFieldEnum[]
  }

  /**
   * HookViralVideo create
   */
  export type HookViralVideoCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HookViralVideo
     */
    select?: HookViralVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HookViralVideo
     */
    omit?: HookViralVideoOmit<ExtArgs> | null
    /**
     * The data needed to create a HookViralVideo.
     */
    data: XOR<HookViralVideoCreateInput, HookViralVideoUncheckedCreateInput>
  }

  /**
   * HookViralVideo createMany
   */
  export type HookViralVideoCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many HookViralVideos.
     */
    data: HookViralVideoCreateManyInput | HookViralVideoCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * HookViralVideo createManyAndReturn
   */
  export type HookViralVideoCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HookViralVideo
     */
    select?: HookViralVideoSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the HookViralVideo
     */
    omit?: HookViralVideoOmit<ExtArgs> | null
    /**
     * The data used to create many HookViralVideos.
     */
    data: HookViralVideoCreateManyInput | HookViralVideoCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * HookViralVideo update
   */
  export type HookViralVideoUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HookViralVideo
     */
    select?: HookViralVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HookViralVideo
     */
    omit?: HookViralVideoOmit<ExtArgs> | null
    /**
     * The data needed to update a HookViralVideo.
     */
    data: XOR<HookViralVideoUpdateInput, HookViralVideoUncheckedUpdateInput>
    /**
     * Choose, which HookViralVideo to update.
     */
    where: HookViralVideoWhereUniqueInput
  }

  /**
   * HookViralVideo updateMany
   */
  export type HookViralVideoUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update HookViralVideos.
     */
    data: XOR<HookViralVideoUpdateManyMutationInput, HookViralVideoUncheckedUpdateManyInput>
    /**
     * Filter which HookViralVideos to update
     */
    where?: HookViralVideoWhereInput
    /**
     * Limit how many HookViralVideos to update.
     */
    limit?: number
  }

  /**
   * HookViralVideo updateManyAndReturn
   */
  export type HookViralVideoUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HookViralVideo
     */
    select?: HookViralVideoSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the HookViralVideo
     */
    omit?: HookViralVideoOmit<ExtArgs> | null
    /**
     * The data used to update HookViralVideos.
     */
    data: XOR<HookViralVideoUpdateManyMutationInput, HookViralVideoUncheckedUpdateManyInput>
    /**
     * Filter which HookViralVideos to update
     */
    where?: HookViralVideoWhereInput
    /**
     * Limit how many HookViralVideos to update.
     */
    limit?: number
  }

  /**
   * HookViralVideo upsert
   */
  export type HookViralVideoUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HookViralVideo
     */
    select?: HookViralVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HookViralVideo
     */
    omit?: HookViralVideoOmit<ExtArgs> | null
    /**
     * The filter to search for the HookViralVideo to update in case it exists.
     */
    where: HookViralVideoWhereUniqueInput
    /**
     * In case the HookViralVideo found by the `where` argument doesn't exist, create a new HookViralVideo with this data.
     */
    create: XOR<HookViralVideoCreateInput, HookViralVideoUncheckedCreateInput>
    /**
     * In case the HookViralVideo was found with the provided `where` argument, update it with this data.
     */
    update: XOR<HookViralVideoUpdateInput, HookViralVideoUncheckedUpdateInput>
  }

  /**
   * HookViralVideo delete
   */
  export type HookViralVideoDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HookViralVideo
     */
    select?: HookViralVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HookViralVideo
     */
    omit?: HookViralVideoOmit<ExtArgs> | null
    /**
     * Filter which HookViralVideo to delete.
     */
    where: HookViralVideoWhereUniqueInput
  }

  /**
   * HookViralVideo deleteMany
   */
  export type HookViralVideoDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which HookViralVideos to delete
     */
    where?: HookViralVideoWhereInput
    /**
     * Limit how many HookViralVideos to delete.
     */
    limit?: number
  }

  /**
   * HookViralVideo without action
   */
  export type HookViralVideoDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HookViralVideo
     */
    select?: HookViralVideoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the HookViralVideo
     */
    omit?: HookViralVideoOmit<ExtArgs> | null
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


  export const ShortDemoScalarFieldEnum: {
    id: 'id',
    demoVideoId: 'demoVideoId',
    s3Url: 's3Url',
    durationSeconds: 'durationSeconds',
    colorPalette: 'colorPalette',
    shortDemoInfo: 'shortDemoInfo',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ShortDemoScalarFieldEnum = (typeof ShortDemoScalarFieldEnum)[keyof typeof ShortDemoScalarFieldEnum]


  export const HookViralVideoScalarFieldEnum: {
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

  export type HookViralVideoScalarFieldEnum = (typeof HookViralVideoScalarFieldEnum)[keyof typeof HookViralVideoScalarFieldEnum]


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
    colorPalette?: JsonNullableFilter<"DemoVideo">
    durationSeconds?: IntFilter<"DemoVideo"> | number
    createdAt?: DateTimeFilter<"DemoVideo"> | Date | string
    updatedAt?: DateTimeFilter<"DemoVideo"> | Date | string
    shortDemos?: ShortDemoListRelationFilter
  }

  export type DemoVideoOrderByWithRelationInput = {
    id?: SortOrder
    s3Url?: SortOrder
    productInfo?: SortOrderInput | SortOrder
    colorPalette?: SortOrderInput | SortOrder
    durationSeconds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    shortDemos?: ShortDemoOrderByRelationAggregateInput
  }

  export type DemoVideoWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: DemoVideoWhereInput | DemoVideoWhereInput[]
    OR?: DemoVideoWhereInput[]
    NOT?: DemoVideoWhereInput | DemoVideoWhereInput[]
    s3Url?: StringFilter<"DemoVideo"> | string
    productInfo?: StringNullableFilter<"DemoVideo"> | string | null
    colorPalette?: JsonNullableFilter<"DemoVideo">
    durationSeconds?: IntFilter<"DemoVideo"> | number
    createdAt?: DateTimeFilter<"DemoVideo"> | Date | string
    updatedAt?: DateTimeFilter<"DemoVideo"> | Date | string
    shortDemos?: ShortDemoListRelationFilter
  }, "id">

  export type DemoVideoOrderByWithAggregationInput = {
    id?: SortOrder
    s3Url?: SortOrder
    productInfo?: SortOrderInput | SortOrder
    colorPalette?: SortOrderInput | SortOrder
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
    colorPalette?: JsonNullableWithAggregatesFilter<"DemoVideo">
    durationSeconds?: IntWithAggregatesFilter<"DemoVideo"> | number
    createdAt?: DateTimeWithAggregatesFilter<"DemoVideo"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"DemoVideo"> | Date | string
  }

  export type ShortDemoWhereInput = {
    AND?: ShortDemoWhereInput | ShortDemoWhereInput[]
    OR?: ShortDemoWhereInput[]
    NOT?: ShortDemoWhereInput | ShortDemoWhereInput[]
    id?: StringFilter<"ShortDemo"> | string
    demoVideoId?: StringFilter<"ShortDemo"> | string
    s3Url?: StringFilter<"ShortDemo"> | string
    durationSeconds?: IntFilter<"ShortDemo"> | number
    colorPalette?: StringNullableFilter<"ShortDemo"> | string | null
    shortDemoInfo?: StringNullableFilter<"ShortDemo"> | string | null
    createdAt?: DateTimeFilter<"ShortDemo"> | Date | string
    updatedAt?: DateTimeFilter<"ShortDemo"> | Date | string
    demoVideo?: XOR<DemoVideoScalarRelationFilter, DemoVideoWhereInput>
  }

  export type ShortDemoOrderByWithRelationInput = {
    id?: SortOrder
    demoVideoId?: SortOrder
    s3Url?: SortOrder
    durationSeconds?: SortOrder
    colorPalette?: SortOrderInput | SortOrder
    shortDemoInfo?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    demoVideo?: DemoVideoOrderByWithRelationInput
  }

  export type ShortDemoWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ShortDemoWhereInput | ShortDemoWhereInput[]
    OR?: ShortDemoWhereInput[]
    NOT?: ShortDemoWhereInput | ShortDemoWhereInput[]
    demoVideoId?: StringFilter<"ShortDemo"> | string
    s3Url?: StringFilter<"ShortDemo"> | string
    durationSeconds?: IntFilter<"ShortDemo"> | number
    colorPalette?: StringNullableFilter<"ShortDemo"> | string | null
    shortDemoInfo?: StringNullableFilter<"ShortDemo"> | string | null
    createdAt?: DateTimeFilter<"ShortDemo"> | Date | string
    updatedAt?: DateTimeFilter<"ShortDemo"> | Date | string
    demoVideo?: XOR<DemoVideoScalarRelationFilter, DemoVideoWhereInput>
  }, "id">

  export type ShortDemoOrderByWithAggregationInput = {
    id?: SortOrder
    demoVideoId?: SortOrder
    s3Url?: SortOrder
    durationSeconds?: SortOrder
    colorPalette?: SortOrderInput | SortOrder
    shortDemoInfo?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ShortDemoCountOrderByAggregateInput
    _avg?: ShortDemoAvgOrderByAggregateInput
    _max?: ShortDemoMaxOrderByAggregateInput
    _min?: ShortDemoMinOrderByAggregateInput
    _sum?: ShortDemoSumOrderByAggregateInput
  }

  export type ShortDemoScalarWhereWithAggregatesInput = {
    AND?: ShortDemoScalarWhereWithAggregatesInput | ShortDemoScalarWhereWithAggregatesInput[]
    OR?: ShortDemoScalarWhereWithAggregatesInput[]
    NOT?: ShortDemoScalarWhereWithAggregatesInput | ShortDemoScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ShortDemo"> | string
    demoVideoId?: StringWithAggregatesFilter<"ShortDemo"> | string
    s3Url?: StringWithAggregatesFilter<"ShortDemo"> | string
    durationSeconds?: IntWithAggregatesFilter<"ShortDemo"> | number
    colorPalette?: StringNullableWithAggregatesFilter<"ShortDemo"> | string | null
    shortDemoInfo?: StringNullableWithAggregatesFilter<"ShortDemo"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"ShortDemo"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ShortDemo"> | Date | string
  }

  export type HookViralVideoWhereInput = {
    AND?: HookViralVideoWhereInput | HookViralVideoWhereInput[]
    OR?: HookViralVideoWhereInput[]
    NOT?: HookViralVideoWhereInput | HookViralVideoWhereInput[]
    id?: StringFilter<"HookViralVideo"> | string
    webpageUrl?: StringFilter<"HookViralVideo"> | string
    s3Url?: StringFilter<"HookViralVideo"> | string
    colorPalette?: JsonNullableFilter<"HookViralVideo">
    hookEndTimestamp?: StringFilter<"HookViralVideo"> | string
    hookCutConfidence?: StringNullableFilter<"HookViralVideo"> | string | null
    hookCutUrl?: StringNullableFilter<"HookViralVideo"> | string | null
    hookInfo?: StringNullableFilter<"HookViralVideo"> | string | null
    title?: StringFilter<"HookViralVideo"> | string
    description?: StringNullableFilter<"HookViralVideo"> | string | null
    views?: IntFilter<"HookViralVideo"> | number
    comments?: IntFilter<"HookViralVideo"> | number
    likes?: IntFilter<"HookViralVideo"> | number
    durationSeconds?: IntFilter<"HookViralVideo"> | number
    createdAt?: DateTimeFilter<"HookViralVideo"> | Date | string
    updatedAt?: DateTimeFilter<"HookViralVideo"> | Date | string
  }

  export type HookViralVideoOrderByWithRelationInput = {
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

  export type HookViralVideoWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    webpageUrl?: string
    AND?: HookViralVideoWhereInput | HookViralVideoWhereInput[]
    OR?: HookViralVideoWhereInput[]
    NOT?: HookViralVideoWhereInput | HookViralVideoWhereInput[]
    s3Url?: StringFilter<"HookViralVideo"> | string
    colorPalette?: JsonNullableFilter<"HookViralVideo">
    hookEndTimestamp?: StringFilter<"HookViralVideo"> | string
    hookCutConfidence?: StringNullableFilter<"HookViralVideo"> | string | null
    hookCutUrl?: StringNullableFilter<"HookViralVideo"> | string | null
    hookInfo?: StringNullableFilter<"HookViralVideo"> | string | null
    title?: StringFilter<"HookViralVideo"> | string
    description?: StringNullableFilter<"HookViralVideo"> | string | null
    views?: IntFilter<"HookViralVideo"> | number
    comments?: IntFilter<"HookViralVideo"> | number
    likes?: IntFilter<"HookViralVideo"> | number
    durationSeconds?: IntFilter<"HookViralVideo"> | number
    createdAt?: DateTimeFilter<"HookViralVideo"> | Date | string
    updatedAt?: DateTimeFilter<"HookViralVideo"> | Date | string
  }, "id" | "webpageUrl">

  export type HookViralVideoOrderByWithAggregationInput = {
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
    _count?: HookViralVideoCountOrderByAggregateInput
    _avg?: HookViralVideoAvgOrderByAggregateInput
    _max?: HookViralVideoMaxOrderByAggregateInput
    _min?: HookViralVideoMinOrderByAggregateInput
    _sum?: HookViralVideoSumOrderByAggregateInput
  }

  export type HookViralVideoScalarWhereWithAggregatesInput = {
    AND?: HookViralVideoScalarWhereWithAggregatesInput | HookViralVideoScalarWhereWithAggregatesInput[]
    OR?: HookViralVideoScalarWhereWithAggregatesInput[]
    NOT?: HookViralVideoScalarWhereWithAggregatesInput | HookViralVideoScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"HookViralVideo"> | string
    webpageUrl?: StringWithAggregatesFilter<"HookViralVideo"> | string
    s3Url?: StringWithAggregatesFilter<"HookViralVideo"> | string
    colorPalette?: JsonNullableWithAggregatesFilter<"HookViralVideo">
    hookEndTimestamp?: StringWithAggregatesFilter<"HookViralVideo"> | string
    hookCutConfidence?: StringNullableWithAggregatesFilter<"HookViralVideo"> | string | null
    hookCutUrl?: StringNullableWithAggregatesFilter<"HookViralVideo"> | string | null
    hookInfo?: StringNullableWithAggregatesFilter<"HookViralVideo"> | string | null
    title?: StringWithAggregatesFilter<"HookViralVideo"> | string
    description?: StringNullableWithAggregatesFilter<"HookViralVideo"> | string | null
    views?: IntWithAggregatesFilter<"HookViralVideo"> | number
    comments?: IntWithAggregatesFilter<"HookViralVideo"> | number
    likes?: IntWithAggregatesFilter<"HookViralVideo"> | number
    durationSeconds?: IntWithAggregatesFilter<"HookViralVideo"> | number
    createdAt?: DateTimeWithAggregatesFilter<"HookViralVideo"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"HookViralVideo"> | Date | string
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
    colorPalette?: NullableJsonNullValueInput | InputJsonValue
    durationSeconds: number
    createdAt?: Date | string
    updatedAt?: Date | string
    shortDemos?: ShortDemoCreateNestedManyWithoutDemoVideoInput
  }

  export type DemoVideoUncheckedCreateInput = {
    id?: string
    s3Url: string
    productInfo?: string | null
    colorPalette?: NullableJsonNullValueInput | InputJsonValue
    durationSeconds: number
    createdAt?: Date | string
    updatedAt?: Date | string
    shortDemos?: ShortDemoUncheckedCreateNestedManyWithoutDemoVideoInput
  }

  export type DemoVideoUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    productInfo?: NullableStringFieldUpdateOperationsInput | string | null
    colorPalette?: NullableJsonNullValueInput | InputJsonValue
    durationSeconds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    shortDemos?: ShortDemoUpdateManyWithoutDemoVideoNestedInput
  }

  export type DemoVideoUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    productInfo?: NullableStringFieldUpdateOperationsInput | string | null
    colorPalette?: NullableJsonNullValueInput | InputJsonValue
    durationSeconds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    shortDemos?: ShortDemoUncheckedUpdateManyWithoutDemoVideoNestedInput
  }

  export type DemoVideoCreateManyInput = {
    id?: string
    s3Url: string
    productInfo?: string | null
    colorPalette?: NullableJsonNullValueInput | InputJsonValue
    durationSeconds: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DemoVideoUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    productInfo?: NullableStringFieldUpdateOperationsInput | string | null
    colorPalette?: NullableJsonNullValueInput | InputJsonValue
    durationSeconds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DemoVideoUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    productInfo?: NullableStringFieldUpdateOperationsInput | string | null
    colorPalette?: NullableJsonNullValueInput | InputJsonValue
    durationSeconds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ShortDemoCreateInput = {
    id?: string
    s3Url: string
    durationSeconds: number
    colorPalette?: string | null
    shortDemoInfo?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    demoVideo: DemoVideoCreateNestedOneWithoutShortDemosInput
  }

  export type ShortDemoUncheckedCreateInput = {
    id?: string
    demoVideoId: string
    s3Url: string
    durationSeconds: number
    colorPalette?: string | null
    shortDemoInfo?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ShortDemoUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    durationSeconds?: IntFieldUpdateOperationsInput | number
    colorPalette?: NullableStringFieldUpdateOperationsInput | string | null
    shortDemoInfo?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    demoVideo?: DemoVideoUpdateOneRequiredWithoutShortDemosNestedInput
  }

  export type ShortDemoUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    demoVideoId?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    durationSeconds?: IntFieldUpdateOperationsInput | number
    colorPalette?: NullableStringFieldUpdateOperationsInput | string | null
    shortDemoInfo?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ShortDemoCreateManyInput = {
    id?: string
    demoVideoId: string
    s3Url: string
    durationSeconds: number
    colorPalette?: string | null
    shortDemoInfo?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ShortDemoUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    durationSeconds?: IntFieldUpdateOperationsInput | number
    colorPalette?: NullableStringFieldUpdateOperationsInput | string | null
    shortDemoInfo?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ShortDemoUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    demoVideoId?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    durationSeconds?: IntFieldUpdateOperationsInput | number
    colorPalette?: NullableStringFieldUpdateOperationsInput | string | null
    shortDemoInfo?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HookViralVideoCreateInput = {
    id?: string
    webpageUrl: string
    s3Url: string
    colorPalette?: NullableJsonNullValueInput | InputJsonValue
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

  export type HookViralVideoUncheckedCreateInput = {
    id?: string
    webpageUrl: string
    s3Url: string
    colorPalette?: NullableJsonNullValueInput | InputJsonValue
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

  export type HookViralVideoUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    webpageUrl?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    colorPalette?: NullableJsonNullValueInput | InputJsonValue
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

  export type HookViralVideoUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    webpageUrl?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    colorPalette?: NullableJsonNullValueInput | InputJsonValue
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

  export type HookViralVideoCreateManyInput = {
    id?: string
    webpageUrl: string
    s3Url: string
    colorPalette?: NullableJsonNullValueInput | InputJsonValue
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

  export type HookViralVideoUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    webpageUrl?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    colorPalette?: NullableJsonNullValueInput | InputJsonValue
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

  export type HookViralVideoUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    webpageUrl?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    colorPalette?: NullableJsonNullValueInput | InputJsonValue
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

  export type ShortDemoListRelationFilter = {
    every?: ShortDemoWhereInput
    some?: ShortDemoWhereInput
    none?: ShortDemoWhereInput
  }

  export type ShortDemoOrderByRelationAggregateInput = {
    _count?: SortOrder
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
    durationSeconds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DemoVideoMinOrderByAggregateInput = {
    id?: SortOrder
    s3Url?: SortOrder
    productInfo?: SortOrder
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

  export type DemoVideoScalarRelationFilter = {
    is?: DemoVideoWhereInput
    isNot?: DemoVideoWhereInput
  }

  export type ShortDemoCountOrderByAggregateInput = {
    id?: SortOrder
    demoVideoId?: SortOrder
    s3Url?: SortOrder
    durationSeconds?: SortOrder
    colorPalette?: SortOrder
    shortDemoInfo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ShortDemoAvgOrderByAggregateInput = {
    durationSeconds?: SortOrder
  }

  export type ShortDemoMaxOrderByAggregateInput = {
    id?: SortOrder
    demoVideoId?: SortOrder
    s3Url?: SortOrder
    durationSeconds?: SortOrder
    colorPalette?: SortOrder
    shortDemoInfo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ShortDemoMinOrderByAggregateInput = {
    id?: SortOrder
    demoVideoId?: SortOrder
    s3Url?: SortOrder
    durationSeconds?: SortOrder
    colorPalette?: SortOrder
    shortDemoInfo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ShortDemoSumOrderByAggregateInput = {
    durationSeconds?: SortOrder
  }

  export type HookViralVideoCountOrderByAggregateInput = {
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

  export type HookViralVideoAvgOrderByAggregateInput = {
    views?: SortOrder
    comments?: SortOrder
    likes?: SortOrder
    durationSeconds?: SortOrder
  }

  export type HookViralVideoMaxOrderByAggregateInput = {
    id?: SortOrder
    webpageUrl?: SortOrder
    s3Url?: SortOrder
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

  export type HookViralVideoMinOrderByAggregateInput = {
    id?: SortOrder
    webpageUrl?: SortOrder
    s3Url?: SortOrder
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

  export type HookViralVideoSumOrderByAggregateInput = {
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

  export type ShortDemoCreateNestedManyWithoutDemoVideoInput = {
    create?: XOR<ShortDemoCreateWithoutDemoVideoInput, ShortDemoUncheckedCreateWithoutDemoVideoInput> | ShortDemoCreateWithoutDemoVideoInput[] | ShortDemoUncheckedCreateWithoutDemoVideoInput[]
    connectOrCreate?: ShortDemoCreateOrConnectWithoutDemoVideoInput | ShortDemoCreateOrConnectWithoutDemoVideoInput[]
    createMany?: ShortDemoCreateManyDemoVideoInputEnvelope
    connect?: ShortDemoWhereUniqueInput | ShortDemoWhereUniqueInput[]
  }

  export type ShortDemoUncheckedCreateNestedManyWithoutDemoVideoInput = {
    create?: XOR<ShortDemoCreateWithoutDemoVideoInput, ShortDemoUncheckedCreateWithoutDemoVideoInput> | ShortDemoCreateWithoutDemoVideoInput[] | ShortDemoUncheckedCreateWithoutDemoVideoInput[]
    connectOrCreate?: ShortDemoCreateOrConnectWithoutDemoVideoInput | ShortDemoCreateOrConnectWithoutDemoVideoInput[]
    createMany?: ShortDemoCreateManyDemoVideoInputEnvelope
    connect?: ShortDemoWhereUniqueInput | ShortDemoWhereUniqueInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ShortDemoUpdateManyWithoutDemoVideoNestedInput = {
    create?: XOR<ShortDemoCreateWithoutDemoVideoInput, ShortDemoUncheckedCreateWithoutDemoVideoInput> | ShortDemoCreateWithoutDemoVideoInput[] | ShortDemoUncheckedCreateWithoutDemoVideoInput[]
    connectOrCreate?: ShortDemoCreateOrConnectWithoutDemoVideoInput | ShortDemoCreateOrConnectWithoutDemoVideoInput[]
    upsert?: ShortDemoUpsertWithWhereUniqueWithoutDemoVideoInput | ShortDemoUpsertWithWhereUniqueWithoutDemoVideoInput[]
    createMany?: ShortDemoCreateManyDemoVideoInputEnvelope
    set?: ShortDemoWhereUniqueInput | ShortDemoWhereUniqueInput[]
    disconnect?: ShortDemoWhereUniqueInput | ShortDemoWhereUniqueInput[]
    delete?: ShortDemoWhereUniqueInput | ShortDemoWhereUniqueInput[]
    connect?: ShortDemoWhereUniqueInput | ShortDemoWhereUniqueInput[]
    update?: ShortDemoUpdateWithWhereUniqueWithoutDemoVideoInput | ShortDemoUpdateWithWhereUniqueWithoutDemoVideoInput[]
    updateMany?: ShortDemoUpdateManyWithWhereWithoutDemoVideoInput | ShortDemoUpdateManyWithWhereWithoutDemoVideoInput[]
    deleteMany?: ShortDemoScalarWhereInput | ShortDemoScalarWhereInput[]
  }

  export type ShortDemoUncheckedUpdateManyWithoutDemoVideoNestedInput = {
    create?: XOR<ShortDemoCreateWithoutDemoVideoInput, ShortDemoUncheckedCreateWithoutDemoVideoInput> | ShortDemoCreateWithoutDemoVideoInput[] | ShortDemoUncheckedCreateWithoutDemoVideoInput[]
    connectOrCreate?: ShortDemoCreateOrConnectWithoutDemoVideoInput | ShortDemoCreateOrConnectWithoutDemoVideoInput[]
    upsert?: ShortDemoUpsertWithWhereUniqueWithoutDemoVideoInput | ShortDemoUpsertWithWhereUniqueWithoutDemoVideoInput[]
    createMany?: ShortDemoCreateManyDemoVideoInputEnvelope
    set?: ShortDemoWhereUniqueInput | ShortDemoWhereUniqueInput[]
    disconnect?: ShortDemoWhereUniqueInput | ShortDemoWhereUniqueInput[]
    delete?: ShortDemoWhereUniqueInput | ShortDemoWhereUniqueInput[]
    connect?: ShortDemoWhereUniqueInput | ShortDemoWhereUniqueInput[]
    update?: ShortDemoUpdateWithWhereUniqueWithoutDemoVideoInput | ShortDemoUpdateWithWhereUniqueWithoutDemoVideoInput[]
    updateMany?: ShortDemoUpdateManyWithWhereWithoutDemoVideoInput | ShortDemoUpdateManyWithWhereWithoutDemoVideoInput[]
    deleteMany?: ShortDemoScalarWhereInput | ShortDemoScalarWhereInput[]
  }

  export type DemoVideoCreateNestedOneWithoutShortDemosInput = {
    create?: XOR<DemoVideoCreateWithoutShortDemosInput, DemoVideoUncheckedCreateWithoutShortDemosInput>
    connectOrCreate?: DemoVideoCreateOrConnectWithoutShortDemosInput
    connect?: DemoVideoWhereUniqueInput
  }

  export type DemoVideoUpdateOneRequiredWithoutShortDemosNestedInput = {
    create?: XOR<DemoVideoCreateWithoutShortDemosInput, DemoVideoUncheckedCreateWithoutShortDemosInput>
    connectOrCreate?: DemoVideoCreateOrConnectWithoutShortDemosInput
    upsert?: DemoVideoUpsertWithoutShortDemosInput
    connect?: DemoVideoWhereUniqueInput
    update?: XOR<XOR<DemoVideoUpdateToOneWithWhereWithoutShortDemosInput, DemoVideoUpdateWithoutShortDemosInput>, DemoVideoUncheckedUpdateWithoutShortDemosInput>
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

  export type ShortDemoCreateWithoutDemoVideoInput = {
    id?: string
    s3Url: string
    durationSeconds: number
    colorPalette?: string | null
    shortDemoInfo?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ShortDemoUncheckedCreateWithoutDemoVideoInput = {
    id?: string
    s3Url: string
    durationSeconds: number
    colorPalette?: string | null
    shortDemoInfo?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ShortDemoCreateOrConnectWithoutDemoVideoInput = {
    where: ShortDemoWhereUniqueInput
    create: XOR<ShortDemoCreateWithoutDemoVideoInput, ShortDemoUncheckedCreateWithoutDemoVideoInput>
  }

  export type ShortDemoCreateManyDemoVideoInputEnvelope = {
    data: ShortDemoCreateManyDemoVideoInput | ShortDemoCreateManyDemoVideoInput[]
    skipDuplicates?: boolean
  }

  export type ShortDemoUpsertWithWhereUniqueWithoutDemoVideoInput = {
    where: ShortDemoWhereUniqueInput
    update: XOR<ShortDemoUpdateWithoutDemoVideoInput, ShortDemoUncheckedUpdateWithoutDemoVideoInput>
    create: XOR<ShortDemoCreateWithoutDemoVideoInput, ShortDemoUncheckedCreateWithoutDemoVideoInput>
  }

  export type ShortDemoUpdateWithWhereUniqueWithoutDemoVideoInput = {
    where: ShortDemoWhereUniqueInput
    data: XOR<ShortDemoUpdateWithoutDemoVideoInput, ShortDemoUncheckedUpdateWithoutDemoVideoInput>
  }

  export type ShortDemoUpdateManyWithWhereWithoutDemoVideoInput = {
    where: ShortDemoScalarWhereInput
    data: XOR<ShortDemoUpdateManyMutationInput, ShortDemoUncheckedUpdateManyWithoutDemoVideoInput>
  }

  export type ShortDemoScalarWhereInput = {
    AND?: ShortDemoScalarWhereInput | ShortDemoScalarWhereInput[]
    OR?: ShortDemoScalarWhereInput[]
    NOT?: ShortDemoScalarWhereInput | ShortDemoScalarWhereInput[]
    id?: StringFilter<"ShortDemo"> | string
    demoVideoId?: StringFilter<"ShortDemo"> | string
    s3Url?: StringFilter<"ShortDemo"> | string
    durationSeconds?: IntFilter<"ShortDemo"> | number
    colorPalette?: StringNullableFilter<"ShortDemo"> | string | null
    shortDemoInfo?: StringNullableFilter<"ShortDemo"> | string | null
    createdAt?: DateTimeFilter<"ShortDemo"> | Date | string
    updatedAt?: DateTimeFilter<"ShortDemo"> | Date | string
  }

  export type DemoVideoCreateWithoutShortDemosInput = {
    id?: string
    s3Url: string
    productInfo?: string | null
    colorPalette?: NullableJsonNullValueInput | InputJsonValue
    durationSeconds: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DemoVideoUncheckedCreateWithoutShortDemosInput = {
    id?: string
    s3Url: string
    productInfo?: string | null
    colorPalette?: NullableJsonNullValueInput | InputJsonValue
    durationSeconds: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DemoVideoCreateOrConnectWithoutShortDemosInput = {
    where: DemoVideoWhereUniqueInput
    create: XOR<DemoVideoCreateWithoutShortDemosInput, DemoVideoUncheckedCreateWithoutShortDemosInput>
  }

  export type DemoVideoUpsertWithoutShortDemosInput = {
    update: XOR<DemoVideoUpdateWithoutShortDemosInput, DemoVideoUncheckedUpdateWithoutShortDemosInput>
    create: XOR<DemoVideoCreateWithoutShortDemosInput, DemoVideoUncheckedCreateWithoutShortDemosInput>
    where?: DemoVideoWhereInput
  }

  export type DemoVideoUpdateToOneWithWhereWithoutShortDemosInput = {
    where?: DemoVideoWhereInput
    data: XOR<DemoVideoUpdateWithoutShortDemosInput, DemoVideoUncheckedUpdateWithoutShortDemosInput>
  }

  export type DemoVideoUpdateWithoutShortDemosInput = {
    id?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    productInfo?: NullableStringFieldUpdateOperationsInput | string | null
    colorPalette?: NullableJsonNullValueInput | InputJsonValue
    durationSeconds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DemoVideoUncheckedUpdateWithoutShortDemosInput = {
    id?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    productInfo?: NullableStringFieldUpdateOperationsInput | string | null
    colorPalette?: NullableJsonNullValueInput | InputJsonValue
    durationSeconds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ShortDemoCreateManyDemoVideoInput = {
    id?: string
    s3Url: string
    durationSeconds: number
    colorPalette?: string | null
    shortDemoInfo?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ShortDemoUpdateWithoutDemoVideoInput = {
    id?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    durationSeconds?: IntFieldUpdateOperationsInput | number
    colorPalette?: NullableStringFieldUpdateOperationsInput | string | null
    shortDemoInfo?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ShortDemoUncheckedUpdateWithoutDemoVideoInput = {
    id?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    durationSeconds?: IntFieldUpdateOperationsInput | number
    colorPalette?: NullableStringFieldUpdateOperationsInput | string | null
    shortDemoInfo?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ShortDemoUncheckedUpdateManyWithoutDemoVideoInput = {
    id?: StringFieldUpdateOperationsInput | string
    s3Url?: StringFieldUpdateOperationsInput | string
    durationSeconds?: IntFieldUpdateOperationsInput | number
    colorPalette?: NullableStringFieldUpdateOperationsInput | string | null
    shortDemoInfo?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
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
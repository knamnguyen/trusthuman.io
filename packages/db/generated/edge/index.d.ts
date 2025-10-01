
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
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model LinkedInAccount
 * 
 */
export type LinkedInAccount = $Result.DefaultSelection<Prisma.$LinkedInAccountPayload>
/**
 * Model ProfileImportRun
 * 
 */
export type ProfileImportRun = $Result.DefaultSelection<Prisma.$ProfileImportRunPayload>
/**
 * Model LinkedInProfile
 * 
 */
export type LinkedInProfile = $Result.DefaultSelection<Prisma.$LinkedInProfilePayload>

/**
 * Enums
 */
export namespace $Enums {
  export const AccessType: {
  FREE: 'FREE',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY'
};

export type AccessType = (typeof AccessType)[keyof typeof AccessType]


export const ImportStatus: {
  NOT_STARTED: 'NOT_STARTED',
  RUNNING: 'RUNNING',
  FINISHED: 'FINISHED'
};

export type ImportStatus = (typeof ImportStatus)[keyof typeof ImportStatus]

}

export type AccessType = $Enums.AccessType

export const AccessType: typeof $Enums.AccessType

export type ImportStatus = $Enums.ImportStatus

export const ImportStatus: typeof $Enums.ImportStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
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
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
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
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.linkedInAccount`: Exposes CRUD operations for the **LinkedInAccount** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more LinkedInAccounts
    * const linkedInAccounts = await prisma.linkedInAccount.findMany()
    * ```
    */
  get linkedInAccount(): Prisma.LinkedInAccountDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.profileImportRun`: Exposes CRUD operations for the **ProfileImportRun** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ProfileImportRuns
    * const profileImportRuns = await prisma.profileImportRun.findMany()
    * ```
    */
  get profileImportRun(): Prisma.ProfileImportRunDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.linkedInProfile`: Exposes CRUD operations for the **LinkedInProfile** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more LinkedInProfiles
    * const linkedInProfiles = await prisma.linkedInProfile.findMany()
    * ```
    */
  get linkedInProfile(): Prisma.LinkedInProfileDelegate<ExtArgs, ClientOptions>;
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
   * Prisma Client JS version: 6.10.1
   * Query Engine version: 9b628578b3b7cae625e8c927178f15a170e74a9c
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
    User: 'User',
    LinkedInAccount: 'LinkedInAccount',
    ProfileImportRun: 'ProfileImportRun',
    LinkedInProfile: 'LinkedInProfile'
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
      modelProps: "user" | "linkedInAccount" | "profileImportRun" | "linkedInProfile"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
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
      LinkedInAccount: {
        payload: Prisma.$LinkedInAccountPayload<ExtArgs>
        fields: Prisma.LinkedInAccountFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LinkedInAccountFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInAccountPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LinkedInAccountFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInAccountPayload>
          }
          findFirst: {
            args: Prisma.LinkedInAccountFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInAccountPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LinkedInAccountFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInAccountPayload>
          }
          findMany: {
            args: Prisma.LinkedInAccountFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInAccountPayload>[]
          }
          create: {
            args: Prisma.LinkedInAccountCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInAccountPayload>
          }
          createMany: {
            args: Prisma.LinkedInAccountCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LinkedInAccountCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInAccountPayload>[]
          }
          delete: {
            args: Prisma.LinkedInAccountDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInAccountPayload>
          }
          update: {
            args: Prisma.LinkedInAccountUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInAccountPayload>
          }
          deleteMany: {
            args: Prisma.LinkedInAccountDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LinkedInAccountUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LinkedInAccountUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInAccountPayload>[]
          }
          upsert: {
            args: Prisma.LinkedInAccountUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInAccountPayload>
          }
          aggregate: {
            args: Prisma.LinkedInAccountAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLinkedInAccount>
          }
          groupBy: {
            args: Prisma.LinkedInAccountGroupByArgs<ExtArgs>
            result: $Utils.Optional<LinkedInAccountGroupByOutputType>[]
          }
          count: {
            args: Prisma.LinkedInAccountCountArgs<ExtArgs>
            result: $Utils.Optional<LinkedInAccountCountAggregateOutputType> | number
          }
        }
      }
      ProfileImportRun: {
        payload: Prisma.$ProfileImportRunPayload<ExtArgs>
        fields: Prisma.ProfileImportRunFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProfileImportRunFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfileImportRunPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProfileImportRunFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfileImportRunPayload>
          }
          findFirst: {
            args: Prisma.ProfileImportRunFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfileImportRunPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProfileImportRunFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfileImportRunPayload>
          }
          findMany: {
            args: Prisma.ProfileImportRunFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfileImportRunPayload>[]
          }
          create: {
            args: Prisma.ProfileImportRunCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfileImportRunPayload>
          }
          createMany: {
            args: Prisma.ProfileImportRunCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProfileImportRunCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfileImportRunPayload>[]
          }
          delete: {
            args: Prisma.ProfileImportRunDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfileImportRunPayload>
          }
          update: {
            args: Prisma.ProfileImportRunUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfileImportRunPayload>
          }
          deleteMany: {
            args: Prisma.ProfileImportRunDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProfileImportRunUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProfileImportRunUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfileImportRunPayload>[]
          }
          upsert: {
            args: Prisma.ProfileImportRunUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfileImportRunPayload>
          }
          aggregate: {
            args: Prisma.ProfileImportRunAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProfileImportRun>
          }
          groupBy: {
            args: Prisma.ProfileImportRunGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProfileImportRunGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProfileImportRunCountArgs<ExtArgs>
            result: $Utils.Optional<ProfileImportRunCountAggregateOutputType> | number
          }
        }
      }
      LinkedInProfile: {
        payload: Prisma.$LinkedInProfilePayload<ExtArgs>
        fields: Prisma.LinkedInProfileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LinkedInProfileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInProfilePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LinkedInProfileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInProfilePayload>
          }
          findFirst: {
            args: Prisma.LinkedInProfileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInProfilePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LinkedInProfileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInProfilePayload>
          }
          findMany: {
            args: Prisma.LinkedInProfileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInProfilePayload>[]
          }
          create: {
            args: Prisma.LinkedInProfileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInProfilePayload>
          }
          createMany: {
            args: Prisma.LinkedInProfileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LinkedInProfileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInProfilePayload>[]
          }
          delete: {
            args: Prisma.LinkedInProfileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInProfilePayload>
          }
          update: {
            args: Prisma.LinkedInProfileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInProfilePayload>
          }
          deleteMany: {
            args: Prisma.LinkedInProfileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LinkedInProfileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LinkedInProfileUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInProfilePayload>[]
          }
          upsert: {
            args: Prisma.LinkedInProfileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LinkedInProfilePayload>
          }
          aggregate: {
            args: Prisma.LinkedInProfileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLinkedInProfile>
          }
          groupBy: {
            args: Prisma.LinkedInProfileGroupByArgs<ExtArgs>
            result: $Utils.Optional<LinkedInProfileGroupByOutputType>[]
          }
          count: {
            args: Prisma.LinkedInProfileCountArgs<ExtArgs>
            result: $Utils.Optional<LinkedInProfileCountAggregateOutputType> | number
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
    user?: UserOmit
    linkedInAccount?: LinkedInAccountOmit
    profileImportRun?: ProfileImportRunOmit
    linkedInProfile?: LinkedInProfileOmit
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
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    profileImportRuns: number
    linkedInAccounts: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    profileImportRuns?: boolean | UserCountOutputTypeCountProfileImportRunsArgs
    linkedInAccounts?: boolean | UserCountOutputTypeCountLinkedInAccountsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountProfileImportRunsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProfileImportRunWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountLinkedInAccountsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LinkedInAccountWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    dailyAIcomments: number | null
  }

  export type UserSumAggregateOutputType = {
    dailyAIcomments: number | null
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
    dailyAIcomments: number | null
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
    dailyAIcomments: number | null
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
    dailyAIcomments: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    dailyAIcomments?: true
  }

  export type UserSumAggregateInputType = {
    dailyAIcomments?: true
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
    dailyAIcomments?: true
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
    dailyAIcomments?: true
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
    dailyAIcomments?: true
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
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
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
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    firstName: string | null
    lastName: string | null
    username: string | null
    primaryEmailAddress: string
    imageUrl: string | null
    clerkUserProperties: JsonValue | null
    stripeCustomerId: string | null
    accessType: $Enums.AccessType
    stripeUserProperties: JsonValue | null
    dailyAIcomments: number
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
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
    dailyAIcomments?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    profileImportRuns?: boolean | User$profileImportRunsArgs<ExtArgs>
    linkedInAccounts?: boolean | User$linkedInAccountsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
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
    dailyAIcomments?: boolean
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
    dailyAIcomments?: boolean
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
    dailyAIcomments?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "firstName" | "lastName" | "username" | "primaryEmailAddress" | "imageUrl" | "clerkUserProperties" | "stripeCustomerId" | "accessType" | "stripeUserProperties" | "dailyAIcomments" | "createdAt" | "updatedAt", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    profileImportRuns?: boolean | User$profileImportRunsArgs<ExtArgs>
    linkedInAccounts?: boolean | User$linkedInAccountsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      profileImportRuns: Prisma.$ProfileImportRunPayload<ExtArgs>[]
      linkedInAccounts: Prisma.$LinkedInAccountPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      firstName: string | null
      lastName: string | null
      username: string | null
      primaryEmailAddress: string
      imageUrl: string | null
      clerkUserProperties: Prisma.JsonValue | null
      stripeCustomerId: string | null
      accessType: $Enums.AccessType
      stripeUserProperties: Prisma.JsonValue | null
      dailyAIcomments: number
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
    profileImportRuns<T extends User$profileImportRunsArgs<ExtArgs> = {}>(args?: Subset<T, User$profileImportRunsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProfileImportRunPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    linkedInAccounts<T extends User$linkedInAccountsArgs<ExtArgs> = {}>(args?: Subset<T, User$linkedInAccountsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LinkedInAccountPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
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
    readonly dailyAIcomments: FieldRef<"User", 'Int'>
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
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
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
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
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
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
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
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
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
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
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
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
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
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
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
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
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
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
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
   * User.profileImportRuns
   */
  export type User$profileImportRunsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProfileImportRun
     */
    select?: ProfileImportRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProfileImportRun
     */
    omit?: ProfileImportRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileImportRunInclude<ExtArgs> | null
    where?: ProfileImportRunWhereInput
    orderBy?: ProfileImportRunOrderByWithRelationInput | ProfileImportRunOrderByWithRelationInput[]
    cursor?: ProfileImportRunWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ProfileImportRunScalarFieldEnum | ProfileImportRunScalarFieldEnum[]
  }

  /**
   * User.linkedInAccounts
   */
  export type User$linkedInAccountsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInAccount
     */
    select?: LinkedInAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInAccount
     */
    omit?: LinkedInAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkedInAccountInclude<ExtArgs> | null
    where?: LinkedInAccountWhereInput
    orderBy?: LinkedInAccountOrderByWithRelationInput | LinkedInAccountOrderByWithRelationInput[]
    cursor?: LinkedInAccountWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LinkedInAccountScalarFieldEnum | LinkedInAccountScalarFieldEnum[]
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
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model LinkedInAccount
   */

  export type AggregateLinkedInAccount = {
    _count: LinkedInAccountCountAggregateOutputType | null
    _min: LinkedInAccountMinAggregateOutputType | null
    _max: LinkedInAccountMaxAggregateOutputType | null
  }

  export type LinkedInAccountMinAggregateOutputType = {
    id: string | null
    userId: string | null
    username: string | null
    encryptedPassword: string | null
    twoFactorySecretKey: string | null
    createdAt: Date | null
    staticIp: string | null
  }

  export type LinkedInAccountMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    username: string | null
    encryptedPassword: string | null
    twoFactorySecretKey: string | null
    createdAt: Date | null
    staticIp: string | null
  }

  export type LinkedInAccountCountAggregateOutputType = {
    id: number
    userId: number
    username: number
    encryptedPassword: number
    twoFactorySecretKey: number
    createdAt: number
    staticIp: number
    _all: number
  }


  export type LinkedInAccountMinAggregateInputType = {
    id?: true
    userId?: true
    username?: true
    encryptedPassword?: true
    twoFactorySecretKey?: true
    createdAt?: true
    staticIp?: true
  }

  export type LinkedInAccountMaxAggregateInputType = {
    id?: true
    userId?: true
    username?: true
    encryptedPassword?: true
    twoFactorySecretKey?: true
    createdAt?: true
    staticIp?: true
  }

  export type LinkedInAccountCountAggregateInputType = {
    id?: true
    userId?: true
    username?: true
    encryptedPassword?: true
    twoFactorySecretKey?: true
    createdAt?: true
    staticIp?: true
    _all?: true
  }

  export type LinkedInAccountAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LinkedInAccount to aggregate.
     */
    where?: LinkedInAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LinkedInAccounts to fetch.
     */
    orderBy?: LinkedInAccountOrderByWithRelationInput | LinkedInAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LinkedInAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LinkedInAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LinkedInAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned LinkedInAccounts
    **/
    _count?: true | LinkedInAccountCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LinkedInAccountMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LinkedInAccountMaxAggregateInputType
  }

  export type GetLinkedInAccountAggregateType<T extends LinkedInAccountAggregateArgs> = {
        [P in keyof T & keyof AggregateLinkedInAccount]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLinkedInAccount[P]>
      : GetScalarType<T[P], AggregateLinkedInAccount[P]>
  }




  export type LinkedInAccountGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LinkedInAccountWhereInput
    orderBy?: LinkedInAccountOrderByWithAggregationInput | LinkedInAccountOrderByWithAggregationInput[]
    by: LinkedInAccountScalarFieldEnum[] | LinkedInAccountScalarFieldEnum
    having?: LinkedInAccountScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LinkedInAccountCountAggregateInputType | true
    _min?: LinkedInAccountMinAggregateInputType
    _max?: LinkedInAccountMaxAggregateInputType
  }

  export type LinkedInAccountGroupByOutputType = {
    id: string
    userId: string
    username: string
    encryptedPassword: string
    twoFactorySecretKey: string
    createdAt: Date
    staticIp: string | null
    _count: LinkedInAccountCountAggregateOutputType | null
    _min: LinkedInAccountMinAggregateOutputType | null
    _max: LinkedInAccountMaxAggregateOutputType | null
  }

  type GetLinkedInAccountGroupByPayload<T extends LinkedInAccountGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LinkedInAccountGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LinkedInAccountGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LinkedInAccountGroupByOutputType[P]>
            : GetScalarType<T[P], LinkedInAccountGroupByOutputType[P]>
        }
      >
    >


  export type LinkedInAccountSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    username?: boolean
    encryptedPassword?: boolean
    twoFactorySecretKey?: boolean
    createdAt?: boolean
    staticIp?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["linkedInAccount"]>

  export type LinkedInAccountSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    username?: boolean
    encryptedPassword?: boolean
    twoFactorySecretKey?: boolean
    createdAt?: boolean
    staticIp?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["linkedInAccount"]>

  export type LinkedInAccountSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    username?: boolean
    encryptedPassword?: boolean
    twoFactorySecretKey?: boolean
    createdAt?: boolean
    staticIp?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["linkedInAccount"]>

  export type LinkedInAccountSelectScalar = {
    id?: boolean
    userId?: boolean
    username?: boolean
    encryptedPassword?: boolean
    twoFactorySecretKey?: boolean
    createdAt?: boolean
    staticIp?: boolean
  }

  export type LinkedInAccountOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "username" | "encryptedPassword" | "twoFactorySecretKey" | "createdAt" | "staticIp", ExtArgs["result"]["linkedInAccount"]>
  export type LinkedInAccountInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type LinkedInAccountIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type LinkedInAccountIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $LinkedInAccountPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "LinkedInAccount"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      username: string
      encryptedPassword: string
      twoFactorySecretKey: string
      createdAt: Date
      staticIp: string | null
    }, ExtArgs["result"]["linkedInAccount"]>
    composites: {}
  }

  type LinkedInAccountGetPayload<S extends boolean | null | undefined | LinkedInAccountDefaultArgs> = $Result.GetResult<Prisma.$LinkedInAccountPayload, S>

  type LinkedInAccountCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LinkedInAccountFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LinkedInAccountCountAggregateInputType | true
    }

  export interface LinkedInAccountDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['LinkedInAccount'], meta: { name: 'LinkedInAccount' } }
    /**
     * Find zero or one LinkedInAccount that matches the filter.
     * @param {LinkedInAccountFindUniqueArgs} args - Arguments to find a LinkedInAccount
     * @example
     * // Get one LinkedInAccount
     * const linkedInAccount = await prisma.linkedInAccount.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LinkedInAccountFindUniqueArgs>(args: SelectSubset<T, LinkedInAccountFindUniqueArgs<ExtArgs>>): Prisma__LinkedInAccountClient<$Result.GetResult<Prisma.$LinkedInAccountPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one LinkedInAccount that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LinkedInAccountFindUniqueOrThrowArgs} args - Arguments to find a LinkedInAccount
     * @example
     * // Get one LinkedInAccount
     * const linkedInAccount = await prisma.linkedInAccount.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LinkedInAccountFindUniqueOrThrowArgs>(args: SelectSubset<T, LinkedInAccountFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LinkedInAccountClient<$Result.GetResult<Prisma.$LinkedInAccountPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first LinkedInAccount that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkedInAccountFindFirstArgs} args - Arguments to find a LinkedInAccount
     * @example
     * // Get one LinkedInAccount
     * const linkedInAccount = await prisma.linkedInAccount.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LinkedInAccountFindFirstArgs>(args?: SelectSubset<T, LinkedInAccountFindFirstArgs<ExtArgs>>): Prisma__LinkedInAccountClient<$Result.GetResult<Prisma.$LinkedInAccountPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first LinkedInAccount that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkedInAccountFindFirstOrThrowArgs} args - Arguments to find a LinkedInAccount
     * @example
     * // Get one LinkedInAccount
     * const linkedInAccount = await prisma.linkedInAccount.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LinkedInAccountFindFirstOrThrowArgs>(args?: SelectSubset<T, LinkedInAccountFindFirstOrThrowArgs<ExtArgs>>): Prisma__LinkedInAccountClient<$Result.GetResult<Prisma.$LinkedInAccountPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more LinkedInAccounts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkedInAccountFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all LinkedInAccounts
     * const linkedInAccounts = await prisma.linkedInAccount.findMany()
     * 
     * // Get first 10 LinkedInAccounts
     * const linkedInAccounts = await prisma.linkedInAccount.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const linkedInAccountWithIdOnly = await prisma.linkedInAccount.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LinkedInAccountFindManyArgs>(args?: SelectSubset<T, LinkedInAccountFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LinkedInAccountPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a LinkedInAccount.
     * @param {LinkedInAccountCreateArgs} args - Arguments to create a LinkedInAccount.
     * @example
     * // Create one LinkedInAccount
     * const LinkedInAccount = await prisma.linkedInAccount.create({
     *   data: {
     *     // ... data to create a LinkedInAccount
     *   }
     * })
     * 
     */
    create<T extends LinkedInAccountCreateArgs>(args: SelectSubset<T, LinkedInAccountCreateArgs<ExtArgs>>): Prisma__LinkedInAccountClient<$Result.GetResult<Prisma.$LinkedInAccountPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many LinkedInAccounts.
     * @param {LinkedInAccountCreateManyArgs} args - Arguments to create many LinkedInAccounts.
     * @example
     * // Create many LinkedInAccounts
     * const linkedInAccount = await prisma.linkedInAccount.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LinkedInAccountCreateManyArgs>(args?: SelectSubset<T, LinkedInAccountCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many LinkedInAccounts and returns the data saved in the database.
     * @param {LinkedInAccountCreateManyAndReturnArgs} args - Arguments to create many LinkedInAccounts.
     * @example
     * // Create many LinkedInAccounts
     * const linkedInAccount = await prisma.linkedInAccount.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many LinkedInAccounts and only return the `id`
     * const linkedInAccountWithIdOnly = await prisma.linkedInAccount.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LinkedInAccountCreateManyAndReturnArgs>(args?: SelectSubset<T, LinkedInAccountCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LinkedInAccountPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a LinkedInAccount.
     * @param {LinkedInAccountDeleteArgs} args - Arguments to delete one LinkedInAccount.
     * @example
     * // Delete one LinkedInAccount
     * const LinkedInAccount = await prisma.linkedInAccount.delete({
     *   where: {
     *     // ... filter to delete one LinkedInAccount
     *   }
     * })
     * 
     */
    delete<T extends LinkedInAccountDeleteArgs>(args: SelectSubset<T, LinkedInAccountDeleteArgs<ExtArgs>>): Prisma__LinkedInAccountClient<$Result.GetResult<Prisma.$LinkedInAccountPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one LinkedInAccount.
     * @param {LinkedInAccountUpdateArgs} args - Arguments to update one LinkedInAccount.
     * @example
     * // Update one LinkedInAccount
     * const linkedInAccount = await prisma.linkedInAccount.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LinkedInAccountUpdateArgs>(args: SelectSubset<T, LinkedInAccountUpdateArgs<ExtArgs>>): Prisma__LinkedInAccountClient<$Result.GetResult<Prisma.$LinkedInAccountPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more LinkedInAccounts.
     * @param {LinkedInAccountDeleteManyArgs} args - Arguments to filter LinkedInAccounts to delete.
     * @example
     * // Delete a few LinkedInAccounts
     * const { count } = await prisma.linkedInAccount.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LinkedInAccountDeleteManyArgs>(args?: SelectSubset<T, LinkedInAccountDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LinkedInAccounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkedInAccountUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many LinkedInAccounts
     * const linkedInAccount = await prisma.linkedInAccount.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LinkedInAccountUpdateManyArgs>(args: SelectSubset<T, LinkedInAccountUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LinkedInAccounts and returns the data updated in the database.
     * @param {LinkedInAccountUpdateManyAndReturnArgs} args - Arguments to update many LinkedInAccounts.
     * @example
     * // Update many LinkedInAccounts
     * const linkedInAccount = await prisma.linkedInAccount.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more LinkedInAccounts and only return the `id`
     * const linkedInAccountWithIdOnly = await prisma.linkedInAccount.updateManyAndReturn({
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
    updateManyAndReturn<T extends LinkedInAccountUpdateManyAndReturnArgs>(args: SelectSubset<T, LinkedInAccountUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LinkedInAccountPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one LinkedInAccount.
     * @param {LinkedInAccountUpsertArgs} args - Arguments to update or create a LinkedInAccount.
     * @example
     * // Update or create a LinkedInAccount
     * const linkedInAccount = await prisma.linkedInAccount.upsert({
     *   create: {
     *     // ... data to create a LinkedInAccount
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the LinkedInAccount we want to update
     *   }
     * })
     */
    upsert<T extends LinkedInAccountUpsertArgs>(args: SelectSubset<T, LinkedInAccountUpsertArgs<ExtArgs>>): Prisma__LinkedInAccountClient<$Result.GetResult<Prisma.$LinkedInAccountPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of LinkedInAccounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkedInAccountCountArgs} args - Arguments to filter LinkedInAccounts to count.
     * @example
     * // Count the number of LinkedInAccounts
     * const count = await prisma.linkedInAccount.count({
     *   where: {
     *     // ... the filter for the LinkedInAccounts we want to count
     *   }
     * })
    **/
    count<T extends LinkedInAccountCountArgs>(
      args?: Subset<T, LinkedInAccountCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LinkedInAccountCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a LinkedInAccount.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkedInAccountAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends LinkedInAccountAggregateArgs>(args: Subset<T, LinkedInAccountAggregateArgs>): Prisma.PrismaPromise<GetLinkedInAccountAggregateType<T>>

    /**
     * Group by LinkedInAccount.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkedInAccountGroupByArgs} args - Group by arguments.
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
      T extends LinkedInAccountGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LinkedInAccountGroupByArgs['orderBy'] }
        : { orderBy?: LinkedInAccountGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, LinkedInAccountGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLinkedInAccountGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the LinkedInAccount model
   */
  readonly fields: LinkedInAccountFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for LinkedInAccount.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LinkedInAccountClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
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
   * Fields of the LinkedInAccount model
   */
  interface LinkedInAccountFieldRefs {
    readonly id: FieldRef<"LinkedInAccount", 'String'>
    readonly userId: FieldRef<"LinkedInAccount", 'String'>
    readonly username: FieldRef<"LinkedInAccount", 'String'>
    readonly encryptedPassword: FieldRef<"LinkedInAccount", 'String'>
    readonly twoFactorySecretKey: FieldRef<"LinkedInAccount", 'String'>
    readonly createdAt: FieldRef<"LinkedInAccount", 'DateTime'>
    readonly staticIp: FieldRef<"LinkedInAccount", 'String'>
  }
    

  // Custom InputTypes
  /**
   * LinkedInAccount findUnique
   */
  export type LinkedInAccountFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInAccount
     */
    select?: LinkedInAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInAccount
     */
    omit?: LinkedInAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkedInAccountInclude<ExtArgs> | null
    /**
     * Filter, which LinkedInAccount to fetch.
     */
    where: LinkedInAccountWhereUniqueInput
  }

  /**
   * LinkedInAccount findUniqueOrThrow
   */
  export type LinkedInAccountFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInAccount
     */
    select?: LinkedInAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInAccount
     */
    omit?: LinkedInAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkedInAccountInclude<ExtArgs> | null
    /**
     * Filter, which LinkedInAccount to fetch.
     */
    where: LinkedInAccountWhereUniqueInput
  }

  /**
   * LinkedInAccount findFirst
   */
  export type LinkedInAccountFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInAccount
     */
    select?: LinkedInAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInAccount
     */
    omit?: LinkedInAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkedInAccountInclude<ExtArgs> | null
    /**
     * Filter, which LinkedInAccount to fetch.
     */
    where?: LinkedInAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LinkedInAccounts to fetch.
     */
    orderBy?: LinkedInAccountOrderByWithRelationInput | LinkedInAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LinkedInAccounts.
     */
    cursor?: LinkedInAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LinkedInAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LinkedInAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LinkedInAccounts.
     */
    distinct?: LinkedInAccountScalarFieldEnum | LinkedInAccountScalarFieldEnum[]
  }

  /**
   * LinkedInAccount findFirstOrThrow
   */
  export type LinkedInAccountFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInAccount
     */
    select?: LinkedInAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInAccount
     */
    omit?: LinkedInAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkedInAccountInclude<ExtArgs> | null
    /**
     * Filter, which LinkedInAccount to fetch.
     */
    where?: LinkedInAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LinkedInAccounts to fetch.
     */
    orderBy?: LinkedInAccountOrderByWithRelationInput | LinkedInAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LinkedInAccounts.
     */
    cursor?: LinkedInAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LinkedInAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LinkedInAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LinkedInAccounts.
     */
    distinct?: LinkedInAccountScalarFieldEnum | LinkedInAccountScalarFieldEnum[]
  }

  /**
   * LinkedInAccount findMany
   */
  export type LinkedInAccountFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInAccount
     */
    select?: LinkedInAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInAccount
     */
    omit?: LinkedInAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkedInAccountInclude<ExtArgs> | null
    /**
     * Filter, which LinkedInAccounts to fetch.
     */
    where?: LinkedInAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LinkedInAccounts to fetch.
     */
    orderBy?: LinkedInAccountOrderByWithRelationInput | LinkedInAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing LinkedInAccounts.
     */
    cursor?: LinkedInAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LinkedInAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LinkedInAccounts.
     */
    skip?: number
    distinct?: LinkedInAccountScalarFieldEnum | LinkedInAccountScalarFieldEnum[]
  }

  /**
   * LinkedInAccount create
   */
  export type LinkedInAccountCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInAccount
     */
    select?: LinkedInAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInAccount
     */
    omit?: LinkedInAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkedInAccountInclude<ExtArgs> | null
    /**
     * The data needed to create a LinkedInAccount.
     */
    data: XOR<LinkedInAccountCreateInput, LinkedInAccountUncheckedCreateInput>
  }

  /**
   * LinkedInAccount createMany
   */
  export type LinkedInAccountCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many LinkedInAccounts.
     */
    data: LinkedInAccountCreateManyInput | LinkedInAccountCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * LinkedInAccount createManyAndReturn
   */
  export type LinkedInAccountCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInAccount
     */
    select?: LinkedInAccountSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInAccount
     */
    omit?: LinkedInAccountOmit<ExtArgs> | null
    /**
     * The data used to create many LinkedInAccounts.
     */
    data: LinkedInAccountCreateManyInput | LinkedInAccountCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkedInAccountIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * LinkedInAccount update
   */
  export type LinkedInAccountUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInAccount
     */
    select?: LinkedInAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInAccount
     */
    omit?: LinkedInAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkedInAccountInclude<ExtArgs> | null
    /**
     * The data needed to update a LinkedInAccount.
     */
    data: XOR<LinkedInAccountUpdateInput, LinkedInAccountUncheckedUpdateInput>
    /**
     * Choose, which LinkedInAccount to update.
     */
    where: LinkedInAccountWhereUniqueInput
  }

  /**
   * LinkedInAccount updateMany
   */
  export type LinkedInAccountUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update LinkedInAccounts.
     */
    data: XOR<LinkedInAccountUpdateManyMutationInput, LinkedInAccountUncheckedUpdateManyInput>
    /**
     * Filter which LinkedInAccounts to update
     */
    where?: LinkedInAccountWhereInput
    /**
     * Limit how many LinkedInAccounts to update.
     */
    limit?: number
  }

  /**
   * LinkedInAccount updateManyAndReturn
   */
  export type LinkedInAccountUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInAccount
     */
    select?: LinkedInAccountSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInAccount
     */
    omit?: LinkedInAccountOmit<ExtArgs> | null
    /**
     * The data used to update LinkedInAccounts.
     */
    data: XOR<LinkedInAccountUpdateManyMutationInput, LinkedInAccountUncheckedUpdateManyInput>
    /**
     * Filter which LinkedInAccounts to update
     */
    where?: LinkedInAccountWhereInput
    /**
     * Limit how many LinkedInAccounts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkedInAccountIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * LinkedInAccount upsert
   */
  export type LinkedInAccountUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInAccount
     */
    select?: LinkedInAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInAccount
     */
    omit?: LinkedInAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkedInAccountInclude<ExtArgs> | null
    /**
     * The filter to search for the LinkedInAccount to update in case it exists.
     */
    where: LinkedInAccountWhereUniqueInput
    /**
     * In case the LinkedInAccount found by the `where` argument doesn't exist, create a new LinkedInAccount with this data.
     */
    create: XOR<LinkedInAccountCreateInput, LinkedInAccountUncheckedCreateInput>
    /**
     * In case the LinkedInAccount was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LinkedInAccountUpdateInput, LinkedInAccountUncheckedUpdateInput>
  }

  /**
   * LinkedInAccount delete
   */
  export type LinkedInAccountDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInAccount
     */
    select?: LinkedInAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInAccount
     */
    omit?: LinkedInAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkedInAccountInclude<ExtArgs> | null
    /**
     * Filter which LinkedInAccount to delete.
     */
    where: LinkedInAccountWhereUniqueInput
  }

  /**
   * LinkedInAccount deleteMany
   */
  export type LinkedInAccountDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LinkedInAccounts to delete
     */
    where?: LinkedInAccountWhereInput
    /**
     * Limit how many LinkedInAccounts to delete.
     */
    limit?: number
  }

  /**
   * LinkedInAccount without action
   */
  export type LinkedInAccountDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInAccount
     */
    select?: LinkedInAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInAccount
     */
    omit?: LinkedInAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LinkedInAccountInclude<ExtArgs> | null
  }


  /**
   * Model ProfileImportRun
   */

  export type AggregateProfileImportRun = {
    _count: ProfileImportRunCountAggregateOutputType | null
    _min: ProfileImportRunMinAggregateOutputType | null
    _max: ProfileImportRunMaxAggregateOutputType | null
  }

  export type ProfileImportRunMinAggregateOutputType = {
    id: string | null
    userId: string | null
    status: $Enums.ImportStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ProfileImportRunMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    status: $Enums.ImportStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ProfileImportRunCountAggregateOutputType = {
    id: number
    userId: number
    urls: number
    status: number
    urlsSucceeded: number
    urlsFailed: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ProfileImportRunMinAggregateInputType = {
    id?: true
    userId?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ProfileImportRunMaxAggregateInputType = {
    id?: true
    userId?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ProfileImportRunCountAggregateInputType = {
    id?: true
    userId?: true
    urls?: true
    status?: true
    urlsSucceeded?: true
    urlsFailed?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ProfileImportRunAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProfileImportRun to aggregate.
     */
    where?: ProfileImportRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProfileImportRuns to fetch.
     */
    orderBy?: ProfileImportRunOrderByWithRelationInput | ProfileImportRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProfileImportRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProfileImportRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProfileImportRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ProfileImportRuns
    **/
    _count?: true | ProfileImportRunCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProfileImportRunMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProfileImportRunMaxAggregateInputType
  }

  export type GetProfileImportRunAggregateType<T extends ProfileImportRunAggregateArgs> = {
        [P in keyof T & keyof AggregateProfileImportRun]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProfileImportRun[P]>
      : GetScalarType<T[P], AggregateProfileImportRun[P]>
  }




  export type ProfileImportRunGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProfileImportRunWhereInput
    orderBy?: ProfileImportRunOrderByWithAggregationInput | ProfileImportRunOrderByWithAggregationInput[]
    by: ProfileImportRunScalarFieldEnum[] | ProfileImportRunScalarFieldEnum
    having?: ProfileImportRunScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProfileImportRunCountAggregateInputType | true
    _min?: ProfileImportRunMinAggregateInputType
    _max?: ProfileImportRunMaxAggregateInputType
  }

  export type ProfileImportRunGroupByOutputType = {
    id: string
    userId: string
    urls: string[]
    status: $Enums.ImportStatus
    urlsSucceeded: string[]
    urlsFailed: string[]
    createdAt: Date
    updatedAt: Date
    _count: ProfileImportRunCountAggregateOutputType | null
    _min: ProfileImportRunMinAggregateOutputType | null
    _max: ProfileImportRunMaxAggregateOutputType | null
  }

  type GetProfileImportRunGroupByPayload<T extends ProfileImportRunGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProfileImportRunGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProfileImportRunGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProfileImportRunGroupByOutputType[P]>
            : GetScalarType<T[P], ProfileImportRunGroupByOutputType[P]>
        }
      >
    >


  export type ProfileImportRunSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    urls?: boolean
    status?: boolean
    urlsSucceeded?: boolean
    urlsFailed?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["profileImportRun"]>

  export type ProfileImportRunSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    urls?: boolean
    status?: boolean
    urlsSucceeded?: boolean
    urlsFailed?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["profileImportRun"]>

  export type ProfileImportRunSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    urls?: boolean
    status?: boolean
    urlsSucceeded?: boolean
    urlsFailed?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["profileImportRun"]>

  export type ProfileImportRunSelectScalar = {
    id?: boolean
    userId?: boolean
    urls?: boolean
    status?: boolean
    urlsSucceeded?: boolean
    urlsFailed?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ProfileImportRunOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "urls" | "status" | "urlsSucceeded" | "urlsFailed" | "createdAt" | "updatedAt", ExtArgs["result"]["profileImportRun"]>
  export type ProfileImportRunInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type ProfileImportRunIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type ProfileImportRunIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $ProfileImportRunPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ProfileImportRun"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      urls: string[]
      status: $Enums.ImportStatus
      urlsSucceeded: string[]
      urlsFailed: string[]
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["profileImportRun"]>
    composites: {}
  }

  type ProfileImportRunGetPayload<S extends boolean | null | undefined | ProfileImportRunDefaultArgs> = $Result.GetResult<Prisma.$ProfileImportRunPayload, S>

  type ProfileImportRunCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProfileImportRunFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ProfileImportRunCountAggregateInputType | true
    }

  export interface ProfileImportRunDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ProfileImportRun'], meta: { name: 'ProfileImportRun' } }
    /**
     * Find zero or one ProfileImportRun that matches the filter.
     * @param {ProfileImportRunFindUniqueArgs} args - Arguments to find a ProfileImportRun
     * @example
     * // Get one ProfileImportRun
     * const profileImportRun = await prisma.profileImportRun.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProfileImportRunFindUniqueArgs>(args: SelectSubset<T, ProfileImportRunFindUniqueArgs<ExtArgs>>): Prisma__ProfileImportRunClient<$Result.GetResult<Prisma.$ProfileImportRunPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ProfileImportRun that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProfileImportRunFindUniqueOrThrowArgs} args - Arguments to find a ProfileImportRun
     * @example
     * // Get one ProfileImportRun
     * const profileImportRun = await prisma.profileImportRun.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProfileImportRunFindUniqueOrThrowArgs>(args: SelectSubset<T, ProfileImportRunFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProfileImportRunClient<$Result.GetResult<Prisma.$ProfileImportRunPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ProfileImportRun that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileImportRunFindFirstArgs} args - Arguments to find a ProfileImportRun
     * @example
     * // Get one ProfileImportRun
     * const profileImportRun = await prisma.profileImportRun.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProfileImportRunFindFirstArgs>(args?: SelectSubset<T, ProfileImportRunFindFirstArgs<ExtArgs>>): Prisma__ProfileImportRunClient<$Result.GetResult<Prisma.$ProfileImportRunPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ProfileImportRun that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileImportRunFindFirstOrThrowArgs} args - Arguments to find a ProfileImportRun
     * @example
     * // Get one ProfileImportRun
     * const profileImportRun = await prisma.profileImportRun.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProfileImportRunFindFirstOrThrowArgs>(args?: SelectSubset<T, ProfileImportRunFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProfileImportRunClient<$Result.GetResult<Prisma.$ProfileImportRunPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ProfileImportRuns that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileImportRunFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ProfileImportRuns
     * const profileImportRuns = await prisma.profileImportRun.findMany()
     * 
     * // Get first 10 ProfileImportRuns
     * const profileImportRuns = await prisma.profileImportRun.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const profileImportRunWithIdOnly = await prisma.profileImportRun.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProfileImportRunFindManyArgs>(args?: SelectSubset<T, ProfileImportRunFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProfileImportRunPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ProfileImportRun.
     * @param {ProfileImportRunCreateArgs} args - Arguments to create a ProfileImportRun.
     * @example
     * // Create one ProfileImportRun
     * const ProfileImportRun = await prisma.profileImportRun.create({
     *   data: {
     *     // ... data to create a ProfileImportRun
     *   }
     * })
     * 
     */
    create<T extends ProfileImportRunCreateArgs>(args: SelectSubset<T, ProfileImportRunCreateArgs<ExtArgs>>): Prisma__ProfileImportRunClient<$Result.GetResult<Prisma.$ProfileImportRunPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ProfileImportRuns.
     * @param {ProfileImportRunCreateManyArgs} args - Arguments to create many ProfileImportRuns.
     * @example
     * // Create many ProfileImportRuns
     * const profileImportRun = await prisma.profileImportRun.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProfileImportRunCreateManyArgs>(args?: SelectSubset<T, ProfileImportRunCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ProfileImportRuns and returns the data saved in the database.
     * @param {ProfileImportRunCreateManyAndReturnArgs} args - Arguments to create many ProfileImportRuns.
     * @example
     * // Create many ProfileImportRuns
     * const profileImportRun = await prisma.profileImportRun.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ProfileImportRuns and only return the `id`
     * const profileImportRunWithIdOnly = await prisma.profileImportRun.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProfileImportRunCreateManyAndReturnArgs>(args?: SelectSubset<T, ProfileImportRunCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProfileImportRunPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ProfileImportRun.
     * @param {ProfileImportRunDeleteArgs} args - Arguments to delete one ProfileImportRun.
     * @example
     * // Delete one ProfileImportRun
     * const ProfileImportRun = await prisma.profileImportRun.delete({
     *   where: {
     *     // ... filter to delete one ProfileImportRun
     *   }
     * })
     * 
     */
    delete<T extends ProfileImportRunDeleteArgs>(args: SelectSubset<T, ProfileImportRunDeleteArgs<ExtArgs>>): Prisma__ProfileImportRunClient<$Result.GetResult<Prisma.$ProfileImportRunPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ProfileImportRun.
     * @param {ProfileImportRunUpdateArgs} args - Arguments to update one ProfileImportRun.
     * @example
     * // Update one ProfileImportRun
     * const profileImportRun = await prisma.profileImportRun.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProfileImportRunUpdateArgs>(args: SelectSubset<T, ProfileImportRunUpdateArgs<ExtArgs>>): Prisma__ProfileImportRunClient<$Result.GetResult<Prisma.$ProfileImportRunPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ProfileImportRuns.
     * @param {ProfileImportRunDeleteManyArgs} args - Arguments to filter ProfileImportRuns to delete.
     * @example
     * // Delete a few ProfileImportRuns
     * const { count } = await prisma.profileImportRun.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProfileImportRunDeleteManyArgs>(args?: SelectSubset<T, ProfileImportRunDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProfileImportRuns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileImportRunUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ProfileImportRuns
     * const profileImportRun = await prisma.profileImportRun.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProfileImportRunUpdateManyArgs>(args: SelectSubset<T, ProfileImportRunUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProfileImportRuns and returns the data updated in the database.
     * @param {ProfileImportRunUpdateManyAndReturnArgs} args - Arguments to update many ProfileImportRuns.
     * @example
     * // Update many ProfileImportRuns
     * const profileImportRun = await prisma.profileImportRun.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ProfileImportRuns and only return the `id`
     * const profileImportRunWithIdOnly = await prisma.profileImportRun.updateManyAndReturn({
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
    updateManyAndReturn<T extends ProfileImportRunUpdateManyAndReturnArgs>(args: SelectSubset<T, ProfileImportRunUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProfileImportRunPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ProfileImportRun.
     * @param {ProfileImportRunUpsertArgs} args - Arguments to update or create a ProfileImportRun.
     * @example
     * // Update or create a ProfileImportRun
     * const profileImportRun = await prisma.profileImportRun.upsert({
     *   create: {
     *     // ... data to create a ProfileImportRun
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ProfileImportRun we want to update
     *   }
     * })
     */
    upsert<T extends ProfileImportRunUpsertArgs>(args: SelectSubset<T, ProfileImportRunUpsertArgs<ExtArgs>>): Prisma__ProfileImportRunClient<$Result.GetResult<Prisma.$ProfileImportRunPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ProfileImportRuns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileImportRunCountArgs} args - Arguments to filter ProfileImportRuns to count.
     * @example
     * // Count the number of ProfileImportRuns
     * const count = await prisma.profileImportRun.count({
     *   where: {
     *     // ... the filter for the ProfileImportRuns we want to count
     *   }
     * })
    **/
    count<T extends ProfileImportRunCountArgs>(
      args?: Subset<T, ProfileImportRunCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProfileImportRunCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ProfileImportRun.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileImportRunAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ProfileImportRunAggregateArgs>(args: Subset<T, ProfileImportRunAggregateArgs>): Prisma.PrismaPromise<GetProfileImportRunAggregateType<T>>

    /**
     * Group by ProfileImportRun.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileImportRunGroupByArgs} args - Group by arguments.
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
      T extends ProfileImportRunGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProfileImportRunGroupByArgs['orderBy'] }
        : { orderBy?: ProfileImportRunGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ProfileImportRunGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProfileImportRunGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ProfileImportRun model
   */
  readonly fields: ProfileImportRunFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ProfileImportRun.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProfileImportRunClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
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
   * Fields of the ProfileImportRun model
   */
  interface ProfileImportRunFieldRefs {
    readonly id: FieldRef<"ProfileImportRun", 'String'>
    readonly userId: FieldRef<"ProfileImportRun", 'String'>
    readonly urls: FieldRef<"ProfileImportRun", 'String[]'>
    readonly status: FieldRef<"ProfileImportRun", 'ImportStatus'>
    readonly urlsSucceeded: FieldRef<"ProfileImportRun", 'String[]'>
    readonly urlsFailed: FieldRef<"ProfileImportRun", 'String[]'>
    readonly createdAt: FieldRef<"ProfileImportRun", 'DateTime'>
    readonly updatedAt: FieldRef<"ProfileImportRun", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ProfileImportRun findUnique
   */
  export type ProfileImportRunFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProfileImportRun
     */
    select?: ProfileImportRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProfileImportRun
     */
    omit?: ProfileImportRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileImportRunInclude<ExtArgs> | null
    /**
     * Filter, which ProfileImportRun to fetch.
     */
    where: ProfileImportRunWhereUniqueInput
  }

  /**
   * ProfileImportRun findUniqueOrThrow
   */
  export type ProfileImportRunFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProfileImportRun
     */
    select?: ProfileImportRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProfileImportRun
     */
    omit?: ProfileImportRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileImportRunInclude<ExtArgs> | null
    /**
     * Filter, which ProfileImportRun to fetch.
     */
    where: ProfileImportRunWhereUniqueInput
  }

  /**
   * ProfileImportRun findFirst
   */
  export type ProfileImportRunFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProfileImportRun
     */
    select?: ProfileImportRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProfileImportRun
     */
    omit?: ProfileImportRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileImportRunInclude<ExtArgs> | null
    /**
     * Filter, which ProfileImportRun to fetch.
     */
    where?: ProfileImportRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProfileImportRuns to fetch.
     */
    orderBy?: ProfileImportRunOrderByWithRelationInput | ProfileImportRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProfileImportRuns.
     */
    cursor?: ProfileImportRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProfileImportRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProfileImportRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProfileImportRuns.
     */
    distinct?: ProfileImportRunScalarFieldEnum | ProfileImportRunScalarFieldEnum[]
  }

  /**
   * ProfileImportRun findFirstOrThrow
   */
  export type ProfileImportRunFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProfileImportRun
     */
    select?: ProfileImportRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProfileImportRun
     */
    omit?: ProfileImportRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileImportRunInclude<ExtArgs> | null
    /**
     * Filter, which ProfileImportRun to fetch.
     */
    where?: ProfileImportRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProfileImportRuns to fetch.
     */
    orderBy?: ProfileImportRunOrderByWithRelationInput | ProfileImportRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProfileImportRuns.
     */
    cursor?: ProfileImportRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProfileImportRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProfileImportRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProfileImportRuns.
     */
    distinct?: ProfileImportRunScalarFieldEnum | ProfileImportRunScalarFieldEnum[]
  }

  /**
   * ProfileImportRun findMany
   */
  export type ProfileImportRunFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProfileImportRun
     */
    select?: ProfileImportRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProfileImportRun
     */
    omit?: ProfileImportRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileImportRunInclude<ExtArgs> | null
    /**
     * Filter, which ProfileImportRuns to fetch.
     */
    where?: ProfileImportRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProfileImportRuns to fetch.
     */
    orderBy?: ProfileImportRunOrderByWithRelationInput | ProfileImportRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ProfileImportRuns.
     */
    cursor?: ProfileImportRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProfileImportRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProfileImportRuns.
     */
    skip?: number
    distinct?: ProfileImportRunScalarFieldEnum | ProfileImportRunScalarFieldEnum[]
  }

  /**
   * ProfileImportRun create
   */
  export type ProfileImportRunCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProfileImportRun
     */
    select?: ProfileImportRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProfileImportRun
     */
    omit?: ProfileImportRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileImportRunInclude<ExtArgs> | null
    /**
     * The data needed to create a ProfileImportRun.
     */
    data: XOR<ProfileImportRunCreateInput, ProfileImportRunUncheckedCreateInput>
  }

  /**
   * ProfileImportRun createMany
   */
  export type ProfileImportRunCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ProfileImportRuns.
     */
    data: ProfileImportRunCreateManyInput | ProfileImportRunCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ProfileImportRun createManyAndReturn
   */
  export type ProfileImportRunCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProfileImportRun
     */
    select?: ProfileImportRunSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ProfileImportRun
     */
    omit?: ProfileImportRunOmit<ExtArgs> | null
    /**
     * The data used to create many ProfileImportRuns.
     */
    data: ProfileImportRunCreateManyInput | ProfileImportRunCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileImportRunIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ProfileImportRun update
   */
  export type ProfileImportRunUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProfileImportRun
     */
    select?: ProfileImportRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProfileImportRun
     */
    omit?: ProfileImportRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileImportRunInclude<ExtArgs> | null
    /**
     * The data needed to update a ProfileImportRun.
     */
    data: XOR<ProfileImportRunUpdateInput, ProfileImportRunUncheckedUpdateInput>
    /**
     * Choose, which ProfileImportRun to update.
     */
    where: ProfileImportRunWhereUniqueInput
  }

  /**
   * ProfileImportRun updateMany
   */
  export type ProfileImportRunUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ProfileImportRuns.
     */
    data: XOR<ProfileImportRunUpdateManyMutationInput, ProfileImportRunUncheckedUpdateManyInput>
    /**
     * Filter which ProfileImportRuns to update
     */
    where?: ProfileImportRunWhereInput
    /**
     * Limit how many ProfileImportRuns to update.
     */
    limit?: number
  }

  /**
   * ProfileImportRun updateManyAndReturn
   */
  export type ProfileImportRunUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProfileImportRun
     */
    select?: ProfileImportRunSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ProfileImportRun
     */
    omit?: ProfileImportRunOmit<ExtArgs> | null
    /**
     * The data used to update ProfileImportRuns.
     */
    data: XOR<ProfileImportRunUpdateManyMutationInput, ProfileImportRunUncheckedUpdateManyInput>
    /**
     * Filter which ProfileImportRuns to update
     */
    where?: ProfileImportRunWhereInput
    /**
     * Limit how many ProfileImportRuns to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileImportRunIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ProfileImportRun upsert
   */
  export type ProfileImportRunUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProfileImportRun
     */
    select?: ProfileImportRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProfileImportRun
     */
    omit?: ProfileImportRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileImportRunInclude<ExtArgs> | null
    /**
     * The filter to search for the ProfileImportRun to update in case it exists.
     */
    where: ProfileImportRunWhereUniqueInput
    /**
     * In case the ProfileImportRun found by the `where` argument doesn't exist, create a new ProfileImportRun with this data.
     */
    create: XOR<ProfileImportRunCreateInput, ProfileImportRunUncheckedCreateInput>
    /**
     * In case the ProfileImportRun was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProfileImportRunUpdateInput, ProfileImportRunUncheckedUpdateInput>
  }

  /**
   * ProfileImportRun delete
   */
  export type ProfileImportRunDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProfileImportRun
     */
    select?: ProfileImportRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProfileImportRun
     */
    omit?: ProfileImportRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileImportRunInclude<ExtArgs> | null
    /**
     * Filter which ProfileImportRun to delete.
     */
    where: ProfileImportRunWhereUniqueInput
  }

  /**
   * ProfileImportRun deleteMany
   */
  export type ProfileImportRunDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProfileImportRuns to delete
     */
    where?: ProfileImportRunWhereInput
    /**
     * Limit how many ProfileImportRuns to delete.
     */
    limit?: number
  }

  /**
   * ProfileImportRun without action
   */
  export type ProfileImportRunDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProfileImportRun
     */
    select?: ProfileImportRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProfileImportRun
     */
    omit?: ProfileImportRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileImportRunInclude<ExtArgs> | null
  }


  /**
   * Model LinkedInProfile
   */

  export type AggregateLinkedInProfile = {
    _count: LinkedInProfileCountAggregateOutputType | null
    _avg: LinkedInProfileAvgAggregateOutputType | null
    _sum: LinkedInProfileSumAggregateOutputType | null
    _min: LinkedInProfileMinAggregateOutputType | null
    _max: LinkedInProfileMaxAggregateOutputType | null
  }

  export type LinkedInProfileAvgAggregateOutputType = {
    connections: number | null
    followers: number | null
    companyFoundedIn: number | null
    currentJobDurationInYrs: number | null
  }

  export type LinkedInProfileSumAggregateOutputType = {
    connections: number | null
    followers: number | null
    companyFoundedIn: number | null
    currentJobDurationInYrs: number | null
  }

  export type LinkedInProfileMinAggregateOutputType = {
    id: string | null
    linkedinUrl: string | null
    fullName: string | null
    headline: string | null
    urn: string | null
    profilePic: string | null
    firstName: string | null
    lastName: string | null
    connections: number | null
    followers: number | null
    email: string | null
    mobileNumber: string | null
    jobTitle: string | null
    companyName: string | null
    companyIndustry: string | null
    companyWebsite: string | null
    companyLinkedin: string | null
    companyFoundedIn: number | null
    companySize: string | null
    currentJobDuration: string | null
    currentJobDurationInYrs: number | null
    topSkillsByEndorsements: string | null
    addressCountryOnly: string | null
    addressWithCountry: string | null
    addressWithoutCountry: string | null
    profilePicHighQuality: string | null
    about: string | null
    publicIdentifier: string | null
    openConnection: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LinkedInProfileMaxAggregateOutputType = {
    id: string | null
    linkedinUrl: string | null
    fullName: string | null
    headline: string | null
    urn: string | null
    profilePic: string | null
    firstName: string | null
    lastName: string | null
    connections: number | null
    followers: number | null
    email: string | null
    mobileNumber: string | null
    jobTitle: string | null
    companyName: string | null
    companyIndustry: string | null
    companyWebsite: string | null
    companyLinkedin: string | null
    companyFoundedIn: number | null
    companySize: string | null
    currentJobDuration: string | null
    currentJobDurationInYrs: number | null
    topSkillsByEndorsements: string | null
    addressCountryOnly: string | null
    addressWithCountry: string | null
    addressWithoutCountry: string | null
    profilePicHighQuality: string | null
    about: string | null
    publicIdentifier: string | null
    openConnection: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LinkedInProfileCountAggregateOutputType = {
    id: number
    linkedinUrl: number
    fullName: number
    headline: number
    urn: number
    profilePic: number
    firstName: number
    lastName: number
    connections: number
    followers: number
    email: number
    mobileNumber: number
    jobTitle: number
    companyName: number
    companyIndustry: number
    companyWebsite: number
    companyLinkedin: number
    companyFoundedIn: number
    companySize: number
    currentJobDuration: number
    currentJobDurationInYrs: number
    topSkillsByEndorsements: number
    addressCountryOnly: number
    addressWithCountry: number
    addressWithoutCountry: number
    profilePicHighQuality: number
    about: number
    publicIdentifier: number
    openConnection: number
    experiences: number
    updates: number
    skills: number
    profilePicAllDimensions: number
    educations: number
    licenseAndCertificates: number
    honorsAndAwards: number
    languages: number
    volunteerAndAwards: number
    verifications: number
    promos: number
    highlights: number
    projects: number
    publications: number
    patents: number
    courses: number
    testScores: number
    organizations: number
    volunteerCauses: number
    interests: number
    recommendations: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type LinkedInProfileAvgAggregateInputType = {
    connections?: true
    followers?: true
    companyFoundedIn?: true
    currentJobDurationInYrs?: true
  }

  export type LinkedInProfileSumAggregateInputType = {
    connections?: true
    followers?: true
    companyFoundedIn?: true
    currentJobDurationInYrs?: true
  }

  export type LinkedInProfileMinAggregateInputType = {
    id?: true
    linkedinUrl?: true
    fullName?: true
    headline?: true
    urn?: true
    profilePic?: true
    firstName?: true
    lastName?: true
    connections?: true
    followers?: true
    email?: true
    mobileNumber?: true
    jobTitle?: true
    companyName?: true
    companyIndustry?: true
    companyWebsite?: true
    companyLinkedin?: true
    companyFoundedIn?: true
    companySize?: true
    currentJobDuration?: true
    currentJobDurationInYrs?: true
    topSkillsByEndorsements?: true
    addressCountryOnly?: true
    addressWithCountry?: true
    addressWithoutCountry?: true
    profilePicHighQuality?: true
    about?: true
    publicIdentifier?: true
    openConnection?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LinkedInProfileMaxAggregateInputType = {
    id?: true
    linkedinUrl?: true
    fullName?: true
    headline?: true
    urn?: true
    profilePic?: true
    firstName?: true
    lastName?: true
    connections?: true
    followers?: true
    email?: true
    mobileNumber?: true
    jobTitle?: true
    companyName?: true
    companyIndustry?: true
    companyWebsite?: true
    companyLinkedin?: true
    companyFoundedIn?: true
    companySize?: true
    currentJobDuration?: true
    currentJobDurationInYrs?: true
    topSkillsByEndorsements?: true
    addressCountryOnly?: true
    addressWithCountry?: true
    addressWithoutCountry?: true
    profilePicHighQuality?: true
    about?: true
    publicIdentifier?: true
    openConnection?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LinkedInProfileCountAggregateInputType = {
    id?: true
    linkedinUrl?: true
    fullName?: true
    headline?: true
    urn?: true
    profilePic?: true
    firstName?: true
    lastName?: true
    connections?: true
    followers?: true
    email?: true
    mobileNumber?: true
    jobTitle?: true
    companyName?: true
    companyIndustry?: true
    companyWebsite?: true
    companyLinkedin?: true
    companyFoundedIn?: true
    companySize?: true
    currentJobDuration?: true
    currentJobDurationInYrs?: true
    topSkillsByEndorsements?: true
    addressCountryOnly?: true
    addressWithCountry?: true
    addressWithoutCountry?: true
    profilePicHighQuality?: true
    about?: true
    publicIdentifier?: true
    openConnection?: true
    experiences?: true
    updates?: true
    skills?: true
    profilePicAllDimensions?: true
    educations?: true
    licenseAndCertificates?: true
    honorsAndAwards?: true
    languages?: true
    volunteerAndAwards?: true
    verifications?: true
    promos?: true
    highlights?: true
    projects?: true
    publications?: true
    patents?: true
    courses?: true
    testScores?: true
    organizations?: true
    volunteerCauses?: true
    interests?: true
    recommendations?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type LinkedInProfileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LinkedInProfile to aggregate.
     */
    where?: LinkedInProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LinkedInProfiles to fetch.
     */
    orderBy?: LinkedInProfileOrderByWithRelationInput | LinkedInProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LinkedInProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LinkedInProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LinkedInProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned LinkedInProfiles
    **/
    _count?: true | LinkedInProfileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LinkedInProfileAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LinkedInProfileSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LinkedInProfileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LinkedInProfileMaxAggregateInputType
  }

  export type GetLinkedInProfileAggregateType<T extends LinkedInProfileAggregateArgs> = {
        [P in keyof T & keyof AggregateLinkedInProfile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLinkedInProfile[P]>
      : GetScalarType<T[P], AggregateLinkedInProfile[P]>
  }




  export type LinkedInProfileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LinkedInProfileWhereInput
    orderBy?: LinkedInProfileOrderByWithAggregationInput | LinkedInProfileOrderByWithAggregationInput[]
    by: LinkedInProfileScalarFieldEnum[] | LinkedInProfileScalarFieldEnum
    having?: LinkedInProfileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LinkedInProfileCountAggregateInputType | true
    _avg?: LinkedInProfileAvgAggregateInputType
    _sum?: LinkedInProfileSumAggregateInputType
    _min?: LinkedInProfileMinAggregateInputType
    _max?: LinkedInProfileMaxAggregateInputType
  }

  export type LinkedInProfileGroupByOutputType = {
    id: string
    linkedinUrl: string
    fullName: string
    headline: string
    urn: string
    profilePic: string
    firstName: string | null
    lastName: string | null
    connections: number | null
    followers: number | null
    email: string | null
    mobileNumber: string | null
    jobTitle: string | null
    companyName: string | null
    companyIndustry: string | null
    companyWebsite: string | null
    companyLinkedin: string | null
    companyFoundedIn: number | null
    companySize: string | null
    currentJobDuration: string | null
    currentJobDurationInYrs: number | null
    topSkillsByEndorsements: string | null
    addressCountryOnly: string | null
    addressWithCountry: string | null
    addressWithoutCountry: string | null
    profilePicHighQuality: string | null
    about: string | null
    publicIdentifier: string | null
    openConnection: boolean | null
    experiences: JsonValue | null
    updates: JsonValue | null
    skills: JsonValue | null
    profilePicAllDimensions: JsonValue | null
    educations: JsonValue | null
    licenseAndCertificates: JsonValue | null
    honorsAndAwards: JsonValue | null
    languages: JsonValue | null
    volunteerAndAwards: JsonValue | null
    verifications: JsonValue | null
    promos: JsonValue | null
    highlights: JsonValue | null
    projects: JsonValue | null
    publications: JsonValue | null
    patents: JsonValue | null
    courses: JsonValue | null
    testScores: JsonValue | null
    organizations: JsonValue | null
    volunteerCauses: JsonValue | null
    interests: JsonValue | null
    recommendations: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: LinkedInProfileCountAggregateOutputType | null
    _avg: LinkedInProfileAvgAggregateOutputType | null
    _sum: LinkedInProfileSumAggregateOutputType | null
    _min: LinkedInProfileMinAggregateOutputType | null
    _max: LinkedInProfileMaxAggregateOutputType | null
  }

  type GetLinkedInProfileGroupByPayload<T extends LinkedInProfileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LinkedInProfileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LinkedInProfileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LinkedInProfileGroupByOutputType[P]>
            : GetScalarType<T[P], LinkedInProfileGroupByOutputType[P]>
        }
      >
    >


  export type LinkedInProfileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    linkedinUrl?: boolean
    fullName?: boolean
    headline?: boolean
    urn?: boolean
    profilePic?: boolean
    firstName?: boolean
    lastName?: boolean
    connections?: boolean
    followers?: boolean
    email?: boolean
    mobileNumber?: boolean
    jobTitle?: boolean
    companyName?: boolean
    companyIndustry?: boolean
    companyWebsite?: boolean
    companyLinkedin?: boolean
    companyFoundedIn?: boolean
    companySize?: boolean
    currentJobDuration?: boolean
    currentJobDurationInYrs?: boolean
    topSkillsByEndorsements?: boolean
    addressCountryOnly?: boolean
    addressWithCountry?: boolean
    addressWithoutCountry?: boolean
    profilePicHighQuality?: boolean
    about?: boolean
    publicIdentifier?: boolean
    openConnection?: boolean
    experiences?: boolean
    updates?: boolean
    skills?: boolean
    profilePicAllDimensions?: boolean
    educations?: boolean
    licenseAndCertificates?: boolean
    honorsAndAwards?: boolean
    languages?: boolean
    volunteerAndAwards?: boolean
    verifications?: boolean
    promos?: boolean
    highlights?: boolean
    projects?: boolean
    publications?: boolean
    patents?: boolean
    courses?: boolean
    testScores?: boolean
    organizations?: boolean
    volunteerCauses?: boolean
    interests?: boolean
    recommendations?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["linkedInProfile"]>

  export type LinkedInProfileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    linkedinUrl?: boolean
    fullName?: boolean
    headline?: boolean
    urn?: boolean
    profilePic?: boolean
    firstName?: boolean
    lastName?: boolean
    connections?: boolean
    followers?: boolean
    email?: boolean
    mobileNumber?: boolean
    jobTitle?: boolean
    companyName?: boolean
    companyIndustry?: boolean
    companyWebsite?: boolean
    companyLinkedin?: boolean
    companyFoundedIn?: boolean
    companySize?: boolean
    currentJobDuration?: boolean
    currentJobDurationInYrs?: boolean
    topSkillsByEndorsements?: boolean
    addressCountryOnly?: boolean
    addressWithCountry?: boolean
    addressWithoutCountry?: boolean
    profilePicHighQuality?: boolean
    about?: boolean
    publicIdentifier?: boolean
    openConnection?: boolean
    experiences?: boolean
    updates?: boolean
    skills?: boolean
    profilePicAllDimensions?: boolean
    educations?: boolean
    licenseAndCertificates?: boolean
    honorsAndAwards?: boolean
    languages?: boolean
    volunteerAndAwards?: boolean
    verifications?: boolean
    promos?: boolean
    highlights?: boolean
    projects?: boolean
    publications?: boolean
    patents?: boolean
    courses?: boolean
    testScores?: boolean
    organizations?: boolean
    volunteerCauses?: boolean
    interests?: boolean
    recommendations?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["linkedInProfile"]>

  export type LinkedInProfileSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    linkedinUrl?: boolean
    fullName?: boolean
    headline?: boolean
    urn?: boolean
    profilePic?: boolean
    firstName?: boolean
    lastName?: boolean
    connections?: boolean
    followers?: boolean
    email?: boolean
    mobileNumber?: boolean
    jobTitle?: boolean
    companyName?: boolean
    companyIndustry?: boolean
    companyWebsite?: boolean
    companyLinkedin?: boolean
    companyFoundedIn?: boolean
    companySize?: boolean
    currentJobDuration?: boolean
    currentJobDurationInYrs?: boolean
    topSkillsByEndorsements?: boolean
    addressCountryOnly?: boolean
    addressWithCountry?: boolean
    addressWithoutCountry?: boolean
    profilePicHighQuality?: boolean
    about?: boolean
    publicIdentifier?: boolean
    openConnection?: boolean
    experiences?: boolean
    updates?: boolean
    skills?: boolean
    profilePicAllDimensions?: boolean
    educations?: boolean
    licenseAndCertificates?: boolean
    honorsAndAwards?: boolean
    languages?: boolean
    volunteerAndAwards?: boolean
    verifications?: boolean
    promos?: boolean
    highlights?: boolean
    projects?: boolean
    publications?: boolean
    patents?: boolean
    courses?: boolean
    testScores?: boolean
    organizations?: boolean
    volunteerCauses?: boolean
    interests?: boolean
    recommendations?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["linkedInProfile"]>

  export type LinkedInProfileSelectScalar = {
    id?: boolean
    linkedinUrl?: boolean
    fullName?: boolean
    headline?: boolean
    urn?: boolean
    profilePic?: boolean
    firstName?: boolean
    lastName?: boolean
    connections?: boolean
    followers?: boolean
    email?: boolean
    mobileNumber?: boolean
    jobTitle?: boolean
    companyName?: boolean
    companyIndustry?: boolean
    companyWebsite?: boolean
    companyLinkedin?: boolean
    companyFoundedIn?: boolean
    companySize?: boolean
    currentJobDuration?: boolean
    currentJobDurationInYrs?: boolean
    topSkillsByEndorsements?: boolean
    addressCountryOnly?: boolean
    addressWithCountry?: boolean
    addressWithoutCountry?: boolean
    profilePicHighQuality?: boolean
    about?: boolean
    publicIdentifier?: boolean
    openConnection?: boolean
    experiences?: boolean
    updates?: boolean
    skills?: boolean
    profilePicAllDimensions?: boolean
    educations?: boolean
    licenseAndCertificates?: boolean
    honorsAndAwards?: boolean
    languages?: boolean
    volunteerAndAwards?: boolean
    verifications?: boolean
    promos?: boolean
    highlights?: boolean
    projects?: boolean
    publications?: boolean
    patents?: boolean
    courses?: boolean
    testScores?: boolean
    organizations?: boolean
    volunteerCauses?: boolean
    interests?: boolean
    recommendations?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type LinkedInProfileOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "linkedinUrl" | "fullName" | "headline" | "urn" | "profilePic" | "firstName" | "lastName" | "connections" | "followers" | "email" | "mobileNumber" | "jobTitle" | "companyName" | "companyIndustry" | "companyWebsite" | "companyLinkedin" | "companyFoundedIn" | "companySize" | "currentJobDuration" | "currentJobDurationInYrs" | "topSkillsByEndorsements" | "addressCountryOnly" | "addressWithCountry" | "addressWithoutCountry" | "profilePicHighQuality" | "about" | "publicIdentifier" | "openConnection" | "experiences" | "updates" | "skills" | "profilePicAllDimensions" | "educations" | "licenseAndCertificates" | "honorsAndAwards" | "languages" | "volunteerAndAwards" | "verifications" | "promos" | "highlights" | "projects" | "publications" | "patents" | "courses" | "testScores" | "organizations" | "volunteerCauses" | "interests" | "recommendations" | "createdAt" | "updatedAt", ExtArgs["result"]["linkedInProfile"]>

  export type $LinkedInProfilePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "LinkedInProfile"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      linkedinUrl: string
      fullName: string
      headline: string
      urn: string
      profilePic: string
      firstName: string | null
      lastName: string | null
      connections: number | null
      followers: number | null
      email: string | null
      mobileNumber: string | null
      jobTitle: string | null
      companyName: string | null
      companyIndustry: string | null
      companyWebsite: string | null
      companyLinkedin: string | null
      companyFoundedIn: number | null
      companySize: string | null
      currentJobDuration: string | null
      currentJobDurationInYrs: number | null
      topSkillsByEndorsements: string | null
      addressCountryOnly: string | null
      addressWithCountry: string | null
      addressWithoutCountry: string | null
      profilePicHighQuality: string | null
      about: string | null
      publicIdentifier: string | null
      openConnection: boolean | null
      experiences: Prisma.JsonValue | null
      updates: Prisma.JsonValue | null
      skills: Prisma.JsonValue | null
      profilePicAllDimensions: Prisma.JsonValue | null
      educations: Prisma.JsonValue | null
      licenseAndCertificates: Prisma.JsonValue | null
      honorsAndAwards: Prisma.JsonValue | null
      languages: Prisma.JsonValue | null
      volunteerAndAwards: Prisma.JsonValue | null
      verifications: Prisma.JsonValue | null
      promos: Prisma.JsonValue | null
      highlights: Prisma.JsonValue | null
      projects: Prisma.JsonValue | null
      publications: Prisma.JsonValue | null
      patents: Prisma.JsonValue | null
      courses: Prisma.JsonValue | null
      testScores: Prisma.JsonValue | null
      organizations: Prisma.JsonValue | null
      volunteerCauses: Prisma.JsonValue | null
      interests: Prisma.JsonValue | null
      recommendations: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["linkedInProfile"]>
    composites: {}
  }

  type LinkedInProfileGetPayload<S extends boolean | null | undefined | LinkedInProfileDefaultArgs> = $Result.GetResult<Prisma.$LinkedInProfilePayload, S>

  type LinkedInProfileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LinkedInProfileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LinkedInProfileCountAggregateInputType | true
    }

  export interface LinkedInProfileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['LinkedInProfile'], meta: { name: 'LinkedInProfile' } }
    /**
     * Find zero or one LinkedInProfile that matches the filter.
     * @param {LinkedInProfileFindUniqueArgs} args - Arguments to find a LinkedInProfile
     * @example
     * // Get one LinkedInProfile
     * const linkedInProfile = await prisma.linkedInProfile.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LinkedInProfileFindUniqueArgs>(args: SelectSubset<T, LinkedInProfileFindUniqueArgs<ExtArgs>>): Prisma__LinkedInProfileClient<$Result.GetResult<Prisma.$LinkedInProfilePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one LinkedInProfile that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LinkedInProfileFindUniqueOrThrowArgs} args - Arguments to find a LinkedInProfile
     * @example
     * // Get one LinkedInProfile
     * const linkedInProfile = await prisma.linkedInProfile.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LinkedInProfileFindUniqueOrThrowArgs>(args: SelectSubset<T, LinkedInProfileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LinkedInProfileClient<$Result.GetResult<Prisma.$LinkedInProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first LinkedInProfile that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkedInProfileFindFirstArgs} args - Arguments to find a LinkedInProfile
     * @example
     * // Get one LinkedInProfile
     * const linkedInProfile = await prisma.linkedInProfile.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LinkedInProfileFindFirstArgs>(args?: SelectSubset<T, LinkedInProfileFindFirstArgs<ExtArgs>>): Prisma__LinkedInProfileClient<$Result.GetResult<Prisma.$LinkedInProfilePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first LinkedInProfile that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkedInProfileFindFirstOrThrowArgs} args - Arguments to find a LinkedInProfile
     * @example
     * // Get one LinkedInProfile
     * const linkedInProfile = await prisma.linkedInProfile.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LinkedInProfileFindFirstOrThrowArgs>(args?: SelectSubset<T, LinkedInProfileFindFirstOrThrowArgs<ExtArgs>>): Prisma__LinkedInProfileClient<$Result.GetResult<Prisma.$LinkedInProfilePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more LinkedInProfiles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkedInProfileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all LinkedInProfiles
     * const linkedInProfiles = await prisma.linkedInProfile.findMany()
     * 
     * // Get first 10 LinkedInProfiles
     * const linkedInProfiles = await prisma.linkedInProfile.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const linkedInProfileWithIdOnly = await prisma.linkedInProfile.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LinkedInProfileFindManyArgs>(args?: SelectSubset<T, LinkedInProfileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LinkedInProfilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a LinkedInProfile.
     * @param {LinkedInProfileCreateArgs} args - Arguments to create a LinkedInProfile.
     * @example
     * // Create one LinkedInProfile
     * const LinkedInProfile = await prisma.linkedInProfile.create({
     *   data: {
     *     // ... data to create a LinkedInProfile
     *   }
     * })
     * 
     */
    create<T extends LinkedInProfileCreateArgs>(args: SelectSubset<T, LinkedInProfileCreateArgs<ExtArgs>>): Prisma__LinkedInProfileClient<$Result.GetResult<Prisma.$LinkedInProfilePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many LinkedInProfiles.
     * @param {LinkedInProfileCreateManyArgs} args - Arguments to create many LinkedInProfiles.
     * @example
     * // Create many LinkedInProfiles
     * const linkedInProfile = await prisma.linkedInProfile.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LinkedInProfileCreateManyArgs>(args?: SelectSubset<T, LinkedInProfileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many LinkedInProfiles and returns the data saved in the database.
     * @param {LinkedInProfileCreateManyAndReturnArgs} args - Arguments to create many LinkedInProfiles.
     * @example
     * // Create many LinkedInProfiles
     * const linkedInProfile = await prisma.linkedInProfile.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many LinkedInProfiles and only return the `id`
     * const linkedInProfileWithIdOnly = await prisma.linkedInProfile.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LinkedInProfileCreateManyAndReturnArgs>(args?: SelectSubset<T, LinkedInProfileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LinkedInProfilePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a LinkedInProfile.
     * @param {LinkedInProfileDeleteArgs} args - Arguments to delete one LinkedInProfile.
     * @example
     * // Delete one LinkedInProfile
     * const LinkedInProfile = await prisma.linkedInProfile.delete({
     *   where: {
     *     // ... filter to delete one LinkedInProfile
     *   }
     * })
     * 
     */
    delete<T extends LinkedInProfileDeleteArgs>(args: SelectSubset<T, LinkedInProfileDeleteArgs<ExtArgs>>): Prisma__LinkedInProfileClient<$Result.GetResult<Prisma.$LinkedInProfilePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one LinkedInProfile.
     * @param {LinkedInProfileUpdateArgs} args - Arguments to update one LinkedInProfile.
     * @example
     * // Update one LinkedInProfile
     * const linkedInProfile = await prisma.linkedInProfile.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LinkedInProfileUpdateArgs>(args: SelectSubset<T, LinkedInProfileUpdateArgs<ExtArgs>>): Prisma__LinkedInProfileClient<$Result.GetResult<Prisma.$LinkedInProfilePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more LinkedInProfiles.
     * @param {LinkedInProfileDeleteManyArgs} args - Arguments to filter LinkedInProfiles to delete.
     * @example
     * // Delete a few LinkedInProfiles
     * const { count } = await prisma.linkedInProfile.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LinkedInProfileDeleteManyArgs>(args?: SelectSubset<T, LinkedInProfileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LinkedInProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkedInProfileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many LinkedInProfiles
     * const linkedInProfile = await prisma.linkedInProfile.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LinkedInProfileUpdateManyArgs>(args: SelectSubset<T, LinkedInProfileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LinkedInProfiles and returns the data updated in the database.
     * @param {LinkedInProfileUpdateManyAndReturnArgs} args - Arguments to update many LinkedInProfiles.
     * @example
     * // Update many LinkedInProfiles
     * const linkedInProfile = await prisma.linkedInProfile.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more LinkedInProfiles and only return the `id`
     * const linkedInProfileWithIdOnly = await prisma.linkedInProfile.updateManyAndReturn({
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
    updateManyAndReturn<T extends LinkedInProfileUpdateManyAndReturnArgs>(args: SelectSubset<T, LinkedInProfileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LinkedInProfilePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one LinkedInProfile.
     * @param {LinkedInProfileUpsertArgs} args - Arguments to update or create a LinkedInProfile.
     * @example
     * // Update or create a LinkedInProfile
     * const linkedInProfile = await prisma.linkedInProfile.upsert({
     *   create: {
     *     // ... data to create a LinkedInProfile
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the LinkedInProfile we want to update
     *   }
     * })
     */
    upsert<T extends LinkedInProfileUpsertArgs>(args: SelectSubset<T, LinkedInProfileUpsertArgs<ExtArgs>>): Prisma__LinkedInProfileClient<$Result.GetResult<Prisma.$LinkedInProfilePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of LinkedInProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkedInProfileCountArgs} args - Arguments to filter LinkedInProfiles to count.
     * @example
     * // Count the number of LinkedInProfiles
     * const count = await prisma.linkedInProfile.count({
     *   where: {
     *     // ... the filter for the LinkedInProfiles we want to count
     *   }
     * })
    **/
    count<T extends LinkedInProfileCountArgs>(
      args?: Subset<T, LinkedInProfileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LinkedInProfileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a LinkedInProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkedInProfileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends LinkedInProfileAggregateArgs>(args: Subset<T, LinkedInProfileAggregateArgs>): Prisma.PrismaPromise<GetLinkedInProfileAggregateType<T>>

    /**
     * Group by LinkedInProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LinkedInProfileGroupByArgs} args - Group by arguments.
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
      T extends LinkedInProfileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LinkedInProfileGroupByArgs['orderBy'] }
        : { orderBy?: LinkedInProfileGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, LinkedInProfileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLinkedInProfileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the LinkedInProfile model
   */
  readonly fields: LinkedInProfileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for LinkedInProfile.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LinkedInProfileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the LinkedInProfile model
   */
  interface LinkedInProfileFieldRefs {
    readonly id: FieldRef<"LinkedInProfile", 'String'>
    readonly linkedinUrl: FieldRef<"LinkedInProfile", 'String'>
    readonly fullName: FieldRef<"LinkedInProfile", 'String'>
    readonly headline: FieldRef<"LinkedInProfile", 'String'>
    readonly urn: FieldRef<"LinkedInProfile", 'String'>
    readonly profilePic: FieldRef<"LinkedInProfile", 'String'>
    readonly firstName: FieldRef<"LinkedInProfile", 'String'>
    readonly lastName: FieldRef<"LinkedInProfile", 'String'>
    readonly connections: FieldRef<"LinkedInProfile", 'Int'>
    readonly followers: FieldRef<"LinkedInProfile", 'Int'>
    readonly email: FieldRef<"LinkedInProfile", 'String'>
    readonly mobileNumber: FieldRef<"LinkedInProfile", 'String'>
    readonly jobTitle: FieldRef<"LinkedInProfile", 'String'>
    readonly companyName: FieldRef<"LinkedInProfile", 'String'>
    readonly companyIndustry: FieldRef<"LinkedInProfile", 'String'>
    readonly companyWebsite: FieldRef<"LinkedInProfile", 'String'>
    readonly companyLinkedin: FieldRef<"LinkedInProfile", 'String'>
    readonly companyFoundedIn: FieldRef<"LinkedInProfile", 'Int'>
    readonly companySize: FieldRef<"LinkedInProfile", 'String'>
    readonly currentJobDuration: FieldRef<"LinkedInProfile", 'String'>
    readonly currentJobDurationInYrs: FieldRef<"LinkedInProfile", 'Float'>
    readonly topSkillsByEndorsements: FieldRef<"LinkedInProfile", 'String'>
    readonly addressCountryOnly: FieldRef<"LinkedInProfile", 'String'>
    readonly addressWithCountry: FieldRef<"LinkedInProfile", 'String'>
    readonly addressWithoutCountry: FieldRef<"LinkedInProfile", 'String'>
    readonly profilePicHighQuality: FieldRef<"LinkedInProfile", 'String'>
    readonly about: FieldRef<"LinkedInProfile", 'String'>
    readonly publicIdentifier: FieldRef<"LinkedInProfile", 'String'>
    readonly openConnection: FieldRef<"LinkedInProfile", 'Boolean'>
    readonly experiences: FieldRef<"LinkedInProfile", 'Json'>
    readonly updates: FieldRef<"LinkedInProfile", 'Json'>
    readonly skills: FieldRef<"LinkedInProfile", 'Json'>
    readonly profilePicAllDimensions: FieldRef<"LinkedInProfile", 'Json'>
    readonly educations: FieldRef<"LinkedInProfile", 'Json'>
    readonly licenseAndCertificates: FieldRef<"LinkedInProfile", 'Json'>
    readonly honorsAndAwards: FieldRef<"LinkedInProfile", 'Json'>
    readonly languages: FieldRef<"LinkedInProfile", 'Json'>
    readonly volunteerAndAwards: FieldRef<"LinkedInProfile", 'Json'>
    readonly verifications: FieldRef<"LinkedInProfile", 'Json'>
    readonly promos: FieldRef<"LinkedInProfile", 'Json'>
    readonly highlights: FieldRef<"LinkedInProfile", 'Json'>
    readonly projects: FieldRef<"LinkedInProfile", 'Json'>
    readonly publications: FieldRef<"LinkedInProfile", 'Json'>
    readonly patents: FieldRef<"LinkedInProfile", 'Json'>
    readonly courses: FieldRef<"LinkedInProfile", 'Json'>
    readonly testScores: FieldRef<"LinkedInProfile", 'Json'>
    readonly organizations: FieldRef<"LinkedInProfile", 'Json'>
    readonly volunteerCauses: FieldRef<"LinkedInProfile", 'Json'>
    readonly interests: FieldRef<"LinkedInProfile", 'Json'>
    readonly recommendations: FieldRef<"LinkedInProfile", 'Json'>
    readonly createdAt: FieldRef<"LinkedInProfile", 'DateTime'>
    readonly updatedAt: FieldRef<"LinkedInProfile", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * LinkedInProfile findUnique
   */
  export type LinkedInProfileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInProfile
     */
    select?: LinkedInProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInProfile
     */
    omit?: LinkedInProfileOmit<ExtArgs> | null
    /**
     * Filter, which LinkedInProfile to fetch.
     */
    where: LinkedInProfileWhereUniqueInput
  }

  /**
   * LinkedInProfile findUniqueOrThrow
   */
  export type LinkedInProfileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInProfile
     */
    select?: LinkedInProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInProfile
     */
    omit?: LinkedInProfileOmit<ExtArgs> | null
    /**
     * Filter, which LinkedInProfile to fetch.
     */
    where: LinkedInProfileWhereUniqueInput
  }

  /**
   * LinkedInProfile findFirst
   */
  export type LinkedInProfileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInProfile
     */
    select?: LinkedInProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInProfile
     */
    omit?: LinkedInProfileOmit<ExtArgs> | null
    /**
     * Filter, which LinkedInProfile to fetch.
     */
    where?: LinkedInProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LinkedInProfiles to fetch.
     */
    orderBy?: LinkedInProfileOrderByWithRelationInput | LinkedInProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LinkedInProfiles.
     */
    cursor?: LinkedInProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LinkedInProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LinkedInProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LinkedInProfiles.
     */
    distinct?: LinkedInProfileScalarFieldEnum | LinkedInProfileScalarFieldEnum[]
  }

  /**
   * LinkedInProfile findFirstOrThrow
   */
  export type LinkedInProfileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInProfile
     */
    select?: LinkedInProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInProfile
     */
    omit?: LinkedInProfileOmit<ExtArgs> | null
    /**
     * Filter, which LinkedInProfile to fetch.
     */
    where?: LinkedInProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LinkedInProfiles to fetch.
     */
    orderBy?: LinkedInProfileOrderByWithRelationInput | LinkedInProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LinkedInProfiles.
     */
    cursor?: LinkedInProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LinkedInProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LinkedInProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LinkedInProfiles.
     */
    distinct?: LinkedInProfileScalarFieldEnum | LinkedInProfileScalarFieldEnum[]
  }

  /**
   * LinkedInProfile findMany
   */
  export type LinkedInProfileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInProfile
     */
    select?: LinkedInProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInProfile
     */
    omit?: LinkedInProfileOmit<ExtArgs> | null
    /**
     * Filter, which LinkedInProfiles to fetch.
     */
    where?: LinkedInProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LinkedInProfiles to fetch.
     */
    orderBy?: LinkedInProfileOrderByWithRelationInput | LinkedInProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing LinkedInProfiles.
     */
    cursor?: LinkedInProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LinkedInProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LinkedInProfiles.
     */
    skip?: number
    distinct?: LinkedInProfileScalarFieldEnum | LinkedInProfileScalarFieldEnum[]
  }

  /**
   * LinkedInProfile create
   */
  export type LinkedInProfileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInProfile
     */
    select?: LinkedInProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInProfile
     */
    omit?: LinkedInProfileOmit<ExtArgs> | null
    /**
     * The data needed to create a LinkedInProfile.
     */
    data: XOR<LinkedInProfileCreateInput, LinkedInProfileUncheckedCreateInput>
  }

  /**
   * LinkedInProfile createMany
   */
  export type LinkedInProfileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many LinkedInProfiles.
     */
    data: LinkedInProfileCreateManyInput | LinkedInProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * LinkedInProfile createManyAndReturn
   */
  export type LinkedInProfileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInProfile
     */
    select?: LinkedInProfileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInProfile
     */
    omit?: LinkedInProfileOmit<ExtArgs> | null
    /**
     * The data used to create many LinkedInProfiles.
     */
    data: LinkedInProfileCreateManyInput | LinkedInProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * LinkedInProfile update
   */
  export type LinkedInProfileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInProfile
     */
    select?: LinkedInProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInProfile
     */
    omit?: LinkedInProfileOmit<ExtArgs> | null
    /**
     * The data needed to update a LinkedInProfile.
     */
    data: XOR<LinkedInProfileUpdateInput, LinkedInProfileUncheckedUpdateInput>
    /**
     * Choose, which LinkedInProfile to update.
     */
    where: LinkedInProfileWhereUniqueInput
  }

  /**
   * LinkedInProfile updateMany
   */
  export type LinkedInProfileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update LinkedInProfiles.
     */
    data: XOR<LinkedInProfileUpdateManyMutationInput, LinkedInProfileUncheckedUpdateManyInput>
    /**
     * Filter which LinkedInProfiles to update
     */
    where?: LinkedInProfileWhereInput
    /**
     * Limit how many LinkedInProfiles to update.
     */
    limit?: number
  }

  /**
   * LinkedInProfile updateManyAndReturn
   */
  export type LinkedInProfileUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInProfile
     */
    select?: LinkedInProfileSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInProfile
     */
    omit?: LinkedInProfileOmit<ExtArgs> | null
    /**
     * The data used to update LinkedInProfiles.
     */
    data: XOR<LinkedInProfileUpdateManyMutationInput, LinkedInProfileUncheckedUpdateManyInput>
    /**
     * Filter which LinkedInProfiles to update
     */
    where?: LinkedInProfileWhereInput
    /**
     * Limit how many LinkedInProfiles to update.
     */
    limit?: number
  }

  /**
   * LinkedInProfile upsert
   */
  export type LinkedInProfileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInProfile
     */
    select?: LinkedInProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInProfile
     */
    omit?: LinkedInProfileOmit<ExtArgs> | null
    /**
     * The filter to search for the LinkedInProfile to update in case it exists.
     */
    where: LinkedInProfileWhereUniqueInput
    /**
     * In case the LinkedInProfile found by the `where` argument doesn't exist, create a new LinkedInProfile with this data.
     */
    create: XOR<LinkedInProfileCreateInput, LinkedInProfileUncheckedCreateInput>
    /**
     * In case the LinkedInProfile was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LinkedInProfileUpdateInput, LinkedInProfileUncheckedUpdateInput>
  }

  /**
   * LinkedInProfile delete
   */
  export type LinkedInProfileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInProfile
     */
    select?: LinkedInProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInProfile
     */
    omit?: LinkedInProfileOmit<ExtArgs> | null
    /**
     * Filter which LinkedInProfile to delete.
     */
    where: LinkedInProfileWhereUniqueInput
  }

  /**
   * LinkedInProfile deleteMany
   */
  export type LinkedInProfileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LinkedInProfiles to delete
     */
    where?: LinkedInProfileWhereInput
    /**
     * Limit how many LinkedInProfiles to delete.
     */
    limit?: number
  }

  /**
   * LinkedInProfile without action
   */
  export type LinkedInProfileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LinkedInProfile
     */
    select?: LinkedInProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LinkedInProfile
     */
    omit?: LinkedInProfileOmit<ExtArgs> | null
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
    dailyAIcomments: 'dailyAIcomments',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const LinkedInAccountScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    username: 'username',
    encryptedPassword: 'encryptedPassword',
    twoFactorySecretKey: 'twoFactorySecretKey',
    createdAt: 'createdAt',
    staticIp: 'staticIp'
  };

  export type LinkedInAccountScalarFieldEnum = (typeof LinkedInAccountScalarFieldEnum)[keyof typeof LinkedInAccountScalarFieldEnum]


  export const ProfileImportRunScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    urls: 'urls',
    status: 'status',
    urlsSucceeded: 'urlsSucceeded',
    urlsFailed: 'urlsFailed',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ProfileImportRunScalarFieldEnum = (typeof ProfileImportRunScalarFieldEnum)[keyof typeof ProfileImportRunScalarFieldEnum]


  export const LinkedInProfileScalarFieldEnum: {
    id: 'id',
    linkedinUrl: 'linkedinUrl',
    fullName: 'fullName',
    headline: 'headline',
    urn: 'urn',
    profilePic: 'profilePic',
    firstName: 'firstName',
    lastName: 'lastName',
    connections: 'connections',
    followers: 'followers',
    email: 'email',
    mobileNumber: 'mobileNumber',
    jobTitle: 'jobTitle',
    companyName: 'companyName',
    companyIndustry: 'companyIndustry',
    companyWebsite: 'companyWebsite',
    companyLinkedin: 'companyLinkedin',
    companyFoundedIn: 'companyFoundedIn',
    companySize: 'companySize',
    currentJobDuration: 'currentJobDuration',
    currentJobDurationInYrs: 'currentJobDurationInYrs',
    topSkillsByEndorsements: 'topSkillsByEndorsements',
    addressCountryOnly: 'addressCountryOnly',
    addressWithCountry: 'addressWithCountry',
    addressWithoutCountry: 'addressWithoutCountry',
    profilePicHighQuality: 'profilePicHighQuality',
    about: 'about',
    publicIdentifier: 'publicIdentifier',
    openConnection: 'openConnection',
    experiences: 'experiences',
    updates: 'updates',
    skills: 'skills',
    profilePicAllDimensions: 'profilePicAllDimensions',
    educations: 'educations',
    licenseAndCertificates: 'licenseAndCertificates',
    honorsAndAwards: 'honorsAndAwards',
    languages: 'languages',
    volunteerAndAwards: 'volunteerAndAwards',
    verifications: 'verifications',
    promos: 'promos',
    highlights: 'highlights',
    projects: 'projects',
    publications: 'publications',
    patents: 'patents',
    courses: 'courses',
    testScores: 'testScores',
    organizations: 'organizations',
    volunteerCauses: 'volunteerCauses',
    interests: 'interests',
    recommendations: 'recommendations',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type LinkedInProfileScalarFieldEnum = (typeof LinkedInProfileScalarFieldEnum)[keyof typeof LinkedInProfileScalarFieldEnum]


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
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'ImportStatus'
   */
  export type EnumImportStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ImportStatus'>
    


  /**
   * Reference to a field of type 'ImportStatus[]'
   */
  export type ListEnumImportStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ImportStatus[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    firstName?: StringNullableFilter<"User"> | string | null
    lastName?: StringNullableFilter<"User"> | string | null
    username?: StringNullableFilter<"User"> | string | null
    primaryEmailAddress?: StringFilter<"User"> | string
    imageUrl?: StringNullableFilter<"User"> | string | null
    clerkUserProperties?: JsonNullableFilter<"User">
    stripeCustomerId?: StringNullableFilter<"User"> | string | null
    accessType?: EnumAccessTypeFilter<"User"> | $Enums.AccessType
    stripeUserProperties?: JsonNullableFilter<"User">
    dailyAIcomments?: IntFilter<"User"> | number
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    profileImportRuns?: ProfileImportRunListRelationFilter
    linkedInAccounts?: LinkedInAccountListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    firstName?: SortOrderInput | SortOrder
    lastName?: SortOrderInput | SortOrder
    username?: SortOrderInput | SortOrder
    primaryEmailAddress?: SortOrder
    imageUrl?: SortOrderInput | SortOrder
    clerkUserProperties?: SortOrderInput | SortOrder
    stripeCustomerId?: SortOrderInput | SortOrder
    accessType?: SortOrder
    stripeUserProperties?: SortOrderInput | SortOrder
    dailyAIcomments?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    profileImportRuns?: ProfileImportRunOrderByRelationAggregateInput
    linkedInAccounts?: LinkedInAccountOrderByRelationAggregateInput
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
    dailyAIcomments?: IntFilter<"User"> | number
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    profileImportRuns?: ProfileImportRunListRelationFilter
    linkedInAccounts?: LinkedInAccountListRelationFilter
  }, "id" | "username" | "primaryEmailAddress" | "stripeCustomerId">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    firstName?: SortOrderInput | SortOrder
    lastName?: SortOrderInput | SortOrder
    username?: SortOrderInput | SortOrder
    primaryEmailAddress?: SortOrder
    imageUrl?: SortOrderInput | SortOrder
    clerkUserProperties?: SortOrderInput | SortOrder
    stripeCustomerId?: SortOrderInput | SortOrder
    accessType?: SortOrder
    stripeUserProperties?: SortOrderInput | SortOrder
    dailyAIcomments?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    firstName?: StringNullableWithAggregatesFilter<"User"> | string | null
    lastName?: StringNullableWithAggregatesFilter<"User"> | string | null
    username?: StringNullableWithAggregatesFilter<"User"> | string | null
    primaryEmailAddress?: StringWithAggregatesFilter<"User"> | string
    imageUrl?: StringNullableWithAggregatesFilter<"User"> | string | null
    clerkUserProperties?: JsonNullableWithAggregatesFilter<"User">
    stripeCustomerId?: StringNullableWithAggregatesFilter<"User"> | string | null
    accessType?: EnumAccessTypeWithAggregatesFilter<"User"> | $Enums.AccessType
    stripeUserProperties?: JsonNullableWithAggregatesFilter<"User">
    dailyAIcomments?: IntWithAggregatesFilter<"User"> | number
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type LinkedInAccountWhereInput = {
    AND?: LinkedInAccountWhereInput | LinkedInAccountWhereInput[]
    OR?: LinkedInAccountWhereInput[]
    NOT?: LinkedInAccountWhereInput | LinkedInAccountWhereInput[]
    id?: StringFilter<"LinkedInAccount"> | string
    userId?: StringFilter<"LinkedInAccount"> | string
    username?: StringFilter<"LinkedInAccount"> | string
    encryptedPassword?: StringFilter<"LinkedInAccount"> | string
    twoFactorySecretKey?: StringFilter<"LinkedInAccount"> | string
    createdAt?: DateTimeFilter<"LinkedInAccount"> | Date | string
    staticIp?: StringNullableFilter<"LinkedInAccount"> | string | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type LinkedInAccountOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    username?: SortOrder
    encryptedPassword?: SortOrder
    twoFactorySecretKey?: SortOrder
    createdAt?: SortOrder
    staticIp?: SortOrderInput | SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type LinkedInAccountWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: LinkedInAccountWhereInput | LinkedInAccountWhereInput[]
    OR?: LinkedInAccountWhereInput[]
    NOT?: LinkedInAccountWhereInput | LinkedInAccountWhereInput[]
    userId?: StringFilter<"LinkedInAccount"> | string
    username?: StringFilter<"LinkedInAccount"> | string
    encryptedPassword?: StringFilter<"LinkedInAccount"> | string
    twoFactorySecretKey?: StringFilter<"LinkedInAccount"> | string
    createdAt?: DateTimeFilter<"LinkedInAccount"> | Date | string
    staticIp?: StringNullableFilter<"LinkedInAccount"> | string | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type LinkedInAccountOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    username?: SortOrder
    encryptedPassword?: SortOrder
    twoFactorySecretKey?: SortOrder
    createdAt?: SortOrder
    staticIp?: SortOrderInput | SortOrder
    _count?: LinkedInAccountCountOrderByAggregateInput
    _max?: LinkedInAccountMaxOrderByAggregateInput
    _min?: LinkedInAccountMinOrderByAggregateInput
  }

  export type LinkedInAccountScalarWhereWithAggregatesInput = {
    AND?: LinkedInAccountScalarWhereWithAggregatesInput | LinkedInAccountScalarWhereWithAggregatesInput[]
    OR?: LinkedInAccountScalarWhereWithAggregatesInput[]
    NOT?: LinkedInAccountScalarWhereWithAggregatesInput | LinkedInAccountScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"LinkedInAccount"> | string
    userId?: StringWithAggregatesFilter<"LinkedInAccount"> | string
    username?: StringWithAggregatesFilter<"LinkedInAccount"> | string
    encryptedPassword?: StringWithAggregatesFilter<"LinkedInAccount"> | string
    twoFactorySecretKey?: StringWithAggregatesFilter<"LinkedInAccount"> | string
    createdAt?: DateTimeWithAggregatesFilter<"LinkedInAccount"> | Date | string
    staticIp?: StringNullableWithAggregatesFilter<"LinkedInAccount"> | string | null
  }

  export type ProfileImportRunWhereInput = {
    AND?: ProfileImportRunWhereInput | ProfileImportRunWhereInput[]
    OR?: ProfileImportRunWhereInput[]
    NOT?: ProfileImportRunWhereInput | ProfileImportRunWhereInput[]
    id?: StringFilter<"ProfileImportRun"> | string
    userId?: StringFilter<"ProfileImportRun"> | string
    urls?: StringNullableListFilter<"ProfileImportRun">
    status?: EnumImportStatusFilter<"ProfileImportRun"> | $Enums.ImportStatus
    urlsSucceeded?: StringNullableListFilter<"ProfileImportRun">
    urlsFailed?: StringNullableListFilter<"ProfileImportRun">
    createdAt?: DateTimeFilter<"ProfileImportRun"> | Date | string
    updatedAt?: DateTimeFilter<"ProfileImportRun"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type ProfileImportRunOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    urls?: SortOrder
    status?: SortOrder
    urlsSucceeded?: SortOrder
    urlsFailed?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type ProfileImportRunWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ProfileImportRunWhereInput | ProfileImportRunWhereInput[]
    OR?: ProfileImportRunWhereInput[]
    NOT?: ProfileImportRunWhereInput | ProfileImportRunWhereInput[]
    userId?: StringFilter<"ProfileImportRun"> | string
    urls?: StringNullableListFilter<"ProfileImportRun">
    status?: EnumImportStatusFilter<"ProfileImportRun"> | $Enums.ImportStatus
    urlsSucceeded?: StringNullableListFilter<"ProfileImportRun">
    urlsFailed?: StringNullableListFilter<"ProfileImportRun">
    createdAt?: DateTimeFilter<"ProfileImportRun"> | Date | string
    updatedAt?: DateTimeFilter<"ProfileImportRun"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type ProfileImportRunOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    urls?: SortOrder
    status?: SortOrder
    urlsSucceeded?: SortOrder
    urlsFailed?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ProfileImportRunCountOrderByAggregateInput
    _max?: ProfileImportRunMaxOrderByAggregateInput
    _min?: ProfileImportRunMinOrderByAggregateInput
  }

  export type ProfileImportRunScalarWhereWithAggregatesInput = {
    AND?: ProfileImportRunScalarWhereWithAggregatesInput | ProfileImportRunScalarWhereWithAggregatesInput[]
    OR?: ProfileImportRunScalarWhereWithAggregatesInput[]
    NOT?: ProfileImportRunScalarWhereWithAggregatesInput | ProfileImportRunScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ProfileImportRun"> | string
    userId?: StringWithAggregatesFilter<"ProfileImportRun"> | string
    urls?: StringNullableListFilter<"ProfileImportRun">
    status?: EnumImportStatusWithAggregatesFilter<"ProfileImportRun"> | $Enums.ImportStatus
    urlsSucceeded?: StringNullableListFilter<"ProfileImportRun">
    urlsFailed?: StringNullableListFilter<"ProfileImportRun">
    createdAt?: DateTimeWithAggregatesFilter<"ProfileImportRun"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ProfileImportRun"> | Date | string
  }

  export type LinkedInProfileWhereInput = {
    AND?: LinkedInProfileWhereInput | LinkedInProfileWhereInput[]
    OR?: LinkedInProfileWhereInput[]
    NOT?: LinkedInProfileWhereInput | LinkedInProfileWhereInput[]
    id?: StringFilter<"LinkedInProfile"> | string
    linkedinUrl?: StringFilter<"LinkedInProfile"> | string
    fullName?: StringFilter<"LinkedInProfile"> | string
    headline?: StringFilter<"LinkedInProfile"> | string
    urn?: StringFilter<"LinkedInProfile"> | string
    profilePic?: StringFilter<"LinkedInProfile"> | string
    firstName?: StringNullableFilter<"LinkedInProfile"> | string | null
    lastName?: StringNullableFilter<"LinkedInProfile"> | string | null
    connections?: IntNullableFilter<"LinkedInProfile"> | number | null
    followers?: IntNullableFilter<"LinkedInProfile"> | number | null
    email?: StringNullableFilter<"LinkedInProfile"> | string | null
    mobileNumber?: StringNullableFilter<"LinkedInProfile"> | string | null
    jobTitle?: StringNullableFilter<"LinkedInProfile"> | string | null
    companyName?: StringNullableFilter<"LinkedInProfile"> | string | null
    companyIndustry?: StringNullableFilter<"LinkedInProfile"> | string | null
    companyWebsite?: StringNullableFilter<"LinkedInProfile"> | string | null
    companyLinkedin?: StringNullableFilter<"LinkedInProfile"> | string | null
    companyFoundedIn?: IntNullableFilter<"LinkedInProfile"> | number | null
    companySize?: StringNullableFilter<"LinkedInProfile"> | string | null
    currentJobDuration?: StringNullableFilter<"LinkedInProfile"> | string | null
    currentJobDurationInYrs?: FloatNullableFilter<"LinkedInProfile"> | number | null
    topSkillsByEndorsements?: StringNullableFilter<"LinkedInProfile"> | string | null
    addressCountryOnly?: StringNullableFilter<"LinkedInProfile"> | string | null
    addressWithCountry?: StringNullableFilter<"LinkedInProfile"> | string | null
    addressWithoutCountry?: StringNullableFilter<"LinkedInProfile"> | string | null
    profilePicHighQuality?: StringNullableFilter<"LinkedInProfile"> | string | null
    about?: StringNullableFilter<"LinkedInProfile"> | string | null
    publicIdentifier?: StringNullableFilter<"LinkedInProfile"> | string | null
    openConnection?: BoolNullableFilter<"LinkedInProfile"> | boolean | null
    experiences?: JsonNullableFilter<"LinkedInProfile">
    updates?: JsonNullableFilter<"LinkedInProfile">
    skills?: JsonNullableFilter<"LinkedInProfile">
    profilePicAllDimensions?: JsonNullableFilter<"LinkedInProfile">
    educations?: JsonNullableFilter<"LinkedInProfile">
    licenseAndCertificates?: JsonNullableFilter<"LinkedInProfile">
    honorsAndAwards?: JsonNullableFilter<"LinkedInProfile">
    languages?: JsonNullableFilter<"LinkedInProfile">
    volunteerAndAwards?: JsonNullableFilter<"LinkedInProfile">
    verifications?: JsonNullableFilter<"LinkedInProfile">
    promos?: JsonNullableFilter<"LinkedInProfile">
    highlights?: JsonNullableFilter<"LinkedInProfile">
    projects?: JsonNullableFilter<"LinkedInProfile">
    publications?: JsonNullableFilter<"LinkedInProfile">
    patents?: JsonNullableFilter<"LinkedInProfile">
    courses?: JsonNullableFilter<"LinkedInProfile">
    testScores?: JsonNullableFilter<"LinkedInProfile">
    organizations?: JsonNullableFilter<"LinkedInProfile">
    volunteerCauses?: JsonNullableFilter<"LinkedInProfile">
    interests?: JsonNullableFilter<"LinkedInProfile">
    recommendations?: JsonNullableFilter<"LinkedInProfile">
    createdAt?: DateTimeFilter<"LinkedInProfile"> | Date | string
    updatedAt?: DateTimeFilter<"LinkedInProfile"> | Date | string
  }

  export type LinkedInProfileOrderByWithRelationInput = {
    id?: SortOrder
    linkedinUrl?: SortOrder
    fullName?: SortOrder
    headline?: SortOrder
    urn?: SortOrder
    profilePic?: SortOrder
    firstName?: SortOrderInput | SortOrder
    lastName?: SortOrderInput | SortOrder
    connections?: SortOrderInput | SortOrder
    followers?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    mobileNumber?: SortOrderInput | SortOrder
    jobTitle?: SortOrderInput | SortOrder
    companyName?: SortOrderInput | SortOrder
    companyIndustry?: SortOrderInput | SortOrder
    companyWebsite?: SortOrderInput | SortOrder
    companyLinkedin?: SortOrderInput | SortOrder
    companyFoundedIn?: SortOrderInput | SortOrder
    companySize?: SortOrderInput | SortOrder
    currentJobDuration?: SortOrderInput | SortOrder
    currentJobDurationInYrs?: SortOrderInput | SortOrder
    topSkillsByEndorsements?: SortOrderInput | SortOrder
    addressCountryOnly?: SortOrderInput | SortOrder
    addressWithCountry?: SortOrderInput | SortOrder
    addressWithoutCountry?: SortOrderInput | SortOrder
    profilePicHighQuality?: SortOrderInput | SortOrder
    about?: SortOrderInput | SortOrder
    publicIdentifier?: SortOrderInput | SortOrder
    openConnection?: SortOrderInput | SortOrder
    experiences?: SortOrderInput | SortOrder
    updates?: SortOrderInput | SortOrder
    skills?: SortOrderInput | SortOrder
    profilePicAllDimensions?: SortOrderInput | SortOrder
    educations?: SortOrderInput | SortOrder
    licenseAndCertificates?: SortOrderInput | SortOrder
    honorsAndAwards?: SortOrderInput | SortOrder
    languages?: SortOrderInput | SortOrder
    volunteerAndAwards?: SortOrderInput | SortOrder
    verifications?: SortOrderInput | SortOrder
    promos?: SortOrderInput | SortOrder
    highlights?: SortOrderInput | SortOrder
    projects?: SortOrderInput | SortOrder
    publications?: SortOrderInput | SortOrder
    patents?: SortOrderInput | SortOrder
    courses?: SortOrderInput | SortOrder
    testScores?: SortOrderInput | SortOrder
    organizations?: SortOrderInput | SortOrder
    volunteerCauses?: SortOrderInput | SortOrder
    interests?: SortOrderInput | SortOrder
    recommendations?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LinkedInProfileWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    urn?: string
    AND?: LinkedInProfileWhereInput | LinkedInProfileWhereInput[]
    OR?: LinkedInProfileWhereInput[]
    NOT?: LinkedInProfileWhereInput | LinkedInProfileWhereInput[]
    linkedinUrl?: StringFilter<"LinkedInProfile"> | string
    fullName?: StringFilter<"LinkedInProfile"> | string
    headline?: StringFilter<"LinkedInProfile"> | string
    profilePic?: StringFilter<"LinkedInProfile"> | string
    firstName?: StringNullableFilter<"LinkedInProfile"> | string | null
    lastName?: StringNullableFilter<"LinkedInProfile"> | string | null
    connections?: IntNullableFilter<"LinkedInProfile"> | number | null
    followers?: IntNullableFilter<"LinkedInProfile"> | number | null
    email?: StringNullableFilter<"LinkedInProfile"> | string | null
    mobileNumber?: StringNullableFilter<"LinkedInProfile"> | string | null
    jobTitle?: StringNullableFilter<"LinkedInProfile"> | string | null
    companyName?: StringNullableFilter<"LinkedInProfile"> | string | null
    companyIndustry?: StringNullableFilter<"LinkedInProfile"> | string | null
    companyWebsite?: StringNullableFilter<"LinkedInProfile"> | string | null
    companyLinkedin?: StringNullableFilter<"LinkedInProfile"> | string | null
    companyFoundedIn?: IntNullableFilter<"LinkedInProfile"> | number | null
    companySize?: StringNullableFilter<"LinkedInProfile"> | string | null
    currentJobDuration?: StringNullableFilter<"LinkedInProfile"> | string | null
    currentJobDurationInYrs?: FloatNullableFilter<"LinkedInProfile"> | number | null
    topSkillsByEndorsements?: StringNullableFilter<"LinkedInProfile"> | string | null
    addressCountryOnly?: StringNullableFilter<"LinkedInProfile"> | string | null
    addressWithCountry?: StringNullableFilter<"LinkedInProfile"> | string | null
    addressWithoutCountry?: StringNullableFilter<"LinkedInProfile"> | string | null
    profilePicHighQuality?: StringNullableFilter<"LinkedInProfile"> | string | null
    about?: StringNullableFilter<"LinkedInProfile"> | string | null
    publicIdentifier?: StringNullableFilter<"LinkedInProfile"> | string | null
    openConnection?: BoolNullableFilter<"LinkedInProfile"> | boolean | null
    experiences?: JsonNullableFilter<"LinkedInProfile">
    updates?: JsonNullableFilter<"LinkedInProfile">
    skills?: JsonNullableFilter<"LinkedInProfile">
    profilePicAllDimensions?: JsonNullableFilter<"LinkedInProfile">
    educations?: JsonNullableFilter<"LinkedInProfile">
    licenseAndCertificates?: JsonNullableFilter<"LinkedInProfile">
    honorsAndAwards?: JsonNullableFilter<"LinkedInProfile">
    languages?: JsonNullableFilter<"LinkedInProfile">
    volunteerAndAwards?: JsonNullableFilter<"LinkedInProfile">
    verifications?: JsonNullableFilter<"LinkedInProfile">
    promos?: JsonNullableFilter<"LinkedInProfile">
    highlights?: JsonNullableFilter<"LinkedInProfile">
    projects?: JsonNullableFilter<"LinkedInProfile">
    publications?: JsonNullableFilter<"LinkedInProfile">
    patents?: JsonNullableFilter<"LinkedInProfile">
    courses?: JsonNullableFilter<"LinkedInProfile">
    testScores?: JsonNullableFilter<"LinkedInProfile">
    organizations?: JsonNullableFilter<"LinkedInProfile">
    volunteerCauses?: JsonNullableFilter<"LinkedInProfile">
    interests?: JsonNullableFilter<"LinkedInProfile">
    recommendations?: JsonNullableFilter<"LinkedInProfile">
    createdAt?: DateTimeFilter<"LinkedInProfile"> | Date | string
    updatedAt?: DateTimeFilter<"LinkedInProfile"> | Date | string
  }, "id" | "urn">

  export type LinkedInProfileOrderByWithAggregationInput = {
    id?: SortOrder
    linkedinUrl?: SortOrder
    fullName?: SortOrder
    headline?: SortOrder
    urn?: SortOrder
    profilePic?: SortOrder
    firstName?: SortOrderInput | SortOrder
    lastName?: SortOrderInput | SortOrder
    connections?: SortOrderInput | SortOrder
    followers?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    mobileNumber?: SortOrderInput | SortOrder
    jobTitle?: SortOrderInput | SortOrder
    companyName?: SortOrderInput | SortOrder
    companyIndustry?: SortOrderInput | SortOrder
    companyWebsite?: SortOrderInput | SortOrder
    companyLinkedin?: SortOrderInput | SortOrder
    companyFoundedIn?: SortOrderInput | SortOrder
    companySize?: SortOrderInput | SortOrder
    currentJobDuration?: SortOrderInput | SortOrder
    currentJobDurationInYrs?: SortOrderInput | SortOrder
    topSkillsByEndorsements?: SortOrderInput | SortOrder
    addressCountryOnly?: SortOrderInput | SortOrder
    addressWithCountry?: SortOrderInput | SortOrder
    addressWithoutCountry?: SortOrderInput | SortOrder
    profilePicHighQuality?: SortOrderInput | SortOrder
    about?: SortOrderInput | SortOrder
    publicIdentifier?: SortOrderInput | SortOrder
    openConnection?: SortOrderInput | SortOrder
    experiences?: SortOrderInput | SortOrder
    updates?: SortOrderInput | SortOrder
    skills?: SortOrderInput | SortOrder
    profilePicAllDimensions?: SortOrderInput | SortOrder
    educations?: SortOrderInput | SortOrder
    licenseAndCertificates?: SortOrderInput | SortOrder
    honorsAndAwards?: SortOrderInput | SortOrder
    languages?: SortOrderInput | SortOrder
    volunteerAndAwards?: SortOrderInput | SortOrder
    verifications?: SortOrderInput | SortOrder
    promos?: SortOrderInput | SortOrder
    highlights?: SortOrderInput | SortOrder
    projects?: SortOrderInput | SortOrder
    publications?: SortOrderInput | SortOrder
    patents?: SortOrderInput | SortOrder
    courses?: SortOrderInput | SortOrder
    testScores?: SortOrderInput | SortOrder
    organizations?: SortOrderInput | SortOrder
    volunteerCauses?: SortOrderInput | SortOrder
    interests?: SortOrderInput | SortOrder
    recommendations?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: LinkedInProfileCountOrderByAggregateInput
    _avg?: LinkedInProfileAvgOrderByAggregateInput
    _max?: LinkedInProfileMaxOrderByAggregateInput
    _min?: LinkedInProfileMinOrderByAggregateInput
    _sum?: LinkedInProfileSumOrderByAggregateInput
  }

  export type LinkedInProfileScalarWhereWithAggregatesInput = {
    AND?: LinkedInProfileScalarWhereWithAggregatesInput | LinkedInProfileScalarWhereWithAggregatesInput[]
    OR?: LinkedInProfileScalarWhereWithAggregatesInput[]
    NOT?: LinkedInProfileScalarWhereWithAggregatesInput | LinkedInProfileScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"LinkedInProfile"> | string
    linkedinUrl?: StringWithAggregatesFilter<"LinkedInProfile"> | string
    fullName?: StringWithAggregatesFilter<"LinkedInProfile"> | string
    headline?: StringWithAggregatesFilter<"LinkedInProfile"> | string
    urn?: StringWithAggregatesFilter<"LinkedInProfile"> | string
    profilePic?: StringWithAggregatesFilter<"LinkedInProfile"> | string
    firstName?: StringNullableWithAggregatesFilter<"LinkedInProfile"> | string | null
    lastName?: StringNullableWithAggregatesFilter<"LinkedInProfile"> | string | null
    connections?: IntNullableWithAggregatesFilter<"LinkedInProfile"> | number | null
    followers?: IntNullableWithAggregatesFilter<"LinkedInProfile"> | number | null
    email?: StringNullableWithAggregatesFilter<"LinkedInProfile"> | string | null
    mobileNumber?: StringNullableWithAggregatesFilter<"LinkedInProfile"> | string | null
    jobTitle?: StringNullableWithAggregatesFilter<"LinkedInProfile"> | string | null
    companyName?: StringNullableWithAggregatesFilter<"LinkedInProfile"> | string | null
    companyIndustry?: StringNullableWithAggregatesFilter<"LinkedInProfile"> | string | null
    companyWebsite?: StringNullableWithAggregatesFilter<"LinkedInProfile"> | string | null
    companyLinkedin?: StringNullableWithAggregatesFilter<"LinkedInProfile"> | string | null
    companyFoundedIn?: IntNullableWithAggregatesFilter<"LinkedInProfile"> | number | null
    companySize?: StringNullableWithAggregatesFilter<"LinkedInProfile"> | string | null
    currentJobDuration?: StringNullableWithAggregatesFilter<"LinkedInProfile"> | string | null
    currentJobDurationInYrs?: FloatNullableWithAggregatesFilter<"LinkedInProfile"> | number | null
    topSkillsByEndorsements?: StringNullableWithAggregatesFilter<"LinkedInProfile"> | string | null
    addressCountryOnly?: StringNullableWithAggregatesFilter<"LinkedInProfile"> | string | null
    addressWithCountry?: StringNullableWithAggregatesFilter<"LinkedInProfile"> | string | null
    addressWithoutCountry?: StringNullableWithAggregatesFilter<"LinkedInProfile"> | string | null
    profilePicHighQuality?: StringNullableWithAggregatesFilter<"LinkedInProfile"> | string | null
    about?: StringNullableWithAggregatesFilter<"LinkedInProfile"> | string | null
    publicIdentifier?: StringNullableWithAggregatesFilter<"LinkedInProfile"> | string | null
    openConnection?: BoolNullableWithAggregatesFilter<"LinkedInProfile"> | boolean | null
    experiences?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    updates?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    skills?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    profilePicAllDimensions?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    educations?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    licenseAndCertificates?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    honorsAndAwards?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    languages?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    volunteerAndAwards?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    verifications?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    promos?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    highlights?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    projects?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    publications?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    patents?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    courses?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    testScores?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    organizations?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    volunteerCauses?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    interests?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    recommendations?: JsonNullableWithAggregatesFilter<"LinkedInProfile">
    createdAt?: DateTimeWithAggregatesFilter<"LinkedInProfile"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"LinkedInProfile"> | Date | string
  }

  export type UserCreateInput = {
    id: string
    firstName?: string | null
    lastName?: string | null
    username?: string | null
    primaryEmailAddress: string
    imageUrl?: string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: string | null
    accessType?: $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    dailyAIcomments?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    profileImportRuns?: ProfileImportRunCreateNestedManyWithoutUserInput
    linkedInAccounts?: LinkedInAccountCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id: string
    firstName?: string | null
    lastName?: string | null
    username?: string | null
    primaryEmailAddress: string
    imageUrl?: string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: string | null
    accessType?: $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    dailyAIcomments?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    profileImportRuns?: ProfileImportRunUncheckedCreateNestedManyWithoutUserInput
    linkedInAccounts?: LinkedInAccountUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    username?: NullableStringFieldUpdateOperationsInput | string | null
    primaryEmailAddress?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: NullableStringFieldUpdateOperationsInput | string | null
    accessType?: EnumAccessTypeFieldUpdateOperationsInput | $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    dailyAIcomments?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profileImportRuns?: ProfileImportRunUpdateManyWithoutUserNestedInput
    linkedInAccounts?: LinkedInAccountUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    username?: NullableStringFieldUpdateOperationsInput | string | null
    primaryEmailAddress?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: NullableStringFieldUpdateOperationsInput | string | null
    accessType?: EnumAccessTypeFieldUpdateOperationsInput | $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    dailyAIcomments?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profileImportRuns?: ProfileImportRunUncheckedUpdateManyWithoutUserNestedInput
    linkedInAccounts?: LinkedInAccountUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id: string
    firstName?: string | null
    lastName?: string | null
    username?: string | null
    primaryEmailAddress: string
    imageUrl?: string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: string | null
    accessType?: $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    dailyAIcomments?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    username?: NullableStringFieldUpdateOperationsInput | string | null
    primaryEmailAddress?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: NullableStringFieldUpdateOperationsInput | string | null
    accessType?: EnumAccessTypeFieldUpdateOperationsInput | $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    dailyAIcomments?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    username?: NullableStringFieldUpdateOperationsInput | string | null
    primaryEmailAddress?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: NullableStringFieldUpdateOperationsInput | string | null
    accessType?: EnumAccessTypeFieldUpdateOperationsInput | $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    dailyAIcomments?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LinkedInAccountCreateInput = {
    id?: string
    username: string
    encryptedPassword: string
    twoFactorySecretKey: string
    createdAt?: Date | string
    staticIp?: string | null
    user: UserCreateNestedOneWithoutLinkedInAccountsInput
  }

  export type LinkedInAccountUncheckedCreateInput = {
    id?: string
    userId: string
    username: string
    encryptedPassword: string
    twoFactorySecretKey: string
    createdAt?: Date | string
    staticIp?: string | null
  }

  export type LinkedInAccountUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    encryptedPassword?: StringFieldUpdateOperationsInput | string
    twoFactorySecretKey?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    staticIp?: NullableStringFieldUpdateOperationsInput | string | null
    user?: UserUpdateOneRequiredWithoutLinkedInAccountsNestedInput
  }

  export type LinkedInAccountUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    encryptedPassword?: StringFieldUpdateOperationsInput | string
    twoFactorySecretKey?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    staticIp?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type LinkedInAccountCreateManyInput = {
    id?: string
    userId: string
    username: string
    encryptedPassword: string
    twoFactorySecretKey: string
    createdAt?: Date | string
    staticIp?: string | null
  }

  export type LinkedInAccountUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    encryptedPassword?: StringFieldUpdateOperationsInput | string
    twoFactorySecretKey?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    staticIp?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type LinkedInAccountUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    encryptedPassword?: StringFieldUpdateOperationsInput | string
    twoFactorySecretKey?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    staticIp?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ProfileImportRunCreateInput = {
    id?: string
    urls?: ProfileImportRunCreateurlsInput | string[]
    status?: $Enums.ImportStatus
    urlsSucceeded?: ProfileImportRunCreateurlsSucceededInput | string[]
    urlsFailed?: ProfileImportRunCreateurlsFailedInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutProfileImportRunsInput
  }

  export type ProfileImportRunUncheckedCreateInput = {
    id?: string
    userId: string
    urls?: ProfileImportRunCreateurlsInput | string[]
    status?: $Enums.ImportStatus
    urlsSucceeded?: ProfileImportRunCreateurlsSucceededInput | string[]
    urlsFailed?: ProfileImportRunCreateurlsFailedInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProfileImportRunUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    urls?: ProfileImportRunUpdateurlsInput | string[]
    status?: EnumImportStatusFieldUpdateOperationsInput | $Enums.ImportStatus
    urlsSucceeded?: ProfileImportRunUpdateurlsSucceededInput | string[]
    urlsFailed?: ProfileImportRunUpdateurlsFailedInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutProfileImportRunsNestedInput
  }

  export type ProfileImportRunUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    urls?: ProfileImportRunUpdateurlsInput | string[]
    status?: EnumImportStatusFieldUpdateOperationsInput | $Enums.ImportStatus
    urlsSucceeded?: ProfileImportRunUpdateurlsSucceededInput | string[]
    urlsFailed?: ProfileImportRunUpdateurlsFailedInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProfileImportRunCreateManyInput = {
    id?: string
    userId: string
    urls?: ProfileImportRunCreateurlsInput | string[]
    status?: $Enums.ImportStatus
    urlsSucceeded?: ProfileImportRunCreateurlsSucceededInput | string[]
    urlsFailed?: ProfileImportRunCreateurlsFailedInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProfileImportRunUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    urls?: ProfileImportRunUpdateurlsInput | string[]
    status?: EnumImportStatusFieldUpdateOperationsInput | $Enums.ImportStatus
    urlsSucceeded?: ProfileImportRunUpdateurlsSucceededInput | string[]
    urlsFailed?: ProfileImportRunUpdateurlsFailedInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProfileImportRunUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    urls?: ProfileImportRunUpdateurlsInput | string[]
    status?: EnumImportStatusFieldUpdateOperationsInput | $Enums.ImportStatus
    urlsSucceeded?: ProfileImportRunUpdateurlsSucceededInput | string[]
    urlsFailed?: ProfileImportRunUpdateurlsFailedInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LinkedInProfileCreateInput = {
    id?: string
    linkedinUrl: string
    fullName: string
    headline: string
    urn: string
    profilePic: string
    firstName?: string | null
    lastName?: string | null
    connections?: number | null
    followers?: number | null
    email?: string | null
    mobileNumber?: string | null
    jobTitle?: string | null
    companyName?: string | null
    companyIndustry?: string | null
    companyWebsite?: string | null
    companyLinkedin?: string | null
    companyFoundedIn?: number | null
    companySize?: string | null
    currentJobDuration?: string | null
    currentJobDurationInYrs?: number | null
    topSkillsByEndorsements?: string | null
    addressCountryOnly?: string | null
    addressWithCountry?: string | null
    addressWithoutCountry?: string | null
    profilePicHighQuality?: string | null
    about?: string | null
    publicIdentifier?: string | null
    openConnection?: boolean | null
    experiences?: NullableJsonNullValueInput | InputJsonValue
    updates?: NullableJsonNullValueInput | InputJsonValue
    skills?: NullableJsonNullValueInput | InputJsonValue
    profilePicAllDimensions?: NullableJsonNullValueInput | InputJsonValue
    educations?: NullableJsonNullValueInput | InputJsonValue
    licenseAndCertificates?: NullableJsonNullValueInput | InputJsonValue
    honorsAndAwards?: NullableJsonNullValueInput | InputJsonValue
    languages?: NullableJsonNullValueInput | InputJsonValue
    volunteerAndAwards?: NullableJsonNullValueInput | InputJsonValue
    verifications?: NullableJsonNullValueInput | InputJsonValue
    promos?: NullableJsonNullValueInput | InputJsonValue
    highlights?: NullableJsonNullValueInput | InputJsonValue
    projects?: NullableJsonNullValueInput | InputJsonValue
    publications?: NullableJsonNullValueInput | InputJsonValue
    patents?: NullableJsonNullValueInput | InputJsonValue
    courses?: NullableJsonNullValueInput | InputJsonValue
    testScores?: NullableJsonNullValueInput | InputJsonValue
    organizations?: NullableJsonNullValueInput | InputJsonValue
    volunteerCauses?: NullableJsonNullValueInput | InputJsonValue
    interests?: NullableJsonNullValueInput | InputJsonValue
    recommendations?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LinkedInProfileUncheckedCreateInput = {
    id?: string
    linkedinUrl: string
    fullName: string
    headline: string
    urn: string
    profilePic: string
    firstName?: string | null
    lastName?: string | null
    connections?: number | null
    followers?: number | null
    email?: string | null
    mobileNumber?: string | null
    jobTitle?: string | null
    companyName?: string | null
    companyIndustry?: string | null
    companyWebsite?: string | null
    companyLinkedin?: string | null
    companyFoundedIn?: number | null
    companySize?: string | null
    currentJobDuration?: string | null
    currentJobDurationInYrs?: number | null
    topSkillsByEndorsements?: string | null
    addressCountryOnly?: string | null
    addressWithCountry?: string | null
    addressWithoutCountry?: string | null
    profilePicHighQuality?: string | null
    about?: string | null
    publicIdentifier?: string | null
    openConnection?: boolean | null
    experiences?: NullableJsonNullValueInput | InputJsonValue
    updates?: NullableJsonNullValueInput | InputJsonValue
    skills?: NullableJsonNullValueInput | InputJsonValue
    profilePicAllDimensions?: NullableJsonNullValueInput | InputJsonValue
    educations?: NullableJsonNullValueInput | InputJsonValue
    licenseAndCertificates?: NullableJsonNullValueInput | InputJsonValue
    honorsAndAwards?: NullableJsonNullValueInput | InputJsonValue
    languages?: NullableJsonNullValueInput | InputJsonValue
    volunteerAndAwards?: NullableJsonNullValueInput | InputJsonValue
    verifications?: NullableJsonNullValueInput | InputJsonValue
    promos?: NullableJsonNullValueInput | InputJsonValue
    highlights?: NullableJsonNullValueInput | InputJsonValue
    projects?: NullableJsonNullValueInput | InputJsonValue
    publications?: NullableJsonNullValueInput | InputJsonValue
    patents?: NullableJsonNullValueInput | InputJsonValue
    courses?: NullableJsonNullValueInput | InputJsonValue
    testScores?: NullableJsonNullValueInput | InputJsonValue
    organizations?: NullableJsonNullValueInput | InputJsonValue
    volunteerCauses?: NullableJsonNullValueInput | InputJsonValue
    interests?: NullableJsonNullValueInput | InputJsonValue
    recommendations?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LinkedInProfileUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: StringFieldUpdateOperationsInput | string
    fullName?: StringFieldUpdateOperationsInput | string
    headline?: StringFieldUpdateOperationsInput | string
    urn?: StringFieldUpdateOperationsInput | string
    profilePic?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    connections?: NullableIntFieldUpdateOperationsInput | number | null
    followers?: NullableIntFieldUpdateOperationsInput | number | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNumber?: NullableStringFieldUpdateOperationsInput | string | null
    jobTitle?: NullableStringFieldUpdateOperationsInput | string | null
    companyName?: NullableStringFieldUpdateOperationsInput | string | null
    companyIndustry?: NullableStringFieldUpdateOperationsInput | string | null
    companyWebsite?: NullableStringFieldUpdateOperationsInput | string | null
    companyLinkedin?: NullableStringFieldUpdateOperationsInput | string | null
    companyFoundedIn?: NullableIntFieldUpdateOperationsInput | number | null
    companySize?: NullableStringFieldUpdateOperationsInput | string | null
    currentJobDuration?: NullableStringFieldUpdateOperationsInput | string | null
    currentJobDurationInYrs?: NullableFloatFieldUpdateOperationsInput | number | null
    topSkillsByEndorsements?: NullableStringFieldUpdateOperationsInput | string | null
    addressCountryOnly?: NullableStringFieldUpdateOperationsInput | string | null
    addressWithCountry?: NullableStringFieldUpdateOperationsInput | string | null
    addressWithoutCountry?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicHighQuality?: NullableStringFieldUpdateOperationsInput | string | null
    about?: NullableStringFieldUpdateOperationsInput | string | null
    publicIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    openConnection?: NullableBoolFieldUpdateOperationsInput | boolean | null
    experiences?: NullableJsonNullValueInput | InputJsonValue
    updates?: NullableJsonNullValueInput | InputJsonValue
    skills?: NullableJsonNullValueInput | InputJsonValue
    profilePicAllDimensions?: NullableJsonNullValueInput | InputJsonValue
    educations?: NullableJsonNullValueInput | InputJsonValue
    licenseAndCertificates?: NullableJsonNullValueInput | InputJsonValue
    honorsAndAwards?: NullableJsonNullValueInput | InputJsonValue
    languages?: NullableJsonNullValueInput | InputJsonValue
    volunteerAndAwards?: NullableJsonNullValueInput | InputJsonValue
    verifications?: NullableJsonNullValueInput | InputJsonValue
    promos?: NullableJsonNullValueInput | InputJsonValue
    highlights?: NullableJsonNullValueInput | InputJsonValue
    projects?: NullableJsonNullValueInput | InputJsonValue
    publications?: NullableJsonNullValueInput | InputJsonValue
    patents?: NullableJsonNullValueInput | InputJsonValue
    courses?: NullableJsonNullValueInput | InputJsonValue
    testScores?: NullableJsonNullValueInput | InputJsonValue
    organizations?: NullableJsonNullValueInput | InputJsonValue
    volunteerCauses?: NullableJsonNullValueInput | InputJsonValue
    interests?: NullableJsonNullValueInput | InputJsonValue
    recommendations?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LinkedInProfileUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: StringFieldUpdateOperationsInput | string
    fullName?: StringFieldUpdateOperationsInput | string
    headline?: StringFieldUpdateOperationsInput | string
    urn?: StringFieldUpdateOperationsInput | string
    profilePic?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    connections?: NullableIntFieldUpdateOperationsInput | number | null
    followers?: NullableIntFieldUpdateOperationsInput | number | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNumber?: NullableStringFieldUpdateOperationsInput | string | null
    jobTitle?: NullableStringFieldUpdateOperationsInput | string | null
    companyName?: NullableStringFieldUpdateOperationsInput | string | null
    companyIndustry?: NullableStringFieldUpdateOperationsInput | string | null
    companyWebsite?: NullableStringFieldUpdateOperationsInput | string | null
    companyLinkedin?: NullableStringFieldUpdateOperationsInput | string | null
    companyFoundedIn?: NullableIntFieldUpdateOperationsInput | number | null
    companySize?: NullableStringFieldUpdateOperationsInput | string | null
    currentJobDuration?: NullableStringFieldUpdateOperationsInput | string | null
    currentJobDurationInYrs?: NullableFloatFieldUpdateOperationsInput | number | null
    topSkillsByEndorsements?: NullableStringFieldUpdateOperationsInput | string | null
    addressCountryOnly?: NullableStringFieldUpdateOperationsInput | string | null
    addressWithCountry?: NullableStringFieldUpdateOperationsInput | string | null
    addressWithoutCountry?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicHighQuality?: NullableStringFieldUpdateOperationsInput | string | null
    about?: NullableStringFieldUpdateOperationsInput | string | null
    publicIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    openConnection?: NullableBoolFieldUpdateOperationsInput | boolean | null
    experiences?: NullableJsonNullValueInput | InputJsonValue
    updates?: NullableJsonNullValueInput | InputJsonValue
    skills?: NullableJsonNullValueInput | InputJsonValue
    profilePicAllDimensions?: NullableJsonNullValueInput | InputJsonValue
    educations?: NullableJsonNullValueInput | InputJsonValue
    licenseAndCertificates?: NullableJsonNullValueInput | InputJsonValue
    honorsAndAwards?: NullableJsonNullValueInput | InputJsonValue
    languages?: NullableJsonNullValueInput | InputJsonValue
    volunteerAndAwards?: NullableJsonNullValueInput | InputJsonValue
    verifications?: NullableJsonNullValueInput | InputJsonValue
    promos?: NullableJsonNullValueInput | InputJsonValue
    highlights?: NullableJsonNullValueInput | InputJsonValue
    projects?: NullableJsonNullValueInput | InputJsonValue
    publications?: NullableJsonNullValueInput | InputJsonValue
    patents?: NullableJsonNullValueInput | InputJsonValue
    courses?: NullableJsonNullValueInput | InputJsonValue
    testScores?: NullableJsonNullValueInput | InputJsonValue
    organizations?: NullableJsonNullValueInput | InputJsonValue
    volunteerCauses?: NullableJsonNullValueInput | InputJsonValue
    interests?: NullableJsonNullValueInput | InputJsonValue
    recommendations?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LinkedInProfileCreateManyInput = {
    id?: string
    linkedinUrl: string
    fullName: string
    headline: string
    urn: string
    profilePic: string
    firstName?: string | null
    lastName?: string | null
    connections?: number | null
    followers?: number | null
    email?: string | null
    mobileNumber?: string | null
    jobTitle?: string | null
    companyName?: string | null
    companyIndustry?: string | null
    companyWebsite?: string | null
    companyLinkedin?: string | null
    companyFoundedIn?: number | null
    companySize?: string | null
    currentJobDuration?: string | null
    currentJobDurationInYrs?: number | null
    topSkillsByEndorsements?: string | null
    addressCountryOnly?: string | null
    addressWithCountry?: string | null
    addressWithoutCountry?: string | null
    profilePicHighQuality?: string | null
    about?: string | null
    publicIdentifier?: string | null
    openConnection?: boolean | null
    experiences?: NullableJsonNullValueInput | InputJsonValue
    updates?: NullableJsonNullValueInput | InputJsonValue
    skills?: NullableJsonNullValueInput | InputJsonValue
    profilePicAllDimensions?: NullableJsonNullValueInput | InputJsonValue
    educations?: NullableJsonNullValueInput | InputJsonValue
    licenseAndCertificates?: NullableJsonNullValueInput | InputJsonValue
    honorsAndAwards?: NullableJsonNullValueInput | InputJsonValue
    languages?: NullableJsonNullValueInput | InputJsonValue
    volunteerAndAwards?: NullableJsonNullValueInput | InputJsonValue
    verifications?: NullableJsonNullValueInput | InputJsonValue
    promos?: NullableJsonNullValueInput | InputJsonValue
    highlights?: NullableJsonNullValueInput | InputJsonValue
    projects?: NullableJsonNullValueInput | InputJsonValue
    publications?: NullableJsonNullValueInput | InputJsonValue
    patents?: NullableJsonNullValueInput | InputJsonValue
    courses?: NullableJsonNullValueInput | InputJsonValue
    testScores?: NullableJsonNullValueInput | InputJsonValue
    organizations?: NullableJsonNullValueInput | InputJsonValue
    volunteerCauses?: NullableJsonNullValueInput | InputJsonValue
    interests?: NullableJsonNullValueInput | InputJsonValue
    recommendations?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LinkedInProfileUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: StringFieldUpdateOperationsInput | string
    fullName?: StringFieldUpdateOperationsInput | string
    headline?: StringFieldUpdateOperationsInput | string
    urn?: StringFieldUpdateOperationsInput | string
    profilePic?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    connections?: NullableIntFieldUpdateOperationsInput | number | null
    followers?: NullableIntFieldUpdateOperationsInput | number | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNumber?: NullableStringFieldUpdateOperationsInput | string | null
    jobTitle?: NullableStringFieldUpdateOperationsInput | string | null
    companyName?: NullableStringFieldUpdateOperationsInput | string | null
    companyIndustry?: NullableStringFieldUpdateOperationsInput | string | null
    companyWebsite?: NullableStringFieldUpdateOperationsInput | string | null
    companyLinkedin?: NullableStringFieldUpdateOperationsInput | string | null
    companyFoundedIn?: NullableIntFieldUpdateOperationsInput | number | null
    companySize?: NullableStringFieldUpdateOperationsInput | string | null
    currentJobDuration?: NullableStringFieldUpdateOperationsInput | string | null
    currentJobDurationInYrs?: NullableFloatFieldUpdateOperationsInput | number | null
    topSkillsByEndorsements?: NullableStringFieldUpdateOperationsInput | string | null
    addressCountryOnly?: NullableStringFieldUpdateOperationsInput | string | null
    addressWithCountry?: NullableStringFieldUpdateOperationsInput | string | null
    addressWithoutCountry?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicHighQuality?: NullableStringFieldUpdateOperationsInput | string | null
    about?: NullableStringFieldUpdateOperationsInput | string | null
    publicIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    openConnection?: NullableBoolFieldUpdateOperationsInput | boolean | null
    experiences?: NullableJsonNullValueInput | InputJsonValue
    updates?: NullableJsonNullValueInput | InputJsonValue
    skills?: NullableJsonNullValueInput | InputJsonValue
    profilePicAllDimensions?: NullableJsonNullValueInput | InputJsonValue
    educations?: NullableJsonNullValueInput | InputJsonValue
    licenseAndCertificates?: NullableJsonNullValueInput | InputJsonValue
    honorsAndAwards?: NullableJsonNullValueInput | InputJsonValue
    languages?: NullableJsonNullValueInput | InputJsonValue
    volunteerAndAwards?: NullableJsonNullValueInput | InputJsonValue
    verifications?: NullableJsonNullValueInput | InputJsonValue
    promos?: NullableJsonNullValueInput | InputJsonValue
    highlights?: NullableJsonNullValueInput | InputJsonValue
    projects?: NullableJsonNullValueInput | InputJsonValue
    publications?: NullableJsonNullValueInput | InputJsonValue
    patents?: NullableJsonNullValueInput | InputJsonValue
    courses?: NullableJsonNullValueInput | InputJsonValue
    testScores?: NullableJsonNullValueInput | InputJsonValue
    organizations?: NullableJsonNullValueInput | InputJsonValue
    volunteerCauses?: NullableJsonNullValueInput | InputJsonValue
    interests?: NullableJsonNullValueInput | InputJsonValue
    recommendations?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LinkedInProfileUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: StringFieldUpdateOperationsInput | string
    fullName?: StringFieldUpdateOperationsInput | string
    headline?: StringFieldUpdateOperationsInput | string
    urn?: StringFieldUpdateOperationsInput | string
    profilePic?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    connections?: NullableIntFieldUpdateOperationsInput | number | null
    followers?: NullableIntFieldUpdateOperationsInput | number | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNumber?: NullableStringFieldUpdateOperationsInput | string | null
    jobTitle?: NullableStringFieldUpdateOperationsInput | string | null
    companyName?: NullableStringFieldUpdateOperationsInput | string | null
    companyIndustry?: NullableStringFieldUpdateOperationsInput | string | null
    companyWebsite?: NullableStringFieldUpdateOperationsInput | string | null
    companyLinkedin?: NullableStringFieldUpdateOperationsInput | string | null
    companyFoundedIn?: NullableIntFieldUpdateOperationsInput | number | null
    companySize?: NullableStringFieldUpdateOperationsInput | string | null
    currentJobDuration?: NullableStringFieldUpdateOperationsInput | string | null
    currentJobDurationInYrs?: NullableFloatFieldUpdateOperationsInput | number | null
    topSkillsByEndorsements?: NullableStringFieldUpdateOperationsInput | string | null
    addressCountryOnly?: NullableStringFieldUpdateOperationsInput | string | null
    addressWithCountry?: NullableStringFieldUpdateOperationsInput | string | null
    addressWithoutCountry?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicHighQuality?: NullableStringFieldUpdateOperationsInput | string | null
    about?: NullableStringFieldUpdateOperationsInput | string | null
    publicIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    openConnection?: NullableBoolFieldUpdateOperationsInput | boolean | null
    experiences?: NullableJsonNullValueInput | InputJsonValue
    updates?: NullableJsonNullValueInput | InputJsonValue
    skills?: NullableJsonNullValueInput | InputJsonValue
    profilePicAllDimensions?: NullableJsonNullValueInput | InputJsonValue
    educations?: NullableJsonNullValueInput | InputJsonValue
    licenseAndCertificates?: NullableJsonNullValueInput | InputJsonValue
    honorsAndAwards?: NullableJsonNullValueInput | InputJsonValue
    languages?: NullableJsonNullValueInput | InputJsonValue
    volunteerAndAwards?: NullableJsonNullValueInput | InputJsonValue
    verifications?: NullableJsonNullValueInput | InputJsonValue
    promos?: NullableJsonNullValueInput | InputJsonValue
    highlights?: NullableJsonNullValueInput | InputJsonValue
    projects?: NullableJsonNullValueInput | InputJsonValue
    publications?: NullableJsonNullValueInput | InputJsonValue
    patents?: NullableJsonNullValueInput | InputJsonValue
    courses?: NullableJsonNullValueInput | InputJsonValue
    testScores?: NullableJsonNullValueInput | InputJsonValue
    organizations?: NullableJsonNullValueInput | InputJsonValue
    volunteerCauses?: NullableJsonNullValueInput | InputJsonValue
    interests?: NullableJsonNullValueInput | InputJsonValue
    recommendations?: NullableJsonNullValueInput | InputJsonValue
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

  export type ProfileImportRunListRelationFilter = {
    every?: ProfileImportRunWhereInput
    some?: ProfileImportRunWhereInput
    none?: ProfileImportRunWhereInput
  }

  export type LinkedInAccountListRelationFilter = {
    every?: LinkedInAccountWhereInput
    some?: LinkedInAccountWhereInput
    none?: LinkedInAccountWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ProfileImportRunOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type LinkedInAccountOrderByRelationAggregateInput = {
    _count?: SortOrder
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
    dailyAIcomments?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    dailyAIcomments?: SortOrder
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
    dailyAIcomments?: SortOrder
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
    dailyAIcomments?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    dailyAIcomments?: SortOrder
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

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type LinkedInAccountCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    username?: SortOrder
    encryptedPassword?: SortOrder
    twoFactorySecretKey?: SortOrder
    createdAt?: SortOrder
    staticIp?: SortOrder
  }

  export type LinkedInAccountMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    username?: SortOrder
    encryptedPassword?: SortOrder
    twoFactorySecretKey?: SortOrder
    createdAt?: SortOrder
    staticIp?: SortOrder
  }

  export type LinkedInAccountMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    username?: SortOrder
    encryptedPassword?: SortOrder
    twoFactorySecretKey?: SortOrder
    createdAt?: SortOrder
    staticIp?: SortOrder
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type EnumImportStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ImportStatus | EnumImportStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ImportStatus[] | ListEnumImportStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ImportStatus[] | ListEnumImportStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumImportStatusFilter<$PrismaModel> | $Enums.ImportStatus
  }

  export type ProfileImportRunCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    urls?: SortOrder
    status?: SortOrder
    urlsSucceeded?: SortOrder
    urlsFailed?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProfileImportRunMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProfileImportRunMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumImportStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ImportStatus | EnumImportStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ImportStatus[] | ListEnumImportStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ImportStatus[] | ListEnumImportStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumImportStatusWithAggregatesFilter<$PrismaModel> | $Enums.ImportStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumImportStatusFilter<$PrismaModel>
    _max?: NestedEnumImportStatusFilter<$PrismaModel>
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type BoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type LinkedInProfileCountOrderByAggregateInput = {
    id?: SortOrder
    linkedinUrl?: SortOrder
    fullName?: SortOrder
    headline?: SortOrder
    urn?: SortOrder
    profilePic?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    connections?: SortOrder
    followers?: SortOrder
    email?: SortOrder
    mobileNumber?: SortOrder
    jobTitle?: SortOrder
    companyName?: SortOrder
    companyIndustry?: SortOrder
    companyWebsite?: SortOrder
    companyLinkedin?: SortOrder
    companyFoundedIn?: SortOrder
    companySize?: SortOrder
    currentJobDuration?: SortOrder
    currentJobDurationInYrs?: SortOrder
    topSkillsByEndorsements?: SortOrder
    addressCountryOnly?: SortOrder
    addressWithCountry?: SortOrder
    addressWithoutCountry?: SortOrder
    profilePicHighQuality?: SortOrder
    about?: SortOrder
    publicIdentifier?: SortOrder
    openConnection?: SortOrder
    experiences?: SortOrder
    updates?: SortOrder
    skills?: SortOrder
    profilePicAllDimensions?: SortOrder
    educations?: SortOrder
    licenseAndCertificates?: SortOrder
    honorsAndAwards?: SortOrder
    languages?: SortOrder
    volunteerAndAwards?: SortOrder
    verifications?: SortOrder
    promos?: SortOrder
    highlights?: SortOrder
    projects?: SortOrder
    publications?: SortOrder
    patents?: SortOrder
    courses?: SortOrder
    testScores?: SortOrder
    organizations?: SortOrder
    volunteerCauses?: SortOrder
    interests?: SortOrder
    recommendations?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LinkedInProfileAvgOrderByAggregateInput = {
    connections?: SortOrder
    followers?: SortOrder
    companyFoundedIn?: SortOrder
    currentJobDurationInYrs?: SortOrder
  }

  export type LinkedInProfileMaxOrderByAggregateInput = {
    id?: SortOrder
    linkedinUrl?: SortOrder
    fullName?: SortOrder
    headline?: SortOrder
    urn?: SortOrder
    profilePic?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    connections?: SortOrder
    followers?: SortOrder
    email?: SortOrder
    mobileNumber?: SortOrder
    jobTitle?: SortOrder
    companyName?: SortOrder
    companyIndustry?: SortOrder
    companyWebsite?: SortOrder
    companyLinkedin?: SortOrder
    companyFoundedIn?: SortOrder
    companySize?: SortOrder
    currentJobDuration?: SortOrder
    currentJobDurationInYrs?: SortOrder
    topSkillsByEndorsements?: SortOrder
    addressCountryOnly?: SortOrder
    addressWithCountry?: SortOrder
    addressWithoutCountry?: SortOrder
    profilePicHighQuality?: SortOrder
    about?: SortOrder
    publicIdentifier?: SortOrder
    openConnection?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LinkedInProfileMinOrderByAggregateInput = {
    id?: SortOrder
    linkedinUrl?: SortOrder
    fullName?: SortOrder
    headline?: SortOrder
    urn?: SortOrder
    profilePic?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    connections?: SortOrder
    followers?: SortOrder
    email?: SortOrder
    mobileNumber?: SortOrder
    jobTitle?: SortOrder
    companyName?: SortOrder
    companyIndustry?: SortOrder
    companyWebsite?: SortOrder
    companyLinkedin?: SortOrder
    companyFoundedIn?: SortOrder
    companySize?: SortOrder
    currentJobDuration?: SortOrder
    currentJobDurationInYrs?: SortOrder
    topSkillsByEndorsements?: SortOrder
    addressCountryOnly?: SortOrder
    addressWithCountry?: SortOrder
    addressWithoutCountry?: SortOrder
    profilePicHighQuality?: SortOrder
    about?: SortOrder
    publicIdentifier?: SortOrder
    openConnection?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LinkedInProfileSumOrderByAggregateInput = {
    connections?: SortOrder
    followers?: SortOrder
    companyFoundedIn?: SortOrder
    currentJobDurationInYrs?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type BoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type ProfileImportRunCreateNestedManyWithoutUserInput = {
    create?: XOR<ProfileImportRunCreateWithoutUserInput, ProfileImportRunUncheckedCreateWithoutUserInput> | ProfileImportRunCreateWithoutUserInput[] | ProfileImportRunUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ProfileImportRunCreateOrConnectWithoutUserInput | ProfileImportRunCreateOrConnectWithoutUserInput[]
    createMany?: ProfileImportRunCreateManyUserInputEnvelope
    connect?: ProfileImportRunWhereUniqueInput | ProfileImportRunWhereUniqueInput[]
  }

  export type LinkedInAccountCreateNestedManyWithoutUserInput = {
    create?: XOR<LinkedInAccountCreateWithoutUserInput, LinkedInAccountUncheckedCreateWithoutUserInput> | LinkedInAccountCreateWithoutUserInput[] | LinkedInAccountUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LinkedInAccountCreateOrConnectWithoutUserInput | LinkedInAccountCreateOrConnectWithoutUserInput[]
    createMany?: LinkedInAccountCreateManyUserInputEnvelope
    connect?: LinkedInAccountWhereUniqueInput | LinkedInAccountWhereUniqueInput[]
  }

  export type ProfileImportRunUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<ProfileImportRunCreateWithoutUserInput, ProfileImportRunUncheckedCreateWithoutUserInput> | ProfileImportRunCreateWithoutUserInput[] | ProfileImportRunUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ProfileImportRunCreateOrConnectWithoutUserInput | ProfileImportRunCreateOrConnectWithoutUserInput[]
    createMany?: ProfileImportRunCreateManyUserInputEnvelope
    connect?: ProfileImportRunWhereUniqueInput | ProfileImportRunWhereUniqueInput[]
  }

  export type LinkedInAccountUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<LinkedInAccountCreateWithoutUserInput, LinkedInAccountUncheckedCreateWithoutUserInput> | LinkedInAccountCreateWithoutUserInput[] | LinkedInAccountUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LinkedInAccountCreateOrConnectWithoutUserInput | LinkedInAccountCreateOrConnectWithoutUserInput[]
    createMany?: LinkedInAccountCreateManyUserInputEnvelope
    connect?: LinkedInAccountWhereUniqueInput | LinkedInAccountWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
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

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ProfileImportRunUpdateManyWithoutUserNestedInput = {
    create?: XOR<ProfileImportRunCreateWithoutUserInput, ProfileImportRunUncheckedCreateWithoutUserInput> | ProfileImportRunCreateWithoutUserInput[] | ProfileImportRunUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ProfileImportRunCreateOrConnectWithoutUserInput | ProfileImportRunCreateOrConnectWithoutUserInput[]
    upsert?: ProfileImportRunUpsertWithWhereUniqueWithoutUserInput | ProfileImportRunUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: ProfileImportRunCreateManyUserInputEnvelope
    set?: ProfileImportRunWhereUniqueInput | ProfileImportRunWhereUniqueInput[]
    disconnect?: ProfileImportRunWhereUniqueInput | ProfileImportRunWhereUniqueInput[]
    delete?: ProfileImportRunWhereUniqueInput | ProfileImportRunWhereUniqueInput[]
    connect?: ProfileImportRunWhereUniqueInput | ProfileImportRunWhereUniqueInput[]
    update?: ProfileImportRunUpdateWithWhereUniqueWithoutUserInput | ProfileImportRunUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: ProfileImportRunUpdateManyWithWhereWithoutUserInput | ProfileImportRunUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: ProfileImportRunScalarWhereInput | ProfileImportRunScalarWhereInput[]
  }

  export type LinkedInAccountUpdateManyWithoutUserNestedInput = {
    create?: XOR<LinkedInAccountCreateWithoutUserInput, LinkedInAccountUncheckedCreateWithoutUserInput> | LinkedInAccountCreateWithoutUserInput[] | LinkedInAccountUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LinkedInAccountCreateOrConnectWithoutUserInput | LinkedInAccountCreateOrConnectWithoutUserInput[]
    upsert?: LinkedInAccountUpsertWithWhereUniqueWithoutUserInput | LinkedInAccountUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: LinkedInAccountCreateManyUserInputEnvelope
    set?: LinkedInAccountWhereUniqueInput | LinkedInAccountWhereUniqueInput[]
    disconnect?: LinkedInAccountWhereUniqueInput | LinkedInAccountWhereUniqueInput[]
    delete?: LinkedInAccountWhereUniqueInput | LinkedInAccountWhereUniqueInput[]
    connect?: LinkedInAccountWhereUniqueInput | LinkedInAccountWhereUniqueInput[]
    update?: LinkedInAccountUpdateWithWhereUniqueWithoutUserInput | LinkedInAccountUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: LinkedInAccountUpdateManyWithWhereWithoutUserInput | LinkedInAccountUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: LinkedInAccountScalarWhereInput | LinkedInAccountScalarWhereInput[]
  }

  export type ProfileImportRunUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<ProfileImportRunCreateWithoutUserInput, ProfileImportRunUncheckedCreateWithoutUserInput> | ProfileImportRunCreateWithoutUserInput[] | ProfileImportRunUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ProfileImportRunCreateOrConnectWithoutUserInput | ProfileImportRunCreateOrConnectWithoutUserInput[]
    upsert?: ProfileImportRunUpsertWithWhereUniqueWithoutUserInput | ProfileImportRunUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: ProfileImportRunCreateManyUserInputEnvelope
    set?: ProfileImportRunWhereUniqueInput | ProfileImportRunWhereUniqueInput[]
    disconnect?: ProfileImportRunWhereUniqueInput | ProfileImportRunWhereUniqueInput[]
    delete?: ProfileImportRunWhereUniqueInput | ProfileImportRunWhereUniqueInput[]
    connect?: ProfileImportRunWhereUniqueInput | ProfileImportRunWhereUniqueInput[]
    update?: ProfileImportRunUpdateWithWhereUniqueWithoutUserInput | ProfileImportRunUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: ProfileImportRunUpdateManyWithWhereWithoutUserInput | ProfileImportRunUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: ProfileImportRunScalarWhereInput | ProfileImportRunScalarWhereInput[]
  }

  export type LinkedInAccountUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<LinkedInAccountCreateWithoutUserInput, LinkedInAccountUncheckedCreateWithoutUserInput> | LinkedInAccountCreateWithoutUserInput[] | LinkedInAccountUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LinkedInAccountCreateOrConnectWithoutUserInput | LinkedInAccountCreateOrConnectWithoutUserInput[]
    upsert?: LinkedInAccountUpsertWithWhereUniqueWithoutUserInput | LinkedInAccountUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: LinkedInAccountCreateManyUserInputEnvelope
    set?: LinkedInAccountWhereUniqueInput | LinkedInAccountWhereUniqueInput[]
    disconnect?: LinkedInAccountWhereUniqueInput | LinkedInAccountWhereUniqueInput[]
    delete?: LinkedInAccountWhereUniqueInput | LinkedInAccountWhereUniqueInput[]
    connect?: LinkedInAccountWhereUniqueInput | LinkedInAccountWhereUniqueInput[]
    update?: LinkedInAccountUpdateWithWhereUniqueWithoutUserInput | LinkedInAccountUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: LinkedInAccountUpdateManyWithWhereWithoutUserInput | LinkedInAccountUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: LinkedInAccountScalarWhereInput | LinkedInAccountScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutLinkedInAccountsInput = {
    create?: XOR<UserCreateWithoutLinkedInAccountsInput, UserUncheckedCreateWithoutLinkedInAccountsInput>
    connectOrCreate?: UserCreateOrConnectWithoutLinkedInAccountsInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutLinkedInAccountsNestedInput = {
    create?: XOR<UserCreateWithoutLinkedInAccountsInput, UserUncheckedCreateWithoutLinkedInAccountsInput>
    connectOrCreate?: UserCreateOrConnectWithoutLinkedInAccountsInput
    upsert?: UserUpsertWithoutLinkedInAccountsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutLinkedInAccountsInput, UserUpdateWithoutLinkedInAccountsInput>, UserUncheckedUpdateWithoutLinkedInAccountsInput>
  }

  export type ProfileImportRunCreateurlsInput = {
    set: string[]
  }

  export type ProfileImportRunCreateurlsSucceededInput = {
    set: string[]
  }

  export type ProfileImportRunCreateurlsFailedInput = {
    set: string[]
  }

  export type UserCreateNestedOneWithoutProfileImportRunsInput = {
    create?: XOR<UserCreateWithoutProfileImportRunsInput, UserUncheckedCreateWithoutProfileImportRunsInput>
    connectOrCreate?: UserCreateOrConnectWithoutProfileImportRunsInput
    connect?: UserWhereUniqueInput
  }

  export type ProfileImportRunUpdateurlsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type EnumImportStatusFieldUpdateOperationsInput = {
    set?: $Enums.ImportStatus
  }

  export type ProfileImportRunUpdateurlsSucceededInput = {
    set?: string[]
    push?: string | string[]
  }

  export type ProfileImportRunUpdateurlsFailedInput = {
    set?: string[]
    push?: string | string[]
  }

  export type UserUpdateOneRequiredWithoutProfileImportRunsNestedInput = {
    create?: XOR<UserCreateWithoutProfileImportRunsInput, UserUncheckedCreateWithoutProfileImportRunsInput>
    connectOrCreate?: UserCreateOrConnectWithoutProfileImportRunsInput
    upsert?: UserUpsertWithoutProfileImportRunsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutProfileImportRunsInput, UserUpdateWithoutProfileImportRunsInput>, UserUncheckedUpdateWithoutProfileImportRunsInput>
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableBoolFieldUpdateOperationsInput = {
    set?: boolean | null
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

  export type NestedEnumImportStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ImportStatus | EnumImportStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ImportStatus[] | ListEnumImportStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ImportStatus[] | ListEnumImportStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumImportStatusFilter<$PrismaModel> | $Enums.ImportStatus
  }

  export type NestedEnumImportStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ImportStatus | EnumImportStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ImportStatus[] | ListEnumImportStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ImportStatus[] | ListEnumImportStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumImportStatusWithAggregatesFilter<$PrismaModel> | $Enums.ImportStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumImportStatusFilter<$PrismaModel>
    _max?: NestedEnumImportStatusFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type NestedBoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type ProfileImportRunCreateWithoutUserInput = {
    id?: string
    urls?: ProfileImportRunCreateurlsInput | string[]
    status?: $Enums.ImportStatus
    urlsSucceeded?: ProfileImportRunCreateurlsSucceededInput | string[]
    urlsFailed?: ProfileImportRunCreateurlsFailedInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProfileImportRunUncheckedCreateWithoutUserInput = {
    id?: string
    urls?: ProfileImportRunCreateurlsInput | string[]
    status?: $Enums.ImportStatus
    urlsSucceeded?: ProfileImportRunCreateurlsSucceededInput | string[]
    urlsFailed?: ProfileImportRunCreateurlsFailedInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProfileImportRunCreateOrConnectWithoutUserInput = {
    where: ProfileImportRunWhereUniqueInput
    create: XOR<ProfileImportRunCreateWithoutUserInput, ProfileImportRunUncheckedCreateWithoutUserInput>
  }

  export type ProfileImportRunCreateManyUserInputEnvelope = {
    data: ProfileImportRunCreateManyUserInput | ProfileImportRunCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type LinkedInAccountCreateWithoutUserInput = {
    id?: string
    username: string
    encryptedPassword: string
    twoFactorySecretKey: string
    createdAt?: Date | string
    staticIp?: string | null
  }

  export type LinkedInAccountUncheckedCreateWithoutUserInput = {
    id?: string
    username: string
    encryptedPassword: string
    twoFactorySecretKey: string
    createdAt?: Date | string
    staticIp?: string | null
  }

  export type LinkedInAccountCreateOrConnectWithoutUserInput = {
    where: LinkedInAccountWhereUniqueInput
    create: XOR<LinkedInAccountCreateWithoutUserInput, LinkedInAccountUncheckedCreateWithoutUserInput>
  }

  export type LinkedInAccountCreateManyUserInputEnvelope = {
    data: LinkedInAccountCreateManyUserInput | LinkedInAccountCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type ProfileImportRunUpsertWithWhereUniqueWithoutUserInput = {
    where: ProfileImportRunWhereUniqueInput
    update: XOR<ProfileImportRunUpdateWithoutUserInput, ProfileImportRunUncheckedUpdateWithoutUserInput>
    create: XOR<ProfileImportRunCreateWithoutUserInput, ProfileImportRunUncheckedCreateWithoutUserInput>
  }

  export type ProfileImportRunUpdateWithWhereUniqueWithoutUserInput = {
    where: ProfileImportRunWhereUniqueInput
    data: XOR<ProfileImportRunUpdateWithoutUserInput, ProfileImportRunUncheckedUpdateWithoutUserInput>
  }

  export type ProfileImportRunUpdateManyWithWhereWithoutUserInput = {
    where: ProfileImportRunScalarWhereInput
    data: XOR<ProfileImportRunUpdateManyMutationInput, ProfileImportRunUncheckedUpdateManyWithoutUserInput>
  }

  export type ProfileImportRunScalarWhereInput = {
    AND?: ProfileImportRunScalarWhereInput | ProfileImportRunScalarWhereInput[]
    OR?: ProfileImportRunScalarWhereInput[]
    NOT?: ProfileImportRunScalarWhereInput | ProfileImportRunScalarWhereInput[]
    id?: StringFilter<"ProfileImportRun"> | string
    userId?: StringFilter<"ProfileImportRun"> | string
    urls?: StringNullableListFilter<"ProfileImportRun">
    status?: EnumImportStatusFilter<"ProfileImportRun"> | $Enums.ImportStatus
    urlsSucceeded?: StringNullableListFilter<"ProfileImportRun">
    urlsFailed?: StringNullableListFilter<"ProfileImportRun">
    createdAt?: DateTimeFilter<"ProfileImportRun"> | Date | string
    updatedAt?: DateTimeFilter<"ProfileImportRun"> | Date | string
  }

  export type LinkedInAccountUpsertWithWhereUniqueWithoutUserInput = {
    where: LinkedInAccountWhereUniqueInput
    update: XOR<LinkedInAccountUpdateWithoutUserInput, LinkedInAccountUncheckedUpdateWithoutUserInput>
    create: XOR<LinkedInAccountCreateWithoutUserInput, LinkedInAccountUncheckedCreateWithoutUserInput>
  }

  export type LinkedInAccountUpdateWithWhereUniqueWithoutUserInput = {
    where: LinkedInAccountWhereUniqueInput
    data: XOR<LinkedInAccountUpdateWithoutUserInput, LinkedInAccountUncheckedUpdateWithoutUserInput>
  }

  export type LinkedInAccountUpdateManyWithWhereWithoutUserInput = {
    where: LinkedInAccountScalarWhereInput
    data: XOR<LinkedInAccountUpdateManyMutationInput, LinkedInAccountUncheckedUpdateManyWithoutUserInput>
  }

  export type LinkedInAccountScalarWhereInput = {
    AND?: LinkedInAccountScalarWhereInput | LinkedInAccountScalarWhereInput[]
    OR?: LinkedInAccountScalarWhereInput[]
    NOT?: LinkedInAccountScalarWhereInput | LinkedInAccountScalarWhereInput[]
    id?: StringFilter<"LinkedInAccount"> | string
    userId?: StringFilter<"LinkedInAccount"> | string
    username?: StringFilter<"LinkedInAccount"> | string
    encryptedPassword?: StringFilter<"LinkedInAccount"> | string
    twoFactorySecretKey?: StringFilter<"LinkedInAccount"> | string
    createdAt?: DateTimeFilter<"LinkedInAccount"> | Date | string
    staticIp?: StringNullableFilter<"LinkedInAccount"> | string | null
  }

  export type UserCreateWithoutLinkedInAccountsInput = {
    id: string
    firstName?: string | null
    lastName?: string | null
    username?: string | null
    primaryEmailAddress: string
    imageUrl?: string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: string | null
    accessType?: $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    dailyAIcomments?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    profileImportRuns?: ProfileImportRunCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutLinkedInAccountsInput = {
    id: string
    firstName?: string | null
    lastName?: string | null
    username?: string | null
    primaryEmailAddress: string
    imageUrl?: string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: string | null
    accessType?: $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    dailyAIcomments?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    profileImportRuns?: ProfileImportRunUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutLinkedInAccountsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutLinkedInAccountsInput, UserUncheckedCreateWithoutLinkedInAccountsInput>
  }

  export type UserUpsertWithoutLinkedInAccountsInput = {
    update: XOR<UserUpdateWithoutLinkedInAccountsInput, UserUncheckedUpdateWithoutLinkedInAccountsInput>
    create: XOR<UserCreateWithoutLinkedInAccountsInput, UserUncheckedCreateWithoutLinkedInAccountsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutLinkedInAccountsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutLinkedInAccountsInput, UserUncheckedUpdateWithoutLinkedInAccountsInput>
  }

  export type UserUpdateWithoutLinkedInAccountsInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    username?: NullableStringFieldUpdateOperationsInput | string | null
    primaryEmailAddress?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: NullableStringFieldUpdateOperationsInput | string | null
    accessType?: EnumAccessTypeFieldUpdateOperationsInput | $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    dailyAIcomments?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profileImportRuns?: ProfileImportRunUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutLinkedInAccountsInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    username?: NullableStringFieldUpdateOperationsInput | string | null
    primaryEmailAddress?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: NullableStringFieldUpdateOperationsInput | string | null
    accessType?: EnumAccessTypeFieldUpdateOperationsInput | $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    dailyAIcomments?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profileImportRuns?: ProfileImportRunUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutProfileImportRunsInput = {
    id: string
    firstName?: string | null
    lastName?: string | null
    username?: string | null
    primaryEmailAddress: string
    imageUrl?: string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: string | null
    accessType?: $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    dailyAIcomments?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    linkedInAccounts?: LinkedInAccountCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutProfileImportRunsInput = {
    id: string
    firstName?: string | null
    lastName?: string | null
    username?: string | null
    primaryEmailAddress: string
    imageUrl?: string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: string | null
    accessType?: $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    dailyAIcomments?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    linkedInAccounts?: LinkedInAccountUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutProfileImportRunsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutProfileImportRunsInput, UserUncheckedCreateWithoutProfileImportRunsInput>
  }

  export type UserUpsertWithoutProfileImportRunsInput = {
    update: XOR<UserUpdateWithoutProfileImportRunsInput, UserUncheckedUpdateWithoutProfileImportRunsInput>
    create: XOR<UserCreateWithoutProfileImportRunsInput, UserUncheckedCreateWithoutProfileImportRunsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutProfileImportRunsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutProfileImportRunsInput, UserUncheckedUpdateWithoutProfileImportRunsInput>
  }

  export type UserUpdateWithoutProfileImportRunsInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    username?: NullableStringFieldUpdateOperationsInput | string | null
    primaryEmailAddress?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: NullableStringFieldUpdateOperationsInput | string | null
    accessType?: EnumAccessTypeFieldUpdateOperationsInput | $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    dailyAIcomments?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    linkedInAccounts?: LinkedInAccountUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutProfileImportRunsInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    username?: NullableStringFieldUpdateOperationsInput | string | null
    primaryEmailAddress?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    clerkUserProperties?: NullableJsonNullValueInput | InputJsonValue
    stripeCustomerId?: NullableStringFieldUpdateOperationsInput | string | null
    accessType?: EnumAccessTypeFieldUpdateOperationsInput | $Enums.AccessType
    stripeUserProperties?: NullableJsonNullValueInput | InputJsonValue
    dailyAIcomments?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    linkedInAccounts?: LinkedInAccountUncheckedUpdateManyWithoutUserNestedInput
  }

  export type ProfileImportRunCreateManyUserInput = {
    id?: string
    urls?: ProfileImportRunCreateurlsInput | string[]
    status?: $Enums.ImportStatus
    urlsSucceeded?: ProfileImportRunCreateurlsSucceededInput | string[]
    urlsFailed?: ProfileImportRunCreateurlsFailedInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LinkedInAccountCreateManyUserInput = {
    id?: string
    username: string
    encryptedPassword: string
    twoFactorySecretKey: string
    createdAt?: Date | string
    staticIp?: string | null
  }

  export type ProfileImportRunUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    urls?: ProfileImportRunUpdateurlsInput | string[]
    status?: EnumImportStatusFieldUpdateOperationsInput | $Enums.ImportStatus
    urlsSucceeded?: ProfileImportRunUpdateurlsSucceededInput | string[]
    urlsFailed?: ProfileImportRunUpdateurlsFailedInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProfileImportRunUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    urls?: ProfileImportRunUpdateurlsInput | string[]
    status?: EnumImportStatusFieldUpdateOperationsInput | $Enums.ImportStatus
    urlsSucceeded?: ProfileImportRunUpdateurlsSucceededInput | string[]
    urlsFailed?: ProfileImportRunUpdateurlsFailedInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProfileImportRunUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    urls?: ProfileImportRunUpdateurlsInput | string[]
    status?: EnumImportStatusFieldUpdateOperationsInput | $Enums.ImportStatus
    urlsSucceeded?: ProfileImportRunUpdateurlsSucceededInput | string[]
    urlsFailed?: ProfileImportRunUpdateurlsFailedInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LinkedInAccountUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    encryptedPassword?: StringFieldUpdateOperationsInput | string
    twoFactorySecretKey?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    staticIp?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type LinkedInAccountUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    encryptedPassword?: StringFieldUpdateOperationsInput | string
    twoFactorySecretKey?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    staticIp?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type LinkedInAccountUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    encryptedPassword?: StringFieldUpdateOperationsInput | string
    twoFactorySecretKey?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    staticIp?: NullableStringFieldUpdateOperationsInput | string | null
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
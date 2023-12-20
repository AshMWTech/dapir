import type { AppConfig } from '../config';
import type { PrismaClient, Prisma } from '@prisma/client';
import { MongoClient } from 'mongodb';
import type { RedisClientType, RedisModules, RedisFunctions, RedisScripts } from 'redis';
import { Client as MinioClient } from 'minio';

// Context
//@ts-ignore-next-line
export type ContextDB = PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
export type ContextRedis = RedisClientType<RedisModules, RedisFunctions, RedisScripts>;
export type ContextConfig = AppConfig & { [key: string]: string | undefined };
export type ContextMongo = MongoClient;
export type ContextStorage = MinioClient;

export interface Context {
  db: ContextDB;
  mongo: ContextMongo;
  cache: ContextRedis;
  storage: ContextStorage;
  config: ContextConfig;
} 
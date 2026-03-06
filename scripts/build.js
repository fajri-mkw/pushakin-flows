#!/usr/bin/env node
// Build script for Vercel deployment
// Uses PostgreSQL schema for production

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Setting up PostgreSQL schema for production...');

// Copy PostgreSQL schema
const postgresSchema = path.join(__dirname, '..', 'prisma', 'schema.postgres.prisma');
const targetSchema = path.join(__dirname, '..', 'prisma', 'schema.prisma');

if (fs.existsSync(postgresSchema)) {
  fs.copyFileSync(postgresSchema, targetSchema);
  console.log('✅ PostgreSQL schema copied successfully');
} else {
  console.error('❌ PostgreSQL schema not found:', postgresSchema);
  process.exit(1);
}

console.log('📦 Generating Prisma Client...');
execSync('npx prisma generate', { stdio: 'inherit' });

console.log('🚀 Building Next.js...');
execSync('npx next build', { stdio: 'inherit' });

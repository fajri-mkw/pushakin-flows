#!/usr/bin/env node
// Build script for Vercel deployment (PostgreSQL)

const { execSync } = require('child_process');

console.log('📦 Generating Prisma Client...');
execSync('npx prisma generate', { stdio: 'inherit' });

console.log('🚀 Building Next.js...');
execSync('npx next build', { stdio: 'inherit' });

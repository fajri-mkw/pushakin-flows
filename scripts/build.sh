#!/bin/bash
# Build script for Vercel deployment
# Uses PostgreSQL schema for production

set -e

echo "🔄 Setting up PostgreSQL schema for production..."
cp prisma/schema.postgres.prisma prisma/schema.prisma

echo "📦 Generating Prisma Client..."
prisma generate

echo "🚀 Building Next.js..."
next build

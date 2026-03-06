#!/usr/bin/env node
// Pre-dev script for local development (SQLite)

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sqliteSchema = path.join(__dirname, '..', 'prisma', 'schema.sqlite.prisma');
const targetSchema = path.join(__dirname, '..', 'prisma', 'schema.prisma');

// Only switch to SQLite if the file exists
if (fs.existsSync(sqliteSchema)) {
  console.log('🔄 Switching to SQLite schema for local development...');
  fs.copyFileSync(sqliteSchema, targetSchema);

  console.log('📦 Regenerating Prisma Client for SQLite...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('✅ Ready for local development with SQLite');
}

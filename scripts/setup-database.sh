#!/bin/bash

echo "🚀 Database Setup Script"
echo "========================"
echo ""

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo "✓ Docker detected"
    echo ""
    echo "Starting PostgreSQL with Docker Compose..."
    docker-compose up -d
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    echo ""
    echo "✓ PostgreSQL is running!"
else
    echo "⚠️  Docker not found. Please:"
    echo "   1. Install Docker Desktop, OR"
    echo "   2. Use Supabase (see QUICK_DATABASE_SETUP.md)"
    echo ""
    exit 1
fi

echo ""
echo "📦 Generating Prisma Client..."
npm run db:generate

echo ""
echo "🔄 Pushing schema to database..."
npm run db:push

echo ""
echo "🌱 Seeding database with products..."
npm run db:seed

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📊 View your data:"
echo "   npm run db:studio"
echo ""
echo "🌐 Start the app:"
echo "   npm run dev"

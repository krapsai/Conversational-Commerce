# PowerShell script for Windows

Write-Host "🚀 Database Setup Script" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue

if ($dockerInstalled) {
    Write-Host "✓ Docker detected" -ForegroundColor Green
    Write-Host ""
    Write-Host "Starting PostgreSQL with Docker Compose..." -ForegroundColor Yellow
    docker-compose up -d
    
    Write-Host ""
    Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host ""
    Write-Host "✓ PostgreSQL is running!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Docker not found. Please:" -ForegroundColor Red
    Write-Host "   1. Install Docker Desktop, OR" -ForegroundColor Yellow
    Write-Host "   2. Use Supabase (see QUICK_DATABASE_SETUP.md)" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "📦 Generating Prisma Client..." -ForegroundColor Yellow
npm run db:generate

Write-Host ""
Write-Host "🔄 Pushing schema to database..." -ForegroundColor Yellow
npm run db:push

Write-Host ""
Write-Host "🌱 Seeding database with products..." -ForegroundColor Yellow
npm run db:seed

Write-Host ""
Write-Host "✅ Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 View your data:" -ForegroundColor Cyan
Write-Host "   npm run db:studio" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Start the app:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White

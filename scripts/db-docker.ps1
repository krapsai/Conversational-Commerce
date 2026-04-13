# Script quản lý PostgreSQL Docker cho Windows PowerShell

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('start','stop','restart','logs','pgadmin','clean','status')]
    [string]$Command
)

switch ($Command) {
    'start' {
        Write-Host "🚀 Starting PostgreSQL Docker container..." -ForegroundColor Green
        docker-compose up -d postgres
        Write-Host "✅ PostgreSQL is running on localhost:5432" -ForegroundColor Green
        Write-Host "   Database: ecommerce"
        Write-Host "   User: postgres"
        Write-Host "   Password: postgres123"
    }
    
    'stop' {
        Write-Host "🛑 Stopping PostgreSQL Docker container..." -ForegroundColor Yellow
        docker-compose down
        Write-Host "✅ PostgreSQL stopped" -ForegroundColor Green
    }
    
    'restart' {
        Write-Host "🔄 Restarting PostgreSQL Docker container..." -ForegroundColor Yellow
        docker-compose restart postgres
        Write-Host "✅ PostgreSQL restarted" -ForegroundColor Green
    }
    
    'logs' {
        Write-Host "📋 PostgreSQL logs:" -ForegroundColor Cyan
        docker-compose logs -f postgres
    }
    
    'pgadmin' {
        Write-Host "🚀 Starting PostgreSQL + pgAdmin..." -ForegroundColor Green
        docker-compose --profile tools up -d
        Write-Host "✅ Services running:" -ForegroundColor Green
        Write-Host "   PostgreSQL: localhost:5432"
        Write-Host "   pgAdmin: http://localhost:5050"
        Write-Host "   pgAdmin login: admin@admin.com / admin123"
    }
    
    'clean' {
        Write-Host "🗑️  Removing PostgreSQL container and volumes..." -ForegroundColor Red
        docker-compose down -v
        Write-Host "✅ All data removed" -ForegroundColor Green
    }
    
    'status' {
        Write-Host "📊 Docker containers status:" -ForegroundColor Cyan
        docker-compose ps
    }
}

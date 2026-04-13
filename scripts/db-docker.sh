#!/bin/bash

# Script quản lý PostgreSQL Docker

case "$1" in
  start)
    echo "🚀 Starting PostgreSQL Docker container..."
    docker-compose up -d postgres
    echo "✅ PostgreSQL is running on localhost:5432"
    echo "   Database: ecommerce"
    echo "   User: postgres"
    echo "   Password: postgres123"
    ;;
    
  stop)
    echo "🛑 Stopping PostgreSQL Docker container..."
    docker-compose down
    echo "✅ PostgreSQL stopped"
    ;;
    
  restart)
    echo "🔄 Restarting PostgreSQL Docker container..."
    docker-compose restart postgres
    echo "✅ PostgreSQL restarted"
    ;;
    
  logs)
    echo "📋 PostgreSQL logs:"
    docker-compose logs -f postgres
    ;;
    
  pgadmin)
    echo "🚀 Starting PostgreSQL + pgAdmin..."
    docker-compose --profile tools up -d
    echo "✅ Services running:"
    echo "   PostgreSQL: localhost:5432"
    echo "   pgAdmin: http://localhost:5050"
    echo "   pgAdmin login: admin@admin.com / admin123"
    ;;
    
  clean)
    echo "🗑️  Removing PostgreSQL container and volumes..."
    docker-compose down -v
    echo "✅ All data removed"
    ;;
    
  status)
    echo "📊 Docker containers status:"
    docker-compose ps
    ;;
    
  *)
    echo "Usage: $0 {start|stop|restart|logs|pgadmin|clean|status}"
    echo ""
    echo "Commands:"
    echo "  start    - Start PostgreSQL container"
    echo "  stop     - Stop PostgreSQL container"
    echo "  restart  - Restart PostgreSQL container"
    echo "  logs     - View PostgreSQL logs"
    echo "  pgadmin  - Start PostgreSQL + pgAdmin UI"
    echo "  clean    - Remove container and all data"
    echo "  status   - Show container status"
    exit 1
    ;;
esac

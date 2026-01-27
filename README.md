# Attendo Server

# Build Docker images
npm run docker:build

# Start services (foreground - see logs)
npm run docker:up

# Start services (background)
npm run docker:up:detached

# View logs
npm run docker:logs

# Stop services
npm run docker:down

# Restart services
npm run docker:restart

# Clean everything (volumes + unused images)
npm run docker:clean

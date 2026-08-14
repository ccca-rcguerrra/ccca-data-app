
# Production nginx image for serving static files
FROM nginx:alpine

# Copy built assets from local dist folder
# Note: The build must be done locally before building this image
COPY dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
# Use Ubuntu latest as the base image
FROM ubuntu:latest

# Update packages and install Python, wget, and development tools
RUN apt-get update && \
    apt-get install -y python3 wget

# Expose port 80
EXPOSE 80

# Set the working directory
WORKDIR /app

# Create a directory for the app
RUN mkdir /app/www

# Copy your app files into the container
COPY index.html /app/www/index.html

# Set the entrypoint to run the HTTP server using Python
CMD ["python3", "-m", "http.server", "80", "--directory", "/app/www"]

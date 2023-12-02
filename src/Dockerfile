# Use Ubuntu latest as the base image
FROM ubuntu:latest

# Update packages and install Python
RUN apt-get update && \
    apt-get install -y python3

# Expose port 80
EXPOSE 80

# Set the entrypoint to run the HTTP server using Python
CMD ["python3", "-m", "http.server", "80"]

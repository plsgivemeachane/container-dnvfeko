# Use Ubuntu latest as the base image
FROM ubuntu:latest

# Update packages and install Python
RUN apt-get update && \
    apt-get install -y python3

# Expose port 80
EXPOSE 80

# Copy entry.sh from your local directory to the container
COPY entry.sh /entry.sh

# Set the entrypoint to run the entry.sh script
ENTRYPOINT ["bash", "/entry.sh"]

#!/bin/sh

# Default path for the config file in the Nginx container
CONFIG_FILE="/usr/share/nginx/html/assets/env-config.js"

# Ensure the directory exists
mkdir -p $(dirname $CONFIG_FILE)

echo "window.env = {" > $CONFIG_FILE
echo "  GEMINI_API_KEY: \"$GEMINI_API_KEY\"" >> $CONFIG_FILE
echo "};" >> $CONFIG_FILE

echo "Generated $CONFIG_FILE with environment variables."

# Execute the original CMD (Nginx)
exec "$@"

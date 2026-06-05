#!/bin/bash

# This script adds 3D utility classes to all HTML pages

for file in celendar.html collab.html todo.html about.html 2nd.html; do
  echo "Processing $file..."
  
  # Check if file exists
  if [ ! -f "$file" ]; then
    echo "  Skipping $file - not found"
    continue
  fi
  
  # Add dark mode 3D variables if not present
  if ! grep -q "3D Effects - Dark Mode" "$file"; then
    # Find the line with --border: #334155; in dark mode and add after it
    sed -i '' '/body.dark-mode {/,/}/ {
      /--border: #334155;/a\
\
      /* 3D Effects - Dark Mode */\
      --glass-bg: rgba(30, 41, 59, 0.5);\
      --glass-border: rgba(148, 163, 184, 0.2);\
      --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);\
      --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3);\
      --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(0, 0, 0, 0.4);\
      --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.7), 0 8px 24px rgba(0, 0, 0, 0.5);\
      --shadow-2xl: 0 24px 64px rgba(0, 0, 0, 0.8), 0 12px 32px rgba(0, 0, 0, 0.6);
    }' "$file"
    echo "  Added dark mode 3D variables"
  fi
  
  # Update background to use gradient mesh
  sed -i '' 's/background-color: var(--bg-body);/background: var(--bg-body);\
      background-image: var(--gradient-mesh);\
      background-attachment: fixed;/g' "$file"
  echo "  Updated background"
  
done

echo "Done!"

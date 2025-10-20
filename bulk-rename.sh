#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
RENAME_FILE="renames.csv"
# ---

# 1. Check if the renames.csv file exists
if [ ! -f "$RENAME_FILE" ]; then
  echo "Error: Rename file not found at '$RENAME_FILE'"
  exit 1
fi

echo "Starting bulk rename process..."

# 2. Read the CSV file line by line
while IFS=, read -r find_str replace_str; do
  # Trim whitespace that might be left by the CSV format
  find_str=$(echo "$find_str" | xargs)
  replace_str=$(echo "$replace_str" | xargs)

  if [ -z "$find_str" ] || [ -z "$replace_str" ]; then
    echo "Skipping empty line in CSV."
    continue
  fi

  echo "---"
  echo "Processing: Renaming '$find_str' to '$replace_str'"

  # 3. Find all files containing the whole word and perform the replacement.
  # - `git grep -l` lists files tracked by git, automatically respecting .gitignore.
  # - `--word-regexp` ensures we match whole words.
  # - `xargs` passes the file list to sed.
  # - `sed -i ''` performs in-place editing (the '' is for macOS compatibility).
    # - `sed -i ''` performs in-place editing (the '' is for macOS compatibility).
  git grep -l --word-regexp "$find_str" -- ':(exclude)*/renames.csv' ':(exclude)*/bulk-rename.sh' | while read -r file; do
    sed -i '' -e "s/[[:<:]]$find_str[[:>:]]/$replace_str/g" "$file"
  done

  # 4. Check if there were any changes
  if ! git diff --quiet; then
    echo "Changes detected. Compiling project..."
    # 5. Run the compile command
    if yarn compile; then
      echo "Compilation successful. Committing changes..."
      # 6. Commit the changes
      git add .
      git commit -m "Renamed $find_str to $replace_str"
      echo "Commit successful."
    else
      echo "--------------------------------------------------"
      echo "ERROR: 'yarn compile' failed for '$find_str' -> '$replace_str'."
      echo "Please fix the compilation errors and then manually run the script again."
      echo "--------------------------------------------------"
      exit 1
    fi
  else
    echo "No changes detected for '$find_str'. Nothing to do."
  fi

done < "$RENAME_FILE"

echo "---"
echo "Bulk rename process completed successfully."

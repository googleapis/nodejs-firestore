import re
import sys
import subprocess
import difflib

def remove_markdown_fences(text):
    """Removes markdown code fences from a string if they surround it."""
    text = text.strip()
    if text.startswith('```') and text.endswith('```'):
        lines = text.split('\n')
        if len(lines) > 1:
            # Check if the first line is a language specifier
            if lines[0].startswith('```'):
                lines = lines[1:]
            # The last line is just ```
            if lines and lines[-1].strip() == '```':
                lines = lines[:-1]
            return '\n'.join(lines)
        else:
            # Single line case: ```comment```
            return text[3:-3].strip()
    return text


def run_task(tsdoc, declaration, debug=False, class_name=None, draft_description=None):
    """Runs a Gemini CLI task to review and potentially update a TSDoc comment."""

    declaration_info = f"Declaration:\n{declaration}"
    if class_name:
        declaration_info = f"Class: {class_name}\nMember Declaration:\n{declaration}"

    prompt = f"""
Review the following TSDoc comment for the given TypeScript declaration.
If the TSDoc comment is accurate and makes sense for the declaration, respond with "OK".
If the TSDoc comment is inaccurate or could be improved, please generate a new, high-quality TSDoc comment for the declaration.
The new TSDoc comment should be well-written, informative, and follow standard TSDoc conventions.
"""

    if draft_description:
        prompt += f"\nUse the following description to help you write the TSDoc comment:\n{draft_description}\n"

    prompt += f"""
TSDoc Comment:
{tsdoc}

{declaration_info}

New TSDoc Comment (or "OK"):
"""

    if debug:
        print("--- Gemini CLI Prompt ---")
        print(prompt)
        print("-------------------------")

    print("--- Running Gemini CLI task ---")
    try:
        process = subprocess.run(['gemini', '-p', prompt, '-m', 'gemini-2.5-flash'], capture_output=True, text=True, check=True)
        output = process.stdout.strip()
        print(output)
        if output != "OK":
            return output
    except FileNotFoundError:
        print("Error: The 'gemini' command was not found.")
        print("Please make sure the Gemini CLI is installed and in your system's PATH.")
    except subprocess.CalledProcessError as e:
        print(f"Error executing Gemini CLI: {e}")
        print(f"Stderr: {e.stderr}")

    print("--- Task finished ---")
    return None


def find_classes(content):
    """Finds all class definitions and their character ranges in the content."""
    classes = []
    class_pattern = re.compile(r"^\s*(?:export\s+)?class\s+(\w+)", re.MULTILINE)
    for match in class_pattern.finditer(content):
        class_name = match.group(1)
        class_start_pos = match.start()

        try:
            brace_start_pos = content.index('{', match.end())
        except ValueError:
            continue

        brace_count = 1
        for i in range(brace_start_pos + 1, len(content)):
            if content[i] == '{':
                brace_count += 1
            elif content[i] == '}':
                brace_count -= 1

            if brace_count == 0:
                classes.append({'name': class_name, 'start': class_start_pos, 'end': i})
                break
    return classes

def find_namespace_content(content, namespace_path):
    """Finds the content of a given nested namespace in the file content."""
    namespaces = namespace_path.split('.')
    current_content = content
    for namespace in namespaces:
        namespace_pattern = re.compile(r"namespace\s+" + re.escape(namespace) + r"\s*\{", re.DOTALL)
        match = namespace_pattern.search(current_content)
        if not match:
            return None

        start_index = match.end()
        brace_count = 1
        for i in range(start_index, len(current_content)):
            if current_content[i] == '{':
                brace_count += 1
            elif current_content[i] == '}':
                brace_count -= 1

            if brace_count == 0:
                current_content = current_content[start_index:i]
                break
        else: # No matching closing brace
            return None

    return current_content

if __name__ == "__main__":
    debug = False
    file_path = None
    namespace = None
    yolo = False
    filter_text = None

    for arg in sys.argv[1:]:
        if arg == '--debug':
            debug = True
        elif arg == '--yolo':
            yolo = True
        elif arg.startswith('--filter='):
            filter_text = arg.split('=', 1)[1]
        elif arg.startswith('--namespace='):
            namespace = arg.split('=', 1)[1]
        elif not arg.startswith('--'):
            file_path = arg

    if not file_path:
        print("Usage: python extract-tsdoc.py <file_path> [--debug] [--yolo] [--filter=X] [--namespace=X.Y.Z]")
        sys.exit(1)

    with open(file_path, "r") as f:
        content = f.read()

    original_content = content

    if namespace:
        content_to_process = find_namespace_content(content, namespace)
        if content_to_process is None:
            print(f"Namespace '{namespace}' not found.")
            sys.exit(1)
    else:
        content_to_process = content

    classes = find_classes(content_to_process)

    tsdoc_pattern = re.compile(r"(/\*\*.*?\*/)", re.DOTALL)
    matches = list(tsdoc_pattern.finditer(content_to_process))

    modified_content = content
    for i, match in enumerate(matches):
        start, end = match.span()

        tsdoc_comment = match.group(1)

        current_class = None
        for cls in classes:
            if cls['start'] < start < cls['end']:
                current_class = cls['name']
                break

        if filter_text and filter_text not in tsdoc_comment:
            continue

        declaration_start = end
        while declaration_start < len(content_to_process) and content_to_process[declaration_start].isspace():
            declaration_start += 1

        if declaration_start < len(content_to_process):
            next_tsdoc_start = len(content_to_process)
            if i + 1 < len(matches):
                next_tsdoc_start, _ = matches[i+1].span()

            declaration_end = content_to_process.find("\n", declaration_start)
            if declaration_end == -1 or declaration_end > next_tsdoc_start:
                declaration_end = next_tsdoc_start

            declaration = content_to_process[declaration_start:declaration_end].strip()

            if not yolo:
                print(f"TSDoc Comment:")
                print(tsdoc_comment)
                if current_class:
                    print(f"Class: {current_class}")
                print(f"Declaration:")
                print(declaration)

                while True:
                    choice = input("Run task on this pair? (Y/n/q/d): ").lower()
                    if choice in ['y', 'n', 'q', 'd']:
                        break
                    else:
                        print("Invalid input. Please enter Y, n, q, or d.")

                if choice == 'y' or choice == 'd':
                    draft_description = None
                    if choice == 'd':
                        draft_description = input("Please provide a draft description:\n")
                    new_tsdoc = run_task(tsdoc_comment, declaration, debug, class_name=current_class, draft_description=draft_description)
                    if new_tsdoc:
                        new_tsdoc = remove_markdown_fences(new_tsdoc)
                        print("Replacing TSDoc comment in the file.")
                        modified_content = modified_content.replace(tsdoc_comment, new_tsdoc, 1)

                elif choice == 'q':
                    print("Quitting.")
                    break
            else: # YOLO mode
                print(f"Running task for declaration: {declaration}")
                new_tsdoc = run_task(tsdoc_comment, declaration, debug, class_name=current_class)
                if new_tsdoc:
                    new_tsdoc = remove_markdown_fences(new_tsdoc)
                    print(f"Replacing TSDoc for declaration: {declaration}")
                    modified_content = modified_content.replace(tsdoc_comment, new_tsdoc, 1)

    if modified_content != original_content:
        if not yolo:
            print("The following changes are about to be written to the file:")
            diff = difflib.unified_diff(original_content.splitlines(keepends=True),
                                        modified_content.splitlines(keepends=True),
                                        fromfile='original', tofile='modified')
            for line in diff:
                sys.stdout.write(line)

            while True:
                choice = input("Write changes to file? (y/n): ").lower()
                if choice in ['y', 'n']:
                    break
                else:
                    print("Invalid input. Please enter y or n.")

            if choice == 'y':
                with open(file_path, "w") as f:
                    f.write(modified_content)
                print("File updated successfully.")
            else:
                print("Changes were not written to the file.")
        else:
            with open(file_path, "w") as f:
                f.write(modified_content)
            print("File updated successfully in YOLO mode.")

import re
import sys
import subprocess
import difflib

def run_task(tsdoc, declaration, debug=False):
    """Runs a Gemini CLI task to review and potentially update a TSDoc comment."""
    
    prompt = f"""
Review the following TSDoc comment for the given TypeScript declaration.
If the TSDoc comment is accurate and makes sense for the declaration, respond with "OK".
If the TSDoc comment is inaccurate or could be improved, please generate a new, high-quality TSDoc comment for the declaration.
The new TSDoc comment should be well-written, informative, and follow standard TSDoc conventions.

TSDoc Comment:
{tsdoc}

Declaration:
{declaration}

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

    for arg in sys.argv[1:]:
        if arg == '--debug':
            debug = True
        elif arg == '--yolo':
            yolo = True
        elif arg.startswith('namespace='):
            namespace = arg.split('=', 1)[1]
        elif not arg.startswith('--'):
            file_path = arg

    if not file_path:
        print("Usage: python extract-tsdoc.py <file_path> [--debug] [--yolo] [namespace=X.Y.Z]")
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

    tsdoc_pattern = re.compile(r"(/\*\*.*?\*/)", re.DOTALL)
    matches = list(tsdoc_pattern.finditer(content_to_process))

    modified_content = content
    for i, match in enumerate(matches):
        start, end = match.span()
        
        tsdoc_comment = match.group(1)
        
        declaration_start = end
        while declaration_start < len(content_to_process) and content_to_process[declaration_start].isspace():
            declaration_start += 1

        if declaration_start < len(content_to_process):
            next_tsdoc_start = len(content_to_process)
            if i + 1 < len(matches):
                next_tsdoc_start, _ = matches[i+1].span()
            
            declaration_end = content_to_process.find(";", declaration_start)
            if declaration_end == -1 or declaration_end > next_tsdoc_start:
                declaration_end = content_to_process.find("{", declaration_start)
                if declaration_end == -1 or declaration_end > next_tsdoc_start:
                    declaration_end = next_tsdoc_start

            declaration = content_to_process[declaration_start:declaration_end].strip()

            if not yolo:
                print(f"TSDoc Comment:")
                print(tsdoc_comment)
                print(f"Declaration:")
                print(declaration)
                
                while True:
                    choice = input("Run task on this pair? (Y/n/q): ").lower()
                    if choice in ['y', 'n', 'q']:
                        break
                    else:
                        print("Invalid input. Please enter Y, n, or q.")

                if choice == 'y':
                    new_tsdoc = run_task(tsdoc_comment, declaration, debug)
                    if new_tsdoc:
                        print("Replacing TSDoc comment in the file.")
                        modified_content = modified_content.replace(tsdoc_comment, new_tsdoc)

                elif choice == 'q':
                    print("Quitting.")
                    break
            else: # YOLO mode
                print(f"Running task for declaration: {declaration}")
                new_tsdoc = run_task(tsdoc_comment, declaration, debug)
                if new_tsdoc:
                    print(f"Replacing TSDoc for declaration: {declaration}")
                    modified_content = modified_content.replace(tsdoc_comment, new_tsdoc)

            print("-" * 20)

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

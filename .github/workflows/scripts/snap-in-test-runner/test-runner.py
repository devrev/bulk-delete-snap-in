import subprocess
import os
import argparse

snap_in_repo_dir = os.getcwd()

# Function to run npm install and npx jest in a directory
def run_npm_commands(directory_path):
    if not os.path.exists(directory_path):
        print(f"Directory {directory_path} doesn't exist.")
        return
    
    os.chdir(directory_path)
    # Run npm install
    npm_install_command = ['npm', 'install']
    subprocess.run(npm_install_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    # Run test (yet to figure out how to include coverage report)
    # jest_config_path = os.path.join(snap_in_repo_dir, '.github', 'coverage', 'jest.config.js')

    npm_test_command = ['npx', 'jest', '--forceExit']

    print(f"Running tests in {directory_path}")

    result = subprocess.run(npm_test_command, text=True)
    os.chdir(snap_in_repo_dir)
    if result.returncode != 0:
        print(f"Tests failed in {directory_path}")
        return True         

# Function to check if a directory contains manifest.yaml as a direct child
def has_manifest_yaml(directory_path):
    for root, dirs, files in os.walk(directory_path):
        if "manifest.yaml" in files:
            return True
    return False

def find_snap_in_code_directory(root_directory):
    for root, dirs, files in os.walk(root_directory):
            if "manifest.yaml" in files:
                return os.path.join(os.path.abspath(root), 'code')


def main():
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description="Run npm install and test in specific directories.")
    parser.add_argument('--modified_files', help="The list of modified files.")
    args = parser.parse_args()

    modified_files = args.modified_files.splitlines()

    tests_failed = False 

    # Extract root directories from modified file paths containing manifest file while excluding .js and .ts files
    root_directories = set()

    for file in modified_files:
        parts = file.split('/')
        if parts and has_manifest_yaml(os.path.join(snap_in_repo_dir, parts[0])):
            if not parts[0].endswith(('.js', '.ts')):
                root_directories.add(parts[0])

    for root_directory in root_directories:
        # Check if 'code' directory exists in the root directory
        code_directory = os.path.join(root_directory, 'code')
        code_directory_path = os.path.join(snap_in_repo_dir, code_directory)

        if not os.path.exists(code_directory_path):
            code_directory_path = find_snap_in_code_directory(os.path.join(snap_in_repo_dir, root_directory))
        
        if run_npm_commands(code_directory_path):
            tests_failed = True

    if tests_failed:
        exit(1) 


if __name__ == '__main__':
    main()

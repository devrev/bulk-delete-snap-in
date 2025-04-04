import os
import requests

# Read the token from the ACTOR_JWT environment variable
token = os.environ.get('ACTOR_JWT')

# Find all manifest_*.yaml files at a maximum depth of 2 from the current directory
manifest_files = []
for root, dirs, files in os.walk('.', topdown=True):
    if root.count(os.sep) <= 2:
        for file in files:
            if file.startswith('manifest') and file.endswith('.yaml'):
                manifest_files.append(os.path.join(root, file))


validation_failed = False
# Loop through each manifest file and run the validate function
for yaml_file in manifest_files:
    # Read the manifest from the YAML file
    with open(yaml_file, 'r') as file:
        manifest = file.read()

    # Perform the POST request
    url = 'https://api.dev.devrev-eng.ai/internal/snap-in-versions.validate-manifest'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': token
    }
    data = {
        'manifest': manifest
    }
    response = requests.post(url, headers=headers, json=data)

    if response.status_code != 200:
        print(f"Validation failed for {yaml_file} with error: {response.text}")
        validation_failed = True
        continue


    # Extract the validation_errors array and check its length
    validation_errors = response.json().get('validation_errors', [])
    length = len(validation_errors)

    if length == 0:
        print(f"Validation successful for {yaml_file}")
    else:
        print(f"Validation failed for {yaml_file}")
        print(validation_errors)
        validation_failed = True

if validation_failed:
    exit(1)
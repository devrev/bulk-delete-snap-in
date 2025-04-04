import os
import json
import subprocess
import sys

# function to get the file names that are changed.
def getChangedFileNames(arguments):
    fileNames = arguments[1].splitlines()
    folderNames = []

    for file in fileNames:
        if file.startswith(".") or (not "manifest.yaml" in file and not "/code/" in file):
            continue
        parentFolder = file.split("/")[0]
        if parentFolder not in folderNames and parentFolder not in skipFolders:
            folderNames.append(parentFolder)
    return folderNames

# function to check the dependencies, Unused dependencies and missing dependencies.
def checkDependencies(folderNames):
    dependency_check_failed = False
    for folder in folderNames:
        os.chdir(".")
        # if the folder doesn't exist (aka was deleted), skip the dependency check
        if not os.path.exists(folder):
            continue
        # for the folder that does not have code folder, skip the dependency check
        if "code" not in os.listdir(folder):
            continue
        if "code" in os.listdir(folder) and "package.json" not in os.listdir(folder + "/code"):
            continue
        root = folder + "/code"
        #  run command to run depcheck command using subprocess
        dependencyData = subprocess.run(['depcheck', root, '--json'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        #  decode the output
        dependencyData = dependencyData.stdout.decode('utf-8')
        #  convert the output to json
        dependencyData = json.loads(dependencyData)
        #  get the dependencies
        unusedDependencies = dependencyData['dependencies']
        #  get the missing dependencies
        missingDependencies = dependencyData['missing']

        if len(unusedDependencies) > 0:
            print(f"Unused dependencies found for {root}")
            print(*unusedDependencies,sep="\n",end="\n\n")
            dependency_check_failed = True
            continue
        elif len(missingDependencies) > 0:
            print(f"Missing dependencies found for {root}")
            for missingDependency in missingDependencies:
                print(missingDependency, missingDependencies[missingDependency], end = "\n\n")
            dependency_check_failed = True
            continue
        else:
            print(f"Dependency check successful for {root}\n")
            continue
    return dependency_check_failed

def main(arguments):
    folderNames = getChangedFileNames(arguments)
    dependency_check_failed = checkDependencies(folderNames)
    if dependency_check_failed:
        print("Dependency check failed")
        exit(1)
    else:
        print("Dependency check successful")


if __name__ == "__main__":
    # Folders that should be skipped from dependency check
    skipFolders = [
        "e2e"
        "examples"
    ]
    arguments = sys.argv
    main(arguments)

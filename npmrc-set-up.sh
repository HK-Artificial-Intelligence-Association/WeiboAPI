#!/bin/bash

# Function to display usage information
usage() {
    echo "Usage: $0 -t <githubToken> -p <packageName> [-o <orgName>]"
    exit 1
}

# Default value for orgName
orgName="hk-artificial-intelligence-association"

# Parse command-line arguments
while getopts ":t:p:o:" opt; do
    case ${opt} in
        t)
            githubToken=${OPTARG}
            ;;
        p)
            packageName=${OPTARG}
            ;;
        o)
            orgName=${OPTARG}
            ;;
        \?)
            usage
            ;;
    esac
done

# Check if githubToken is provided
if [ -z "$githubToken" ]; then
    echo "Please provide a GitHub token using the -t parameter."
    usage
fi

# Set environment variable for GitHub token
export GITHUB_TOKEN=$githubToken

# Write .npmrc file with variable interpolation
npmrcContent="@$orgName:registry=https://npm.pkg.github.com/\n//npm.pkg.github.com/:_authToken=$githubToken"
echo -e $npmrcContent > .npmrc
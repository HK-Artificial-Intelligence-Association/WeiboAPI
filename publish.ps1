# PowerShell script to set .npmrc environment variables and publish npm package

param (
    [string]$githubToken,
    [string]$packageName,
    [string]$orgName = "hk-artificial-intelligence-association"
)

if (-not $githubToken) {
    Write-Host "Please provide a GitHub token using the -githubToken parameter."
    exit 1
}

# Set environment variable for GitHub token
$env:GITHUB_TOKEN = $githubToken

# Write .npmrc file with variable interpolation
$npmrcContent = "@${orgName}:registry=https://npm.pkg.github.com/`n//npm.pkg.github.com/:_authToken=$githubToken"
Set-Content -Path .npmrc -Value $npmrcContent

# Publish the package
npm publish

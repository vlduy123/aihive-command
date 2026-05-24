#!/usr/bin/env pwsh
# AIHive Command Center — val.town Projects API Deployer
# Usage: $env:VALTOWN_TOKEN="your_token"; .\deploy\deploy.ps1

param(
  [string]$Token = $(if ($env:valtown) { $env:valtown } else { $env:VALTOWN_TOKEN }),
  [string]$ProjectId = $env:VALTOWN_PROJECT_ID
)

if (-not $Token) {
  Write-Error "Set `$env:VALTOWN_TOKEN or pass -Token"
  exit 1
}

$Headers = @{ Authorization = "Bearer $Token"; "Content-Type" = "application/json" }
$BaseUrl = "https://api.val.town/v1"
$ValTownDir = "$PSScriptRoot\..\val.town"

# --- Discover project ID if not provided ---
if (-not $ProjectId) {
  Write-Host "Fetching project list..."
  $projects = (Invoke-RestMethod "$BaseUrl/me/projects" -Headers $Headers -Method Get).data
  $project = $projects | Where-Object { $_.name -like "*aihive*" -or $_.name -like "*command*" } | Select-Object -First 1
  if (-not $project) {
    $projects | ForEach-Object { Write-Host "  - $($_.id)  $($_.name)" }
    Write-Error "Could not find aihive project. Set -ProjectId explicitly."
    exit 1
  }
  $ProjectId = $project.id
  Write-Host "Found project: $($project.name) ($ProjectId)"
}

# --- Files to deploy (relative path in project) ---
$Files = @(
  "types.ts",
  "db.ts",
  "api/agents.ts",
  "api/llm.ts",
  "api/integrations.ts",
  "api/chat.ts",
  "router.ts",
  "frontend.ts",
  "frontend_js.ts",
  "frontend_js2.ts",
  "frontend_charts.ts",
  "frontend_ui.ts",
  "main.ts"
)

foreach ($file in $Files) {
  $localPath = Join-Path $ValTownDir ($file -replace "/", "\")
  if (-not (Test-Path $localPath)) {
    Write-Warning "Skipping $file (not found locally)"
    continue
  }
  $content = Get-Content $localPath -Raw -Encoding UTF8
  $body = @{ content = $content; type = "script" } | ConvertTo-Json -Depth 2
  $url = "$BaseUrl/projects/$ProjectId/files?path=$file"
  Write-Host "Uploading $file ($($content.Length) chars)..."
  try {
    Invoke-RestMethod $url -Method Put -Headers $Headers -Body $body -ContentType "application/json" | Out-Null
    Write-Host "  OK"
  } catch {
    Write-Warning "  FAILED: $($_.Exception.Message)"
  }
}

Write-Host ""
Write-Host "Deploy complete."

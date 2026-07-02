# Removes flashing animation classes from all tools except the first 5.
# Handles multi-line className strings and template literals.
# First 5 tools (clipy, twitchbolt, kickbolt, formatflow, pastesnap) KEEP their animations.

$toolsBase = "C:\Users\adria\Desktop\olovetools\src\tools"

# Tools to KEEP animations on (first 5 in the order of the index)
$keepTools = @('clipy', 'twitchbolt', 'kickbolt', 'formatflow', 'pastesnap')

# Animation classes to REMOVE (flashing/blinking ones)
$removeClasses = @(
    'animate-soft-pulse',
    'animate-pulse',
    'animate-fast-pulse',
    'animate-float',
    'animate-shimmer',
    'animate-rotate-slow',
    'animate-carets'
)

# Animation classes to KEEP (entrance, loading, not flashing)
$keepClasses = @(
    'animate-fade-in',
    'animate-fade-in-quick',
    'animate-spin'
)

# Build regex pattern: any of the removeClasses as whole words
# Match class name surrounded by whitespace, quote, or end of string
$removePattern = ($removeClasses | ForEach-Object { [regex]::Escape($_) }) -join '|'

# Pattern: (space or start or quote) + classname + (space or end or quote)
# Use word boundary \b
$pattern = '\b(' + $removePattern + ')\b'

Write-Host "Pattern: $pattern"
Write-Host ""

$allTools = Get-ChildItem -LiteralPath $toolsBase -Directory | Select-Object -ExpandProperty Name

$updatedTools = 0
$updatedFiles = 0
$skipped = 0
$noMatch = 0

foreach ($tool in $allTools) {
    if ($keepTools -contains $tool) {
        $skipped++
        Write-Host "SKIP (keep): $tool"
        continue
    }

    $toolPath = Join-Path $toolsBase $tool
    $tsxFiles = Get-ChildItem -LiteralPath $toolPath -Recurse -Filter "*.tsx"
    $fileUpdated = $false

    foreach ($file in $tsxFiles) {
        $content = Get-Content -LiteralPath $file.FullName -Raw
        $originalContent = $content

        # Replace class with surrounding whitespace
        # Match: optional whitespace + classname + optional whitespace
        $content = [regex]::Replace($content, '\s*\b(' + $removePattern + ')\b\s*', ' ')

        # Clean up trailing/leading spaces in className strings
        $content = [regex]::Replace($content, 'className="\s+"', 'className=""')
        $content = [regex]::Replace($content, 'className=""', '')

        if ($content -ne $originalContent) {
            $utf8NoBom = New-Object System.Text.UTF8Encoding $False
            [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
            $updatedFiles++
            $fileUpdated = $true
        }
    }

    if ($fileUpdated) {
        $updatedTools++
        Write-Host "UPDATED: $tool"
    } else {
        $noMatch++
        Write-Host "NO MATCH: $tool"
    }
}

Write-Host ""
Write-Host "=== Summary ==="
Write-Host "Updated: $updatedTools tools, $updatedFiles files"
Write-Host "Skipped (keep): $skipped tools"
Write-Host "No match: $noMatch tools"
Write-Host "Total: $($allTools.Count) tools"

# Removes the static glow orbs AND gradient glows from tools #6+
# Matches both self-closing and empty closing divs.
# First 5 tools keep their effects.

$toolsBase = "C:\Users\adria\Desktop\olovetools\src\tools"
$keepTools = @('clipy', 'twitchbolt', 'kickbolt', 'formatflow', 'pastesnap')

$allTools = Get-ChildItem -LiteralPath $toolsBase -Directory | Select-Object -ExpandProperty Name

$updatedTools = 0
$updatedFiles = 0
$skipped = 0
$noChange = 0

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

        # Pattern 1: Self-closing round orb divs (absolute, blur, rounded-full)
        $orbPattern1 = '<div\s+className="(?=[^"]*\babsolute\b)(?=[^"]*\bblur-\[\d+px\])(?=[^"]*\brounded-full\b)[^"]*"\s*(?:style=\{\{[^}]*\}\})?\s*/>'
        $content = [regex]::Replace($content, $orbPattern1, '')

        # Pattern 2: Empty round orb divs with </div>
        $orbPattern2 = '<div\s+className="(?=[^"]*\babsolute\b)(?=[^"]*\bblur-\[\d+px\])(?=[^"]*\brounded-full\b)[^"]*"\s*(?:style=\{\{[^}]*\}\})?\s*></div>'
        $content = [regex]::Replace($content, $orbPattern2, '')

        # Pattern 3: Self-closing gradient glow divs (bg-gradient-to-*, blur, large size)
        $gradientPattern1 = '<div\s+className="(?=[^"]*\bbg-gradient-to-)(?=[^"]*\bblur-\[\d+px\])(?=[^"]*\b(?:w-\[|absolute)[^"]*)[^"]*"\s*(?:style=\{\{[^}]*\}\})?\s*/>'
        $content = [regex]::Replace($content, $gradientPattern1, '')

        # Pattern 4: Empty gradient glow divs
        $gradientPattern2 = '<div\s+className="(?=[^"]*\bbg-gradient-to-)(?=[^"]*\bblur-\[\d+px\])(?=[^"]*\b(?:w-\[|absolute)[^"]*)[^"]*"\s*(?:style=\{\{[^}]*\}\})?\s*></div>'
        $content = [regex]::Replace($content, $gradientPattern2, '')

        # Pattern 5: Remove empty wrapping container with fixed inset-0
        $containerPattern = '<div\s+className="fixed\s+inset-0[^"]*pointer-events-none[^"]*z-0[^"]*"\s*>\s*</div>'
        $content = [regex]::Replace($content, $containerPattern, '')

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
        $noChange++
        Write-Host "NO CHANGE: $tool"
    }
}

Write-Host ""
Write-Host "=== Summary ==="
Write-Host "Updated: $updatedTools tools, $updatedFiles files"
Write-Host "Skipped (keep): $skipped tools"
Write-Host "No change: $noChange tools"
Write-Host "Total: $($allTools.Count) tools"

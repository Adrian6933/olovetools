# Fixes mojibake (double-encoded UTF-8) in TSX files.

$toolsBase = "C:\Users\adria\Desktop\olovetools\src\tools"
$keepTools = @('clipy', 'twitchbolt', 'kickbolt', 'formatflow', 'pastesnap')

$allTools = Get-ChildItem -LiteralPath $toolsBase -Directory | Select-Object -ExpandProperty Name

$fileCount = 0
$skipped = 0
$noChange = 0

# Mojibake patterns that need fixing (in order)
# Each: (mojibakeBytes, properBytes)
$replacements = @(
    # "ðŸ—œï¸" = mojibake of "🖼️" (F0 9F 96 BC EF B8 8F)
    @(@(0xC3, 0xB0, 0xC5, 0xB8, 0xE2, 0x80, 0x94, 0xC5, 0x93, 0xC3, 0xAF, 0xC2, 0xB8, 0xC2, 0x8F), @(0xF0, 0x9F, 0x96, 0xBC, 0xEF, 0xB8, 0x8F)),
    # "ðŸ―¼ï¸" = mojibake of "🖼️" (F0 9F 96 BC EF B8 8F) with en-dash instead of em-dash
    @(@(0xC3, 0xB0, 0xC5, 0xB8, 0xE2, 0x80, 0x93, 0xC2, 0xBC, 0xC3, 0xAF, 0xC2, 0xB8, 0xC2, 0x8F), @(0xF0, 0x9F, 0x96, 0xBC, 0xEF, 0xB8, 0x8F))
)

function Apply-Replacements {
    param($bytes, [byte[]]$from, [byte[]]$to)
    $result = New-Object 'System.Collections.Generic.List[byte]' ($bytes.Count)
    $i = 0
    $fromLen = $from.Length
    $changed = $false
    while ($i -lt $bytes.Count) {
        $match = $true
        for ($j = 0; $j -lt $fromLen; $j++) {
            if ($i + $j -ge $bytes.Count -or $bytes[$i + $j] -ne $from[$j]) {
                $match = $false
                break
            }
        }
        if ($match) {
            foreach ($b in $to) { $result.Add($b) }
            $i += $fromLen
            $changed = $true
        } else {
            $result.Add($bytes[$i])
            $i++
        }
    }
    return @{ Bytes = $result.ToArray(); Changed = $changed }
}

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
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $currentBytes = $bytes
        $fileChanged = $false

        foreach ($r in $replacements) {
            $fromBytes = $r[0]
            $toBytes = $r[1]
            $result = Apply-Replacements $currentBytes $fromBytes $toBytes
            $currentBytes = $result.Bytes
            if ($result.Changed) { $fileChanged = $true }
        }

        if ($fileChanged) {
            [System.IO.File]::WriteAllBytes($file.FullName, $currentBytes)
            $fileUpdated = $true
            $fileCount++
        }
    }

    if ($fileUpdated) {
        Write-Host "FIXED: $tool"
    } else {
        $noChange++
        Write-Host "NO CHANGE: $tool"
    }
}

Write-Host ""
Write-Host "=== Summary ==="
Write-Host "Fixed: $fileCount files"
Write-Host "Skipped: $skipped tools"
Write-Host "No change: $noChange tools"
Write-Host "Total: $($allTools.Count) tools"

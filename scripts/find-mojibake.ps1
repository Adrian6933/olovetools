# Find all unique high-byte sequences in tools #6+
$toolsBase = "C:\Users\adria\Desktop\olovetools\src\tools"
$keepTools = @('clipy', 'twitchbolt', 'kickbolt', 'formatflow', 'pastesnap')

$allTools = Get-ChildItem -LiteralPath $toolsBase -Directory | Select-Object -ExpandProperty Name

$patterns = @{}
foreach ($tool in $allTools) {
    if ($keepTools -contains $tool) { continue }
    $toolPath = Join-Path $toolsBase $tool
    $tsxFiles = Get-ChildItem -LiteralPath $toolPath -Recurse -Filter "*.tsx"
    foreach ($file in $tsxFiles) {
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        for ($i = 0; $i -lt $bytes.Length; $i++) {
            $b = $bytes[$i]
            if ($b -lt 0x80) { continue }
            # Found a high byte
            $seq = @()
            for ($k = $i; $k -lt $bytes.Length; $k++) {
                $bb = $bytes[$k]
                if ($bb -lt 0x80) { break }
                $seq += $bb
            }
            if ($seq.Count -ge 2 -and $seq.Count -le 8) {
                $key = ($seq | ForEach-Object { $_.ToString('X2') }) -join ' '
                if (-not $patterns.ContainsKey($key)) {
                    $patterns[$key] = @{ File = $file.Name; Tool = $tool; Count = 1 }
                } else {
                    $patterns[$key].Count++
                }
            }
            $i = $i + $seq.Count
        }
    }
}

Write-Host "Found $($patterns.Count) unique high-byte sequences:"
foreach ($key in ($patterns.Keys | Sort-Object)) {
    $p = $patterns[$key]
    Write-Host "  $key ($($p.Count)x) in $($p.File)"
}

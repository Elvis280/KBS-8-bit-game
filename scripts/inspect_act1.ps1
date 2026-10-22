Add-Type -AssemblyName System.Drawing

$dir = Join-Path $PSScriptRoot "..\public\assets\tiles\Act_1"
Get-ChildItem "$dir\*.png" | ForEach-Object {
    $bmp = [System.Drawing.Bitmap]::FromFile($_.FullName)
    $w = $bmp.Width
    $h = $bmp.Height
    
    # Find bounding box of non-transparent pixels (Alpha > 20)
    $minY = $h
    $maxY = 0
    $minX = $w
    $maxX = 0
    
    for ($y = 0; $y -lt $h; $y += 2) {
        for ($x = 0; $x -lt $w; $x += 4) {
            $c = $bmp.GetPixel($x, $y)
            if ($c.A -gt 20) {
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
            }
        }
    }
    
    Write-Host ("{0}: {1}x{2} | Content Bounds: X:[{3}..{4}] Y:[{5}..{6}] (Content H={7})" -f $_.Name, $w, $h, $minX, $maxX, $minY, $maxY, ($maxY - $minY + 1))
    $bmp.Dispose()
}

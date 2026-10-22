Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\public\assets\backgrounds\ground_act1.png"
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$w = $bmp.Width
$h = $bmp.Height

# Check rows in platform region between 1660 and 2150 in detail
for ($y = 60; $y -lt 700; $y++) {
    $count = 0
    for ($x = 1660; $x -lt 2150; $x++) {
        if ($bmp.GetPixel($x, $y).A -gt 20) { $count++ }
    }
    if ($count -eq 0) {
        Write-Host "Blank row: $y"
    }
}

$bmp.Dispose()

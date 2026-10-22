Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\public\assets\backgrounds\ground_act1.png"
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$w = $bmp.Width
$h = $bmp.Height

# Scan rows between x=1660 and x=2150 to find the 3 platform bounds
for ($y = 0; $y -lt $h; $y += 5) {
    $count = 0
    for ($x = 1660; $x -lt 2150; $x += 5) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.A -gt 20) { $count++ }
    }
    if ($count -eq 0) {
        Write-Host "Blank row in platforms at y = $y"
    }
}

# Scan main ground section to find top of grass and bottom of soil
for ($y = 0; $y -lt $h; $y += 10) {
    $count = 0
    for ($x = 400; $x -lt 1400; $x += 10) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.A -gt 20) { $count++ }
    }
    Write-Host "Main ground row y=$y opaque count=$count"
}

$bmp.Dispose()

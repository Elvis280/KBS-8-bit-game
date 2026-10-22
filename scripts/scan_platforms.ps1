Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\public\assets\backgrounds\ground_act1.png"
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)

for ($y = 292; $y -lt 694; $y += 5) {
    $count = 0
    $minX = 9999
    $maxX = 0
    for ($x = 1660; $x -lt 2150; $x++) {
        if ($bmp.GetPixel($x, $y).A -gt 20) {
            $count++
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
        }
    }
    Write-Host ("y={0}: count={1}, minX={2}, maxX={3}" -f $y, $count, $minX, $maxX)
}

$bmp.Dispose()

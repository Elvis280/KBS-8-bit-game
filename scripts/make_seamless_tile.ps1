Add-Type -AssemblyName System.Drawing

$srcPath = "public/assets/tiles/Act_1/ground_act1_tile.png"
if (!(Test-Path $srcPath)) {
    $srcPath = "public/assets/tiles/ground_act1_tile.png"
}

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$w = $src.Width
$h = $src.Height

$out = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$blendW = 32

for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        if ($x -lt $blendW) {
            # Blend between left edge and wrapped right edge
            $t = $x / $blendW
            $cLeft = $src.GetPixel($x, $y)
            $cRight = $src.GetPixel($w - $blendW + $x, $y)
            $a = [int]($cLeft.A * $t + $cRight.A * (1 - $t))
            $r = [int]($cLeft.R * $t + $cRight.R * (1 - $t))
            $g = [int]($cLeft.G * $t + $cRight.G * (1 - $t))
            $b = [int]($cLeft.B * $t + $cRight.B * (1 - $t))
            $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a, $r, $g, $b))
        } else {
            $out.SetPixel($x, $y, $src.GetPixel($x, $y))
        }
    }
}

$outPath1 = "public/assets/tiles/ground_act1_seamless.png"
$outPath2 = "public/assets/tiles/Act_1/ground_act1_seamless.png"
$out.Save($outPath1, [System.Drawing.Imaging.ImageFormat]::Png)
$out.Save($outPath2, [System.Drawing.Imaging.ImageFormat]::Png)
$out.Dispose()
$src.Dispose()
Write-Host "Seamless tile saved to $outPath1 and $outPath2"

Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\public\assets\backgrounds\ground_act1.png"
$fullImg = [System.Drawing.Bitmap]::FromFile($srcPath)
$tilesDir = Join-Path $PSScriptRoot "..\public\assets\tiles"
if (!(Test-Path $tilesDir)) {
    New-Item -ItemType Directory -Path $tilesDir -Force | Out-Null
}

function Save-SubImage($name, $x, $y, $w, $h) {
    # Find exact non-empty bounds inside the box
    $minX = $x + $w; $maxX = $x; $minY = $y + $h; $maxY = $y
    for ($px = $x; $px -lt ($x + $w); $px++) {
        for ($py = $y; $py -lt ($y + $h); $py++) {
            if ($fullImg.GetPixel($px, $py).A -gt 15) {
                if ($px -lt $minX) { $minX = $px }
                if ($px -gt $maxX) { $maxX = $px }
                if ($py -lt $minY) { $minY = $py }
                if ($py -gt $maxY) { $maxY = $py }
            }
        }
    }
    if ($maxX -gt $minX -and $maxY -gt $minY) {
        $realW = $maxX - $minX + 1
        $realH = $maxY - $minY + 1
        $rect = New-Object System.Drawing.Rectangle($minX, $minY, $realW, $realH)
        $cropped = $fullImg.Clone($rect, $fullImg.PixelFormat)
        $outPath = Join-Path $tilesDir "$name.png"
        $cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $cropped.Dispose()
        Write-Host "Saved $outPath ($realW x $realH, top=$minY)"
    }
}

# 1. Main Ground Block (x=0 to 1650, y=0 to 724)
Save-SubImage "ground_act1_main" 0 0 1650 724

# 2. Main Ground Surface Strip (Walkable Grass & Soil layer: y=410 to 675, x=0 to 1650)
Save-SubImage "ground_act1_strip" 0 410 1650 270

# 3. Middle Flat Seamless-friendly Tile (between tree and stump: x=500 to 1100, y=410 to 675)
Save-SubImage "ground_act1_tile" 500 410 600 270

# 4. Platform 1 (Top Wooden Log with Leaves & Mushrooms: y=60 to 285)
Save-SubImage "platform_act1_log" 1660 60 490 225

# 5. Platform 2 (Middle Stone Rock with Moss & Hanging Vines: y=290 to 500)
Save-SubImage "platform_act1_stone" 1660 290 490 210

# 6. Platform 3 (Bottom Earthen Moss with Mushroom: y=505 to 700)
Save-SubImage "platform_act1_moss" 1660 505 490 195

$fullImg.Dispose()
Write-Host "Slicing complete!"

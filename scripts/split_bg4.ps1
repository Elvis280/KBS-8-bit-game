Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\public\assets\backgrounds\bg4.png"
$fullImg = [System.Drawing.Bitmap]::FromFile($srcPath)

$w = $fullImg.Width
$h = $fullImg.Height
$halfW = [int]($w / 2)

Write-Host "Source image size: $w x $h (half: $halfW)"

# 1. Exterior (Left Half): x = 0, width = 850
$rectLeft = New-Object System.Drawing.Rectangle(0, 0, 850, $h)
$bmpLeft = $fullImg.Clone($rectLeft, $fullImg.PixelFormat)
$outLeft = Join-Path $PSScriptRoot "..\public\assets\backgrounds\bg4_exterior.png"
$bmpLeft.Save($outLeft, [System.Drawing.Imaging.ImageFormat]::Png)
$bmpLeft.Dispose()
Write-Host "Saved: $outLeft (850 x $h)"

# 2. Interior / Throne Room (Right Half): x = 860, width = ($w - 860)
$rightW = $w - 860
$rectRight = New-Object System.Drawing.Rectangle(860, 0, $rightW, $h)
$bmpRight = $fullImg.Clone($rectRight, $fullImg.PixelFormat)
$outRight = Join-Path $PSScriptRoot "..\public\assets\backgrounds\bg4_interior.png"
$bmpRight.Save($outRight, [System.Drawing.Imaging.ImageFormat]::Png)
$bmpRight.Dispose()
Write-Host "Saved: $outRight ($rightW x $h)"

$fullImg.Dispose()

Add-Type -AssemblyName System.Drawing
$b = [System.Drawing.Bitmap]::FromFile("public/assets/backgrounds/ground_act1.png")
Write-Host "Pixel at (10,10):" ($b.GetPixel(10,10))
Write-Host "Pixel at (500,50):" ($b.GetPixel(500,50))
Write-Host "Pixel at (1000,500):" ($b.GetPixel(1000,500))
$b.Dispose()

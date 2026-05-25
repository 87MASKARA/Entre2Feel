$files = Get-ChildItem -Recurse -Filter '*.html'
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if ($content -match '\xF0\x9F\x87\xAA\xF0\x9F\x87\xB8 EN') {
        $newContent = $content -replace '\xF0\x9F\x87\xAA\xF0\x9F\x87\xB8 EN', [char]::ConvertFromUtf32(0x1F1FA) + [char]::ConvertFromUtf32(0x1F1F8) + ' EN'
        Set-Content $file.FullName $newContent -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
}

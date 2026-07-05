$f = 'c:\Users\philg\InsightSpark\InsightSpark\src\components\ui\help.component.ts'
$c = Get-Content $f -Raw

# Fix border with opacity modifiers like border-[var(--X)]/30
$c = $c -replace 'border-\[var\((--[\w-]+)\)\]/(\d+)', 'border-($1)/$2'
# Fix text with opacity modifiers
$c = $c -replace 'text-\[var\((--[\w-]+)\)\]/(\d+)', 'text-($1)/$2'
# Fix simple classes (only in class="" strings, not [class.X] bindings)
$c = $c -replace '(?<!"[^"]*\[class\.)bg-\[var\((--[\w-]+)\)\]', 'bg-($1)'
$c = $c -replace '(?<!\.)text-\[var\((--[\w-]+)\)\](?!")', 'text-($1)'
$c = $c -replace '(?<!\.)border-\[var\((--[\w-]+)\)\](?!")', 'border-($1)'
$c = $c -replace 'from-\[var\((--[\w-]+)\)\]', 'from-($1)'
$c = $c -replace 'to-\[var\((--[\w-]+)\)\]', 'to-($1)'
$c = $c -replace 'hover:text-\[var\((--[\w-]+)\)\]', 'hover:text-($1)'
$c = $c -replace 'hover:bg-\[var\((--[\w-]+)\)\]', 'hover:bg-($1)'
$c = $c -replace 'focus:ring-\[var\((--[\w-]+)\)\]', 'focus:ring-($1)'

Set-Content $f -Value $c -NoNewline
Write-Host "Done - replacements applied"

# Remove large files from git history
$files = @(
    "App/release/win-unpacked/HexNode.exe",
    "App/release/HexNode-win32-x64/HexNode.exe"
)

# Use git filter-branch with proper escaping
$filter = "git rm --cached --ignore-unmatch " + ($files -join " ")
git filter-branch --force --index-filter $filter --prune-empty --tag-name-filter cat -- --all

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive


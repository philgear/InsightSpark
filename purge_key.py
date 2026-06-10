import sys
sys.path.insert(0, r'C:\Users\philg\anaconda3\Lib\site-packages')
import git_filter_repo as fr

# Create a fresh clone first
import subprocess, os, shutil

ORIGINAL = r'c:\Users\philg\InsightSpark\InsightSpark'
CLEAN = r'c:\Users\philg\InsightSpark\InsightSpark-clean'

SECRET = b'AIzaSyD7RSETzuXfhULZzJ83-6wIIKaZBz13iak'
REPLACEMENT = b'REDACTED_API_KEY'

# Remove old clean dir if exists
if os.path.exists(CLEAN):
    shutil.rmtree(CLEAN)

# Clone fresh
subprocess.run(['git', 'clone', '--no-local', ORIGINAL, CLEAN], check=True)
os.chdir(CLEAN)

# Count replacements
count = [0]

def blob_callback(blob, callback_data):
    if SECRET in blob.data:
        blob.data = blob.data.replace(SECRET, REPLACEMENT)
        count[0] += 1
        print(f"  REPLACED in blob {blob.original_id}")

args = fr.FilteringOptions.default_options()
args.force = False  # fresh clone, no need for force
args.partial = False

fr_filter = fr.RepoFilter(args, blob_callback=blob_callback)
fr_filter.run()

print(f"\nTotal blobs modified: {count[0]}")

# Verify
result = subprocess.run(
    ['git', 'grep', '-r', SECRET.decode(), '--all'],
    capture_output=True, text=True, cwd=CLEAN
)
if result.stdout.strip():
    print("\n!!! WARNING: Key still found in history:")
    print(result.stdout[:500])
else:
    print("\n✅ Verification passed: API key is completely removed from git history")

# Check for REDACTED
result2 = subprocess.run(
    ['git', 'grep', '-r', REPLACEMENT.decode(), '--all'],
    capture_output=True, text=True, cwd=CLEAN
)
if result2.stdout.strip():
    print(f"\n✅ REDACTED_API_KEY found in {len(result2.stdout.splitlines())} locations (expected)")
else:
    print("\n⚠️ REDACTED_API_KEY not found (unexpected)")

import os
from pathlib import Path

# Define the folders to process
folders = [
    r'd:\power bi\project layers',
    r'd:\power bi\audit_report',
    r'd:\power bi\lastone',
    r'd:\power bi\logs',
]

# Output file path
output_file = r'd:\power bi\CONSOLIDATED_ALL_MARKDOWN.md'

# Collect all .md files
md_files = []

for folder in folders:
    if not os.path.exists(folder):
        print(f"Warning: Folder not found: {folder}")
        continue
    
    # Walk through the folder and subdirectories
    for root, dirs, files in os.walk(folder):
        for file in sorted(files):
            if file.endswith('.md'):
                full_path = os.path.join(root, file)
                # Get relative path for better organization
                rel_path = os.path.relpath(full_path, r'd:\power bi')
                md_files.append((full_path, rel_path, file))

print(f"Found {len(md_files)} .md files")

# Consolidate all files
with open(output_file, 'w', encoding='utf-8') as outfile:
    for idx, (full_path, rel_path, filename) in enumerate(md_files, 1):
        print(f"Processing [{idx}/{len(md_files)}]: {rel_path}")
        
        # Write the heading
        outfile.write(f"\n\n{'='*80}\n")
        outfile.write(f"# File: {rel_path}\n")
        outfile.write(f"{'='*80}\n\n")
        
        # Read and write the content
        try:
            with open(full_path, 'r', encoding='utf-8') as infile:
                content = infile.read()
                outfile.write(content)
        except Exception as e:
            outfile.write(f"[ERROR: Could not read file - {str(e)}]\n")
        
        # Add separator between files
        outfile.write("\n")

print(f"\n✓ Consolidation complete!")
print(f"✓ Output file created: {output_file}")
print(f"✓ Total files processed: {len(md_files)}")

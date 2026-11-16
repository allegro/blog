import os
import re
import subprocess
import sys
from datetime import datetime


def get_current_date():
    return datetime.now().strftime('%Y-%m-%d')

def rename_post_file(post_path, current_date):
    dirname, filename = os.path.split(post_path)
    match = re.match(r'(\d{4}-\d{2}-\d{2})-(.+)\.md', filename)
    if not match:
        print(f"Error: Filename {filename} does not match expected pattern.")
        sys.exit(1)
    old_date, slug = match.groups()
    new_filename = f"{current_date}-{slug}.md"
    new_path = os.path.join(dirname, new_filename)
    if filename != new_filename:
        # Use git mv for renaming
        subprocess.run(['git', 'mv', post_path, new_path], check=True)
        print(f"Renamed post file to {new_filename}")
    else:
        new_path = post_path
    return new_path, old_date, slug


def resolve_old_image_subdir(old_date, slug):
    """Find the image subdirectory by date prefix, using slug only when disambiguation is needed."""
    img_dir = os.path.join('assets', 'img', 'articles')
    if not os.path.isdir(img_dir):
        return None
    prefix = f"{old_date}-"
    candidates = [
        name for name in os.listdir(img_dir)
        if name.startswith(prefix) and os.path.isdir(os.path.join(img_dir, name))
    ]
    if not candidates:
        return None
    if len(candidates) == 1:
        return candidates[0]
    slug_candidate = f"{old_date}-{slug}"
    if slug_candidate in candidates:
        return slug_candidate
    print(
        f"Error: Multiple image directories start with {prefix} but none matches slug {slug}.",
        file=sys.stderr,
    )
    sys.exit(1)


def rename_image_dir(old_img_subdir, slug, current_date):
    if not old_img_subdir:
        print("No image directory found; skipping image rename.")
        return
    img_dir = os.path.join('assets', 'img', 'articles')
    new_img_subdir = f"{current_date}-{slug}"
    old_img_path = os.path.join(img_dir, old_img_subdir)
    new_img_path = os.path.join(img_dir, new_img_subdir)
    if os.path.exists(old_img_path) and old_img_subdir != new_img_subdir:
        subprocess.run(['git', 'mv', old_img_path, new_img_path], check=True)
        print(f"Renamed image directory to {new_img_subdir}")


def update_image_links(post_path, old_img_subdir, slug, current_date):
    if not old_img_subdir:
        print("No image directory identified; skipping image link updates.")
        return
    with open(post_path, 'r', encoding='utf-8') as f:
        content = f.read()
    old_img_dir = f"/assets/img/articles/{old_img_subdir}"
    new_img_dir = f"/assets/img/articles/{current_date}-{slug}"
    updated_content = content.replace(old_img_dir, new_img_dir)
    if updated_content != content:
        with open(post_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        print("Updated image links in the post.")

def main():
    if len(sys.argv) != 2:
        print("Usage: python prepare_post.py <path_to_post>")
        sys.exit(1)
    post_path = sys.argv[1]
    current_date = get_current_date()
    post_path, old_date, slug = rename_post_file(post_path, current_date)
    old_img_subdir = resolve_old_image_subdir(old_date, slug)
    rename_image_dir(old_img_subdir, slug, current_date)
    update_image_links(post_path, old_img_subdir, slug, current_date)

if __name__ == "__main__":
    main()

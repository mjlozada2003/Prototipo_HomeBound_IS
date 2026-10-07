# AGENTS
- Post photos are stored as resized JPEG data URLs in posts.photo_url because public storage buckets are blocked in this workspace.
- Duplicate posts are blocked by a unique index (user, title, kind, category, date); subcategory must match category via a CHECK constraint.

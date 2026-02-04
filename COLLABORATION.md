# Collaboration Guide

## Quick Reference Commands

```bash
# Before starting work (ALWAYS do this first!)
git pull

# After finishing work
git add .
git commit -m "Brief description of what you did"
git push
```

---

## Daily Workflow

### When You Start Working
1. Open Terminal
2. Navigate to project: `cd "/Applications/Secured App"`
3. Get latest changes: `git pull`
4. Open Xcode: `open SecuredApp.xcodeproj`
5. Check TASKS.md for what to work on
6. Mark your task as in-progress: `[~] Task - @YourName`

### When You Finish Working
1. Save all files in Xcode (Cmd+S)
2. In Terminal:
   ```bash
   git add .
   git commit -m "What you did"
   git push
   ```
3. Update TASKS.md (mark task complete, add notes)
4. Push again if you updated TASKS.md

---

## Avoiding Conflicts

### The #1 Rule
**Always `git pull` before you start working.**

### Best Practices
1. **Communicate** - Let each other know what you're working on
2. **Work on different files** - If Kyle is on CartView.swift, partner works on ProfileView.swift
3. **Commit often** - Small, frequent commits are better than one huge commit
4. **Pull before push** - Always `git pull` before `git push`

### If You Get a Conflict
```bash
# This means you both edited the same file
# Option 1: Keep your changes
git checkout --ours filename.swift

# Option 2: Keep their changes
git checkout --theirs filename.swift

# Option 3: Manually edit the file to combine both changes
# Then:
git add filename.swift
git commit -m "Resolved conflict"
git push
```

---

## Project Structure - Who Works on What

### Suggested Division

**Person A (Frontend Focus)**
- Views/ folder (UI screens)
- Assets (images, colors)
- App appearance and layout

**Person B (Backend Focus)**
- ViewModels/ folder (data logic)
- Services/ folder (API calls)
- Models/ folder (data structures)

---

## Useful Git Commands

```bash
# See what files you changed
git status

# See the actual changes
git diff

# Undo changes to a file (before committing)
git checkout filename.swift

# See commit history
git log --oneline

# See who's working on what (recent commits)
git log --oneline -10
```

---

## Communication Tips

1. **Before starting**: "I'm going to work on the cart feature"
2. **If stuck**: Ask for help, don't spend hours stuck
3. **After big changes**: "Just pushed - I refactored the product model"
4. **End of day**: "Done for today, pushed my changes"

---

## Getting Your Partner Set Up

They need to:
1. Install Xcode from App Store
2. Clone the repo:
   ```bash
   git clone https://github.com/AidanFromm/Dave-App.git
   cd Dave-App
   open SecuredApp.xcodeproj
   ```
3. Wait for Xcode to download packages
4. Build and run (Cmd+R)

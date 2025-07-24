#!/bin/bash

# Git Setup Script for Child Growth Monitor
# This script initializes the Git repository and prepares for remote push

set -e  # Exit on any error

echo "🚀 Setting up Git repository for Child Growth Monitor..."

# Navigate to project root
cd "$(dirname "$0")/.."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not a git repository. Please run 'git init' first."
    exit 1
fi

# Check git status
echo "📊 Current Git Status:"
git status --short

# Add any untracked files
echo "📁 Adding untracked files..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "✅ No changes to commit - repository is up to date"
else
    echo "💾 Committing changes..."
    git commit -m "Complete Child Growth Monitor implementation with Azure integration plan

Features added:
- React Native mobile app with 3D scanning capabilities
- Flask backend API with encrypted data storage  
- FastAPI ML service with MediaPipe pose estimation
- Comprehensive Azure integration roadmap
- VS Code development tasks and automated setup
- GDPR-compliant privacy framework
- WHO standards integration for malnutrition detection"
fi

# Check if remote exists
if git remote get-url origin >/dev/null 2>&1; then
    echo "🌐 Remote 'origin' already configured:"
    git remote -v
    
    # Ask user if they want to push
    read -p "📤 Push to existing remote? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Pushing to remote repository..."
        git push -u origin main
        echo "✅ Successfully pushed to remote repository!"
    fi
else
    echo "⚠️  No remote repository configured."
    echo "📝 To add a remote repository:"
    echo "   1. Create a new repository on GitHub/GitLab/Azure DevOps"
    echo "   2. Run: git remote add origin <repository-url>"
    echo "   3. Run: git push -u origin main"
    echo ""
    echo "Example GitHub setup:"
    echo "   git remote add origin https://github.com/yourusername/child-growth-monitor.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
fi

echo ""
echo "🎉 Git setup complete!"
echo "📂 Repository Summary:"
echo "   - Total files: $(git ls-files | wc -l)"
echo "   - Total commits: $(git rev-list --count HEAD)"
echo "   - Current branch: $(git branch --show-current)"
echo "   - Last commit: $(git log -1 --pretty=format:'%h - %s (%cr)')"

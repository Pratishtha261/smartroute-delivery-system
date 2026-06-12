# Guide to Uploading the Project to GitHub

This guide walks you through uploading the **SmartRoute Delivery Management System** to a GitHub repository.

---

## 🛠 Prerequisites
1. You must have a GitHub account. If you don't, sign up at [github.com](https://github.com).
2. Git is installed and working on your machine (already verified).

---

## 🚀 Step-by-Step Instructions

### Step 1: Create a New Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Name your repository (e.g., `smartroute-delivery-system` or `MAJORPROJECT`).
3. Leave it **Public** or **Private** (depending on your choice).
4. **DO NOT** check any of the options: "Add a README file", "Add .gitignore", or "Choose a license". (We already have these files locally).
5. Click **Create repository**.
6. Copy the repository URL (it will look like `https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git`).

---

### Step 2: Initialize Git and Commit Remotely
Open your terminal inside the project root (`c:\Users\user\Desktop\MAJORPROJECT2\MAJORPROJECT`) and run the following commands:

```bash
# 1. Initialize the local directory as a Git repository
git init

# 2. Add all files to staging (this uses the newly created .gitignore to avoid node_modules and secrets)
git add .

# 3. Commit the files with an initial message
git commit -m "initial commit: SmartRoute Delivery Management System complete"

# 4. Rename the default branch to 'main'
git branch -M main
```

---

### Step 3: Link Your Local Repository to GitHub
Replace `YOUR_GITHUB_URL` with the URL you copied in **Step 1**:

```bash
# 5. Add the remote repository URL
git remote add origin YOUR_GITHUB_URL

# 6. Push the code to the main branch
git push -u origin main
```

---

## ⚠️ Important Considerations & Tips

* **Sensitive Data (.env):** We have configured the root `.gitignore` to prevent backend `.env` and frontend `.env` from being pushed. When someone clones the repo, they will need to duplicate `.env.example` as `.env` and fill in their MongoDB URI.
* **Authentication:** When running `git push`, GitHub might prompt you to sign in via your browser or input a **Personal Access Token (PAT)**. If you use password authentication, note that GitHub requires a Token rather than your account password.
* **Re-running push:** If you make changes later, you only need to run:
  ```bash
  git add .
  git commit -m "Your description of changes"
  git push
  ```

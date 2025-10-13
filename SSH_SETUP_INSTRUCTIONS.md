# SSH Key Setup untuk Git Push Otomatis

## ✅ Step 1: SSH Key Generated (DONE)

SSH key pair sudah di-generate di:
- Private key: `~/.ssh/id_ed25519`
- Public key: `~/.ssh/id_ed25519.pub`

---

## 📋 Step 2: Add SSH Public Key ke GitHub

### CARA 1: Via GitHub Web Interface (RECOMMENDED)

1. **Copy public key:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
   
2. **Buka GitHub:**
   - Go to: https://github.com/settings/keys
   - Atau: GitHub → Settings → SSH and GPG keys → New SSH key

3. **Add key:**
   - Title: `AGLIS Production Server`
   - Key: Paste public key dari step 1
   - Click: "Add SSH key"

4. **Confirm:**
   - GitHub mungkin minta password
   - Confirm untuk save

### CARA 2: Via GitHub CLI (jika gh CLI installed)

```bash
gh ssh-key add ~/.ssh/id_ed25519.pub --title "AGLIS Production Server"
```

---

## 🔧 Step 3: Update Git Remote ke SSH

Setelah key ditambahkan ke GitHub, jalankan:

```bash
cd /home/aglis/AGLIS_Tech
git remote set-url origin git@github.com:luftirahadian/AGLIS_Tech.git
```

Verify:
```bash
git remote -v
# Should show: git@github.com:luftirahadian/AGLIS_Tech.git
```

---

## ✅ Step 4: Test SSH Connection

Test koneksi ke GitHub:
```bash
ssh -T git@github.com
# Should return: "Hi luftirahadian! You've successfully authenticated..."
```

---

## 🚀 Step 5: Push ke GitHub

Sekarang push akan otomatis tanpa credentials:
```bash
git push origin main
```

No username/password needed! ✅

---

## 🔐 SSH Key Auto-Load di Startup

Agar SSH key otomatis loaded saat server restart:

```bash
# Add to ~/.bashrc
echo 'eval "$(ssh-agent -s)" > /dev/null 2>&1' >> ~/.bashrc
echo 'ssh-add ~/.ssh/id_ed25519 2>/dev/null' >> ~/.bashrc
```

---

## 📖 Commands Reference

```bash
# View public key
cat ~/.ssh/id_ed25519.pub

# Test GitHub connection  
ssh -T git@github.com

# Check git remote
git remote -v

# Push (no credentials needed)
git push origin main

# Pull
git pull origin main
```

---

## ⚠️ Security Notes

- Private key (`id_ed25519`): NEVER share or commit
- Public key (`id_ed25519.pub`): Safe to share
- Key location: `~/.ssh/`
- Permissions: Automatically set to 600 (secure)

---

## 🔄 Rollback (if needed)

Kembali ke HTTPS:
```bash
git remote set-url origin https://github.com/luftirahadian/AGLIS_Tech.git
```

---

Generated: $(date)

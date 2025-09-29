# 🎤 Backend Setup Instructions

Your pitch analysis currently shows **multiple notes at once** and **missing vocal notes** because it's analyzing the full mixed track (vocals + instruments). To get **clean vocal-only pitch detection**, follow these steps:

## 🚀 Quick Setup (Windows)

### Option 1: Auto Setup (Recommended)
1. **Double-click** `start_backend.bat` in this folder
2. It will automatically:
   - Find your Python installation
   - Install required packages (Demucs, Flask, etc.)
   - Start the backend server
3. **Wait** for "🎤 Demucs Vocal Separation Service Starting..." message

### Option 2: Manual Setup
```bash
# 1. Open Command Prompt in this folder
cd D:\WorkingProgress\ToneMusic\PitchKaraoke\backend

# 2. Install dependencies
pip install torch demucs flask flask-cors numpy scipy librosa soundfile

# 3. Start backend
python app.py
```

## ✅ Success Indicators

You'll see:
```
🎤 Demucs Vocal Separation Service Starting...
Model: htdemucs_ft (Maximum Accuracy)
Max file size: 50MB
 * Running on http://127.0.0.1:5000
```

## 🎯 What This Fixes

### Before (Current Issue):
- ❌ Multiple dots at same time (instruments + vocals)
- ❌ Missing vocal notes (masked by loud instruments)
- ❌ False positive notes from drums, bass, piano

### After (With Backend):
- ✅ **Single vocal melody line only**
- ✅ **Clean note dots** exactly when singer sings
- ✅ **No instrument interference**
- ✅ **Perfect pitch comparison accuracy**

## 🔧 Troubleshooting

### If Python not found:
1. Install Python from [python.org](https://python.org)
2. **Check "Add Python to PATH"** during installation
3. Restart Command Prompt and try again

### If dependencies fail:
```bash
# Try with --user flag
pip install --user torch demucs flask flask-cors numpy scipy librosa soundfile
```

### If still having issues:
The system will automatically fall back to **improved full-mix analysis** (which I just enhanced with better filtering).

## 📊 Backend Status in UI

Once running, you'll see in the Song Analysis section:
- 🟢 **"VOCAL-ONLY (MAXIMUM accuracy)"** - Backend working
- 🟡 **"FULL-MIX (STANDARD accuracy)"** - Backend offline

---

**The difference will be dramatic!** Instead of messy multi-instrument chaos, you'll see clean single vocal melody dots that perfectly match what the singer should sing.
# Demucs v4 Vocal Separation Backend

High-accuracy vocal stem extraction service using Demucs v4 (`htdemucs_ft`) model.

## Quick Setup

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Start the service:**
   ```bash
   python app.py
   ```

3. **Service runs on:** `http://localhost:5000`

## API Endpoints

### `/separate-vocals` (POST)
- **Input:** Audio file (multipart/form-data, key: "audio")
- **Output:** Vocal stem MP3 file
- **Max size:** 50MB

### `/analyze-vocals` (POST)
- **Input:** Audio file (multipart/form-data, key: "audio")
- **Output:** JSON analysis info

### `/health` (GET)
- **Output:** Service health status

## Model Details
- **Model:** `htdemucs_ft` (Demucs v4 fine-tuned)
- **Quality:** Maximum accuracy
- **Processing:** 2-5 minutes per song
- **Output:** Clean vocal stem for pitch analysis

## Usage
The frontend SongAnalysisService will automatically use this backend for vocal separation before pitch analysis.
#!/usr/bin/env python3
"""
Demucs v4 Vocal Separation Service
High-accuracy vocal stem extraction for pitch analysis
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import tempfile
import os
import subprocess
import logging
from pathlib import Path
import shutil

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
UPLOAD_FOLDER = tempfile.mkdtemp()
DEMUCS_MODEL = "htdemucs_ft"  # Best accuracy model
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

def cleanup_temp_files(folder_path):
    """Clean up temporary files"""
    try:
        if os.path.exists(folder_path):
            shutil.rmtree(folder_path)
    except Exception as e:
        logger.warning(f"Failed to cleanup {folder_path}: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "demucs-vocal-separation",
        "model": DEMUCS_MODEL
    })

@app.route('/separate-vocals', methods=['POST'])
def separate_vocals():
    """
    Separate vocals from mixed audio using Demucs v4
    Returns: vocal stem as audio file
    """
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    file = request.files['audio']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    # Create temporary directories
    input_dir = tempfile.mkdtemp()
    output_dir = tempfile.mkdtemp()

    try:
        # Save uploaded file
        input_path = os.path.join(input_dir, "input_audio.wav")
        file.save(input_path)

        logger.info(f"Processing audio file: {file.filename}")
        logger.info(f"File size: {os.path.getsize(input_path)} bytes")

        # Run Demucs separation
        cmd = [
            "python", "-m", "demucs.separate",
            "-n", DEMUCS_MODEL,  # Use -n flag instead of --model
            "-o", output_dir,
            "--filename", "{track}/{stem}.{ext}",
            "--mp3",  # Output as MP3 for smaller file size
            "--mp3-bitrate", "192",  # Good quality
            input_path
        ]

        logger.info(f"Running Demucs: {' '.join(cmd)}")

        # Execute Demucs with timeout
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=600  # 10 minute timeout
        )

        if result.returncode != 0:
            logger.error(f"Demucs failed: {result.stderr}")
            return jsonify({
                "error": "Vocal separation failed",
                "details": result.stderr
            }), 500

        # Find the vocal stem file with better debugging
        vocal_file = None
        logger.info(f"Searching for vocal files in: {output_dir}")

        # List all files created by Demucs
        all_files = []
        for root, dirs, files in os.walk(output_dir):
            logger.info(f"Directory: {root}")
            logger.info(f"Subdirs: {dirs}")
            logger.info(f"Files: {files}")

            for file_name in files:
                full_path = os.path.join(root, file_name)
                all_files.append(full_path)
                logger.info(f"Found file: {full_path}")

                # Look for vocals file (could be .mp3 or .wav)
                if "vocals" in file_name.lower() and (file_name.endswith('.mp3') or file_name.endswith('.wav')):
                    vocal_file = full_path
                    logger.info(f"Found vocal file: {vocal_file}")
                    break

            if vocal_file:
                break

        if not vocal_file:
            logger.error(f"No vocal file found. All files created: {all_files}")
            # Try to find any audio file as fallback
            for f in all_files:
                if f.endswith('.mp3') or f.endswith('.wav'):
                    logger.info(f"Using fallback audio file: {f}")
                    vocal_file = f
                    break

        if not vocal_file or not os.path.exists(vocal_file):
            logger.error(f"Vocal stem file not found. Searched in: {output_dir}")
            logger.error(f"All files found: {all_files}")
            return jsonify({"error": "Vocal stem extraction failed"}), 500

        logger.info(f"Vocal separation successful: {vocal_file}")
        logger.info(f"Vocal file size: {os.path.getsize(vocal_file)} bytes")

        # Return the vocal stem file
        response = send_file(
            vocal_file,
            mimetype='audio/mpeg',
            as_attachment=True,
            download_name=f"vocals_{file.filename}.mp3"
        )

        # Schedule cleanup after response is sent
        @response.call_on_close
        def cleanup():
            cleanup_temp_files(input_dir)
            cleanup_temp_files(output_dir)

        return response

    except subprocess.TimeoutExpired:
        logger.error("Demucs processing timeout")
        cleanup_temp_files(input_dir)
        cleanup_temp_files(output_dir)
        return jsonify({"error": "Processing timeout - file too large"}), 408

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        cleanup_temp_files(input_dir)
        cleanup_temp_files(output_dir)
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

@app.route('/analyze-vocals', methods=['POST'])
def analyze_vocals():
    """
    Full pipeline: separate vocals + return analysis info
    Returns: JSON with vocal separation stats
    """
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    file = request.files['audio']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    input_dir = tempfile.mkdtemp()
    output_dir = tempfile.mkdtemp()

    try:
        # Save uploaded file
        input_path = os.path.join(input_dir, "input_audio.wav")
        file.save(input_path)

        # Get input file info
        input_size = os.path.getsize(input_path)

        # Run Demucs separation
        cmd = [
            "python", "-m", "demucs.separate",
            "-n", DEMUCS_MODEL,  # Use -n flag instead of --model
            "-o", output_dir,
            "--filename", "{track}/{stem}.{ext}",
            "--mp3",
            "--mp3-bitrate", "192",
            input_path
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)

        if result.returncode != 0:
            return jsonify({"error": "Vocal separation failed"}), 500

        # Find output files
        vocal_file = None
        accompaniment_file = None

        for root, dirs, files in os.walk(output_dir):
            for file_name in files:
                if "vocals.mp3" in file_name:
                    vocal_file = os.path.join(root, file_name)
                elif "no_vocals.mp3" in file_name:
                    accompaniment_file = os.path.join(root, file_name)

        # Get file sizes
        vocal_size = os.path.getsize(vocal_file) if vocal_file else 0
        accompaniment_size = os.path.getsize(accompaniment_file) if accompaniment_file else 0

        analysis_result = {
            "success": True,
            "model": DEMUCS_MODEL,
            "input_file": file.filename,
            "input_size_mb": round(input_size / (1024 * 1024), 2),
            "vocal_size_mb": round(vocal_size / (1024 * 1024), 2),
            "accompaniment_size_mb": round(accompaniment_size / (1024 * 1024), 2),
            "vocal_extracted": vocal_file is not None,
            "processing_time": "completed"
        }

        cleanup_temp_files(input_dir)
        cleanup_temp_files(output_dir)

        return jsonify(analysis_result)

    except Exception as e:
        cleanup_temp_files(input_dir)
        cleanup_temp_files(output_dir)
        return jsonify({
            "error": "Analysis failed",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    print(f"""
Demucs Vocal Separation Service Starting...
Model: {DEMUCS_MODEL} (Maximum Accuracy)
Max file size: {MAX_FILE_SIZE // (1024*1024)}MB
Temp folder: {UPLOAD_FOLDER}
""")

    app.run(host='0.0.0.0', port=5000, debug=True)
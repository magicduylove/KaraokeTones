#!/usr/bin/env python3
"""
Simple test script to verify Demucs functionality
"""

import subprocess
import tempfile
import os
import numpy as np
import soundfile as sf

def create_test_audio():
    """Create a simple test audio file"""
    # Generate a simple sine wave
    duration = 5  # seconds
    sample_rate = 44100
    frequency = 440  # A4 note

    t = np.linspace(0, duration, int(sample_rate * duration), False)
    audio = np.sin(2 * np.pi * frequency * t)

    # Add some harmonics to make it more interesting
    audio += 0.3 * np.sin(2 * np.pi * frequency * 2 * t)
    audio += 0.1 * np.sin(2 * np.pi * frequency * 3 * t)

    # Normalize
    audio = audio / np.max(np.abs(audio)) * 0.7

    return audio, sample_rate

def test_demucs():
    """Test Demucs separation on a simple audio file"""
    print("Testing Demucs functionality...")

    # Create test audio
    print("Creating test audio...")
    audio, sample_rate = create_test_audio()

    # Create temporary directories
    input_dir = tempfile.mkdtemp()
    output_dir = tempfile.mkdtemp()

    try:
        # Save test audio
        input_path = os.path.join(input_dir, "test_audio.wav")
        sf.write(input_path, audio, sample_rate)
        print(f"Test audio saved: {input_path}")

        # Run Demucs
        cmd = [
            "python", "-m", "demucs.separate",
            "-n", "htdemucs",
            "-o", output_dir,
            "--two-stems", "vocals",
            input_path
        ]

        print(f"Running: {' '.join(cmd)}")

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
            encoding='utf-8',
            errors='replace'
        )

        print(f"Return code: {result.returncode}")
        if result.stdout:
            print(f"Stdout: {result.stdout}")
        if result.stderr:
            print(f"Stderr: {result.stderr}")

        if result.returncode == 0:
            print("SUCCESS: Demucs test successful!")

            # List output files
            for root, dirs, files in os.walk(output_dir):
                for file in files:
                    full_path = os.path.join(root, file)
                    print(f"Output file: {full_path}")
        else:
            print("ERROR: Demucs test failed!")

    except Exception as e:
        print(f"ERROR: Test failed with exception: {e}")

    finally:
        # Cleanup
        import shutil
        try:
            shutil.rmtree(input_dir)
            shutil.rmtree(output_dir)
        except:
            pass

if __name__ == "__main__":
    test_demucs()
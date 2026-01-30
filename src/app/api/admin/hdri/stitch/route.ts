import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export const maxDuration = 120; // 2 minutes for stitching
export const dynamic = 'force-dynamic';

interface ImageData {
  data: string; // base64 image data
  azimuth: number;
  elevation: number;
}

interface StitchRequest {
  images: ImageData[];
}

interface StitchResult {
  success: boolean;
  panorama?: string;
  error?: string;
}

/**
 * API endpoint for OpenCV panorama stitching
 * Calls Python script with image data
 */
export async function POST(request: NextRequest) {
  try {
    const body: StitchRequest = await request.json();
    
    if (!body.images || body.images.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 images required' },
        { status: 400 }
      );
    }

    console.log(`[HDRI Stitch] Processing ${body.images.length} images...`);

    // Call Python script
    const result = await runPythonStitcher(body);

    if (result.success) {
      console.log('[HDRI Stitch] Success!');
      return NextResponse.json(result);
    } else {
      console.error('[HDRI Stitch] Failed:', result.error);
      return NextResponse.json(result, { status: 500 });
    }

  } catch (error) {
    console.error('[HDRI Stitch] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Run the Python stitching script
 */
async function runPythonStitcher(input: StitchRequest): Promise<StitchResult> {
  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'stitch_panorama.py');
    
    // Try different Python commands
    const pythonCommands = ['python', 'python3', 'py'];
    
    const tryPython = (cmdIndex: number) => {
      if (cmdIndex >= pythonCommands.length) {
        resolve({ success: false, error: 'Python not found. Please install Python and opencv-python.' });
        return;
      }

      const pythonCmd = pythonCommands[cmdIndex];
      console.log(`[HDRI Stitch] Trying ${pythonCmd}...`);

      const pythonProcess = spawn(pythonCmd, [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.log('[Python]', data.toString());
      });

      pythonProcess.on('error', (err) => {
        console.log(`[HDRI Stitch] ${pythonCmd} not available:`, err.message);
        // Try next Python command
        tryPython(cmdIndex + 1);
      });

      pythonProcess.on('close', (code) => {
        if (code === 0 && stdout) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (e) {
            resolve({ success: false, error: `Failed to parse Python output: ${stdout.substring(0, 200)}` });
          }
        } else if (code !== null) {
          resolve({ success: false, error: stderr || `Python exited with code ${code}` });
        }
        // If code is null, the error handler will try next Python
      });

      // Send input data to Python script
      pythonProcess.stdin.write(JSON.stringify(input));
      pythonProcess.stdin.end();
    };

    tryPython(0);
  });
}

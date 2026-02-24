import fs from 'fs/promises';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGunzip, createGzip } from 'zlib';
import type { SolutionZipInfo, UpdateSolutionZipInput } from '../../shared/types/solution.types';

// We'll use the built-in Node.js modules and a simple approach
// For zip operations, we'll shell out to PowerShell on Windows

import { exec } from 'child_process';

export class ZipService {
  private executeCommand(command: string, cwd?: string): Promise<{ success: boolean; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      exec(command, {
        cwd: cwd || process.cwd(),
        env: { ...process.env },
        maxBuffer: 10 * 1024 * 1024,
        windowsHide: true,
        shell: 'powershell.exe',
      }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            stdout: stdout || '',
            stderr: stderr || error.message,
          });
        } else {
          resolve({
            success: true,
            stdout: stdout || '',
            stderr: stderr || '',
          });
        }
      });
    });
  }

  /**
   * Read solution.xml from inside a solution zip file
   */
  async readSolutionXmlFromZip(zipPath: string): Promise<SolutionZipInfo | null> {
    try {
      // Check if zip file exists
      await fs.access(zipPath);

      // Create a temp directory to extract solution.xml
      const tempDir = path.join(path.dirname(zipPath), '.temp_extract_' + Date.now());
      await fs.mkdir(tempDir, { recursive: true });

      try {
        // Use PowerShell to extract just the solution.xml file
        const extractCommand = `
          $zipPath = '${zipPath.replace(/'/g, "''")}';
          $tempDir = '${tempDir.replace(/'/g, "''")}';
          Add-Type -AssemblyName System.IO.Compression.FileSystem;
          $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath);
          $entry = $zip.Entries | Where-Object { $_.Name -eq 'solution.xml' } | Select-Object -First 1;
          if ($entry) {
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, (Join-Path $tempDir 'solution.xml'), $true);
            Write-Output 'SUCCESS';
          } else {
            Write-Output 'NOT_FOUND';
          }
          $zip.Dispose();
        `;

        const result = await this.executeCommand(extractCommand);

        if (!result.success || !result.stdout.includes('SUCCESS')) {
          return null;
        }

        // Read the extracted solution.xml
        const solutionXmlPath = path.join(tempDir, 'solution.xml');
        const content = await fs.readFile(solutionXmlPath, 'utf-8');

        // Parse the XML to extract information
        const versionMatch = content.match(/<Version>([^<]+)<\/Version>/);
        const uniqueNameMatch = content.match(/<UniqueName>([^<]+)<\/UniqueName>/);
        const publisherMatch = content.match(/<Publisher>[\s\S]*?<UniqueName>([^<]+)<\/UniqueName>/);
        const hasGeneratedBy = content.includes('generatedBy=');

        return {
          zipPath,
          solutionXmlPath: 'solution.xml',
          version: versionMatch?.[1] || '1.0',
          uniqueName: uniqueNameMatch?.[1] || '',
          publisherName: publisherMatch?.[1] || '',
          hasGeneratedBy,
          rawXml: content,
        };
      } finally {
        // Clean up temp directory
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch {
          // Ignore cleanup errors
        }
      }
    } catch (error) {
      console.error('Failed to read solution.xml from zip:', error);
      return null;
    }
  }

  /**
   * Update solution.xml inside a solution zip file
   */
  async updateSolutionZip(input: UpdateSolutionZipInput): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if zip file exists
      await fs.access(input.zipPath);

      // Read current solution.xml
      const info = await this.readSolutionXmlFromZip(input.zipPath);
      if (!info) {
        return { success: false, error: 'Could not read solution.xml from zip' };
      }

      let newXml = info.rawXml;

      // Update version if provided
      if (input.newVersion) {
        newXml = newXml.replace(
          /<Version>[^<]+<\/Version>/,
          `<Version>${input.newVersion}</Version>`
        );
      }

      // Remove generatedBy attribute if requested
      if (input.removeGeneratedBy) {
        newXml = newXml.replace(/\s*generatedBy="[^"]*"/g, '');
      }

      // Create a temp directory
      const tempDir = path.join(path.dirname(input.zipPath), '.temp_update_' + Date.now());
      await fs.mkdir(tempDir, { recursive: true });

      try {
        // Write the modified solution.xml to temp
        const tempSolutionXml = path.join(tempDir, 'solution.xml');
        await fs.writeFile(tempSolutionXml, newXml, 'utf-8');

        // Use PowerShell to update the zip file
        const updateCommand = `
          $zipPath = '${input.zipPath.replace(/'/g, "''")}';
          $tempXml = '${tempSolutionXml.replace(/'/g, "''")}';
          Add-Type -AssemblyName System.IO.Compression.FileSystem;
          $zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Update');
          $existingEntry = $zip.Entries | Where-Object { $_.Name -eq 'solution.xml' } | Select-Object -First 1;
          if ($existingEntry) {
            $existingEntry.Delete();
          }
          [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $tempXml, 'solution.xml');
          $zip.Dispose();
          Write-Output 'SUCCESS';
        `;

        const result = await this.executeCommand(updateCommand);

        if (!result.success || !result.stdout.includes('SUCCESS')) {
          return { success: false, error: result.stderr || 'Failed to update zip file' };
        }

        return { success: true };
      } finally {
        // Clean up temp directory
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch {
          // Ignore cleanup errors
        }
      }
    } catch (error) {
      console.error('Failed to update solution zip:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

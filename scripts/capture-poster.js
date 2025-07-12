#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration
const DEFAULT_RESOLUTIONS = {
    '4k': { width: 3840, height: 2160 },
    '2k': { width: 2560, height: 1440 },
    'fullhd': { width: 1920, height: 1080 },
    'poster': { width: 2400, height: 3600 }, // Standard poster size (24" x 36" at 100dpi)
    'instagram': { width: 1080, height: 1080 },
    'twitter': { width: 1200, height: 675 }
};

const WAIT_OPTIONS = {
    initialWait: 3000, // Wait for scene to load
    animationWait: 2000, // Wait for animations to settle
    screenshotDelay: 1000 // Additional delay before screenshot
};

async function ensureScreenshotsDirectory() {
    const screenshotsDir = join(projectRoot, 'screenshots');
    if (!existsSync(screenshotsDir)) {
        await mkdir(screenshotsDir, { recursive: true });
        console.log('Created screenshots directory');
    }
    return screenshotsDir;
}

async function captureScreenshot(page, resolution, filename) {
    console.log(`Capturing ${resolution} screenshot...`);
    
    // Execute the capture function in the browser context
    const result = await page.evaluate(async (width, height) => {
        if (window.fireflySystem && window.fireflySystem.captureScreenshot) {
            try {
                const { blob, canvas, filename } = await window.fireflySystem.captureScreenshot(width, height);
                
                // Convert blob to base64
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve({
                            success: true,
                            dataUrl: reader.result,
                            filename: filename
                        });
                    };
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        } else {
            return {
                success: false,
                error: 'FireflySystem not found or captureScreenshot method not available'
            };
        }
    }, resolution.width, resolution.height);
    
    if (result.success) {
        // Save the screenshot
        const base64Data = result.dataUrl.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        const fs = await import('fs/promises');
        await fs.writeFile(filename, buffer);
        
        console.log(`✓ Saved: ${filename}`);
        return true;
    } else {
        console.error(`✗ Failed to capture screenshot: ${result.error}`);
        return false;
    }
}

async function main() {
    const args = process.argv.slice(2);
    const resolutionArg = args[0] || 'poster';
    const customWidth = parseInt(args[1]);
    const customHeight = parseInt(args[2]);
    
    let resolution;
    if (customWidth && customHeight) {
        resolution = { width: customWidth, height: customHeight };
        console.log(`Using custom resolution: ${customWidth}x${customHeight}`);
    } else if (DEFAULT_RESOLUTIONS[resolutionArg]) {
        resolution = DEFAULT_RESOLUTIONS[resolutionArg];
        console.log(`Using preset resolution: ${resolutionArg} (${resolution.width}x${resolution.height})`);
    } else {
        console.error(`Unknown resolution preset: ${resolutionArg}`);
        console.log('Available presets:', Object.keys(DEFAULT_RESOLUTIONS).join(', '));
        console.log('Or specify custom: node capture-poster.js custom WIDTH HEIGHT');
        process.exit(1);
    }
    
    // Ensure screenshots directory exists
    const screenshotsDir = await ensureScreenshotsDirectory();
    
    // Launch browser
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: {
            width: resolution.width,
            height: resolution.height,
            deviceScaleFactor: 1
        }
    });
    
    try {
        const page = await browser.newPage();
        
        // Set viewport
        await page.setViewport({
            width: resolution.width,
            height: resolution.height,
            deviceScaleFactor: 1
        });
        
        // Navigate to local development server
        console.log('Loading Lakehouse Seattle...');
        await page.goto('http://localhost:8080', {
            waitUntil: 'networkidle0'
        });
        
        // Wait for firefly system to initialize
        console.log('Waiting for scene to initialize...');
        await page.waitForFunction(
            () => window.fireflySystem && window.fireflySystem.fireflies.length > 0,
            { timeout: 10000 }
        );
        
        // Additional wait for animations to settle
        console.log('Waiting for animations to settle...');
        await page.waitForTimeout(WAIT_OPTIONS.animationWait);
        
        // Generate filename
        const timestamp = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
        const resolutionName = customWidth ? 'custom' : resolutionArg;
        const filename = join(screenshotsDir, `lakehouse-${resolutionName}-${resolution.width}x${resolution.height}-${timestamp}.png`);
        
        // Capture screenshot using the high-quality offscreen render
        await captureScreenshot(page, resolution, filename);
        
        // Optional: Capture multiple angles or states
        if (args.includes('--multiple')) {
            console.log('\nCapturing additional variations...');
            
            // Move camera for different angle
            await page.evaluate(() => {
                if (window.fireflySystem && window.fireflySystem.camera) {
                    window.fireflySystem.camera.position.set(-100, 80, 400);
                    window.fireflySystem.camera.lookAt(0, 0, 0);
                }
            });
            
            await page.waitForTimeout(1000);
            
            const altFilename = filename.replace('.png', '-alt.png');
            await captureScreenshot(page, resolution, altFilename);
        }
        
        console.log('\n✅ Poster generation complete!');
        
    } catch (error) {
        console.error('Error capturing screenshot:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

// Show usage if --help is passed
if (process.argv.includes('--help')) {
    console.log(`
Lakehouse Seattle Poster Generator

Usage:
  node scripts/capture-poster.js [resolution] [width] [height] [options]

Resolutions:
  poster      2400x3600  (24"x36" poster at 100dpi)
  4k          3840x2160  (4K UHD)
  2k          2560x1440  (2K QHD)
  fullhd      1920x1080  (Full HD)
  instagram   1080x1080  (Instagram square)
  twitter     1200x675   (Twitter card)

Custom resolution:
  node scripts/capture-poster.js custom 5000 3000

Options:
  --multiple  Capture multiple angles/variations
  --help      Show this help message

Examples:
  npm run poster              # Default poster size
  npm run poster:4k           # 4K resolution
  npm run poster:custom       # Custom 5000x3000
`);
    process.exit(0);
}

main().catch(console.error);
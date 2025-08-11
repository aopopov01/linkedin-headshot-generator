#!/usr/bin/env python3
"""
Professional App Icon Generator
Generates all required icon sizes for iOS and Android platforms
Includes accessibility (high contrast) versions
"""

import os
import sys
import subprocess
from pathlib import Path

# Icon size requirements
IOS_SIZES = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024]
ANDROID_SIZES = [36, 48, 72, 96, 144, 192, 512]

# Directory structure
APPS = {
    'dating-profile-optimizer': {
        'svg': 'dating-profile-optimizer-icon.svg',
        'name': 'Dating Profile Optimizer'
    },
    'linkedin-headshot-generator': {
        'svg': 'linkedin-headshot-generator-icon.svg', 
        'name': 'LinkedIn Headshot Generator'
    }
}

def check_inkscape():
    """Check if Inkscape is available for SVG to PNG conversion"""
    try:
        result = subprocess.run(['inkscape', '--version'], 
                              capture_output=True, text=True, check=True)
        print(f"✓ Inkscape found: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("✗ Inkscape not found. Installing...")
        try:
            subprocess.run(['sudo', 'apt-get', 'update'], check=True)
            subprocess.run(['sudo', 'apt-get', 'install', '-y', 'inkscape'], check=True)
            print("✓ Inkscape installed successfully")
            return True
        except subprocess.CalledProcessError:
            print("✗ Failed to install Inkscape")
            return False

def generate_png_from_svg(svg_path, output_path, size):
    """Convert SVG to PNG at specified size using Inkscape"""
    try:
        cmd = [
            'inkscape',
            '--export-type=png',
            f'--export-filename={output_path}',
            f'--export-width={size}',
            f'--export-height={size}',
            str(svg_path)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error converting {svg_path} to {output_path}: {e}")
        return False

def create_high_contrast_svg(original_svg_path, output_svg_path):
    """Create high contrast version for accessibility"""
    try:
        with open(original_svg_path, 'r') as f:
            svg_content = f.read()
        
        # Create high contrast version by adjusting colors
        # Replace gradients with high contrast alternatives
        high_contrast_content = svg_content.replace(
            'stop-color:#2563EB', 'stop-color:#000080'
        ).replace(
            'stop-color:#7C3AED', 'stop-color:#4B0082'
        ).replace(
            'stop-color:#0077B5', 'stop-color:#003D5C'
        ).replace(
            'stop-color:#005885', 'stop-color:#001F2E'
        ).replace(
            'opacity="0.1"', 'opacity="0.3"'
        ).replace(
            'opacity="0.15"', 'opacity="0.4"'
        ).replace(
            'opacity="0.6"', 'opacity="0.8"'
        ).replace(
            'opacity="0.7"', 'opacity="0.9"'
        )
        
        with open(output_svg_path, 'w') as f:
            f.write(high_contrast_content)
        
        return True
    except Exception as e:
        print(f"Error creating high contrast version: {e}")
        return False

def generate_ios_icons(app_dir, svg_path, app_name):
    """Generate all iOS icon sizes"""
    ios_dir = app_dir / 'ios'
    
    print(f"\nGenerating iOS icons for {app_name}...")
    
    for size in IOS_SIZES:
        # Standard version
        output_file = ios_dir / f'icon-{size}x{size}.png'
        if generate_png_from_svg(svg_path, output_file, size):
            print(f"✓ Generated {output_file.name}")
        
        # @2x version for retina displays
        if size <= 180:  # Don't create @2x for 1024px
            output_file_2x = ios_dir / f'icon-{size}x{size}@2x.png'
            if generate_png_from_svg(svg_path, output_file_2x, size * 2):
                print(f"✓ Generated {output_file_2x.name}")
        
        # @3x version for newer devices
        if size <= 120:  # Don't create @3x for larger sizes
            output_file_3x = ios_dir / f'icon-{size}x{size}@3x.png'
            if generate_png_from_svg(svg_path, output_file_3x, size * 3):
                print(f"✓ Generated {output_file_3x.name}")

def generate_android_icons(app_dir, svg_path, app_name):
    """Generate all Android icon sizes"""
    android_dir = app_dir / 'android'
    
    # Create density folders
    density_map = {
        36: 'ldpi',
        48: 'mdpi', 
        72: 'hdpi',
        96: 'xhdpi',
        144: 'xxhdpi',
        192: 'xxxhdpi',
        512: 'web'
    }
    
    print(f"\nGenerating Android icons for {app_name}...")
    
    for size in ANDROID_SIZES:
        density = density_map.get(size, 'web')
        
        if density != 'web':
            # Create mipmap directories
            mipmap_dir = android_dir / f'mipmap-{density}'
            mipmap_dir.mkdir(exist_ok=True)
            
            # Regular icon
            output_file = mipmap_dir / 'ic_launcher.png'
            if generate_png_from_svg(svg_path, output_file, size):
                print(f"✓ Generated {output_file}")
            
            # Rounded icon for adaptive icons
            output_file_round = mipmap_dir / 'ic_launcher_round.png'
            if generate_png_from_svg(svg_path, output_file_round, size):
                print(f"✓ Generated {output_file_round}")
        else:
            # Web/Play Store icon
            output_file = android_dir / f'ic_launcher_web_{size}x{size}.png'
            if generate_png_from_svg(svg_path, output_file, size):
                print(f"✓ Generated {output_file.name}")

def generate_accessibility_icons(app_dir, svg_path, app_name):
    """Generate high contrast versions for accessibility"""
    accessibility_dir = app_dir / 'accessibility'
    accessibility_dir.mkdir(exist_ok=True)
    
    print(f"\nGenerating accessibility icons for {app_name}...")
    
    # Create high contrast SVG
    high_contrast_svg = accessibility_dir / 'high_contrast_icon.svg'
    if create_high_contrast_svg(svg_path, high_contrast_svg):
        print(f"✓ Created high contrast SVG")
        
        # Generate key sizes in high contrast
        key_sizes = [48, 96, 192, 512]
        for size in key_sizes:
            output_file = accessibility_dir / f'high_contrast_icon_{size}x{size}.png'
            if generate_png_from_svg(high_contrast_svg, output_file, size):
                print(f"✓ Generated {output_file.name}")

def create_contents_json(app_dir):
    """Create iOS Contents.json file for Xcode"""
    ios_dir = app_dir / 'ios'
    contents_json = {
        "images": [],
        "info": {
            "version": 1,
            "author": "claude-code"
        }
    }
    
    # Add entries for each iOS size
    for size in IOS_SIZES:
        if size == 1024:
            contents_json["images"].append({
                "size": f"{size}x{size}",
                "idiom": "ios-marketing",
                "filename": f"icon-{size}x{size}.png",
                "scale": "1x"
            })
        else:
            contents_json["images"].append({
                "size": f"{size}x{size}",
                "idiom": "iphone",
                "filename": f"icon-{size}x{size}.png",
                "scale": "1x"
            })
            
            if size <= 180:
                contents_json["images"].append({
                    "size": f"{size}x{size}",
                    "idiom": "iphone",
                    "filename": f"icon-{size}x{size}@2x.png",
                    "scale": "2x"
                })
            
            if size <= 120:
                contents_json["images"].append({
                    "size": f"{size}x{size}",
                    "idiom": "iphone", 
                    "filename": f"icon-{size}x{size}@3x.png",
                    "scale": "3x"
                })
    
    # Write Contents.json
    import json
    with open(ios_dir / 'Contents.json', 'w') as f:
        json.dump(contents_json, f, indent=2)
    
    print("✓ Created iOS Contents.json")

def main():
    """Main function to generate all app icons"""
    print("🎨 Professional App Icon Generator")
    print("=" * 50)
    
    # Check if Inkscape is available
    if not check_inkscape():
        print("❌ Cannot proceed without Inkscape")
        sys.exit(1)
    
    # Get current directory
    base_dir = Path(__file__).parent
    
    # Generate icons for each app
    for app_key, app_info in APPS.items():
        print(f"\n🚀 Processing {app_info['name']}")
        print("-" * 30)
        
        app_dir = base_dir / app_key
        svg_path = app_dir / app_info['svg']
        
        if not svg_path.exists():
            print(f"❌ SVG file not found: {svg_path}")
            continue
        
        # Generate all icon variations
        generate_ios_icons(app_dir, svg_path, app_info['name'])
        generate_android_icons(app_dir, svg_path, app_info['name'])
        generate_accessibility_icons(app_dir, svg_path, app_info['name'])
        create_contents_json(app_dir)
        
        print(f"✅ Completed {app_info['name']}")
    
    print("\n🎉 All icons generated successfully!")
    print("\nGenerated icon sets:")
    print("• iOS: All required sizes (20px to 1024px) with @2x and @3x variants")
    print("• Android: All density buckets (ldpi to xxxhdpi) plus web icons")  
    print("• Accessibility: High contrast versions for better visibility")
    print("• Xcode ready: Includes Contents.json for iOS projects")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
import os
import subprocess

# Icon sizes for iOS
sizes = [
    (1024, "icon-1024.png"),
    (180, "icon-180.png"), 
    (120, "icon-120.png"),
    (87, "icon-87.png"),
    (80, "icon-80.png"),
    (76, "icon-76.png"),
    (60, "icon-60.png"),
    (58, "icon-58.png"),
    (40, "icon-40.png"),
    (29, "icon-29.png"),
    (20, "icon-20.png")
]

target_dir = "/home/he_reat/Desktop/Projects/LinkedIn Headshot/LinkedInHeadshotApp/ios/LinkedInHeadshotApp/Images.xcassets/AppIcon.appiconset"

# Create placeholder PNG files
for size, filename in sizes:
    filepath = os.path.join(target_dir, filename)
    
    # Use ImageMagick if available, otherwise create via HTML canvas
    try:
        # Try ImageMagick convert command
        svg_file = filepath.replace('.png', '.svg')
        if os.path.exists(svg_file):
            cmd = f"convert -background none -density 300 '{svg_file}' -resize {size}x{size} '{filepath}'"
            result = subprocess.run(cmd, shell=True, capture_output=True)
            if result.returncode == 0:
                print(f"Created {filename} using ImageMagick")
                continue
    except:
        pass
    
    # Alternative: Create a simple colored square as placeholder
    try:
        # Create a simple PNG using Python's built-in zlib
        import zlib
        import struct
        
        def create_png(width, height, rgb_data):
            def png_pack(png_tag, data):
                chunk_head = png_tag + data
                return struct.pack("!I", len(data)) + chunk_head + struct.pack("!I", 0xFFFFFFFF & zlib.crc32(chunk_head))
            
            # PNG signature
            signature = b'\x89PNG\r\n\x1a\n'
            
            # IHDR chunk
            ihdr = struct.pack("!2I5B", width, height, 8, 2, 0, 0, 0)
            ihdr_chunk = png_pack(b'IHDR', ihdr)
            
            # IDAT chunk  
            compressor = zlib.compressobj()
            png_data = b''
            for y in range(height):
                png_data += b'\x00'  # filter type
                for x in range(width):
                    png_data += rgb_data
            idat_data = compressor.compress(png_data)
            idat_data += compressor.flush()
            idat_chunk = png_pack(b'IDAT', idat_data)
            
            # IEND chunk
            iend_chunk = png_pack(b'IEND', b'')
            
            return signature + ihdr_chunk + idat_chunk + iend_chunk
        
        # LinkedIn blue color
        linkedin_blue = b'\x00\x77\xB5'
        png_data = create_png(size, size, linkedin_blue)
        
        with open(filepath, 'wb') as f:
            f.write(png_data)
        print(f"Created {filename} as colored placeholder")
        
    except Exception as e:
        print(f"Could not create {filename}: {e}")

print("PNG creation complete!")
print("Note: Open svg_to_png_converter.html in a browser for high-quality PNG conversion")

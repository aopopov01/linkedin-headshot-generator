#!/usr/bin/env python3
"""
Professional App Store Screenshot Generator
Creates high-quality screenshots for Dating Profile Optimizer and LinkedIn Headshot Generator apps
"""

import os
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from pathlib import Path
import json

# Screenshot dimensions
IOS_SIZE = (1284, 2778)  # iPhone 14 Pro Max
ANDROID_SIZE = (1080, 1920)  # Standard Android

# Color palettes
DATING_COLORS = {
    'primary': '#2563EB',
    'secondary': '#7C3AED', 
    'accent': '#EC4899',
    'success': '#10B981',
    'background': '#F8FAFC',
    'text': '#1F2937',
    'card': '#FFFFFF'
}

LINKEDIN_COLORS = {
    'primary': '#0077B5',
    'secondary': '#004182',
    'accent': '#00A0DC',
    'success': '#57C93F',
    'background': '#F3F6F8',
    'text': '#000000',
    'card': '#FFFFFF'
}

class ScreenshotGenerator:
    def __init__(self, output_dir):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def create_gradient_background(self, size, color1, color2, direction='vertical'):
        """Create a gradient background"""
        width, height = size
        gradient = Image.new('RGB', size)
        draw = ImageDraw.Draw(gradient)
        
        # Convert hex colors to RGB
        c1 = tuple(int(color1[i:i+2], 16) for i in (1, 3, 5))
        c2 = tuple(int(color2[i:i+2], 16) for i in (1, 3, 5))
        
        if direction == 'vertical':
            for y in range(height):
                ratio = y / height
                r = int(c1[0] * (1 - ratio) + c2[0] * ratio)
                g = int(c1[1] * (1 - ratio) + c2[1] * ratio)
                b = int(c1[2] * (1 - ratio) + c2[2] * ratio)
                draw.line([(0, y), (width, y)], fill=(r, g, b))
        
        return gradient
    
    def draw_phone_frame(self, size, content_img):
        """Add iPhone frame around content"""
        width, height = size
        frame = Image.new('RGBA', (width + 100, height + 200), (0, 0, 0, 0))
        
        # Create phone bezel
        draw = ImageDraw.Draw(frame)
        
        # Phone body
        phone_rect = [25, 50, width + 75, height + 150]
        draw.rounded_rectangle(phone_rect, radius=40, fill='#1F2937')
        
        # Screen area
        screen_rect = [50, 100, width + 50, height + 100]
        draw.rounded_rectangle(screen_rect, radius=30, fill='#000000')
        
        # Paste content
        frame.paste(content_img, (50, 100))
        
        return frame
    
    def create_card_ui(self, size, background_color='#FFFFFF', corner_radius=16):
        """Create a modern card UI element"""
        card = Image.new('RGBA', size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(card)
        
        # Convert hex to RGB
        bg_color = tuple(int(background_color[i:i+2], 16) for i in (1, 3, 5))
        
        # Draw rounded rectangle with shadow effect
        shadow_offset = 4
        shadow_color = (*bg_color, 50)  # Semi-transparent shadow
        
        # Shadow
        draw.rounded_rectangle([shadow_offset, shadow_offset, size[0], size[1]], 
                             radius=corner_radius, fill=shadow_color)
        
        # Card
        draw.rounded_rectangle([0, 0, size[0] - shadow_offset, size[1] - shadow_offset], 
                             radius=corner_radius, fill=bg_color)
        
        return card
    
    def get_font(self, size=24, bold=False):
        """Get system font or fallback"""
        try:
            if bold:
                return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size)
            else:
                return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", size)
        except:
            return ImageFont.load_default()

class DatingAppScreenshots(ScreenshotGenerator):
    
    def create_welcome_screen(self, size):
        """Screenshot 1: Welcome/Hero Screen"""
        # Gradient background
        bg = self.create_gradient_background(size, DATING_COLORS['primary'], DATING_COLORS['secondary'])
        draw = ImageDraw.Draw(bg)
        
        width, height = size
        center_x = width // 2
        
        # App icon placeholder (circular)
        icon_size = 120
        icon_y = height // 3
        draw.ellipse([center_x - icon_size//2, icon_y - icon_size//2, 
                     center_x + icon_size//2, icon_y + icon_size//2], 
                    fill=DATING_COLORS['card'], outline=DATING_COLORS['accent'], width=4)
        
        # Heart icon inside
        heart_points = [
            (center_x - 30, icon_y - 10), (center_x - 15, icon_y - 25), (center_x, icon_y - 20),
            (center_x + 15, icon_y - 25), (center_x + 30, icon_y - 10), (center_x, icon_y + 20)
        ]
        draw.polygon(heart_points, fill=DATING_COLORS['accent'])
        
        # Title
        title_font = self.get_font(48, bold=True)
        tagline_font = self.get_font(24)
        button_font = self.get_font(20, bold=True)
        
        # Main tagline
        tagline = "Get 3x More Matches with\nAI-Powered Dating Optimization"
        tagline_bbox = draw.multiline_textbbox((0, 0), tagline, font=tagline_font)
        tagline_height = tagline_bbox[3] - tagline_bbox[1]
        tagline_y = icon_y + icon_size//2 + 60
        
        # Text with shadow effect
        shadow_offset = 2
        draw.multiline_text((center_x + shadow_offset, tagline_y + shadow_offset), tagline, 
                           font=tagline_font, fill=(0, 0, 0, 100), anchor="mt", align="center")
        draw.multiline_text((center_x, tagline_y), tagline, 
                           font=tagline_font, fill='white', anchor="mt", align="center")
        
        # Subtitle
        subtitle = "AI Dating Coach in Your Pocket"
        subtitle_y = tagline_y + tagline_height + 40
        draw.text((center_x, subtitle_y), subtitle, font=self.get_font(18), 
                 fill='white', anchor="mt")
        
        # CTA Button
        button_width = 280
        button_height = 60
        button_y = height - 200
        button_rect = [center_x - button_width//2, button_y, 
                      center_x + button_width//2, button_y + button_height]
        
        # Button with gradient
        button_bg = self.create_gradient_background((button_width, button_height), 
                                                  DATING_COLORS['accent'], '#EC4899')
        bg.paste(button_bg, (center_x - button_width//2, button_y))
        
        draw.rounded_rectangle(button_rect, radius=30, outline='white', width=2)
        draw.text((center_x, button_y + button_height//2), "Get Started", 
                 font=button_font, fill='white', anchor="mm")
        
        return bg
    
    def create_photo_analysis_screen(self, size):
        """Screenshot 2: Photo Analysis Demo"""
        bg = Image.new('RGB', size, DATING_COLORS['background'])
        draw = ImageDraw.Draw(bg)
        
        width, height = size
        
        # Status bar
        draw.rectangle([0, 0, width, 80], fill=DATING_COLORS['card'])
        draw.text((width//2, 40), "Photo Analysis", font=self.get_font(20, bold=True), 
                 fill=DATING_COLORS['text'], anchor="mm")
        
        # Before/After section
        photo_width = (width - 60) // 2
        photo_height = 300
        photo_y = 120
        
        # Before photo placeholder
        before_rect = [20, photo_y, 20 + photo_width, photo_y + photo_height]
        draw.rounded_rectangle(before_rect, radius=16, fill='#E5E7EB')
        draw.text((20 + photo_width//2, photo_y + photo_height//2), "BEFORE", 
                 font=self.get_font(16, bold=True), fill='#6B7280', anchor="mm")
        
        # After photo placeholder
        after_rect = [40 + photo_width, photo_y, width - 20, photo_y + photo_height]
        draw.rounded_rectangle(after_rect, radius=16, fill='#DCFCE7')
        draw.text((width - 20 - photo_width//2, photo_y + photo_height//2), "AFTER", 
                 font=self.get_font(16, bold=True), fill='#16A34A', anchor="mm")
        
        # Score display
        score_y = photo_y + photo_height + 40
        score_card = self.create_card_ui((width - 40, 100))
        bg.paste(score_card, (20, score_y), score_card)
        
        # Score text
        draw.text((width//2, score_y + 30), "AI Analysis Score", 
                 font=self.get_font(16), fill=DATING_COLORS['text'], anchor="mt")
        draw.text((width//2, score_y + 55), "8.5/10", 
                 font=self.get_font(32, bold=True), fill=DATING_COLORS['primary'], anchor="mt")
        
        # Feedback section
        feedback_y = score_y + 140
        feedback_items = [
            ("✓", "Great lighting", DATING_COLORS['success']),
            ("⚠", "Try a genuine smile", DATING_COLORS['accent']),
            ("i", "Consider cleaner background", '#F59E0B')
        ]
        
        for i, (icon, text, color) in enumerate(feedback_items):
            item_y = feedback_y + i * 60
            item_card = self.create_card_ui((width - 40, 50))
            bg.paste(item_card, (20, item_y), item_card)
            
            draw.text((40, item_y + 25), icon, font=self.get_font(20), fill=color, anchor="lm")
            draw.text((80, item_y + 25), text, font=self.get_font(16), 
                     fill=DATING_COLORS['text'], anchor="lm")
        
        return bg
    
    def create_bio_generation_screen(self, size):
        """Screenshot 3: Bio Generation Interface"""
        bg = Image.new('RGB', size, DATING_COLORS['background'])
        draw = ImageDraw.Draw(bg)
        
        width, height = size
        
        # Header
        draw.rectangle([0, 0, width, 80], fill=DATING_COLORS['card'])
        draw.text((width//2, 40), "Bio Generator", font=self.get_font(20, bold=True), 
                 fill=DATING_COLORS['text'], anchor="mm")
        
        # Style selector
        styles = ["Funny", "Professional", "Creative", "Romantic"]
        style_y = 100
        style_width = (width - 80) // 4
        
        for i, style in enumerate(styles):
            x = 20 + i * (style_width + 10)
            style_rect = [x, style_y, x + style_width, style_y + 50]
            
            if i == 0:  # Selected style
                draw.rounded_rectangle(style_rect, radius=25, fill=DATING_COLORS['primary'])
                text_color = 'white'
            else:
                draw.rounded_rectangle(style_rect, radius=25, fill=DATING_COLORS['card'], 
                                     outline='#D1D5DB', width=1)
                text_color = DATING_COLORS['text']
            
            draw.text((x + style_width//2, style_y + 25), style, 
                     font=self.get_font(14), fill=text_color, anchor="mm")
        
        # Generated bio
        bio_y = style_y + 80
        bio_card = self.create_card_ui((width - 40, 250))
        bg.paste(bio_card, (20, bio_y), bio_card)
        
        bio_text = ("Adventure seeker who believes the best stories\n"
                   "start with 'So there I was...' ☕ Coffee enthusiast,\n"
                   "weekend hiker, and someone who still gets\n"
                   "excited about finding the perfect playlist.\n\n"
                   "Let's grab coffee and see if we can make\n"
                   "each other laugh! 😊")
        
        draw.multiline_text((40, bio_y + 20), bio_text, font=self.get_font(16), 
                           fill=DATING_COLORS['text'], spacing=8)
        
        # Action buttons
        button_y = bio_y + 280
        button_width = (width - 60) // 2
        
        # Edit button
        edit_rect = [20, button_y, 20 + button_width, button_y + 50]
        draw.rounded_rectangle(edit_rect, radius=25, fill=DATING_COLORS['card'], 
                             outline=DATING_COLORS['primary'], width=2)
        draw.text((20 + button_width//2, button_y + 25), "Edit", 
                 font=self.get_font(16, bold=True), fill=DATING_COLORS['primary'], anchor="mm")
        
        # Save button
        save_rect = [40 + button_width, button_y, width - 20, button_y + 50]
        draw.rounded_rectangle(save_rect, radius=25, fill=DATING_COLORS['primary'])
        draw.text((width - 20 - button_width//2, button_y + 25), "Save to Profile", 
                 font=self.get_font(16, bold=True), fill='white', anchor="mm")
        
        return bg
    
    def create_success_dashboard(self, size):
        """Screenshot 4: Success Dashboard"""
        bg = Image.new('RGB', size, DATING_COLORS['background'])
        draw = ImageDraw.Draw(bg)
        
        width, height = size
        
        # Header
        draw.rectangle([0, 0, width, 80], fill=DATING_COLORS['card'])
        draw.text((width//2, 40), "Your Success", font=self.get_font(20, bold=True), 
                 fill=DATING_COLORS['text'], anchor="mm")
        
        # Main success metric
        success_y = 100
        success_card = self.create_card_ui((width - 40, 120))
        bg.paste(success_card, (20, success_y), success_card)
        
        draw.text((width//2, success_y + 30), "3x More Matches", 
                 font=self.get_font(28, bold=True), fill=DATING_COLORS['success'], anchor="mt")
        draw.text((width//2, success_y + 65), "This Week ↗️", 
                 font=self.get_font(16), fill='#16A34A', anchor="mt")
        draw.text((width//2, success_y + 90), "Keep up the great work!", 
                 font=self.get_font(14), fill=DATING_COLORS['text'], anchor="mt")
        
        # Stats grid
        stats_y = success_y + 150
        stats = [("127", "Profile Views"), ("45", "Likes"), ("12", "Matches")]
        
        for i, (number, label) in enumerate(stats):
            x = 20 + i * ((width - 40) // 3)
            stat_width = (width - 80) // 3
            
            stat_card = self.create_card_ui((stat_width, 100))
            bg.paste(stat_card, (x, stats_y), stat_card)
            
            draw.text((x + stat_width//2, stats_y + 30), number, 
                     font=self.get_font(24, bold=True), fill=DATING_COLORS['primary'], anchor="mt")
            draw.text((x + stat_width//2, stats_y + 60), label, 
                     font=self.get_font(12), fill=DATING_COLORS['text'], anchor="mt")
        
        # Chart area placeholder
        chart_y = stats_y + 130
        chart_card = self.create_card_ui((width - 40, 200))
        bg.paste(chart_card, (20, chart_y), chart_card)
        
        draw.text((40, chart_y + 20), "Weekly Performance", 
                 font=self.get_font(16, bold=True), fill=DATING_COLORS['text'])
        
        # Simple chart visualization
        chart_points = [(60, chart_y + 160), (140, chart_y + 140), (220, chart_y + 100), 
                       (300, chart_y + 80), (380, chart_y + 60), (460, chart_y + 50)]
        
        for i in range(len(chart_points) - 1):
            draw.line([chart_points[i], chart_points[i + 1]], 
                     fill=DATING_COLORS['success'], width=3)
        
        for point in chart_points:
            draw.ellipse([point[0] - 4, point[1] - 4, point[0] + 4, point[1] + 4], 
                        fill=DATING_COLORS['success'])
        
        return bg
    
    def create_premium_features_screen(self, size):
        """Screenshot 5: Premium Features"""
        bg = Image.new('RGB', size, DATING_COLORS['background'])
        draw = ImageDraw.Draw(bg)
        
        width, height = size
        
        # Header with gradient
        header_gradient = self.create_gradient_background((width, 120), 
                                                        DATING_COLORS['primary'], DATING_COLORS['secondary'])
        bg.paste(header_gradient, (0, 0))
        
        draw.text((width//2, 60), "Go Premium", font=self.get_font(24, bold=True), 
                 fill='white', anchor="mm")
        
        # Feature comparison
        comparison_y = 140
        
        # Headers
        draw.text((width//4, comparison_y), "Free", font=self.get_font(18, bold=True), 
                 fill=DATING_COLORS['text'], anchor="mm")
        draw.text((3 * width//4, comparison_y), "Premium", font=self.get_font(18, bold=True), 
                 fill=DATING_COLORS['primary'], anchor="mm")
        
        # Feature rows
        features = [
            ("Photo Analysis", "5 per week", "Unlimited"),
            ("Bio Templates", "3 basic", "50+ advanced"),
            ("Success Analytics", "Basic", "Detailed"),
            ("Priority Support", "❌", "✅"),
            ("AI Coaching Tips", "❌", "✅")
        ]
        
        for i, (feature, free, premium) in enumerate(features):
            y = comparison_y + 60 + i * 60
            
            # Feature row background
            row_card = self.create_card_ui((width - 40, 50))
            bg.paste(row_card, (20, y), row_card)
            
            draw.text((40, y + 25), feature, font=self.get_font(14), 
                     fill=DATING_COLORS['text'], anchor="lm")
            draw.text((width//4, y + 35), free, font=self.get_font(12), 
                     fill='#6B7280', anchor="mm")
            draw.text((3 * width//4, y + 35), premium, font=self.get_font(12, bold=True), 
                     fill=DATING_COLORS['primary'], anchor="mm")
        
        # Pricing
        price_y = height - 200
        price_card = self.create_card_ui((width - 40, 100))
        bg.paste(price_card, (20, price_y), price_card)
        
        draw.text((width//2, price_y + 25), "$9.99/month", 
                 font=self.get_font(24, bold=True), fill=DATING_COLORS['primary'], anchor="mt")
        draw.text((width//2, price_y + 55), "Cancel anytime", 
                 font=self.get_font(14), fill='#6B7280', anchor="mt")
        
        # CTA Button
        button_y = height - 80
        button_rect = [40, button_y, width - 40, button_y + 50]
        draw.rounded_rectangle(button_rect, radius=25, fill=DATING_COLORS['primary'])
        draw.text((width//2, button_y + 25), "Start Free Trial", 
                 font=self.get_font(18, bold=True), fill='white', anchor="mm")
        
        return bg

class LinkedInAppScreenshots(ScreenshotGenerator):
    
    def create_welcome_screen(self, size):
        """Screenshot 1: Welcome Screen"""
        # LinkedIn-themed background
        bg = self.create_gradient_background(size, LINKEDIN_COLORS['background'], 'white')
        draw = ImageDraw.Draw(bg)
        
        width, height = size
        center_x = width // 2
        
        # LinkedIn-style header
        draw.rectangle([0, 0, width, 100], fill=LINKEDIN_COLORS['primary'])
        
        # App icon placeholder
        icon_size = 100
        icon_y = 180
        draw.rounded_rectangle([center_x - icon_size//2, icon_y - icon_size//2, 
                               center_x + icon_size//2, icon_y + icon_size//2], 
                              radius=20, fill='white', outline=LINKEDIN_COLORS['primary'], width=4)
        
        # Camera icon
        camera_size = 40
        draw.ellipse([center_x - camera_size//2, icon_y - camera_size//2, 
                     center_x + camera_size//2, icon_y + camera_size//2], 
                    fill=LINKEDIN_COLORS['primary'])
        
        # Title
        title_y = icon_y + icon_size//2 + 60
        draw.text((center_x, title_y), "Professional Headshots", 
                 font=self.get_font(32, bold=True), fill=LINKEDIN_COLORS['text'], anchor="mt")
        draw.text((center_x, title_y + 50), "Powered by AI", 
                 font=self.get_font(24), fill=LINKEDIN_COLORS['primary'], anchor="mt")
        
        # Subtitle
        subtitle_y = title_y + 120
        draw.text((center_x, subtitle_y), "Transform Your LinkedIn Presence", 
                 font=self.get_font(18), fill='#666666', anchor="mt")
        
        # Features list
        features_y = subtitle_y + 80
        features = [
            "✓ Professional AI enhancement",
            "✓ Multiple style options", 
            "✓ LinkedIn-optimized output",
            "✓ High-resolution downloads"
        ]
        
        for i, feature in enumerate(features):
            y = features_y + i * 40
            draw.text((center_x, y), feature, font=self.get_font(16), 
                     fill=LINKEDIN_COLORS['text'], anchor="mt")
        
        # CTA Button
        button_y = height - 120
        button_rect = [60, button_y, width - 60, button_y + 60]
        draw.rounded_rectangle(button_rect, radius=30, fill=LINKEDIN_COLORS['primary'])
        draw.text((center_x, button_y + 30), "Get Started", 
                 font=self.get_font(20, bold=True), fill='white', anchor="mm")
        
        return bg
    
    def create_upload_analysis_screen(self, size):
        """Screenshot 2: Photo Upload/Analysis"""
        bg = Image.new('RGB', size, LINKEDIN_COLORS['background'])
        draw = ImageDraw.Draw(bg)
        
        width, height = size
        
        # Header
        draw.rectangle([0, 0, width, 80], fill=LINKEDIN_COLORS['primary'])
        draw.text((width//2, 40), "Upload & Analyze", font=self.get_font(20, bold=True), 
                 fill='white', anchor="mm")
        
        # Upload area
        upload_y = 120
        upload_height = 300
        upload_card = self.create_card_ui((width - 40, upload_height))
        bg.paste(upload_card, (20, upload_y), upload_card)
        
        # Photo placeholder
        photo_size = 200
        photo_x = width//2 - photo_size//2
        photo_y = upload_y + 30
        
        draw.rounded_rectangle([photo_x, photo_y, photo_x + photo_size, photo_y + photo_size], 
                              radius=100, fill='#E5E7EB', outline=LINKEDIN_COLORS['primary'], width=3)
        draw.text((width//2, photo_y + photo_size//2), "👤", 
                 font=self.get_font(60), anchor="mm")
        
        # Analysis status
        status_y = upload_y + upload_height + 40
        status_card = self.create_card_ui((width - 40, 120))
        bg.paste(status_card, (20, status_y), status_card)
        
        draw.text((width//2, status_y + 30), "Analyzing your photo...", 
                 font=self.get_font(18, bold=True), fill=LINKEDIN_COLORS['text'], anchor="mt")
        
        # Progress bar
        progress_y = status_y + 65
        progress_width = width - 120
        progress_bg_rect = [60, progress_y, width - 60, progress_y + 20]
        progress_fill_rect = [60, progress_y, 60 + int(progress_width * 0.75), progress_y + 20]
        
        draw.rounded_rectangle(progress_bg_rect, radius=10, fill='#E5E7EB')
        draw.rounded_rectangle(progress_fill_rect, radius=10, fill=LINKEDIN_COLORS['primary'])
        
        draw.text((width//2, status_y + 95), "Checking lighting, background, and composition... 75%", 
                 font=self.get_font(14), fill='#666666', anchor="mt")
        
        # Analysis points
        points_y = status_y + 140
        analysis_points = [
            "✓ Facial recognition complete",
            "⏳ Optimizing lighting balance", 
            "⏳ Background enhancement",
            "⏳ Professional styling"
        ]
        
        for i, point in enumerate(analysis_points):
            y = points_y + i * 35
            color = LINKEDIN_COLORS['accent'] if point.startswith('✓') else '#F59E0B'
            draw.text((40, y), point, font=self.get_font(14), fill=color)
        
        return bg
    
    def create_style_selection_screen(self, size):
        """Screenshot 3: Style Selection"""
        bg = Image.new('RGB', size, LINKEDIN_COLORS['background'])
        draw = ImageDraw.Draw(bg)
        
        width, height = size
        
        # Header
        draw.rectangle([0, 0, width, 80], fill=LINKEDIN_COLORS['primary'])
        draw.text((width//2, 40), "Choose Your Style", font=self.get_font(20, bold=True), 
                 fill='white', anchor="mm")
        
        # Style options
        styles = [
            ("Corporate", "Traditional business look"),
            ("Creative", "Modern and approachable"),
            ("Executive", "Leadership presence"),
            ("Startup", "Innovative and dynamic")
        ]
        
        style_y = 100
        style_height = 140
        
        for i, (style_name, description) in enumerate(styles):
            y = style_y + i * (style_height + 20)
            
            # Style card
            style_card = self.create_card_ui((width - 40, style_height))
            bg.paste(style_card, (20, y), style_card)
            
            # Style preview (placeholder)
            preview_size = 80
            preview_x = 40
            preview_y = y + 30
            
            colors = [LINKEDIN_COLORS['primary'], LINKEDIN_COLORS['accent'], '#16A34A', '#DC2626']
            draw.rounded_rectangle([preview_x, preview_y, preview_x + preview_size, preview_y + preview_size], 
                                  radius=40, fill=colors[i], outline='white', width=3)
            draw.text((preview_x + preview_size//2, preview_y + preview_size//2), "👔", 
                     font=self.get_font(30), anchor="mm")
            
            # Style info
            text_x = preview_x + preview_size + 30
            draw.text((text_x, preview_y + 20), style_name, 
                     font=self.get_font(20, bold=True), fill=LINKEDIN_COLORS['text'])
            draw.text((text_x, preview_y + 50), description, 
                     font=self.get_font(14), fill='#666666')
            
            # Selection indicator for first style
            if i == 0:
                draw.ellipse([width - 80, y + style_height//2 - 15, 
                             width - 50, y + style_height//2 + 15], 
                            fill=LINKEDIN_COLORS['primary'])
                draw.text((width - 65, y + style_height//2), "✓", 
                         font=self.get_font(16, bold=True), fill='white', anchor="mm")
        
        # Continue button
        button_y = height - 100
        button_rect = [40, button_y, width - 40, button_y + 50]
        draw.rounded_rectangle(button_rect, radius=25, fill=LINKEDIN_COLORS['primary'])
        draw.text((width//2, button_y + 25), "Generate Headshot", 
                 font=self.get_font(18, bold=True), fill='white', anchor="mm")
        
        return bg
    
    def create_results_enhancement_screen(self, size):
        """Screenshot 4: Results & Enhancement"""
        bg = Image.new('RGB', size, LINKEDIN_COLORS['background'])
        draw = ImageDraw.Draw(bg)
        
        width, height = size
        
        # Header with success indicator
        draw.rectangle([0, 0, width, 100], fill='#16A34A')
        draw.text((width//2, 30), "✓ LinkedIn Ready!", font=self.get_font(20, bold=True), 
                 fill='white', anchor="mm")
        draw.text((width//2, 65), "Your professional headshot is ready", 
                 font=self.get_font(14), fill='white', anchor="mm")
        
        # Before/After comparison
        photo_width = (width - 60) // 2
        photo_height = 280
        photo_y = 130
        
        # Before photo
        before_rect = [20, photo_y, 20 + photo_width, photo_y + photo_height]
        draw.rounded_rectangle(before_rect, radius=16, fill='#E5E7EB')
        draw.text((20 + photo_width//2, photo_y + photo_height//2 - 20), "ORIGINAL", 
                 font=self.get_font(14, bold=True), fill='#6B7280', anchor="mm")
        draw.text((20 + photo_width//2, photo_y + photo_height//2 + 20), "👤", 
                 font=self.get_font(60), anchor="mm")
        
        # After photo
        after_rect = [40 + photo_width, photo_y, width - 20, photo_y + photo_height]
        draw.rounded_rectangle(after_rect, radius=16, fill='#DCFCE7')
        draw.text((width - 20 - photo_width//2, photo_y + photo_height//2 - 20), "ENHANCED", 
                 font=self.get_font(14, bold=True), fill='#16A34A', anchor="mm")
        draw.text((width - 20 - photo_width//2, photo_y + photo_height//2 + 20), "👔", 
                 font=self.get_font(60), anchor="mm")
        
        # Quality score
        score_y = photo_y + photo_height + 30
        score_card = self.create_card_ui((width - 40, 80))
        bg.paste(score_card, (20, score_y), score_card)
        
        draw.text((width//2, score_y + 25), "Professional Quality Score", 
                 font=self.get_font(16), fill=LINKEDIN_COLORS['text'], anchor="mt")
        draw.text((width//2, score_y + 50), "9.2/10", 
                 font=self.get_font(28, bold=True), fill='#16A34A', anchor="mt")
        
        # Enhancement details
        details_y = score_y + 110
        enhancements = [
            "✓ Lighting optimized for professional look",
            "✓ Background replaced with clean gradient",
            "✓ Facial features enhanced subtly",
            "✓ Color balance adjusted for LinkedIn"
        ]
        
        for i, enhancement in enumerate(enhancements):
            y = details_y + i * 30
            draw.text((40, y), enhancement, font=self.get_font(14), 
                     fill=LINKEDIN_COLORS['accent'])
        
        # Action buttons
        button_y = height - 140
        button_width = (width - 60) // 2
        
        # Download button
        download_rect = [20, button_y, 20 + button_width, button_y + 50]
        draw.rounded_rectangle(download_rect, radius=25, fill=LINKEDIN_COLORS['primary'])
        draw.text((20 + button_width//2, button_y + 25), "Download HD", 
                 font=self.get_font(16, bold=True), fill='white', anchor="mm")
        
        # Share button
        share_rect = [40 + button_width, button_y, width - 20, button_y + 50]
        draw.rounded_rectangle(share_rect, radius=25, fill=LINKEDIN_COLORS['card'], 
                             outline=LINKEDIN_COLORS['primary'], width=2)
        draw.text((width - 20 - button_width//2, button_y + 25), "Share to LinkedIn", 
                 font=self.get_font(16, bold=True), fill=LINKEDIN_COLORS['primary'], anchor="mm")
        
        return bg
    
    def create_portfolio_screen(self, size):
        """Screenshot 5: Professional Portfolio"""
        bg = Image.new('RGB', size, LINKEDIN_COLORS['background'])
        draw = ImageDraw.Draw(bg)
        
        width, height = size
        
        # Header
        draw.rectangle([0, 0, width, 80], fill=LINKEDIN_COLORS['primary'])
        draw.text((width//2, 40), "Your Professional Library", font=self.get_font(20, bold=True), 
                 fill='white', anchor="mm")
        
        # Gallery grid (2x3)
        gallery_y = 100
        photo_size = (width - 60) // 2
        photo_spacing = 20
        
        styles = ["Corporate", "Creative", "Executive", "Startup", "Casual", "Formal"]
        colors = ['#0077B5', '#16A34A', '#DC2626', '#F59E0B', '#8B5CF6', '#1F2937']
        
        for i, (style, color) in enumerate(zip(styles, colors)):
            row = i // 2
            col = i % 2
            
            x = 20 + col * (photo_size + photo_spacing)
            y = gallery_y + row * (photo_size + 60)
            
            # Photo placeholder
            draw.rounded_rectangle([x, y, x + photo_size, y + photo_size], 
                                  radius=16, fill=color, outline='white', width=3)
            draw.text((x + photo_size//2, y + photo_size//2), "👔", 
                     font=self.get_font(40), anchor="mm")
            
            # Style label
            draw.text((x + photo_size//2, y + photo_size + 15), style, 
                     font=self.get_font(14, bold=True), fill=LINKEDIN_COLORS['text'], anchor="mt")
            draw.text((x + photo_size//2, y + photo_size + 35), f"Style {i+1}", 
                     font=self.get_font(12), fill='#666666', anchor="mt")
        
        # Stats section
        stats_y = gallery_y + 3 * (photo_size + 60) + 40
        stats_card = self.create_card_ui((width - 40, 100))
        bg.paste(stats_card, (20, stats_y), stats_card)
        
        draw.text((width//2, stats_y + 25), "Your Professional Impact", 
                 font=self.get_font(18, bold=True), fill=LINKEDIN_COLORS['text'], anchor="mt")
        
        # Impact stats
        impact_stats = [
            ("Profile Views", "+234%"),
            ("Connection Requests", "+156%"),
            ("Engagement", "+89%")
        ]
        
        for i, (metric, increase) in enumerate(impact_stats):
            x = 40 + i * ((width - 80) // 3)
            draw.text((x + ((width - 80) // 6), stats_y + 50), increase, 
                     font=self.get_font(16, bold=True), fill='#16A34A', anchor="mt")
            draw.text((x + ((width - 80) // 6), stats_y + 75), metric, 
                     font=self.get_font(10), fill='#666666', anchor="mt")
        
        # Action button
        button_y = height - 80
        button_rect = [40, button_y, width - 40, button_y + 50]
        draw.rounded_rectangle(button_rect, radius=25, fill=LINKEDIN_COLORS['primary'])
        draw.text((width//2, button_y + 25), "Create New Style", 
                 font=self.get_font(18, bold=True), fill='white', anchor="mm")
        
        return bg

def generate_all_screenshots():
    """Generate all screenshots for both apps"""
    base_dir = "/home/he_reat/Desktop/Projects/LinkedIn Headshot/app-icons/app-store-screenshots"
    
    # Dating App Screenshots
    dating_gen = DatingAppScreenshots(f"{base_dir}/dating-profile-optimizer")
    
    print("Generating Dating Profile Optimizer screenshots...")
    
    # iOS screenshots
    ios_screens = [
        ("01-welcome-hero.png", dating_gen.create_welcome_screen),
        ("02-photo-analysis.png", dating_gen.create_photo_analysis_screen),
        ("03-bio-generation.png", dating_gen.create_bio_generation_screen),
        ("04-success-dashboard.png", dating_gen.create_success_dashboard),
        ("05-premium-features.png", dating_gen.create_premium_features_screen)
    ]
    
    for filename, method in ios_screens:
        img = method(IOS_SIZE)
        framed_img = dating_gen.draw_phone_frame(IOS_SIZE, img)
        framed_img.save(f"{base_dir}/dating-profile-optimizer/ios/{filename}")
        
        # Also save without frame for store submission
        img.save(f"{base_dir}/dating-profile-optimizer/ios/no-frame-{filename}")
    
    # Android screenshots
    for filename, method in ios_screens:
        img = method(ANDROID_SIZE)
        android_filename = filename.replace('.png', '-android.png')
        img.save(f"{base_dir}/dating-profile-optimizer/android/{android_filename}")
    
    # LinkedIn App Screenshots
    linkedin_gen = LinkedInAppScreenshots(f"{base_dir}/linkedin-headshot-generator")
    
    print("Generating LinkedIn Headshot Generator screenshots...")
    
    # iOS screenshots
    ios_screens = [
        ("01-welcome.png", linkedin_gen.create_welcome_screen),
        ("02-upload-analysis.png", linkedin_gen.create_upload_analysis_screen),
        ("03-style-selection.png", linkedin_gen.create_style_selection_screen),
        ("04-results-enhancement.png", linkedin_gen.create_results_enhancement_screen),
        ("05-portfolio.png", linkedin_gen.create_portfolio_screen)
    ]
    
    for filename, method in ios_screens:
        img = method(IOS_SIZE)
        framed_img = linkedin_gen.draw_phone_frame(IOS_SIZE, img)
        framed_img.save(f"{base_dir}/linkedin-headshot-generator/ios/{filename}")
        
        # Also save without frame for store submission
        img.save(f"{base_dir}/linkedin-headshot-generator/ios/no-frame-{filename}")
    
    # Android screenshots
    for filename, method in ios_screens:
        img = method(ANDROID_SIZE)
        android_filename = filename.replace('.png', '-android.png')
        img.save(f"{base_dir}/linkedin-headshot-generator/android/{android_filename}")
    
    print("✅ All screenshots generated successfully!")
    print(f"📁 Screenshots saved to: {base_dir}")
    
    # Generate summary report
    summary = {
        "dating_profile_optimizer": {
            "ios_screenshots": 10,  # 5 with frames + 5 without
            "android_screenshots": 5,
            "total": 15
        },
        "linkedin_headshot_generator": {
            "ios_screenshots": 10,  # 5 with frames + 5 without  
            "android_screenshots": 5,
            "total": 15
        }
    }
    
    with open(f"{base_dir}/screenshot_summary.json", 'w') as f:
        json.dump(summary, f, indent=2)
    
    return summary

if __name__ == "__main__":
    try:
        summary = generate_all_screenshots()
        print(f"\n📊 Summary:")
        print(f"• Dating Profile Optimizer: {summary['dating_profile_optimizer']['total']} screenshots")
        print(f"• LinkedIn Headshot Generator: {summary['linkedin_headshot_generator']['total']} screenshots")
        print(f"• Total: {summary['dating_profile_optimizer']['total'] + summary['linkedin_headshot_generator']['total']} screenshots")
        
    except Exception as e:
        print(f"❌ Error generating screenshots: {e}")
        import traceback
        traceback.print_exc()
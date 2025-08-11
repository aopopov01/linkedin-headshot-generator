#!/usr/bin/env python3
"""
Simple App Store Screenshot Generator using SVG
Creates professional screenshots without external dependencies
"""

import os
import json
from pathlib import Path

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

def create_gradient_svg(color1, color2, gradient_id="grad1"):
    """Create SVG gradient definition"""
    return f'''
    <defs>
        <linearGradient id="{gradient_id}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:{color1};stop-opacity:1" />
            <stop offset="100%" style="stop-color:{color2};stop-opacity:1" />
        </linearGradient>
    </defs>'''

def create_phone_frame_svg(width, height, content):
    """Create iPhone frame around content"""
    frame_width = width + 100
    frame_height = height + 200
    
    return f'''
    <svg width="{frame_width}" height="{frame_height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Phone body -->
        <rect x="25" y="50" width="{width + 50}" height="{height + 100}" rx="40" ry="40" fill="#1F2937"/>
        
        <!-- Screen area -->
        <rect x="50" y="100" width="{width}" height="{height}" rx="30" ry="30" fill="#000000"/>
        
        <!-- Screen content -->
        <rect x="50" y="100" width="{width}" height="{height}" rx="30" ry="30" fill="url(#screen-content)"/>
        
        {content}
        
        <!-- Home indicator -->
        <rect x="{frame_width//2 - 70}" y="{frame_height - 40}" width="140" height="4" rx="2" ry="2" fill="#666666"/>
    </svg>'''

class DatingAppScreenshots:
    
    def create_welcome_screen_svg(self, width, height):
        """Screenshot 1: Welcome/Hero Screen"""
        center_x = width // 2
        
        return f'''
        <svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
            {create_gradient_svg(DATING_COLORS['primary'], DATING_COLORS['secondary'])}
            
            <!-- Background -->
            <rect width="{width}" height="{height}" fill="url(#grad1)"/>
            
            <!-- App icon -->
            <circle cx="{center_x}" cy="400" r="60" fill="{DATING_COLORS['card']}" stroke="{DATING_COLORS['accent']}" stroke-width="4"/>
            
            <!-- Heart icon -->
            <text x="{center_x}" y="415" text-anchor="middle" font-family="Arial" font-size="40" fill="{DATING_COLORS['accent']}">💕</text>
            
            <!-- Main title -->
            <text x="{center_x}" y="550" text-anchor="middle" font-family="Arial" font-size="32" font-weight="bold" fill="white">
                Get 3x More Matches with
            </text>
            <text x="{center_x}" y="590" text-anchor="middle" font-family="Arial" font-size="32" font-weight="bold" fill="white">
                AI-Powered Dating Optimization
            </text>
            
            <!-- Subtitle -->
            <text x="{center_x}" y="650" text-anchor="middle" font-family="Arial" font-size="20" fill="white">
                AI Dating Coach in Your Pocket
            </text>
            
            <!-- CTA Button -->
            <rect x="{center_x - 140}" y="{height - 200}" width="280" height="60" rx="30" ry="30" fill="{DATING_COLORS['accent']}"/>
            <text x="{center_x}" y="{height - 165}" text-anchor="middle" font-family="Arial" font-size="22" font-weight="bold" fill="white">
                Get Started
            </text>
        </svg>'''
    
    def create_photo_analysis_screen_svg(self, width, height):
        """Screenshot 2: Photo Analysis Demo"""
        return f'''
        <svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
            <!-- Background -->
            <rect width="{width}" height="{height}" fill="{DATING_COLORS['background']}"/>
            
            <!-- Header -->
            <rect x="0" y="0" width="{width}" height="100" fill="{DATING_COLORS['card']}"/>
            <text x="{width//2}" y="60" text-anchor="middle" font-family="Arial" font-size="24" font-weight="bold" fill="{DATING_COLORS['text']}">
                Photo Analysis
            </text>
            
            <!-- Before photo -->
            <rect x="20" y="150" width="{(width-60)//2}" height="300" rx="16" ry="16" fill="#E5E7EB"/>
            <text x="{20 + (width-60)//4}" y="290" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#6B7280">
                BEFORE
            </text>
            <text x="{20 + (width-60)//4}" y="320" text-anchor="middle" font-family="Arial" font-size="60" fill="#9CA3AF">
                📷
            </text>
            
            <!-- After photo -->
            <rect x="{40 + (width-60)//2}" y="150" width="{(width-60)//2}" height="300" rx="16" ry="16" fill="#DCFCE7"/>
            <text x="{width - 20 - (width-60)//4}" y="290" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#16A34A">
                AFTER
            </text>
            <text x="{width - 20 - (width-60)//4}" y="320" text-anchor="middle" font-family="Arial" font-size="60" fill="#16A34A">
                ⭐
            </text>
            
            <!-- Score card -->
            <rect x="20" y="490" width="{width-40}" height="120" rx="16" ry="16" fill="{DATING_COLORS['card']}" stroke="#E5E7EB"/>
            <text x="{width//2}" y="530" text-anchor="middle" font-family="Arial" font-size="18" fill="{DATING_COLORS['text']}">
                AI Analysis Score
            </text>
            <text x="{width//2}" y="570" text-anchor="middle" font-family="Arial" font-size="36" font-weight="bold" fill="{DATING_COLORS['primary']}">
                8.5/10
            </text>
            
            <!-- Feedback items -->
            <rect x="20" y="640" width="{width-40}" height="60" rx="16" ry="16" fill="{DATING_COLORS['card']}" stroke="#E5E7EB"/>
            <text x="40" y="675" font-family="Arial" font-size="18" fill="{DATING_COLORS['success']}">✓</text>
            <text x="80" y="675" font-family="Arial" font-size="16" fill="{DATING_COLORS['text']}">Great lighting</text>
            
            <rect x="20" y="720" width="{width-40}" height="60" rx="16" ry="16" fill="{DATING_COLORS['card']}" stroke="#E5E7EB"/>
            <text x="40" y="755" font-family="Arial" font-size="18" fill="{DATING_COLORS['accent']}">⚠</text>
            <text x="80" y="755" font-family="Arial" font-size="16" fill="{DATING_COLORS['text']}">Try a genuine smile</text>
            
            <rect x="20" y="800" width="{width-40}" height="60" rx="16" ry="16" fill="{DATING_COLORS['card']}" stroke="#E5E7EB"/>
            <text x="40" y="835" font-family="Arial" font-size="18" fill="#F59E0B">ℹ</text>
            <text x="80" y="835" font-family="Arial" font-size="16" fill="{DATING_COLORS['text']}">Consider cleaner background</text>
        </svg>'''
    
    def create_bio_generation_screen_svg(self, width, height):
        """Screenshot 3: Bio Generation Interface"""
        return f'''
        <svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
            <!-- Background -->
            <rect width="{width}" height="{height}" fill="{DATING_COLORS['background']}"/>
            
            <!-- Header -->
            <rect x="0" y="0" width="{width}" height="100" fill="{DATING_COLORS['card']}"/>
            <text x="{width//2}" y="60" text-anchor="middle" font-family="Arial" font-size="24" font-weight="bold" fill="{DATING_COLORS['text']}">
                Bio Generator
            </text>
            
            <!-- Style selector -->
            <rect x="20" y="130" width="{(width-80)//4}" height="50" rx="25" ry="25" fill="{DATING_COLORS['primary']}"/>
            <text x="{20 + (width-80)//8}" y="160" text-anchor="middle" font-family="Arial" font-size="14" fill="white">Funny</text>
            
            <rect x="{20 + (width-80)//4 + 10}" y="130" width="{(width-80)//4}" height="50" rx="25" ry="25" fill="{DATING_COLORS['card']}" stroke="#D1D5DB"/>
            <text x="{20 + 3*(width-80)//8 + 5}" y="160" text-anchor="middle" font-family="Arial" font-size="14" fill="{DATING_COLORS['text']}">Professional</text>
            
            <rect x="{20 + 2*(width-80)//4 + 20}" y="130" width="{(width-80)//4}" height="50" rx="25" ry="25" fill="{DATING_COLORS['card']}" stroke="#D1D5DB"/>
            <text x="{20 + 5*(width-80)//8 + 15}" y="160" text-anchor="middle" font-family="Arial" font-size="14" fill="{DATING_COLORS['text']}">Creative</text>
            
            <rect x="{20 + 3*(width-80)//4 + 30}" y="130" width="{(width-80)//4}" height="50" rx="25" ry="25" fill="{DATING_COLORS['card']}" stroke="#D1D5DB"/>
            <text x="{20 + 7*(width-80)//8 + 25}" y="160" text-anchor="middle" font-family="Arial" font-size="14" fill="{DATING_COLORS['text']}">Romantic</text>
            
            <!-- Generated bio card -->
            <rect x="20" y="220" width="{width-40}" height="280" rx="16" ry="16" fill="{DATING_COLORS['card']}" stroke="#E5E7EB"/>
            <text x="40" y="250" font-family="Arial" font-size="16" fill="{DATING_COLORS['text']}">
                Adventure seeker who believes the best stories
            </text>
            <text x="40" y="275" font-family="Arial" font-size="16" fill="{DATING_COLORS['text']}">
                start with 'So there I was...' ☕ Coffee enthusiast,
            </text>
            <text x="40" y="300" font-family="Arial" font-size="16" fill="{DATING_COLORS['text']}">
                weekend hiker, and someone who still gets
            </text>
            <text x="40" y="325" font-family="Arial" font-size="16" fill="{DATING_COLORS['text']}">
                excited about finding the perfect playlist.
            </text>
            <text x="40" y="365" font-family="Arial" font-size="16" fill="{DATING_COLORS['text']}">
                Let's grab coffee and see if we can make
            </text>
            <text x="40" y="390" font-family="Arial" font-size="16" fill="{DATING_COLORS['text']}">
                each other laugh! 😊
            </text>
            
            <!-- Edit button -->
            <rect x="20" y="530" width="{(width-60)//2}" height="50" rx="25" ry="25" fill="{DATING_COLORS['card']}" stroke="{DATING_COLORS['primary']}" stroke-width="2"/>
            <text x="{20 + (width-60)//4}" y="560" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="{DATING_COLORS['primary']}">
                Edit
            </text>
            
            <!-- Save button -->
            <rect x="{40 + (width-60)//2}" y="530" width="{(width-60)//2}" height="50" rx="25" ry="25" fill="{DATING_COLORS['primary']}"/>
            <text x="{width - 20 - (width-60)//4}" y="560" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="white">
                Save to Profile
            </text>
        </svg>'''
    
    def create_success_dashboard_svg(self, width, height):
        """Screenshot 4: Success Dashboard"""
        return f'''
        <svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
            <!-- Background -->
            <rect width="{width}" height="{height}" fill="{DATING_COLORS['background']}"/>
            
            <!-- Header -->
            <rect x="0" y="0" width="{width}" height="100" fill="{DATING_COLORS['card']}"/>
            <text x="{width//2}" y="60" text-anchor="middle" font-family="Arial" font-size="24" font-weight="bold" fill="{DATING_COLORS['text']}">
                Your Success
            </text>
            
            <!-- Success metric card -->
            <rect x="20" y="130" width="{width-40}" height="140" rx="16" ry="16" fill="{DATING_COLORS['card']}" stroke="#E5E7EB"/>
            <text x="{width//2}" y="170" text-anchor="middle" font-family="Arial" font-size="32" font-weight="bold" fill="{DATING_COLORS['success']}">
                3x More Matches
            </text>
            <text x="{width//2}" y="205" text-anchor="middle" font-family="Arial" font-size="18" fill="#16A34A">
                This Week ↗️
            </text>
            <text x="{width//2}" y="235" text-anchor="middle" font-family="Arial" font-size="16" fill="{DATING_COLORS['text']}">
                Keep up the great work!
            </text>
            
            <!-- Stats grid -->
            <rect x="20" y="300" width="{(width-80)//3}" height="110" rx="16" ry="16" fill="{DATING_COLORS['card']}" stroke="#E5E7EB"/>
            <text x="{20 + (width-80)//6}" y="340" text-anchor="middle" font-family="Arial" font-size="28" font-weight="bold" fill="{DATING_COLORS['primary']}">127</text>
            <text x="{20 + (width-80)//6}" y="365" text-anchor="middle" font-family="Arial" font-size="14" fill="{DATING_COLORS['text']}">Profile Views</text>
            
            <rect x="{40 + (width-80)//3}" y="300" width="{(width-80)//3}" height="110" rx="16" ry="16" fill="{DATING_COLORS['card']}" stroke="#E5E7EB"/>
            <text x="{40 + (width-80)//2}" y="340" text-anchor="middle" font-family="Arial" font-size="28" font-weight="bold" fill="{DATING_COLORS['primary']}">45</text>
            <text x="{40 + (width-80)//2}" y="365" text-anchor="middle" font-family="Arial" font-size="14" fill="{DATING_COLORS['text']}">Likes</text>
            
            <rect x="{60 + 2*(width-80)//3}" y="300" width="{(width-80)//3}" height="110" rx="16" ry="16" fill="{DATING_COLORS['card']}" stroke="#E5E7EB"/>
            <text x="{60 + 5*(width-80)//6}" y="340" text-anchor="middle" font-family="Arial" font-size="28" font-weight="bold" fill="{DATING_COLORS['primary']}">12</text>
            <text x="{60 + 5*(width-80)//6}" y="365" text-anchor="middle" font-family="Arial" font-size="14" fill="{DATING_COLORS['text']}">Matches</text>
            
            <!-- Chart card -->
            <rect x="20" y="450" width="{width-40}" height="220" rx="16" ry="16" fill="{DATING_COLORS['card']}" stroke="#E5E7EB"/>
            <text x="40" y="480" font-family="Arial" font-size="18" font-weight="bold" fill="{DATING_COLORS['text']}">
                Weekly Performance
            </text>
            
            <!-- Simple chart line -->
            <polyline points="60,620 140,600 220,560 300,540 380,520 460,510" 
                     fill="none" stroke="{DATING_COLORS['success']}" stroke-width="3"/>
            
            <!-- Chart points -->
            <circle cx="60" cy="620" r="4" fill="{DATING_COLORS['success']}"/>
            <circle cx="140" cy="600" r="4" fill="{DATING_COLORS['success']}"/>
            <circle cx="220" cy="560" r="4" fill="{DATING_COLORS['success']}"/>
            <circle cx="300" cy="540" r="4" fill="{DATING_COLORS['success']}"/>
            <circle cx="380" cy="520" r="4" fill="{DATING_COLORS['success']}"/>
            <circle cx="460" cy="510" r="4" fill="{DATING_COLORS['success']}"/>
        </svg>'''
    
    def create_premium_features_svg(self, width, height):
        """Screenshot 5: Premium Features"""
        return f'''
        <svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
            {create_gradient_svg(DATING_COLORS['primary'], DATING_COLORS['secondary'], "header-grad")}
            
            <!-- Background -->
            <rect width="{width}" height="{height}" fill="{DATING_COLORS['background']}"/>
            
            <!-- Header with gradient -->
            <rect x="0" y="0" width="{width}" height="140" fill="url(#header-grad)"/>
            <text x="{width//2}" y="80" text-anchor="middle" font-family="Arial" font-size="28" font-weight="bold" fill="white">
                Go Premium
            </text>
            
            <!-- Comparison headers -->
            <text x="{width//4}" y="200" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" fill="{DATING_COLORS['text']}">
                Free
            </text>
            <text x="{3*width//4}" y="200" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" fill="{DATING_COLORS['primary']}">
                Premium
            </text>
            
            <!-- Feature rows -->
            <rect x="20" y="230" width="{width-40}" height="60" rx="16" ry="16" fill="{DATING_COLORS['card']}" stroke="#E5E7EB"/>
            <text x="40" y="265" font-family="Arial" font-size="16" fill="{DATING_COLORS['text']}">Photo Analysis</text>
            <text x="{width//4}" y="280" text-anchor="middle" font-family="Arial" font-size="14" fill="#6B7280">5 per week</text>
            <text x="{3*width//4}" y="280" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="{DATING_COLORS['primary']}">Unlimited</text>
            
            <rect x="20" y="310" width="{width-40}" height="60" rx="16" ry="16" fill="{DATING_COLORS['card']}" stroke="#E5E7EB"/>
            <text x="40" y="345" font-family="Arial" font-size="16" fill="{DATING_COLORS['text']}">Bio Templates</text>
            <text x="{width//4}" y="360" text-anchor="middle" font-family="Arial" font-size="14" fill="#6B7280">3 basic</text>
            <text x="{3*width//4}" y="360" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="{DATING_COLORS['primary']}">50+ advanced</text>
            
            <rect x="20" y="390" width="{width-40}" height="60" rx="16" ry="16" fill="{DATING_COLORS['card']}" stroke="#E5E7EB"/>
            <text x="40" y="425" font-family="Arial" font-size="16" fill="{DATING_COLORS['text']}">Success Analytics</text>
            <text x="{width//4}" y="440" text-anchor="middle" font-family="Arial" font-size="14" fill="#6B7280">Basic</text>
            <text x="{3*width//4}" y="440" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="{DATING_COLORS['primary']}">Detailed</text>
            
            <rect x="20" y="470" width="{width-40}" height="60" rx="16" ry="16" fill="{DATING_COLORS['card']}" stroke="#E5E7EB"/>
            <text x="40" y="505" font-family="Arial" font-size="16" fill="{DATING_COLORS['text']}">Priority Support</text>
            <text x="{width//4}" y="520" text-anchor="middle" font-family="Arial" font-size="16" fill="#6B7280">❌</text>
            <text x="{3*width//4}" y="520" text-anchor="middle" font-family="Arial" font-size="16" fill="{DATING_COLORS['primary']}">✅</text>
            
            <!-- Pricing card -->
            <rect x="20" y="570" width="{width-40}" height="110" rx="16" ry="16" fill="{DATING_COLORS['card']}" stroke="#E5E7EB"/>
            <text x="{width//2}" y="610" text-anchor="middle" font-family="Arial" font-size="28" font-weight="bold" fill="{DATING_COLORS['primary']}">
                $9.99/month
            </text>
            <text x="{width//2}" y="640" text-anchor="middle" font-family="Arial" font-size="16" fill="#6B7280">
                Cancel anytime
            </text>
            
            <!-- CTA Button -->
            <rect x="40" y="720" width="{width-80}" height="60" rx="30" ry="30" fill="{DATING_COLORS['primary']}"/>
            <text x="{width//2}" y="755" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" fill="white">
                Start Free Trial
            </text>
        </svg>'''

class LinkedInAppScreenshots:
    
    def create_welcome_screen_svg(self, width, height):
        """Screenshot 1: Welcome Screen"""
        center_x = width // 2
        
        return f'''
        <svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
            {create_gradient_svg(LINKEDIN_COLORS['background'], 'white')}
            
            <!-- Background -->
            <rect width="{width}" height="{height}" fill="url(#grad1)"/>
            
            <!-- LinkedIn header -->
            <rect x="0" y="0" width="{width}" height="120" fill="{LINKEDIN_COLORS['primary']}"/>
            
            <!-- App icon -->
            <rect x="{center_x - 50}" y="200" width="100" height="100" rx="20" ry="20" fill="white" stroke="{LINKEDIN_COLORS['primary']}" stroke-width="4"/>
            <text x="{center_x}" y="260" text-anchor="middle" font-family="Arial" font-size="40" fill="{LINKEDIN_COLORS['primary']}">📷</text>
            
            <!-- Title -->
            <text x="{center_x}" y="360" text-anchor="middle" font-family="Arial" font-size="36" font-weight="bold" fill="{LINKEDIN_COLORS['text']}">
                Professional Headshots
            </text>
            <text x="{center_x}" y="400" text-anchor="middle" font-family="Arial" font-size="28" fill="{LINKEDIN_COLORS['primary']}">
                Powered by AI
            </text>
            
            <!-- Subtitle -->
            <text x="{center_x}" y="480" text-anchor="middle" font-family="Arial" font-size="20" fill="#666666">
                Transform Your LinkedIn Presence
            </text>
            
            <!-- Features list -->
            <text x="{center_x}" y="550" text-anchor="middle" font-family="Arial" font-size="18" fill="{LINKEDIN_COLORS['text']}">
                ✓ Professional AI enhancement
            </text>
            <text x="{center_x}" y="590" text-anchor="middle" font-family="Arial" font-size="18" fill="{LINKEDIN_COLORS['text']}">
                ✓ Multiple style options
            </text>
            <text x="{center_x}" y="630" text-anchor="middle" font-family="Arial" font-size="18" fill="{LINKEDIN_COLORS['text']}">
                ✓ LinkedIn-optimized output
            </text>
            <text x="{center_x}" y="670" text-anchor="middle" font-family="Arial" font-size="18" fill="{LINKEDIN_COLORS['text']}">
                ✓ High-resolution downloads
            </text>
            
            <!-- CTA Button -->
            <rect x="60" y="750" width="{width-120}" height="70" rx="35" ry="35" fill="{LINKEDIN_COLORS['primary']}"/>
            <text x="{center_x}" y="795" text-anchor="middle" font-family="Arial" font-size="24" font-weight="bold" fill="white">
                Get Started
            </text>
        </svg>'''
    
    def create_upload_analysis_screen_svg(self, width, height):
        """Screenshot 2: Photo Upload/Analysis"""
        center_x = width // 2
        
        return f'''
        <svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
            <!-- Background -->
            <rect width="{width}" height="{height}" fill="{LINKEDIN_COLORS['background']}"/>
            
            <!-- Header -->
            <rect x="0" y="0" width="{width}" height="100" fill="{LINKEDIN_COLORS['primary']}"/>
            <text x="{center_x}" y="60" text-anchor="middle" font-family="Arial" font-size="24" font-weight="bold" fill="white">
                Upload & Analyze
            </text>
            
            <!-- Upload area -->
            <rect x="20" y="140" width="{width-40}" height="340" rx="16" ry="16" fill="{LINKEDIN_COLORS['card']}" stroke="#E5E7EB"/>
            
            <!-- Photo placeholder -->
            <circle cx="{center_x}" cy="280" r="80" fill="#E5E7EB" stroke="{LINKEDIN_COLORS['primary']}" stroke-width="3"/>
            <text x="{center_x}" y="295" text-anchor="middle" font-family="Arial" font-size="60" fill="#9CA3AF">👤</text>
            
            <!-- Analysis status -->
            <rect x="20" y="520" width="{width-40}" height="140" rx="16" ry="16" fill="{LINKEDIN_COLORS['card']}" stroke="#E5E7EB"/>
            <text x="{center_x}" y="560" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" fill="{LINKEDIN_COLORS['text']}">
                Analyzing your photo...
            </text>
            
            <!-- Progress bar -->
            <rect x="60" y="590" width="{width-120}" height="20" rx="10" ry="10" fill="#E5E7EB"/>
            <rect x="60" y="590" width="{int((width-120) * 0.75)}" height="20" rx="10" ry="10" fill="{LINKEDIN_COLORS['primary']}"/>
            
            <text x="{center_x}" y="640" text-anchor="middle" font-family="Arial" font-size="16" fill="#666666">
                Checking lighting, background, and composition... 75%
            </text>
            
            <!-- Analysis points -->
            <text x="40" y="720" font-family="Arial" font-size="16" fill="{LINKEDIN_COLORS['accent']}">✓ Facial recognition complete</text>
            <text x="40" y="755" font-family="Arial" font-size="16" fill="#F59E0B">⏳ Optimizing lighting balance</text>
            <text x="40" y="790" font-family="Arial" font-size="16" fill="#F59E0B">⏳ Background enhancement</text>
            <text x="40" y="825" font-family="Arial" font-size="16" fill="#F59E0B">⏳ Professional styling</text>
        </svg>'''
    
    def create_style_selection_screen_svg(self, width, height):
        """Screenshot 3: Style Selection"""
        return f'''
        <svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
            <!-- Background -->
            <rect width="{width}" height="{height}" fill="{LINKEDIN_COLORS['background']}"/>
            
            <!-- Header -->
            <rect x="0" y="0" width="{width}" height="100" fill="{LINKEDIN_COLORS['primary']}"/>
            <text x="{width//2}" y="60" text-anchor="middle" font-family="Arial" font-size="24" font-weight="bold" fill="white">
                Choose Your Style
            </text>
            
            <!-- Corporate style -->
            <rect x="20" y="120" width="{width-40}" height="160" rx="16" ry="16" fill="{LINKEDIN_COLORS['card']}" stroke="#E5E7EB"/>
            <circle cx="80" cy="170" r="40" fill="{LINKEDIN_COLORS['primary']}" stroke="white" stroke-width="3"/>
            <text x="80" y="185" text-anchor="middle" font-family="Arial" font-size="30" fill="white">👔</text>
            <text x="150" y="175" font-family="Arial" font-size="22" font-weight="bold" fill="{LINKEDIN_COLORS['text']}">Corporate</text>
            <text x="150" y="200" font-family="Arial" font-size="16" fill="#666666">Traditional business look</text>
            <circle cx="{width-65}" cy="200" r="15" fill="{LINKEDIN_COLORS['primary']}"/>
            <text x="{width-65}" y="207" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="white">✓</text>
            
            <!-- Creative style -->
            <rect x="20" y="300" width="{width-40}" height="160" rx="16" ry="16" fill="{LINKEDIN_COLORS['card']}" stroke="#E5E7EB"/>
            <circle cx="80" cy="350" r="40" fill="{LINKEDIN_COLORS['accent']}" stroke="white" stroke-width="3"/>
            <text x="80" y="365" text-anchor="middle" font-family="Arial" font-size="30" fill="white">🎨</text>
            <text x="150" y="355" font-family="Arial" font-size="22" font-weight="bold" fill="{LINKEDIN_COLORS['text']}">Creative</text>
            <text x="150" y="380" font-family="Arial" font-size="16" fill="#666666">Modern and approachable</text>
            
            <!-- Executive style -->
            <rect x="20" y="480" width="{width-40}" height="160" rx="16" ry="16" fill="{LINKEDIN_COLORS['card']}" stroke="#E5E7EB"/>
            <circle cx="80" cy="530" r="40" fill="#16A34A" stroke="white" stroke-width="3"/>
            <text x="80" y="545" text-anchor="middle" font-family="Arial" font-size="30" fill="white">💼</text>
            <text x="150" y="535" font-family="Arial" font-size="22" font-weight="bold" fill="{LINKEDIN_COLORS['text']}">Executive</text>
            <text x="150" y="560" font-family="Arial" font-size="16" fill="#666666">Leadership presence</text>
            
            <!-- Startup style -->
            <rect x="20" y="660" width="{width-40}" height="160" rx="16" ry="16" fill="{LINKEDIN_COLORS['card']}" stroke="#E5E7EB"/>
            <circle cx="80" cy="710" r="40" fill="#DC2626" stroke="white" stroke-width="3"/>
            <text x="80" y="725" text-anchor="middle" font-family="Arial" font-size="30" fill="white">🚀</text>
            <text x="150" y="715" font-family="Arial" font-size="22" font-weight="bold" fill="{LINKEDIN_COLORS['text']}">Startup</text>
            <text x="150" y="740" font-family="Arial" font-size="16" fill="#666666">Innovative and dynamic</text>
            
            <!-- Continue button -->
            <rect x="40" y="850" width="{width-80}" height="60" rx="30" ry="30" fill="{LINKEDIN_COLORS['primary']}"/>
            <text x="{width//2}" y="885" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" fill="white">
                Generate Headshot
            </text>
        </svg>'''
    
    def create_results_enhancement_screen_svg(self, width, height):
        """Screenshot 4: Results & Enhancement"""
        return f'''
        <svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
            <!-- Background -->
            <rect width="{width}" height="{height}" fill="{LINKEDIN_COLORS['background']}"/>
            
            <!-- Success header -->
            <rect x="0" y="0" width="{width}" height="120" fill="#16A34A"/>
            <text x="{width//2}" y="50" text-anchor="middle" font-family="Arial" font-size="24" font-weight="bold" fill="white">
                ✓ LinkedIn Ready!
            </text>
            <text x="{width//2}" y="80" text-anchor="middle" font-family="Arial" font-size="16" fill="white">
                Your professional headshot is ready
            </text>
            
            <!-- Before photo -->
            <rect x="20" y="150" width="{(width-60)//2}" height="300" rx="16" ry="16" fill="#E5E7EB"/>
            <text x="{20 + (width-60)//4}" y="280" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#6B7280">
                ORIGINAL
            </text>
            <text x="{20 + (width-60)//4}" y="320" text-anchor="middle" font-family="Arial" font-size="60" fill="#9CA3AF">👤</text>
            
            <!-- After photo -->
            <rect x="{40 + (width-60)//2}" y="150" width="{(width-60)//2}" height="300" rx="16" ry="16" fill="#DCFCE7"/>
            <text x="{width - 20 - (width-60)//4}" y="280" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#16A34A">
                ENHANCED
            </text>
            <text x="{width - 20 - (width-60)//4}" y="320" text-anchor="middle" font-family="Arial" font-size="60" fill="#16A34A">👔</text>
            
            <!-- Quality score -->
            <rect x="20" y="480" width="{width-40}" height="100" rx="16" ry="16" fill="{LINKEDIN_COLORS['card']}" stroke="#E5E7EB"/>
            <text x="{width//2}" y="510" text-anchor="middle" font-family="Arial" font-size="18" fill="{LINKEDIN_COLORS['text']}">
                Professional Quality Score
            </text>
            <text x="{width//2}" y="545" text-anchor="middle" font-family="Arial" font-size="32" font-weight="bold" fill="#16A34A">
                9.2/10
            </text>
            
            <!-- Enhancement details -->
            <text x="40" y="620" font-family="Arial" font-size="16" fill="{LINKEDIN_COLORS['accent']}">✓ Lighting optimized for professional look</text>
            <text x="40" y="650" font-family="Arial" font-size="16" fill="{LINKEDIN_COLORS['accent']}">✓ Background replaced with clean gradient</text>
            <text x="40" y="680" font-family="Arial" font-size="16" fill="{LINKEDIN_COLORS['accent']}">✓ Facial features enhanced subtly</text>
            <text x="40" y="710" font-family="Arial" font-size="16" fill="{LINKEDIN_COLORS['accent']}">✓ Color balance adjusted for LinkedIn</text>
            
            <!-- Download button -->
            <rect x="20" y="750" width="{(width-60)//2}" height="60" rx="30" ry="30" fill="{LINKEDIN_COLORS['primary']}"/>
            <text x="{20 + (width-60)//4}" y="785" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold" fill="white">
                Download HD
            </text>
            
            <!-- Share button -->
            <rect x="{40 + (width-60)//2}" y="750" width="{(width-60)//2}" height="60" rx="30" ry="30" fill="{LINKEDIN_COLORS['card']}" stroke="{LINKEDIN_COLORS['primary']}" stroke-width="2"/>
            <text x="{width - 20 - (width-60)//4}" y="785" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold" fill="{LINKEDIN_COLORS['primary']}">
                Share to LinkedIn
            </text>
        </svg>'''
    
    def create_portfolio_screen_svg(self, width, height):
        """Screenshot 5: Professional Portfolio"""
        return f'''
        <svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
            <!-- Background -->
            <rect width="{width}" height="{height}" fill="{LINKEDIN_COLORS['background']}"/>
            
            <!-- Header -->
            <rect x="0" y="0" width="{width}" height="100" fill="{LINKEDIN_COLORS['primary']}"/>
            <text x="{width//2}" y="60" text-anchor="middle" font-family="Arial" font-size="24" font-weight="bold" fill="white">
                Your Professional Library
            </text>
            
            <!-- Gallery grid (2x3) -->
            <!-- Row 1 -->
            <rect x="20" y="120" width="{(width-60)//2}" height="{(width-60)//2}" rx="16" ry="16" fill="#0077B5" stroke="white" stroke-width="3"/>
            <text x="{20 + (width-60)//4}" y="{120 + (width-60)//4}" text-anchor="middle" font-family="Arial" font-size="40" fill="white">👔</text>
            <text x="{20 + (width-60)//4}" y="{120 + (width-60)//2 + 30}" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="{LINKEDIN_COLORS['text']}">Corporate</text>
            <text x="{20 + (width-60)//4}" y="{120 + (width-60)//2 + 50}" text-anchor="middle" font-family="Arial" font-size="14" fill="#666666">Style 1</text>
            
            <rect x="{40 + (width-60)//2}" y="120" width="{(width-60)//2}" height="{(width-60)//2}" rx="16" ry="16" fill="#16A34A" stroke="white" stroke-width="3"/>
            <text x="{width - 20 - (width-60)//4}" y="{120 + (width-60)//4}" text-anchor="middle" font-family="Arial" font-size="40" fill="white">🎨</text>
            <text x="{width - 20 - (width-60)//4}" y="{120 + (width-60)//2 + 30}" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="{LINKEDIN_COLORS['text']}">Creative</text>
            <text x="{width - 20 - (width-60)//4}" y="{120 + (width-60)//2 + 50}" text-anchor="middle" font-family="Arial" font-size="14" fill="#666666">Style 2</text>
            
            <!-- Row 2 -->
            <rect x="20" y="{140 + (width-60)//2 + 60}" width="{(width-60)//2}" height="{(width-60)//2}" rx="16" ry="16" fill="#DC2626" stroke="white" stroke-width="3"/>
            <text x="{20 + (width-60)//4}" y="{140 + (width-60)//2 + 60 + (width-60)//4}" text-anchor="middle" font-family="Arial" font-size="40" fill="white">💼</text>
            <text x="{20 + (width-60)//4}" y="{140 + (width-60) + 90}" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="{LINKEDIN_COLORS['text']}">Executive</text>
            <text x="{20 + (width-60)//4}" y="{140 + (width-60) + 110}" text-anchor="middle" font-family="Arial" font-size="14" fill="#666666">Style 3</text>
            
            <rect x="{40 + (width-60)//2}" y="{140 + (width-60)//2 + 60}" width="{(width-60)//2}" height="{(width-60)//2}" rx="16" ry="16" fill="#F59E0B" stroke="white" stroke-width="3"/>
            <text x="{width - 20 - (width-60)//4}" y="{140 + (width-60)//2 + 60 + (width-60)//4}" text-anchor="middle" font-family="Arial" font-size="40" fill="white">🚀</text>
            <text x="{width - 20 - (width-60)//4}" y="{140 + (width-60) + 90}" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="{LINKEDIN_COLORS['text']}">Startup</text>
            <text x="{width - 20 - (width-60)//4}" y="{140 + (width-60) + 110}" text-anchor="middle" font-family="Arial" font-size="14" fill="#666666">Style 4</text>
            
            <!-- Row 3 -->
            <rect x="20" y="{160 + (width-60) + 120}" width="{(width-60)//2}" height="{(width-60)//2}" rx="16" ry="16" fill="#8B5CF6" stroke="white" stroke-width="3"/>
            <text x="{20 + (width-60)//4}" y="{160 + (width-60) + 120 + (width-60)//4}" text-anchor="middle" font-family="Arial" font-size="40" fill="white">👕</text>
            <text x="{20 + (width-60)//4}" y="{160 + (width-60)*3//2 + 150}" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="{LINKEDIN_COLORS['text']}">Casual</text>
            <text x="{20 + (width-60)//4}" y="{160 + (width-60)*3//2 + 170}" text-anchor="middle" font-family="Arial" font-size="14" fill="#666666">Style 5</text>
            
            <rect x="{40 + (width-60)//2}" y="{160 + (width-60) + 120}" width="{(width-60)//2}" height="{(width-60)//2}" rx="16" ry="16" fill="#1F2937" stroke="white" stroke-width="3"/>
            <text x="{width - 20 - (width-60)//4}" y="{160 + (width-60) + 120 + (width-60)//4}" text-anchor="middle" font-family="Arial" font-size="40" fill="white">🤵</text>
            <text x="{width - 20 - (width-60)//4}" y="{160 + (width-60)*3//2 + 150}" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="{LINKEDIN_COLORS['text']}">Formal</text>
            <text x="{width - 20 - (width-60)//4}" y="{160 + (width-60)*3//2 + 170}" text-anchor="middle" font-family="Arial" font-size="14" fill="#666666">Style 6</text>
            
            <!-- Stats section -->
            <rect x="20" y="{200 + (width-60)*3//2 + 180}" width="{width-40}" height="120" rx="16" ry="16" fill="{LINKEDIN_COLORS['card']}" stroke="#E5E7EB"/>
            <text x="{width//2}" y="{230 + (width-60)*3//2 + 180}" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" fill="{LINKEDIN_COLORS['text']}">
                Your Professional Impact
            </text>
            
            <!-- Impact stats -->
            <text x="{40 + (width-80)//6}" y="{260 + (width-60)*3//2 + 180}" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold" fill="#16A34A">+234%</text>
            <text x="{40 + (width-80)//6}" y="{285 + (width-60)*3//2 + 180}" text-anchor="middle" font-family="Arial" font-size="12" fill="#666666">Profile Views</text>
            
            <text x="{width//2}" y="{260 + (width-60)*3//2 + 180}" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold" fill="#16A34A">+156%</text>
            <text x="{width//2}" y="{285 + (width-60)*3//2 + 180}" text-anchor="middle" font-family="Arial" font-size="12" fill="#666666">Connection Requests</text>
            
            <text x="{width - 40 - (width-80)//6}" y="{260 + (width-60)*3//2 + 180}" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold" fill="#16A34A">+89%</text>
            <text x="{width - 40 - (width-80)//6}" y="{285 + (width-60)*3//2 + 180}" text-anchor="middle" font-family="Arial" font-size="12" fill="#666666">Engagement</text>
            
            <!-- Create New Style button -->
            <rect x="40" y="{height - 100}" width="{width-80}" height="60" rx="30" ry="30" fill="{LINKEDIN_COLORS['primary']}"/>
            <text x="{width//2}" y="{height - 65}" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" fill="white">
                Create New Style
            </text>
        </svg>'''

def generate_all_screenshots():
    """Generate all screenshots for both apps"""
    base_dir = "/home/he_reat/Desktop/Projects/LinkedIn Headshot/app-icons/app-store-screenshots"
    
    # Dating App Screenshots
    dating_gen = DatingAppScreenshots()
    
    print("Generating Dating Profile Optimizer screenshots...")
    
    # iOS screenshots
    ios_screens = [
        ("01-welcome-hero.svg", dating_gen.create_welcome_screen_svg),
        ("02-photo-analysis.svg", dating_gen.create_photo_analysis_screen_svg),
        ("03-bio-generation.svg", dating_gen.create_bio_generation_screen_svg),
        ("04-success-dashboard.svg", dating_gen.create_success_dashboard_svg),
        ("05-premium-features.svg", dating_gen.create_premium_features_svg)
    ]
    
    for filename, method in ios_screens:
        svg_content = method(IOS_SIZE[0], IOS_SIZE[1])
        
        # Save iOS version
        with open(f"{base_dir}/dating-profile-optimizer/ios/{filename}", 'w') as f:
            f.write(svg_content)
        
        # Save framed version
        framed_content = create_phone_frame_svg(IOS_SIZE[0], IOS_SIZE[1], svg_content)
        framed_filename = filename.replace('.svg', '-framed.svg')
        with open(f"{base_dir}/dating-profile-optimizer/ios/{framed_filename}", 'w') as f:
            f.write(framed_content)
        
        # Save Android version
        android_svg = method(ANDROID_SIZE[0], ANDROID_SIZE[1])
        android_filename = filename.replace('.svg', '-android.svg')
        with open(f"{base_dir}/dating-profile-optimizer/android/{android_filename}", 'w') as f:
            f.write(android_svg)
    
    # LinkedIn App Screenshots
    linkedin_gen = LinkedInAppScreenshots()
    
    print("Generating LinkedIn Headshot Generator screenshots...")
    
    # iOS screenshots
    ios_screens = [
        ("01-welcome.svg", linkedin_gen.create_welcome_screen_svg),
        ("02-upload-analysis.svg", linkedin_gen.create_upload_analysis_screen_svg),
        ("03-style-selection.svg", linkedin_gen.create_style_selection_screen_svg),
        ("04-results-enhancement.svg", linkedin_gen.create_results_enhancement_screen_svg),
        ("05-portfolio.svg", linkedin_gen.create_portfolio_screen_svg)
    ]
    
    for filename, method in ios_screens:
        svg_content = method(IOS_SIZE[0], IOS_SIZE[1])
        
        # Save iOS version
        with open(f"{base_dir}/linkedin-headshot-generator/ios/{filename}", 'w') as f:
            f.write(svg_content)
        
        # Save framed version
        framed_content = create_phone_frame_svg(IOS_SIZE[0], IOS_SIZE[1], svg_content)
        framed_filename = filename.replace('.svg', '-framed.svg')
        with open(f"{base_dir}/linkedin-headshot-generator/ios/{framed_filename}", 'w') as f:
            f.write(framed_content)
        
        # Save Android version
        android_svg = method(ANDROID_SIZE[0], ANDROID_SIZE[1])
        android_filename = filename.replace('.svg', '-android.svg')
        with open(f"{base_dir}/linkedin-headshot-generator/android/{android_filename}", 'w') as f:
            f.write(android_svg)
    
    print("✅ All screenshots generated successfully!")
    print(f"📁 Screenshots saved to: {base_dir}")
    
    # Generate summary report
    summary = {
        "dating_profile_optimizer": {
            "ios_screenshots": 10,  # 5 regular + 5 framed
            "android_screenshots": 5,
            "total": 15
        },
        "linkedin_headshot_generator": {
            "ios_screenshots": 10,  # 5 regular + 5 framed
            "android_screenshots": 5,
            "total": 15
        },
        "format": "SVG (scalable vector graphics)",
        "ios_dimensions": f"{IOS_SIZE[0]}x{IOS_SIZE[1]} (iPhone 14 Pro Max)",
        "android_dimensions": f"{ANDROID_SIZE[0]}x{ANDROID_SIZE[1]} (Standard Android)"
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
        print(f"• Format: {summary['format']}")
        print(f"• iOS: {summary['ios_dimensions']}")
        print(f"• Android: {summary['android_dimensions']}")
        
    except Exception as e:
        print(f"❌ Error generating screenshots: {e}")
        import traceback
        traceback.print_exc()
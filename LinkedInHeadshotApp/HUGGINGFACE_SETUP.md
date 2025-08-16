# Hugging Face API Setup

## Getting a Hugging Face API Token

1. **Create Account**: Go to [huggingface.co](https://huggingface.co) and create a free account

2. **Generate Token**: 
   - Go to Settings > Access Tokens
   - Click "New token"
   - Name: "LinkedIn Headshot App"
   - Role: "read" (free tier)
   - Click "Generate a token"

3. **Copy Token**: Copy the token that looks like `hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

4. **Add to App**: In `App.js`, line 156, replace `hf_demo` with your real token:
   ```javascript
   'Authorization': 'Bearer hf_YourActualTokenHere',
   ```

## Available Models Used

- **runwayml/stable-diffusion-v1-5**: Professional, Tech, Finance styles
- **stabilityai/stable-diffusion-2-1**: Creative, Healthcare, Startup styles

## API Limits (Free Tier)

- 1,000 requests per month
- Rate limited to prevent abuse
- Models may take 10-20 seconds to load initially

## Fallback Behavior

If Hugging Face API fails or quota exceeded, app automatically falls back to local image enhancement with professional messaging.
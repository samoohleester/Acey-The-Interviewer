# Cat Animation Images Setup

To use your custom cat images for the talking and idle animations, follow these steps:

## 1. Prepare Your Images

You need **4 cat images**:
- `cat-frame1.png` - Cat with **closed mouth** (speaking state)
- `cat-frame2.png` - Cat with **open mouth** (speaking state)
- `cat-idle1.png` - Cat in **idle pose 1** (listening state)
- `cat-idle2.png` - Cat in **idle pose 2** (listening state)

## 2. Image Requirements

- **Format**: PNG or JPG
- **Size**: Recommended 200x200px to 400x400px
- **Background**: Transparent or solid color (will be styled)
- **Speaking frames**: Same cat, same position, different mouth states
- **Idle frames**: Same cat, different poses (e.g., slight head tilt, ear movement, etc.)

## 3. Add Images to This Folder

Place your images in this `public` folder with these exact names:
```
public/
├── cat-frame1.png   (closed mouth)
├── cat-frame2.png   (open mouth)
├── cat-idle1.png    (idle pose 1)
├── cat-idle2.png    (idle pose 2)
└── ... other files
```

## 4. How It Works

### **Speaking Animation**
- When the AI is **speaking**: Animates between `cat-frame1.png` and `cat-frame2.png` every 150ms
- Shows "AI Speaking..." status

### **Idle Animation**
- When the AI is **listening**: Animates between `cat-idle1.png` and `cat-idle2.png` every 800ms
- Shows "Listening..." status
- Slower, more subtle animation

### **States**
- **Inactive**: Shows cat emoji with "Ready to Interview"
- **Loading**: Shows bouncing cat with "Connecting..."
- **Speaking**: Fast mouth animation with "AI Speaking..."
- **Listening**: Slow idle animation with "Listening..."

## 5. Fallback System

If images don't load:
- **Speaking**: Shows 🐱 + 🗣️
- **Listening**: Shows 🐱 + 👂
- **Other states**: Shows 🐱

## 6. Customization

You can modify the animation in `src/CatAnimation.js`:
- Change frame switching speeds (currently 150ms speaking, 800ms idle)
- Add more frames for smoother animation
- Adjust image paths if needed

## 7. Testing

1. Add your images to this folder
2. Start the interview
3. The cat should:
   - Show idle animation when listening
   - Show speaking animation when AI speaks
   - Switch between states automatically

## Example Image Names
- `cat-frame1.png` - Your cat with closed mouth
- `cat-frame2.png` - Your cat with open mouth
- `cat-idle1.png` - Your cat in neutral pose
- `cat-idle2.png` - Your cat with slight movement (head tilt, ear twitch, etc.)

The animation will automatically detect when the AI is speaking vs listening and switch between the appropriate animations! 
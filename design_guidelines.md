# Design Guidelines for "What they Got?"

## Design Approach
**Reference-Based Approach** - Drawing inspiration from Instagram's visual-first social design combined with Yelp's review functionality, optimized for mobile-first dining experiences.

## Core Design Elements

### Color Palette
**Dark Theme Primary:**
- Background: 220 15% 8% (deep charcoal)
- Card backgrounds: 220 10% 12% 
- Text primary: 0 0% 95%
- Text secondary: 0 0% 70%

**Accent Colors:**
- Primary accent: 162 88% 65% (mint green #6EE7B7)
- Success/ratings: 142 76% 55%
- Warning/reports: 38 92% 50%

### Typography
- **Primary Font:** Inter via Google Fonts CDN
- **Headings:** Font weights 600-700, sizes 1.5rem-2.5rem
- **Body:** Font weight 400-500, size 0.875rem-1rem
- **Captions:** Font weight 400, size 0.75rem

### Layout System
**Tailwind Spacing Units:** Consistent use of 2, 4, 6, and 8 units
- `p-4` for card padding
- `gap-6` for section spacing  
- `m-2` for tight margins
- `h-8, h-12` for button heights

### Component Library

**Navigation:**
- Bottom tab bar with 4 icons (Menu, Reviews, Upload, Profile)
- Sticky header with app logo and station switcher

**Cards:**
- Menu item cards with rounded-xl corners, subtle shadows
- Review cards with user avatars and star ratings
- Photo upload cards with drag-and-drop zones

**Forms:**
- Rounded input fields with mint accent borders when focused
- Star rating component with smooth animations
- Photo upload with preview thumbnails

**Data Display:**
- Horizontal scrolling station cards
- Vertically stacked menu items with calorie badges
- Review threads with nested comment styling

### Content Strategy
**Mobile-First Feed Design:**
- Hero section: Daily featured menu items carousel
- Primary feed: Infinite scroll of menu items by meal time
- Station navigation: Horizontal swipe cards
- Review integration: Inline ratings and quick photo uploads

### Visual Hierarchy
- Large, appetizing food photos as primary visual elements
- Star ratings prominently displayed with mint accent color
- Menu prices and calorie information in secondary text
- User-generated content (photos/reviews) given equal visual weight to official menu items

### Interaction Patterns
- Pull-to-refresh for menu updates
- Swipe gestures for station navigation
- Tap-and-hold for quick reactions on reviews
- Modal overlays for detailed menu item information

## Images
- **Hero Images:** Large food photography carousel (full viewport width, 40vh height)
- **Menu Item Thumbnails:** Square format photos (1:1 aspect ratio, 120px minimum)
- **User Review Photos:** Rounded corner photo galleries with 3-photo max per review
- **Station Imagery:** Header background images for each dining station with gradient overlays

**Note:** Hero food images should use subtle gradient overlays (black 0% to 40% opacity) to ensure text readability. All user-uploaded photos should be compressed and optimized for mobile viewing.
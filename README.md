# Trampoline Virtual Coach

A React-based web application for coaching and managing trampoline skill routines with 3D visualization.

## Features

- 📊 **Skill Library**: Browse and search through various trampoline skills organized by difficulty
- 🎯 **Routine Builder**: Create custom routines with automatic difficulty scoring
- 🎬 **3D Simulator**: Visualize skills with realistic animations using Three.js
- 📱 **Mobile-Friendly**: Responsive design optimized for all devices
- 🎨 **Dark Theme**: Modern, professional interface
- ⚖️ **Dual Scoring**: Support for both men's and women's scoring systems
- ✏️ **Routine Editing**: Add, remove, and reorder skills in your routine

## Technologies Used

- **React 19** with TypeScript
- **Material-UI** for UI components and theming
- **Three.js** with React Three Fiber for 3D animations
- **Vite** for development and building
- **GitHub Pages** for deployment

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
git clone https://github.com/[YOUR_USERNAME]/virtual-coach.git
cd virtual-coach
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## Deployment to GitHub Pages

This project is configured for automatic deployment to GitHub Pages.

### Setup Instructions:

1. **Fork this repository** to your GitHub account

2. **Update the homepage URL** in `package.json`:

   ```json
   "homepage": "https://[YOUR_GITHUB_USERNAME].github.io/virtual-coach"
   ```

3. **Enable GitHub Pages**:
   - Go to your repository Settings > Pages
   - Set Source to "GitHub Actions"

4. **Push changes** to the main branch to trigger automatic deployment

The site will be available at `https://[YOUR_USERNAME].github.io/virtual-coach`

### Manual Deployment

```bash
npm run deploy
```

## Project Structure

```
src/
├── components/          # React components
│   ├── common/         # Reusable UI components (ActionIconButton, SkillChip)
│   └── mobile/         # Mobile-optimized components
├── hooks/              # Custom React hooks (useSimulator, useSkills)
├── models/             # TypeScript interfaces and enums
├── theme/              # Material-UI theme configuration
├── utils/              # Utility functions (scoring, skill conversion)
├── constants/          # Application constants
└── assets/             # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

---

🤸‍♂️ Built for trampoline athletes and coaches worldwide!
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
globalIgnores(['dist']),
{
files: ['**/*.{ts,tsx}'],
extends: [
// Other configs...
// Enable lint rules for React
reactX.configs['recommended-typescript'],
// Enable lint rules for React DOM
reactDom.configs.recommended,
],
languageOptions: {
parserOptions: {
project: ['./tsconfig.node.json', './tsconfig.app.json'],
tsconfigRootDir: import.meta.dirname,
},
// other options...
},
},
])

```

```

# Contributing to Silent Sentinel

Thank you for your interest in contributing to Silent Sentinel! This project is built on principles of privacy, ethics, and community safety.

## 🎯 Core Values

Before contributing, please understand and respect these core values:

1. **Privacy First**: Never compromise user anonymity or location privacy
2. **No Surveillance**: This is not a tracking or monitoring tool
3. **No Vigilantism**: Features should encourage reporting to authorities, not confrontation
4. **Ethical AI**: All AI decisions must be explainable and fair
5. **Accessibility**: Build for everyone, including those with disabilities

## 🤝 How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment (browser, OS, Firebase version)

### Suggesting Features

1. Check if the feature aligns with core values above
2. Create an issue with:
   - Clear use case
   - Mockups or examples
   - Ethical considerations
   - Privacy implications

### Code Contributions

1. **Fork the repository**

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Follow code standards**
   - Use ES6+ JavaScript
   - Follow existing code style
   - Add comments for complex logic
   - Write descriptive commit messages

4. **Test your changes**
   - Test manually in browser
   - Ensure Firebase rules still work
   - Check AI fallbacks function
   - Test with location permission denied

5. **Submit a Pull Request**
   - Reference any related issues
   - Describe what changed and why
   - Include screenshots for UI changes
   - Note any breaking changes

## 🔒 Security & Privacy

### What to Report Immediately

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email the maintainers directly (add contact info)
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Privacy Guidelines

When contributing code:

- ✅ Anonymous authentication only
- ✅ Explicit consent for location access
- ✅ Auto-expiring data (30 days max)
- ✅ AI moderation for harmful content
- ✅ No permanent user tracking

- ❌ No user profiles
- ❌ No location history
- ❌ No background tracking
- ❌ No social features that expose identity
- ❌ No naming of individuals

## 🧪 Development Setup

See [SETUP.md](SETUP.md) for detailed instructions.

Quick start:
```bash
npm install
cd functions && npm install && cd ..
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

## 📝 Code Style

- **Naming**: Use camelCase for variables, PascalCase for components
- **Components**: One component per file
- **Functions**: Pure functions when possible
- **Comments**: Explain "why", not "what"
- **Imports**: Group by external, internal, relative

Example:
```javascript
// External imports
import React, { useState } from 'react';
import { getFirestore } from 'firebase/firestore';

// Internal imports
import { useAuthStore } from '../stores/authStore';

// Relative imports
import './styles.css';
```

## 🎨 UI/UX Guidelines

- **Calm Design**: Avoid alarm-like colors or sounds
- **Clear Language**: Use "Safety Advisory" not "DANGER"
- **Accessibility**: Support screen readers, keyboard navigation
- **Responsive**: Mobile-first design
- **Performance**: Optimize images, lazy load when possible

## 🤖 AI Guidelines

When working with AI features:

1. **Always provide fallbacks** if AI fails
2. **Make decisions explainable** (show why AI classified something)
3. **Test edge cases** (profanity, multiple languages, PII)
4. **Monitor bias** (does AI treat all groups fairly?)
5. **Respect limits** (don't overuse API quota)

## 📚 Documentation

Update documentation when:
- Adding new features
- Changing APIs or data models
- Modifying setup process
- Updating dependencies

Files to update:
- `README.md` - Overview and quick start
- `SETUP.md` - Installation instructions
- `ARCHITECTURE.md` - Technical details
- Inline code comments

## ✅ Pull Request Checklist

Before submitting:

- [ ] Code follows style guidelines
- [ ] Comments added for complex logic
- [ ] Tested manually in browser
- [ ] Firebase rules still enforce security
- [ ] AI fallbacks work if API fails
- [ ] No console errors or warnings
- [ ] Privacy principles respected
- [ ] Documentation updated (if needed)
- [ ] Commit messages are descriptive

## 🌍 Community

- Be respectful and inclusive
- Assume good intentions
- Focus on constructive feedback
- Help others learn and grow
- Celebrate contributions

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping build ethical, privacy-first safety technology!** 🛡️


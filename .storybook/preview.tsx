import React, { StrictMode, useEffect } from 'react';
import type { Decorator, Preview } from '@storybook/react-vite';
import { MotionConfig } from 'motion/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/auth/AuthProvider';
import { ToastProvider } from '../src/components/slopcast/Toast';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { DEFAULT_THEME, THEMES, getTheme, type ColorMode, type ThemeId } from '../src/theme/themes';
import '../src/app.css';
import '../src/styles/theme.css';

const THEME_STORAGE_KEY = 'slopcast-theme';
const COLOR_MODE_STORAGE_KEY = 'slopcast-color-mode';

interface RouterParameters {
  initialEntries?: string[];
  initialIndex?: number;
}

function resolveEffectiveMode(themeId: ThemeId, colorMode: ColorMode): 'dark' | 'light' {
  const theme = getTheme(themeId);

  if (colorMode === 'system') {
    if (!theme.hasLightVariant) {
      return 'dark';
    }

    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  if (colorMode === 'light' && !theme.hasLightVariant) {
    return 'dark';
  }

  return colorMode;
}

function primeThemeState(themeId: ThemeId, colorMode: ColorMode) {
  const resolvedThemeId = getTheme(themeId).id;
  const effectiveMode = resolveEffectiveMode(resolvedThemeId, colorMode);

  window.localStorage.setItem(THEME_STORAGE_KEY, resolvedThemeId);
  window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, colorMode);
  document.documentElement.dataset.theme = resolvedThemeId;
  document.documentElement.dataset.mode = effectiveMode;
}

const ThemeGlobalsSync: React.FC<{ themeId: ThemeId; colorMode: ColorMode }> = ({ themeId, colorMode }) => {
  const { themeId: activeThemeId, colorMode: activeColorMode, setThemeId, setColorMode } = useTheme();

  useEffect(() => {
    if (activeThemeId !== themeId) {
      setThemeId(themeId);
    }
  }, [activeThemeId, setThemeId, themeId]);

  useEffect(() => {
    if (activeColorMode !== colorMode) {
      setColorMode(colorMode);
    }
  }, [activeColorMode, colorMode, setColorMode]);

  return null;
};

const withAppProviders: Decorator = (Story, context) => {
  const themeId = (context.globals.theme as ThemeId | undefined) ?? DEFAULT_THEME;
  const colorMode = (context.globals.colorMode as ColorMode | undefined) ?? 'dark';
  const router = (context.parameters.router as RouterParameters | undefined) ?? {};

  if (typeof window !== 'undefined') {
    primeThemeState(themeId, colorMode);
  }

  return (
    <StrictMode>
      <ThemeProvider>
        <ThemeGlobalsSync themeId={themeId} colorMode={colorMode} />
        <MotionConfig reducedMotion="user">
          <ToastProvider>
            <MemoryRouter initialEntries={router.initialEntries ?? ['/']} initialIndex={router.initialIndex ?? 0}>
              <AuthProvider>
                <div className="min-h-screen bg-theme-bg text-theme-text">
                  <div className="mx-auto w-full max-w-6xl p-6">
                    <Story />
                  </div>
                </div>
              </AuthProvider>
            </MemoryRouter>
          </ToastProvider>
        </MotionConfig>
      </ThemeProvider>
    </StrictMode>
  );
};

const preview: Preview = {
  tags: ['autodocs', 'test'],
  decorators: [withAppProviders],
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Slopcast app theme',
      toolbar: {
        icon: 'paintbrush',
        dynamicTitle: true,
        items: THEMES.map(theme => ({
          value: theme.id,
          title: theme.label,
          right: theme.icon,
        })),
      },
    },
    colorMode: {
      name: 'Mode',
      description: 'Theme color mode',
      toolbar: {
        icon: 'contrast',
        dynamicTitle: true,
        items: [
          { value: 'dark', title: 'Dark' },
          { value: 'light', title: 'Light' },
          { value: 'system', title: 'System' },
        ],
      },
    },
  },
  initialGlobals: {
    theme: DEFAULT_THEME,
    colorMode: 'dark',
  },
  parameters: {
    layout: 'fullscreen',
    actions: {
      argTypesRegex: '^on[A-Z].*',
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'region',
            enabled: false,
          },
        ],
      },
      test: 'todo',
    },
  },
};

export default preview;

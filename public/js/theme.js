// Управление темами и цветовыми схемами
class ThemeManager {
    constructor() {
        this.darkTheme = localStorage.getItem('darkTheme') === 'true';
        this.currentColorScheme = localStorage.getItem('colorScheme') || 'blue';
        this.init();
    }

    init() {
        // Инициализация темной темы
        if (this.darkTheme) {
            document.body.classList.add('dark-theme');
        }

        // Инициализация цветовой схемы
        this.applyColorScheme(this.currentColorScheme);

        // Обработчики событий
        const darkThemeToggle = document.getElementById('darkThemeToggle');
        const colorSchemeSelect = document.getElementById('colorScheme');

        if (darkThemeToggle) {
            darkThemeToggle.checked = this.darkTheme;
            darkThemeToggle.addEventListener('change', (e) => {
                this.toggleDarkTheme(e.target.checked);
            });
        }

        if (colorSchemeSelect) {
            colorSchemeSelect.value = this.currentColorScheme;
            colorSchemeSelect.addEventListener('change', (e) => {
                this.changeColorScheme(e.target.value);
            });
        }
    }

    toggleDarkTheme(enabled) {
        this.darkTheme = enabled;
        localStorage.setItem('darkTheme', enabled);
        document.body.classList.toggle('dark-theme', enabled);
    }

    changeColorScheme(scheme) {
        this.currentColorScheme = scheme;
        localStorage.setItem('colorScheme', scheme);
        this.applyColorScheme(scheme);
    }

    applyColorScheme(scheme) {
        const colors = {
            blue: {
                primary: '#3390ec',
                dark: '#1a4a7a'
            },
            green: {
                primary: '#2ecc71',
                dark: '#27ae60'
            },
            purple: {
                primary: '#9b59b6',
                dark: '#8e44ad'
            },
            orange: {
                primary: '#e67e22',
                dark: '#d35400'
            }
        };

        const root = document.documentElement;
        const color = colors[scheme] || colors.blue;

        root.style.setProperty('--primary-color', color.primary);
        root.style.setProperty('--primary-dark', color.dark);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
}); 
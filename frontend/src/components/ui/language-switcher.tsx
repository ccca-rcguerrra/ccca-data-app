import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

import { SUPPORTED_LOCALES, type AppLocale } from "@/i18n/supported-locales";
import { useSettingsStore } from "@/stores";
import { buttonVariants } from "@/components/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const handleLanguageChange = (langCode: AppLocale) => {
    setLanguage(langCode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          aria-label={t('language.switch')}
        >
          <Languages className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`flex items-center gap-2 ${
              language === lang.code ? 'bg-accent' : ''
            }`}
          >
            <span>{lang.nativeName}</span>
            {language === lang.code && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

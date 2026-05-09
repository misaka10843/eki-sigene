import { createI18n } from 'vue-i18n'
import ja from '@/locales/ja'
import zh from '@/locales/zh'

export const i18n = createI18n({
  legacy: false,
  locale: 'ja',
  fallbackLocale: 'ja',
  messages: { ja, zh },
})

import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { md3 } from 'vuetify/blueprints'

export default createVuetify({
  blueprint: md3,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1565C0',
          secondary: '#0288D1',
          surface: '#FAFAFA',
        },
      },
      dark: {
        colors: {
          primary: '#42A5F5',
          secondary: '#4FC3F7',
        },
      },
    },
  },
  defaults: {
    VBtn: { variant: 'tonal', rounded: 'xl' },
    VTextField: { variant: 'filled', density: 'comfortable', rounded: 't-sm', hideDetails: 'auto' },
    VSelect: { variant: 'filled', density: 'comfortable', rounded: 't-sm', hideDetails: 'auto' },
    VSwitch: { density: 'compact', color: 'primary', hideDetails: true, inset: true },
    VChip: { rounded: 'pill' },
    VCard: { rounded: 'xl', elevation: 0, border: true },
    VDialog: { rounded: 'xl' },
    VSnackbar: { rounded: 'xl' },
    VExpansionPanels: { variant: 'accordion', elevation: 0 },
    VExpansionPanel: { rounded: '0' },
    VExpansionPanelTitle: { collapseIcon: 'mdi-chevron-up', expandIcon: 'mdi-chevron-down' },
  },
})

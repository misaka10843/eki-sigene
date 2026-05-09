<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'
import { useSignGenerator } from '@/composables/useSignGenerator'
import ColorInput from '@/components/ColorInput.vue'

const { t, locale } = useI18n()
const gen = useSignGenerator()
const { state, mcExport, shareURL, fontLoad, macrons, enableBoardLight, mcTotalWidth, mcTotalHeight, NUMBERING_COLORS, ROUTE_COLORS } = gen

const canvasRef = ref<HTMLCanvasElement | null>(null)
const shareDialog = ref(false)
const copiedSnackbar = ref(false)
const openPanels = ref<string[]>(['signBoard', 'stationName', 'leftUpper', 'rightUpper'])

/* ── Auto-update canvas on state change ── */
let updateTimer: ReturnType<typeof setTimeout> | null = null
function scheduleUpdate() {
  if (updateTimer) clearTimeout(updateTimer)
  updateTimer = setTimeout(() => {
    if (canvasRef.value) gen.update(canvasRef.value)
  }, 120)
}

watch(() => state, scheduleUpdate, { deep: true })
watch(() => state.branchLeft, (v) => {
  if (v) state.leftStations[1]!.go = true
  if (v && !openPanels.value.includes('leftLower')) openPanels.value.push('leftLower')
})
watch(() => state.branchRight, (v) => {
  if (v) state.rightStations[1]!.go = true
  if (v && !openPanels.value.includes('rightLower')) openPanels.value.push('rightLower')
})

/* ── Resize handling ── */
function onResize() {
  if (canvasRef.value) gen.update(canvasRef.value)
}

onMounted(() => {
  if (canvasRef.value) gen.init(canvasRef.value)
  window.addEventListener('resize', onResize)
  /* Auto-load all fonts silently */
  gen.loadFont('japanese', () => { if (canvasRef.value) gen.update(canvasRef.value) })
  gen.loadFont('chinese', () => {})
  gen.loadFont('korean', () => {})
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

/* ── Actions ── */
function handleReset() {
  gen.reset()
  if (canvasRef.value) gen.update(canvasRef.value)
}

function handleSavePNG() { gen.saveAsPNG() }

function handleShareUrl() {
  gen.shareUrl()
  shareDialog.value = true
}

async function handleCopy(text: string) {
  await gen.copyToClipboard(text)
  copiedSnackbar.value = true
}

function handleMcExport() {
  gen.exportForMinecraft(mcExport.cols, mcExport.rows)
}

/* ── Numbering/city helpers ── */
function addNumbering(target: { numberings: { text: string; color: string }[] }, type: 'main' | 'left' | 'right') {
  let text = 'JX 00'
  let color = '#006400'

  if (type !== 'main' && state.sta.numberings.length > 0) {
    const base = state.sta.numberings[0]!
    color = base.color
    text = base.text.replace(/([0-9]+)/, (match) => {
      const num = parseInt(match, 10)
      const delta = type === 'left' ? -1 : 1
      return String(Math.max(0, num + delta)).padStart(match.length, '0')
    })
  }
  target.numberings.push({ text, color })
}

function removeNumbering(target: { numberings: { text: string; color: string }[] }, i: number) {
  target.numberings.splice(i, 1)
}

function addCityNotation() { state.cityNotations.push({ text: '', fill: true }) }
function removeCityNotation(i: number) { state.cityNotations.splice(i, 1) }
function addRouteColor() { state.routeColors.push('#006400') }
function removeRouteColor(i: number) { state.routeColors.splice(i, 1) }

/* ── Validation ── */
const numberingRule = (v: string) =>
  /^[A-Za-z'Ｚａ-ｚ]+\s*(-\s*)?[0-9'９]{2,}$/.test(v) || t('validation.numberingFormat')

const singleCharRule = (v: string) =>
  v.length === 1 || t('validation.singleChar')

const tlcRule = (v: string) =>
  /^[A-Z]{3}$/.test(v) || t('validation.tlcFormat')

/* ── Language ── */
const langOptions = [
  { title: '日本', value: 'ja' },
  { title: '中文', value: 'zh' },
]

/* ── Board type options ── */
const boardTypes = ['SE-6', 'SE-7', 'SE-8']

/* ── MC size info ── */
const mcSizeText = computed(() =>
  t('minecraft.size', { w: mcTotalWidth.value, h: mcTotalHeight.value }),
)

/* ── Google translate helper ── */
function googleTranslate(text: string, lang: string) {
  window.open(`https://translate.google.com/?hl=ja#ja/${lang}/${encodeURIComponent(text)}`, '_blank')
}

/* ── Dark mode ── */
const vuetifyTheme = useTheme()
const dark = computed({
  get: () => vuetifyTheme.global.current.value.dark,
  set: (v: boolean) => { vuetifyTheme.global.name.value = v ? 'dark' : 'light' },
})
</script>

<template>
  <!-- ─── App Bar ──────────────────────────────────────────────────────── -->
  <v-app-bar elevation="2" :color="dark ? 'surface-variant' : 'primary'" density="comfortable">
    <v-app-bar-title>
      <span class="font-weight-bold">Eki Sigene</span>
      <span class="text-caption ml-2 opacity-75">{{ $t('app.subtitle') }}</span>
    </v-app-bar-title>
    <template #append>
      <v-btn-toggle
        v-model="locale"
        mandatory
        density="compact"
        variant="outlined"
        divided
        class="mr-2"
        rounded="pill"
      >
        <v-btn v-for="opt in langOptions" :key="opt.value" :value="opt.value" size="small">
          {{ opt.title }}
        </v-btn>
      </v-btn-toggle>
      <v-btn :icon="dark ? 'mdi-weather-sunny' : 'mdi-weather-night'" @click="dark = !dark" />
    </template>
  </v-app-bar>

  <!-- ─── Main ─────────────────────────────────────────────────────────── -->
  <v-main>
    <v-container fluid class="pa-0">
      <v-row no-gutters>
        <!-- ── Settings Panel ────────────────────────────────────────── -->
        <v-col cols="12" md="4" lg="3" class="settings-col border-e elevation-2 position-relative" style="z-index: 10;">
          <v-sheet class="settings-scroll bg-surface">
            <v-expansion-panels v-model="openPanels" multiple variant="accordion">

              <!-- 'Sign Board Settings -->
              <v-expansion-panel value="signBoard" :title="$t('section.signBoard')" eager>
                <v-expansion-panel-text>
                  <v-select
                    v-model="state.signBoard.type"
                    :items="boardTypes"
                    :label="$t('board.type')"
                    class="mb-2"
                  />
                  <v-switch
                    v-model="state.signBoard.light"
                    :label="$t('board.light')"
                    :disabled="!enableBoardLight"
                    hide-details
                    class="mb-1"
                  />
                  <v-switch
                    v-model="state.numbering"
                    :label="$t('board.numbering')"
                    hide-details
                    class="mb-1"
                  />
                  <v-switch
                    v-model="state.branchRight"
                    :label="$t('board.branchRight')"
                    hide-details
                    class="mb-1"
                  />
                  <v-switch
                    v-model="state.branchLeft"
                    :label="$t('board.branchLeft')"
                    hide-details
                    class="mb-2"
                  />
                  <v-switch
                    v-model="state.signBoard.showFrame"
                    :label="$t('board.showFrame')"
                    class="mb-2"
                  />
                  <div class="d-flex align-center gap-2">
                    <span class="text-body-2">{{ $t('board.black') }}</span>
                    <ColorInput v-model="state.black" />
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 'Station Name -->
              <v-expansion-panel
                value="stationName"
                :title="$t('section.stationName') + (state.numbering ? ' · ナンバリング' : '')"
                eager
              >
                <v-expansion-panel-text>
                  <v-text-field
                    v-model="state.sta.name.kanji"
                    :label="$t('station.kanji')"
                    class="mb-2"
                  />
                  <v-text-field
                    v-model="state.sta.name.kana"
                    :label="$t('station.kana')"
                    class="mb-2"
                  />
                  <v-text-field
                    v-model="state.sta.name.english"
                    :label="$t('station.english')"
                    class="mb-1"
                  />
                  <div class="macron-row mb-2">
                    <v-chip
                      v-for="c in macrons"
                      :key="c"
                      size="x-small"
                      class="mr-1 mb-1"
                      clickable
                      @click="state.sta.name.english += c"
                    >{{ c }}</v-chip>
                  </div>

                  <template v-if="state.numbering">
                    <v-text-field
                      v-model="state.sta.name.chinese"
                      :label="$t('station.chinese')"
                      class="mb-1"
                    >
                      <template #append-inner>
                        <v-btn
                          size="x-small"
                          icon="mdi-translate"
                          variant="plain"
                          :title="$t('googleTranslate')"
                          @click="googleTranslate(state.sta.name.kanji, 'zh-CN')"
                        />
                      </template>
                    </v-text-field>
                    <v-text-field
                      v-model="state.sta.name.korean"
                      :label="$t('station.korean')"
                      class="mb-2"
                    >
                      <template #append-inner>
                        <v-btn
                          size="x-small"
                          icon="mdi-translate"
                          variant="plain"
                          :title="$t('googleTranslate')"
                          @click="googleTranslate(state.sta.name.kanji, 'ko')"
                        />
                      </template>
                    </v-text-field>

                    <v-switch
                      v-model="state.sta.enableTlc"
                      :label="$t('station.enableTlc')"
                      hide-details
                      class="mb-1"
                      @update:model-value="(v: boolean | null) => { if (v && state.sta.numberings.length === 0) state.sta.numberings.push({ text: 'JX 00', color: '#006400' }) }"
                    />
                    <v-text-field
                      v-if="state.sta.enableTlc"
                      v-model="state.sta.tlc"
                      :label="$t('station.tlc')"
                      :rules="[tlcRule]"
                      maxlength="3"
                      class="mb-2"
                      @update:model-value="(v: string) => { state.sta.tlc = gen.formatUppercase(v) }"
                    />

                    <div class="d-flex align-center mb-1">
                      <span class="text-body-2 font-weight-medium">{{ $t('station.addNumbering') }}</span>
                      <v-spacer />
                      <v-btn
                        size="small"
                        icon="mdi-plus"
                        :disabled="state.sta.numberings.length >= 2"
                        @click="addNumbering(state.sta, 'main')"
                      />
                    </div>
                    <div class="d-flex flex-wrap gap-1 mb-2">
                      <v-tooltip
                        v-for="nc in NUMBERING_COLORS"
                        :key="nc.color"
                        :text="locale === 'zh' ? nc.zh : nc.ja"
                        location="top"
                      >
                        <template #activator="{ props: tp }">
                          <v-sheet
                            v-bind="tp"
                            :color="nc.color"
                            width="18"
                            height="18"
                            border
                            rounded="sm"
                            class="flex-shrink-0"
                            :class="state.sta.numberings.length < 2 ? 'cursor-pointer' : 'opacity-40'"
                            :style="{ pointerEvents: state.sta.numberings.length < 2 ? 'auto' : 'none' }"
                            @click="state.sta.numberings.length < 2 && state.sta.numberings.push({ text: 'JX 00', color: nc.color })"
                          />
                        </template>
                      </v-tooltip>
                    </div>
                    <div
                      v-for="(n, i) in state.sta.numberings"
                      :key="i"
                      class="d-flex align-center gap-2 mb-2"
                    >
                      <v-text-field
                        v-model="n.text"
                        :label="$t('station.numberingN', { n: i + 1 })"
                        :rules="[numberingRule]"
                        density="compact"
                        hide-details="auto"
                        class="flex-grow-1"
                        @update:model-value="(v: string) => { n.text = gen.formatUppercase(v) }"
                      />
                      <ColorInput v-model="n.color" />
                      <v-btn
                        size="small"
                        icon="mdi-delete"
                        color="error"
                        variant="text"
                        :disabled="state.sta.enableTlc && state.sta.numberings.length <= 1"
                        @click="removeNumbering(state.sta, i)"
                      />
                    </div>
                  </template>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 'Left Station (upper) -->
              <v-expansion-panel
                value="leftUpper"
                :title="state.branchLeft ? $t('station.upperBranch', { side: $t('leftSide') }) : $t('section.leftStation')"
                eager
              >
                <v-expansion-panel-text>
                  <v-text-field v-model="state.leftStations[0]!.name.kanji" :label="$t('station.kanji')" class="mb-2" />
                  <v-text-field v-model="state.leftStations[0]!.name.english" :label="$t('station.english')" class="mb-1" />
                  <div class="macron-row mb-2">
                    <v-chip v-for="c in macrons" :key="c" size="x-small" class="mr-1 mb-1" clickable @click="state.leftStations[0]!.name.english += c">{{ c }}</v-chip>
                  </div>
                  <div class="d-flex align-center gap-2 mb-2">
                    <span class="text-body-2">{{ $t('station.lineColor') }}</span>
                    <ColorInput v-model="state.leftStations[0]!.lineColor" />
                    <div v-if="state.routeColors.length > 0" class="d-flex align-center gap-1 ml-1 pl-3 border-s">
                      <v-tooltip v-for="(c, i) in state.routeColors" :key="i" :text="$t('routeColor.color') + ' ' + (i + 1)" location="top">
                        <template #activator="{ props: tp }">
                          <v-sheet
                            v-bind="tp"
                            :color="c"
                            width="16"
                            height="16"
                            border
                            rounded="sm"
                            class="cursor-pointer"
                            @click="state.leftStations[0]!.lineColor = c"
                          />
                        </template>
                      </v-tooltip>
                    </div>
                  </div>
                  <v-switch v-model="state.leftStations[0]!.go" :label="$t('station.hasService')" hide-details class="mb-1" />
                  <template v-if="state.numbering && state.leftStations[0]!.go">
                    <div class="d-flex align-center mb-2 mt-2">
                      <span class="text-body-2 font-weight-medium">{{ $t('station.addNumbering') }}</span>
                      <v-spacer />
                      <v-btn size="small" icon="mdi-plus" :disabled="state.leftStations[0]!.numberings.length >= 2" @click="addNumbering(state.leftStations[0]!, 'left')" />
                    </div>
                    <div v-for="(n, i) in state.leftStations[0]!.numberings" :key="i" class="d-flex align-center gap-2 mb-2">
                      <v-text-field v-model="n.text" :label="$t('station.numberingN', { n: i + 1 })" :rules="[numberingRule]" density="compact" hide-details="auto" class="flex-grow-1" @update:model-value="(v: string) => { n.text = gen.formatUppercase(v) }" />
                      <ColorInput v-model="n.color" />
                      <v-btn size="small" icon="mdi-delete" color="error" variant="text" @click="removeNumbering(state.leftStations[0]!, i)" />
                    </div>
                  </template>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 'Left Station (lower) 'only if branchLeft -->
              <v-expansion-panel v-if="state.branchLeft" value="leftLower" :title="$t('station.lowerBranch', { side: $t('leftSide') })" eager>
                <v-expansion-panel-text>
                  <v-text-field v-model="state.leftStations[1]!.name.kanji" :label="$t('station.kanji')" class="mb-2" />
                  <v-text-field v-model="state.leftStations[1]!.name.english" :label="$t('station.english')" class="mb-1" />
                  <div class="macron-row mb-2">
                    <v-chip v-for="c in macrons" :key="c" size="x-small" class="mr-1 mb-1" clickable @click="state.leftStations[1]!.name.english += c">{{ c }}</v-chip>
                  </div>
                  <div class="d-flex align-center gap-2 mb-2">
                    <span class="text-body-2">{{ $t('station.lineColor') }}</span>
                    <ColorInput v-model="state.leftStations[1]!.lineColor" />
                    <div v-if="state.routeColors.length > 0" class="d-flex align-center gap-1 ml-1 pl-3 border-s">
                      <v-tooltip v-for="(c, i) in state.routeColors" :key="i" :text="$t('routeColor.color') + ' ' + (i + 1)" location="top">
                        <template #activator="{ props: tp }">
                          <v-sheet
                            v-bind="tp"
                            :color="c"
                            width="16"
                            height="16"
                            border
                            rounded="sm"
                            class="cursor-pointer"
                            @click="state.leftStations[1]!.lineColor = c"
                          />
                        </template>
                      </v-tooltip>
                    </div>
                  </div>
                  <v-switch v-model="state.leftStations[1]!.go" :label="$t('station.hasService')" hide-details class="mb-1" />
                  <template v-if="state.numbering && state.leftStations[1]!.go">
                    <div class="d-flex align-center mb-2 mt-2">
                      <span class="text-body-2 font-weight-medium">{{ $t('station.addNumbering') }}</span>
                      <v-spacer />
                      <v-btn size="small" icon="mdi-plus" :disabled="state.leftStations[1]!.numberings.length >= 2" @click="addNumbering(state.leftStations[1]!, 'left')" />
                    </div>
                    <div v-for="(n, i) in state.leftStations[1]!.numberings" :key="i" class="d-flex align-center gap-2 mb-2">
                      <v-text-field v-model="n.text" :label="$t('station.numberingN', { n: i + 1 })" :rules="[numberingRule]" density="compact" hide-details="auto" class="flex-grow-1" @update:model-value="(v: string) => { n.text = gen.formatUppercase(v) }" />
                      <ColorInput v-model="n.color" />
                      <v-btn size="small" icon="mdi-delete" color="error" variant="text" @click="removeNumbering(state.leftStations[1]!, i)" />
                    </div>
                  </template>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 'Right Station (upper) -->
              <v-expansion-panel
                value="rightUpper"
                :title="state.branchRight ? $t('station.upperBranch', { side: $t('rightSide') }) : $t('section.rightStation')"
                eager
              >
                <v-expansion-panel-text>
                  <v-text-field v-model="state.rightStations[0]!.name.kanji" :label="$t('station.kanji')" class="mb-2" />
                  <v-text-field v-model="state.rightStations[0]!.name.english" :label="$t('station.english')" class="mb-1" />
                  <div class="macron-row mb-2">
                    <v-chip v-for="c in macrons" :key="c" size="x-small" class="mr-1 mb-1" clickable @click="state.rightStations[0]!.name.english += c">{{ c }}</v-chip>
                  </div>
                  <div class="d-flex align-center gap-2 mb-2">
                    <span class="text-body-2">{{ $t('station.lineColor') }}</span>
                    <ColorInput v-model="state.rightStations[0]!.lineColor" />
                    <div v-if="state.routeColors.length > 0" class="d-flex align-center gap-1 ml-1 pl-3 border-s">
                      <v-tooltip v-for="(c, i) in state.routeColors" :key="i" :text="$t('routeColor.color') + ' ' + (i + 1)" location="top">
                        <template #activator="{ props: tp }">
                          <v-sheet
                            v-bind="tp"
                            :color="c"
                            width="16"
                            height="16"
                            border
                            rounded="sm"
                            class="cursor-pointer"
                            @click="state.rightStations[0]!.lineColor = c"
                          />
                        </template>
                      </v-tooltip>
                    </div>
                  </div>
                  <v-switch v-model="state.rightStations[0]!.go" :label="$t('station.hasService')" hide-details class="mb-1" />
                  <template v-if="state.numbering && state.rightStations[0]!.go">
                    <div class="d-flex align-center mb-2 mt-2">
                      <span class="text-body-2 font-weight-medium">{{ $t('station.addNumbering') }}</span>
                      <v-spacer />
                      <v-btn size="small" icon="mdi-plus" :disabled="state.rightStations[0]!.numberings.length >= 2" @click="addNumbering(state.rightStations[0]!, 'right')" />
                    </div>
                    <div v-for="(n, i) in state.rightStations[0]!.numberings" :key="i" class="d-flex align-center gap-2 mb-2">
                      <v-text-field v-model="n.text" :label="$t('station.numberingN', { n: i + 1 })" :rules="[numberingRule]" density="compact" hide-details="auto" class="flex-grow-1" @update:model-value="(v: string) => { n.text = gen.formatUppercase(v) }" />
                      <ColorInput v-model="n.color" />
                      <v-btn size="small" icon="mdi-delete" color="error" variant="text" @click="removeNumbering(state.rightStations[0]!, i)" />
                    </div>
                  </template>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 'Right Station (lower) 'only if branchRight -->
              <v-expansion-panel v-if="state.branchRight" value="rightLower" :title="$t('station.lowerBranch', { side: $t('rightSide') })" eager>
                <v-expansion-panel-text>
                  <v-text-field v-model="state.rightStations[1]!.name.kanji" :label="$t('station.kanji')" class="mb-2" />
                  <v-text-field v-model="state.rightStations[1]!.name.english" :label="$t('station.english')" class="mb-1" />
                  <div class="macron-row mb-2">
                    <v-chip v-for="c in macrons" :key="c" size="x-small" class="mr-1 mb-1" clickable @click="state.rightStations[1]!.name.english += c">{{ c }}</v-chip>
                  </div>
                  <div class="d-flex align-center gap-2 mb-2">
                    <span class="text-body-2">{{ $t('station.lineColor') }}</span>
                    <ColorInput v-model="state.rightStations[1]!.lineColor" />
                    <div v-if="state.routeColors.length > 0" class="d-flex align-center gap-1 ml-1 pl-3 border-s">
                      <v-tooltip v-for="(c, i) in state.routeColors" :key="i" :text="$t('routeColor.color') + ' ' + (i + 1)" location="top">
                        <template #activator="{ props: tp }">
                          <v-sheet
                            v-bind="tp"
                            :color="c"
                            width="16"
                            height="16"
                            border
                            rounded="sm"
                            class="cursor-pointer"
                            @click="state.rightStations[1]!.lineColor = c"
                          />
                        </template>
                      </v-tooltip>
                    </div>
                  </div>
                  <v-switch v-model="state.rightStations[1]!.go" :label="$t('station.hasService')" hide-details class="mb-1" />
                  <template v-if="state.numbering && state.rightStations[1]!.go">
                    <div class="d-flex align-center mb-2 mt-2">
                      <span class="text-body-2 font-weight-medium">{{ $t('station.addNumbering') }}</span>
                      <v-spacer />
                      <v-btn size="small" icon="mdi-plus" :disabled="state.rightStations[1]!.numberings.length >= 2" @click="addNumbering(state.rightStations[1]!, 'right')" />
                    </div>
                    <div v-for="(n, i) in state.rightStations[1]!.numberings" :key="i" class="d-flex align-center gap-2 mb-2">
                      <v-text-field v-model="n.text" :label="$t('station.numberingN', { n: i + 1 })" :rules="[numberingRule]" density="compact" hide-details="auto" class="flex-grow-1" @update:model-value="(v: string) => { n.text = gen.formatUppercase(v) }" />
                      <ColorInput v-model="n.color" />
                      <v-btn size="small" icon="mdi-delete" color="error" variant="text" @click="removeNumbering(state.rightStations[1]!, i)" />
                    </div>
                  </template>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 'City Notations -->
              <v-expansion-panel value="cityNotation" :title="$t('section.cityNotation')" eager>
                <v-expansion-panel-text>
                  <v-btn size="small" prepend-icon="mdi-plus" class="mb-3" @click="addCityNotation">
                    {{ $t('cityNotation.add') }}
                  </v-btn>
                  <div v-for="(n, i) in state.cityNotations" :key="i" class="d-flex align-center gap-2 mb-2">
                    <v-text-field
                      v-model="n.text"
                      :label="$t('cityNotation.char')"
                      :rules="[singleCharRule]"
                      maxlength="1"
                      density="compact"
                      hide-details="auto"
                      style="max-width:80px"
                    />
                    <v-switch v-model="n.fill" :label="$t('cityNotation.fill')" hide-details density="compact" class="flex-shrink-0" />
                    <v-btn size="small" icon="mdi-delete" color="error" variant="text" @click="removeCityNotation(i)" />
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 'Route Colors -->
              <v-expansion-panel value="routeColors" :title="$t('section.routeColors')" eager>
                <v-expansion-panel-text>
                  <v-btn size="small" prepend-icon="mdi-plus" class="mb-3" @click="addRouteColor">
                    {{ $t('routeColor.add') }}
                  </v-btn>
                  <div class="mb-2 text-caption text-medium-emphasis">{{ $t('routeColor.color') }}</div>
                  <div class="d-flex flex-wrap gap-1 mb-2 gap-2">
                    <v-tooltip v-for="rc in ROUTE_COLORS" :key="rc.color" :text="locale === 'zh' ? rc.zh : rc.ja" location="top">
                      <template #activator="{ props: tp }">
                        <v-sheet
                          v-bind="tp"
                          :color="rc.color"
                          width="24"
                          height="24"
                          border
                          rounded="sm"
                          class="cursor-pointer"
                          @click="state.routeColors.push(rc.color)"
                        />
                      </template>
                    </v-tooltip>
                  </div>
                  <div v-for="(c, i) in state.routeColors" :key="i" class="d-flex align-center gap-2 mb-2">
                    <ColorInput v-model="state.routeColors[i]!" :label="`${$t('routeColor.color')} ${i + 1}`" />
                    <v-btn size="small" icon="mdi-delete" color="error" variant="text" @click="removeRouteColor(i)" />
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 'Minecraft Export -->
              <v-expansion-panel value="minecraft" :title="$t('section.minecraft')" eager>
                <v-expansion-panel-text>
                  <v-switch v-model="mcExport.enabled" :label="$t('minecraft.enable')" hide-details class="mb-3" />
                  <template v-if="mcExport.enabled">
                    <v-row dense class="mb-2">
                      <v-col cols="6">
                        <v-text-field
                          v-model.number="mcExport.cols"
                          :label="$t('minecraft.cols')"
                          type="number"
                          :min="1"
                          :max="20"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model.number="mcExport.rows"
                          :label="$t('minecraft.rows')"
                          type="number"
                          :min="1"
                          :max="20"
                        />
                      </v-col>
                    </v-row>
                    <p class="text-caption text-medium-emphasis">{{ mcSizeText }}</p>
                  </template>
                </v-expansion-panel-text>
              </v-expansion-panel>

            </v-expansion-panels>
          </v-sheet>
        </v-col>

        <!-- ── Canvas + Actions ───────────────────────────────────────── -->
        <v-col cols="12" md="8" lg="9" class="canvas-col">
          <div class="canvas-container">
            <canvas ref="canvasRef" class="sign-canvas elevation-4" />
          </div>

          <!-- Action Buttons -->
          <v-sheet class="actions-area px-6 py-4 border-t">
            <v-row dense class="align-center">
              <v-col cols="6" sm="3">
                <v-btn block prepend-icon="mdi-refresh" color="primary" @click="scheduleUpdate">
                  {{ $t('action.reflect') }}
                </v-btn>
              </v-col>
              <v-col cols="6" sm="3">
                <v-btn block prepend-icon="mdi-restore" variant="outlined" @click="handleReset">
                  {{ $t('action.reset') }}
                </v-btn>
              </v-col>
              <v-col cols="6" sm="3">
                <v-btn block prepend-icon="mdi-download" color="secondary" @click="handleSavePNG">
                  {{ $t('action.savePNG') }}
                </v-btn>
              </v-col>
              <v-col cols="6" sm="3">
                <v-btn
                  block
                  prepend-icon="mdi-minecraft"
                  :color="mcExport.enabled ? 'success' : undefined"
                  :variant="mcExport.enabled ? 'tonal' : 'outlined'"
                  :disabled="!mcExport.enabled"
                  @click="handleMcExport"
                >
                  {{ $t('minecraft.export') }}
                </v-btn>
              </v-col>
              <v-col cols="6" sm="3">
                <v-btn block prepend-icon="mdi-share-variant" variant="tonal" @click="handleShareUrl">
                  {{ $t('action.share') }}
                </v-btn>
              </v-col>
            </v-row>

            <!-- Font status (auto-loaded, read-only) -->
            <div class="d-flex align-center gap-2 mt-3">
              <span class="text-caption text-medium-emphasis">{{ locale === 'zh' ? '字体：' : 'フォント：' }}</span>
              <v-chip v-for="f in (['japanese','chinese','korean'] as const)" :key="f"
                size="x-small"
                :color="fontLoad[f] ? 'success' : 'default'"
                :prepend-icon="fontLoad[f] ? 'mdi-check-circle' : 'mdi-loading mdi-spin'"
                variant="tonal"
              >
                {{ f === 'japanese' ? ($t('font.loadJa')) : f === 'chinese' ? $t('font.loadZh') : $t('font.loadKo') }}
              </v-chip>
            </div>
          </v-sheet>
        </v-col>
      </v-row>
    </v-container>
  </v-main>

  <!-- ─── Share URL Dialog ─────────────────────────────────────────────── -->
  <v-dialog v-model="shareDialog" max-width="540">
    <v-card :title="$t('dialog.shareTitle')">
      <v-card-text>
        <v-text-field
          :model-value="shareURL"
          readonly
          variant="outlined"
          density="compact"
          :append-inner-icon="'mdi-content-copy'"
          @click:append-inner="handleCopy(shareURL)"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="shareDialog = false">{{ $t('dialog.close') }}</v-btn>
        <v-btn color="primary" prepend-icon="mdi-content-copy" @click="handleCopy(shareURL)">
          {{ $t('action.copy') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- ─── Snackbar ─────────────────────────────────────────────────────── -->
  <v-snackbar v-model="copiedSnackbar" :timeout="2000" color="success">
    <v-icon start>mdi-check</v-icon>
    {{ $t('action.copied') }}
  </v-snackbar>
</template>

<style scoped>
.settings-scroll {
  height: calc(100vh - 64px);
  overflow-y: auto;
}

.canvas-col {
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-surface-variant));
  height: calc(100vh - 64px);
}

.canvas-container {
  background-color: rgb(var(--v-theme-surface-variant));
  background-image: linear-gradient(45deg, rgba(var(--v-theme-on-surface), 0.05) 25%, transparent 25%),
                    linear-gradient(-45deg, rgba(var(--v-theme-on-surface), 0.05) 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, rgba(var(--v-theme-on-surface), 0.05) 75%),
                    linear-gradient(-45deg, transparent 75%, rgba(var(--v-theme-on-surface), 0.05) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  min-height: 320px;
  flex: 1;
  overflow: hidden;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sign-canvas {
  max-width: 100%;
  display: block;
  border-radius: 4px;
}

.actions-area {
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.macron-row {
  min-height: 28px;
}

@media (max-width: 959px) {
  .settings-scroll {
    height: auto;
    max-height: 60vh;
    overflow-y: auto;
  }
  .canvas-container {
    min-height: 200px;
  }
}
</style>

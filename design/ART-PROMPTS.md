# 모두의 화살촉 — 아트 프롬프트 (AI 생성용)

> **이 문서는 시안 탐색·레퍼런스 생성용입니다.**
> 사람 디자이너에게 발주할 때는 **[DESIGN-BRIEF.md](DESIGN-BRIEF.md)** 와
> **[pot-spec.svg](pot-spec.svg)** / **[screen-layout.svg](screen-layout.svg)** 를 전달하세요.
> (치수·앵커·납품 규격·검수 기준은 발주서에만 있습니다)

현재 v0.3은 **전부 캔버스 절차적 드로잉**입니다. 아래 프롬프트로 스프라이트를 생성해
`drawPot()` / `drawArrowShape()` / `render()`의 배경 블록을 이미지로 교체하면 품질이 크게 올라갑니다.

## 공통 규칙

- **출력 경로**: `D:/AI/workspace/game/images/` (파일명은 영문, 예: `tuho-pot-base.png`)
- **스타일 토큰** (모든 프롬프트에 공통으로 붙일 문장):
  > `clean vector-style game art, soft cel shading with one warm light source from the upper right, crisp readable silhouette, no outline stroke, no text, no watermark, transparent background, centered, mobile game asset`
- **팔레트** (게임 코드와 일치시킬 것)
  | 용도 | HEX |
  |---|---|
  | 항아리 하이라이트 / 중간 / 그림자 | `#9c6c3c` / `#6b4a2a` / `#5a3e22` |
  | 입구 구멍 | `#241607` |
  | 화살대(대나무) | `#caa15a` |
  | 화살촉 | `#e8534e` |
  | 깃 | `#e9edf2` |
  | 강조(관·성공) | `#ffe14d` / `#ffcf5c` |
  | 하늘 상단 → 하단 | `#24405e` → `#4a6a7e` → `#caa36e` |
  | 땅 | `#7a5832` → `#43301c` |
- **해상도**: 모바일 세로(375~430dp) 기준, 기재된 px의 **3배수**로 생성 후 축소
- **금지**: 텍스트/로고/UI 테두리 포함, 원근 투시(측면 정면도 유지), 사실적 포토리얼

---

## 1. 항아리 (최우선 — 게임의 얼굴)

게임 로직이 **입구 폭 / 귀 위치**를 수치로 쓰므로, 아래 비율을 반드시 지켜야 합니다.

```
전체 폭 100 기준
  입구(mouth) 폭      : 42   (중앙 상단)
  귀 중심 오프셋      : ±30  (중앙에서)
  귀 하나의 폭        : 13
  몸통 최대 폭        : 100  (높이의 50% 지점)
  굽(바닥) 폭         : 60
  높이                : 95
```

### 1-1. 기본 항아리 `tuho-pot-base.png` (300×300)
```
A Korean traditional tuho pitch-pot (投壺) jar, front orthographic view.
Earthenware onggi pottery: wide round belly, narrow neck, flat open mouth on top,
and TWO short cylindrical ear-tubes (귀, 耳) protruding symmetrically from the left and
right of the neck, each ear also open at the top.
The main mouth and both ear openings are dark hollow voids so arrows can drop in.
A single incised decorative band runs horizontally across the middle of the belly.
Matte unglazed clay texture in warm brown: highlight #9c6c3c, midtone #6b4a2a,
shadow #5a3e22, openings #241607.
Proportions: mouth width 42% of total width, ears centered at ±30%, ear width 13%,
belly widest at 50% height, foot 60% width, total height 95% of width.
clean vector-style game art, soft cel shading with one warm light source from the upper right,
crisp readable silhouette, no outline stroke, no text, no watermark,
transparent background, centered, mobile game asset
```

### 1-2. 황금 항아리 `tuho-pot-gold.png` (300×300)
```
[1-1과 동일한 형태·비율] but glazed in burnished gold:
highlight #f4cf5e, midtone #c79a27, deep shadow #6f4f0d, rim glint #f7e08a.
Subtle specular sheen on the belly, faint warm glow around the mouth rim.
Still matte-ceramic, not metallic chrome.
[공통 스타일 토큰]
```

### 1-3. 야간 항아리 `tuho-pot-night.png` (300×300)
```
[1-1과 동일한 형태·비율] lit only by cool moonlight from the upper left:
rim light in pale blue #cfe0ff along the left edge, body desaturated to
#4a3a2c / #32251a, openings nearly black #140d06.
[공통 스타일 토큰]
```

### 1-4. 입구 상세 오버레이 `tuho-pot-rim.png` (300×90)
> 코드가 입구 타원과 양 턱 하이라이트를 따로 그립니다. 본체 위에 덧씌울 레이어.
```
Top-down ellipse of a pottery jar mouth seen at a shallow angle (15° tilt),
dark hollow interior #241607 fading to black at the bottom,
thin clay rim lip catching warm sunset light #ffdc78 on the near edge,
two tiny bright notches marking the extreme left and right of the rim.
[공통 스타일 토큰]
```

---

## 2. 화살

### 2-1. 던지는 화살 `tuho-arrow.png` (256×48, 수평 우향)
```
A single traditional Korean tuho throwing arrow, side view, pointing to the right,
perfectly horizontal.
Slender bamboo shaft #caa15a with two faint node rings,
a small lacquered red arrowhead #e8534e (short blunt triangle, not a war broadhead),
and a split white feather fletching #e9edf2 at the tail.
Length-to-thickness ratio about 20:1.
[공통 스타일 토큰]
```

### 2-2. 꽂힌 화살 `tuho-arrow-stuck.png` (96×200, 수직)
```
The tail half of a tuho arrow seen from the side, standing nearly vertical,
as if the head is buried out of frame below. Bamboo shaft and white split fletching
at the top, slight natural tilt of 8 degrees, soft contact shadow at the bottom edge.
[공통 스타일 토큰]
```

### 2-3. 관(貫) 적중 화살 `tuho-arrow-gold.png` (96×200)
```
[2-2와 동일] but the shaft is wrapped in gold thread and the fletching glows
pale yellow #ffe14d with a faint sparkle, marking a perfect bullseye throw.
[공통 스타일 토큰]
```

---

## 3. 배경 (패럴랙스 3층)

각 레이어는 **가로로 이어붙여도 끊기지 않게(seamless tiling horizontally)** 생성합니다.

### 3-1. 석양 하늘 `tuho-bg-sky.png` (1080×1200)
```
A vertical gradient evening sky over a Korean countryside, late autumn.
Top #24405e deepening to #4a6a7e at mid, warming to #caa36e at the horizon.
A soft low sun disc in warm cream #ffe9b8 with a wide diffuse halo,
placed at 78% from the left and 28% down. Three thin wispy cloud bands,
very low contrast. No ground, no objects.
flat gradient illustration, extremely soft, no text, no watermark, mobile game background
```

### 3-2. 원경 산 `tuho-bg-hills.png` (1080×320, seamless 가로 타일)
```
Two overlapping layers of distant Korean mountain ridges, silhouette only,
gentle rounded peaks. Far layer flat #3c4e60 at 60% opacity,
near layer flat #4a5a4e at 70% opacity. Bottom edge perfectly straight.
Horizontally seamless tileable. No sky, no trees in detail.
flat silhouette illustration, no text, no watermark, transparent above the ridgeline
```

### 3-3. 마당 바닥 `tuho-bg-ground.png` (1080×400, seamless 가로 타일)
```
A traditional Korean hanok courtyard of packed bare earth seen from a low side angle.
Vertical gradient #7a5832 at the top edge to #43301c at the bottom.
Scattered tiny pebbles and faint rake marks, a single thin warm highlight line
along the very top edge (horizon). Horizontally seamless tileable.
flat textured illustration, soft, no text, no watermark, mobile game background
```

### 3-4. 사대(발사 멍석) `tuho-mat.png` (240×80)
```
A small rolled straw mat (멍석) laid flat on earth, seen from a low front angle,
woven straw texture in #8a6b3c with darker weave lines, slightly rounded corners,
soft contact shadow underneath.
[공통 스타일 토큰]
```

### 3-5. 바람 깃대 `tuho-windflag.png` (160×260)
```
A slender wooden pole with a small triangular cloth pennant at the top,
pole in #6a4e2a with a round finial cap #caa15a.
Provide the pennant as a separate flat shape in neutral white so it can be
recolored and deformed in code. Pennant fluttering to the right.
[공통 스타일 토큰]
```

---

## 4. 이펙트

### 4-1. 적중 폭죽 `tuho-fx-burst.png` (512×512, 4프레임 스프라이트 시트 2×2)
```
A 4-frame sprite sheet (2x2 grid) of a celebratory burst effect:
frame 1 a tight bright core, frames 2-3 expanding radial shards and sparkles,
frame 4 fading motes. Colors #ffe14d, #ffffff, #ffcf5c, #ff9a4a.
Each frame centered in its cell, equal cell size, transparent background.
clean vector-style game effect, no text, no watermark
```

### 4-2. 흙먼지 `tuho-fx-dust.png` (256×128)
```
A low puff of dry earth dust kicked up by an impact, side view,
soft irregular cloud in #9b7a4e fading to transparent at the edges,
denser at the bottom. Single frame.
[공통 스타일 토큰]
```

### 4-3. 한 끗 슬로우모션 비네트 `tuho-fx-slowmo.png` (1080×1920)
```
A full-screen overlay for a slow-motion moment: transparent center,
warm cream #fff0b4 glow creeping in from all four edges at very low opacity,
plus faint horizontal speed streaks near the top and bottom.
Center 60% must stay fully transparent.
soft overlay, no text, no watermark
```

---

## 5. UI

### 5-1. HUD 칩 프레임 `tuho-ui-pill.png` (240×90, 9-slice)
```
A small rounded rectangular UI chip in Korean traditional style:
dark lacquer fill #140e08 at 72% opacity, a thin brass border #6a4e2a,
and a tiny cloud-scroll (단청) corner motif in the top-left and bottom-right.
Designed for 9-slice stretching: keep the middle 50% of each edge plain.
no text, no watermark, transparent background, mobile game UI
```

### 5-2. 기본 버튼 `tuho-ui-btn.png` (420×140, 9-slice)
```
A chunky mobile game button in Korean traditional palette:
top face warm gold #ffcf5c, 6px hard bottom bevel #b5831f,
rounded 16px corners, subtle brushed-lacquer texture on the face.
Designed for 9-slice stretching, no text on the button.
no text, no watermark, transparent background, mobile game UI
```

### 5-3. 아이콘 세트 `tuho-ui-icons.png` (512×128, 4칸 가로)
```
Four flat UI glyphs in a single horizontal strip, equal cells, same weight:
(1) speaker with sound waves, (2) pause double bar, (3) a quiver of arrows,
(4) a target ring with an arrow in the center.
All in warm cream #ffe6b0, single color, no fills of other hues,
geometric and chunky enough to read at 24px.
flat monochrome icon set, no text, no watermark, transparent background
```

---

## 6. 스토어 / 앱 아이콘

### 6-1. 앱 아이콘 `tuho-appicon.png` (1024×1024)
```
A mobile game app icon: a Korean tuho pitch-pot jar with two ear-tubes seen slightly
from above, with ONE arrow dropping into its mouth, caught mid-air just above the rim,
a small burst of gold sparks at the moment of entry.
Jar in warm brown #9c6c3c, arrow with red head and white fletching,
background a soft radial sunset gradient from #caa36e to #4a6a7e.
Composition fills the frame, thick readable shapes, strong silhouette at 48px.
No text, no border, no rounded-corner mask baked in.
clean vector-style game art, bold mobile app icon, soft cel shading, no watermark
```

### 6-2. 스토어 피처 그래픽 `tuho-feature.png` (1024×500)
```
A horizontal key art banner for a Korean traditional mini-game.
Left third: a silhouetted figure in hanbok, seen from behind at low angle,
arm extended having just released an arrow.
Right third: the tuho pitch-pot jar with ear-tubes, three arrows already standing in it.
Center: the arc of a flying arrow traced by a dotted glowing trail.
Evening hanok courtyard, distant mountain ridges, warm sunset sky #caa36e to #24405e.
Leave the upper-right 30% visually calm for a title overlay.
No text. cinematic game key art, clean vector-style, soft cel shading, no watermark
```

### 6-3. 스크린샷 배경 `tuho-screenshot-bg.png` (1242×2208)
```
A vertical promotional backdrop: blurred evening hanok courtyard with bokeh
lantern lights, warm sunset gradient, very low contrast so a game screenshot
placed on top stays fully readable. Bottom 20% darker for a caption strip.
No text, no device frame. soft blurred background, no watermark
```

---

## 7. 선택 — 캐릭터 (시리즈 아이덴티티)

전통놀이 시리즈(딱지·한발·한끗·화살촉)를 묶는 공통 캐릭터가 있으면 크로스 프로모에 유리합니다.

### 7-1. 궁사 캐릭터 `tuho-archer.png` (512×768)
```
A cute chibi Korean character in simple hanbok (pale blue jeogori, dark blue baji),
3-head-tall proportions, standing in profile facing right,
right arm raised holding a single tuho arrow pinched between fingers,
ready to throw underhand. Friendly round face, topknot with a small headband,
simple two-dot eyes and a confident smile.
Readable at 120px tall.
[공통 스타일 토큰]
```

### 7-2. 캐릭터 모션 시트 `tuho-archer-sheet.png` (1536×768, 3프레임)
```
A 3-frame horizontal sprite sheet of the same chibi hanbok character in profile:
(1) idle, arrow held low, (2) wind-up, arm back and torso coiled,
(3) release, arm extended forward, hand open, slight forward lean.
Identical scale, identical ground line, equal cells, transparent background.
[공통 스타일 토큰]
```

---

## 8. 적용 체크리스트

교체 시 코드에서 손댈 지점:

| 에셋 | 교체 대상 |
|---|---|
| `tuho-pot-*.png` | `drawPot()` — 베지어 몸통 + `drawEar()` |
| `tuho-arrow*.png` | `drawArrowShape()` / `drawStuckArrows()` / `drawGroundArrows()` |
| `tuho-bg-*.png` | `render()`의 하늘·산·바닥 블록 |
| `tuho-windflag.png` | `drawWindFlag()` (깃발은 코드로 변형 유지) |
| `tuho-fx-burst.png` | `parts` 파티클 (또는 병용) |
| `tuho-ui-*.png` | `.pill` / `.btn` / `.iconbtn` CSS |

> ⚠️ **항아리는 비율 고정이 필수**입니다. `pot.mouth` / `pot.earOff` / `pot.earW`가
> 판정 좌표를 직접 만들기 때문에, 이미지 비율이 다르면 **보이는 입구와 판정이 어긋납니다.**
> 교체 후 저장소 루트에서 `node tools/harness.js index.html`로 **구역 판정** 테스트를 반드시 재실행하세요.
> 정확한 비율은 [pot-spec.svg](pot-spec.svg)에 치수로 정리돼 있습니다.

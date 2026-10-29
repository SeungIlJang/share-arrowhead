# 모두의 화살촉 — Codex 아트 작업 지시서

> **대상**: 이미지 생성을 담당하는 Codex 세션
> **역할 분담**: 생성 = Codex · 치수 검증/합성/게임 적용 = Claude
> 치수 근거는 [pot-spec.svg](pot-spec.svg), 화면 맥락은 [screen-layout.svg](screen-layout.svg),
> 전체 배경은 [DESIGN-BRIEF.md](DESIGN-BRIEF.md) 참조.

---

## 0. 공통 규칙 (모든 주문에 적용)

| | |
|---|---|
| 출력 경로 | `D:/AI/workspace/game/images/` |
| 파일명 | 영문 소문자 + 하이픈, 지시서에 적힌 이름 그대로 |
| 포맷 | PNG-24 + **알파**, sRGB, 투명 배경 |
| 해상도 | 각 주문에 명시. 게임 내 실제 크기가 작으므로 **@3x가 상한** |
| 금지 | 텍스트 · 워터마크 · 외곽선(스트로크) · 사실적 3D 렌더 · 포토리얼 · 그림자 배경판 |

**스타일 토큰** — 모든 프롬프트 끝에 그대로 붙일 것:

```
clean 2D vector game art, flat cel shading with exactly 3 tone steps
(highlight / midtone / shadow), one light source from the UPPER RIGHT,
no outline stroke, no gradient mesh, no photorealistic rendering,
no 3D render look, no text, no watermark,
fully transparent background, object centered, mobile game sprite
```

**팔레트** — 반드시 이 HEX만 사용:

| 역할 | HEX |
|---|---|
| 옹기 하이라이트 / 중간 / 그림자 | `#9c6c3c` / `#6b4a2a` / `#5a3e22` |
| 구멍 내부 | `#241607` |
| 황금 변주 | `#f4cf5e` / `#c79a27` / `#6f4f0d` |
| 대나무(화살대) | `#caa15a` · 화살촉 `#e8534e` · 깃 `#e9edf2` |
| 강조 | `#ffe14d` / `#ffcf5c` · 텍스트 크림 `#ffe6b0` |
| 하늘 | `#24405e` → `#4a6a7e` → `#caa36e` · 땅 `#7a5832` → `#43301c` |

---

## 1. v1 시안 피드백 — 왜 프롬프트 방식을 바꾸는가

`tuho-pot-base-concept-20261023-v1.png` 를 픽셀 실측한 결과입니다.

```
귀 구멍 폭 / 입구 폭      0.402   (규격 0.30)   +34% 큼
귀 중심 오프셋 / 입구 폭   0.945   (규격 0.75)   +26% 멂
귀 외곽 / 입구 폭         1.146   (규격 0.90)   +27% 벌어짐
귀 림 y − 입구 림 y       48px    (규격 0)      귀가 입구보다 낮음
입구 폭 / 전체 폭         0.365   (권장 0.40~0.60)
굽 폭 / 몸통 최대 폭      0.452   (권장 0.60)
```

잘 된 점: 좌우 대칭(1.5px), 투명 배경, 구멍 3개가 검은 공동으로 읽힘, 1x 축소 시 귀 가독성.
어긋난 점: **귀 치수 전부**, 그리고 **귀 림 높이**.

문제의 본질은 Codex의 실수가 아니라 **방식**입니다. 이미지 생성 모델에 "폭의 0.30배, 중심에서 0.75배 지점"
같은 정밀 비율을 한 장에 요구하면 거의 맞지 않습니다. 한 장에 세 구멍을 같이 그리는 한 계속 어긋납니다.

### → 분할 생성 + 코드 합성 (Plan A, 기본)

항아리를 **3개 부품으로 따로 생성**하고, 정확한 좌표 배치는 Claude가 코드로 합니다.
Codex는 비율 제약에서 완전히 해방되고, 형태·질감·색에만 집중하면 됩니다.

```
tuho-pot-body.png   몸통만  (구멍 없음, 귀 없음, 목 포함)
tuho-pot-rim.png    입구 림 + 구멍  (단독, 정면)
tuho-pot-ear.png    귀 1개  (오른쪽용 1개만 — 왼쪽은 코드에서 미러)
```

합성·치수 보정·게임 적용은 Claude가 담당합니다. **Codex는 이 3장만 주면 됩니다.**

통짜 1장이 꼭 필요한 경우에만 Plan B(§2-4)로 가고, 그때는 아래 자가검증을 반드시 통과시켜야 합니다.

### 자가검증 (Plan B 또는 최종 합성본 확인용)

```bash
node tools/check-pot-art.mjs <파일.png>
```

종료코드 0 = 통과. 실패 항목과 측정치를 출력하므로, **통과할 때까지 재생성**하고
통과한 파일만 넘겨 주세요.

---

## 2. 항아리 (P0 — 최우선)

### 2-1. `tuho-pot-body.png` — 몸통 (1024×1024)

```
The body of a Korean traditional onggi earthenware jar, front orthographic
elevation, perfectly symmetrical, NO perspective and NO view from above.
Silhouette: a short narrow neck at the very top that flares into a wide round
shoulder, the widest point at exactly half the height, then tapering down to a
flat circular foot.
The top of the neck is CUT FLAT and left SOLID — do NOT draw any opening,
hole, rim lip or handles. No ears, no spouts, no lid.
ONE single shallow incised horizontal groove encircles the belly at exactly
half the height — one line only, not two, not a wide band.
Matte unglazed clay, subtly uneven surface, no gloss, no specular highlight.
Colors strictly: highlight #9c6c3c, midtone #6b4a2a, shadow #5a3e22.
Proportions: foot width = 0.60 of the widest body width;
neck width = 0.46 of the widest body width; total height = 0.85 of the width.
clean 2D vector game art, flat cel shading with exactly 3 tone steps
(highlight / midtone / shadow), one light source from the UPPER RIGHT,
no outline stroke, no gradient mesh, no photorealistic rendering,
no 3D render look, no text, no watermark,
fully transparent background, object centered, mobile game sprite
```

**수락 기준** — 구멍이 하나도 없을 것 / 띠 1줄 / 굽이 바닥에서 평평하게 끊길 것 / 좌우 대칭.

### 2-2. `tuho-pot-rim.png` — 입구 림 (1024×420)

```
Only the open mouth rim of a Korean onggi jar, isolated on transparent
background, seen from a LOW angle so the opening reads as a very shallow
ellipse: the ellipse height must be about 0.36 of its width — a narrow slit-like
oval, NOT a circle, NOT seen from above.
A thin rounded clay lip runs around the opening, catching warm light on the
upper-right edge. Inside the opening is a deep black void #241607 fading to
near black at the bottom — it must read as a hole you could drop an arrow into.
Nothing else in frame: no jar body, no neck, no handles, no shadow plate.
Colors strictly: lip highlight #9c6c3c, lip shadow #5a3e22, void #241607.
clean 2D vector game art, flat cel shading with exactly 3 tone steps
(highlight / midtone / shadow), one light source from the UPPER RIGHT,
no outline stroke, no gradient mesh, no photorealistic rendering,
no 3D render look, no text, no watermark,
fully transparent background, object centered, mobile game sprite
```

**수락 기준** — 타원 세로/가로 ≈ 0.36 (±0.1) / 내부가 검은 공동 / 몸통이 섞여 들어오지 않을 것.

### 2-3. `tuho-pot-ear.png` — 귀 1개 (512×768)

```
A single short cylindrical ear-tube (handle-like spout) of a Korean onggi tuho
jar, isolated on transparent background, standing upright, seen from the same
low angle as the jar rim.
It is an open tube: the top is a shallow elliptical opening (ellipse height about
0.48 of its width) showing a dark hollow void #241607 inside, and the tube wall
runs straight down with a gentle taper.
Tube height = 1.6 times the opening width. The bottom end is cut flat and left
open-ended (it will be attached to a jar neck) — do not cap it, do not attach
any jar body, do not draw a second tube.
Same matte unglazed clay as the jar: highlight #9c6c3c, midtone #6b4a2a,
shadow #5a3e22, void #241607.
clean 2D vector game art, flat cel shading with exactly 3 tone steps
(highlight / midtone / shadow), one light source from the UPPER RIGHT,
no outline stroke, no gradient mesh, no photorealistic rendering,
no 3D render look, no text, no watermark,
fully transparent background, object centered, mobile game sprite
```

**수락 기준** — 1개만 / 위가 뚫려 있을 것 / 높이 ≈ 구멍폭 × 1.6 / 아래가 열린 채 끝날 것.

### 2-4. (Plan B) `tuho-pot-base.png` — 통짜 1장 (1024×1024)

분할이 어려울 때만. 아래 수치를 **문장이 아니라 제약으로** 반복해 넣었습니다.

```
A Korean traditional tuho pitch-pot (投壺) jar, front orthographic elevation,
NO perspective, perfectly symmetrical.
It has THREE openings along ONE SINGLE HORIZONTAL LINE at the very top:
a wide central mouth, and two SMALL ear-tubes, one on each side.
CRITICAL — the rims of the two ear-tubes and the rim of the central mouth are
at EXACTLY THE SAME HEIGHT. The ears must not sit lower or higher than the
central mouth. All three rims align on one horizontal line.
CRITICAL — size and placement, measured against the central mouth width W:
  each ear opening width  = 0.30 × W   (small — less than a third of the mouth)
  ear centre distance from the mouth centre = 0.75 × W
  outermost edge of each ear = 0.90 × W from the mouth centre
  the ears sit CLOSE IN beside the neck, NOT out at the shoulders
  the jar body widest width = 2.0 × W
  the flat foot width = 0.60 × body width
All three openings are deep black voids #241607.
ONE single incised groove encircles the belly at half the jar height.
Matte unglazed clay: highlight #9c6c3c, midtone #6b4a2a, shadow #5a3e22.
clean 2D vector game art, flat cel shading with exactly 3 tone steps
(highlight / midtone / shadow), one light source from the UPPER RIGHT,
no outline stroke, no gradient mesh, no photorealistic rendering,
no 3D render look, no text, no watermark,
fully transparent background, object centered, mobile game sprite
```

**반드시** `node tools/check-pot-art.mjs tuho-pot-base.png` 통과 후 전달.

### 2-5. 변주 2종

같은 형태로 색만 바꿉니다. **형태·비율은 기본형과 완전히 동일해야 합니다.**

- `tuho-pot-gold.png` — 위 프롬프트에서 점토색을 `highlight #f4cf5e, midtone #c79a27, shadow #6f4f0d, rim glint #f7e08a` 로 교체. 유약 광택은 아주 약하게, 금속/크롬 금지.
- `tuho-pot-night.png` — 쿨한 달빛 버전. `rim light #cfe0ff along the LEFT edge, body desaturated to #4a3a2c / #32251a, voids #140d06`.

---

## 3. 화살 (P0)

### 3-1. `tuho-arrow.png` (768×192)

```
A single traditional Korean tuho throwing arrow, side view, pointing to the
RIGHT, perfectly horizontal, isolated.
A slender bamboo shaft #caa15a with two faint node rings, a SHORT BLUNT
lacquered red tip #e8534e (a stubby cone, not a sharp war broadhead), and a
split white feather fletching #e9edf2 at the tail.
Shaft length to thickness about 20:1. The whole arrow spans the full frame
width with small margins.
clean 2D vector game art, flat cel shading with exactly 3 tone steps
(highlight / midtone / shadow), one light source from the UPPER RIGHT,
no outline stroke, no gradient mesh, no photorealistic rendering,
no 3D render look, no text, no watermark,
fully transparent background, object centered, mobile game sprite
```

### 3-2. `tuho-arrow-stuck.png` (288×720)

```
The tail half of a traditional Korean tuho arrow standing almost upright,
tilted 8 degrees, as if the tip is buried below the frame.
Only the bamboo shaft #caa15a and the split white fletching #e9edf2 are
visible; the shaft is cut off by the bottom edge of the frame.
No ground, no jar, no shadow plate.
clean 2D vector game art, flat cel shading with exactly 3 tone steps
(highlight / midtone / shadow), one light source from the UPPER RIGHT,
no outline stroke, no gradient mesh, no photorealistic rendering,
no 3D render look, no text, no watermark,
fully transparent background, object centered, mobile game sprite
```

### 3-3. `tuho-arrow-stuck-gold.png` (288×720)

위와 동일하되 `the shaft is wrapped with fine gold thread and the fletching glows pale yellow #ffe14d with a faint sparkle` 추가. 관(貫) 적중 전용.

---

## 4. 배경 (P1)

지평선은 화면 높이의 **78%** 에 고정됩니다. 세 레이어가 이 선에서 맞물려야 합니다.

### 4-1. `tuho-bg-sky.png` (1290×1900)

```
A vertical gradient evening sky over the Korean countryside in late autumn.
Top #24405e deepening through #4a6a7e at mid height, warming to #caa36e at
the very bottom edge. A soft low sun disc in warm cream #ffe9b8 with a wide
diffuse halo, centred at 78% from the left and 28% down from the top.
Three thin wispy horizontal cloud bands, very low contrast.
No ground, no horizon line, no objects, no birds.
flat gradient illustration, extremely soft, no text, no watermark
```

### 4-2. `tuho-bg-hills.png` (1290×400) — **가로 심리스**

```
Two overlapping layers of distant Korean mountain ridges, pure silhouette,
gentle rounded peaks, no detail inside the shapes.
Far layer flat #3c4e60, near layer flat #4a5a4e.
The BOTTOM EDGE of the image is perfectly straight and fully filled;
above the ridgeline is fully transparent.
Horizontally seamless and tileable — the left and right edges must match
exactly so copies can be placed side by side with no visible seam.
flat silhouette illustration, no text, no watermark, transparent background
```

### 4-3. `tuho-bg-ground.png` (1290×540) — **가로 심리스**

```
A traditional Korean hanok courtyard of packed bare earth, seen from a low
side angle. Vertical gradient #7a5832 at the top edge to #43301c at the bottom.
Scattered tiny pebbles and faint rake marks, very low contrast.
A single thin warm highlight line runs along the very top edge.
Horizontally seamless and tileable — left and right edges must match exactly.
flat textured illustration, soft, no text, no watermark
```

### 4-4. `tuho-bg-night-sky.png` (1290×1900)

4-1과 같은 구도로 `#0b1430 → #1b2a44 → #3b3350`, 해 대신 창백한 달 `#e7f0ff`, 작은 별 산포.

---

## 5. 물체 / 소품 (P1)

### 5-1. `tuho-mat.png` — 사대(멍석) (720×240)

```
A small rolled straw mat lying flat on the ground, seen from a low front angle,
woven straw texture in #8a6b3c with slightly darker weave lines, gently rounded
corners, a soft contact shadow directly underneath.
No ground plane, no background.
clean 2D vector game art, flat cel shading with exactly 3 tone steps
(highlight / midtone / shadow), one light source from the UPPER RIGHT,
no outline stroke, no gradient mesh, no photorealistic rendering,
no 3D render look, no text, no watermark,
fully transparent background, object centered, mobile game sprite
```

### 5-2. `tuho-windpole.png` — 깃대 (180×1680)

```
A slender vertical wooden pole with a small round finial cap on top.
Pole in #6a4e2a, cap in #caa15a. NO flag, NO banner, NO rope attached —
the pole alone, perfectly vertical, spanning the full frame height.
clean 2D vector game art, flat cel shading with exactly 3 tone steps
(highlight / midtone / shadow), one light source from the UPPER RIGHT,
no outline stroke, no gradient mesh, no photorealistic rendering,
no 3D render look, no text, no watermark,
fully transparent background, object centered, mobile game sprite
```

### 5-3. `tuho-windflag.png` — 깃발 (540×270)

```
A single triangular cloth pennant fluttering to the RIGHT, isolated.
Plain NEUTRAL WHITE with only soft fold shading in light grey — no colour,
no pattern, no emblem (the game recolours it in code).
Its attachment point — the short vertical edge — is at the LEFT edge of the
frame, vertically centred. No pole, no rope.
clean 2D vector game art, flat cel shading, soft fold shadows,
no outline stroke, no text, no watermark,
fully transparent background, mobile game sprite
```

### 5-4. `tuho-bonus-pouch.png` — 복주머니 보너스 표적 (512×512, P2)

```
A traditional Korean lucky pouch (복주머니) hanging from a short red cord,
plump rounded silk bag in deep red #c0392b with a gold geometric trim band
and a small gold tassel at the bottom. Front view, symmetrical.
clean 2D vector game art, flat cel shading with exactly 3 tone steps
(highlight / midtone / shadow), one light source from the UPPER RIGHT,
no outline stroke, no gradient mesh, no photorealistic rendering,
no 3D render look, no text, no watermark,
fully transparent background, object centered, mobile game sprite
```

---

## 6. 캐릭터 (P2 — 전통놀이 시리즈 공통 자산)

시리즈 4종(딱지·한발·한끗·화살촉)에 함께 쓸 수 있게 **중립적인 한복 캐릭터**로 만듭니다.

### 6-1. `tuho-archer-idle.png` — 기본 포즈 (768×1152)

```
A cute chibi Korean character wearing simple hanbok: pale blue jeogori top and
dark navy baji trousers, cloth shoes. Three-heads-tall chibi proportions.
Seen in profile facing RIGHT, standing relaxed, holding a single slender tuho
arrow pinched between the fingers of the raised right hand, held low at waist
height, ready to throw underhand.
Friendly round face, simple two-dot eyes and a small confident smile, hair in a
neat topknot with a thin dark headband. No facial detail beyond the two eyes
and mouth.
Must stay readable when scaled down to 120 pixels tall.
clean 2D vector game art, flat cel shading with exactly 3 tone steps
(highlight / midtone / shadow), one light source from the UPPER RIGHT,
no outline stroke, no gradient mesh, no photorealistic rendering,
no 3D render look, no text, no watermark,
fully transparent background, full body in frame, feet at the bottom edge,
mobile game sprite
```

### 6-2. `tuho-archer-sheet.png` — 동작 3프레임 (2304×1152)

```
A 3-frame horizontal sprite sheet of ONE chibi Korean character in hanbok,
seen in profile facing RIGHT, in three equal cells side by side:
  frame 1 — idle, arrow held low at the waist, weight even
  frame 2 — wind-up, throwing arm drawn back, torso coiled, front foot lifted
  frame 3 — release, arm extended forward, hand open and empty, body leaning
            forward, back foot raised
Identical character design, identical scale and identical ground line in all
three cells. Equal cell widths, each character centred in its own cell,
at least 2 pixels of transparent padding between cells.
pale blue jeogori, dark navy baji, topknot with thin headband,
two-dot eyes, small smile.
clean 2D vector game art, flat cel shading with exactly 3 tone steps
(highlight / midtone / shadow), one light source from the UPPER RIGHT,
no outline stroke, no gradient mesh, no photorealistic rendering,
no 3D render look, no text, no watermark,
fully transparent background, mobile game sprite sheet
```

**수락 기준** — 3칸 폭이 같을 것 / 발 높이(접지선)가 세 칸 모두 같을 것 / 같은 인물로 보일 것.

---

## 7. 이펙트 (P2)

### 7-1. `tuho-fx-burst.png` — 적중 폭죽 (1024×1024, 2×2 시트)

```
A 4-frame sprite sheet in a 2x2 grid showing a celebratory burst effect
expanding over time:
  top-left      a tight bright core with short radial spikes
  top-right     spikes extended, small shards flying outward
  bottom-left   shards far out, core faded, sparkle motes appear
  bottom-right  only scattered faint motes remaining
Colors #ffe14d, #ffffff, #ffcf5c, #ff9a4a.
Each frame centred in its own equal-sized cell, at least 2 pixels of
transparent padding between cells. No background, no frame borders.
clean 2D vector game effect, no text, no watermark, transparent background
```

### 7-2. `tuho-fx-dust.png` — 흙먼지 (512×256)

```
A low puff of dry earth dust kicked up by an impact, seen from the side.
A soft irregular cloud in #9b7a4e, denser and more opaque along the bottom,
dissolving to fully transparent at the top and outer edges. Single frame.
no outline stroke, no text, no watermark, transparent background
```

---

## 8. UI (P1)

### 8-1. `tuho-ui-pill.png` — HUD 칩 (480×264, 9-slice)

```
A small rounded rectangular UI chip panel in Korean traditional style:
dark lacquer fill #140e08, a thin brass border #6a4e2a, 20px corner radius.
A tiny single cloud-scroll motif in the top-left corner and another in the
bottom-right corner, very small and low contrast.
The middle 50% of every edge must be completely plain and uniform so the
image can be stretched as a 9-slice. No text inside.
flat UI panel art, no watermark, transparent background
```

### 8-2. `tuho-ui-btn.png` — 버튼 (840×280, 9-slice)

```
A chunky mobile game button: flat top face in warm gold #ffcf5c with a subtle
brushed-lacquer texture, and a hard flat bottom bevel in #b5831f taking the
lower 15% of the height. 32px corner radius. No text on the button.
The middle 50% of every edge must be completely plain for 9-slice stretching.
flat UI art, no outline stroke, no watermark, transparent background
```

### 8-3. `tuho-ui-icons.png` — 아이콘 4종 (1024×256, 가로 4등분)

```
Four flat UI glyphs in one horizontal strip of four equal cells, same visual
weight and same stroke thickness:
  cell 1  a speaker with two sound waves
  cell 2  a pause symbol, two vertical bars
  cell 3  a quiver holding three arrows
  cell 4  a target ring with an arrow stuck in the centre
All in ONE single flat colour #ffe6b0 — no shading, no second colour, no
gradient. Chunky and geometric enough to stay legible at 24 pixels.
Each glyph centred in its cell.
flat monochrome icon set, no text, no watermark, transparent background
```

---

## 9. 스토어 (P2)

### 9-1. `tuho-appicon.png` (1024×1024)

```
A mobile game app icon: a Korean tuho pitch-pot jar with two small ear-tubes,
seen slightly from above, with ONE arrow caught mid-air just above the mouth,
about to drop in, and a small burst of gold sparks at the point of entry.
Jar in warm brown #9c6c3c, arrow with a red tip and white fletching.
Background is a soft radial sunset gradient from #caa36e at the centre to
#4a6a7e at the corners, filling the entire square.
Bold simple shapes with a strong silhouette that still reads at 48 pixels.
No text, no border, no rounded-corner mask, no drop shadow outside the square.
clean 2D vector game art, flat cel shading, bold mobile app icon, no watermark
```

### 9-2. `tuho-feature.png` (1024×500)

```
A horizontal key art banner for a Korean traditional mini-game.
Left third: a chibi figure in hanbok seen from behind at a low angle, arm
extended, having just released an arrow.
Right third: a tuho jar with two ear-tubes, three arrows already standing in
its mouth.
Centre: the arc of a flying arrow traced by a glowing dotted trail connecting
the two.
Setting is an evening hanok courtyard with distant mountain ridges and a warm
sunset sky from #caa36e at the horizon to #24405e at the top.
Keep the UPPER RIGHT 30% visually calm and uncluttered for a title overlay.
No text anywhere.
cinematic game key art, clean 2D vector style, flat cel shading, no watermark
```

---

## 10. 납품 / 수락

### 우선순위

| | 파일 | 비고 |
|---|---|---|
| **P0** | `tuho-pot-body` `tuho-pot-rim` `tuho-pot-ear` | 분할 3종 — 이것부터 |
| **P0** | `tuho-arrow` `tuho-arrow-stuck` | |
| P1 | 배경 3종, 소품 3종, UI 3종, 황금·야간 변주 | |
| P2 | 캐릭터 2종, 이펙트 2종, 스토어 2종, 복주머니 | |

### 넘기기 전 확인

- [ ] 투명 배경 — 가장자리에 흰 테두리(halo)가 없을 것
- [ ] 텍스트 · 워터마크 · 외곽선 없음
- [ ] 팔레트 HEX만 사용
- [ ] 광원이 **우측 상단** 하나로 전 에셋 통일
- [ ] 1x로 축소해 형태가 읽히는지 직접 확인 (항아리 102px, 화살 42px)
- [ ] 심리스 배경은 좌우 이어붙여 이음선 확인
- [ ] 통짜 항아리(Plan B)라면 `node tools/check-pot-art.mjs <파일>` 통과

### 넘긴 뒤

Claude가 받아서 ① 치수 실측·합성 ② 게임 코드 적용 ③ 하네스 80항목 재실행
(특히 **구역 판정** — 보이는 구멍과 적중 좌표 일치) 을 수행합니다.

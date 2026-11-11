# 모두의 화살촉 — Codex 아트 작업 지시서 (개정 3 · 누각 기둥 재발주)

> **대상**: 이미지 생성을 담당하는 Codex 세션
> **역할 분담**: 생성 = Codex · 치수 검증/합성/게임 적용 = Claude
> 치수 근거는 [pot-spec.svg](pot-spec.svg), 전체 배경은 [DESIGN-BRIEF.md](DESIGN-BRIEF.md)
>
> **개정 3 은 §7 하나뿐입니다.** 나머지(§1~§6)는 그대로 유효하고 재발주가 아닙니다.

---

## 0. 이번 개정 요약 — 무엇이 바뀌었나

게임 **레이아웃이 가로 배치 → 세로 등반**으로 바뀝니다.

기존: 마당에 서서 옆으로 던짐. 세로 화면인데 플레이 영역이 화면의 **17%**밖에 안 됐습니다.
변경: **누각을 한 층씩 올라가며** 던짐. 발사대가 매 층 좌↔우로 바뀌고, 한 발이 화면을 가로지르며
한 층 오릅니다. 같은 난이도에서 플레이 영역이 **42%**로 늘어납니다.

| | 조치 |
|---|---|
| 항아리 3분할 · 화살 | **그대로 유효** — 이미 발주한 내용 변경 없음 |
| 가로 배경 3종 (`bg-sky` / `bg-hills` / `bg-ground`) | **폐기** — 세로 배경으로 대체 |
| 사대(멍석) · 깃대 | **폐기** — 층 발판으로 대체 |
| 누각 기둥 · 층 발판 · 세로 배경 | **신규** |

> ⚠️ **무대 설정은 확정 전입니다.** 아래는 *누각(樓閣)/석탑* 기준으로 썼습니다.
> 산길·절벽 등으로 바뀌면 §4 의 형태 묘사만 교체하면 되고, 치수 제약(§5)은 그대로입니다.
> 작업 착수 전에 이 한 가지만 확인해 주세요.

---

## 1. 공통 규칙 (변경 없음)

| | |
|---|---|
| 출력 경로 | `D:/AI/workspace/game/images/` |
| 파일명 | 영문 소문자 + 하이픈, 지시서에 적힌 이름 그대로 |
| 포맷 | PNG-24 + **알파**, sRGB, 투명 배경 |
| 금지 | 텍스트 · 워터마크 · 외곽선 · 사실적 3D 렌더 · 포토리얼 |

**스타일 토큰** — 모든 프롬프트 끝에 붙일 것:

```
clean 2D vector game art, flat cel shading with exactly 3 tone steps
(highlight / midtone / shadow), one light source from the UPPER RIGHT,
no outline stroke, no gradient mesh, no photorealistic rendering,
no 3D render look, no text, no watermark,
fully transparent background, object centered, mobile game sprite
```

**팔레트** — 이 HEX 만 사용:

| 역할 | HEX |
|---|---|
| 옹기 하이라이트 / 중간 / 그림자 | `#9c6c3c` / `#6b4a2a` / `#5a3e22` |
| 구멍 내부 | `#241607` |
| 목재 기둥 (하이라이트/중간/그림자) | `#a8763f` / `#7a5331` / `#513520` |
| 기와 (하이라이트/중간/그림자) | `#6d7d86` / `#4a5a64` / `#32424c` |
| 단청 포인트 | `#2f7a6a` · `#b4463c` · `#e8c24e` |
| 석재 발판 | `#9aa0a0` / `#6f7676` / `#4b5151` |
| 대나무(화살대) `#caa15a` · 촉 `#e8534e` · 깃 `#e9edf2` |
| 강조 `#ffe14d` / `#ffcf5c` · 텍스트 크림 `#ffe6b0` |

---

## 2. 그대로 유효 — 재발주 아님

아래는 **개정 1에서 발주한 그대로** 진행해 주세요. 세로 등반으로 바뀌어도 변경 없습니다.

- `tuho-pot-body.png` · `tuho-pot-rim.png` · `tuho-pot-ear.png` (분할 3종) — **P0**
- `tuho-pot-gold.png` (황금 변주)
- ~~`tuho-pot-night.png`~~ — **불필요.** 밤 변주를 없앴다(고도가 오르면 하늘이 저절로 밤이 된다). 아직 안 만들었다면 **중단**
- `tuho-arrow.png` · `tuho-arrow-stuck.png` · `tuho-arrow-stuck-gold.png` — **P0**

항아리 치수 제약([pot-spec.svg](pot-spec.svg))도 그대로입니다: 귀 폭 = 입구 × 0.30,
귀 중심 = ± 입구 × 0.75, 귀 외곽 = ± 입구 × 0.90, 세 구멍의 림 높이가 **정확히 같을 것**.

> 화살은 이제 **좌우 양방향으로 날아갑니다.** 코드에서 좌우 반전하므로 에셋은 1종이면 되지만,
> **좌우 반전해도 어색하지 않게** 그려 주세요 (한쪽에만 있는 비대칭 장식 금지).

---

## 3. 폐기

`tuho-bg-sky` · `tuho-bg-hills` · `tuho-bg-ground` · `tuho-mat` · `tuho-windpole` · `tuho-windflag`
— 가로 배치 전제라 쓰지 않습니다. **아직 작업 전이면 중단해 주세요.**
(깃발은 세로 배경 쪽에서 다시 요청합니다 — §4-5)

---

## 4. 신규 에셋

### 4-1. `tuho-tower-column.png` — 누각 기둥 (P0, 420×900, **세로 심리스**)

플레이어가 끝없이 올라가므로 **세로로 이어붙여도 이음선이 없어야** 합니다.

```
A vertical slice of a Korean traditional wooden pavilion tower (누각), seen
straight on in front orthographic elevation, NO perspective.
Two sturdy timber pillars running the full height, joined by horizontal beams
at regular intervals, with simple dancheong-style painted bands where the beams
meet the pillars. Between the pillars, dark recessed shadow so the structure
reads as depth without detail.
The pattern must repeat exactly: the top edge and the bottom edge must line up
so copies stack vertically with NO visible seam.
Timber in #a8763f / #7a5331 / #513520, dancheong accents in #2f7a6a, #b4463c
and #e8c24e used sparingly as thin bands only.
The column occupies the full image width; nothing may extend past the left or
right edges.
[공통 스타일 토큰]
```

**수락 기준** — 위아래로 2장 이어붙였을 때 이음선이 보이지 않을 것. 좌우 대칭.

### 4-2. `tuho-tier.png` — 층 발판 (P0, 640×260)

각 층의 바닥. 항아리와 궁사가 이 위에 섭니다. **오른쪽으로 뻗은 형태 1종**만 주시면
왼쪽은 코드에서 반전합니다.

```
A single tier of a Korean pavilion tower seen in front orthographic elevation:
a tiled roof eave sweeping out to the RIGHT with the characteristic gentle
upward curve at its tip, and directly beneath it a flat stone-and-timber
balcony floor that juts out to the right, edged with a low wooden railing.
The flat walking surface of the balcony must be clearly readable and perfectly
HORIZONTAL — game objects stand on it.
The LEFT edge of the image is where this tier meets the tower column: cut it
off flat there, with no finishing, so it butts seamlessly against the column.
Roof tiles in #6d7d86 / #4a5a64 / #32424c, timber in #a8763f / #7a5331,
stone floor in #9aa0a0 / #6f7676, thin dancheong band under the eave.
[공통 스타일 토큰]
```

**수락 기준**
- 발판 윗면이 **수평**이고, 그 y좌표를 `ANCHORS.md` 에 px 로 적을 것 ← 이게 없으면 조립 불가
- 왼쪽 가장자리가 수직으로 잘려 기둥에 붙음
- 좌우 반전해도 자연스러울 것 (기와 곡선은 반전되어도 무방)

### 배경 3종 — 구현이 끝나 사용 방식이 확정됐습니다

⚠️ **파일 크기 제약**: 게임은 단일 HTML 파일이고 에셋은 **base64 로 인라인**됩니다.
지금까지 받은 것들이 9~21KB 라 가볍습니다. 배경도 그 수준을 유지해 주세요.
평평한 색면은 아주 잘 압축되고, **사진 같은 노이즈·그레인은 파일을 10배로 불립니다.**

코드가 각각을 어떻게 쓰는지 알고 그려 주셔야 합니다.

| 파일 | 코드가 하는 일 |
|---|---|
| `tuho-sky-tall` | 가로로 **화면 폭까지 늘려** 깖니다. 층이 오를수록 이미지의 위쪽을 보여 줍니다 |
| `tuho-clouds` | 가로로 반복하며 바람 방향으로 흘립니다. 고도가 오르면 아래로 내려갑니다 |
| `tuho-stars` | 가로·세로로 반복하고, 고도에 따라 투명도를 올립니다 |

### 4-3. `tuho-sky-tall.png` — 고도별 하늘 (P1, **128 × 4096**)

> 가로 128px 이면 충분합니다. 순수 세로 그라디언트라 코드가 가로로 늘려 쓰고,
> 그만큼 파일이 작아집니다. 가로 방향 무늬를 넣지 마세요(늘리면 뭉갭니다).

```
One very tall vertical gradient strip, 128 wide by 4096 high, showing a sky
changing with altitude, read from the BOTTOM upward:
  bottom   warm late-afternoon haze   #caa36e
  lower    soft teal-blue daylight    #4a6a7e
  middle   deepening clear blue       #24405e
  upper    dusk indigo                #1a2a4a
  top      deep night                 #0b1430
Pure vertical gradient only: every horizontal row is ONE flat colour, so the
strip can be stretched to any width without artefacts.
Transitions long and completely smooth, no visible banding.
No stars, no sun, no moon, no horizon line, no ground, no clouds, no objects.
flat vertical gradient, no text, no watermark
```

### 4-4. `tuho-clouds.png` — 구름 띠 (P1, **1024 × 400**, 가로 심리스)

```
A horizontal band of soft flat-shaded clouds, side view at eye level, as if you
are flying past them. Pale warm white #fdf6ea with one soft shadow tone #d8c7b4
underneath — two tones only, no gradients inside the clouds.
Wispy and low contrast, with plenty of FULLY TRANSPARENT gaps between clumps so
the sky shows through; the band must not read as a solid wall.
Horizontally seamless and tileable — left and right edges must match exactly.
Top and bottom edges fade to fully transparent.
flat illustration, no outline stroke, no noise or grain, no text, no watermark,
transparent background
```

**수락 기준** — 가로로 2장 이어붙여 이음선이 없을 것. 투명 영역이 전체의 절반 이상일 것.

### 4-5. `tuho-stars.png` — 별 (P2, **512 × 512**, 가로·세로 심리스)

지금은 코드가 균일한 2px 점으로 그리고 있어 밋밋합니다.

```
A seamless tiling star field on a fully transparent background, 512x512.
Small white dots of varied size (1 to 3 pixels) and varied brightness
(from 30% to 100% opacity), scattered irregularly — not on a grid, with some
empty patches and some denser clusters. A handful of slightly larger stars with
a faint cross-shaped glint.
Pure white only, no colour, no nebula, no glow halos, no constellations.
Must tile seamlessly both horizontally and vertically.
no text, no watermark, transparent background
```

### 4-5. `tuho-windvane.png` — 풍향 깃발 (P1, 360×200)

깃대는 층 발판에 꽂힙니다. **깃발만 중립 흰색으로** 주세요 — 코드가 색을 바꾸고 펄럭임을 변형합니다.

```
A small triangular cloth pennant on a short ring mount, fluttering to the RIGHT,
isolated. Plain NEUTRAL WHITE with only soft fold shading in light grey — no
colour, no pattern, no emblem. The attachment point (the short vertical edge)
is at the LEFT edge of the frame, vertically centred. No pole.
[공통 스타일 토큰]
```

### 4-6. `tuho-ground-base.png` — 1층 바닥 마당 (P2, 1290×700)

탑의 맨 아래. 시작 지점에서만 보입니다.

```
The stone courtyard at the foot of a Korean pavilion tower, seen in front
orthographic elevation: a broad flagstone terrace with a few worn steps, low
stone balustrade, and packed earth beyond. Warm late-afternoon light.
Stone in #9aa0a0 / #6f7676 / #4b5151, earth in #7a5832 / #43301c.
The top edge is where the tower's first tier sits — keep it flat and plain.
flat illustration, soft, no text, no watermark
```

### 4-7. 궁사 (P2) — 개정 1 과 동일

`tuho-archer-idle.png` · `tuho-archer-sheet.png` 그대로입니다. 다만 이제 발판 위에 서므로
**발바닥이 이미지 하단에 정확히 닿도록** 그려 주세요(접지선이 명확해야 합니다).

---

## 4-6 ~ 4-8. 당겨서 쏘기 UI (P0 — 조작 개편)

조작을 **2탭 스윕 → 당겼다 놓기**로 바꿉니다. 당기는 동안 플레이어가 보는 것이
게임의 전부가 되므로, 이 3종이 새 P0 입니다.

### 4-6. `tuho-pull-ring.png` — 당김 표시 (P0, 512×512)

궁사를 중심으로 깔리는 링. 코드가 **당긴 길이만큼 링을 채워** 힘을 보여 줍니다.
(게이지 바를 없애고 손가락 아래에서 바로 읽히게 하려는 것입니다)

```
A circular power ring for a mobile game, top-down flat view, centred.
A thin outer ring of small tick marks like a compass bezel, and inside it a
clean empty track that the game fills clockwise to show draw strength.
Korean traditional feel: the ticks are tiny lacquer-red and gold dashes, the
track is dark translucent charcoal, the outer edge has a very thin brass line.
The exact centre must be completely EMPTY and transparent for a radius of
about 30% — the archer stands there and must not be covered.
Flat, low contrast, readable on both a bright sky and dark ground.
clean 2D vector game UI, flat shading, no outline stroke, no gradient mesh,
no text, no numbers, no watermark, fully transparent background, centered
```

**수락 기준** — 중앙 30% 완전 투명 / 좌우·상하 대칭(회전해 쓰므로) / 눈금 간격 균일.

### 4-7. `tuho-reticle.png` — 구역 조준 표식 (P0, 256×256)

항아리의 **관(중앙) · 귀(좌우)** 를 겨냥할 수 있게 하는 표식입니다. 지금까지 3구역은
우연한 결과였는데, 이제 노리는 표적이 됩니다.

```
A small aiming reticle for a mobile game: a thin open circle with four short
tick marks at top, bottom, left and right, and a tiny dot at the exact centre.
Deliberately sparse — the target behind it must stay visible through the middle.
Single flat colour warm gold #ffcf5c, uniform line weight.
Must stay legible when scaled down to 28 pixels.
clean 2D vector game UI, flat, no outline stroke, no glow, no text,
no watermark, fully transparent background, centered
```

### 4-8. `tuho-hand-drag.png` — 조작 안내 (P1, 512×512)

첫 판에서 "당겼다 놓는다"를 알려 주는 그림입니다.

```
A simple tutorial hand cue for a mobile game: a stylised index finger pressing
a round touch point, with a short dashed arc trailing behind it showing a pull
back-and-down gesture, ending in a small open circle at the start position.
Flat warm cream #ffe6b0 finger with one shadow tone, dashed trail in white at
60% opacity. No arm, no wrist, no cuff — finger and trail only.
clean 2D vector game UI, flat, no outline stroke, no text, no watermark,
fully transparent background, centered
```

> 세 장 모두 **단색 위주 플랫**이라 각 5KB 안쪽이면 충분합니다.
> 기존 에셋(항아리·화살·누각·배경)은 **그대로 쓰며 재작업 없습니다.**

## 5. 세로 레이아웃 좌표 제약

실제 게임 수치입니다. 에셋이 이 안에서 작동해야 합니다.

```
기준 화면 375×812 (대응 320×568 ~ 430×932)

발사대 x = 화면폭의 16%        항아리 x = 화면폭의 84%
한 발의 가로 이동 = 화면폭의 68%   (218 ~ 292px)
한 층 상승        = 화면높이의 13~30%  (79 ~ 280px)
궤적 정점        = 발사대 위로 190 ~ 291px

탑 기둥 권장 폭   = 화면폭의 30%   (96 ~ 129px, 화면 중앙)
발판 돌출        = 화면폭의 20%   (64 ~ 86px, 기둥 양옆)
```

**중요** — 화살은 왼쪽 발판에서 출발해 **기둥 위를 넘어** 오른쪽 한 층 위 항아리로 들어갑니다.
기둥과 발판이 궤적을 가리지 않아야 하므로, **기둥은 좁고 낮은 대비로**(배경처럼) 그려 주세요.
발판 위로 솟은 구조물(난간 기둥, 등롱 등)은 **발판 윗면에서 20px 이내**로 제한합니다.

항아리 화면 크기는 기존과 동일합니다: **66~102 × 78~122 px**. @3x 가 상한입니다.

> `screen-layout.svg` 는 가로 배치 기준이라 현재 무효입니다. 세로 레이아웃 도면은
> 구현이 확정되는 대로 다시 그려 전달하겠습니다. 그 전까지는 위 수치를 기준으로 삼아 주세요.

---

## 6. 우선순위 / 수락

| | 파일 | 비고 |
|---|---|---|
| **P0** | `tuho-pot-body` `tuho-pot-rim` `tuho-pot-ear` | 개정 1 그대로 |
| **P0** | `tuho-arrow` `tuho-arrow-stuck` | 개정 1 그대로 · 좌우 반전 가능하게 |
| ~~P0~~ | ~~`tuho-tower-column` `tuho-tier`~~ | **납품 완료 · 검수 통과** (2026-11-03) |
| **P1** | `tuho-sky-tall` `tuho-clouds` | **다음 배치** · 규격은 §4-3, §4-4 (크기 바뀜) |
| P1 | `tuho-windvane` `tuho-stars` | |
| P1 | `tuho-pot-gold` | 개정 1 그대로 · `tuho-pot-night` 는 **취소** |
| P2 | `tuho-ground-base` `tuho-archer-*` `tuho-fx-*` `tuho-ui-*` | |

### 넘기기 전 확인

- [ ] 투명 배경 — 흰 테두리(halo) 없음 / 텍스트·워터마크·외곽선 없음
- [ ] 팔레트 HEX 만 사용 / 광원 **우측 상단** 통일
- [ ] `tuho-tower-column` 세로 2장 이어붙여 **이음선 없음**
- [ ] `tuho-clouds` 가로 2장 이어붙여 **이음선 없음**
- [ ] `tuho-tier` 발판 윗면이 수평 · **y좌표를 `ANCHORS.md` 에 기재**
- [ ] `tuho-tier` 좌우 반전해도 자연스러움
- [ ] 1x 축소 확인 (항아리 102px, 화살 42px, 발판 돌출 75px)
- [ ] 통짜 항아리를 보낼 경우 `node tools/check-pot-art.mjs <파일>` 통과

### 넘긴 뒤

Claude 가 ① 치수 실측·합성 ② 게임 적용 ③ 하네스 재실행(구역 판정으로
*보이는 구멍 = 적중 좌표* 확인) 을 수행합니다.

---

## 7. 개정 3 — `tuho-tower-column.png` 재발주 (P0, **420 × 1800**)

### 왜 다시 만드나

v0.7 을 실기기 크기로 처음 캡처해 보니, **누각 기둥이 화면에서 가장 큰 덩어리인데
가장 볼 것이 없었습니다.** 화면 폭의 28% 를 세로로 관통하는 평평한 갈색 띠로 읽히고,
스토어 썸네일에서는 "갈색 막대" 가 됩니다. 스크린샷 4장 모두에서 같은 문제입니다.

원인은 개정 2 의 프롬프트 문구입니다.

> Between the pillars, dark recessed shadow so the structure reads as depth
> **without detail.**

제가 "디테일 없이" 라고 적어서 납품물은 지시대로 나왔습니다. 납품 잘못이 아니라
발주 잘못이고, 이번 개정은 그 한 줄을 뒤집는 것입니다.

**두 번째 문제는 반복 주기입니다.** 현재 420×900 은 화면 폭 390 기준 234px 마다
되풀이되어 한 화면에 **3.6번** 들어갑니다. 눈에 띄게 반복적이라 높이를 2배로 늘려
한 화면에 1.8번만 보이게 합니다.

### 규격

| | |
|---|---|
| 파일명 | `tuho-tower-column.png` (**이름 그대로 교체**) |
| 크기 | **420 × 1800** (개정 2 는 900 → 세로 2배) |
| 심리스 | **세로** — 위아래로 이어붙여 이음선이 없을 것 |
| 알파 | 필요 (좌우 바깥은 투명) |

> 크기가 바뀌므로 Claude 가 적용 시 `COL_AR` 상수를 `900/420` → `1800/420` 으로
> 고칩니다(코드 한 줄). Codex 는 신경 쓰지 않아도 됩니다.

### 지켜야 하는 제약 (게임 코드가 의존합니다)

1. **좌우 끝까지 꽉 채울 것.** 발판(`tuho-tier`)이 기둥의 좌·우 가장자리에 정확히
   붙습니다. 가장자리는 발판이 얹힐 만한 **단단한 기둥**으로 보여야 합니다.
2. **맨 위 60px 과 맨 아래 60px 은 변화 없는 같은 단면**으로. 이음매가 그 구간에
   생기므로, 거기에 무늬가 있으면 이어붙인 자리가 튑니다. 검증기가 이걸 봅니다.
3. **값(명도)을 어둡게 유지.** 기둥 위로 항아리·화살·파티클·HUD 글자가 올라갑니다.
   디테일은 넣되 **실루엣과 대비는 낮게** — 배경이지 주인공이 아닙니다.
4. **낮 하늘(따뜻한 베이지)과 밤 하늘(짙은 남색) 양쪽에서 읽힐 것.** 고도가 오르면
   하늘이 바뀌고, 기둥은 알파 0.9 로 그 위에 깔립니다.
5. 좌우 대칭.

### 원하는 리듬 (1800px 안에 2칸)

```
 0 ~  60   평평한 보 — 이음매 구간 (무늬 없음)
60 ~ 480   살창(창살) 칸 — 격자 사이로 어두운 실내
480~ 620   단청 보 + 짧은 기와 처마 — 가로로 끊어 주는 띠
620 ~1180  판벽(나무 널) 칸 — 세로 널 이음새만, 창은 없음
1180~1320  단청 보 + 기와 처마 (480~620 과 같은 요소, 색만 다르게)
1320~1740  살창 칸 (두 번째)
1740~1800  평평한 보 — 0~60 과 **픽셀 단위로 동일**
```

살창 칸과 판벽 칸을 번갈아 두면, 2배로 길어진 타일이 한 번 더 반복돼도
"같은 그림" 으로 읽히지 않습니다.

### 프롬프트

```
A vertical slice of a Korean traditional wooden pavilion tower (누각), seen
straight on in front orthographic elevation, NO perspective, NO vanishing point.

Two sturdy timber pillars run the full height at the far left and far right
edges, touching both edges. Between them the wall is NOT empty: it alternates
between two bays stacked vertically —
(a) a latticework window bay (살창): a fine wooden grid of thin vertical and
    horizontal muntins, with deep dark interior visible between the bars;
(b) a plank wall bay (판벽): vertical timber boards with simple seam lines,
    no window.
Between the bays run horizontal tie-beams carrying narrow dancheong painted
bands and a short tiled eave lip that casts a thin shadow on the bay below.

The top 60 pixels and the bottom 60 pixels must be a plain uninterrupted beam
section, identical to each other, so that stacked copies join with NO visible
seam. The pattern must tile seamlessly in the vertical direction.

Keep the whole column LOW CONTRAST and DARK in value — it is a background
element that gameplay objects are drawn on top of. The lattice and planks
should read as texture, not as bright detail. Left-right symmetric.

Timber in #a8763f / #7a5331 / #513520, recessed interior near #2a1b10,
dancheong accents in #2f7a6a, #b4463c and #e8c24e used sparingly as thin
bands only. Nothing may extend past the left or right edges; outside the
column is fully transparent.
[공통 스타일 토큰]
```

### 수락 기준

```bash
node tools/check-tower-art.mjs <파일>
```

- 위아래 끝줄 일치(이음새 없음) · 위·아래 60px 이 일정한 단면
- 풀블리드(위·아래 가장자리까지 기둥이 닿음) · 위아래 단면 폭 동일 · 좌우 대칭
- **눈 검사**: 2장을 세로로 이어붙여 1:1 로 보았을 때 ① 이음선이 안 보이고
  ② 살창 칸과 판벽 칸이 번갈아 나와 "같은 그림 반복" 으로 읽히지 않을 것
- **대비 검사**: 기둥 위에 흰 글자(HUD)를 얹어도 글자가 묻히지 않을 것

### 같이 보면 좋은 것

현재 화면이 어떤지는 `store-assets/shot1-throw.png` ~ `shot4-mark.png` 네 장을
보시면 됩니다. 기둥이 차지하는 면적과 주변 하늘(낮/밤)이 그대로 들어 있습니다.

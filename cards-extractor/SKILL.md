---
name: cards-extractor
description: Extract all player cards from an FC 26 Ultimate Team squad screenshot and identify them via database lookup
argument-hint: <image-path>
---

# FC 26 Squad Cards Extractor

Extract player cards from a squad screenshot using **GPT-5.2 Pro** for vision extraction, then identify each player via database lookup. **NEVER guess player names** — always let the DB confirm identity.

## Input

`$ARGUMENTS` is the path to a squad screenshot image (jpg/png).

## Step 1: Extract Card Attributes via GPT-5.2 Pro

Send the screenshot to OpenAI's GPT-5.2 Pro vision model using the Bash tool. This model has superior club badge and flag recognition compared to other approaches.

```bash
python3 -c "
import base64, json, urllib.request

with open('IMAGE_PATH', 'rb') as f:
    img_data = base64.b64encode(f.read()).decode('utf-8')

prompt = '''You are an elite EA Sports FC / FIFA Ultimate Team squad extraction agent.
Your task is to analyze a squad screenshot and extract ALL 11 starting players with full accuracy.
You MUST extract exactly eleven players. If fewer than eleven are detected, re-scan the image before answering.

MANDATORY REASONING PIPELINE — Follow this internal process before producing the answer:

STEP 1 — STRUCTURAL SCAN (do NOT identify players yet):
1. Identify formation from card placement and on-screen text.
2. Count visible player cards. Confirm exactly 11 starting players.
3. For each card, identify: position label, rating number, nationality flag, club badge, card design (color + promo style).

STEP 2 — CARD TYPE CLASSIFICATION (classify by visual style):
- White + gold trim = Icon
- Blue crystalline = Team of the Year (TOTY)
- Gold standard = Gold Rare
- Light blue = Team of the Season (TOTS)
- Red = FUT Champions
- Green = Seasonal Promo / Evolution
- Orange/fire = Thunderstruck
- Pink = FUT Fantasy
- Purple = RTTK
- Black animated = Fire/Ice Promo

STEP 3 — PLAYER IDENTIFICATION LOGIC:
- Identify player ONLY if: rating matches known version, position matches playable card, club badge matches, nationality matches flag.
- If any mismatch exists, re-evaluate before confirming.
- If uncertain, set player_name to "Unknown" and add note in confidence_notes.
- Never invent players. Never guess based on face similarity alone.

STEP 4 — COMPLETENESS CHECK (CRITICAL):
- Count extracted players. If count != 11, rescan and correct.
- Ensure no duplicate positions unless formation allows it.
- Ensure formation matches extracted positions.
- Do not output answer until exactly 11 players are extracted.

OUTPUT: Return ONLY valid JSON (no markdown fences, no extra text) with this exact structure:

{
  "formation": "4-3-3",
  "coins": 150000,
  "chemistry": 33,
  "players": [
    {
      "slot": "GK",
      "player_name": "Unknown",
      "rating": 90,
      "position": "GK",
      "card_type": "Gold Rare",
      "nationality": "Brazil",
      "club": "Liverpool",
      "role_plus": "",
      "confidence_notes": "Clear card visible"
    }
  ],
  "verification": {
    "total_players": 11,
    "formation_matches_positions": true,
    "confidence": "High"
  }
}

JSON FIELD RULES:
1. "formation" - Read the EXACT formation text shown on screen. Include variant in parentheses if shown: "4-3-3 (4)", "4-1-2-1-2", etc.
2. "coins" - Coin balance from top of screen (number only)
3. "chemistry" - Team chemistry number (e.g., 33 from "33/33")
4. "players" - Exactly 11 starting players (no bench/reserves)
5. "slot" - Use ENGLISH abbreviations with L/R prefixes for paired positions:
   GK, LB, LCB, CB, RCB, RB, LWB, RWB, LM, LCM, CM, RCM, RM, CDM, LDM, RDM, CAM, LAM, RAM, LW, LF, CF, RF, RW, LS, ST, RS
6. "rating" - Overall rating number on the card
7. "card_type" - One of: Gold, Gold Rare, Icon, Hero, TOTY, TOTS, Thunderstruck, Evolution, FUT Champions, FUT Fantasy, RTTK, Special, Unknown
8. "nationality" - Nation from the flag on the card. Be precise with similar flags.
9. "club" - Use DB-friendly short names: "Paris SG", "Spurs", "Man Utd", "Man City", "Nott'"'"'m Forest". If badge is unreadable, use "Unknown".
10. "role_plus" - Special role indicator if visible (e.g., "ST++", "CDM++", ""). Empty string if none.
11. "confidence_notes" - Brief note about detection confidence

POSITION TRANSLATION (if screenshot is in French/Spanish/other):
G/GB->GK, DG->LB, DD->RB, DC->CB, DCG->LCB, DCD->RCB, PDG->LWB, PDD->RWB
MG->LM, MD->RM, MC->CM, MCG->LCM, MCD->RCM, MDC->CDM, MOC->CAM
AG->LW, AD->RW, BU->ST, AVG->LF, AVD->RF, AVC->CF'''

api_key = open('/Users/omardoucoure/Documents/OmApps/futevo/backend/.env.local').read()
api_key = [l.split('=', 1)[1].strip().strip('\"') for l in api_key.splitlines() if l.startswith('OPENAI_API_KEY')][0]

payload = {
    'model': 'gpt-5.2-pro',
    'input': [{'role': 'user', 'content': [
        {'type': 'input_image', 'image_url': f'data:image/jpeg;base64,{img_data}'},
        {'type': 'input_text', 'text': prompt}
    ]}]
}

req = urllib.request.Request(
    'https://api.openai.com/v1/responses',
    data=json.dumps(payload).encode('utf-8'),
    headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'}
)

with urllib.request.urlopen(req, timeout=180) as resp:
    result = json.loads(resp.read())
    for item in result.get('output', []):
        if item.get('type') == 'message':
            for content in item.get('content', []):
                if content.get('type') == 'output_text':
                    print(content['text'])
"
```

**Replace `IMAGE_PATH`** with the actual `$ARGUMENTS` path. The script:
1. Reads the OPENAI_API_KEY from the backend `.env.local`
2. Sends the image to GPT-5.2 Pro via the Responses API
3. Returns structured JSON with all 11 players' attributes

### Parse the GPT-5.2 Pro output

The response is a JSON object. Extract:
- `formation`, `coins`, `chemistry` — squad-level info
- `players[]` — array of 11 objects with `slot`, `rating`, `position`, `nationality`, `club`, `card_type`

## Step 2: Database Lookup

For each player from the GPT-5.2 Pro output, query the backend API via SSH:

```bash
ssh root@159.223.103.16 'curl -s "http://localhost:3004/api/players-db?overall=RATING&position=POSITION&nationality=NATIONALITY&club=CLUB&limit=3"'
```

### Query rules:
- Always include `overall` and `limit=3`
- Include `nationality` if GPT-5.2 Pro detected it
- Include `club` if GPT-5.2 Pro detected it (skip if "Unknown")
- Include `position` if the base position is clear (ST, CAM, CB, GK, etc.)
- If a query returns NO RESULTS, retry **without** `position` (players can play off-position via role changes)
- If still no results, retry **without** `club` (some Icons have null club)
- Use **exact DB club names**: "Paris SG", "Spurs", "Man Utd", "Man City", "FC Bayern München", "FC Barcelona", "Real Madrid", "Chelsea", "Liverpool", "Arsenal", "Aston Villa", "Nott'm Forest"

### Parse the response:
```python
data["data"][0]["name"]      # Player name
data["data"][0]["eaId"]      # EA ID
data["data"][0]["club"]      # Club
data["data"][0]["position"]  # Position
data["data"][0]["overall"]   # Rating
```

### Disambiguation when multiple candidates returned

When the DB returns 2-3 candidates, disambiguate using ALL available cues:
1. **Nationality flag** — GPT-5.2 Pro's detection is highly accurate (11/11 in testing)
2. **Player face/appearance** — Read the original screenshot with the Read tool, look at skin tone, hair style, facial features and compare to known candidates
3. **Card context** — club badge, card type, position label can narrow it down

Do NOT guess names from faces alone, but DO use face as a disambiguation tool when the DB returns 2-3 candidates.

### Run all 11 lookups efficiently
Batch the SSH curl calls in parallel using multiple Bash tool calls.

## Step 3: Present Results

Output a clean summary table:

```
## Squad: [Team Name]
Formation: X-X-X | Chemistry: X/X | Coins: X | Rating: X

| Slot | Rating | Player Name | Club | Nationality | Card Type | ea_id |
|------|--------|-------------|------|-------------|-----------|-------|
| GK   | 89     | Alisson     | Liverpool | Brazil | Gold Rare | 212831 |
| ...  | ...    | ...         | ...  | ...         | ...       | ...   |
```

For evolution/special cards where the DB base rating differs from the screenshot rating, note it:
> "LB: Lucas Digne — 88 on card (base 80, evolution/special card)"

## Nationality Flag Reference

This reference is used as a fallback if GPT-5.2 Pro returns "Unknown" for nationality, or for disambiguation when the DB returns multiple candidates.

### EUROPE — Top Football Nations

| Country | DB Name | Layout | Colors (L→R or T→B) | Key Feature |
|---------|---------|--------|---------------------|-------------|
| France | France | 3 vertical stripes | Blue, White, Red | Equal-width vertical tricolor |
| England | England | White + red cross | White background | Red cross of St. George |
| Germany | Germany | 3 horizontal stripes | Black, Red, Gold | Black on top |
| Spain | Spain | 3 horizontal stripes | Red, Yellow (wide), Red | Yellow stripe is 2× wider |
| Italy | Italy | 3 vertical stripes | Green, White, Red | Similar to Ireland but green is brighter |
| Portugal | Portugal | 2 vertical sections | Green (left ⅓), Red (right ⅔) | Green-red split with coat of arms at border |
| Netherlands | Netherlands | 3 horizontal stripes | Red, White, Blue | Similar to France but HORIZONTAL |
| Belgium | Belgium | 3 vertical stripes | Black, Yellow, Red | Black on left |
| Croatia | Croatia | 3 horizontal stripes | Red, White, Blue | Red-white checkerboard shield in center |
| Poland | Poland | 2 horizontal stripes | White, Red | White on top, red on bottom |
| Denmark | Denmark | Red + white cross | Red background | White Scandinavian cross offset left |
| Sweden | Sweden | Blue + yellow cross | Blue background | Yellow Scandinavian cross offset left |
| Norway | Norway | Red + blue/white cross | Red background | Blue cross outlined in white |
| Switzerland | Switzerland | Red + white cross | Red square | White plus-sign cross centered |
| Austria | Austria | 3 horizontal stripes | Red, White, Red | Red-white-red |
| Turkey | Turkey | Red + white crescent | Red background | White crescent moon + star |
| Scotland | Scotland | Blue + white X | Blue background | White diagonal cross (saltire) |
| Wales | Wales | 2 horizontal + dragon | White, Green | Red dragon on white-green |
| Ireland | Ireland | 3 vertical stripes | Green, White, Orange | Similar to Italy but orange not red |
| Czech Republic | Czech Republic | 2 horizontal + triangle | White, Red + blue triangle | Blue triangle on left |
| Serbia | Serbia | 3 horizontal stripes | Red, Blue, White | Red on top, coat of arms |
| Ukraine | Ukraine | 2 horizontal stripes | Blue, Yellow | Blue on top, yellow on bottom |
| Romania | Romania | 3 vertical stripes | Blue, Yellow, Red | Similar to Chad |
| Hungary | Hungary | 3 horizontal stripes | Red, White, Green | Red on top |
| Greece | Greece | 9 horizontal stripes | Blue, White alternating | Blue square + white cross top-left |
| Albania | Albania | Red + black eagle | Red background | Black double-headed eagle |

### SOUTH AMERICA

| Country | DB Name | Layout | Colors (L→R or T→B) | Key Feature |
|---------|---------|--------|---------------------|-------------|
| Brazil | Brazil | Green + yellow diamond | Green background | Yellow diamond with blue globe + white stars |
| Argentina | Argentina | 3 horizontal stripes | Light blue, White, Light blue | Sun of May in center |
| Colombia | Colombia | 3 horizontal stripes | Yellow (wide), Blue, Red | Yellow is 2× wider than others |
| Uruguay | Uruguay | 9 horizontal stripes | White, Blue alternating | Sun of May in white canton top-left |
| Chile | Chile | 2 horizontal + canton | White (top), Red (bottom) | Blue square + white star top-left |
| Peru | Peru | 3 vertical stripes | Red, White, Red | Red-white-red vertical |
| Ecuador | Ecuador | 3 horizontal stripes | Yellow (wide), Blue, Red | Very similar to Colombia, coat of arms |
| Venezuela | Venezuela | 3 horizontal stripes | Yellow, Blue, Red | Equal width, arc of stars in blue |
| Paraguay | Paraguay | 3 horizontal stripes | Red, White, Blue | Different emblems on each side |
| Bolivia | Bolivia | 3 horizontal stripes | Red, Yellow, Green | Red on top |

### AFRICA — Top Football Nations

| Country | DB Name | Layout | Colors (L→R or T→B) | Key Feature |
|---------|---------|--------|---------------------|-------------|
| Nigeria | Nigeria | 3 vertical stripes | Green, White, Green | Green-white-green |
| Cameroon | Cameroon | 3 vertical stripes | Green, Red, Yellow | Star in center red stripe |
| Senegal | Senegal | 3 vertical stripes | Green, Yellow, Red | Green star in center yellow stripe |
| Ghana | Ghana | 3 horizontal stripes | Red, Gold, Green | Black star in center gold stripe |
| Côte d'Ivoire | Côte d'Ivoire | 3 vertical stripes | Orange, White, Green | Like Ireland reversed |
| Morocco | Morocco | Red + green star | Red background | Green 5-pointed star (pentagram) |
| Algeria | Algeria | 2 vertical halves | Green, White | Red crescent + star in center |
| Tunisia | Tunisia | Red + white circle | Red background | White circle with red crescent + star |
| Egypt | Egypt | 3 horizontal stripes | Red, White, Black | Golden eagle in center white |
| South Africa | South Africa | Y-shape + 6 colors | Red, White, Blue, Green, Black, Gold | Green Y-shape outlined in white/gold |
| DR Congo | DR Congo | Blue + red diagonal | Blue background | Red diagonal stripe bordered yellow, yellow star top-left |
| Mali | Mali | 3 vertical stripes | Green, Gold, Red | Similar to Guinea but gold not yellow |
| Guinea | Guinea | 3 vertical stripes | Red, Yellow, Green | Same colors as Mali, reversed order |
| Burkina Faso | Burkina Faso | 2 horizontal + star | Red, Green | Yellow star in center |
| Gabon | Gabon | 3 horizontal stripes | Green, Yellow, Blue | Green-yellow-blue |
| Congo | Congo | Diagonal | Green, Yellow, Red | Yellow diagonal from bottom-left to top-right |
| Togo | Togo | 5 horizontal stripes | Green, Yellow alternating | Red canton + white star top-left |
| Zambia | Zambia | Green + tricolor | Green background | Orange, Black, Red vertical stripes bottom-right, eagle |
| Zimbabwe | Zimbabwe | 7 horizontal stripes | Green, Gold, Red, Black + white triangle | White triangle with red star + bird |

### NORTH/CENTRAL AMERICA & CARIBBEAN

| Country | DB Name | Layout | Colors | Key Feature |
|---------|---------|--------|--------|-------------|
| Mexico | Mexico | 3 vertical stripes | Green, White, Red | Eagle on cactus in center |
| United States | United States | Stripes + canton | Red, White stripes + blue canton | 50 white stars, 13 stripes |
| Canada | Canada | Vertical bands + leaf | Red, White, Red | Red maple leaf in center |
| Jamaica | Jamaica | Diagonal cross | Green, Black, Gold | Gold diagonal X (saltire) |
| Costa Rica | Costa Rica | 5 horizontal stripes | Blue, White, Red (wide), White, Blue | Red center stripe is wider |
| Honduras | Honduras | 3 horizontal stripes | Blue, White, Blue | 5 blue stars in center |

### ASIA & OCEANIA

| Country | DB Name | Layout | Colors | Key Feature |
|---------|---------|--------|--------|-------------|
| Japan | Japan | White + red circle | White background | Red circle (rising sun) |
| South Korea | Korea Republic | White + yin-yang | White background | Red-blue yin-yang + 4 black trigrams |
| Australia | Australia | Blue + Union Jack + stars | Blue background | Union Jack top-left, white Southern Cross stars |
| Saudi Arabia | Saudi Arabia | Green + white text | Green background | White Arabic calligraphy + sword |
| Iran | Iran | 3 horizontal stripes | Green, White, Red | Allah emblem in center |
| China PR | China PR | Red + yellow stars | Red background | Large yellow star + 4 small stars |

### Disambiguation Tips for Similar Flags

| Confusing Pair | How to Tell Apart |
|---------------|------------------|
| France vs Netherlands | France = VERTICAL stripes. Netherlands = HORIZONTAL stripes |
| Italy vs Ireland | Italy = brighter green, RED right stripe. Ireland = darker green, ORANGE right stripe |
| Cameroon vs Senegal | Cameroon = green-RED-yellow (star on red). Senegal = green-YELLOW-red (star on yellow) |
| Nigeria vs Côte d'Ivoire | Nigeria = GREEN-white-green. Côte d'Ivoire = ORANGE-white-green |
| Colombia vs Ecuador | Very similar. Colombia = NO coat of arms. Ecuador = coat of arms in center |
| Argentina vs Uruguay | Argentina = 3 wide stripes. Uruguay = 9 narrow stripes, sun in canton |
| Romania vs Chad | Virtually identical (blue-yellow-red vertical). Context from club/league helps |
| Germany vs Belgium | Germany = HORIZONTAL (black-red-gold). Belgium = VERTICAL (black-yellow-red) |
| Poland vs Indonesia | Both white-red horizontal. Poland in football context far more likely |
| Guinea vs Mali | Guinea = RED-yellow-green. Mali = GREEN-gold-red (reversed order) |
| Morocco vs Tunisia | Both red. Morocco = green star outline. Tunisia = white circle with crescent |
| Algeria vs Nigeria | Algeria = green-WHITE halves. Nigeria = GREEN-white-GREEN stripes |

## Common Pitfalls
- **Don't guess names**: A 97 French ST at PSG is Dembélé, not Mbappé. Only the DB knows.
- **Icons have no club**: Their club field is null in the DB. Search by rating + position + nationality only.
- **Evolution cards**: A card showing 88 might have a base of 80 in the DB. Match the closest available version.
- **Position labels vary by language**: French screenshots show DG/DD/MC/BU etc. Always translate to English.
- **Club name format matters**: "Paris SG" not "Paris Saint-Germain", "Spurs" not "Tottenham Hotspur"
- **Women's players in DB**: The API may return women's players (e.g., Alessia Russo 97 ST England). Filter by league — Icons league = "Icons", women's league contains "Women's".
- **GPT-5.2 Pro is the primary extractor**: Trust its club/flag detection over manual visual analysis. It scored 11/11 on nationality and outperformed other models on club badges (especially Evolution cards).

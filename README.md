ROKYTA – export projektu

Obsah:
- ROKYTA/dist: kompletná webová prehliadka, JavaScript, modely, textúry a pôdorysy.
- ROKYTA/source: pomocné skripty na prípravu údajov. Niektoré vyžadujú pôvodné vstupné výkresy a úpravu ciest.
- Rokyta-historia.bundle: samostatná záloha celej histórie aktuálnej vetvy (39 commitov).

NAHRATIE CEZ GITHUB DESKTOP
1. Rozbaľ ZIP.
2. V GitHub Desktop otvor svoj repozitár Rokyta a klikni Show in Explorer.
3. Do tohto priečinka skopíruj OBSAH priečinka ROKYTA z exportu (dist, source, README.md a .gitignore).
4. V GitHub Desktop sa zobrazia zmeny. Do Summary napíš Import projektu Rokyta a klikni Commit to main.
5. Publish repository vytvára nový repozitár. Ak už itpcs-no/ROKYTA existuje, naklonuj ho cez File > Clone repository > URL do iného prázdneho priečinka a skopíruj obsah ROKYTA tam; potom Commit to main a Push origin.

SPUSTENIE NA POČÍTAČI
S nainštalovaným Pythonom otvor terminál v priečinku ROKYTA a spusti:
  python -m http.server 8000 --directory dist
Potom otvor http://localhost:8000 v prehliadači.
index.html neotváraj dvojklikom: aplikácia používa JavaScript moduly a načítavanie súborov cez HTTP.

ZACHOVANIE HISTÓRIE (voliteľné, pre používateľa Gitu)
Bundle nekopíruj do webového projektu. V priečinku s bundle spusti:
  git clone -b HEAD Rokyta-historia.bundle Rokyta-s-historiou
  cd Rokyta-s-historiou
  git branch -M main
  git remote set-url origin https://github.com/itpcs-no/ROKYTA.git
  git push -u origin main
Posledný príkaz je určený pre prázdny cieľový repozitár. Nepoužívaj force push pri existujúcej histórii.

Export zachytáva commit c176fd4 (zariadenie obytných podlaží podľa pôdorysov).
Zdrojové licenčné poznámky k použitým knižniciam, vozidlám a materiálom zostali zachované v dist/assets.
Export ani push do GitHubu nemení existujúcu publikovanú prehliadku; automatické nasadzovanie treba nastaviť osobitne.

## Zmeny v tejto verzii

- Vonkajší bazén 20 × 4 m pri severnom múre s teleskopickým zasúvacím zastrešením (prepínač v paneli).
- Peší výstup z areálu presunutý do stredu severného múru, v osi budovy, s chodníkom k centrálnej hale.
- Vnútorné wellness v západnom konci prízemia: telocvičňa (bežecký pás, rotoped, činky), sauna, parná kúpeľ, sprchy; dvere na terasu bazéna.
- Fitness na západnom konci prízemia: kardio (bežecký pás, rotoped), posilňovacie stroje, suchá a parná sauna, sprchy; vonkajšia vírivka a ochladzovací bazén zrušené.
- Byt vedľa fitness oddelený, s vlastným vstupom z juhu.
- Pivnica pod garážou: vinotéka a cigar bar (37 m²), vínny sklad (14 m²), WC, schodisko k bytu správcu; chodba od recepcie popri západnej stene predného bloku.
- Byt správcu nad pivnicou s kanceláriou 10 m² pri vchode.
- Tri centrálne vstupy A (sever), B (západ), C (východ) do spoločnej haly.
- Zoznam apartmánov s užívateľskými plochami a rozmermi; kliknutím na mapku sa apartmány zafarbia a zobrazí sa detail.
- Predzáhradky bytov na prízemí (šírka bytu, hĺbka 3,5–5 m).
- Vrstva inštalácií (röntgen): inštalačné šachty umiestnené optimalizáciou dĺžky prípojok, kanalizácia, voda, vetranie; dlhé prípojky nad 6 m označené oranžovo.
- Les okolo areálu podľa leteckých fotografií, realistickejšia postava chodca, viac typov áut (mestské auto, hatchback, sedan, kombi, SUV, MPV).

## Zverejnenie (GitHub Pages)

Vetva `gh-pages` obsahuje obsah priečinka `dist`. V Settings → Pages nastav Source: Deploy from a branch, Branch: `gh-pages`, priečinok `/ (root)`.
Pre vlastnú doménu rokyta.eu nastav DNS (A: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153; AAAA: 2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153, 2606:50c0:8003::153; CNAME www → itpcs-no.github.io) a potom v Settings → Pages zadaj Custom domain `rokyta.eu` a zapni Enforce HTTPS.

Kontrolný snímok bez tieňov a odrazov: `index.html#snapshot=x,y,z,tx,ty,tz` (voliteľne `&ui=idTlačidla`).
